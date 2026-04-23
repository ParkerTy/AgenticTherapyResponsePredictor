'use client';

import Link from 'next/link';

const CITATIONS = [
  {
    id: 'bioagents',
    label: 'Primary Agentic Framework',
    title: 'BioAgents: Democratizing Bioinformatics Analysis with Multi-Agent Systems',
    authors: 'Mehandru, N. et al.',
    journal: 'Scientific Reports',
    year: '2025',
    detail: '15:39036',
    color: 'var(--accent-cyan)',
    role: 'The architectural blueprint for this system\'s multi-step agentic reasoning loop. BioAgents demonstrates how modular AI agents can orchestrate bioinformatics workflows with tool calls, evidence retrieval, and iterative refinement. Our system implements this pattern with a 9-step deterministic pipeline: parseQuery → plan → retrieve → synthesize → interactions → predict → generateLeads → benchmark → report.',
  },
  {
    id: 'anchoring',
    label: 'Design Rationale',
    title: 'Agentic AI: Teaching Machines to Think Like Scientists',
    authors: 'Drug Target Review',
    journal: 'Drug Target Review',
    year: '2024',
    detail: 'Perspective article',
    color: 'var(--accent-blue)',
    role: 'The anchoring paper motivating the need for AI systems that iteratively plan, retrieve evidence, test predictions, and refine conclusions — behaving like a scientific workflow rather than a single-step model. This project adopts that framing to build a transparent, auditable agent.',
  },
  {
    id: 'civic',
    label: 'Clinical Evidence',
    title: 'CIViC MCP: A Model Context Protocol Server for Clinical Interpretation of Variants in Cancer',
    authors: 'Schimmelpfennig, J. et al.',
    journal: 'bioRxiv',
    year: '2025',
    detail: 'October 2025 preprint',
    color: 'var(--accent-purple)',
    role: 'CIViC provides expert-curated clinical evidence levels (A–E) for gene-disease-therapy associations. Integrated as a primary clinical evidence source with a +0.10 confidence boost for Level A/B evidence.',
  },
  {
    id: 'reactome',
    label: 'Pathway Context',
    title: 'Reactome: Updated Knowledgebase for Biological Pathways',
    authors: 'Ragueneau, E. et al.',
    journal: 'Nucleic Acids Research',
    year: '2025',
    detail: 'November 2025',
    color: 'var(--accent-teal)',
    role: 'Provides biological pathway context per gene (e.g., PI3K Cascade, meiotic recombination). Replaced BioContext.ai — the LOI noted BioContext was "an evidence augmentation step rather than a hard dependency."',
  },
  {
    id: 'zhou',
    label: 'Agentic Survey',
    title: 'Agentic AI in Bioinformatics: A Comprehensive Survey',
    authors: 'Zhou, Y. et al.',
    journal: 'Survey paper',
    year: '2025',
    detail: '',
    color: 'var(--accent-amber)',
    role: 'Comprehensive survey of agentic approaches in bioinformatics. Cited for contextualizing our system within the broader landscape of AI-driven scientific workflows.',
  },
];

const DATA_SOURCES = [
  {
    name: 'cBioPortal',
    type: 'REST API',
    url: 'https://www.cbioportal.org/api',
    provides: 'TCGA cohort data, somatic mutation profiles, mutation frequencies',
    color: 'var(--accent-cyan)',
    free: true,
  },
  {
    name: 'OpenTargets',
    type: 'GraphQL API',
    url: 'https://api.platform.opentargets.org',
    provides: 'Target-disease association scores, datatype evidence breakdown, tractability',
    color: 'var(--accent-blue)',
    free: true,
  },
  {
    name: 'CIViC',
    type: 'GraphQL API',
    url: 'https://civicdb.org/api/graphql',
    provides: 'Expert-curated clinical evidence levels (A–E), evidence types, therapies',
    color: 'var(--accent-purple)',
    free: true,
  },
  {
    name: 'DGIdb',
    type: 'GraphQL API',
    url: 'https://dgidb.org/api/graphql',
    provides: 'Drug-gene interactions, FDA approval status, interaction types',
    color: 'var(--accent-teal)',
    free: true,
  },
  {
    name: 'Reactome',
    type: 'REST API',
    url: 'https://reactome.org/ContentService',
    provides: 'Biological pathway context per gene, pathway counts',
    color: 'var(--accent-amber)',
    free: true,
  },
  {
    name: 'Supabase',
    type: 'PostgreSQL',
    url: 'https://supabase.com',
    provides: 'Agent run logs, tool call provenance, evidence items, reports — 6 tables',
    color: 'var(--accent-green)',
    free: true,
  },
];

export default function AboutPage() {
  return (
    <main style={{ fontFamily: 'var(--font-body)', backgroundColor: 'var(--bg-deep)', color: 'var(--text-primary)', minHeight: '100vh' }}>

      {/* Nav */}
      <nav className="site-nav">
        <Link href="/" className="nav-logo">
          <div className="nav-logo-dot" />
          <span className="nav-logo-text">ATRP</span>
        </Link>
        <div className="nav-links">
          <Link href="/" className="nav-link">Home</Link>
          <Link href="/about" className="nav-link nav-active">About</Link>
          <Link href="/compare" className="nav-link">Compare</Link>
          <Link href="/interpret" className="nav-link">Interpret</Link>
          <Link href="/methods" className="nav-link">Methods</Link>
          <Link href="/history" className="nav-link">History</Link>
        </div>
      </nav>

      {/* Hero */}
      <div style={{
        position: 'relative', overflow: 'hidden',
        padding: '60px 32px 48px',
        background: 'linear-gradient(135deg, var(--bg-deep) 0%, #0c1529 40%, #0f1a2e 70%, var(--bg-deep) 100%)',
        borderBottom: '1px solid var(--border)',
      }}>
        <div style={{
          position: 'absolute', inset: 0, opacity: 0.03,
          backgroundImage: 'linear-gradient(var(--accent-cyan) 1px, transparent 1px), linear-gradient(90deg, var(--accent-cyan) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }} />
        <div style={{ maxWidth: '900px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <div style={{ width: '32px', height: '2px', background: 'var(--accent-cyan)', borderRadius: '1px' }} />
            <span className="label-upper" style={{ color: 'var(--accent-cyan)' }}>About This Project</span>
          </div>
          <h1 style={{
            fontFamily: 'var(--font-display)', fontSize: '32px', fontWeight: 700,
            lineHeight: 1.3, margin: '0 0 16px', color: 'var(--text-primary)',
          }}>
            A Reusable Agentic AI Scientist for Therapy Response Prediction
          </h1>
          <p style={{ fontSize: '17px', color: 'var(--text-secondary)', maxWidth: '700px', lineHeight: 1.7 }}>
            This system addresses a fundamental gap in open-source drug discovery: the lack of
            transparent, reproducible, end-to-end agentic systems that can formulate hypotheses,
            retrieve and reconcile evidence, generate testable predictions, and benchmark candidate
            therapeutic ideas in a traceable workflow.
          </p>
        </div>
      </div>

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '32px 32px 60px' }}>

        {/* Scientific Question */}
        <div className="card" style={{ borderLeft: '3px solid var(--accent-cyan)', animation: 'fadeInUp 0.5s ease-out both' }}>
          <h2>Scientific Question</h2>
          <blockquote style={{
            margin: 0, padding: '16px 20px',
            borderRadius: '8px', backgroundColor: 'var(--bg-elevated)',
            fontSize: '16px', lineHeight: 1.7, color: 'var(--text-primary)',
            fontStyle: 'italic',
          }}>
            Can a general-purpose agentic AI workflow integrate open-source clinical, genomic,
            pathway, and drug–target knowledge to (1) predict therapy response patterns and
            (2) benchmark newly proposed therapeutic leads, while maintaining transparency,
            reproducibility, and auditability across disease contexts?
          </blockquote>
          <p style={{ marginTop: '14px', fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            This question was formulated in the Letter of Intent (February 2026) and guides every
            architectural decision. The system is designed to be <strong style={{ color: 'var(--text-primary)' }}>disease-agnostic
            by architecture</strong> — a specific oncology cohort (HR+/HER2− breast cancer) serves
            as the initial demonstration, but the agent supports multiple disease contexts through
            configuration rather than disease-specific hardcoding. Currently, four disease contexts
            are implemented: HR+/HER2− Breast Cancer, TNBC, Colorectal Cancer, and Lung Adenocarcinoma.
          </p>
        </div>

        {/* Problem Statement */}
        <div className="card" style={{ animation: 'fadeInUp 0.5s ease-out 0.05s both' }}>
          <h2>Problem Statement</h2>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.7, margin: '0 0 12px' }}>
            Open-source drug discovery is increasingly capable of assembling multimodal biomedical data,
            but it still lacks transparent, reproducible, end-to-end agentic systems that can:
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            {[
              { num: 'i', text: 'Formulate and refine hypotheses' },
              { num: 'ii', text: 'Retrieve and reconcile evidence' },
              { num: 'iii', text: 'Generate testable predictions' },
              { num: 'iv', text: 'Benchmark candidates in a traceable workflow' },
            ].map((item) => (
              <div key={item.num} style={{
                padding: '12px 14px', borderRadius: '8px',
                backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border)',
                display: 'flex', gap: '10px', alignItems: 'flex-start',
              }}>
                <span style={{
                  fontFamily: 'var(--font-display)', fontSize: '11px', fontWeight: 700,
                  color: 'var(--accent-cyan)', minWidth: '20px',
                }}>({item.num})</span>
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{item.text}</span>
              </div>
            ))}
          </div>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.7, marginTop: '14px' }}>
            Many existing approaches are proprietary, difficult to reproduce, or limited to single-step
            analytics. This project builds an iterative &quot;scientist-in-the-loop&quot; system that logs every
            step, source, and decision point for full auditability.
          </p>
        </div>

        {/* What This System Does NOT Do */}
        <div className="card" style={{ animation: 'fadeInUp 0.5s ease-out 0.1s both' }}>
          <h2>Design Boundaries</h2>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.7, margin: '0 0 12px' }}>
            Per the LOI requirements, this system is intentionally scoped:
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {[
              { label: 'No duplication', text: 'Does not reproduce work already done by existing tools — instead integrates 5 open APIs into a novel agentic workflow' },
              { label: 'No new algorithms', text: 'Uses transparent, documented heuristics with explicit weights — no black-box ML or novel statistical methods' },
              { label: 'No hypothesis-driven claims', text: 'Produces computational predictions grounded in existing evidence, not original biological hypotheses' },
              { label: 'Database as output', text: 'All agent runs, tool calls, evidence items, and reports are stored in Supabase (6-table PostgreSQL schema) for downstream analytics' },
              { label: 'Agentic AI component', text: 'Implements a complete 9-step agentic reasoning loop inspired by BioAgents (2025) — plan, retrieve, synthesize, interact, predict, generate, benchmark, report' },
            ].map((item, i) => (
              <div key={i} style={{
                padding: '12px 16px', borderRadius: '8px',
                backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border)',
              }}>
                <strong style={{ fontFamily: 'var(--font-display)', fontSize: '12px', color: 'var(--accent-cyan)', letterSpacing: '0.3px' }}>{item.label}</strong>
                <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{item.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Citations */}
        <div className="card" style={{ animation: 'fadeInUp 0.5s ease-out 0.15s both' }}>
          <h2>Key Citations</h2>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '-8px 0 16px', fontFamily: 'var(--font-display)' }}>
            Domain-specific AI tools and databases (all published ≥2024)
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {CITATIONS.map((cite) => (
              <div key={cite.id} style={{
                padding: '16px 18px', borderRadius: '10px',
                backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border)',
                borderLeft: `3px solid ${cite.color}`,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1 }}>
                    <span style={{
                      fontFamily: 'var(--font-display)', fontSize: '10px', fontWeight: 600,
                      letterSpacing: '1px', textTransform: 'uppercase', color: cite.color,
                    }}>
                      {cite.label}
                    </span>
                    <h4 style={{ margin: '4px 0 6px', fontSize: '14px', color: 'var(--text-primary)', fontWeight: 600 }}>
                      {cite.title}
                    </h4>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--font-display)' }}>
                      {cite.authors} · {cite.journal} ({cite.year}) {cite.detail && `· ${cite.detail}`}
                    </div>
                  </div>
                </div>
                <p style={{ margin: '10px 0 0', fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  {cite.role}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Data Sources */}
        <div className="card" style={{ animation: 'fadeInUp 0.5s ease-out 0.2s both' }}>
          <h2>Integrated Data Sources</h2>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '-8px 0 16px', fontFamily: 'var(--font-display)' }}>
            All API-accessible, open, and reproducible — no API keys required for external sources
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
            {DATA_SOURCES.map((src) => (
              <div key={src.name} style={{
                padding: '14px 16px', borderRadius: '10px',
                backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border)',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <strong style={{ fontFamily: 'var(--font-display)', fontSize: '14px', color: src.color }}>{src.name}</strong>
                  <span style={{
                    fontFamily: 'var(--font-display)', fontSize: '10px', padding: '2px 8px',
                    borderRadius: '12px', backgroundColor: 'var(--bg-surface)', color: 'var(--text-muted)',
                    border: '1px solid var(--border)',
                  }}>{src.type}</span>
                </div>
                <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  {src.provides}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Success Criteria */}
        <div className="card" style={{ animation: 'fadeInUp 0.5s ease-out 0.25s both' }}>
          <h2>Success Criteria (from LOI)</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {[
              { label: 'Reproducibility', desc: 'Repeated runs on the same configuration produce consistent results with stored provenance. Deterministic heuristics ensure identical inputs → identical outputs.', status: '✓ Verified', color: 'var(--accent-green)' },
              { label: 'Transparency', desc: 'Every output is accompanied by an evidence trace — what data, from which sources, supported each conclusion. Full reasoning trace available per run.', status: '✓ Implemented', color: 'var(--accent-green)' },
              { label: 'Generalizability', desc: 'The same agentic workflow runs on 4 distinct disease contexts without rewriting the reasoning loop. Config-driven architecture.', status: '✓ 4 contexts', color: 'var(--accent-green)' },
              { label: 'Data Management', desc: 'Supabase schema supports auditable storage of inputs, intermediate artifacts, and outputs — 6 tables with provenance tracking.', status: '✓ 6 tables', color: 'var(--accent-green)' },
            ].map((item, i) => (
              <div key={i} style={{
                padding: '16px', borderRadius: '10px',
                backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border)',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <strong style={{ fontFamily: 'var(--font-display)', fontSize: '13px', color: 'var(--text-primary)' }}>{item.label}</strong>
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: '10px', color: item.color, fontWeight: 600 }}>{item.status}</span>
                </div>
                <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Project Info */}
        <div className="card" style={{ animation: 'fadeInUp 0.5s ease-out 0.3s both', background: 'var(--bg-deep)', borderStyle: 'dashed' }}>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: '13px', color: 'var(--text-secondary)', margin: '0 0 4px' }}>
              <strong style={{ color: 'var(--text-primary)' }}>Ty Parker</strong> · INFO 603/404 Biological Data Management · Prof. Jake Y. Chen
            </p>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: '12px', color: 'var(--text-muted)', margin: '0 0 12px' }}>
              Spring 2026 · University of Alabama at Birmingham
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <a href="https://github.com/ParkerTy/AgenticTherapyResponsePredictor" target="_blank" rel="noopener noreferrer"
                style={{ fontFamily: 'var(--font-display)', fontSize: '12px', color: 'var(--accent-cyan)', textDecoration: 'none' }}>
                GitHub Repository →
              </a>
              <Link href="/methods" style={{ fontFamily: 'var(--font-display)', fontSize: '12px', color: 'var(--accent-cyan)', textDecoration: 'none' }}>
                Methods & Documentation →
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="site-footer">
        <p style={{ fontFamily: 'var(--font-display)' }}>
          Ty Parker · INFO 603/404 Biological Data Management · Prof. Jake Y. Chen
        </p>
        <p>Powered by cBioPortal · OpenTargets · CIViC · DGIdb · Reactome · Groq LLM</p>
        <p>
          <a href="https://github.com/ParkerTy/AgenticTherapyResponsePredictor" target="_blank" rel="noopener noreferrer">
            GitHub Repository
          </a>
        </p>
      </footer>
    </main>
  );
}