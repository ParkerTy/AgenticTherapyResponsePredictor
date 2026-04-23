/**
 * CIViC API Client
 * Clinical Interpretation of Variants in Cancer
 * Retrieves expert-curated clinical evidence for cancer gene variants.
 * Uses CIViC v2 GraphQL API.
 * Documentation: https://civicdb.org / https://griffithlab.github.io/civic-v2/
 * No API key required.
 *
 * Citation: Griffith et al., Nature Genetics 49:170–174 (2017)
 * CIViC MCP: Schimmelpfennig et al., bioRxiv (2025)
 */

const BASE_URL = 'https://civicdb.org/api/graphql';

/**
 * Search for a gene in CIViC and retrieve its clinical evidence items.
 *
 * @param {string} geneSymbol - e.g. 'PIK3CA', 'KRAS'
 * @param {string} diseaseName - e.g. 'Breast Cancer', 'Colorectal Cancer'
 * @returns {object} { gene, totalEvidenceItems, evidenceByLevel, evidenceByType, therapies, items[], found }
 */
export async function getClinicalEvidence(geneSymbol, diseaseName) {
  try {
    // Step 1: Find the gene via featureTypeahead
    const searchQuery = `
      query FindGene($queryTerm: String!) {
        featureTypeahead(queryTerm: $queryTerm, featureType: GENE) {
          id
          name
          featureType
        }
      }
    `;

    const searchRes = await fetch(BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: searchQuery,
        variables: { queryTerm: geneSymbol },
      }),
    });

    if (!searchRes.ok) {
      console.warn(`CIViC search returned ${searchRes.status} for ${geneSymbol}`);
      return buildEmptyResult(geneSymbol, diseaseName);
    }

    const searchData = await searchRes.json();
    if (searchData.errors) {
      console.warn(`CIViC search errors for ${geneSymbol}:`, searchData.errors[0]?.message);
      return buildEmptyResult(geneSymbol, diseaseName);
    }

    const features = searchData.data?.featureTypeahead || [];
    const match = features.find((f) =>
      f.name?.toUpperCase() === geneSymbol.toUpperCase()
    ) || features[0];

    if (!match) {
      return buildEmptyResult(geneSymbol, diseaseName);
    }

    // Step 2: Get gene details with variants and evidence
    const geneQuery = `
      query GetGene($id: Int!) {
        gene(id: $id) {
          id
          name
          description
          variants {
            totalCount
            nodes {
              id
              name
              molecularProfiles {
                totalCount
                nodes {
                  id
                  name
                  evidenceItems(first: 50) {
                    totalCount
                    nodes {
                      id
                      evidenceLevel
                      evidenceType
                      significance
                      evidenceDirection
                      evidenceRating
                      status
                      description
                      disease {
                        name
                        id
                      }
                      therapies {
                        name
                        id
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    `;

    const geneRes = await fetch(BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: geneQuery,
        variables: { id: match.id },
      }),
    });

    if (!geneRes.ok) {
      console.warn(`CIViC gene query returned ${geneRes.status} for ${geneSymbol}`);
      return buildEmptyResult(geneSymbol, diseaseName);
    }

    const geneData = await geneRes.json();
    if (geneData.errors) {
      console.warn(`CIViC gene query errors for ${geneSymbol}:`, geneData.errors[0]?.message);
      return buildEmptyResult(geneSymbol, diseaseName);
    }

    const gene = geneData.data?.gene;
    if (!gene) return buildEmptyResult(geneSymbol, diseaseName);

    // Collect evidence items from all variants' molecular profiles
    const allItems = [];
    const variants = gene.variants?.nodes || [];
    for (const variant of variants) {
      const profiles = variant.molecularProfiles?.nodes || [];
      for (const profile of profiles) {
        const items = profile.evidenceItems?.nodes || [];
        for (const item of items) {
          // Filter to accepted status client-side since the API doesn't support it as an argument
          if (item.status && item.status !== 'ACCEPTED') continue;

          allItems.push({
            molecularProfile: profile.name,
            variantName: variant.name,
            evidenceLevel: item.evidenceLevel,
            evidenceType: item.evidenceType,
            significance: item.significance,
            evidenceDirection: item.evidenceDirection,
            disease: item.disease?.name || 'Unknown',
            diseaseId: item.disease?.id || null,
            therapies: (item.therapies || []).map((t) => t.name),
            description: item.description || '',
            rating: item.evidenceRating,
            civicId: item.id,
          });
        }
      }
    }

    // Filter by disease name if provided
    const diseaseKey = diseaseName ? diseaseName.toLowerCase().split(' ')[0] : '';
    const diseaseFiltered = diseaseKey
      ? allItems.filter((item) => item.disease.toLowerCase().includes(diseaseKey))
      : allItems;

    const relevantItems = diseaseFiltered.length > 0 ? diseaseFiltered : allItems;

    // Summarize by level
    const evidenceByLevel = {};
    for (const item of relevantItems) {
      const level = item.evidenceLevel || 'UNKNOWN';
      evidenceByLevel[level] = (evidenceByLevel[level] || 0) + 1;
    }

    // Summarize by type
    const evidenceByType = {};
    for (const item of relevantItems) {
      const type = item.evidenceType || 'UNKNOWN';
      evidenceByType[type] = (evidenceByType[type] || 0) + 1;
    }

    // Unique therapies
    const therapySet = new Set();
    for (const item of relevantItems) {
      for (const t of item.therapies) therapySet.add(t);
    }

    // Best evidence level
    const levelRank = { A: 5, B: 4, C: 3, D: 2, E: 1 };
    let bestLevel = null;
    let bestRank = 0;
    for (const level of Object.keys(evidenceByLevel)) {
      const rank = levelRank[level] || 0;
      if (rank > bestRank) { bestRank = rank; bestLevel = level; }
    }

    return {
      gene: geneSymbol,
      civicGeneId: gene.id,
      geneDescription: gene.description || '',
      totalVariants: variants.length,
      totalEvidenceItems: relevantItems.length,
      totalAllDiseaseItems: allItems.length,
      diseaseFilter: diseaseName || 'none',
      bestEvidenceLevel: bestLevel,
      evidenceByLevel,
      evidenceByType,
      therapies: Array.from(therapySet),
      predictiveCount: evidenceByType['PREDICTIVE'] || 0,
      items: relevantItems.slice(0, 10),
      found: relevantItems.length > 0,
    };
  } catch (err) {
    console.warn(`CIViC fetch error for ${geneSymbol}: ${err.message}`);
    return buildEmptyResult(geneSymbol, diseaseName);
  }
}

function buildEmptyResult(geneSymbol, diseaseName) {
  return {
    gene: geneSymbol,
    civicGeneId: null,
    geneDescription: '',
    totalVariants: 0,
    totalEvidenceItems: 0,
    totalAllDiseaseItems: 0,
    diseaseFilter: diseaseName || 'none',
    bestEvidenceLevel: null,
    evidenceByLevel: {},
    evidenceByType: {},
    therapies: [],
    predictiveCount: 0,
    items: [],
    found: false,
  };
}

export function getEvidenceLevelLabel(level) {
  const labels = {
    A: 'Validated (Level A)',
    B: 'Clinical (Level B)',
    C: 'Case Study (Level C)',
    D: 'Preclinical (Level D)',
    E: 'Inferential (Level E)',
  };
  return labels[level] || `Level ${level}`;
}