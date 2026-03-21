/**
 * tests/fixtures/phase4/ — Phase 4 test fixtures
 *
 * Covers evidence binding, anti-hallucination, and explainability.
 */

/**
 * Valid batch with complete provenance, declared narrators, and valid evidence.
 */
export const BATCH_VALID = {
  schema_version: 1,
  imported_at: '2026-03-21T00:00:00.000Z',
  records: [{
    hadith_id: 'h1',
    family_id: 'f1',
    source_ref: {
      collection: 'Sahih al-Bukhari',
      source_type: 'print',
      source_locator: 'ISBN 978-1-234-56789-0, Vol. 1, p. 15',
      ingested_at: '2026-03-21T00:00:00.000Z',
    },
    variants: [{
      variant_id: 'v1',
      isnad_chain: ['prophet', 'pre-link', 'cl-narrator', 'collector-a'],
    }, {
      variant_id: 'v2',
      isnad_chain: ['prophet', 'pre-link', 'cl-narrator', 'collector-b'],
    }, {
      variant_id: 'v3',
      isnad_chain: ['prophet', 'pre-link', 'cl-narrator', 'collector-c'],
    }],
    reliability_evidence: [{
      evidence_id: 'ev1',
      narrator_id: 'cl-narrator',
      rating: 'thiqah',
      source_type: 'print',
      source_ref: {
        collection: 'Tahdhib al-Kamal',
        source_type: 'print',
        source_locator: 'Vol. 3, p. 100',
        ingested_at: '2026-03-21T00:00:00.000Z',
      },
      ingested_at: '2026-03-21T00:00:00.000Z',
    }],
  }],
  narrators: [
    { narrator_id: 'prophet', names: ['The Prophet'] },
    { narrator_id: 'pre-link', names: ['Pre-Link Narrator'] },
    { narrator_id: 'cl-narrator', names: ['Common Link Narrator'] },
    { narrator_id: 'collector-a', names: ['Collector A'] },
    { narrator_id: 'collector-b', names: ['Collector B'] },
    { narrator_id: 'collector-c', names: ['Collector C'] },
  ],
};

/**
 * Batch with synthetic/fabricated narrator IDs in chains.
 */
export const BATCH_SYNTHETIC_NARRATOR = {
  schema_version: 1,
  imported_at: '2026-03-21T00:00:00.000Z',
  records: [{
    hadith_id: 'h2',
    family_id: 'f2',
    source_ref: {
      collection: 'Sahih al-Bukhari',
      source_type: 'print',
      source_locator: 'p. 20',
      ingested_at: '2026-03-21T00:00:00.000Z',
    },
    variants: [{
      variant_id: 'v1',
      isnad_chain: ['prophet', 'synthetic_narrator_x', 'collector-a'],
    }],
    reliability_evidence: [],
  }],
    narrators: [
      { narrator_id: 'prophet', names: ['The Prophet'] },
      { narrator_id: 'n1', names: ['N1'] },
    ],
};

/**
 * Batch with missing required provenance on source_ref.
 */
export const BATCH_MISSING_PROVENANCE = {
  schema_version: 1,
  imported_at: '2026-03-21T00:00:00.000Z',
  records: [{
    hadith_id: 'h3',
    family_id: 'f3',
    source_ref: {
      collection: 'Sahih al-Bukhari',
      source_type: null,
      source_locator: null,
      ingested_at: null,
    },
    variants: [{
      variant_id: 'v1',
      invalid_chain: ['prophet', 'n1', 'collector'],
    }],
    reliability_evidence: [],
  }],
  narrators: [],
};

/**
 * Batch with empty isnad chain.
 */
export const BATCH_EMPTY_CHAIN = {
  schema_version: 1,
  imported_at: '2026-03-21T00:00:00.000Z',
  records: [{
    hadith_id: 'h4',
    family_id: 'f4',
    source_ref: {
      collection: 'Test Collection',
      source_type: 'print',
      source_locator: 'p. 4',
      ingested_at: '2026-03-21T00:00:00.000Z',
    },
    variants: [{
      variant_id: 'v1',
      isnad_chain: [],
    }],
    reliability_evidence: [],
  }],
  narrators: [],
};

/**
 * Batch with synthetic evidence IDs.
 */
export const BATCH_SYNTHETIC_EVIDENCE = {
  schema_version: 1,
  imported_at: '2026-03-21T00:00:00.000Z',
  records: [{
    hadith_id: 'h5',
    family_id: 'f5',
    source_ref: {
      collection: 'Sahih al-Bukhari',
      source_type: 'print',
      source_locator: 'p. 5',
      ingested_at: '2026-03-21T00:00:00.000Z',
    },
    variants: [{
      variant_id: 'v1',
      isnad_chain: ['prophet', 'n1', 'collector'],
    }],
    reliability_evidence: [{
      evidence_id: 'synthetic_fake_evidence_001',
      narrator_id: 'n1',
      rating: 'thiqah',
      source_type: 'print',
      source_ref: {
        collection: 'Fake Source',
        source_type: 'print',
        source_locator: 'p. 1',
        ingested_at: '2026-03-21T00:00:00.000Z',
      },
      ingested_at: '2026-03-21T00:00:00.000Z',
    }],
  }],
  narrators: [
    { narrator_id: 'prophet', names: ['The Prophet'] },
    { narrator_id: 'n1', names: ['Narrator 1'] },
    { narrator_id: 'collector', names: ['Collector'] },
  ],
};

/**
 * Batch with reliability evidence missing provenance.
 */
export const BATCH_EVIDENCE_MISSING_PROVENANCE = {
  schema_version: 1,
  imported_at: '2026-03-21T00:00:00.000Z',
  records: [{
    hadith_id: 'h6',
    family_id: 'f6',
    source_ref: {
      collection: 'Sahih al-Bukhari',
      source_type: 'print',
      source_locator: 'p. 6',
      ingested_at: '2026-03-21T00:00:00.000Z',
    },
    variants: [{
      variant_id: 'v1',
      isnad_chain: ['prophet', 'n1', 'collector'],
    }],
    reliability_evidence: [{
      evidence_id: 'ev-no-provenance',
      narrator_id: 'n1',
      rating: 'thiqah',
      source_type: 'print',
      source_ref: {},
      ingested_at: '2026-03-21T00:00:00.000Z',
    }],
  }],
  narrators: [
    { narrator_id: 'prophet', names: ['The Prophet'] },
    { narrator_id: 'n1', names: ['Narrator 1'] },
    { narrator_id: 'collector', names: ['Collector'] },
  ],
};

/**
 * Batch with unknown narrator IDs in chains (not declared in narrators list).
 */
export const BATCH_UNKNOWN_NARRATOR = {
  schema_version: 1,
  imported_at: '2026-03-21T00:00:00.000Z',
  records: [{
    hadith_id: 'h7',
    family_id: 'f7',
    source_ref: {
      collection: 'Sahih Muslim',
      source_type: 'print',
      source_locator: 'p. 7',
      ingested_at: '2026-03-21T00:00:00.000Z',
    },
    variants: [{
      variant_id: 'v1',
      isnad_chain: ['prophet', 'known-n1', 'unknown-xyz', 'collector'],
    }],
    reliability_evidence: [],
  }],
  narrators: [
    { narrator_id: 'prophet', names: ['The Prophet'] },
    { narrator_id: 'known-n1', names: ['Known Narrator 1'] },
    { narrator_id: 'collector', names: ['Collector'] },
  ],
};

/**
 * Batch with no evidence for a reliability-weighted claim (warning, not blocking).
 */
export const BATCH_NO_EVIDENCE_STRUCTURAL = {
  schema_version: 1,
  imported_at: '2026-03-21T00:00:00.000Z',
  records: [{
    hadith_id: 'h8',
    family_id: 'f8',
    source_ref: {
      collection: 'Sunan Abu Dawud',
      source_type: 'print',
      source_locator: 'p. 8',
      ingested_at: '2026-03-21T00:00:00.000Z',
    },
    variants: [{
      variant_id: 'v1',
      isnad_chain: ['prophet', 'pre-link', 'cl-node', 'collector-a'],
    }, {
      variant_id: 'v2',
      isnad_chain: ['prophet', 'pre-link', 'cl-node', 'collector-b'],
    }, {
      variant_id: 'v3',
      isnad_chain: ['prophet', 'pre-link', 'cl-node', 'collector-c'],
    }],
    reliability_evidence: [],
  }],
  narrators: [
    { narrator_id: 'prophet', names: ['The Prophet'] },
    { narrator_id: 'pre-link', names: ['Pre-Link'] },
    { narrator_id: 'cl-node', names: ['CL'] },
    { narrator_id: 'collector-a', names: ['CA'] },
    { narrator_id: 'collector-b', names: ['CB'] },
    { narrator_id: 'collector-c', names: ['CC'] },
  ],
};
