/**
 * tests/fixtures/phase5/fixtures.js
 *
 * Phase 5 — Export Test Fixtures
 *
 * Small fixture for export format smoke tests. Mirrors the structure
 * used by Phase 4 BATCH_VALID but suitable for artifact and export testing.
 */
export const BATCH_SMALL = {
  schema_version: 1,
  imported_at: '2026-03-21T00:00:00.000Z',
  records: [
    {
      hadith_id: 'h1',
      family_id: 'f1',
      source_ref: {
        collection: 'Sunan Abu Dawud',
        source_type: 'print',
        source_locator: 'p. 1',
        ingested_at: '2026-03-21T00:00:00.000Z',
      },
      variants: [
        {
          variant_id: 'v1',
          isnad_chain: ['prophet', 'pre-link', 'cl-narrator', 'collector-a'],
          matn_raw: 'This is a sample matn text.',
        },
        {
          variant_id: 'v2',
          isnad_chain: ['prophet', 'pre-link', 'cl-narrator', 'collector-b'],
        },
        {
          variant_id: 'v3',
          isnad_chain: ['prophet', 'pre-link', 'cl-narrator', 'collector-c'],
        },
      ],
      reliability_evidence: [
        {
          evidence_id: 'ev-tahdhib-001',
          narrator_id: 'cl-narrator',
          rating: 'thiqah',
          source_type: 'print',
          source_ref: {
            collection: 'Tahdhib al-Kamal',
            source_type: 'print',
            source_locator: 'vol. 3, p. 100',
            ingested_at: '2026-03-21T00:00:00.000Z',
          },
          scholar: 'Al-Mizzi',
          ingested_at: '2026-03-21T00:00:00.000Z',
        },
      ],
    },
  ],
  narrators: [
    { narrator_id: 'prophet', names: ['The Prophet Muhammad'] },
    { narrator_id: 'pre-link', names: ['Pre-Link Narrator'] },
    { narrator_id: 'cl-narrator', names: ['CL Narrator'] },
    { narrator_id: 'collector-a', names: ['Collector A'] },
    { narrator_id: 'collector-b', names: ['Collector B'] },
    { narrator_id: 'collector-c', names: ['Collector C'] },
  ],
};

export const BATCH_NO_CANDIDATES = {
  schema_version: 1,
  imported_at: '2026-03-21T00:00:00.000Z',
  records: [
    {
      hadith_id: 'h10',
      family_id: 'f10',
      source_ref: {
        collection: 'Sunan al-Nasa\'i',
        source_type: 'print',
        source_locator: 'p. 10',
        ingested_at: '2026-03-21T00:00:00.000Z',
      },
      variants: [
        {
          variant_id: 'v1',
          isnad_chain: ['prophet', 'n1'],
        },
      ],
      reliability_evidence: [],
    },
  ],
  narrators: [
    { narrator_id: 'prophet', names: ['The Prophet'] },
    { narrator_id: 'n1', names: ['N1'] },
  ],
};

export const BATCH_MULTI_FAMILY = {
  schema_version: 1,
  imported_at: '2026-03-21T00:00:00.000Z',
  records: [
    {
      hadith_id: 'h-a1',
      family_id: 'family-alpha',
      source_ref: {
        collection: 'Sahih al-Bukhari',
        source_type: 'print',
        source_locator: 'vol. 1, p. 1',
        ingested_at: '2026-03-21T00:00:00.000Z',
      },
      variants: [
        {
          variant_id: 'v-a1',
          isnad_chain: ['prophet', 'pre-link', 'cl-a', 'coll-a'],
        },
        {
          variant_id: 'v-a2',
          isnad_chain: ['prophet', 'pre-link', 'cl-a', 'coll-b'],
        },
        {
          variant_id: 'v-a3',
          isnad_chain: ['prophet', 'pre-link', 'cl-a', 'coll-c'],
        },
      ],
      reliability_evidence: [
        {
          evidence_id: 'ev-a-001',
          narrator_id: 'cl-a',
          rating: 'thiqah',
          source_type: 'print',
          source_ref: {
            collection: 'Tahdhib al-Kamal',
            source_type: 'print',
            source_locator: 'vol. 1, p. 50',
            ingested_at: '2026-03-21T00:00:00.000Z',
          },
          ingested_at: '2026-03-21T00:00:00.000Z',
        },
      ],
    },
    {
      hadith_id: 'h-b1',
      family_id: 'family-beta',
      source_ref: {
        collection: 'Sahih Muslim',
        source_type: 'print',
        source_locator: 'vol. 2, p. 5',
        ingested_at: '2026-03-21T00:00:00.000Z',
      },
      variants: [
        {
          variant_id: 'v-b1',
          isnad_chain: ['prophet', 'x1', 'cl-b', 'coll-b1'],
        },
        {
          variant_id: 'v-b2',
          isnad_chain: ['prophet', 'x1', 'cl-b', 'coll-b2'],
        },
        {
          variant_id: 'v-b3',
          isnad_chain: ['prophet', 'x1', 'cl-b', 'coll-b3'],
        },
      ],
      reliability_evidence: [
        {
          evidence_id: 'ev-b-001',
          narrator_id: 'cl-b',
          rating: 'saduq',
          source_type: 'print',
          source_ref: {
            collection: 'Taqrib al-Tahdhib',
            source_type: 'print',
            source_locator: 'p. 200',
            ingested_at: '2026-03-21T00:00:00.000Z',
          },
          ingested_at: '2026-03-21T00:00:00.000Z',
        },
      ],
    },
  ],
  narrators: [
    { narrator_id: 'prophet', names: ['The Prophet'] },
    { narrator_id: 'pre-link', names: ['Pre-Link'] },
    { narrator_id: 'cl-a', names: ['CL Alpha'] },
    { narrator_id: 'coll-a', names: ['CA'] },
    { narrator_id: 'coll-b', names: ['CB'] },
    { narrator_id: 'coll-c', names: ['CC'] },
    { narrator_id: 'x1', names: ['X1'] },
    { narrator_id: 'cl-b', names: ['CL Beta'] },
    { narrator_id: 'coll-b1', names: ['CB1'] },
    { narrator_id: 'coll-b2', names: ['CB2'] },
    { narrator_id: 'coll-b3', names: ['CB3'] },
  ],
};
