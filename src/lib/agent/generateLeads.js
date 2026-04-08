/**
 * Step 5: Generate Leads
 * Proposes mechanism-level therapeutic leads based on evidence.
 * Constrained to target/pathway level — no molecule generation.
 */

export async function generateLeads(diseaseConfig, predictResult) {
  const leads = [];

  for (const [gene, info] of Object.entries(diseaseConfig.biomarkers)) {
    leads.push({
      leadType: 'target',
      primaryTarget: gene,
      mechanismCategory: info.role,
      rationale: info.mutationEffect || info.expressionEffect || info.highEffect || 'See config',
      derivedFrom: `${diseaseConfig.subtype} biomarker config`,
    });
  }

  return {
    leads,
    totalLeads: leads.length,
    generationMethod: 'Config-driven mechanism-level lead proposal',
  };
}