# Architecture

## Runtime Model

The application is a single static HTML document containing:
- HTML structure
- Embedded CSS theme and layout
- Embedded JavaScript state and behavior

No backend, database, or external API is required for core operation.

## Source-of-Truth Strategy

- `index.html` is the canonical source of truth for the application.
- `academic/index.html` is the deploy artifact — a direct copy of `index.html`.
- `scripts/sync-academic.sh` copies `index.html` → `academic/index.html`.
- CI runs `scripts/verify-parity.sh` (or the equivalent `cmp` check) before deploy.
- Never edit `academic/index.html` directly — always edit `index.html` and re-sync.

Run `npm run sync` before any PR merge or deploy to keep the two files in sync.

## Architectural Principle

- Isnad map construction is the core workflow and is independent of any specific analytical school.
- CL/PCL analytics is a separate interpretation layer that can be applied after map creation.
- Map building always works, even when analytics is disabled.

## Core State

Global in-memory state:
- `state.narrators`: saved chain entries
- `state.draftLocations`: current form draft locations
- `state.draftTags`: current form draft tags

State is serialized to `localStorage` using key `hadith-chain-builder-v2`.

### Schema Versioning

Persisted state uses schema versioning to support format upgrades:
- **v0** (legacy): `{ narrators: [...] }` — single linear chain
- **v1** (canonical): `{ _schema_version: 1, hadith_families: [...], workspace: {...} }`

The `scripts/compatibility-adapter.js` module provides `migrateToV1()` for automatic v0→v1 upgrade. See `docs/SCHEMA-VERSIONING.md` for full policy.

## Module Boundaries

The monolithic `index.html` is organized into conceptually separate modules. These are **not** separate files (no build tooling), but they maintain clear internal boundaries:

### Module 1: State Management (`index.html` lines ~854–1300)
- **Responsibility:** Persist/load `state`, serialize form data
- **Public API:**
  - `saveState()` — serialize state to localStorage
  - `loadState()` — deserialize and sanitize; auto-applies v0→v1 migration
  - `resetForm()` — reset form and draft state
  - `serializeForm()` — read form fields into narrator object
  - `sanitizeNarrator(raw, index)` — normalize and validate
- **Dependencies:** None

### Module 2: Rendering Pipeline (`index.html` lines ~1400–1650)
- **Responsibility:** DOM updates, SVG canvas, chain list
- **Public API:**
  - `renderCanvas()` — full re-render (entry point)
  - `renderConnections()` — draw SVG paths between nodes
  - `renderList()` — chain summary list
  - `renderMatnAlignment()` — matn diff cards
  - `buildNode(narrator, index)` — create DOM element for one narrator
  - `enableDragging(node, narrator)` — drag-and-drop
  - `updateCanvasSize()` — resize canvas
  - `updateStats()` — update top-level counts
- **Dependencies:** Module 1 (reads `state.narrators`)

### Module 3: Date and Age Computation (`index.html` lines ~955–1120)
- **Responsibility:** Julian Day Number (JDN) conversions, age calculation
- **Public API:**
  - `gregorianToJdn(year, month, day)` → number
  - `hijriToJdn(year, month, day)` → number
  - `jdnToGregorian(jdn)` → `{year, month, day}`
  - `jdnToHijri(jdn)` → `{year, month, day}`
  - `toJdn(parts)` → number (dispatches by calendar)
  - `calculateAges()` → void (reads DOM, writes preview text)
  - `calculateAgesFromParts(birth, death)` → string
  - `diffYmd(start, end, monthLengthGetter)` → `{years, months, days}`
  - `formatAge(diff, unit)` → string
- **Dependencies:** None (pure functions)

### Module 4: UI / Tab Control (`index.html` lines ~912–950)
- **Responsibility:** Tab switching, fullscreen map, viewport state
- **Public API:**
  - `switchTab(tabName)` — show Details or Map panel
  - `setMapMaximized(nextValue)` — toggle fullscreen
  - `syncMapFullscreenState()` — sync with browser fullscreen API
- **Dependencies:** Module 2 (triggers renders)

### Module 5: Draft / Form Management (`index.html` lines ~1132–1210)
- **Responsibility:** In-progress narrator entry before submission
- **Public API:**
  - `renderDraftChips(type)` — render tag/location chips
  - `addDraftItem(type)` — add to draft arrays
  - `removeDraftItem(type, index)` — remove from draft arrays
  - `getDefaultPosition(index)` — position hint for auto-layout
  - `updateAgePreview()` — live age preview from form fields
- **Dependencies:** Module 2 (reads DOM form fields)

### Module 6: Data Sanitation / Normalization (`index.html` lines ~1123–1225)
- **Responsibility:** Input normalization, shape validation, defaults
- **Public API:**
  - `sanitizeNarrator(rawNarrator, index)` — main normalization entry point
  - `sanitizeDateParts(parts)` — coerce date fields to safe values
  - `normalizeTag(tag)` → string
  - `normalizeTagShape(shape)` → string
  - `escapeHtml(value)` → string
- **Dependencies:** Module 1 (called by `serializeForm()`)

### Module 7: Matn Diffing (`index.html` lines ~1524–1590)
- **Responsibility:** Word-level diff for matn comparison
- **Public API:**
  - `tokenizeMatn(text)` → string[]
  - `buildMatnDiff(referenceText, currentText)` → diff segments
  - LCS-based algorithm with O(n*m) complexity, guarded by `MAX_MATN_DIFF_GRID_CELLS`
- **Dependencies:** Module 2 (consumed by `renderMatnAlignment()`)

### Module 8: Utility
- `clamp(value, min, max)` — bound a number
- `getNodeCenter(narrator)` — get node position for SVG drawing

## Analytics Layer (Implemented Phases 3-6)

The analytics layer is now fully implemented as specified in `to-do.md`. The following components form the production pipeline:

### Phase 3 — CL/PCL Analyzer (`scripts/clpcl-analyzer.js`)
- `CLPCLAnalyzer.fromBatch(batch)` → analyzer instance
- `analyzeBatch(batch, profile, reliabilityLayer)` → AnalysisResult
- Two profiles: `structural_only` (default), `reliability_weighted` (opt-in)
- Computes narrator features (fan_out, bundle_coverage, collector_diversity, etc.)
- Generates ranked CL/PCL candidates with confidence scores
- Contradiction guardrail: unresolved contradictions cap confidence at `0.70`

### Phase 4 — Evidence Binding and Anti-Hallucination (`scripts/evidence-binding.js`, `scripts/anti-hallucination.js`)
- `ClaimEvidenceBinder.fromAnalysisResult(result, batch)` → binder
- Binds CL candidates to reliability evidence (from `reliability_evidence` array in records)
- Validates provenance completeness, flags unknown narrators, missing evidence
- Violation propagation: BLOCKING, WARNING, INFO levels
- `analysis_not_run` marker for families with insufficient data

### Phase 5 — Canonical Report and Exports (`scripts/canonical-report.js`, `scripts/export-md.js`, `scripts/export-docx.js`, `scripts/export-pdf.js`, `scripts/artifacts.js`)
- `CanonicalReport.fromBatch(batch, options)` → canonical report
- Per-family analysis via `getAnalysisResult(familyId)` public API
- Four export formats:
  - Markdown (`exportMarkdown()`)
  - DOCX via python-docx (`exportDOCX()`)
  - PDF via LibreOffice (`exportPDF()`)
  - JSON artifacts: normalized_chains, narrator_graph, cl_candidates, analysis_snapshot
- All formats derive from same canonical report data for consistency

### Phase 6 — E2E Verification (`tests/node/phase6.test.js`)
- Full pipeline tests: normalize → validate → analyze → bind → explain → report → export
- 20-run determinism tests with timestamp-stripped comparison
- Unsupported claim prevention verified at binding layer

## API Reference

### Analysis Pipeline
```javascript
import { normalizeBatch, validateBatch } from './scripts/json-validator.js';
import { analyzeBatch, ANALYSIS_PROFILE } from './scripts/clpcl-analyzer.js';
import { ClaimEvidenceBinder } from './scripts/evidence-binding.js';
import { ExplainabilityReport } from './scripts/explainability.js';
import { CanonicalReport } from './scripts/canonical-report.js';
import { exportMarkdown, exportDOCX, exportPDF } from './scripts/export-*.js';

// Full pipeline
const normalized = normalizeBatch(batch);
const errors = validateBatch(normalized);
const result = analyzeBatch(batch, ANALYSIS_PROFILE.STRUCTURAL_ONLY);
const binder = ClaimEvidenceBinder.fromAnalysisResult(result, batch);
const validation = binder.validate();
const expReport = ExplainabilityReport.fromAnalysisResult(result, batch, validation);
const report = CanonicalReport.fromBatch(batch, { profile: 'structural_only' });
const md = exportMarkdown(report);
const docx = await exportDOCX(report);
const pdf = await exportPDF(report);
```

### Key Profiles
- `structural_only` — Graph topology features only, no reliability data required
- `reliability_weighted` — 65% structural + 35% reliability prior, requires evidence

## Rollout Status (All Phases Complete)

All analytics features are now implemented and verified:
- JSON import with schema validation (Phase 1)
- Entity resolution and reliability layer (Phase 2)
- CL/PCL analysis with dual profiles (Phase 3)
- Evidence binding and anti-hallucination (Phase 4)
- Canonical reports and multi-format exports (Phase 5)
- E2E verification and determinism (Phase 6)

The feature flags remain in index.html for potential A/B testing but are no longer the gating mechanism. Verification is now through the test suite (`npx vitest run` — 286/286 passing).

---

## Acknowledgments

This project was inspired by the original [Academic Crescent Hadith Chain Builder](https://github.com/AcademicCrescent-spec/Isnad-builder~). Riwaq extends that foundation with automated CL/PCL analytics, evidence binding, and multi-format exports.
