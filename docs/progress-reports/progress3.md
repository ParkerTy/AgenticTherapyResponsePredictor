# Phase 3 Progress Report

**Project:** Agentic Therapy Response Predictor
**Course:** INFO 603/404 Biological Data Management
**Instructor:** Prof. Jake Y. Chen
**Author:** Ty Parker
**Phase:** 3 of 4 (Intelligence)
**Completion Date:** April 17, 2026

---

## Phase 3 Objectives

Per the project plan, Phase 3 was scoped to deepen the agent's scientific reasoning and multi-turn capabilities while preserving full reproducibility and auditability. The four objectives were:

1. Make the user's natural-language query actually steer agent behavior (Step 1)
2. Add biomarker interaction modeling so predictions reflect gene×gene relationships rather than single-biomarker heuristics (Step 2)
3. Expand benchmarking with OpenTargets datatype dimensions for richer composite scoring (Step 3)
4. Add a run history UI and a refinement-threading feature so the system feels agentic end-to-end, not one-shot (Step 4)

All four were completed, plus Step 5 documentation and closeout.

---

## Completed Work

### Step 1 — Query-Aware Planning

A new `src/lib/agent/queryParser.js` module was added. It performs deterministic controlled-vocabulary extraction over the user's query text. Matched terms are classified into four buckets: therapy classes, clinical settings, biomarkers, and intents. The parser output is propagated into `plan.js` (which emits disease-specific focus areas based on parsed intent) and into `predict.js` (which applies a +0.10 soft-nudge boost to predictions whose therapy class matches the user's expressed intent).

Queries containing zero recognizable terms are now blocked at the API boundary with an HTTP 400 and a list of disease-specific example queries, which the UI renders as clickable buttons.

The parser vocabulary is 100% deterministic, producing byte-identical outputs for byte-identical inputs. Adding a new term requires editing only the `VOCAB` object in `queryParser.js`.

### Step 2 — Biomarker Interaction Modeling

A new `src/lib/agent/interactions.js` module was added. It reads the `interactionRules` array from the active disease config and evaluates each rule's trigger against the synthesis evidence table. Two trigger types are supported: `co_mutation` (all listed genes must be mutated; supports `anyOf` for OR semantics over gene groups) and `single_mutation` (one gene above a frequency threshold).

Each fired rule emits confidence modifiers (biomarker, therapy, confidenceDelta, reason) that `predict.js` consumes to adjust the effective confidence score of matching predictions. Modifiers are additive and clamped to [0, 1]. Every fired and skipped rule is preserved in the audit trail and rendered in the UI's new "Biomarker Interactions" panel.

Seven interaction rules were encoded across the three disease contexts, covering clinically meaningful cases such as PIK3CA + ESR1 co-mutation (endocrine resistance / PI3K combination), RB1 loss (CDK4/6 ineligibility), BRCA1 + BRCA2 co-mutation (HR deficiency), KRAS + NRAS co-mutation (anti-EGFR exclusion), and MSI + KRAS co-occurrence (retained immunotherapy candidacy despite RAS mutation).

### Step 3 — Expanded Benchmarking Dimensions

`benchmark.js` was upgraded from a 4-dimension composite to a 6-dimension composite. The previous single `targetDiseaseScore` dimension was replaced by three OpenTargets datatype-derived dimensions:

- `clinicalPrecedenceScore` (weight 0.20) — clinical-evidence-grade signal
- `cancerGeneCensusScore` (weight 0.15) — curated cancer driver evidence
- `knownDrugEvidenceScore` (weight 0.15) — drug-target evidence proxy

Combined with the retained dimensions (mutation frequency 0.20, druggability 0.15, mechanistic plausibility 0.15), weights total 1.0. Tier thresholds (Tier 1 ≥ 0.6, Tier 2 ≥ 0.35, Tier 3 otherwise) were preserved for backward comparability with Phase 2 runs. Each lead now records its full dimension breakdown, weights vector, and tier for audit.

`synthesize.js` was updated to produce a flat `datatypeScoreMap` per biomarker. `predict.js` propagates it into each prediction's supporting evidence. `generateLeads.js` forwards it into every lead. The chain is explicit and traceable from API response through to tiered lead.

### Step 4 — Run History and Refinement Threading

The `agent_runs` table was extended with two nullable columns (`parent_run_id TEXT`, `parsed_query JSONB`) plus two indexes (parent_run_id and created_at for fast history queries). The migration is backward-compatible; Phase 1 and Phase 2 runs remain valid.

Two new API routes were added: `GET /api/history` (list runs with optional disease-context filter) and `GET /api/run/[runId]` (fetch a single run's full artifacts plus parent and children).

Two new pages were added: `/history` (sortable, filterable table of past runs with links to detail views) and `/run/[runId]` (full run detail with Refinement Thread showing parent ← this run ← children, plus a "Refine This Run" button that submits a follow-up query linked via `parent_run_id`). The home page now includes a nav bar linking Home and History, and the home page's Run ID becomes a clickable link to the run's detail page.

This step turns the system from one-shot into a multi-turn agent: every query is retrievable, every refinement preserves its lineage, and every thread is inspectable from the UI.

### Step 5 — Closeout

README.md was updated with Phase 3 feature documentation, revised project structure, and Phase 3 completion status. This progress report was written and committed.

---

## Hotfixes and Debugging

Phase 3 surfaced three bugs during testing that were fixed and committed with clear provenance:

- **route.js logger signature mismatch** (Step 3 hotfix) — The Step 1 rewrite of `app/api/agent/route.js` called `logAgentRun`, `logToolCall`, `logEvidenceItems`, and `logReport` with snake_case object payloads, but the Phase 1 logger module expected different signatures. The effect was a silent `null value in column "run_id"` constraint violation, so no rows were written to `agent_runs` during Phase 3 development. Fixed by reverting to the logger's canonical call signatures.
- **report() first-argument regression** (Step 3 hotfix) — The Step 1 orchestrator rewrite called `report(artifacts)` instead of `report(diseaseConfig, artifacts)`, causing an undefined-property access inside `report.js` that was caught silently by the orchestrator's try/catch. Every agent run completed but reported `status: error` and produced no `reports` row. Fixed by restoring the two-argument signature and updating `report.js` to surface the new `parseQuery` and `interactions` steps in its output.
- **biomarkerData array-as-object bug** (Step 4 hotfix) — The Step 3 rewrite of `synthesize.js` accessed `retrieveResult.biomarkerData[gene]` expecting an object keyed by gene, but `retrieve.js` returns `biomarkerData` as an array. The lookup returned undefined and mutation frequencies silently defaulted to zero in the evidence table. Downstream predictions and tier assignments were all compromised. Fixed by converting the array into a map before lookup and adding fallback field-name handling.

Each was committed as a separately-messaged hotfix so git history shows exactly what was broken and when it was fixed, rather than bundling them into unrelated commits. This is good reproducibility hygiene for a graded project.

---

## FAIR Compliance — Phase 3 Additions

| Principle | Phase 3 contribution |
|---|---|
| Findable | Every run now has a stable URL at `/run/[runId]`; history page provides browsable index |
| Accessible | New public API endpoints `/api/history` and `/api/run/[runId]` return open JSON |
| Interoperable | Interaction rules use the same schema across all three disease JSONs; datatype scores are standard OpenTargets IDs |
| Reusable | Query vocabulary, interaction rules, and benchmarking weights are all documented and config-editable; no logic is hidden in code |

---

## Changes from Phase 2

| Area | Phase 2 | Phase 3 |
|---|---|---|
| Pipeline length | 7 steps | 9 steps (added parseQuery + interactions) |
| Query influence on output | Decorative | Drives plan focus + predict confidence boost |
| Interaction handling | None | Config-driven gene×gene rules with modifiers |
| Composite scoring | 4 dimensions | 6 dimensions with OpenTargets datatype breakdown |
| Run visibility | Current run only | Full history, individual run detail, refinement threading |
| Agent shape | One-shot | Multi-turn (parent → child → grandchild) |
| Unrecognized query | Runs with no effect | Blocked with example-query guidance |

---

## Known Limitations Carried Forward

- **OpenTargets knownDrugs narrow-EFO issue** (unchanged from Phase 2) — Drug lists from OpenTargets remain tractability-based rather than clinical-drug-name-based, because parent EFO IDs don't match subtype associations.
- **PD-L1 and MSI measurement mismatch** — Still showing 0% mutation frequency because they are measured by expression / microsatellite assays, not point mutations. Phase 4 should either add a `measurementType` weighting adjustment in `predict.js`, or note the limitation more prominently in the report.
- **Supabase Row Level Security** still disabled. Phase 4 optional polish.
- **`disease_contexts` and `cohorts` Supabase tables** intentionally unused; configs live in versioned JSON for reproducibility. Phase 4 could seed these tables from JSON as a one-time script if DB-driven reads become useful.
- **No unit tests.** The project relies on in-browser and SQL-based verification. Phase 4's reproducibility demonstration script will serve as a lightweight substitute.

---

## Phase 4 Plan (Scheduled)

Phase 4 is the final phase and is scheduled for the week of April 22, 2026. Planned deliverables:

1. Optional 4th disease context (e.g., lung adenocarcinoma or melanoma) to strengthen the "reusable across diseases" claim
2. Optional small Tier-2 LLM demo layer — a clearly-labeled LLM query-interpreter that parses free-text into structured parameters, with the scientific core still deterministic. This fulfills the "Tier 1 now + Tier 2 demo in Phase 4" agreement from the Phase 3 kickoff
3. UI polish (loading states, error states, responsive layout pass)
4. Reproducibility demonstration — run each disease context N times with identical queries, document zero variance in deterministic outputs
5. Optional Supabase RLS configuration
6. `final_report.md` (a summative document distinct from the per-phase progress reports)
7. Final .docx submission with all phase screenshots consolidated

---

## Deployment Status

- **Live app:** https://agentic-therapy-response-predictor.vercel.app — all Phase 3 features verified in production
- **Repository:** https://github.com/ParkerTy/AgenticTherapyResponsePredictor — commit history reflects every Phase 3 step and hotfix with descriptive messages
- **Supabase:** schema migration applied to `agent_runs`; 40+ runs logged across Phases 2 and 3, including refinement children
- **Vercel:** auto-deploy on push to main is functioning for every commit