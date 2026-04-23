/**
 * Step 7: Generate Leads
 * Proposes mechanism-level therapeutic leads based on real evidence.
 * Uses mutation frequencies, OpenTargets evidence, CIViC clinical evidence,
 * and pathway context to prioritize leads.
 * Constrained to target/pathway level — no molecule generation.
 *
 * Propagates all evidence data into leads for downstream benchmark scoring.
 */

export async function generateLeads(diseaseConfig, predictResult) {
  const leads = [];

  for (const prediction of predictResult.predictions) {
    // Extract supporting evidence (Phase 4: single object from predict.js)
    const evidence = prediction.supportingEvidence || {};

    // Common fields propagated to every lead
    const commonFields = {
      confidence: prediction.confidence,
      confidenceScore: prediction.confidenceScore || 0,
      supportingMutationFrequency: evidence.mutationFrequency || 'N/A',
      associationScore: evidence.diseaseAssociationScore || 0,
      druggabilityCount: evidence.druggabilityCount || 0,
      // OpenTargets datatype scores for benchmark dimensions
      datatypeScoreMap: evidence.datatypeScoreMap || {},
      // CIViC clinical evidence for benchmark dimension 7
      civicEvidenceCount: evidence.civicEvidenceCount || 0,
      civicBestLevel: evidence.civicBestLevel || null,
      civicPredictiveCount: evidence.civicPredictiveCount || 0,
      // Reactome pathway context for display
      reactomeTopPathway: evidence.reactomeTopPathway || null,
      // Provenance
      derivedFrom: `${diseaseConfig.subtype} prediction analysis`,
    };

    if (prediction.predictedEffect === 'reduced' || prediction.predictedEffect === 'resistant') {
      // For resistance markers, propose alternative mechanisms
      leads.push({
        leadType: 'alternative_mechanism',
        primaryTarget: evidence.gene || prediction.condition,
        mechanismCategory: `Overcome ${prediction.therapy.replace(/_/g, ' ')} resistance`,
        rationale: `${prediction.condition} predicts ${prediction.predictedEffect} response to ${prediction.therapy.replace(/_/g, ' ')}. ` +
          `Supported by mutation frequency of ${evidence.mutationFrequency || 'N/A'} and association score of ${evidence.diseaseAssociationScore || 0}. ` +
          `Alternative targeting strategies should be explored.` +
          (evidence.reactomeTopPathway ? ` Pathway context: ${evidence.reactomeTopPathway}.` : ''),
        ...commonFields,
      });
    } else if (prediction.predictedEffect === 'favorable' || prediction.predictedEffect === 'consider') {
      // For favorable markers, propose targeted leads
      leads.push({
        leadType: 'targeted_therapy',
        primaryTarget: evidence.gene || prediction.condition,
        mechanismCategory: prediction.therapy.replace(/_/g, ' '),
        rationale: `${prediction.condition} predicts ${prediction.predictedEffect} response to ${prediction.therapy.replace(/_/g, ' ')}. ` +
          `Supported by mutation frequency of ${evidence.mutationFrequency || 'N/A'} and association score of ${evidence.diseaseAssociationScore || 0}.` +
          (evidence.civicBestLevel ? ` CIViC clinical evidence: Level ${evidence.civicBestLevel} (${evidence.civicEvidenceCount} items).` : '') +
          (evidence.reactomeTopPathway ? ` Pathway: ${evidence.reactomeTopPathway}.` : ''),
        ...commonFields,
      });
    }
  }

  // Sort leads: targeted therapies first, then by confidence score descending
  const typeOrder = { targeted_therapy: 0, alternative_mechanism: 1 };
  leads.sort((a, b) => {
    const typeDiff = (typeOrder[a.leadType] || 2) - (typeOrder[b.leadType] || 2);
    if (typeDiff !== 0) return typeDiff;
    return (b.confidenceScore || 0) - (a.confidenceScore || 0);
  });

  return {
    leads,
    totalLeads: leads.length,
    targetedTherapies: leads.filter((l) => l.leadType === 'targeted_therapy').length,
    alternativeMechanisms: leads.filter((l) => l.leadType === 'alternative_mechanism').length,
    generationMethod: 'Evidence-driven mechanism-level lead proposal from multi-source predictions (cBioPortal + OpenTargets + CIViC + Reactome)',
    generatedAt: new Date().toISOString(),
  };
}