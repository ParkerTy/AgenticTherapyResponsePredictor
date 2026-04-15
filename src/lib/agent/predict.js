/**
 * Step 4: Predict
 * Applies transparent heuristics to estimate therapy response patterns.
 * Now uses real mutation frequencies and evidence scores to inform predictions.
 * No black-box ML — all logic is explicit and auditable.
 */

export async function predict(diseaseConfig, synthesizeResult) {
  const predictions = [];

  for (const [condition, therapyEffects] of Object.entries(diseaseConfig.heuristics)) {
    for (const [therapy, effect] of Object.entries(therapyEffects)) {
      // Find the relevant gene from the condition string
      const relevantEvidence = synthesizeResult.evidenceTable.filter((e) =>
        condition.toUpperCase().includes(e.gene.toUpperCase())
      );

      // Compute a confidence level based on real data
      let confidence = 'low';
      let supportingData = [];

      for (const evidence of relevantEvidence) {
        const freq = parseFloat(evidence.mutationFrequency) || 0;
        const assocScore = evidence.diseaseAssociationScore || 0;

        // Confidence increases with mutation frequency and association score
        if (freq > 10 && assocScore > 0.5) {
          confidence = 'high';
        } else if (freq > 5 || assocScore > 0.3) {
          confidence = 'moderate';
        }

        supportingData.push({
          gene: evidence.gene,
          mutationFrequency: evidence.mutationFrequency,
          mutatedSamples: evidence.mutatedSamples,
          diseaseAssociationScore: assocScore,
          knownDrugsCount: evidence.totalKnownDrugs,
        });
      }

      predictions.push({
        condition,
        therapy,
        predictedEffect: effect,
        confidence,
        reasoning: `Heuristic: if ${condition} then ${therapy} is ${effect}. Confidence based on mutation frequency and target-disease association score.`,
        supportingData,
        evidenceSource: {
          mutations: 'cBioPortal',
          associations: 'OpenTargets',
          heuristics: `${diseaseConfig.subtype} disease config`,
        },
      });
    }
  }

  // Sort by confidence: high first
  const confidenceOrder = { high: 0, moderate: 1, low: 2 };
  predictions.sort((a, b) => confidenceOrder[a.confidence] - confidenceOrder[b.confidence]);

  return {
    predictions,
    totalPredictions: predictions.length,
    highConfidence: predictions.filter((p) => p.confidence === 'high').length,
    moderateConfidence: predictions.filter((p) => p.confidence === 'moderate').length,
    lowConfidence: predictions.filter((p) => p.confidence === 'low').length,
    method: 'Transparent rule-based heuristics with real data confidence scoring',
    cohortContext: {
      studyName: synthesizeResult.summary.studyName,
      cohortSize: synthesizeResult.summary.cohortSize,
    },
    predictedAt: new Date().toISOString(),
  };
}