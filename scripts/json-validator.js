/**
 * scripts/json-validator.js
 *
 * Phase 1 — JSON Import Validator
 *
 * Validates an import batch against the canonical schema and emits
 * item-level errors with JSON Pointer paths.
 *
 * Schema is a monolithic document with inlined $defs to avoid
 * cross-file URL reference resolution issues.
 *
 * Public API:
 *   validateBatch(rawJson) → { valid: boolean, collector: ImportErrorCollector, normalized: object|null }
 *   normalizeBatch(batch) → canonical normalized batch
 */
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { ImportErrorCollector, ERROR_CODE } from './import-errors.js';

const SCHEMA_VERSION = 1;
const ID_PATTERN = '^[a-zA-Z0-9_-]+$';

const SCHEMA = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'ImportBatch',
  type: 'object',
  required: ['schema_version', 'imported_at', 'records'],
  properties: {
    schema_version: { type: 'integer', const: SCHEMA_VERSION },
    imported_at: { type: 'string', format: 'date-time' },
    import_id: { type: ['string', 'null'], maxLength: 64 },
    source_batch_ref: { type: ['string', 'null'], maxLength: 512 },
    records: {
      type: 'array',
      minItems: 1,
      items: { $ref: '#/$defs/HadithRecord' },
    },
    narrators: {
      type: 'array',
      items: { $ref: '#/$defs/NarratorProfile' },
      default: [],
    },
  },
  $defs: {
    NarratorIdentifier: {
      type: 'string',
      pattern: ID_PATTERN,
      minLength: 1,
      maxLength: 128,
    },
    SourceRef: {
      type: 'object',
      required: ['collection', 'source_type', 'source_locator', 'ingested_at'],
      properties: {
        collection: { type: 'string', minLength: 1, maxLength: 256 },
        source_type: { type: 'string', enum: ['url', 'print', 'manuscript', 'oral_report'] },
        source_locator: { type: 'string', minLength: 1, maxLength: 512 },
        ingested_at: { type: 'string', format: 'date-time' },
        parser_version: { type: ['string', 'null'] },
        checksum: { type: ['string', 'null'] },
      },
    },
    ReliabilityEvidence: {
      type: 'object',
      required: ['evidence_id', 'narrator_id', 'rating', 'source_type', 'source_ref', 'ingested_at'],
      properties: {
        evidence_id: { $ref: '#/$defs/NarratorIdentifier' },
        narrator_id: { $ref: '#/$defs/NarratorIdentifier' },
        rating: { type: 'string', enum: ['thiqah', 'saduq', 'majhul', 'daif', 'matruk', 'accused_fabrication'] },
        rating_confidence: { type: 'number', minimum: 0, maximum: 1 },
        scholar: { type: ['string', 'null'], maxLength: 256 },
        work: { type: ['string', 'null'], maxLength: 256 },
        citation_text: { type: ['string', 'null'], maxLength: 1024 },
        citation_span: { type: ['string', 'null'] },
        dissent_notes: { type: ['string', 'null'], maxLength: 512 },
        date_layer: { type: ['string', 'null'], enum: ['reported', 'analytical', 'derived', null] },
        source_type: { type: 'string', enum: ['url', 'print', 'manuscript', 'oral_report'] },
        source_ref: { $ref: '#/$defs/SourceRef' },
        ingested_at: { type: 'string', format: 'date-time' },
      },
    },
    IsnadVariant: {
      type: 'object',
      required: ['variant_id', 'isnad_chain'],
      properties: {
        variant_id: { $ref: '#/$defs/NarratorIdentifier' },
        isnad_chain: { type: 'array', minItems: 1, items: { $ref: '#/$defs/NarratorIdentifier' } },
        isnad_raw: { type: ['string', 'null'] },
        matn_raw: { type: ['string', 'null'] },
        collector_note: { type: ['string', 'null'] },
        provenance: {
          type: ['object', 'null'],
          properties: {
            manuscript_source: { type: ['string', 'null'] },
            printed_edition: { type: ['string', 'null'] },
            transmission_path: { type: ['string', 'null'] },
          },
        },
      },
    },
    HadithRecord: {
      type: 'object',
      required: ['hadith_id', 'family_id', 'source_ref', 'variants'],
      properties: {
        hadith_id: { $ref: '#/$defs/NarratorIdentifier' },
        family_id: { $ref: '#/$defs/NarratorIdentifier' },
        title: { type: ['string', 'null'] },
        source_ref: { $ref: '#/$defs/SourceRef' },
        variants: { type: 'array', minItems: 1, items: { $ref: '#/$defs/IsnadVariant' } },
        matn_raw: { type: ['string', 'null'] },
        reliability_evidence: { type: 'array', items: { $ref: '#/$defs/ReliabilityEvidence' }, default: [] },
      },
    },
    NarratorProfile: {
      type: 'object',
      required: ['narrator_id', 'names'],
      properties: {
        narrator_id: { $ref: '#/$defs/NarratorIdentifier' },
        names: { type: 'array', minItems: 1, items: { type: 'string', minLength: 1, maxLength: 256 } },
        kunya: { type: ['string', 'null'], maxLength: 128 },
        layla: { type: ['string', 'null'], maxLength: 128 },
        birth: {
          type: ['object', 'null'],
          properties: {
            jdn: { type: ['integer', 'null'] },
            year: { type: ['integer', 'null'] },
            month: { type: ['integer', 'null'] },
            day: { type: ['integer', 'null'] },
            calendar: { type: 'string', enum: ['hijri', 'gregorian'] },
            description: { type: ['string', 'null'] },
            is_approximate: { type: 'boolean', default: false },
          },
        },
        death: {
          type: ['object', 'null'],
          properties: {
            jdn: { type: ['integer', 'null'] },
            year: { type: ['integer', 'null'] },
            month: { type: ['integer', 'null'] },
            day: { type: ['integer', 'null'] },
            calendar: { type: 'string', enum: ['hijri', 'gregorian'] },
            description: { type: ['string', 'null'] },
            is_approximate: { type: 'boolean', default: false },
          },
        },
        biographical_notes: { type: ['string', 'null'], maxLength: 4096 },
        locations: { type: 'array', items: { type: 'string', maxLength: 256 }, default: [] },
        tags: { type: 'array', items: { type: 'string', maxLength: 128 }, default: [] },
        aliases: { type: 'array', items: { type: 'string', maxLength: 256 }, default: [] },
        reliability_evidence: { type: 'array', items: { $ref: '#/$defs/ReliabilityEvidence' }, default: [] },
      },
    },
  },
};

const ajv = new Ajv({ allErrors: true, verbose: true, strict: false, validateFormats: true });
addFormats(ajv);

let _validate = null;
function getValidator() {
  if (!_validate) _validate = ajv.compile(SCHEMA);
  return _validate;
}

function schemaErrorToCollector(ajvErrors, itemIndex = null) {
  const collector = new ImportErrorCollector();
  for (const err of (ajvErrors || [])) {
    const instancePath = err.instancePath || '/';
    const normalizedPath = instancePath.replace(/^\//, '').split('/').filter(Boolean);

    let code = ERROR_CODE.SCHEMA_VIOLATION;
    if (err.keyword === 'required') code = ERROR_CODE.MISSING_REQUIRED;
    else if (err.keyword === 'type') code = ERROR_CODE.INVALID_TYPE;
    else if (err.keyword === 'enum') code = ERROR_CODE.INVALID_ENUM;
    else if (err.keyword === 'format') code = ERROR_CODE.INVALID_FORMAT;
    else if (err.keyword === 'pattern') code = ERROR_CODE.INVALID_PATTERN;
    else if (err.keyword === 'minItems' || err.keyword === 'maxItems') code = ERROR_CODE.OUT_OF_RANGE;
    else if (err.keyword === 'const') code = ERROR_CODE.INVALID_ENUM;

    collector.error(code, err.message || `Schema violation at ${instancePath}`, normalizedPath, itemIndex);
  }
  return collector;
}

function validateBatchStructure(batch, collector) {
  if (batch.schema_version === undefined) {
    collector.error(ERROR_CODE.MISSING_REQUIRED, 'Missing required field: schema_version', ['schema_version'], null);
  } else if (typeof batch.schema_version !== 'number') {
    collector.error(ERROR_CODE.INVALID_TYPE, 'schema_version must be a number', ['schema_version'], null);
  } else if (batch.schema_version !== SCHEMA_VERSION) {
    collector.error(ERROR_CODE.SCHEMA_VERSION, `Unsupported schema_version: ${batch.schema_version}. Supported: ${SCHEMA_VERSION}`, ['schema_version'], null);
  }
  if (batch.imported_at === undefined) {
    collector.error(ERROR_CODE.MISSING_REQUIRED, 'Missing required field: imported_at', ['imported_at'], null);
  } else {
    const date = new Date(batch.imported_at);
    if (isNaN(date.getTime())) {
      collector.error(ERROR_CODE.INVALID_FORMAT, 'imported_at must be a valid ISO 8601 date-time', ['imported_at'], null);
    }
  }
  if (!Array.isArray(batch.records)) {
    collector.error(ERROR_CODE.MISSING_REQUIRED, 'Missing required field: records (must be array)', ['records'], null);
  } else if (batch.records.length === 0) {
    collector.error(ERROR_CODE.EMPTY_ARRAY, 'records array must have at least one item', ['records'], null);
  }
}

function validateRecordSourceRef(record, index, collector) {
  const field = (path) => ['records', String(index), ...path];
  if (!record.source_ref) {
    collector.error(ERROR_CODE.MISSING_REQUIRED, 'source_ref is required', field(['source_ref']), index);
    return;
  }
  const sr = record.source_ref;
  if (!sr.collection) collector.error(ERROR_CODE.MISSING_REQUIRED, 'source_ref.collection is required', field(['source_ref', 'collection']), index);
  if (!sr.source_type) collector.error(ERROR_CODE.MISSING_REQUIRED, 'source_ref.source_type is required', field(['source_ref', 'source_type']), index);
  else if (!['url', 'print', 'manuscript', 'oral_report'].includes(sr.source_type)) {
    collector.error(ERROR_CODE.INVALID_ENUM, `source_ref.source_type must be one of: url, print, manuscript, oral_report`, field(['source_ref', 'source_type']), index);
  }
  if (!sr.source_locator) collector.error(ERROR_CODE.MISSING_REQUIRED, 'source_ref.source_locator is required', field(['source_ref', 'source_locator']), index);
  if (!sr.ingested_at) {
    collector.error(ERROR_CODE.MISSING_REQUIRED, 'source_ref.ingested_at is required', field(['source_ref', 'ingested_at']), index);
  } else if (isNaN(new Date(sr.ingested_at).getTime())) {
    collector.error(ERROR_CODE.INVALID_FORMAT, 'source_ref.ingested_at must be a valid ISO 8601 date-time', field(['source_ref', 'ingested_at']), index);
  }
}

function validateRecordVariants(record, index, collector) {
  const field = (path) => ['records', String(index), ...path];
  if (!Array.isArray(record.variants) || record.variants.length === 0) {
    collector.error(ERROR_CODE.MISSING_REQUIRED, 'variants must be a non-empty array', field(['variants']), index);
    return;
  }
  const variantIds = new Set();
  for (let vi = 0; vi < record.variants.length; vi++) {
    const variant = record.variants[vi];
    const vid = variant.variant_id;
    if (variantIds.has(vid)) {
      collector.error(ERROR_CODE.DUPLICATE_ID, `Duplicate variant_id within record: "${vid}"`, field(['variants', String(vi), 'variant_id']), index);
    }
    variantIds.add(vid);
    if (!Array.isArray(variant.isnad_chain) || variant.isnad_chain.length === 0) {
      collector.error(ERROR_CODE.EMPTY_ARRAY, 'isnad_chain must be a non-empty array', field(['variants', String(vi), 'isnad_chain']), index);
    }
    if (variant.isnad_chain) {
      const chainIds = new Set();
      for (let ci = 0; ci < variant.isnad_chain.length; ci++) {
        const nid = variant.isnad_chain[ci];
        if (chainIds.has(nid)) {
          collector.error(ERROR_CODE.DUPLICATE_ID, `Duplicate narrator_id in isnad_chain: "${nid}"`, field(['variants', String(vi), 'isnad_chain', String(ci)]), index);
        }
        chainIds.add(nid);
      }
    }
  }
}

function validateNarratorReferences(records, narrators, collector) {
  const definedIds = new Set((narrators || []).map(n => n.narrator_id));
  for (let ri = 0; ri < records.length; ri++) {
    const record = records[ri];
    for (const variant of (record.variants || [])) {
      for (let ci = 0; ci < (variant.isnad_chain || []).length; ci++) {
        const nid = variant.isnad_chain[ci];
        if (!definedIds.has(nid)) {
          collector.warn(ERROR_CODE.UNRESOLVED_REF, `Narrator ID "${nid}" in isnad_chain is not defined in narrators array; add an explicit narrator profile when metadata is required`, ['records', String(ri), 'variants', variant.variant_id, 'isnad_chain', String(ci)], ri);
        }
      }
    }
  }
}

/**
 * Main entry point.
 * @param {string|object} rawJson
 * @returns {{ valid: boolean, collector: ImportErrorCollector, normalized: object|null }}
 */
export function validateBatch(rawJson) {
  const collector = new ImportErrorCollector();
  let batch;

  if (typeof rawJson === 'string') {
    try {
      batch = JSON.parse(rawJson);
    } catch (e) {
      collector.error(ERROR_CODE.MALFORMED_JSON, `Malformed JSON: ${e.message}`, [], null);
      return { valid: false, collector, normalized: null };
    }
  } else {
    batch = rawJson;
  }

  validateBatchStructure(batch, collector);
  if (collector.hasErrors) return { valid: false, collector, normalized: null };

  const validate = getValidator();
  const ajvValid = validate(batch);
  if (!ajvValid) {
    const sc = schemaErrorToCollector(validate.errors || []);
    collector.errors.push(...sc.errors);
    collector.warnings.push(...sc.warnings);
  }

  for (let i = 0; i < batch.records.length; i++) {
    validateRecordSourceRef(batch.records[i], i, collector);
    validateRecordVariants(batch.records[i], i, collector);
  }

  validateNarratorReferences(batch.records || [], batch.narrators || [], collector);

  const hadithIds = new Set();
  for (let ri = 0; ri < (batch.records || []).length; ri++) {
    const hid = batch.records[ri].hadith_id;
    if (hadithIds.has(hid)) {
      collector.error(ERROR_CODE.DUPLICATE_ID, `Duplicate hadith_id across records: "${hid}"`, ['records', String(ri), 'hadith_id'], ri);
    }
    hadithIds.add(hid);
  }

  return {
    valid: !collector.hasErrors,
    collector,
    normalized: collector.hasErrors ? null : normalizeBatch(batch),
  };
}

/**
 * Normalize a batch to canonical format.
 * @param {object} batch
 * @returns {object}
 */
export function normalizeBatch(batch) {
  return {
    schema_version: SCHEMA_VERSION,
    imported_at: batch.imported_at || new Date().toISOString(),
    import_id: batch.import_id || null,
    source_batch_ref: batch.source_batch_ref || null,
    records: (batch.records || []).map(r => ({
      hadith_id: r.hadith_id,
      family_id: r.family_id || r.hadith_id,
      title: r.title || null,
      source_ref: { ...r.source_ref },
      variants: (r.variants || []).map(v => ({
        variant_id: v.variant_id,
        isnad_chain: [...v.isnad_chain],
        isnad_raw: v.isnad_raw || null,
        matn_raw: v.matn_raw || null,
        collector_note: v.collector_note || null,
        provenance: v.provenance || null,
      })),
      matn_raw: r.matn_raw || null,
      reliability_evidence: (r.reliability_evidence || []).map(e => ({ ...e })),
    })),
    narrators: (batch.narrators || []).map(n => ({
      narrator_id: n.narrator_id,
      names: [...(n.names || [])],
      kunya: n.kunya || null,
      layla: n.layla || null,
      birth: n.birth || null,
      death: n.death || null,
      biographical_notes: n.biographical_notes || null,
      locations: [...(n.locations || [])],
      tags: [...(n.tags || [])],
      aliases: [...(n.aliases || [])],
      reliability_evidence: [...(n.reliability_evidence || [])],
    })),
  };
}

export { ImportErrorCollector, ERROR_CODE };
export default { validateBatch, normalizeBatch };
