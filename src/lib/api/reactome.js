/**
 * Reactome API Client
 * Reactome Pathway Knowledgebase
 * Retrieves biological pathway information for gene symbols.
 * Documentation: https://reactome.org/ContentService
 * REST API — no API key required.
 *
 * Citation: Ragueneau et al., Nucleic Acids Research (2025)
 * "The Reactome Knowledgebase 2026"
 */

const BASE_URL = 'https://reactome.org/ContentService';

/**
 * Fetch the top-level pathways associated with a gene symbol.
 * Uses Reactome's search endpoint to find the gene, then retrieves
 * pathway membership.
 *
 * @param {string} geneSymbol - e.g. 'PIK3CA', 'KRAS', 'EGFR'
 * @returns {object} { gene, pathways[], topPathway, found }
 */
export async function getGenePathways(geneSymbol) {
  try {
    // Step 1: Search for the gene in Reactome
    const searchUrl = `${BASE_URL}/search/query?query=${encodeURIComponent(geneSymbol)}&types=Protein&cluster=true`;

    const searchRes = await fetch(searchUrl, {
      headers: { 'Accept': 'application/json' },
    });

    if (!searchRes.ok) {
      console.warn(`Reactome search returned ${searchRes.status} for ${geneSymbol}`);
      return buildEmptyResult(geneSymbol);
    }

    const searchData = await searchRes.json();

    // Find matching entries from search results
    const groups = searchData.results || [];
    let stableId = null;

    for (const group of groups) {
      const entries = group.entries || [];
      for (const entry of entries) {
        // Look for an exact or close match on the gene name
        const name = (entry.name || '').toUpperCase();
        const id = entry.stId || entry.id;
        if (name.includes(geneSymbol.toUpperCase()) && id) {
          stableId = id;
          break;
        }
      }
      if (stableId) break;
    }

    if (!stableId) {
      // Fallback: try the first protein result
      for (const group of groups) {
        const entries = group.entries || [];
        if (entries.length > 0 && entries[0].stId) {
          stableId = entries[0].stId;
          break;
        }
      }
    }

    if (!stableId) {
      return buildEmptyResult(geneSymbol);
    }

    // Step 2: Get pathways for this entity
    const pathwayUrl = `${BASE_URL}/data/pathways/low/entity/${stableId}?species=9606`;

    const pathwayRes = await fetch(pathwayUrl, {
      headers: { 'Accept': 'application/json' },
    });

    if (!pathwayRes.ok) {
      // If pathways endpoint fails, try alternate approach using event/ancestors
      return await fallbackPathwayLookup(geneSymbol, stableId);
    }

    const pathways = await pathwayRes.json();

    if (!Array.isArray(pathways) || pathways.length === 0) {
      return await fallbackPathwayLookup(geneSymbol, stableId);
    }

    // Process pathways — deduplicate and extract key info
    const pathwayMap = new Map();

    for (const pw of pathways) {
      const name = pw.displayName || pw.name || 'Unknown Pathway';
      if (!pathwayMap.has(name)) {
        pathwayMap.set(name, {
          name,
          stableId: pw.stId || null,
          species: pw.speciesName || 'Homo sapiens',
          isInDisease: pw.isInDisease || false,
          category: pw.schemaClass || 'Pathway',
        });
      }
    }

    const uniquePathways = Array.from(pathwayMap.values());

    // Sort: disease-relevant pathways first, then alphabetical
    uniquePathways.sort((a, b) => {
      if (a.isInDisease !== b.isInDisease) return b.isInDisease ? 1 : -1;
      return a.name.localeCompare(b.name);
    });

    // Identify the most relevant "top pathway" (shortest name is often the most specific)
    const topPathway = uniquePathways.reduce((best, pw) => {
      if (!best) return pw;
      return pw.name.length < best.name.length ? pw : best;
    }, null);

    return {
      gene: geneSymbol,
      reactomeEntityId: stableId,
      totalPathways: uniquePathways.length,
      topPathway: topPathway ? topPathway.name : null,
      topPathwayId: topPathway ? topPathway.stableId : null,
      pathways: uniquePathways.slice(0, 10), // Top 10 pathways
      allPathwayNames: uniquePathways.map((p) => p.name),
      found: true,
    };
  } catch (err) {
    console.warn(`Reactome fetch error for ${geneSymbol}: ${err.message}`);
    return buildEmptyResult(geneSymbol);
  }
}

/**
 * Fallback pathway lookup using a simpler search approach
 */
async function fallbackPathwayLookup(geneSymbol, stableId) {
  try {
    // Try getting top-level pathways via the participant endpoint
    const url = `${BASE_URL}/data/participants/${stableId}/referrals`;

    const res = await fetch(url, {
      headers: { 'Accept': 'application/json' },
    });

    if (!res.ok) {
      return buildEmptyResult(geneSymbol);
    }

    const data = await res.json();

    if (!Array.isArray(data) || data.length === 0) {
      return buildEmptyResult(geneSymbol);
    }

    // Filter for Pathway type entries
    const pathways = data
      .filter((item) => item.schemaClass === 'Pathway' || item.className === 'Pathway')
      .map((pw) => ({
        name: pw.displayName || pw.name || 'Unknown Pathway',
        stableId: pw.stId || null,
        species: pw.speciesName || 'Homo sapiens',
        isInDisease: pw.isInDisease || false,
        category: 'Pathway',
      }));

    if (pathways.length === 0) {
      return buildEmptyResult(geneSymbol);
    }

    // Deduplicate
    const unique = [];
    const seen = new Set();
    for (const pw of pathways) {
      if (!seen.has(pw.name)) {
        seen.add(pw.name);
        unique.push(pw);
      }
    }

    const topPathway = unique[0];

    return {
      gene: geneSymbol,
      reactomeEntityId: stableId,
      totalPathways: unique.length,
      topPathway: topPathway ? topPathway.name : null,
      topPathwayId: topPathway ? topPathway.stableId : null,
      pathways: unique.slice(0, 10),
      allPathwayNames: unique.map((p) => p.name),
      found: true,
    };
  } catch (err) {
    return buildEmptyResult(geneSymbol);
  }
}

/**
 * Build an empty result object when no Reactome data is found
 */
function buildEmptyResult(geneSymbol) {
  return {
    gene: geneSymbol,
    reactomeEntityId: null,
    totalPathways: 0,
    topPathway: null,
    topPathwayId: null,
    pathways: [],
    allPathwayNames: [],
    found: false,
  };
}
