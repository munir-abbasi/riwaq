# How Does Riwaq Work?

Riwaq helps researchers construct isnad chains, compare transmitted wording, and analyze transmission families. The browser workspace is the interaction surface; analytical conclusions are produced by deterministic analysis modules and remain explicitly separated from source evidence.

## 1. Build and inspect transmission data

In the browser, narrators can be entered as ordered chains, annotated with dates, locations, tags, and matn text, and arranged on a visual map. The map represents the entered transmission structure; it does not by itself establish historical authenticity or fabrication.

Matn alignment highlights wording that is shared, added, removed, or otherwise different between entered variants. Those differences become evidence for scholarly comparison, not automatic historical conclusions.

## 2. Import a transmission family

Programmatic analysis starts from a versioned JSON batch. `scripts/json-validator.js` validates and normalizes the import schema before downstream analysis.

The import validator distinguishes blocking schema errors from warnings. For example, a chain may reference a narrator without a corresponding top-level narrator profile. That unresolved reference is warning-level. Normalization does **not** synthesize a narrator profile for it, so the reference remains unresolved for layers that require declared narrator metadata.

## 3. Resolve identity before interpretation

Narrator aliases, merges, and splits belong to the entity-resolution layer. Identity changes are explicit and replayable so that evidence is not silently detached from the narrator it originally described.

This matters because graph structure, reliability evidence, and later analytical claims all depend on stable narrator identity.

## 4. Detect structural CL/PCL candidates

For each family, Riwaq looks for Common Link (CL) and Partial Common Link (PCL) candidates. It derives a narrator graph and structural features such as fan-out, bundle coverage, collector diversity, pre-single-strand ratio, bypass ratio, chronology-conflict ratio, matn coherence, and provenance completeness. Matn coherence is currently an explicit neutral default rather than a text-derived measurement; each candidate carries `matn_coherence_basis` so callers can distinguish that limitation.

The analyzer then reports a family state:

- `cl_detected`
- `pcl_only`
- `insufficient_data`

These values describe what structural pattern was detected. They are separate from the outcome assigned to an individual candidate.

Candidates can receive one of four outcomes:

- `supported`
- `contested`
- `uncertain`
- `likely_weak_in_context`

The labels describe the result of the configured scoring method. They should not be read as direct verdicts on the authenticity of a hadith.

## 5. Choose the analysis profile

Riwaq has two analysis profiles.

`structural_only` uses graph-derived evidence only. Reliability evidence is not required for this profile, although missing contextual evidence can still be surfaced as a warning.

`reliability_weighted` combines the structural score with a reliability prior under the configured weighted-analysis contract. The layer is explicitly constructed and injected as an opt-in; when populated, its per-narrator `derived_confidence` supplies the prior. Reliability evidence belongs canonically on `narrators[].reliability_evidence`, which is consumed by both derivation and evidence binding. Claims that depend on narrator reliability must also pass evidence binding with provenance. A high-severity reliability contradiction activates the contradiction cap and prevents a contradictory candidate from reaching the `supported` outcome.

The CLI `pipeline` is best understood as a compact observation packet: it validates input, reports preflight quality and integrity-sweep findings, and builds the canonical report. Those stage findings remain distinct control signals. Publication permission still comes from the canonical report's evidence-binding gate.

## 6. Bind claims to evidence

`scripts/evidence-binding.js` checks whether analytical claims have the identity, evidence, and provenance required by the selected profile. Its decisive release field is `analysis_can_proceed`.

A warning records uncertainty or incomplete context without necessarily stopping analysis. A blocking violation sets `analysis_can_proceed` to false for that family.

This is a different state axis from both `family_status` and candidate `outcome`.

## 7. Explain uncertainty and produce one canonical report

The explainability layer records feature contributions, audit information, and uncertainty without changing the candidate classification.

`CanonicalReport` then assembles the family-level analysis, evidence-binding result, explainability data, and derived artifacts. Human-facing exporters consume this report rather than recomputing analytical meaning independently.

For a multi-family batch, `report.getReportData().families` contains one ordered entry per family, including its analysis, candidates, evidence-binding state, artifact summary, uncertainty, and audit trail. The top-level family-specific fields continue to describe the first family for backward compatibility.

`CanonicalReport.canExport()` is true only when every family-level validation result permits analysis to proceed.

## 8. What the analysis can and cannot establish

CL/PCL and isnad-cum-matn patterns can support historical hypotheses about transmission, branching, and the earliest recoverable circulation represented by the analyzed evidence. Correlation between textual variants and isnad branches can strengthen or weaken a proposed transmission model.

Those patterns do not, by themselves, prove an exact historical origin, an exact reconstructed original wording, Prophetic attribution, or fabrication by a particular narrator. Bypass, spider, or dive-like strands are anomaly signals that require scholarly interpretation alongside source criticism, chronology, provenance, and alternative explanations.

The software therefore separates source evidence, derived structure, analytical interpretation, claim validity, uncertainty, and export permission instead of compressing them into one confidence value.

## 9. Driving it yourself

Everything above is invocable without writing code:

```bash
node scripts/riwaq-cli.mjs pipeline docs/examples/sample-import.json
```

That single command validates the batch, scores its quality, runs the integrity sweep, builds the canonical report, and reports whether export is permitted. For the full supported CLI workflow, including capability discovery, state snapshots, impact routing, integrity seals, reporting, and export, see `docs/USAGE.md`.

`pipeline` intentionally returns a compact per-family gate summary. Run `node scripts/riwaq-cli.mjs report <file.json>` when complete family results are needed under `data.families`.
