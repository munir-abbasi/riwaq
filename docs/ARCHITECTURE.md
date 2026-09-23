# Architecture

## System Boundary

Riwaq has two cooperating surfaces:

- a static browser application in `index.html` for chain construction, visualization, matn comparison, and local persistence;
- deterministic JavaScript modules in `scripts/` for import normalization, identity resolution, CL/PCL analysis, evidence binding, explainability, canonical reporting, and export.

There is no backend or database in the core application. Analytical modules operate on explicit data objects and are independently testable from the browser UI.

For the cross-layer control model, invariants, and agent workflow, see `AGENT-OPERATING-MODEL.md`. For the current implemented/designed/envisioned triage, see `STATUS.md`.

## Source of Truth and Deployment

`index.html` is the canonical browser source. `academic/index.html` is a deployment artifact copied from it.

```text
index.html --npm run sync--> academic/index.html
     |                              |
     +------ npm run verify:parity -+
```

Never implement a browser change directly in `academic/index.html`.

## State Domains

Riwaq has two versioned data domains that must not be conflated.

### Browser workspace state

Stored under localStorage key `hadith-chain-builder-v2`. Version field: `_schema_version`. `scripts/compatibility-adapter.js` owns migration to the current workspace representation.

### Import/analysis batch

Validated by `scripts/json-validator.js`. Version field: `schema_version`. The import batch contains records, families, variants, narrator profiles, provenance, and reliability evidence used by the programmatic analysis pipeline.

Both are currently version 1. Their equal version numbers do not make them the same schema.

## Canonical Numeric and Enum Contracts

This section is the **single owner** of the numeric contracts and enums below. Other documents must reference these values rather than restate them. Source of truth: `scripts/clpcl-analyzer.js` (scoring), `scripts/preflight-gates.js` (quality bands).

### Analysis profiles

| Profile | Final confidence | Reliability prior | Evidence required |
|---|---|---|---|
| `structural_only` (default) | structural score | not used (null) | No |
| `reliability_weighted` | `0.65 * structural_score + 0.35 * prior` | `0.50` flat without an injected layer; derived per narrator with one (see the reliability-wiring contract below) | Yes, for reliability claims |

### Candidate outcome thresholds

| Outcome | Condition |
|---|---|
| `supported` | confidence ≥ `0.75` and no high-severity contradiction |
| `contested` | confidence ≥ `0.55` (including contradiction-capped high scores) |
| `uncertain` | confidence ≥ `0.35` and < `0.55` |
| `likely_weak_in_context` | confidence < `0.35` |

A high-severity reliability contradiction caps final confidence at `0.70`, which makes `supported` unreachable while the contradiction remains.

### Candidate detection feature gates

A Common Link (CL) candidate requires `fan_out >= 3` AND `bundle_coverage >= 0.35` AND `collector_diversity >= 3`. A Partial Common Link (PCL) candidate requires `fan_out >= 2` AND `bundle_coverage >= 0.20`, anchored downstream of a CL (or fallback rules when no CL exists). Structural score weights: `0.30*S1 + 0.25*S2 + 0.15*S3 + 0.20*S4 + 0.10*S5 − 0.20*P1 − 0.10*P2 − 0.05*P3` over the feature vector defined in "Analytical Inputs and Outputs".

### Family status

`cl_detected` | `pcl_only` | `insufficient_data`. Family status is independent of candidate outcomes and of evidence-binding validity (D003).

### Preflight quality bands (preflight-gates.js)

Quality score 0–100, weighted `0.35*provenance + 0.20*variant_diversity + 0.25*narrator_metadata + 0.20*reliability_coverage`:

| Band | Meaning |
|---|---|
| < `20` | blocking error — critical data-quality issues |
| `20`–`49` | warning — degraded but proceeds |
| ≥ `50` | healthy target (not a validity gate) |

### Structural scoring subscores

| Subscore | Feature | Normalization |
|---|---|---|
| S1 | fan_out | normalized from 3 to 8 |
| S2 | bundle_coverage | identity (0–1) |
| S3 | collector_diversity | normalized from 2 to 8 |
| S4 | pre_single_strand_ratio | identity (0–1) |
| S5 | matn_coherence | identity (0–1); currently a constant `0.50` default; candidate `matn_coherence_basis` is `default_constant_unmeasured` |
| P1 | bypass_ratio | penalty |
| P2 | chronology_conflict_ratio | penalty |
| P3 | 1 − provenance_completeness_ratio | penalty |

### Rating priors (reliability-layer.js)

`thiqah` 0.75 · `saduq` 0.65 · `majhul`/unknown 0.50 · `daif` 0.35 · `matruk` and `accused_fabrication` 0.20.

## Runtime Data Flow

```text
                   browser interaction
                         |
                         v
                  workspace state
                         |
               chain/map/matn rendering

raw JSON batch
     |
     v
json-validator.js ---- validate + normalize          (caller/CLI precondition; not in CanonicalReport)
     |
     v
canonical batch
     |
     +--> entity-resolution.js ---- explicit alias/merge/split log   (caller-invoked)
     |
     +--> preflight-gates.js ------ quality score + gate observations (caller-invoked)
     +--> anti-hallucination.js --- pre-analysis integrity sweep      (caller-invoked observation, stricter)
     |
     v
reliability-layer.js? --- optional input, explicit caller opt-in (D007)
     |                    constructed as new ReliabilityLayer().seedFromBatch(batch)
     v
clpcl-analyzer.js ----- graph -> features -> candidates -> outcomes
     |
     v
evidence-binding.js --- claim/evidence validation and proceed/block gate   (automatic)
     |
     v
explainability.js ----- audit trail + uncertainty                          (automatic)
     |
     v
canonical-report.js --- one family-aware semantic report + canExport()     (automatic)
     |
     +--> artifacts.js
     +--> export-md.js
     +--> export-docx.js
     +--> export-pdf.js
     |
     +--> riwaq-cli.mjs --------- CLI projection of all of the above (D009)
```

`CanonicalReport._run()` starts with an already canonical batch. It performs, per family, `analyzeBatch` → `ClaimEvidenceBinder.validate()` → `ExplainabilityReport` → `emitArtifacts`, then builds report data. It does **not** run import validation/normalization, preflight quality scoring, the pre-analysis integrity sweep, entity-resolution operations, or reliability-layer construction.

The CLI `pipeline` is a separate orchestration surface: schema validation/normalization is a hard precondition; preflight quality and integrity results are collected as observations; an optional reliability layer may be constructed; then `CanonicalReport` runs. Its JSON envelope labels these boundaries with `control_type`: validation is `blocking_precondition`, quality and anti-hallucination stages are `observation`, and the report is `publication_gate` with authority `CanonicalReport.canExport()`. After schema validation succeeds, pipeline `ok`/exit status is determined by that publication authority. The quality and integrity observations do not become publication gates merely because `pipeline` reports them (D018).

### Control semantics

The architecture distinguishes five control types: observational signals, blocking preconditions, analytical state, publication/release gates, and projections. A module's output must keep its declared type across wrappers. CLI orchestration may aggregate signals but must not silently promote an observation into a gate or reinterpret an analytical state as publication permission. `CanonicalReport.canExport()` is the current publication authority (D004, D011).

## Reliability-Wiring Contract (D007)

`reliability_weighted` is an explicit opt-in in two independent dimensions:

1. **Profile selection** — pass `profile: 'reliability_weighted'`.
2. **Layer injection** — construct and pass the layer yourself:

```javascript
import { validateBatch } from './scripts/json-validator.js';
import { ReliabilityLayer } from './scripts/reliability-layer.js';
import { CanonicalReport } from './scripts/canonical-report.js';

const { valid, collector, normalized } = validateBatch(rawJson);
if (!valid) throw new Error(collector.toReport().summary.error_count + ' blocking errors');

const layer = new ReliabilityLayer().seedFromBatch(normalized); // narrator-level evidence
const report = CanonicalReport.fromBatch(normalized, {
  profile: 'reliability_weighted',
  reliabilityLayer: layer,
});
```

Semantics:

- **No layer injected** ⇒ every narrator's prior is the flat neutral `0.50`; the profile is effectively structural with a dampened blend (`0.65*s + 0.175`). No warning is emitted.
- **Layer injected** ⇒ per-narrator `derived_confidence` feeds the prior, and high-severity contradictions activate the canonical cap (D014).

Evidence attachment: the canonical location is **batch `narrators[].reliability_evidence`**. `ReliabilityLayer.seedFromBatch` and `ClaimEvidenceBinder` both read it. Schema-v1 record-level `records[].reliability_evidence` remains a backward-compatible binding fallback, but it does not seed the reliability layer. Evidence IDs are deduplicated during binding; when the same ID exists in both locations, the canonical narrator-level record takes precedence (D019).

## Module Contracts

### Import validation and normalization

`scripts/json-validator.js` owns import schema version 1. `validateBatch(rawJson)` accepts a JSON string or object and returns `{ valid, collector, normalized }`. `normalized` is null when validation has blocking errors. Undefined narrator references are warnings; normalization does not auto-create profiles for them. Agents must not mistake that warning policy for complete biographical evidence.

Support module: `scripts/import-errors.js` owns `ImportErrorCollector`, `ImportError`, and `ERROR_CODE` — the structured error format (JSON Pointer instance paths, item indices) shared by the validator and the quality gates.

### Preflight quality gates (caller-invoked)

`scripts/preflight-gates.js` evaluates a *normalized* batch: `evaluateGates(normalizedBatch, collector?)` returns `{ passed, qualityScore, gateResults }` and appends band errors/warnings to the collector. See "Canonical Numeric and Enum Contracts" for the bands. Not run automatically by the canonical pipeline.

### Anti-hallucination sweep (caller-invoked, stricter)

`scripts/anti-hallucination.js` validates a batch **before analysis**: `AntiHallucinationValidator.fromBatch(batch).validate()` returns a result with `valid`, `canProceed()`, and `toReport()` covering unknown narrators, missing provenance, synthetic-pattern identifiers, and unverifiable source types. It is **stricter than schema validation**: a chain narrator with no declared profile is *blocking* here, while `validateBatch` treats it as a warning. It complements post-analysis `ClaimEvidenceBinder`, which validates claim-evidence bindings after scoring. Only tests invoke it today; the CLI `hallucination` command makes it invocable as a gate.

### Identity resolution

`scripts/entity-resolution.js` owns narrator aliases, merges, and splits. Its operation log is append-only and replayable. Each state-changing entry carries a versioned receipt with inputs, affected IDs, before/after log-position references, evidence movements, invariant checks, and verification status. Public log/state access returns isolated copies, and replay preserves receipts. Identity operations preserve these invariants:

- no orphan narrator IDs;
- merges preserve evidence links;
- splits require explicit redistribution;
- reported and derived fields are not silently overwritten;
- replay reconstructs the same identity state.

### Reliability derivation

`scripts/reliability-layer.js` maintains the reported/analytical/derived three-layer reliability model. Evidence is never deleted, only superseded; duplicates merge idempotently. Public surface: `new ReliabilityLayer().seedFromBatch(batch)`, `addReported`, `addAnalytical`, `getReported`, `getAnalytical`, `getDerived` (returns `{ prior, ratings, conflicting, derived_confidence, sources_count }`), `getContradictions` (pairs with `severity` `high`/`medium`), `getAllEvidence`, `toBatch`. See the reliability-wiring contract above for injection semantics and the currently recorded key defect.

### CL/PCL analysis

`scripts/clpcl-analyzer.js` derives a family graph, computes features, detects CL/PCL candidates, and scores them under a named profile. `analyzeBatch(batch, profile, reliabilityLayer?)` is the functional entry point; `CLPCLAnalyzer.fromBatch(batch)` the class form. Numeric contracts (thresholds, weights, bands) live in "Canonical Numeric and Enum Contracts" above.

Structural note: chain arrays run **companion → collector**; a Common Link is detected where fan-out occurs **downstream** (later) in the array. Batches whose variants share no downstream fan-out return `insufficient_data` with zero candidates.

Family status is one of `cl_detected`, `pcl_only`, or `insufficient_data`.

### Evidence binding

`scripts/evidence-binding.js` validates analytical claims against narrator identity and reliability evidence. Reliability-weighted claims without evidence or adequate provenance produce blocking violations. Structural claims may remain methodologically valid without reliability evidence and carry warnings instead.

The decisive operational field is `ValidationResult.analysis_can_proceed`.

### Explainability

`scripts/explainability.js` turns analysis and validation into candidate panels, audit-trail records, and an uncertainty section. It does not change candidate classification.

### Canonical report and exports

`scripts/canonical-report.js` analyzes each family independently, binds evidence, builds explainability, emits artifacts, and stores the family-level results behind one report object. Public surface: `CanonicalReport.fromBatch(batch, { profile, reliabilityLayer })`, `getReportData()`, `toJSON()`, `getArtifacts(fid)`, `getAnalysisResult(fid)`, `getValidationResult(fid)`, `getFamilyIds()`, `canExport()`.

`getReportData().families` is the ordered, serializable multi-family projection. Each entry carries `family_id`, metadata, analysis, candidates, evidence-binding state, artifact counts, uncertainty, and audit trail. Its order matches `family_ids`. The existing top-level `analysis`, `candidates`, `evidence_binding`, `artifacts`, `uncertainty`, and `audit_trail` fields remain projections of the first family for backward compatibility (D016).

`CanonicalReport.canExport()` returns true only when every family validation result permits analysis to proceed. Human-facing exporters consume the report rather than running their own analysis.

### Exporters

- `scripts/export-md.js` — `exportMarkdown(report)` → Markdown string; `exportMarkdownFromData(reportData)` for pre-built report data.
- `scripts/export-docx.js` — `exportDOCX(report)` → Promise of DOCX bytes (python-docx when available, raw OOXML fallback); `saveDOCX(report, path)`.
- `scripts/export-pdf.js` — `exportPDF(report)` → Promise of PDF bytes; requires LibreOffice (`soffice`) on PATH at conversion time (the test environment has it).

### Machine-readable artifacts

`scripts/artifacts.js` — `emitArtifacts(batch, analysisResult, familyId)` returns the four-artifact bundle: `normalized_chains`, `narrator_graph`, `cl_candidates`, `analysis_snapshot`.

### Integrity manifests

`scripts/integrity-seal.js` canonicalizes JSON object keys, preserves array order, and computes SHA-256 digests for normalized batch metadata, each hadith record, and each narrator profile. `createIntegrityManifest(batch)` returns a deterministic sidecar with no generated timestamp. `verifyIntegrityManifest(batch, manifest)` reports altered, missing, and unexpected entries. The sidecar must be retained separately from the batch it protects; it detects divergence from that baseline but does not authenticate the underlying research source or affect publication authority (D015).

### Agent control projections

`scripts/agent-control.js` owns three machine-readable projections for cold-start agent control. `getCapabilityManifest()` describes public CLI/module/tooling boundaries and points back to their semantic owners. `buildAgentStateSnapshot()` composes the existing validator, quality-gate, integrity, and canonical-report outputs into a compact observational packet. `buildSemanticImpactRoute()` projects selected manifest capabilities into changed layers/contracts, owners, contract docs, consumers, and verification commands. None owns scoring, validation, identity, analytical, or publication semantics. The snapshot's publication field is delegated directly to `CanonicalReport.canExport()` (D013).

### Control CLI

`scripts/riwaq-cli.mjs` — the deterministic command surface over everything above. Commands: `manifest`, `snapshot`, `impact`, `seal`, `verify-seal`, `validate`, `gates`, `hallucination`, `analyze`, `report`, `pipeline`, `artifacts`, `families`, `export`. JSON envelope `{ ok, command, file?, data?, error? }` on stdout; exit codes `0` ok, `1` validation/export/integrity failure, `2` usage error; `--with-reliability` makes the D007 opt-in visible. `report` exposes the canonical ordered `families[]` projection while retaining its first-family summary fields; `pipeline` remains a compact orchestration snapshot. `snapshot` is observational and therefore uses `data.publication.can_export`, rather than its own process exit status, for publication state. `impact` accepts manifest capability IDs and has no semantic authority of its own. `verify-seal` uses exit 1 for a mismatch but remains independent of publication authority. Zero analytical logic — the CLI is a projection, not a second implementation (D009, D013, D015, D016). See `AGENT-OPERATING-MODEL.md` §Control Surface for the command-to-signal map.

### Fixture and tooling utilities

- `scripts/generate-medium-fixture.js` — regenerates `tests/fixtures/phase1/medium-fixture.json` (1000-variant SLO fixture).
- `scripts/sync-academic.sh`, `scripts/verify-parity.sh` — deploy-artifact synchronization and parity gate.
- `scripts/smoke-test.cjs` — standalone Playwright browser smoke run.

## Schemas Directory Characterization (D006-adjacent)

The JSON files under `schemas/` (`hadith-record.json`, `import-batch.json`, `narrator-profile.json`, `analysis-result.json`) are **descriptive mirrors, not loaded at runtime**. The authoritative validation schema is the inline `SCHEMA` object in `scripts/json-validator.js` (internal `#/$defs` references; Ajv-compiled). Editing `schemas/*.json` has **no effect** on validation behavior. Keep them in sync editorially when the inline schema changes, and treat any mismatch as a documentation bug to fix in one direction: the inline schema wins.

## Test Suite Map

Historical "phase" labels map to current coverage as follows. Test counts are not part of the contract (they change); classes of behavior are.

| Historical label | Files | Actual coverage |
|---|---|---|
| Phase 1 | `tests/node/json-validator.test.js`; fixtures `tests/fixtures/phase1/` | Import schema validation, provenance/duplicate checks, unresolved-reference warnings, preflight `evaluateGates` |
| Phase 2 | `tests/node/entity-resolution.test.js`, `tests/node/reliability-layer.test.js`; fixtures `phase2/` | Alias/merge/split replay and receipts, evidence layering, contradiction detection |
| Phase 3 | `tests/node/clpcl-analyzer.test.js`; fixtures `phase3/` | Graph construction, feature computation, candidate generation, profiles, contradiction cap |
| Phase 4 | `tests/node/phase4.test.js`; fixtures `phase4/` | Evidence binding (`ClaimEvidenceBinder`), anti-hallucination sweep, explainability panels |
| Phase 5 | `tests/node/phase5.test.js`; fixtures `phase5/` | Artifact emitters, canonical report, MD/DOCX/PDF exporters |
| Phase 6 | `tests/node/phase6.test.js`; fixtures `phase6/` | End-to-end pipeline, cross-format consistency, 20-run determinism |
| — | `tests/node/compatibility-adapter.test.js` | Browser workspace `_schema_version` migration (separate schema domain) |
| — | `tests/node/cli.test.js` | CLI golden/failure paths plus agent manifest/snapshot/impact projection contracts |

Fixtures directories correspond to the phase of the *module* they exercise, not to a chronological project phase.

## Analytical Inputs and Outputs

Structural features currently include fan-out, bundle coverage, collector diversity, pre-single-strand ratio, bypass ratio, chronology-conflict ratio, matn coherence (currently a constant default `0.50`), and provenance completeness. The scoring function is deterministic for fixed input and profile.

Machine-readable artifacts include normalized chains, narrator graph, CL/PCL candidates, and analysis snapshot. They are derived data and should be regenerated when canonical input changes.

## Browser Architecture

The browser application keeps UI state and rendering in the static page. Its main concerns are:

- narrator/form state and local persistence;
- Gregorian/Hijri date validation and age computation;
- location and tag editing;
- SVG chain rendering and dragging;
- matn tokenization/alignment with bounded matrix work;
- sanitization before rendering user-provided values.

Exact function locations inside `index.html` change over time; use symbol search rather than documented line numbers.

## Verification Boundaries

Use existing tests around the layer changed. The default Node suite is `npm test` (run `npm install` first in a fresh checkout; the postinstall browser hook is best-effort). Combined gate: `npm run check` = parity + Node suite. Browser smoke validation is `node scripts/smoke-test.cjs` when UI behavior is in scope.

The test count is intentionally not part of the architecture contract because it changes as the suite evolves.
