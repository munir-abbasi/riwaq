/**
 * tests/node/reliability-layer.test.js
 *
 * Phase 2 Gate 2: Reliability Layer Tests
 */
import { describe, it, assert } from 'vitest';
import { ReliabilityLayer, LAYER, RATING, RATING_PRIOR } from '../../scripts/reliability-layer.js';
import { EVIDENCE_THIQ, EVIDENCE_DAIF, EVIDENCE_ANALYTICAL, EVIDENCE_NO_PROVENANCE, BASE_BATCH } from '../fixtures/phase2/fixtures.js';

describe('ReliabilityLayer — provenance enforcement', () => {
  it('addReported throws without source_ref', () => {
    const l = new ReliabilityLayer();
    assert.throws(() => l.addReported('n1', EVIDENCE_NO_PROVENANCE));
  });

  it('addAnalytical throws without source_ref', () => {
    const l = new ReliabilityLayer();
    assert.throws(() => l.addAnalytical('n1', { ...EVIDENCE_NO_PROVENANCE }));
  });

  it('getReported returns empty array for unknown narrator', () => {
    const l = new ReliabilityLayer();
    assert.deepEqual(l.getReported('unknown'), []);
  });
});

describe('ReliabilityLayer — reported layer', () => {
  it('addReported stores evidence in reported layer', () => {
    const l = new ReliabilityLayer();
    l.addReported('n1', EVIDENCE_THIQ);
    const reported = l.getReported('n1');
    assert.equal(reported.length, 1);
    assert.equal(reported[0].rating, 'thiqah');
  });

  it('addReported sets date_layer to reported', () => {
    const l = new ReliabilityLayer();
    l.addReported('n1', { ...EVIDENCE_THIQ, date_layer: undefined });
    const reported = l.getReported('n1');
    assert.equal(reported[0].date_layer, 'reported');
  });

  it('addReported cannot inject analytical layer', () => {
    const l = new ReliabilityLayer();
    assert.throws(() => l.addReported('n1', { ...EVIDENCE_THIQ, date_layer: 'analytical' }));
  });

  it('duplicate evidence (same source + rating) is idempotent', () => {
    const l = new ReliabilityLayer();
    l.addReported('n1', EVIDENCE_THIQ);
    l.addReported('n1', { ...EVIDENCE_THIQ });
    assert.equal(l.getReported('n1').length, 1);
  });

  it('different sources produce separate evidence items', () => {
    const l = new ReliabilityLayer();
    l.addReported('n1', EVIDENCE_THIQ);
    l.addReported('n1', EVIDENCE_DAIF);
    const reported = l.getReported('n1');
    assert.equal(reported.length, 2);
  });

  it('seedFromBatch populates reported layer', () => {
    const l = new ReliabilityLayer();
    l.seedFromBatch({
      ...BASE_BATCH,
      narrators: [{
        ...BASE_BATCH.narrators[0],
        reliability_evidence: [EVIDENCE_THIQ],
      }],
    });
    assert.equal(l.getReported('narrator-a').length, 1);
  });
});

describe('ReliabilityLayer — analytical layer', () => {
  it('addAnalytical stores evidence in analytical layer', () => {
    const l = new ReliabilityLayer();
    l.addAnalytical('n1', EVIDENCE_ANALYTICAL);
    assert.equal(l.getAnalytical('n1').length, 1);
    assert.equal(l.getAnalytical('n1')[0].date_layer, 'analytical');
  });

  it('reported and analytical layers are distinct', () => {
    const l = new ReliabilityLayer();
    l.addReported('n1', EVIDENCE_THIQ);
    l.addAnalytical('n1', EVIDENCE_ANALYTICAL);
    assert.equal(l.getReported('n1').length, 1);
    assert.equal(l.getAnalytical('n1').length, 1);
  });

  it('analytical evidence does not appear in reported', () => {
    const l = new ReliabilityLayer();
    l.addAnalytical('n1', EVIDENCE_ANALYTICAL);
    assert.equal(l.getReported('n1').length, 0);
  });
});

describe('ReliabilityLayer — contradiction detection', () => {
  it('detects thiqah + daif as high-severity contradiction', () => {
    const l = new ReliabilityLayer();
    l.addReported('n1', EVIDENCE_THIQ);
    l.addReported('n1', EVIDENCE_DAIF);
    const contradictions = l.getContradictions('n1');
    assert.equal(contradictions.length, 1);
    assert.equal(contradictions[0].severity, 'high');
  });

  it('detects thiqah + matruk as high-severity contradiction', () => {
    const l = new ReliabilityLayer();
    l.addReported('n1', EVIDENCE_THIQ);
    l.addReported('n1', { ...EVIDENCE_THIQ, evidence_id: 'ev2', rating: 'matruk', source_ref: { collection: 'Mizan', source_type: 'print', source_locator: 'p1', ingested_at: '2026-03-21T00:00:00.000Z' }, ingested_at: '2026-03-21T00:00:00.000Z' });
    const contradictions = l.getContradictions('n1');
    assert.equal(contradictions.length, 1);
    assert.equal(contradictions[0].severity, 'high');
  });

  it('saduq + daif is not a high-severity contradiction', () => {
    const l = new ReliabilityLayer();
    l.addReported('n1', { ...EVIDENCE_THIQ, evidence_id: 'ev1', rating: 'saduq' });
    l.addReported('n1', { ...EVIDENCE_DAIF });
    const contradictions = l.getContradictions('n1');
    assert.equal(contradictions.length, 0);
  });
});

describe('ReliabilityLayer — derived assessment', () => {
  it('returns null for narrator with no evidence', () => {
    const l = new ReliabilityLayer();
    assert.isNull(l.getDerived('unknown'));
  });

  it('returns prior for single thiqah rating', () => {
    const l = new ReliabilityLayer();
    l.addReported('n1', { ...EVIDENCE_THIQ, rating_confidence: 1.0 });
    const derived = l.getDerived('n1');
    assert.isNotNull(derived);
    assert.equal(derived.prior, 0.75);
    assert.isFalse(derived.conflicting);
  });

  it('contradiction caps derived_confidence at 0.70 when prior would exceed it', () => {
    const l = new ReliabilityLayer();
    l.addReported('n1', { ...EVIDENCE_THIQ, rating_confidence: 1.0 });
    l.addReported('n1', { ...EVIDENCE_DAIF, rating_confidence: 0.1 });
    const derived = l.getDerived('n1');
    assert.isTrue(derived.conflicting);
    assert.equal(derived.derived_confidence, 0.70);
  });

  it('no contradiction: prior is used as derived_confidence', () => {
    const l = new ReliabilityLayer();
    l.addReported('n1', { ...EVIDENCE_THIQ, rating_confidence: 0.3 });
    l.addReported('n1', { ...EVIDENCE_DAIF, rating: 'saduq', rating_confidence: 0.7 });
    const derived = l.getDerived('n1');
    assert.isFalse(derived.conflicting);
    assert.isBelow(derived.derived_confidence, 0.70);
  });

  it('analytical evidence contributes to derived', () => {
    const l = new ReliabilityLayer();
    l.addAnalytical('n1', EVIDENCE_ANALYTICAL);
    const derived = l.getDerived('n1');
    assert.isNotNull(derived);
    assert.equal(derived.sources_count, 1);
  });
});

describe('ReliabilityLayer — getAllEvidence', () => {
  it('returns all three layers', () => {
    const l = new ReliabilityLayer();
    l.addReported('n1', EVIDENCE_THIQ);
    l.addAnalytical('n1', EVIDENCE_ANALYTICAL);
    const all = l.getAllEvidence('n1');
    assert.equal(all.reported.length, 1);
    assert.equal(all.analytical.length, 1);
    assert.isNotNull(all.derived);
  });
});

describe('ReliabilityLayer — toBatch annotation', () => {
  it('attaches evidence to batch narrators', () => {
    const l = new ReliabilityLayer();
    l.addReported('narrator-a', EVIDENCE_THIQ);
    const { batch, annotatedCount } = l.toBatch(BASE_BATCH);
    const narratorA = batch.narrators.find(n => n.narrator_id === 'narrator-a');
    assert.equal(narratorA.reliability_evidence.length, 1);
    assert.equal(annotatedCount, 3);
  });

  it('attaches derived assessment as _derived_assessment', () => {
    const l = new ReliabilityLayer();
    l.addReported('narrator-a', EVIDENCE_THIQ);
    const { batch } = l.toBatch(BASE_BATCH);
    const narratorA = batch.narrators.find(n => n.narrator_id === 'narrator-a');
    assert.isNotNull(narratorA._derived_assessment);
    assert.equal(narratorA._derived_assessment.prior, 0.75);
  });

  it('does not mutate original batch', () => {
    const l = new ReliabilityLayer();
    l.addReported('narrator-a', EVIDENCE_THIQ);
    const original = JSON.stringify(BASE_BATCH.narrators[0].reliability_evidence);
    l.toBatch(BASE_BATCH);
    assert.equal(JSON.stringify(BASE_BATCH.narrators[0].reliability_evidence), original);
  });
});

describe('ReliabilityLayer — layer separation invariant', () => {
  it('reported and analytical evidence remain separate', () => {
    const l = new ReliabilityLayer();
    l.addReported('n1', EVIDENCE_THIQ);
    l.addAnalytical('n1', EVIDENCE_ANALYTICAL);
    const all = l.getAllEvidence('n1');
    assert.equal(all.reported.length, 1);
    assert.equal(all.analytical.length, 1);
    assert.notEqual(all.reported[0].evidence_id, all.analytical[0].evidence_id);
  });

  it('evidence from addReported has layer=reported', () => {
    const l = new ReliabilityLayer();
    l.addReported('n1', EVIDENCE_THIQ);
    assert.equal(l.getReported('n1')[0].date_layer, LAYER.REPORTED);
  });

  it('evidence from addAnalytical has layer=analytical', () => {
    const l = new ReliabilityLayer();
    l.addAnalytical('n1', EVIDENCE_ANALYTICAL);
    assert.equal(l.getAnalytical('n1')[0].date_layer, LAYER.ANALYTICAL);
  });
});
