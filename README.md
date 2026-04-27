# Agentic Therapy Response Predictor (ATRP)

A reusable agentic AI scientist for therapy response prediction and generative lead benchmarking across oncology disease contexts.

**Live:** [agentic-therapy-response-predictor.vercel.app](https://agentic-therapy-response-predictor.vercel.app)  
**Course:** INFO 603/404 Biological Data Management — Prof. Jake Y. Chen  
**Author:** Ty Parker — University of Alabama at Birmingham — Spring 2026

---

## Scientific Question

> Can a general-purpose agentic AI workflow integrate open-source clinical, genomic, pathway, and drug–target knowledge to (1) predict therapy response patterns and (2) benchmark newly proposed therapeutic leads, while maintaining transparency, reproducibility, and auditability across disease contexts?

## What This System Does

ATRP executes a **9-step deterministic agentic reasoning pipeline** that integrates 5 open biomedical databases to:

1. **Parse** natural language queries into structured therapy classes, biomarkers, intents, and clinical settings
2. **Plan** a reasoning strategy based on disease configuration
3. **Retrieve** real cohort data, mutations, target–disease associations, clinical evidence, drug interactions, and pathway context
4. **Synthesize** a multi-source evidence table per biomarker gene
5. **Apply interaction rules** modeling biological co-dependencies between biomarkers
6. **Predict** therapy response with transparent confidence scoring (4 components)
7. **Generate therapeutic leads** based on evidence patterns
8. **Benchmark** leads with a 7-dimension composite scoring system
9. **Report** structured results with full provenance

All reasoning is deterministic — identical inputs produce identical outputs. No LLM is used in the scientific pipeline. An optional Groq LLM integration provides plain-English interpretation of results as a Tier-2 layer.

## Integrated Data Sources

| Source | Type | Provides |
|--------|------|----------|
| [cBioPortal](https://www.cbioportal.org) | REST API | TCGA cohort data, somatic mutation profiles, mutation frequencies |
| [OpenTargets](https://platform.opentargets.org) | GraphQL API | Target–disease association scores, druggability, tractability |
| [CIViC](https://civicdb.org) | GraphQL API | Expert-curated clinical evidence levels (A–E), evidence types |
| [DGIdb](https://dgidb.org) | GraphQL API | Drug–gene interactions, FDA approval status, interaction types |
| [Reactome](https://reactome.org) | REST API | Biological pathway context per gene |

All APIs are open and require no authentication keys.

## Disease Contexts

The system supports 4 oncology disease contexts, each defined by a JSON configuration file:

| Context | Config File | Key Biomarkers |
|---------|------------|----------------|
| HR+/HER2− Breast Cancer | `hr_pos_her2_neg.json` | PIK3CA, ESR1, RB1 |
| Triple-Negative Breast Cancer | `tnbc.json` | BRCA1, BRCA2, PD-L1 |
| Colorectal Cancer | `crc.json` | KRAS, NRAS, MSI |
| Lung Adenocarcinoma | `luad.json` | EGFR, ALK, KRAS |

Adding a new disease context requires only creating a JSON config file — zero code changes. See `docs/adding-disease-context.md` for a complete guide.

## Pages

| Page | Route | Purpose |
|------|-------|---------|
| Home | `/` | Run the agentic pipeline with disease context selection |
| About | `/about` | Scientific question, citations, LOI requirements |
| Compare | `/compare` | Side-by-side analysis across multiple disease contexts |
| Interpret | `/interpret` | LLM-powered interpretation of completed runs |
| Methods | `/methods` | Data sources, scoring formulas, architecture, FAIR compliance |
| History | `/history` | Supabase-backed audit log of all agent runs |

## Tech Stack

- **Frontend:** Next.js 16 (JavaScript, App Router)
- **Database:** Supabase (PostgreSQL — 6 tables)
- **LLM:** Groq (llama-3.3-70b-versatile) — interpretation only, not in scientific pipeline
- **Deployment:** Vercel
- **Styling:** Custom CSS design system (JetBrains Mono + Source Sans 3)

## Database Schema

6 tables in Supabase for full provenance tracking:

- `disease_contexts` — disease configuration metadata
- `cohorts` — links cohorts to disease contexts and cBioPortal studies
- `agent_runs` — logs every execution with status, query, timestamps
- `tool_calls` — records input/output JSON for each pipeline step
- `evidence_items` — stores synthesized evidence per gene
- `reports` — stores final reports with full provenance

## Scoring Systems

### Therapy Response Confidence (4 components)

```
effectiveScore = clamp(0, 1, baseScore + queryBoost + interactionDelta + clinicalEvidenceBoost)
```

- **Base Score:** 1.0/0.6/0.3 based on mutation frequency and association score thresholds
- **Query Boost:** +0.10 if query mentions matching therapy class
- **Interaction Delta:** Config-driven biomarker interaction modifiers (±)
- **Clinical Evidence Boost:** +0.10 for CIViC Level A or B evidence

### Lead Benchmarking (7 dimensions, weights sum to 1.0)

| Dimension | Weight | Source |
|-----------|--------|--------|
| Clinical Precedence | 0.15 | OpenTargets (known_drug) |
| Cancer Gene Census | 0.10 | OpenTargets (genetic_association) |
| Known Drug Evidence | 0.10 | OpenTargets (somatic_mutation) |
| Mutation Frequency | 0.20 | cBioPortal |
| Drug Evidence | 0.15 | DGIdb |
| Mechanistic Plausibility | 0.15 | Lead type |
| Clinical Evidence | 0.15 | CIViC |

Tiers: ≥0.60 = Tier 1 (Strong), ≥0.35 = Tier 2 (Moderate), <0.35 = Tier 3 (Exploratory)

## Getting Started

### Prerequisites

- Node.js 18+
- Supabase account (free tier works)
- Groq API key (free — for Interpret page only)

### Setup

```bash
git clone https://github.com/ParkerTy/AgenticTherapyResponsePredictor.git
cd AgenticTherapyResponsePredictor
npm install
cp .env.example .env.local
# Fill in your Supabase and Groq credentials in .env.local
npm run dev
```

### Environment Variables

See `.env.example` for all required variables.

## FAIR Compliance

| Principle | Implementation |
|-----------|---------------|
| **Findable** | Unique run IDs, organized repo, Supabase-indexed runs, public GitHub, searchable history |
| **Accessible** | All 5 APIs are open, public repo, live Vercel deployment, comprehensive Methods page |
| **Interoperable** | JSON format, REST + GraphQL APIs, EFO ontology IDs, modular config-driven architecture |
| **Reusable** | Config-driven (add diseases via JSON), documented workflows, full provenance, transparent scoring |

## Key Citations

- Mehandru, N. et al. (2025). "BioAgents: Bridging the gap in bioinformatics analysis with multi-agent systems." *Scientific Reports*, 15, 39036.
- Schimmelpfennig, J. et al. (2025). "CIViC MCP: A Model Context Protocol Server for Clinical Interpretation of Variants in Cancer." *bioRxiv*.
- Ragueneau, E. et al. (2025). "The Reactome Knowledgebase 2026." *Nucleic Acids Research*.
- Zhou, Y. et al. (2025). "Agentic AI in Bioinformatics: A Comprehensive Survey."
- Drug Target Review (2024). "Agentic AI: Teaching Machines to Think Like Scientists."

## Project Structure

```
├── app/
│   ├── page.js              # Home — primary query interface
│   ├── layout.js             # Root layout with globals.css
│   ├── globals.css           # Shared design system
│   ├── about/page.js         # Scientific question & citations
│   ├── compare/page.js       # Cross-disease comparison
│   ├── interpret/page.js     # LLM interpretation interface
│   ├── methods/page.js       # Technical documentation
│   ├── history/page.js       # Run audit log
│   └── api/
│       ├── agent/route.js    # Main agent pipeline endpoint
│       ├── interpret/route.js # Groq LLM interpretation endpoint
│       ├── history/route.js  # Run history endpoint
│       └── run/[runId]/route.js # Run detail endpoint
├── src/lib/
│   ├── agent/                # 9-step pipeline modules
│   ├── configs/              # Disease context JSON files
│   ├── apis/                 # External API clients
│   └── supabase.js           # Database client
├── docs/
│   ├── progress-reports/     # Phase 1–3 progress reports
│   └── adding-disease-context.md  # Guide to adding new diseases
├── .env.example
└── README.md
```

## License

Academic project — University of Alabama at Birmingham, Spring 2026.