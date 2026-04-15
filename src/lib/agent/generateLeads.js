/**
 * Step 5: Generate Leads
 * Proposes mechanism-level therapeutic leads based on real evidence.
 * Uses OpenTargets drug data and mutation frequencies to prioritize leads.
 * Constrained to target/pathway level — no molecule generation.
 */

export async function generateLeads(diseaseConfig, predictResult) {
  const leads = [];

  for (const prediction of predictResult.predictions) {
    // Only generate leads for favorable or actionable predictions
    if (prediction.predictedEffect === 'reduced' || prediction.predictedEffect === 'resistant') {
      // For resistance markers, propose alternative mechanisms
      leads.push({
        leadType: 'alternative_mechanism',
        primaryTarget: prediction.supportingData[0]?.gene || prediction.condition,
        mechanismCategory: `Overcome ${prediction.therapy} resistance`,
        rationale: `${prediction.condition} predicts ${prediction.predictedEffect} response to ${prediction.therapy}. Alternative targeting strategies should be explored.`,
        confidence: prediction.confidence,
        supportingMutationFrequency: prediction.supportingData[0]?.mutationFrequency || 'N/A',
        associationScore: prediction.supportingData[0]?.diseaseAssociationScore || 0,
        knownDrugsInClass: prediction.supportingData[0]?.knownDrugsCount || 0,
        derivedFrom: `${diseaseConfig.subtype} prediction analysis`,
      });
    } else if (prediction.predictedEffect === 'favorable' || prediction.predictedEffect === 'consider') {
      // For favorable markers, propose targeted leads
      leads.push({
        leadType: 'targeted_therapy',
        primaryTarget: prediction.supportingData[0]?.gene || prediction.condition,
        mechanismCategory: prediction.therapy.replace(/_/g, ' '),
        rationale: `${prediction.condition} predicts ${prediction.predictedEffect} response to ${prediction.therapy}. Supported by mutation frequency of ${prediction.supportingData[0]?.mutationFrequency || 'N/A'} and association score of ${prediction.supportingData[0]?.diseaseAssociationScore || 0}.`,
        confidence: prediction.confidence,
        supportingMutationFrequency: prediction.supportingData[0]?.mutationFrequency || 'N/A',
        associationScore: prediction.supportingData[0]?.diseaseAssociationScore || 0,
        knownDrugsInClass: prediction.supportingData[0]?.knownDrugsCount || 0,
        derivedFrom: `${diseaseConfig.subtype} prediction analysis`,
      });
    }
  }

  // Sort leads: targeted therapies first, then by confidence
  const typeOrder = { targeted_therapy: 0, alternative_mechanism: 1 };
  const confOrder = { high: 0, moderate: 1, low: 2 };
  leads.sort((a, b) => {
    const typeDiff = (typeOrder[a.leadType] || 2) - (typeOrder[b.leadType] || 2);
    if (typeDiff !== 0) return typeDiff;
    return (confOrder[a.confidence] || 2) - (confOrder[b.confidence] || 2);
  });

  return {
    leads,
    totalLeads: leads.length,
    targetedTherapies: leads.filter((l) => l.leadType === 'targeted_therapy').length,
    alternativeMechanisms: leads.filter((l) => l.leadType === 'alternative_mechanism').length,
    generationMethod: 'Evidence-driven mechanism-level lead proposal from predictions and real data',
    generatedAt: new Date().toISOString(),
  };
}