/**
 * tests/node/compatibility-adapter.test.js
 *
 * Phase 0 Gate 0: Verify legacy single-chain payloads migrate to v1
 * with zero data loss.
 */
import { describe, it, assert, beforeEach } from 'vitest';
import {
  detectVersion,
  migrateToV1,
  migrateToCurrent,
  MIGRATIONS,
} from '../../scripts/compatibility-adapter.js';
import {
  LEGACY_FIXTURE_SINGLE_CHAIN,
  LEGACY_FIXTURE_EMPTY,
} from '../fixtures/legacy-fixtures.js';

describe('detectVersion', () => {
  it('returns 0 for legacy payload with narrators array', () => {
    assert.equal(detectVersion({ narrators: [] }), 0);
  });

  it('returns 1 for v1 payload with _schema_version: 1', () => {
    assert.equal(detectVersion({ _schema_version: 1 }), 1);
  });

  it('returns null for null input', () => {
    assert.equal(detectVersion(null), null);
  });

  it('returns null for undefined', () => {
    assert.equal(detectVersion(undefined), null);
  });
});

describe('migrateToV1', () => {
  it('produces _schema_version: 1', () => {
    const result = migrateToV1(LEGACY_FIXTURE_SINGLE_CHAIN);
    assert.equal(result._schema_version, 1);
  });

  it('produces exactly one hadith family', () => {
    const result = migrateToV1(LEGACY_FIXTURE_SINGLE_CHAIN);
    assert.equal(result.hadith_families.length, 1);
  });

  it('produces exactly one variant in the family', () => {
    const result = migrateToV1(LEGACY_FIXTURE_SINGLE_CHAIN);
    assert.equal(result.hadith_families[0].variants.length, 1);
  });

  it('chain_order matches narrator index order', () => {
    const result = migrateToV1(LEGACY_FIXTURE_SINGLE_CHAIN);
    const chain = result.hadith_families[0].variants[0].isnad_chain;
    assert.equal(chain.length, 3);
    assert.ok(chain[chain.length - 1].startsWith('legacy:abu-malik-al-kinani'));
  });

  it('preserves all narrator names', () => {
    const result = migrateToV1(LEGACY_FIXTURE_SINGLE_CHAIN);
    const narrators = result.hadith_families[0].narrators;
    assert.equal(narrators[0].names[0], 'Ahmad ibn Hanbal');
    assert.equal(narrators[1].names[0], 'Abu Bakr al-Athram');
    assert.equal(narrators[2].names[0], 'Abu Malik al-Kinani');
  });

  it('preserves biographical notes', () => {
    const result = migrateToV1(LEGACY_FIXTURE_SINGLE_CHAIN);
    const notes = result.hadith_families[0].narrators[0].biographical_notes;
    assert.ok(notes.includes('Imam of the Hanbali'));
  });

  it('preserves birth/death dates', () => {
    const result = migrateToV1(LEGACY_FIXTURE_SINGLE_CHAIN);
    const narrator = result.hadith_families[0].narrators[0];
    assert.deepNestedInclude(narrator.birth, { year: 164, month: 12, day: 2, calendar: 'hijri' });
    assert.deepNestedInclude(narrator.death, { year: 241, month: 3, day: 11, calendar: 'hijri' });
  });

  it('preserves tags', () => {
    const result = migrateToV1(LEGACY_FIXTURE_SINGLE_CHAIN);
    const tags = result.hadith_families[0].narrators[0].tags;
    assert.include(tags, 'thiqah');
    assert.include(tags, 'imam');
  });

  it('sets _meta.migration block correctly', () => {
    const result = migrateToV1(LEGACY_FIXTURE_SINGLE_CHAIN);
    assert.equal(result._meta.from_version, 0);
    assert.ok(result._meta.migrated_at);
  });

  it('sets workspace.active_family_id', () => {
    const result = migrateToV1(LEGACY_FIXTURE_SINGLE_CHAIN);
    assert.equal(result.workspace.active_family_id, 'legacy-family-0');
  });

  it('handles empty narrators array', () => {
    const result = migrateToV1(LEGACY_FIXTURE_EMPTY);
    assert.equal(result._schema_version, 1);
    assert.equal(result.hadith_families[0].narrators.length, 0);
  });

  it('derives stable narrator IDs from index and name', () => {
    const result = migrateToV1(LEGACY_FIXTURE_SINGLE_CHAIN);
    const chain = result.hadith_families[0].variants[0].isnad_chain;
    assert.equal(chain[0], 'legacy:imam-ahmad-ibn-hanbal:i0');
    assert.equal(chain[1], 'legacy:abu-bakr-al-athram:i1');
  });

  it('throws for invalid payload', () => {
    assert.throws(() => migrateToV1(null));
    assert.throws(() => migrateToV1({}));
  });
});

describe('migrateToCurrent', () => {
  it('passes through v1 payload unchanged', () => {
    const v1 = { _schema_version: 1, hadith_families: [] };
    const result = migrateToCurrent(v1);
    assert.equal(result, v1);
  });

  it('migrates v0 to v1', () => {
    const result = migrateToCurrent(LEGACY_FIXTURE_SINGLE_CHAIN);
    assert.equal(result._schema_version, 1);
  });

  it('throws for unknown format', () => {
    assert.throws(() => migrateToCurrent({ foo: 'bar' }));
  });
});

describe('MIGRATIONS registry', () => {
  it('has a v0 migrator', () => {
    assert.isFunction(MIGRATIONS.get(0));
  });
});
