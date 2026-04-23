'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function MethodsPage() {
  const [openSection, setOpenSection] = useState(null);

  function toggle(section) {
    setOpenSection(openSection === section ? null : section);
  }

  return (
    <main style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 20px 40px', fontFamily: 'sans-serif', color: '#e0e0e0', backgroundColor: '#111', minHeight: '100vh' }}>

      {/* Nav Bar */}
      <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0', borderBottom: '1px solid #333', marginBottom: '24px' }}>
        <strong style={{ color: '#fff', fontSize: '16px' }}>Agentic Therapy Response Predictor</strong>
        <div style={{ display: 'flex', gap: '16px', fontSize: '14px' }}>
          <Link href="/" style={{ color: '#aaa', textDecoration: 'none' }}>Home</Link>
          <Link href="/compare" style={{ color: '#aaa', textDecoration: 'none' }}>Compare</Link>
          <Link href="/interpret" style={{ color: '#aaa', textDecoration: 'none' }}>Interpret</Link>
          <Link href="/methods" style={{ color: '#4da6ff', textDecoration: 'none' }}>Methods</Link>
          <Link href="/history" style={{ color: '#aaa', textDecoration: 'none' }}>History</Link>
        </div>
      </nav>

      <h1 style={{ color: '#fff', marginBottom: '8px' }}>Methods & Documentation</h1>
      <p style={{ color: '#aaa', marginTop: 0, marginBottom: '24px' }}>
        Complete documentation of data sources, scoring formulas, architecture, and FAIR compliance.
      </p>

      {/* ============================================================ */}
      {/* SECTION 1: DATA SOURCES */}
      {/* ============================================================ */}
      <Section title="1. Data Sources" id="data-sources">
        <p style={pStyle}>This system integrates five major biomedical databases, each providing a distinct evidence axis for therapy response prediction and lead benchmarking.</p>

        <SourceCard
          name="cBioPortal"
          url="https://www.cbioportal.org"
          axis="Genomic Evidence"
          color="#ffcc00"
          description="Provides real cohort-level genomic data from The Cancer Genome Atlas (TCGA) studies. For each disease context, we retrieve somatic mutation profiles and compute per-gene mutation frequencies (mutated samples / total samples)."
          dataUsed="Study metadata, sample counts, somatic mutations (via Entrez Gene ID resolution), mutation frequencies per biomarker gene."
          apiType="REST API — no key required"
          citation="Cerami et al., Cancer Discovery 2:401–404 (2012); Gao et al., Science Signaling 6:pl1 (2013)"
        />
        <SourceCard
          name="OpenTargets Platform"
          url="https://platform.opentargets.org"
          axis="Target–Disease Association"
          color="#66cc66"
          description="Provides integrated target–disease association scores aggregated across genetic associations, somatic mutations, known drugs, literature mining, and other evidence types. Also provides tractability/druggability assessment per target."
          dataUsed="Overall association score, datatype-level scores (genetic_association, somatic_mutation, known_drug, etc.), tractability modalities (small molecule, antibody, etc.)."
          apiType="GraphQL API — no key required"
          citation="Ochoa et al., Nucleic Acids Research 51:D1003–D1016 (2023)"
        />
        <SourceCard
          name="CIViC"
          url="https://civicdb.org"
          axis="Clinical Evidence"
          color="#4da6ff"
          description="Clinical Interpretation of Variants in Cancer — an expert-curated, community-driven knowledgebase providing clinical evidence for specific cancer gene variants. Evidence is graded by level (A = Validated through E = Inferential) and type (Predictive, Diagnostic, Prognostic, etc.)."
          dataUsed="Evidence items per gene filtered by disease, evidence levels (A–E), evidence types, associated therapies, predictive evidence count."
          apiType="GraphQL API — no key required"
          citation="Griffith et al., Nature Genetics 49:170–174 (2017); Schimmelpfennig et al., bioRxiv (2025) — CIViC MCP"
        />
        <SourceCard
          name="DGIdb"
          url="https://dgidb.org"
          axis="Drug–Gene Interactions"
          color="#ff8866"
          description="Drug Gene Interaction Database — aggregates drug–gene interaction records from 40+ sources including DrugBank, PharmGKB, ChEMBL, FDA, and expert curation. Provides actual drug names, approval status, and interaction types for each gene."
          dataUsed="Drug names, FDA approval status, interaction types (inhibitor, agonist, etc.), interaction scores, source counts, publication counts."
          apiType="GraphQL API — no key required"
          citation="Cannon et al., Nucleic Acids Research 52:D1227–D1235 (2024)"
        />
        <SourceCard
          name="Reactome"
          url="https://reactome.org"
          axis="Pathway Context"
          color="#b088d0"
          description="Reactome Pathway Knowledgebase — a curated database of biological pathways and reactions. Provides the pathway membership for each biomarker gene, enabling mechanistic context for predictions (e.g., PIK3CA drives PI3K/AKT/mTOR signaling)."
          dataUsed="Top pathway name per gene, total pathway count, disease-relevant pathway annotations."
          apiType="REST API — no key required"
          citation='Ragueneau et al., Nucleic Acids Research (2025) — "The Reactome Knowledgebase 2026"'
        />

        <div style={{ marginTop: '16px', padding: '12px', backgroundColor: '#0a0a0a', borderRadius: '8px', border: '1px solid #222', fontSize: '13px', color: '#888' }}>
          <strong style={{ color: '#ccc' }}>BioContext.ai note:</strong> The original Letter of Intent listed BioContext.ai for pathway-level reasoning. Pathway context is instead provided by Reactome, a CoreTrustSeal-certified ELIXIR Global Core Biodata resource, as noted in the LOI&apos;s provision that BioContext.ai would serve as &quot;an evidence augmentation step rather than a hard dependency.&quot;
        </div>
      </Section>

      {/* ============================================================ */}
      {/* SECTION 2: DATABASE ARCHITECTURE (ERD) */}
      {/* ============================================================ */}
      <Section title="2. Database Architecture" id="database">
        <p style={pStyle}>The system uses Supabase (PostgreSQL) with 6 tables designed for full provenance tracking. Every agent run, every pipeline step, every evidence item, and every report is stored with timestamps and foreign key relationships.</p>

        <div style={{ overflowX: 'auto', margin: '16px 0' }}>
          <svg viewBox="0 0 900 520" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', maxWidth: '900px', height: 'auto' }}>
            {/* Background */}
            <rect width="900" height="520" fill="#0a0a0a" rx="8" />

            {/* disease_contexts table */}
            <g transform="translate(30, 30)">
              <rect width="200" height="120" rx="6" fill="#1a1a1a" stroke="#444" strokeWidth="1" />
              <rect width="200" height="28" rx="6" fill="#0070f3" />
              <text x="100" y="19" textAnchor="middle" fill="#fff" fontSize="13" fontWeight="bold">disease_contexts</text>
              <text x="10" y="48" fill="#ffcc00" fontSize="11">PK id UUID</text>
              <text x="10" y="64" fill="#ccc" fontSize="11">name TEXT</text>
              <text x="10" y="80" fill="#ccc" fontSize="11">subtype TEXT</text>
              <text x="10" y="96" fill="#ccc" fontSize="11">config JSONB</text>
              <text x="10" y="112" fill="#888" fontSize="11">created_at TIMESTAMPTZ</text>
            </g>

            {/* cohorts table */}
            <g transform="translate(30, 180)">
              <rect width="200" height="120" rx="6" fill="#1a1a1a" stroke="#444" strokeWidth="1" />
              <rect width="200" height="28" rx="6" fill="#0070f3" />
              <text x="100" y="19" textAnchor="middle" fill="#fff" fontSize="13" fontWeight="bold">cohorts</text>
              <text x="10" y="48" fill="#ffcc00" fontSize="11">PK id UUID</text>
              <text x="10" y="64" fill="#4da6ff" fontSize="11">FK disease_context_id UUID</text>
              <text x="10" y="80" fill="#ccc" fontSize="11">study_id TEXT</text>
              <text x="10" y="96" fill="#ccc" fontSize="11">source TEXT</text>
              <text x="10" y="112" fill="#888" fontSize="11">sample_count INT</text>
            </g>

            {/* agent_runs table (center) */}
            <g transform="translate(340, 30)">
              <rect width="220" height="180" rx="6" fill="#1a1a1a" stroke="#0070f3" strokeWidth="2" />
              <rect width="220" height="28" rx="6" fill="#0070f3" />
              <text x="110" y="19" textAnchor="middle" fill="#fff" fontSize="13" fontWeight="bold">agent_runs</text>
              <text x="10" y="48" fill="#ffcc00" fontSize="11">PK id UUID</text>
              <text x="10" y="64" fill="#ccc" fontSize="11">run_id TEXT UNIQUE</text>
              <text x="10" y="80" fill="#ccc" fontSize="11">disease_context TEXT</text>
              <text x="10" y="96" fill="#ccc" fontSize="11">query TEXT</text>
              <text x="10" y="112" fill="#ccc" fontSize="11">status TEXT</text>
              <text x="10" y="128" fill="#ccc" fontSize="11">parsed_query JSONB</text>
              <text x="10" y="144" fill="#4da6ff" fontSize="11">parent_run_id TEXT (self-ref)</text>
              <text x="10" y="160" fill="#888" fontSize="11">started_at, completed_at</text>
            </g>

            {/* tool_calls table */}
            <g transform="translate(650, 30)">
              <rect width="210" height="120" rx="6" fill="#1a1a1a" stroke="#444" strokeWidth="1" />
              <rect width="210" height="28" rx="6" fill="#0070f3" />
              <text x="105" y="19" textAnchor="middle" fill="#fff" fontSize="13" fontWeight="bold">tool_calls</text>
              <text x="10" y="48" fill="#ffcc00" fontSize="11">PK id UUID</text>
              <text x="10" y="64" fill="#4da6ff" fontSize="11">FK agent_run_id UUID</text>
              <text x="10" y="80" fill="#ccc" fontSize="11">step_name TEXT</text>
              <text x="10" y="96" fill="#ccc" fontSize="11">input JSONB, output JSONB</text>
              <text x="10" y="112" fill="#888" fontSize="11">timestamp TIMESTAMPTZ</text>
            </g>

            {/* evidence_items table */}
            <g transform="translate(650, 200)">
              <rect width="210" height="130" rx="6" fill="#1a1a1a" stroke="#444" strokeWidth="1" />
              <rect width="210" height="28" rx="6" fill="#0070f3" />
              <text x="105" y="19" textAnchor="middle" fill="#fff" fontSize="13" fontWeight="bold">evidence_items</text>
              <text x="10" y="48" fill="#ffcc00" fontSize="11">PK id UUID</text>
              <text x="10" y="64" fill="#4da6ff" fontSize="11">FK agent_run_id UUID</text>
              <text x="10" y="80" fill="#ccc" fontSize="11">gene TEXT</text>
              <text x="10" y="96" fill="#ccc" fontSize="11">role TEXT, effect TEXT</text>
              <text x="10" y="112" fill="#ccc" fontSize="11">data_source TEXT, score NUM</text>
              <text x="10" y="128" fill="#888" fontSize="11">metadata JSONB</text>
            </g>

            {/* reports table */}
            <g transform="translate(650, 380)">
              <rect width="210" height="120" rx="6" fill="#1a1a1a" stroke="#444" strokeWidth="1" />
              <rect width="210" height="28" rx="6" fill="#0070f3" />
              <text x="105" y="19" textAnchor="middle" fill="#fff" fontSize="13" fontWeight="bold">reports</text>
              <text x="10" y="48" fill="#ffcc00" fontSize="11">PK id UUID</text>
              <text x="10" y="64" fill="#4da6ff" fontSize="11">FK agent_run_id UUID</text>
              <text x="10" y="80" fill="#ccc" fontSize="11">title TEXT, summary TEXT</text>
              <text x="10" y="96" fill="#ccc" fontSize="11">full_report JSONB</text>
              <text x="10" y="112" fill="#ccc" fontSize="11">provenance JSONB</text>
            </g>

            {/* Relationship lines */}
            {/* disease_contexts -> cohorts */}
            <line x1="130" y1="150" x2="130" y2="180" stroke="#4da6ff" strokeWidth="1.5" strokeDasharray="4" />
            {/* agent_runs -> tool_calls */}
            <line x1="560" y1="90" x2="650" y2="90" stroke="#4da6ff" strokeWidth="1.5" />
            {/* agent_runs -> evidence_items */}
            <line x1="560" y1="140" x2="620" y2="260" stroke="#4da6ff" strokeWidth="1.5" />
            {/* agent_runs -> reports */}
            <line x1="560" y1="180" x2="620" y2="420" stroke="#4da6ff" strokeWidth="1.5" />
            {/* agent_runs self-ref */}
            <path d="M 450 210 L 450 250 L 380 250 L 380 210" fill="none" stroke="#b088d0" strokeWidth="1.5" strokeDasharray="4" />
            <text x="415" y="268" textAnchor="middle" fill="#b088d0" fontSize="10">parent_run_id (refinement)</text>

            {/* Legend */}
            <g transform="translate(30, 350)">
              <rect width="260" height="130" rx="6" fill="#111" stroke="#333" strokeWidth="1" />
              <text x="15" y="22" fill="#fff" fontSize="12" fontWeight="bold">Legend</text>
              <rect x="15" y="35" width="12" height="12" fill="#ffcc00" />
              <text x="35" y="46" fill="#ccc" fontSize="11">Primary Key</text>
              <rect x="15" y="55" width="12" height="12" fill="#4da6ff" />
              <text x="35" y="66" fill="#ccc" fontSize="11">Foreign Key</text>
              <line x1="15" y1="82" x2="40" y2="82" stroke="#4da6ff" strokeWidth="1.5" />
              <text x="50" y="86" fill="#ccc" fontSize="11">FK relationship</text>
              <line x1="15" y1="102" x2="40" y2="102" stroke="#b088d0" strokeWidth="1.5" strokeDasharray="4" />
              <text x="50" y="106" fill="#ccc" fontSize="11">Self-referencing (refinement)</text>
            </g>
          </svg>
        </div>

        <p style={pStyle}>The <code style={codeStyle}>agent_runs</code> table is central — every tool call, evidence item, and report links back to it via <code style={codeStyle}>agent_run_id</code>. The <code style={codeStyle}>parent_run_id</code> self-reference enables refinement threading, where follow-up queries create child runs linked to their parent.</p>
      </Section>

      {/* ============================================================ */}
      {/* SECTION 3: AGENT REASONING */}
      {/* ============================================================ */}
      <Section title="3. Agent Reasoning & Scoring" id="reasoning">
        <h3 style={h3Style}>Confidence Scoring (Predict Step)</h3>
        <p style={pStyle}>Each therapy prediction receives a confidence score computed from four transparent components:</p>
        <div style={formulaBox}>
          <code style={{ color: '#ffcc00' }}>effectiveScore = clamp(0, 1, baseScore + queryBoost + interactionDelta + clinicalEvidenceBoost)</code>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', marginBottom: '16px' }}>
          <thead><tr style={{ backgroundColor: '#0070f3' }}>
            <th style={thStyle}>Component</th><th style={thStyle}>Value</th><th style={thStyle}>Source</th>
          </tr></thead>
          <tbody>
            <tr style={rowStyle(0)}><td style={tdStyle}><strong style={{ color: '#fff' }}>Base Score</strong></td><td style={tdStyle}>1.0 (high) if freq &gt; 10% AND assocScore &gt; 0.5; 0.6 (moderate) if either threshold met; 0.3 (low) otherwise</td><td style={tdStyle}>cBioPortal + OpenTargets</td></tr>
            <tr style={rowStyle(1)}><td style={tdStyle}><strong style={{ color: '#fff' }}>Query Boost</strong></td><td style={tdStyle}>+0.10 if the parsed query mentions the matching therapy class</td><td style={tdStyle}>Query Parser</td></tr>
            <tr style={rowStyle(0)}><td style={tdStyle}><strong style={{ color: '#fff' }}>Interaction Delta</strong></td><td style={tdStyle}>Sum of applicable modifiers from config-driven interaction rules (can be positive or negative)</td><td style={tdStyle}>Disease Config</td></tr>
            <tr style={rowStyle(1)}><td style={tdStyle}><strong style={{ color: '#fff' }}>Clinical Evidence Boost</strong></td><td style={tdStyle}>+0.10 if CIViC reports Level A (Validated) or Level B (Clinical) evidence</td><td style={tdStyle}>CIViC</td></tr>
          </tbody>
        </table>
        <p style={pStyle}>Labels: score &ge; 0.8 = high, &ge; 0.5 = moderate, &lt; 0.5 = low.</p>

        <h3 style={h3Style}>Benchmark Composite Scoring (7 Dimensions)</h3>
        <p style={pStyle}>Each therapeutic lead is scored across 7 dimensions with transparent weights summing to 1.0:</p>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', marginBottom: '16px' }}>
          <thead><tr style={{ backgroundColor: '#0070f3' }}>
            <th style={thStyle}>Dimension</th><th style={thStyle}>Weight</th><th style={thStyle}>Source</th><th style={thStyle}>Formula</th>
          </tr></thead>
          <tbody>
            <tr style={rowStyle(0)}><td style={tdStyle}>Clinical Precedence</td><td style={tdStyle}>0.15</td><td style={tdStyle}>OpenTargets (known_drug)</td><td style={tdStyle}>clamp01(score)</td></tr>
            <tr style={rowStyle(1)}><td style={tdStyle}>Cancer Gene Census</td><td style={tdStyle}>0.10</td><td style={tdStyle}>OpenTargets (genetic_association)</td><td style={tdStyle}>clamp01(score)</td></tr>
            <tr style={rowStyle(0)}><td style={tdStyle}>Known Drug Evidence</td><td style={tdStyle}>0.10</td><td style={tdStyle}>OpenTargets (somatic_mutation)</td><td style={tdStyle}>clamp01(score)</td></tr>
            <tr style={rowStyle(1)}><td style={tdStyle}>Mutation Frequency</td><td style={tdStyle}>0.20</td><td style={tdStyle}>cBioPortal</td><td style={tdStyle}>clamp01(freq / 30)</td></tr>
            <tr style={rowStyle(0)}><td style={tdStyle}>Drug Evidence</td><td style={tdStyle}>0.15</td><td style={tdStyle}>OpenTargets (druggability)</td><td style={tdStyle}>clamp01(count / 10)</td></tr>
            <tr style={rowStyle(1)}><td style={tdStyle}>Mechanistic Plausibility</td><td style={tdStyle}>0.15</td><td style={tdStyle}>Lead type</td><td style={tdStyle}>0.8 (targeted) or 0.5 (alternative)</td></tr>
            <tr style={rowStyle(0)}><td style={tdStyle}>Clinical Evidence</td><td style={tdStyle}>0.15</td><td style={tdStyle}>CIViC</td><td style={tdStyle}>Level A=1.0, B=0.8, C=0.6, D=0.4, E=0.2</td></tr>
          </tbody>
        </table>
        <p style={pStyle}>Tiers: composite &ge; 0.60 = Tier 1 (Strong), &ge; 0.35 = Tier 2 (Moderate), &lt; 0.35 = Tier 3 (Exploratory).</p>

        <h3 style={h3Style}>Biomarker Interaction Rules</h3>
        <p style={pStyle}>Disease configs define interaction rules that model biological co-dependencies. Two trigger types are supported:</p>
        <ul style={{ color: '#ccc', fontSize: '14px', lineHeight: '1.8' }}>
          <li><strong>co_mutation:</strong> All listed genes must have mutation frequency &gt; 0% (supports <code style={codeStyle}>anyOf</code> for OR semantics)</li>
          <li><strong>single_mutation:</strong> One gene must exceed a <code style={codeStyle}>frequencyThreshold</code></li>
        </ul>
        <p style={pStyle}>When triggered, rules apply confidence deltas (positive or negative) to specific gene–therapy pairs. Example: PIK3CA + ESR1 co-mutation reduces aromatase inhibitor confidence by -0.15 while boosting PI3K inhibitor confidence by +0.10.</p>
      </Section>

      {/* ============================================================ */}
      {/* SECTION 4: ARCHITECTURE */}
      {/* ============================================================ */}
      <Section title="4. Architecture & Pipeline" id="architecture">
        <p style={pStyle}>The system executes a 9-step agentic reasoning pipeline. Each step is a pure async function with logged inputs and outputs.</p>

        <div style={{ overflowX: 'auto', margin: '16px 0' }}>
          <svg viewBox="0 0 800 600" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', maxWidth: '800px', height: 'auto' }}>
            <rect width="800" height="600" fill="#0a0a0a" rx="8" />
            <defs>
              <marker id="arrow" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
                <polygon points="0 0, 8 3, 0 6" fill="#555" />
              </marker>
              <marker id="arrowBlue" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
                <polygon points="0 0, 8 3, 0 6" fill="#4da6ff" />
              </marker>
              <marker id="arrowGreen" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
                <polygon points="0 0, 8 3, 0 6" fill="#338833" />
              </marker>
            </defs>

            {/* Title */}
            <text x="400" y="30" textAnchor="middle" fill="#fff" fontSize="15" fontWeight="bold">9-Step Agentic Reasoning Pipeline</text>

            {/* === ROW 1: Pipeline Steps 1-5 === */}
            {[
              { x: 30,  label: 'Parse Query',   color: '#2a6e8e', step: '1' },
              { x: 180, label: 'Plan',           color: '#0070f3', step: '2' },
              { x: 330, label: 'Retrieve',       color: '#0070f3', step: '3' },
              { x: 480, label: 'Synthesize',     color: '#0070f3', step: '4' },
              { x: 630, label: 'Interactions',   color: '#7a4eb8', step: '5' },
            ].map((s, i) => (
              <g key={i}>
                <rect x={s.x} y="50" width="130" height="44" rx="6" fill={s.color} />
                <text x={s.x + 14} y="68" fill="#fff9" fontSize="10">Step {s.step}</text>
                <text x={s.x + 65} y="82" textAnchor="middle" fill="#fff" fontSize="12" fontWeight="bold">{s.label}</text>
                {i < 4 && <line x1={s.x + 132} y1="72" x2={s.x + 178} y2="72" stroke="#555" strokeWidth="1.5" markerEnd="url(#arrow)" />}
              </g>
            ))}

            {/* Arrow from row 1 to row 2 */}
            <line x1="695" y1="96" x2="695" y2="116" stroke="#555" strokeWidth="1.5" markerEnd="url(#arrow)" />
            <line x1="695" y1="120" x2="160" y2="120" stroke="#555" strokeWidth="1.5" />
            <line x1="160" y1="120" x2="160" y2="130" stroke="#555" strokeWidth="1.5" markerEnd="url(#arrow)" />

            {/* === ROW 2: Pipeline Steps 6-9 === */}
            {[
              { x: 30,  label: 'Predict',        color: '#0070f3', step: '6' },
              { x: 220, label: 'Generate Leads',  color: '#0070f3', step: '7' },
              { x: 410, label: 'Benchmark',       color: '#0070f3', step: '8' },
              { x: 600, label: 'Report',          color: '#338833', step: '9' },
            ].map((s, i) => (
              <g key={i}>
                <rect x={s.x} y="135" width="150" height="44" rx="6" fill={s.color} />
                <text x={s.x + 14} y="153" fill="#fff9" fontSize="10">Step {s.step}</text>
                <text x={s.x + 75} y="167" textAnchor="middle" fill="#fff" fontSize="12" fontWeight="bold">{s.label}</text>
                {i < 3 && <line x1={s.x + 152} y1="157" x2={s.x + 218} y2="157" stroke="#555" strokeWidth="1.5" markerEnd="url(#arrow)" />}
              </g>
            ))}

            {/* === SECTION DIVIDER === */}
            <line x1="30" y1="210" x2="770" y2="210" stroke="#333" strokeWidth="1" strokeDasharray="4" />
            <text x="400" y="232" textAnchor="middle" fill="#888" fontSize="12">External Data Sources (called during Retrieve step)</text>

            {/* === ROW 3: External APIs === */}
            {[
              { x: 30,  label: 'cBioPortal',   sub: 'Mutations & Cohorts',    color: '#ffcc00' },
              { x: 190, label: 'OpenTargets',   sub: 'Associations & Drugs',   color: '#66cc66' },
              { x: 350, label: 'CIViC',         sub: 'Clinical Evidence',      color: '#4da6ff' },
              { x: 510, label: 'DGIdb',         sub: 'Drug Interactions',      color: '#ff8866' },
              { x: 650, label: 'Reactome',      sub: 'Pathway Context',        color: '#b088d0' },
            ].map((api, i) => (
              <g key={i}>
                <rect x={api.x} y="250" width="130" height="50" rx="6" fill="#111" stroke={api.color} strokeWidth="1.5" />
                <text x={api.x + 65} y="270" textAnchor="middle" fill={api.color} fontSize="12" fontWeight="bold">{api.label}</text>
                <text x={api.x + 65} y="288" textAnchor="middle" fill="#888" fontSize="10">{api.sub}</text>
              </g>
            ))}

            {/* Arrows from Retrieve to APIs */}
            <line x1="395" y1="96" x2="395" y2="245" stroke="#4da6ff" strokeWidth="1" strokeDasharray="3" opacity="0.4" />
            

            {/* === SECTION DIVIDER === */}
            <line x1="30" y1="325" x2="770" y2="325" stroke="#333" strokeWidth="1" strokeDasharray="4" />
            <text x="400" y="347" textAnchor="middle" fill="#888" fontSize="12">Storage & Configuration</text>

            {/* === ROW 4: Supabase === */}
            <rect x="80" y="365" width="640" height="70" rx="8" fill="#111" stroke="#338833" strokeWidth="1.5" />
            <text x="400" y="388" textAnchor="middle" fill="#338833" fontSize="14" fontWeight="bold">Supabase (PostgreSQL)</text>
            <text x="400" y="408" textAnchor="middle" fill="#888" fontSize="11">agent_runs · tool_calls · evidence_items · reports · disease_contexts · cohorts</text>
            <text x="400" y="424" textAnchor="middle" fill="#666" fontSize="10">Every step logs input/output JSON with timestamps for full auditability</text>

            {/* Arrow from pipeline to Supabase */}
            <line x1="400" y1="180" x2="400" y2="360" stroke="#338833" strokeWidth="1" strokeDasharray="3" opacity="0.4" />

            {/* === ROW 5: Config === */}
            <rect x="80" y="460" width="640" height="55" rx="8" fill="#111" stroke="#886633" strokeWidth="1.5" />
            <text x="400" y="483" textAnchor="middle" fill="#886633" fontSize="14" fontWeight="bold">Disease Configuration (JSON)</text>
            <text x="400" y="503" textAnchor="middle" fill="#888" fontSize="11">Biomarkers · Heuristics · Interaction Rules · Study IDs · Standard Therapies</text>

            {/* === BOTTOM LABELS === */}
            <text x="400" y="545" textAnchor="middle" fill="#666" fontSize="11">All reasoning is deterministic — no LLM in the scientific pipeline</text>
            <text x="400" y="562" textAnchor="middle" fill="#555" fontSize="10">Adding a new disease requires only a JSON config file — zero code changes</text>

            {/* Annotations */}
            <text x="400" y="580" textAnchor="middle" fill="#555" fontSize="9">Steps color-coded: teal = query parsing | purple = interactions | green = output</text>
          </svg>
        </div>

        <p style={pStyle}>The pipeline is disease-agnostic — the same 9 steps execute regardless of disease context. Each step reads from the shared artifacts object and appends its results, creating a complete audit trail.</p>
      </Section>

      {/* ============================================================ */}
      {/* SECTION 5: BIOAGENTS CITATION */}
      {/* ============================================================ */}
      <Section title="5. BioAgents Architectural Reference" id="bioagents">
        <p style={pStyle}>This system&apos;s agentic architecture is modeled on BioAgents (Mehandru et al., 2025), a multi-agent bioinformatics framework published in Scientific Reports.</p>
        <p style={{ ...pStyle, fontSize: '13px', fontStyle: 'italic', color: '#aaa' }}>
          Mehandru, N., Hall, A.K., Melnichenko, O. et al. (2025). &quot;BioAgents: Bridging the gap in bioinformatics analysis with multi-agent systems.&quot; Scientific Reports, 15, 39036.
        </p>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', marginTop: '12px' }}>
          <thead><tr style={{ backgroundColor: '#0070f3' }}>
            <th style={thStyle}>BioAgents Concept</th><th style={thStyle}>Our Implementation</th>
          </tr></thead>
          <tbody>
            <tr style={rowStyle(0)}><td style={tdStyle}>Multi-step reasoning</td><td style={tdStyle}>9-step pipeline (parseQuery → Report)</td></tr>
            <tr style={rowStyle(1)}><td style={tdStyle}>Evidence retrieval via APIs</td><td style={tdStyle}>5 integrated data sources (cBioPortal, OpenTargets, CIViC, DGIdb, Reactome)</td></tr>
            <tr style={rowStyle(0)}><td style={tdStyle}>Iterative refinement</td><td style={tdStyle}>Refinement threading via parent_run_id</td></tr>
            <tr style={rowStyle(1)}><td style={tdStyle}>Tool call logging</td><td style={tdStyle}>Supabase tool_calls table with full I/O JSON</td></tr>
            <tr style={rowStyle(0)}><td style={tdStyle}>Reproducibility</td><td style={tdStyle}>Deterministic heuristics, stored provenance, config-driven</td></tr>
            <tr style={rowStyle(1)}><td style={tdStyle}>Domain specialization</td><td style={tdStyle}>Disease context JSON configs with biomarker-specific rules</td></tr>
          </tbody>
        </table>
        <p style={{ ...pStyle, fontSize: '13px', color: '#aaa', marginTop: '12px' }}>
          Also informed by: Zhou et al. (2025). &quot;Streamline automated biomedical discoveries with agentic bioinformatics.&quot; Briefings in Bioinformatics, 26(5).
        </p>
      </Section>

      {/* ============================================================ */}
      {/* SECTION 6: QUERY GUIDE */}
      {/* ============================================================ */}
      <Section title="6. Query Guide" id="query-guide">
        <p style={pStyle}>The deterministic query parser recognizes a controlled vocabulary of ~30 terms across four categories. Queries that include recognized terms receive targeted confidence boosts.</p>

        <h3 style={h3Style}>Recognized Vocabulary</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
          <VocabCard title="Therapy Classes" color="#0070f3" items={['endocrine', 'CDK4/6 inhibitor', 'PI3K inhibitor', 'PARP inhibitor', 'immunotherapy', 'anti-EGFR', 'chemotherapy']} />
          <VocabCard title="Clinical Settings" color="#338833" items={['first-line', 'second-line', 'metastatic', 'early-stage', 'neoadjuvant', 'adjuvant', 'resistance', 'progression']} />
          <VocabCard title="Biomarkers" color="#ffcc00" items={['PIK3CA', 'ESR1', 'RB1', 'BRCA1', 'BRCA2', 'PD-L1', 'KRAS', 'NRAS', 'MSI', 'EGFR', 'ALK']} />
          <VocabCard title="Intents" color="#b088d0" items={['predict', 'compare', 'rank', 'explain', 'refine']} />
        </div>

        <h3 style={h3Style}>Example Queries by Disease</h3>
        {Object.entries({
          'HR+/HER2- Breast Cancer': ['Predict therapy response for PIK3CA-mutated HR+ breast cancer', 'Compare endocrine therapy vs CDK4/6 inhibitors in metastatic setting', 'Evaluate PI3K inhibitor options after progression'],
          'TNBC': ['Predict PARP inhibitor response in BRCA-mutated TNBC', 'Evaluate immunotherapy for PD-L1 positive TNBC', 'Compare platinum chemotherapy vs PARP inhibitors'],
          'Colorectal Cancer': ['Predict anti-EGFR resistance in KRAS-mutated CRC', 'Evaluate immunotherapy for MSI-high colorectal cancer', 'Compare targeted therapy options for metastatic CRC'],
        }).map(([disease, queries]) => (
          <div key={disease} style={{ marginBottom: '12px' }}>
            <strong style={{ color: '#fff', fontSize: '14px' }}>{disease}</strong>
            {queries.map((q, i) => (
              <p key={i} style={{ margin: '4px 0 4px 16px', fontSize: '13px', color: '#4da6ff' }}>&quot;{q}&quot;</p>
            ))}
          </div>
        ))}
      </Section>

      {/* ============================================================ */}
      {/* SECTION 7: FAIR COMPLIANCE */}
      {/* ============================================================ */}
      <Section title="7. FAIR Compliance" id="fair">
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead><tr style={{ backgroundColor: '#0070f3' }}>
            <th style={thStyle}>Principle</th><th style={thStyle}>Implementation</th>
          </tr></thead>
          <tbody>
            <tr style={rowStyle(0)}><td style={{ ...tdStyle, fontWeight: 'bold', color: '#fff' }}>Findable</td><td style={tdStyle}>Unique run IDs for every execution. Organized repo structure with clear naming. All runs indexed in Supabase with timestamps. Public GitHub repository. Searchable run history page.</td></tr>
            <tr style={rowStyle(1)}><td style={{ ...tdStyle, fontWeight: 'bold', color: '#fff' }}>Accessible</td><td style={tdStyle}>All 5 APIs are open — no authentication required. Public GitHub repo with README. Live Vercel deployment. Methods page documenting all data sources, scoring formulas, and architecture.</td></tr>
            <tr style={rowStyle(0)}><td style={{ ...tdStyle, fontWeight: 'bold', color: '#fff' }}>Interoperable</td><td style={tdStyle}>Standard JSON data format throughout. REST + GraphQL API interfaces. EFO ontology IDs for disease mapping. Modular architecture with config-driven disease contexts. Supabase PostgreSQL for structured storage.</td></tr>
            <tr style={rowStyle(1)}><td style={{ ...tdStyle, fontWeight: 'bold', color: '#fff' }}>Reusable</td><td style={tdStyle}>Config-driven system — add new diseases without code changes. Documented workflows with full provenance. All agent artifacts stored with traceability. Transparent scoring weights. Export functionality for downstream analysis.</td></tr>
          </tbody>
        </table>
      </Section>

      {/* ============================================================ */}
      {/* SECTION 8: GLOSSARY */}
      {/* ============================================================ */}
      <Section title="8. Glossary" id="glossary">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          {[
            ['Mutation Frequency', 'Percentage of samples in a cohort carrying a somatic mutation in a specific gene. Calculated as mutated samples / total samples.'],
            ['Association Score', 'OpenTargets overall score (0–1) aggregating evidence linking a gene target to a disease across genetic, somatic, drug, and literature sources.'],
            ['Evidence Level (CIViC)', 'A = Validated clinical evidence, B = Clinical trial evidence, C = Case study, D = Preclinical, E = Inferential.'],
            ['Druggability', 'Assessment of whether a gene product can be targeted by therapeutic agents. Includes modality information (small molecule, antibody, etc.).'],
            ['PARP Inhibitor', 'Drugs targeting poly(ADP-ribose) polymerase, effective in BRCA-mutated cancers with defective DNA repair.'],
            ['CDK4/6 Inhibitor', 'Drugs targeting cyclin-dependent kinases 4 and 6, used in HR+ breast cancer to arrest cell cycle progression.'],
            ['Anti-EGFR', 'Monoclonal antibodies (cetuximab, panitumumab) targeting EGFR. Ineffective in KRAS/NRAS-mutated CRC.'],
            ['MSI-H', 'Microsatellite instability-high — indicates defective DNA mismatch repair. Predicts immunotherapy sensitivity.'],
            ['Tractability', 'OpenTargets assessment of how amenable a target is to different therapeutic modalities.'],
            ['Composite Score', 'Weighted sum of 7 evidence dimensions used to tier therapeutic leads from Tier 1 (Strong) to Tier 3 (Exploratory).'],
          ].map(([term, def], i) => (
            <div key={i} style={{ padding: '10px', backgroundColor: '#1a1a1a', borderRadius: '6px', border: '1px solid #333' }}>
              <strong style={{ color: '#4da6ff', fontSize: '13px' }}>{term}</strong>
              <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#ccc', lineHeight: '1.5' }}>{def}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Site Footer */}
      <footer style={{ marginTop: '40px', paddingTop: '16px', borderTop: '1px solid #333', textAlign: 'center', fontSize: '12px', color: '#555' }}>
        <p>Ty Parker | INFO 603/404 Biological Data Management | Prof. Jake Y. Chen</p>
        <p>Powered by cBioPortal · OpenTargets · CIViC · DGIdb · Reactome</p>
        <p><a href="https://github.com/ParkerTy/AgenticTherapyResponsePredictor" style={{ color: '#4da6ff' }} target="_blank" rel="noopener noreferrer">GitHub Repository</a></p>
      </footer>
    </main>
  );
}

/* === Reusable Components === */

function Section({ title, id, children }) {
  return (
    <section id={id} style={{ marginBottom: '32px', padding: '20px', backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '8px' }}>
      <h2 style={{ marginTop: 0, color: '#4da6ff', borderBottom: '1px solid #333', paddingBottom: '8px' }}>{title}</h2>
      {children}
    </section>
  );
}

function SourceCard({ name, url, axis, color, description, dataUsed, apiType, citation }) {
  return (
    <div style={{ padding: '14px', marginBottom: '12px', backgroundColor: '#111', borderRadius: '6px', borderLeft: `3px solid ${color}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
        <strong style={{ color: '#fff', fontSize: '15px' }}>{name}</strong>
        <span style={{ padding: '2px 8px', borderRadius: '12px', fontSize: '11px', backgroundColor: color + '22', color: color, border: `1px solid ${color}44` }}>{axis}</span>
      </div>
      <p style={{ margin: '6px 0', fontSize: '13px', color: '#ccc', lineHeight: '1.5' }}>{description}</p>
      <p style={{ margin: '4px 0', fontSize: '12px', color: '#aaa' }}><strong>Data used:</strong> {dataUsed}</p>
      <p style={{ margin: '4px 0', fontSize: '12px', color: '#aaa' }}><strong>API:</strong> {apiType} | <a href={url} target="_blank" rel="noopener noreferrer" style={{ color: '#4da6ff' }}>{url}</a></p>
      <p style={{ margin: '4px 0 0', fontSize: '11px', color: '#888', fontStyle: 'italic' }}>{citation}</p>
    </div>
  );
}

function VocabCard({ title, color, items }) {
  return (
    <div style={{ padding: '12px', backgroundColor: '#111', borderRadius: '6px', border: `1px solid ${color}44` }}>
      <strong style={{ color, fontSize: '13px' }}>{title}</strong>
      <div style={{ marginTop: '6px', display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
        {items.map((item, i) => (
          <span key={i} style={{ padding: '2px 8px', backgroundColor: color + '15', borderRadius: '10px', fontSize: '11px', color: '#ccc' }}>{item}</span>
        ))}
      </div>
    </div>
  );
}

/* === Styles === */
const pStyle = { fontSize: '14px', color: '#ccc', lineHeight: '1.7', margin: '8px 0' };
const h3Style = { color: '#fff', marginTop: '20px', marginBottom: '8px', fontSize: '16px' };
const formulaBox = { padding: '12px', backgroundColor: '#0a0a0a', borderRadius: '6px', border: '1px solid #333', marginBottom: '12px', overflowX: 'auto', fontSize: '14px' };
const codeStyle = { backgroundColor: '#222', padding: '2px 6px', borderRadius: '3px', fontSize: '13px', color: '#4da6ff' };
const thStyle = { padding: '8px 10px', textAlign: 'left', borderBottom: '2px solid #1a1a1a', color: '#fff', fontSize: '12px' };
const tdStyle = { padding: '8px 10px', borderBottom: '1px solid #333', color: '#ccc', fontSize: '12px' };
const rowStyle = (i) => ({ backgroundColor: i % 2 === 0 ? '#222' : '#1a1a1a' });