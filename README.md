# Riwaq | Hadith Chain Builder

**Inspired by:** [Academic Crescent Hadith Chain Builder](https://github.com/AcademicCrescent-spec/Isnad-builder~)

A browser-based tool for building, analyzing, and exporting Hadith narrator chains (isnad/sanad). It handles manual chain construction and automated Common Link (CL) candidate analysis using evidence-backed confidence scoring.

**Author:** Munir Abbasi — [github.com/munir-abbasi](https://github.com/munir-abbasi) · [syntaxhouse.com](https://www.syntaxhouse.com)  
**Published at:** [github.com/munir-abbasi/riwaq](https://github.com/munir-abbasi/riwaq)

**Current version:** `1.1.0`

---

## Background

Riwaq extends the original Academic Crescent application. It keeps the original chain-building interface and adds automated graph analysis based on G.H.A. Juynboll's methodology.

New capabilities include:
- Automated CL/PCL detection with confidence scoring.
- Multi-variant family support to model alternate transmission paths.
- An evidence binding layer (`scripts/evidence-binding.js`) that drops reliability-weighted claims if they lack provenance.
- Integrity gates (`json-validator.js`, `anti-hallucination.js`, `preflight-gates.js`) that block invalid exports.
- A deterministic CLI (`scripts/riwaq-cli.mjs`) for validation, analysis, and exporting.
- Markdown, DOCX, PDF, and JSON exports generated from a single canonical report.
- An automated test suite covering the pipeline.

### CL/PCL Methodology

Riwaq implements Juynboll's framework to map transmission convergence.

- **Common Link (CL):** A narrator identified from the primary branching pattern of an isnad family. Detection maps the structural graph; it does not independently prove authorship or fabrication.
- **Partial Common Link (PCL):** A downstream branching candidate within the same family. It identifies a sub-branch, distinct from reliability judgments.

Topology shows where lineages converge. Interpreting these patterns historically requires external chronological and textual evidence. See `docs/domain/ICMA-*.md` for methodological background.

### Workflow

Riwaq shifts CL/PCL analysis from manual diagramming to a reproducible pipeline:

- **Detection:** Ranks CL and PCL candidates across collections and exposes the exact features driving their confidence scores.
- **Modeling:** Groups multiple transmission chains for the same hadith to expose bundle-coverage patterns.
- **Evidence binding:** Separates structural analysis from reliability-weighted analysis. Claims relying on reliability scores must provide provenance records.
- **Safeguards:** Flags unknown narrator IDs and synthetic references. If an evidence violation occurs, the system blocks the export.
- **Exporting:** Generates DOCX and PDF reports directly from the canonical data object.

---

## Features

### Chain Building
The original Academic Crescent features remain intact:
- Sequential narrator entry.
- Age tracking with validated Gregorian and Hijri calendars.
- Draggable spider-chain maps with live SVG connectors.
- Word-level matn (text) diff highlighting.
- Tag and location management.
- Auto-save to `localStorage`.

### Analytics
The analyzer supports two profiles:

| Profile | Description |
|---------|-------------|
| `structural_only` (default) | Computes graph topology features. Requires no external reliability data. |
| `reliability_weighted` (opt-in) | Combines a 65% structural score with a 35% reliability prior. Requires an explicit `ReliabilityLayer`. |

The pipeline outputs:
- Ranked CL and PCL candidates with exact feature breakdowns.
- Outcome labels (`supported`, `contested`, `uncertain`, `likely_weak_in_context`).
- A contradiction cap that limits unresolved conflict scores to `0.70` and forces a `contested` outcome.
- Per-family audit trails.

### Evidence Binding & Integrity
- Reliability-weighted claims fail if they lack provenance.
- Structural-only claims operate independently of reliability evidence.
- The validator flags unknown narrator IDs, missing provenance, and invalid references.
- Sparse families receive an explicit `insufficient_data` label.
- Any blocking violation closes the export gate.

### Multi-Format Exports
All exports derive from a single canonical report object for consistency:

| Format | Tool | Use Case |
|--------|------|----------|
| Markdown | Native JS | Plain-text reports, versioning |
| DOCX | python-docx | Word processing, peer review |
| PDF | LibreOffice | Print-ready publication |
| JSON artifacts | Native JS | normalized_chains, narrator_graph, cl_candidates, analysis_snapshot |

### JSON Import
The importer processes hadith batches using schema validation. It provides:
- Strict type enforcement and JSON Pointer error paths.
- Provenance enforcement per record.
- Stable IDs (`hadith_id`, `variant_id`, `narrator_id`).
- Multi-variant family grouping.
- Narrator profiles (dates, locations, reliability ratings).
- Matn text import per variant.

---

## Quick Start

### Run locally

Open `index.html` directly in a browser, or serve locally:

```bash
python -m http.server 8000
# Then open http://localhost:8000
```

### Drive the system from the CLI

```bash
npm install

# One-shot: validate -> quality gates -> integrity sweep -> report + export gate
node scripts/riwaq-cli.mjs pipeline docs/examples/sample-import.json

# Discover callable boundaries and their authoritative signals
node scripts/riwaq-cli.mjs manifest

# Derive the minimum owner/doc/test set for proposed capability changes
node scripts/riwaq-cli.mjs impact module.entityResolver cli.snapshot

# Create and later verify a separately retained integrity manifest
node scripts/riwaq-cli.mjs seal docs/examples/sample-import.json > seal-envelope.json
node scripts/riwaq-cli.mjs verify-seal docs/examples/sample-import.json --manifest seal-envelope.json

# Inspect compact cross-layer state; publication state is data.publication.can_export
node scripts/riwaq-cli.mjs snapshot docs/examples/sample-import.json

# Individual controls
node scripts/riwaq-cli.mjs validate docs/examples/sample-import.json
node scripts/riwaq-cli.mjs analyze docs/examples/sample-import.json --profile structural_only
node scripts/riwaq-cli.mjs report docs/examples/sample-import.json
node scripts/riwaq-cli.mjs export docs/examples/sample-import.json --format md --out report.md
```

Every command prints a JSON envelope and uses stable process exit codes. Use `pipeline` for a compact cross-layer observation and `report` when complete ordered family results are needed under `data.families`. The `snapshot` command is an observational inspection tool: after valid input, it exits `0`; inspect `data.publication.can_export` for publication state. The `verify-seal` command compares canonical records with a separately retained baseline. It detects tampering but does not prove authenticity or grant export permission. Exports refuse to run when `canExport()` returns false.

### Build and analyze with analytics

```bash
# Run the full test suite
npm test
npm run check     # parity + tests combined
```

### Programmatic analysis

```javascript
import { validateBatch } from './scripts/json-validator.js';
import { analyzeBatch, ANALYSIS_PROFILE } from './scripts/clpcl-analyzer.js';
import { CanonicalReport } from './scripts/canonical-report.js';
import { exportMarkdown } from './scripts/export-md.js';

// Validate and normalize first
const { valid, collector, normalized } = validateBatch(rawBatchJson);
if (!valid) throw new Error(JSON.stringify(collector.toReport(), null, 2));

// Analyze a family
const result = analyzeBatch(normalized, ANALYSIS_PROFILE.STRUCTURAL_ONLY);

// Build the canonical report and export Markdown
const report = CanonicalReport.fromBatch(normalized, { profile: 'structural_only' });
const families = report.getReportData().families;
const md = exportMarkdown(report);
```

### Reliability-weighted analysis (opt-in)

The reliability prior applies only when you explicitly construct and inject a `ReliabilityLayer`. Without it, the prior defaults to a neutral `0.50`. Evidence must be attached at the batch level (`narrators[].reliability_evidence`) to seed the layer:

```javascript
import { ReliabilityLayer } from './scripts/reliability-layer.js';

const layer = new ReliabilityLayer().seedFromBatch(normalized);
const report = CanonicalReport.fromBatch(normalized, {
  profile: 'reliability_weighted',
  reliabilityLayer: layer,
});
```

The CLI equivalent is `--with-reliability`. With a populated layer, the analyzer uses each candidate narrator's `derived_confidence`. Without it, it retains the neutral fallback.

### Generate DOCX/PDF reports

```javascript
import { exportDOCX } from './scripts/export-docx.js';
import { exportPDF } from './scripts/export-pdf.js';

// DOCX (returns Uint8Array)
const docxBytes = await exportDOCX(report);

// PDF (requires LibreOffice installed)
const pdfBytes = await exportPDF(report);
```

Both exporters derive from the canonical report. When `report.canExport()` is false, publication is blocked.

---

## Import Format

Import hadith batches using canonical JSON schema v1. See `docs/examples/sample-import.json` for a complete example.

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
- `reliability_evidence[].evidence_id` — stable evidence identifier
- `reliability_evidence[].narrator_id` — narrator this evidence concerns
- `reliability_evidence[].rating` — `thiqah`, `saduq`, `majhul`, `daif`, `matruk`, or `accused_fabrication`
- `reliability_evidence[].source_type` — `url`, `print`, `manuscript`, or `oral_report`
- `reliability_evidence[].source_ref` — provenance object containing `collection`, `source_type`, `source_locator`, and `ingested_at`
- `reliability_evidence[].ingested_at` — ISO 8601 ingestion timestamp
- `reliability_evidence[].rating_confidence` — optional confidence weight from 0.0 to 1.0
- Optional descriptive fields include `scholar`, `work`, `citation_text`, `citation_span`, and `dissent_notes`
- Optional curation fields: `edition`, `normalization_note`, `curated_by`, `revised_at` (ISO 8601), and `revision_note`

Attach reliability evidence at the batch level (`narrators[].reliability_evidence`). Reliability scoring and claim-evidence binding read from there. Schema-v1 batches may contain record-level `records[].reliability_evidence`; binding accepts that location as a fallback, but it does not seed the reliability layer. See `docs/ARCHITECTURE.md` §Reliability-Wiring Contract.

### Narrator Profiles

Include a `narrators` array at the batch level to provide biographical context:

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

Narrator IDs in `isnad_chain` arrays normally reference entries in the `narrators` array. An unresolved reference generates a warning instead of a blocking schema error, and normalization does not create a blank profile for it. Supply the profile explicitly if you need biography or reliability evidence.

### Multi-Variant Families

Group transmission paths under one `family_id` to model hadith variants:

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

Multiple variants in one family feed the CL/PCL analyzer's fan-out and bundle-coverage routines.

---

## Test Suite

The automated suite covers JSON validation, workspace compatibility, entity resolution, reliability derivation, CL/PCL analysis, evidence binding, canonical reports, exports, end-to-end determinism, and browser smoke behavior.

Key test files are in `tests/node/` and `tests/browser/`. Use `npm test` for the Node suite.

---

## Repository Layout

```
index.html              — Main app source (canonical)
academic/index.html     — Deployed artifact (synced with index.html)
scripts/                — Analytics, export, CLI, and tooling modules
schemas/                — Descriptive JSON schema mirrors (NOT loaded at runtime; see docs/ARCHITECTURE.md)
tests/                  — Full test suite (Node + browser)
docs/
  ARCHITECTURE.md       — Internal structure, API reference, canonical numeric contracts
  USAGE.md              — End-user workflow guide
  SECURITY.md           — Security model and hardening
  SCHEMA-VERSIONING.md  — Schema migration policy
  how-does-it-work.md   — Conceptual explanation of workflow
  domain/               — ICMA methodology background (non-authoritative)
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
| `docs/ARCHITECTURE.md` | Module boundaries, API reference, canonical numeric contracts, CLI |
| `docs/SECURITY.md` | Threat model, escaping, date integrity, CI/CD hardening |
| `docs/SCHEMA-VERSIONING.md` | v0 → v1 migration rules and future policy |
| `docs/how-does-it-work.md` | Conceptual explanation of chain construction and analysis |
| `docs/domain/ICMA-*.md` | Hadith-scholarship methodology background (non-authoritative) |
| `docs/examples/sample-import.json` | Full valid import batch |
| `docs/examples/import-template.csv` | Spreadsheet template for batch entry |
| `docs/examples/import-checklist.md` | Pre-import validation checklist |

---

## Running Tests

```bash
# Node test suite
npm test

# Parity + Node suite (pre-completion gate)
npm run check

# Verbose output
npx vitest run --reporter=verbose

# Browser smoke test (requires Playwright)
npx vitest run --config vitest.browser.config.js

# Standalone browser smoke
node scripts/smoke-test.cjs
```

---

## License

Copyright 2026 Munir Abbasi

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

---

## How to Cite

If you use Riwaq in research, teaching, software development, or a scholarly
publication, cite the exact software release used. Cite the methodological
paper as well when your work relies on its conceptual or analytical framework.

### Cite the software

Riwaq's analytical behavior may change between releases. Cite a versioned
release rather than the repository in general.

After the v1.1.0 GitHub release is published, cite it as:

```text
Abbasi, M. (2026). Riwaq: A reproducible and evidence-bound framework for hadith transmission analysis (Version 1.1.0) [Computer software]. https://github.com/munir-abbasi/riwaq/releases/tag/v1.1.0
```

Use a persistent identifier, such as an archived release DOI, when one is
available. Otherwise, use the versioned release URL.

### Cite the methodological paper

The accompanying paper describes the conceptual basis, structural-analysis
model, evidence-provenance architecture, limitations, and proposed validation
framework:

```text
Abbasi, M. (2026). Riwaq: An evidence-bound computational framework for reproducible hadith transmission analysis. [Manuscript].
```

After formal publication, replace this manuscript citation with the journal
citation and DOI.

### BibTeX

Software:

```bibtex
@software{abbasi_riwaq_2026,
  author  = {Abbasi, Munir},
  title   = {Riwaq: A Reproducible and Evidence-Bound Framework for Hadith Transmission Analysis},
  year    = {2026},
  version = {1.1.0},
  url     = {https://github.com/munir-abbasi/riwaq/releases/tag/v1.1.0},
  note    = {Computer software}
}
```

Methodological paper:

```bibtex
@article{abbasi_riwaq_2026,
  author  = {Abbasi, Munir},
  title   = {Riwaq: An Evidence-Bound Computational Framework for Reproducible Hadith Transmission Analysis},
  year    = {2026},
  note    = {Manuscript}
}
```

### Reproducibility information

For computational analyses, report the exact Riwaq release used. Include the
following details where possible:

```text
Riwaq version: 1.1.0
Release tag: v1.1.0
Commit: <immutable commit hash>
Analysis profile: <profile or configuration>
```

Riwaq's structural scores depend on the declared analytical configuration.
Report any non-default weights, thresholds, penalties, missing-data rules, or
other parameter changes used in the analysis.

### Citation metadata

Each public release should include a machine-readable `CITATION.cff` file so
that GitHub, Zenodo, Zotero, and other citation tools can generate the
appropriate citation automatically.
