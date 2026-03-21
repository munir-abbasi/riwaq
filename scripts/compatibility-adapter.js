/**
 * scripts/compatibility-adapter.js
 *
 * Converts legacy single-chain localStorage payloads (v0) to the canonical
 * family/variant format (v1) described in docs/SCHEMA-VERSIONING.md.
 *
 * Public API:
 *   migrateToV1(legacyPayload)  → v1Payload | throws
 *   detectVersion(payload)     → 0 | 1 | null
 *   MIGRATIONS                → Map<number, Function>  (version → migrator)
 */

/**
 * Detect schema version of a payload.
 * @param {any} payload
 * @returns {0 | 1 | null}
 */
function detectVersion(payload) {
  if (payload && typeof payload._schema_version === 'number') {
    return payload._schema_version;
  }
  if (Array.isArray(payload?.narrators)) {
    return 0;
  }
  return null;
}

/**
 * Generate a stable ID for legacy narrators that preserves identity
 * across re-migrations using a deterministic scheme.
 * @param {number} index
 * @param {string} rawName
 * @returns {string}
 */
function deriveNarratorId(index, rawName) {
  const normalized = String(rawName || '').trim().toLowerCase().replace(/\s+/g, '-');
  const base = normalized || `narrator-${index}`;
  return `legacy:${base}:i${index}`;
}

/**
 * Migrate a v0 payload to v1.
 * @param {object} v0 - Legacy payload: { narrators: [], draftLocations: [], draftTags: [] }
 * @returns {object} v1 payload
 */
function migrateToV1(v0) {
  if (!v0 || !Array.isArray(v0.narrators)) {
    throw new Error('Invalid v0 payload: expected { narrators: [...] }');
  }

  const now = new Date().toISOString();
  const variantId = 'legacy-variant-0';
  const familyId = 'legacy-family-0';

  const narrators = v0.narrators.map((n, i) => ({
    narrator_id: deriveNarratorId(i, n.raw || n.name || ''),
    names: [n.name || n.raw || 'Unknown'].filter(Boolean),
    kunya: n.kunya || null,
    layla: n.layla || null,
    birth: n.birth || null,
    death: n.death || null,
    biographical_notes: n.biographical_notes || n.notes || null,
    locations: Array.isArray(n.locations) ? n.locations : [],
    tags: Array.isArray(n.tags) ? n.tags : [],
    reliability_evidence: [],
  }));

  const chainOrder = v0.narrators
    .map((_, i) => deriveNarratorId(i, v0.narrators[i].raw || v0.narrators[i].name || ''));

  const variant = {
    variant_id: variantId,
    isnad_chain: chainOrder,
    isnad_raw: null,
    matn_raw: v0.matn_raw || null,
    metadata: {
      migrated_from_legacy: true,
      original_narrators_count: v0.narrators.length,
    },
  };

  const family = {
    hadith_family_id: familyId,
    title: null,
    source_ref: null,
    variants: [variant],
    narrators: narrators,
    analyses: [],
  };

  return {
    _schema_version: 1,
    _meta: {
      created_at: now,
      migrated_at: now,
      from_version: 0,
      last_modified: now,
    },
    hadith_families: [family],
    workspace: {
      active_family_id: familyId,
      ui_state: {},
    },
  };
}

/** Migration registry: version → migrator function */
const MIGRATIONS = new Map([[0, migrateToV1]]);

/**
 * Apply the correct migration chain to reach the current schema version.
 * @param {any} payload
 * @returns {object} current-version payload
 */
function migrateToCurrent(payload) {
  const detected = detectVersion(payload);
  if (detected === null) {
    throw new Error('Unknown payload format; cannot migrate');
  }
  if (detected === 1) {
    return payload;
  }
  const migrator = MIGRATIONS.get(detected);
  if (!migrator) {
    throw new Error(`No migration available for version ${detected}`);
  }
  return migrator(payload);
}

/**
 * Wrap loadState to auto-migrate legacy payloads.
 * @param {string} storageKey
 * @returns {object|null}
 */
function loadMigrated(storageKey = 'hadith-chain-builder-v2') {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return migrateToCurrent(parsed);
  } catch (e) {
    console.warn('CompatibilityAdapter: migration failed, returning raw payload', e);
    return null;
  }
}

export { detectVersion, migrateToV1, migrateToCurrent, loadMigrated, MIGRATIONS };
export default { detectVersion, migrateToV1, migrateToCurrent, loadMigrated, MIGRATIONS };
