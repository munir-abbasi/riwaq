# Schema Versioning

## Principles

1. **Forward-only migrations** — a migration always goes from version N → N+1. No rollback migrations.
2. **Idempotent migrations** — running the same migration twice on the same payload produces identical output.
3. **Zero-loss upgrades** — existing `hadith-chain-builder-v2` state must survive the upgrade to family/variant format.
4. **Version field lives at the top of the serialized payload** under key `_schema_version`.

## Version Registry

| Version | Description | Migration |
|---------|-------------|-----------|
| `0` | Legacy single-chain format: `{ narrators: [...], draftLocations: [...], draftTags: [...] }` stored under key `hadith-chain-builder-v2` | None (origin) |
| `1` | Canonical family/variant format: `{ _schema_version: 1, hadith_families: [...], workspace: {...}, _meta: {...} }` | `migrate-v0-to-v1()` in compatibility-adapter.js |

## v0 → v1 Migration

The `migrateToV1(legacyPayload)` function in `scripts/compatibility-adapter.js` performs this upgrade. It is applied automatically on `loadState()` when the stored payload has no `_schema_version` field.

### v0 → v1 Transformation Rules

1. Each legacy chain becomes one `HadithFamily` with a single `IsnadVariant`.
2. Each narrator becomes a `NarratorEntity` with the legacy fields mapped to canonical fields.
3. All narrators in a variant are ordered by their `index` field → canonical `chain_order`.
4. Dates, locations, tags, and biographical notes are preserved verbatim.
5. `variant_id` is generated as `"legacy-variant-0"` for the single variant.
6. `hadith_family_id` is generated as `"legacy-family-0"`.
7. An `_meta.migration` block records migration metadata: `from_version: 0`, `migrated_at: <ISO8601>`.

## v1 Format (Canonical — Locked)

```json
{
  "_schema_version": 1,
  "_meta": {
    "created_at": "ISO8601",
    "migrated_at": "ISO8601|null",
    "from_version": 0|null,
    "last_modified": "ISO8601"
  },
  "hadith_families": [
    {
      "hadith_family_id": "string",
      "title": "string|null",
      "source_ref": { "collection": "string", "source_type": "string", "source_locator": "string", "ingested_at": "ISO8601" },
      "variants": [
        {
          "variant_id": "string",
          "isnad_chain": ["narrator_id_0", "narrator_id_1", "..."],
          "isnad_raw": "original text|null",
          "matn_raw": "original text|null",
          "metadata": { /* provenance, dates, etc. */ }
        }
      ],
      "narrators": [
        {
          "narrator_id": "string",
          "names": ["string"],
          "kunya": "string|null",
          "layla": "string|null",
          "birth": { "jdn": "number|null", "description": "string|null" },
          "death": { "jdn": "number|null", "description": "string|null" },
          "biographical_notes": "string|null",
          "locations": ["string"],
          "tags": ["string"],
          "reliability_evidence": [ /* ReliabilityEvidence[] */ ]
        }
      ],
      "analyses": [
        {
          "analysis_id": "string",
          "profile": "structural_only|reliability_weighted",
          "status": "analysis_not_run|completed",
           "results": [ /* AnalysisResult[] — see ARCHITECTURE.md and scripts/clpcl-analyzer.js */ ]
        }
      ]
    }
  ],
  "workspace": {
    "active_family_id": "string|null",
    "ui_state": { /* tab, scroll, zoom, etc. */ }
  }
}
```

## Future Migrations

When adding version 2:
1. Add `migrateToV2(v1Payload)` function to `scripts/compatibility-adapter.js`.
2. Register it in the `MIGRATIONS` registry.
3. Document the transformation rules here.
4. Add a test in `tests/node/compatibility-adapter.test.js`.
5. Increment `_schema_version` in the app source.

## Rollback Policy

Rollback is not supported by the migration system. If a migration produces corrupted output, the user can:
1. Clear browser localStorage (losing unsaved data).
2. Re-load the last known-good state from a JSON export.

No automated rollback is implemented; the system is designed for forward-only migration.
