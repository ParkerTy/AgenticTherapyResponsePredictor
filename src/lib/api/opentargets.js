/**
 * OpenTargets API Client
 * Retrieves target-disease association evidence via GraphQL.
 * Documentation: https://platform-docs.opentargets.org/
 * No API key required — fully open.
 */

const BASE_URL = 'https://api.platform.opentargets.org/api/v4/graphql';

const DISEASE_EFO_MAP = {
  'Breast Cancer': 'EFO_0000305',
  'Colorectal Cancer': 'EFO_0000365',
  'Lung Cancer': 'EFO_0001071',
};

/**
 * Fetch Ensembl gene ID from gene symbol
 */
export async function getTargetId(geneSymbol) {
  const query = `
    query {
      search(queryString: ${JSON.stringify(geneSymbol)}, entityNames: ["target"], page: { size: 5, index: 0 }) {
        hits {
          id
          name
          entity
        }
      }
    }
  `;

  const res = await fetch(BASE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  });

  if (!res.ok) throw new Error(`OpenTargets search failed: ${res.status}`);
  const data = await res.json();

  const hits = data.data?.search?.hits || [];
  const exactMatch = hits.find((h) => h.entity === 'target' && h.name?.toUpperCase().includes(geneSymbol.toUpperCase()));
  const hit = exactMatch || hits[0];

  return hit ? { id: hit.id, name: hit.name } : null;
}

/**
 * Fetch target-disease association evidence
 */
export async function getTargetDiseaseEvidence(targetId, diseaseName) {
  const diseaseId = DISEASE_EFO_MAP[diseaseName];
  if (!diseaseId) {
    return { error: `No EFO mapping for disease: ${diseaseName}`, evidence: [], found: false };
  }

  const query = `
    query {
      target(ensemblId: ${JSON.stringify(targetId)}) {
        id
        approvedSymbol
        associatedDiseases(page: { size: 100, index: 0 }) {
          rows {
            disease {
              id
              name
            }
            score
            datasourceScores {
              id
              score
            }
          }
        }
      }
    }
  `;

  const res = await fetch(BASE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  });

  if (!res.ok) throw new Error(`OpenTargets evidence fetch failed: ${res.status}`);
  const data = await res.json();

  const rows = data.data?.target?.associatedDiseases?.rows || [];
  const match = rows.find((r) => r.disease.id === diseaseId);

  if (!match) {
    return {
      targetId,
      geneSymbol: data.data?.target?.approvedSymbol || targetId,
      diseaseId,
      diseaseName,
      overallScore: 0,
      datatypeScores: [],
      found: false,
    };
  }

  return {
    targetId,
    geneSymbol: data.data?.target?.approvedSymbol || targetId,
    diseaseId,
    diseaseName: match.disease.name,
    overallScore: match.score,
    datatypeScores: match.datasourceScores || [],
    found: true,
  };
}

/**
 * Fetch drug information for a target using the pharmacogenomics and tractability data
 */
export async function getKnownDrugs(targetId, diseaseName) {
  const query = `
    query {
      target(ensemblId: ${JSON.stringify(targetId)}) {
        id
        approvedSymbol
        tractability {
          label
          modality
          value
        }
        isEssential
        genomicLocation {
          chromosome
          start
          end
        }
      }
    }
  `;

  const res = await fetch(BASE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  });

  if (!res.ok) {
    return {
      targetId,
      geneSymbol: null,
      totalDrugs: 0,
      drugs: [],
      tractability: [],
    };
  }

  const data = await res.json();
  const target = data.data?.target;
  const tractability = target?.tractability || [];

  // Tractability tells us if a target is druggable
  const druggable = tractability.filter((t) => t.value === true);

  return {
    targetId,
    geneSymbol: target?.approvedSymbol,
    totalDrugs: druggable.length,
    druggabilityInfo: druggable.map((t) => ({
      label: t.label,
      modality: t.modality,
    })),
    isEssential: target?.isEssential || false,
  };
}