/**
 * Synthesize Step — Builds the evidence table for downstream reasoning.
 *
 * Phase 3 Step 3 update: now also surfaces OpenTargets datatypeScores per
 * gene as a flat lookup map, so benchmark.js can use clinical_precedence,
 * cancer_gene_census, and known_drug as independent dimensions.
 *
 * Datatype scores are stored both as the original array (datatypeScores)
 * and as a flat lookup object (datatypeScoreMap) for convenience.
 */

export async function synthesize(diseaseConfig, retrieveResult) {
  const evidenceTable = [];
  const biomarkerData = retrieveResult.biomarkerData || {};
  const targetEvidence = retrieveResult.targetEvidence || [];

  // Build a quick-lookup map by gene
  const targetByGene = {};
  for (const t of targetEvidence) {
    targetByGene[t.gene] = t;
  }

  for (const [gene, props] of Object.entries(diseaseConfig.biomarkers || {})) {
    const bio = biomarkerData[gene] || {};
    const target = targetByGene[gene] || {};
    const dtScores = target?.diseaseAssociation?.datatypeScores || [];
    const datatypeScoreMap = buildDatatypeScoreMap(dtScores);

    evidenceTable.push({
      gene,
      role: props.role,
      effect:
        props.mutationEffect ||
        props.expressionEffect ||
        props.highEffect ||
        props.intactEffect ||
        'unspecified',
      measurementType: props.measurementType || 'mutation',
      mutationFrequency: bio.frequency || '0.00%',
      mutatedSamples: bio.mutatedSamples ?? 0,
      totalSamples: bio.totalSamples ?? 0,
      diseaseAssociationScore: target?.diseaseAssociation?.overallScore ?? null,
      associationFound: target?.diseaseAssociation?.found ?? false,
      datatypeScores: dtScores,
      datatypeScoreMap,
      druggabilityCount: target?.druggabilityCount ?? 0,
      druggability: target?.druggability ?? [],
      isEssential: target?.isEssential ?? null,
      targetId: target?.targetId ?? null,
      targetName: target?.targetName ?? null,
    });
  }

  return {
    evidenceTable,
    summary: {
      genesAnalyzed: evidenceTable.length,
      genesWithMutations: evidenceTable.filter((e) => parseFloat(e.mutationFrequency) > 0).length,
      genesWithAssociation: evidenceTable.filter((e) => e.associationFound).length,
      totalDruggable: evidenceTable.filter((e) => e.druggabilityCount > 0).length,
      cohortSize: retrieveResult.cohort?.totalSamples ?? 0,
      studyName: retrieveResult.cohort?.name || retrieveResult.cohort?.studyId || 'unknown',
    },
    synthesizedAt: new Date().toISOString(),
  };
}

/**
 * Converts an array of {id, score} datatype rows into a flat map.
 * Common OpenTargets datatype IDs include:
 *   - known_drug
 *   - genetic_association
 *   - somatic_mutation
 *   - literature
 *   - rna_expression
 *   - affected_pathway
 *   - clinical_precedence (note: also appears as 'known_drug' depending on schema version)
 *   - cancer_gene_census (typically inside 'genetic_association' breakdown)
 */
function buildDatatypeScoreMap(datatypeScores) {
  const map = {};
  for (const d of datatypeScores || []) {
    if (d?.id) map[d.id] = d.score ?? 0;
  }
  return map;
}