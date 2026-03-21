/**
 * scripts/anti-hallucination.js
 *
 * Phase 4 — Anti-Hallucination Enforcement
 *
 * Validates batch data to prevent:
 *   1. Unknown narrator IDs in isnad chains
 *   2. Missing required provenance on imported records
 *   3. Synthetic/fabricated evidence references
 *   4. Unverifiable source references
 *
 * This module operates on raw batch data BEFORE analysis, complementing
 * ClaimEvidenceBinder which validates post-analysis claim-evidence bindings.
 *
 * Public API:
 *   AntiHallucinationValidator.fromBatch(batch) → AntiHallucinationValidator
 *   validator.validate() → ValidationResult
 *   validator.getUnknownNarratorIds() → string[]
 *   validator.getMissingProvenanceRecords() → object[]
 *   validator.getSyntheticEvidence() → object[]
 *   validator.canProceed() → boolean
 */
import { VIOLATION_LEVEL } from './evidence-binding.js';

export const AH_VIOLATION_CODE = Object.freeze({
  UNKNOWN_NARRATOR: 'UNKNOWN_NARRATOR_IN_CHAIN',
  MISSING_PROVENANCE: 'MISSING_REQUIRED_PROVENANCE',
  SYNTHETIC_EVIDENCE: 'SYNTHETIC_OR_FABRICATED_EVIDENCE',
  UNVERIFIABLE_SOURCE: 'UNVERIFIABLE_SOURCE_REFERENCE',
  ORPHAN_VARIANT: 'ORPHAN_VARIANT_NO_NARRATORS',
  EMPTY_CHAIN: 'EMPTY_ISNAD_CHAIN',
  INVALID_SOURCE_TYPE: 'INVALID_SOURCE_TYPE',
  DUPLICATE_EVIDENCE_ID: 'DUPLICATE_EVIDENCE_ID',
});

const SYNTHETIC_PATTERNS = [
  /^synthetic_/i, /^placeholder_/i, /^fake_/i, /^test_/i,
  /^dummy_/i, /^generated_/i, /^auto_/i, /^null$/i, /^undefined$/i,
  /^n\/a$/i, /^none$/i, /^unknown$/i, /^(?=.*fake|fabricat|forged)/i,
];

const VERIFIABLE_SOURCE_TYPES = new Set(['url', 'print', 'manuscript']);

function isSynthetic(value) {
  if (!value || typeof value !== 'string') return false;
  return SYNTHETIC_PATTERNS.some(p => p.test(value));
}

function hasCompleteProvenance(sourceRef) {
  if (!sourceRef || typeof sourceRef !== 'object') return false;
  return !!(
    sourceRef.collection &&
    sourceRef.source_type &&
    sourceRef.source_locator &&
    sourceRef.ingested_at
  );
}

function isVerifiableSource(sourceRef) {
  if (!sourceRef) return false;
  return VERIFIABLE_SOURCE_TYPES.has(sourceRef.source_type);
}

export class AntiHallucinationResult {
  constructor() {
    this.valid = true;
    this._can_proceed = true;
    this.violations = [];
    this.warnings = [];
    this.unknown_narrator_ids = [];
    this.missing_provenance_records = [];
    this.synthetic_evidence = [];
    this.unverifiable_sources = [];
    this._by_record = new Map();
  }

  _addViolation(level, code, message, instance_path, detail = null) {
    const v = { level, code, message, instance_path, detail };
    this.violations.push(v);
    if (level === VIOLATION_LEVEL.BLOCKING) {
      this.valid = false;
      this._can_proceed = false;
    }
  }

  _addWarning(code, message, instance_path, detail = null) {
    this.warnings.push({ code, message, instance_path, detail });
  }

  _setUnknownNarrator(record_id, variant_id, chain_idx, narrator_id) {
    this.unknown_narrator_ids.push({ record_id, variant_id, chain_idx, narrator_id });
  }

  _setMissingProvenance(record_id, variant_id, reason) {
    this.missing_provenance_records.push({ record_id, variant_id, reason });
  }

  _setSyntheticEvidence(record_id, evidence_id) {
    this.synthetic_evidence.push({ record_id, evidence_id });
  }

  _setUnverifiableSource(record_id, variant_id, source_locator) {
    this.unverifiable_sources.push({ record_id, variant_id, source_locator });
  }

  canProceed() {
    return this._can_proceed;
  }

  toReport() {
    return {
      valid: this.valid,
      can_proceed: this._can_proceed,
      violation_count: this.violations.filter(v => v.level === VIOLATION_LEVEL.BLOCKING).length,
      warning_count: this.warnings.length,
      summary: {
        unknown_narrator_count: this.unknown_narrator_ids.length,
        missing_provenance_count: this.missing_provenance_records.length,
        synthetic_evidence_count: this.synthetic_evidence.length,
        unverifiable_source_count: this.unverifiable_sources.length,
      },
      violations: this.violations,
      warnings: this.warnings,
    };
  }
}

export class AntiHallucinationValidator {
  constructor(batch) {
    this._batch = batch;
    this._result = null;
    this._declaredNarrators = new Set();
    this._seenEvidenceIds = new Set();
  }

  static fromBatch(batch) {
    return new AntiHallucinationValidator(batch);
  }

  validate() {
    const result = new AntiHallucinationResult();
    this._result = result;

    for (const narrator of this._batch.narrators || []) {
      if (narrator.narrator_id) {
        this._declaredNarrators.add(narrator.narrator_id);
      }
    }

    for (const record of this._batch.records || []) {
      const recordPath = `/records/${record.hadith_id}`;
      this._validateRecord(record, recordPath);
    }

    return result;
  }

  _validateRecord(record, recordPath) {
    const sourceRef = record.source_ref || {};

    const missingFields = [];
    if (!sourceRef.collection) missingFields.push('collection');
    if (!sourceRef.source_type) missingFields.push('source_type');
    if (!sourceRef.source_locator) missingFields.push('source_locator');
    if (!sourceRef.ingested_at) missingFields.push('ingested_at');

    if (missingFields.length > 0) {
      this._result._addViolation(
        VIOLATION_LEVEL.BLOCKING,
        AH_VIOLATION_CODE.MISSING_PROVENANCE,
        `Record '${record.hadith_id}' is missing required provenance fields: ${missingFields.join(', ')}.`,
        `${recordPath}/source_ref`,
        { hadith_id: record.hadith_id, missing_fields: missingFields }
      );
      this._result._setMissingProvenance(record.hadith_id, null, missingFields.join(', '));
    }

    if (sourceRef.source_type && !VERIFIABLE_SOURCE_TYPES.has(sourceRef.source_type)) {
      this._result._addViolation(
        VIOLATION_LEVEL.BLOCKING,
        AH_VIOLATION_CODE.INVALID_SOURCE_TYPE,
        `Record '${record.hadith_id}' has invalid source_type '${sourceRef.source_type}'.`,
        `${recordPath}/source_ref/source_type`,
        { hadith_id: record.hadith_id, source_type: sourceRef.source_type }
      );
    }

    if (sourceRef.source_locator && isSynthetic(sourceRef.source_locator)) {
      this._result._addViolation(
        VIOLATION_LEVEL.BLOCKING,
        AH_VIOLATION_CODE.SYNTHETIC_EVIDENCE,
        `Record '${record.hadith_id}' has synthetic source_locator.`,
        `${recordPath}/source_ref/source_locator`,
        { hadith_id: record.hadith_id, source_locator: sourceRef.source_locator }
      );
    }

    if (sourceRef.collection && isSynthetic(sourceRef.collection)) {
      this._result._addViolation(
        VIOLATION_LEVEL.BLOCKING,
        AH_VIOLATION_CODE.SYNTHETIC_EVIDENCE,
        `Record '${record.hadith_id}' has synthetic collection name.`,
        `${recordPath}/source_ref/collection`,
        { hadith_id: record.hadith_id, collection: sourceRef.collection }
      );
    }

    for (const variant of record.variants || []) {
      const variantPath = `${recordPath}/variants/${variant.variant_id}`;
      this._validateVariant(record, variant, variantPath);
    }

    for (const ev of record.reliability_evidence || []) {
      const evPath = `${recordPath}/reliability_evidence/${ev.evidence_id}`;
      this._validateEvidence(record.hadith_id, ev, evPath);
    }
  }

  _validateVariant(record, variant, variantPath) {
    const chain = variant.isnad_chain || [];

    if (chain.length === 0) {
      this._result._addViolation(
        VIOLATION_LEVEL.BLOCKING,
        AH_VIOLATION_CODE.EMPTY_CHAIN,
        `Variant '${variant.variant_id}' in record '${record.hadith_id}' has an empty isnad chain.`,
        `${variantPath}/isnad_chain`,
        { hadith_id: record.hadith_id, variant_id: variant.variant_id }
      );
      return;
    }

    for (let i = 0; i < chain.length; i++) {
      const nid = chain[i];
      if (!nid || typeof nid !== 'string' || nid.trim() === '') {
        this._result._addViolation(
          VIOLATION_LEVEL.BLOCKING,
          AH_VIOLATION_CODE.UNKNOWN_NARRATOR,
          `Empty or invalid narrator ID at index ${i} in variant '${variant.variant_id}'.`,
          `${variantPath}/isnad_chain/${i}`,
          { hadith_id: record.hadith_id, variant_id: variant.variant_id, index: i }
        );
        continue;
      }

      if (isSynthetic(nid)) {
        this._result._addViolation(
          VIOLATION_LEVEL.BLOCKING,
          AH_VIOLATION_CODE.SYNTHETIC_EVIDENCE,
          `Narrator ID '${nid}' at index ${i} matches synthetic pattern.`,
          `${variantPath}/isnad_chain/${i}`,
          { hadith_id: record.hadith_id, variant_id: variant.variant_id, narrator_id: nid }
        );
        continue;
      }

      const inDeclared = this._declaredNarrators.has(nid);

      if (!inDeclared) {
        this._result._addViolation(
          VIOLATION_LEVEL.BLOCKING,
          AH_VIOLATION_CODE.UNKNOWN_NARRATOR,
          `Narrator '${nid}' in isnad chain is not declared in narrators list and not referenced in any chain.`,
          `${variantPath}/isnad_chain/${i}`,
          { hadith_id: record.hadith_id, variant_id: variant.variant_id, narrator_id: nid }
        );
        this._result._setUnknownNarrator(record.hadith_id, variant.variant_id, i, nid);
      }
    }

    if (!hasCompleteProvenance(record.source_ref)) {
      this._result._setMissingProvenance(record.hadith_id, variant.variant_id, 'source_ref incomplete');
    }

    if (record.source_ref && !isVerifiableSource(record.source_ref)) {
      this._result._setUnverifiableSource(record.hadith_id, variant.variant_id, record.source_ref.source_locator);
    }
  }

  _validateEvidence(hadith_id, ev, evPath) {
    if (!ev.evidence_id) {
      this._result._addViolation(
        VIOLATION_LEVEL.BLOCKING,
        AH_VIOLATION_CODE.SYNTHETIC_EVIDENCE,
        `Evidence in record '${hadith_id}' is missing evidence_id.`,
        `${evPath}/evidence_id`,
        { hadith_id }
      );
      return;
    }

    if (this._seenEvidenceIds.has(ev.evidence_id)) {
      this._result._addViolation(
        VIOLATION_LEVEL.WARNING,
        AH_VIOLATION_CODE.DUPLICATE_EVIDENCE_ID,
        `Duplicate evidence_id '${ev.evidence_id}' detected.`,
        evPath,
        { hadith_id, evidence_id: ev.evidence_id }
      );
    }
    this._seenEvidenceIds.add(ev.evidence_id);

    if (isSynthetic(ev.evidence_id)) {
      this._result._addViolation(
        VIOLATION_LEVEL.BLOCKING,
        AH_VIOLATION_CODE.SYNTHETIC_EVIDENCE,
        `Evidence ID '${ev.evidence_id}' matches synthetic pattern.`,
        evPath,
        { hadith_id, evidence_id: ev.evidence_id }
      );
      this._result._setSyntheticEvidence(hadith_id, ev.evidence_id);
    }

    if (ev.citation_text && isSynthetic(ev.citation_text)) {
      this._result._addViolation(
        VIOLATION_LEVEL.BLOCKING,
        AH_VIOLATION_CODE.SYNTHETIC_EVIDENCE,
        `Citation text for '${ev.evidence_id}' contains synthetic content.`,
        `${evPath}/citation_text`,
        { hadith_id, evidence_id: ev.evidence_id }
      );
    }

    if (ev.scholar && isSynthetic(ev.scholar)) {
      this._result._addViolation(
        VIOLATION_LEVEL.BLOCKING,
        AH_VIOLATION_CODE.SYNTHETIC_EVIDENCE,
        `Scholar name '${ev.scholar}' for '${ev.evidence_id}' is synthetic.`,
        `${evPath}/scholar`,
        { hadith_id, evidence_id: ev.evidence_id }
      );
    }

    if (ev.source_ref) {
      if (!hasCompleteProvenance(ev.source_ref)) {
        this._result._addViolation(
          VIOLATION_LEVEL.BLOCKING,
          AH_VIOLATION_CODE.MISSING_PROVENANCE,
          `Evidence '${ev.evidence_id}' is missing required provenance in source_ref.`,
          `${evPath}/source_ref`,
          { hadith_id, evidence_id: ev.evidence_id }
        );
      }

      if (ev.source_ref.source_locator && isSynthetic(ev.source_ref.source_locator)) {
        this._result._addViolation(
          VIOLATION_LEVEL.BLOCKING,
          AH_VIOLATION_CODE.SYNTHETIC_EVIDENCE,
          `Evidence '${ev.evidence_id}' has synthetic source_locator.`,
          `${evPath}/source_ref/source_locator`,
          { hadith_id, evidence_id: ev.evidence_id }
        );
      }
    } else {
      this._result._addViolation(
        VIOLATION_LEVEL.BLOCKING,
        AH_VIOLATION_CODE.MISSING_PROVENANCE,
        `Evidence '${ev.evidence_id}' has no source_ref at all.`,
        evPath,
        { hadith_id, evidence_id: ev.evidence_id }
      );
    }
  }

  getValidationResult() {
    if (!this._result) this.validate();
    return this._result;
  }

  canProceed() {
    if (!this._result) this.validate();
    return this._result.can_proceed();
  }

  getReport() {
    if (!this._result) this.validate();
    return this._result.toReport();
  }
}
