#!/usr/bin/env node
/**
 * release-evidence.mjs — emit the release-evidence bundle (PLAN Phase 5).
 *
 * Bundle fields, all derived from live sources:
 *   - commit (rev-parse HEAD) + dirty flag (status --porcelain)
 *   - tag (git describe --exact-match; null when HEAD is untagged)
 *   - test_command: 'npm run check'
 *   - test_counts from the vitest JSON report passed via --test-report
 *   - schema_version (json-validator SCHEMA_VERSION)
 *   - engines.node (package.json)
 *   - sha256: academic/index.html, golden input, golden expected, package-lock.json
 *   - license detected from LICENSE (Apache-2.0 when matched, else null)
 *   - repository URL (git remote get-url origin)
 *   - generated_at (ISO-8601) — the ONLY volatile field; determinism checks
 *     must exclude it.
 *
 * Envelope/exit conventions follow scripts/riwaq-cli.mjs:
 *   0 emitted, 1 evidence incomplete (bad/missing report, git failure),
 *   2 usage.
 *
 * Usage: node scripts/release-evidence.mjs --test-report <vitest-json>
 */

import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, writeSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { SCHEMA_VERSION } from './json-validator.js';

const EXIT_OK = 0;
const EXIT_FAILED = 1;
const EXIT_USAGE = 2;

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const TEST_COMMAND = 'npm run check';

function print(envelope, exitCode) {
  writeSync(1, JSON.stringify(envelope, null, 2) + '\n');
  process.exit(exitCode);
}

function usageError(message) {
  print(
    { ok: false, error: { code: 'USAGE', message, usage: 'node scripts/release-evidence.mjs --test-report <vitest-json>' } },
    EXIT_USAGE
  );
}

function fail(message, extra = {}) {
  print({ ok: false, command: 'release-evidence', error: { code: 'FAILED', message, ...extra } }, EXIT_FAILED);
}

function git(argv) {
  const res = spawnSync('git', argv, { cwd: REPO_ROOT, encoding: 'utf8' });
  if (res.status !== 0) {
    fail(`git ${argv.join(' ')} failed`, { code: 'GIT_ERROR', detail: (res.stderr || '').trim() });
  }
  return res.stdout.trim();
}

function gitTagOrNull() {
  const res = spawnSync('git', ['describe', '--tags', '--exact-match', 'HEAD'], {
    cwd: REPO_ROOT,
    encoding: 'utf8',
  });
  return res.status === 0 ? res.stdout.trim() : null;
}

function sha256File(relPath) {
  const abs = join(REPO_ROOT, relPath);
  if (!existsSync(abs)) fail(`file not found for hashing: ${relPath}`, { code: 'MISSING_FILE' });
  return createHash('sha256').update(readFileSync(abs)).digest('hex');
}

function readJsonFile(relPath, code) {
  const abs = join(REPO_ROOT, relPath);
  if (!existsSync(abs)) fail(`file not found: ${relPath}`, { code });
  try {
    return JSON.parse(readFileSync(abs, 'utf8'));
  } catch (cause) {
    fail(`not parseable JSON: ${relPath} (${cause.message})`, { code });
  }
}

function readTestCounts(reportPath) {
  if (!existsSync(reportPath)) fail(`test report not found: ${reportPath}`, { code: 'MISSING_TEST_REPORT' });
  let report;
  try {
    report = JSON.parse(readFileSync(reportPath, 'utf8'));
  } catch (cause) {
    fail(`test report is not parseable JSON: ${reportPath} (${cause.message})`, { code: 'MALFORMED_TEST_REPORT' });
  }
  const counts = {
    total: report.numTotalTests,
    passed: report.numPassedTests,
    failed: report.numFailedTests,
    success: report.success,
  };
  if (
    !Number.isFinite(counts.total) ||
    !Number.isFinite(counts.passed) ||
    !Number.isFinite(counts.failed) ||
    typeof counts.success !== 'boolean'
  ) {
    fail(`test report lacks vitest count fields: ${reportPath}`, { code: 'MALFORMED_TEST_REPORT' });
  }
  return counts;
}

function detectLicense() {
  const abs = join(REPO_ROOT, 'LICENSE');
  if (!existsSync(abs)) return null;
  const text = readFileSync(abs, 'utf8');
  return text.includes('Apache License') && text.includes('Version 2.0') ? 'Apache-2.0' : null;
}

const args = process.argv.slice(2);
let testReportPath = null;
for (let i = 0; i < args.length; i += 1) {
  if (args[i] === '--test-report') {
    i += 1;
    if (i >= args.length) usageError('--test-report requires a path');
    testReportPath = args[i];
  } else {
    usageError(`Unknown argument: ${args[i]}`);
  }
}
if (!testReportPath) usageError('Missing required argument: --test-report <vitest-json>');

const pkg = readJsonFile('package.json', 'MISSING_PACKAGE');

const bundle = {
  commit: git(['rev-parse', 'HEAD']),
  dirty: git(['status', '--porcelain']).length > 0,
  tag: gitTagOrNull(),
  test_command: TEST_COMMAND,
  test_counts: readTestCounts(testReportPath),
  schema_version: SCHEMA_VERSION,
  engines: { node: pkg.engines?.node ?? null },
  hashes: {
    academic_index_html: sha256File('academic/index.html'),
    golden_input: sha256File('tests/fixtures/golden/input.json'),
    golden_expected: sha256File('tests/fixtures/golden/expected.json'),
    package_lock: sha256File('package-lock.json'),
  },
  license: detectLicense(),
  repository: git(['remote', 'get-url', 'origin']),
  generated_at: new Date().toISOString(),
};

print({ ok: true, command: 'release-evidence', data: bundle }, EXIT_OK);
