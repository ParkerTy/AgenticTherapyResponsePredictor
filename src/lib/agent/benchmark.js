/**
 * Step 6: Benchmark
 * Compares proposed leads against known therapies using consistent scoring.
 * Phase 1: Stub scoring. Phase 3: Real OpenTargets evidence scoring.
 */

export async function benchmark(diseaseConfig, leadsResult) {
  const benchmarked = leadsResult.leads.map((lead) => ({
    ...lead,
    benchmarkScore: {
      targetDiseaseScore: null,
      evidenceCount: null,
      mechanisticPlausibility: 'pending',
      safetyFlags: 'pending',
      overall: null,
      message: 'Stub scoring — real benchmarking in Phase 3',
    },
    comparedTo: diseaseConfig.standardTherapies,
  }));

  return {
    benchmarkedLeads: benchmarked,
    totalBenchmarked: benchmarked.length,
    scoringMethod: 'Stub — composite scoring in Phase 3',
  };
}