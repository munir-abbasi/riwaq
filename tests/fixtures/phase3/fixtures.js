/**
 * tests/fixtures/phase3/ — Phase 3 CL/PCL test fixtures
 *
 * Five golden test vectors per scoring spec Section 3.7.
 *
 * Key structural notes:
 *   - collector_diversity(n) = number of DISTINCT terminal collectors reachable from n.
 *   - To achieve collector_diversity >= 3, each variant must end with a different
 *     terminal collector ID. A single "collector" narrator in all chains gives diversity 1.
 *   - fan_out(n) = number of unique direct students (direct children in graph).
 *   - For CL: fan_out >= 3, bundle_coverage >= 0.35, collector_diversity >= 3.
 */

/**
 * Fixture 1: Clear CL fan-out, no bypass strands.
 * Graph: prophet -> pre-link -> cl-node -> {collector-a, collector-b, collector-c}
 * CL has fan_out=3, coverage=1.0, collector_diversity=3.
 * pre-link has fan_out=3 (narrows to cl-node), giving pre_single_strand_ratio=1.0.
 * structural_score ≈ 0.375, which maps to outcome 'uncertain' (in [0.35, 0.55)).
 * Long chain: prophet->pre-link->cl-node->{collector-a,b,c} gives longer pre-CL chain
 * so pre_single_strand_ratio is meaningful.
 */
export const FIXTURE_CLEAR_CL = {
  schema_version: 1,
  imported_at: '2026-03-21T00:00:00.000Z',
  records: [{
    hadith_id: 'hadith-001',
    family_id: 'family-001',
    source_ref: {
      collection: 'Canonical Six',
      source_type: 'print',
      source_locator: 'p.1',
      ingested_at: '2026-03-21T00:00:00.000Z',
    },
    variants: [{
      variant_id: 'v1',
      isnad_chain: ['prophet', 'pre-link', 'cl-node', 'collector-a'],
    }, {
      variant_id: 'v2',
      isnad_chain: ['prophet', 'pre-link', 'cl-node', 'collector-b'],
    }, {
      variant_id: 'v3',
      isnad_chain: ['prophet', 'pre-link', 'cl-node', 'collector-c'],
    }],
    reliability_evidence: [],
  }],
  narrators: [
    { narrator_id: 'prophet', names: ['The Prophet'] },
    { narrator_id: 'pre-link', names: ['Pre-Link Narrator'] },
    { narrator_id: 'cl-node', names: ['Common Link'] },
    { narrator_id: 'collector-a', names: ['Collector A'] },
    { narrator_id: 'collector-b', names: ['Collector B'] },
    { narrator_id: 'collector-c', names: ['Collector C'] },
  ],
};

/**
 * Fixture 2: Strong CL with bypass strand triggering bypass penalty.
 * Graph: prophet -> pre-link -> cl-node -> {collector-a, collector-b, collector-c}; plus
 *         prophet -> bypass-node -> collector-a (spider/dive strand).
 * variant v4 contains ancestor (pre-link) and descendant (collector-a) but NOT cl-node.
 * bypass-node IS a descendant of cl-node (has edge to collector-a, a direct student of cl-node).
 * So variant v4 IS a bypass -> bypass_ratio = 1/4 = 0.25 -> P1 penalty = 0.05.
 * Expected: CL detected, bypass_ratio > 0, structural_score < 0.625.
 */
export const FIXTURE_CL_WITH_BYPASS = {
  schema_version: 1,
  imported_at: '2026-03-21T00:00:00.000Z',
  records: [{
    hadith_id: 'hadith-002',
    family_id: 'family-002',
    source_ref: {
      collection: 'Canonical Six',
      source_type: 'print',
      source_locator: 'p.2',
      ingested_at: '2026-03-21T00:00:00.000Z',
    },
    variants: [{
      variant_id: 'v1',
      isnad_chain: ['prophet', 'pre-link', 'cl-node', 'collector-a'],
    }, {
      variant_id: 'v2',
      isnad_chain: ['prophet', 'pre-link', 'cl-node', 'collector-b'],
    }, {
      variant_id: 'v3',
      isnad_chain: ['prophet', 'pre-link', 'cl-node', 'collector-c'],
    }, {
      variant_id: 'v4',
      isnad_chain: ['prophet', 'bypass-node', 'collector-a'],
    }],
    reliability_evidence: [],
  }],
  narrators: [
    { narrator_id: 'prophet', names: ['The Prophet'] },
    { narrator_id: 'pre-link', names: ['Pre-Link Narrator'] },
    { narrator_id: 'cl-node', names: ['Common Link'] },
    { narrator_id: 'bypass-node', names: ['Bypass Narrator'] },
    { narrator_id: 'collector-a', names: ['Collector A'] },
    { narrator_id: 'collector-b', names: ['Collector B'] },
    { narrator_id: 'collector-c', names: ['Collector C'] },
  ],
};

/**
 * Fixture 3: PCL-only, no CL threshold passes.
 * Graph: prophet -> pcl-node -> {collector-a, collector-b}
 * fan_out=2 (below CL's 3), bundle_coverage=1.0, collector_diversity=2 (below CL's 3).
 * Expected: PCL only (fallback), family_status pcl_only.
 */
export const FIXTURE_PCL_ONLY = {
  schema_version: 1,
  imported_at: '2026-03-21T00:00:00.000Z',
  records: [{
    hadith_id: 'hadith-003',
    family_id: 'family-003',
    source_ref: {
      collection: 'Minor Collection',
      source_type: 'print',
      source_locator: 'p.3',
      ingested_at: '2026-03-21T00:00:00.000Z',
    },
    variants: [{
      variant_id: 'v1',
      isnad_chain: ['prophet', 'pcl-node', 'collector-a'],
    }, {
      variant_id: 'v2',
      isnad_chain: ['prophet', 'pcl-node', 'collector-b'],
    }],
    reliability_evidence: [],
  }],
  narrators: [
    { narrator_id: 'prophet', names: ['The Prophet'] },
    { narrator_id: 'pcl-node', names: ['PCL Node'] },
    { narrator_id: 'collector-a', names: ['Collector A'] },
    { narrator_id: 'collector-b', names: ['Collector B'] },
  ],
};

/**
 * Fixture 4: Chronology conflicts and missing provenance penalties.
 * Two CL candidates: 'cl-complete' (full provenance) and 'cl-incomplete' (missing).
 * cl-incomplete has provenance_completeness_ratio < 1 -> P3 penalty applied.
 * Variant v5 has chronology_conflict=true -> P2 penalty applied to affected nodes.
 */
export const FIXTURE_CHRONOLOGY_PENALTIES = {
  schema_version: 1,
  imported_at: '2026-03-21T00:00:00.000Z',
  records: [{
    hadith_id: 'hadith-004',
    family_id: 'family-004',
    source_ref: {
      collection: 'Canonical Six',
      source_type: 'print',
      source_locator: 'p.4',
      ingested_at: '2026-03-21T00:00:00.000Z',
    },
    variants: [{
      variant_id: 'v1',
      isnad_chain: ['prophet', 'cl-complete', 'collector-a'],
    }, {
      variant_id: 'v2',
      isnad_chain: ['prophet', 'cl-complete', 'collector-b'],
    }, {
      variant_id: 'v3',
      isnad_chain: ['prophet', 'cl-complete', 'collector-c'],
    }, {
      variant_id: 'v4',
      isnad_chain: ['prophet', 'cl-incomplete', 'collector-a'],
      chronology_conflict: false,
    }, {
      variant_id: 'v5',
      isnad_chain: ['prophet', 'cl-incomplete', 'collector-b'],
      chronology_conflict: true,
    }],
    reliability_evidence: [],
  }],
  narrators: [
    { narrator_id: 'prophet', names: ['The Prophet'] },
    { narrator_id: 'cl-complete', names: ['CL Complete'] },
    { narrator_id: 'cl-incomplete', names: ['CL Incomplete'] },
    { narrator_id: 'collector-a', names: ['Collector A'] },
    { narrator_id: 'collector-b', names: ['Collector B'] },
    { narrator_id: 'collector-c', names: ['Collector C'] },
  ],
};

/**
 * Fixture 5: Profile-difference proving structural_only vs reliability_weighted divergence.
 * Same batch analyzed under both profiles.
 * Node 'cl-node' has collector_diversity=3 (meets CL threshold).
 * reliability_weighted with thiqah evidence should yield different final_confidence.
 * Long chain design: prophet->pre-link->cl-node->{collector-a,b,c}.
 */
export const FIXTURE_PROFILE_DIFFERENCE = {
  schema_version: 1,
  imported_at: '2026-03-21T00:00:00.000Z',
  records: [{
    hadith_id: 'hadith-005',
    family_id: 'family-005',
    source_ref: {
      collection: 'Canonical Six',
      source_type: 'print',
      source_locator: 'p.5',
      ingested_at: '2026-03-21T00:00:00.000Z',
    },
    variants: [{
      variant_id: 'v1',
      isnad_chain: ['prophet', 'pre-link', 'cl-node', 'collector-a'],
    }, {
      variant_id: 'v2',
      isnad_chain: ['prophet', 'pre-link', 'cl-node', 'collector-b'],
    }, {
      variant_id: 'v3',
      isnad_chain: ['prophet', 'pre-link', 'cl-node', 'collector-c'],
    }],
    reliability_evidence: [],
  }],
  narrators: [
    { narrator_id: 'prophet', names: ['The Prophet'] },
    { narrator_id: 'pre-link', names: ['Pre-Link Narrator'] },
    { narrator_id: 'cl-node', names: ['Common Link'] },
    { narrator_id: 'collector-a', names: ['Collector A'] },
    { narrator_id: 'collector-b', names: ['Collector B'] },
    { narrator_id: 'collector-c', names: ['Collector C'] },
  ],
};
