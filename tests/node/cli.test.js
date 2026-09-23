/**
 * tests/node/cli.test.js
 *
 * Riwaq Control CLI (scripts/riwaq-cli.mjs) — behavioral integration coverage.
 *
 * Key scenarios:
 *   - documented input completes the canonical pipeline and can export;
 *   - malformed input is rejected through both validation and snapshot surfaces;
 *   - a multi-variant family exposes a real CL result rather than a trivial path;
 *   - manifest/snapshot/impact preserve owner authority and caller isolation.
 *
 * The CLI is a thin projection of public module APIs (D009); these tests verify
 * process-level behavior using the JSON stdout response as the repeatable
 * response-dump artifact. Analytical internals remain covered by owner tests.
 */
import { describe, it } from 'vitest';
import { strict as assert } from 'node:assert';
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { getCapabilityManifest } from '../../scripts/agent-control.js';
import { PARTIAL_MINIMAL } from '../fixtures/phase1/fixtures.js';

const CLI = join(process.cwd(), 'scripts', 'riwaq-cli.mjs');
const SAMPLE = join(process.cwd(), 'docs', 'examples', 'sample-import.json');
const SAMPLE_MULTI = join(process.cwd(), 'docs', 'examples', 'sample-multi-variant.json');

function runCli(args) {
  try {
    const stdout = execFileSync(process.execPath, [CLI, ...args], {
      encoding: 'utf8',
      timeout: 60000,
    });
    return { code: 0, stdout };
  } catch (e) {
    return { code: e.status ?? 1, stdout: e.stdout ?? '', stderr: e.stderr ?? '' };
  }
}

describe('Riwaq Control CLI', () => {
  it('golden path: pipeline over the documented sample exits 0 with can_export=true', () => {
    const { code, stdout } = runCli(['pipeline', SAMPLE]);
    assert.equal(code, 0, `expected exit 0, got ${code}\nstdout: ${stdout}`);
    const envelope = JSON.parse(stdout);
    assert.equal(envelope.ok, true);
    assert.equal(envelope.command, 'pipeline');
    assert.equal(envelope.data.report.can_export, true);
    assert.equal(envelope.data.stages.validation.passed, true);
    assert.equal(envelope.data.stages.validation.control_type, 'blocking_precondition');
    assert.equal(envelope.data.stages.quality_gates.control_type, 'observation');
    assert.equal(envelope.data.stages.anti_hallucination.valid, true);
    assert.equal(envelope.data.stages.anti_hallucination.control_type, 'observation');
    assert.equal(envelope.data.report.control_type, 'publication_gate');
    assert.equal(envelope.data.report.authority, 'CanonicalReport.canExport()');
  });

  it('failure path: malformed input and unknown impact targets return structured errors', () => {
    const dir = mkdtempSync(join(tmpdir(), 'riwaq-cli-test-'));
    const badFile = join(dir, 'bad.json');
    writeFileSync(badFile, '{ not valid json', 'utf8');
    const { code, stdout } = runCli(['validate', badFile]);
    assert.equal(code, 1, `expected exit 1, got ${code}`);
    const envelope = JSON.parse(stdout);
    assert.equal(envelope.ok, false);
    assert.equal(envelope.data.errors[0].code, 'MALFORMED_JSON');
    assert.ok(Array.isArray(envelope.data.errors));

    const snapshot = runCli(['snapshot', badFile]);
    assert.equal(snapshot.code, 1, `expected snapshot exit 1, got ${snapshot.code}`);
    const snapshotEnvelope = JSON.parse(snapshot.stdout);
    assert.equal(snapshotEnvelope.command, 'snapshot');
    assert.equal(snapshotEnvelope.error.code, 'INVALID_INPUT');

    const impact = runCli(['impact', 'unknown.capability']);
    assert.equal(impact.code, 2, `expected impact exit 2, got ${impact.code}`);
    const impactEnvelope = JSON.parse(impact.stdout);
    assert.equal(impactEnvelope.command, 'impact');
    assert.equal(impactEnvelope.error.code, 'UNKNOWN_CAPABILITY');
  });

  it('analytics golden path: report exposes the canonical family result and exports', () => {
    const { code, stdout } = runCli(['report', SAMPLE_MULTI]);
    assert.equal(code, 0, `expected exit 0, got ${code}\nstdout: ${stdout}`);
    const envelope = JSON.parse(stdout);
    assert.equal(envelope.data.can_export, true);
    assert.equal(envelope.data.family_status, 'cl_detected');
    assert.ok(envelope.data.candidate_count >= 1);
    assert.ok(Array.isArray(envelope.data.families));
    const family = envelope.data.families.find(item => item.family_id === 'demo-covenant-family');
    assert.ok(family, 'expected canonical family detail');
    assert.deepEqual(envelope.data.candidates, family.candidates);
    const cl = family.candidates.find(c => c.type === 'common_link');
    assert.ok(cl, 'expected a common_link candidate');
    assert.equal(cl.narrator_id, 'hisham-ibn-urwah');
    assert.equal(cl.matn_coherence_basis, 'default_constant_unmeasured');
  });

  it('narrator evidence drives and binds a reliability-weighted report', () => {
    const { code, stdout } = runCli([
      'report',
      SAMPLE_MULTI,
      '--profile',
      'reliability_weighted',
      '--with-reliability',
    ]);
    assert.equal(code, 0, `expected exit 0, got ${code}\nstdout: ${stdout}`);
    const envelope = JSON.parse(stdout);
    const family = envelope.data.families[0];
    const binding = family.evidence_binding.bindings[0];

    assert.equal(envelope.data.can_export, true);
    assert.equal(family.candidates[0].reliability_prior, 0.75);
    assert.deepEqual(binding.evidence_refs.map(ref => ref.evidence_id), ['ev-demo-hisham-001']);
  });

  it('agent surfaces: manifest is discoverable and snapshot exposes typed state without becoming the publication gate', () => {
    const mutableManifest = getCapabilityManifest();
    mutableManifest.capabilities[0].outputs.push('mutation-probe');
    assert.ok(!getCapabilityManifest().capabilities[0].outputs.includes('mutation-probe'), 'manifest results must be isolated across callers');

    const manifest = runCli(['manifest']);
    assert.equal(manifest.code, 0);
    const manifestEnvelope = JSON.parse(manifest.stdout);
    assert.equal(manifestEnvelope.ok, true);
    assert.equal(manifestEnvelope.data.manifest_version, 3);
    assert.ok(manifestEnvelope.data.capabilities.some(c => c.id === 'module.canonicalReport' && c.decision_signal === 'canExport()'));
    assert.ok(manifestEnvelope.data.capabilities.some(c => c.id === 'cli.snapshot'));
    assert.ok(manifestEnvelope.data.capabilities.some(c => c.id === 'cli.impact'));
    assert.ok(manifestEnvelope.data.capabilities.some(c => c.id === 'cli.seal'));
    assert.ok(manifestEnvelope.data.capabilities.some(c => c.id === 'cli.verifySeal'));
    assert.ok(manifestEnvelope.data.capabilities.some(c => c.id === 'module.integritySeal'));
    const controlTypes = new Set(['observation', 'blocking_precondition', 'analytical_state', 'publication_gate', 'projection']);
    assert.ok(manifestEnvelope.data.capabilities.every(capability => controlTypes.has(capability.control_type)));

    const impact = runCli(['impact', 'module.entityResolver']);
    assert.equal(impact.code, 0, `expected impact exit 0, got ${impact.code}\nstdout: ${impact.stdout}`);
    const impactEnvelope = JSON.parse(impact.stdout);
    assert.deepEqual(impactEnvelope.data.layers_changed, ['L2']);
    assert.equal(impactEnvelope.data.contracts_changed[0].capability_id, 'module.entityResolver');
    assert.ok(impactEnvelope.data.downstream_consumers.includes('analysis'));
    assert.ok(impactEnvelope.data.verification.includes('npx vitest run tests/node/entity-resolution.test.js'));
    assert.ok(impactEnvelope.data.contract_docs.includes('docs/AGENT-OPERATING-MODEL.md'));

    const snapshot = runCli(['snapshot', SAMPLE_MULTI]);
    assert.equal(snapshot.code, 0, `expected snapshot exit 0, got ${snapshot.code}\nstdout: ${snapshot.stdout}`);
    const snapshotEnvelope = JSON.parse(snapshot.stdout);
    assert.equal(snapshotEnvelope.ok, true);
    assert.equal(snapshotEnvelope.data.control_type, 'observation');
    assert.equal(snapshotEnvelope.data.publication.authority, 'CanonicalReport.canExport()');
    assert.equal(snapshotEnvelope.data.publication.can_export, true);
    assert.equal(snapshotEnvelope.data.analysis.per_family['demo-covenant-family'].family_status, 'cl_detected');
    assert.ok(!JSON.stringify(snapshotEnvelope.data).includes('0.75'), 'agent projection must not duplicate scoring thresholds');

    const dir = mkdtempSync(join(tmpdir(), 'riwaq-cli-unresolved-'));
    const unresolvedFile = join(dir, 'unresolved.json');
    writeFileSync(unresolvedFile, JSON.stringify(PARTIAL_MINIMAL), 'utf8');
    const unresolvedSnapshot = JSON.parse(runCli(['snapshot', unresolvedFile]).stdout);
    assert.ok(unresolvedSnapshot.data.sharp_edges.applicable.includes('anti_hallucination_is_stricter_for_undeclared_narrators'));
    assert.ok(!unresolvedSnapshot.data.sharp_edges.applicable.includes('unresolved_narrator_warning_does_not_autocreate_profile'));

    const weightedSnapshot = JSON.parse(runCli(['snapshot', SAMPLE_MULTI, '--profile', 'reliability_weighted', '--with-reliability']).stdout);
    assert.ok(weightedSnapshot.data.analysis.reliability_layer_used);
    assert.ok(!weightedSnapshot.data.sharp_edges.applicable.includes('reliability_blend_key_mismatch_keeps_prior_neutral'));
  });

  it('integrity manifest verifies canonical input and detects source tampering', () => {
    const firstSeal = runCli(['seal', SAMPLE]);
    const secondSeal = runCli(['seal', SAMPLE]);
    assert.equal(firstSeal.code, 0, `expected seal exit 0, got ${firstSeal.code}\nstdout: ${firstSeal.stdout}`);
    assert.equal(secondSeal.code, 0);
    const firstEnvelope = JSON.parse(firstSeal.stdout);
    const secondEnvelope = JSON.parse(secondSeal.stdout);
    assert.deepEqual(firstEnvelope.data, secondEnvelope.data);

    const dir = mkdtempSync(join(tmpdir(), 'riwaq-cli-integrity-'));
    const manifestFile = join(dir, 'integrity-manifest.json');
    writeFileSync(manifestFile, JSON.stringify(firstEnvelope.data), 'utf8');

    const verified = runCli(['verify-seal', SAMPLE, '--manifest', manifestFile]);
    assert.equal(verified.code, 0, `expected verify-seal exit 0, got ${verified.code}\nstdout: ${verified.stdout}`);
    assert.equal(JSON.parse(verified.stdout).data.valid, true);

    const tamperedBatch = JSON.parse(readFileSync(SAMPLE, 'utf8'));
    tamperedBatch.records[0].source_ref.source_locator += '-tampered';
    const tamperedFile = join(dir, 'tampered.json');
    writeFileSync(tamperedFile, JSON.stringify(tamperedBatch), 'utf8');
    const rejected = runCli(['verify-seal', tamperedFile, '--manifest', manifestFile]);
    assert.equal(rejected.code, 1, `expected verify-seal exit 1, got ${rejected.code}\nstdout: ${rejected.stdout}`);
    const rejectedEnvelope = JSON.parse(rejected.stdout);
    assert.equal(rejectedEnvelope.data.valid, false);
    assert.deepEqual(rejectedEnvelope.data.altered_entries.map(entry => entry.record_id), [tamperedBatch.records[0].hadith_id]);
  });
});
