# Schema Versioning

Riwaq has two independent versioned schema domains. They intentionally use different version fields and compatibility rules.

## 1. Browser Persisted Workspace Schema

**Owner:** `scripts/compatibility-adapter.js` plus browser load/save logic in `index.html`
**Storage key:** `hadith-chain-builder-v2`
**Version field:** `_schema_version`

### Principles

1. Migrations move forward from an older persisted representation to the current one.
2. Migration functions must be idempotent for already-migrated state.
3. Existing user-authored chain data must not be silently discarded.
4. The serialized payload owns its `_schema_version` at the top level.

### Registry

| Version | Meaning | Migration |
|---|---|---|
| `0` | Legacy single-chain workspace | origin |
| `1` | Family/variant workspace representation | `migrateToV1(...)` |

The v0 to v1 adapter converts legacy chain state into a family with a variant, maps narrators into canonical narrator entities, preserves user data, and records migration metadata.

When changing this schema, update the compatibility adapter, its existing tests, and this document together.

## 2. Programmatic Import Batch Schema

**Owner:** `scripts/json-validator.js`
**Version field:** `schema_version`
**Current version:** `1`

This schema is the input contract for analysis. It is not the localStorage representation. A valid batch contains an import timestamp, one or more hadith records, family IDs, variants with ordered narrator IDs, source provenance, optional narrator profiles, and optional reliability evidence.

**Authoritative representation:** the JSON files under `schemas/` are descriptive mirrors only; they are not loaded at runtime. The authoritative schema is the inline `SCHEMA` object inside `scripts/json-validator.js` (Ajv-compiled). When this schema evolves, update the inline schema, its tests, and (editorially) the mirrors together.

`validateBatch(rawJson)` performs validation and returns `{ valid, collector, normalized }`. When blocking validation errors exist, `normalized` is null. Unknown narrator references are warnings; normalization does not generate narrator profiles for them.

Reliability evidence records require these fields in the current import schema:

```text
evidence_id
narrator_id
rating
source_type
source_ref
ingested_at
```

Allowed imported ratings are `thiqah`, `saduq`, `majhul`, `daif`, `matruk`, and `accused_fabrication`.

The canonical evidence attachment point is `narrators[].reliability_evidence`. Both reliability derivation and claim binding consume it. Version 1 continues to accept `records[].reliability_evidence` as a binding-only compatibility location; retaining acceptance avoids invalidating existing batches and therefore does not require a schema-version increment. When an evidence ID appears in both locations, binding uses the narrator-level record.

Optional evidence curation fields were added to `ReliabilityEvidence`: `edition`, `normalization_note`, and the curation block `curated_by`, `revised_at`, `revision_note` (all optional and nullable; `revised_at` is an ISO 8601 `date-time`). The change is additive-optional validation tightening: batches that do not use the new names are unaffected, so `schema_version` stays at `1`, following the same no-increment precedent as the record-level evidence location above. The fields survive normalization and appear in the report's dereferenced evidence projection (`evidence_refs[].evidence`).

## 3. Why the Schemas Stay Separate

The browser schema answers “how is an interactive workspace persisted and upgraded?” The import schema answers “what external research data is acceptable input to the analytical pipeline?” They have different consumers, lifecycles, and compatibility risks.

The fact that both are currently version 1 is incidental. Never migrate one schema merely because the other changes version.

## 4. Derived Data Is Not a Third Persistence Schema

Narrator graphs, feature vectors, candidate scores, explainability output, canonical reports, and export artifacts are derivations from canonical input plus explicit analysis options. Prefer regenerating them after input or methodology changes rather than treating them as an independently authoritative persisted state.

If a future feature persists a derived snapshot for reproducibility, it must include enough metadata to identify the source schema version, analysis profile, and methodology or code version needed to interpret it.

Integrity manifests are optional sidecars rather than a third schema domain. They fingerprint normalized canonical records without changing the import payload or its `schema_version`.

## 5. Rollback and Recovery

There is no automated reverse migration for browser state. Recovery depends on a previously exported known-good state or clearing local storage and rebuilding the workspace. Any future migration that could destroy information therefore requires a tested forward migration path and an explicit backup or export strategy before release.
