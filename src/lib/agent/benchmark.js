/**
 * Step 8: Benchmark
 * Compares proposed leads against known therapies using multi-source evidence.
 * 7-dimension composite scoring with transparent weights.
 *
 * Dimensions and weights (sum to 1.0):
 *   clinicalPrecedenceScore   = clamp01(dtMap.known_drug ?? 0)          × 0.15
 *   cancerGeneCensusScore     = clamp01(dtMap.genetic_association ?? 0)  × 0.10
 *   knownDrugEvidenceScore    = clamp01(dtMap.somatic_mutation ?? 0)     × 0.10
 *   mutationFrequencyScore    = clamp01(freqRaw / 30)                   × 0.20
 *   drugEvidenceScore         = clamp01(druggabilityCount / 10)          × 0.15
 *   mechanisticPlausibility   = (targeted_therapy ? 0.8 : 0.5)          × 0.15
 *   clinicalEvidenceScore     = CIViC level mapping (A=1.0 ... E=0.2)   × 0.15
 *
 * Tiers:
 *   composite >= 0.60 → 'Tier 1 — Strong'
 *   composite >= 0.35 → 'Tier 2 — Moderate'
 *   else → 'Tier 3 — Exploratory'
 */

export async function benchmark(leadsResult) {
  const clamp01 = (v) => Math.max(0, Math.min(1, v));

  // Map CIViC evidence levels to scores
  const civicLevelScores = { A: 1.0, B: 0.8, C: 0.6, D: 0.4, E: 0.2 };

  const benchmarked = leadsResult.leads.map((lead) => {
    // Extract data from lead and its supporting evidence
    const freqRaw = parseFloat(lead.supportingMutationFrequency) || 0;
    const druggabilityCount = lead.druggabilityCount || lead.knownDrugsInClass || 0;
    const dtMap = lead.datatypeScoreMap || {};

    // === Dimension 1: Clinical Precedence (OpenTargets known_drug datatype) ===
    const clinicalPrecedenceScore = clamp01(dtMap.known_drug ?? 0);

    // === Dimension 2: Cancer Gene Census (OpenTargets genetic_association datatype) ===
    const cancerGeneCensusScore = clamp01(dtMap.genetic_association ?? 0);

    // === Dimension 3: Known Drug Evidence (OpenTargets somatic_mutation datatype) ===
    const knownDrugEvidenceScore = clamp01(dtMap.somatic_mutation ?? 0);

    // === Dimension 4: Mutation Frequency (cBioPortal) ===
    const mutationFrequencyScore = clamp01(freqRaw / 30);

    // === Dimension 5: Drug Evidence (OpenTargets druggability count) ===
    const drugEvidenceScore = clamp01(druggabilityCount / 10);

    // === Dimension 6: Mechanistic Plausibility (lead type) ===
    const mechanisticPlausibility = lead.leadType === 'targeted_therapy' ? 0.8 : 0.5;

    // === Dimension 7: Clinical Evidence (CIViC) ===
    const civicLevel = lead.civicBestLevel || null;
    const civicBaseScore = civicLevelScores[civicLevel] || 0;
    // Boost slightly if there are many predictive evidence items
    const civicPredictiveBoost = Math.min((lead.civicPredictiveCount || 0) / 20, 0.2);
    const clinicalEvidenceScore = clamp01(civicBaseScore + civicPredictiveBoost);

    // === Weights (sum to 1.0) ===
    const weights = {
      clinicalPrecedence: 0.15,
      cancerGeneCensus: 0.10,
      knownDrugEvidence: 0.10,
      mutationFrequency: 0.20,
      drugEvidence: 0.15,
      mechanisticPlausibility: 0.15,
      clinicalEvidence: 0.15,
    };

    // === Composite Score ===
    const composite = clamp01(
      clinicalPrecedenceScore * weights.clinicalPrecedence +
      cancerGeneCensusScore * weights.cancerGeneCensus +
      knownDrugEvidenceScore * weights.knownDrugEvidence +
      mutationFrequencyScore * weights.mutationFrequency +
      drugEvidenceScore * weights.drugEvidence +
      mechanisticPlausibility * weights.mechanisticPlausibility +
      clinicalEvidenceScore * weights.clinicalEvidence
    );

    // === Tier Assignment ===
    let tier;
    if (composite >= 0.60) tier = 'Tier 1 — Strong';
    else if (composite >= 0.35) tier = 'Tier 2 — Moderate';
    else tier = 'Tier 3 — Exploratory';

    // Build rationale string
    const rationale = [
      `Clinical precedence: ${clinicalPrecedenceScore.toFixed(2)} × ${weights.clinicalPrecedence}`,
      `Cancer gene census: ${cancerGeneCensusScore.toFixed(2)} × ${weights.cancerGeneCensus}`,
      `Known drug evidence: ${knownDrugEvidenceScore.toFixed(2)} × ${weights.knownDrugEvidence}`,
      `Mutation frequency: ${mutationFrequencyScore.toFixed(2)} × ${weights.mutationFrequency}`,
      `Drug evidence: ${drugEvidenceScore.toFixed(2)} × ${weights.drugEvidence}`,
      `Mechanistic plausibility: ${mechanisticPlausibility.toFixed(2)} × ${weights.mechanisticPlausibility}`,
      `Clinical evidence (CIViC${civicLevel ? ' Level ' + civicLevel : ''}): ${clinicalEvidenceScore.toFixed(2)} × ${weights.clinicalEvidence}`,
    ].join(' | ');

    return {
      ...lead,
      benchmarkScore: {
        dimensions: {
          clinicalPrecedenceScore: parseFloat(clinicalPrecedenceScore.toFixed(3)),
          cancerGeneCensusScore: parseFloat(cancerGeneCensusScore.toFixed(3)),
          knownDrugEvidenceScore: parseFloat(knownDrugEvidenceScore.toFixed(3)),
          mutationFrequencyScore: parseFloat(mutationFrequencyScore.toFixed(3)),
          drugEvidenceScore: parseFloat(drugEvidenceScore.toFixed(3)),
          mechanisticPlausibility: parseFloat(mechanisticPlausibility.toFixed(3)),
          clinicalEvidenceScore: parseFloat(clinicalEvidenceScore.toFixed(3)),
        },
        weights,
        composite: parseFloat(composite.toFixed(3)),
        tier,
        benchmarkRationale: rationale,
      },
    };
  });

  // Sort by composite score descending
  benchmarked.sort((a, b) => b.benchmarkScore.composite - a.benchmarkScore.composite);

  return {
    benchmarkedLeads: benchmarked,
    totalBenchmarked: benchmarked.length,
    tier1Count: benchmarked.filter((b) => b.benchmarkScore.tier.includes('Tier 1')).length,
    tier2Count: benchmarked.filter((b) => b.benchmarkScore.tier.includes('Tier 2')).length,
    tier3Count: benchmarked.filter((b) => b.benchmarkScore.tier.includes('Tier 3')).length,
    scoringMethod: '7-dimension composite: Clinical Precedence (15%), Cancer Gene Census (10%), Known Drug Evidence (10%), Mutation Frequency (20%), Drug Evidence (15%), Mechanistic Plausibility (15%), Clinical Evidence/CIViC (15%)',
    tierThresholds: { tier1: '>= 0.60', tier2: '>= 0.35', tier3: '< 0.35' },
    benchmarkedAt: new Date().toISOString(),
  };
}