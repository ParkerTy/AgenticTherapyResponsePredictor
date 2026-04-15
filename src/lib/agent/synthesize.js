/**
 * Step 3: Synthesize
 * Assembles an auditable evidence table from real retrieved data.
 * Links biomarker config knowledge with cBioPortal mutation data
 * and OpenTargets target-disease evidence.
 */

export async function synthesize(diseaseConfig, retrieveResult) {
  const evidenceTable = [];

  for (const [gene, info] of Object.entries(diseaseConfig.biomarkers)) {
    const biomarkerData = retrieveResult.biomarkerData.find((b) => b.gene === gene) || {};
    const targetData = retrieveResult.targetEvidence.find((t) => t.gene === gene) || {};

    evidenceTable.push({
      gene,
      role: info.role,
      effect: info.mutationEffect || info.expressionEffect || info.highEffect || 'Unknown',

      // cBioPortal evidence
      mutationFrequency: biomarkerData.mutationFrequency || '0%',
      mutatedSamples: biomarkerData.mutatedSamples || 0,
      totalSamples: biomarkerData.totalSamples || 0,

      // OpenTargets evidence
      targetId: targetData.targetId || null,
      diseaseAssociationScore: targetData.diseaseAssociation?.overallScore || 0,
      associationFound: targetData.diseaseAssociation?.found || false,
      datatypeScores: targetData.diseaseAssociation?.datatypeScores || [],

      // Druggability
      druggabilityCount: targetData.druggabilityCount || 0,
      druggability: targetData.druggability || [],
      isEssential: targetData.isEssential || false,

      // Provenance
      dataSources: {
        mutations: 'cBioPortal',
        targetEvidence: 'OpenTargets',
        config: diseaseConfig.subtype,
      },
    });
  }

  const genesWithMutations = evidenceTable.filter((e) => e.mutatedSamples > 0).length;
  const genesWithAssociation = evidenceTable.filter((e) => e.associationFound).length;
  const totalDruggable = evidenceTable.filter((e) => e.druggabilityCount > 0).length;

  return {
    evidenceTable,
    totalItems: evidenceTable.length,
    summary: {
      genesAnalyzed: evidenceTable.length,
      genesWithMutations,
      genesWithAssociation,
      totalDruggable,
      cohortSize: retrieveResult.cohort.sampleCount,
      studyName: retrieveResult.cohort.studyName,
    },
    synthesisMethod: 'Multi-source evidence integration (cBioPortal + OpenTargets + disease config)',
    synthesizedAt: new Date().toISOString(),
  };
}