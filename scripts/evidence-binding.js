/**
 * scripts/evidence-binding.js
 *
 * Phase 4 — Claim-Evidence Binding
 *
 * Enforces that every analytical claim in an AnalysisResult is traceable to
 * at least one valid ReliabilityEvidence record in the batch.
 *
 * The binding model:
 *   - Each CL/PCL candidate claim must cite at least one evidence_id.
 *   - Each cited evidence_id must exist in canonical narrator-level evidence or
 *     the backward-compatible record-level evidence location.
 *   - Evidence binding is computed post-analysis and stored in the ExplainabilityReport.
 *
 * Anti-hallucination rules enforced:
 *   1. Every candidate narrator_id must appear in the batch narrator list.
 *   2. Every evidence reference must have valid provenance (source_ref with all required fields).
 *   3. Synthetic/placeholder evidence IDs are blocked.
 *   4. Unknown narrator IDs in analytical claims are flagged.
 *
 * Public API:
 *   ClaimEvidenceBinder.fromAnalysisResult(result, batch) → ClaimEvidenceBinder
 *   binder.getBindings() → ClaimEvidenceBinding[]
 *   binder.validate() → ValidationResult { valid, violations, warnings }
 *   binder.isExempt(claim) → boolean  (insufficient_data / unverified_claim are exempt)
 */
export const CLAIM_CATEGORY = Object.freeze({
  STRUCTURAL: 'structural_claim',
  RELIABILITY: 'reliability_claim',
  CONTRADICTION: 'contradiction_claim',
  OUTCOME: 'outcome_claim',
});

export const VIOLATION_LEVEL = Object.freeze({
  BLOCKING: 'blocking',
  WARNING: 'warning',
  INFO: 'info',
});

export const UNCERTAINTY_STATUS = Object.freeze({
  INSUFFICIENT_DATA: 'insufficient_data',
  UNVERIFIED_CLAIM: 'unverified_claim',
  EXCLUDED: 'excluded',
});

const SYNTHETIC_PATTERNS = [
  /^synthetic_/i,
  /^placeholder_/i,
  /^fake_/i,
  /^test_/i,
  /^dummy_/i,
  /^generated_/i,
  /^auto_/i,
];

export const EVIDENCE_PROJECTION_FIELDS = Object.freeze([
  'scholar',
  'work',
  'rating',
  'citation_text',
  'citation_span',
  'source_ref',
  'edition',
  'normalization_note',
  'curated_by',
  'revised_at',
  'revision_note',
]);

/**
 * Dereference an evidence record into a stable, export-safe subset.
 * Every field in EVIDENCE_PROJECTION_FIELDS is always present (null when
 * absent) so consumers see one predictable shape regardless of source.
 * Returns null when there is no underlying record (missing evidence).
 * Shared by ValidationResult.toReport() and CanonicalReport so both
 * evidence_refs projections stay byte-identical by construction.
 */
export function projectEvidenceRecord(evidenceRecord) {
  if (!evidenceRecord || typeof evidenceRecord !== 'object') return null;
  const projected = {};
  for (const field of EVIDENCE_PROJECTION_FIELDS) {
    projected[field] = evidenceRecord[field] ?? null;
  }
  if (projected.source_ref && typeof projected.source_ref === 'object') {
    projected.source_ref = { ...projected.source_ref };
  }
  return projected;
}

export class ClaimEvidenceBinding {
  constructor(claim) {
    this.claim = claim;
    this.claim_id = claim.narrator_id || claim.claim_id;
    this.claim_category = this._inferCategory(claim);
    this.evidence_refs = [];
    this.is_exempt = this._checkExempt(claim);
    this.binding_valid = false;
    this.violations = [];
    this.warnings = [];
  }

  _inferCategory(claim) {
    if (claim.reliability_prior !== null) return CLAIM_CATEGORY.RELIABILITY;
    if (claim.contradiction_cap_active) return CLAIM_CATEGORY.CONTRADICTION;
    if (claim.outcome) return CLAIM_CATEGORY.OUTCOME;
    return CLAIM_CATEGORY.STRUCTURAL;
  }

  _checkExempt(claim) {
    if (claim.family_status === UNCERTAINTY_STATUS.INSUFFICIENT_DATA) return true;
    if (claim.outcome === UNCERTAINTY_STATUS.INSUFFICIENT_DATA) return true;
    if (claim.outcome === UNCERTAINTY_STATUS.UNVERIFIED_CLAIM) return true;
    if (claim.candidate_type === undefined && !claim.structural_score) return true;
    return false;
  }

  addEvidenceRef(evidence_id, evidence_record) {
    this.evidence_refs.push({ evidence_id, evidence_record });
  }

  setBindingValid(valid) {
    this.binding_valid = valid;
  }

  addViolation(level, code, message, detail = null) {
    this.violations.push({ level, code, message, detail });
  }

  addWarning(code, message, detail = null) {
    this.warnings.push({ code, message, detail });
  }
}

export class ValidationResult {
  constructor() {
    this.valid = true;
    this.bindings = [];
    this.violations = [];
    this.warnings = [];
    this.blocked_claims = [];
    this.analysis_can_proceed = true;
  }

  addBinding(binding) {
    this.bindings.push(binding);
  }

  addViolation(level, code, message, detail = null) {
    this.violations.push({ level, code, message, detail, _binding: this.bindings.length });
    if (level === VIOLATION_LEVEL.BLOCKING) {
      this.valid = false;
      this.analysis_can_proceed = false;
    }
  }

  addWarning(code, message, detail = null) {
    this.warnings.push({ code, message, detail });
  }

  toReport() {
    return {
      valid: this.valid,
      analysis_can_proceed: this.analysis_can_proceed,
      binding_count: this.bindings.length,
      violation_count: this.violations.filter(v => v.level === VIOLATION_LEVEL.BLOCKING).length,
      warning_count: this.warnings.length,
      blocked_claims: this.bindings
        .filter(b => b.violations.some(v => v.level === VIOLATION_LEVEL.BLOCKING))
        .map(b => b.claim_id),
      violations: this.violations,
      warnings: this.warnings,
      bindings: this.bindings.map(b => ({
        claim_id: b.claim_id,
        claim_category: b.claim_category,
        is_exempt: b.is_exempt,
        binding_valid: b.binding_valid,
        evidence_refs: b.evidence_refs.map(e => ({
          evidence_id: e.evidence_id,
          has_provenance: !!(e.evidence_record?.source_ref),
          evidence: projectEvidenceRecord(e.evidence_record),
        })),
        violations: b.violations,
        warnings: b.warnings,
      })),
    };
  }
}

export class ClaimEvidenceBinder {
  constructor(result, batch) {
    this._result = result;
    this._batch = batch;
    this._evidenceMap = new Map();
    this._narratorIds = new Set();
    this._bindings = [];
    this._validationResult = null;

    this._buildEvidenceMap();
    this._buildNarratorSet();
  }

  static fromAnalysisResult(result, batch) {
    return new ClaimEvidenceBinder(result, batch);
  }

  _buildEvidenceMap() {
    for (const record of this._batch.records || []) {
      for (const ev of record.reliability_evidence || []) {
        this._evidenceMap.set(ev.evidence_id, ev);
      }
    }
    for (const narrator of this._batch.narrators || []) {
      for (const ev of narrator.reliability_evidence || []) {
        this._evidenceMap.set(ev.evidence_id, ev);
      }
    }
  }

  _buildNarratorSet() {
    for (const narrator of this._batch.narrators || []) {
      if (narrator.narrator_id) {
        this._narratorIds.add(narrator.narrator_id);
      }
    }
    for (const record of this._batch.records || []) {
      for (const variant of record.variants || []) {
        for (const nid of variant.isnad_chain || []) {
          this._narratorIds.add(nid);
        }
      }
    }
  }

  _hasProvenance(evidence) {
    const sr = evidence?.source_ref;
    return !!(
      sr?.collection &&
      sr?.source_type &&
      sr?.source_locator &&
      sr?.ingested_at
    );
  }

  _isSynthetic(evidence_id) {
    return SYNTHETIC_PATTERNS.some(p => p.test(evidence_id));
  }

  _checkNarratorId(nid) {
    return this._narratorIds.has(nid);
  }

  validate() {
    const result = new ValidationResult();
    this._validationResult = result;

    if (this._result.family_status === UNCERTAINTY_STATUS.INSUFFICIENT_DATA) {
      result.addWarning('FAMILY_INSUFFICIENT_DATA',
        'No CL/PCL candidates detected. Family status is insufficient_data. Analysis result is advisory only.');
      return result;
    }

    const candidates = this._result.candidates || [];

    for (const candidate of candidates) {
      const binding = new ClaimEvidenceBinding(candidate);

      if (binding.is_exempt) {
        binding.setBindingValid(true);
        binding.addWarning('CLAIM_EXEMPT',
          `${binding.claim_id} is exempt from evidence binding (${candidate.outcome || candidate.family_status}).`);
        result.addBinding(binding);
        continue;
      }

      const narratorId = candidate.narrator_id;

      if (!this._checkNarratorId(narratorId)) {
        binding.addViolation(VIOLATION_LEVEL.BLOCKING,
          'UNKNOWN_NARRATOR_ID',
          `Narrator '${narratorId}' referenced in CL/PCL claim is not present in batch narrators or isnad chains.`,
          { narrator_id: narratorId, claim_type: candidate.candidate_type });
        result.addBinding(binding);
        for (const v of binding.violations) {
          result.addViolation(v.level, v.code, v.message, v.detail);
        }
        continue;
      }

      const evidenceForNarrator = [...this._evidenceMap.values()]
        .filter(e => e.narrator_id === narratorId);

      if (candidate.profile === 'reliability_weighted' || candidate.reliability_prior !== null) {
        if (evidenceForNarrator.length === 0) {
          binding.addViolation(VIOLATION_LEVEL.BLOCKING,
            'MISSING_EVIDENCE_FOR_RELIABILITY_CLAIM',
            `Reliability-weighted claim for '${narratorId}' has no reliability evidence in batch.`,
            { narrator_id: narratorId, profile: candidate.profile });
          result.addBinding(binding);
          for (const v of binding.violations) {
            result.addViolation(v.level, v.code, v.message, v.detail);
          }
          continue;
        }

        let hasProvenance = false;
        for (const ev of evidenceForNarrator) {
          binding.addEvidenceRef(ev.evidence_id, ev);
          if (this._hasProvenance(ev)) {
            hasProvenance = true;
          }
          if (this._isSynthetic(ev.evidence_id)) {
            binding.addViolation(VIOLATION_LEVEL.BLOCKING,
              'SYNTHETIC_EVIDENCE_ID',
              `Evidence ID '${ev.evidence_id}' matches synthetic/placeholder pattern.`,
              { evidence_id: ev.evidence_id });
          }
        }

        if (!hasProvenance) {
          binding.addViolation(VIOLATION_LEVEL.BLOCKING,
            'EVIDENCE_MISSING_PROVENANCE',
            `No evidence for '${narratorId}' has complete provenance (collection, source_type, source_locator, ingested_at).`,
            { narrator_id: narratorId });
        } else {
          binding.setBindingValid(true);
        }
      } else {
        if (evidenceForNarrator.length === 0) {
          binding.addWarning('NO_EVIDENCE_STRUCTURAL',
            `Structural claim for '${narratorId}' has no reliability evidence. Claim is methodologically valid but unsupported by reliability data.`,
            { narrator_id: narratorId });
        } else {
          let hasProvenance = false;
          for (const ev of evidenceForNarrator) {
            binding.addEvidenceRef(ev.evidence_id, ev);
            if (this._hasProvenance(ev)) hasProvenance = true;
          }
          binding.setBindingValid(hasProvenance);
        }
      }

      result.addBinding(binding);

      for (const v of binding.violations) {
        result.addViolation(v.level, v.code, v.message, v.detail);
      }
    }

    return result;
  }

  getBindings() {
    if (!this._validationResult) this.validate();
    return this._validationResult.bindings;
  }

  getValidationResult() {
    if (!this._validationResult) this.validate();
    return this._validationResult;
  }

  canGenerateReport() {
    if (!this._validationResult) this.validate();
    return this._validationResult.analysis_can_proceed;
  }

  getReport() {
    if (!this._validationResult) this.validate();
    return this._validationResult.toReport();
  }
}
