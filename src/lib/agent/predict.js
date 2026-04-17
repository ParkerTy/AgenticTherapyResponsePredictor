/**
 * Predict Step — Applies disease-specific heuristics to predict therapy response.
 *
 * Phase 3 update: now query-aware. When the parsed query mentions a therapy
 * class that matches a heuristic's therapy_key, a soft-nudge boost is applied
 * to that prediction's effective confidence score. The boost is fully logged
 * for audit (queryBoosted flag, queryBoost amount, originalConfidenceScore).
 */

const CONFIDENCE_TO_SCORE = { high: 1.0, moderate: 0.6, low: 0.3 };
const QUERY_BOOST = 0.1;

// Maps query parser canonical therapy classes to keys that may appear inside
// a disease config's heuristics.therapy_key. Used to identify which
// predictions should receive the soft-nudge boost.
const THERAPY_CLASS_KEYWORDS = {
  endocrine: ['endocrine', 'aromatase', 'fulvestrant', 'tamoxifen'],
  cdk46_inhibitor: ['cdk4', 'cdk46', 'cdk_4_6', 'palbociclib', 'ribociclib'],
  pi3k_inhibitor: ['pi3k', 'alpelisib'],
  parp_inhibitor: ['parp', 'olaparib'],
  immunotherapy: ['immunotherapy', 'pembrolizumab', 'checkpoint', 'pd1', 'pdl1'],
  anti_egfr: ['anti_egfr', 'cetuximab', 'panitumumab', 'egfr'],
  chemotherapy: ['chemotherapy', 'chemo', 'platinum', 'taxane'],
};

export async function predict(diseaseConfig, synthesisResult, parsedQuery = null) {
  const predictions = [];
  const evidenceTable = synthesisResult.evidenceTable || [];
  const queryTherapyClasses = parsedQuery?.therapyClasses || [];

  for (const [conditionKey, therapyMap] of Object.entries(diseaseConfig.heuristics || {})) {
    const evidence = evidenceTable.find((e) => e.gene === conditionKey);
    if (!evidence) continue;

    const freq = parseFloat(evidence.mutationFrequency) || 0;
    const assocScore = evidence.diseaseAssociationScore || 0;

    // Base confidence from frequency + association score
    let confidence;
    if (freq > 10 && assocScore > 0.5) confidence = 'high';
    else if (freq > 5 || assocScore > 0.3) confidence = 'moderate';
    else confidence = 'low';

    for (const [therapyKey, baseEffect] of Object.entries(therapyMap)) {
      const baseScore = CONFIDENCE_TO_SCORE[confidence] || 0.3;
      const matchedClass = matchTherapyClass(therapyKey, queryTherapyClasses);
      const queryBoost = matchedClass ? QUERY_BOOST : 0;
      const effectiveScore = Math.min(1.0, baseScore + queryBoost);
      const effectiveConfidence = scoreToConfidence(effectiveScore);

      predictions.push({
        biomarker: conditionKey,
        biomarkerRole: evidence.role,
        biomarkerEffect: evidence.effect,
        therapy: therapyKey,
        predictedEffect: baseEffect,
        confidence: effectiveConfidence,
        confidenceScore: effectiveScore,
        baseConfidence: confidence,
        baseConfidenceScore: baseScore,
        queryBoosted: !!matchedClass,
        queryBoost,
        matchedQueryClass: matchedClass,
        supportingEvidence: {
          mutationFrequency: evidence.mutationFrequency,
          mutatedSamples: evidence.mutatedSamples,
          totalSamples: evidence.totalSamples,
          diseaseAssociationScore: evidence.diseaseAssociationScore,
          druggable: evidence.druggability,
          druggabilityCount: evidence.druggabilityCount,
        },
        rationale: buildRationale(conditionKey, therapyKey, baseEffect, freq, assocScore, matchedClass),
      });
    }
  }

  // Sort: highest effective confidence score first
  predictions.sort((a, b) => b.confidenceScore - a.confidenceScore);

  return {
    predictions,
    totalPredictions: predictions.length,
    highConfidence: predictions.filter((p) => p.confidence === 'high').length,
    moderateConfidence: predictions.filter((p) => p.confidence === 'moderate').length,
    lowConfidence: predictions.filter((p) => p.confidence === 'low').length,
    queryBoostsApplied: predictions.filter((p) => p.queryBoosted).length,
    queryAware: !!parsedQuery && parsedQuery.hasRecognizedTerms,
  };
}

/**
 * Returns the matched therapy class canonical (e.g., 'parp_inhibitor') if the
 * heuristic's therapy_key matches any of the query's therapy classes; else null.
 */
function matchTherapyClass(therapyKey, queryClasses) {
  if (!queryClasses || queryClasses.length === 0) return null;
  const tk = (therapyKey || '').toLowerCase();
  for (const qc of queryClasses) {
    const keywords = THERAPY_CLASS_KEYWORDS[qc] || [qc.toLowerCase()];
    if (keywords.some((kw) => tk.includes(kw))) {
      return qc;
    }
  }
  return null;
}

function scoreToConfidence(score) {
  if (score >= 0.8) return 'high';
  if (score >= 0.5) return 'moderate';
  return 'low';
}

function buildRationale(gene, therapy, effect, freq, assocScore, matchedClass) {
  const parts = [
    `${gene} status (mutation frequency ${freq.toFixed(2)}%, OpenTargets association ${assocScore.toFixed(3)}) suggests ${effect} response to ${therapy}.`,
  ];
  if (matchedClass) {
    parts.push(`Confidence soft-boosted by +${QUERY_BOOST.toFixed(2)} due to user query referencing the '${matchedClass}' therapy class.`);
  }
  return parts.join(' ');
}