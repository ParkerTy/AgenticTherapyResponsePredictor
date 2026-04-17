/**
 * Predict Step — Applies disease-specific heuristics to predict therapy response.
 *
 * Phase 3 updates:
 *   - Step 1 added query-aware soft-nudge boost (matched therapy classes)
 *   - Step 2 now applies biomarker interaction modifiers from interactions.js
 *
 * Final confidence score per prediction =
 *   baseScore + queryBoost + sum(applicableInteractionDeltas)
 * Clamped to [0, 1]. Each contributor is logged for full audit.
 */

const CONFIDENCE_TO_SCORE = { high: 1.0, moderate: 0.6, low: 0.3 };
const QUERY_BOOST = 0.1;

const THERAPY_CLASS_KEYWORDS = {
  endocrine: ['endocrine', 'aromatase', 'fulvestrant', 'tamoxifen'],
  cdk46_inhibitor: ['cdk4', 'cdk46', 'cdk_4_6', 'palbociclib', 'ribociclib'],
  pi3k_inhibitor: ['pi3k', 'alpelisib'],
  parp_inhibitor: ['parp', 'olaparib'],
  immunotherapy: ['immunotherapy', 'pembrolizumab', 'checkpoint', 'pd1', 'pdl1'],
  anti_egfr: ['anti_egfr', 'cetuximab', 'panitumumab', 'egfr'],
  chemotherapy: ['chemotherapy', 'chemo', 'platinum', 'taxane'],
};

export async function predict(diseaseConfig, synthesisResult, parsedQuery = null, interactionsResult = null) {
  const predictions = [];
  const evidenceTable = synthesisResult.evidenceTable || [];
  const queryTherapyClasses = parsedQuery?.therapyClasses || [];
  const allModifiers = interactionsResult?.modifiers || [];

  for (const [conditionKey, therapyMap] of Object.entries(diseaseConfig.heuristics || {})) {
    const evidence = evidenceTable.find((e) => e.gene === conditionKey);
    if (!evidence) continue;

    const freq = parseFloat(evidence.mutationFrequency) || 0;
    const assocScore = evidence.diseaseAssociationScore || 0;

    let baseConfidence;
    if (freq > 10 && assocScore > 0.5) baseConfidence = 'high';
    else if (freq > 5 || assocScore > 0.3) baseConfidence = 'moderate';
    else baseConfidence = 'low';

    for (const [therapyKey, baseEffect] of Object.entries(therapyMap)) {
      const baseScore = CONFIDENCE_TO_SCORE[baseConfidence] || 0.3;

      // Query soft-nudge
      const matchedClass = matchTherapyClass(therapyKey, queryTherapyClasses);
      const queryBoost = matchedClass ? QUERY_BOOST : 0;

      // Interaction modifiers that apply to this (biomarker, therapy) pair
      const applicableMods = allModifiers.filter(
        (m) => m.biomarker === conditionKey && m.therapy === therapyKey
      );
      const interactionDelta = applicableMods.reduce((sum, m) => sum + m.confidenceDelta, 0);

      const effectiveScore = clamp01(baseScore + queryBoost + interactionDelta);
      const effectiveConfidence = scoreToConfidence(effectiveScore);

      predictions.push({
        biomarker: conditionKey,
        biomarkerRole: evidence.role,
        biomarkerEffect: evidence.effect,
        therapy: therapyKey,
        predictedEffect: baseEffect,
        confidence: effectiveConfidence,
        confidenceScore: effectiveScore,
        baseConfidence,
        baseConfidenceScore: baseScore,
        queryBoosted: !!matchedClass,
        queryBoost,
        matchedQueryClass: matchedClass,
        interactionModifiers: applicableMods,
        interactionDelta,
        supportingEvidence: {
          mutationFrequency: evidence.mutationFrequency,
          mutatedSamples: evidence.mutatedSamples,
          totalSamples: evidence.totalSamples,
          diseaseAssociationScore: evidence.diseaseAssociationScore,
          druggable: evidence.druggability,
          druggabilityCount: evidence.druggabilityCount,
        },
        rationale: buildRationale(conditionKey, therapyKey, baseEffect, freq, assocScore, matchedClass, applicableMods),
      });
    }
  }

  predictions.sort((a, b) => b.confidenceScore - a.confidenceScore);

  return {
    predictions,
    totalPredictions: predictions.length,
    highConfidence: predictions.filter((p) => p.confidence === 'high').length,
    moderateConfidence: predictions.filter((p) => p.confidence === 'moderate').length,
    lowConfidence: predictions.filter((p) => p.confidence === 'low').length,
    queryBoostsApplied: predictions.filter((p) => p.queryBoosted).length,
    interactionModifiersApplied: predictions.filter((p) => p.interactionModifiers.length > 0).length,
    queryAware: !!parsedQuery && parsedQuery.hasRecognizedTerms,
    interactionsAware: !!interactionsResult && interactionsResult.firedRules.length > 0,
  };
}

function matchTherapyClass(therapyKey, queryClasses) {
  if (!queryClasses || queryClasses.length === 0) return null;
  const tk = (therapyKey || '').toLowerCase();
  for (const qc of queryClasses) {
    const keywords = THERAPY_CLASS_KEYWORDS[qc] || [qc.toLowerCase()];
    if (keywords.some((kw) => tk.includes(kw))) return qc;
  }
  return null;
}

function scoreToConfidence(score) {
  if (score >= 0.8) return 'high';
  if (score >= 0.5) return 'moderate';
  return 'low';
}

function clamp01(x) {
  return Math.max(0, Math.min(1, x));
}

function buildRationale(gene, therapy, effect, freq, assocScore, matchedClass, mods) {
  const parts = [
    `${gene} status (mutation frequency ${freq.toFixed(2)}%, OpenTargets association ${assocScore.toFixed(3)}) suggests ${effect} response to ${therapy}.`,
  ];
  if (matchedClass) {
    parts.push(`Confidence soft-boosted by +${QUERY_BOOST.toFixed(2)} due to user query referencing the '${matchedClass}' therapy class.`);
  }
  if (mods && mods.length > 0) {
    for (const m of mods) {
      const sign = m.confidenceDelta >= 0 ? '+' : '';
      parts.push(`Interaction rule '${m.ruleName}' applied (${sign}${m.confidenceDelta.toFixed(2)}): ${m.reason}`);
    }
  }
  return parts.join(' ');
}