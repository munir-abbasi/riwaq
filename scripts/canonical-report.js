/**
 * scripts/canonical-report.js
 *
 * Phase 5 — Canonical Report Builder
 *
 * Single canonical source of truth for all export formats (MD, DOCX, PDF).
 * Combines batch data, analysis results, explainability data, and artifact
 * bundles into one structured report object consumed by each exporter.
 *
 * Each exporter (MD / DOCX / PDF) transforms this canonical report without
 * modifying the underlying data — ensuring format consistency.
 *
 * Public API:
 *   CanonicalReport.fromBatch(batch, options?) → CanonicalReport
 *   report.getReportData() → CanonicalReportData
 *   report.toJSON() → object  (serializable report)
 */
import { emitArtifacts } from './artifacts.js';
import { ClaimEvidenceBinder } from './evidence-binding.js';
import { ExplainabilityReport } from './explainability.js';
import { analyzeBatch } from './clpcl-analyzer.js';

export const EXPORT_FORMAT = Object.freeze({
  MARKDOWN: 'markdown',
  DOCX: 'docx',
  PDF: 'pdf',
});

export const REPORT_SECTION = Object.freeze({
  HEADER: 'header',
  FAMILY_METADATA: 'family_metadata',
  METHODOLOGY: 'methodology',
  CANDIDATES: 'candidates',
  EVIDENCE_BINDING: 'evidence_binding',
  NARRATOR_GRAPH: 'narrator_graph',
  NORMALIZED_CHAINS: 'normalized_chains',
  UNCERTAINTY: 'uncertainty',
  FOOTER: 'footer',
});

export function buildReportData(batch, analysisResult, explainabilityResult, validationResult, artifacts) {
  const familyIds = [...new Set((batch.records || []).map(r => r.family_id))];

  const candidateRows = (analysisResult?.candidates || []).map(c => ({
    narrator_id: c.narrator_id,
    type: c.candidate_type,
    outcome: c.outcome,
    confidence: c.final_confidence,
    confidence_4dp: c.display_confidence_4dp,
    profile: c.profile,
    structural_score: c.structural_score,
    reliability_prior: c.reliability_prior,
    matn_coherence_basis: c.matn_coherence_basis,
    contradiction_cap: c.contradiction_cap_active || false,
    bundle_coverage: c.bundle_coverage,
    fan_out: c.fan_out,
    collector_diversity: c.collector_diversity,
    bypass_ratio: c.bypass_ratio,
    methodology_note: c.methodology_note,
    evidence_ids: c.evidence_ids || [],
  }));

  const evidenceBindings = validationResult
    ? validationResult.bindings.map(b => ({
        narrator_id: b.claim_id,
        category: b.claim_category,
        is_exempt: b.is_exempt,
        binding_valid: b.binding_valid,
        evidence_refs: b.evidence_refs.map(e => ({
          evidence_id: e.evidence_id,
          has_provenance: !!(e.evidence_record?.source_ref),
        })),
        violations: b.violations.map(v => ({
          level: v.level,
          code: v.code,
          message: v.message,
        })),
      }))
    : [];

  const familyMetadata = familyIds.map(fid => {
    const records = (batch.records || []).filter(r => r.family_id === fid);
    const sources = [...new Set(records.map(r => _formatProvenance(r.source_ref)).filter(s => s !== 'unknown:unknown'))];
    const variantCount = records.reduce((sum, r) => sum + (r.variants || []).length, 0);
    return {
      family_id: fid,
      record_count: records.length,
      variant_count: variantCount,
      sources,
      narrator_count: new Set((batch.narrators || []).map(n => n.narrator_id)).size,
    };
  });

  return {
    schema_version: 1,
    generated_at: new Date().toISOString(),
    batch_metadata: {
      imported_at: batch.imported_at,
      schema_version: batch.schema_version,
      family_count: familyIds.length,
    },
    family_metadata: familyMetadata,
    analysis: {
      family_status: analysisResult?.family_status || 'unknown',
      profile: analysisResult?.profile || 'unknown',
      candidate_count: candidateRows.length,
      methodology_note: analysisResult?.methodology_note || null,
    },
    candidates: candidateRows,
    evidence_binding: {
      valid: validationResult?.valid ?? true,
      analysis_can_proceed: validationResult?.analysis_can_proceed ?? true,
      binding_count: evidenceBindings.length,
      blocking_violations: (validationResult?.violations || []).filter(v => v.level === 'blocking').length,
      bindings: evidenceBindings,
    },
    artifacts: {
      chain_count: artifacts?.normalized_chains?.chain_count ?? 0,
      graph_nodes: artifacts?.narrator_graph?.node_count ?? 0,
      graph_edges: artifacts?.narrator_graph?.edge_count ?? 0,
    },
    uncertainty: explainabilityResult?.uncertainty_section || {
      excluded_candidates: [],
      insufficient_data_families: [],
      unverified_evidence: [],
      blocking_violations: [],
      total_uncertain_count: 0,
    },
    audit_trail: explainabilityResult?.audit_trail || [],
  };
}

function buildFamilyReportData(batch, familyId, analysisResult, explainabilityResult, validationResult, artifacts) {
  const familyBatch = {
    ...batch,
    records: (batch.records || []).filter(record => record.family_id === familyId),
  };
  const data = buildReportData(
    familyBatch,
    analysisResult,
    explainabilityResult,
    validationResult,
    artifacts
  );

  return {
    family_id: familyId,
    metadata: data.family_metadata[0] || null,
    analysis: data.analysis,
    candidates: data.candidates,
    evidence_binding: data.evidence_binding,
    artifacts: data.artifacts,
    uncertainty: data.uncertainty,
    audit_trail: data.audit_trail,
  };
}

export class CanonicalReport {
  /**
   * @param {object} batch
   * @param {object} options
   * @param {string} [options.profile='structural_only']
   * @param {object} [options.reliabilityLayer=null]
   */
  constructor(batch, options = {}) {
    this._batch = batch;
    this._profile = options.profile || 'structural_only';
    this._reliabilityLayer = options.reliabilityLayer || null;
    this._analysisResult = null;
    this._validationResult = null;
    this._explainabilityResult = null;
    this._artifacts = null;
    this._reportData = null;
  }

  static fromBatch(batch, options = {}) {
    const report = new CanonicalReport(batch, options);
    report._run();
    return report;
  }

  _run() {
    const familyIds = [...new Set((this._batch.records || []).map(r => r.family_id))];

    const analysisResults = {};
    const validationResults = {};
    const explainabilityResults = {};
    const artifactsPerFamily = {};

    for (const fid of familyIds) {
      const familyBatch = {
        ...this._batch,
        records: (this._batch.records || []).filter(r => r.family_id === fid),
      };

      analysisResults[fid] = analyzeBatch(familyBatch, this._profile, this._reliabilityLayer);

      const binder = ClaimEvidenceBinder.fromAnalysisResult(analysisResults[fid], familyBatch);
      validationResults[fid] = binder.validate();
      explainabilityResults[fid] = ExplainabilityReport.fromAnalysisResult(
        analysisResults[fid],
        familyBatch,
        validationResults[fid]
      );

      artifactsPerFamily[fid] = emitArtifacts(familyBatch, analysisResults[fid], fid);
    }

    this._analysisResults = analysisResults;
    this._validationResults = validationResults;
    this._explainabilityResults = explainabilityResults;
    this._artifacts = artifactsPerFamily;

    const primaryFamily = familyIds[0] || null;
    this._reportData = buildReportData(
      this._batch,
      analysisResults[primaryFamily],
      explainabilityResults[primaryFamily],
      validationResults[primaryFamily],
      artifactsPerFamily[primaryFamily]
    );
    this._reportData.family_ids = familyIds;
    this._reportData.families = familyIds.map(fid => buildFamilyReportData(
      this._batch,
      fid,
      analysisResults[fid],
      explainabilityResults[fid],
      validationResults[fid],
      artifactsPerFamily[fid]
    ));
    this._reportData.all_analysis = analysisResults;
    this._reportData.all_validation = validationResults;
    this._reportData.all_explainability = explainabilityResults;
    this._reportData.all_artifacts = artifactsPerFamily;
  }

  getReportData() {
    return this._reportData;
  }

  toJSON() {
    const data = this.getReportData();
    return {
      ...data,
      all_analysis: undefined,
      all_validation: undefined,
      all_explainability: undefined,
      all_artifacts: undefined,
    };
  }

  getArtifacts(familyId) {
    return this._artifacts?.[familyId] || null;
  }

  getAnalysisResult(familyId) {
    return this._analysisResults?.[familyId] || null;
  }

  getValidationResult(familyId) {
    return this._validationResults?.[familyId] || null;
  }

  getFamilyIds() {
    return this._reportData?.family_ids || [];
  }

  canExport() {
    return Object.values(this._validationResults || {}).every(
      v => v === null || v.analysis_can_proceed !== false
    );
  }
}

function _formatProvenance(sourceRef) {
  if (!sourceRef) return 'unknown:unknown';
  const coll = sourceRef.collection || 'unknown';
  const loc = sourceRef.source_locator || 'unknown';
  return `${coll}:${loc}`;
}
