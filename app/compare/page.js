'use client';

import { useState } from 'react';
import Link from 'next/link';

const DISEASE_OPTIONS = [
  { key: 'hr_pos_her2_neg', label: 'Breast Cancer (HR+/HER2−)' },
  { key: 'tnbc', label: 'Triple-Negative Breast Cancer' },
  { key: 'crc', label: 'Colorectal Cancer (CRC)' },
  { key: 'luad', label: 'Lung Adenocarcinoma (LUAD)' },
];

const COMPARE_EXAMPLES = [
  'Predict therapy response and benchmark leads',
  'targeted therapy resistance mutations',
  'immunotherapy sensitivity biomarkers',
  'CDK4/6 inhibitor resistance RB1',
];

function extractFromSteps(res) {
  if (!res?.steps) return {};
  const find = (name) => res.steps.find(s => s.step === name);
  const retrieveStep = find('retrieve');
  const synthesizeStep = find('synthesize');
  const predictStep = find('predict');
  const benchmarkStep = find('benchmark');
  return {
    cohort: retrieveStep?.result?.cohort || {},
    evidenceTable: synthesizeStep?.result?.evidenceTable || [],
    predictions: predictStep?.result?.predictions || [],
    leads: benchmarkStep?.result?.benchmarkedLeads || [],
  };
}

export default function ComparePage() {
  const [selected, setSelected] = useState(['hr_pos_her2_neg', 'tnbc', 'crc', 'luad']);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({});
  const [loading, setLoading] = useState({});
  const [error, setError] = useState({});
  const [expandedDrugs, setExpandedDrugs] = useState({});

  const allSelected = selected.length === DISEASE_OPTIONS.length;
  function toggleSelectAll() { setSelected(allSelected ? [] : DISEASE_OPTIONS.map(d => d.key)); }
  function toggleDisease(key) { setSelected(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]); }

  async function runAll() {
    if (!query.trim() || selected.length === 0) return;
    const newLoading = {}, newErrors = {}, newResults = { ...results };
    selected.forEach(key => { newLoading[key] = true; newErrors[key] = null; delete newResults[key]; });
    setLoading(newLoading); setError(newErrors); setResults(newResults);

    await Promise.all(selected.map(async (diseaseContext) => {
      try {
        const res = await fetch('/api/agent', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ diseaseContext, query: query.trim() }) });
        const data = await res.json();
        if (!res.ok) {
          if (data.error === 'unrecognized_query') { const exList = (data.examples || []).slice(0, 3).join(' | '); throw new Error(`Query not recognized. Try: ${exList}`); }
          throw new Error(data.error || data.message || `HTTP ${res.status}`);
        }
        setResults(prev => ({ ...prev, [diseaseContext]: data }));
        setError(prev => ({ ...prev, [diseaseContext]: null }));
      } catch (err) { setError(prev => ({ ...prev, [diseaseContext]: err.message })); }
      finally { setLoading(prev => ({ ...prev, [diseaseContext]: false })); }
    }));
  }

  function exportAll() {
    const exportData = { query, timestamp: new Date().toISOString(), contexts: selected.map(key => ({ diseaseContext: key, label: DISEASE_OPTIONS.find(d => d.key === key)?.label, result: results[key] || null, error: error[key] || null })) };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `compare_${Date.now()}.json`; a.click(); URL.revokeObjectURL(url);
  }

  function toggleDrugExpand(contextKey, gene) { const id = `${contextKey}_${gene}`; setExpandedDrugs(prev => ({ ...prev, [id]: !prev[id] })); }

  const hasAnyResults = Object.keys(results).length > 0;
  const anyLoading = Object.values(loading).some(Boolean);

  return (
    <main style={{ fontFamily: 'var(--font-body)', backgroundColor: 'var(--bg-deep)', color: 'var(--text-primary)', minHeight: '100vh' }}>

      {/* Nav */}
      <nav className="site-nav">
        <Link href="/" className="nav-logo"><div className="nav-logo-dot" /><span className="nav-logo-text">ATRP</span></Link>
        <div className="nav-links">
          <Link href="/" className="nav-link">Home</Link>
          <Link href="/about" className="nav-link">About</Link>
          <Link href="/compare" className="nav-link nav-active">Compare</Link>
          <Link href="/interpret" className="nav-link">Interpret</Link>
          <Link href="/methods" className="nav-link">Methods</Link>
          <Link href="/history" className="nav-link">History</Link>
        </div>
      </nav>

      <div style={{ maxWidth: '1600px', margin: '0 auto', padding: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <div style={{ width: '32px', height: '2px', background: 'var(--accent-cyan)', borderRadius: '1px' }} />
          <span className="label-upper" style={{ color: 'var(--accent-cyan)' }}>Cross-Disease Analysis</span>
        </div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '28px', fontWeight: 700, margin: '0 0 6px', color: 'var(--text-primary)' }}>Compare Disease Contexts</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '24px', maxWidth: '700px' }}>
          Run the same query across multiple disease contexts to see how the agentic pipeline produces different predictions, evidence, and therapeutic leads.
        </p>

        {/* Controls */}
        <div className="card" style={{ marginBottom: '24px' }}>
          <div style={{ marginBottom: '16px' }}>
            <label className="label-upper" style={{ display: 'block', marginBottom: '8px' }}>Disease Contexts</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', color: 'var(--accent-cyan)', fontSize: '14px', fontWeight: 'bold', fontFamily: 'var(--font-display)' }}>
                <input type="checkbox" checked={allSelected} onChange={toggleSelectAll} style={{ accentColor: 'var(--accent-cyan)' }} /> Select All
              </label>
              <span style={{ color: 'var(--border-bright)' }}>|</span>
              {DISEASE_OPTIONS.map(d => (
                <label key={d.key} style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: '13px' }}>
                  <input type="checkbox" checked={selected.includes(d.key)} onChange={() => toggleDisease(d.key)} disabled={anyLoading} style={{ accentColor: 'var(--accent-cyan)' }} />
                  {d.label}
                </label>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label className="label-upper" style={{ display: 'block', marginBottom: '6px' }}>Query (shared across all)</label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <input type="text" value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') runAll(); }} placeholder="e.g. Predict therapy response and benchmark leads" disabled={anyLoading}
                style={{ flex: 1, padding: '10px 14px', fontSize: '14px', borderRadius: '8px', border: '1px solid var(--border-bright)', backgroundColor: 'var(--bg-elevated)', color: 'var(--text-primary)', outline: 'none', fontFamily: 'var(--font-body)' }}
                onFocus={e => { e.target.style.borderColor = 'var(--accent-cyan)'; e.target.style.boxShadow = '0 0 0 3px var(--glow-cyan)'; }}
                onBlur={e => { e.target.style.borderColor = 'var(--border-bright)'; e.target.style.boxShadow = 'none'; }}
              />
              <button onClick={runAll} disabled={anyLoading || selected.length === 0 || !query.trim()}
                style={{ padding: '10px 24px', fontSize: '14px', borderRadius: '8px', border: 'none', fontFamily: 'var(--font-display)', fontWeight: 600, letterSpacing: '0.5px', backgroundColor: (anyLoading || !query.trim()) ? 'var(--bg-elevated)' : 'var(--accent-cyan)', color: (anyLoading || !query.trim()) ? 'var(--text-muted)' : '#000', cursor: (anyLoading || !query.trim()) ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap' }}>
                {anyLoading ? 'Running...' : `Run All (${selected.length})`}
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-display)' }}>Examples:</span>
            {COMPARE_EXAMPLES.map((ex, i) => (
              <button key={i} onClick={() => setQuery(ex)} disabled={anyLoading}
                style={{ padding: '4px 10px', fontSize: '11px', borderRadius: '14px', border: '1px solid var(--border)', backgroundColor: 'var(--bg-elevated)', color: 'var(--text-secondary)', cursor: anyLoading ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-body)', transition: 'border-color 0.2s' }}>
                {ex}
              </button>
            ))}
          </div>
        </div>

        {/* Export */}
        {hasAnyResults && (
          <div style={{ marginBottom: '20px', textAlign: 'right' }}>
            <button onClick={exportAll}
              style={{ padding: '8px 16px', fontSize: '12px', borderRadius: '6px', border: '1px solid var(--accent-cyan)', backgroundColor: 'transparent', color: 'var(--accent-cyan)', cursor: 'pointer', fontFamily: 'var(--font-display)', fontWeight: 500, letterSpacing: '0.3px' }}>
              Export All Results (JSON)
            </button>
          </div>
        )}

        {/* Results Grid */}
        {(hasAnyResults || anyLoading || Object.values(error).some(Boolean)) && (
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${selected.length}, 1fr)`, gap: '16px', alignItems: 'start' }}>
            {selected.map(key => {
              const opt = DISEASE_OPTIONS.find(d => d.key === key);
              const res = results[key]; const isLoading = loading[key]; const err = error[key];
              const data = res ? extractFromSteps(res) : {};
              return (
                <div key={key} className="card" style={{ padding: 0, overflow: 'hidden' }}>
                  <div style={{ padding: '12px 16px', backgroundColor: 'var(--bg-elevated)', borderBottom: '1px solid var(--border)' }}>
                    <h3 style={{ margin: 0, fontSize: '14px', color: 'var(--accent-cyan)', fontFamily: 'var(--font-display)', fontWeight: 600 }}>{opt.label}</h3>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-display)' }}>{key}</span>
                  </div>
                  <div style={{ padding: '14px 16px' }}>
                    {isLoading && (
                      <div style={{ textAlign: 'center', padding: '40px 0' }}>
                        <div style={{ width: '28px', height: '28px', border: '2px solid var(--border-bright)', borderTop: '2px solid var(--accent-cyan)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
                        <p style={{ color: 'var(--text-muted)', fontSize: '12px', fontFamily: 'var(--font-display)' }}>Running pipeline...</p>
                      </div>
                    )}
                    {err && !isLoading && (
                      <div style={{ padding: '12px', backgroundColor: 'rgba(244,63,94,0.06)', border: '1px solid rgba(244,63,94,0.2)', borderRadius: '8px', color: 'var(--accent-rose)', fontSize: '12px' }}>
                        <strong>Error:</strong> {err}
                      </div>
                    )}
                    {res && !isLoading && (
                      <div>
                        {data.cohort && (
                          <div style={{ marginBottom: '14px' }}>
                            <h4 style={{ fontSize: '11px', color: 'var(--accent-cyan)', marginBottom: '4px', fontFamily: 'var(--font-display)', fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase' }}>Cohort</h4>
                            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                              <div>Study: <strong style={{ color: 'var(--text-primary)' }}>{data.cohort.studyName || data.cohort.studyId || '—'}</strong></div>
                              <div>Samples: <strong style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>{data.cohort.sampleCount ?? '—'}</strong></div>
                            </div>
                          </div>
                        )}
                        {data.evidenceTable.length > 0 && (
                          <div style={{ marginBottom: '14px' }}>
                            <h4 style={{ fontSize: '11px', color: 'var(--accent-cyan)', marginBottom: '4px', fontFamily: 'var(--font-display)', fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase' }}>Evidence</h4>
                            <div style={{ overflowX: 'auto' }}>
                              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                                <thead><tr style={{ backgroundColor: 'var(--bg-elevated)' }}>
                                  {['Gene','Freq%','OT','Path','CIViC','Drugs'].map(h => <th key={h} style={{ padding: '4px 5px', textAlign: 'left', borderBottom: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: '9px', fontFamily: 'var(--font-display)', letterSpacing: '0.5px', textTransform: 'uppercase' }}>{h}</th>)}
                                </tr></thead>
                                <tbody>{data.evidenceTable.map((row, i) => {
                                  const drugId = `${key}_${row.gene}`; const isExp = expandedDrugs[drugId];
                                  return (<tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                                    <td style={{ padding: '4px 5px' }}><strong style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)', fontSize: '11px' }}>{row.gene}</strong></td>
                                    <td style={{ padding: '4px 5px', fontFamily: 'var(--font-display)' }}>{row.mutationFrequency != null ? parseFloat(row.mutationFrequency).toFixed(1) : '—'}%</td>
                                    <td style={{ padding: '4px 5px', fontFamily: 'var(--font-display)' }}>{row.associationScore != null ? parseFloat(row.associationScore).toFixed(2) : '—'}</td>
                                    <td style={{ padding: '4px 5px', fontSize: '10px', color: 'var(--accent-purple)' }}>{row.reactomeTopPathway ? (row.reactomeTopPathway.length > 25 ? row.reactomeTopPathway.substring(0, 25) + '…' : row.reactomeTopPathway) : '—'}</td>
                                    <td style={{ padding: '4px 5px' }}>{row.civicBestLevel ? <span className="pill" style={{ padding: '1px 6px', fontSize: '9px', backgroundColor: 'rgba(6,182,212,0.12)', border: '1px solid rgba(6,182,212,0.25)', color: 'var(--accent-cyan)' }}>Lv{row.civicBestLevel}</span> : '—'}</td>
                                    <td style={{ padding: '4px 5px' }}>{(row.dgidbDrugCount ?? 0) > 0 ? <span onClick={() => toggleDrugExpand(key, row.gene)} style={{ color: 'var(--accent-green)', cursor: 'pointer', fontSize: '10px', fontFamily: 'var(--font-display)' }}>{row.dgidbDrugCount}{isExp && row.dgidbDrugs && <div style={{ color: 'var(--text-muted)', marginTop: '4px', fontSize: '9px' }}>{row.dgidbDrugs.map((d,di) => <div key={di}>{d.name}{d.approved ? ' ✓' : ''}</div>)}</div>}</span> : '—'}</td>
                                  </tr>);
                                })}</tbody>
                              </table>
                            </div>
                          </div>
                        )}
                        {data.predictions.length > 0 && (
                          <div style={{ marginBottom: '14px' }}>
                            <h4 style={{ fontSize: '11px', color: 'var(--accent-cyan)', marginBottom: '6px', fontFamily: 'var(--font-display)', fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase' }}>Predictions ({data.predictions.length})</h4>
                            {data.predictions.map((pred, i) => (
                              <div key={i} style={{ padding: '8px', marginBottom: '6px', borderRadius: '8px', backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
                                  <strong style={{ color: 'var(--text-primary)', fontSize: '12px', fontFamily: 'var(--font-display)' }}>{pred.condition}</strong>
                                  <span className="pill" style={{ fontSize: '9px', padding: '2px 8px', backgroundColor: pred.confidence === 'high' ? 'rgba(34,197,94,0.12)' : pred.confidence === 'moderate' ? 'rgba(245,158,11,0.12)' : 'rgba(100,116,139,0.1)', border: `1px solid ${pred.confidence === 'high' ? 'rgba(34,197,94,0.3)' : pred.confidence === 'moderate' ? 'rgba(245,158,11,0.3)' : 'var(--border)'}`, color: pred.confidence === 'high' ? 'var(--accent-green)' : pred.confidence === 'moderate' ? 'var(--accent-amber)' : 'var(--text-muted)' }}>{pred.confidence}</span>
                                </div>
                                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{(pred.therapy || '—').replace(/_/g, ' ')} → {pred.predictedEffect || '—'}</div>
                                <div style={{ display: 'flex', gap: '4px', marginTop: '4px', flexWrap: 'wrap' }}>
                                  {pred.queryBoost > 0 && <span className="pill" style={{ fontSize: '8px', padding: '1px 6px', backgroundColor: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.25)', color: 'var(--accent-blue)' }}>query-boost</span>}
                                  {pred.interactionDelta !== 0 && <span className="pill" style={{ fontSize: '8px', padding: '1px 6px', backgroundColor: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.25)', color: 'var(--accent-purple)' }}>int {pred.interactionDelta > 0 ? '+' : ''}{pred.interactionDelta.toFixed(2)}</span>}
                                  {pred.clinicalEvidenceBoost > 0 && <span className="pill" style={{ fontSize: '8px', padding: '1px 6px', backgroundColor: 'rgba(6,182,212,0.12)', border: '1px solid rgba(6,182,212,0.25)', color: 'var(--accent-cyan)' }}>CIViC Lv{pred.clinicalEvidenceLevel}</span>}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                        {data.leads.length > 0 && (
                          <div style={{ marginBottom: '14px' }}>
                            <h4 style={{ fontSize: '11px', color: 'var(--accent-cyan)', marginBottom: '6px', fontFamily: 'var(--font-display)', fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase' }}>Leads ({data.leads.length})</h4>
                            {data.leads.map((lead, i) => (
                              <div key={i} style={{ padding: '8px', marginBottom: '6px', borderRadius: '8px', backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
                                  <strong style={{ color: 'var(--text-primary)', fontSize: '12px', fontFamily: 'var(--font-display)' }}>{lead.primaryTarget}</strong>
                                  <span className="pill" style={{ fontSize: '9px', padding: '2px 8px', backgroundColor: lead.benchmarkScore?.tier?.includes('Tier 1') ? 'rgba(34,197,94,0.12)' : lead.benchmarkScore?.tier?.includes('Tier 2') ? 'rgba(245,158,11,0.12)' : 'rgba(100,116,139,0.1)', border: `1px solid ${lead.benchmarkScore?.tier?.includes('Tier 1') ? 'rgba(34,197,94,0.3)' : lead.benchmarkScore?.tier?.includes('Tier 2') ? 'rgba(245,158,11,0.3)' : 'var(--border)'}`, color: lead.benchmarkScore?.tier?.includes('Tier 1') ? 'var(--accent-green)' : lead.benchmarkScore?.tier?.includes('Tier 2') ? 'var(--accent-amber)' : 'var(--text-muted)' }}>{lead.benchmarkScore?.tier ?? '—'}</span>
                                </div>
                                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{lead.mechanismCategory} — <span style={{ color: 'var(--accent-amber)', fontFamily: 'var(--font-display)' }}>{lead.benchmarkScore?.composite?.toFixed(3) ?? '—'}</span></div>
                              </div>
                            ))}
                          </div>
                        )}
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)', borderTop: '1px solid var(--border)', paddingTop: '8px', fontFamily: 'var(--font-display)' }}>
                          Run: {res.runId ?? '—'} · Steps: {res.steps?.length ?? 0}
                        </div>
                      </div>
                    )}
                    {!isLoading && !res && !err && <p style={{ color: 'var(--text-muted)', fontSize: '12px', textAlign: 'center', padding: '30px 0', fontFamily: 'var(--font-display)' }}>Waiting...</p>}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Cross-Context Summary */}
        {hasAnyResults && !anyLoading && selected.filter(k => results[k]).length > 1 && (
          <div className="card" style={{ marginTop: '24px' }}>
            <h2>Cross-Context Summary</h2>
            <table className="data-table">
              <thead><tr>
                {['Disease Context','Biomarkers','Predictions','Leads','Top Tier','Top Score'].map(h => <th key={h}>{h}</th>)}
              </tr></thead>
              <tbody>{selected.filter(k => results[k]).map((key, i) => {
                const d = extractFromSteps(results[key]); const opt = DISEASE_OPTIONS.find(o => o.key === key);
                const genes = d.evidenceTable.map(e => e.gene);
                const topLead = d.leads.length > 0 ? d.leads.reduce((a, b) => (a.benchmarkScore?.composite ?? 0) > (b.benchmarkScore?.composite ?? 0) ? a : b) : null;
                return (<tr key={key}>
                  <td><strong style={{ color: 'var(--text-primary)' }}>{opt.label}</strong></td>
                  <td style={{ fontFamily: 'var(--font-display)', fontSize: '12px' }}>{genes.join(', ') || '—'}</td>
                  <td style={{ fontFamily: 'var(--font-display)' }}>{d.predictions.length}</td>
                  <td style={{ fontFamily: 'var(--font-display)' }}>{d.leads.length}</td>
                  <td>{topLead ? <span className="pill" style={{ fontSize: '10px', padding: '2px 8px', backgroundColor: topLead.benchmarkScore?.tier?.includes('Tier 1') ? 'rgba(34,197,94,0.12)' : 'rgba(245,158,11,0.12)', color: topLead.benchmarkScore?.tier?.includes('Tier 1') ? 'var(--accent-green)' : 'var(--accent-amber)', border: `1px solid ${topLead.benchmarkScore?.tier?.includes('Tier 1') ? 'rgba(34,197,94,0.3)' : 'rgba(245,158,11,0.3)'}` }}>{topLead.benchmarkScore?.tier}</span> : '—'}</td>
                  <td><strong style={{ color: 'var(--accent-amber)', fontFamily: 'var(--font-display)' }}>{topLead?.benchmarkScore?.composite?.toFixed(3) ?? '—'}</strong></td>
                </tr>);
              })}</tbody>
            </table>
          </div>
        )}

        {/* Provenance */}
        {hasAnyResults && (
          <div className="card" style={{ marginTop: '20px', background: 'var(--bg-deep)', borderStyle: 'dashed' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.8 }}>
              <span style={{ color: 'var(--accent-cyan)' }}>PROVENANCE</span> · cBioPortal (TCGA) · OpenTargets · CIViC · DGIdb · Reactome · 9-step deterministic pipeline · Query: &quot;{query}&quot;
            </div>
          </div>
        )}
      </div>

      <footer className="site-footer">
        <p style={{ fontFamily: 'var(--font-display)' }}>Ty Parker · INFO 603/404 Biological Data Management · Prof. Jake Y. Chen</p>
        <p>Powered by cBioPortal · OpenTargets · CIViC · DGIdb · Reactome</p>
        <p><a href="https://github.com/ParkerTy/AgenticTherapyResponsePredictor" target="_blank" rel="noopener noreferrer">GitHub Repository</a></p>
      </footer>
    </main>
  );
}