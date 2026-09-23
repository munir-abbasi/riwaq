# Pre-Import Validation Checklist

Complete this checklist before running the JSON import validator. All items marked **[BLOCK]** must pass.

> **Faster path:** the first three Post-Validation items can be checked in one command:
> `node scripts/riwaq-cli.mjs pipeline your-batch.json` (validate + quality gates + integrity sweep + report).

## Schema Integrity [BLOCK]

- [ ] `schema_version` is present and equals `1`
- [ ] `imported_at` is a valid ISO 8601 date-time
- [ ] `records` is a non-empty array
- [ ] JSON is valid (passes `JSON.parse` without error)

## Record-Level [BLOCK]

- [ ] Every `record` has a unique `hadith_id`
- [ ] Every `record` has a `source_ref` object
- [ ] Every `source_ref` has: `collection`, `source_type`, `source_locator`, `ingested_at`
- [ ] Every `source_ref.source_type` is one of: `url`, `print`, `manuscript`, `oral_report`
- [ ] Every `source_ref.ingested_at` is a valid ISO 8601 date-time
- [ ] Every `record.variants` is a non-empty array
- [ ] Every `variant.isnad_chain` is a non-empty array of strings
- [ ] No duplicate `variant_id` within or across records

## Narrator References

- [ ] Review every unresolved `narrator_id` warning; undefined profiles are non-blocking but may leave biography/reliability data incomplete
- [ ] Every `narrator_id` in `narrators` is unique
- [ ] Every `narrator_id` matches pattern `^[a-zA-Z0-9_-]+$`
- [ ] Stable IDs are no longer than 128 characters

## Reliability Evidence [BLOCK when present]

- [ ] Every evidence record has `evidence_id`, `narrator_id`, `rating`, `source_type`, `source_ref`, and `ingested_at`
- [ ] `rating` is one of: `thiqah`, `saduq`, `majhul`, `daif`, `matruk`, `accused_fabrication`
- [ ] `source_type` is one of: `url`, `print`, `manuscript`, `oral_report`
- [ ] `source_ref` contains `collection`, `source_type`, `source_locator`, and `ingested_at`
- [ ] Optional `rating_confidence`, when supplied, is between 0 and 1

## Quality Recommendations

- [ ] Each `narrator` has at least one name in `names[]`
- [ ] Each `narrator` has at least one of: birth/death date, location, biographical notes
- [ ] Reliability evidence is attached to narrators where known
- [ ] Source checksums are provided for digital sources
- [ ] Variant diversity exists (not all records have identical chains)

## Arabic / Transliteration

- [ ] Arabic narrator names are transliterated or preserved in `names[]`
- [ ] No diacritical marks (tashkeel) in IDs
- [ ] Special characters in names are handled (use `aliases[]` for variants)

## Source Verification

- [ ] Printed sources include ISBN and page number
- [ ] Manuscript sources include shelfmark and folio number
- [ ] URL sources are verified accessible
- [ ] Oral report sources document date, interviewer, and interviewee

## Post-Validation

- [ ] Import validator passes all `[BLOCK]` checks (no errors) — `node scripts/riwaq-cli.mjs validate <file>` exits 0
- [ ] Preflight quality score is reviewed: `<20` blocks; `20–49` warns but proceeds; `>=50` is the healthier target, not a hard validity gate — `node scripts/riwaq-cli.mjs gates <file>` (bands owned by `docs/ARCHITECTURE.md`)
- [ ] Optional integrity sweep: `node scripts/riwaq-cli.mjs hallucination <file>` — stricter than schema validation; blocks undeclared chain narrators and synthetic-pattern IDs (`test_`, `auto_`, `generated_`, `null`, `unknown`, …) that the schema validator accepts
- [ ] All warnings reviewed and acknowledged
- [ ] If your calling workflow writes a validation report, review that report; `scripts/json-validator.js` itself does not create `import_errors.json`
