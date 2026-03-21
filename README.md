# Riwaq | Hadith Chain Builder

**Formerly: Academic Crescent Hadith Chain Builder**

A research-grade browser-based tool for building, analyzing, and exporting Hadith narrator chains (isnad/sanad). Supports both manual chain construction and automated CL/PCL (Common Link / Partial Common Link) candidate analysis with evidence-based confidence scoring.

**Author:** Munir Abbasi — [github.com/munir-abbasi](https://github.com/munir-abbasi) · [syntaxhouse.com](https://www.syntaxhouse.com)  
**Published at:** [github.com/AcademicCrescent-spec/Isnad-builder~](https://github.com/AcademicCrescent-spec/Isnad-builder~)

---

## Background

Riwaq (formerly Academic Crescent) integrates Juynboll's CL/PCL methodology as a first-class analytical feature. The original Academic Crescent app provided manual chain-building capabilities; this upgraded version adds automated CL/PCL detection with evidence-based confidence scoring.

### Juynboll's CL/PCL Methodology

The Common Link / Partial Common Link framework was developed by Dutch Orientalist G.H.A. Juynboll (1935–2010), who built critically on Joseph Schacht's foundational work in Western hadith scholarship. In this framework:

- A **Common Link (CL)** is the earliest narrator in an isnad transmission family who receives from a single authority and transmits that material to multiple students. It represents the convergence point in a transmission network — the point at which a hadith "enters the public domain" of hadith transmission.

- A **Partial Common Link (PCL)** is a downstream node in the same transmission family that exhibits a similar but weaker convergence pattern — it too receives from one authority and transmits to several, but the convergence is less pronounced.

By analyzing the graph topology of isnad chains, scholars can identify where transmission lineages converge and diverge, which in turn informs judgments about the historical provenance of hadith texts. Jonathan A.C. Brown has described Juynboll's contributions to this methodology as "substantial and groundbreaking," and the approach remains a cornerstone of isnād-cum-matn analysis (ICMA) in contemporary Western hadith scholarship.

### How This Tool Supports Scholars

This upgraded application translates the CL/PCL methodology from manual analysis into a systematic, reproducible workflow:

- **Graph-based CL/PCL detection** analyzes narrator convergence across entire hadith collections, producing ranked CL and PCL candidates with transparent confidence scores and feature breakdowns.
- **Multi-variant family analysis** models different transmission chains for the same hadith, making fan-out and bundle-coverage patterns visible and comparable.
- **Evidence binding** links every analytical claim to specific reliability records from classical biographical sources (Tahdhib al-Kamal, Taqrib al-Tahdhib, Mizan al-I'tidal, etc.), anchoring the analysis in established scholarship.
- **Anti-hallucination safeguards** flag unknown narrator IDs, missing provenance, and synthetic references — blocking unsupported claims from reaching exports so that scholarly output remains defensible.
- **Professional DOCX and PDF export** produces publication-ready reports directly from the canonical report object, enabling scholars to integrate findings into peer-reviewed work without manual reformatting.

---

## Features

### Chain Building (original Academic Crescent)
All original Academic Crescent features are preserved and fully functional:
- Narrator-by-narrator entry in chain order
- Optional age tracking with Gregorian and Hijri calendar support (full day/month/year validation)
- Draggable spider-chain map canvas with live SVG connectors
- Matn (text) alignment with word-level diff highlighting — unchanged, added, and missing wording
- Location and tag management with multiple tag shapes (pill, square, diamond)
- Auto-save to browser `localStorage`

### New in this upgraded version

### CL/PCL Analytics
Two analysis profiles:

| Profile | Description |
|---------|-------------|
| `structural_only` (default) | Graph topology features only. Works with no external data. |
| `reliability_weighted` (opt-in) | 65% structural score + 35% reliability prior. Requires narrator evidence. |

Analytics produces:
- Ranked CL (Common Link) and PCL (Partner Common Link) candidates
- Confidence scores with transparent feature breakdowns
- Outcome labels: `supported`, `contested`, `uncertain`, `likely_weak_in_context`
- Contradiction cap: unresolved conflicts cap confidence at `0.70` and limit outcome to `contested`
- Per-family explainability reports with audit trails

### Claim Evidence Binding and Anti-Hallucination
- Every analytical claim is bound to at least one reliability evidence record
- Unknown narrator IDs, missing provenance, and synthetic references are flagged and blocked
- Families with insufficient data are marked explicitly (`analysis_not_run`) rather than omitted
- Unsupported claims never reach exports as factual statements

### Multi-Format Exports
All exports derive from a single canonical report object for consistency:

| Format | Tool | Use Case |
|--------|------|----------|
| Markdown | Native JS | Plain-text reports, versioning |
| DOCX | python-docx | Word processing, peer review |
| PDF | LibreOffice | Print-ready publication |
| JSON artifacts | Native JS | normalized_chains, narrator_graph, cl_candidates, analysis_snapshot |

### JSON Import
Import batches of hadith records with:
- Schema validation (strict type enforcement)
- Item-level error reports with JSON Pointer paths
- Provenance enforcement on every record
- Stable IDs (`hadith_id`, `variant_id`, `narrator_id`)
- Support for multi-variant families (multiple transmission chains per hadith)
- Narrator biographical profiles with dates, locations, and reliability evidence
- Full matn (text) import per variant
- See [Import Format](#import-format) below for field-by-field details

---

## Quick Start

### Run locally

Open `index.html` directly in a browser, or serve locally:

```bash
python -m http.server 8000
# Then open http://localhost:8000
```

### Build and analyze with analytics

```bash
# Install test tooling
npm install

# Run the full test suite
npx vitest run
```

### Programmatic analysis

```javascript
import { analyzeBatch, ANALYSIS_PROFILE } from './scripts/clpcl-analyzer.js';
import { emitArtifacts } from './scripts/artifacts.js';
import { exportMarkdown } from './scripts/export-md.js';

// Analyze a batch
const result = analyzeBatch(batch, ANALYSIS_PROFILE.STRUCTURAL_ONLY);

// Export as Markdown
const report = CanonicalReport.fromBatch(batch, { profile: 'structural_only' });
const md = exportMarkdown(report);

// Get JSON artifacts
const artifacts = emitArtifacts(batch, result, 'family-id');
```

### Generate DOCX/PDF reports

```javascript
import { exportDOCX } from './scripts/export-docx.js';
import { exportPDF } from './scripts/export-pdf.js';

// DOCX (returns Uint8Array)
const docxBytes = await exportDOCX(report);

// PDF (requires LibreOffice installed)
const pdfBytes = await exportPDF(report);
```

---

## Import Format

Import hadith batches using canonical JSON schema v1. See `docs/examples/sample-import.json` for a complete annotated example.

### Minimal Valid Batch

```json
{
  "schema_version": 1,
  "imported_at": "2026-01-01T00:00:00.000Z",
  "records": [{
    "hadith_id": "h1",
    "family_id": "f1",
    "source_ref": {
      "collection": "Sahih al-Bukhari",
      "source_type": "print",
      "source_locator": "Vol. 1, No. 1",
      "ingested_at": "2026-01-01T00:00:00.000Z"
    },
    "variants": [{
      "variant_id": "v1",
      "isnad_chain": ["prophet", "n1", "n2", "collector"],
      "matn_raw": "The hadith text in Arabic..."
    }],
    "reliability_evidence": []
  }]
}
```

`source_type` must be one of: `url`, `print`, `manuscript`, `oral_report`.

### Full Record Structure

Each record in the `records` array supports:

**Identity fields:**
- `hadith_id` — unique stable ID for this hadith
- `family_id` — groups variants belonging to the same hadith family
- `title` — optional hadith title or description

**Source provenance:**
- `source_ref.collection` — collection name (e.g., "Sahih al-Bukhari")
- `source_ref.source_type` — `url | print | manuscript | oral_report`
- `source_ref.source_locator` — page number, ISBN, manuscript shelfmark, URL, etc.
- `source_ref.ingested_at` — ISO 8601 timestamp of ingestion

**Isnad chain (sanad):**
- `variants[].isnad_chain[]` — ordered array of narrator IDs from companion to collector
- `variants[].isnad_raw` — optional raw Arabic text of the chain
- Multiple variants can share a `family_id` to model different transmission paths

**Matn (text):**
- `variants[].matn_raw` — raw text of the hadith in Arabic (optional per variant)
- `matn_raw` at record level — shared matn text (optional)

**Reliability evidence (for `reliability_weighted` analysis):**
- `reliability_evidence[].narrator_id` — which narrator this evidence concerns
- `reliability_evidence[].rating` — scholarly assessment: `thiqah`, `saduq`, `majhur`, `daif`, `matruk`
- `reliability_evidence[].source_ref` — provenance of the evidence itself
- `reliability_evidence[].scholar` — name of the classical scholar
- `reliability_evidence[].confidence` — confidence weight (0.0–1.0)

### Narrator Profiles

Include a `narrators` array at batch level to provide biographical context:

```json
"narrators": [{
  "narrator_id": "hisham-ibn-urwah",
  "names": ["Hisham ibn Urwah"],
  "kunya": "Abu al-Mundhir",
  "birth": { "jdn": 15500, "description": "circa 153 AH" },
  "death": { "jdn": 16234, "description": "circa 163 AH" },
  "locations": ["Medina", "Baghdad"],
  "tags": ["tabi'un", "medinese"],
  "reliability_evidence": []
}]
```

Narrator IDs in `isnad_chain` arrays reference entries in the `narrators` array. The `reliability_evidence` on each narrator supports the `reliability_weighted` analysis profile.

### Multi-Variant Families

Group multiple transmission paths under one `family_id` to model hadith variants:

```json
"family_id": "bukhari-001-family",
"variants": [
  {
    "variant_id": "v-hisham",
    "isnad_chain": ["hisham", "urwah", "zubayr", "hasan"],
    "matn_raw": "Hadith text via Hisham..."
  },
  {
    "variant_id": "v-ibn-jurayj",
    "isnad_chain": ["ibn-jurayj", "ata", "saud"],
    "matn_raw": "Hadith text via Ibn Jurayj..."
  }
]
```

Multiple variants in one family feed the CL/PCL analyzer's fan-out and bundle-coverage features.

---

## Test Suite

286 tests covering the full pipeline:

| Area | Tests | File |
|------|-------|------|
| JSON validation and migration | 33+ | `tests/node/json-validator.test.js` |
| Compatibility and schema migration | 21 | `tests/node/compatibility-adapter.test.js` |
| Entity resolution | 27 | `tests/node/entity-resolution.test.js` |
| Reliability layer | 27 | `tests/node/reliability-layer.test.js` |
| CL/PCL analysis | 65 | `tests/node/clpcl-analyzer.test.js` |
| Evidence binding + anti-hallucination | 49 | `tests/node/phase4.test.js` |
| Canonical reports and exports | 42 | `tests/node/phase5.test.js` |
| E2E pipeline and determinism | 22 | `tests/node/phase6.test.js` |
| Browser smoke | 3 | `tests/browser/smoke.test.js` |

**Reproducibility:** 4 × 20-run determinism tests confirm stable output across repeated runs (timestamps excluded from comparisons).

---

## Repository Layout

```
index.html              — Main app source (canonical)
academic/index.html     — Deployed artifact (synced with index.html)
scripts/               — Analytics and export modules
schemas/                — JSON schema definitions
tests/                  — Full test suite (Node + browser)
docs/
  ARCHITECTURE.md       — Internal structure and API reference
  USAGE.md              — End-user workflow guide
  SECURITY.md           — Security model and hardening
  SCHEMA-VERSIONING.md  — Schema migration policy
  examples/             — Sample import JSON, CSV template, checklist
vitest.config.js        — Test configuration
vitest.browser.config.js — Browser smoke test config
```

---

## Architecture

- **Runtime model:** Static HTML/CSS/JS — no backend, no database
- **Data persistence:** Browser `localStorage` under key `hadith-chain-builder-v2`
- **Deployment:** GitHub Pages via `.github/workflows/static.yml` (deploys `./academic`)
- **CL/PCL analysis:** Interpretation layer that runs on canonical narrator graph data; optional, does not block map creation
- **Legacy compatibility:** v0 single-chain payloads auto-migrate to v1 family/variant format on load

---

## Documentation Index

| File | Description |
|------|-------------|
| `docs/USAGE.md` | End-user workflow for chain building and analytics |
| `docs/ARCHITECTURE.md` | Module boundaries, API reference, analytics pipeline |
| `docs/SECURITY.md` | Threat model, escaping, date integrity, CI/CD hardening |
| `docs/SCHEMA-VERSIONING.md` | v0 → v1 migration rules and future policy |
| `docs/examples/sample-import.json` | Full valid import batch |
| `docs/examples/import-template.csv` | Spreadsheet template for batch entry |
| `docs/examples/import-checklist.md` | Pre-import validation checklist |

---

## Running Tests

```bash
# All tests (286 passing)
npx vitest run

# Verbose output
npx vitest run --reporter=verbose

# Browser smoke test (requires Playwright)
npx vitest run --config vitest.browser.config.js

# Standalone browser smoke
node scripts/smoke-test.cjs
```

---

## License

No explicit license file is present in this repository.
