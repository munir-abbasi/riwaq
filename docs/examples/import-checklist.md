# Pre-Import Validation Checklist

Complete this checklist before running the JSON import validator. All items marked **[BLOCK]** must pass.

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

- [ ] Every `narrator_id` in `isnad_chain` is defined in the `narrators` array
- [ ] Every `narrator_id` in `narrators` is unique
- [ ] Every `narrator_id` matches pattern `^[a-zA-Z0-9_-]+$`

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

- [ ] Import validator passes all `[BLOCK]` checks (no errors)
- [ ] Quality score ≥ 50 (see preflight gate report)
- [ ] All warnings reviewed and acknowledged
- [ ] `import_errors.json` reviewed for false positives
