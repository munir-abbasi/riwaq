/**
 * scripts/preflight-gates.js
 *
 * Phase 1 — Preflight Quality Gates
 *
 * Evaluates a validated batch for data quality signals and emits
 * blocking errors, warnings, and a quality score.
 *
 * Gates are evaluated after schema validation succeeds.
 *
 * Public API:
 *   evaluateGates(normalizedBatch, collector) → { passed: boolean, qualityScore: number, gateResults: object }
 *
 * Quality score: 0-100 based on provenance completeness, variant coverage, and narrator metadata.
 * Blocking thresholds:
 *   BLOCK: qualityScore < 20 → critical data quality issues
 *   WARN:  qualityScore < 50 → degraded but proceed
 */
import { ImportErrorCollector, SEVERITY, ERROR_CODE } from './import-errors.js';

export const QUALITY = Object.freeze({
  EXCELLENT: 90,
  GOOD: 70,
  FAIR: 50,
  POOR: 20,
});

function scoreProvenance(records) {
  let total = 0;
  let scored = 0;
  for (const r of records) {
    const sr = r.source_ref;
    if (!sr) continue;
    scored++;
    let pts = 0;
    if (sr.collection) pts++;
    if (sr.source_type) pts++;
    if (sr.source_locator) pts++;
    if (sr.ingested_at) pts++;
    if (sr.checksum) pts += 0.5;
    total += pts / 4.5;
  }
  return scored > 0 ? (total / scored) * 100 : 0;
}

function scoreVariantDiversity(records) {
  if (records.length === 0) return 0;
  const totalVariants = records.reduce((s, r) => s + (r.variants?.length || 0), 0);
  const uniqueChains = new Set(records.flatMap(r => (r.variants || []).map(v => v.isnad_chain.join('|'))));
  const diversity = uniqueChains.size / Math.max(totalVariants, 1);
  return diversity * 100;
}

function scoreNarratorMetadata(narrators) {
  if (narrators.length === 0) return 50;
  let total = 0;
  for (const n of narrators) {
    let pts = 0;
    if (n.names?.length > 0) pts++;
    if (n.birth || n.death) pts++;
    if (n.biographical_notes) pts++;
    if (n.locations?.length > 0) pts++;
    if (n.tags?.length > 0) pts++;
    if (n.aliases?.length > 0) pts += 0.5;
    total += pts / 4.5;
  }
  return (total / narrators.length) * 100;
}

function scoreReliabilityCoverage(records) {
  const totalNarrators = records.reduce((s, r) => s + (r.variants?.reduce((ss, v) => ss + (v.isnad_chain?.length || 0), 0) || 0), 0);
  const withEvidence = records.reduce((s, r) => s + (r.reliability_evidence?.length || 0), 0);
  if (totalNarrators === 0) return 0;
  return Math.min((withEvidence / Math.max(totalNarrators, 1)) * 100 * 5, 100);
}

/**
 * Evaluate all preflight gates on a normalized batch.
 * @param {object} batch - normalized batch (output of json-validator.normalizeBatch)
 * @param {ImportErrorCollector} collector - error collector (pre-existing errors carried through)
 * @returns {{ passed: boolean, qualityScore: number, gateResults: object }}
 */
export function evaluateGates(batch, collector = new ImportErrorCollector()) {
  const records = batch.records || [];
  const narrators = batch.narrators || [];

  const provenanceScore = scoreProvenance(records);
  const diversityScore = scoreVariantDiversity(records);
  const metadataScore = scoreNarratorMetadata(narrators);
  const reliabilityScore = scoreReliabilityCoverage(records);

  const qualityScore = Math.round(
    provenanceScore * 0.35 +
    diversityScore * 0.20 +
    metadataScore * 0.25 +
    reliabilityScore * 0.20
  );

  const gateResults = {
    provenanceScore: Math.round(provenanceScore),
    diversityScore: Math.round(diversityScore),
    metadataScore: Math.round(metadataScore),
    reliabilityScore: Math.round(reliabilityScore),
    overallScore: qualityScore,
    recordCount: records.length,
    narratorCount: narrators.length,
    totalVariants: records.reduce((s, r) => s + (r.variants?.length || 0), 0),
  };

  if (qualityScore < QUALITY.POOR) {
    collector.error(
      ERROR_CODE.SCHEMA_VIOLATION,
      `Critical data quality: score=${qualityScore} (<${QUALITY.POOR}). Batch has insufficient provenance, metadata, or variant diversity. Review and enrich data before importing.`,
      [],
      null
    );
  }

  if (qualityScore < QUALITY.FAIR) {
    collector.warn(
      ERROR_CODE.SCHEMA_VIOLATION,
      `Low data quality: score=${qualityScore} (<${QUALITY.FAIR}). Import will proceed but downstream analysis may be degraded.`,
      [],
      null
    );
  }

  const variantIds = new Set();
  for (const r of records) {
    for (const v of (r.variants || [])) {
      if (variantIds.has(v.variant_id)) {
        collector.error(ERROR_CODE.DUPLICATE_ID, `Duplicate variant_id across records: "${v.variant_id}"`, [], null);
      }
      variantIds.add(v.variant_id);
    }
  }

  const hadithIds = new Set();
  for (const r of records) {
    if (hadithIds.has(r.hadith_id)) {
      collector.error(ERROR_CODE.DUPLICATE_ID, `Duplicate hadith_id: "${r.hadith_id}"`, [], null);
    }
    hadithIds.add(r.hadith_id);
  }

  const passed = !collector.hasErrors;

  return { passed, qualityScore, gateResults };
}

export default { evaluateGates, QUALITY };
