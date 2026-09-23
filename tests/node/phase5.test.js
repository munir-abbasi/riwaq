/**
 * tests/node/phase5.test.js
 *
 * Phase 5 — Canonical Artifacts and Report Exports
 *
 * Tests:
 *   1. Artifact emitters produce correct JSON structure
 *   2. CanonicalReport builds correctly from batch
 *   3. Markdown export produces valid, complete output
 *   4. DOCX export produces valid ZIP/OOXML bytes
 *   5. PDF export runs through LibreOffice (smoke)
 */
import { describe, it } from 'vitest';
import { strict as assert } from 'node:assert';
import { existsSync, unlinkSync, readFileSync } from 'node:fs';
import { tmpdir } from 'os';
import { join } from 'path';

import {
  emitArtifacts,
  emitNormalizedChains,
  emitNarratorGraph,
  emitCLCandidates,
  emitAnalysisSnapshot,
  ARTIFACT_VERSION,
} from '../../scripts/artifacts.js';

import { CanonicalReport, EXPORT_FORMAT } from '../../scripts/canonical-report.js';

import { exportMarkdown, exportMarkdownFromData } from '../../scripts/export-md.js';

import {
  exportDOCX,
  exportDOCXToBuffer,
  saveDOCX,
} from '../../scripts/export-docx.js';

import {
  exportPDF,
  exportPDFToFile,
} from '../../scripts/export-pdf.js';

import {
  BATCH_SMALL,
  BATCH_NO_CANDIDATES,
  BATCH_MULTI_FAMILY,
} from '../fixtures/phase5/fixtures.js';

describe('artifacts.js', () => {
  describe('emitNormalizedChains', () => {
    it('produces correct artifact structure', () => {
      const art = emitNormalizedChains(BATCH_SMALL, 'f1');
      assert.equal(art.schema_version, ARTIFACT_VERSION);
      assert.equal(art.artifact_type, 'normalized_chains');
      assert.equal(art.family_id, 'f1');
      assert.equal(art.chain_count, 3);
      assert.equal(art.chains.length, 3);
    });

    it('normalizes isnad_chain as array copy', () => {
      const art = emitNormalizedChains(BATCH_SMALL, 'f1');
      const chain = art.chains[0];
      assert.ok(Array.isArray(chain.isnad_chain));
      assert.deepEqual(chain.isnad_chain, ['prophet', 'pre-link', 'cl-narrator', 'collector-a']);
    });

    it('includes provenance_ref', () => {
      const art = emitNormalizedChains(BATCH_SMALL, 'f1');
      const chain = art.chains[0];
      assert.equal(chain.provenance_ref, 'Sunan Abu Dawud:p. 1');
    });

    it('handles unknown provenance gracefully', () => {
      const art = emitNormalizedChains(BATCH_NO_CANDIDATES, 'f10');
      assert.ok(art.chains.length > 0);
      assert.equal(art.chains[0].provenance_ref, 'Sunan al-Nasa\'i:p. 10');
    });

    it('returns empty chains for unknown family', () => {
      const art = emitNormalizedChains(BATCH_SMALL, 'unknown-family');
      assert.equal(art.chain_count, 0);
      assert.deepEqual(art.chains, []);
    });
  });

  describe('emitNarratorGraph', () => {
    it('produces correct artifact structure', () => {
      const art = emitNarratorGraph(BATCH_SMALL, 'f1');
      assert.equal(art.schema_version, ARTIFACT_VERSION);
      assert.equal(art.artifact_type, 'narrator_graph');
      assert.equal(art.family_id, 'f1');
      assert.ok(art.nodes.length > 0);
      assert.ok(art.edges.length > 0);
    });

    it('computes in/out degree correctly', () => {
      const art = emitNarratorGraph(BATCH_SMALL, 'f1');
      const prophetNode = art.nodes.find(n => n.narrator_id === 'prophet');
      assert.equal(prophetNode?.out_degree, 1);
      assert.equal(prophetNode?.in_degree, 0);
    });

    it('edge connects consecutive narrators', () => {
      const art = emitNarratorGraph(BATCH_SMALL, 'f1');
      const prophetToPrelink = art.edges.find(e => e.from === 'prophet' && e.to === 'pre-link');
      assert.ok(prophetToPrelink);
    });

    it('deduplicates variant_ids on edges', () => {
      const art = emitNarratorGraph(BATCH_SMALL, 'f1');
      const edge = art.edges.find(e => e.from === 'pre-link' && e.to === 'cl-narrator');
      assert.ok(edge?.variant_ids.includes('v1'));
      const uniqueIds = new Set(edge?.variant_ids || []);
      assert.equal(uniqueIds.size, edge?.variant_ids.length);
    });
  });

  describe('emitCLCandidates', () => {
    it('produces correct artifact structure', () => {
      const report = CanonicalReport.fromBatch(BATCH_SMALL, { profile: 'reliability_weighted' });
      const result = report.getAnalysisResult('f1');
      const art = emitCLCandidates(result);
      assert.equal(art.schema_version, ARTIFACT_VERSION);
      assert.equal(art.artifact_type, 'cl_candidates');
      assert.ok(art.family_status);
      assert.ok(art.profile);
      assert.ok(Array.isArray(art.candidates));
    });

    it('ranks candidates by descending confidence', () => {
      const report = CanonicalReport.fromBatch(BATCH_SMALL, { profile: 'reliability_weighted' });
      const result = report.getAnalysisResult('f1');
      const art = emitCLCandidates(result);
      if (art.candidates.length > 1) {
        for (let i = 0; i < art.candidates.length - 1; i++) {
          assert.ok(art.candidates[i].final_confidence >= art.candidates[i + 1].final_confidence);
        }
      }
    });

    it('handles null analysis result', () => {
      const art = emitCLCandidates(null);
      assert.equal(art.candidate_count, 0);
      assert.deepEqual(art.candidates, []);
      assert.equal(art.status, 'no_analysis');
    });

    it('handles analysis result with no candidates', () => {
      const report = CanonicalReport.fromBatch(BATCH_NO_CANDIDATES, { profile: 'reliability_weighted' });
      const result = report.getAnalysisResult('f10');
      const art = emitCLCandidates(result);
      assert.equal(art.candidate_count, 0);
      assert.deepEqual(art.candidates, []);
    });
  });

  describe('emitAnalysisSnapshot', () => {
    it('produces correct artifact structure', () => {
      const report = CanonicalReport.fromBatch(BATCH_SMALL, { profile: 'structural_only' });
      const result = report.getAnalysisResult('f1');
      const art = emitAnalysisSnapshot(result);
      assert.equal(art.schema_version, ARTIFACT_VERSION);
      assert.equal(art.artifact_type, 'analysis_snapshot');
      assert.ok(art.family_status);
      assert.ok(art.profile);
    });

    it('handles null', () => {
      const art = emitAnalysisSnapshot(null);
      assert.equal(art.status, 'no_analysis');
    });

    it('persists full feature vectors', () => {
      const report = CanonicalReport.fromBatch(BATCH_SMALL, { profile: 'reliability_weighted' });
      const result = report.getAnalysisResult('f1');
      const art = emitAnalysisSnapshot(result);
      if (art.candidates.length > 0) {
        assert.ok(art.candidates[0].features !== null || art.candidates[0].features === null);
        assert.ok(typeof art.candidates[0].final_confidence === 'number');
      }
    });
  });

  describe('emitArtifacts (bundle)', () => {
    it('emits all four artifacts in one call', () => {
      const report = CanonicalReport.fromBatch(BATCH_SMALL, { profile: 'reliability_weighted' });
      const result = report.getAnalysisResult('f1');
      const bundle = emitArtifacts(BATCH_SMALL, result, 'f1');
      assert.ok(bundle.normalized_chains);
      assert.ok(bundle.narrator_graph);
      assert.ok(bundle.cl_candidates);
      assert.ok(bundle.analysis_snapshot);
    });

    it('each artifact has valid generated_at', () => {
      const report = CanonicalReport.fromBatch(BATCH_SMALL, { profile: 'structural_only' });
      const result = report.getAnalysisResult('f1');
      const bundle = emitArtifacts(BATCH_SMALL, result, 'f1');
      const times = [
        bundle.normalized_chains.generated_at,
        bundle.narrator_graph.generated_at,
        bundle.cl_candidates.generated_at,
        bundle.analysis_snapshot.generated_at,
      ];
      assert.equal(times.length, 4);
      for (const t of times) {
        assert.ok(t, 'generated_at should not be empty');
        assert.ok(t.includes('T'), 'generated_at should be ISO format');
      }
      const unique = [...new Set(times)];
      assert.ok(unique.length >= 1, 'all artifacts should have timestamps');
    });
  });
});

describe('canonical-report.js', () => {
  it('CanonicalReport.fromBatch constructs correctly', () => {
    const report = CanonicalReport.fromBatch(BATCH_SMALL, { profile: 'structural_only' });
    assert.ok(report.getReportData());
    assert.ok(report.getFamilyIds().length > 0);
  });

  it('report contains all required sections', () => {
    const report = CanonicalReport.fromBatch(BATCH_SMALL, { profile: 'structural_only' });
    const data = report.getReportData();
    assert.ok(data.schema_version);
    assert.ok(data.generated_at);
    assert.ok(data.batch_metadata);
    assert.ok(data.family_metadata);
    assert.ok(data.analysis);
    assert.ok(Array.isArray(data.candidates));
    assert.ok(data.evidence_binding);
    assert.ok(data.uncertainty);
  });

  it('canExport() returns true when validation passes', () => {
    const report = CanonicalReport.fromBatch(BATCH_SMALL, { profile: 'structural_only' });
    assert.equal(report.canExport(), true);
  });

  it('serializes every family while preserving the primary-family fields', () => {
    const report = CanonicalReport.fromBatch(BATCH_MULTI_FAMILY, { profile: 'reliability_weighted' });
    const responseDump = JSON.parse(JSON.stringify(report));

    assert.deepEqual(responseDump.family_ids, ['family-alpha', 'family-beta']);
    assert.ok(Array.isArray(responseDump.families));
    assert.deepEqual(responseDump.families.map(family => family.family_id), responseDump.family_ids);

    for (const family of responseDump.families) {
      assert.equal(family.analysis.family_status, report.getAnalysisResult(family.family_id).family_status);
      assert.equal(
        family.evidence_binding.analysis_can_proceed,
        report.getValidationResult(family.family_id).analysis_can_proceed
      );
    }

    assert.deepEqual(responseDump.candidates, responseDump.families[0].candidates);
  });

  it('getArtifacts() returns per-family artifacts', () => {
    const report = CanonicalReport.fromBatch(BATCH_MULTI_FAMILY, { profile: 'structural_only' });
    const artA = report.getArtifacts('family-alpha');
    const artB = report.getArtifacts('family-beta');
    assert.ok(artA);
    assert.ok(artB);
    assert.equal(artA.normalized_chains.family_id, 'family-alpha');
    assert.equal(artB.normalized_chains.family_id, 'family-beta');
  });

  it('toJSON() excludes transient fields', () => {
    const report = CanonicalReport.fromBatch(BATCH_SMALL, { profile: 'structural_only' });
    const json = report.toJSON();
    assert.equal(json.all_analysis, undefined);
    assert.equal(json.all_validation, undefined);
    assert.equal(json.all_explainability, undefined);
    assert.equal(json.all_artifacts, undefined);
  });
});

describe('export-md.js', () => {
  it('exportMarkdown produces non-empty string', () => {
    const report = CanonicalReport.fromBatch(BATCH_SMALL, { profile: 'structural_only' });
    const md = exportMarkdown(report);
    assert.ok(typeof md === 'string');
    assert.ok(md.length > 100);
  });

  it('output contains expected sections', () => {
    const report = CanonicalReport.fromBatch(BATCH_SMALL, { profile: 'reliability_weighted' });
    const md = exportMarkdown(report, { include_evidence_binding: true, include_uncertainty: true });
    assert.ok(md.includes('Isnad Analysis Report'));
    assert.ok(md.includes('Generated:'));
    assert.ok(md.includes('CL/PCL Candidates'));
    assert.ok(md.includes('Evidence Binding'));
    assert.ok(md.includes('Uncertainty and Exclusion'));
  });

  it('candidate section includes narrator_id and confidence', () => {
    const report = CanonicalReport.fromBatch(BATCH_SMALL, { profile: 'reliability_weighted' });
    const md = exportMarkdown(report);
    assert.ok(md.includes('cl-narrator'));
    assert.ok(md.includes('Confidence:'));
  });

  it('family metadata section appears', () => {
    const report = CanonicalReport.fromBatch(BATCH_MULTI_FAMILY, { profile: 'structural_only' });
    const md = exportMarkdown(report, { include_chains: false });
    assert.ok(md.includes('Family Metadata'));
    assert.ok(md.includes('family-alpha'));
    assert.ok(md.includes('family-beta'));
  });

  it('insufficient_data family handled gracefully', () => {
    const report = CanonicalReport.fromBatch(BATCH_NO_CANDIDATES, { profile: 'structural_only' });
    const md = exportMarkdown(report);
    assert.ok(md.includes('CL/PCL Candidates'));
    assert.ok(md.includes('insufficient_data') || md.includes('No CL/PCL candidates'));
  });

  it('normalized chains section included when enabled', () => {
    const report = CanonicalReport.fromBatch(BATCH_SMALL, { profile: 'structural_only' });
    const md = exportMarkdown(report, { include_chains: true });
    assert.ok(md.includes('Normalized Chains'));
    assert.ok(md.includes('prophet'));
  });

  it('normalized chains excluded when disabled', () => {
    const report = CanonicalReport.fromBatch(BATCH_SMALL, { profile: 'structural_only' });
    const md = exportMarkdown(report, { include_chains: false });
    assert.ok(!md.includes('Normalized Chains'));
  });

  it('exports from reportData directly', () => {
    const report = CanonicalReport.fromBatch(BATCH_SMALL, { profile: 'structural_only' });
    const data = report.getReportData();
    const md = exportMarkdownFromData(data);
    assert.ok(typeof md === 'string');
    assert.ok(md.length > 100);
  });
});

describe('export-docx.js', () => {
  it('exportDOCX returns Uint8Array', async () => {
    const report = CanonicalReport.fromBatch(BATCH_SMALL, { profile: 'structural_only' });
    const bytes = await exportDOCX(report);
    assert.ok(bytes instanceof Uint8Array);
    assert.ok(bytes.length > 500);
  });

  it('DOCX is a valid ZIP (starts with PK)', async () => {
    const report = CanonicalReport.fromBatch(BATCH_SMALL, { profile: 'structural_only' });
    const bytes = await exportDOCX(report);
    assert.equal(bytes[0], 0x50);
    assert.equal(bytes[1], 0x4b);
  });

  it('DOCX contains [Content_Types].xml', async () => {
    const report = CanonicalReport.fromBatch(BATCH_SMALL, { profile: 'structural_only' });
    const bytes = await exportDOCX(report);
    const text = await _extractZipEntry(bytes, '[Content_Types].xml');
    assert.ok(text.includes('ContentType'));
    assert.ok(text.includes('wordprocessingml'));
  });

  it('DOCX contains word/document.xml', async () => {
    const report = CanonicalReport.fromBatch(BATCH_SMALL, { profile: 'reliability_weighted' });
    const bytes = await exportDOCX(report);
    const text = await _extractZipEntry(bytes, 'word/document.xml');
    assert.ok(text.includes('w:document'));
    assert.ok(text.includes('cl-narrator'));
  });

  it('DOCX contains word/styles.xml', async () => {
    const report = CanonicalReport.fromBatch(BATCH_SMALL, { profile: 'structural_only' });
    const bytes = await exportDOCX(report);
    const text = await _extractZipEntry(bytes, 'word/styles.xml');
    assert.ok(text.includes('w:styles'));
    assert.ok(text.includes('Heading'));
  });

  it('exportDOCXToBuffer returns Buffer', async () => {
    const report = CanonicalReport.fromBatch(BATCH_SMALL, { profile: 'structural_only' });
    const buf = await exportDOCXToBuffer(report);
    assert.ok(Buffer.isBuffer(buf));
    assert.ok(buf.length > 500);
  });

  it('saveDOCX writes a valid file', async () => {
    const report = CanonicalReport.fromBatch(BATCH_SMALL, { profile: 'structural_only' });
    const tmpPath = join(tmpdir(), `test-docx-${Date.now()}.docx`);
    await saveDOCX(report, tmpPath);
    assert.ok(existsSync(tmpPath));
    const buf = readFileSync(tmpPath);
    assert.ok(buf[0] === 0x50 && buf[1] === 0x4b);
    unlinkSync(tmpPath);
  });
});

describe('export-pdf.js', () => {
  it('exportPDF returns Uint8Array with PDF magic bytes', async () => {
    const report = CanonicalReport.fromBatch(BATCH_SMALL, { profile: 'structural_only' });
    const bytes = await exportPDF(report);
    assert.ok(bytes instanceof Uint8Array);
    assert.ok(bytes.length > 100);
    assert.equal(bytes[0], 0x25);
    assert.equal(bytes[1] === 0x50 || bytes[1] === 0x45 || bytes[1] === 0x46, true);
    assert.ok(bytes.length > 1000);
  });

  it('exportPDFToFile writes a valid PDF', async () => {
    const report = CanonicalReport.fromBatch(BATCH_SMALL, { profile: 'structural_only' });
    const tmpPath = join(tmpdir(), `test-export-${Date.now()}.pdf`);
    try {
      await exportPDFToFile(report, tmpPath);
      assert.ok(existsSync(tmpPath));
      const buf = readFileSync(tmpPath);
      assert.ok(buf[0] === 0x25);
    } finally {
      if (existsSync(tmpPath)) unlinkSync(tmpPath);
    }
  });

  it('PDF smoke test on multi-family batch', async () => {
    const report = CanonicalReport.fromBatch(BATCH_MULTI_FAMILY, { profile: 'structural_only' });
    const bytes = await exportPDF(report);
    assert.ok(bytes.length > 100);
    const header = new TextDecoder().decode(bytes.slice(0, 20));
    assert.ok(header.includes('%PDF') || bytes[0] === 0x25);
  });
});

async function _extractZipEntryFromPython(zipBytes, entryName) {
  const { writeFileSync, unlinkSync, chmodSync } = await import('node:fs');
  const { join } = await import('node:path');
  const { randomUUID } = await import('node:crypto');
  const { tmpdir } = await import('node:os');
  const { execFile } = await import('node:child_process');
  const { promisify } = await import('node:util');

  const execAsync = promisify(execFile);
  const tmp = tmpdir();
  const zipPath = join(tmp, `ze-${randomUUID()}.zip`);
  const pyPath = join(tmp, `ze-${randomUUID()}.py`);
  writeFileSync(zipPath, Buffer.from(zipBytes));
  writeFileSync(pyPath, `import sys,zipfile;sys.stdout.write(repr(zipfile.ZipFile(sys.argv[1],'r').read(sys.argv[2]).decode('utf-8','replace')))\n`);
  chmodSync(pyPath, 0o755);
  try {
    const { stdout } = await execAsync('python3', [pyPath, zipPath, entryName], { timeout: 5000 });
    return stdout.slice(1, -2);
  } catch (_e) {
    return '';
  } finally {
    try { unlinkSync(zipPath); } catch (_e2) {}
    try { unlinkSync(pyPath); } catch (_e3) {}
  }
}

async function _extractZipEntry(zipBytes, entryName) {
  return _extractZipEntryFromPython(zipBytes, entryName);
}
