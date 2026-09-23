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
3. Verify the chain orientation against the source before conversion; OCR order and source layout cannot be assumed
4. Apply text normalization only to the extent needed for matching, while preserving the source wording separately
5. Resolve each narrator to a persistent canonical ID using a maintained identity map

### 4. Markdown Tables

Convert each table row to a `NarratorProfile` entry.
For chain tables, create one `IsnadVariant` per distinct column.

## ID Generation Rules

Narrator IDs must:
- Be alphanumeric + hyphen/underscore only: `^[a-zA-Z0-9_-]+$`
- Be stable across imports (same narrator = same ID)
- Be ≤ 128 characters
- Be collision-safe without depending on array position or import order

The repository does not define a canonical narrator-ID generator for imports. `scripts/compatibility-adapter.js` contains browser-workspace migration logic and must not be treated as the import-ID authority. External conversion tooling should assign an ID once, persist the name-to-ID mapping, and reuse that ID on later imports. If two narrators normalize to the same slug, resolve the collision with a stable disambiguator that remains the same across imports.

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

Fastest path — the control CLI (no code):

```bash
node scripts/riwaq-cli.mjs pipeline your-import.json
```

This validates, scores quality, runs the integrity sweep, and builds the report in one shot; the JSON envelope on stdout contains every stage's results and exit code is `0` only when the export gate is open.

Programmatic path — `scripts/json-validator.js` is a module API. Call `validateBatch(rawJson)` and inspect the returned `valid`, `collector`, and `normalized` values. For example:

```javascript
import fs from 'node:fs';
import { validateBatch } from '../../scripts/json-validator.js';

const raw = fs.readFileSync('your-import.json', 'utf8');
const { valid, collector, normalized } = validateBatch(raw);

console.log(JSON.stringify(collector.toReport(), null, 2));
if (!valid) process.exitCode = 1;
```

Then:

1. Fix all blocking validation errors before importing.
2. Review unresolved narrator and other warnings in context. Note: the standalone anti-hallucination sweep treats undeclared chain narrators as *blocking* even though the validator only warns (`cli hallucination`).
3. Run the preflight gates on the normalized batch (`cli gates`).
4. Treat quality score `<20` as blocking, `20–49` as warning-only, and `>=50` as a healthier target rather than a hard validity threshold (bands owned by `docs/ARCHITECTURE.md`).
5. If your wrapper writes a report file, document that wrapper explicitly; the validator module itself does not create `import_errors.json`.
