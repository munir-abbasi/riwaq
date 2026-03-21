/**
 * scripts/clpcl-analyzer.js
 *
 * Phase 3 — CL/PCL Analytics and Deterministic Scoring
 *
 * Implements Juynboll's Common Link (CL) and Partial Common Link (PCL) detection
 * over a hadith family graph, with deterministic structural scoring.
 *
 * Method basis (Juynboll CL literature + ICMA):
 *   - CL: transmission is narrow before a key node and fans out after it.
 *   - PCL: downstream convergences/fan-outs reinforcing CL-centered structure.
 *   - Spider/dive bypass strands: anomaly signals, not fabrication proof.
 *
 * Public API:
 *   CLPCLAnalyzer.fromBatch(batch, options?) → CLPCLAnalyzer
 *   analyzer.analyze(profile?, reliabilityLayer?) → AnalysisResult
 *   analyzer.getGraph() → GraphView
 *   analyzer.getCandidates() → Candidate[]
 *   analyzer.getFamilyStatus() → 'cl_detected' | 'pcl_only' | 'insufficient_data'
 */
export const FAMILY_STATUS = Object.freeze({
  CL_DETECTED: 'cl_detected',
  PCL_ONLY: 'pcl_only',
  INSUFFICIENT_DATA: 'insufficient_data',
});

export const CANDIDATE_TYPE = Object.freeze({
  CL: 'common_link',
  PCL: 'partial_common_link',
});

export const ANALYSIS_PROFILE = Object.freeze({
  STRUCTURAL_ONLY: 'structural_only',
  RELIABILITY_WEIGHTED: 'reliability_weighted',
});

export const OUTCOME = Object.freeze({
  SUPPORTED: 'supported',
  CONTESTED: 'contested',
  UNCERTAIN: 'uncertain',
  LIKELY_WEAK_IN_CONTEXT: 'likely_weak_in_context',
});

function clamp(x, lo, hi) {
  return Math.max(lo, Math.min(hi, x));
}

function norm(x, lo, hi) {
  if (hi === lo) return 0;
  return clamp((x - lo) / (hi - lo), 0, 1);
}

const RATING_PRIORS = Object.freeze({
  thiqah: 0.75,
  saduq: 0.65,
  majhul_or_unknown: 0.50,
  daif: 0.35,
  matruk_or_accused_fabrication: 0.20,
});

const DEFAULT_MATN_COHERENCE = 0.50;
const CONTRADICTION_CAP = 0.70;
const SUPPORTED_THRESHOLD = 0.75;
const CONTESTED_LOW = 0.55;
const UNCERTAIN_LOW = 0.35;

/**
 * Build a directed graph from a canonical batch.
 * Returns nodes Map<id, GraphNode> and adjacency lists.
 */
function buildGraph(batch) {
  const nodes = new Map();
  const edges = [];

  function ensureNode(id) {
    if (!nodes.has(id)) {
      nodes.set(id, {
        id,
        variants: new Set(),
        directStudents: new Set(),
        directTeachers: new Set(),
        incidentEdges: [],
        completeProvenanceCount: 0,
        totalProvenanceCount: 0,
      });
    }
    return nodes.get(id);
  }

  for (const record of batch.records || []) {
    const familyId = record.family_id || record.hadith_id;
    const sourceRef = record.source_ref || {};
    const provenanceComplete = !!(
      sourceRef.collection &&
      sourceRef.source_type &&
      sourceRef.source_locator &&
      sourceRef.ingested_at
    );

    for (const variant of record.variants || []) {
      const chain = variant.isnad_chain || [];

      for (const nid of chain) {
        const node = ensureNode(nid);
        node.variants.add(variant.variant_id || `${familyId}-${record.hadith_id}`);
        node.totalProvenanceCount++;
        if (provenanceComplete) node.completeProvenanceCount++;
      }

      if (chain.length < 2) continue;

      for (let i = 0; i < chain.length - 1; i++) {
        const src = chain[i];
        const tgt = chain[i + 1];
        ensureNode(src);
        ensureNode(tgt);
        nodes.get(src).directStudents.add(tgt);
        nodes.get(tgt).directTeachers.add(src);
        const edge = {
          source: src,
          target: tgt,
          variant_id: variant.variant_id,
          chronology_conflict: !!variant.chronology_conflict,
        };
        edges.push(edge);
        nodes.get(src).incidentEdges.push(edge);
        nodes.get(tgt).incidentEdges.push(edge);
      }
    }
  }

  return { nodes, edges };
}

/**
 * Topological-ish ancestor/descendant computation via BFS.
 * Returns Set of all nodes reachable upstream (ancestors) or downstream (descendants).
 */
function computeReachability(nodes, startId, direction) {
  const visited = new Set();
  const queue = [startId];
  while (queue.length > 0) {
    const current = queue.shift();
    if (visited.has(current)) continue;
    visited.add(current);
    const node = nodes.get(current);
    if (!node) continue;
    const neighbors = direction === 'ancestors' ? node.directTeachers : node.directStudents;
    for (const n of neighbors) {
      if (!visited.has(n)) queue.push(n);
    }
  }
  visited.delete(startId);
  return visited;
}

/**
 * Compute terminal collector IDs for each variant.
 * Terminal = last narrator before the compiler/collector boundary.
 * Convention: last element in chain = collector.
 */
function computeTerminalCollectors(batch) {
  const terminals = new Map();
  for (const record of batch.records || []) {
    for (const variant of record.variants || []) {
      const chain = variant.isnad_chain || [];
      if (chain.length > 0) {
        const terminalId = chain[chain.length - 1];
        const variantId = variant.variant_id || `${record.family_id || record.hadith_id}`;
        if (!terminals.has(variantId)) {
          terminals.set(variantId, new Set());
        }
        terminals.get(variantId).add(terminalId);
      }
    }
  }
  return terminals;
}

function variantContainsNode(variant, nodeId) {
  return (variant.isnad_chain || []).includes(nodeId);
}

function getTerminalSetForVariant(variant) {
  const chain = variant.isnad_chain || [];
  return chain.length > 0 ? chain[chain.length - 1] : null;
}

/**
 * Compute per-node features per the scoring spec.
 */
function computeFeatures(nodes, batch) {
  const variants = [];
  for (const record of batch.records || []) {
    for (const variant of record.variants || []) {
      variants.push({ ...variant, family_id: record.family_id });
    }
  }
  const V = variants.length;

  const features = new Map();

  for (const [nid, node] of nodes) {
    const ancestors = computeReachability(nodes, nid, 'ancestors');
    const descendants = computeReachability(nodes, nid, 'descendants');

    const fan_out = node.directStudents.size;
    const bundle_coverage = V > 0 ? node.variants.size / V : 0;

    const collectorSet = new Set();
    for (const variant of variants) {
      const chain = variant.isnad_chain || [];
      if (chain.includes(nid)) {
        if (chain.length > 0) collectorSet.add(chain[chain.length - 1]);
      }
    }
    const collector_diversity = collectorSet.size;

    let singleStrandHops = 0;
    let totalUpstreamHops = 0;
    for (const record of batch.records || []) {
      for (const variant of record.variants || []) {
        const chain = variant.isnad_chain || [];
        const idx = chain.indexOf(nid);
        if (idx > 0) {
          for (let h = 0; h < idx; h++) {
            totalUpstreamHops++;
            const srcId = chain[h];
            const srcNode = nodes.get(srcId);
            if (srcNode && srcNode.directStudents.size === 1) {
              singleStrandHops++;
            }
          }
        }
      }
    }
    const pre_single_strand_ratio = totalUpstreamHops > 0 ? singleStrandHops / totalUpstreamHops : 0;

    let bypassCount = 0;
    for (const variant of variants) {
      const chain = variant.isnad_chain || [];
      const idx = chain.indexOf(nid);
      if (idx === -1) {
        const terminal = getTerminalSetForVariant(variant);
        const chainAncestors = new Set();
        const chainDescendants = new Set();
        for (let i = 0; i < chain.length - 1; i++) {
          if (ancestors.has(chain[i])) chainAncestors.add(chain[i]);
          if (descendants.has(chain[i])) chainDescendants.add(chain[i]);
        }
        let prevAncestor = false;
        let foundDescendant = false;
        let hasAncestorBeforeDescendant = false;
        for (const eid of chain) {
          if (ancestors.has(eid)) {
            prevAncestor = true;
          } else if (descendants.has(eid) && prevAncestor) {
            hasAncestorBeforeDescendant = true;
          }
        }
        if (hasAncestorBeforeDescendant && terminal && collectorSet.has(terminal)) {
          bypassCount++;
        }
      }
    }
    const bypass_ratio = V > 0 ? bypassCount / V : 0;

    let chronologyConflicts = 0;
    const incidentCount = node.incidentEdges.length;
    for (const edge of node.incidentEdges) {
      if (edge.chronology_conflict) chronologyConflicts++;
    }
    const chronology_conflict_ratio = incidentCount > 0 ? chronologyConflicts / incidentCount : 0;

    const matn_coherence = DEFAULT_MATN_COHERENCE;

    const provenance_completeness_ratio = node.totalProvenanceCount > 0
      ? node.completeProvenanceCount / node.totalProvenanceCount
      : 1;

    features.set(nid, {
      fan_out,
      bundle_coverage,
      collector_diversity,
      pre_single_strand_ratio,
      bypass_ratio,
      chronology_conflict_ratio,
      matn_coherence,
      provenance_completeness_ratio: provenance_completeness_ratio,
    });
  }

  return features;
}

/**
 * Generate CL and PCL candidates per the scoring spec.
 */
function generateCandidates(nodes, features, variants) {
  const clCandidates = [];
  const pclCandidates = [];

  for (const [nid] of nodes) {
    const f = features.get(nid);
    if (!f) continue;

    if (f.fan_out >= 3 && f.bundle_coverage >= 0.35 && f.collector_diversity >= 3) {
      clCandidates.push(nid);
    }
  }

  const clSet = new Set(clCandidates);

  for (const [nid] of nodes) {
    if (clSet.has(nid)) continue;
    const f = features.get(nid);
    if (!f) continue;

    if (f.fan_out >= 2 && f.bundle_coverage >= 0.20) {
      const ancestors = computeReachability(nodes, nid, 'ancestors');
      const isDownstreamOfCL = [...ancestors].some(aid => clSet.has(aid));

      if (isDownstreamOfCL) {
        pclCandidates.push({ id: nid, mode: 'cl_anchored' });
      } else if (clCandidates.length === 0 && f.fan_out >= 2 && f.bundle_coverage >= 0.20 && f.collector_diversity >= 2) {
        pclCandidates.push({ id: nid, mode: 'fallback' });
      }
    }
  }

  return { clCandidates, pclCandidates };
}

function computeStructuralScore(f) {
  const S1 = norm(f.fan_out, 3, 8);
  const S2 = f.bundle_coverage;
  const S3 = norm(f.collector_diversity, 2, 8);
  const S4 = f.pre_single_strand_ratio;
  const S5 = f.matn_coherence;
  const P1 = f.bypass_ratio;
  const P2 = f.chronology_conflict_ratio;
  const P3 = 1 - f.provenance_completeness_ratio;

  const raw = 0.30 * S1 + 0.25 * S2 + 0.15 * S3 + 0.20 * S4 + 0.10 * S5
    - 0.20 * P1 - 0.10 * P2 - 0.05 * P3;

  return clamp(raw, 0, 1);
}

function mapRatingToPrior(rating) {
  return RATING_PRIORS[rating] !== undefined ? RATING_PRIORS[rating] : null;
}

function computeReliabilityPrior(nid, reliabilityLayer) {
  if (!reliabilityLayer) return 0.50;
  const derived = reliabilityLayer.getDerived(nid);
  if (!derived || derived.confidence === undefined) return 0.50;
  return derived.confidence;
}

function applyContradictionCap(confidence, contradictionFlag) {
  if (contradictionFlag) {
    return Math.min(confidence, CONTRADICTION_CAP);
  }
  return confidence;
}

function mapToOutcome(finalConfidence, contradictionFlag) {
  if (!contradictionFlag && finalConfidence >= SUPPORTED_THRESHOLD) {
    return OUTCOME.SUPPORTED;
  }
  if (finalConfidence >= CONTESTED_LOW) {
    return OUTCOME.CONTESTED;
  }
  if (finalConfidence >= UNCERTAIN_LOW) {
    return OUTCOME.UNCERTAIN;
  }
  return OUTCOME.LIKELY_WEAK_IN_CONTEXT;
}

function rankCandidates(candidates) {
  return [...candidates].sort((a, b) => {
    if (b.final_confidence !== a.final_confidence) {
      return b.final_confidence - a.final_confidence;
    }
    if (b.bundle_coverage !== a.bundle_coverage) {
      return b.bundle_coverage - a.bundle_coverage;
    }
    if (b.fan_out !== a.fan_out) {
      return b.fan_out - a.fan_out;
    }
    if (a.bypass_ratio !== b.bypass_ratio) {
      return a.bypass_ratio - b.bypass_ratio;
    }
    return a.narrator_id.localeCompare(b.narrator_id);
  });
}

export class CLPCLAnalyzer {
  constructor(batch, options = {}) {
    this._batch = batch;
    this._options = Object.freeze({ ...options });
    this._graph = null;
    this._features = null;
    this._candidates = null;
    this._familyStatus = null;
    this._analyzed = false;
  }

  static fromBatch(batch, options) {
    return new CLPCLAnalyzer(batch, options);
  }

  _ensureAnalyzed(profile = ANALYSIS_PROFILE.STRUCTURAL_ONLY, reliabilityLayer = null) {
    if (this._analyzed) return;
    this._analyze(profile, reliabilityLayer);
    this._analyzed = true;
  }

  _analyze(profile, reliabilityLayer) {
    const { nodes, edges } = buildGraph(this._batch);
    this._graph = { nodes, edges };

    const variants = [];
    for (const record of this._batch.records || []) {
      for (const variant of record.variants || []) {
        variants.push({ ...variant, family_id: record.family_id });
      }
    }

    this._features = computeFeatures(nodes, this._batch);
    const { clCandidates, pclCandidates } = generateCandidates(nodes, this._features, variants);

    const candidates = [];

    for (const nid of clCandidates) {
      const f = this._features.get(nid);
      const structural_score = computeStructuralScore(f);
      let p0 = 0.50;

      if (reliabilityLayer) {
        const derived = reliabilityLayer.getDerived(nid);
        if (derived && derived.confidence !== undefined) {
          p0 = derived.confidence;
        }
      }

      let final_confidence;
      if (profile === ANALYSIS_PROFILE.RELIABILITY_WEIGHTED) {
        final_confidence = clamp(0.65 * structural_score + 0.35 * p0, 0, 1);
      } else {
        final_confidence = structural_score;
      }

      const contradictionFlag = reliabilityLayer
        ? reliabilityLayer.getContradictions(nid).filter(c => c.severity === 'high').length > 0
        : false;

      final_confidence = applyContradictionCap(final_confidence, contradictionFlag);

      const outcome = mapToOutcome(final_confidence, contradictionFlag);

      candidates.push({
        narrator_id: nid,
        candidate_type: CANDIDATE_TYPE.CL,
        structural_score: Math.round(structural_score * 1e12) / 1e12,
        final_confidence: Math.round(final_confidence * 1e12) / 1e12,
        display_confidence_4dp: Math.round(final_confidence * 10000) / 10000,
        outcome,
        contradiction_cap_active: contradictionFlag,
        profile,
        features: {
          fan_out: f.fan_out,
          bundle_coverage: Math.round(f.bundle_coverage * 1e12) / 1e12,
          collector_diversity: f.collector_diversity,
          pre_single_strand_ratio: Math.round(f.pre_single_strand_ratio * 1e12) / 1e12,
          bypass_ratio: Math.round(f.bypass_ratio * 1e12) / 1e12,
          chronology_conflict_ratio: Math.round(f.chronology_conflict_ratio * 1e12) / 1e12,
          matn_coherence: Math.round(f.matn_coherence * 1e12) / 1e12,
          provenance_completeness_ratio: Math.round(f.provenance_completeness_ratio * 1e12) / 1e12,
        },
        subscores: {
          S1: Math.round(norm(f.fan_out, 3, 8) * 1e12) / 1e12,
          S2: Math.round(f.bundle_coverage * 1e12) / 1e12,
          S3: Math.round(norm(f.collector_diversity, 2, 8) * 1e12) / 1e12,
          S4: Math.round(f.pre_single_strand_ratio * 1e12) / 1e12,
          S5: Math.round(f.matn_coherence * 1e12) / 1e12,
          P1: Math.round(f.bypass_ratio * 1e12) / 1e12,
          P2: Math.round(f.chronology_conflict_ratio * 1e12) / 1e12,
          P3: Math.round((1 - f.provenance_completeness_ratio) * 1e12) / 1e12,
        },
        reliability_prior: profile === ANALYSIS_PROFILE.RELIABILITY_WEIGHTED
          ? Math.round(p0 * 1e12) / 1e12
          : null,
        _family_id: (this._batch.records?.[0]?.family_id || this._batch.records?.[0]?.hadith_id || 'unknown'),
      });
    }

    for (const { id: nid, mode } of pclCandidates) {
      const f = this._features.get(nid);
      const structural_score = computeStructuralScore(f);
      let p0 = 0.50;

      if (reliabilityLayer) {
        const derived = reliabilityLayer.getDerived(nid);
        if (derived && derived.confidence !== undefined) {
          p0 = derived.confidence;
        }
      }

      let final_confidence;
      if (profile === ANALYSIS_PROFILE.RELIABILITY_WEIGHTED) {
        final_confidence = clamp(0.65 * structural_score + 0.35 * p0, 0, 1);
      } else {
        final_confidence = structural_score;
      }

      const contradictionFlag = reliabilityLayer
        ? reliabilityLayer.getContradictions(nid).filter(c => c.severity === 'high').length > 0
        : false;

      final_confidence = applyContradictionCap(final_confidence, contradictionFlag);
      const outcome = mapToOutcome(final_confidence, contradictionFlag);

      candidates.push({
        narrator_id: nid,
        candidate_type: CANDIDATE_TYPE.PCL,
        pcl_mode: mode,
        structural_score: Math.round(structural_score * 1e12) / 1e12,
        final_confidence: Math.round(final_confidence * 1e12) / 1e12,
        display_confidence_4dp: Math.round(final_confidence * 10000) / 10000,
        outcome,
        contradiction_cap_active: contradictionFlag,
        profile,
        features: {
          fan_out: f.fan_out,
          bundle_coverage: Math.round(f.bundle_coverage * 1e12) / 1e12,
          collector_diversity: f.collector_diversity,
          pre_single_strand_ratio: Math.round(f.pre_single_strand_ratio * 1e12) / 1e12,
          bypass_ratio: Math.round(f.bypass_ratio * 1e12) / 1e12,
          chronology_conflict_ratio: Math.round(f.chronology_conflict_ratio * 1e12) / 1e12,
          matn_coherence: Math.round(f.matn_coherence * 1e12) / 1e12,
          provenance_completeness_ratio: Math.round(f.provenance_completeness_ratio * 1e12) / 1e12,
        },
        subscores: {
          S1: Math.round(norm(f.fan_out, 3, 8) * 1e12) / 1e12,
          S2: Math.round(f.bundle_coverage * 1e12) / 1e12,
          S3: Math.round(norm(f.collector_diversity, 2, 8) * 1e12) / 1e12,
          S4: Math.round(f.pre_single_strand_ratio * 1e12) / 1e12,
          S5: Math.round(f.matn_coherence * 1e12) / 1e12,
          P1: Math.round(f.bypass_ratio * 1e12) / 1e12,
          P2: Math.round(f.chronology_conflict_ratio * 1e12) / 1e12,
          P3: Math.round((1 - f.provenance_completeness_ratio) * 1e12) / 1e12,
        },
        reliability_prior: profile === ANALYSIS_PROFILE.RELIABILITY_WEIGHTED
          ? Math.round(p0 * 1e12) / 1e12
          : null,
        _family_id: (this._batch.records?.[0]?.family_id || this._batch.records?.[0]?.hadith_id || 'unknown'),
      });
    }

    this._candidates = rankCandidates(candidates);

    if (clCandidates.length > 0) {
      this._familyStatus = FAMILY_STATUS.CL_DETECTED;
    } else if (pclCandidates.length > 0) {
      this._familyStatus = FAMILY_STATUS.PCL_ONLY;
    } else {
      this._familyStatus = FAMILY_STATUS.INSUFFICIENT_DATA;
    }
  }

  analyze(profile = ANALYSIS_PROFILE.STRUCTURAL_ONLY, reliabilityLayer = null) {
    const fresh = new CLPCLAnalyzer(this._batch, this._options);
    fresh._analyze(profile, reliabilityLayer);
    fresh._analyzed = true;

    return {
      schema_version: 1,
      analyzed_at: new Date().toISOString(),
      profile,
      family_status: fresh._familyStatus,
      candidate_count: fresh._candidates.length,
      candidates: fresh._candidates,
      analysis_snapshot: {
        graph: {
          node_count: fresh._graph ? fresh._graph.nodes.size : 0,
          edge_count: fresh._graph ? fresh._graph.edges.length : 0,
        },
        features: fresh._features
          ? [...fresh._features.entries()].map(([nid, f]) => ({ narrator_id: nid, ...f }))
          : [],
        candidates: fresh._candidates,
      },
      methodology_note: 'CL/PCL analysis is an interpretation layer. Map creation remains method-agnostic.',
    };
  }

  getGraph() {
    this._ensureAnalyzed();
    return this._graph;
  }

  getCandidates() {
    this._ensureAnalyzed();
    return [...this._candidates];
  }

  getFamilyStatus() {
    this._ensureAnalyzed();
    return this._familyStatus;
  }
}

export function analyzeBatch(batch, profile = ANALYSIS_PROFILE.STRUCTURAL_ONLY, reliabilityLayer = null) {
  return CLPCLAnalyzer.fromBatch(batch).analyze(profile, reliabilityLayer);
}
