/**
 * Generate Leads Step — Proposes therapeutic lead candidates from predictions.
 *
 * Phase 3 Step 3 update: now propagates each prediction's full supporting
 * evidence into the lead so benchmark.js can score on multiple OpenTargets
 * datatype dimensions (clinical_precedence, cancer_gene_census, known_drug)
 * in addition to the previous frequency/druggability metrics.
 *
 * Lead types:
 *   - targeted_therapy: prediction effect is favorable or consider
 *   - alternative_mechanism: prediction effect is reduced or resistant
 */

export async function generateLeads(diseaseConfig, predictResult) {
  const leads = [];
  const predictions = predictResult.predictions || [];

  // We need datatypeScoreMap per biomarker; predict.js already carries
  // supportingEvidence but not the datatype map, so we re-derive it here from
  // the synthesis-step view if available. Predict carries dtMap forward via
  // the supportingEvidence object as 'datatypeScoreMap' if present.
  for (const pred of predictions) {
    const isFavorable = pred.predictedEffect === 'favorable' || pred.predictedEffect === 'consider';
    const isAdverse = pred.predictedEffect === 'reduced' || pred.predictedEffect === 'resistant';

    const baseLead = {
      biomarker: pred.biomarker,
      therapy: pred.therapy,
      derivedFrom: pred.predictedEffect,
      confidence: pred.confidence,
      confidenceScore: pred.confidenceScore,
      supportingMutationFrequency: pred.supportingEvidence?.mutationFrequency || '0.00%',
      associationScore: pred.supportingEvidence?.diseaseAssociationScore ?? 0,
      datatypeScoreMap: pred.supportingEvidence?.datatypeScoreMap || {},
      knownDrugsInClass: pred.supportingEvidence?.druggabilityCount ?? 0,
      isEssential: pred.supportingEvidence?.isEssential ?? null,
      interactionDelta: pred.interactionDelta ?? 0,
      queryBoosted: !!pred.queryBoosted,
    };

    if (isFavorable) {
      leads.push({
        ...baseLead,
        type: 'targeted_therapy',
        leadName: `${pred.therapy} for ${pred.biomarker}-driven disease`,
        rationale: `${pred.biomarker} status supports ${pred.therapy} as a targeted therapy candidate. Predicted effect: ${pred.predictedEffect}.`,
      });
    } else if (isAdverse) {
      leads.push({
        ...baseLead,
        type: 'alternative_mechanism',
        leadName: `Alternative-mechanism candidate for ${pred.biomarker}-driven disease`,
        rationale: `${pred.therapy} predicted to be ${pred.predictedEffect}; consider mechanistically distinct alternatives that bypass the ${pred.biomarker} pathway.`,
      });
    }
  }

  // Sort: targeted first, then by confidence
  leads.sort((a, b) => {
    if (a.type !== b.type) return a.type === 'targeted_therapy' ? -1 : 1;
    return (b.confidenceScore || 0) - (a.confidenceScore || 0);
  });

  return {
    leads,
    totalLeads: leads.length,
    targetedCount: leads.filter((l) => l.type === 'targeted_therapy').length,
    alternativeCount: leads.filter((l) => l.type === 'alternative_mechanism').length,
    generatedAt: new Date().toISOString(),
  };
}