'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';

export default function RunDetail({ params }) {
  const { runId } = use(params);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Refinement state
  const [refineOpen, setRefineOpen] = useState(false);
  const [refineQuery, setRefineQuery] = useState('');
  const [refineLoading, setRefineLoading] = useState(false);
  const [refineError, setRefineError] = useState(null);

  useEffect(() => {
    loadRun();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runId]);

  const loadRun = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/run/${runId}`);
      const body = await res.json();
      if (!res.ok) {
        setError(body.error || 'Failed to load run');
      } else {
        setData(body);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const submitRefinement = async () => {
    setRefineLoading(true);
    setRefineError(null);
    try {
      const res = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          diseaseContext: data.run.disease_context,
          query: refineQuery,
          parentRunId: data.run.run_id,
        }),
      });
      const body = await res.json();
      if (!res.ok) {
        setRefineError(body.message || body.error || 'Refinement failed');
      } else {
        // Navigate to the newly-created child run
        window.location.href = `/run/${body.runId}`;
      }
    } catch (err) {
      setRefineError(err.message);
    } finally {
      setRefineLoading(false);
    }
  };

  const run = data?.run;
  const parent = data?.parent;
  const children = data?.children || [];
  const steps = data?.steps || [];
  const report = data?.report;

  const parsedQueryStep = steps.find((s) => s.step_name === 'parseQuery');
  const synthesizeStep = steps.find((s) => s.step_name === 'synthesize');
  const interactionsStep = steps.find((s) => s.step_name === 'interactions');
  const predictStep = steps.find((s) => s.step_name === 'predict');
  const benchmarkStep = steps.find((s) => s.step_name === 'benchmark');

  return (
    <main style={styles.main}>
      <nav style={styles.nav}>
        <strong style={{ color: '#fff', fontSize: '16px' }}>Agentic Therapy Response Predictor</strong>
        <div style={{ display: 'flex', gap: '16px', fontSize: '14px' }}>
          <Link href="/" style={{ color: '#aaa', textDecoration: 'none' }}>Home</Link>
          <Link href="/compare" style={{ color: '#aaa', textDecoration: 'none' }}>Compare</Link>
          <Link href="/interpret" style={{ color: '#aaa', textDecoration: 'none' }}>Interpret</Link>
          <Link href="/methods" style={{ color: '#aaa', textDecoration: 'none' }}>Methods</Link>
          <Link href="/history" style={{ color: '#aaa', textDecoration: 'none' }}>History</Link>
        </div>
      </nav>

      <header style={styles.header}>
        <h1 style={styles.h1}>Run Detail</h1>
        <p style={styles.subtitle}>
          Run ID: <code style={styles.code}>{runId}</code>
        </p>
      </header>

      {loading && <section style={styles.panel}><p style={styles.muted}>Loading...</p></section>}

      {error && (
        <section style={styles.errorPanel}>
          <h3 style={styles.errorTitle}>Error</h3>
          <p style={styles.errorMessage}>{error}</p>
          <p style={{ marginTop: 12 }}><a href="/history" style={styles.viewLink}>Back to History</a></p>
        </section>
      )}

      {run && (
        <>
          <section style={styles.panel}>
            <h2 style={styles.h2}>Overview</h2>
            <p><strong>Disease:</strong> {run.disease_context}</p>
            <p><strong>Status:</strong> <span style={{ ...styles.badge, background: statusBg(run.status) }}>{run.status}</span></p>
            <p><strong>Query:</strong> &quot;{run.query}&quot;</p>
            <p style={styles.muted}>
              Started: {formatDate(run.started_at)} · Completed: {formatDate(run.completed_at)}
            </p>
          </section>

          {/* Refinement Thread */}
          <section style={styles.panel}>
            <h2 style={styles.h2}>Refinement Thread</h2>
            {parent && (
              <div style={{ marginBottom: 12 }}>
                <div style={styles.muted}>Parent:</div>
                <a href={`/run/${parent.run_id}`} style={styles.threadLink}>
                  ← &quot;{parent.query}&quot; <span style={styles.muted}>({formatDate(parent.created_at)})</span>
                </a>
              </div>
            )}
            <div style={styles.threadCurrent}>
              <strong>{parent ? '↳ This run' : 'This run (top-level)'}:</strong> &quot;{run.query}&quot;
            </div>
            {children.length > 0 && (
              <div style={{ marginTop: 12 }}>
                <div style={styles.muted}>Children ({children.length}):</div>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {children.map((c) => (
                    <li key={c.id} style={{ marginLeft: 16, marginTop: 6 }}>
                      ↳ <a href={`/run/${c.run_id}`} style={styles.threadLink}>
                        &quot;{c.query}&quot; <span style={styles.muted}>({formatDate(c.created_at)})</span>
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {!refineOpen && (
              <button onClick={() => setRefineOpen(true)} style={{ ...styles.button, marginTop: 16 }}>
                Refine This Run
              </button>
            )}
            {refineOpen && (
              <div style={{ marginTop: 16, padding: 16, border: '1px solid #333', borderRadius: 4 }}>
                <label style={styles.label}>Follow-up query</label>
                <input
                  type="text"
                  style={styles.input}
                  value={refineQuery}
                  onChange={(e) => setRefineQuery(e.target.value)}
                  placeholder="e.g., Focus on CDK4/6 inhibitor response in metastatic setting"
                />
                <div style={{ marginTop: 8 }}>
                  <button onClick={submitRefinement} disabled={refineLoading || !refineQuery.trim()} style={styles.button}>
                    {refineLoading ? 'Running refinement...' : 'Run Refinement'}
                  </button>
                  <button onClick={() => { setRefineOpen(false); setRefineError(null); }} style={{ ...styles.button, marginLeft: 8, background: '#333' }}>
                    Cancel
                  </button>
                </div>
                {refineError && <p style={{ color: '#ff9999', marginTop: 8 }}>{refineError}</p>}
              </div>
            )}
          </section>

          {report && (
            <section style={styles.panel}>
              <h2 style={styles.h2}>{report.title}</h2>
              <p>{report.summary}</p>
              <p style={styles.muted}>Generated: {formatDate(report.generated_at)}</p>
            </section>
          )}

          {parsedQueryStep && (
            <section style={styles.panel}>
              <h2 style={styles.h2}>Interpreted Query</h2>
              <div style={styles.chipsRow}>
                <ChipGroup label="Therapy Classes" items={parsedQueryStep.output?.therapyClasses} color="#4da6ff" />
                <ChipGroup label="Biomarkers" items={parsedQueryStep.output?.biomarkers} color="#ffcc00" />
                <ChipGroup label="Clinical Settings" items={parsedQueryStep.output?.clinicalSettings} color="#66cc66" />
                <ChipGroup label="Intents" items={parsedQueryStep.output?.intents} color="#cc99ff" />
              </div>
            </section>
          )}

          {synthesizeStep?.output?.evidenceTable && (
            <section style={styles.panel}>
              <h2 style={styles.h2}>Evidence Table</h2>
              <div style={{ overflowX: 'auto' }}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>Gene</th>
                      <th style={styles.th}>Role</th>
                      <th style={styles.th}>Mut Freq</th>
                      <th style={styles.th}>Assoc Score</th>
                      <th style={styles.th}>Pathway</th>
                      <th style={styles.th}>Clinical Evidence</th>
                      <th style={styles.th}>Druggable</th>
                    </tr>
                  </thead>
                  <tbody>
                    {synthesizeStep.output.evidenceTable.map((e, i) => (
                      <tr key={i}>
                        <td style={styles.td}><strong>{e.gene}</strong></td>
                        <td style={styles.td}>{e.role}</td>
                        <td style={styles.td}>{e.mutationFrequency}</td>
                        <td style={styles.td}>{e.diseaseAssociationScore?.toFixed?.(3) ?? '—'}</td>
                        <td style={styles.td}><span style={{ color: '#b088d0', fontSize: 12 }}>{e.reactomeTopPathway || '—'}</span></td>
                        <td style={styles.td}>
                          {e.civicFound
                            ? <span style={{ color: '#4da6ff' }}>Level {e.civicBestLevel} ({e.civicEvidenceCount})</span>
                            : <span style={{ color: '#666' }}>—</span>}
                        </td>
                        <td style={styles.td}>
                          {e.dgidbFound && e.dgidbDrugCount > 0
                            ? <span style={{ color: '#66cc66' }}>{e.dgidbDrugCount} drugs</span>
                            : e.druggabilityCount > 0
                              ? `Yes (${e.druggabilityCount})`
                              : 'No data'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {interactionsStep?.output?.firedRules && (
            <section style={styles.panel}>
              <h2 style={styles.h2}>Biomarker Interactions</h2>
              {interactionsStep.output.firedRules.length === 0 ? (
                <p style={styles.muted}>No interaction rules triggered.</p>
              ) : (
                interactionsStep.output.firedRules.map((rule, i) => (
                  <div key={i} style={styles.predictionCard}>
                    <strong>{rule.name}</strong>
                    <p style={{ margin: '6px 0 0 0', fontSize: 13, color: '#bbb' }}>{rule.description}</p>
                  </div>
                ))
              )}
            </section>
          )}

          {predictStep?.output?.predictions && (
            <section style={styles.panel}>
              <h2 style={styles.h2}>Predictions</h2>
              {predictStep.output.predictions.map((p, i) => (
                <div key={i} style={styles.predictionCard}>
                  <strong>{p.condition} → {(p.therapy || p.therapy_key || '').replace(/_/g, ' ')}</strong>
                  <span style={{ ...styles.badge, background: confidenceBg(p.confidence), marginLeft: 8 }}>
                    {p.confidenceScore?.toFixed?.(2) || p.confidence} | {p.predictedEffect}
                  </span>
                  {p.queryBoost > 0 && <span style={{ ...styles.badge, background: '#0070f3', marginLeft: 4 }}>query +{p.queryBoost.toFixed(2)}</span>}
                  {p.interactionDelta !== 0 && p.interactionDelta !== undefined && <span style={{ ...styles.badge, background: '#7a4eb8', marginLeft: 4 }}>int {p.interactionDelta > 0 ? '+' : ''}{p.interactionDelta.toFixed(2)}</span>}
                  {p.clinicalEvidenceBoost > 0 && <span style={{ ...styles.badge, background: '#2a6e8e', marginLeft: 4 }}>CIViC +{p.clinicalEvidenceBoost.toFixed(2)}</span>}
                  <p style={{ margin: '8px 0 0 0', fontSize: 13, color: '#999' }}>{p.reasoning}</p>
                </div>
              ))}
            </section>
          )}

          {benchmarkStep?.output?.benchmarkedLeads && (
            <section style={styles.panel}>
              <h2 style={styles.h2}>Benchmarked Leads</h2>
              {benchmarkStep.output.benchmarkedLeads.map((lead, i) => (
                <div key={i} style={styles.predictionCard}>
                  <strong>{lead.primaryTarget}</strong> — {lead.mechanismCategory}
                  <span style={{ ...styles.badge, background: tierBg(lead.benchmarkScore?.tier), marginLeft: 8 }}>
                    {lead.benchmarkScore?.tier} · {lead.benchmarkScore?.composite?.toFixed?.(3)}
                  </span>
                  <p style={{ margin: '8px 0 0 0', fontSize: 13, color: '#999' }}>{lead.rationale}</p>
                </div>
              ))}
            </section>
          )}

          <section style={styles.panel}>
            <h2 style={styles.h2}>Full Reasoning Trace</h2>
            {steps.map((step, i) => (
              <details key={i} style={styles.details}>
                <summary style={styles.summary}>{i + 1}. {step.step_name} <span style={styles.muted}>({formatDate(step.timestamp)})</span></summary>
                <pre style={styles.pre}>{JSON.stringify(step.output, null, 2)}</pre>
              </details>
            ))}
          </section>
        </>
      )}

      <footer style={{ marginTop: '40px', paddingTop: '16px', borderTop: '1px solid #333', textAlign: 'center', fontSize: '12px', color: '#555' }}>
        <p>Ty Parker | INFO 603/404 Biological Data Management | Prof. Jake Y. Chen</p>
        <p>Powered by cBioPortal · OpenTargets · CIViC · DGIdb · Reactome</p>
      </footer>
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

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString();
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

function statusBg(status) {
  if (status === 'completed') return '#2d8a2d';
  if (status === 'error') return '#a33';
  return '#555';
}

const styles = {
  main: { background: '#111', color: '#eee', minHeight: '100vh', padding: '0 0 60px 0', fontFamily: 'system-ui, -apple-system, sans-serif' },
  nav: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 32px', background: '#1a1a1a', borderBottom: '1px solid #333' },
  header: { padding: '32px' },
  h1: { margin: 0, fontSize: 28 },
  h2: { margin: '0 0 12px 0', fontSize: 20 },
  subtitle: { color: '#888', marginTop: 8 },
  panel: { background: '#1a1a1a', border: '1px solid #333', borderRadius: 8, padding: 24, margin: '16px 32px' },
  errorPanel: { background: '#2a1a1a', border: '1px solid #663333', borderRadius: 8, padding: 24, margin: '16px 32px' },
  errorTitle: { margin: '0 0 8px 0', color: '#ff6666' },
  errorMessage: { margin: 0, color: '#eee' },
  label: { display: 'block', fontSize: 14, color: '#aaa', marginBottom: 6 },
  input: { width: '100%', padding: 8, background: '#111', color: '#eee', border: '1px solid #333', borderRadius: 4 },
  button: { padding: '10px 20px', background: '#0070f3', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 14 },
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
  viewLink: { color: '#4da6ff', textDecoration: 'none' },
  threadLink: { color: '#4da6ff', textDecoration: 'none', fontSize: 14 },
  threadCurrent: { padding: 8, background: '#0a2a4a', borderRadius: 4, marginTop: 4 },
  code: { background: '#0a0a0a', padding: '2px 6px', borderRadius: 3, fontFamily: 'monospace', fontSize: 13, color: '#9cf' },
};