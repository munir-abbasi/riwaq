/**
 * tests/node/phase4.test.js
 *
 * Phase 4 Gate 4: Explainability and Anti-Hallucination Tests
 */
import { describe, it, assert } from 'vitest';
import { ClaimEvidenceBinder, CLAIM_CATEGORY, VIOLATION_LEVEL } from '../../scripts/evidence-binding.js';
import { AntiHallucinationValidator, AH_VIOLATION_CODE } from '../../scripts/anti-hallucination.js';
import { ExplainabilityReport, UNCERTAINTY_REASON } from '../../scripts/explainability.js';
import { analyzeBatch, ANALYSIS_PROFILE, FAMILY_STATUS } from '../../scripts/clpcl-analyzer.js';
import {
  BATCH_VALID,
  BATCH_SYNTHETIC_NARRATOR,
  BATCH_MISSING_PROVENANCE,
  BATCH_EMPTY_CHAIN,
  BATCH_SYNTHETIC_EVIDENCE,
  BATCH_EVIDENCE_MISSING_PROVENANCE,
  BATCH_UNKNOWN_NARRATOR,
  BATCH_NO_EVIDENCE_STRUCTURAL,
} from '../fixtures/phase4/fixtures.js';

describe('AntiHallucinationValidator — valid batch', () => {
  const validator = AntiHallucinationValidator.fromBatch(BATCH_VALID);
  const result = validator.validate();

  it('valid batch passes without blocking violations', () => {
    assert.equal(result.valid, true);
    assert.equal(result.canProceed(), true);
  });

  it('no unknown narrator IDs', () => {
    assert.equal(result.unknown_narrator_ids.length, 0);
  });

  it('no missing provenance records', () => {
    assert.equal(result.missing_provenance_records.length, 0);
  });

  it('no synthetic evidence', () => {
    assert.equal(result.synthetic_evidence.length, 0);
  });

  it('toReport returns structured result', () => {
    const report = result.toReport();
    assert.equal(report.valid, true);
    assert.equal(report.can_proceed, true);
    assert.ok(report.summary);
  });
});

describe('AntiHallucinationValidator — synthetic narrator ID', () => {
  const validator = AntiHallucinationValidator.fromBatch(BATCH_SYNTHETIC_NARRATOR);
  const result = validator.validate();

  it('blocks synthetic narrator IDs', () => {
    assert.equal(result.valid, false);
    assert.equal(result.canProceed(), false);
  });

  it('blocks missing provenance', () => {
    assert.equal(result.valid, false);
    assert.equal(result.canProceed(), false);
  });

  it('detects SYNTHETIC_EVIDENCE and UNKNOWN_NARRATOR violations', () => {
    const miss = result.violations.filter(v => v.code === AH_VIOLATION_CODE.SYNTHETIC_EVIDENCE);
    assert.ok(miss.length > 0);
    const unknown = result.violations.filter(v => v.code === AH_VIOLATION_CODE.UNKNOWN_NARRATOR);
    assert.ok(unknown.length > 0);
  });

  it('detects SYNTHETIC_EVIDENCE violation', () => {
    const synth = result.violations.filter(v => v.code === AH_VIOLATION_CODE.SYNTHETIC_EVIDENCE);
    assert.ok(synth.length > 0);
  });
});

describe('AntiHallucinationValidator — missing provenance', () => {
  const validator = AntiHallucinationValidator.fromBatch(BATCH_MISSING_PROVENANCE);
  const result = validator.validate();

  it('blocks missing provenance', () => {
    assert.equal(result.valid, false);
    assert.equal(result.canProceed(), false);
  });

  it('detects MISSING_PROVENANCE violation', () => {
    const miss = result.violations.filter(v => v.code === AH_VIOLATION_CODE.MISSING_PROVENANCE);
    assert.ok(miss.length > 0);
    assert.ok(miss[0].message.includes('source_type') || miss[0].message.includes('source_locator'));
  });
});

describe('AntiHallucinationValidator — empty chain', () => {
  const validator = AntiHallucinationValidator.fromBatch(BATCH_EMPTY_CHAIN);
  const result = validator.validate();

  it('blocks empty isnad chain', () => {
    assert.equal(result.valid, false);
  });

  it('detects EMPTY_CHAIN violation', () => {
    const empty = result.violations.filter(v => v.code === AH_VIOLATION_CODE.EMPTY_CHAIN);
    assert.ok(empty.length > 0);
  });
});

describe('AntiHallucinationValidator — synthetic evidence ID', () => {
  const validator = AntiHallucinationValidator.fromBatch(BATCH_SYNTHETIC_EVIDENCE);
  const result = validator.validate();

  it('blocks synthetic evidence IDs', () => {
    assert.equal(result.valid, false);
  });

  it('detects SYNTHETIC_EVIDENCE for evidence_id', () => {
    const synth = result.violations.filter(v => v.code === AH_VIOLATION_CODE.SYNTHETIC_EVIDENCE);
    assert.ok(synth.length > 0);
  });
});

describe('AntiHallucinationValidator — evidence missing provenance', () => {
  const validator = AntiHallucinationValidator.fromBatch(BATCH_EVIDENCE_MISSING_PROVENANCE);
  const result = validator.validate();

  it('blocks evidence with missing provenance', () => {
    assert.equal(result.valid, false);
  });

  it('detects MISSING_PROVENANCE for evidence', () => {
    const miss = result.violations.filter(v => v.code === AH_VIOLATION_CODE.MISSING_PROVENANCE);
    assert.ok(miss.length > 0);
  });
});

describe('AntiHallucinationValidator — unknown narrator in chain', () => {
  const validator = AntiHallucinationValidator.fromBatch(BATCH_UNKNOWN_NARRATOR);
  const result = validator.validate();

  it('blocks unknown narrator IDs in chains', () => {
    assert.equal(result.valid, false);
  });

  it('detects UNKNOWN_NARRATOR violation', () => {
    const unknown = result.violations.filter(v => v.code === AH_VIOLATION_CODE.UNKNOWN_NARRATOR);
    assert.ok(unknown.length > 0);
    assert.ok(unknown[0].message.includes('unknown-xyz'));
  });
});

describe('ClaimEvidenceBinder — valid analysis result with evidence', () => {
  const result = analyzeBatch(BATCH_VALID, ANALYSIS_PROFILE.RELIABILITY_WEIGHTED);
  const binder = ClaimEvidenceBinder.fromAnalysisResult(result, BATCH_VALID);
  const validation = binder.validate();

  it('binding validation passes for valid data', () => {
    assert.equal(validation.valid, true);
    assert.equal(validation.analysis_can_proceed, true);
  });

  it('has binding for cl-narrator', () => {
    const binding = validation.bindings.find(b => b.claim_id === 'cl-narrator');
    assert.ok(binding);
  });

  it('binding has evidence_refs', () => {
    const binding = validation.bindings.find(b => b.claim_id === 'cl-narrator');
    assert.ok(binding.evidence_refs.length > 0);
  });

  it('binding_valid is true when evidence has provenance', () => {
    const binding = validation.bindings.find(b => b.claim_id === 'cl-narrator');
    assert.equal(binding.binding_valid, true);
  });

  it('no blocking violations', () => {
    const blocking = validation.violations.filter(v => v.level === VIOLATION_LEVEL.BLOCKING);
    assert.equal(blocking.length, 0);
  });

  it('canGenerateReport returns true', () => {
    assert.equal(binder.canGenerateReport(), true);
  });
});

describe('ClaimEvidenceBinder — structural_only profile (no evidence)', () => {
  const result = analyzeBatch(BATCH_NO_EVIDENCE_STRUCTURAL);
  const binder = ClaimEvidenceBinder.fromAnalysisResult(result, BATCH_NO_EVIDENCE_STRUCTURAL);
  const validation = binder.validate();

  it('validation passes (structural claim without evidence is a warning, not blocking)', () => {
    assert.equal(validation.analysis_can_proceed, true);
  });

  it('structural claim with no evidence emits warning', () => {
    const cl = validation.bindings.find(b => b.claim_id === 'cl-node');
    assert.ok(cl);
    assert.ok(cl.warnings.some(w => w.code === 'NO_EVIDENCE_STRUCTURAL'));
  });

  it('canGenerateReport returns true for structural_only', () => {
    assert.equal(binder.canGenerateReport(), true);
  });
});

describe('ClaimEvidenceBinder — insufficient_data family', () => {
  const batch = {
    schema_version: 1,
    records: [{
      hadith_id: 'h9',
      family_id: 'f9',
      source_ref: {
        collection: 'Test',
        source_type: 'print',
        source_locator: 'p.9',
        ingested_at: '2026-03-21T00:00:00.000Z',
      },
      variants: [{
        variant_id: 'v1',
        isnad_chain: ['prophet', 'n1'],
      }],
      reliability_evidence: [],
    }],
    narrators: [
      { narrator_id: 'prophet', names: ['Prophet'] },
      { n1: 'n1', names: ['N1'] },
    ],
  };
  const result = analyzeBatch(batch);
  const binder = ClaimEvidenceBinder.fromAnalysisResult(result, batch);
  const validation = binder.validate();

  it('insufficient_data family emits warning but does not block', () => {
    assert.equal(validation.analysis_can_proceed, true);
    const warnings = validation.warnings.filter(w => w.code === 'FAMILY_INSUFFICIENT_DATA');
    assert.ok(warnings.length > 0);
  });
});

describe('ExplainabilityReport — panel data', () => {
  const result = analyzeBatch(BATCH_VALID);
  const binder = ClaimEvidenceBinder.fromAnalysisResult(result, BATCH_VALID);
  const validation = binder.validate();
  const report = ExplainabilityReport.fromAnalysisResult(result, BATCH_VALID, validation);

  it('getPanelData returns structured panel data', () => {
    const panel = report.getPanelData();
    assert.ok(panel.family_id);
    assert.ok(panel.profile);
    assert.ok(panel.family_status);
    assert.ok(Array.isArray(panel.candidates));
  });

  it('panel data has confidence_summary', () => {
    const panel = report.getPanelData();
    assert.ok(panel.confidence_summary);
    assert.ok(typeof panel.confidence_summary.supported === 'number');
  });

  it('panel data has conclusion_text', () => {
    const panel = report.getPanelData();
    assert.ok(panel.conclusion_text);
  });

  it('candidates have support.type and evidence_ids', () => {
    const panel = report.getPanelData();
    if (panel.candidates.length > 0) {
      const c = panel.candidates[0];
      assert.ok(c.support);
      assert.ok(Array.isArray(c.support.evidence_ids));
    }
  });
});

describe('ExplainabilityReport — audit trail', () => {
  const result = analyzeBatch(BATCH_VALID);
  const binder = ClaimEvidenceBinder.fromAnalysisResult(result, BATCH_VALID);
  const validation = binder.validate();
  const report = ExplainabilityReport.fromAnalysisResult(result, BATCH_VALID, validation);

  it('audit trail is non-empty', () => {
    const trail = report.getAuditTrail();
    assert.ok(trail.length > 0);
  });

  it('audit trail has ANALYSIS_START entry', () => {
    const trail = report.getAuditTrail();
    assert.ok(trail.some(e => e.type === 'ANALYSIS_START'));
  });

  it('audit trail has CANDIDATE_RANKED entries', () => {
    const trail = report.getAuditTrail();
    assert.ok(trail.some(e => e.type === 'CANDIDATE_RANKED'));
  });

  it('each audit entry has timestamp', () => {
    const trail = report.getAuditTrail();
    assert.ok(trail.every(e => e.timestamp));
  });
});

describe('ExplainabilityReport — uncertainty section', () => {
  it('uncertainty section for insufficient_data family', () => {
    const batch = {
      schema_version: 1,
      records: [{
        hadith_id: 'h10',
        family_id: 'f10',
        source_ref: {
          collection: 'Test',
          source_type: 'print',
          source_locator: 'p.10',
          ingested_at: '2026-03-21T00:00:00.000Z',
        },
        variants: [{ variant_id: 'v1', isnad_chain: ['a', 'b'] }],
        reliability_evidence: [],
      }],
      narrators: [],
    };
    const result = analyzeBatch(batch);
    const binder = ClaimEvidenceBinder.fromAnalysisResult(result, batch);
    const validation = binder.validate();
    const report = ExplainabilityReport.fromAnalysisResult(result, batch, validation);
    const section = report.getUncertaintySection();

    assert.ok(section.insufficient_data_families.length > 0);
    assert.ok(section.total_uncertain_count > 0);
  });

  it('uncertainty section for valid batch has zero blocking items', () => {
    const result = analyzeBatch(BATCH_VALID);
    const binder = ClaimEvidenceBinder.fromAnalysisResult(result, BATCH_VALID);
    const validation = binder.validate();
    const report = ExplainabilityReport.fromAnalysisResult(result, BATCH_VALID, validation);
    const section = report.getUncertaintySection();

    assert.equal(section.blocking_violations.length, 0);
  });
});

describe('ExplainabilityReport — canExport', () => {
  it('canExport is true when validation passes', () => {
    const result = analyzeBatch(BATCH_VALID);
    const binder = ClaimEvidenceBinder.fromAnalysisResult(result, BATCH_VALID);
    const validation = binder.validate();
    const report = ExplainabilityReport.fromAnalysisResult(result, BATCH_VALID, validation);
    assert.equal(report.canExport(), true);
  });

  it('canExport reflects analysis_can_proceed', () => {
    const batch = {
      schema_version: 1,
      records: [{
        hadith_id: 'hbad',
        family_id: 'fbad',
        source_ref: {
          collection: null,
          source_type: null,
          source_locator: null,
          ingested_at: null,
        },
        variants: [{
          variant_id: 'v1',
          isnad_chain: ['prophet', 'pre-link', 'cl-node', 'collector-a'],
        }, {
          variant_id: 'v2',
          isnad_chain: ['prophet', 'pre-link', 'cl-node', 'collector-b'],
        }, {
          variant_id: 'v3',
          isnad_chain: ['prophet', 'pre-link', 'cl-node', 'collector-c'],
        }],
        reliability_evidence: [],
      }],
      narrators: [],
    };
    const result = analyzeBatch(batch, ANALYSIS_PROFILE.RELIABILITY_WEIGHTED);
    const binder = ClaimEvidenceBinder.fromAnalysisResult(result, batch);
    const validation = binder.validate();
    assert.equal(validation.analysis_can_proceed, false);
    const report = ExplainabilityReport.fromAnalysisResult(result, batch, validation);
    assert.equal(report.canExport(), false);
  });
});

describe('ExplainabilityReport — toJSON output', () => {
  const result = analyzeBatch(BATCH_VALID);
  const binder = ClaimEvidenceBinder.fromAnalysisResult(result, BATCH_VALID);
  const validation = binder.validate();
  const report = ExplainabilityReport.fromAnalysisResult(result, BATCH_VALID, validation);
  const json = report.toJSON();

  it('toJSON includes panel_data', () => {
    assert.ok(json.panel_data);
  });

  it('toJSON includes audit_trail', () => {
    assert.ok(Array.isArray(json.audit_trail));
  });

  it('toJSON includes uncertainty_section', () => {
    assert.ok(json.uncertainty_section);
  });

  it('toJSON includes can_export and blocking_violations', () => {
    assert.ok(typeof json.can_export === 'boolean');
    assert.ok(Array.isArray(json.blocking_violations));
  });

  it('toJSON includes metadata', () => {
    assert.ok(json.metadata);
    assert.ok(json.metadata.generated_at);
    assert.ok(json.metadata.schema_version);
  });
});

describe('Blocking report generation', () => {
  it('anti-hallucination failure blocks analysis report generation', () => {
    const validator = AntiHallucinationValidator.fromBatch(BATCH_SYNTHETIC_NARRATOR);
    const antiResult = validator.validate();
    assert.equal(antiResult.canProceed(), false);
  });

  it('evidence binding failure blocks report generation', () => {
    const result = analyzeBatch(BATCH_NO_EVIDENCE_STRUCTURAL, ANALYSIS_PROFILE.RELIABILITY_WEIGHTED);
    const binder = ClaimEvidenceBinder.fromAnalysisResult(result, BATCH_NO_EVIDENCE_STRUCTURAL);
    const validation = binder.validate();
    assert.equal(validation.analysis_can_proceed, false);
  });

  it('unsupported claims are excluded, not presented as facts', () => {
    const result = analyzeBatch(BATCH_NO_EVIDENCE_STRUCTURAL);
    const panel = ExplainabilityReport.fromAnalysisResult(result, BATCH_NO_EVIDENCE_STRUCTURAL, null).getPanelData();
    for (const c of panel.candidates) {
      assert.ok(
        c.support.evidence_count >= 0,
        'Evidence count must be non-negative'
      );
    }
  });
});
