#!/usr/bin/env node
/**
 * scripts/generate-medium-fixture.js
 *
 * Generates tests/fixtures/phase1/medium-fixture.json
 * Medium fixture: 1000 variants, <= 60 narrators/variant
 * Used for SLO baseline testing (import validation <= 3s p95).
 */
import { writeFileSync } from 'fs';

const NARRATOR_COUNT = 80;
const VARIANT_COUNT = 1000;
const MAX_CHAIN = 60;

const narrators = [];
for (let i = 0; i < NARRATOR_COUNT; i++) {
  narrators.push({
    narrator_id: `n${i}`,
    names: [`Narrator ${i}`, `al-Narrator al-${i}`],
    birth: { year: 50 + (i % 100), calendar: 'hijri' },
    death: { year: 150 + (i % 100), calendar: 'hijri' },
    locations: i % 3 === 0 ? ['Baghdad'] : i % 3 === 1 ? ['Kufa'] : ['Basra'],
    tags: i % 5 === 0 ? ['thiqah'] : i % 5 === 1 ? ['saduq'] : [],
    reliability_evidence: [],
  });
}

const records = [];
for (let v = 0; v < VARIANT_COUNT; v++) {
  const chainLen = 5 + (v % (MAX_CHAIN - 4));
  const chain = [];
  for (let c = 0; c < chainLen; c++) {
    chain.push(`n${(v + c * 7) % NARRATOR_COUNT}`);
  }

  records.push({
    hadith_id: `hadith-${v}`,
    family_id: `family-${v % 50}`,
    title: `Hadith ${v}`,
    source_ref: {
      collection: 'Generated Test Collection',
      source_type: v % 4 === 0 ? 'print' : v % 4 === 1 ? 'manuscript' : v % 4 === 2 ? 'url' : 'oral_report',
      source_locator: v % 4 === 0 ? `ISBN 000-0-00000-${String(v).padStart(4, '0')} / p. ${v}` :
                      v % 4 === 1 ? `MS ${v} / Folio ${v % 50}b` :
                      v % 4 === 2 ? `https://test.example/hadith/${v}` :
                      `Interview ${v}`,
      ingested_at: '2026-03-21T00:00:00.000Z',
    },
    variants: [{
      variant_id: `variant-${v}`,
      isnad_chain: chain,
    }],
    reliability_evidence: [],
  });
}

const batch = {
  schema_version: 1,
  imported_at: new Date().toISOString(),
  import_id: 'medium-fixture',
  records,
  narrators,
};

const filePath = new URL('../tests/fixtures/phase1/medium-fixture.json', import.meta.url);
writeFileSync(filePath, JSON.stringify(batch));
console.log(`Generated ${VARIANT_COUNT} variants, ${NARRATOR_COUNT} narrators → ${filePath}`);
