/**
 * Step 6: Predict
 * Applies transparent heuristics to estimate therapy response patterns.
 * Uses real mutation frequencies, evidence scores, query context,
 * interaction modifiers, and clinical evidence to inform predictions.
 * No black-box ML — all logic is explicit and auditable.
 *
 * Confidence scoring formula:
 *   Base: freq > 10% AND assocScore > 0.5 → 1.0 (high)
 *         freq > 5% OR assocScore > 0.3  → 0.6 (moderate)
 *         else                            → 0.3 (low)
 *   + queryBoost: +0.10 if therapy class matches parsed query
 *   + interactionDelta: sum of applicable modifiers from interactions step
 *   + clinicalEvidenceBoost: +0.10 if CIViC Level A or B evidence exists
 *   = effectiveScore (clamped 0–1)
 *
 * Effective label: >= 0.8 → high, >= 0.5 → moderate, else → low
 */

export async function predict(diseaseConfig, synthesisResult, parsedQuery = null, interactionsResult = null) {
  const predictions = [];

  // Helper: clamp a value to [0, 1]
  const clamp01 = (v) => Math.max(0, Math.min(1, v));

  // Build a map of interaction modifiers keyed by "biomarker|therapy"
  const interactionModifiers = {};
  if (interactionsResult?.modifiers) {
    for (const mod of interactionsResult.modifiers) {
      const key = `${mod.biomarker}|${mod.therapy}`;
      if (!interactionModifiers[key]) interactionModifiers[key] = 0;
      interactionModifiers[key] += mod.confidenceDelta || 0;
    }
  }

  // Extract therapy classes from parsed query for query boost
  const queryTherapyClasses = parsedQuery?.therapyClasses || [];

  for (const [condition, therapyEffects] of Object.entries(diseaseConfig.heuristics)) {
    for (const [therapy, effect] of Object.entries(therapyEffects)) {
      // Find the relevant gene from the condition string
      const relevantEvidence = synthesisResult.evidenceTable.filter((e) =>
        condition.toUpperCase().includes(e.gene.toUpperCase())
      );

      let baseScore = 0.3;
      let baseLabel = 'low';
      let supportingEvidence = {};

      for (const evidence of relevantEvidence) {
        const freq = parseFloat(evidence.mutationFrequency) || 0;
        const assocScore = evidence.diseaseAssociationScore || 0;

        if (freq > 10 && assocScore > 0.5) {
          baseScore = 1.0;
          baseLabel = 'high';
        } else if (freq > 5 || assocScore > 0.3) {
          if (baseScore < 0.6) {
            baseScore = 0.6;
            baseLabel = 'moderate';
          }
        }

        supportingEvidence = {
          gene: evidence.gene,
          mutationFrequency: evidence.mutationFrequency,
          mutatedSamples: evidence.mutatedSamples,
          diseaseAssociationScore: assocScore,
          druggabilityCount: evidence.druggabilityCount || 0,
          datatypeScoreMap: {},
          // CIViC data for downstream use
          civicEvidenceCount: evidence.civicEvidenceCount || 0,
          civicBestLevel: evidence.civicBestLevel || null,
          civicPredictiveCount: evidence.civicPredictiveCount || 0,
          // Pathway context
          reactomeTopPathway: evidence.reactomeTopPathway || null,
        };

        // Build datatypeScoreMap from OpenTargets datatype scores
        const dtScores = evidence.datatypeScores || [];
        for (const dt of dtScores) {
          if (dt.id && dt.score !== undefined) {
            supportingEvidence.datatypeScoreMap[dt.id] = dt.score;
          }
        }
      }

      // Query boost: +0.10 if this therapy matches a parsed query therapy class
      let queryBoost = 0;
      if (queryTherapyClasses.length > 0) {
        const therapyNormalized = therapy.toLowerCase().replace(/_/g, '');
        const matched = queryTherapyClasses.some((tc) =>
          therapyNormalized.includes(tc.replace(/_/g, ''))
        );
        if (matched) queryBoost = 0.10;
      }

      // Interaction delta: sum of applicable modifiers for this gene + therapy
      let interactionDelta = 0;
      const appliedInteractions = [];
      if (relevantEvidence.length > 0) {
        const gene = relevantEvidence[0].gene;
        const modKey = `${gene}|${therapy}`;
        if (interactionModifiers[modKey]) {
          interactionDelta = interactionModifiers[modKey];
          appliedInteractions.push({ key: modKey, delta: interactionDelta });
        }
      }

      // Clinical evidence boost: +0.10 if CIViC has Level A or B evidence
      let clinicalEvidenceBoost = 0;
      const civicLevel = supportingEvidence.civicBestLevel;
      if (civicLevel === 'A' || civicLevel === 'B') {
        clinicalEvidenceBoost = 0.10;
      }

      // Effective score
      const effectiveScore = clamp01(baseScore + queryBoost + interactionDelta + clinicalEvidenceBoost);

      // Effective confidence label
      let effectiveConfidence;
      if (effectiveScore >= 0.8) effectiveConfidence = 'high';
      else if (effectiveScore >= 0.5) effectiveConfidence = 'moderate';
      else effectiveConfidence = 'low';

      // Build reasoning string
      let reasoning = `Heuristic: if ${condition} then ${therapy} is ${effect}. Base confidence: ${baseLabel} (${baseScore.toFixed(2)}).`;
      if (queryBoost > 0) reasoning += ` Query boost: +${queryBoost.toFixed(2)}.`;
      if (interactionDelta !== 0) reasoning += ` Interaction modifier: ${interactionDelta > 0 ? '+' : ''}${interactionDelta.toFixed(2)}.`;
      if (clinicalEvidenceBoost > 0) reasoning += ` Clinical evidence boost (CIViC Level ${civicLevel}): +${clinicalEvidenceBoost.toFixed(2)}.`;
      reasoning += ` Effective score: ${effectiveScore.toFixed(2)} (${effectiveConfidence}).`;

      predictions.push({
        condition,
        therapy,
        therapy_key: therapy,
        predictedEffect: effect,
        confidence: effectiveConfidence,
        confidenceScore: effectiveScore,
        baseConfidence: baseLabel,
        baseScore,
        queryBoost,
        interactionDelta,
        clinicalEvidenceBoost,
        clinicalEvidenceLevel: civicLevel,
        appliedInteractions,
        reasoning,
        supportingEvidence,
        evidenceSource: {
          mutations: 'cBioPortal',
          associations: 'OpenTargets',
          clinicalEvidence: 'CIViC',
          heuristics: `${diseaseConfig.subtype} disease config`,
        },
      });
    }
  }

  // Sort by effective score descending
  predictions.sort((a, b) => b.confidenceScore - a.confidenceScore);

  return {
    predictions,
    totalPredictions: predictions.length,
    highConfidence: predictions.filter((p) => p.confidence === 'high').length,
    moderateConfidence: predictions.filter((p) => p.confidence === 'moderate').length,
    lowConfidence: predictions.filter((p) => p.confidence === 'low').length,
    queryBoostsApplied: predictions.filter((p) => p.queryBoost > 0).length,
    interactionModifiersApplied: predictions.filter((p) => p.interactionDelta !== 0).length,
    clinicalBoostsApplied: predictions.filter((p) => p.clinicalEvidenceBoost > 0).length,
    method: 'Transparent rule-based heuristics with multi-source confidence scoring (cBioPortal + OpenTargets + CIViC + query context + interaction modifiers)',
    cohortContext: {
      studyName: synthesisResult.summary.studyName,
      cohortSize: synthesisResult.summary.cohortSize,
    },
    predictedAt: new Date().toISOString(),
  };
}