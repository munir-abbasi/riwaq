#!/usr/bin/env node
/**
 * scripts/riwaq-cli.mjs
 *
 * Riwaq Control CLI — a thin, deterministic projection of the public module APIs.
 *
 * Design constraints (docs/DECISIONS.md D009/D010):
 *   - Zero analytical logic. Every command wraps an existing public API.
 *   - Deterministic envelope shape: { ok, command, file?, data?, error? }.
 *   - Stable exit codes: 0 = ok, 1 = validation/export failure, 2 = usage error.
 *   - `pipeline` and `report` refuse to export when CanonicalReport.canExport() is false.
 *   - The reliability blend is an explicit caller opt-in (see D007 and the
 *     --reliability flag on `report`); absent a layer, the prior is a flat 0.50.
 *
 * Commands:
 *   validate <file>                    Schema/provenance validation (json-validator)
 *   gates <file> [--min-score N]       Preflight quality gates (preflight-gates)
 *   hallucination <file>               Pre-analysis integrity sweep (anti-hallucination)
 *   analyze <file> [--profile P] [--with-reliability]   Raw candidate analysis (clpcl-analyzer)
 *   report <file> [--profile P] [--with-reliability]    Canonical report + canExport gate
 *   pipeline <file> [--profile P] [--with-reliability]  One-shot validate → gates → AH → report
 *   artifacts <file> [--family ID]     Machine-readable artifact bundle (artifacts.js)
 *   export <file> --format md|docx|pdf [--out PATH] [--profile P] [--with-reliability]
 *   families <file>                    List family IDs with per-family gate state
 *   manifest                           Machine-readable capability/contract manifest
 *   snapshot <file> [--profile P] [--with-reliability]  Compact cross-layer state packet
 *   impact <capability-id> [...]       Minimal semantic-impact route
 *   seal <file>                        Deterministic integrity manifest
 *   verify-seal <file> --manifest PATH Verify against a retained integrity manifest
 *
 * Run: node scripts/riwaq-cli.mjs <command> <file> [options]
 * Or:  npm run cli -- <command> <file> [options]
 */
import { readFileSync, writeFileSync, writeSync } from 'node:fs';
import { resolve } from 'node:path';

import { validateBatch } from './json-validator.js';
import { evaluateGates } from './preflight-gates.js';
import { AntiHallucinationValidator } from './anti-hallucination.js';
import { analyzeBatch, ANALYSIS_PROFILE } from './clpcl-analyzer.js';
import { ReliabilityLayer } from './reliability-layer.js';
import { CanonicalReport } from './canonical-report.js';
import { emitArtifacts } from './artifacts.js';
import { exportMarkdown } from './export-md.js';
import { exportDOCX } from './export-docx.js';
import { getCapabilityManifest, buildAgentStateSnapshot, buildSemanticImpactRoute } from './agent-control.js';
import { createIntegrityManifest, verifyIntegrityManifest } from './integrity-seal.js';

const EXIT_OK = 0;
const EXIT_FAILED = 1;
const EXIT_USAGE = 2;

const PROFILES = new Set(Object.values(ANALYSIS_PROFILE));

function print(envelope, exitCode) {
  writeSync(1, JSON.stringify(envelope, null, 2) + '\n');
  process.exit(exitCode);
}

function usageError(message, usage) {
  print({ ok: false, error: { code: 'USAGE', message, usage: usage || null } }, EXIT_USAGE);
}

function fail(command, message, extra = {}) {
  print({ ok: false, command, error: { code: extra.code || 'FAILED', message, ...extra } }, EXIT_FAILED);
}

function loadBatch(file, command) {
  if (!file) usageError(`Missing <file> argument`, `${command} <file> [options]`);
  let raw;
  try {
    raw = readFileSync(resolve(file), 'utf8');
  } catch (e) {
    fail(command, `Cannot read file: ${e.message}`, { code: 'FILE_READ_ERROR' });
  }
  const { valid, collector, normalized } = validateBatch(raw);
  return { valid, collector, normalized };
}

function parseProfile(value, command) {
  if (value === undefined) return ANALYSIS_PROFILE.STRUCTURAL_ONLY;
  if (!PROFILES.has(value)) {
    usageError(`Unknown profile "${value}". Valid: ${[...PROFILES].join(', ')}`, command);
  }
  return value;
}

/**
 * D007: the reliability layer is an explicit caller opt-in. The flag mirrors
 * the programmatic contract; its absence means a flat 0.50 prior.
 */
function buildReliabilityLayer(normalized, withReliability, command) {
  if (!withReliability) return null;
  if (!normalized) fail(command, 'Cannot build reliability layer: batch failed validation', { code: 'INVALID_INPUT' });
  return new ReliabilityLayer().seedFromBatch(normalized);
}

function gateSummary(collector) {
  const report = collector.toReport();
  return { error_count: report.summary.error_count, warning_count: report.summary.warning_count, errors: report.errors, warnings: report.warnings };
}

// ---------------------------------------------------------------------------
// Commands
// ---------------------------------------------------------------------------

function cmdValidate(file) {
  const { valid, collector } = loadBatch(file, 'validate');
  print({
    ok: valid,
    command: 'validate',
    file,
    data: { valid, ...gateSummary(collector) },
  }, valid ? EXIT_OK : EXIT_FAILED);
}

function cmdGates(file, minScore) {
  const { valid, collector, normalized } = loadBatch(file, 'gates');
  if (!valid) fail('gates', 'Batch failed schema validation; quality gates require a valid batch', { code: 'INVALID_INPUT', validation: gateSummary(collector) });
  const collector2 = collector; // evaluateGates appends to the same collector
  const { passed, qualityScore, gateResults } = evaluateGates(normalized, collector2);
  print({
    ok: passed && qualityScore >= (minScore ?? 0),
    command: 'gates',
    file,
    data: { passed, qualityScore, min_score: minScore ?? 0, gates: gateResults },
  }, passed && qualityScore >= (minScore ?? 0) ? EXIT_OK : EXIT_FAILED);
}

function cmdHallucination(file) {
  const { valid, collector, normalized } = loadBatch(file, 'hallucination');
  if (!valid) fail('hallucination', 'Batch failed schema validation; integrity sweep requires a valid batch', { code: 'INVALID_INPUT', validation: gateSummary(collector) });
  const result = AntiHallucinationValidator.fromBatch(normalized).validate();
  const report = result.toReport();
  print({
    ok: report.can_proceed,
    command: 'hallucination',
    file,
    data: report,
    note: 'Stricter than schema validation: undeclared chain narrators are blocking here and warning-only in validate.',
  }, report.can_proceed ? EXIT_OK : EXIT_FAILED);
}

function cmdAnalyze(file, profile, withReliability) {
  const { valid, collector, normalized } = loadBatch(file, 'analyze');
  if (!valid) fail('analyze', 'Batch failed schema validation', { code: 'INVALID_INPUT', validation: gateSummary(collector) });
  const layer = buildReliabilityLayer(normalized, withReliability, 'analyze');
  const result = analyzeBatch(normalized, profile, layer);
  print({
    ok: true,
    command: 'analyze',
    file,
    data: {
      family_status: result.family_status,
      profile: result.profile,
      candidate_count: result.candidate_count,
      candidates: result.candidates,
      reliability_layer_used: withReliability,
    },
  }, EXIT_OK);
}

function reportPayload(file, profile, withReliability) {
  const { valid, collector, normalized } = loadBatch(file, 'report');
  if (!valid) fail('report', 'Batch failed schema validation', { code: 'INVALID_INPUT', validation: gateSummary(collector) });
  const layer = buildReliabilityLayer(normalized, withReliability, 'report');
  const report = CanonicalReport.fromBatch(normalized, { profile, reliabilityLayer: layer });
  const familyIds = report.getFamilyIds();
  const perFamily = {};
  for (const fid of familyIds) {
    const vr = report.getValidationResult(fid);
    perFamily[fid] = vr ? { analysis_can_proceed: vr.analysis_can_proceed, violation_count: (vr.violations || []).filter(v => v.level === 'blocking').length } : { analysis_can_proceed: true, violation_count: 0 };
  }
  return { report, familyIds, perFamily };
}

function cmdReport(file, profile, withReliability) {
  const { report, familyIds, perFamily } = reportPayload(file, profile, withReliability);
  const canExport = report.canExport();
  const d = report.getReportData();
  print({
    ok: canExport,
    command: 'report',
    file,
    data: {
      can_export: canExport,
      family_ids: familyIds,
      families: d.families,
      per_family: perFamily,
      profile: d.analysis.profile,
      family_status: d.analysis.family_status,
      candidate_count: d.analysis.candidate_count,
      candidates: d.candidates,
      blocking_violations: d.evidence_binding.blocking_violations,
    },
  }, canExport ? EXIT_OK : EXIT_FAILED);
}

function cmdPipeline(file, profile, withReliability) {
  const { valid, collector, normalized } = loadBatch(file, 'pipeline');
  if (!valid) fail('pipeline', 'Batch failed schema validation', { code: 'VALIDATION_FAILED', validation: gateSummary(collector) });

  const { passed, qualityScore, gateResults } = evaluateGates(normalized);
  const ah = AntiHallucinationValidator.fromBatch(normalized).validate();
  const ahReport = ah.toReport();
  const layer = buildReliabilityLayer(normalized, withReliability, 'pipeline');
  const report = CanonicalReport.fromBatch(normalized, { profile, reliabilityLayer: layer });
  const canExport = report.canExport();
  const d = report.getReportData();
  const familyIds = report.getFamilyIds();
  const perFamily = {};
  for (const fid of familyIds) {
    const vr = report.getValidationResult(fid);
    perFamily[fid] = vr ? { analysis_can_proceed: vr.analysis_can_proceed, violation_count: (vr.violations || []).filter(v => v.level === 'blocking').length } : { analysis_can_proceed: true, violation_count: 0 };
  }

  print({
    ok: canExport,
    command: 'pipeline',
    file,
    data: {
      stages: {
        validation: { control_type: 'blocking_precondition', passed: true, warnings: collector.warningCount },
        quality_gates: { control_type: 'observation', passed, quality_score: qualityScore, gates: gateResults },
        anti_hallucination: { control_type: 'observation', valid: ahReport.valid, can_proceed: ahReport.can_proceed, violations: ahReport.violations, warnings: ahReport.warnings },
      },
      report: {
        control_type: 'publication_gate',
        authority: 'CanonicalReport.canExport()',
        can_export: canExport,
        family_ids: familyIds,
        per_family: perFamily,
        profile: d.analysis.profile,
        family_status: d.analysis.family_status,
        candidate_count: d.analysis.candidate_count,
        candidates: d.candidates,
        blocking_violations: d.evidence_binding.blocking_violations,
      },
      reliability_layer_used: withReliability,
    },
  }, canExport ? EXIT_OK : EXIT_FAILED);
}

function cmdArtifacts(file, familyId) {
  const { valid, collector, normalized } = loadBatch(file, 'artifacts');
  if (!valid) fail('artifacts', 'Batch failed schema validation', { code: 'INVALID_INPUT', validation: gateSummary(collector) });
  const familyIds = [...new Set(normalized.records.map(r => r.family_id))];
  const fid = familyId || familyIds[0];
  if (!fid) fail('artifacts', 'No family IDs found in batch', { code: 'EMPTY_BATCH' });
  if (!familyIds.includes(fid)) fail('artifacts', `Unknown family_id "${fid}". Available: ${familyIds.join(', ')}`, { code: 'UNKNOWN_FAMILY' });
  const result = analyzeBatch(normalized, ANALYSIS_PROFILE.STRUCTURAL_ONLY, null);
  print({
    ok: true,
    command: 'artifacts',
    file,
    data: { family_id: fid, ...emitArtifacts(normalized, result, fid) },
  }, EXIT_OK);
}

async function cmdExport(file, format, outPath, profile, withReliability) {
  if (!format || !['md', 'docx', 'pdf'].includes(format)) {
    usageError(`--format must be one of: md, docx, pdf`, 'export <file> --format md|docx|pdf [--out PATH]');
  }
  const { report } = reportPayload(file, profile, withReliability);
  if (!report.canExport()) {
    fail('export', 'Export blocked: CanonicalReport.canExport() is false. At least one family has a blocking evidence-binding violation. Inspect with: pipeline or report.', { code: 'EXPORT_BLOCKED' });
  }
  const d = report.getReportData();
  if (format === 'md') {
    const md = exportMarkdown(report);
    if (outPath) writeFileSync(resolve(outPath), md, 'utf8');
    else process.stdout.write(md);
    return;
  }
  if (format === 'docx') {
    const bytes = await exportDOCX(report);
    if (outPath) writeFileSync(resolve(outPath), Buffer.from(bytes));
    else fail('export', 'DOCX is binary; --out PATH is required for docx and pdf', { code: 'OUT_REQUIRED' });
    return;
  }
  // pdf
  const { exportPDF } = await import('./export-pdf.js');
  const bytes = await exportPDF(report);
  if (outPath) writeFileSync(resolve(outPath), Buffer.from(bytes));
  else fail('export', 'PDF is binary; --out PATH is required for docx and pdf', { code: 'OUT_REQUIRED' });
  void d;
}

function cmdFamilies(file) {
  const { valid, collector, normalized } = loadBatch(file, 'families');
  if (!valid) fail('families', 'Batch failed schema validation', { code: 'INVALID_INPUT', validation: gateSummary(collector) });
  const familyIds = [...new Set(normalized.records.map(r => r.family_id))];
  print({
    ok: true,
    command: 'families',
    file,
    data: {
      family_ids: familyIds,
      family_count: familyIds.length,
      record_count: normalized.records.length,
      variant_count: normalized.records.reduce((s, r) => s + (r.variants?.length || 0), 0),
      narrator_count: (normalized.narrators || []).length,
    },
  }, EXIT_OK);
}

function cmdManifest() {
  print({
    ok: true,
    command: 'manifest',
    data: getCapabilityManifest(),
  }, EXIT_OK);
}

function cmdImpact(capabilityIds) {
  const data = buildSemanticImpactRoute(capabilityIds);
  if (!data.valid) {
    const hasUnknown = data.unknown_capabilities.length > 0;
    print({
      ok: false,
      command: 'impact',
      error: {
        code: hasUnknown ? 'UNKNOWN_CAPABILITY' : 'USAGE',
        message: hasUnknown
          ? `Unknown capability: ${data.unknown_capabilities.join(', ')}`
          : 'At least one capability ID is required',
        unknown_capabilities: data.unknown_capabilities,
        available_capabilities: data.available_capabilities,
      },
    }, EXIT_USAGE);
  }
  print({ ok: true, command: 'impact', data }, EXIT_OK);
}

function cmdSnapshot(file, profile, withReliability) {
  const { valid, collector, normalized } = loadBatch(file, 'snapshot');
  if (!valid) fail('snapshot', 'Batch failed schema validation; snapshot requires a valid batch', { code: 'INVALID_INPUT', validation: gateSummary(collector) });
  const layer = buildReliabilityLayer(normalized, withReliability, 'snapshot');
  print({
    ok: true,
    command: 'snapshot',
    file,
    data: buildAgentStateSnapshot({
      normalized,
      collector,
      profile,
      reliabilityLayer: layer,
      reliabilityLayerUsed: !!withReliability,
    }),
  }, EXIT_OK);
}

function cmdSeal(file) {
  const { valid, collector, normalized } = loadBatch(file, 'seal');
  if (!valid) fail('seal', 'Batch failed schema validation; sealing requires a valid batch', { code: 'INVALID_INPUT', validation: gateSummary(collector) });
  print({
    ok: true,
    command: 'seal',
    file,
    data: createIntegrityManifest(normalized),
  }, EXIT_OK);
}

function loadIntegrityManifest(file) {
  if (!file) usageError('Missing --manifest argument', 'verify-seal <file> --manifest <path>');
  try {
    const parsed = JSON.parse(readFileSync(resolve(file), 'utf8'));
    return parsed?.command === 'seal' && parsed.data ? parsed.data : parsed;
  } catch (e) {
    fail('verify-seal', `Cannot read integrity manifest: ${e.message}`, { code: 'MANIFEST_READ_ERROR' });
  }
}

function cmdVerifySeal(file, manifestFile) {
  const { valid, collector, normalized } = loadBatch(file, 'verify-seal');
  if (!valid) fail('verify-seal', 'Batch failed schema validation; verification requires a valid batch', { code: 'INVALID_INPUT', validation: gateSummary(collector) });
  const data = verifyIntegrityManifest(normalized, loadIntegrityManifest(manifestFile));
  print({ ok: data.valid, command: 'verify-seal', file, data }, data.valid ? EXIT_OK : EXIT_FAILED);
}

// ---------------------------------------------------------------------------
// Argument parsing
// ---------------------------------------------------------------------------

function main() {
  const argv = process.argv.slice(2);
  const command = argv[0];
  const positional = [];
  const flags = {};
  for (let i = 1; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--profile') flags.profile = argv[++i];
    else if (a === '--with-reliability') flags.withReliability = true;
    else if (a === '--min-score') flags.minScore = Number(argv[++i]);
    else if (a === '--family') flags.family = argv[++i];
    else if (a === '--format') flags.format = argv[++i];
    else if (a === '--out') flags.out = argv[++i];
    else if (a === '--manifest') flags.manifest = argv[++i];
    else if (a === '--help' || a === '-h') { printUsage(); }
    else positional.push(a);
  }

  const file = positional[0];

  switch (command) {
    case 'validate': return cmdValidate(file);
    case 'gates': return cmdGates(file, flags.minScore);
    case 'hallucination': return cmdHallucination(file);
    case 'analyze': return cmdAnalyze(file, parseProfile(flags.profile, 'analyze'), flags.withReliability);
    case 'report': return cmdReport(file, parseProfile(flags.profile, 'report'), flags.withReliability);
    case 'pipeline': return cmdPipeline(file, parseProfile(flags.profile, 'pipeline'), flags.withReliability);
    case 'artifacts': return cmdArtifacts(file, flags.family);
    case 'export': return cmdExport(file, flags.format, flags.out, parseProfile(flags.profile, 'export'), flags.withReliability);
    case 'families': return cmdFamilies(file);
    case 'manifest': return cmdManifest();
    case 'impact': return cmdImpact(positional);
    case 'snapshot': return cmdSnapshot(file, parseProfile(flags.profile, 'snapshot'), flags.withReliability);
    case 'seal': return cmdSeal(file);
    case 'verify-seal': return cmdVerifySeal(file, flags.manifest);
    default:
      printUsage(command ? `Unknown command: ${command}` : 'No command given');
  }
}

function printUsage(message) {
  const usage = `Usage: node scripts/riwaq-cli.mjs <command> <file> [options]

Commands:
  validate <file>                     Schema/provenance validation
  gates <file> [--min-score N]        Preflight quality gates (score 0-100)
  hallucination <file>                Pre-analysis integrity sweep (strict)
  analyze <file> [--profile P] [--with-reliability]
  report <file> [--profile P] [--with-reliability]
  pipeline <file> [--profile P] [--with-reliability]   validate + gates + AH + report
  artifacts <file> [--family ID]      Machine-readable artifact bundle
  families <file>                     List family IDs and counts
  manifest                            Machine-readable capability/contract manifest
  impact <capability-id> [...]        Minimal semantic-impact route
  snapshot <file> [--profile P] [--with-reliability]   Compact cross-layer state packet
  seal <file>                         Deterministic integrity manifest
  verify-seal <file> --manifest PATH Verify against a retained integrity manifest
  export <file> --format md|docx|pdf [--out PATH] [--profile P] [--with-reliability]

Profiles: structural_only (default) | reliability_weighted
Exit codes: 0 ok · 1 validation/export failure · 2 usage error`;
  if (message) usageError(message, usage);
  print({ ok: true, usage }, EXIT_OK);
}

main();
