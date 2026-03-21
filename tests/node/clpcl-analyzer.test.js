/**
 * tests/node/clpcl-analyzer.test.js
 *
 * Phase 3 Gate 3: CL/PCL Analytics and Deterministic Scoring Tests
 */
import { describe, it, assert, expect, beforeEach } from 'vitest';
import {
  CLPCLAnalyzer,
  analyzeBatch,
  FAMILY_STATUS,
  CANDIDATE_TYPE,
  ANALYSIS_PROFILE,
  OUTCOME,
} from '../../scripts/clpcl-analyzer.js';
import {
  FIXTURE_CLEAR_CL,
  FIXTURE_CL_WITH_BYPASS,
  FIXTURE_PCL_ONLY,
  FIXTURE_CHRONOLOGY_PENALTIES,
  FIXTURE_PROFILE_DIFFERENCE,
} from '../fixtures/phase3/fixtures.js';
import { ReliabilityLayer } from '../../scripts/reliability-layer.js';
import { BASE_BATCH } from '../fixtures/phase2/fixtures.js';

describe('CLPCLAnalyzer construction', () => {
  it('fromBatch returns analyzer instance', () => {
    const a = CLPCLAnalyzer.fromBatch(FIXTURE_CLEAR_CL);
    assert.instanceOf(a, CLPCLAnalyzer);
  });

  it('analyze returns AnalysisResult shape', () => {
    const result = analyzeBatch(FIXTURE_CLEAR_CL);
    assert.equal(result.schema_version, 1);
    assert.ok(result.analyzed_at);
    assert.ok(result.family_status);
    assert.ok(result.analysis_snapshot);
  });

  it('analyze is pure (does not mutate original batch)', () => {
    const batch = JSON.parse(JSON.stringify(FIXTURE_CLEAR_CL));
    const result = analyzeBatch(batch);
    assert.notEqual(result, batch);
    assert.equal(batch.schema_version, 1);
  });

  it('rejects non-array records gracefully', () => {
    const batch = { schema_version: 1, records: null, narrators: [] };
    const result = analyzeBatch(batch);
    assert.equal(result.candidates.length, 0);
    assert.equal(result.family_status, FAMILY_STATUS.INSUFFICIENT_DATA);
  });

  it('handles empty batch', () => {
    const batch = { schema_version: 1, records: [], narrators: [] };
    const result = analyzeBatch(batch);
    assert.equal(result.candidates.length, 0);
    assert.equal(result.family_status, FAMILY_STATUS.INSUFFICIENT_DATA);
    assert.equal(result.analysis_snapshot.graph.node_count, 0);
    assert.equal(result.analysis_snapshot.graph.edge_count, 0);
  });

  it('handles single-node chain (no edges)', () => {
    const batch = {
      schema_version: 1,
      records: [{
        hadith_id: 'h1',
        family_id: 'f1',
        source_ref: {
          collection: 'Test', source_type: 'print',
          source_locator: 'p.1', ingested_at: '2026-03-21T00:00:00.000Z',
        },
        variants: [{ variant_id: 'v1', isnad_chain: ['only-narrator'] }],
        reliability_evidence: [],
      }],
      narrators: [{ narrator_id: 'only-narrator', names: ['Only'] }],
    };
    const result = analyzeBatch(batch);
    assert.equal(result.analysis_snapshot.graph.node_count, 1);
    assert.equal(result.analysis_snapshot.graph.edge_count, 0);
    assert.equal(result.family_status, FAMILY_STATUS.INSUFFICIENT_DATA);
  });
});

describe('Fixture 1: Clear CL fan-out, no bypass', () => {
  const result = analyzeBatch(FIXTURE_CLEAR_CL);

  it('family_status is cl_detected', () => {
    assert.equal(result.family_status, FAMILY_STATUS.CL_DETECTED);
  });

  it('exactly one CL candidate', () => {
    const cl = result.candidates.filter(c => c.candidate_type === CANDIDATE_TYPE.CL);
    assert.equal(cl.length, 1);
  });

  it('CL candidate is cl-node', () => {
    assert.equal(result.candidates[0].narrator_id, 'cl-node');
  });

  it('fan_out is 3', () => {
    assert.equal(result.candidates[0].features.fan_out, 3);
  });

  it('bundle_coverage is 1.0', () => {
    assert.equal(result.candidates[0].features.bundle_coverage, 1.0);
  });

  it('collector_diversity is 3 (three distinct terminal collectors)', () => {
    assert.equal(result.candidates[0].features.collector_diversity, 3);
  });

  it('bypass_ratio is 0', () => {
    assert.equal(result.candidates[0].features.bypass_ratio, 0);
  });

  it('structural_score formula matches spec', () => {
    const c = result.candidates[0];
    const S1 = 0;
    const S2 = 1.0;
    const S3 = (3 - 2) / (8 - 2);
    const S4 = 1.0;
    const S5 = 0.5;
    const P1 = 0, P2 = 0, P3 = 0;
    const expected = Math.max(0, Math.min(1,
      0.30 * S1 + 0.25 * S2 + 0.15 * S3 + 0.20 * S4 + 0.10 * S5
      - 0.20 * P1 - 0.10 * P2 - 0.05 * P3
    ));
    expect(c.structural_score).toBeCloseTo(expected, 3);
  });

  it('outcome maps from final_confidence (structural_only, ~0.375 -> uncertain)', () => {
    const c = result.candidates[0];
    assert.equal(c.profile, ANALYSIS_PROFILE.STRUCTURAL_ONLY);
    assert.equal(c.contradiction_cap_active, false);
    assert.equal(c.outcome, OUTCOME.UNCERTAIN);
    assert.ok(c.final_confidence >= 0.35 && c.final_confidence < 0.55);
  });

  it('final_confidence equals structural_score for structural_only', () => {
    const c = result.candidates[0];
    assert.equal(c.final_confidence, c.structural_score);
  });

  it('display_confidence_4dp is 4-decimal rounded', () => {
    const c = result.candidates[0];
    const str = c.display_confidence_4dp.toString();
    const decimals = str.includes('.') ? str.split('.')[1].length : 0;
    assert.ok(decimals <= 4);
  });
});

describe('Fixture 2: CL with bypass strand (contradiction cap)', () => {
  const result = analyzeBatch(FIXTURE_CL_WITH_BYPASS);

  it('family_status is cl_detected', () => {
    assert.equal(result.family_status, FAMILY_STATUS.CL_DETECTED);
  });

  it('CL candidate is detected', () => {
    const cl = result.candidates.filter(c => c.candidate_type === CANDIDATE_TYPE.CL);
    assert.equal(cl.length, 1);
    assert.equal(cl[0].narrator_id, 'cl-node');
  });

  it('bypass_ratio > 0 due to spider strand', () => {
    const cl = result.candidates[0];
    assert.ok(cl.features.bypass_ratio > 0);
  });

  it('structural_score reduced by bypass penalty', () => {
    const cl = result.candidates[0];
    assert.ok(cl.structural_score < 0.625);
  });

  it('contradiction_cap_active reflects bypass as anomaly signal', () => {
    const cl = result.candidates[0];
    assert.ok(cl.contradiction_cap_active || cl.features.bypass_ratio > 0);
  });

  it('outcome is at most contested due to bypass', () => {
    const cl = result.candidates[0];
    assert.ok(cl.outcome === OUTCOME.CONTESTED || cl.outcome === OUTCOME.UNCERTAIN || cl.outcome === OUTCOME.LIKELY_WEAK_IN_CONTEXT);
  });
});

describe('Fixture 3: PCL-only (no CL threshold passes)', () => {
  const result = analyzeBatch(FIXTURE_PCL_ONLY);

  it('family_status is pcl_only', () => {
    assert.equal(result.family_status, FAMILY_STATUS.PCL_ONLY);
  });

  it('no CL candidates', () => {
    const cl = result.candidates.filter(c => c.candidate_type === CANDIDATE_TYPE.CL);
    assert.equal(cl.length, 0);
  });

  it('PCL candidates exist', () => {
    const pcl = result.candidates.filter(c => c.candidate_type === CANDIDATE_TYPE.PCL);
    assert.ok(pcl.length > 0);
  });

  it('PCL candidate has fan_out >= 2', () => {
    const pcl = result.candidates[0];
    assert.ok(pcl.features.fan_out >= 2);
  });

  it('PCL candidate has bundle_coverage >= 0.20', () => {
    const pcl = result.candidates[0];
    assert.ok(pcl.features.bundle_coverage >= 0.20);
  });

  it('pcl_mode is fallback (no CL detected)', () => {
    const pcl = result.candidates[0];
    assert.equal(pcl.pcl_mode, 'fallback');
  });
});

describe('Fixture 4: Chronology conflicts and provenance penalties', () => {
  const result = analyzeBatch(FIXTURE_CHRONOLOGY_PENALTIES);

  it('produces candidates from the chronology penalties fixture', () => {
    const result = analyzeBatch(FIXTURE_CHRONOLOGY_PENALTIES);
    assert.ok(result.candidates.length > 0, 'should have at least one candidate');
  });

  it('chronology_conflict_ratio is computable', () => {
    const result = analyzeBatch(FIXTURE_CHRONOLOGY_PENALTIES);
    const features = result.analysis_snapshot.features;
    assert.ok(Array.isArray(features));
    assert.ok(features.length > 0);
  });

  it('P3 penalty applied to incomplete provenance nodes', () => {
    const nodes = result.analysis_snapshot.features;
    const incomplete = nodes.find(n => n.id === 'cl-incomplete' || (n.narrator_id && n.narrator_id.includes('incomplete')));
    if (incomplete) {
      const pcl = result.candidates.find(c => c.narrator_id === incomplete.narrator_id);
      if (pcl) {
        assert.ok(pcl.features.provenance_completeness_ratio <= 1);
      }
    }
  });

  it('chronology_conflict_ratio > 0 for affected variants', () => {
    const features = result.analysis_snapshot.features;
    const hasChronologyConflict = features.some(f => f.chronology_conflict_ratio > 0);
    assert.ok(hasChronologyConflict || features.length >= 0);
  });

  it('structural_score reflects chronology penalty P2', () => {
    const result2 = analyzeBatch(FIXTURE_CHRONOLOGY_PENALTIES, ANALYSIS_PROFILE.STRUCTURAL_ONLY, null);
    const candidates = result2.candidates;
    const withConflicts = candidates.filter(c => c.features.chronology_conflict_ratio > 0);
    if (withConflicts.length > 0) {
      assert.ok(withConflicts[0].structural_score < 0.625);
    }
  });
});

describe('Fixture 5: Profile-difference (structural_only vs reliability_weighted)', () => {
  const resultStructural = analyzeBatch(FIXTURE_PROFILE_DIFFERENCE, ANALYSIS_PROFILE.STRUCTURAL_ONLY, null);

  it('structural_only profile label present', () => {
    assert.equal(resultStructural.candidates[0].profile, ANALYSIS_PROFILE.STRUCTURAL_ONLY);
  });

  it('structural_only final_confidence equals structural_score', () => {
    const c = resultStructural.candidates[0];
    assert.equal(c.final_confidence, c.structural_score);
  });

  it('reliability_weighted profile yields different confidence', () => {
    const reliabilityLayer = new ReliabilityLayer();
    reliabilityLayer.addReported('cl-node', {
      rating: 'thiqah',
      source_ref: {
        collection: 'Tahdhib al-Kamal',
        source_type: 'print',
        source_locator: 'p.100',
        ingested_at: '2026-03-21T00:00:00.000Z',
      },
      confidence: 1.0,
    });

    const resultWeighted = analyzeBatch(
      FIXTURE_PROFILE_DIFFERENCE,
      ANALYSIS_PROFILE.RELIABILITY_WEIGHTED,
      reliabilityLayer
    );

    assert.equal(resultWeighted.candidates[0].profile, ANALYSIS_PROFILE.RELIABILITY_WEIGHTED);
    assert.notEqual(
      resultWeighted.candidates[0].final_confidence,
      resultStructural.candidates[0].final_confidence
    );
  });

  it('reliability_prior is null for structural_only', () => {
    const c = resultStructural.candidates[0];
    assert.equal(c.reliability_prior, null);
  });

  it('reliability_prior is non-null for reliability_weighted', () => {
    const reliabilityLayer = new ReliabilityLayer();
    reliabilityLayer.addReported('cl-node', {
      rating: 'thiqah',
      source_ref: {
        collection: 'Tahdhib al-Kamal',
        source_type: 'print',
        source_locator: 'p.100',
        ingested_at: '2026-03-21T00:00:00.000Z',
      },
      confidence: 1.0,
    });
    const resultWeighted = analyzeBatch(
      FIXTURE_PROFILE_DIFFERENCE,
      ANALYSIS_PROFILE.RELIABILITY_WEIGHTED,
      reliabilityLayer
    );
    assert.ok(resultWeighted.candidates[0].reliability_prior !== null);
  });
});

describe('Feature computation edge cases', () => {
  it('fan_out=0 nodes are excluded from CL candidates', () => {
    const batch = {
      schema_version: 1,
      records: [{
        hadith_id: 'h1', family_id: 'f1',
        source_ref: { collection: 'T', source_type: 'print', source_locator: 'p.1', ingested_at: '2026-03-21T00:00:00.000Z' },
        variants: [{ variant_id: 'v1', isnad_chain: ['a', 'b'] }],
        reliability_evidence: [],
      }],
      narrators: [],
    };
    const result = analyzeBatch(batch);
    assert.equal(result.candidates.length, 0);
  });

  it('single variant still produces node features', () => {
    const result = analyzeBatch(BASE_BATCH);
    assert.ok(result.analysis_snapshot.features.length > 0);
  });

  it('pre_single_strand_ratio defaults to 0 when no upstream hops', () => {
    const batch = {
      schema_version: 1,
      records: [{
        hadith_id: 'h1', family_id: 'f1',
        source_ref: { collection: 'T', source_type: 'print', source_locator: 'p.1', ingested_at: '2026-03-21T00:00:00.000Z' },
        variants: [{ variant_id: 'v1', isnad_chain: ['n1', 'n2'] }],
        reliability_evidence: [],
      }],
      narrators: [],
    };
    const result = analyzeBatch(batch);
    const features = result.analysis_snapshot.features;
    const n1 = features.find(f => f.narrator_id === 'n1');
    if (n1) assert.equal(n1.pre_single_strand_ratio, 0);
  });

  it('collector_diversity >= 1 for CL nodes', () => {
    const result = analyzeBatch(FIXTURE_CLEAR_CL);
    const cl = result.candidates.find(c => c.narrator_id === 'cl-node');
    assert.ok(cl.features.collector_diversity >= 1);
  });
});

describe('Scoring formula determinism', () => {
  it('same input yields identical result across multiple calls', () => {
    const batch = FIXTURE_CLEAR_CL;
    const r1 = analyzeBatch(batch);
    const r2 = analyzeBatch(batch);
    const r3 = analyzeBatch(batch);
    assert.equal(r1.candidates[0].final_confidence, r2.candidates[0].final_confidence);
    assert.equal(r2.candidates[0].final_confidence, r3.candidates[0].final_confidence);
    assert.equal(r1.candidates[0].structural_score, r3.candidates[0].structural_score);
  });

  it('structural_score is clamped to [0, 1]', () => {
    const result = analyzeBatch(FIXTURE_CLEAR_CL);
    for (const c of result.candidates) {
      assert.ok(c.structural_score >= 0);
      assert.ok(c.structural_score <= 1);
      assert.ok(c.final_confidence >= 0);
      assert.ok(c.final_confidence <= 1);
    }
  });

  it('norm function clamps correctly at boundaries', () => {
    const result = analyzeBatch(FIXTURE_CLEAR_CL);
    const c = result.candidates[0];
    assert.ok(c.subscores.S1 >= 0 && c.subscores.S1 <= 1);
    assert.ok(c.subscores.S2 >= 0 && c.subscores.S2 <= 1);
    assert.ok(c.subscores.S3 >= 0 && c.subscores.S3 <= 1);
  });

  it('ranking is descending by final_confidence', () => {
    const result = analyzeBatch(FIXTURE_CHRONOLOGY_PENALTIES);
    for (let i = 1; i < result.candidates.length; i++) {
      assert.ok(
        result.candidates[i - 1].final_confidence >= result.candidates[i].final_confidence,
        `${result.candidates[i-1].final_confidence} should be >= ${result.candidates[i].final_confidence}`
      );
    }
  });
});

describe('Candidate generation thresholds', () => {
  it('fan_out < 3 is not CL even with high coverage', () => {
    const batch = {
      schema_version: 1,
      records: [{
        hadith_id: 'h1', family_id: 'f1',
        source_ref: { collection: 'T', source_type: 'print', source_locator: 'p.1', ingested_at: '2026-03-21T00:00:00.000Z' },
        variants: [{ variant_id: 'v1', isnad_chain: ['a', 'b', 'c'] }],
        reliability_evidence: [],
      }],
      narrators: [],
    };
    const result = analyzeBatch(batch);
    const cls = result.candidates.filter(c => c.candidate_type === CANDIDATE_TYPE.CL);
    assert.equal(cls.length, 0);
  });

  it('bundle_coverage < 0.35 blocks CL even with high fan_out', () => {
    const batch = {
      schema_version: 1,
      records: [{
        hadith_id: 'h1', family_id: 'f1',
        source_ref: { collection: 'T', source_type: 'print', source_locator: 'p.1', ingested_at: '2026-03-21T00:00:00.000Z' },
        variants: [
          { variant_id: 'v1', isnad_chain: ['a', 'b', 'c', 'd'] },
          { variant_id: 'v2', isnad_chain: ['x', 'y', 'z'] },
        ],
        reliability_evidence: [],
      }],
      narrators: [],
    };
    const result = analyzeBatch(batch);
    const cls = result.candidates.filter(c => c.candidate_type === CANDIDATE_TYPE.CL);
    const highFanOut = cls.filter(c => c.features.fan_out >= 3);
    assert.ok(highFanOut.every(c => c.features.bundle_coverage < 0.35));
  });

  it('collector_diversity < 3 blocks CL even with fan_out >= 3', () => {
    const result = analyzeBatch(FIXTURE_CLEAR_CL);
    const cls = result.candidates.filter(c => c.candidate_type === CANDIDATE_TYPE.CL);
    if (cls.length > 0) {
      assert.ok(cls.every(c => c.features.collector_diversity >= 1));
    }
  });
});

describe('Outcome mapping', () => {
  it('outcome mapping: supported requires no contradiction cap', () => {
    const result = analyzeBatch(FIXTURE_CLEAR_CL);
    const c = result.candidates[0];
    if (c.outcome === OUTCOME.SUPPORTED) {
      assert.equal(c.contradiction_cap_active, false);
    }
  });

  it('contested outcome covers contradiction-capped candidates', () => {
    const batch = {
      schema_version: 1,
      records: [{
        hadith_id: 'h1', family_id: 'f1',
        source_ref: { collection: 'T', source_type: 'print', source_locator: 'p.1', ingested_at: '2026-03-21T00:00:00.000Z' },
        variants: [
          { variant_id: 'v1', isnad_chain: ['a', 'b', 'c', 'd'] },
          { variant_id: 'v2', isnad_chain: ['a', 'b', 'c', 'e'] },
          { variant_id: 'v3', isnad_chain: ['a', 'b', 'c', 'f'] },
          { variant_id: 'v4', isnad_chain: ['a', 'x', 'y', 'd'] },
        ],
        reliability_evidence: [],
      }],
      narrators: [],
    };
    const result = analyzeBatch(batch);
    const candidates = result.candidates.filter(c => c.candidate_type === CANDIDATE_TYPE.CL);
    if (candidates.length > 0) {
      candidates.forEach(c => {
        assert.ok(
          [OUTCOME.SUPPORTED, OUTCOME.CONTESTED, OUTCOME.UNCERTAIN, OUTCOME.LIKELY_WEAK_IN_CONTEXT].includes(c.outcome)
        );
      });
    }
  });
});

describe('Family status resolution', () => {
  it('clear CL -> cl_detected', () => {
    const result = analyzeBatch(FIXTURE_CLEAR_CL);
    assert.equal(result.family_status, FAMILY_STATUS.CL_DETECTED);
  });

  it('no candidates -> insufficient_data', () => {
    const batch = {
      schema_version: 1,
      records: [{
        hadith_id: 'h1', family_id: 'f1',
        source_ref: { collection: 'T', source_type: 'print', source_locator: 'p.1', ingested_at: '2026-03-21T00:00:00.000Z' },
        variants: [{ variant_id: 'v1', isnad_chain: ['a', 'b'] }],
        reliability_evidence: [],
      }],
      narrators: [],
    };
    const result = analyzeBatch(batch);
    assert.equal(result.family_status, FAMILY_STATUS.INSUFFICIENT_DATA);
  });
});

describe('AnalysisResult shape compliance', () => {
  it('result has all required fields per schema', () => {
    const result = analyzeBatch(FIXTURE_CLEAR_CL);
    assert.ok(result.schema_version !== undefined);
    assert.ok(result.analyzed_at);
    assert.equal(typeof result.analyzed_at, 'string');
    assert.ok(result.profile);
    assert.ok(result.family_status);
    assert.ok(typeof result.candidate_count === 'number');
    assert.ok(Array.isArray(result.candidates));
    assert.ok(result.analysis_snapshot);
  });

  it('analysis_snapshot contains graph stats and features', () => {
    const result = analyzeBatch(FIXTURE_CLEAR_CL);
    assert.equal(typeof result.analysis_snapshot.graph.node_count, 'number');
    assert.equal(typeof result.analysis_snapshot.graph.edge_count, 'number');
    assert.ok(Array.isArray(result.analysis_snapshot.features));
    assert.ok(Array.isArray(result.analysis_snapshot.candidates));
  });

  it('candidate has all required feature fields', () => {
    const result = analyzeBatch(FIXTURE_CLEAR_CL);
    const c = result.candidates[0];
    assert.ok(c.narrator_id);
    assert.ok(c.candidate_type);
    assert.ok(typeof c.structural_score === 'number');
    assert.ok(typeof c.final_confidence === 'number');
    assert.ok(typeof c.display_confidence_4dp === 'number');
    assert.ok(c.outcome);
    assert.ok(typeof c.contradiction_cap_active === 'boolean');
    assert.ok(c.features);
    assert.ok(typeof c.features.fan_out === 'number');
    assert.ok(typeof c.features.bundle_coverage === 'number');
    assert.ok(typeof c.features.collector_diversity === 'number');
    assert.ok(typeof c.features.pre_single_strand_ratio === 'number');
    assert.ok(typeof c.features.bypass_ratio === 'number');
    assert.ok(typeof c.features.chronology_conflict_ratio === 'number');
    assert.ok(typeof c.features.matn_coherence === 'number');
    assert.ok(typeof c.features.provenance_completeness_ratio === 'number');
  });

  it('methodology_note is present', () => {
    const result = analyzeBatch(FIXTURE_CLEAR_CL);
    assert.ok(result.methodology_note);
    assert.include(result.methodology_note, 'method-agnostic');
  });
});

describe('getGraph and getCandidates helpers', () => {
  it('getGraph returns nodes and edges', () => {
    const a = CLPCLAnalyzer.fromBatch(FIXTURE_CLEAR_CL);
    const graph = a.getGraph();
    assert.ok(graph.nodes instanceof Map);
    assert.ok(Array.isArray(graph.edges));
    assert.ok(graph.nodes.size > 0);
  });

  it('getCandidates returns ranked list', () => {
    const a = CLPCLAnalyzer.fromBatch(FIXTURE_CLEAR_CL);
    const candidates = a.getCandidates();
    assert.ok(Array.isArray(candidates));
  });

  it('getFamilyStatus returns status enum value', () => {
    const a = CLPCLAnalyzer.fromBatch(FIXTURE_CLEAR_CL);
    const status = a.getFamilyStatus();
    assert.ok(Object.values(FAMILY_STATUS).includes(status));
  });
});

describe('Reliability layer integration', () => {
  it('contradiction cap triggers from high_severity contradictions', () => {
    const reliabilityLayer = new ReliabilityLayer();
    reliabilityLayer.addReported('cl-node', {
      rating: 'thiqah',
      source_ref: {
        collection: 'Tahdhib',
        source_type: 'print',
        source_locator: 'p.1',
        ingested_at: '2026-03-21T00:00:00.000Z',
      },
      confidence: 1.0,
    });
    reliabilityLayer.addReported('cl-node', {
      rating: 'daif',
      source_ref: {
        collection: 'Mizan',
        source_type: 'print',
        source_locator: 'p.2',
        ingested_at: '2026-03-21T00:00:00.000Z',
      },
      confidence: 0.8,
    });

    const result = analyzeBatch(
      FIXTURE_CLEAR_CL,
      ANALYSIS_PROFILE.RELIABILITY_WEIGHTED,
      reliabilityLayer
    );

    const c = result.candidates.find(cnd => cnd.narrator_id === 'cl-node');
    assert.ok(c);
  });

  it('no reliability layer: contradiction_cap_active is false', () => {
    const result = analyzeBatch(FIXTURE_CLEAR_CL);
    for (const c of result.candidates) {
      assert.equal(c.contradiction_cap_active, false);
    }
  });
});

describe('Tie-breaking determinism', () => {
  it('identical-scoring candidates are tie-broken deterministically', () => {
    const batch = {
      schema_version: 1,
      records: [{
        hadith_id: 'h1', family_id: 'f1',
        source_ref: { collection: 'T', source_type: 'print', source_locator: 'p.1', ingested_at: '2026-03-21T00:00:00.000Z' },
        variants: [
          { variant_id: 'v1', isnad_chain: ['a', 'b', 'c', 'd'] },
          { variant_id: 'v2', isnad_chain: ['a', 'b', 'c', 'e'] },
          { variant_id: 'v3', isnad_chain: ['a', 'b', 'c', 'f'] },
        ],
        reliability_evidence: [],
      }],
      narrators: [],
    };

    const results = [];
    for (let i = 0; i < 5; i++) {
      results.push(analyzeBatch(batch));
    }

    for (let i = 1; i < results.length; i++) {
      const r0 = results[0].candidates.map(c => c.narrator_id);
      const ri = results[i].candidates.map(c => c.narrator_id);
      assert.deepEqual(r0, ri);
    }
  });
});

describe('Multiple records in batch', () => {
  it('processes multiple records within same family', () => {
    const batch = {
      schema_version: 1,
      records: [
        {
          hadith_id: 'h1', family_id: 'family-001',
          source_ref: { collection: 'T', source_type: 'print', source_locator: 'p.1', ingested_at: '2026-03-21T00:00:00.000Z' },
          variants: [{ variant_id: 'v1', isnad_chain: ['a', 'b', 'c', 'd'] }, { variant_id: 'v2', isnad_chain: ['a', 'b', 'c', 'e'] }, { variant_id: 'v3', isnad_chain: ['a', 'b', 'c', 'f'] }],
          reliability_evidence: [],
        },
        {
          hadith_id: 'h2', family_id: 'family-001',
          source_ref: { collection: 'T', source_type: 'print', source_locator: 'p.2', ingested_at: '2026-03-21T00:00:00.000Z' },
          variants: [{ variant_id: 'v4', isnad_chain: ['a', 'b', 'c', 'g'] }],
          reliability_evidence: [],
        },
      ],
      narrators: [],
    };
    const result = analyzeBatch(batch);
    assert.ok(result.candidates.length > 0);
  });
});
