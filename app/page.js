'use client';

import { useState } from 'react';

const DISEASE_OPTIONS = [
  { key: 'hr_pos_her2_neg', label: 'HR+/HER2- Breast Cancer' },
  { key: 'tnbc', label: 'Triple-Negative Breast Cancer (TNBC)' },
  { key: 'crc', label: 'Colorectal Cancer (CRC)' },
];

export default function Home() {
  const [diseaseContext, setDiseaseContext] = useState('hr_pos_her2_neg');
  const [query, setQuery] = useState('Predict therapy response and rank lead candidates');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const runAgent = async () => {
    setLoading(true);
    setResult(null);
    setError(null);
    try {
      const res = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ diseaseContext, query }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data);
      } else {
        setResult(data);
      }
    } catch (err) {
      setError({ message: err.message });
    } finally {
      setLoading(false);
    }
  };

  // Pull individual step results out of the artifacts for rendering
  const parsedQueryStep = result?.steps?.find((s) => s.step === 'parseQuery');
  const planStep = result?.steps?.find((s) => s.step === 'plan');
  const retrieveStep = result?.steps?.find((s) => s.step === 'retrieve');
  const synthesizeStep = result?.steps?.find((s) => s.step === 'synthesize');
  const predictStep = result?.steps?.find((s) => s.step === 'predict');
  const benchmarkStep = result?.steps?.find((s) => s.step === 'benchmark');
  const reportStep = result?.steps?.find((s) => s.step === 'report');

  return (
    <main style={styles.main}>
      <nav style={styles.nav}>
        <span style={styles.navBrand}>Agentic Therapy Response Predictor</span>
        <div style={styles.navLinks}>
          <a href="/" style={styles.navLink}>Home</a>
          <span style={styles.navLinkDisabled} title="Coming in Phase 3 Step 4">History</span>
        </div>
      </nav>

      <header style={styles.header}>
        <h1 style={styles.h1}>Therapy Response Prediction & Lead Benchmarking</h1>
        <p style={styles.subtitle}>
          Reusable agentic AI workflow for oncology decision support. Inspired by BioAgents (2025).
          Deterministic, reproducible, FAIR-compliant.
        </p>
      </header>

      <section style={styles.panel}>
        <label style={styles.label}>Disease Context</label>
        <select
          style={styles.select}
          value={diseaseContext}
          onChange={(e) => setDiseaseContext(e.target.value)}
        >
          {DISEASE_OPTIONS.map((d) => (
            <option key={d.key} value={d.key}>{d.label}</option>
          ))}
        </select>

        <label style={{ ...styles.label, marginTop: 16 }}>Query</label>
        <input
          type="text"
          style={styles.input}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Try: Predict PARP inhibitor response in BRCA-mutated patients"
        />

        <button onClick={runAgent} disabled={loading} style={styles.button}>
          {loading ? 'Running agent...' : 'Run Agent'}
        </button>
      </section>

      {error && (
        <section style={styles.errorPanel}>
          <h3 style={styles.errorTitle}>
            {error.error === 'unrecognized_query' ? 'Query not recognized' : 'Error'}
          </h3>
          <p style={styles.errorMessage}>{error.message || error.error || 'Unknown error.'}</p>
          {Array.isArray(error.examples) && error.examples.length > 0 && (
            <>
              <p style={styles.errorMessage}><strong>Try one of these example queries:</strong></p>
              <ul style={styles.exampleList}>
                {error.examples.map((ex, i) => (
                  <li key={i}>
                    <button
                      type="button"
                      style={styles.exampleButton}
                      onClick={() => { setQuery(ex); setError(null); }}
                    >
                      {ex}
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>
      )}

      {result && (
        <>
          {/* Interpreted Query — NEW Phase 3 Step 1 */}
          {parsedQueryStep && (
            <section style={styles.panel}>
              <h2 style={styles.h2}>Interpreted Query</h2>
              <p style={styles.muted}>
                The agent parsed your natural-language query into structured intent. This drives downstream reasoning.
              </p>
              <div style={styles.chipsRow}>
                <ChipGroup label="Therapy Classes" items={parsedQueryStep.result.therapyClasses} color="#4da6ff" />
                <ChipGroup label="Biomarkers" items={parsedQueryStep.result.biomarkers} color="#ffcc00" />
                <ChipGroup label="Clinical Settings" items={parsedQueryStep.result.clinicalSettings} color="#66cc66" />
                <ChipGroup label="Intents" items={parsedQueryStep.result.intents} color="#cc99ff" />
              </div>
              {planStep?.result?.focusAreas && (
                <div style={{ marginTop: 12 }}>
                  <strong style={styles.muted}>Plan focus areas:</strong>
                  <ul style={styles.focusList}>
                    {planStep.result.focusAreas.map((f, i) => <li key={i}>{f}</li>)}
                  </ul>
                </div>
              )}
            </section>
          )}

          {/* Report Summary */}
          {reportStep && (
            <section style={styles.panel}>
              <h2 style={styles.h2}>{reportStep.result.title}</h2>
              <p>{reportStep.result.summary}</p>
              <p style={styles.muted}>Run ID: {result.runId} · Generated: {reportStep.result.generatedAt}</p>
            </section>
          )}

          {/* Cohort */}
          {retrieveStep?.result?.cohort && (
            <section style={styles.panel}>
              <h2 style={styles.h2}>Cohort Data</h2>
              <p>
                <strong>Study:</strong> {retrieveStep.result.cohort.name || retrieveStep.result.cohort.studyId}<br />
                <strong>Samples analyzed:</strong> {retrieveStep.result.cohort.totalSamples}
              </p>
            </section>
          )}

          {/* Evidence Table */}
          {synthesizeStep?.result?.evidenceTable && (
            <section style={styles.panel}>
              <h2 style={styles.h2}>Evidence Table</h2>
              <div style={{ overflowX: 'auto' }}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>Gene</th>
                      <th style={styles.th}>Role</th>
                      <th style={styles.th}>Mutation Freq</th>
                      <th style={styles.th}>Mutated / Total</th>
                      <th style={styles.th}>Association Score</th>
                      <th style={styles.th}>Druggable</th>
                    </tr>
                  </thead>
                  <tbody>
                    {synthesizeStep.result.evidenceTable.map((e, i) => (
                      <tr key={i}>
                        <td style={styles.td}><strong>{e.gene}</strong></td>
                        <td style={styles.td}>{e.role}</td>
                        <td style={{ ...styles.td, color: '#ffcc00' }}>{e.mutationFrequency}</td>
                        <td style={styles.td}>{e.mutatedSamples} / {e.totalSamples}</td>
                        <td style={{ ...styles.td, color: assocColor(e.diseaseAssociationScore) }}>
                          {e.diseaseAssociationScore?.toFixed(3) ?? '—'}
                        </td>
                        <td style={styles.td}>
                          {e.druggabilityCount > 0
                            ? <span style={{ color: '#66cc66' }}>Yes ({e.druggabilityCount})</span>
                            : <span style={{ color: '#888' }}>No data</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* Predictions */}
          {predictStep?.result?.predictions && (
            <section style={styles.panel}>
              <h2 style={styles.h2}>Therapy Response Predictions</h2>
              <p style={styles.muted}>
                {predictStep.result.totalPredictions} prediction(s) ·
                {' '}{predictStep.result.highConfidence} high · {predictStep.result.moderateConfidence} moderate · {predictStep.result.lowConfidence} low
                {predictStep.result.queryBoostsApplied > 0 && (
                  <> · <span style={{ color: '#4da6ff' }}>{predictStep.result.queryBoostsApplied} query-boosted</span></>
                )}
              </p>
              {predictStep.result.predictions.map((p, i) => (
                <div key={i} style={styles.predictionCard}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong>{p.biomarker} → {p.therapy}</strong>
                    <div>
                      {p.queryBoosted && (
                        <span style={{ ...styles.badge, background: '#0070f3', marginRight: 6 }}>
                          query-boosted +{p.queryBoost.toFixed(2)}
                        </span>
                      )}
                      <span style={{ ...styles.badge, background: confidenceBg(p.confidence) }}>
                        {p.confidence} ({p.confidenceScore.toFixed(2)})
                      </span>
                    </div>
                  </div>
                  <p style={{ margin: '8px 0 0 0', fontSize: 14 }}>{p.rationale}</p>
                </div>
              ))}
            </section>
          )}

          {/* Benchmarked Leads */}
          {benchmarkStep?.result?.leads && (
            <section style={styles.panel}>
              <h2 style={styles.h2}>Benchmarked Therapeutic Leads</h2>
              {benchmarkStep.result.leads.map((lead, i) => (
                <div key={i} style={styles.predictionCard}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong>{lead.leadName || lead.therapy}</strong>
                    <span style={{ ...styles.badge, background: tierBg(lead.tier) }}>
                      {lead.tier} · composite {lead.compositeScore?.toFixed?.(2) ?? lead.compositeScore}
                    </span>
                  </div>
                  <p style={{ margin: '8px 0 0 0', fontSize: 14 }}>{lead.rationale}</p>
                </div>
              ))}
            </section>
          )}

          {/* Full Reasoning Trace */}
          <section style={styles.panel}>
            <h2 style={styles.h2}>Full Reasoning Trace</h2>
            {result.steps.map((step, i) => (
              <details key={i} style={styles.details}>
                <summary style={styles.summary}>{i + 1}. {step.step} <span style={styles.muted}>({step.timestamp})</span></summary>
                <pre style={styles.pre}>{JSON.stringify(step.result, null, 2)}</pre>
              </details>
            ))}
          </section>
        </>
      )}
    </main>
  );
}

function ChipGroup({ label, items, color }) {
  return (
    <div style={{ marginRight: 24, marginBottom: 8 }}>
      <div style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>{label}</div>
      {items && items.length > 0 ? (
        items.map((it, i) => (
          <span key={i} style={{ display: 'inline-block', background: color, color: '#111', padding: '2px 8px', borderRadius: 4, marginRight: 6, marginBottom: 4, fontSize: 13 }}>
            {it}
          </span>
        ))
      ) : (
        <span style={{ fontSize: 13, color: '#666' }}>none detected</span>
      )}
    </div>
  );
}

function assocColor(s) {
  if (s == null) return '#666';
  if (s > 0.5) return '#66cc66';
  if (s > 0.2) return '#ffcc00';
  return '#ff6666';
}

function confidenceBg(c) {
  if (c === 'high') return '#2d8a2d';
  if (c === 'moderate') return '#b58a00';
  return '#555';
}

function tierBg(tier) {
  if (!tier) return '#555';
  if (tier.includes('1')) return '#2d8a2d';
  if (tier.includes('2')) return '#b58a00';
  return '#555';
}

const styles = {
  main: { background: '#111', color: '#eee', minHeight: '100vh', padding: '0 0 60px 0', fontFamily: 'system-ui, -apple-system, sans-serif' },
  nav: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 32px', background: '#1a1a1a', borderBottom: '1px solid #333' },
  navBrand: { fontWeight: 600, fontSize: 14 },
  navLinks: { display: 'flex', gap: 16 },
  navLink: { color: '#4da6ff', textDecoration: 'none', fontSize: 14 },
  navLinkDisabled: { color: '#555', fontSize: 14, cursor: 'not-allowed' },
  header: { padding: '32px' },
  h1: { margin: 0, fontSize: 28 },
  h2: { margin: '0 0 12px 0', fontSize: 20 },
  subtitle: { color: '#888', marginTop: 8 },
  panel: { background: '#1a1a1a', border: '1px solid #333', borderRadius: 8, padding: 24, margin: '16px 32px' },
  errorPanel: { background: '#2a1a1a', border: '1px solid #663333', borderRadius: 8, padding: 24, margin: '16px 32px' },
  errorTitle: { margin: '0 0 8px 0', color: '#ff6666' },
  errorMessage: { margin: '0 0 8px 0', color: '#eee' },
  exampleList: { listStyle: 'none', padding: 0, margin: 0 },
  exampleButton: { background: '#1a1a1a', border: '1px solid #4da6ff', color: '#4da6ff', padding: '6px 12px', borderRadius: 4, margin: '4px 0', cursor: 'pointer', fontSize: 14, textAlign: 'left', width: '100%' },
  label: { display: 'block', fontSize: 14, color: '#aaa', marginBottom: 6 },
  select: { width: '100%', padding: 8, background: '#111', color: '#eee', border: '1px solid #333', borderRadius: 4 },
  input: { width: '100%', padding: 8, background: '#111', color: '#eee', border: '1px solid #333', borderRadius: 4 },
  button: { marginTop: 16, padding: '10px 20px', background: '#0070f3', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 14 },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 14 },
  th: { textAlign: 'left', padding: '8px 12px', borderBottom: '1px solid #333', color: '#aaa', fontWeight: 600 },
  td: { padding: '8px 12px', borderBottom: '1px solid #2a2a2a' },
  predictionCard: { background: '#111', border: '1px solid #2a2a2a', borderRadius: 4, padding: 12, marginBottom: 10 },
  badge: { padding: '2px 8px', borderRadius: 4, fontSize: 12, color: 'white' },
  details: { marginBottom: 8, background: '#111', border: '1px solid #2a2a2a', borderRadius: 4, padding: 8 },
  summary: { cursor: 'pointer', fontWeight: 600 },
  pre: { background: '#0a0a0a', color: '#9cf', padding: 12, borderRadius: 4, overflowX: 'auto', fontSize: 12, maxHeight: 400 },
  muted: { color: '#888', fontSize: 13 },
  chipsRow: { display: 'flex', flexWrap: 'wrap', marginTop: 8 },
  focusList: { margin: '6px 0 0 0', padding: '0 0 0 18px', color: '#ccc', fontSize: 14 },
};