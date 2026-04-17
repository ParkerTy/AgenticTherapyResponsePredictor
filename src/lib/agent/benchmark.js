/**
 * Benchmark Step — Multi-dimensional composite scoring of therapeutic leads.
 *
 * Phase 3 Step 3: composite now uses 6 weighted dimensions, with the previous
 * single 'targetDiseaseScore' replaced by three OpenTargets datatype-derived
 * scores (clinical_precedence, cancer_gene_census/genetic_association,
 * known_drug). All weights sum to 1.0; tier bands unchanged for backward
 * comparability.
 *
 * Dimensions and weights:
 *   clinicalPrecedenceScore   0.20  (OpenTargets 'known_drug' datatype, strongest clinical evidence)
 *   cancerGeneCensusScore     0.15  (OpenTargets 'genetic_association', encompasses curated driver lists)
 *   knownDrugEvidenceScore    0.15  (OpenTargets 'somatic_mutation' as proxy for tumor-relevant drug evidence)
 *   mutationFrequencyScore    0.20  (cohort-level prevalence, freq/30 capped at 1)
 *   drugEvidenceScore         0.15  (tractability/druggability count, count/10 capped at 1)
 *   mechanisticPlausibility   0.15  (0.8 targeted_therapy, 0.5 alternative_mechanism)
 *
 * Each lead's composite, dimension breakdown, weights, and tier are returned
 * for full audit transparency.
 */

const WEIGHTS = {
  clinicalPrecedenceScore: 0.20,
  cancerGeneCensusScore: 0.15,
  knownDrugEvidenceScore: 0.15,
  mutationFrequencyScore: 0.20,
  drugEvidenceScore: 0.15,
  mechanisticPlausibility: 0.15,
};

const TIER_THRESHOLDS = {
  tier1: 0.60,
  tier2: 0.35,
};

export async function benchmark(leadsResult) {
  const leads = leadsResult.leads || [];
  const benchmarked = [];

  for (const lead of leads) {
    const dtMap = lead.datatypeScoreMap || {};

    // Map OpenTargets datatype IDs to our three evidence-strength dimensions.
    // We use defensive lookups because not all targets have all datatypes.
    const clinicalPrecedenceScore = clamp01(dtMap.known_drug ?? 0);
    const cancerGeneCensusScore = clamp01(dtMap.genetic_association ?? 0);
    const knownDrugEvidenceScore = clamp01(dtMap.somatic_mutation ?? 0);

    const freqRaw = parseFloat(lead.supportingMutationFrequency) || 0;
    const mutationFrequencyScore = clamp01(freqRaw / 30);

    const drugEvidenceScore = clamp01((lead.knownDrugsInClass ?? 0) / 10);

    const mechanisticPlausibility = lead.type === 'targeted_therapy' ? 0.8 : 0.5;

    const dimensions = {
      clinicalPrecedenceScore,
      cancerGeneCensusScore,
      knownDrugEvidenceScore,
      mutationFrequencyScore,
      drugEvidenceScore,
      mechanisticPlausibility,
    };

    const compositeScore = clamp01(
      dimensions.clinicalPrecedenceScore * WEIGHTS.clinicalPrecedenceScore +
      dimensions.cancerGeneCensusScore * WEIGHTS.cancerGeneCensusScore +
      dimensions.knownDrugEvidenceScore * WEIGHTS.knownDrugEvidenceScore +
      dimensions.mutationFrequencyScore * WEIGHTS.mutationFrequencyScore +
      dimensions.drugEvidenceScore * WEIGHTS.drugEvidenceScore +
      dimensions.mechanisticPlausibility * WEIGHTS.mechanisticPlausibility
    );

    const tier = assignTier(compositeScore);

    benchmarked.push({
      ...lead,
      compositeScore,
      tier,
      dimensions,
      weights: WEIGHTS,
      benchmarkRationale: buildBenchmarkRationale(lead, dimensions, compositeScore, tier),
    });
  }

  benchmarked.sort((a, b) => b.compositeScore - a.compositeScore);

  return {
    leads: benchmarked,
    totalLeads: benchmarked.length,
    tier1Count: benchmarked.filter((l) => l.tier === 'Tier 1 Strong').length,
    tier2Count: benchmarked.filter((l) => l.tier === 'Tier 2 Moderate').length,
    tier3Count: benchmarked.filter((l) => l.tier === 'Tier 3 Exploratory').length,
    weightsUsed: WEIGHTS,
    tierThresholds: TIER_THRESHOLDS,
    benchmarkedAt: new Date().toISOString(),
  };
}

function assignTier(score) {
  if (score >= TIER_THRESHOLDS.tier1) return 'Tier 1 Strong';
  if (score >= TIER_THRESHOLDS.tier2) return 'Tier 2 Moderate';
  return 'Tier 3 Exploratory';
}

function clamp01(x) {
  if (typeof x !== 'number' || Number.isNaN(x)) return 0;
  return Math.max(0, Math.min(1, x));
}

function buildBenchmarkRationale(lead, dims, composite, tier) {
  const top = Object.entries(dims)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 2)
    .map(([k, v]) => `${k}=${v.toFixed(2)}`)
    .join(', ');
  return `${tier}. Composite score ${composite.toFixed(2)} driven primarily by ${top}.`;
}