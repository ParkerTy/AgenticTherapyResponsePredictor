'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

const DISEASE_LABELS = {
  hr_pos_her2_neg: 'HR+/HER2- Breast Cancer',
  tnbc: 'Triple-Negative Breast Cancer',
  crc: 'Colorectal Cancer',
  luad: 'Lung Adenocarcinoma',
  'HR+/HER2-': 'HR+/HER2- Breast Cancer',
  'TNBC': 'Triple-Negative Breast Cancer',
  'CRC': 'Colorectal Cancer',
  'Lung Adenocarcinoma': 'Lung Adenocarcinoma',
};

export default function History() {
  const [runs, setRuns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterDisease, setFilterDisease] = useState('');

  useEffect(() => {
    loadRuns(filterDisease);
  }, [filterDisease]);

  const loadRuns = async (disease) => {
    setLoading(true);
    setError(null);
    try {
      const url = disease
        ? `/api/history?diseaseContext=${encodeURIComponent(disease)}&limit=100`
        : `/api/history?limit=100`;
      const res = await fetch(url);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to load history');
        setRuns([]);
      } else {
        setRuns(data.runs || []);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={styles.main}>
      <nav style={styles.nav}>
        <strong style={{ color: '#fff', fontSize: '16px' }}>Agentic Therapy Response Predictor</strong>
        <div style={{ display: 'flex', gap: '16px', fontSize: '14px' }}>
          <Link href="/" style={{ color: '#aaa', textDecoration: 'none' }}>Home</Link>
          <Link href="/compare" style={{ color: '#aaa', textDecoration: 'none' }}>Compare</Link>
          <Link href="/interpret" style={{ color: '#aaa', textDecoration: 'none' }}>Interpret</Link>
          <Link href="/methods" style={{ color: '#aaa', textDecoration: 'none' }}>Methods</Link>
          <Link href="/history" style={{ color: '#4da6ff', textDecoration: 'none' }}>History</Link>
        </div>
      </nav>

      <header style={styles.header}>
        <h1 style={styles.h1}>Run History</h1>
        <p style={styles.subtitle}>
          Every agent execution is logged for reproducibility and audit. Click any run to view its full reasoning trace or refine it with a follow-up query.
        </p>
      </header>

      <section style={styles.panel}>
        <label style={styles.label}>Filter by disease context</label>
        <select
          style={styles.select}
          value={filterDisease}
          onChange={(e) => setFilterDisease(e.target.value)}
        >
          <option value="">All disease contexts</option>
          <option value="hr_pos_her2_neg">HR+/HER2- Breast Cancer</option>
          <option value="tnbc">Triple-Negative Breast Cancer</option>
          <option value="crc">Colorectal Cancer</option>
          <option value="luad">Lung Adenocarcinoma</option>
        </select>
      </section>

      {loading && <section style={styles.panel}><p style={styles.muted}>Loading...</p></section>}

      {error && (
        <section style={styles.errorPanel}>
          <h3 style={styles.errorTitle}>Error loading history</h3>
          <p style={styles.errorMessage}>{error}</p>
        </section>
      )}

      {!loading && !error && runs.length === 0 && (
        <section style={styles.panel}>
          <p style={styles.muted}>No runs found for the selected filter.</p>
        </section>
      )}

      {!loading && runs.length > 0 && (
        <section style={styles.panel}>
          <h2 style={styles.h2}>{runs.length} run(s)</h2>
          <div style={{ overflowX: 'auto' }}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>When</th>
                  <th style={styles.th}>Disease</th>
                  <th style={styles.th}>Query</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Refined?</th>
                  <th style={styles.th}>View</th>
                </tr>
              </thead>
              <tbody>
                {runs.map((r) => (
                  <tr key={r.id}>
                    <td style={styles.td}>{formatDate(r.created_at)}</td>
                    <td style={styles.td}>{DISEASE_LABELS[r.disease_context] || r.disease_context}</td>
                    <td style={{ ...styles.td, maxWidth: 360, overflow: 'hidden', textOverflow: 'ellipsis' }} title={r.query}>
                      {r.query}
                    </td>
                    <td style={styles.td}>
                      <span style={{ ...styles.badge, background: statusBg(r.status) }}>{r.status}</span>
                    </td>
                    <td style={styles.td}>
                      {r.parent_run_id
                        ? <span style={styles.muted}>child of <code style={styles.code}>{r.parent_run_id.slice(-8)}</code></span>
                        : <span style={styles.muted}>top-level</span>}
                    </td>
                    <td style={styles.td}>
                      <a href={`/run/${r.run_id}`} style={styles.viewLink}>Open</a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <footer style={{ marginTop: '40px', paddingTop: '16px', borderTop: '1px solid #333', textAlign: 'center', fontSize: '12px', color: '#555' }}>
        <p>Ty Parker | INFO 603/404 Biological Data Management | Prof. Jake Y. Chen</p>
        <p>Powered by cBioPortal · OpenTargets · CIViC · DGIdb · Reactome</p>
      </footer>
    </main>
  );
}

function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleString();
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
  select: { width: '100%', padding: 8, background: '#111', color: '#eee', border: '1px solid #333', borderRadius: 4, maxWidth: 400 },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 14 },
  th: { textAlign: 'left', padding: '8px 12px', borderBottom: '1px solid #333', color: '#aaa', fontWeight: 600 },
  td: { padding: '8px 12px', borderBottom: '1px solid #2a2a2a' },
  badge: { padding: '2px 8px', borderRadius: 4, fontSize: 12, color: 'white' },
  muted: { color: '#888', fontSize: 13 },
  code: { background: '#0a0a0a', padding: '1px 4px', borderRadius: 3, fontFamily: 'monospace', fontSize: 12, color: '#9cf' },
  viewLink: { color: '#4da6ff', textDecoration: 'none' },
};