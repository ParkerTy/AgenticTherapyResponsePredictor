/**
 * Step 7: Report
 * Produces a structured, reproducible output with full provenance.
 * Now includes real data summaries from cBioPortal and OpenTargets.
 */

export async function report(diseaseConfig, artifacts) {
  const synthesizeStep = artifacts.steps.find((s) => s.step === 'synthesize');
  const predictStep = artifacts.steps.find((s) => s.step === 'predict');
  const benchmarkStep = artifacts.steps.find((s) => s.step === 'benchmark');

  const summary = synthesizeStep?.result?.summary || {};
  const predictions = predictStep?.result || {};
  const benchmarked = benchmarkStep?.result || {};

  return {
    title: `Therapy Response & Lead Benchmarking Report — ${diseaseConfig.subtype}`,
    diseaseContext: {
      disease: diseaseConfig.disease,
      subtype: diseaseConfig.subtype,
      studyId: diseaseConfig.studyId,
    },
    cohortSummary: {
      studyName: summary.studyName || 'N/A',
      cohortSize: summary.cohortSize || 0,
      genesAnalyzed: summary.genesAnalyzed || 0,
      genesWithMutations: summary.genesWithMutations || 0,
      genesWithAssociation: summary.genesWithAssociation || 0,
      totalDrugsFound: summary.totalDrugsFound || 0,
    },
    predictionSummary: {
      totalPredictions: predictions.totalPredictions || 0,
      highConfidence: predictions.highConfidence || 0,
      moderateConfidence: predictions.moderateConfidence || 0,
      lowConfidence: predictions.lowConfidence || 0,
    },
    benchmarkSummary: {
      totalBenchmarked: benchmarked.totalBenchmarked || 0,
      tier1: benchmarked.tier1Count || 0,
      tier2: benchmarked.tier2Count || 0,
      tier3: benchmarked.tier3Count || 0,
      scoringMethod: benchmarked.scoringMethod || 'N/A',
    },
    summary: `Agentic analysis completed for ${diseaseConfig.subtype}. Analyzed ${summary.genesAnalyzed || 0} genes across ${summary.cohortSize || 0} samples. Generated ${predictions.totalPredictions || 0} predictions (${predictions.highConfidence || 0} high confidence). Benchmarked ${benchmarked.totalBenchmarked || 0} leads (${benchmarked.tier1Count || 0} Tier 1).`,
    stepsCompleted: artifacts.steps.map((s) => s.step),
    provenance: {
      runId: artifacts.runId,
      startedAt: artifacts.startedAt,
      configUsed: diseaseConfig.subtype,
      dataSources: [
        `cBioPortal (study: ${diseaseConfig.studyId})`,
        'OpenTargets GraphQL API',
      ],
      apiCallsLogged: true,
    },
    generatedAt: new Date().toISOString(),
  };
}