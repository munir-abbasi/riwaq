/**
 * tests/node/entity-resolution.test.js
 *
 * Phase 2 Gate 2: Entity Resolution Tests
 */
import { describe, it, assert } from 'vitest';
import { EntityResolver, normalizeAlias, OPERATION_TYPE } from '../../scripts/entity-resolution.js';
import { BASE_BATCH, BATCH_WITH_AMBIGUOUS_NAMES, BATCH_PRE_MERGE } from '../fixtures/phase2/fixtures.js';

describe('normalizeAlias', () => {
  it('lowercases and trims', () => {
    assert.equal(normalizeAlias('  HISHAM ibn Urwah  '), 'hisham ibn urwah');
  });
  it('normalizes whitespace', () => {
    assert.equal(normalizeAlias('Abu Bakr  ibn   Ali'), 'abu bakr ibn ali');
  });
  it('normalizes whitespace and case', () => {
    assert.equal(normalizeAlias('  Abu Bakr  ibn  Ali  '), 'abu bakr ibn ali');
    assert.equal(normalizeAlias('Abu Bakr'), normalizeAlias('abu bakr'));
  });
});

describe('EntityResolver — registration and lookup', () => {
  it('registers a narrator and resolves its names', () => {
    const r = new EntityResolver();
    r.registerNarrator('n1', ['Hisham ibn Urwah'], ['Hisham al-Madani']);
    assert.equal(r.resolveName('Hisham ibn Urwah'), 'n1');
    assert.equal(r.resolveName('hisham ibn urwah'), 'n1');
    assert.equal(r.resolveName('Hisham al-Madani'), 'n1');
  });

  it('returns null for unresolved names', () => {
    const r = new EntityResolver();
    assert.isNull(r.resolveName('Unknown Narrator'));
  });

  it('seeds from batch', () => {
    const r = new EntityResolver();
    r.seedFromBatch(BASE_BATCH);
    assert.equal(r.resolveName('Narrator A'), 'narrator-a');
    assert.equal(r.resolveName('Abu A'), 'narrator-a');
  });

  it('seeds ambiguous names from batch — last registration wins', () => {
    const r = new EntityResolver();
    r.seedFromBatch(BATCH_WITH_AMBIGUOUS_NAMES);
    assert.equal(r.resolveName('Hisham al-Madani'), 'hisham-2');
    assert.equal(r.resolveName('hisham ibn urwah'), 'hisham-2');
  });

  it('idempotent registration is a no-op', () => {
    const r = new EntityResolver();
    r.registerNarrator('n1', ['Name 1']);
    r.registerNarrator('n1', ['Name 2']);
    assert.equal(r.resolveName('Name 1'), 'n1');
    assert.isNull(r.resolveName('Name 2'));
  });
});

describe('EntityResolver — alias management', () => {
  it('addAlias maps a new name', () => {
    const r = new EntityResolver();
    r.registerNarrator('n1', ['Original Name']);
    r.addAlias('Abu Original', 'n1');
    assert.equal(r.resolveName('Abu Original'), 'n1');
  });

  it('addAlias throws for unknown canonicalId', () => {
    const r = new EntityResolver();
    assert.throws(() => r.addAlias('alias', 'unknown-id'));
  });

  it('addAlias logs ALIAS_ADD operation', () => {
    const r = new EntityResolver();
    r.registerNarrator('n1', []);
    r.addAlias('alias-1', 'n1');
    const log = r.getLog();
    assert.equal(log.length, 1);
    assert.equal(log[0].type, OPERATION_TYPE.ALIAS_ADD);
  });
});

describe('EntityResolver — merge', () => {
  it('merge redirects source to target', () => {
    const r = new EntityResolver();
    r.registerNarrator('source', []);
    r.registerNarrator('target', []);
    r.merge('source', 'target');
    assert.equal(r.resolveId('source'), 'target');
    assert.equal(r.resolveId('target'), 'target');
  });

  it('merge marks source as retired', () => {
    const r = new EntityResolver();
    r.registerNarrator('s', []);
    r.registerNarrator('t', []);
    r.merge('s', 't');
    assert.isTrue(r.isRetired('s'));
    assert.isFalse(r.isRetired('t'));
  });

  it('merge throws for unknown IDs', () => {
    const r = new EntityResolver();
    r.registerNarrator('s', []);
    assert.throws(() => r.merge('s', 'unknown'));
    assert.throws(() => r.merge('unknown', 's'));
  });

  it('merge throws for self-merge', () => {
    const r = new EntityResolver();
    r.registerNarrator('s', []);
    assert.throws(() => r.merge('s', 's'));
  });

  it('merge throws for already-retired source', () => {
    const r = new EntityResolver();
    r.registerNarrator('a', []);
    r.registerNarrator('b', []);
    r.registerNarrator('c', []);
    r.merge('a', 'b');
    assert.throws(() => r.merge('a', 'c'));
  });

  it('merge returns operation record with evidence redistributed', () => {
    const r = new EntityResolver();
    r.registerNarrator('s', []);
    r.registerNarrator('t', []);
    const evMap = new Map([['s', [{ evidence_id: 'ev1', narrator_id: 's', rating: 'thiqah' }]]]);
    const op = r.merge('s', 't', evMap);
    assert.equal(op.type, OPERATION_TYPE.MERGE);
    assert.equal(op.payload.source_id, 's');
    assert.equal(op.payload.target_id, 't');
    assert.equal(op.evidence_redistributed.length, 1);
    assert.equal(op.evidence_redistributed[0].narrator_id, 't');
    assert.equal(op.evidence_redistributed[0].merged_from, 's');
  });

  it('merge throws when targeting a retired ID', () => {
    const r = new EntityResolver();
    r.registerNarrator('a', []);
    r.registerNarrator('b', []);
    r.registerNarrator('c', []);
    r.merge('a', 'b');
    assert.throws(() => r.merge('c', 'a'));
  });
});

describe('EntityResolver — split', () => {
  it('split creates two new canonical IDs', () => {
    const r = new EntityResolver();
    r.registerNarrator('shared', []);
    const op = r.split('shared', 'new-a', 'new-b', [], []);
    assert.equal(op.type, OPERATION_TYPE.SPLIT);
    assert.equal(r.resolveId('new-a'), 'new-a');
    assert.equal(r.resolveId('new-b'), 'new-b');
  });

  it('split retires the source', () => {
    const r = new EntityResolver();
    r.registerNarrator('s', []);
    r.split('s', 'a', 'b', [], []);
    assert.isTrue(r.isRetired('s'));
    assert.isFalse(r.isRetired('a'));
    assert.isFalse(r.isRetired('b'));
  });

  it('split throws for duplicate targets', () => {
    const r = new EntityResolver();
    r.registerNarrator('s', []);
    assert.throws(() => r.split('s', 'a', 'a', [], []));
  });

  it('split returns evidence redistribution records', () => {
    const r = new EntityResolver();
    r.registerNarrator('s', []);
    const evA = [{ evidence_id: 'ev1', narrator_id: 's', rating: 'thiqah' }];
    const evB = [{ evidence_id: 'ev2', narrator_id: 's', rating: 'daif' }];
    const op = r.split('s', 'a', 'b', evA, evB);
    assert.equal(op.evidence_to_a.length, 1);
    assert.equal(op.evidence_to_b.length, 1);
    assert.equal(op.evidence_to_a[0].narrator_id, 'a');
    assert.equal(op.evidence_to_b[0].narrator_id, 'b');
  });
});

describe('EntityResolver — remapBatch', () => {
  it('remaps narrator IDs in isnad_chain', () => {
    const r = new EntityResolver();
    r.registerNarrator('narr-x', []);
    r.registerNarrator('narr-y', []);
    r.merge('narr-x', 'narr-y');
    const { batch } = r.remapBatch(BASE_BATCH);
    const chain = batch.records[0].variants[0].isnad_chain;
    assert.equal(chain[0], 'narrator-a');
    assert.equal(chain[1], 'narrator-b');
    assert.equal(chain[2], 'narrator-c');
  });

  it('returns remappedCount', () => {
    const r = new EntityResolver();
    r.registerNarrator('narr-x', []);
    r.registerNarrator('narr-y', []);
    r.merge('narr-x', 'narr-y');
    const { remappedCount } = r.remapBatch(BASE_BATCH);
    assert.equal(remappedCount, 0);
  });

  it('does not mutate original batch', () => {
    const r = new EntityResolver();
    r.seedFromBatch(BASE_BATCH);
    const original = JSON.stringify(BASE_BATCH);
    r.remapBatch(BASE_BATCH);
    assert.equal(JSON.stringify(BASE_BATCH), original);
  });
});

describe('EntityResolver — log replay', () => {
  it('reconstructs state from log', () => {
    const r1 = new EntityResolver();
    r1.registerNarrator('s', []);
    r1.registerNarrator('t', []);
    r1.merge('s', 't');
    const log = r1.getLog();

    const r2 = EntityResolver.fromLog(log);
    assert.equal(r2.resolveId('s'), 't');
    assert.isTrue(r2.isRetired('s'));
  });

  it('log is append-only (operations accumulate)', () => {
    const r = new EntityResolver();
    r.registerNarrator('a', []);
    r.registerNarrator('b', []);
    r.addAlias('alias-a', 'a');
    r.merge('a', 'b');
    assert.equal(r.getLog().length, 2);
  });
});

describe('EntityResolver — durable operation receipts', () => {
  it('records replayable receipts for alias, merge, and split operations', () => {
    const r = new EntityResolver().seedFromBatch(BATCH_PRE_MERGE);
    const evidenceMap = new Map([
      ['narr-x', [{ evidence_id: 'ev-x', narrator_id: 'narr-x', rating: 'thiqah' }]],
      ['narr-z', [
        { evidence_id: 'ev-z-a', narrator_id: 'narr-z', split_target: 'narr-z-a' },
        { evidence_id: 'ev-z-b', narrator_id: 'narr-z', split_target: 'narr-z-b' },
      ]],
    ]);

    r.addAlias('Narrator Y Alias', 'narr-y');
    r.merge('narr-x', 'narr-y', evidenceMap);
    r.split('narr-z', 'narr-z-a', 'narr-z-b', evidenceMap.get('narr-z').slice(0, 1), evidenceMap.get('narr-z').slice(1));

    const log = r.getLog();
    assert.deepEqual(log.map(op => op.type), [OPERATION_TYPE.ALIAS_ADD, OPERATION_TYPE.MERGE, OPERATION_TYPE.SPLIT]);
    assert.deepEqual(log.map(op => op.receipt.state_refs), [
      { before: 'entity-resolution-log:0', after: 'entity-resolution-log:1' },
      { before: 'entity-resolution-log:1', after: 'entity-resolution-log:2' },
      { before: 'entity-resolution-log:2', after: 'entity-resolution-log:3' },
    ]);
    assert.ok(log.every(op => op.receipt.verification.status === 'passed'));
    assert.ok(log.every(op => op.receipt.invariant_checks.every(check => check.passed)));
    assert.deepEqual(log[1].receipt.provenance.movements, [
      { evidence_id: 'ev-x', from_id: 'narr-x', to_id: 'narr-y' },
    ]);
    assert.deepEqual(log[2].receipt.provenance.movements, [
      { evidence_id: 'ev-z-a', from_id: 'narr-z', to_id: 'narr-z-a' },
      { evidence_id: 'ev-z-b', from_id: 'narr-z', to_id: 'narr-z-b' },
    ]);

    const replayed = EntityResolver.fromLog(log, evidenceMap);
    assert.deepEqual(replayed.getLog(), log);
    assert.equal(replayed.resolveId('narr-x'), 'narr-y');
    assert.isTrue(replayed.isRetired('narr-z'));
  });

  it('does not expose mutable references to stored receipts', () => {
    const r = new EntityResolver();
    r.registerNarrator('source', []);
    r.registerNarrator('target', []);
    const operation = r.merge('source', 'target');
    operation.receipt.affected_ids.push('tampered-return');
    const externalLog = r.getLog();
    externalLog[0].receipt.affected_ids.push('tampered-log');

    assert.deepEqual(r.getLog()[0].receipt.affected_ids, ['source', 'target']);
  });
});
