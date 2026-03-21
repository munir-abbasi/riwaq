# Import Assets — Conversion Guide

## Files Provided

| File | Purpose |
|------|---------|
| `docs/examples/sample-import.json` | Valid canonical format reference |
| `docs/examples/import-conversion-notes.md` | This file — step-by-step conversion from common source formats |
| `docs/examples/import-checklist.md` | Pre-import validation checklist |
| `docs/examples/import-template.csv` | Spreadsheet template for narrators |

## Source Format → Canonical Mapping

### 1. Spreadsheet Format (Excel/CSV)

**Common columns:** `Narrator`, `Role`, `Birth AH`, `Death AH`, `City`, `Status`, `Notes`

| Spreadsheet Column | Canonical Field |
|-------------------|----------------|
| `Narrator` | `narrators[].names[0]` |
| `Kunya` | `narrators[].kunya` |
| `Birth AH` | `narrators[].birth.year` + `calendar: "hijri"` |
| `Death AH` | `narrators[].death.year` + `calendar: "hijri"` |
| `City` | `narrators[].locations[0]` |
| `Status` | Map to tag: `Thiqah` → `thiqah`, `Saduq` → `saduq`, `Daif` → `daif` |
| `Notes` | `narrators[].biographical_notes` |
| `Variant` | `variants[].variant_id` (all narrators share one variant unless explicitly separated) |

### 2. JSON (existing apps / OCR output)

Map each chain object to a `HadithRecord`:

```
Your chain:    →  import-batch.records[].variants[].isnad_chain[]
Your narrators →  import-batch.narrators[]
```

If your JSON uses `chain` or `isnad` keys, rename to `isnad_chain`.
If narrators are embedded per-record, extract to the top-level `narrators[]` array.

### 3. Text Format (OCR / manual transcription)

For OCR output of printed texts:

1. Parse each line for the pattern: `حدثنا X عن Y عن Z`
2. Token-split on ` عن ` (Arabic "an")
3. Reverse the order (raw OCR is bottom-to-top, our schema is bottom-to-top too — verify)
4. Apply normalization: strip diacritics, normalize alif/ya variations
5. Assign canonical IDs using `deriveNarratorId()` logic: `lowercase(arabic-to-latin(name))`

### 4. Markdown Tables

Convert each table row to a `NarratorProfile` entry.
For chain tables, create one `IsnadVariant` per distinct column.

## ID Generation Rules

Narrator IDs must:
- Be alphanumeric + hyphen/underscore only: `^[a-zA-Z0-9_-]+$`
- Be stable across imports (same narrator = same ID)
- Be ≤ 128 characters

Use this derivation strategy:

```
normalized = name.toLowerCase().trim()
            .replace(/[^a-z0-9\s-]/g, '')  // strip non-Latin chars
            .replace(/\s+/g, '-')
base_id = normalized || `narrator-${index}`
id = `${base_id}:i${index}`  // index ensures uniqueness
```

For Arabic names, also create a secondary ID with Arabic transliteration.

## Provenance Requirements

Every `record` **must** have a `source_ref` with:

- `collection` — e.g., "Sahih al-Bukhari"
- `source_type` — one of: `url | print | manuscript | oral_report`
- `source_locator` — URL, ISBN/page, manuscript shelfmark, or interview reference
- `ingested_at` — ISO 8601 timestamp of when this record was created

Optional but recommended:
- `checksum` — SHA-256 of the source data
- `parser_version` — version of your extraction/OCR tool

## Common Errors to Avoid

1. **Empty `isnad_chain`**: Each variant must have at least one narrator.
2. **Missing `schema_version`**: Must be `1`.
3. **Missing `imported_at`**: Must be ISO 8601 date-time.
4. **Duplicate IDs**: Each `hadith_id`, `variant_id`, and `narrator_id` must be unique.
5. **Invalid `source_type`**: Must match the enum exactly.
6. **Unparseable dates**: `ingested_at` must pass `new Date()` validation.
7. **Pattern mismatch**: IDs with spaces, slashes, or special characters will fail schema validation.

## Post-Conversion Validation

1. Run the JSON validator: `node scripts/json-validator.js < your-import.json`
2. Review `import_errors.json` for errors and warnings.
3. Fix all blocking errors before importing.
4. Address warnings for best analysis quality.
5. Run preflight gates to see quality score.
