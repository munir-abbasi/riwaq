# Security and Analytical Integrity

## Trust Model

Riwaq is a static client-side application with no backend authentication or server-side database in the core system. Security therefore includes both conventional browser safety and analytical integrity: a technically valid export must not silently elevate an unsupported research claim.

## Implemented Browser Controls

- User-provided values rendered through HTML-producing paths are escaped with `escapeHtml(...)`.
- Browser-loaded state is sanitized before use; malformed narrator records are rejected rather than trusted blindly.
- Gregorian and Hijri dates are validated before age calculations are accepted.
- Matn diff computation has a size guard to bound expensive matrix allocation.
- GitHub Pages deploys the `academic` artifact; workflow references are pinned to exact action commits.
- `index.html` is canonical and parity verification detects divergence from `academic/index.html`.

## Implemented Analytical Controls

### Import boundary

`scripts/json-validator.js` performs schema validation, provenance-field validation, duplicate-ID checks, and narrator-reference checks before returning normalized data. It is the *first* gate, not the only one.

### Pre-analysis gates (caller-invoked)

Two stricter gates run only when the caller invokes them (the CLI `gates` and `hallucination` commands, or direct module calls):

- `scripts/preflight-gates.js` scores data quality and emits the configured quality-band findings used by the analytical workflow.
- `scripts/anti-hallucination.js` blocks unknown chain narrators (stricter than the validator's warning), missing provenance, and synthetic-pattern identifiers before any analysis runs.

### Identity integrity

`scripts/entity-resolution.js` keeps alias/merge/split operations explicit and replayable. Merges preserve evidence linkage; splits require explicit evidence redistribution.

### Canonical-record integrity manifests

`scripts/integrity-seal.js` can produce a deterministic SHA-256 sidecar over normalized batch metadata, hadith records, and narrator profiles. The CLI `seal` command emits the baseline and `verify-seal` reports altered, missing, or unexpected records. Verification is caller-invoked and does not become a schema or publication gate.

### Claim-evidence binding

`scripts/evidence-binding.js` blocks reliability-weighted analytical claims when required narrator evidence or provenance is missing. Unknown narrator IDs and synthetic or invalid evidence references are validation concerns rather than silently accepted facts.

Structural-only analysis may produce structurally meaningful claims without reliability evidence; the binding layer can warn without pretending reliability support exists.

### Contradiction handling

High-severity reliability contradictions activate the configured contradiction cap and prevent a contradictory candidate from reaching the `supported` outcome. The security property is the cap itself: contradictory evidence cannot silently pass through as fully supported.

### Explicit uncertainty

Families with no detected candidates are represented as `insufficient_data`. Candidate outcomes include `uncertain` and `likely_weak_in_context`; explainability output preserves uncertainty and blocking violations rather than dropping them from reports.

### Export gate

`ValidationResult.analysis_can_proceed` is propagated into the canonical report. `CanonicalReport.canExport()` requires every family to permit analysis to proceed. This is the analytical publication gate. The CLI `export` command returns error code `EXPORT_BLOCKED` when the gate is closed. The CLI `pipeline` command also exits 1 when `can_export` is false, but returns its normal pipeline envelope rather than an `EXPORT_BLOCKED` error. Pipeline fields explicitly label validation as a blocking precondition, quality and integrity findings as observations, and the report as the publication gate. Observation stages do not independently control pipeline success.

## Residual Risks

- Data in localStorage can be modified by scripts running in the same origin context. Optional integrity manifests cover exported canonical import batches, not live browser storage.
- An integrity manifest detects changes only when the baseline is retained separately and trusted. Because it is an unkeyed digest rather than a signature, it does not prove authorship or source authenticity and cannot detect an attacker changing both batch and manifest.
- Provenance completeness is only as trustworthy as the source information entered. Schema validity does not prove a citation is authentic or accurately transcribed.
- Automated CL/PCL scoring is an interpretation layer. A high score is not proof of historical origin, fabrication, or authenticity.
- Entity resolution remains consequential: an incorrect merge or split can alter graph topology and downstream analysis even when the operation is technically valid.
- Large inputs within configured browser limits can still be costly on low-power devices.
- Deployment parity depends on running the synchronization and verification workflow when browser source changes.

## Release Gates

For a change touching analytical behavior, release requires the relevant existing tests to pass and no known blocking evidence-integrity defect to remain. For browser-source changes, `npm run verify:parity` must pass after synchronization. Do not bypass complexity, lint, or validation failures to preserve an analytical result.

## Future Hardening Direction

Future work should strengthen traceability rather than add parallel policy layers. High-value improvements include signed or externally anchored integrity manifests, machine-readable schema contracts at additional boundaries, and richer provenance links from report claims back to exact evidence spans.
