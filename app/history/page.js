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
    const controller = new AbortController();
    loadRuns(filterDisease, controller.signal);
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterDisease]);

  const loadRuns = async (disease, signal) => {
    setLoading(true); setError(null);
    try {
      const url = disease ? `/api/history?diseaseContext=${encodeURIComponent(disease)}&limit=100` : `/api/history?limit=100`;
      const res = await fetch(url, { signal }); const data = await res.json();
      if (!res.ok) { setError(data.error || 'Failed to load history'); setRuns([]); }
      else { setRuns(data.runs || []); }
    } catch (err) {
      if (err.name === 'AbortError') return;
      setError(err.message);
    }
    finally { if (!signal?.aborted) setLoading(false); }
  };

  return (
    <main style={{ fontFamily: 'var(--font-body)', backgroundColor: 'var(--bg-deep)', color: 'var(--text-primary)', minHeight: '100vh' }}>

      <nav className="site-nav">
        <Link href="/" className="nav-logo"><div className="nav-logo-dot" /><span className="nav-logo-text">ATRP</span></Link>
        <div className="nav-links">
          <Link href="/" className="nav-link">Home</Link>
          <Link href="/about" className="nav-link">About</Link>
          <Link href="/compare" className="nav-link">Compare</Link>
          <Link href="/interpret" className="nav-link">Interpret</Link>
          <Link href="/methods" className="nav-link">Methods</Link>
          <Link href="/history" className="nav-link nav-active">History</Link>
        </div>
      </nav>

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <div style={{ width: '32px', height: '2px', background: 'var(--accent-cyan)', borderRadius: '1px' }} />
          <span className="label-upper" style={{ color: 'var(--accent-cyan)' }}>Provenance & Audit</span>
        </div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '28px', fontWeight: 700, margin: '0 0 6px', color: 'var(--text-primary)' }}>Run History</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '24px', maxWidth: '700px' }}>
          Every agent execution is logged for reproducibility and audit. Click any run to view its full reasoning trace or refine it with a follow-up query.
        </p>

        {/* Filter */}
        <div className="card" style={{ marginBottom: '20px' }}>
          <label className="label-upper" style={{ display: 'block', marginBottom: '6px' }}>Filter by disease context</label>
          <select value={filterDisease} onChange={(e) => setFilterDisease(e.target.value)}
            style={{ width: '100%', maxWidth: '400px', padding: '10px 12px', fontSize: '14px', fontFamily: 'var(--font-body)', backgroundColor: 'var(--bg-elevated)', color: 'var(--text-primary)', border: '1px solid var(--border-bright)', borderRadius: '8px', outline: 'none' }}>
            <option value="">All disease contexts</option>
            <option value="hr_pos_her2_neg">HR+/HER2- Breast Cancer</option>
            <option value="tnbc">Triple-Negative Breast Cancer</option>
            <option value="crc">Colorectal Cancer</option>
            <option value="luad">Lung Adenocarcinoma</option>
          </select>
        </div>

        {/* Loading */}
        {loading && (
          <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '18px', height: '18px', border: '2px solid var(--border-bright)', borderTopColor: 'var(--accent-cyan)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            <span style={{ color: 'var(--text-muted)', fontSize: '13px', fontFamily: 'var(--font-display)' }}>Loading history from Supabase...</span>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="card" style={{ borderColor: 'rgba(244,63,94,0.3)', backgroundColor: 'rgba(244,63,94,0.04)' }}>
            <h3 style={{ margin: '0 0 6px', fontSize: '14px', color: 'var(--accent-rose)', fontFamily: 'var(--font-display)' }}>Error loading history</h3>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)' }}>{error}</p>
          </div>
        )}

        {/* Empty */}
        {!loading && !error && runs.length === 0 && (
          <div className="card">
            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '13px' }}>No runs found for the selected filter.</p>
          </div>
        )}

        {/* Results */}
        {!loading && runs.length > 0 && (
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h2 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: '15px', fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase', color: 'var(--accent-cyan)' }}>
                {runs.length} Run{runs.length !== 1 ? 's' : ''}
              </h2>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>When</th>
                    <th>Disease</th>
                    <th>Query</th>
                    <th>Status</th>
                    <th>Refined?</th>
                    <th>View</th>
                  </tr>
                </thead>
                <tbody>
                  {runs.map((r) => (
                    <tr key={r.id}>
                      <td style={{ fontFamily: 'var(--font-display)', fontSize: '12px', whiteSpace: 'nowrap' }}>{formatDate(r.created_at)}</td>
                      <td>{DISEASE_LABELS[r.disease_context] || r.disease_context}</td>
                      <td style={{ maxWidth: 360, overflow: 'hidden', textOverflow: 'ellipsis' }} title={r.query}>{r.query}</td>
                      <td>
                        <span className="pill" style={{
                          backgroundColor: r.status === 'completed' ? 'rgba(34,197,94,0.12)' : r.status === 'error' ? 'rgba(244,63,94,0.12)' : 'rgba(100,116,139,0.1)',
                          color: r.status === 'completed' ? 'var(--accent-green)' : r.status === 'error' ? 'var(--accent-rose)' : 'var(--text-muted)',
                          border: `1px solid ${r.status === 'completed' ? 'rgba(34,197,94,0.3)' : r.status === 'error' ? 'rgba(244,63,94,0.3)' : 'var(--border)'}`,
                          fontSize: '11px', padding: '2px 10px',
                        }}>
                          {r.status}
                        </span>
                      </td>
                      <td style={{ fontSize: '12px' }}>
                        {r.parent_run_id
                          ? <span style={{ color: 'var(--text-muted)' }}>child of <code style={{ background: 'var(--bg-deep)', padding: '1px 5px', borderRadius: '4px', fontFamily: 'var(--font-display)', fontSize: '11px', color: 'var(--accent-cyan)' }}>{r.parent_run_id.slice(-8)}</code></span>
                          : <span style={{ color: 'var(--text-muted)' }}>top-level</span>}
                      </td>
                      <td>
                        <a href={`/run/${r.run_id}`} style={{ color: 'var(--accent-cyan)', textDecoration: 'none', fontFamily: 'var(--font-display)', fontSize: '12px', fontWeight: 500 }}>Open →</a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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

function formatDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleString();
}