/**
 * scripts/artifacts.js
 *
 * Phase 5 — Machine-Readable Artifact Emitters
 *
 * Emits four deterministic JSON artifacts from a batch + AnalysisResult pair.
 * These are the canonical machine-readable outputs consumed by exports and
 * downstream tooling. Each artifact is stable: same input → same output
 * (only timestamp fields vary).
 *
 * Artifacts:
 *   1. normalized_chains.json  — per-family canonical isnad chains
 *   2. narrator_graph.json    — directed graph (nodes + edges) for the family
 *   3. cl_candidates.json     — ranked CL/PCL candidates with scores
 *   4. analysis_snapshot.json — full analysis result with all feature vectors
 *
 * Public API:
 *   emitArtifacts(batch, analysisResult, familyId) → ArtifactBundle
 *   emitNormalizedChains(batch, familyId) → NormalizedChainsArtifact
 *   emitNarratorGraph(batch, familyId) → NarratorGraphArtifact
 *   emitCLCandidates(analysisResult) → CLCandidatesArtifact
 *   emitAnalysisSnapshot(analysisResult) → AnalysisSnapshotArtifact
 */

/**
 * @typedef {Object} NormalizedChain
 * @property {string} family_id
 * @property {string} record_id
 * @property {string} variant_id
 * @property {string[]} isnad_chain  canonical narrator IDs, in transmission order
 * @property {string|null} matn_raw
 * @property {string} provenance_ref  — formatted "collection:locator"
 */

/**
 * @typedef {Object} NarratorNode
 * @property {string} narrator_id
 * @property {string[]} names
 * @property {string|null} biographical_ref
 * @property {number} in_degree
 * @property {number} out_degree
 */

/**
 * @typedef {Object} NarratorEdge
 * @property {string} from  narrator_id
 * @property {string} to    narrator_id
 * @property {string[]} variant_ids  — variants where this edge appears
 * @property {string} provenance_ref
 */

/**
 * @typedef {Object} ArtifactBundle
 * @property {NormalizedChainsArtifact} normalized_chains
 * @property {NarratorGraphArtifact} narrator_graph
 * @property {CLCandidatesArtifact} cl_candidates
 * @property {AnalysisSnapshotArtifact} analysis_snapshot
 */

export const ARTIFACT_VERSION = 1;

export function emitNormalizedChains(batch, familyId) {
  const records = (batch.records || []).filter(r => r.family_id === familyId);
  const chains = [];

  for (const record of records) {
    const provenanceRef = _formatProvenance(record.source_ref);
    for (const variant of record.variants || []) {
      chains.push({
        family_id: familyId,
        record_id: record.hadith_id,
        variant_id: variant.variant_id,
        isnad_chain: [...(variant.isnad_chain || [])],
        matn_raw: variant.matn_raw || null,
        provenance_ref: provenanceRef,
      });
    }
  }

  return {
    schema_version: ARTIFACT_VERSION,
    artifact_type: 'normalized_chains',
    generated_at: new Date().toISOString(),
    family_id: familyId,
    chain_count: chains.length,
    chains,
  };
}

export function emitNarratorGraph(batch, familyId) {
  const records = (batch.records || []).filter(r => r.family_id === familyId);
  const nodeMap = new Map();
  const edgeMap = new Map();
  const narratorLookup = new Map();
  for (const n of batch.narrators || []) {
    narratorLookup.set(n.narrator_id, n);
  }

  for (const record of records) {
    for (const variant of record.variants || []) {
      const chain = variant.isnad_chain || [];
      const provenanceRef = _formatProvenance(record.source_ref);
      for (let i = 0; i < chain.length; i++) {
        const nid = chain[i];
        if (!nodeMap.has(nid)) {
          const profile = narratorLookup.get(nid);
          nodeMap.set(nid, {
            narrator_id: nid,
            names: profile?.names || [],
            biographical_ref: null,
            in_degree: 0,
            out_degree: 0,
          });
        }
        if (i > 0) {
          const prev = chain[i - 1];
          const edgeKey = `${prev}→${nid}`;
          if (!edgeMap.has(edgeKey)) {
            edgeMap.set(edgeKey, { from: prev, to: nid, variant_ids: [], provenance_ref: provenanceRef });
          }
          edgeMap.get(edgeKey).variant_ids.push(variant.variant_id);
        }
      }
    }
  }

  for (const edge of edgeMap.values()) {
    const fromNode = nodeMap.get(edge.from);
    const toNode = nodeMap.get(edge.to);
    if (fromNode) fromNode.out_degree++;
    if (toNode) toNode.in_degree++;
    edge.variant_ids = [...new Set(edge.variant_ids)];
  }

  return {
    schema_version: ARTIFACT_VERSION,
    artifact_type: 'narrator_graph',
    generated_at: new Date().toISOString(),
    family_id: familyId,
    node_count: nodeMap.size,
    edge_count: edgeMap.size,
    nodes: [...nodeMap.values()],
    edges: [...edgeMap.values()],
  };
}

export function emitCLCandidates(analysisResult) {
  if (!analysisResult || !analysisResult.candidates) {
    return {
      schema_version: ARTIFACT_VERSION,
      artifact_type: 'cl_candidates',
      generated_at: new Date().toISOString(),
      family_id: analysisResult?.family_id || null,
      candidate_count: 0,
      candidates: [],
      status: 'no_analysis',
    };
  }

  const ranked = analysisResult.candidates
    .slice()
    .sort((a, b) => {
      if (b.final_confidence !== a.final_confidence) return b.final_confidence - a.final_confidence;
      if (b.bundle_coverage !== a.bundle_coverage) return b.bundle_coverage - a.bundle_coverage;
      if (b.fan_out !== a.fan_out) return b.fan_out - a.fan_out;
      if (a.bypass_ratio !== b.bypass_ratio) return a.bypass_ratio - b.bypass_ratio;
      return a.narrator_id.localeCompare(b.narrator_id);
    });

  const candidates = ranked.map((c, idx) => ({
    rank: idx + 1,
    narrator_id: c.narrator_id,
    candidate_type: c.candidate_type,
    outcome: c.outcome,
    final_confidence: c.final_confidence,
    display_confidence_4dp: c.display_confidence_4dp,
    profile: c.profile,
    contradiction_cap_active: c.contradiction_cap_active || false,
    structural_score: c.structural_score,
    reliability_prior: c.reliability_prior,
    bundle_coverage: c.bundle_coverage,
    fan_out: c.fan_out,
    collector_diversity: c.collector_diversity,
    bypass_ratio: c.bypass_ratio,
    methodology_note: c.methodology_note || null,
    evidence_ids: (c.evidence_ids || []).slice(),
  }));

  return {
    schema_version: ARTIFACT_VERSION,
    artifact_type: 'cl_candidates',
    generated_at: new Date().toISOString(),
    family_id: analysisResult.family_id || null,
    family_status: analysisResult.family_status,
    profile: analysisResult.profile,
    candidate_count: candidates.length,
    candidates,
  };
}

export function emitAnalysisSnapshot(analysisResult) {
  if (!analysisResult) {
    return {
      schema_version: ARTIFACT_VERSION,
      artifact_type: 'analysis_snapshot',
      generated_at: new Date().toISOString(),
      status: 'no_analysis',
    };
  }

  return {
    schema_version: ARTIFACT_VERSION,
    artifact_type: 'analysis_snapshot',
    generated_at: new Date().toISOString(),
    family_id: analysisResult.family_id || null,
    family_status: analysisResult.family_status,
    profile: analysisResult.profile,
    candidate_count: analysisResult.candidate_count || 0,
    analyzed_at: analysisResult.analyzed_at,
    methodology_note: analysisResult.methodology_note || null,
    analysis_snapshot: analysisResult.analysis_snapshot || null,
    candidates: (analysisResult.candidates || []).map(c => ({
      narrator_id: c.narrator_id,
      candidate_type: c.candidate_type,
      outcome: c.outcome,
      final_confidence: c.final_confidence,
      display_confidence_4dp: c.display_confidence_4dp,
      contradiction_cap_active: c.contradiction_cap_active || false,
      features: c.features || null,
      subscores: c.subscores || null,
      penalties: c.penalties || null,
      reliability_prior: c.reliability_prior,
      profile: c.profile,
      methodology_note: c.methodology_note || null,
    })),
  };
}

export function emitArtifacts(batch, analysisResult, familyId) {
  return {
    normalized_chains: emitNormalizedChains(batch, familyId),
    narrator_graph: emitNarratorGraph(batch, familyId),
    cl_candidates: emitCLCandidates(analysisResult),
    analysis_snapshot: emitAnalysisSnapshot(analysisResult),
  };
}

function _formatProvenance(sourceRef) {
  if (!sourceRef) return 'unknown:unknown';
  const coll = sourceRef.collection || 'unknown';
  const loc = sourceRef.source_locator || 'unknown';
  return `${coll}:${loc}`;
}
