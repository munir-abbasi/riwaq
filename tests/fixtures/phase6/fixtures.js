/**
 * tests/fixtures/phase6/fixtures.js
 *
 * Phase 6 — Deterministic E2E Test Fixtures
 *
 * FIXTURE_E2E_MINIMAL: Minimal fixture for determinism testing.
 * - Single hadith, single variant, 4 narrators
 * - No external reliability evidence (avoids network/time dependencies)
 * - All timestamps pinned to epoch for byte-exact reproducibility
 * - source_type: 'print' (valid schema enum value)
 */
export const FIXTURE_E2E_MINIMAL = {
  schema_version: 1,
  imported_at: '2026-01-01T00:00:00.000Z',
  records: [
    {
      hadith_id: 'e2e-001',
      family_id: 'f-e2e',
      source_ref: {
        collection: 'Test Collection',
        source_type: 'print',
        source_locator: 'test-001',
        ingested_at: '2026-01-01T00:00:00.000Z',
      },
      variants: [
        {
          variant_id: 'v-e2e',
          isnad_chain: ['prophet', 'n1', 'n2', 'collector'],
          matn_raw: 'Test matn text.',
        },
      ],
      reliability_evidence: [],
      metadata: { test_fixture: true },
    },
  ],
};

export const FIXTURE_E2E_WITH_EVIDENCE = {
  schema_version: 1,
  imported_at: '2026-01-01T00:00:00.000Z',
  records: [
    {
      hadith_id: 'e2e-002',
      family_id: 'f-e2e-ev',
      source_ref: {
        collection: 'Test Collection',
        source_type: 'print',
        source_locator: 'test-002',
        ingested_at: '2026-01-01T00:00:00.000Z',
      },
      variants: [
        {
          variant_id: 'v-e2e-a',
          isnad_chain: ['prophet', 'n1', 'n2', 'n3', 'collector'],
          matn_raw: 'Variant A.',
        },
        {
          variant_id: 'v-e2e-b',
          isnad_chain: ['prophet', 'n1', 'n4', 'n3', 'collector'],
          matn_raw: 'Variant B.',
        },
      ],
      reliability_evidence: [
        {
          evidence_id: 'ev-001',
          narrator_id: 'n1',
          rating: 'thiqah',
          source_ref: {
            collection: 'Tahdhib',
            source_type: 'print',
            source_locator: 'vol. 1',
            ingested_at: '2026-01-01T00:00:00.000Z',
          },
          scholar: 'Tester',
          ingested_at: '2026-01-01T00:00:00.000Z',
        },
        {
          evidence_id: 'ev-002',
          narrator_id: 'n2',
          rating: 'majhur',
          source_ref: {
            collection: 'Tahdhib',
            source_type: 'print',
            source_locator: 'vol. 1',
            ingested_at: '2026-01-01T00:00:00.000Z',
          },
          scholar: 'Tester',
          ingested_at: '2026-01-01T00:00:00.000Z',
        },
      ],
      metadata: { test_fixture: true },
    },
  ],
};
