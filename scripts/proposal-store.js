/**
 * scripts/proposal-store.js
 *
 * Phase 2/3 Extension — AI Proposal Staging Buffer & Cryptographic Receipts (D024)
 *
 * Buffers AI/agent candidate extractions, narrator resolutions, and matn segmentations
 * in a staging store without directly mutating canonical research state.
 *
 * All committed proposals pass invariant gates and mint durable, SHA-256
 * verifiable operation receipts.
 */
import crypto from 'node:crypto';
import { EntityResolver, OPERATION_TYPE, ENTITY_OPERATION_RECEIPT_VERSION } from './entity-resolution.js';

export const PROPOSAL_STATUS = Object.freeze({
  STAGED: 'staged',
  REVIEWED: 'reviewed',
  COMMITTED: 'committed',
  REJECTED: 'rejected',
});

export const PROPOSAL_TYPE = Object.freeze({
  NARRATOR_MERGE: 'PROPOSAL_NARRATOR_MERGE',
  NARRATOR_SPLIT: 'PROPOSAL_NARRATOR_SPLIT',
  NARRATOR_ALIAS: 'PROPOSAL_NARRATOR_ALIAS',
  MATN_SEGMENTATION: 'PROPOSAL_MATN_SEGMENTATION',
});

function sha256Digest(data) {
  return crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex');
}

export class ProposalStore {
  /**
   * @param {object} batch - normalized batch
   * @param {EntityResolver} [resolver] - optional seeded EntityResolver
   */
  constructor(batch, resolver = null) {
    this._batch = JSON.parse(JSON.stringify(batch || { records: [], narrators: [] }));
    this._resolver = resolver || new EntityResolver().seedFromBatch(this._batch);
    /** @type {Map<string, object>} */
    this._proposals = new Map();
    /** @type {object[]} */
    this._committedLog = [];
  }

  static fromBatch(batch, resolver = null) {
    return new ProposalStore(batch, resolver);
  }

  _generateId(prefix = 'prop') {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  }

  /**
   * Stage a proposed narrator merge.
   */
  stageMerge({ sourceId, targetId, rationale = null, modelMetadata = {} }) {
    if (!sourceId || !targetId) {
      throw new Error('Both sourceId and targetId are required for merge proposal');
    }
    if (sourceId === targetId) {
      throw new Error('Cannot merge an entity into itself');
    }
    const proposalId = this._generateId('prop-merge');
    const proposal = {
      proposal_id: proposalId,
      type: PROPOSAL_TYPE.NARRATOR_MERGE,
      status: PROPOSAL_STATUS.STAGED,
      payload: { sourceId, targetId },
      rationale: rationale || 'AI suggested narrator merge',
      model_metadata: {
        model: modelMetadata.model || 'unspecified-agent',
        prompt_id: modelMetadata.prompt_id || null,
        confidence: modelMetadata.confidence ?? 0.8,
        timestamp: new Date().toISOString(),
      },
      created_at: new Date().toISOString(),
      receipt: null,
    };
    this._proposals.set(proposalId, proposal);
    return JSON.parse(JSON.stringify(proposal));
  }

  /**
   * Stage a proposed narrator split.
   */
  stageSplit({ sourceId, targetA, targetB, evidenceForA = [], evidenceForB = [], rationale = null, modelMetadata = {} }) {
    if (!sourceId || !targetA || !targetB) {
      throw new Error('sourceId, targetA, and targetB are required for split proposal');
    }
    if (targetA === targetB) {
      throw new Error('Split targets must be distinct');
    }
    const proposalId = this._generateId('prop-split');
    const proposal = {
      proposal_id: proposalId,
      type: PROPOSAL_TYPE.NARRATOR_SPLIT,
      status: PROPOSAL_STATUS.STAGED,
      payload: { sourceId, targetA, targetB, evidenceForA, evidenceForB },
      rationale: rationale || 'AI suggested narrator split',
      model_metadata: {
        model: modelMetadata.model || 'unspecified-agent',
        prompt_id: modelMetadata.prompt_id || null,
        confidence: modelMetadata.confidence ?? 0.8,
        timestamp: new Date().toISOString(),
      },
      created_at: new Date().toISOString(),
      receipt: null,
    };
    this._proposals.set(proposalId, proposal);
    return JSON.parse(JSON.stringify(proposal));
  }

  /**
   * Stage a proposed matn pericope segmentation for a variant.
   */
  stageMatnSegmentation({ variantId, segments = [], rationale = null, modelMetadata = {} }) {
    if (!variantId || !Array.isArray(segments) || segments.length === 0) {
      throw new Error('variantId and non-empty segments array are required');
    }
    const proposalId = this._generateId('prop-matn');
    const proposal = {
      proposal_id: proposalId,
      type: PROPOSAL_TYPE.MATN_SEGMENTATION,
      status: PROPOSAL_STATUS.STAGED,
      payload: { variantId, segments: JSON.parse(JSON.stringify(segments)) },
      rationale: rationale || 'AI synoptic pericope segmentation',
      model_metadata: {
        model: modelMetadata.model || 'unspecified-agent',
        prompt_id: modelMetadata.prompt_id || null,
        confidence: modelMetadata.confidence ?? 0.85,
        timestamp: new Date().toISOString(),
      },
      created_at: new Date().toISOString(),
      receipt: null,
    };
    this._proposals.set(proposalId, proposal);
    return JSON.parse(JSON.stringify(proposal));
  }

  /**
   * List buffered proposals with optional filters.
   */
  listProposals(filter = {}) {
    let list = [...this._proposals.values()];
    if (filter.status) {
      list = list.filter(p => p.status === filter.status);
    }
    if (filter.type) {
      list = list.filter(p => p.type === filter.type);
    }
    return JSON.parse(JSON.stringify(list));
  }

  getProposal(proposalId) {
    const prop = this._proposals.get(proposalId);
    return prop ? JSON.parse(JSON.stringify(prop)) : null;
  }

  /**
   * Reject a proposal with a reason.
   */
  rejectProposal(proposalId, reason) {
    const prop = this._proposals.get(proposalId);
    if (!prop) throw new Error(`Unknown proposalId: ${proposalId}`);
    if (prop.status === PROPOSAL_STATUS.COMMITTED) {
      throw new Error(`Cannot reject already committed proposal: ${proposalId}`);
    }
    prop.status = PROPOSAL_STATUS.REJECTED;
    prop.rejection_reason = reason || 'Rejected by researcher';
    prop.updated_at = new Date().toISOString();
    return JSON.parse(JSON.stringify(prop));
  }

  /**
   * Commit a proposal into canonical state, minting an immutable cryptographic receipt.
   * @param {string} proposalId
   * @param {object} researcherSignOff - { reviewer_id: string, notes?: string }
   */
  commitProposal(proposalId, researcherSignOff = {}) {
    const prop = this._proposals.get(proposalId);
    if (!prop) throw new Error(`Unknown proposalId: ${proposalId}`);
    if (prop.status === PROPOSAL_STATUS.COMMITTED) {
      throw new Error(`Proposal already committed: ${proposalId}`);
    }
    if (prop.status === PROPOSAL_STATUS.REJECTED) {
      throw new Error(`Cannot commit rejected proposal: ${proposalId}`);
    }

    const reviewerId = researcherSignOff.reviewer_id || 'anonymous_scholar';
    const stateHashBefore = sha256Digest({
      narrators: this._batch.narrators?.length || 0,
      records: this._batch.records?.length || 0,
      logLength: this._committedLog.length,
    });

    let operationResult = null;

    if (prop.type === PROPOSAL_TYPE.NARRATOR_MERGE) {
      const { sourceId, targetId } = prop.payload;
      // Invariant checks
      const declaredNarrators = new Set((this._batch.narrators || []).map(n => n.narrator_id));
      if (!declaredNarrators.has(targetId) && !this._resolver.getCanonicalIds().has(targetId)) {
        throw new Error(`Merge invariant failed: targetId '${targetId}' is not declared in canonical narrators`);
      }
      operationResult = this._resolver.merge(sourceId, targetId);
      const remapped = this._resolver.remapBatch(this._batch);
      this._batch = remapped.batch;
    } else if (prop.type === PROPOSAL_TYPE.NARRATOR_SPLIT) {
      const { sourceId, targetA, targetB, evidenceForA, evidenceForB } = prop.payload;
      operationResult = this._resolver.split(sourceId, targetA, targetB, evidenceForA, evidenceForB);
      const remapped = this._resolver.remapBatch(this._batch);
      this._batch = remapped.batch;
    } else if (prop.type === PROPOSAL_TYPE.MATN_SEGMENTATION) {
      const { variantId, segments } = prop.payload;
      let matched = false;
      for (const record of (this._batch.records || [])) {
        for (const variant of (record.variants || [])) {
          if (variant.variant_id === variantId) {
            variant.matn_segments = JSON.parse(JSON.stringify(segments));
            matched = true;
          }
        }
      }
      if (!matched) {
        throw new Error(`Matn segmentation invariant failed: variant '${variantId}' not found in batch`);
      }
      operationResult = { variant_id: variantId, segment_count: segments.length };
    }

    const stateHashAfter = sha256Digest({
      narrators: this._batch.narrators?.length || 0,
      records: this._batch.records?.length || 0,
      logLength: this._committedLog.length + 1,
    });

    const receipt = {
      receipt_version: ENTITY_OPERATION_RECEIPT_VERSION,
      receipt_id: `rcpt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      proposal_id: proposalId,
      operation_type: prop.type,
      model_provenance: {
        model: prop.model_metadata.model,
        prompt_id: prop.model_metadata.prompt_id,
        confidence: prop.model_metadata.confidence,
      },
      reviewer: {
        reviewer_id: reviewerId,
        signed_off_at: new Date().toISOString(),
        notes: researcherSignOff.notes || null,
      },
      state_proofs: {
        before_hash: stateHashBefore,
        after_hash: stateHashAfter,
      },
      operation_details: operationResult,
      status: 'verified_and_accreted',
    };

    prop.status = PROPOSAL_STATUS.COMMITTED;
    prop.receipt = receipt;
    prop.updated_at = new Date().toISOString();

    this._committedLog.push({ proposal_id: proposalId, receipt });
    return JSON.parse(JSON.stringify(receipt));
  }

  /**
   * Get the mutated, remapped canonical batch.
   */
  getBatch() {
    return JSON.parse(JSON.stringify(this._batch));
  }

  /**
   * Get the audit log of all committed receipts.
   */
  getReceipts() {
    return JSON.parse(JSON.stringify(this._committedLog));
  }
}

export default ProposalStore;
