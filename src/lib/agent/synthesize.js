/**
 * Step 3: Synthesize
 * Assembles an auditable evidence table from retrieved data.
 */

export async function synthesize(diseaseConfig, retrieveResult) {
  const evidenceTable = Object.entries(diseaseConfig.biomarkers).map(
    ([gene, info]) => ({
      gene,
      role: info.role,
      effect: info.mutationEffect || info.expressionEffect || info.highEffect || 'Unknown',
      dataSource: retrieveResult.source,
      retrievedData: retrieveResult.biomarkerData.find((b) => b.gene === gene) || null,
    })
  );

  return {
    evidenceTable,
    totalItems: evidenceTable.length,
    synthesisMethod: 'config-driven biomarker-evidence mapping',
  };
}