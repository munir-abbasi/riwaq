/**
 * tests/fixtures/phase1/ — Phase 1 test fixtures
 *
 * These fixtures exercise the JSON validator, preflight gates, and
 * error emitter across all expected input shapes.
 */

export const VALID_BATCH = {
  schema_version: 1,
  imported_at: '2026-03-21T00:00:00.000Z',
  import_id: 'test-valid-001',
  records: [
    {
      hadith_id: 'test-hadith-001',
      family_id: 'test-family-001',
      title: 'Test Hadith — Gabriel Narration',
      source_ref: {
        collection: 'Test Collection',
        source_type: 'print',
        source_locator: 'ISBN 000-0-00000-0-0 / p. 1',
        ingested_at: '2026-03-21T00:00:00.000Z',
      },
      variants: [
        {
          variant_id: 'variant-a',
          isnad_chain: ['narrator-x', 'narrator-y', 'narrator-z'],
          isnad_raw: 'Narrated by X from Y from Z',
          matn_raw: null,
        },
      ],
      matn_raw: null,
      reliability_evidence: [],
    },
  ],
  narrators: [
    {
      narrator_id: 'narrator-x',
      names: ['Narrator X'],
      birth: { year: 100, calendar: 'hijri' },
      death: { year: 180, calendar: 'hijri' },
      locations: ['Baghdad'],
      tags: ['thiqah'],
      reliability_evidence: [],
    },
    {
      narrator_id: 'narrator-y',
      names: ['Narrator Y'],
      locations: ['Kufa'],
      tags: ['saduq'],
      reliability_evidence: [],
    },
    {
      narrator_id: 'narrator-z',
      names: ['Narrator Z'],
      locations: [],
      tags: [],
      reliability_evidence: [],
    },
  ],
};

export const VALID_MULTI_VARIANT = {
  schema_version: 1,
  imported_at: '2026-03-21T00:00:00.000Z',
  records: [
    {
      hadith_id: 'test-multi-001',
      family_id: 'test-family-multi',
      source_ref: {
        collection: 'Test Collection',
        source_type: 'manuscript',
        source_locator: 'Dar al-Kutub MS 1234 / Folio 15a',
        ingested_at: '2026-03-21T00:00:00.000Z',
      },
      variants: [
        {
          variant_id: 'variant-bukhari',
          isnad_chain: ['hisham', 'urwah', 'aisha'],
          isnad_raw: 'Hisham said: my father said: Aisha said...',
        },
        {
          variant_id: 'variant-muslim',
          isnad_chain: ['hisham', 'urwah', 'hafs'],
          isnad_raw: 'Hisham said: my father said: Hafsa reported...',
        },
        {
          variant_id: 'variant-shafii',
          isnad_chain: ['hisham', 'zuhri', 'aisha'],
          isnad_raw: 'Hisham from Zuhri from Aisha...',
        },
      ],
      reliability_evidence: [],
    },
  ],
  narrators: [
    { narrator_id: 'hisham', names: ['Hisham ibn Urwah'], tags: ['thiqah'], reliability_evidence: [] },
    { narrator_id: 'urwah', names: ['Urwah ibn al-Zubayr'], tags: ['thiqah'], reliability_evidence: [] },
    { narrator_id: 'aisha', names: ['Aisha bint Abu Bakr'], tags: ['sahabiyyah'], reliability_evidence: [] },
    { narrator_id: 'hafs', names: ['Hafs ibn Abd al-Rahman'], tags: ['thiqah'], reliability_evidence: [] },
    { narrator_id: 'zuhri', names: ['Ibn Shihab al-Zuhri'], tags: ['thiqah'], reliability_evidence: [] },
  ],
};

export const MALFORMED_MISSING_VERSION = {
  imported_at: '2026-03-21T00:00:00.000Z',
  records: [{ hadith_id: 'x', source_ref: {}, variants: [{ variant_id: 'v1', isnad_chain: ['n'] }] }],
};

export const MALFORMED_WRONG_VERSION = {
  schema_version: 99,
  imported_at: '2026-03-21T00:00:00.000Z',
  records: [{ hadith_id: 'x', source_ref: {}, variants: [{ variant_id: 'v1', isnad_chain: ['n'] }] }],
};

export const MALFORMED_NOT_ARRAY = {
  schema_version: 1,
  imported_at: '2026-03-21T00:00:00.000Z',
  records: 'not an array',
};

export const MALFORMED_EMPTY_RECORDS = {
  schema_version: 1,
  imported_at: '2026-03-21T00:00:00.000Z',
  records: [],
};

export const MALFORMED_BAD_JSON = 'not valid json {';

export const MALFORMED_MISSING_SOURCE_REF = {
  schema_version: 1,
  imported_at: '2026-03-21T00:00:00.000Z',
  records: [{ hadith_id: 'x', variants: [{ variant_id: 'v1', isnad_chain: ['n'] }] }],
};

export const MALFORMED_INVALID_SOURCE_TYPE = {
  schema_version: 1,
  imported_at: '2026-03-21T00:00:00.000Z',
  records: [{
    hadith_id: 'x',
    source_ref: { collection: 'X', source_type: 'invalid_type', source_locator: 'loc', ingested_at: '2026-03-21T00:00:00.000Z' },
    variants: [{ variant_id: 'v1', isnad_chain: ['n'] }],
  }],
};

export const MALFORMED_EMPTY_CHAIN = {
  schema_version: 1,
  imported_at: '2026-03-21T00:00:00.000Z',
  records: [{
    hadith_id: 'x',
    source_ref: { collection: 'X', source_type: 'print', source_locator: 'p.1', ingested_at: '2026-03-21T00:00:00.000Z' },
    variants: [{ variant_id: 'v1', isnad_chain: [] }],
  }],
};

export const MALFORMED_DUPLICATE_HADITH_ID = {
  schema_version: 1,
  imported_at: '2026-03-21T00:00:00.000Z',
  records: [
    {
      hadith_id: 'same-id',
      source_ref: { collection: 'X', source_type: 'print', source_locator: 'p.1', ingested_at: '2026-03-21T00:00:00.000Z' },
      variants: [{ variant_id: 'v1', isnad_chain: ['n'] }],
    },
    {
      hadith_id: 'same-id',
      source_ref: { collection: 'Y', source_type: 'print', source_locator: 'p.2', ingested_at: '2026-03-21T00:00:00.000Z' },
      variants: [{ variant_id: 'v2', isnad_chain: ['n'] }],
    },
  ],
};

export const MALFORMED_INVALID_DATE = {
  schema_version: 1,
  imported_at: 'not-a-date',
  records: [{
    hadith_id: 'x',
    source_ref: { collection: 'X', source_type: 'print', source_locator: 'p.1', ingested_at: 'invalid-date' },
    variants: [{ variant_id: 'v1', isnad_chain: ['n'] }],
  }],
};

export const MALFORMED_ID_WITH_SPACES = {
  schema_version: 1,
  imported_at: '2026-03-21T00:00:00.000Z',
  records: [{
    hadith_id: 'has space',
    source_ref: { collection: 'X', source_type: 'print', source_locator: 'p.1', ingested_at: '2026-03-21T00:00:00.000Z' },
    variants: [{ variant_id: 'v1', isnad_chain: ['n'] }],
  }],
};

export const PARTIAL_MINIMAL = {
  schema_version: 1,
  imported_at: '2026-03-21T00:00:00.000Z',
  records: [{
    hadith_id: 'minimal-001',
    family_id: 'family-minimal',
    source_ref: { collection: 'X', source_type: 'print', source_locator: 'p.1', ingested_at: '2026-03-21T00:00:00.000Z' },
    variants: [{ variant_id: 'v1', isnad_chain: ['unknown-narrator'] }],
  }],
  narrators: [],
};

export const MULTILINGUAL_NARRATORS = {
  schema_version: 1,
  imported_at: '2026-03-21T00:00:00.000Z',
  records: [{
    hadith_id: 'multi-lang-001',
    family_id: 'family-multilang',
    source_ref: { collection: 'Sunan al-Kubra', source_type: 'manuscript', source_locator: 'H manuscript 47 / Folio 12b', ingested_at: '2026-03-21T00:00:00.000Z' },
    variants: [{
      variant_id: 'albayhaqi-v1',
      isnad_chain: ['albayhaqi', 'abd-allah-muqri', 'abu-umayya'],
      isnad_raw: 'أخبرنا الشيخ أبو عمر قال أنا أبو أيوب عن ابن المنذر',
    }],
  }],
  narrators: [
    {
      narrator_id: 'albayhaqi',
      names: ['Ahmad ibn al-Husayn al-Bayhaqi', 'الإمام البيهقي'],
      kunya: 'Abu Bakr',
      locations: [],
      tags: [],
      reliability_evidence: [],
    },
    {
      narrator_id: 'abd-allah-muqri',
      names: ['Abd Allah ibn Muhammad al-Muqri'],
      locations: [],
      tags: [],
      reliability_evidence: [],
    },
    {
      narrator_id: 'abu-umayya',
      names: ['Abu Umayya al-Khafaji'],
      locations: [],
      tags: [],
      reliability_evidence: [],
    },
  ],
};

export const EDGE_CASE_SINGLE_NARRATOR = {
  schema_version: 1,
  imported_at: '2026-03-21T00:00:00.000Z',
  records: [{
    hadith_id: 'single-chain',
    family_id: 'family-single',
    source_ref: { collection: 'X', source_type: 'oral_report', source_locator: 'Interview with Dr. Smith, 2024-03-15', ingested_at: '2026-03-21T00:00:00.000Z' },
    variants: [{
      variant_id: 'v1',
      isnad_chain: ['only-one-narrator'],
    }],
  }],
  narrators: [{ narrator_id: 'only-one-narrator', names: ['The Only Narrator'], tags: [], reliability_evidence: [] }],
};

export const EDGE_CASE_URL_SOURCE = {
  schema_version: 1,
  imported_at: '2026-03-21T00:00:00.000Z',
  records: [{
    hadith_id: 'url-source-001',
    family_id: 'family-url',
    source_ref: {
      collection: 'Open Arabic Hadith Corpus',
      source_type: 'url',
      source_locator: 'https://example.com/hadith/1247',
      ingested_at: '2026-03-21T00:00:00.000Z',
      checksum: 'sha256:a3f8b2c1d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1',
      parser_version: 'v1.2.0',
    },
    variants: [{ variant_id: 'v1', isnad_chain: ['n1', 'n2'] }],
  }],
  narrators: [
    { narrator_id: 'n1', names: ['Narrator 1'], tags: [], reliability_evidence: [] },
    { narrator_id: 'n2', names: ['Narrator 2'], tags: [], reliability_evidence: [] },
  ],
};

export const EDGE_CASE_ALL_RATINGS = {
  schema_version: 1,
  imported_at: '2026-03-21T00:00:00.000Z',
  records: [{
    hadith_id: 'all-ratings-001',
    family_id: 'family-ratings',
    source_ref: { collection: 'Test', source_type: 'print', source_locator: 'p.1', ingested_at: '2026-03-21T00:00:00.000Z' },
    variants: [{ variant_id: 'v1', isnad_chain: ['r1', 'r2', 'r3', 'r4', 'r5', 'r6'] }],
    reliability_evidence: [
      {
        evidence_id: 'ev-thiqah',
        narrator_id: 'r1',
        rating: 'thiqah',
        source_type: 'print',
        source_ref: { collection: 'Tahdhib', source_type: 'print', source_locator: 'p.1', ingested_at: '2026-03-21T00:00:00.000Z' },
        ingested_at: '2026-03-21T00:00:00.000Z',
      },
      {
        evidence_id: 'ev-saduq',
        narrator_id: 'r2',
        rating: 'saduq',
        source_type: 'print',
        source_ref: { collection: 'Tahdhib', source_type: 'print', source_locator: 'p.1', ingested_at: '2026-03-21T00:00:00.000Z' },
        ingested_at: '2026-03-21T00:00:00.000Z',
      },
      {
        evidence_id: 'ev-majhul',
        narrator_id: 'r3',
        rating: 'majhul',
        source_type: 'print',
        source_ref: { collection: 'Tahdhib', source_type: 'print', source_locator: 'p.1', ingested_at: '2026-03-21T00:00:00.000Z' },
        ingested_at: '2026-03-21T00:00:00.000Z',
      },
      {
        evidence_id: 'ev-daif',
        narrator_id: 'r4',
        rating: 'daif',
        source_type: 'print',
        source_ref: { collection: 'Tahdhib', source_type: 'print', source_locator: 'p.1', ingested_at: '2026-03-21T00:00:00.000Z' },
        ingested_at: '2026-03-21T00:00:00.000Z',
      },
      {
        evidence_id: 'ev-matruk',
        narrator_id: 'r5',
        rating: 'matruk',
        source_type: 'print',
        source_ref: { collection: 'Tahdhib', source_type: 'print', source_locator: 'p.1', ingested_at: '2026-03-21T00:00:00.000Z' },
        ingested_at: '2026-03-21T00:00:00.000Z',
      },
      {
        evidence_id: 'ev-accused',
        narrator_id: 'r6',
        rating: 'accused_fabrication',
        source_type: 'print',
        source_ref: { collection: 'Tahdhib', source_type: 'print', source_locator: 'p.1', ingested_at: '2026-03-21T00:00:00.000Z' },
        ingested_at: '2026-03-21T00:00:00.000Z',
      },
    ],
  }],
  narrators: ['r1', 'r2', 'r3', 'r4', 'r5', 'r6'].map(id => ({ narrator_id: id, names: [`Narrator ${id}`], tags: [], reliability_evidence: [] })),
};
