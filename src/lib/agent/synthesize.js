/**
 * Synthesize Step — Builds the evidence table for downstream reasoning.
 *
 * Phase 3 Step 3 update: also surfaces OpenTargets datatypeScores per gene
 * as a flat lookup map, so benchmark.js can use clinical_precedence,
 * cancer_gene_census, and known_drug as independent dimensions.
 *
 * Hotfix: retrieve.js returns biomarkerData as an ARRAY of objects, not a
 * map keyed by gene. Accessing biomarkerData[gene] was silently returning
 * undefined and defaulting all mutation numbers to zero. We now build a
 * map from the array before lookups.
 */

export async function synthesize(diseaseConfig, retrieveResult) {
  const evidenceTable = [];

  // retrieve.js produces biomarkerData as an array like:
  //   [{ gene: 'PIK3CA', mutationFrequency: '63.80%', mutatedSamples: 319, totalSamples: 500 }, ...]
  // Convert to a map for fast lookup.
  const biomarkerArray = Array.isArray(retrieveResult.biomarkerData)
    ? retrieveResult.biomarkerData
    : [];
  const biomarkerMap = {};
  for (const b of biomarkerArray) {
    if (b?.gene) biomarkerMap[b.gene] = b;
  }

  // targetEvidence is an array of { gene, targetId, diseaseAssociation, druggability, ... }
  const targetEvidence = retrieveResult.targetEvidence || [];
  const targetByGene = {};
  for (const t of targetEvidence) {
    if (t?.gene) targetByGene[t.gene] = t;
  }

  for (const [gene, props] of Object.entries(diseaseConfig.biomarkers || {})) {
    const bio = biomarkerMap[gene] || {};
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
      mutationFrequency: bio.mutationFrequency || bio.frequency || '0.00%',
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
      cohortSize: retrieveResult.cohort?.totalSamples || retrieveResult.cohort?.sampleCount || 0,
      studyName: retrieveResult.cohort?.name || retrieveResult.cohort?.studyName || retrieveResult.cohort?.studyId || 'unknown',
    },
    synthesizedAt: new Date().toISOString(),
  };
}

function buildDatatypeScoreMap(datatypeScores) {
  const map = {};
  for (const d of datatypeScores || []) {
    if (d?.id) map[d.id] = d.score ?? 0;
  }
  return map;
}