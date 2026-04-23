'use client';

import { useState } from 'react';
import Link from 'next/link';

const DISEASE_OPTIONS = [
  { key: 'hr_pos_her2_neg', label: 'HR+/HER2- Breast Cancer' },
  { key: 'tnbc', label: 'Triple-Negative Breast Cancer (TNBC)' },
  { key: 'crc', label: 'Colorectal Cancer (CRC)' },
];

const EXAMPLE_QUERIES = {
  hr_pos_her2_neg: [
    'Predict therapy response for PIK3CA-mutated HR+ breast cancer',
    'Compare endocrine therapy vs CDK4/6 inhibitors',
    'Evaluate PI3K inhibitor options in metastatic setting',
  ],
  tnbc: [
    'Predict PARP inhibitor response in BRCA-mutated TNBC',
    'Evaluate immunotherapy for PD-L1 positive TNBC',
    'Compare platinum chemotherapy vs PARP inhibitors',
  ],
  crc: [
    'Predict anti-EGFR resistance in KRAS-mutated CRC',
    'Evaluate immunotherapy for MSI-high colorectal cancer',
    'Compare targeted therapy options for metastatic CRC',
  ],
};

export default function Home() {
  const [diseaseContext, setDiseaseContext] = useState('hr_pos_her2_neg');
  const [query, setQuery] = useState('Predict therapy response and benchmark leads');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showExamples, setShowExamples] = useState(false);
  const [expandedDrugs, setExpandedDrugs] = useState({});

  async function handleRun() {
    setLoading(true);
    setError(null);
    setResult(null);
    setExpandedDrugs({});
    try {
      const res = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ diseaseContext, query }),
      });
      const data = await res.json();
      if (!res.ok) setError(data.error || 'Something went wrong');
      else setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleExport() {
    if (!result) return;
    const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `agent_report_${result.runId || 'export'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function toggleDrugExpand(gene) {
    setExpandedDrugs((prev) => ({ ...prev, [gene]: !prev[gene] }));
  }

  const parseQueryStep = result?.steps?.find((s) => s.step === 'parseQuery');
  const retrieveStep = result?.steps?.find((s) => s.step === 'retrieve');
  const synthesizeStep = result?.steps?.find((s) => s.step === 'synthesize');
  const interactionsStep = result?.steps?.find((s) => s.step === 'interactions');
  const predictStep = result?.steps?.find((s) => s.step === 'predict');
  const benchmarkStep = result?.steps?.find((s) => s.step === 'benchmark');
  const reportStep = result?.steps?.find((s) => s.step === 'report');

  return (
    <main style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 20px 40px', fontFamily: 'sans-serif', color: '#e0e0e0', backgroundColor: '#111', minHeight: '100vh' }}>

      {/* === Nav Bar === */}
      <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0', borderBottom: '1px solid #333', marginBottom: '24px' }}>
        <strong style={{ color: '#fff', fontSize: '16px' }}>Agentic Therapy Response Predictor</strong>
        <div style={{ display: 'flex', gap: '16px', fontSize: '14px' }}>
          <Link href="/" style={{ color: '#4da6ff', textDecoration: 'none' }}>Home</Link>
          <Link href="/compare" style={{ color: '#aaa', textDecoration: 'none' }}>Compare</Link>
          <Link href="/interpret" style={{ color: '#aaa', textDecoration: 'none' }}>Interpret</Link>
          <Link href="/methods" style={{ color: '#aaa', textDecoration: 'none' }}>Methods</Link>
          <Link href="/history" style={{ color: '#aaa', textDecoration: 'none' }}>History</Link>
        </div>
      </nav>

      {/* === Header === */}
      <h1 style={{ color: '#fff', marginBottom: '4px' }}>Agentic AI Scientist</h1>
      <p style={{ color: '#aaa', marginTop: 0, marginBottom: '8px' }}>
        Therapy Response Prediction & Generative Lead Benchmarking.
        <br />
        <em>Inspired by BioAgents (2025) agentic reasoning framework.</em>
      </p>

      {/* === What is this? === */}
      <div style={{ padding: '12px 16px', backgroundColor: '#1a2a3a', border: '1px solid #234', borderRadius: '8px', marginBottom: '20px', fontSize: '14px', color: '#bcd' }}>
        This system integrates <strong>5 biomedical databases</strong> (cBioPortal, OpenTargets, CIViC, DGIdb, Reactome) to predict therapy responses and benchmark therapeutic leads across oncology disease contexts. All reasoning is deterministic, transparent, and fully auditable.
      </div>

      <hr style={{ margin: '20px 0', borderColor: '#333' }} />

      {/* === Disease Selector === */}
      <div style={{ marginBottom: '16px' }}>
        <label><strong style={{ color: '#fff' }}>Disease Context:</strong></label>
        <br />
        <select
          value={diseaseContext}
          onChange={(e) => { setDiseaseContext(e.target.value); setShowExamples(false); }}
          disabled={loading}
          style={{ padding: '8px', fontSize: '16px', width: '100%', marginTop: '4px', backgroundColor: '#222', color: '#fff', border: '1px solid #444', borderRadius: '4px' }}
        >
          {DISEASE_OPTIONS.map((opt) => (
            <option key={opt.key} value={opt.key}>{opt.label}</option>
          ))}
        </select>
      </div>

      {/* === Query Input + Examples === */}
      <div style={{ marginBottom: '16px' }}>
        <label><strong style={{ color: '#fff' }}>Query:</strong></label>
        <br />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          disabled={loading}
          style={{ padding: '8px', fontSize: '16px', width: '100%', marginTop: '4px', backgroundColor: '#222', color: '#fff', border: '1px solid #444', borderRadius: '4px' }}
        />
        <button
          onClick={() => setShowExamples(!showExamples)}
          style={{ marginTop: '6px', background: 'none', border: 'none', color: '#4da6ff', cursor: 'pointer', fontSize: '13px', padding: 0 }}
        >
          {showExamples ? 'Hide examples' : 'Show example queries'}
        </button>
        {showExamples && (
          <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {(EXAMPLE_QUERIES[diseaseContext] || []).map((eq, i) => (
              <button
                key={i}
                onClick={() => { setQuery(eq); setShowExamples(false); }}
                style={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: '4px', color: '#4da6ff', padding: '6px 10px', cursor: 'pointer', textAlign: 'left', fontSize: '13px' }}
              >
                {eq}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* === Run Button === */}
      <button
        onClick={handleRun}
        disabled={loading}
        style={{
          padding: '10px 24px', fontSize: '16px',
          backgroundColor: loading ? '#555' : '#0070f3', color: '#fff',
          border: 'none', borderRadius: '4px',
          cursor: loading ? 'not-allowed' : 'pointer',
          display: 'flex', alignItems: 'center', gap: '8px',
        }}
      >
        {loading && <span style={{ display: 'inline-block', width: '16px', height: '16px', border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />}
        {loading ? 'Running Agent (this may take 15-30s)...' : 'Run Agent'}
      </button>

      {/* Spinner animation */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* === Error === */}
      {error && (
        <div style={{ marginTop: '20px', padding: '12px', backgroundColor: '#3a1111', border: '1px solid #cc3333', borderRadius: '4px', color: '#ff8888' }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* === Results === */}
      {result && (
        <div style={{ marginTop: '20px' }}>

          {/* Report Summary */}
          <div style={{ padding: '16px', backgroundColor: '#1a2a3a', border: '1px solid #0070f3', borderRadius: '8px', marginBottom: '20px' }}>
            <h2 style={{ marginTop: 0, color: '#4da6ff' }}>Report Summary</h2>
            <p><strong style={{ color: '#ccc' }}>Status:</strong> <span style={{ color: result.status === 'completed' ? '#66cc66' : '#ff6666' }}>{result.status}</span></p>
            <p><strong style={{ color: '#ccc' }}>Run ID:</strong> <Link href={`/run/${result.runId}`} style={{ color: '#4da6ff' }}>{result.runId}</Link></p>
            <p><strong style={{ color: '#ccc' }}>Disease:</strong> {result.disease}</p>
            {reportStep?.result?.summary && (
              <p style={{ fontSize: '15px', lineHeight: '1.5', color: '#ddd' }}>{reportStep.result.summary}</p>
            )}
            <button onClick={handleExport} style={{ marginTop: '8px', padding: '6px 14px', backgroundColor: '#0070f3', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '13px' }}>
              Export Report (JSON)
            </button>
          </div>

          {/* Interpreted Query */}
          {parseQueryStep?.result && (
            <div style={{ padding: '16px', border: '1px solid #333', borderRadius: '8px', marginBottom: '20px', backgroundColor: '#1a1a1a' }}>
              <h2 style={{ marginTop: 0, color: '#4da6ff' }}>Interpreted Query</h2>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {(parseQueryStep.result.therapyClasses || []).map((t, i) => (
                  <span key={`t${i}`} style={{ padding: '3px 8px', backgroundColor: '#0a3060', borderRadius: '12px', fontSize: '12px', color: '#4da6ff' }}>{t.replace(/_/g, ' ')}</span>
                ))}
                {(parseQueryStep.result.biomarkers || []).map((b, i) => (
                  <span key={`b${i}`} style={{ padding: '3px 8px', backgroundColor: '#302a0a', borderRadius: '12px', fontSize: '12px', color: '#ffcc00' }}>{b}</span>
                ))}
                {(parseQueryStep.result.clinicalSettings || []).map((c, i) => (
                  <span key={`c${i}`} style={{ padding: '3px 8px', backgroundColor: '#1a301a', borderRadius: '12px', fontSize: '12px', color: '#66cc66' }}>{c.replace(/_/g, ' ')}</span>
                ))}
                {(parseQueryStep.result.intents || []).map((intent, i) => (
                  <span key={`i${i}`} style={{ padding: '3px 8px', backgroundColor: '#2a1a30', borderRadius: '12px', fontSize: '12px', color: '#b088d0' }}>{intent}</span>
                ))}
              </div>
            </div>
          )}

          {/* Cohort Info */}
          {retrieveStep?.result?.cohort && (
            <div style={{ padding: '16px', border: '1px solid #333', borderRadius: '8px', marginBottom: '20px', backgroundColor: '#1a1a1a' }}>
              <h2 style={{ marginTop: 0, color: '#4da6ff' }}>Cohort Data (cBioPortal)</h2>
              <p><strong style={{ color: '#ccc' }}>Study:</strong> {retrieveStep.result.cohort.studyName}</p>
              <p><strong style={{ color: '#ccc' }}>Study ID:</strong> {retrieveStep.result.cohort.studyId}</p>
              <p><strong style={{ color: '#ccc' }}>Samples:</strong> {retrieveStep.result.cohort.sampleCount}</p>
              <p><strong style={{ color: '#ccc' }}>Total Mutations Found:</strong> {retrieveStep.result.mutations?.totalMutations || 0}</p>
            </div>
          )}

          {/* Evidence Table */}
          {synthesizeStep?.result?.evidenceTable && (
            <div style={{ padding: '16px', border: '1px solid #333', borderRadius: '8px', marginBottom: '20px', backgroundColor: '#1a1a1a' }}>
              <h2 style={{ marginTop: 0, color: '#4da6ff' }}>Evidence Table</h2>
              <p style={{ fontSize: '14px', color: '#888' }}>
                Sources: cBioPortal + OpenTargets + CIViC + DGIdb + Reactome
              </p>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#0070f3' }}>
                      <th style={thStyle}>Gene</th>
                      <th style={thStyle}>Mutation Freq</th>
                      <th style={thStyle}>Assoc. Score</th>
                      <th style={thStyle}>Pathway</th>
                      <th style={thStyle}>Clinical Evidence</th>
                      <th style={thStyle}>Druggable</th>
                    </tr>
                  </thead>
                  <tbody>
                    {synthesizeStep.result.evidenceTable.map((row, i) => (
                      <tr key={i} style={{ backgroundColor: i % 2 === 0 ? '#222' : '#1a1a1a' }}>
                        <td style={tdStyle}>
                          <strong style={{ color: '#fff' }}>{row.gene}</strong>
                          <br />
                          <span style={{ fontSize: '11px', color: '#888' }}>{row.role} — {row.effect}</span>
                        </td>
                        <td style={tdStyle}>
                          <strong style={{ color: '#ffcc00' }}>{row.mutationFrequency}</strong>
                          <br />
                          <span style={{ fontSize: '11px', color: '#888' }}>{row.mutatedSamples}/{row.totalSamples}</span>
                        </td>
                        <td style={tdStyle}>
                          <span style={{
                            color: row.diseaseAssociationScore > 0.5 ? '#66cc66' :
                                   row.diseaseAssociationScore > 0.2 ? '#ffcc00' : '#ff6666',
                            fontWeight: 'bold',
                          }}>
                            {row.diseaseAssociationScore?.toFixed(3) || '0.000'}
                          </span>
                        </td>
                        <td style={tdStyle}>
                          {row.reactomeTopPathway ? (
                            <span style={{ color: '#b088d0', fontSize: '12px' }}>{row.reactomeTopPathway}</span>
                          ) : (
                            <span style={{ color: '#555' }}>—</span>
                          )}
                        </td>
                        <td style={tdStyle}>
                          {row.civicFound ? (
                            <span style={{ color: '#4da6ff' }}>
                              Level {row.civicBestLevel} ({row.civicEvidenceCount} items)
                              {row.civicPredictiveCount > 0 && (
                                <span style={{ fontSize: '11px', color: '#888' }}><br />{row.civicPredictiveCount} predictive</span>
                              )}
                            </span>
                          ) : (
                            <span style={{ color: '#555' }}>—</span>
                          )}
                        </td>
                        <td style={tdStyle}>
                          {row.dgidbFound && row.dgidbDrugCount > 0 ? (
                            <div>
                              <button
                                onClick={() => toggleDrugExpand(row.gene)}
                                style={{ background: 'none', border: 'none', color: '#66cc66', cursor: 'pointer', fontWeight: 'bold', padding: 0, fontSize: '13px' }}
                              >
                                {row.dgidbDrugCount} drugs {expandedDrugs[row.gene] ? '▲' : '▼'}
                              </button>
                              {row.dgidbApprovedCount > 0 && (
                                <span style={{ fontSize: '11px', color: '#888' }}> ({row.dgidbApprovedCount} approved)</span>
                              )}
                              {expandedDrugs[row.gene] && (
                                <div style={{ marginTop: '6px', padding: '6px', backgroundColor: '#111', borderRadius: '4px', fontSize: '12px' }}>
                                  {(row.dgidbDrugs || []).slice(0, 10).map((drug, di) => (
                                    <div key={di} style={{ color: drug.approved ? '#66cc66' : '#ccc', marginBottom: '2px' }}>
                                      {drug.approved ? '✓ ' : '• '}{drug.name}
                                      {drug.interactionTypes?.length > 0 && (
                                        <span style={{ color: '#888' }}> — {drug.interactionTypes.join(', ')}</span>
                                      )}
                                    </div>
                                  ))}
                                  {(row.dgidbDrugs || []).length > 10 && (
                                    <div style={{ color: '#888', marginTop: '4px' }}>...and {row.dgidbDrugs.length - 10} more</div>
                                  )}
                                </div>
                              )}
                            </div>
                          ) : row.druggabilityCount > 0 ? (
                            <span style={{ color: '#66cc66', fontWeight: 'bold' }}>Yes ({row.druggabilityCount})</span>
                          ) : (
                            <span style={{ color: '#555' }}>—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Biomarker Interactions */}
          {interactionsStep?.result?.firedRules?.length > 0 && (
            <div style={{ padding: '16px', border: '1px solid #333', borderRadius: '8px', marginBottom: '20px', backgroundColor: '#1a1a1a' }}>
              <h2 style={{ marginTop: 0, color: '#4da6ff' }}>Biomarker Interactions</h2>
              <p style={{ fontSize: '14px', color: '#888' }}>
                {interactionsStep.result.firedRules.length} of {interactionsStep.result.rulesEvaluated} rules fired
              </p>
              {interactionsStep.result.firedRules.map((rule, i) => (
                <div key={i} style={{ padding: '8px', marginBottom: '6px', backgroundColor: '#222', borderRadius: '4px', border: '1px solid #333' }}>
                  <strong style={{ color: '#b088d0' }}>{rule.name || rule.id}</strong>
                  <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#999' }}>{rule.description || ''}</p>
                </div>
              ))}
            </div>
          )}

          {/* Predictions */}
          {predictStep?.result?.predictions && (
            <div style={{ padding: '16px', border: '1px solid #333', borderRadius: '8px', marginBottom: '20px', backgroundColor: '#1a1a1a' }}>
              <h2 style={{ marginTop: 0, color: '#4da6ff' }}>Therapy Response Predictions</h2>
              <p style={{ fontSize: '14px', color: '#888' }}>
                {predictStep.result.totalPredictions} predictions |
                {' '}{predictStep.result.highConfidence} high |
                {' '}{predictStep.result.moderateConfidence} moderate |
                {' '}{predictStep.result.lowConfidence} low
                {predictStep.result.clinicalBoostsApplied > 0 && (
                  <span> | {predictStep.result.clinicalBoostsApplied} CIViC boosts</span>
                )}
              </p>
              {predictStep.result.predictions.map((pred, i) => (
                <div key={i} style={{
                  padding: '10px', marginBottom: '8px', borderRadius: '4px',
                  border: '1px solid',
                  borderColor: pred.confidence === 'high' ? '#338833' :
                               pred.confidence === 'moderate' ? '#886633' : '#444',
                  backgroundColor: pred.confidence === 'high' ? '#1a2e1a' :
                                   pred.confidence === 'moderate' ? '#2e2a1a' : '#222',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
                    <strong style={{ color: '#ddd' }}>{pred.condition} → {pred.therapy?.replace(/_/g, ' ') || pred.therapy_key?.replace(/_/g, ' ')}</strong>
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                      <span style={{
                        padding: '2px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold',
                        backgroundColor: pred.confidence === 'high' ? '#338833' :
                                         pred.confidence === 'moderate' ? '#886633' : '#555',
                        color: '#fff',
                      }}>
                        {pred.confidenceScore?.toFixed(2) || pred.confidence} | {pred.predictedEffect}
                      </span>
                      {pred.queryBoost > 0 && (
                        <span style={{ padding: '2px 6px', borderRadius: '12px', fontSize: '11px', backgroundColor: '#0070f3', color: '#fff' }}>query +{pred.queryBoost.toFixed(2)}</span>
                      )}
                      {pred.interactionDelta !== 0 && pred.interactionDelta !== undefined && (
                        <span style={{ padding: '2px 6px', borderRadius: '12px', fontSize: '11px', backgroundColor: '#7a4eb8', color: '#fff' }}>interaction {pred.interactionDelta > 0 ? '+' : ''}{pred.interactionDelta.toFixed(2)}</span>
                      )}
                      {pred.clinicalEvidenceBoost > 0 && (
                        <span style={{ padding: '2px 6px', borderRadius: '12px', fontSize: '11px', backgroundColor: '#2a6e8e', color: '#fff' }}>CIViC +{pred.clinicalEvidenceBoost.toFixed(2)}</span>
                      )}
                    </div>
                  </div>
                  <p style={{ margin: '6px 0 0', fontSize: '13px', color: '#999' }}>{pred.reasoning}</p>
                </div>
              ))}
            </div>
          )}

          {/* Benchmarked Leads */}
          {benchmarkStep?.result?.benchmarkedLeads && (
            <div style={{ padding: '16px', border: '1px solid #333', borderRadius: '8px', marginBottom: '20px', backgroundColor: '#1a1a1a' }}>
              <h2 style={{ marginTop: 0, color: '#4da6ff' }}>Benchmarked Therapeutic Leads</h2>
              <p style={{ fontSize: '14px', color: '#888' }}>
                {benchmarkStep.result.totalBenchmarked} leads |
                {' '}{benchmarkStep.result.tier1Count} Tier 1 |
                {' '}{benchmarkStep.result.tier2Count} Tier 2 |
                {' '}{benchmarkStep.result.tier3Count} Tier 3
              </p>
              <p style={{ fontSize: '13px', color: '#666' }}>
                Scoring: {benchmarkStep.result.scoringMethod}
              </p>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#0070f3' }}>
                      <th style={thStyle}>Target</th>
                      <th style={thStyle}>Type</th>
                      <th style={thStyle}>Mechanism</th>
                      <th style={thStyle}>Composite</th>
                      <th style={thStyle}>Tier</th>
                      <th style={thStyle}>Confidence</th>
                    </tr>
                  </thead>
                  <tbody>
                    {benchmarkStep.result.benchmarkedLeads.map((lead, i) => (
                      <tr key={i} style={{ backgroundColor: i % 2 === 0 ? '#222' : '#1a1a1a' }}>
                        <td style={tdStyle}><strong style={{ color: '#fff' }}>{lead.primaryTarget}</strong></td>
                        <td style={tdStyle}>{lead.leadType?.replace(/_/g, ' ')}</td>
                        <td style={tdStyle}>{lead.mechanismCategory}</td>
                        <td style={tdStyle}>
                          <strong style={{ color: '#ffcc00' }}>{lead.benchmarkScore?.composite?.toFixed(3)}</strong>
                        </td>
                        <td style={tdStyle}>
                          <span style={{
                            padding: '2px 6px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold',
                            backgroundColor: lead.benchmarkScore?.tier?.includes('Tier 1') ? '#338833' :
                                             lead.benchmarkScore?.tier?.includes('Tier 2') ? '#886633' : '#555',
                            color: '#fff',
                          }}>
                            {lead.benchmarkScore?.tier}
                          </span>
                        </td>
                        <td style={tdStyle}>{lead.confidence}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Provenance Footer */}
          <div style={{ padding: '12px 16px', backgroundColor: '#0a0a0a', border: '1px solid #222', borderRadius: '8px', marginBottom: '20px', fontSize: '12px', color: '#666' }}>
            <strong style={{ color: '#888' }}>Provenance:</strong> Run {result.runId} | Started {result.startedAt} |
            {' '}Data sources: cBioPortal, OpenTargets, CIViC, DGIdb, Reactome |
            {' '}Deterministic heuristics — identical inputs produce identical outputs.
          </div>

          {/* Full Reasoning Trace */}
          <div style={{ padding: '16px', border: '1px solid #333', borderRadius: '8px', marginBottom: '20px', backgroundColor: '#1a1a1a' }}>
            <h2 style={{ marginTop: 0, color: '#4da6ff' }}>Full Reasoning Trace</h2>
            <p style={{ fontSize: '14px', color: '#888' }}>
              {result.steps?.length || 0} steps completed. Click to expand raw JSON output.
            </p>
            {result.steps?.map((step, i) => (
              <details key={i} style={{ marginBottom: '8px', border: '1px solid #333', borderRadius: '4px', padding: '8px', backgroundColor: '#222' }}>
                <summary style={{ cursor: 'pointer', fontWeight: 'bold', color: '#ddd' }}>
                  Step {i + 1}: {step.step} — {step.timestamp}
                </summary>
                <pre style={{ overflow: 'auto', fontSize: '12px', backgroundColor: '#111', padding: '8px', borderRadius: '4px', maxHeight: '400px', color: '#ccc' }}>
                  {JSON.stringify(step.result, null, 2)}
                </pre>
              </details>
            ))}
          </div>
        </div>
      )}

      {/* === Site Footer === */}
      <footer style={{ marginTop: '40px', paddingTop: '16px', borderTop: '1px solid #333', textAlign: 'center', fontSize: '12px', color: '#555' }}>
        <p>Ty Parker | INFO 603/404 Biological Data Management | Prof. Jake Y. Chen</p>
        <p>Powered by cBioPortal · OpenTargets · CIViC · DGIdb · Reactome</p>
        <p><a href="https://github.com/ParkerTy/AgenticTherapyResponsePredictor" style={{ color: '#4da6ff' }} target="_blank" rel="noopener noreferrer">GitHub Repository</a></p>
      </footer>
    </main>
  );
}

const thStyle = { padding: '8px 10px', textAlign: 'left', borderBottom: '2px solid #1a1a1a', color: '#fff', whiteSpace: 'nowrap' };
const tdStyle = { padding: '8px 10px', borderBottom: '1px solid #333', color: '#ccc', verticalAlign: 'top' };