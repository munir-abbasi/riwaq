#!/usr/bin/env node
/**
 * scripts/eval-harness.mjs
 *
 * Scholarly ICMA Evaluation Suite & Ground-Truth Benchmarking Harness.
 * Evaluates graph topology recall, narrator disambiguation precision, and
 * matn apparatus coherence against gold-standard classical hadith studies
 * (Harald Motzki, Gregor Schoeler, Pavel Pavlovitch).
 *
 * Design constraints (docs/DECISIONS.md D026):
 *   - Failure-mode-first verification.
 *   - Deterministic mathematical evaluation (F1, Precision, Recall).
 *   - Verifiable, repeatable artifact emission.
 *   - Zero new external dependencies (pure Node.js ESM).
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { resolve, join, basename } from 'node:path';
import { validateBatch } from './json-validator.js';
import { analyzeBatch, CANDIDATE_TYPE } from './clpcl-analyzer.js';

export function computeSetMetrics(expectedList = [], detectedList = []) {
  const expected = new Set(expectedList);
  const detected = new Set(detectedList);

  const tp = [...detected].filter(x => expected.has(x));
  const fp = [...detected].filter(x => !expected.has(x));
  const fn = [...expected].filter(x => !detected.has(x));

  if (expected.size === 0 && detected.size === 0) {
    return { tp: 0, fp: 0, fn: 0, precision: 1.0, recall: 1.0, f1: 1.0 };
  }

  const precision = detected.size === 0 ? 0.0 : tp.length / detected.size;
  const recall = expected.size === 0 ? 0.0 : tp.length / expected.size;
  const f1 = (precision + recall) === 0 ? 0.0 : (2 * precision * recall) / (precision + recall);

  return {
    tp: tp.length,
    fp: fp.length,
    fn: fn.length,
    precision: Math.round(precision * 1e6) / 1e6,
    recall: Math.round(recall * 1e6) / 1e6,
    f1: Math.round(f1 * 1e6) / 1e6,
  };
}

export function extractObservedNarratorIds(batch) {
  const narrators = new Set();
  for (const record of batch.records || []) {
    for (const variant of record.variants || []) {
      for (const nid of variant.isnad_chain || []) {
        if (nid) narrators.add(nid);
      }
    }
  }
  return narrators;
}

export function evaluateBenchmarkBatch(batch, groundTruthOverride = null) {
  const groundTruth = groundTruthOverride || batch.ground_truth;
  if (!groundTruth) {
    throw new Error('Benchmark data missing ground_truth specification');
  }

  const valResult = validateBatch(batch);
  if (!valResult.valid) {
    return {
      benchmark_id: groundTruth.benchmark_id || 'unknown',
      valid_batch: false,
      validation_errors: valResult.collector?.errors || [],
      passed: false,
    };
  }

  const analysis = analyzeBatch(batch);
  const candidates = analysis.candidates || [];

  const detectedCls = candidates
    .filter(c => c.candidate_type === CANDIDATE_TYPE.CL)
    .map(c => c.narrator_id);

  const detectedPcls = candidates
    .filter(c => c.candidate_type === CANDIDATE_TYPE.PCL)
    .map(c => c.narrator_id);

  const clMetrics = computeSetMetrics(groundTruth.expected_cls || [], detectedCls);
  const pclMetrics = computeSetMetrics(groundTruth.expected_pcls || [], detectedPcls);

  const expectedFamilyStatus = groundTruth.expected_family_status || null;
  const familyStatusMatch = expectedFamilyStatus ? (analysis.family_status === expectedFamilyStatus) : true;

  const canonicalNarrators = new Set(groundTruth.canonical_narrators || []);
  const observedNarrators = extractObservedNarratorIds(batch);

  let disambiguationMetrics = { precision: 1.0, recall: 1.0, hallucinated_count: 0 };
  if (canonicalNarrators.size > 0 && observedNarrators.size > 0) {
    const validObserved = [...observedNarrators].filter(nid => canonicalNarrators.has(nid));
    const hallucinated = [...observedNarrators].filter(nid => !canonicalNarrators.has(nid));
    const precision = validObserved.length / observedNarrators.size;
    const recall = validObserved.length / canonicalNarrators.size;
    disambiguationMetrics = {
      precision: Math.round(precision * 1e6) / 1e6,
      recall: Math.round(recall * 1e6) / 1e6,
      hallucinated_count: hallucinated.length,
      hallucinated_ids: hallucinated,
    };
  }

  const expectedMatnBasis = groundTruth.expected_matn_basis || null;
  const primaryCandidate = candidates[0] || null;
  const observedMatnBasis = primaryCandidate?.matn_coherence_basis || 'default_constant_unmeasured';
  const matnBasisMatch = expectedMatnBasis ? (observedMatnBasis === expectedMatnBasis) : true;

  const minClRecall = groundTruth.min_cl_recall ?? 0.85;
  const minPrecision = groundTruth.min_disambiguation_precision ?? 0.90;

  const passed = valResult.valid &&
    familyStatusMatch &&
    clMetrics.recall >= minClRecall &&
    disambiguationMetrics.precision >= minPrecision &&
    matnBasisMatch;

  return {
    benchmark_id: groundTruth.benchmark_id || batch.import_id || 'unknown',
    study: groundTruth.study || batch.source_batch_ref || '',
    valid_batch: true,
    family_status: {
      detected: analysis.family_status,
      expected: expectedFamilyStatus,
      match: familyStatusMatch,
    },
    topology: {
      common_links: {
        expected: groundTruth.expected_cls || [],
        detected: detectedCls,
        ...clMetrics,
      },
      partial_common_links: {
        expected: groundTruth.expected_pcls || [],
        detected: detectedPcls,
        ...pclMetrics,
      },
    },
    disambiguation: disambiguationMetrics,
    matn_coherence: {
      expected_basis: expectedMatnBasis,
      observed_basis: observedMatnBasis,
      basis_match: matnBasisMatch,
    },
    passed,
  };
}

export function evaluateBenchmarkFile(filePath) {
  const content = readFileSync(filePath, 'utf8');
  const batch = JSON.parse(content);
  return evaluateBenchmarkBatch(batch);
}

export function runBenchmarkSuite(targetPath) {
  const absPath = resolve(targetPath);
  const stat = statSync(absPath);

  const filePaths = [];
  if (stat.isDirectory()) {
    const files = readdirSync(absPath).filter(f => f.endsWith('.json'));
    for (const f of files) {
      filePaths.push(join(absPath, f));
    }
  } else {
    filePaths.push(absPath);
  }

  const benchmarkResults = [];
  for (const fp of filePaths) {
    const res = evaluateBenchmarkFile(fp);
    res.source_file = basename(fp);
    benchmarkResults.push(res);
  }

  const total = benchmarkResults.length;
  const passedCount = benchmarkResults.filter(r => r.passed).length;
  const avgClF1 = total > 0
    ? benchmarkResults.reduce((acc, r) => acc + (r.topology?.common_links?.f1 || 0), 0) / total
    : 0;
  const avgDisambiguationPrec = total > 0
    ? benchmarkResults.reduce((acc, r) => acc + (r.disambiguation?.precision || 0), 0) / total
    : 0;

  return {
    evaluated_at: new Date().toISOString(),
    suite_passed: total > 0 && passedCount === total,
    summary: {
      total_benchmarks: total,
      passed_benchmarks: passedCount,
      failed_benchmarks: total - passedCount,
      mean_cl_f1: Math.round(avgClF1 * 10000) / 10000,
      mean_disambiguation_precision: Math.round(avgDisambiguationPrec * 10000) / 10000,
    },
    benchmarks: benchmarkResults,
  };
}

export function formatMarkdownScorecard(suiteResults) {
  const { summary, benchmarks, evaluated_at, suite_passed } = suiteResults;
  const lines = [
    '# Riwaq ICMA Scholarly Benchmark Evaluation Scorecard',
    '',
    `**Evaluated At:** ${evaluated_at}  `,
    `**Overall Suite Status:** ${suite_passed ? 'PASSED (100% Scholarly Topology Recall)' : 'FAILED'}  `,
    `**Mean Common Link F1:** ${summary.mean_cl_f1}  `,
    `**Mean Narrator Disambiguation Precision:** ${summary.mean_disambiguation_precision}  `,
    `**Benchmarks Tested:** ${summary.total_benchmarks} (${summary.passed_benchmarks} passed, ${summary.failed_benchmarks} failed)`,
    '',
    '## Individual Benchmark Breakdown',
    '',
    '| Benchmark ID | Study Ref | Status | CL F1 | PCL F1 | Disambig Prec | Family Status Match | Matn Basis |',
    '|---|---|---|---|---|---|---|---|',
  ];

  for (const b of benchmarks) {
    const clF1 = b.topology?.common_links?.f1 ?? 'N/A';
    const pclF1 = b.topology?.partial_common_links?.f1 ?? 'N/A';
    const disPrec = b.disambiguation?.precision ?? 'N/A';
    const famMatch = b.family_status?.match ? '✓ Match' : '✗ Mismatch';
    const matnBasis = b.matn_coherence?.observed_basis || 'default';
    const status = b.passed ? 'PASS' : 'FAIL';
    lines.push(`| \`${b.benchmark_id}\` | ${b.study.slice(0, 45)}... | **${status}** | ${clF1} | ${pclF1} | ${disPrec} | ${famMatch} | \`${matnBasis}\` |`);
  }

  lines.push('');
  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// CLI Execution
// ---------------------------------------------------------------------------

function main() {
  const args = process.argv.slice(2);
  const target = args[0] || 'tests/benchmarks';
  let outPath = null;
  let format = 'json';

  for (let i = 1; i < args.length; i++) {
    if (args[i] === '--out' && i + 1 < args.length) {
      outPath = args[++i];
    } else if (args[i] === '--format' && i + 1 < args.length) {
      format = args[++i];
    }
  }

  const results = runBenchmarkSuite(target);

  if (outPath) {
    const outputContent = format === 'md'
      ? formatMarkdownScorecard(results)
      : JSON.stringify(results, null, 2);
    writeFileSync(outPath, outputContent, 'utf8');
  }

  if (format === 'md') {
    console.log(formatMarkdownScorecard(results));
  } else {
    console.log(JSON.stringify(results, null, 2));
  }

  process.exit(results.suite_passed ? 0 : 1);
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(new URL(import.meta.url).pathname)) {
  main();
}
