/**
 * Step 7: Report
 *
 * Produces a structured, reproducible output with full provenance. Phase 3
 * update: surfaces the new parseQuery and interactions steps in the audit
 * trail, and uses .find() by step name for resilience against future
 * pipeline ordering changes.
 */

export async function report(diseaseConfig, artifacts) {
  const parseStep = artifacts.steps.find((s) => s.step === 'parseQuery');
  const planStep = artifacts.steps.find((s) => s.step === 'plan');
  const synthesizeStep = artifacts.steps.find((s) => s.step === 'synthesize');
  const interactionsStep = artifacts.steps.find((s) => s.step === 'interactions');
  const predictStep = artifacts.steps.find((s) => s.step === 'predict');
  const benchmarkStep = artifacts.steps.find((s) => s.step === 'benchmark');

  const summary = synthesizeStep?.result?.summary || {};
  const predictions = predictStep?.result || {};
  const benchmarked = benchmarkStep?.result || {};
  const interactions = interactionsStep?.result || {};
  const parsed = parseStep?.result || {};

  return {
    title: `Therapy Response & Lead Benchmarking Report — ${diseaseConfig.subtype}`,
    diseaseContext: {
      disease: diseaseConfig.disease,
      subtype: diseaseConfig.subtype,
      studyId: diseaseConfig.studyId,
      diseaseKey: diseaseConfig.diseaseKey || null,
    },
    queryInterpretation: {
      originalQuery: parsed.originalQuery || artifacts.query,
      therapyClasses: parsed.therapyClasses || [],
      biomarkers: parsed.biomarkers || [],
      clinicalSettings: parsed.clinicalSettings || [],
      intents: parsed.intents || [],
      hasRecognizedTerms: parsed.hasRecognizedTerms ?? false,
      focusAreas: planStep?.result?.focusAreas || [],
    },
    cohortSummary: {
      studyName: summary.studyName || 'N/A',
      cohortSize: summary.cohortSize || 0,
      genesAnalyzed: summary.genesAnalyzed || 0,
      genesWithMutations: summary.genesWithMutations || 0,
      genesWithAssociation: summary.genesWithAssociation || 0,
      totalDruggable: summary.totalDruggable || 0,
    },
    interactionSummary: {
      rulesEvaluated: interactions.rulesEvaluated || 0,
      rulesFired: interactions.firedRules?.length || 0,
      rulesSkipped: interactions.skippedRules?.length || 0,
      firedRuleNames: (interactions.firedRules || []).map((r) => r.name),
    },
    predictionSummary: {
      totalPredictions: predictions.totalPredictions || 0,
      highConfidence: predictions.highConfidence || 0,
      moderateConfidence: predictions.moderateConfidence || 0,
      lowConfidence: predictions.lowConfidence || 0,
      queryBoostsApplied: predictions.queryBoostsApplied || 0,
      interactionModifiersApplied: predictions.interactionModifiersApplied || 0,
    },
    benchmarkSummary: {
      totalLeads: benchmarked.totalLeads || 0,
      tier1: benchmarked.tier1Count || 0,
      tier2: benchmarked.tier2Count || 0,
      tier3: benchmarked.tier3Count || 0,
      scoringMethod: '6-dimension composite (clinical_precedence, cancer_gene_census, known_drug, mutation frequency, druggability, mechanistic plausibility)',
      weightsUsed: benchmarked.weightsUsed || null,
      tierThresholds: benchmarked.tierThresholds || null,
    },
    summary: buildOneLineSummary(diseaseConfig, summary, predictions, benchmarked, interactions),
    stepsCompleted: artifacts.steps.map((s) => s.step),
    provenance: {
      runId: artifacts.runId,
      startedAt: artifacts.startedAt,
      configUsed: diseaseConfig.diseaseKey || diseaseConfig.subtype,
      dataSources: [
        `cBioPortal (study: ${diseaseConfig.studyId})`,
        'OpenTargets GraphQL API',
      ],
      apiCallsLogged: true,
      deterministic: true,
    },
    generatedAt: new Date().toISOString(),
  };
}

function buildOneLineSummary(diseaseConfig, summary, predictions, benchmarked, interactions) {
  const firedCount = interactions?.firedRules?.length || 0;
  const interactionNote = firedCount > 0 ? ` ${firedCount} interaction rule(s) fired.` : '';
  return (
    `Agentic analysis completed for ${diseaseConfig.subtype}. ` +
    `Analyzed ${summary.genesAnalyzed || 0} genes across ${summary.cohortSize || 0} samples. ` +
    `Generated ${predictions.totalPredictions || 0} predictions (${predictions.highConfidence || 0} high confidence). ` +
    `Benchmarked ${benchmarked.totalLeads || 0} leads (${benchmarked.tier1Count || 0} Tier 1).` +
    interactionNote
  );
}