/**
 * Step 2: Retrieve
 * Pulls real clinical, genomic, and drug-target evidence from open APIs.
 * - cBioPortal: cohort data and mutation frequencies
 * - OpenTargets: target-disease associations and druggability
 */

import { getStudy, getSamples, getMutations, computeMutationFrequencies } from '../api/cbioportal.js';
import { getTargetId, getTargetDiseaseEvidence, getKnownDrugs } from '../api/opentargets.js';

export async function retrieve(diseaseConfig, planResult) {
  const genes = Object.keys(diseaseConfig.biomarkers);
  const errors = [];

  // === cBioPortal: Study, Samples, Mutations ===
  let study = null;
  let samples = [];
  let mutations = { mutations: [], totalMutations: 0 };
  let mutationFrequencies = {};

  try {
    study = await getStudy(diseaseConfig.studyId);
  } catch (err) {
    errors.push({ source: 'cBioPortal', step: 'getStudy', error: err.message });
  }

  try {
    samples = await getSamples(diseaseConfig.studyId);
  } catch (err) {
    errors.push({ source: 'cBioPortal', step: 'getSamples', error: err.message });
  }

  try {
    mutations = await getMutations(diseaseConfig.studyId, genes);
    mutationFrequencies = computeMutationFrequencies(mutations, samples.length);
  } catch (err) {
    errors.push({ source: 'cBioPortal', step: 'getMutations', error: err.message });
  }

  // === OpenTargets: Target-Disease Evidence and Druggability ===
  const targetEvidence = [];

  for (const gene of genes) {
    try {
      const target = await getTargetId(gene);
      if (!target) {
        targetEvidence.push({
          gene,
          targetId: null,
          message: `No OpenTargets target found for ${gene}`,
        });
        continue;
      }

      const evidence = await getTargetDiseaseEvidence(target.id, diseaseConfig.disease);
      const drugInfo = await getKnownDrugs(target.id, diseaseConfig.disease);

      targetEvidence.push({
        gene,
        targetId: target.id,
        targetName: target.name,
        diseaseAssociation: {
          overallScore: evidence.overallScore,
          datatypeScores: evidence.datatypeScores,
          found: evidence.found,
        },
        druggability: drugInfo.druggabilityInfo || [],
        druggabilityCount: drugInfo.totalDrugs || 0,
        isEssential: drugInfo.isEssential || false,
      });
    } catch (err) {
      errors.push({ source: 'OpenTargets', step: gene, error: err.message });
      targetEvidence.push({
        gene,
        targetId: null,
        message: `OpenTargets fetch failed: ${err.message}`,
      });
    }
  }

  return {
    source: 'live',
    cohort: {
      studyId: diseaseConfig.studyId,
      studyName: study?.name || 'Unknown',
      studyDescription: study?.description || 'N/A',
      sampleCount: samples.length,
    },
    mutations: {
      profileId: mutations.profileId,
      totalMutations: mutations.totalMutations,
      topMutations: mutations.mutations.slice(0, 20),
    },
    mutationFrequencies,
    biomarkerData: genes.map((gene) => ({
      gene,
      mutationFrequency: mutationFrequencies[gene]?.frequency || '0%',
      mutatedSamples: mutationFrequencies[gene]?.mutatedSamples || 0,
      totalSamples: samples.length,
    })),
    targetEvidence,
    errors,
    retrievedAt: new Date().toISOString(),
  };
}