/**
 * scripts/integrity-seal.js
 *
 * Deterministic integrity manifests for canonical import batches. A manifest
 * detects changes relative to a separately retained baseline; it does not
 * authenticate a source or replace provenance review.
 */
import { createHash } from 'node:crypto';

export const INTEGRITY_MANIFEST_VERSION = 1;
export const INTEGRITY_ALGORITHM = 'sha256';

function canonicalizeJson(value) {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalizeJson).join(',')}]`;
  const keys = Object.keys(value).sort();
  return `{${keys.map(key => `${JSON.stringify(key)}:${canonicalizeJson(value[key])}`).join(',')}}`;
}

function digestJson(value) {
  const jsonValue = JSON.parse(JSON.stringify(value));
  return createHash(INTEGRITY_ALGORITHM).update(canonicalizeJson(jsonValue)).digest('hex');
}

function collectCanonicalRecords(batch) {
  const records = [{
    record_type: 'batch_metadata',
    record_id: 'batch',
    value: { schema_version: batch.schema_version, imported_at: batch.imported_at },
  }];

  for (const record of (batch.records || [])) {
    records.push({ record_type: 'hadith_record', record_id: record.hadith_id, value: record });
  }
  for (const narrator of (batch.narrators || [])) {
    records.push({ record_type: 'narrator_profile', record_id: narrator.narrator_id, value: narrator });
  }
  return records.sort((a, b) => `${a.record_type}:${a.record_id}`.localeCompare(`${b.record_type}:${b.record_id}`));
}

function entryKey(entry) {
  return `${entry.record_type}\u0000${entry.record_id}`;
}

function validateManifest(manifest) {
  const errors = [];
  if (!manifest || typeof manifest !== 'object') errors.push('manifest must be an object');
  if (manifest?.manifest_version !== INTEGRITY_MANIFEST_VERSION) errors.push('unsupported manifest_version');
  if (manifest?.algorithm !== INTEGRITY_ALGORITHM) errors.push('unsupported algorithm');
  if (manifest?.scope !== 'canonical_import_batch') errors.push('unsupported scope');
  if (!Array.isArray(manifest?.entries)) {
    errors.push('entries must be an array');
    return errors;
  }

  const keys = new Set();
  for (const entry of manifest.entries) {
    if (!entry || typeof entry.record_type !== 'string' || typeof entry.record_id !== 'string') {
      errors.push('each entry requires record_type and record_id');
      continue;
    }
    if (!/^[a-f0-9]{64}$/.test(entry.digest || '')) errors.push(`invalid digest for ${entry.record_type}:${entry.record_id}`);
    const key = entryKey(entry);
    if (keys.has(key)) errors.push(`duplicate entry ${entry.record_type}:${entry.record_id}`);
    keys.add(key);
  }
  return errors;
}

export function createIntegrityManifest(batch) {
  return {
    manifest_version: INTEGRITY_MANIFEST_VERSION,
    algorithm: INTEGRITY_ALGORITHM,
    scope: 'canonical_import_batch',
    schema_version: batch.schema_version,
    entries: collectCanonicalRecords(batch).map(record => ({
      record_type: record.record_type,
      record_id: record.record_id,
      digest: digestJson(record.value),
    })),
  };
}

export function verifyIntegrityManifest(batch, manifest) {
  const manifestErrors = validateManifest(manifest);
  if (manifest?.schema_version !== batch.schema_version) manifestErrors.push('schema_version does not match batch');
  if (manifestErrors.length > 0) {
    return {
      valid: false,
      manifest_errors: manifestErrors,
      checked_count: 0,
      altered_entries: [],
      missing_entries: [],
      unexpected_entries: [],
    };
  }

  const current = createIntegrityManifest(batch);
  const expectedByKey = new Map(manifest.entries.map(entry => [entryKey(entry), entry]));
  const currentByKey = new Map(current.entries.map(entry => [entryKey(entry), entry]));
  const missingEntries = manifest.entries.filter(entry => !currentByKey.has(entryKey(entry)));
  const unexpectedEntries = current.entries.filter(entry => !expectedByKey.has(entryKey(entry)));
  const alteredEntries = manifest.entries.filter(entry => {
    const actual = currentByKey.get(entryKey(entry));
    return actual && actual.digest !== entry.digest;
  }).map(entry => ({
    record_type: entry.record_type,
    record_id: entry.record_id,
  }));

  return {
    valid: manifestErrors.length === 0 && missingEntries.length === 0 && unexpectedEntries.length === 0 && alteredEntries.length === 0,
    manifest_errors: [],
    checked_count: manifest.entries.length,
    altered_entries: alteredEntries,
    missing_entries: missingEntries.map(({ record_type, record_id }) => ({ record_type, record_id })),
    unexpected_entries: unexpectedEntries.map(({ record_type, record_id }) => ({ record_type, record_id })),
  };
}

export default { createIntegrityManifest, verifyIntegrityManifest };
