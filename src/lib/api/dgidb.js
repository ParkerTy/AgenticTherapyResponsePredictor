/**
 * DGIdb API Client
 * Drug Gene Interaction Database
 * Retrieves known drug-gene interactions for a given gene symbol.
 * Uses DGIdb v5 GraphQL API.
 * Documentation: https://dgidb.org/api
 * No API key required.
 *
 * Citation: Cannon et al., Nucleic Acids Research 52:D1227–D1235 (2024)
 */

const BASE_URL = 'https://dgidb.org/api/graphql';

/**
 * Fetch drug-gene interactions for a given gene symbol.
 *
 * @param {string} geneSymbol - e.g. 'PIK3CA', 'KRAS', 'EGFR'
 * @returns {object} { gene, totalInteractions, drugs[], interactionTypes[], found }
 */
export async function getDrugInteractions(geneSymbol) {
  const query = `
    query ($name: String!) {
      genes(name: $name) {
        nodes {
          name
          longName
          conceptId
          geneCategories {
            name
          }
          interactions {
            drug {
              name
              conceptId
              approved
            }
            interactionScore
            interactionTypes {
              type
              directionality
            }
            publications {
              pmid
            }
            sources {
              fullName
            }
          }
        }
      }
    }
  `;

  try {
    const res = await fetch(BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, variables: { name: geneSymbol } }),
    });

    if (!res.ok) {
      console.warn(`DGIdb API returned ${res.status} for ${geneSymbol}`);
      return buildEmptyResult(geneSymbol);
    }

    const data = await res.json();

    if (data.errors) {
      console.warn(`DGIdb GraphQL errors for ${geneSymbol}:`, data.errors[0]?.message);
      return buildEmptyResult(geneSymbol);
    }

    const nodes = data.data?.genes?.nodes || [];
    if (nodes.length === 0) {
      return buildEmptyResult(geneSymbol);
    }

    const gene = nodes[0];
    const interactions = gene.interactions || [];

    // Process interactions into drug records
    const drugMap = new Map();

    for (const interaction of interactions) {
      const drug = interaction.drug;
      if (!drug || !drug.name) continue;

      const drugName = drug.name;

      if (drugMap.has(drugName)) {
        const existing = drugMap.get(drugName);
        existing.sourceCount += (interaction.sources || []).length;
        existing.publicationCount += (interaction.publications || []).length;
        continue;
      }

      const types = (interaction.interactionTypes || [])
        .map((t) => t.type)
        .filter(Boolean);

      drugMap.set(drugName, {
        name: drugName,
        conceptId: drug.conceptId || null,
        approved: drug.approved || false,
        interactionTypes: types,
        interactionScore: interaction.interactionScore || null,
        sourceCount: (interaction.sources || []).length,
        publicationCount: (interaction.publications || []).length,
        sources: (interaction.sources || []).map((s) => s.fullName),
      });
    }

    const drugs = Array.from(drugMap.values());

    // Sort: approved drugs first, then by source count
    drugs.sort((a, b) => {
      if (a.approved !== b.approved) return b.approved ? 1 : -1;
      return b.sourceCount - a.sourceCount;
    });

    // Collect unique interaction types
    const allTypes = new Set();
    for (const d of drugs) {
      for (const t of d.interactionTypes) allTypes.add(t);
    }

    const categories = (gene.geneCategories || []).map((c) => c.name).filter(Boolean);

    return {
      gene: geneSymbol,
      geneLongName: gene.longName || gene.name || geneSymbol,
      geneCategories: categories,
      totalInteractions: drugs.length,
      approvedDrugCount: drugs.filter((d) => d.approved).length,
      interactionTypes: Array.from(allTypes),
      drugs: drugs.slice(0, 20),
      allDrugNames: drugs.map((d) => d.name),
      found: true,
    };
  } catch (err) {
    console.warn(`DGIdb fetch error for ${geneSymbol}: ${err.message}`);
    return buildEmptyResult(geneSymbol);
  }
}

function buildEmptyResult(geneSymbol) {
  return {
    gene: geneSymbol,
    geneLongName: geneSymbol,
    geneCategories: [],
    totalInteractions: 0,
    approvedDrugCount: 0,
    interactionTypes: [],
    drugs: [],
    allDrugNames: [],
    found: false,
  };
}