'use client';

import { useState, useEffect, useRef } from 'react';

const DISEASE_LABELS = {
  hr_pos_her2_neg: 'HR+/HER2−',
  tnbc: 'TNBC',
  crc: 'CRC',
  luad: 'LUAD',
};

/**
 * Extract a compact summary from Supabase run detail data for the LLM.
 *
 * Supabase /api/run/[runId] returns:
 *   { run: { disease_context, query, run_id, parsed_query, ... },
 *     steps: [ { step_name, input, output, timestamp }, ... ],
 *     report: { title, summary, full_report, provenance, ... } }
 *
 * The step results live in step.output (JSONB column from tool_calls table).
 */
function summarizeRun(data) {
  if (!data) return null;

  const run = data.run || data;
  const steps = data.steps || [];

  const findStep = (name) =>
    steps.find(
      (s) =>
        s.step_name === name || s.step === name || s.stepName === name
    );

  const getResult = (step) => step?.output || step?.result || {};

  const retrieveResult = getResult(findStep('retrieve'));
  const synthesizeResult = getResult(findStep('synthesize'));
  const predictResult = getResult(findStep('predict'));
  const benchmarkResult = getResult(findStep('benchmark'));
  const interactionsResult = getResult(findStep('interactions'));
  const parseQueryResult = getResult(findStep('parseQuery'));

  const cohort = retrieveResult.cohort || {};
  const evidenceTable = synthesizeResult.evidenceTable || [];
  const predictions = predictResult.predictions || [];
  const benchmarkedLeads = benchmarkResult.benchmarkedLeads || [];

  const parsedQuery = run.parsed_query || parseQueryResult || {};

  return {
    disease: run.disease || run.disease_context || '—',
    subtype:
      run.diseaseSubtype ||
      run.disease_subtype ||
      DISEASE_LABELS[run.disease_context] ||
      '',
    diseaseKey: run.diseaseKey || run.disease_context || '',
    query: run.query || '',
    runId: run.run_id || run.runId || '',
    parsedQuery: {
      therapyClasses: parsedQuery.therapyClasses || [],
      biomarkers: parsedQuery.biomarkers || [],
      intents: parsedQuery.intents || [],
      clinicalSettings: parsedQuery.clinicalSettings || [],
    },
    cohort: {
      study: cohort.studyName || cohort.studyId || '—',
      samples: cohort.sampleCount || 0,
    },
    evidence: evidenceTable.map((row) => ({
      gene: row.gene,
      mutationFrequency: row.mutationFrequency,
      associationScore:
        row.associationScore != null
          ? parseFloat(row.associationScore).toFixed(3)
          : null,
      pathway: row.reactomeTopPathway || null,
      civicLevel: row.civicBestLevel || null,
      civicEvidenceCount: row.civicEvidenceCount || 0,
      drugCount: row.dgidbDrugCount || 0,
      approvedDrugCount: row.dgidbApprovedCount || 0,
    })),
    predictions: predictions.map((p) => ({
      gene: p.condition,
      therapy: p.therapy,
      effect: p.predictedEffect,
      confidence: p.confidence,
      confidenceScore: p.confidenceScore,
      queryBoost: p.queryBoost || 0,
      interactionDelta: p.interactionDelta || 0,
      clinicalEvidenceBoost: p.clinicalEvidenceBoost || 0,
      clinicalEvidenceLevel: p.clinicalEvidenceLevel || null,
      reasoning: p.reasoning || '',
    })),
    leads: benchmarkedLeads.map((l) => ({
      target: l.primaryTarget,
      mechanism: l.mechanismCategory,
      type: (l.leadType || '').replace(/_/g, ' '),
      tier: l.benchmarkScore?.tier || '—',
      composite: l.benchmarkScore?.composite || 0,
      dimensions: l.benchmarkScore?.dimensions || {},
    })),
    interactionRulesApplied:
      interactionsResult.appliedModifiers?.map((m) => m.rule) ||
      interactionsResult.appliedRules ||
      [],
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

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load recent runs on mount
  useEffect(() => {
    async function loadRuns() {
      try {
        const res = await fetch('/api/history?limit=20');
        if (res.ok) {
          const data = await res.json();
          setRecentRuns(data.runs || data || []);
        }
      } catch (err) {
        console.error('Failed to load history:', err);
      } finally {
        setLoadingRuns(false);
      }
    }
    loadRuns();
  }, []);

  async function loadRunData() {
    if (!primaryRunId) return;
    setLoadingData(true);
    setDataError(null);
    setPrimaryRun(null);
    setCompareRun(null);
    setPrimarySummary(null);
    setCompareSummary(null);
    setMessages([]);
    setGroqError(null);

    try {
      // Fetch primary run
      const pRes = await fetch(`/api/run/${primaryRunId}`);
      if (!pRes.ok) throw new Error(`Failed to load run ${primaryRunId}`);
      const pData = await pRes.json();
      setPrimaryRun(pData);
      const pSummary = summarizeRun(pData);
      setPrimarySummary(pSummary);

      // Fetch comparison run if selected
      let cSummary = null;
      if (showCompare && compareRunId && compareRunId !== primaryRunId) {
        const cRes = await fetch(`/api/run/${compareRunId}`);
        if (!cRes.ok) throw new Error(`Failed to load run ${compareRunId}`);
        const cData = await cRes.json();
        setCompareRun(cData);
        cSummary = summarizeRun(cData);
        setCompareSummary(cSummary);
      }

      // Build the auto-interpretation question using actual disease names
      const pLabel = pSummary.subtype || pSummary.disease || 'Primary';
      const cLabel = cSummary
        ? cSummary.subtype || cSummary.disease || 'Comparison'
        : '';

      const autoQuestion = cSummary
        ? `Provide a comprehensive interpretation comparing these two analyses: ${pLabel} vs ${cLabel}. What are the key differences and what do they mean?`
        : `Provide an initial interpretation of these ${pLabel} analysis results. What do the findings mean and what are the most notable results?`;

      // Auto-generate initial interpretation
      await askGroq(pSummary, cSummary, autoQuestion, []);
    } catch (err) {
      setDataError(err.message);
    } finally {
      setLoadingData(false);
    }
  }

  async function askGroq(runSum, compSum, q, history) {
    setInterpreting(true);
    setGroqError(null);

    const userMsg = { role: 'user', content: q };
    const updatedHistory = [...history, userMsg];
    setMessages(updatedHistory);

    try {
      const res = await fetch('/api/interpret', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          runSummary: runSum || primarySummary,
          compareSummary: compSum || compareSummary,
          question: q,
          conversationHistory: history,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.error === 'groq_not_configured') {
          setGroqError(
            'Groq API key not configured. Add GROQ_API_KEY to your .env.local and restart the dev server (Ctrl+C then npm run dev).'
          );
        } else {
          setGroqError(data.error || data.detail || 'Interpretation failed');
        }
        return;
      }

      const assistantMsg = { role: 'assistant', content: data.interpretation };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      setGroqError(err.message);
    } finally {
      setInterpreting(false);
    }
  }

  async function handleAsk() {
    if (!question.trim() || interpreting) return;
    const q = question.trim();
    setQuestion('');
    await askGroq(primarySummary, compareSummary, q, messages);
  }

  function runLabel(run) {
    const ctx =
      DISEASE_LABELS[run.disease_context] || run.disease_context || '—';
    const time = new Date(run.created_at).toLocaleString();
    const q =
      (run.query || '').length > 40
        ? run.query.substring(0, 40) + '…'
        : run.query || '—';
    return `${ctx} — "${q}" — ${time}`;
  }

  const hasData = primarySummary !== null;

  return (
    <main
      style={{
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        backgroundColor: '#111',
        color: '#eee',
        minHeight: '100vh',
        padding: '0',
      }}
    >
      {/* ===== NAV BAR ===== */}
      <nav
        style={{
          display: 'flex',
          gap: '0',
          borderBottom: '1px solid #333',
          backgroundColor: '#1a1a1a',
        }}
      >
        {[
          { href: '/', label: 'Home' },
          { href: '/compare', label: 'Compare' },
          { href: '/interpret', label: 'Interpret' },
          { href: '/methods', label: 'Methods' },
          { href: '/history', label: 'History' },
        ].map((link) => (
          <a
            key={link.href}
            href={link.href}
            style={{
              padding: '12px 20px',
              color: link.href === '/interpret' ? '#4da6ff' : '#aaa',
              textDecoration: 'none',
              fontSize: '14px',
              fontWeight: link.href === '/interpret' ? 'bold' : 'normal',
              borderBottom:
                link.href === '/interpret'
                  ? '2px solid #4da6ff'
                  : '2px solid transparent',
            }}
          >
            {link.label}
          </a>
        ))}
      </nav>

      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '24px' }}>
        {/* ===== HEADER ===== */}
        <h1 style={{ fontSize: '28px', color: '#4da6ff', marginBottom: '4px' }}>
          AI Results Interpreter
        </h1>
        <p style={{ color: '#888', fontSize: '14px', marginBottom: '4px' }}>
          Select a completed agent run (or two for comparison) and get a
          plain-English interpretation of the results powered by Groq LLM. Ask
          follow-up questions to explore what the data means.
        </p>
        <p
          style={{
            color: '#aa8800',
            fontSize: '12px',
            marginBottom: '24px',
            padding: '8px 12px',
            backgroundColor: '#1a1800',
            border: '1px solid #333300',
            borderRadius: '6px',
          }}
        >
          LLM-assisted interpretation — the scientific pipeline remains fully
          deterministic. The LLM only explains results it is given; it does not
          influence predictions or scores. This is not clinical advice.
        </p>

        {/* ===== RUN SELECTION ===== */}
        <div
          style={{
            padding: '20px',
            border: '1px solid #333',
            borderRadius: '8px',
            backgroundColor: '#1a1a1a',
            marginBottom: '24px',
          }}
        >
          <h3 style={{ margin: '0 0 12px', fontSize: '15px', color: '#fff' }}>
            Select Runs to Interpret
          </h3>

          {loadingRuns ? (
            <p style={{ color: '#888', fontSize: '13px' }}>
              Loading recent runs from Supabase...
            </p>
          ) : recentRuns.length === 0 ? (
            <p style={{ color: '#888', fontSize: '13px' }}>
              No runs found. Go to the{' '}
              <a href="/" style={{ color: '#4da6ff' }}>
                Home page
              </a>{' '}
              to run an analysis first.
            </p>
          ) : (
            <>
              {/* Primary Run */}
              <div style={{ marginBottom: '12px' }}>
                <label
                  style={{
                    fontSize: '12px',
                    color: '#888',
                    display: 'block',
                    marginBottom: '4px',
                  }}
                >
                  Primary Run
                </label>
                <select
                  value={primaryRunId}
                  onChange={(e) => setPrimaryRunId(e.target.value)}
                  disabled={loadingData || interpreting}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    fontSize: '13px',
                    borderRadius: '6px',
                    border: '1px solid #444',
                    backgroundColor: '#222',
                    color: '#eee',
                  }}
                >
                  <option value="">— Select a run —</option>
                  {recentRuns.map((run) => (
                    <option
                      key={run.run_id || run.id}
                      value={run.run_id || run.id}
                    >
                      {runLabel(run)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Compare Toggle */}
              <div style={{ marginBottom: '12px' }}>
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    cursor: 'pointer',
                    color: '#aaa',
                    fontSize: '13px',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={showCompare}
                    onChange={(e) => {
                      setShowCompare(e.target.checked);
                      if (!e.target.checked) setCompareRunId('');
                    }}
                    disabled={loadingData || interpreting}
                    style={{ accentColor: '#4da6ff' }}
                  />
                  Compare with a second run
                </label>
              </div>

              {/* Comparison Run */}
              {showCompare && (
                <div style={{ marginBottom: '12px' }}>
                  <label
                    style={{
                      fontSize: '12px',
                      color: '#888',
                      display: 'block',
                      marginBottom: '4px',
                    }}
                  >
                    Comparison Run
                  </label>
                  <select
                    value={compareRunId}
                    onChange={(e) => setCompareRunId(e.target.value)}
                    disabled={loadingData || interpreting}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      fontSize: '13px',
                      borderRadius: '6px',
                      border: '1px solid #444',
                      backgroundColor: '#222',
                      color: '#eee',
                    }}
                  >
                    <option value="">— Select a run to compare —</option>
                    {recentRuns
                      .filter((r) => (r.run_id || r.id) !== primaryRunId)
                      .map((run) => (
                        <option
                          key={run.run_id || run.id}
                          value={run.run_id || run.id}
                        >
                          {runLabel(run)}
                        </option>
                      ))}
                  </select>
                </div>
              )}

              {/* Load Button */}
              <button
                onClick={loadRunData}
                disabled={
                  !primaryRunId ||
                  loadingData ||
                  interpreting ||
                  (showCompare && !compareRunId)
                }
                style={{
                  padding: '10px 24px',
                  fontSize: '14px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor:
                    !primaryRunId || loadingData ? '#333' : '#4da6ff',
                  color: '#fff',
                  cursor:
                    !primaryRunId || loadingData ? 'not-allowed' : 'pointer',
                  fontWeight: 'bold',
                }}
              >
                {loadingData
                  ? 'Loading & Interpreting...'
                  : showCompare
                    ? 'Load & Compare'
                    : 'Load & Interpret'}
              </button>
            </>
          )}

          {dataError && (
            <div
              style={{
                marginTop: '12px',
                padding: '10px',
                backgroundColor: '#331111',
                border: '1px solid #663333',
                borderRadius: '6px',
                color: '#ff6666',
                fontSize: '13px',
              }}
            >
              {dataError}
            </div>
          )}
        </div>

        {/* ===== LOADED DATA SUMMARY ===== */}
        {hasData && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: compareSummary ? '1fr 1fr' : '1fr',
              gap: '16px',
              marginBottom: '24px',
            }}
          >
            {[primarySummary, compareSummary]
              .filter(Boolean)
              .map((sum, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '16px',
                    border: '1px solid #333',
                    borderRadius: '8px',
                    backgroundColor: '#1a1a1a',
                  }}
                >
                  <h4
                    style={{
                      margin: '0 0 8px',
                      fontSize: '14px',
                      color: '#4da6ff',
                    }}
                  >
                    {idx === 0 ? 'Primary' : 'Comparison'}:{' '}
                    {sum.subtype || sum.disease}
                  </h4>
                  <div style={{ fontSize: '12px', color: '#aaa' }}>
                    <div>
                      Study:{' '}
                      <strong style={{ color: '#fff' }}>
                        {sum.cohort.study}
                      </strong>{' '}
                      ({sum.cohort.samples} samples)
                    </div>
                    <div style={{ marginTop: '6px' }}>
                      <strong style={{ color: '#ccc' }}>Biomarkers:</strong>{' '}
                      {sum.evidence.map((e) => e.gene).join(', ') || '—'}
                    </div>
                    <div>
                      <strong style={{ color: '#ccc' }}>Predictions:</strong>{' '}
                      {sum.predictions.length} (
                      {
                        sum.predictions.filter(
                          (p) => p.confidence === 'high'
                        ).length
                      }{' '}
                      high,{' '}
                      {
                        sum.predictions.filter(
                          (p) => p.confidence === 'moderate'
                        ).length
                      }{' '}
                      moderate)
                    </div>
                    <div>
                      <strong style={{ color: '#ccc' }}>Leads:</strong>{' '}
                      {sum.leads.length} (
                      {
                        sum.leads.filter((l) => l.tier.includes('Tier 1'))
                          .length
                      }{' '}
                      Tier 1,{' '}
                      {
                        sum.leads.filter((l) => l.tier.includes('Tier 2'))
                          .length
                      }{' '}
                      Tier 2)
                    </div>
                    <div
                      style={{
                        marginTop: '4px',
                        fontSize: '10px',
                        color: '#555',
                      }}
                    >
                      Run: {sum.runId}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}

        {/* ===== CHAT / INTERPRETATION ===== */}
        {hasData && (
          <div
            style={{
              border: '1px solid #333',
              borderRadius: '8px',
              backgroundColor: '#1a1a1a',
              overflow: 'hidden',
            }}
          >
            {/* Chat Header */}
            <div
              style={{
                padding: '12px 16px',
                backgroundColor: '#222',
                borderBottom: '1px solid #333',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <h3 style={{ margin: 0, fontSize: '15px', color: '#fff' }}>
                Interpretation Chat
              </h3>
              <span style={{ fontSize: '11px', color: '#555' }}>
                Powered by Groq (llama-3.3-70b-versatile)
              </span>
            </div>

            {/* Chat Messages */}
            <div
              style={{
                padding: '16px',
                maxHeight: '500px',
                overflowY: 'auto',
                minHeight: '200px',
              }}
            >
              {groqError && (
                <div
                  style={{
                    padding: '12px',
                    backgroundColor: '#331111',
                    border: '1px solid #663333',
                    borderRadius: '6px',
                    color: '#ff6666',
                    fontSize: '13px',
                    marginBottom: '12px',
                  }}
                >
                  <strong>LLM Error:</strong> {groqError}
                </div>
              )}

              {messages.map((msg, i) => (
                <div
                  key={i}
                  style={{
                    marginBottom: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems:
                      msg.role === 'user' ? 'flex-end' : 'flex-start',
                  }}
                >
                  <span
                    style={{
                      fontSize: '10px',
                      color: msg.role === 'user' ? '#4da6ff' : '#66cc66',
                      marginBottom: '4px',
                      fontWeight: 'bold',
                    }}
                  >
                    {msg.role === 'user' ? 'You' : 'AI Interpreter'}
                  </span>
                  <div
                    style={{
                      padding: '10px 14px',
                      borderRadius: '8px',
                      backgroundColor:
                        msg.role === 'user' ? '#1a2a3a' : '#222',
                      border: `1px solid ${msg.role === 'user' ? '#2a3a5a' : '#333'}`,
                      maxWidth: msg.role === 'user' ? '80%' : '100%',
                      fontSize: '13px',
                      lineHeight: '1.6',
                      color: '#ddd',
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}

              {interpreting && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '12px',
                    color: '#888',
                    fontSize: '13px',
                  }}
                >
                  <div
                    style={{
                      width: '16px',
                      height: '16px',
                      border: '2px solid #333',
                      borderTop: '2px solid #4da6ff',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite',
                    }}
                  />
                  Interpreting results...
                </div>
              )}

              <div ref={chatEndRef} />
            </div>

            {/* Question Input */}
            <div
              style={{
                padding: '12px 16px',
                borderTop: '1px solid #333',
                backgroundColor: '#1e1e1e',
                display: 'flex',
                gap: '10px',
              }}
            >
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAsk();
                }}
                placeholder="Ask a follow-up question about the results..."
                disabled={interpreting}
                style={{
                  flex: 1,
                  padding: '10px 14px',
                  fontSize: '14px',
                  borderRadius: '6px',
                  border: '1px solid #444',
                  backgroundColor: '#222',
                  color: '#eee',
                  outline: 'none',
                }}
              />
              <button
                onClick={handleAsk}
                disabled={interpreting || !question.trim()}
                style={{
                  padding: '10px 20px',
                  fontSize: '14px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor:
                    interpreting || !question.trim() ? '#333' : '#4da6ff',
                  color: '#fff',
                  cursor:
                    interpreting || !question.trim()
                      ? 'not-allowed'
                      : 'pointer',
                  fontWeight: 'bold',
                }}
              >
                Ask
              </button>
            </div>

            {/* Suggested Questions */}
            {messages.length <= 2 && hasData && !interpreting && (
              <div
                style={{
                  padding: '8px 16px 12px',
                  borderTop: '1px solid #2a2a2a',
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '6px',
                }}
              >
                <span
                  style={{
                    fontSize: '11px',
                    color: '#555',
                    lineHeight: '26px',
                  }}
                >
                  Try:
                </span>
                {getSuggestedQuestions(primarySummary, compareSummary).map(
                  (q, i) => (
                    <button
                      key={i}
                      onClick={() => setQuestion(q)}
                      style={{
                        padding: '3px 10px',
                        fontSize: '11px',
                        borderRadius: '14px',
                        border: '1px solid #444',
                        backgroundColor: '#222',
                        color: '#aaa',
                        cursor: 'pointer',
                      }}
                    >
                      {q}
                    </button>
                  )
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ===== SITE FOOTER ===== */}
      <footer
        style={{
          marginTop: '40px',
          padding: '20px',
          borderTop: '1px solid #333',
          backgroundColor: '#1a1a1a',
          textAlign: 'center',
          fontSize: '12px',
          color: '#555',
        }}
      >
        <p style={{ margin: '0 0 4px' }}>
          <strong style={{ color: '#888' }}>
            Agentic Therapy Response Predictor
          </strong>{' '}
          — Ty Parker — INFO 603/404 Biological Data Management
        </p>
        <p style={{ margin: '0 0 4px' }}>
          Data: cBioPortal · OpenTargets · CIViC · DGIdb · Reactome ·
          Interpretation: Groq LLM
        </p>
        <p style={{ margin: 0 }}>
          <a
            href="https://github.com/ParkerTy/AgenticTherapyResponsePredictor"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: '#4da6ff', textDecoration: 'none' }}
          >
            GitHub Repository
          </a>
        </p>
      </footer>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </main>
  );
}

function getSuggestedQuestions(primary, compare) {
  const questions = [];

  if (compare) {
    const pName = primary.subtype || primary.disease;
    const cName = compare.subtype || compare.disease;
    questions.push(
      `Why are the predictions different between ${pName} and ${cName}?`
    );
    questions.push(
      'Which disease context has stronger therapeutic leads and why?'
    );
    questions.push(
      'Are there any shared therapeutic opportunities across both contexts?'
    );
  } else {
    if (primary.leads.length > 0) {
      const topLead = primary.leads.reduce((a, b) =>
        a.composite > b.composite ? a : b
      );
      questions.push(
        `Why is ${topLead.target} the strongest lead (${topLead.tier})?`
      );
    }
    if (primary.predictions.length > 0) {
      questions.push(
        'What do the confidence scores mean for treatment decisions?'
      );
    }
    if (primary.evidence.some((e) => e.civicLevel)) {
      questions.push(
        'How does the CIViC clinical evidence affect these predictions?'
      );
    }
    if (questions.length < 3) {
      questions.push('What are the key limitations of this analysis?');
    }
  }

  return questions.slice(0, 3);
}