/**
 * scripts/entity-resolution.js
 *
 * Phase 2 — Narrator Entity Resolution
 *
 * Provides alias mapping, manual merge/split controls, and history-preserving
 * identity operations over a normalized batch of hadith records.
 *
 * All operations are logged as immutable events with durable receipts. The
 * current state and its audit trail can be reconstructed by replaying the log.
 *
 * Design invariants (enforced by tests):
 *   1. No orphan narrator IDs — every isnad_chain reference resolves to a canonical ID.
 *   2. Merge preserves all evidence links — no evidence is silently dropped.
 *   3. Split redistributes evidence explicitly — caller must provide the mapping.
 *   4. Reported and derived fields are never overwritten — only appended.
 *   5. Operation log is append-only and deterministic.
 *
 * Public API:
 *   EntityResolver.fromBatch(batch) → EntityResolver
 *   resolver.resolveName(name) → canonicalId | null
 *   resolver.merge(sourceId, targetId, evidenceRedistribute) → OperationRecord
 *   resolver.split(sourceId, targetA, targetB, evidenceRedistributeA, evidenceRedistributeB) → OperationRecord
 *   resolver.addAlias(alias, canonicalId) → OperationRecord
 *   resolver.applyLog(log) → EntityResolver  (replay from empty)
 *   resolver.getState() → { aliases, idMap, log }
 *   resolver.getCanonicalIds() → Set<string>
 *   resolver.remapBatch(batch) → remappedBatch  (applies all ops to a batch copy)
 */
export const OPERATION_TYPE = Object.freeze({
  ALIAS_ADD: 'ALIAS_ADD',
  MERGE: 'MERGE',
  SPLIT: 'SPLIT',
});

export const ENTITY_OPERATION_RECEIPT_VERSION = 1;

function cloneRecord(value) {
  return JSON.parse(JSON.stringify(value));
}

function makeOp(type, payload, receiptData) {
  const operationId = `op-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const timestamp = new Date().toISOString();
  const checks = receiptData.invariantChecks.map(check => ({ ...check }));
  return {
    operation_id: operationId,
    type,
    payload,
    timestamp,
    receipt: {
      receipt_version: ENTITY_OPERATION_RECEIPT_VERSION,
      operation_id: operationId,
      operation_type: type,
      inputs: cloneRecord(payload),
      affected_ids: [...receiptData.affectedIds],
      state_refs: {
        before: `entity-resolution-log:${receiptData.stateVersion}`,
        after: `entity-resolution-log:${receiptData.stateVersion + 1}`,
      },
      provenance: {
        status: receiptData.movements.length > 0 ? 'retained_and_moved' : 'not_applicable',
        movements: receiptData.movements.map(movement => ({ ...movement })),
      },
      invariant_checks: checks,
      verification: {
        status: checks.every(check => check.passed) ? 'passed' : 'failed',
      },
    },
  };
}

function evidenceMovements(evidence, fromId, toId) {
  return evidence.map(item => ({
    evidence_id: item.evidence_id,
    from_id: fromId,
    to_id: toId,
  }));
}

/**
 * Canonicalize a name string for alias lookup.
 * @param {string} name
 * @returns {string}
 */
export function normalizeAlias(name) {
  return String(name || '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/^(abu|ibn|al-|el-)/i, (m) => m.toLowerCase())
    .normalize('NFC')
    .toLowerCase();
}

export class EntityResolver {
  /**
   * Build a resolver from a normalized batch, pre-populating the alias map
   * from each narrator's names[] and aliases[] fields.
   * @param {object} batch — normalized batch from json-validator
   */
  constructor() {
    /** @type {Map<string, string>} alias → canonicalId */
    this._aliases = new Map();
    /** @type {Map<string, string>} canonicalId → canonicalId (identity for non-merged) */
    this._idMap = new Map();
    /** @type {object[]} append-only operation log */
    this._log = [];
    /** @type {Set<string>} ids that were merge targets (never reused as source) */
    this._retiredIds = new Set();
  }

  /**
   * Seed the resolver from a normalized batch's narrator profiles.
   * Calls registerNarrator for each profile.
   * @param {object} batch
   * @returns {EntityResolver} this
   */
  seedFromBatch(batch) {
    for (const narrator of (batch.narrators || [])) {
      this.registerNarrator(narrator.narrator_id, narrator.names || [], narrator.aliases || []);
    }
    return this;
  }

  /**
   * Register a narrator entity with its canonical ID and alias sets.
   * Idempotent — calling with an already-registered ID is a no-op.
   * @param {string} canonicalId
   * @param {string[]} names
   * @param {string[]} aliases
   */
  registerNarrator(canonicalId, names = [], aliases = []) {
    if (this._idMap.has(canonicalId)) return;

    this._idMap.set(canonicalId, canonicalId);

    const allNames = [...names, ...aliases];
    for (const name of allNames) {
      if (!name) continue;
      const key = normalizeAlias(name);
      if (key) this._aliases.set(key, canonicalId);
    }
  }

  /**
   * Look up the canonical ID for a name string.
   * @param {string} name
   * @returns {string|null} canonicalId or null if unresolved
   */
  resolveName(name) {
    const key = normalizeAlias(name);
    return this._aliases.get(key) || null;
  }

  /**
   * Add an alias mapping.
   * @param {string} alias
   * @param {string} canonicalId
   */
  addAlias(alias, canonicalId) {
    if (!this._idMap.has(canonicalId)) {
      throw new Error(`Unknown canonicalId: ${canonicalId}`);
    }
    const key = normalizeAlias(alias);
    this._aliases.set(key, canonicalId);
    return this._recordOperation(OPERATION_TYPE.ALIAS_ADD, { alias: key, canonicalId }, {
      affectedIds: [canonicalId],
      movements: [],
      invariantChecks: [
        { name: 'alias_resolves_to_canonical_id', passed: this.resolveName(key) === canonicalId },
      ],
    });
  }

  /**
   * Merge sourceId into targetId, retiring sourceId.
   * All evidence attached to sourceId is redistributed to targetId.
   * @param {string} sourceId — the ID to retire (all refs will point to targetId after)
   * @param {string} targetId — the surviving ID
   * @param {Map<string, object[]>} evidenceMap — evidence_id → evidence[] for each narrator (see test fixtures for shape)
   * @returns {object} operation record with durable receipt
   */
  merge(sourceId, targetId, evidenceMap = new Map()) {
    if (!this._idMap.has(sourceId)) throw new Error(`Unknown sourceId: ${sourceId}`);
    if (!this._idMap.has(targetId)) throw new Error(`Unknown targetId: ${targetId}`);
    if (sourceId === targetId) throw new Error('Cannot merge an ID into itself');
    if (this._retiredIds.has(sourceId)) throw new Error(`Source ID already retired: ${sourceId}`);
    if (this._retiredIds.has(targetId)) throw new Error(`Target ID is a retired merge source: ${targetId}`);

    this._idMap.set(sourceId, targetId);
    this._retiredIds.add(sourceId);

    const evidenceRedistributed = [];
    const sourceEvidence = evidenceMap.get(sourceId) || [];
    for (const ev of sourceEvidence) {
      evidenceRedistributed.push({ ...ev, narrator_id: targetId, merged_from: sourceId });
    }

    const payload = {
      source_id: sourceId,
      target_id: targetId,
      evidence_redistributed_count: evidenceRedistributed.length,
    };
    const op = this._recordOperation(OPERATION_TYPE.MERGE, payload, {
      affectedIds: [sourceId, targetId],
      movements: evidenceMovements(evidenceRedistributed, sourceId, targetId),
      invariantChecks: [
        { name: 'source_is_retired', passed: this.isRetired(sourceId) },
        { name: 'source_resolves_to_target', passed: this.resolveId(sourceId) === targetId },
        { name: 'evidence_reassigned_to_target', passed: evidenceRedistributed.every(ev => ev.narrator_id === targetId) },
      ],
    });

    return { ...op, evidence_redistributed: evidenceRedistributed };
  }

  /**
   * Split sourceId into two new IDs, redistributing evidence explicitly.
   * The original sourceId is retired and replaced by targetA and targetB.
   * @param {string} sourceId
   * @param {string} targetA
   * @param {string} targetB
   * @param {object[]} evidenceForA
   * @param {object[]} evidenceForB
   * @returns {object} operation record
   */
  split(sourceId, targetA, targetB, evidenceForA = [], evidenceForB = []) {
    if (!this._idMap.has(sourceId)) throw new Error(`Unknown sourceId: ${sourceId}`);
    if (this._retiredIds.has(sourceId)) throw new Error(`Source ID already retired: ${sourceId}`);
    if (targetA === targetB) throw new Error('Split targets must be distinct');
    if (targetA === sourceId || targetB === sourceId) throw new Error('Cannot reuse sourceId as split target');

    this._retiredIds.add(sourceId);
    this._idMap.set(sourceId, '__SPLIT__');
    this._idMap.set(targetA, targetA);
    this._idMap.set(targetB, targetB);

    const redistributedA = evidenceForA.map(ev => ({ ...ev, narrator_id: targetA, split_from: sourceId }));
    const redistributedB = evidenceForB.map(ev => ({ ...ev, narrator_id: targetB, split_from: sourceId }));

    const payload = {
      source_id: sourceId,
      target_a: targetA,
      target_b: targetB,
      evidence_to_a_count: redistributedA.length,
      evidence_to_b_count: redistributedB.length,
    };
    const op = this._recordOperation(OPERATION_TYPE.SPLIT, payload, {
      affectedIds: [sourceId, targetA, targetB],
      movements: [
        ...evidenceMovements(redistributedA, sourceId, targetA),
        ...evidenceMovements(redistributedB, sourceId, targetB),
      ],
      invariantChecks: [
        { name: 'source_is_retired', passed: this.isRetired(sourceId) },
        { name: 'targets_are_canonical', passed: this.resolveId(targetA) === targetA && this.resolveId(targetB) === targetB },
        { name: 'evidence_reassigned_to_targets', passed: redistributedA.every(ev => ev.narrator_id === targetA) && redistributedB.every(ev => ev.narrator_id === targetB) },
      ],
    });

    return { ...op, evidence_to_a: redistributedA, evidence_to_b: redistributedB };
  }

  _recordOperation(type, payload, receiptData) {
    const operation = makeOp(type, payload, {
      ...receiptData,
      stateVersion: this._log.length,
    });
    this._log.push(operation);
    return cloneRecord(operation);
  }

  /**
   * Resolve a canonical ID through all merge operations.
   * @param {string} id
   * @returns {string} ultimate canonical ID (never a retired ID)
   */
  resolveId(id) {
    let current = id;
    const visited = new Set();
    while (true) {
      if (visited.has(current)) throw new Error(`Circular ID resolution at: ${current}`);
      visited.add(current);
      const mapped = this._idMap.get(current);
      if (mapped === current) return current;
      if (!mapped) return current;
      current = mapped;
    }
  }

  /**
   * Get all current canonical IDs (non-retired).
   * @returns {Set<string>}
   */
  getCanonicalIds() {
    const ids = new Set();
    for (const [id, resolution] of this._idMap) {
      if (!this._retiredIds.has(id) && resolution !== '__SPLIT__') {
        ids.add(this.resolveId(id));
      }
    }
    return ids;
  }

  /**
   * Check if an ID is retired (was a merge source or split source).
   * @param {string} id
   * @returns {boolean}
   */
  isRetired(id) {
    return this._retiredIds.has(id);
  }

  /**
   * Get the current state snapshot (aliases, idMap, log).
   * @returns {{ aliases: object, idMap: object, retiredIds: string[], log: object[] }}
   */
  getState() {
    return {
      aliases: Object.fromEntries(this._aliases),
      idMap: Object.fromEntries(this._idMap),
      retiredIds: [...this._retiredIds],
      log: cloneRecord(this._log),
    };
  }

  /**
   * Get the operation log.
   * @returns {object[]}
   */
  getLog() {
    return cloneRecord(this._log);
  }

  /**
   * Apply a log of operations to reconstruct state.
   * The log is replayed from an empty resolver.
   * @param {object[]} log
   * @param {object} evidenceMap — narrator_id → evidence[] for redistributing
   * @returns {EntityResolver} new resolver with replayed state
   */
  static fromLog(log, evidenceMap = new Map()) {
    const r = new EntityResolver();

    const allIds = new Set();
    for (const op of log) {
      const { type, payload } = op;
      if (type === OPERATION_TYPE.ALIAS_ADD) {
        allIds.add(payload.canonicalId);
      } else if (type === OPERATION_TYPE.MERGE) {
        allIds.add(payload.source_id);
        allIds.add(payload.target_id);
      } else if (type === OPERATION_TYPE.SPLIT) {
        allIds.add(payload.source_id);
        allIds.add(payload.target_a);
        allIds.add(payload.target_b);
      }
    }

    for (const id of allIds) {
      if (id && id !== '__SPLIT__') {
        r.registerNarrator(id, []);
      }
    }

    for (const op of log) {
      const { type, payload } = op;
      if (type === OPERATION_TYPE.ALIAS_ADD) {
        r.addAlias(payload.alias, payload.canonicalId);
      } else if (type === OPERATION_TYPE.MERGE) {
        r.merge(payload.source_id, payload.target_id, evidenceMap);
      } else if (type === OPERATION_TYPE.SPLIT) {
        const evA = evidenceMap.get(payload.source_id)?.filter(e => e.split_target === payload.target_a) || [];
        const evB = evidenceMap.get(payload.source_id)?.filter(e => e.split_target === payload.target_b) || [];
        r.split(payload.source_id, payload.target_a, payload.target_b, evA, evB);
      }
    }
    const replayedLog = r._log;
    r._log = log.map((op, index) => cloneRecord(op.receipt ? op : replayedLog[index]));
    return r;
  }

  /**
   * Remap a batch, rewriting all narrator IDs to their resolved canonical forms.
   * Returns a new object (does not mutate input).
   * @param {object} batch
   * @returns {{ batch: object, remappedCount: number }}
   */
  remapBatch(batch) {
    const remapped = JSON.parse(JSON.stringify(batch));
    let remappedCount = 0;

    const nMap = remapped.narrators ? new Map() : null;
    if (nMap) {
      for (const n of remapped.narrators) {
        const resolved = this.resolveId(n.narrator_id);
        if (resolved !== n.narrator_id) remappedCount++;
        nMap.set(n.narrator_id, resolved);
        n.narrator_id = resolved;
      }
    }

    for (const record of remapped.records || []) {
      for (const variant of record.variants || []) {
        for (let i = 0; i < variant.isnad_chain.length; i++) {
          const resolved = this.resolveId(variant.isnad_chain[i]);
          if (resolved !== variant.isnad_chain[i]) remappedCount++;
          variant.isnad_chain[i] = resolved;
        }
      }
      for (const ev of (record.reliability_evidence || [])) {
        const resolved = this.resolveId(ev.narrator_id);
        if (resolved !== ev.narrator_id) remappedCount++;
        ev.narrator_id = resolved;
      }
    }

    return { batch: remapped, remappedCount };
  }
}

export default EntityResolver;
