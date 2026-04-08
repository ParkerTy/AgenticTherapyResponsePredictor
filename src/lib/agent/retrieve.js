/**
 * Step 2: Retrieve
 * Pulls clinical, genomic, pathway, and drug-target evidence.
 * Phase 1: Returns stub data. Phase 2: Connects to real APIs.
 */

export async function retrieve(diseaseConfig, planResult) {
  // STUB — will be replaced with real API calls in Phase 2
  return {
    source: 'stub',
    cohort: {
      studyId: diseaseConfig.studyId,
      sampleCount: 0,
      message: 'Stub data — real API integration in Phase 2',
    },
    targets: {
      source: 'OpenTargets',
      results: [],
      message: 'Stub data — real API integration in Phase 2',
    },
    biomarkerData: Object.keys(diseaseConfig.biomarkers).map((gene) => ({
      gene,
      mutationFrequency: null,
      message: 'Stub — awaiting cBioPortal integration',
    })),
  };
}