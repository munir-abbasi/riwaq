#!/usr/bin/env node
/**
 * verify-golden.mjs — regenerate the canonical report for the committed golden
 * input and diff it against the committed expectation (PLAN Phase 4).
 *
 * Pipeline: tests/fixtures/golden/input.json
 *   -> validateBatch (fail-closed on invalid input)
 *   -> CanonicalReport.fromBatch(normalized, structural_only)
 *   -> toJSON()
 *   -> scrub volatile ISO-8601 `.sssZ` timestamps (same rule as
 *      tests/node/phase6.test.js stripTimestamps)
 *   -> sorted-key canonical stringify + sha256
 *   -> byte-compare against tests/fixtures/golden/expected.json
 *      (whitespace/indent independent: both sides canonically stringified)
 *
 * Envelope/exit conventions follow scripts/riwaq-cli.mjs:
 *   0 match (or --update written), 1 mismatch/missing/invalid input or
 *   expectation, 2 usage.
 *
 * Usage: node scripts/verify-golden.mjs [--update]
 */

import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync, writeSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { validateBatch } from './json-validator.js';
import { CanonicalReport } from './canonical-report.js';

const EXIT_OK = 0;
const EXIT_FAILED = 1;
const EXIT_USAGE = 2;

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const INPUT_PATH = join(REPO_ROOT, 'tests', 'fixtures', 'golden', 'input.json');
const EXPECTED_PATH = join(REPO_ROOT, 'tests', 'fixtures', 'golden', 'expected.json');
const PROFILE = 'structural_only';

function print(envelope, exitCode) {
  writeSync(1, JSON.stringify(envelope, null, 2) + '\n');
  process.exit(exitCode);
}

function usageError(message) {
  print(
    { ok: false, error: { code: 'USAGE', message, usage: 'node scripts/verify-golden.mjs [--update]' } },
    EXIT_USAGE
  );
}

function fail(message, extra = {}) {
  print({ ok: false, command: 'verify-golden', error: { code: 'FAILED', message, ...extra } }, EXIT_FAILED);
}

/** Same volatile-timestamp rule as tests/node/phase6.test.js (stripTimestamps). */
function stripTimestamps(obj) {
  return JSON.parse(
    JSON.stringify(obj, (_key, value) => {
      if (typeof value === 'string' && /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z/.test(value)) {
        return '[TIMESTAMP]';
      }
      return value;
    })
  );
}

/** Sorted-key canonical stringify: whitespace- and construction-order-stable. */
function canonicalStringify(value) {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalStringify).join(',')}]`;
  const keys = Object.keys(value).sort();
  return `{${keys.map(key => `${JSON.stringify(key)}:${canonicalStringify(value[key])}`).join(',')}}`;
}

/** Deep key-sort so the committed expectation is readable and diff-friendly. */
function sortKeysDeep(value) {
  if (value === null || typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.map(sortKeysDeep);
  const sorted = {};
  for (const key of Object.keys(value).sort()) sorted[key] = sortKeysDeep(value[key]);
  return sorted;
}

function sha256(text) {
  return createHash('sha256').update(text, 'utf8').digest('hex');
}

function readJson(file, label) {
  if (!existsSync(file)) return { error: `${label} not found: ${file}` };
  try {
    return { value: JSON.parse(readFileSync(file, 'utf8')) };
  } catch (cause) {
    return { error: `${label} is not parseable JSON: ${file} (${cause.message})` };
  }
}

function generateActual() {
  const input = readJson(INPUT_PATH, 'golden input');
  if (input.error) fail(input.error, { code: 'INVALID_INPUT' });

  const { valid, collector, normalized } = validateBatch(input.value);
  if (!valid || !normalized) {
    fail('golden input failed schema validation', {
      code: 'INVALID_INPUT',
      errors: collector.errors,
    });
  }

  const report = CanonicalReport.fromBatch(normalized, { profile: PROFILE });
  const stripped = stripTimestamps(report.toJSON());
  const canonical = canonicalStringify(stripped);
  return { canonical, digest: sha256(canonical), pretty: `${JSON.stringify(sortKeysDeep(stripped), null, 2)}\n` };
}

const args = process.argv.slice(2);
for (const arg of args) {
  if (arg !== '--update') usageError(`Unknown argument: ${arg}`);
}
const update = args.includes('--update');

const actual = generateActual();

if (update) {
  writeFileSync(EXPECTED_PATH, actual.pretty);
  print(
    {
      ok: true,
      command: 'verify-golden',
      data: { updated: true, sha256: actual.digest, expected: 'tests/fixtures/golden/expected.json' },
    },
    EXIT_OK
  );
}

const expected = readJson(EXPECTED_PATH, 'golden expectation');
if (expected.error) {
  fail(`${expected.error} — run \`npm run verify:golden -- --update\` to create it`, {
    code: 'MISSING_OR_INVALID_EXPECTATION',
  });
}

const expectedDigest = sha256(canonicalStringify(expected.value));
if (expectedDigest !== actual.digest) {
  const actualFile = join(tmpdir(), 'golden-actual.json');
  writeFileSync(actualFile, actual.pretty);
  fail('canonical output does not match the committed expectation', {
    code: 'MISMATCH',
    expected_sha256: expectedDigest,
    actual_sha256: actual.digest,
    actual_file: actualFile,
  });
}

print(
  {
    ok: true,
    command: 'verify-golden',
    data: {
      matched: true,
      sha256: actual.digest,
      input: 'tests/fixtures/golden/input.json',
      expected: 'tests/fixtures/golden/expected.json',
    },
  },
  EXIT_OK
);
