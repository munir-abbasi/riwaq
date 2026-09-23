# Usage Guide

## Overview

Riwaq is an upgraded version of Academic Crescent, organized into two main tabs:
- `Details & Matn`: data entry, chain summary, and text comparison
- `Spider Chain Map`: spatial view of narrators and their links

Map building is method-agnostic: you can build and use the chain map without running CL/PCL analysis.

## Add a Narrator

1. Enter `Narrator name` (required).
2. Add optional status.
3. If age tracking is needed, set `Age tracking` to `Add birth and death dates`.
4. Add locations and tags.
5. Add matn and notes (optional).
6. Click `Add narrator to chain`.

Narrators are connected in the same sequence they are added.

## Age Tracking Rules

- Birth and death require full day/month/year input.
- Dates are validated against calendar-specific month lengths.
- Death must not be earlier than birth.
- Both solar and Hijri age text are generated when valid.

## Locations and Tags

- Use `Add city` and `Add tag` to build draft chips.
- Click `x` on a chip to remove it.
- Tag shapes supported:
  - `pill`
  - `square`
  - `diamond`

## Matn Alignment

- The first narrator with matn acts as reference.
- Later narrators are compared token-by-token.
- Diff classes:
  - same wording
  - added/changed wording
  - missing wording

For very large texts, the app skips expensive diff computation and shows raw text to keep the UI responsive.

## Spider Chain Map

- Drag narrator cards to reposition them.
- Connector paths update live while dragging.
- Click `Show details`/`Hide details` on a node card for expanded metadata.
- Click `Max map` for fullscreen-focused map mode.

If fullscreen is exited with `Esc`, map UI state is synchronized automatically.

## Persistence and Reset

- Data is auto-saved in browser `localStorage`.
- `Reset form` clears the input form only.
- `Clear chain` removes the current chain from app state.
- `Load example` inserts a demo chain.

## Analytics Workflow (Implemented)

The analytics layer is fully implemented. Two equivalent ways to drive it:

### Option A — the control CLI (no code)

```bash
# One-shot observation: validate -> quality + integrity observations -> canonical report gate
node scripts/riwaq-cli.mjs pipeline your-batch.json

# Discover capabilities and inspect current cross-layer state
node scripts/riwaq-cli.mjs manifest
node scripts/riwaq-cli.mjs impact module.entityResolver cli.snapshot
node scripts/riwaq-cli.mjs snapshot your-batch.json

# Optional integrity baseline: retain the seal separately from the batch
node scripts/riwaq-cli.mjs seal your-batch.json > seal-envelope.json
node scripts/riwaq-cli.mjs verify-seal your-batch.json --manifest seal-envelope.json

# Or step by step
node scripts/riwaq-cli.mjs validate your-batch.json
node scripts/riwaq-cli.mjs analyze your-batch.json --profile structural_only
node scripts/riwaq-cli.mjs report your-batch.json
node scripts/riwaq-cli.mjs export your-batch.json --format md --out report.md
```

Each command prints a JSON envelope. `manifest` is the capability/contract discovery surface; pass one or more returned capability IDs to `impact` to obtain the minimum owners, contract docs, downstream consumers, and verification commands. `report` exposes complete ordered family results under `data.families`; its existing summary fields continue to describe the first family. `pipeline` stays compact and reports per-family gate summaries under `data.report.per_family`; call `report` only when full family details are needed. Its stages declare their authority through `control_type`: validation is a blocking precondition, quality and anti-hallucination results are observations, and the report is the publication gate. `snapshot` is observational: after valid input it exits `0`, while `data.publication.can_export` reports the authoritative publication state delegated from `CanonicalReport.canExport()`. `verify-seal` is also observational: it detects changes relative to a separately retained manifest but does not prove authenticity or affect publication permission. After schema validation succeeds, pipeline `ok`/exit status follows `data.report.can_export`; observation stages do not independently control it.

### Option B — programmatic

1. **Import Data** — Use JSON import with schema v1 format. See `docs/examples/sample-import.json` for a complete valid batch, and `tests/fixtures/phase5/fixtures.js` for example batch structure.

2. **Run Analysis** — Validate and normalize first, then call the analysis API:
   ```javascript
   import { validateBatch } from './scripts/json-validator.js';
   import { analyzeBatch, ANALYSIS_PROFILE } from './scripts/clpcl-analyzer.js';
   const { valid, collector, normalized } = validateBatch(rawJson);
   if (!valid) throw new Error(collector.toReport().summary.error_count + ' blocking errors');
   const result = analyzeBatch(normalized, ANALYSIS_PROFILE.STRUCTURAL_ONLY);
   ```

3. **Review Results** — The analysis returns:
   - `family_status`: `cl_detected`, `pcl_only`, or `insufficient_data`
   - `candidates`: ranked CL/PCL candidates with confidence scores and an `outcome`
   - `analysis_snapshot`: graph metrics and computed features

4. **Generate Reports**:
   ```javascript
   import { CanonicalReport } from './scripts/canonical-report.js';
   import { exportMarkdown } from './scripts/export-md.js';

   const report = CanonicalReport.fromBatch(normalized, { profile: 'structural_only' });
   const md = exportMarkdown(report);
   ```

5. **Export Artifacts**:
   ```javascript
   import { emitArtifacts } from './scripts/artifacts.js';
   const artifacts = emitArtifacts(normalized, analysisResult, familyId);
   // Returns: normalized_chains, narrator_graph, cl_candidates, analysis_snapshot
   ```

### Profiles

- `structural_only` — Uses graph topology features only. Works without reliability evidence.
- `reliability_weighted` — Uses the weighted structural/reliability contract owned by `docs/ARCHITECTURE.md`. It requires evidence **and** an explicitly constructed, injected `ReliabilityLayer`; the CLI flag is `--with-reliability`. Attach evidence to `narrators[].reliability_evidence` so both the layer and claim binding consume the same canonical records. A populated layer supplies per-narrator `derived_confidence`; absent a derived assessment, the prior remains neutral.

### Candidate Outcomes and Export Gate

Outcome bands and contradiction-cap values are owned solely by `docs/ARCHITECTURE.md` §Canonical Numeric and Enum Contracts. Candidate outcomes are separate from `family_status` and from evidence-binding validity. For publication/export decisions, construct a `CanonicalReport` (or run `cli report` / `cli pipeline`) and check `can_export`. A blocking evidence-binding violation sets `analysis_can_proceed` false and closes that gate.
