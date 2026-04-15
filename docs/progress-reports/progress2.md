# Progress Report 2 — Data & Evidence

**Student:** Ty Parker
**Course:** INFO 603/404 Biological Data Management
**Date:** April 15, 2026

## Phase 2 Objectives

- Integrate cBioPortal API for real cohort and mutation data
- Integrate OpenTargets GraphQL API for target-disease evidence and druggability
- Replace all stub data with live API responses
- Build real evidence tables from multi-source data
- Enhance prediction logic with data-driven confidence scoring
- Implement composite benchmarking with transparent weights
- Update UI with dark theme and structured result display
- Deploy updated version to Vercel

## Completed Work

### cBioPortal API Integration
A dedicated API client (src/lib/api/cbioportal.js) was implemented to retrieve real clinical and genomic data from the open cBioPortal REST API. No API key is required. The client includes:
- **getStudy()** — Fetches study metadata for a given cBioPortal study ID
- **getSamples()** — Retrieves all samples in a study, providing cohort size
- **getMutations()** — Resolves gene symbols to Entrez Gene IDs and fetches somatic mutations using the POST-based mutation endpoint
- **computeMutationFrequencies()** — Calculates per-gene mutation frequency by counting unique mutated samples against total cohort size

Key implementation detail: the cBioPortal mutations endpoint requires Entrez Gene IDs rather than gene symbols. The client resolves these automatically via the /genes/ endpoint.

### OpenTargets GraphQL API Integration
An OpenTargets API client (src/lib/api/opentargets.js) was implemented to retrieve target-disease association evidence via GraphQL. No API key is required. The client includes:
- **getTargetId()** — Searches for a gene symbol and returns the Ensembl Gene ID
- **getTargetDiseaseEvidence()** — Fetches association scores between target and disease with datasource-level breakdowns
- **getKnownDrugs()** — Retrieves tractability and druggability information for a target

Disease contexts are mapped to EFO ontology IDs (Breast Cancer: EFO_0000305, Colorectal Cancer: EFO_0000365).

### Evidence Table Generation
The synthesize step now integrates data from both APIs into a unified evidence table. For each biomarker gene, the table assembles: mutation frequency from cBioPortal, disease association score from OpenTargets, druggability assessment, and clinical effect from disease configuration heuristics.

### Data-Driven Prediction Logic
The predict step was enhanced to incorporate real mutation frequencies and association scores into confidence assessments:
- **High confidence:** mutation frequency > 10% AND association score > 0.5
- **Moderate confidence:** either metric above its threshold
- **Low confidence:** neither threshold met

All heuristics remain fully transparent and deterministic with no black-box ML.

### Composite Lead Benchmarking
The benchmark step uses a transparent composite scoring formula:
- OpenTargets association score: 35% weight
- Mutation frequency score: 25% weight (normalized: 30%+ = 1.0)
- Drug evidence score: 25% weight (normalized: 10+ druggability markers = 1.0)
- Mechanistic plausibility: 15% weight (0.8 targeted, 0.5 alternative)

Leads classified into tiers: Tier 1 (>= 0.6), Tier 2 (>= 0.35), Tier 3 (< 0.35).

### Updated User Interface
Frontend redesigned with dark theme and structured sections: Report Summary, Cohort Data, Evidence Table, Therapy Response Predictions, Benchmarked Therapeutic Leads, and Full Reasoning Trace. Color coding indicates confidence levels and score thresholds.

## Key Findings from Live Data

### HR+/HER2- Breast Cancer
- PIK3CA mutated in 63.80% of samples (319/500) — highest frequency, consistent with known biology
- ESR1 mutated in 1.00% (5/500) — low in primary tumors, increases in metastatic setting
- RB1 mutated in 3.80% (19/500) — relevant for CDK4/6 inhibitor response
- All three targets confirmed druggable

### Triple-Negative Breast Cancer
- BRCA1 mutated in 2.60% (13/500), BRCA2 in 3.00% (15/500) — consistent with expected rates
- PD-L1 showed 0% somatic mutations but high association score (0.419) and druggability (11 modalities)

### Colorectal Cancer
- KRAS mutated in 19.20% (96/500) — major driver consistent with published CRC rates
- NRAS mutated in 4.00% (20/500) — secondary RAS pathway activation
- MSI showed 0% somatic mutations — MSI status requires microsatellite testing, not mutation calling

## FAIR Compliance (Phase 2)

| Principle | Implementation |
|---|---|
| Findable | Each run has unique ID; all results indexed in Supabase with timestamps |
| Accessible | All APIs open (no keys); public repo; live Vercel deployment |
| Interoperable | REST + GraphQL APIs; JSON format; EFO ontology IDs for disease mapping |
| Reusable | Same code runs across 3 contexts; config-driven; documented scoring weights |

## Changes from Phase 1

| Component | Phase 1 | Phase 2 |
|---|---|---|
| Retrieve step | Stub data with placeholders | Live cBioPortal + OpenTargets API calls |
| Evidence table | Config-only biomarker mapping | Multi-source integration with real data |
| Predictions | Heuristics without confidence | Data-driven confidence scoring |
| Benchmarking | Stub scoring (all null) | Composite scoring with weights and tiers |
| Report | Basic step count summary | Cohort stats, prediction breakdown, tier counts |
| UI | Basic light theme with raw JSON | Dark theme with structured sections |

## Known Limitations

- OpenTargets knownDrugs endpoint returns limited disease-specific matches; druggability via tractability data used instead
- PD-L1 and MSI not captured by somatic mutation calling; require expression or microsatellite assays
- No UI for viewing historical runs or comparing across disease contexts
- Supabase Row Level Security not yet configured

## Next Phase (Phase 3) Plan

- Enhance prediction logic with deeper biomarker interaction modeling
- Improve lead generation with pathway-level reasoning
- Add run history page to view and compare past agent executions
- Expand benchmarking with additional evidence dimensions