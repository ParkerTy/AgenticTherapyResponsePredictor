'use client';

import { useState } from 'react';

const diseaseOptions = [
  { key: 'hr_pos_her2_neg', label: 'HR+/HER2- Breast Cancer' },
  { key: 'tnbc', label: 'Triple-Negative Breast Cancer (TNBC)' },
  { key: 'crc', label: 'Colorectal Cancer (CRC)' },
];

export default function Home() {
  const [diseaseContext, setDiseaseContext] = useState('hr_pos_her2_neg');
  const [query, setQuery] = useState('Predict therapy response and benchmark leads');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleRun() {
    setLoading(true);
    setError(null);
    setResult(null);
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

  const retrieveStep = result?.steps?.find((s) => s.step === 'retrieve');
  const synthesizeStep = result?.steps?.find((s) => s.step === 'synthesize');
  const predictStep = result?.steps?.find((s) => s.step === 'predict');
  const benchmarkStep = result?.steps?.find((s) => s.step === 'benchmark');
  const reportStep = result?.steps?.find((s) => s.step === 'report');

  return (
    <main style={{ maxWidth: '1000px', margin: '0 auto', padding: '40px 20px', fontFamily: 'sans-serif', color: '#e0e0e0', backgroundColor: '#111', minHeight: '100vh' }}>
      <h1 style={{ color: '#fff' }}>Agentic AI Scientist</h1>
      <p style={{ color: '#aaa' }}>
        Therapy Response Prediction & Generative Lead Benchmarking.
        <br />
        <em>Inspired by BioAgents (2025) agentic reasoning framework.</em>
      </p>

      <hr style={{ margin: '20px 0', borderColor: '#333' }} />

      <div style={{ marginBottom: '16px' }}>
        <label><strong style={{ color: '#fff' }}>Disease Context:</strong></label>
        <br />
        <select
          value={diseaseContext}
          onChange={(e) => setDiseaseContext(e.target.value)}
          style={{ padding: '8px', fontSize: '16px', width: '100%', marginTop: '4px', backgroundColor: '#222', color: '#fff', border: '1px solid #444', borderRadius: '4px' }}
        >
          {diseaseOptions.map((opt) => (
            <option key={opt.key} value={opt.key}>{opt.label}</option>
          ))}
        </select>
      </div>

      <div style={{ marginBottom: '16px' }}>
        <label><strong style={{ color: '#fff' }}>Query:</strong></label>
        <br />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{ padding: '8px', fontSize: '16px', width: '100%', marginTop: '4px', backgroundColor: '#222', color: '#fff', border: '1px solid #444', borderRadius: '4px' }}
        />
      </div>

      <button
        onClick={handleRun}
        disabled={loading}
        style={{
          padding: '10px 24px', fontSize: '16px',
          backgroundColor: loading ? '#555' : '#0070f3', color: '#fff',
          border: 'none', borderRadius: '4px',
          cursor: loading ? 'not-allowed' : 'pointer',
        }}
      >
        {loading ? 'Running Agent (this may take 15-30s)...' : 'Run Agent'}
      </button>

      {error && (
        <div style={{ marginTop: '20px', padding: '12px', backgroundColor: '#3a1111', border: '1px solid #cc3333', borderRadius: '4px', color: '#ff8888' }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {result && (
        <div style={{ marginTop: '20px' }}>
          {/* === Report Summary === */}
          <div style={{ padding: '16px', backgroundColor: '#1a2a3a', border: '1px solid #0070f3', borderRadius: '8px', marginBottom: '20px' }}>
            <h2 style={{ marginTop: 0, color: '#4da6ff' }}>Report Summary</h2>
            <p><strong style={{ color: '#ccc' }}>Status:</strong> <span style={{ color: '#66cc66' }}>{result.status}</span></p>
            <p><strong style={{ color: '#ccc' }}>Run ID:</strong> {result.runId}</p>
            <p><strong style={{ color: '#ccc' }}>Disease:</strong> {result.disease}</p>
            {reportStep?.result?.summary && (
              <p style={{ fontSize: '15px', lineHeight: '1.5', color: '#ddd' }}>{reportStep.result.summary}</p>
            )}
          </div>

          {/* === Cohort Info === */}
          {retrieveStep?.result?.cohort && (
            <div style={{ padding: '16px', border: '1px solid #333', borderRadius: '8px', marginBottom: '20px', backgroundColor: '#1a1a1a' }}>
              <h2 style={{ marginTop: 0, color: '#4da6ff' }}>Cohort Data (cBioPortal)</h2>
              <p><strong style={{ color: '#ccc' }}>Study:</strong> {retrieveStep.result.cohort.studyName}</p>
              <p><strong style={{ color: '#ccc' }}>Study ID:</strong> {retrieveStep.result.cohort.studyId}</p>
              <p><strong style={{ color: '#ccc' }}>Samples:</strong> {retrieveStep.result.cohort.sampleCount}</p>
              <p><strong style={{ color: '#ccc' }}>Total Mutations Found:</strong> {retrieveStep.result.mutations?.totalMutations || 0}</p>
            </div>
          )}

          {/* === Evidence Table === */}
          {synthesizeStep?.result?.evidenceTable && (
            <div style={{ padding: '16px', border: '1px solid #333', borderRadius: '8px', marginBottom: '20px', backgroundColor: '#1a1a1a' }}>
              <h2 style={{ marginTop: 0, color: '#4da6ff' }}>Evidence Table</h2>
              <p style={{ fontSize: '14px', color: '#888' }}>
                Sources: cBioPortal + OpenTargets | Study: {synthesizeStep.result.summary?.studyName}
              </p>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#0070f3' }}>
                      <th style={thStyle}>Gene</th>
                      <th style={thStyle}>Role</th>
                      <th style={thStyle}>Effect</th>
                      <th style={thStyle}>Mutation Freq</th>
                      <th style={thStyle}>Mutated Samples</th>
                      <th style={thStyle}>Disease Assoc. Score</th>
                      <th style={thStyle}>Druggable</th>
                    </tr>
                  </thead>
                  <tbody>
                    {synthesizeStep.result.evidenceTable.map((row, i) => (
                      <tr key={i} style={{ backgroundColor: i % 2 === 0 ? '#222' : '#1a1a1a' }}>
                        <td style={tdStyle}><strong style={{ color: '#fff' }}>{row.gene}</strong></td>
                        <td style={tdStyle}>{row.role}</td>
                        <td style={tdStyle}>{row.effect}</td>
                        <td style={tdStyle}><strong style={{ color: '#ffcc00' }}>{row.mutationFrequency}</strong></td>
                        <td style={tdStyle}>{row.mutatedSamples} / {row.totalSamples}</td>
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
                          {row.druggabilityCount > 0 ? (
                            <span style={{ color: '#66cc66', fontWeight: 'bold' }}>Yes ({row.druggabilityCount})</span>
                          ) : (
                            <span style={{ color: '#888' }}>No data</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* === Predictions === */}
          {predictStep?.result?.predictions && (
            <div style={{ padding: '16px', border: '1px solid #333', borderRadius: '8px', marginBottom: '20px', backgroundColor: '#1a1a1a' }}>
              <h2 style={{ marginTop: 0, color: '#4da6ff' }}>Therapy Response Predictions</h2>
              <p style={{ fontSize: '14px', color: '#888' }}>
                {predictStep.result.totalPredictions} predictions |
                {' '}{predictStep.result.highConfidence} high |
                {' '}{predictStep.result.moderateConfidence} moderate |
                {' '}{predictStep.result.lowConfidence} low confidence
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
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                    <strong style={{ color: '#ddd' }}>{pred.condition} → {pred.therapy.replace(/_/g, ' ')}</strong>
                    <span style={{
                      padding: '2px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold',
                      backgroundColor: pred.confidence === 'high' ? '#338833' :
                                       pred.confidence === 'moderate' ? '#886633' : '#555',
                      color: '#fff',
                    }}>
                      {pred.confidence} | {pred.predictedEffect}
                    </span>
                  </div>
                  <p style={{ margin: '6px 0 0', fontSize: '13px', color: '#999' }}>{pred.reasoning}</p>
                </div>
              ))}
            </div>
          )}

          {/* === Benchmarked Leads === */}
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
                        <td style={tdStyle}>{lead.leadType.replace(/_/g, ' ')}</td>
                        <td style={tdStyle}>{lead.mechanismCategory}</td>
                        <td style={tdStyle}>
                          <strong style={{ color: '#ffcc00' }}>{lead.benchmarkScore.composite.toFixed(3)}</strong>
                        </td>
                        <td style={tdStyle}>
                          <span style={{
                            padding: '2px 6px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold',
                            backgroundColor: lead.benchmarkScore.tier.includes('Tier 1') ? '#338833' :
                                             lead.benchmarkScore.tier.includes('Tier 2') ? '#886633' : '#555',
                            color: '#fff',
                          }}>
                            {lead.benchmarkScore.tier}
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

          {/* === Raw Reasoning Trace === */}
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
    </main>
  );
}

const thStyle = { padding: '8px 10px', textAlign: 'left', borderBottom: '2px solid #1a1a1a', color: '#fff' };
const tdStyle = { padding: '8px 10px', borderBottom: '1px solid #333', color: '#ccc' };