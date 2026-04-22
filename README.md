# Agentic Therapy Response Predictor

A reusable, disease-agnostic agentic AI system for oncology therapy response prediction and therapeutic lead benchmarking. Built for INFO 603/404 Biological Data Management (Prof. Jake Y. Chen, Spring 2026). Inspired by BioAgents (2025).

**Live app:** https://agentic-therapy-response-predictor.vercel.app
**Repository:** https://github.com/ParkerTy/AgenticTherapyResponsePredictor

---

## Scientific Question

Can a general-purpose agentic AI workflow integrate open-source clinical, genomic, pathway, and drug-target knowledge to (1) predict therapy response patterns and (2) benchmark newly proposed therapeutic leads, while maintaining transparency, reproducibility, and auditability across disease contexts?

---

## The Agent Loop

Every run executes this deterministic, fully-logged 9-step pipeline:

1. **parseQuery** — deterministic keyword parser extracts therapy classes, biomarkers, clinical settings, and intents from the user's natural-language query
2. **plan** — query-aware execution plan listing the analysis focus and tools required
3. **retrieve** — live cBioPortal and OpenTargets API calls for cohort, mutations, and target-disease evidence
4. **synthesize** — builds the evidence table joining mutation frequencies, association scores, and druggability
5. **interactions** — evaluates gene×gene biomarker interaction rules from config
6. **predict** — applies disease-specific heuristics; confidence modulated by query intent and interaction rules
7. **generateLeads** — proposes targeted-therapy and alternative-mechanism lead candidates
8. **benchmark** — 6-dimension composite scoring with OpenTargets datatype breakdown
9. **report** — structured report with full provenance and audit trail

Every step is logged to Supabase and surfaced in the UI's reasoning trace.

---

## Disease Contexts (Configurable)

Disease contexts are JSON config files in `src/lib/configs/`. Adding a new context requires only a new JSON file — zero code changes.

- **HR+/HER2- Breast Cancer** (`hr_pos_her2_neg.json`) — ESR1, PIK3CA, RB1
- **Triple-Negative Breast Cancer** (`tnbc.json`) — BRCA1, BRCA2, PD-L1
- **Colorectal Cancer** (`crc.json`) — KRAS, NRAS, MSI

---

## Tech Stack

- **Frontend/Fullstack:** Next.js (JavaScript), deployed on Vercel
- **Backend:** Next.js API routes
- **Database:** Supabase (PostgreSQL)
- **External APIs:** cBioPortal REST API, OpenTargets GraphQL API (both open, no keys required)
- **Agent logic:** Modular JavaScript; no LLM (deterministic by design for reproducibility)

---

## Phase Status

| Phase | Scope | Status |
|---|---|---|
| Phase 1 | Project setup, agent skeleton, Supabase schema, disease configs | ✅ Complete |
| Phase 2 | Live cBioPortal + OpenTargets integration, evidence tables, logging | ✅ Complete |
| Phase 3 | Query-aware agent, interaction modeling, expanded benchmarking, run history + refinement | ✅ Complete |
| Phase 4 | UI polish, additional disease context, reproducibility demonstration, final report | ⏳ Scheduled |

---

## Phase 3 Feature Highlights

**Query-Aware Agent (Step 1)** — User queries are parsed into structured intent (therapy classes, biomarkers, clinical settings, intents) via a deterministic controlled vocabulary. Parsed query drives plan focus areas and applies a +0.10 soft-nudge confidence boost to predictions matching the user's therapy-class intent. Queries with no recognizable terms are rejected with example-query guidance.

**Biomarker Interaction Modeling (Step 2)** — `interactionRules` in each disease JSON encodes gene×gene relationships (e.g., PIK3CA + ESR1 co-mutation → endocrine resistance + PI3K indication; RB1 loss → CDK4/6 inhibitor ineligibility; KRAS + NRAS co-mutation → strengthened anti-EGFR resistance; BRCA1 + BRCA2 co-mutation → heightened PARP/platinum sensitivity). A new `interactions` agent step evaluates rules and emits confidence modifiers that feed into predict.

**Expanded Benchmarking (Step 3)** — 6-dimension composite scoring: clinical_precedence (0.20), cancer_gene_census (0.15), known_drug (0.15), mutation frequency (0.20), druggability (0.15), mechanistic plausibility (0.15). Weights sum to 1.0; tier bands unchanged for backward comparability.

**Run History + Refinement Threading (Step 4)** — Full history page at `/history` with per-disease filtering; individual run detail page at `/run/[runId]` showing all prior steps. "Refine This Run" button submits a follow-up query that links to the parent via `parent_run_id`, producing parent → child → grandchild conversation threading.

---

## FAIR Compliance

### Findable
- Organized repo structure (`/src`, `/docs/progress-reports`, `/src/lib/configs`)
- Every run is indexed by deterministic `run_id` in Supabase
- Consistent naming conventions for files, configs, tables, and agent steps
- Public repo on GitHub with descriptive commit history

### Accessible
- Public GitHub repository
- Live web app on Vercel (no auth required for demo)
- API endpoints return JSON
- No paywalled or proprietary data dependencies

### Interoperable
- Data exchanged in standard formats: JSON, CSV (exportable via Supabase)
- REST + GraphQL clients for external APIs
- Modular JS architecture; each agent step is a pure async function
- Disease contexts are plain JSON so they can be consumed by any language

### Reusable
- Fully config-driven: adding a new disease context requires no code changes
- Every agent run is fully logged with inputs, outputs, and timestamps
- Deterministic reasoning (no LLM): same inputs produce same outputs
- Transparent, documented heuristics with auditable weights and thresholds
- All code and configs are version-controlled with commit-level provenance

---

## Agent Design Principles

- **Deterministic by default** — no LLM in the reasoning pipeline; outputs are reproducible
- **Config-driven** — disease contexts, biomarkers, heuristics, and interaction rules live in JSON
- **Transparent** — all scoring formulas and weights are documented in-code
- **Auditable** — every step, input, and output is logged to Supabase
- **Composable** — each agent step is a pure async function; swappable and independently testable
- **No black-box ML** — every prediction is explained by biomarker evidence and heuristic rules

---

## Environment Variables

See `.env.example` for required variables. The following are needed for full functionality:

- `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase anonymous API key
- `CBIOPORTAL_API` — cBioPortal REST API endpoint (default: https://www.cbioportal.org/api)
- `OPENTARGETS_API` — OpenTargets API endpoint (default: https://api.platform.opentargets.org/api/v4)
- `LLM_API_KEY` — reserved for optional Phase 4 LLM query-interpreter demo

---

## Project Structure
/app
/api
/agent/route.js           POST /api/agent
/history/route.js         GET /api/history
/run/[runId]/route.js     GET /api/run/[runId]
/history/page.js            /history UI
/run/[runId]/page.js        /run/[runId] UI
page.js                     / home UI
layout.js, globals.css      Next.js scaffold
/src
/components                 Reserved for shared UI components
/lib
/agent                    The 9-step reasoning pipeline
index.js                Orchestrator
queryParser.js          Deterministic query parser (Phase 3)
plan.js, retrieve.js, synthesize.js
interactions.js         Biomarker interaction evaluator (Phase 3)
predict.js, generateLeads.js, benchmark.js, report.js
logger.js               Supabase write layer
/api                      External API clients
cbioportal.js
opentargets.js
/configs                  Disease context JSON (drives agent behavior)
hr_pos_her2_neg.json
tnbc.json
crc.json
supabase.js               Supabase client
/docs
/progress-reports           Phase progress reports (md)
README.md, .env.example, package.json, ...
---

## Running Locally

```powershell
npm install
cp .env.example .env.local  # then edit .env.local with your Supabase credentials
npm run dev
# open http://localhost:3000
```

---

## Credits

- BioAgents (2025) — design inspiration for the agentic loop
- cBioPortal — open cancer genomics data
- OpenTargets — open target-disease evidence
- Supabase — open-source Postgres backend
- Next.js + Vercel — hosting and framework