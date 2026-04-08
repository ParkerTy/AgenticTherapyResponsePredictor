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

      if (!res.ok) {
        setError(data.error || 'Something went wrong');
      } else {
        setResult(data);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ maxWidth: '900px', margin: '0 auto', padding: '40px 20px', fontFamily: 'sans-serif' }}>
      <h1>Agentic AI Scientist</h1>
      <p>
        Therapy Response Prediction & Generative Lead Benchmarking.
        <br />
        <em>Inspired by BioAgents (2025) agentic reasoning framework.</em>
      </p>

      <hr style={{ margin: '20px 0' }} />

      <div style={{ marginBottom: '16px' }}>
        <label><strong>Disease Context:</strong></label>
        <br />
        <select
          value={diseaseContext}
          onChange={(e) => setDiseaseContext(e.target.value)}
          style={{ padding: '8px', fontSize: '16px', width: '100%', marginTop: '4px' }}
        >
          {diseaseOptions.map((opt) => (
            <option key={opt.key} value={opt.key}>{opt.label}</option>
          ))}
        </select>
      </div>

      <div style={{ marginBottom: '16px' }}>
        <label><strong>Query:</strong></label>
        <br />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{ padding: '8px', fontSize: '16px', width: '100%', marginTop: '4px' }}
        />
      </div>

      <button
        onClick={handleRun}
        disabled={loading}
        style={{
          padding: '10px 24px',
          fontSize: '16px',
          backgroundColor: loading ? '#ccc' : '#0070f3',
          color: '#fff',
          border: 'none',
          borderRadius: '4px',
          cursor: loading ? 'not-allowed' : 'pointer',
        }}
      >
        {loading ? 'Running Agent...' : 'Run Agent'}
      </button>

      {error && (
        <div style={{ marginTop: '20px', padding: '12px', backgroundColor: '#fee', border: '1px solid #c00', borderRadius: '4px' }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {result && (
        <div style={{ marginTop: '20px' }}>
          <h2>Agent Results</h2>
          <p><strong>Status:</strong> {result.status}</p>
          <p><strong>Run ID:</strong> {result.runId}</p>
          <p><strong>Disease:</strong> {result.disease}</p>
          <p><strong>Steps Completed:</strong> {result.steps?.length || 0}</p>

          <h3>Reasoning Trace</h3>
          {result.steps?.map((step, i) => (
            <details key={i} style={{ marginBottom: '8px', border: '1px solid #ddd', borderRadius: '4px', padding: '8px' }}>
              <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>
                Step {i + 1}: {step.step} — {step.timestamp}
              </summary>
              <pre style={{ overflow: 'auto', fontSize: '13px', backgroundColor: '#f5f5f5', padding: '8px', borderRadius: '4px' }}>
                {JSON.stringify(step.result, null, 2)}
              </pre>
            </details>
          ))}
        </div>
      )}
    </main>
  );
}
