import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateBatch } from '../../scripts/json-validator.js';
import { CanonicalReport } from '../../scripts/canonical-report.js';
import { normalizeArabicTokens, computeNodeMatnCoherence, MEASURED_MATN_COHERENCE_BASIS, DEFAULT_MATN_COHERENCE_BASIS } from '../../scripts/clpcl-analyzer.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('Milestone 1 — Structured Matn Apparatus & Measured S5 Coherence', () => {
  const fixturePath = path.join(__dirname, '../fixtures/e2e/m1-segmented-hadith.json');
  const fixtureRaw = JSON.parse(fs.readFileSync(fixturePath, 'utf8'));

  it('validates schema with structured matn_segments apparatus', () => {
    const { valid, collector, normalized } = validateBatch(fixtureRaw);
    expect(valid).toBe(true);
    expect(collector.errors.length).toBe(0);
    expect(normalized.records[0].variants[0].matn_segments.length).toBe(3);
    expect(normalized.records[0].variants[0].matn_segments[0].variant_type).toBe('base');
    expect(normalized.records[1].variants[0].matn_segments[0].variant_type).toBe('tas_hif');
  });

  it('failure mode: rejects invalid variant_type in matn_segments', () => {
    const badBatch = JSON.parse(JSON.stringify(fixtureRaw));
    badBatch.records[0].variants[0].matn_segments[0].variant_type = 'nonexistent_type';
    const { valid, collector } = validateBatch(badBatch);
    expect(valid).toBe(false);
    expect(collector.errors.length).toBeGreaterThan(0);
  });

  it('pure algorithm: correctly normalizes Arabic tokens across variant spellings', () => {
    const textA = 'إِنَّمَا الأَعْمَالُ بِالنِّيَّاتِ';
    const textB = 'انما الاعمال بالنيات';
    const tokensA = normalizeArabicTokens(textA);
    const tokensB = normalizeArabicTokens(textB);
    expect([...tokensA]).toEqual([...tokensB]);
  });

  it('computes measured S5 Jaccard coherence when matn_segments are present', () => {
    const { normalized } = validateBatch(fixtureRaw);
    const report = CanonicalReport.fromBatch(normalized, { profile: 'structural_only' });
    expect(report.canExport()).toBe(true);

    const reportData = report.getReportData();
    const family = reportData.families[0];
    expect(family.analysis.family_status).toBe('cl_detected');

    const analysis = report.getAnalysisResult(family.family_id);
    const clCandidate = analysis.candidates.find(c => c.narrator_id === 'hisham-ibn-urwah');
    expect(clCandidate).toBeDefined();
    expect(clCandidate.candidate_type).toBe('common_link');
    expect(clCandidate.matn_coherence_basis).toBe(MEASURED_MATN_COHERENCE_BASIS);
    expect(clCandidate.features.matn_coherence).toBeGreaterThan(0.3);
    expect(clCandidate.features.matn_coherence).toBeLessThan(1.0);
    expect(clCandidate.subscores.S5).toBe(clCandidate.features.matn_coherence);

    // Save repeatable verifiable artifact
    const artifactPath = path.join(__dirname, '../fixtures/e2e/m1-matn-coherence-snapshot.json');
    const artifactData = {
      test_run_at: '2026-10-25T00:00:00.000Z',
      family_id: family.family_id,
      cl_candidate: clCandidate.narrator_id,
      matn_coherence_score: clCandidate.features.matn_coherence,
      matn_coherence_basis: clCandidate.matn_coherence_basis,
      subscores: clCandidate.subscores,
      can_export: report.canExport(),
    };
    fs.writeFileSync(artifactPath, JSON.stringify(artifactData, null, 2), 'utf8');
    expect(fs.existsSync(artifactPath)).toBe(true);
  });

  it('preserves default_constant_unmeasured when matn_segments are omitted', () => {
    const unsegmentedBatch = JSON.parse(JSON.stringify(fixtureRaw));
    for (const record of unsegmentedBatch.records) {
      for (const variant of record.variants) {
        delete variant.matn_segments;
      }
    }
    const { normalized } = validateBatch(unsegmentedBatch);
    const report = CanonicalReport.fromBatch(normalized, { profile: 'structural_only' });
    const analysis = report.getAnalysisResult('family-intentions');
    const clCandidate = analysis.candidates.find(c => c.narrator_id === 'hisham-ibn-urwah');
    expect(clCandidate.matn_coherence_basis).toBe(DEFAULT_MATN_COHERENCE_BASIS);
    expect(clCandidate.features.matn_coherence).toBe(0.50);
  });
});
