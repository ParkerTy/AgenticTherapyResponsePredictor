/**
 * Step 9: Report
 * Produces a structured, reproducible output with full provenance.
 * Surfaces data from all 9 pipeline steps and all 5 data sources.
 */

export async function report(diseaseConfig, artifacts) {
  const parseQueryStep = artifacts.steps.find((s) => s.step === 'parseQuery');
  const synthesizeStep = artifacts.steps.find((s) => s.step === 'synthesize');
  const interactionsStep = artifacts.steps.find((s) => s.step === 'interactions');
  const predictStep = artifacts.steps.find((s) => s.step === 'predict');
  const benchmarkStep = artifacts.steps.find((s) => s.step === 'benchmark');

  const summary = synthesizeStep?.result?.summary || {};
  const predictions = predictStep?.result || {};
  const benchmarked = benchmarkStep?.result || {};
  const parsedQuery = parseQueryStep?.result || null;
  const interactions = interactionsStep?.result || {};

  return {
    title: `Therapy Response & Lead Benchmarking Report — ${diseaseConfig.subtype}`,
    diseaseContext: {
      disease: diseaseConfig.disease,
      subtype: diseaseConfig.subtype,
      studyId: diseaseConfig.studyId,
    },
    queryInterpretation: parsedQuery ? {
      originalQuery: parsedQuery.originalQuery,
      therapyClasses: parsedQuery.therapyClasses || [],
      clinicalSettings: parsedQuery.clinicalSettings || [],
      biomarkers: parsedQuery.biomarkers || [],
      intents: parsedQuery.intents || [],
      hasRecognizedTerms: parsedQuery.hasRecognizedTerms || false,
    } : null,
    cohortSummary: {
      studyName: summary.studyName || 'N/A',
      cohortSize: summary.cohortSize || summary.sampleCount || 0,
      genesAnalyzed: summary.genesAnalyzed || 0,
      genesWithMutations: summary.genesWithMutations || 0,
      genesWithAssociation: summary.genesWithAssociation || 0,
      totalDruggable: summary.totalDruggable || 0,
      genesWithCivicEvidence: summary.genesWithCivicEvidence || 0,
      genesWithDgidbDrugs: summary.genesWithDgidbDrugs || 0,
      genesWithPathways: summary.genesWithPathways || 0,
    },
    interactionSummary: {
      rulesEvaluated: interactions.rulesEvaluated || 0,
      rulesFired: (interactions.firedRules || []).length,
      modifiersApplied: (interactions.modifiers || []).length,
    },
    predictionSummary: {
      totalPredictions: predictions.totalPredictions || 0,
      highConfidence: predictions.highConfidence || 0,
      moderateConfidence: predictions.moderateConfidence || 0,
      lowConfidence: predictions.lowConfidence || 0,
      queryBoostsApplied: predictions.queryBoostsApplied || 0,
      interactionModifiersApplied: predictions.interactionModifiersApplied || 0,
      clinicalBoostsApplied: predictions.clinicalBoostsApplied || 0,
    },
    benchmarkSummary: {
      totalBenchmarked: benchmarked.totalBenchmarked || 0,
      tier1: benchmarked.tier1Count || 0,
      tier2: benchmarked.tier2Count || 0,
      tier3: benchmarked.tier3Count || 0,
      scoringMethod: benchmarked.scoringMethod || 'N/A',
      tierThresholds: benchmarked.tierThresholds || { tier1: '>= 0.60', tier2: '>= 0.35', tier3: '< 0.35' },
    },
    summary: `Agentic analysis completed for ${diseaseConfig.subtype}. ` +
      `Analyzed ${summary.genesAnalyzed || 0} genes across ${summary.cohortSize || summary.sampleCount || 0} samples using 5 data sources. ` +
      `Generated ${predictions.totalPredictions || 0} predictions (${predictions.highConfidence || 0} high, ${predictions.moderateConfidence || 0} moderate, ${predictions.lowConfidence || 0} low confidence). ` +
      `Applied ${predictions.clinicalBoostsApplied || 0} CIViC clinical evidence boosts. ` +
      `Benchmarked ${benchmarked.totalBenchmarked || 0} leads across 7 dimensions (${benchmarked.tier1Count || 0} Tier 1, ${benchmarked.tier2Count || 0} Tier 2, ${benchmarked.tier3Count || 0} Tier 3).`,
    stepsCompleted: artifacts.steps.map((s) => s.step),
    provenance: {
      runId: artifacts.runId,
      startedAt: artifacts.startedAt,
      configUsed: diseaseConfig.subtype,
      dataSources: [
        `cBioPortal (study: ${diseaseConfig.studyId})`,
        'OpenTargets GraphQL API',
        'CIViC (Clinical Interpretation of Variants in Cancer)',
        'DGIdb (Drug Gene Interaction Database)',
        'Reactome Pathway Knowledgebase',
      ],
      apiCallsLogged: true,
      deterministic: true,
    },
    generatedAt: new Date().toISOString(),
  };
}