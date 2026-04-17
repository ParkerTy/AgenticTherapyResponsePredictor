/**
 * Query Parser — Deterministic Controlled-Vocabulary Extraction
 *
 * Purpose: Convert a user's natural-language query into structured intent that
 * downstream agent steps (plan, predict, benchmark) can act on. Fully
 * deterministic: same input -> same output, every time. No LLM, no randomness.
 *
 * Output shape (parsedQuery):
 *   {
 *     therapyClasses: string[],      // e.g., ['endocrine', 'parp_inhibitor']
 *     clinicalSettings: string[],    // e.g., ['metastatic', 'progression']
 *     biomarkers: string[],          // e.g., ['PIK3CA', 'BRCA1']
 *     intents: string[],             // e.g., ['predict', 'compare']
 *     rawMatches: { term: string, category: string, canonical: string }[],
 *     hasRecognizedTerms: boolean,
 *     originalQuery: string
 *   }
 */

// Controlled vocabulary. Each entry maps a user-facing surface form to a
// canonical token. Surface forms are matched case-insensitively as whole words
// (or hyphen/slash-bounded fragments for things like 'CDK4/6').
//
// To extend: add a new entry. Keep canonical tokens lowercase_snake_case for
// therapy classes / settings / intents, and UPPERCASE for biomarker symbols.

const VOCAB = {
  therapyClasses: {
    endocrine: ['endocrine', 'aromatase', 'aromatase inhibitor', 'letrozole', 'anastrozole', 'tamoxifen', 'fulvestrant'],
    cdk46_inhibitor: ['cdk4/6', 'cdk46', 'cdk 4/6', 'palbociclib', 'ribociclib', 'abemaciclib'],
    pi3k_inhibitor: ['pi3k', 'pi3k inhibitor', 'alpelisib'],
    parp_inhibitor: ['parp', 'parp inhibitor', 'olaparib', 'talazoparib', 'rucaparib'],
    immunotherapy: ['immunotherapy', 'immune checkpoint', 'checkpoint inhibitor', 'pembrolizumab', 'atezolizumab', 'pd-1', 'pd1', 'pd-l1 inhibitor'],
    anti_egfr: ['anti-egfr', 'anti egfr', 'cetuximab', 'panitumumab', 'egfr inhibitor'],
    chemotherapy: ['chemotherapy', 'chemo', 'platinum', 'taxane'],
  },
  clinicalSettings: {
    first_line: ['first-line', 'first line', '1l', 'frontline', 'upfront'],
    second_line: ['second-line', 'second line', '2l'],
    metastatic: ['metastatic', 'advanced', 'stage iv', 'stage 4'],
    early_stage: ['early-stage', 'early stage', 'localized'],
    neoadjuvant: ['neoadjuvant', 'preoperative'],
    adjuvant: ['adjuvant', 'postoperative'],
    progression: ['progression', 'progressed', 'progressing'],
    resistance: ['resistance', 'resistant', 'refractory'],
  },
  biomarkers: {
    PIK3CA: ['pik3ca'],
    ESR1: ['esr1'],
    RB1: ['rb1'],
    BRCA1: ['brca1'],
    BRCA2: ['brca2'],
    BRCA: ['brca'],
    'PD-L1': ['pd-l1', 'pdl1'],
    KRAS: ['kras'],
    NRAS: ['nras'],
    MSI: ['msi', 'msi-high', 'msi-h', 'microsatellite'],
  },
  intents: {
    predict: ['predict', 'prediction', 'predicting', 'forecast'],
    compare: ['compare', 'comparison', 'versus', ' vs '],
    rank: ['rank', 'ranking', 'best', 'top'],
    explain: ['explain', 'explanation', 'why', 'rationale'],
    refine: ['refine', 'narrow', 'focus on'],
  },
};

/**
 * Parse a natural-language query into structured intent.
 * @param {string} query - The user's raw query string.
 * @returns {object} parsedQuery
 */
export function parseQuery(query) {
  const safeQuery = (query || '').toString();
  const lower = ` ${safeQuery.toLowerCase()} `; // pad with spaces for whole-word matching

  const rawMatches = [];
  const buckets = {
    therapyClasses: new Set(),
    clinicalSettings: new Set(),
    biomarkers: new Set(),
    intents: new Set(),
  };

  for (const category of Object.keys(VOCAB)) {
    for (const [canonical, surfaceForms] of Object.entries(VOCAB[category])) {
      for (const term of surfaceForms) {
        // Whole-word-ish match. We allow word boundaries OR adjacency to
        // hyphens/slashes/digits so 'CDK4/6' and 'PD-L1' work.
        const escaped = term.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const pattern = new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`, 'i');
        if (pattern.test(lower)) {
          buckets[category].add(canonical);
          rawMatches.push({ term, category, canonical });
          break; // one surface form per canonical is enough
        }
      }
    }
  }

  const parsed = {
    therapyClasses: [...buckets.therapyClasses],
    clinicalSettings: [...buckets.clinicalSettings],
    biomarkers: [...buckets.biomarkers],
    intents: [...buckets.intents],
    rawMatches,
    hasRecognizedTerms: rawMatches.length > 0,
    originalQuery: safeQuery,
  };

  return parsed;
}

/**
 * Returns a small, curated set of example queries for the UI to display when
 * the parser finds nothing. Disease-aware so suggestions are relevant.
 * @param {string} diseaseKey - The disease config key (e.g., 'tnbc')
 * @returns {string[]}
 */
export function getExampleQueries(diseaseKey) {
  const examples = {
    hr_pos_her2_neg: [
      'Predict response to CDK4/6 inhibitors in metastatic setting',
      'Rank endocrine therapy options given PIK3CA mutation',
      'Explain resistance to aromatase inhibitors',
    ],
    tnbc: [
      'Predict PARP inhibitor response in BRCA-mutated patients',
      'Compare immunotherapy options for metastatic TNBC',
      'Rank chemotherapy regimens for first-line treatment',
    ],
    crc: [
      'Predict anti-EGFR response given KRAS status',
      'Rank immunotherapy candidates for MSI-high tumors',
      'Explain resistance mechanisms in metastatic CRC',
    ],
  };
  return examples[diseaseKey] || [
    'Predict therapy response',
    'Rank treatment options',
    'Explain resistance mechanisms',
  ];
}

/**
 * Returns the full controlled vocabulary for documentation / UI display.
 * @returns {object}
 */
export function getVocabulary() {
  return VOCAB;
}