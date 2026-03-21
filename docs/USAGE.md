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

The analytics layer is fully implemented. To use:

1. **Import Data** — Use JSON import with schema v1 format. See `tests/fixtures/phase5/fixtures.js` for example batch structure.

2. **Run Analysis** — Call the pipeline programmatically:
   ```javascript
   import { analyzeBatch, ANALYSIS_PROFILE } from './scripts/clpcl-analyzer.js';
   const result = analyzeBatch(batch, ANALYSIS_PROFILE.STRUCTURAL_ONLY);
   // or
   const result = analyzeBatch(batch, ANALYSIS_PROFILE.RELIABILITY_WEIGHTED);
   ```

3. **Review Results** — The analysis returns:
   - `family_status`: `supported`, `contested`, `insufficient_data`, or `contradicted`
   - `candidates`: ranked CL/PCL candidates with confidence scores
   - `analysis_snapshot`: graph metrics and computed features

4. **Generate Reports**:
   ```javascript
   import { CanonicalReport } from './scripts/canonical-report.js';
   import { exportMarkdown } from './scripts/export-md.js';
   import { exportDOCX } from './scripts/export-docx.js';
   import { exportPDF } from './scripts/export-pdf.js';

   const report = CanonicalReport.fromBatch(batch, { profile: 'structural_only' });
   const md = exportMarkdown(report);
   const docx = await exportDOCX(report);
   const pdf = await exportPDF(report);
   ```

5. **Export Artifacts**:
   ```javascript
   import { emitArtifacts } from './scripts/artifacts.js';
   const artifacts = emitArtifacts(batch, analysisResult, familyId);
   // Returns: normalized_chains, narrator_graph, cl_candidates, analysis_snapshot
   ```

### Profiles

- `structural_only` — Uses graph topology features only. Works without reliability evidence.
- `reliability_weighted` — Blends structural score (65%) with reliability prior (35%). Requires evidence.

### Claim Confidence Levels

- `HIGH` — Structural score ≥0.7 AND reliability evidence supports (thiqah/sahih)
- `MEDIUM` — Structural score ≥0.5, or weak reliability
- `LOW` — Structural score <0.5 or no evidence
- `UNSUPPORTED` — Claim made without analysis

The anti-hallucination layer prevents unsupported claims from reaching exports. See `scripts/evidence-binding.js` for validation logic.
