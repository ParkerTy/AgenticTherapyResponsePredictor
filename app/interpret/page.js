'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

const DISEASE_LABELS = { hr_pos_her2_neg: 'HR+/HER2−', tnbc: 'TNBC', crc: 'CRC', luad: 'LUAD' };

function summarizeRun(data) {
  if (!data) return null;
  const run = data.run || data;
  const steps = data.steps || [];
  const findStep = (name) => steps.find(s => s.step_name === name || s.step === name || s.stepName === name);
  const getResult = (step) => step?.output || step?.result || {};
  const retrieveResult = getResult(findStep('retrieve'));
  const synthesizeResult = getResult(findStep('synthesize'));
  const predictResult = getResult(findStep('predict'));
  const benchmarkResult = getResult(findStep('benchmark'));
  const interactionsResult = getResult(findStep('interactions'));
  const parseQueryResult = getResult(findStep('parseQuery'));
  const parsedQuery = run.parsed_query || parseQueryResult || {};
  return {
    disease: run.disease || run.disease_context || '—',
    subtype: run.diseaseSubtype || run.disease_subtype || DISEASE_LABELS[run.disease_context] || '',
    diseaseKey: run.diseaseKey || run.disease_context || '',
    query: run.query || '', runId: run.run_id || run.runId || '',
    parsedQuery: { therapyClasses: parsedQuery.therapyClasses || [], biomarkers: parsedQuery.biomarkers || [], intents: parsedQuery.intents || [], clinicalSettings: parsedQuery.clinicalSettings || [] },
    cohort: { study: retrieveResult.cohort?.studyName || retrieveResult.cohort?.studyId || '—', samples: retrieveResult.cohort?.sampleCount || 0 },
    evidence: (synthesizeResult.evidenceTable || []).map(row => ({ gene: row.gene, mutationFrequency: row.mutationFrequency, associationScore: row.associationScore != null ? parseFloat(row.associationScore).toFixed(3) : null, pathway: row.reactomeTopPathway || null, civicLevel: row.civicBestLevel || null, civicEvidenceCount: row.civicEvidenceCount || 0, drugCount: row.dgidbDrugCount || 0, approvedDrugCount: row.dgidbApprovedCount || 0 })),
    predictions: (predictResult.predictions || []).map(p => ({ gene: p.condition, therapy: p.therapy, effect: p.predictedEffect, confidence: p.confidence, confidenceScore: p.confidenceScore, queryBoost: p.queryBoost || 0, interactionDelta: p.interactionDelta || 0, clinicalEvidenceBoost: p.clinicalEvidenceBoost || 0, clinicalEvidenceLevel: p.clinicalEvidenceLevel || null, reasoning: p.reasoning || '' })),
    leads: (benchmarkResult.benchmarkedLeads || []).map(l => ({ target: l.primaryTarget, mechanism: l.mechanismCategory, type: (l.leadType || '').replace(/_/g, ' '), tier: l.benchmarkScore?.tier || '—', composite: l.benchmarkScore?.composite || 0, dimensions: l.benchmarkScore?.dimensions || {} })),
    interactionRulesApplied: interactionsResult.appliedModifiers?.map(m => m.rule) || interactionsResult.appliedRules || [],
  };
}

export default function InterpretPage() {
  const [recentRuns, setRecentRuns] = useState([]);
  const [loadingRuns, setLoadingRuns] = useState(true);
  const [primaryRunId, setPrimaryRunId] = useState('');
  const [compareRunId, setCompareRunId] = useState('');
  const [showCompare, setShowCompare] = useState(false);
  const [primaryRun, setPrimaryRun] = useState(null);
  const [compareRun, setCompareRun] = useState(null);
  const [primarySummary, setPrimarySummary] = useState(null);
  const [compareSummary, setCompareSummary] = useState(null);
  const [loadingData, setLoadingData] = useState(false);
  const [dataError, setDataError] = useState(null);
  const [messages, setMessages] = useState([]);
  const [question, setQuestion] = useState('');
  const [interpreting, setInterpreting] = useState(false);
  const [groqError, setGroqError] = useState(null);
  const chatEndRef = useRef(null);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  useEffect(() => {
    async function loadRuns() {
      try { const res = await fetch('/api/history?limit=20'); if (res.ok) { const data = await res.json(); setRecentRuns(data.runs || data || []); } }
      catch (err) { console.error('Failed to load history:', err); }
      finally { setLoadingRuns(false); }
    }
    loadRuns();
  }, []);

  async function loadRunData() {
    if (!primaryRunId) return;
    setLoadingData(true); setDataError(null); setPrimaryRun(null); setCompareRun(null); setPrimarySummary(null); setCompareSummary(null); setMessages([]); setGroqError(null);
    try {
      const pRes = await fetch(`/api/run/${primaryRunId}`); if (!pRes.ok) throw new Error(`Failed to load run`);
      const pData = await pRes.json(); setPrimaryRun(pData); const pSummary = summarizeRun(pData); setPrimarySummary(pSummary);
      let cSummary = null;
      if (showCompare && compareRunId && compareRunId !== primaryRunId) {
        const cRes = await fetch(`/api/run/${compareRunId}`); if (!cRes.ok) throw new Error(`Failed to load comparison run`);
        const cData = await cRes.json(); setCompareRun(cData); cSummary = summarizeRun(cData); setCompareSummary(cSummary);
      }
      const pLabel = pSummary.subtype || pSummary.disease; const cLabel = cSummary ? (cSummary.subtype || cSummary.disease) : '';
      const autoQ = cSummary ? `Provide a comprehensive interpretation comparing these two analyses: ${pLabel} vs ${cLabel}. What are the key differences and what do they mean?` : `Provide an initial interpretation of these ${pLabel} analysis results. What do the findings mean and what are the most notable results?`;
      await askGroq(pSummary, cSummary, autoQ, []);
    } catch (err) { setDataError(err.message); } finally { setLoadingData(false); }
  }

  async function askGroq(runSum, compSum, q, history) {
    setInterpreting(true); setGroqError(null);
    const userMsg = { role: 'user', content: q }; const updatedHistory = [...history, userMsg]; setMessages(updatedHistory);
    try {
      const res = await fetch('/api/interpret', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ runSummary: runSum || primarySummary, compareSummary: compSum || compareSummary, question: q, conversationHistory: history }) });
      const data = await res.json();
      if (!res.ok) { setGroqError(data.error === 'groq_not_configured' ? 'Groq API key not configured. Add GROQ_API_KEY to .env.local and restart.' : (data.error || 'Failed')); return; }
      setMessages(prev => [...prev, { role: 'assistant', content: data.interpretation }]);
    } catch (err) { setGroqError(err.message); } finally { setInterpreting(false); }
  }

  async function handleAsk() { if (!question.trim() || interpreting) return; const q = question.trim(); setQuestion(''); await askGroq(primarySummary, compareSummary, q, messages); }

  function runLabel(run) {
    const ctx = DISEASE_LABELS[run.disease_context] || run.disease_context || '—';
    const time = new Date(run.created_at).toLocaleString();
    const q = (run.query || '').length > 40 ? run.query.substring(0, 40) + '…' : run.query || '—';
    return `${ctx} — "${q}" — ${time}`;
  }

  const hasData = primarySummary !== null;

  return (
    <main style={{ fontFamily: 'var(--font-body)', backgroundColor: 'var(--bg-deep)', color: 'var(--text-primary)', minHeight: '100vh' }}>

      <nav className="site-nav">
        <Link href="/" className="nav-logo"><div className="nav-logo-dot" /><span className="nav-logo-text">ATRP</span></Link>
        <div className="nav-links">
          <Link href="/" className="nav-link">Home</Link>
          <Link href="/about" className="nav-link">About</Link>
          <Link href="/compare" className="nav-link">Compare</Link>
          <Link href="/interpret" className="nav-link nav-active">Interpret</Link>
          <Link href="/methods" className="nav-link">Methods</Link>
          <Link href="/history" className="nav-link">History</Link>
        </div>
      </nav>

      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <div style={{ width: '32px', height: '2px', background: 'var(--accent-cyan)', borderRadius: '1px' }} />
          <span className="label-upper" style={{ color: 'var(--accent-cyan)' }}>LLM-Powered Analysis</span>
        </div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '28px', fontWeight: 700, margin: '0 0 6px', color: 'var(--text-primary)' }}>AI Results Interpreter</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '12px', maxWidth: '600px' }}>
          Select a completed agent run and get a plain-English interpretation powered by Groq LLM. Ask follow-up questions to explore what the data means.
        </p>

        {/* Disclaimer */}
        <div style={{ padding: '10px 14px', backgroundColor: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: '8px', marginBottom: '24px', fontSize: '12px', color: 'var(--accent-amber)' }}>
          LLM-assisted interpretation — the scientific pipeline remains fully deterministic. The LLM only explains results it is given. This is not clinical advice.
        </div>

        {/* Run Selection */}
        <div className="card" style={{ marginBottom: '24px' }}>
          <h2>Select Runs to Interpret</h2>
          {loadingRuns ? <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Loading from Supabase...</p> :
          recentRuns.length === 0 ? <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>No runs found. <Link href="/" style={{ color: 'var(--accent-cyan)' }}>Run an analysis first</Link>.</p> : (
            <>
              <div style={{ marginBottom: '12px' }}>
                <label className="label-upper" style={{ display: 'block', marginBottom: '4px' }}>Primary Run</label>
                <select value={primaryRunId} onChange={e => setPrimaryRunId(e.target.value)} disabled={loadingData || interpreting}
                  style={{ width: '100%', padding: '10px 12px', fontSize: '13px', borderRadius: '8px', border: '1px solid var(--border-bright)', backgroundColor: 'var(--bg-elevated)', color: 'var(--text-primary)', fontFamily: 'var(--font-body)' }}>
                  <option value="">— Select a run —</option>
                  {recentRuns.map(run => <option key={run.run_id || run.id} value={run.run_id || run.id}>{runLabel(run)}</option>)}
                </select>
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: '13px' }}>
                  <input type="checkbox" checked={showCompare} onChange={e => { setShowCompare(e.target.checked); if (!e.target.checked) setCompareRunId(''); }} disabled={loadingData || interpreting} style={{ accentColor: 'var(--accent-cyan)' }} />
                  Compare with a second run
                </label>
              </div>
              {showCompare && (
                <div style={{ marginBottom: '12px' }}>
                  <label className="label-upper" style={{ display: 'block', marginBottom: '4px' }}>Comparison Run</label>
                  <select value={compareRunId} onChange={e => setCompareRunId(e.target.value)} disabled={loadingData || interpreting}
                    style={{ width: '100%', padding: '10px 12px', fontSize: '13px', borderRadius: '8px', border: '1px solid var(--border-bright)', backgroundColor: 'var(--bg-elevated)', color: 'var(--text-primary)', fontFamily: 'var(--font-body)' }}>
                    <option value="">— Select a run —</option>
                    {recentRuns.filter(r => (r.run_id || r.id) !== primaryRunId).map(run => <option key={run.run_id || run.id} value={run.run_id || run.id}>{runLabel(run)}</option>)}
                  </select>
                </div>
              )}
              <button onClick={loadRunData} disabled={!primaryRunId || loadingData || interpreting || (showCompare && !compareRunId)}
                style={{ padding: '10px 24px', fontSize: '14px', borderRadius: '8px', border: 'none', fontFamily: 'var(--font-display)', fontWeight: 600, letterSpacing: '0.5px', backgroundColor: (!primaryRunId || loadingData) ? 'var(--bg-elevated)' : 'var(--accent-cyan)', color: (!primaryRunId || loadingData) ? 'var(--text-muted)' : '#000', cursor: (!primaryRunId || loadingData) ? 'not-allowed' : 'pointer' }}>
                {loadingData ? 'Loading & Interpreting...' : showCompare ? 'Load & Compare' : 'Load & Interpret'}
              </button>
            </>
          )}
          {dataError && <div style={{ marginTop: '12px', padding: '10px', backgroundColor: 'rgba(244,63,94,0.06)', border: '1px solid rgba(244,63,94,0.2)', borderRadius: '8px', color: 'var(--accent-rose)', fontSize: '13px' }}>{dataError}</div>}
        </div>

        {/* Data Summary */}
        {hasData && (
          <div style={{ display: 'grid', gridTemplateColumns: compareSummary ? '1fr 1fr' : '1fr', gap: '16px', marginBottom: '24px' }}>
            {[primarySummary, compareSummary].filter(Boolean).map((sum, idx) => (
              <div key={idx} className="card">
                <h3 style={{ color: 'var(--accent-cyan)' }}>{idx === 0 ? 'Primary' : 'Comparison'}: {sum.subtype || sum.disease}</h3>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  <div>Study: <strong style={{ color: 'var(--text-primary)' }}>{sum.cohort.study}</strong> ({sum.cohort.samples} samples)</div>
                  <div style={{ marginTop: '4px' }}><strong style={{ color: 'var(--text-secondary)' }}>Biomarkers:</strong> <span style={{ fontFamily: 'var(--font-display)' }}>{sum.evidence.map(e => e.gene).join(', ') || '—'}</span></div>
                  <div><strong>Predictions:</strong> {sum.predictions.length} ({sum.predictions.filter(p => p.confidence === 'high').length} high, {sum.predictions.filter(p => p.confidence === 'moderate').length} moderate)</div>
                  <div><strong>Leads:</strong> {sum.leads.length} ({sum.leads.filter(l => l.tier.includes('Tier 1')).length} Tier 1, {sum.leads.filter(l => l.tier.includes('Tier 2')).length} Tier 2)</div>
                  <div style={{ marginTop: '4px', fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-display)' }}>Run: {sum.runId}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Chat */}
        {hasData && (
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '14px 18px', backgroundColor: 'var(--bg-elevated)', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '14px' }}>Interpretation Chat</h3>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-display)' }}>Groq · llama-3.3-70b-versatile</span>
            </div>

            <div style={{ padding: '18px', maxHeight: '500px', overflowY: 'auto', minHeight: '200px' }}>
              {groqError && <div style={{ padding: '12px', backgroundColor: 'rgba(244,63,94,0.06)', border: '1px solid rgba(244,63,94,0.2)', borderRadius: '8px', color: 'var(--accent-rose)', fontSize: '13px', marginBottom: '12px' }}><strong>LLM Error:</strong> {groqError}</div>}
              {messages.map((msg, i) => (
                <div key={i} style={{ marginBottom: '16px', display: 'flex', flexDirection: 'column', alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                  <span style={{ fontSize: '10px', color: msg.role === 'user' ? 'var(--accent-cyan)' : 'var(--accent-green)', marginBottom: '4px', fontWeight: 600, fontFamily: 'var(--font-display)', letterSpacing: '0.5px' }}>
                    {msg.role === 'user' ? 'YOU' : 'AI INTERPRETER'}
                  </span>
                  <div style={{ padding: '12px 16px', borderRadius: '10px', backgroundColor: msg.role === 'user' ? 'rgba(59,130,246,0.08)' : 'var(--bg-elevated)', border: `1px solid ${msg.role === 'user' ? 'rgba(59,130,246,0.2)' : 'var(--border)'}`, maxWidth: msg.role === 'user' ? '85%' : '100%', fontSize: '13px', lineHeight: 1.7, color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' }}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {interpreting && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', color: 'var(--text-muted)', fontSize: '12px', fontFamily: 'var(--font-display)' }}>
                  <div style={{ width: '14px', height: '14px', border: '2px solid var(--border-bright)', borderTop: '2px solid var(--accent-cyan)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                  Interpreting...
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <div style={{ padding: '14px 18px', borderTop: '1px solid var(--border)', backgroundColor: 'var(--bg-surface)', display: 'flex', gap: '10px' }}>
              <input type="text" value={question} onChange={e => setQuestion(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') handleAsk(); }} placeholder="Ask about the results..." disabled={interpreting}
                style={{ flex: 1, padding: '10px 14px', fontSize: '14px', borderRadius: '8px', border: '1px solid var(--border-bright)', backgroundColor: 'var(--bg-elevated)', color: 'var(--text-primary)', outline: 'none', fontFamily: 'var(--font-body)' }}
                onFocus={e => { e.target.style.borderColor = 'var(--accent-cyan)'; e.target.style.boxShadow = '0 0 0 3px var(--glow-cyan)'; }}
                onBlur={e => { e.target.style.borderColor = 'var(--border-bright)'; e.target.style.boxShadow = 'none'; }}
              />
              <button onClick={handleAsk} disabled={interpreting || !question.trim()}
                style={{ padding: '10px 20px', fontSize: '14px', borderRadius: '8px', border: 'none', fontFamily: 'var(--font-display)', fontWeight: 600, backgroundColor: (interpreting || !question.trim()) ? 'var(--bg-elevated)' : 'var(--accent-cyan)', color: (interpreting || !question.trim()) ? 'var(--text-muted)' : '#000', cursor: (interpreting || !question.trim()) ? 'not-allowed' : 'pointer' }}>
                Ask
              </button>
            </div>

            {messages.length <= 2 && hasData && !interpreting && (
              <div style={{ padding: '8px 18px 14px', borderTop: '1px solid var(--border)', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)', lineHeight: '26px', fontFamily: 'var(--font-display)' }}>Try:</span>
                {getSuggestedQuestions(primarySummary, compareSummary).map((q, i) => (
                  <button key={i} onClick={() => setQuestion(q)}
                    style={{ padding: '3px 10px', fontSize: '11px', borderRadius: '14px', border: '1px solid var(--border)', backgroundColor: 'var(--bg-elevated)', color: 'var(--text-secondary)', cursor: 'pointer', fontFamily: 'var(--font-body)', transition: 'border-color 0.2s' }}>
                    {q}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <footer className="site-footer">
        <p style={{ fontFamily: 'var(--font-display)' }}>Ty Parker · INFO 603/404 Biological Data Management · Prof. Jake Y. Chen</p>
        <p>Powered by cBioPortal · OpenTargets · CIViC · DGIdb · Reactome · Groq LLM</p>
        <p><a href="https://github.com/ParkerTy/AgenticTherapyResponsePredictor" target="_blank" rel="noopener noreferrer">GitHub Repository</a></p>
      </footer>
    </main>
  );
}

function getSuggestedQuestions(primary, compare) {
  const questions = [];
  if (compare) {
    questions.push(`Why are the predictions different between ${primary.subtype || primary.disease} and ${compare.subtype || compare.disease}?`);
    questions.push('Which disease context has stronger therapeutic leads and why?');
    questions.push('Are there any shared therapeutic opportunities across both contexts?');
  } else {
    if (primary.leads.length > 0) { const top = primary.leads.reduce((a, b) => a.composite > b.composite ? a : b); questions.push(`Why is ${top.target} the strongest lead (${top.tier})?`); }
    if (primary.predictions.length > 0) questions.push('What do the confidence scores mean for treatment decisions?');
    if (primary.evidence.some(e => e.civicLevel)) questions.push('How does the CIViC clinical evidence affect these predictions?');
    if (questions.length < 3) questions.push('What are the key limitations of this analysis?');
  }
  return questions.slice(0, 3);
}