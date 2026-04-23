/**
 * Step 3: Synthesize
 * Assembles an auditable evidence table from real retrieved data.
 * Links biomarker config knowledge with:
 * - cBioPortal mutation data
 * - OpenTargets target-disease evidence
 * - CIViC clinical evidence
 * - DGIdb drug-gene interactions
 * - Reactome pathway context
 */

export async function synthesize(diseaseConfig, retrieveResult) {
  const evidenceTable = [];

  // Build lookup maps from the retrieve result arrays
  const civicMap = {};
  for (const item of (retrieveResult.civicEvidence || [])) {
    civicMap[item.gene] = item;
  }

  const dgidbMap = {};
  for (const item of (retrieveResult.dgidbEvidence || [])) {
    dgidbMap[item.gene] = item;
  }

  const reactomeMap = {};
  for (const item of (retrieveResult.reactomeEvidence || [])) {
    reactomeMap[item.gene] = item;
  }

  for (const [gene, info] of Object.entries(diseaseConfig.biomarkers)) {
    const biomarkerData = retrieveResult.biomarkerData.find((b) => b.gene === gene) || {};
    const targetData = retrieveResult.targetEvidence.find((t) => t.gene === gene) || {};
    const civicData = civicMap[gene] || {};
    const dgidbData = dgidbMap[gene] || {};
    const reactomeData = reactomeMap[gene] || {};

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

      // Druggability (OpenTargets tractability)
      druggabilityCount: targetData.druggabilityCount || 0,
      druggability: targetData.druggability || [],
      isEssential: targetData.isEssential || false,

      // CIViC clinical evidence
      civicEvidenceCount: civicData.totalEvidenceItems || 0,
      civicBestLevel: civicData.bestEvidenceLevel || null,
      civicEvidenceByLevel: civicData.evidenceByLevel || {},
      civicEvidenceByType: civicData.evidenceByType || {},
      civicPredictiveCount: civicData.predictiveCount || 0,
      civicTherapies: civicData.therapies || [],
      civicItems: civicData.items || [],
      civicFound: civicData.found || false,

      // DGIdb drug-gene interactions
      dgidbDrugCount: dgidbData.totalInteractions || 0,
      dgidbApprovedCount: dgidbData.approvedDrugCount || 0,
      dgidbDrugs: dgidbData.drugs || [],
      dgidbDrugNames: dgidbData.allDrugNames || [],
      dgidbCategories: dgidbData.geneCategories || [],
      dgidbFound: dgidbData.found || false,

      // Reactome pathway context
      reactomeTopPathway: reactomeData.topPathway || null,
      reactomePathwayCount: reactomeData.totalPathways || 0,
      reactomePathways: reactomeData.pathways || [],
      reactomeFound: reactomeData.found || false,

      // Provenance
      dataSources: {
        mutations: 'cBioPortal',
        targetEvidence: 'OpenTargets',
        clinicalEvidence: 'CIViC',
        drugInteractions: 'DGIdb',
        pathways: 'Reactome',
        config: diseaseConfig.subtype,
      },
    });
  }

  const genesWithMutations = evidenceTable.filter((e) => e.mutatedSamples > 0).length;
  const genesWithAssociation = evidenceTable.filter((e) => e.associationFound).length;
  const totalDruggable = evidenceTable.filter((e) => e.druggabilityCount > 0).length;
  const genesWithCivicEvidence = evidenceTable.filter((e) => e.civicFound).length;
  const genesWithDgidbDrugs = evidenceTable.filter((e) => e.dgidbFound).length;
  const genesWithPathways = evidenceTable.filter((e) => e.reactomeFound).length;

  return {
    evidenceTable,
    totalItems: evidenceTable.length,
    summary: {
      genesAnalyzed: evidenceTable.length,
      genesWithMutations,
      genesWithAssociation,
      totalDruggable,
      genesWithCivicEvidence,
      genesWithDgidbDrugs,
      genesWithPathways,
      cohortSize: retrieveResult.cohort.sampleCount,
      studyName: retrieveResult.cohort.studyName,
    },
    synthesisMethod: 'Multi-source evidence integration (cBioPortal + OpenTargets + CIViC + DGIdb + Reactome + disease config)',
    synthesizedAt: new Date().toISOString(),
  };
}