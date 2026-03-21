/**
 * scripts/explainability.js
 *
 * Phase 4 — Explainability Panel Data Model
 *
 * Produces structured ExplainabilityReport from a complete AnalysisResult
 * and ClaimEvidenceBinder validation result.
 *
 * The report is designed to be consumed by UI panels, export renderers,
 * and audit trails. It makes all analytical reasoning transparent and
 * auditable.
 *
 * Public API:
 *   ExplainabilityReport.fromAnalysisResult(result, batch, bindingResult) → ExplainabilityReport
 *   report.getPanelData() → PanelData  (for UI)
 *   report.getAuditTrail() → AuditEntry[]  (for exports)
 *   report.getUncertaintySection() → UncertaintySection  (for exports)
 *   report.canExport() → boolean
 *   report.toJSON() → object
 */
import { CLAIM_CATEGORY, UNCERTAINTY_STATUS, VIOLATION_LEVEL } from './evidence-binding.js';
import { FAMILY_STATUS, CANDIDATE_TYPE, OUTCOME } from './clpcl-analyzer.js';

export const UNCERTAINTY_REASON = Object.freeze({
  INSUFFICIENT_DATA: 'insufficient_data',
  UNVERIFIED_CLAIM: 'unverified_claim',
  EXCLUDED_CANDIDATE: 'excluded_candidate',
  MISSING_EVIDENCE: 'missing_evidence',
  CONTRADICTION_PRESENT: 'contradiction_present',
  BLOCKED_REPORT: 'blocked_report',
});

export const SUPPORT_TYPE = Object.freeze({
  STRUCTURAL: 'structural',
  RELIABILITY: 'reliability',
  MULTIPLE: 'multiple',
});

export class PanelData {
  constructor() {
    this.family_id = null;
    this.profile = null;
    this.family_status = null;
    this.candidates = [];
    this.uncertainty_candidates = [];
    this.excluded_claims = [];
    this.confidence_summary = { supported: 0, contested: 0, uncertain: 0, weak: 0 };
    this.conclusion_text = null;
    this.methodology_note = null;
  }
}

export class AuditEntry {
  constructor(type, subject, detail, evidence_refs = []) {
    this.type = type;
    this.subject = subject;
    this.detail = detail;
    this.evidence_refs = evidence_refs;
    this.timestamp = new Date().toISOString();
  }
}

export class UncertaintySection {
  constructor() {
    this.excluded_candidates = [];
    this.insufficient_data_families = [];
    this.unverified_evidence = [];
    this.blocking_violations = [];
    this.total_uncertain_count = 0;
  }
}

export class ExplainabilityReport {
  constructor(result, batch, bindingResult) {
    this._result = result;
    this._batch = batch;
    this._bindingResult = bindingResult;
    this._panelData = null;
    this._auditTrail = null;
    this._uncertaintySection = null;
  }

  static fromAnalysisResult(result, batch, bindingResult) {
    return new ExplainabilityReport(result, batch, bindingResult);
  }

  _classifyEvidenceSupport(candidate, binding) {
    const refs = binding?.evidence_refs || [];
    if (refs.length === 0) return { type: SUPPORT_TYPE.STRUCTURAL, count: 0 };

    const hasReliability = refs.some(r => r.evidence_record?.rating);
    return {
      type: hasReliability ? SUPPORT_TYPE.RELIABILITY : SUPPORT_TYPE.STRUCTURAL,
      count: refs.length,
    };
  }

  _buildCandidatePanel(candidate, binding, rank) {
    const support = this._classifyEvidenceSupport(candidate, binding);

    return {
      rank,
      narrator_id: candidate.narrator_id,
      candidate_type: candidate.candidate_type,
      pcl_mode: candidate.pcl_mode || null,
      final_confidence: candidate.final_confidence,
      display_confidence: candidate.display_confidence_4dp,
      outcome: candidate.outcome,
      outcome_label: this._outcomeLabel(candidate.outcome),
      structural_score: candidate.structural_score,
      profile: candidate.profile,
      contradiction_cap_active: candidate.contradiction_cap_active,
      reliability_prior: candidate.reliability_prior,
      features: { ...candidate.features },
      subscores: { ...candidate.subscores },
      support: {
        type: support.type,
        evidence_count: support.count,
        has_complete_provenance: binding?.evidence_refs?.some(r => r.evidence_record?.source_ref) || false,
        evidence_ids: binding?.evidence_refs?.map(r => r.evidence_id) || [],
      },
      binding_valid: binding?.binding_valid || false,
      is_exempt: binding?.is_exempt || false,
      violations: binding?.violations || [],
      warnings: binding?.warnings || [],
    };
  }

  _outcomeLabel(outcome) {
    switch (outcome) {
      case OUTCOME.SUPPORTED: return 'Supported by Structure and Evidence';
      case OUTCOME.CONTESTED: return 'Contested — Conflicting Evidence Present';
      case OUTCOME.UNCERTAIN: return 'Uncertain — Insufficient Data';
      case OUTCOME.LIKELY_WEAK_IN_CONTEXT: return 'Likely Weak in Context';
      default: return 'Unknown Outcome';
    }
  }

  _buildConclusion(panelData) {
    const { supported, contested, uncertain, weak } = panelData.confidence_summary;

    if (panelData.family_status === FAMILY_STATUS.INSUFFICIENT_DATA) {
      return {
        summary: 'Insufficient data to determine CL/PCL candidates for this hadith family.',
        confidence_level: 'undetermined',
        recommendation: 'More isnad variants are needed to establish transmission patterns.',
      };
    }

    if (supported > 0) {
      return {
        summary: `${supported} candidate(s) classified as supported. CL/PCL structure is consistent with multiple independent transmission paths.`,
        confidence_level: 'supported',
        recommendation: 'Narrators at these positions warrant priority for further scholarly review.',
      };
    }

    if (contested > 0) {
      return {
        summary: `${contested} candidate(s) are contested due to contradictory reliability evidence.`,
        confidence_level: 'contested',
        recommendation: 'Resolve contradictory evidence before making definitive claims about transmission origins.',
      };
    }

    if (uncertain > 0) {
      return {
        summary: `${uncertain} candidate(s) have insufficient structural support to establish transmission patterns.`,
        confidence_level: 'uncertain',
        recommendation: 'More isnand variants needed to confirm or refute these candidates.',
      };
    }

    return {
      summary: 'Analysis completed but no strong candidates emerged.',
      confidence_level: 'weak',
      recommendation: 'Evidence base is too sparse for reliable CL/PCL determination.',
    };
  }

  getPanelData() {
    if (this._panelData) return this._panelData;

    const panel = new PanelData();
    const result = this._result;
    const binding = this._bindingResult;

    panel.family_id = result.analysis_snapshot?.features?.[0]?._family_id ||
      this._batch?.records?.[0]?.family_id || 'unknown';
    panel.profile = result.profile;
    panel.family_status = result.family_status;
    panel.methodology_note = result.methodology_note || 'CL/PCL analysis is an interpretation layer.';

    const bindingMap = new Map();
    if (binding?.bindings) {
      for (const b of binding.bindings) {
        bindingMap.set(b.claim_id, b);
      }
    }

    const candidates = result.candidates || [];
    const ranked = [...candidates].sort((a, b) =>
      b.final_confidence - a.final_confidence
    );

    let rank = 1;
    for (const c of ranked) {
      const b = bindingMap.get(c.narrator_id);
      if (c.outcome === UNCERTAINTY_STATUS.INSUFFICIENT_DATA ||
          c.outcome === UNCERTAINTY_STATUS.UNVERIFIED_CLAIM) {
        panel.uncertainty_candidates.push(this._buildCandidatePanel(c, b, null));
      } else {
        panel.candidates.push(this._buildCandidatePanel(c, b, rank++));
      }

      switch (c.outcome) {
        case OUTCOME.SUPPORTED: panel.confidence_summary.supported++; break;
        case OUTCOME.CONTESTED: panel.confidence_summary.contested++; break;
        case OUTCOME.UNCERTAIN: panel.confidence_summary.uncertain++; break;
        case OUTCOME.LIKELY_WEAK_IN_CONTEXT: panel.confidence_summary.weak++; break;
      }
    }

    panel.conclusion_text = this._buildConclusion(panel);

    this._panelData = panel;
    return this._panelData;
  }

  getAuditTrail() {
    if (this._auditTrail) return this._auditTrail;

    const trail = [];
    const result = this._result;
    const binding = this._bindingResult;

    trail.push(new AuditEntry(
      'ANALYSIS_START',
      'CL/PCL Analysis',
      `Analysis started with profile '${result.profile}' for family '${result.analysis_snapshot?.features?.[0]?._family_id || 'unknown'}'.`,
    ));

    trail.push(new AuditEntry(
      'FAMILY_STATUS',
      result.family_status,
      `Family status determined: ${result.family_status}. ${result.candidate_count} candidate(s) generated.`,
    ));

    const candidates = result.candidates || [];
    for (const c of candidates) {
      const evidenceIds = [];
      if (binding?.bindings) {
        const b = binding.bindings.find(b => b.claim_id === c.narrator_id);
        if (b) {
          for (const e of b.evidence_refs) {
            evidenceIds.push(e.evidence_id);
          }
        }
      }

      trail.push(new AuditEntry(
        'CANDIDATE_RANKED',
        c.narrator_id,
        `${c.candidate_type} candidate with final_confidence=${c.final_confidence}, outcome=${c.outcome}${c.contradiction_cap_active ? ' (contradiction_cap_active)' : ''}.`,
        evidenceIds,
      ));
    }

    if (binding?.warnings) {
      for (const w of binding.warnings) {
        trail.push(new AuditEntry(
          'EVIDENCE_WARNING',
          w.code,
          w.message,
        ));
      }
    }

    if (binding?.violations) {
      for (const v of binding.violations) {
        trail.push(new AuditEntry(
          'EVIDENCE_VIOLATION',
          v.code,
          `${v.level}: ${v.message}`,
        ));
      }
    }

    trail.push(new AuditEntry(
      'ANALYSIS_COMPLETE',
      'CL/PCL Analysis',
      `Analysis complete. Report can${binding?.analysis_can_proceed ? '' : 'not'} be exported.`,
    ));

    this._auditTrail = trail;
    return this._auditTrail;
  }

  getUncertaintySection() {
    if (this._uncertaintySection) return this._uncertaintySection;

    const section = new UncertaintySection();
    const result = this._result;
    const binding = this._bindingResult;

    if (result.family_status === FAMILY_STATUS.INSUFFICIENT_DATA) {
      section.insufficient_data_families.push({
        family_id: result.analysis_snapshot?.features?.[0]?._family_id || 'unknown',
        reason: 'No CL or PCL candidates met the minimum thresholds.',
        recommendation: 'Add more isnad variants or different source collections.',
      });
    }

    if (binding?.blocked_claims?.length > 0) {
      section.blocking_violations = binding.blocked_claims.map(claim_id => ({
        claim_id,
        reason: 'Mandatory evidence link missing or provenance incomplete.',
        recommendation: 'Provide valid reliability evidence with complete provenance before re-analyzing.',
      }));
    }

    const candidates = result.candidates || [];
    for (const c of candidates) {
      if (c.outcome === OUTCOME.UNCERTAIN ||
          c.outcome === UNCERTAINTY_STATUS.INSUFFICIENT_DATA ||
          c.outcome === UNCERTAINTY_STATUS.UNVERIFIED_CLAIM) {
        section.excluded_candidates.push({
          narrator_id: c.narrator_id,
          candidate_type: c.candidate_type,
          reason: c.outcome,
          detail: c.outcome === OUTCOME.UNCERTAIN
            ? 'Final confidence falls in uncertain band [0.35, 0.55).'
            : 'Insufficient data to determine candidate status.',
        });
      }
    }

    if (binding?.warnings) {
      const evidenceWarnings = binding.warnings.filter(w =>
        w.code === 'NO_EVIDENCE_STRUCTURAL' || w.code === 'EVIDENCE_MISSING_PROVENANCE'
      );
      for (const w of evidenceWarnings) {
        section.unverified_evidence.push({
          claim_id: w.detail?.narrator_id || 'unknown',
          reason: w.message,
        });
      }
    }

    section.total_uncertain_count =
      section.excluded_candidates.length +
      section.insufficient_data_families.length +
      section.blocking_violations.length +
      section.unverified_evidence.length;

    this._uncertaintySection = section;
    return this._uncertaintySection;
  }

  canExport() {
    return this._bindingResult?.analysis_can_proceed !== false;
  }

  getBlockingViolations() {
    return this._bindingResult?.violations?.filter(v => v.level === VIOLATION_LEVEL.BLOCKING) || [];
  }

  toJSON() {
    return {
      panel_data: this.getPanelData(),
      audit_trail: this.getAuditTrail().map(e => ({ ...e })),
      uncertainty_section: this.getUncertaintySection(),
      can_export: this.canExport(),
      blocking_violations: this.getBlockingViolations(),
      metadata: {
        generated_at: new Date().toISOString(),
        schema_version: 1,
        family_status: this._result?.family_status,
        candidate_count: this._result?.candidates?.length || 0,
      },
    };
  }
}
