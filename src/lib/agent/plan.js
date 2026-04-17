/**
 * Plan Step — Generates an execution plan for the agent.
 *
 * Phase 3 update: now query-aware. The plan adapts to parsed query intent,
 * highlighting which therapies, biomarkers, and clinical settings will be
 * emphasized downstream.
 */

export async function plan(diseaseConfig, query, parsedQuery = null) {
  const focusAreas = buildFocusAreas(parsedQuery);

  return {
    objective: `Predict therapy response and benchmark therapeutic leads for ${diseaseConfig.disease} (${diseaseConfig.subtype}).`,
    query,
    parsedQueryEcho: parsedQuery
      ? {
          therapyClasses: parsedQuery.therapyClasses,
          clinicalSettings: parsedQuery.clinicalSettings,
          biomarkers: parsedQuery.biomarkers,
          intents: parsedQuery.intents,
        }
      : null,
    focusAreas,
    steps: [
      {
        name: 'retrieve',
        description: `Fetch cohort data from ${diseaseConfig.cohortSource} (study: ${diseaseConfig.studyId}) and target/disease evidence from OpenTargets for biomarkers: ${Object.keys(diseaseConfig.biomarkers).join(', ')}.`,
        tools: ['cBioPortal', 'OpenTargets'],
      },
      {
        name: 'synthesize',
        description: 'Build evidence table joining mutation frequencies, target-disease association scores, and druggability data.',
        tools: ['internal'],
      },
      {
        name: 'predict',
        description:
          parsedQuery && parsedQuery.therapyClasses.length > 0
            ? `Apply heuristics to predict therapy response. Soft-nudge boost (+0.10 confidence-equivalent) applied to matched therapy classes: ${parsedQuery.therapyClasses.join(', ')}.`
            : 'Apply heuristics to predict therapy response based on biomarker status.',
        tools: ['internal'],
      },
      {
        name: 'generateLeads',
        description: 'Propose therapeutic lead candidates derived from predictions.',
        tools: ['internal'],
      },
      {
        name: 'benchmark',
        description: 'Score leads on a multi-dimensional composite and assign priority tiers.',
        tools: ['internal'],
      },
      {
        name: 'report',
        description: 'Compile a transparent, auditable report with provenance metadata.',
        tools: ['internal'],
      },
    ],
    endpoints: diseaseConfig.endpoints || [],
    plannedAt: new Date().toISOString(),
  };
}

/**
 * Builds a human-readable focus-areas list based on the parsed query.
 * Used by the UI to show users that their query was understood.
 */
function buildFocusAreas(parsedQuery) {
  if (!parsedQuery || !parsedQuery.hasRecognizedTerms) {
    return ['Default disease-context analysis (no query-specific focus detected).'];
  }
  const focus = [];
  if (parsedQuery.therapyClasses.length > 0) {
    focus.push(`Emphasize therapy classes: ${parsedQuery.therapyClasses.join(', ')}`);
  }
  if (parsedQuery.biomarkers.length > 0) {
    focus.push(`Emphasize biomarkers: ${parsedQuery.biomarkers.join(', ')}`);
  }
  if (parsedQuery.clinicalSettings.length > 0) {
    focus.push(`Clinical setting: ${parsedQuery.clinicalSettings.join(', ')}`);
  }
  if (parsedQuery.intents.length > 0) {
    focus.push(`Intent: ${parsedQuery.intents.join(', ')}`);
  }
  return focus;
}