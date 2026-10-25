import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ProposalStore, PROPOSAL_STATUS, PROPOSAL_TYPE } from '../../scripts/proposal-store.js';
import { validateBatch } from '../../scripts/json-validator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('Milestone 2 — AI Proposal Staging Buffer & Cryptographic Receipts', () => {
  const sampleBatchPath = path.join(__dirname, '../../docs/examples/sample-import.json');
  const sampleBatch = JSON.parse(fs.readFileSync(sampleBatchPath, 'utf8'));

  it('stages an AI merge proposal without mutating the canonical batch', () => {
    const store = ProposalStore.fromBatch(sampleBatch);
    const proposal = store.stageMerge({
      sourceId: 'aymen-unknown',
      targetId: 'hisham-ibn-urwah',
      rationale: 'Narrator name match in historical biographical index',
      modelMetadata: { model: 'claude-3-5-sonnet', prompt_id: 'ner-isnad-04', confidence: 0.92 },
    });

    expect(proposal.proposal_id).toBeDefined();
    expect(proposal.status).toBe(PROPOSAL_STATUS.STAGED);
    expect(proposal.type).toBe(PROPOSAL_TYPE.NARRATOR_MERGE);

    // Verify canonical batch is NOT mutated while staged
    const batchBeforeCommit = store.getBatch();
    const chain = batchBeforeCommit.records[0].variants[0].isnad_chain;
    expect(chain[chain.length - 1]).toBe('aymen-unknown');
  });

  it('failure mode: rejects invalid self-merge during staging', () => {
    const store = ProposalStore.fromBatch(sampleBatch);
    expect(() => {
      store.stageMerge({ sourceId: 'hisham-ibn-urwah', targetId: 'hisham-ibn-urwah' });
    }).toThrow(/Cannot merge an entity into itself/);
  });

  it('failure mode: rejects commit when target narrator is undeclared/unknown', () => {
    const store = ProposalStore.fromBatch(sampleBatch);
    const prop = store.stageMerge({
      sourceId: 'aymen-unknown',
      targetId: 'invented-nonexistent-narrator',
      rationale: 'Hallucinated candidate',
    });

    expect(() => {
      store.commitProposal(prop.proposal_id, { reviewer_id: 'dr_scholar' });
    }).toThrow(/Merge invariant failed/);
  });

  it('commits valid merge proposal with reviewer sign-off and mints cryptographic receipt', () => {
    const store = ProposalStore.fromBatch(sampleBatch);
    const prop = store.stageMerge({
      sourceId: 'aymen-unknown',
      targetId: 'hisham-ibn-urwah',
      rationale: 'Historical identification confirmed',
      modelMetadata: { model: 'gemini-1.5-pro', prompt_id: 'disambig-v1', confidence: 0.95 },
    });

    const receipt = store.commitProposal(prop.proposal_id, {
      reviewer_id: 'prof_motzki_verifier',
      notes: 'Verified against Tahdhib al-Kamal entries.',
    });

    expect(receipt.receipt_id).toBeDefined();
    expect(receipt.proposal_id).toBe(prop.proposal_id);
    expect(receipt.reviewer.reviewer_id).toBe('prof_motzki_verifier');
    expect(receipt.state_proofs.before_hash).toBeDefined();
    expect(receipt.state_proofs.after_hash).toBeDefined();
    expect(receipt.state_proofs.before_hash).not.toBe(receipt.state_proofs.after_hash);

    // Verify canonical batch is remapped cleanly
    const batchAfterCommit = store.getBatch();
    const chain = batchAfterCommit.records[0].variants[0].isnad_chain;
    expect(chain[chain.length - 1]).toBe('hisham-ibn-urwah');

    // Save repeatable verifiable artifact
    const artifactPath = path.join(__dirname, '../fixtures/e2e/m2-proposal-receipt-dump.json');
    const artifactData = {
      test_run_at: '2026-10-25T00:00:00.000Z',
      proposal: store.getProposal(prop.proposal_id),
      receipt,
      replayed_receipts: store.getReceipts(),
    };
    fs.writeFileSync(artifactPath, JSON.stringify(artifactData, null, 2), 'utf8');
    expect(fs.existsSync(artifactPath)).toBe(true);
  });

  it('stages and commits matn segmentation proposal into variant', () => {
    const store = ProposalStore.fromBatch(sampleBatch);
    const prop = store.stageMatnSegmentation({
      variantId: 'bukhari-v1',
      segments: [
        { pericope_id: 'p1', text: 'عَنْ عِمْرَانَ بْنِ حُسَيْنٍ', variant_type: 'base' },
        { pericope_id: 'p2', text: 'أَنَّ رَسُولَ اللَّهِ قَالَ', variant_type: 'base' },
      ],
      rationale: 'Pericope segmentation based on transmission boundaries',
    });

    expect(prop.status).toBe(PROPOSAL_STATUS.STAGED);
    const receipt = store.commitProposal(prop.proposal_id, { reviewer_id: 'scholar_matn_expert' });
    expect(receipt.status).toBe('verified_and_accreted');

    const updatedBatch = store.getBatch();
    const variant = updatedBatch.records[0].variants[0];
    expect(variant.matn_segments.length).toBe(2);
    expect(variant.matn_segments[0].pericope_id).toBe('p1');
  });

  it('rejects a staged proposal cleanly', () => {
    const store = ProposalStore.fromBatch(sampleBatch);
    const prop = store.stageMerge({
      sourceId: 'aymen-unknown',
      targetId: 'hisham-ibn-urwah',
      rationale: 'Uncertain match',
    });
    const rejected = store.rejectProposal(prop.proposal_id, 'Insufficient evidence in kutub al-rijal');
    expect(rejected.status).toBe(PROPOSAL_STATUS.REJECTED);
    expect(rejected.rejection_reason).toBe('Insufficient evidence in kutub al-rijal');
  });
});
