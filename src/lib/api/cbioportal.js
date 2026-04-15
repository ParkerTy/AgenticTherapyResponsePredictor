/**
 * cBioPortal API Client
 * Retrieves clinical and mutation data from open cBioPortal REST API.
 * Documentation: https://www.cbioportal.org/api
 * No API key required — fully open.
 */

const BASE_URL = 'https://www.cbioportal.org/api';

/**
 * Fetch study metadata
 */
export async function getStudy(studyId) {
  const res = await fetch(`${BASE_URL}/studies/${studyId}`, {
    headers: { 'Accept': 'application/json' },
  });
  if (!res.ok) throw new Error(`cBioPortal study fetch failed: ${res.status}`);
  return res.json();
}

/**
 * Fetch all samples in a study
 */
export async function getSamples(studyId) {
  const res = await fetch(`${BASE_URL}/studies/${studyId}/samples?pageSize=500`, {
    headers: { 'Accept': 'application/json' },
  });
  if (!res.ok) throw new Error(`cBioPortal samples fetch failed: ${res.status}`);
  return res.json();
}

/**
 * Fetch the Entrez Gene ID for a gene symbol
 */
async function getEntrezGeneId(geneSymbol) {
  const res = await fetch(`${BASE_URL}/genes/${geneSymbol}`, {
    headers: { 'Accept': 'application/json' },
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.entrezGeneId;
}

/**
 * Fetch mutations for specific genes in a study using POST endpoint
 */
export async function getMutations(studyId, genes) {
  // Get the molecular profile ID for mutations
  const profilesRes = await fetch(`${BASE_URL}/studies/${studyId}/molecular-profiles`, {
    headers: { 'Accept': 'application/json' },
  });
  if (!profilesRes.ok) throw new Error(`cBioPortal profiles fetch failed: ${profilesRes.status}`);
  const profiles = await profilesRes.json();

  const mutationProfile = profiles.find(
    (p) => p.molecularAlterationType === 'MUTATION_EXTENDED'
  );
  if (!mutationProfile) {
    return { profileId: null, mutations: [], totalMutations: 0, message: 'No mutation profile found' };
  }

  // Get the sample list ID
  const sampleListId = `${studyId}_all`;

  // Resolve entrez gene IDs
  const entrezIds = [];
  for (const gene of genes) {
    const entrezId = await getEntrezGeneId(gene);
    if (entrezId) entrezIds.push(entrezId);
  }

  if (entrezIds.length === 0) {
    return { profileId: mutationProfile.molecularProfileId, mutations: [], totalMutations: 0, message: 'No entrez IDs found' };
  }

  // Fetch mutations using POST endpoint with entrez gene IDs
  const res = await fetch(
    `${BASE_URL}/molecular-profiles/${mutationProfile.molecularProfileId}/mutations/fetch?pageSize=500`,
    {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sampleListId: sampleListId,
        entrezGeneIds: entrezIds,
      }),
    }
  );

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`cBioPortal mutations fetch failed: ${res.status} — ${errText.slice(0, 200)}`);
  }

  const data = await res.json();

  // Map gene symbol from entrez ID
  const entrezToSymbol = {};
  for (const gene of genes) {
    const id = await getEntrezGeneId(gene);
    if (id) entrezToSymbol[id] = gene;
  }

  const allMutations = data.map((m) => ({
    gene: entrezToSymbol[m.entrezGeneId] || `EntrezID:${m.entrezGeneId}`,
    sampleId: m.sampleId,
    mutationType: m.mutationType,
    proteinChange: m.proteinChange || 'N/A',
    mutationStatus: m.mutationStatus,
    chromosome: m.chr,
    startPosition: m.startPosition,
  }));

  return {
    profileId: mutationProfile.molecularProfileId,
    totalMutations: allMutations.length,
    mutations: allMutations,
  };
}

/**
 * Compute mutation frequency for each gene
 */
export function computeMutationFrequencies(mutations, totalSamples) {
  const uniqueSamples = {};

  for (const m of mutations.mutations) {
    if (!uniqueSamples[m.gene]) uniqueSamples[m.gene] = new Set();
    uniqueSamples[m.gene].add(m.sampleId);
  }

  const geneCounts = {};
  for (const [gene, samples] of Object.entries(uniqueSamples)) {
    geneCounts[gene] = {
      mutatedSamples: samples.size,
      totalSamples,
      frequency: totalSamples > 0 ? (samples.size / totalSamples * 100).toFixed(2) + '%' : 'N/A',
    };
  }

  return geneCounts;
}