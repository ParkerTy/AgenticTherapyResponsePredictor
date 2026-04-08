/**
 * Step 1: Plan
 * Interprets the query and disease context to generate a step-by-step reasoning plan.
 */

export async function plan(diseaseConfig, query) {
  const steps = [
    `Retrieve cohort data for ${diseaseConfig.subtype} from ${diseaseConfig.cohortSource} (study: ${diseaseConfig.studyId})`,
    `Identify relevant biomarkers: ${Object.keys(diseaseConfig.biomarkers).join(', ')}`,
    `Retrieve target-disease evidence from OpenTargets`,
    `Synthesize evidence table linking biomarkers to therapy options`,
    `Apply prediction heuristics for therapy response`,
    `Generate mechanism-level therapeutic leads`,
    `Benchmark leads against standard therapies: ${diseaseConfig.standardTherapies.join('; ')}`,
    `Produce auditable report with provenance`,
  ];

  return {
    disease: diseaseConfig.subtype,
    query,
    generatedPlan: steps,
    toolsRequired: ['cBioPortal', 'OpenTargets'],
    endpointsOfInterest: diseaseConfig.endpoints,
  };
}