/**
 * tests/node/json-validator.test.js
 *
 * Phase 1 Gate 1: JSON Import Validator Tests
 *
 * Tests cover:
 * - Valid batch acceptance
 * - Malformed JSON rejection
 * - Schema version enforcement
 * - Item-level error paths (JSON Pointer)
 * - Provenance mandatory enforcement
 * - Duplicate ID detection
 * - Edge cases: single narrator, multilingual, URL source, all ratings
 */
import { describe, it, assert } from 'vitest';
import { validateBatch, normalizeBatch } from '../../scripts/json-validator.js';
import { evaluateGates } from '../../scripts/preflight-gates.js';
import {
  VALID_BATCH,
  VALID_MULTI_VARIANT,
  MALFORMED_MISSING_VERSION,
  MALFORMED_WRONG_VERSION,
  MALFORMED_NOT_ARRAY,
  MALFORMED_EMPTY_RECORDS,
  MALFORMED_BAD_JSON,
  MALFORMED_MISSING_SOURCE_REF,
  MALFORMED_INVALID_SOURCE_TYPE,
  MALFORMED_EMPTY_CHAIN,
  MALFORMED_DUPLICATE_HADITH_ID,
  MALFORMED_INVALID_DATE,
  MALFORMED_ID_WITH_SPACES,
  PARTIAL_MINIMAL,
  MULTILINGUAL_NARRATORS,
  EDGE_CASE_SINGLE_NARRATOR,
  EDGE_CASE_URL_SOURCE,
  EDGE_CASE_ALL_RATINGS,
} from '../fixtures/phase1/fixtures.js';

describe('validateBatch — valid inputs', () => {
  it('accepts a fully valid batch', () => {
    const { valid, collector, normalized } = validateBatch(VALID_BATCH);
    assert.isFalse(collector.hasErrors, collector.errors.map(e => e.message).join(', '));
    assert.isTrue(valid);
    assert.isNotNull(normalized);
    assert.equal(normalized.schema_version, 1);
    assert.equal(normalized.records.length, 1);
  });

  it('accepts multi-variant batch', () => {
    const { valid, collector } = validateBatch(VALID_MULTI_VARIANT);
    assert.isFalse(collector.hasErrors);
    assert.isTrue(valid);
  });

  it('accepts string JSON input', () => {
    const { valid, collector } = validateBatch(JSON.stringify(VALID_BATCH));
    assert.isFalse(collector.hasErrors);
    assert.isTrue(valid);
  });

  it('accepts multilingual narrator names', () => {
    const { valid, collector } = validateBatch(MULTILINGUAL_NARRATORS);
    assert.isFalse(collector.hasErrors);
    assert.isTrue(valid);
  });

  it('accepts single-narrator chain', () => {
    const { valid, collector } = validateBatch(EDGE_CASE_SINGLE_NARRATOR);
    assert.isFalse(collector.hasErrors);
    assert.isTrue(valid);
  });

  it('accepts URL source type with checksum', () => {
    const { valid, collector } = validateBatch(EDGE_CASE_URL_SOURCE);
    assert.isFalse(collector.hasErrors);
    assert.isTrue(valid);
  });

  it('accepts all reliability rating types', () => {
    const { valid, collector } = validateBatch(EDGE_CASE_ALL_RATINGS);
    assert.isFalse(collector.hasErrors);
    assert.isTrue(valid);
  });

  it('normalizes a valid batch — preserves narrator IDs', () => {
    const { normalized } = validateBatch(VALID_BATCH);
    assert.isNotNull(normalized);
    assert.equal(normalized.records[0].variants[0].isnad_chain[0], 'narrator-x');
  });
});

describe('validateBatch — malformed JSON', () => {
  it('rejects non-JSON string', () => {
    const { valid, collector } = validateBatch(MALFORMED_BAD_JSON);
    assert.isTrue(collector.hasErrors);
    assert.isFalse(valid);
    assert.equal(collector.errors[0].code, 'MALFORMED_JSON');
  });
});

describe('validateBatch — schema version', () => {
  it('rejects missing schema_version', () => {
    const { valid, collector } = validateBatch(MALFORMED_MISSING_VERSION);
    assert.isTrue(collector.hasErrors);
    assert.isFalse(valid);
    assert.equal(collector.errors[0].code, 'MISSING_REQUIRED');
    assert.equal(collector.errors[0].instance_path, '/schema_version');
  });

  it('rejects unsupported schema_version', () => {
    const { valid, collector } = validateBatch(MALFORMED_WRONG_VERSION);
    assert.isTrue(collector.hasErrors);
    assert.isFalse(valid);
    const versionErr = collector.errors.find(e => e.code === 'SCHEMA_VERSION');
    assert.isOk(versionErr);
  });
});

describe('validateBatch — records array', () => {
  it('rejects non-array records', () => {
    const { valid, collector } = validateBatch(MALFORMED_NOT_ARRAY);
    assert.isTrue(collector.hasErrors);
    assert.isFalse(valid);
  });

  it('rejects empty records array', () => {
    const { valid, collector } = validateBatch(MALFORMED_EMPTY_RECORDS);
    assert.isTrue(collector.hasErrors);
    assert.isFalse(valid);
  });
});

describe('validateBatch — provenance enforcement', () => {
  it('rejects record without source_ref', () => {
    const { valid, collector } = validateBatch(MALFORMED_MISSING_SOURCE_REF);
    assert.isTrue(collector.hasErrors);
    const sourceRefErrs = collector.errors.filter(e => e.instance_path.includes('source_ref'));
    assert.isAbove(sourceRefErrs.length, 0);
  });

  it('rejects invalid source_type enum', () => {
    const { valid, collector } = validateBatch(MALFORMED_INVALID_SOURCE_TYPE);
    assert.isTrue(collector.hasErrors);
    const enumErr = collector.errors.find(e => e.code === 'INVALID_ENUM');
    assert.isOk(enumErr);
    assert.include(enumErr.instance_path, 'source_type');
  });

  it('rejects invalid ISO date-time', () => {
    const { valid, collector } = validateBatch(MALFORMED_INVALID_DATE);
    assert.isTrue(collector.hasErrors);
    const dateErr = collector.errors.find(e => e.code === 'INVALID_FORMAT');
    assert.isOk(dateErr);
  });
});

describe('validateBatch — isnad chain', () => {
  it('rejects empty isnad_chain', () => {
    const { valid, collector } = validateBatch(MALFORMED_EMPTY_CHAIN);
    assert.isTrue(collector.hasErrors);
    const emptyChainErr = collector.errors.find(e => e.code === 'EMPTY_ARRAY');
    assert.isOk(emptyChainErr);
  });
});

describe('validateBatch — duplicate IDs', () => {
  it('detects duplicate hadith_id across records', () => {
    const { valid, collector } = validateBatch(MALFORMED_DUPLICATE_HADITH_ID);
    assert.isTrue(collector.hasErrors);
    const dupErr = collector.errors.find(e => e.code === 'DUPLICATE_ID' && e.message.includes('same-id'));
    assert.isOk(dupErr);
  });
});

describe('validateBatch — ID pattern', () => {
  it('rejects ID with spaces', () => {
    const { valid, collector } = validateBatch(MALFORMED_ID_WITH_SPACES);
    assert.isTrue(collector.hasErrors);
    const patternErr = collector.errors.find(e => e.code === 'INVALID_PATTERN');
    assert.isOk(patternErr);
  });
});

describe('validateBatch — JSON Pointer paths', () => {
  it('uses item_index for record-level errors', () => {
    const { collector } = validateBatch(MALFORMED_MISSING_SOURCE_REF);
    const indexedErrs = collector.errors.filter(e => e.item_index !== null);
    assert.isAbove(indexedErrs.length, 0);
    assert.isAbove(indexedErrs[0].item_index, -1);
  });

  it('uses instance_path JSON Pointer format', () => {
    const { collector } = validateBatch(MALFORMED_MISSING_VERSION);
    assert.match(collector.errors[0].instance_path, /^\//);
  });
});

describe('validateBatch — narrators array', () => {
  it('warns on unresolved narrator IDs (auto-creatable)', () => {
    const { valid, collector } = validateBatch(PARTIAL_MINIMAL);
    assert.isFalse(collector.hasErrors);
    const warn = collector.warnings.find(e => e.code === 'UNRESOLVED_REF');
    assert.isOk(warn);
  });
});

describe('normalizeBatch', () => {
  it('produces schema_version 1', () => {
    const { normalized } = validateBatch(VALID_BATCH);
    assert.equal(normalized.schema_version, 1);
  });

  it('preserves all narrator names', () => {
    const { normalized } = validateBatch(VALID_BATCH);
    assert.equal(normalized.records[0].variants[0].isnad_chain.length, 3);
  });

  it('fills default empty arrays', () => {
    const { normalized } = validateBatch(PARTIAL_MINIMAL);
    assert.isArray(normalized.records[0].reliability_evidence);
  });
});

describe('evaluateGates', () => {
  it('passes a fully enriched batch', () => {
    const { valid } = validateBatch(VALID_BATCH);
    assert.isTrue(valid);
    const { passed, qualityScore } = evaluateGates(VALID_BATCH);
    assert.isTrue(passed);
    assert.isAbove(qualityScore, 50);
  });

  it('warns on partial/minimal batch', () => {
    const { valid } = validateBatch(PARTIAL_MINIMAL);
    assert.isTrue(valid);
    const { passed, qualityScore, gateResults } = evaluateGates(PARTIAL_MINIMAL);
    assert.isAbove(qualityScore, 0);
    assert.equal(gateResults.recordCount, 1);
  });

  it('assigns 0 provenance score for missing source_ref', () => {
    const { collector } = validateBatch(MALFORMED_MISSING_SOURCE_REF);
    const { gateResults } = evaluateGates(MALFORMED_MISSING_SOURCE_REF, collector);
    assert.equal(gateResults.provenanceScore, 0);
  });

  it('gateResults includes recordCount and narratorCount', () => {
    const { valid } = validateBatch(VALID_MULTI_VARIANT);
    assert.isTrue(valid);
    const { gateResults } = evaluateGates(VALID_MULTI_VARIANT);
    assert.equal(gateResults.recordCount, 1);
    assert.equal(gateResults.totalVariants, 3);
  });

  it('blocks duplicate hadith_ids across records', () => {
    const { valid, collector } = validateBatch(MALFORMED_DUPLICATE_HADITH_ID);
    assert.isFalse(valid);
    assert.isTrue(collector.hasErrors);
  });
});

describe('error report format', () => {
  it('toReport() includes error_count and warning_count', () => {
    const { collector } = validateBatch(MALFORMED_WRONG_VERSION);
    const report = collector.toReport();
    assert.isNumber(report.summary.error_count);
    assert.isNumber(report.summary.warning_count);
    assert.isArray(report.errors);
    assert.isArray(report.warnings);
  });

  it('each error has severity, code, message, instance_path, item_index', () => {
    const { collector } = validateBatch(MALFORMED_MISSING_VERSION);
    const report = collector.toReport();
    const err = report.errors[0];
    assert.isString(err.severity);
    assert.isString(err.code);
    assert.isString(err.message);
    assert.isString(err.instance_path);
    assert.isNull(err.item_index);
  });

  it('record-level errors have numeric item_index', () => {
    const { collector } = validateBatch(MALFORMED_EMPTY_CHAIN);
    const indexedErr = collector.errors.find(e => e.item_index !== null);
    assert.isOk(indexedErr);
    assert.isNumber(indexedErr.item_index);
  });
});
