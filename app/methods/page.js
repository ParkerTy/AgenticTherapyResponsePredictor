'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function MethodsPage() {
  const [openSection, setOpenSection] = useState(null);

  function toggle(section) {
    setOpenSection(openSection === section ? null : section);
  }

  return (
    <main style={{ fontFamily: 'var(--font-body)', backgroundColor: 'var(--bg-deep)', color: 'var(--text-primary)', minHeight: '100vh' }}>

      {/* Nav */}
      <nav className="site-nav">
        <Link href="/" className="nav-logo"><div className="nav-logo-dot" /><span className="nav-logo-text">ATRP</span></Link>
        <div className="nav-links">
          <Link href="/" className="nav-link">Home</Link>
          <Link href="/about" className="nav-link">About</Link>
          <Link href="/compare" className="nav-link">Compare</Link>
          <Link href="/interpret" className="nav-link">Interpret</Link>
          <Link href="/methods" className="nav-link nav-active">Methods</Link>
          <Link href="/history" className="nav-link">History</Link>
        </div>
      </nav>

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <div style={{ width: '32px', height: '2px', background: 'var(--accent-cyan)', borderRadius: '1px' }} />
          <span className="label-upper" style={{ color: 'var(--accent-cyan)' }}>Technical Reference</span>
        </div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '28px', fontWeight: 700, margin: '0 0 6px', color: 'var(--text-primary)' }}>Methods & Documentation</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '28px' }}>
          Complete documentation of data sources, scoring formulas, architecture, and FAIR compliance.
        </p>

        {/* ============ SECTION 1: DATA SOURCES ============ */}
        <Section title="1. Data Sources" id="data-sources">
          <p style={pStyle}>This system integrates five major biomedical databases, each providing a distinct evidence axis for therapy response prediction and lead benchmarking.</p>

          <SourceCard name="cBioPortal" url="https://www.cbioportal.org" axis="Genomic Evidence" color="var(--accent-amber)"
            description="Provides real cohort-level genomic data from The Cancer Genome Atlas (TCGA) studies. For each disease context, we retrieve somatic mutation profiles and compute per-gene mutation frequencies (mutated samples / total samples)."
            dataUsed="Study metadata, sample counts, somatic mutations (via Entrez Gene ID resolution), mutation frequencies per biomarker gene."
            apiType="REST API — no key required"
            citation="Cerami et al., Cancer Discovery 2:401–404 (2012); Gao et al., Science Signaling 6:pl1 (2013)" />
          <SourceCard name="OpenTargets Platform" url="https://platform.opentargets.org" axis="Target–Disease Association" color="var(--accent-green)"
            description="Provides integrated target–disease association scores aggregated across genetic associations, somatic mutations, known drugs, literature mining, and other evidence types. Also provides tractability/druggability assessment per target."
            dataUsed="Overall association score, datatype-level scores (genetic_association, somatic_mutation, known_drug, etc.), tractability modalities (small molecule, antibody, etc.)."
            apiType="GraphQL API — no key required"
            citation="Ochoa et al., Nucleic Acids Research 51:D1003–D1016 (2023)" />
          <SourceCard name="CIViC" url="https://civicdb.org" axis="Clinical Evidence" color="var(--accent-cyan)"
            description="Clinical Interpretation of Variants in Cancer — an expert-curated, community-driven knowledgebase providing clinical evidence for specific cancer gene variants. Evidence is graded by level (A = Validated through E = Inferential) and type (Predictive, Diagnostic, Prognostic, etc.)."
            dataUsed="Evidence items per gene filtered by disease, evidence levels (A–E), evidence types, associated therapies, predictive evidence count."
            apiType="GraphQL API — no key required"
            citation="Griffith et al., Nature Genetics 49:170–174 (2017); Schimmelpfennig et al., bioRxiv (2025) — CIViC MCP" />
          <SourceCard name="DGIdb" url="https://dgidb.org" axis="Drug–Gene Interactions" color="var(--accent-rose)"
            description="Drug Gene Interaction Database — aggregates drug–gene interaction records from 40+ sources including DrugBank, PharmGKB, ChEMBL, FDA, and expert curation. Provides actual drug names, approval status, and interaction types for each gene."
            dataUsed="Drug names, FDA approval status, interaction types (inhibitor, agonist, etc.), interaction scores, source counts, publication counts."
            apiType="GraphQL API — no key required"
            citation="Cannon et al., Nucleic Acids Research 52:D1227–D1235 (2024)" />
          <SourceCard name="Reactome" url="https://reactome.org" axis="Pathway Context" color="var(--accent-purple)"
            description="Reactome Pathway Knowledgebase — a curated database of biological pathways and reactions. Provides the pathway membership for each biomarker gene, enabling mechanistic context for predictions (e.g., PIK3CA drives PI3K/AKT/mTOR signaling)."
            dataUsed="Top pathway name per gene, total pathway count, disease-relevant pathway annotations."
            apiType="REST API — no key required"
            citation='Ragueneau et al., Nucleic Acids Research (2025) — "The Reactome Knowledgebase 2026"' />

          <div style={{ marginTop: '16px', padding: '12px 16px', backgroundColor: 'var(--bg-deep)', borderRadius: '8px', border: '1px dashed var(--border)', fontSize: '13px', color: 'var(--text-muted)' }}>
            <strong style={{ color: 'var(--text-secondary)' }}>BioContext.ai note:</strong> The original Letter of Intent listed BioContext.ai for pathway-level reasoning. Pathway context is instead provided by Reactome, a CoreTrustSeal-certified ELIXIR Global Core Biodata resource, as noted in the LOI&apos;s provision that BioContext.ai would serve as &quot;an evidence augmentation step rather than a hard dependency.&quot;
          </div>
        </Section>

        {/* ============ SECTION 2: DATABASE ARCHITECTURE ============ */}
        <Section title="2. Database Architecture" id="database">
          <p style={pStyle}>The system uses Supabase (PostgreSQL) with 6 tables designed for full provenance tracking. Every agent run, every pipeline step, every evidence item, and every report is stored with timestamps and foreign key relationships.</p>

          <div style={{ overflowX: 'auto', margin: '16px 0' }}>
            <svg viewBox="0 0 900 520" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', maxWidth: '900px', height: 'auto' }}>
              <rect width="900" height="520" fill="#080c16" rx="8" />
              <g transform="translate(30, 30)">
                <rect width="200" height="120" rx="6" fill="var(--bg-surface)" stroke="var(--border-bright)" strokeWidth="1" />
                <rect width="200" height="28" rx="6" fill="var(--accent-blue)" />
                <text x="100" y="19" textAnchor="middle" fill="#fff" fontSize="13" fontWeight="bold">disease_contexts</text>
                <text x="10" y="48" fill="var(--accent-amber)" fontSize="11">PK id UUID</text>
                <text x="10" y="64" fill="var(--text-secondary)" fontSize="11">name TEXT</text>
                <text x="10" y="80" fill="var(--text-secondary)" fontSize="11">subtype TEXT</text>
                <text x="10" y="96" fill="var(--text-secondary)" fontSize="11">config JSONB</text>
                <text x="10" y="112" fill="var(--text-muted)" fontSize="11">created_at TIMESTAMPTZ</text>
              </g>
              <g transform="translate(30, 180)">
                <rect width="200" height="120" rx="6" fill="var(--bg-surface)" stroke="var(--border-bright)" strokeWidth="1" />
                <rect width="200" height="28" rx="6" fill="var(--accent-blue)" />
                <text x="100" y="19" textAnchor="middle" fill="#fff" fontSize="13" fontWeight="bold">cohorts</text>
                <text x="10" y="48" fill="var(--accent-amber)" fontSize="11">PK id UUID</text>
                <text x="10" y="64" fill="var(--accent-cyan)" fontSize="11">FK disease_context_id UUID</text>
                <text x="10" y="80" fill="var(--text-secondary)" fontSize="11">study_id TEXT</text>
                <text x="10" y="96" fill="var(--text-secondary)" fontSize="11">source TEXT</text>
                <text x="10" y="112" fill="var(--text-muted)" fontSize="11">sample_count INT</text>
              </g>
              <g transform="translate(340, 30)">
                <rect width="220" height="180" rx="6" fill="var(--bg-surface)" stroke="var(--accent-blue)" strokeWidth="2" />
                <rect width="220" height="28" rx="6" fill="var(--accent-blue)" />
                <text x="110" y="19" textAnchor="middle" fill="#fff" fontSize="13" fontWeight="bold">agent_runs</text>
                <text x="10" y="48" fill="var(--accent-amber)" fontSize="11">PK id UUID</text>
                <text x="10" y="64" fill="var(--text-secondary)" fontSize="11">run_id TEXT UNIQUE</text>
                <text x="10" y="80" fill="var(--text-secondary)" fontSize="11">disease_context TEXT</text>
                <text x="10" y="96" fill="var(--text-secondary)" fontSize="11">query TEXT</text>
                <text x="10" y="112" fill="var(--text-secondary)" fontSize="11">status TEXT</text>
                <text x="10" y="128" fill="var(--text-secondary)" fontSize="11">parsed_query JSONB</text>
                <text x="10" y="144" fill="var(--accent-cyan)" fontSize="11">parent_run_id TEXT (self-ref)</text>
                <text x="10" y="160" fill="var(--text-muted)" fontSize="11">started_at, completed_at</text>
              </g>
              <g transform="translate(650, 30)">
                <rect width="210" height="120" rx="6" fill="var(--bg-surface)" stroke="var(--border-bright)" strokeWidth="1" />
                <rect width="210" height="28" rx="6" fill="var(--accent-blue)" />
                <text x="105" y="19" textAnchor="middle" fill="#fff" fontSize="13" fontWeight="bold">tool_calls</text>
                <text x="10" y="48" fill="var(--accent-amber)" fontSize="11">PK id UUID</text>
                <text x="10" y="64" fill="var(--accent-cyan)" fontSize="11">FK agent_run_id UUID</text>
                <text x="10" y="80" fill="var(--text-secondary)" fontSize="11">step_name TEXT</text>
                <text x="10" y="96" fill="var(--text-secondary)" fontSize="11">input JSONB, output JSONB</text>
                <text x="10" y="112" fill="var(--text-muted)" fontSize="11">timestamp TIMESTAMPTZ</text>
              </g>
              <g transform="translate(650, 200)">
                <rect width="210" height="130" rx="6" fill="var(--bg-surface)" stroke="var(--border-bright)" strokeWidth="1" />
                <rect width="210" height="28" rx="6" fill="var(--accent-blue)" />
                <text x="105" y="19" textAnchor="middle" fill="#fff" fontSize="13" fontWeight="bold">evidence_items</text>
                <text x="10" y="48" fill="var(--accent-amber)" fontSize="11">PK id UUID</text>
                <text x="10" y="64" fill="var(--accent-cyan)" fontSize="11">FK agent_run_id UUID</text>
                <text x="10" y="80" fill="var(--text-secondary)" fontSize="11">gene TEXT</text>
                <text x="10" y="96" fill="var(--text-secondary)" fontSize="11">role TEXT, effect TEXT</text>
                <text x="10" y="112" fill="var(--text-secondary)" fontSize="11">data_source TEXT, score NUM</text>
                <text x="10" y="128" fill="var(--text-muted)" fontSize="11">metadata JSONB</text>
              </g>
              <g transform="translate(650, 380)">
                <rect width="210" height="120" rx="6" fill="var(--bg-surface)" stroke="var(--border-bright)" strokeWidth="1" />
                <rect width="210" height="28" rx="6" fill="var(--accent-blue)" />
                <text x="105" y="19" textAnchor="middle" fill="#fff" fontSize="13" fontWeight="bold">reports</text>
                <text x="10" y="48" fill="var(--accent-amber)" fontSize="11">PK id UUID</text>
                <text x="10" y="64" fill="var(--accent-cyan)" fontSize="11">FK agent_run_id UUID</text>
                <text x="10" y="80" fill="var(--text-secondary)" fontSize="11">title TEXT, summary TEXT</text>
                <text x="10" y="96" fill="var(--text-secondary)" fontSize="11">full_report JSONB</text>
                <text x="10" y="112" fill="var(--text-secondary)" fontSize="11">provenance JSONB</text>
              </g>
              <line x1="130" y1="150" x2="130" y2="180" stroke="var(--accent-cyan)" strokeWidth="1.5" strokeDasharray="4" />
              <line x1="560" y1="90" x2="650" y2="90" stroke="var(--accent-cyan)" strokeWidth="1.5" />
              <line x1="560" y1="140" x2="620" y2="260" stroke="var(--accent-cyan)" strokeWidth="1.5" />
              <line x1="560" y1="180" x2="620" y2="420" stroke="var(--accent-cyan)" strokeWidth="1.5" />
              <path d="M 450 210 L 450 250 L 380 250 L 380 210" fill="none" stroke="var(--accent-purple)" strokeWidth="1.5" strokeDasharray="4" />
              <text x="415" y="268" textAnchor="middle" fill="var(--accent-purple)" fontSize="10">parent_run_id (refinement)</text>
              <g transform="translate(30, 350)">
                <rect width="260" height="130" rx="6" fill="var(--bg-surface)" stroke="var(--border)" strokeWidth="1" />
                <text x="15" y="22" fill="var(--text-primary)" fontSize="12" fontWeight="bold">Legend</text>
                <rect x="15" y="35" width="12" height="12" fill="var(--accent-amber)" />
                <text x="35" y="46" fill="var(--text-secondary)" fontSize="11">Primary Key</text>
                <rect x="15" y="55" width="12" height="12" fill="var(--accent-cyan)" />
                <text x="35" y="66" fill="var(--text-secondary)" fontSize="11">Foreign Key</text>
                <line x1="15" y1="82" x2="40" y2="82" stroke="var(--accent-cyan)" strokeWidth="1.5" />
                <text x="50" y="86" fill="var(--text-secondary)" fontSize="11">FK relationship</text>
                <line x1="15" y1="102" x2="40" y2="102" stroke="var(--accent-purple)" strokeWidth="1.5" strokeDasharray="4" />
                <text x="50" y="106" fill="var(--text-secondary)" fontSize="11">Self-referencing (refinement)</text>
              </g>
            </svg>
          </div>

          <p style={pStyle}>The <code style={codeStyle}>agent_runs</code> table is central — every tool call, evidence item, and report links back to it via <code style={codeStyle}>agent_run_id</code>. The <code style={codeStyle}>parent_run_id</code> self-reference enables refinement threading.</p>
        </Section>

        {/* ============ SECTION 3: AGENT REASONING ============ */}
        <Section title="3. Agent Reasoning & Scoring" id="reasoning">
          <h3 style={h3Style}>Confidence Scoring (Predict Step)</h3>
          <p style={pStyle}>Each therapy prediction receives a confidence score computed from four transparent components:</p>
          <div style={formulaBox}>
            <code style={{ color: 'var(--accent-amber)', fontFamily: 'var(--font-display)', fontSize: '13px' }}>effectiveScore = clamp(0, 1, baseScore + queryBoost + interactionDelta + clinicalEvidenceBoost)</code>
          </div>
          <table className="data-table" style={{ marginBottom: '16px' }}>
            <thead><tr><th>Component</th><th>Value</th><th>Source</th></tr></thead>
            <tbody>
              <tr><td><strong style={{ color: 'var(--text-primary)' }}>Base Score</strong></td><td>1.0 (high) if freq &gt; 10% AND assocScore &gt; 0.5; 0.6 (moderate) if either; 0.3 (low) otherwise</td><td style={{ fontFamily: 'var(--font-display)', fontSize: '11px' }}>cBioPortal + OpenTargets</td></tr>
              <tr><td><strong style={{ color: 'var(--text-primary)' }}>Query Boost</strong></td><td>+0.10 if parsed query mentions matching therapy class</td><td style={{ fontFamily: 'var(--font-display)', fontSize: '11px' }}>Query Parser</td></tr>
              <tr><td><strong style={{ color: 'var(--text-primary)' }}>Interaction Delta</strong></td><td>Sum of applicable modifiers from config-driven interaction rules (±)</td><td style={{ fontFamily: 'var(--font-display)', fontSize: '11px' }}>Disease Config</td></tr>
              <tr><td><strong style={{ color: 'var(--text-primary)' }}>Clinical Evidence Boost</strong></td><td>+0.10 if CIViC Level A (Validated) or B (Clinical)</td><td style={{ fontFamily: 'var(--font-display)', fontSize: '11px' }}>CIViC</td></tr>
            </tbody>
          </table>
          <p style={pStyle}>Labels: score &ge; 0.8 = high, &ge; 0.5 = moderate, &lt; 0.5 = low.</p>

          <h3 style={h3Style}>Benchmark Composite Scoring (7 Dimensions)</h3>
          <p style={pStyle}>Each therapeutic lead is scored across 7 dimensions with transparent weights summing to 1.0:</p>
          <table className="data-table" style={{ marginBottom: '16px' }}>
            <thead><tr><th>Dimension</th><th>Weight</th><th>Source</th><th>Formula</th></tr></thead>
            <tbody>
              <tr><td>Clinical Precedence</td><td style={{ fontFamily: 'var(--font-display)' }}>0.15</td><td>OpenTargets (known_drug)</td><td style={{ fontFamily: 'var(--font-display)', fontSize: '11px' }}>clamp01(score)</td></tr>
              <tr><td>Cancer Gene Census</td><td style={{ fontFamily: 'var(--font-display)' }}>0.10</td><td>OpenTargets (genetic_assoc)</td><td style={{ fontFamily: 'var(--font-display)', fontSize: '11px' }}>clamp01(score)</td></tr>
              <tr><td>Known Drug Evidence</td><td style={{ fontFamily: 'var(--font-display)' }}>0.10</td><td>OpenTargets (somatic_mut)</td><td style={{ fontFamily: 'var(--font-display)', fontSize: '11px' }}>clamp01(score)</td></tr>
              <tr><td>Mutation Frequency</td><td style={{ fontFamily: 'var(--font-display)' }}>0.20</td><td>cBioPortal</td><td style={{ fontFamily: 'var(--font-display)', fontSize: '11px' }}>clamp01(freq / 30)</td></tr>
              <tr><td>Drug Evidence</td><td style={{ fontFamily: 'var(--font-display)' }}>0.15</td><td>DGIdb (druggability)</td><td style={{ fontFamily: 'var(--font-display)', fontSize: '11px' }}>clamp01(count / 10)</td></tr>
              <tr><td>Mechanistic Plausibility</td><td style={{ fontFamily: 'var(--font-display)' }}>0.15</td><td>Lead type</td><td style={{ fontFamily: 'var(--font-display)', fontSize: '11px' }}>0.8 (targeted) or 0.5</td></tr>
              <tr><td>Clinical Evidence</td><td style={{ fontFamily: 'var(--font-display)' }}>0.15</td><td>CIViC</td><td style={{ fontFamily: 'var(--font-display)', fontSize: '11px' }}>A=1.0, B=0.8, C=0.6, D=0.4, E=0.2</td></tr>
            </tbody>
          </table>
          <p style={pStyle}>Tiers: composite &ge; 0.60 = Tier 1 (Strong), &ge; 0.35 = Tier 2 (Moderate), &lt; 0.35 = Tier 3 (Exploratory).</p>

          <h3 style={h3Style}>Biomarker Interaction Rules</h3>
          <p style={pStyle}>Disease configs define interaction rules that model biological co-dependencies. Two trigger types:</p>
          <div style={{ padding: '12px 16px', backgroundColor: 'var(--bg-elevated)', borderRadius: '8px', border: '1px solid var(--border)', marginBottom: '12px', fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
            <strong style={{ color: 'var(--accent-purple)' }}>co_mutation:</strong> All listed genes must have mutation frequency &gt; 0% (supports <code style={codeStyle}>anyOf</code> for OR semantics)<br/>
            <strong style={{ color: 'var(--accent-purple)' }}>single_mutation:</strong> One gene must exceed a <code style={codeStyle}>frequencyThreshold</code>
          </div>
          <p style={pStyle}>When triggered, rules apply confidence deltas (positive or negative) to specific gene–therapy pairs. Example: PIK3CA + ESR1 co-mutation reduces aromatase inhibitor confidence by -0.15 while boosting PI3K inhibitor confidence by +0.10.</p>
        </Section>

        {/* ============ SECTION 4: ARCHITECTURE ============ */}
        <Section title="4. Architecture & Pipeline" id="architecture">
          <p style={pStyle}>The system executes a 9-step agentic reasoning pipeline. Each step is a pure async function with logged inputs and outputs.</p>

          <div style={{ overflowX: 'auto', margin: '16px 0' }}>
            <svg viewBox="0 0 800 600" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', maxWidth: '800px', height: 'auto' }}>
              <rect width="800" height="600" fill="#080c16" rx="8" />
              <defs>
                <marker id="arrow" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto"><polygon points="0 0, 8 3, 0 6" fill="#555" /></marker>
                <marker id="arrowBlue" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto"><polygon points="0 0, 8 3, 0 6" fill="var(--accent-cyan)" /></marker>
                <marker id="arrowGreen" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto"><polygon points="0 0, 8 3, 0 6" fill="var(--accent-green)" /></marker>
              </defs>
              <text x="400" y="30" textAnchor="middle" fill="var(--text-primary)" fontSize="15" fontWeight="bold" fontFamily="var(--font-display)">9-Step Agentic Reasoning Pipeline</text>
              {[
                { x: 30,  label: 'Parse Query',  color: '#1e6e8e', step: '1' },
                { x: 180, label: 'Plan',          color: 'var(--accent-blue)', step: '2' },
                { x: 330, label: 'Retrieve',      color: 'var(--accent-blue)', step: '3' },
                { x: 480, label: 'Synthesize',    color: 'var(--accent-blue)', step: '4' },
                { x: 630, label: 'Interactions',  color: '#6a3eb8', step: '5' },
              ].map((s, i) => (
                <g key={i}>
                  <rect x={s.x} y="50" width="130" height="44" rx="6" fill={s.color} />
                  <text x={s.x + 14} y="68" fill="#fff9" fontSize="10">{s.step}</text>
                  <text x={s.x + 65} y="82" textAnchor="middle" fill="#fff" fontSize="12" fontWeight="bold">{s.label}</text>
                  {i < 4 && <line x1={s.x + 132} y1="72" x2={s.x + 178} y2="72" stroke="#555" strokeWidth="1.5" markerEnd="url(#arrow)" />}
                </g>
              ))}
              <line x1="695" y1="96" x2="695" y2="116" stroke="#555" strokeWidth="1.5" markerEnd="url(#arrow)" />
              <line x1="695" y1="120" x2="160" y2="120" stroke="#555" strokeWidth="1.5" />
              <line x1="160" y1="120" x2="160" y2="130" stroke="#555" strokeWidth="1.5" markerEnd="url(#arrow)" />
              {[
                { x: 30,  label: 'Predict',       color: 'var(--accent-blue)', step: '6' },
                { x: 220, label: 'Generate Leads', color: 'var(--accent-blue)', step: '7' },
                { x: 410, label: 'Benchmark',      color: 'var(--accent-blue)', step: '8' },
                { x: 600, label: 'Report',         color: '#1a7a3a', step: '9' },
              ].map((s, i) => (
                <g key={i}>
                  <rect x={s.x} y="135" width="150" height="44" rx="6" fill={s.color} />
                  <text x={s.x + 14} y="153" fill="#fff9" fontSize="10">{s.step}</text>
                  <text x={s.x + 75} y="167" textAnchor="middle" fill="#fff" fontSize="12" fontWeight="bold">{s.label}</text>
                  {i < 3 && <line x1={s.x + 152} y1="157" x2={s.x + 218} y2="157" stroke="#555" strokeWidth="1.5" markerEnd="url(#arrow)" />}
                </g>
              ))}
              <line x1="30" y1="210" x2="770" y2="210" stroke="var(--border)" strokeWidth="1" strokeDasharray="4" />
              <text x="400" y="232" textAnchor="middle" fill="var(--text-muted)" fontSize="12">External Data Sources (called during Retrieve step)</text>
              {[
                { x: 30,  label: 'cBioPortal',  sub: 'Mutations & Cohorts',  color: 'var(--accent-amber)' },
                { x: 190, label: 'OpenTargets',  sub: 'Associations & Drugs', color: 'var(--accent-green)' },
                { x: 350, label: 'CIViC',        sub: 'Clinical Evidence',    color: 'var(--accent-cyan)' },
                { x: 510, label: 'DGIdb',        sub: 'Drug Interactions',    color: 'var(--accent-rose)' },
                { x: 650, label: 'Reactome',     sub: 'Pathway Context',      color: 'var(--accent-purple)' },
              ].map((api, i) => (
                <g key={i}>
                  <rect x={api.x} y="250" width="130" height="50" rx="6" fill="var(--bg-surface)" stroke={api.color} strokeWidth="1.5" />
                  <text x={api.x + 65} y="270" textAnchor="middle" fill={api.color} fontSize="12" fontWeight="bold">{api.label}</text>
                  <text x={api.x + 65} y="288" textAnchor="middle" fill="var(--text-muted)" fontSize="10">{api.sub}</text>
                </g>
              ))}
              <line x1="395" y1="96" x2="395" y2="245" stroke="var(--accent-cyan)" strokeWidth="1" strokeDasharray="3" opacity="0.4" />
              <line x1="30" y1="325" x2="770" y2="325" stroke="var(--border)" strokeWidth="1" strokeDasharray="4" />
              <text x="400" y="347" textAnchor="middle" fill="var(--text-muted)" fontSize="12">Storage & Configuration</text>
              <rect x="80" y="365" width="640" height="70" rx="8" fill="var(--bg-surface)" stroke="var(--accent-green)" strokeWidth="1.5" />
              <text x="400" y="388" textAnchor="middle" fill="var(--accent-green)" fontSize="14" fontWeight="bold">Supabase (PostgreSQL)</text>
              <text x="400" y="408" textAnchor="middle" fill="var(--text-muted)" fontSize="11">agent_runs · tool_calls · evidence_items · reports · disease_contexts · cohorts</text>
              <text x="400" y="424" textAnchor="middle" fill="var(--text-muted)" fontSize="10">Every step logs input/output JSON with timestamps for full auditability</text>
              <line x1="400" y1="180" x2="400" y2="360" stroke="var(--accent-green)" strokeWidth="1" strokeDasharray="3" opacity="0.4" />
              <rect x="80" y="460" width="640" height="55" rx="8" fill="var(--bg-surface)" stroke="var(--accent-amber)" strokeWidth="1.5" />
              <text x="400" y="483" textAnchor="middle" fill="var(--accent-amber)" fontSize="14" fontWeight="bold">Disease Configuration (JSON)</text>
              <text x="400" y="503" textAnchor="middle" fill="var(--text-muted)" fontSize="11">Biomarkers · Heuristics · Interaction Rules · Study IDs · Standard Therapies</text>
              <text x="400" y="545" textAnchor="middle" fill="var(--text-muted)" fontSize="11">All reasoning is deterministic — no LLM in the scientific pipeline</text>
              <text x="400" y="562" textAnchor="middle" fill="var(--text-muted)" fontSize="10">Adding a new disease requires only a JSON config file — zero code changes</text>
            </svg>
          </div>
          <p style={pStyle}>The pipeline is disease-agnostic — the same 9 steps execute regardless of disease context.</p>
        </Section>

        {/* ============ SECTION 5: BIOAGENTS ============ */}
        <Section title="5. BioAgents Architectural Reference" id="bioagents">
          <p style={pStyle}>This system&apos;s agentic architecture is modeled on BioAgents (Mehandru et al., 2025), a multi-agent bioinformatics framework published in Scientific Reports.</p>
          <p style={{ ...pStyle, fontSize: '13px', fontStyle: 'italic', color: 'var(--text-muted)' }}>
            Mehandru, N., Hall, A.K., Melnichenko, O. et al. (2025). &quot;BioAgents: Bridging the gap in bioinformatics analysis with multi-agent systems.&quot; Scientific Reports, 15, 39036.
          </p>
          <table className="data-table" style={{ marginTop: '12px' }}>
            <thead><tr><th>BioAgents Concept</th><th>Our Implementation</th></tr></thead>
            <tbody>
              <tr><td>Multi-step reasoning</td><td>9-step pipeline (parseQuery → Report)</td></tr>
              <tr><td>Evidence retrieval via APIs</td><td>5 integrated data sources</td></tr>
              <tr><td>Iterative refinement</td><td>Refinement threading via parent_run_id</td></tr>
              <tr><td>Tool call logging</td><td>Supabase tool_calls table with full I/O JSON</td></tr>
              <tr><td>Reproducibility</td><td>Deterministic heuristics, stored provenance</td></tr>
              <tr><td>Domain specialization</td><td>Disease context JSON configs with biomarker rules</td></tr>
            </tbody>
          </table>
          <p style={{ ...pStyle, fontSize: '13px', color: 'var(--text-muted)', marginTop: '12px' }}>
            Also informed by: Zhou et al. (2025). &quot;Streamline automated biomedical discoveries with agentic bioinformatics.&quot; Briefings in Bioinformatics, 26(5).
          </p>
        </Section>

        {/* ============ SECTION 6: QUERY GUIDE ============ */}
        <Section title="6. Query Guide" id="query-guide">
          <p style={pStyle}>The deterministic query parser recognizes a controlled vocabulary of ~30 terms across four categories.</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
            <VocabCard title="Therapy Classes" color="var(--accent-blue)" items={['endocrine', 'CDK4/6 inhibitor', 'PI3K inhibitor', 'PARP inhibitor', 'immunotherapy', 'anti-EGFR', 'chemotherapy']} />
            <VocabCard title="Clinical Settings" color="var(--accent-green)" items={['first-line', 'second-line', 'metastatic', 'early-stage', 'neoadjuvant', 'adjuvant', 'resistance', 'progression']} />
            <VocabCard title="Biomarkers" color="var(--accent-amber)" items={['PIK3CA', 'ESR1', 'RB1', 'BRCA1', 'BRCA2', 'PD-L1', 'KRAS', 'NRAS', 'MSI', 'EGFR', 'ALK']} />
            <VocabCard title="Intents" color="var(--accent-purple)" items={['predict', 'compare', 'rank', 'explain', 'refine']} />
          </div>
          <h3 style={h3Style}>Example Queries by Disease</h3>
          {Object.entries({
            'HR+/HER2- Breast Cancer': ['Predict therapy response for PIK3CA-mutated HR+ breast cancer', 'Compare endocrine therapy vs CDK4/6 inhibitors in metastatic setting'],
            'TNBC': ['Predict PARP inhibitor response in BRCA-mutated TNBC', 'Evaluate immunotherapy for PD-L1 positive TNBC'],
            'Colorectal Cancer': ['Predict anti-EGFR resistance in KRAS-mutated CRC', 'Evaluate immunotherapy for MSI-high colorectal cancer'],
            'Lung Adenocarcinoma': ['Predict EGFR TKI response in EGFR-mutated LUAD', 'Evaluate ALK inhibitor options for ALK-rearranged NSCLC'],
          }).map(([disease, queries]) => (
            <div key={disease} style={{ marginBottom: '12px' }}>
              <strong style={{ color: 'var(--text-primary)', fontSize: '14px' }}>{disease}</strong>
              {queries.map((q, i) => (
                <p key={i} style={{ margin: '4px 0 4px 16px', fontSize: '13px', color: 'var(--accent-cyan)', fontFamily: 'var(--font-display)' }}>&quot;{q}&quot;</p>
              ))}
            </div>
          ))}
        </Section>

        {/* ============ SECTION 7: FAIR ============ */}
        <Section title="7. FAIR Compliance" id="fair">
          <table className="data-table">
            <thead><tr><th>Principle</th><th>Implementation</th></tr></thead>
            <tbody>
              <tr><td><strong style={{ color: 'var(--text-primary)' }}>Findable</strong></td><td>Unique run IDs. Organized repo. All runs indexed in Supabase. Public GitHub. Searchable history page.</td></tr>
              <tr><td><strong style={{ color: 'var(--text-primary)' }}>Accessible</strong></td><td>All 5 APIs are open. Public GitHub repo. Live Vercel deployment. Methods documentation.</td></tr>
              <tr><td><strong style={{ color: 'var(--text-primary)' }}>Interoperable</strong></td><td>JSON format. REST + GraphQL APIs. EFO ontology IDs. Modular config-driven architecture. PostgreSQL storage.</td></tr>
              <tr><td><strong style={{ color: 'var(--text-primary)' }}>Reusable</strong></td><td>Config-driven — add diseases without code changes. Full provenance. Transparent scoring weights. Export functionality.</td></tr>
            </tbody>
          </table>
        </Section>

        {/* ============ SECTION 8: GLOSSARY ============ */}
        <Section title="8. Glossary" id="glossary">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            {[
              ['Mutation Frequency', 'Percentage of samples in a cohort carrying a somatic mutation in a specific gene.'],
              ['Association Score', 'OpenTargets overall score (0–1) aggregating evidence linking a gene target to a disease.'],
              ['Evidence Level (CIViC)', 'A = Validated, B = Clinical trial, C = Case study, D = Preclinical, E = Inferential.'],
              ['Druggability', 'Assessment of whether a gene product can be targeted by therapeutic agents.'],
              ['PARP Inhibitor', 'Drugs targeting poly(ADP-ribose) polymerase, effective in BRCA-mutated cancers.'],
              ['CDK4/6 Inhibitor', 'Drugs targeting cyclin-dependent kinases 4 and 6, used in HR+ breast cancer.'],
              ['Anti-EGFR', 'Monoclonal antibodies targeting EGFR. Ineffective in KRAS/NRAS-mutated CRC.'],
              ['MSI-H', 'Microsatellite instability-high — predicts immunotherapy sensitivity.'],
              ['Tractability', 'OpenTargets assessment of how amenable a target is to therapeutic modalities.'],
              ['Composite Score', 'Weighted sum of 7 evidence dimensions used to tier therapeutic leads.'],
            ].map(([term, def], i) => (
              <div key={i} style={{ padding: '12px', backgroundColor: 'var(--bg-elevated)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                <strong style={{ color: 'var(--accent-cyan)', fontSize: '13px', fontFamily: 'var(--font-display)' }}>{term}</strong>
                <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{def}</p>
              </div>
            ))}
          </div>
        </Section>
      </div>

      <footer className="site-footer">
        <p style={{ fontFamily: 'var(--font-display)' }}>Ty Parker · INFO 603/404 Biological Data Management · Prof. Jake Y. Chen</p>
        <p>Powered by cBioPortal · OpenTargets · CIViC · DGIdb · Reactome</p>
        <p><a href="https://github.com/ParkerTy/AgenticTherapyResponsePredictor" target="_blank" rel="noopener noreferrer">GitHub Repository</a></p>
      </footer>
    </main>
  );
}

/* === Reusable Components === */
function Section({ title, id, children }) {
  return (
    <section id={id} className="card" style={{ marginBottom: '24px' }}>
      <h2 style={{ borderBottom: '1px solid var(--border)', paddingBottom: '10px' }}>{title}</h2>
      {children}
    </section>
  );
}

function SourceCard({ name, url, axis, color, description, dataUsed, apiType, citation }) {
  return (
    <div style={{ padding: '16px', marginBottom: '12px', backgroundColor: 'var(--bg-elevated)', borderRadius: '10px', borderLeft: `3px solid ${color}`, border: '1px solid var(--border)', borderLeftWidth: '3px', borderLeftColor: color }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <strong style={{ color: 'var(--text-primary)', fontSize: '15px', fontFamily: 'var(--font-display)' }}>{name}</strong>
        <span className="pill" style={{ backgroundColor: `${color}15`, color: color, border: `1px solid ${color}33`, fontSize: '10px', padding: '3px 10px' }}>{axis}</span>
      </div>
      <p style={{ margin: '6px 0', fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{description}</p>
      <p style={{ margin: '4px 0', fontSize: '12px', color: 'var(--text-muted)' }}><strong style={{ color: 'var(--text-secondary)' }}>Data used:</strong> {dataUsed}</p>
      <p style={{ margin: '4px 0', fontSize: '12px', color: 'var(--text-muted)' }}><strong style={{ color: 'var(--text-secondary)' }}>API:</strong> {apiType} · <a href={url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-cyan)', fontSize: '11px' }}>{url}</a></p>
      <p style={{ margin: '4px 0 0', fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic' }}>{citation}</p>
    </div>
  );
}

function VocabCard({ title, color, items }) {
  return (
    <div style={{ padding: '14px', backgroundColor: 'var(--bg-elevated)', borderRadius: '10px', border: `1px solid var(--border)` }}>
      <strong style={{ color, fontSize: '13px', fontFamily: 'var(--font-display)' }}>{title}</strong>
      <div style={{ marginTop: '8px', display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
        {items.map((item, i) => (
          <span key={i} className="pill" style={{ padding: '3px 10px', fontSize: '11px', backgroundColor: `${color}10`, border: `1px solid ${color}25`, color: 'var(--text-secondary)' }}>{item}</span>
        ))}
      </div>
    </div>
  );
}

/* === Styles === */
const pStyle = { fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.7, margin: '8px 0' };
const h3Style = { color: 'var(--text-primary)', marginTop: '24px', marginBottom: '8px', fontSize: '16px', fontFamily: 'var(--font-display)', fontWeight: 600 };
const formulaBox = { padding: '14px 18px', backgroundColor: 'var(--bg-deep)', borderRadius: '8px', border: '1px solid var(--border)', marginBottom: '14px', overflowX: 'auto' };
const codeStyle = { backgroundColor: 'var(--bg-elevated)', padding: '2px 7px', borderRadius: '4px', fontSize: '12px', color: 'var(--accent-cyan)', fontFamily: 'var(--font-display)' };