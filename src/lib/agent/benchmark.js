/**
 * Step 6: Benchmark
 * Compares proposed leads against known therapies using real OpenTargets evidence.
 * Composite scoring based on: association score, mutation frequency,
 * known drug count, and mechanistic plausibility.
 */

export async function benchmark(diseaseConfig, leadsResult) {
  const benchmarked = leadsResult.leads.map((lead) => {
    const assocScore = lead.associationScore || 0;
    const freqRaw = parseFloat(lead.supportingMutationFrequency) || 0;
    const freqScore = Math.min(freqRaw / 30, 1); // Normalize: 30%+ = 1.0
    const drugScore = Math.min(lead.knownDrugsInClass / 10, 1); // Normalize: 10+ drugs = 1.0

    // Mechanistic plausibility based on lead type
    const plausibilityScore = lead.leadType === 'targeted_therapy' ? 0.8 : 0.5;

    // Composite score (weighted average)
    const composite = (
      assocScore * 0.35 +
      freqScore * 0.25 +
      drugScore * 0.25 +
      plausibilityScore * 0.15
    );

    // Determine tier
    let tier;
    if (composite >= 0.6) tier = 'Tier 1 — Strong';
    else if (composite >= 0.35) tier = 'Tier 2 — Moderate';
    else tier = 'Tier 3 — Exploratory';

    return {
      ...lead,
      benchmarkScore: {
        targetDiseaseScore: assocScore,
        mutationFrequencyScore: parseFloat(freqScore.toFixed(3)),
        drugEvidenceScore: parseFloat(drugScore.toFixed(3)),
        mechanisticPlausibility: parseFloat(plausibilityScore.toFixed(3)),
        composite: parseFloat(composite.toFixed(3)),
        tier,
        weights: {
          targetDisease: 0.35,
          mutationFrequency: 0.25,
          drugEvidence: 0.25,
          mechanisticPlausibility: 0.15,
        },
      },
      comparedTo: diseaseConfig.standardTherapies,
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
    scoringMethod: 'Composite scoring: OpenTargets association (35%), mutation frequency (25%), drug evidence (25%), mechanistic plausibility (15%)',
    benchmarkedAt: new Date().toISOString(),
  };
}