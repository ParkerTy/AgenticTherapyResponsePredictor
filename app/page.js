'use client';

import { useState } from 'react';
import Link from 'next/link';

const DISEASE_OPTIONS = [
  { key: 'hr_pos_her2_neg', label: 'HR+/HER2- Breast Cancer' },
  { key: 'tnbc', label: 'Triple-Negative Breast Cancer (TNBC)' },
  { key: 'crc', label: 'Colorectal Cancer (CRC)' },
  { key: 'luad', label: 'Lung Adenocarcinoma (LUAD)' },
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
  luad: [
    'Predict EGFR TKI response in EGFR-mutated lung adenocarcinoma',
    'Evaluate ALK inhibitor options for ALK-rearranged NSCLC',
    'Compare immunotherapy vs targeted therapy in KRAS-mutant LUAD',
  ],
};

const DATA_SOURCES = [
  { name: 'cBioPortal', color: '#06b6d4' },
  { name: 'OpenTargets', color: '#3b82f6' },
  { name: 'CIViC', color: '#8b5cf6' },
  { name: 'DGIdb', color: '#14b8a6' },
  { name: 'Reactome', color: '#f59e0b' },
];

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
      if (!res.ok) {
        setError(data.message || data.error || 'Something went wrong');
        setResult(null);
      } else {
        setResult(data);
      }
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
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&family=Source+Sans+3:wght@300;400;500;600;700&display=swap');

        :root {
          --bg-deep: #06080f;
          --bg-base: #0b0f19;
          --bg-surface: #111827;
          --bg-elevated: #1a2236;
          --border: #1e293b;
          --border-bright: #334155;
          --text-primary: #f1f5f9;
          --text-secondary: #94a3b8;
          --text-muted: #64748b;
          --accent-cyan: #06b6d4;
          --accent-blue: #3b82f6;
          --accent-purple: #8b5cf6;
          --accent-teal: #14b8a6;
          --accent-amber: #f59e0b;
          --accent-rose: #f43f5e;
          --accent-green: #22c55e;
          --glow-cyan: rgba(6, 182, 212, 0.15);
          --glow-blue: rgba(59, 130, 246, 0.12);
          --font-display: 'JetBrains Mono', monospace;
          --font-body: 'Source Sans 3', sans-serif;
        }

        * { box-sizing: border-box; }

        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes scanline {
          0% { transform: translateY(-100%); opacity: 0; }
          20% { opacity: 0.6; }
          80% { opacity: 0.6; }
          100% { transform: translateY(400%); opacity: 0; }
        }
        @keyframes pulse { 0%, 100% { opacity: 0.4; } 50% { opacity: 1; } }
        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        .result-section {
          animation: fadeInUp 0.5s ease-out both;
        }
        .result-section:nth-child(1) { animation-delay: 0.05s; }
        .result-section:nth-child(2) { animation-delay: 0.1s; }
        .result-section:nth-child(3) { animation-delay: 0.15s; }
        .result-section:nth-child(4) { animation-delay: 0.2s; }
        .result-section:nth-child(5) { animation-delay: 0.25s; }
        .result-section:nth-child(6) { animation-delay: 0.3s; }
        .result-section:nth-child(7) { animation-delay: 0.35s; }
        .result-section:nth-child(8) { animation-delay: 0.4s; }

        .card {
          background: var(--bg-surface);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 20px 24px;
          margin-bottom: 20px;
          transition: border-color 0.3s, box-shadow 0.3s;
        }
        .card:hover {
          border-color: var(--border-bright);
          box-shadow: 0 4px 24px rgba(0, 0, 0, 0.3);
        }
        .card h2 {
          font-family: var(--font-display);
          font-size: 15px;
          font-weight: 600;
          letter-spacing: 0.5px;
          text-transform: uppercase;
          color: var(--accent-cyan);
          margin: 0 0 14px;
        }

        .data-table {
          width: 100%;
          border-collapse: separate;
          border-spacing: 0;
          font-size: 13px;
        }
        .data-table thead th {
          padding: 10px 12px;
          text-align: left;
          font-family: var(--font-display);
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.8px;
          text-transform: uppercase;
          color: var(--text-muted);
          border-bottom: 1px solid var(--border-bright);
          white-space: nowrap;
          background: var(--bg-elevated);
        }
        .data-table thead th:first-child { border-radius: 8px 0 0 0; }
        .data-table thead th:last-child { border-radius: 0 8px 0 0; }
        .data-table tbody td {
          padding: 10px 12px;
          border-bottom: 1px solid var(--border);
          color: var(--text-secondary);
          vertical-align: top;
        }
        .data-table tbody tr { transition: background 0.2s; }
        .data-table tbody tr:hover { background: var(--bg-elevated); }

        .nav-link {
          color: var(--text-muted);
          text-decoration: none;
          font-size: 13px;
          font-weight: 500;
          letter-spacing: 0.3px;
          padding: 8px 14px;
          border-radius: 6px;
          transition: color 0.2s, background 0.2s;
        }
        .nav-link:hover { color: var(--text-primary); background: rgba(255,255,255,0.04); }
        .nav-active { color: var(--accent-cyan) !important; background: var(--glow-cyan); }
      `}</style>

      <main style={{ fontFamily: 'var(--font-body)', backgroundColor: 'var(--bg-deep)', color: 'var(--text-primary)', minHeight: '100vh' }}>

        {/* ============ NAV ============ */}
        <nav style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '12px 32px', borderBottom: '1px solid var(--border)',
          backgroundColor: 'rgba(11, 15, 25, 0.85)', backdropFilter: 'blur(12px)',
          position: 'sticky', top: 0, zIndex: 100,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '8px', height: '8px', borderRadius: '50%',
              backgroundColor: 'var(--accent-cyan)',
              boxShadow: '0 0 8px var(--accent-cyan)',
              animation: 'pulse 2s ease-in-out infinite',
            }} />
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '0.5px' }}>
              ATRP
            </span>
          </div>
          <div style={{ display: 'flex', gap: '4px' }}>
            <Link href="/" className="nav-link nav-active">Home</Link>
            <Link href="/about" className="nav-link">About</Link>
            <Link href="/compare" className="nav-link">Compare</Link>
            <Link href="/interpret" className="nav-link">Interpret</Link>
            <Link href="/methods" className="nav-link">Methods</Link>
            <Link href="/history" className="nav-link">History</Link>
          </div>
        </nav>

        {/* ============ HERO ============ */}
        <div style={{
          position: 'relative', overflow: 'hidden',
          padding: '60px 32px 48px',
          background: 'linear-gradient(135deg, var(--bg-deep) 0%, #0c1529 40%, #0f1a2e 70%, var(--bg-deep) 100%)',
          borderBottom: '1px solid var(--border)',
        }}>
          {/* Scanline accent */}
          <div style={{
            position: 'absolute', top: 0, left: '50%', width: '1px', height: '100%',
            background: 'linear-gradient(180deg, transparent, var(--accent-cyan), transparent)',
            opacity: 0.15,
          }} />
          {/* Grid pattern overlay */}
          <div style={{
            position: 'absolute', inset: 0, opacity: 0.03,
            backgroundImage: 'linear-gradient(var(--accent-cyan) 1px, transparent 1px), linear-gradient(90deg, var(--accent-cyan) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }} />

          <div style={{ maxWidth: '1100px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <div style={{ width: '32px', height: '2px', background: 'var(--accent-cyan)', borderRadius: '1px' }} />
              <span style={{ fontFamily: 'var(--font-display)', fontSize: '11px', fontWeight: 600, letterSpacing: '2px', color: 'var(--accent-cyan)', textTransform: 'uppercase' }}>
                Agentic AI Scientist
              </span>
            </div>

            <h1 style={{
              fontFamily: 'var(--font-display)', fontSize: '42px', fontWeight: 700,
              lineHeight: 1.15, margin: '0 0 12px', letterSpacing: '-0.5px',
              background: 'linear-gradient(135deg, var(--text-primary) 0%, var(--accent-cyan) 60%, var(--accent-blue) 100%)',
              backgroundSize: '200% 200%',
              animation: 'gradientShift 6s ease-in-out infinite',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>
              Therapy Response<br />Predictor
            </h1>

            <p style={{ fontFamily: 'var(--font-body)', fontSize: '17px', color: 'var(--text-secondary)', maxWidth: '560px', lineHeight: 1.6, margin: '0 0 28px' }}>
              Deterministic agentic reasoning across oncology disease contexts.
              Transparent predictions. Auditable evidence. Reproducible results.
            </p>

            {/* Data source badges */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {DATA_SOURCES.map((src) => (
                <span key={src.name} style={{
                  fontFamily: 'var(--font-display)', fontSize: '11px', fontWeight: 500,
                  padding: '4px 12px', borderRadius: '20px',
                  border: `1px solid ${src.color}33`,
                  backgroundColor: `${src.color}10`,
                  color: src.color, letterSpacing: '0.3px',
                }}>
                  {src.name}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* ============ MAIN CONTENT ============ */}
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '32px 32px 60px' }}>

          {/* === QUERY PANEL === */}
          <div style={{
            background: 'var(--bg-surface)', border: '1px solid var(--border)',
            borderRadius: '12px', padding: '24px', marginBottom: '32px',
          }}>
            <div style={{ display: 'flex', gap: '16px', marginBottom: '16px', flexWrap: 'wrap' }}>
              {/* Disease Context */}
              <div style={{ flex: '0 0 280px' }}>
                <label style={{
                  fontFamily: 'var(--font-display)', fontSize: '10px', fontWeight: 600,
                  letterSpacing: '1.5px', textTransform: 'uppercase',
                  color: 'var(--text-muted)', display: 'block', marginBottom: '6px',
                }}>
                  Disease Context
                </label>
                <select
                  value={diseaseContext}
                  onChange={(e) => { setDiseaseContext(e.target.value); setShowExamples(false); }}
                  disabled={loading}
                  style={{
                    width: '100%', padding: '10px 12px', fontSize: '14px',
                    fontFamily: 'var(--font-body)', fontWeight: 500,
                    backgroundColor: 'var(--bg-elevated)', color: 'var(--text-primary)',
                    border: '1px solid var(--border-bright)', borderRadius: '8px',
                    outline: 'none', cursor: 'pointer',
                  }}
                >
                  {DISEASE_OPTIONS.map((opt) => (
                    <option key={opt.key} value={opt.key}>{opt.label}</option>
                  ))}
                </select>
              </div>

              {/* Query */}
              <div style={{ flex: 1, minWidth: '300px' }}>
                <label style={{
                  fontFamily: 'var(--font-display)', fontSize: '10px', fontWeight: 600,
                  letterSpacing: '1.5px', textTransform: 'uppercase',
                  color: 'var(--text-muted)', display: 'block', marginBottom: '6px',
                }}>
                  Query
                </label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleRun(); }}
                    disabled={loading}
                    style={{
                      flex: 1, padding: '10px 14px', fontSize: '14px',
                      fontFamily: 'var(--font-body)',
                      backgroundColor: 'var(--bg-elevated)', color: 'var(--text-primary)',
                      border: '1px solid var(--border-bright)', borderRadius: '8px',
                      outline: 'none', transition: 'border-color 0.2s, box-shadow 0.2s',
                    }}
                    onFocus={(e) => { e.target.style.borderColor = 'var(--accent-cyan)'; e.target.style.boxShadow = '0 0 0 3px var(--glow-cyan)'; }}
                    onBlur={(e) => { e.target.style.borderColor = 'var(--border-bright)'; e.target.style.boxShadow = 'none'; }}
                  />
                  <button
                    onClick={handleRun}
                    disabled={loading}
                    style={{
                      padding: '10px 28px', fontSize: '14px', fontWeight: 600,
                      fontFamily: 'var(--font-display)', letterSpacing: '0.5px',
                      backgroundColor: loading ? 'var(--bg-elevated)' : 'var(--accent-cyan)',
                      color: loading ? 'var(--text-muted)' : '#000',
                      border: 'none', borderRadius: '8px',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      display: 'flex', alignItems: 'center', gap: '8px',
                      transition: 'all 0.2s', whiteSpace: 'nowrap',
                    }}
                  >
                    {loading && <span style={{ display: 'inline-block', width: '14px', height: '14px', border: '2px solid rgba(0,0,0,0.3)', borderTopColor: '#000', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />}
                    {loading ? 'Running...' : 'Run Agent'}
                  </button>
                </div>
              </div>
            </div>

            {/* Examples */}
            <div>
              <button
                onClick={() => setShowExamples(!showExamples)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                  fontFamily: 'var(--font-display)', fontSize: '11px', fontWeight: 500,
                  color: 'var(--accent-cyan)', letterSpacing: '0.5px',
                }}
              >
                {showExamples ? '▾ Hide examples' : '▸ Show example queries'}
              </button>
              {showExamples && (
                <div style={{ marginTop: '10px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {(EXAMPLE_QUERIES[diseaseContext] || []).map((eq, i) => (
                    <button
                      key={i}
                      onClick={() => { setQuery(eq); setShowExamples(false); }}
                      style={{
                        background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                        borderRadius: '6px', color: 'var(--text-secondary)',
                        padding: '6px 12px', cursor: 'pointer', fontSize: '12px',
                        fontFamily: 'var(--font-body)', transition: 'all 0.2s',
                      }}
                      onMouseOver={(e) => { e.target.style.borderColor = 'var(--accent-cyan)'; e.target.style.color = 'var(--accent-cyan)'; }}
                      onMouseOut={(e) => { e.target.style.borderColor = 'var(--border)'; e.target.style.color = 'var(--text-secondary)'; }}
                    >
                      {eq}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {loading && (
              <div style={{
                marginTop: '16px', padding: '12px 16px', borderRadius: '8px',
                background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                display: 'flex', alignItems: 'center', gap: '12px',
              }}>
                <div style={{ width: '18px', height: '18px', border: '2px solid var(--border-bright)', borderTopColor: 'var(--accent-cyan)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                <div>
                  <div style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: 500 }}>Running 9-step agentic pipeline...</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>Querying cBioPortal, OpenTargets, CIViC, DGIdb, Reactome</div>
                </div>
              </div>
            )}
          </div>

          {/* === ERROR === */}
          {error && (
            <div style={{
              marginBottom: '20px', padding: '14px 18px', borderRadius: '10px',
              backgroundColor: 'rgba(244, 63, 94, 0.08)', border: '1px solid rgba(244, 63, 94, 0.25)',
              color: 'var(--accent-rose)', fontSize: '14px',
            }}>
              <strong>Error:</strong> {error}
            </div>
          )}

          {/* ============ RESULTS ============ */}
          {result && (
            <div>

              {/* Report Summary */}
              <div className="card result-section" style={{ borderColor: 'var(--accent-blue)', borderLeftWidth: '3px' }}>
                <h2>Report Summary</h2>
                <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', fontSize: '14px', marginBottom: '12px' }}>
                  <div>
                    <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Status</span>
                    <div style={{ color: result.status === 'completed' ? 'var(--accent-green)' : 'var(--accent-rose)', fontWeight: 600 }}>{result.status}</div>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Run ID</span>
                    <div><Link href={`/run/${result.runId}`} style={{ color: 'var(--accent-cyan)', textDecoration: 'none', fontFamily: 'var(--font-display)', fontSize: '13px' }}>{result.runId}</Link></div>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Disease</span>
                    <div style={{ fontWeight: 500 }}>{result.disease}</div>
                  </div>
                </div>
                {reportStep?.result?.summary && (
                  <p style={{ fontSize: '14px', lineHeight: 1.65, color: 'var(--text-secondary)', margin: '0 0 14px' }}>{reportStep.result.summary}</p>
                )}
                <button onClick={handleExport} style={{
                  padding: '6px 16px', fontSize: '12px', fontFamily: 'var(--font-display)', fontWeight: 500,
                  backgroundColor: 'transparent', color: 'var(--accent-cyan)',
                  border: '1px solid var(--accent-cyan)', borderRadius: '6px', cursor: 'pointer',
                  transition: 'all 0.2s', letterSpacing: '0.3px',
                }}
                  onMouseOver={(e) => { e.target.style.backgroundColor = 'var(--glow-cyan)'; }}
                  onMouseOut={(e) => { e.target.style.backgroundColor = 'transparent'; }}
                >
                  Export Report (JSON)
                </button>
              </div>

              {/* Interpreted Query */}
              {parseQueryStep?.result && (
                <div className="card result-section">
                  <h2>Interpreted Query</h2>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {(parseQueryStep.result.therapyClasses || []).map((t, i) => (
                      <span key={`t${i}`} style={{ padding: '4px 10px', backgroundColor: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.25)', borderRadius: '20px', fontSize: '12px', color: 'var(--accent-blue)', fontWeight: 500 }}>{t.replace(/_/g, ' ')}</span>
                    ))}
                    {(parseQueryStep.result.biomarkers || []).map((b, i) => (
                      <span key={`b${i}`} style={{ padding: '4px 10px', backgroundColor: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: '20px', fontSize: '12px', color: 'var(--accent-amber)', fontWeight: 500 }}>{b}</span>
                    ))}
                    {(parseQueryStep.result.clinicalSettings || []).map((c, i) => (
                      <span key={`c${i}`} style={{ padding: '4px 10px', backgroundColor: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.25)', borderRadius: '20px', fontSize: '12px', color: 'var(--accent-green)', fontWeight: 500 }}>{c.replace(/_/g, ' ')}</span>
                    ))}
                    {(parseQueryStep.result.intents || []).map((intent, i) => (
                      <span key={`i${i}`} style={{ padding: '4px 10px', backgroundColor: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.25)', borderRadius: '20px', fontSize: '12px', color: 'var(--accent-purple)', fontWeight: 500 }}>{intent}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Cohort Info */}
              {retrieveStep?.result?.cohort && (
                <div className="card result-section">
                  <h2>Cohort Data</h2>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px' }}>
                    {[
                      { label: 'Study', value: retrieveStep.result.cohort.studyName, mono: false },
                      { label: 'Study ID', value: retrieveStep.result.cohort.studyId, mono: true },
                      { label: 'Samples', value: retrieveStep.result.cohort.sampleCount, mono: true },
                      { label: 'Mutations', value: retrieveStep.result.mutations?.totalMutations || 0, mono: true },
                    ].map((item, i) => (
                      <div key={i} style={{ padding: '12px', background: 'var(--bg-elevated)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                        <div style={{ fontSize: '10px', fontFamily: 'var(--font-display)', letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '4px' }}>{item.label}</div>
                        <div style={{ fontSize: item.mono ? '16px' : '13px', fontFamily: item.mono ? 'var(--font-display)' : 'var(--font-body)', fontWeight: 600, color: 'var(--text-primary)' }}>{item.value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Evidence Table */}
              {synthesizeStep?.result?.evidenceTable && (
                <div className="card result-section">
                  <h2>Evidence Table</h2>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '-8px 0 14px', fontFamily: 'var(--font-display)', letterSpacing: '0.3px' }}>
                    cBioPortal + OpenTargets + CIViC + DGIdb + Reactome
                  </p>
                  <div style={{ overflowX: 'auto' }}>
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Gene</th>
                          <th>Mutation Freq</th>
                          <th>Assoc. Score</th>
                          <th>Pathway</th>
                          <th>Clinical Evidence</th>
                          <th>Druggable</th>
                        </tr>
                      </thead>
                      <tbody>
                        {synthesizeStep.result.evidenceTable.map((row, i) => (
                          <tr key={i}>
                            <td>
                              <strong style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)', fontSize: '13px' }}>{row.gene}</strong>
                              <br />
                              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{row.role} — {row.effect}</span>
                            </td>
                            <td>
                              <strong style={{ color: 'var(--accent-amber)', fontFamily: 'var(--font-display)' }}>{row.mutationFrequency}</strong>
                              <br />
                              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{row.mutatedSamples}/{row.totalSamples}</span>
                            </td>
                            <td>
                              <span style={{
                                fontFamily: 'var(--font-display)', fontWeight: 600,
                                color: row.diseaseAssociationScore > 0.5 ? 'var(--accent-green)' :
                                       row.diseaseAssociationScore > 0.2 ? 'var(--accent-amber)' : 'var(--accent-rose)',
                              }}>
                                {row.diseaseAssociationScore?.toFixed(3) || '0.000'}
                              </span>
                            </td>
                            <td>
                              {row.reactomeTopPathway ? (
                                <span style={{ color: 'var(--accent-purple)', fontSize: '12px' }}>{row.reactomeTopPathway}</span>
                              ) : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                            </td>
                            <td>
                              {row.civicFound ? (
                                <span style={{ color: 'var(--accent-cyan)', fontSize: '13px' }}>
                                  Level {row.civicBestLevel} <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>({row.civicEvidenceCount} items)</span>
                                  {row.civicPredictiveCount > 0 && (
                                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}><br />{row.civicPredictiveCount} predictive</span>
                                  )}
                                </span>
                              ) : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                            </td>
                            <td>
                              {row.dgidbFound && row.dgidbDrugCount > 0 ? (
                                <div>
                                  <button onClick={() => toggleDrugExpand(row.gene)} style={{
                                    background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                                    color: 'var(--accent-green)', fontWeight: 600, fontSize: '13px',
                                    fontFamily: 'var(--font-display)',
                                  }}>
                                    {row.dgidbDrugCount} drugs {expandedDrugs[row.gene] ? '▲' : '▼'}
                                  </button>
                                  {row.dgidbApprovedCount > 0 && (
                                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}> ({row.dgidbApprovedCount} approved)</span>
                                  )}
                                  {expandedDrugs[row.gene] && (
                                    <div style={{ marginTop: '8px', padding: '8px', backgroundColor: 'var(--bg-deep)', borderRadius: '6px', fontSize: '12px', border: '1px solid var(--border)' }}>
                                      {(row.dgidbDrugs || []).slice(0, 10).map((drug, di) => (
                                        <div key={di} style={{ color: drug.approved ? 'var(--accent-green)' : 'var(--text-secondary)', marginBottom: '3px' }}>
                                          {drug.approved ? '✓ ' : '• '}{drug.name}
                                          {drug.interactionTypes?.length > 0 && (
                                            <span style={{ color: 'var(--text-muted)' }}> — {drug.interactionTypes.join(', ')}</span>
                                          )}
                                        </div>
                                      ))}
                                      {(row.dgidbDrugs || []).length > 10 && (
                                        <div style={{ color: 'var(--text-muted)', marginTop: '4px' }}>...and {row.dgidbDrugs.length - 10} more</div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              ) : row.druggabilityCount > 0 ? (
                                <span style={{ color: 'var(--accent-green)', fontWeight: 600 }}>Yes ({row.druggabilityCount})</span>
                              ) : <span style={{ color: 'var(--text-muted)' }}>—</span>}
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
                <div className="card result-section">
                  <h2>Biomarker Interactions</h2>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '-8px 0 14px' }}>
                    {interactionsStep.result.firedRules.length} of {interactionsStep.result.rulesEvaluated} rules fired
                  </p>
                  {interactionsStep.result.firedRules.map((rule, i) => (
                    <div key={i} style={{
                      padding: '10px 14px', marginBottom: '8px', borderRadius: '8px',
                      backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border)',
                    }}>
                      <strong style={{ color: 'var(--accent-purple)', fontFamily: 'var(--font-display)', fontSize: '13px' }}>{rule.name || rule.id}</strong>
                      {rule.description && <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>{rule.description}</p>}
                    </div>
                  ))}
                </div>
              )}

              {/* Predictions */}
              {predictStep?.result?.predictions && (
                <div className="card result-section">
                  <h2>Therapy Response Predictions</h2>
                  <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', fontSize: '12px', color: 'var(--text-muted)', margin: '-8px 0 14px', fontFamily: 'var(--font-display)' }}>
                    <span>{predictStep.result.totalPredictions} total</span>
                    <span style={{ color: 'var(--accent-green)' }}>{predictStep.result.highConfidence} high</span>
                    <span style={{ color: 'var(--accent-amber)' }}>{predictStep.result.moderateConfidence} moderate</span>
                    <span>{predictStep.result.lowConfidence} low</span>
                    {predictStep.result.clinicalBoostsApplied > 0 && (
                      <span style={{ color: 'var(--accent-cyan)' }}>{predictStep.result.clinicalBoostsApplied} CIViC boosts</span>
                    )}
                  </div>
                  {predictStep.result.predictions.map((pred, i) => (
                    <div key={i} style={{
                      padding: '14px 16px', marginBottom: '10px', borderRadius: '10px',
                      border: '1px solid',
                      borderColor: pred.confidence === 'high' ? 'rgba(34,197,94,0.3)' :
                                   pred.confidence === 'moderate' ? 'rgba(245,158,11,0.3)' : 'var(--border)',
                      backgroundColor: pred.confidence === 'high' ? 'rgba(34,197,94,0.04)' :
                                       pred.confidence === 'moderate' ? 'rgba(245,158,11,0.04)' : 'var(--bg-elevated)',
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                        <strong style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)', fontSize: '14px' }}>
                          {pred.condition} → {pred.therapy?.replace(/_/g, ' ') || pred.therapy_key?.replace(/_/g, ' ')}
                        </strong>
                        <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                          <span style={{
                            padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 600,
                            fontFamily: 'var(--font-display)',
                            backgroundColor: pred.confidence === 'high' ? 'rgba(34,197,94,0.15)' :
                                             pred.confidence === 'moderate' ? 'rgba(245,158,11,0.15)' : 'rgba(100,116,139,0.15)',
                            color: pred.confidence === 'high' ? 'var(--accent-green)' :
                                   pred.confidence === 'moderate' ? 'var(--accent-amber)' : 'var(--text-muted)',
                            border: `1px solid ${pred.confidence === 'high' ? 'rgba(34,197,94,0.3)' : pred.confidence === 'moderate' ? 'rgba(245,158,11,0.3)' : 'var(--border)'}`,
                          }}>
                            {pred.confidenceScore?.toFixed(2) || pred.confidence} | {pred.predictedEffect}
                          </span>
                          {pred.queryBoost > 0 && (
                            <span style={{ padding: '3px 8px', borderRadius: '20px', fontSize: '10px', fontWeight: 600, backgroundColor: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)', color: 'var(--accent-blue)', fontFamily: 'var(--font-display)' }}>
                              query +{pred.queryBoost.toFixed(2)}
                            </span>
                          )}
                          {pred.interactionDelta !== 0 && pred.interactionDelta !== undefined && (
                            <span style={{ padding: '3px 8px', borderRadius: '20px', fontSize: '10px', fontWeight: 600, backgroundColor: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)', color: 'var(--accent-purple)', fontFamily: 'var(--font-display)' }}>
                              interaction {pred.interactionDelta > 0 ? '+' : ''}{pred.interactionDelta.toFixed(2)}
                            </span>
                          )}
                          {pred.clinicalEvidenceBoost > 0 && (
                            <span style={{ padding: '3px 8px', borderRadius: '20px', fontSize: '10px', fontWeight: 600, backgroundColor: 'rgba(6,182,212,0.15)', border: '1px solid rgba(6,182,212,0.3)', color: 'var(--accent-cyan)', fontFamily: 'var(--font-display)' }}>
                              CIViC +{pred.clinicalEvidenceBoost.toFixed(2)}
                            </span>
                          )}
                        </div>
                      </div>
                      <p style={{ margin: '8px 0 0', fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.5 }}>{pred.reasoning}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Benchmarked Leads */}
              {benchmarkStep?.result?.benchmarkedLeads && (
                <div className="card result-section">
                  <h2>Benchmarked Therapeutic Leads</h2>
                  <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', fontSize: '12px', color: 'var(--text-muted)', margin: '-8px 0 14px', fontFamily: 'var(--font-display)' }}>
                    <span>{benchmarkStep.result.totalBenchmarked} leads</span>
                    <span style={{ color: 'var(--accent-green)' }}>{benchmarkStep.result.tier1Count} Tier 1</span>
                    <span style={{ color: 'var(--accent-amber)' }}>{benchmarkStep.result.tier2Count} Tier 2</span>
                    <span>{benchmarkStep.result.tier3Count} Tier 3</span>
                  </div>
                  <div style={{ overflowX: 'auto' }}>
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Target</th>
                          <th>Type</th>
                          <th>Mechanism</th>
                          <th>Composite</th>
                          <th>Tier</th>
                          <th>Confidence</th>
                        </tr>
                      </thead>
                      <tbody>
                        {benchmarkStep.result.benchmarkedLeads.map((lead, i) => (
                          <tr key={i}>
                            <td><strong style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>{lead.primaryTarget}</strong></td>
                            <td>{lead.leadType?.replace(/_/g, ' ')}</td>
                            <td>{lead.mechanismCategory}</td>
                            <td>
                              <strong style={{ color: 'var(--accent-amber)', fontFamily: 'var(--font-display)' }}>
                                {lead.benchmarkScore?.composite?.toFixed(3)}
                              </strong>
                            </td>
                            <td>
                              <span style={{
                                padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 600,
                                fontFamily: 'var(--font-display)',
                                backgroundColor: lead.benchmarkScore?.tier?.includes('Tier 1') ? 'rgba(34,197,94,0.12)' :
                                                 lead.benchmarkScore?.tier?.includes('Tier 2') ? 'rgba(245,158,11,0.12)' : 'rgba(100,116,139,0.1)',
                                color: lead.benchmarkScore?.tier?.includes('Tier 1') ? 'var(--accent-green)' :
                                       lead.benchmarkScore?.tier?.includes('Tier 2') ? 'var(--accent-amber)' : 'var(--text-muted)',
                                border: `1px solid ${lead.benchmarkScore?.tier?.includes('Tier 1') ? 'rgba(34,197,94,0.3)' : lead.benchmarkScore?.tier?.includes('Tier 2') ? 'rgba(245,158,11,0.3)' : 'var(--border)'}`,
                              }}>
                                {lead.benchmarkScore?.tier}
                              </span>
                            </td>
                            <td style={{ fontWeight: 500 }}>{lead.confidence}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Provenance */}
              <div className="card result-section" style={{ background: 'var(--bg-deep)', borderStyle: 'dashed' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.8, letterSpacing: '0.2px' }}>
                  <span style={{ color: 'var(--accent-cyan)' }}>PROVENANCE</span> · Run {result.runId} · Started {result.startedAt} ·
                  Data: cBioPortal, OpenTargets, CIViC, DGIdb, Reactome ·
                  Deterministic heuristics — identical inputs produce identical outputs.
                </div>
              </div>

              {/* Full Reasoning Trace */}
              <div className="card result-section">
                <h2>Full Reasoning Trace</h2>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '-8px 0 14px' }}>
                  {result.steps?.length || 0} steps. Click to expand raw JSON.
                </p>
                {result.steps?.map((step, i) => (
                  <details key={i} style={{
                    marginBottom: '6px', border: '1px solid var(--border)', borderRadius: '8px',
                    padding: '10px 14px', backgroundColor: 'var(--bg-elevated)',
                  }}>
                    <summary style={{
                      cursor: 'pointer', fontFamily: 'var(--font-display)', fontSize: '12px',
                      fontWeight: 500, color: 'var(--text-secondary)', letterSpacing: '0.3px',
                    }}>
                      <span style={{ color: 'var(--accent-cyan)' }}>Step {i + 1}</span> · {step.step} · <span style={{ color: 'var(--text-muted)' }}>{step.timestamp}</span>
                    </summary>
                    <pre style={{
                      overflow: 'auto', fontSize: '11px', fontFamily: 'var(--font-display)',
                      backgroundColor: 'var(--bg-deep)', padding: '12px', borderRadius: '6px',
                      maxHeight: '400px', color: 'var(--text-secondary)', marginTop: '10px',
                      border: '1px solid var(--border)',
                    }}>
                      {JSON.stringify(step.result, null, 2)}
                    </pre>
                  </details>
                ))}
              </div>
            </div>
          )}

          {/* === SITE FOOTER === */}
          <footer style={{ marginTop: '48px', paddingTop: '24px', borderTop: '1px solid var(--border)', textAlign: 'center' }}>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: '11px', color: 'var(--text-muted)', letterSpacing: '0.5px', margin: '0 0 6px' }}>
              Ty Parker · INFO 603/404 Biological Data Management · Prof. Jake Y. Chen
            </p>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '0 0 6px' }}>
              Powered by cBioPortal · OpenTargets · CIViC · DGIdb · Reactome
            </p>
            <p style={{ margin: 0 }}>
              <a href="https://github.com/ParkerTy/AgenticTherapyResponsePredictor" target="_blank" rel="noopener noreferrer"
                style={{ fontFamily: 'var(--font-display)', fontSize: '11px', color: 'var(--accent-cyan)', textDecoration: 'none', letterSpacing: '0.3px' }}>
                GitHub Repository
              </a>
            </p>
          </footer>
        </div>
      </main>
    </>
  );
}