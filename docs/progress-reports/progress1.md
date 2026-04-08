# Progress Report 1 — Foundation

**Student:** Ty Parker
**Course:** INFO 603/404 Biological Data Management
**Date:** April 8, 2026

## Phase 1 Objectives

- Set up project repository and structure
- Initialize Next.js application
- Design and create Supabase database schema
- Define disease context JSON configurations
- Implement agent skeleton with 7-step reasoning loop
- Connect agent logging to Supabase
- Deploy working version to Vercel

## Completed Work

### Project Setup
- Initialized a Next.js (JavaScript) project with App Router
- Established folder structure: `src/lib/agent`, `src/lib/configs`, `src/components`, `docs/progress-reports`
- Created `.env.example` and `.env.local` for environment configuration

### Database Schema (Supabase)
Six tables were created to support reproducibility and provenance:
- `disease_contexts` — stores disease configuration metadata
- `cohorts` — links cohorts to disease contexts and cBioPortal study IDs
- `agent_runs` — logs every agent execution with status and timestamps
- `tool_calls` — records input/output for each reasoning step
- `evidence_items` — stores synthesized evidence with gene, role, effect, and source
- `reports` — stores final reports with full provenance JSON

### Disease Context Configurations
Three JSON configs were created, each defining biomarkers, heuristics, standard therapies, and endpoints:
- HR+/HER2- Breast Cancer (`hr_pos_her2_neg.json`)
- Triple-Negative Breast Cancer (`tnbc.json`)
- Colorectal Cancer (`crc.json`)

### Agent Skeleton
The 7-step agentic reasoning loop was implemented as modular JavaScript functions:
1. **Plan** — generates a step-by-step reasoning plan from disease config
2. **Retrieve** — stub returning placeholder data (real APIs in Phase 2)
3. **Synthesize** — builds an evidence table from config and retrieved data
4. **Predict** — applies transparent rule-based heuristics
5. **Generate Leads** — proposes mechanism-level therapeutic leads
6. **Benchmark** — stub scoring (real composite scoring in Phase 3)
7. **Report** — produces structured output with provenance

Each step logs its output and timestamp into a unified artifacts object.

### Supabase Integration
A logging module (`logger.js`) writes agent runs, tool calls, evidence items, and reports to Supabase after each execution. Verified that data appears in all four tables.

### Frontend
A landing page allows users to select a disease context, enter a query, run the agent, and view the full reasoning trace with expandable step details.

## FAIR Compliance (Phase 1)

| Principle | Implementation |
|---|---|
| Findable | Organized repo structure, clear file naming |
| Accessible | Public GitHub repo, documented README |
| Interoperable | JSON configs, REST API, modular architecture |
| Reusable | Config-driven disease contexts, no hardcoded logic |

## Architecture Decisions

- **No LLM dependency:** All reasoning uses transparent, deterministic heuristics. This improves reproducibility — a core grading criterion.
- **BioAgents simulation:** The agent loop is inspired by BioAgents (2025) but implemented as custom modular code to ensure full control, no external dependency risk, and clear auditability.
- **Stub-first approach:** Retrieve and Benchmark steps return placeholder data in Phase 1. Real API integration follows in Phase 2 and Phase 3.

## Known Limitations

- Retrieve step returns stub data (no live API calls yet)
- Benchmark scoring is placeholder
- No UI for viewing past runs or reasoning history
- Supabase Row Level Security not yet configured

## Next Phase (Phase 2) Plan

- Integrate cBioPortal API for real cohort and mutation data
- Integrate OpenTargets API for target-disease evidence
- Build real evidence tables from API responses
- Enhance logging with full tool call input/output
