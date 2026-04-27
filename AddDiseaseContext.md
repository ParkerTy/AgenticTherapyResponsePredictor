# Adding a New Disease Context

This guide walks through adding a new disease context to the Agentic Therapy Response Predictor. The system is designed so that **no code changes are required** — you only create a single JSON configuration file. This is the core proof of the system's config-driven, reusable architecture.

---

## Overview

The agent pipeline is disease-agnostic. All 9 steps (parseQuery → plan → retrieve → synthesize → interactions → predict → generateLeads → benchmark → report) execute identically regardless of disease context. The only thing that changes is the **configuration file** that defines:

- Which biomarker genes to analyze
- Which cBioPortal study to query
- Which EFO disease ID to use for OpenTargets
- What therapy classes are standard for this disease
- What biomarker interaction rules apply
- What heuristic mappings link genes to therapies

---

## Step 1: Identify Your Disease Context

Before creating the config, gather this information:

| Item | Where to Find It | Example |
|------|-------------------|---------|
| Disease name and subtype | Clinical knowledge | "Pancreatic Ductal Adenocarcinoma" |
| Key biomarker genes (3–5) | Literature, NCCN guidelines | KRAS, TP53, SMAD4, BRCA1/2, CDKN2A |
| cBioPortal study ID | [cbioportal.org/datasets](https://www.cbioportal.org/datasets) | `paad_tcga_pan_can_atlas_2018` |
| EFO disease ID | [ebi.ac.uk/ols4](https://www.ebi.ac.uk/ols4/ontologies/efo) | `EFO_0002618` |
| Standard therapy classes | Clinical guidelines | gemcitabine, FOLFIRINOX, PARP inhibitor |
| Entrez Gene IDs | [ncbi.nlm.nih.gov/gene](https://www.ncbi.nlm.nih.gov/gene) | KRAS=3845, TP53=7157 |

---

## Step 2: Create the Configuration File

Create a new file in `src/lib/configs/` named after your disease context key. Use snake_case:

```
src/lib/configs/pdac.json
```

Here is the complete template with annotations:

```json
{
  "disease": "Pancreatic Ductal Adenocarcinoma",
  "subtype": "PDAC",
  "efoId": "EFO_0002618",

  "cohort": {
    "studyId": "paad_tcga_pan_can_atlas_2018",
    "molecularProfileSuffix": "_mutations"
  },

  "biomarkers": [
    {
      "gene": "KRAS",
      "entrezGeneId": 3845,
      "role": "driver_oncogene",
      "effect": "constitutive_RAS_activation"
    },
    {
      "gene": "TP53",
      "entrezGeneId": 7157,
      "role": "tumor_suppressor",
      "effect": "loss_of_cell_cycle_control"
    },
    {
      "gene": "SMAD4",
      "entrezGeneId": 4089,
      "role": "tumor_suppressor",
      "effect": "loss_of_TGFbeta_signaling"
    },
    {
      "gene": "BRCA2",
      "entrezGeneId": 675,
      "role": "dna_repair",
      "effect": "homologous_recombination_deficiency"
    },
    {
      "gene": "CDKN2A",
      "entrezGeneId": 1029,
      "role": "tumor_suppressor",
      "effect": "loss_of_cell_cycle_arrest"
    }
  ],

  "standardTherapies": [
    "gemcitabine",
    "FOLFIRINOX",
    "PARP_inhibitor",
    "immunotherapy",
    "targeted_therapy"
  ],

  "heuristics": [
    {
      "condition": "KRAS_mutated",
      "therapy": "MEK_inhibitor",
      "predictedEffect": "potential_sensitivity",
      "reasoning": "KRAS mutations activate RAS-MAPK pathway; MEK inhibitors target downstream signaling."
    },
    {
      "condition": "TP53_mutated",
      "therapy": "chemotherapy",
      "predictedEffect": "variable_response",
      "reasoning": "TP53 loss may reduce apoptotic response to DNA-damaging agents but does not preclude benefit."
    },
    {
      "condition": "BRCA2_mutated",
      "therapy": "PARP_inhibitor",
      "predictedEffect": "favorable",
      "reasoning": "BRCA2 mutations cause homologous recombination deficiency, creating synthetic lethality with PARP inhibition. FDA-approved indication (olaparib) for germline BRCA-mutated PDAC."
    },
    {
      "condition": "BRCA2_mutated",
      "therapy": "platinum_chemotherapy",
      "predictedEffect": "favorable",
      "reasoning": "HRD tumors show increased sensitivity to platinum-based DNA crosslinking agents."
    },
    {
      "condition": "CDKN2A_deleted",
      "therapy": "CDK4/6_inhibitor",
      "predictedEffect": "potential_resistance",
      "reasoning": "CDKN2A loss removes the endogenous CDK4/6 inhibitor p16, but paradoxically may reduce dependency on CDK4/6 activity."
    }
  ],

  "interactionRules": [
    {
      "id": "kras_tp53_co_mutation",
      "name": "KRAS + TP53 co-mutation aggressiveness",
      "type": "co_mutation",
      "genes": ["KRAS", "TP53"],
      "description": "Co-occurrence of KRAS and TP53 mutations is associated with more aggressive disease and reduced chemotherapy benefit.",
      "effects": [
        {
          "targetGene": "KRAS",
          "therapyKey": "chemotherapy",
          "delta": -0.10,
          "reason": "KRAS+TP53 co-mutation associated with chemoresistance"
        }
      ]
    },
    {
      "id": "brca2_platinum_sensitivity",
      "name": "BRCA2 platinum sensitivity",
      "type": "single_mutation",
      "gene": "BRCA2",
      "frequencyThreshold": 0.5,
      "description": "Even low-frequency BRCA2 mutations indicate potential platinum and PARP inhibitor sensitivity.",
      "effects": [
        {
          "targetGene": "BRCA2",
          "therapyKey": "PARP_inhibitor",
          "delta": 0.10,
          "reason": "BRCA2 HRD creates synthetic lethality with PARP inhibition"
        },
        {
          "targetGene": "BRCA2",
          "therapyKey": "platinum_chemotherapy",
          "delta": 0.10,
          "reason": "HRD increases platinum sensitivity"
        }
      ]
    }
  ]
}
```

---

## Step 3: Verify cBioPortal Study ID

Confirm that your study ID exists and has mutation data:

1. Go to `https://www.cbioportal.org/api/studies/{your_study_id}`
2. Verify it returns study metadata
3. Check that `{your_study_id}_mutations` is a valid molecular profile at:
   `https://www.cbioportal.org/api/molecular-profiles?studyId={your_study_id}`

---

## Step 4: Verify EFO Disease ID

Confirm your EFO ID maps correctly in OpenTargets:

1. Go to `https://platform.opentargets.org/disease/{your_efo_id}`
2. Verify the disease page loads with associated targets

---

## Step 5: Test Locally

No code changes needed. Just run the app:

```bash
npm run dev
```

The new disease context will **not** appear in the UI dropdown automatically — you need to add it to the `DISEASE_OPTIONS` array in these files:

### `app/page.js` (Home page)

Find the `DISEASE_OPTIONS` array near the top and add:

```javascript
{ key: 'pdac', label: 'Pancreatic Cancer (PDAC)' },
```

### `app/compare/page.js` (Compare page)

Same change — add to the `DISEASE_OPTIONS` array.

### `app/interpret/page.js` (Interpret page)

Add to the `DISEASE_LABELS` object:

```javascript
pdac: 'PDAC',
```

### `app/history/page.js` (History page)

Add to the `DISEASE_LABELS` object and the filter `<select>` options.

That's it. These are display-only changes — the agent pipeline already handles any config file that exists in `src/lib/configs/`.

---

## Step 6: Verify the Pipeline

1. Select your new disease context on the Home page
2. Use a query like: `"Predict therapy response and benchmark leads"`
3. Verify:
   - Cohort data loads from cBioPortal (correct study, sample count)
   - Mutation frequencies appear for each biomarker
   - OpenTargets association scores are populated
   - CIViC evidence levels appear where available
   - DGIdb drug counts are populated
   - Reactome pathways are assigned
   - Predictions have correct confidence levels and interaction modifiers
   - Benchmarked leads have composite scores and tier assignments
4. Check Supabase — a new row should appear in `agent_runs`, with corresponding rows in `tool_calls`, `evidence_items`, and `reports`

---

## Configuration Reference

### Biomarker Object

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `gene` | string | Yes | HUGO gene symbol (e.g., "KRAS") |
| `entrezGeneId` | number | Yes | NCBI Entrez Gene ID for cBioPortal mutation queries |
| `role` | string | Yes | Biological role: `driver_oncogene`, `tumor_suppressor`, `dna_repair`, etc. |
| `effect` | string | Yes | Expected biological effect of mutation |

### Heuristic Object

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `condition` | string | Yes | Condition label (e.g., "KRAS_mutated") |
| `therapy` | string | Yes | Therapy class key (underscore-separated) |
| `predictedEffect` | string | Yes | One of: `favorable`, `unfavorable`, `variable_response`, `potential_sensitivity`, `potential_resistance` |
| `reasoning` | string | Yes | Plain-English explanation of the biological rationale |

### Interaction Rule Object

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | Unique rule identifier |
| `name` | string | Yes | Human-readable rule name |
| `type` | string | Yes | `co_mutation` or `single_mutation` |
| `genes` | string[] | For co_mutation | Array of gene symbols that must all be mutated |
| `gene` | string | For single_mutation | Single gene symbol |
| `frequencyThreshold` | number | For single_mutation | Minimum mutation frequency % to trigger |
| `description` | string | Yes | Explanation of the biological interaction |
| `effects` | object[] | Yes | Array of `{ targetGene, therapyKey, delta, reason }` |

### Effects Object

| Field | Type | Description |
|-------|------|-------------|
| `targetGene` | string | Which gene's predictions to modify |
| `therapyKey` | string | Which therapy class to adjust |
| `delta` | number | Confidence score adjustment (positive or negative, typically ±0.05 to ±0.15) |
| `reason` | string | Explanation for the adjustment |

---

## Summary

Adding a new disease context requires:

1. **One JSON file** in `src/lib/configs/`
2. **One line** added to `DISEASE_OPTIONS` in page files
3. **Zero code changes** to the agent pipeline, APIs, scoring, or database

This is the core architectural guarantee: the agentic reasoning loop is fully disease-agnostic, and all disease-specific knowledge lives in configuration.