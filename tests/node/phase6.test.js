/**
 * tests/node/phase6.test.js
 *
 * Phase 6 — E2E Pipeline, Determinism, and Reproducibility
 *
 * Tests:
 *   1. Full import -> validate -> analyze -> explain -> export pipeline
 *   2. All formats produce consistent results from same input
 *   3. Determinism: 20 consecutive runs produce identical results
 *   4. No unsupported claims reach export as factual
 *   5. Browser smoke test integration
 */
import { describe, it } from 'vitest';
import * as assert2 from 'node:assert';
import { existsSync } from 'node:fs';
import { join } from 'path';

import { normalizeBatch, validateBatch } from '../../scripts/json-validator.js';
import {
  analyzeBatch,
  ANALYSIS_PROFILE,
} from '../../scripts/clpcl-analyzer.js';
import {
  ClaimEvidenceBinder,
} from '../../scripts/evidence-binding.js';
import { ExplainabilityReport } from '../../scripts/explainability.js';
import { CanonicalReport } from '../../scripts/canonical-report.js';
import { exportMarkdown } from '../../scripts/export-md.js';
import { exportDOCX } from '../../scripts/export-docx.js';

import { FIXTURE_E2E_MINIMAL, FIXTURE_E2E_WITH_EVIDENCE } from '../fixtures/phase6/fixtures.js';
import { BATCH_SMALL } from '../fixtures/phase5/fixtures.js';

function stripTimestamps(obj) {
  const seen = new WeakSet();
  return JSON.parse(JSON.stringify(obj, (_k, v) => {
    if (typeof v === 'string' && /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z/.test(v)) {
      return '[TIMESTAMP]';
    }
    return v;
  }));
}

describe('Phase 6 — E2E Pipeline', () => {
  describe('Pipeline — minimal fixture (structural_only)', () => {
    it('normalizeBatch produces normalized batch object', () => {
      const norm = normalizeBatch(FIXTURE_E2E_MINIMAL);
      assert2.ok(norm.records, 'normalized batch should have records');
      assert2.equal(Array.isArray(norm.records), true);
    });

    it('validateBatch returns valid=true for good input', () => {
      const norm = normalizeBatch(FIXTURE_E2E_MINIMAL);
      const result = validateBatch(norm);
      assert2.equal(result.valid, true);
      assert2.equal(result.collector.errors.length, 0);
    });

    it('analyzeBatch produces result with family_status and candidates', () => {
      const result = analyzeBatch(FIXTURE_E2E_MINIMAL, ANALYSIS_PROFILE.STRUCTURAL_ONLY);
      assert2.ok(result.family_status !== undefined);
      assert2.ok(Array.isArray(result.candidates));
    });

    it('ClaimEvidenceBinder produces ValidationResult', () => {
      const result = analyzeBatch(FIXTURE_E2E_MINIMAL, ANALYSIS_PROFILE.STRUCTURAL_ONLY);
      const binder = ClaimEvidenceBinder.fromAnalysisResult(result, FIXTURE_E2E_MINIMAL);
      const validation = binder.validate();
      assert2.ok(validation.valid !== undefined);
      assert2.ok(Array.isArray(validation.bindings));
    });

    it('ExplainabilityReport builds without errors', () => {
      const result = analyzeBatch(FIXTURE_E2E_MINIMAL, ANALYSIS_PROFILE.STRUCTURAL_ONLY);
      const binder = ClaimEvidenceBinder.fromAnalysisResult(result, FIXTURE_E2E_MINIMAL);
      const validation = binder.validate();
      const expReport = ExplainabilityReport.fromAnalysisResult(result, FIXTURE_E2E_MINIMAL, validation);
      assert2.ok(expReport !== null && expReport !== undefined);
    });
  });

  describe('Pipeline — fixture with evidence (reliability_weighted)', () => {
    it('analyzer produces candidates for multi-variant input', () => {
      const result = analyzeBatch(FIXTURE_E2E_WITH_EVIDENCE, ANALYSIS_PROFILE.RELIABILITY_WEIGHTED);
      assert2.ok(result.candidates !== undefined);
    });

    it('bindings produce bindings for narrators', () => {
      const result = analyzeBatch(FIXTURE_E2E_WITH_EVIDENCE, ANALYSIS_PROFILE.RELIABILITY_WEIGHTED);
      const binder = ClaimEvidenceBinder.fromAnalysisResult(result, FIXTURE_E2E_WITH_EVIDENCE);
      const validation = binder.validate();
      assert2.ok(Array.isArray(validation.bindings));
    });
  });

  describe('CanonicalReport — full pipeline integration', () => {
    it('CanonicalReport.fromBatch constructs and JSON-serializes', () => {
      const report = CanonicalReport.fromBatch(FIXTURE_E2E_MINIMAL, {
        profile: 'structural_only',
      });
      const json = JSON.stringify(report);
      assert2.ok(json.length > 0);
      const parsed = JSON.parse(json);
      assert2.ok(parsed.generated_at);
      assert2.ok(parsed.family_ids.length > 0);
    });

    it('structural_only and reliability_weighted both produce families', () => {
      const r1 = CanonicalReport.fromBatch(BATCH_SMALL, { profile: 'structural_only' });
      const r2 = CanonicalReport.fromBatch(BATCH_SMALL, { profile: 'reliability_weighted' });
      assert2.ok(r1.getFamilyIds().length > 0);
      assert2.ok(r2.getFamilyIds().length === r1.getFamilyIds().length);
    });

    it('getAnalysisResult returns per-family analysis with profile and family_status', () => {
      const report = CanonicalReport.fromBatch(FIXTURE_E2E_MINIMAL, {
        profile: 'structural_only',
      });
      const fids = report.getFamilyIds();
      for (const fid of fids) {
        const analysis = report.getAnalysisResult(fid);
        assert2.ok(analysis, `analysis for family ${fid} should exist`);
        assert2.ok(analysis.family_status !== undefined);
        assert2.ok(analysis.profile === 'structural_only');
      }
    });

    it('Markdown export produces valid output', () => {
      const report = CanonicalReport.fromBatch(BATCH_SMALL, { profile: 'structural_only' });
      const md = exportMarkdown(report);
      assert2.ok(md.length > 100);
      assert2.ok(
        md.includes('Confidence') || md.includes('confidence'),
        'MD should contain confidence info'
      );
    });

    it('DOCX export produces valid ZIP bytes', async () => {
      const report = CanonicalReport.fromBatch(BATCH_SMALL, { profile: 'structural_only' });
      const bytes = await exportDOCX(report);
      assert2.ok(bytes instanceof Uint8Array);
      assert2.equal(bytes[0], 0x50);
      assert2.equal(bytes[1], 0x4b);
    });

    it('pipeline produces zero validation errors on BATCH_SMALL', () => {
      const norm = normalizeBatch(BATCH_SMALL);
      const result = validateBatch(norm);
      assert2.equal(result.valid, true);
    });
  });

  describe('Unsupported claim prevention', () => {
    it('families without candidates do not claim SUPPORTED/CONFIRMED', () => {
      const report = CanonicalReport.fromBatch(FIXTURE_E2E_MINIMAL, {
        profile: 'structural_only',
      });
      for (const fid of report.getFamilyIds()) {
        const analysis = report.getAnalysisResult(fid);
        if (!analysis.candidates || analysis.candidates.length === 0) {
          assert2.ok(
            analysis.family_status !== 'SUPPORTED' && analysis.family_status !== 'CONFIRMED',
            `Family ${fid} claimed support without candidates`
          );
        }
      }
    });

    it('uncertainty data in canonical report is well-structured', () => {
      const report = CanonicalReport.fromBatch(FIXTURE_E2E_MINIMAL, {
        profile: 'structural_only',
      });
      const json = JSON.stringify(report);
      const data = JSON.parse(json);
      if (data.uncertainty && data.uncertainty.length > 0) {
        assert2.ok(
          data.uncertainty.every(u => u.reason || u.status),
          'uncertainty entries must have reason or status'
        );
      }
    });
  });

  describe('Determinism — 20 consecutive runs', () => {
    it('structural_only analysis is identical across 20 runs (timestamps stripped)', () => {
      const results = [];
      for (let i = 0; i < 20; i++) {
        const result = analyzeBatch(FIXTURE_E2E_MINIMAL, ANALYSIS_PROFILE.STRUCTURAL_ONLY);
        results.push(JSON.stringify(stripTimestamps(result)));
      }
      const first = results[0];
      for (let i = 1; i < results.length; i++) {
        assert2.equal(
          results[i],
          first,
          `structural_only run ${i + 1} differs`
        );
      }
    });

    it('canonical report is identical across 20 runs (timestamps stripped)', () => {
      const results = [];
      for (let i = 0; i < 20; i++) {
        const report = CanonicalReport.fromBatch(FIXTURE_E2E_MINIMAL, {
          profile: 'structural_only',
        });
        results.push(JSON.stringify(stripTimestamps(report)));
      }
      const first = results[0];
      for (let i = 1; i < results.length; i++) {
        assert2.equal(
          results[i],
          first,
          `CanonicalReport run ${i + 1} differs`
        );
      }
    });

    it('Markdown export is identical across 20 runs', () => {
      const report = CanonicalReport.fromBatch(FIXTURE_E2E_MINIMAL, {
        profile: 'structural_only',
      });
      const results = [];
      for (let i = 0; i < 20; i++) {
        results.push(exportMarkdown(report));
      }
      const first = results[0];
      for (let i = 1; i < results.length; i++) {
        assert2.equal(
          results[i],
          first,
          `MD export run ${i + 1} differs`
        );
      }
    });

    it('reliability_weighted analysis is identical across 20 runs (timestamps stripped)', () => {
      const results = [];
      for (let i = 0; i < 20; i++) {
        const result = analyzeBatch(FIXTURE_E2E_WITH_EVIDENCE, ANALYSIS_PROFILE.RELIABILITY_WEIGHTED);
        results.push(JSON.stringify(stripTimestamps(result)));
      }
      const first = results[0];
      for (let i = 1; i < results.length; i++) {
        assert2.equal(
          results[i],
          first,
          `reliability_weighted run ${i + 1} differs`
        );
      }
    });
  });

  describe('Browser smoke test files exist', () => {
    it('index.html exists', () => {
      assert2.ok(existsSync(join(process.cwd(), 'index.html')));
    });

    it('smoke-test.cjs exists', () => {
      assert2.ok(existsSync(join(process.cwd(), 'scripts', 'smoke-test.cjs')));
    });

    it('browser smoke test file exists', () => {
      assert2.ok(existsSync(join(process.cwd(), 'tests', 'browser', 'smoke.test.js')));
    });
  });
});
