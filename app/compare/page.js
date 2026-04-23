'use client';

import { useState } from 'react';

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

// Extract structured data from the steps array (matches home page pattern)
function extractFromSteps(res) {
  if (!res?.steps) return {};
  const find = (name) => res.steps.find(s => s.step === name);
  const retrieveStep = find('retrieve');
  const synthesizeStep = find('synthesize');
  const predictStep = find('predict');
  const benchmarkStep = find('benchmark');
  const reportStep = find('report');

  return {
    cohort: retrieveStep?.result?.cohort || {},
    evidenceTable: synthesizeStep?.result?.evidenceTable || [],
    predictions: predictStep?.result?.predictions || [],
    leads: benchmarkStep?.result?.benchmarkedLeads || [],
    report: reportStep?.result || {},
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

  function toggleSelectAll() {
    if (allSelected) {
      setSelected([]);
    } else {
      setSelected(DISEASE_OPTIONS.map(d => d.key));
    }
  }

  function toggleDisease(key) {
    setSelected(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  }

  async function runAll() {
    if (!query.trim() || selected.length === 0) return;

    const newLoading = {};
    const newErrors = {};
    const newResults = { ...results };
    selected.forEach(key => {
      newLoading[key] = true;
      newErrors[key] = null;
      delete newResults[key];
    });
    setLoading(newLoading);
    setError(newErrors);
    setResults(newResults);

    const promises = selected.map(async (diseaseContext) => {
      try {
        const res = await fetch('/api/agent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ diseaseContext, query: query.trim() }),
        });
        const data = await res.json();

        if (!res.ok) {
          if (data.error === 'unrecognized_query') {
            const exList = (data.examples || []).slice(0, 3).join(' | ');
            throw new Error(`Query not recognized. Try: ${exList}`);
          }
          throw new Error(data.error || data.message || `HTTP ${res.status}`);
        }

        setResults(prev => ({ ...prev, [diseaseContext]: data }));
        setError(prev => ({ ...prev, [diseaseContext]: null }));
      } catch (err) {
        setError(prev => ({ ...prev, [diseaseContext]: err.message }));
      } finally {
        setLoading(prev => ({ ...prev, [diseaseContext]: false }));
      }
    });

    await Promise.all(promises);
  }

  function exportAll() {
    const exportData = {
      query,
      timestamp: new Date().toISOString(),
      contexts: selected.map(key => ({
        diseaseContext: key,
        label: DISEASE_OPTIONS.find(d => d.key === key)?.label,
        result: results[key] || null,
        error: error[key] || null,
      })),
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `compare_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function toggleDrugExpand(contextKey, gene) {
    const id = `${contextKey}_${gene}`;
    setExpandedDrugs(prev => ({ ...prev, [id]: !prev[id] }));
  }

  const hasAnyResults = Object.keys(results).length > 0;
  const anyLoading = Object.values(loading).some(Boolean);

  return (
    <main style={{ fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif", backgroundColor: '#111', color: '#eee', minHeight: '100vh', padding: '0' }}>

      {/* ===== NAV BAR ===== */}
      <nav style={{ display: 'flex', gap: '0', borderBottom: '1px solid #333', backgroundColor: '#1a1a1a' }}>
        {[
          { href: '/', label: 'Home' },
          { href: '/compare', label: 'Compare' },
          { href: '/interpret', label: 'Interpret' },
          { href: '/methods', label: 'Methods' },
          { href: '/history', label: 'History' },
        ].map(link => (
          <a key={link.href} href={link.href} style={{
            padding: '12px 20px', color: link.href === '/compare' ? '#4da6ff' : '#aaa',
            textDecoration: 'none', fontSize: '14px', fontWeight: link.href === '/compare' ? 'bold' : 'normal',
            borderBottom: link.href === '/compare' ? '2px solid #4da6ff' : '2px solid transparent',
          }}>
            {link.label}
          </a>
        ))}
      </nav>

      <div style={{ maxWidth: '1600px', margin: '0 auto', padding: '24px' }}>

        {/* ===== HEADER ===== */}
        <h1 style={{ fontSize: '28px', color: '#4da6ff', marginBottom: '4px' }}>
          Cross-Disease Comparison
        </h1>
        <p style={{ color: '#888', fontSize: '14px', marginBottom: '24px' }}>
          Run the same query across multiple disease contexts to compare how the agentic pipeline produces
          different predictions, evidence, and therapeutic leads based on disease-specific biomarkers and configurations.
        </p>

        {/* ===== CONTROLS ===== */}
        <div style={{ padding: '20px', border: '1px solid #333', borderRadius: '8px', backgroundColor: '#1a1a1a', marginBottom: '24px' }}>

          {/* Disease Context Checkboxes */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '13px', color: '#888', display: 'block', marginBottom: '8px' }}>Disease Contexts</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', color: '#4da6ff', fontSize: '14px', fontWeight: 'bold' }}>
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleSelectAll}
                  style={{ accentColor: '#4da6ff' }}
                />
                Select All
              </label>
              <span style={{ color: '#333', fontSize: '18px' }}>|</span>
              {DISEASE_OPTIONS.map(d => (
                <label key={d.key} style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', color: '#ccc', fontSize: '14px' }}>
                  <input
                    type="checkbox"
                    checked={selected.includes(d.key)}
                    onChange={() => toggleDisease(d.key)}
                    disabled={anyLoading}
                    style={{ accentColor: '#4da6ff' }}
                  />
                  {d.label}
                </label>
              ))}
            </div>
          </div>

          {/* Query Input */}
          <div style={{ marginBottom: '12px' }}>
            <label style={{ fontSize: '13px', color: '#888', display: 'block', marginBottom: '6px' }}>Query (shared across all selected contexts)</label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') runAll(); }}
                placeholder="e.g. Predict therapy response and benchmark leads"
                disabled={anyLoading}
                style={{
                  flex: 1, padding: '10px 14px', fontSize: '15px', borderRadius: '6px',
                  border: '1px solid #444', backgroundColor: '#222', color: '#eee',
                  outline: 'none',
                }}
              />
              <button
                onClick={runAll}
                disabled={anyLoading || selected.length === 0 || !query.trim()}
                style={{
                  padding: '10px 24px', fontSize: '15px', borderRadius: '6px', border: 'none',
                  backgroundColor: (anyLoading || selected.length === 0 || !query.trim()) ? '#333' : '#4da6ff',
                  color: '#fff', cursor: (anyLoading || selected.length === 0 || !query.trim()) ? 'not-allowed' : 'pointer',
                  fontWeight: 'bold', whiteSpace: 'nowrap',
                }}
              >
                {anyLoading ? 'Running...' : `Run All (${selected.length})`}
              </button>
            </div>
          </div>

          {/* Example Queries */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', color: '#666', lineHeight: '28px' }}>Examples:</span>
            {COMPARE_EXAMPLES.map((ex, i) => (
              <button
                key={i}
                onClick={() => setQuery(ex)}
                disabled={anyLoading}
                style={{
                  padding: '4px 10px', fontSize: '12px', borderRadius: '14px', border: '1px solid #444',
                  backgroundColor: '#222', color: '#aaa', cursor: anyLoading ? 'not-allowed' : 'pointer',
                }}
              >
                {ex}
              </button>
            ))}
          </div>
        </div>

        {/* ===== EXPORT BUTTON ===== */}
        {hasAnyResults && (
          <div style={{ marginBottom: '20px', textAlign: 'right' }}>
            <button
              onClick={exportAll}
              style={{
                padding: '8px 16px', fontSize: '13px', borderRadius: '6px', border: '1px solid #4da6ff',
                backgroundColor: 'transparent', color: '#4da6ff', cursor: 'pointer',
              }}
            >
              Export All Results (JSON)
            </button>
          </div>
        )}

        {/* ===== RESULTS GRID ===== */}
        {(hasAnyResults || anyLoading || Object.values(error).some(Boolean)) && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${selected.length}, 1fr)`,
            gap: '16px',
            alignItems: 'start',
          }}>
            {selected.map(key => {
              const opt = DISEASE_OPTIONS.find(d => d.key === key);
              const res = results[key];
              const isLoading = loading[key];
              const err = error[key];
              const data = res ? extractFromSteps(res) : {};

              return (
                <div key={key} style={{
                  border: '1px solid #333', borderRadius: '8px', backgroundColor: '#1a1a1a',
                  overflow: 'hidden', minWidth: 0,
                }}>
                  {/* Column Header */}
                  <div style={{
                    padding: '12px 16px', backgroundColor: '#222',
                    borderBottom: '1px solid #333',
                  }}>
                    <h3 style={{ margin: 0, fontSize: '15px', color: '#4da6ff' }}>{opt.label}</h3>
                    <span style={{ fontSize: '11px', color: '#666' }}>{key}</span>
                  </div>

                  <div style={{ padding: '12px 16px' }}>
                    {/* Loading */}
                    {isLoading && (
                      <div style={{ textAlign: 'center', padding: '40px 0' }}>
                        <div style={{
                          width: '32px', height: '32px', border: '3px solid #333',
                          borderTop: '3px solid #4da6ff', borderRadius: '50%',
                          animation: 'spin 1s linear infinite', margin: '0 auto 12px',
                        }} />
                        <p style={{ color: '#888', fontSize: '13px' }}>Running agent pipeline...</p>
                        <p style={{ color: '#555', fontSize: '11px' }}>This may take 15–20 seconds</p>
                      </div>
                    )}

                    {/* Error */}
                    {err && !isLoading && (
                      <div style={{
                        padding: '12px', backgroundColor: '#331111', border: '1px solid #663333',
                        borderRadius: '6px', color: '#ff6666', fontSize: '13px',
                      }}>
                        <strong>Error:</strong> {err}
                      </div>
                    )}

                    {/* Results */}
                    {res && !isLoading && (
                      <div>
                        {/* Cohort Summary */}
                        {data.cohort && (
                          <div style={{ marginBottom: '14px' }}>
                            <h4 style={{ fontSize: '13px', color: '#4da6ff', marginBottom: '6px' }}>Cohort</h4>
                            <div style={{ fontSize: '12px', color: '#aaa' }}>
                              <div>Study: <strong style={{ color: '#fff' }}>{data.cohort.studyName || data.cohort.studyId || '—'}</strong></div>
                              <div>Samples: <strong style={{ color: '#fff' }}>{data.cohort.sampleCount ?? '—'}</strong></div>
                            </div>
                          </div>
                        )}

                        {/* Evidence Table */}
                        {data.evidenceTable.length > 0 && (
                          <div style={{ marginBottom: '14px' }}>
                            <h4 style={{ fontSize: '13px', color: '#4da6ff', marginBottom: '6px' }}>Evidence Table</h4>
                            <div style={{ overflowX: 'auto' }}>
                              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                                <thead>
                                  <tr style={{ backgroundColor: '#222' }}>
                                    <th style={compactTh}>Gene</th>
                                    <th style={compactTh}>Freq%</th>
                                    <th style={compactTh}>OT Score</th>
                                    <th style={compactTh}>Pathway</th>
                                    <th style={compactTh}>CIViC</th>
                                    <th style={compactTh}>Drugs</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {data.evidenceTable.map((row, i) => {
                                    const drugExpandId = `${key}_${row.gene}`;
                                    const isExpanded = expandedDrugs[drugExpandId];
                                    return (
                                      <tr key={i} style={{ backgroundColor: i % 2 === 0 ? '#1a1a1a' : '#222' }}>
                                        <td style={compactTd}><strong style={{ color: '#fff' }}>{row.gene}</strong></td>
                                        <td style={compactTd}>{row.mutationFrequency != null ? parseFloat(row.mutationFrequency).toFixed(1) : '—'}%</td>
                                        <td style={compactTd}>{row.associationScore != null ? parseFloat(row.associationScore).toFixed(2) : '—'}</td>
                                        <td style={compactTd}>
                                          <span style={{ fontSize: '10px', color: '#aaa' }}>
                                            {row.reactomeTopPathway ? truncate(row.reactomeTopPathway, 30) : '—'}
                                          </span>
                                        </td>
                                        <td style={compactTd}>
                                          {row.civicBestLevel ? (
                                            <span style={{
                                              padding: '1px 5px', borderRadius: '3px', fontSize: '10px', fontWeight: 'bold',
                                              backgroundColor: row.civicBestLevel <= 'B' ? '#1a4a4a' : '#333',
                                              color: row.civicBestLevel <= 'B' ? '#4dd4d4' : '#999',
                                            }}>
                                              Lv{row.civicBestLevel}
                                            </span>
                                          ) : '—'}
                                        </td>
                                        <td style={compactTd}>
                                          {(row.dgidbDrugCount ?? 0) > 0 ? (
                                            <span
                                              onClick={() => toggleDrugExpand(key, row.gene)}
                                              style={{ color: '#4da6ff', cursor: 'pointer', fontSize: '10px', textDecoration: 'underline' }}
                                            >
                                              {row.dgidbDrugCount} drug{row.dgidbDrugCount > 1 ? 's' : ''}
                                              {isExpanded && row.dgidbDrugs && (
                                                <div style={{ color: '#aaa', textDecoration: 'none', marginTop: '4px', fontSize: '10px' }}>
                                                  {row.dgidbDrugs.map((d, di) => (
                                                    <div key={di}>
                                                      {d.name} {d.approved ? '✓' : ''}
                                                    </div>
                                                  ))}
                                                </div>
                                              )}
                                            </span>
                                          ) : '—'}
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}

                        {/* Predictions */}
                        {data.predictions.length > 0 && (
                          <div style={{ marginBottom: '14px' }}>
                            <h4 style={{ fontSize: '13px', color: '#4da6ff', marginBottom: '6px' }}>
                              Predictions ({data.predictions.length})
                            </h4>
                            {data.predictions.map((pred, i) => (
                              <div key={i} style={{
                                padding: '8px', marginBottom: '6px', borderRadius: '6px',
                                backgroundColor: '#222', border: '1px solid #333',
                              }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                  <strong style={{ color: '#fff', fontSize: '12px' }}>{pred.condition}</strong>
                                  <span style={{
                                    padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold',
                                    backgroundColor: pred.confidence === 'high' ? '#338833' : pred.confidence === 'moderate' ? '#886633' : '#555',
                                    color: '#fff',
                                  }}>
                                    {pred.confidence}
                                  </span>
                                </div>
                                <div style={{ fontSize: '11px', color: '#aaa' }}>
                                  {(pred.therapy || '—').replace(/_/g, ' ')}
                                  {' → '}{pred.predictedEffect || '—'}
                                </div>
                                {/* Badges */}
                                <div style={{ display: 'flex', gap: '4px', marginTop: '4px', flexWrap: 'wrap' }}>
                                  {pred.queryBoost > 0 && (
                                    <span style={{ padding: '1px 5px', borderRadius: '3px', fontSize: '9px', backgroundColor: '#2a2a55', color: '#8888ff' }}>query-boost</span>
                                  )}
                                  {pred.interactionDelta !== 0 && (
                                    <span style={{ padding: '1px 5px', borderRadius: '3px', fontSize: '9px', backgroundColor: '#553322', color: '#ffaa66' }}>
                                      interaction {pred.interactionDelta > 0 ? '+' : ''}{pred.interactionDelta.toFixed(2)}
                                    </span>
                                  )}
                                  {pred.clinicalEvidenceBoost > 0 && (
                                    <span style={{ padding: '1px 5px', borderRadius: '3px', fontSize: '9px', backgroundColor: '#1a4a4a', color: '#4dd4d4' }}>
                                      CIViC Lv{pred.clinicalEvidenceLevel}
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Benchmarked Leads */}
                        {data.leads.length > 0 && (
                          <div style={{ marginBottom: '14px' }}>
                            <h4 style={{ fontSize: '13px', color: '#4da6ff', marginBottom: '6px' }}>
                              Benchmarked Leads ({data.leads.length})
                            </h4>
                            {data.leads.map((lead, i) => (
                              <div key={i} style={{
                                padding: '8px', marginBottom: '6px', borderRadius: '6px',
                                backgroundColor: '#222', border: '1px solid #333',
                              }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                  <strong style={{ color: '#fff', fontSize: '12px' }}>{lead.primaryTarget}</strong>
                                  <span style={{
                                    padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold',
                                    backgroundColor: lead.benchmarkScore?.tier?.includes('Tier 1') ? '#338833' :
                                                     lead.benchmarkScore?.tier?.includes('Tier 2') ? '#886633' : '#555',
                                    color: '#fff',
                                  }}>
                                    {lead.benchmarkScore?.tier ?? '—'}
                                  </span>
                                </div>
                                <div style={{ fontSize: '11px', color: '#aaa', marginBottom: '2px' }}>
                                  {lead.mechanismCategory} — {(lead.leadType || '').replace(/_/g, ' ')}
                                </div>
                                <div style={{ fontSize: '11px', color: '#ffcc00' }}>
                                  Score: {lead.benchmarkScore?.composite?.toFixed(3) ?? '—'}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Run Metadata */}
                        <div style={{ fontSize: '10px', color: '#555', borderTop: '1px solid #333', paddingTop: '8px', marginTop: '8px' }}>
                          Run ID: {res.runId ?? '—'}<br/>
                          Steps: {res.steps?.length ?? 0}
                        </div>
                      </div>
                    )}

                    {/* Idle state */}
                    {!isLoading && !res && !err && (
                      <p style={{ color: '#555', fontSize: '13px', textAlign: 'center', padding: '30px 0' }}>
                        Waiting for query...
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ===== Cross-Context Summary ===== */}
        {hasAnyResults && !anyLoading && selected.filter(k => results[k]).length > 1 && (
          <div style={{
            marginTop: '24px', padding: '20px', border: '1px solid #333',
            borderRadius: '8px', backgroundColor: '#1a1a1a',
          }}>
            <h3 style={{ color: '#4da6ff', marginTop: 0, marginBottom: '12px', fontSize: '16px' }}>
              Cross-Context Summary
            </h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ backgroundColor: '#222' }}>
                  <th style={thStyle}>Disease Context</th>
                  <th style={thStyle}>Biomarkers</th>
                  <th style={thStyle}>Predictions</th>
                  <th style={thStyle}>Leads</th>
                  <th style={thStyle}>Top Tier</th>
                  <th style={thStyle}>Top Score</th>
                </tr>
              </thead>
              <tbody>
                {selected.filter(k => results[k]).map((key, i) => {
                  const r = results[key];
                  const d = extractFromSteps(r);
                  const opt = DISEASE_OPTIONS.find(o => o.key === key);
                  const genes = d.evidenceTable.map(e => e.gene);
                  const topLead = d.leads.length > 0 ? d.leads.reduce((a, b) =>
                    (a.benchmarkScore?.composite ?? 0) > (b.benchmarkScore?.composite ?? 0) ? a : b
                  ) : null;

                  return (
                    <tr key={key} style={{ backgroundColor: i % 2 === 0 ? '#1a1a1a' : '#222' }}>
                      <td style={tdStyle}><strong style={{ color: '#fff' }}>{opt.label}</strong></td>
                      <td style={tdStyle}>{genes.join(', ') || '—'}</td>
                      <td style={tdStyle}>{d.predictions.length}</td>
                      <td style={tdStyle}>{d.leads.length}</td>
                      <td style={tdStyle}>
                        {topLead ? (
                          <span style={{
                            padding: '2px 6px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold',
                            backgroundColor: topLead.benchmarkScore?.tier?.includes('Tier 1') ? '#338833' :
                                             topLead.benchmarkScore?.tier?.includes('Tier 2') ? '#886633' : '#555',
                            color: '#fff',
                          }}>
                            {topLead.benchmarkScore?.tier}
                          </span>
                        ) : '—'}
                      </td>
                      <td style={tdStyle}>
                        <strong style={{ color: '#ffcc00' }}>
                          {topLead?.benchmarkScore?.composite?.toFixed(3) ?? '—'}
                        </strong>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* ===== Provenance Footer ===== */}
        {hasAnyResults && (
          <div style={{
            marginTop: '20px', padding: '12px 16px', borderRadius: '6px',
            backgroundColor: '#1a1a1a', border: '1px solid #333', fontSize: '11px', color: '#555',
          }}>
            <strong style={{ color: '#888' }}>Data Sources:</strong> cBioPortal (TCGA) · OpenTargets · CIViC · DGIdb · Reactome
            {' | '}
            <strong style={{ color: '#888' }}>Pipeline:</strong> 9-step deterministic agentic loop
            {' | '}
            <strong style={{ color: '#888' }}>Query:</strong> &quot;{query}&quot;
          </div>
        )}
      </div>

      {/* ===== SITE FOOTER ===== */}
      <footer style={{
        marginTop: '40px', padding: '20px', borderTop: '1px solid #333',
        backgroundColor: '#1a1a1a', textAlign: 'center', fontSize: '12px', color: '#555',
      }}>
        <p style={{ margin: '0 0 4px' }}>
          <strong style={{ color: '#888' }}>Agentic Therapy Response Predictor</strong> — Ty Parker — INFO 603/404 Biological Data Management
        </p>
        <p style={{ margin: '0 0 4px' }}>
          Data: cBioPortal · OpenTargets · CIViC · DGIdb · Reactome
        </p>
        <p style={{ margin: 0 }}>
          <a href="https://github.com/ParkerTy/AgenticTherapyResponsePredictor" target="_blank" rel="noopener noreferrer" style={{ color: '#4da6ff', textDecoration: 'none' }}>
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

const compactTh = { padding: '5px 6px', textAlign: 'left', borderBottom: '2px solid #333', color: '#aaa', fontSize: '10px', whiteSpace: 'nowrap' };
const compactTd = { padding: '4px 6px', borderBottom: '1px solid #2a2a2a', color: '#ccc', fontSize: '11px' };
const thStyle = { padding: '8px 10px', textAlign: 'left', borderBottom: '2px solid #333', color: '#fff', fontSize: '13px' };
const tdStyle = { padding: '8px 10px', borderBottom: '1px solid #333', color: '#ccc' };

function truncate(str, max) {
  if (!str) return '';
  return str.length > max ? str.substring(0, max) + '…' : str;
}