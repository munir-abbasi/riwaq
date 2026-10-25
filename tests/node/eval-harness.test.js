/**
 * tests/node/eval-harness.test.js
 *
 * Verifies the Scholarly ICMA Evaluation Suite & Benchmarking Harness.
 * Adheres to Failure-Mode-First testing rules and Milestone 4 specifications:
 *   1. Failure mode: Chain reversal inverts graph fan-out and fails CL topology recall.
 *   2. Failure mode: Ghost variant hallucination drops narrator disambiguation precision.
 *   3. Failure mode: Missing ground truth specification throws descriptive error.
 *   4. Failure mode: Schema-invalid batch returns validation error summary.
 *   5. E2E verification: Golden ICMA benchmark suite (Motzki, Schoeler, Pavlovitch) passes with 100% precision/recall.
 *   6. Repeatable artifact: Verifies tests/fixtures/e2e/m4-icma-benchmark-scorecard.json structure.
 */

import { describe, it } from 'vitest';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

import {
  computeSetMetrics,
  extractObservedNarratorIds,
  evaluateBenchmarkBatch,
  evaluateBenchmarkFile,
  runBenchmarkSuite,
  formatMarkdownScorecard,
} from '../../scripts/eval-harness.mjs';

describe('Scholarly ICMA Eval Harness', () => {
  const motzkiPath = resolve('tests/benchmarks/motzki-1991-maymuna.json');
  const schoelerPath = resolve('tests/benchmarks/schoeler-urwa-tradition.json');
  const pavlovitchPath = resolve('tests/benchmarks/pavlovitch-ibn-ishaq.json');
  const benchmarksDir = resolve('tests/benchmarks');
  const scorecardArtifactPath = resolve('tests/fixtures/e2e/m4-icma-benchmark-scorecard.json');

  it('computes set precision, recall, and F1 accurately including empty edge cases', () => {
    // Both empty -> 1.0
    assert.deepEqual(computeSetMetrics([], []), { tp: 0, fp: 0, fn: 0, precision: 1.0, recall: 1.0, f1: 1.0 });

    // Exact match
    const exact = computeSetMetrics(['a', 'b'], ['a', 'b']);
    assert.equal(exact.precision, 1.0);
    assert.equal(exact.recall, 1.0);
    assert.equal(exact.f1, 1.0);

    // Partial overlap: expected [a, b], detected [b, c]
    // tp = 1 (b), fp = 1 (c), fn = 1 (a)
    // precision = 1/2 = 0.5, recall = 1/2 = 0.5, f1 = 0.5
    const partial = computeSetMetrics(['a', 'b'], ['b', 'c']);
    assert.equal(partial.tp, 1);
    assert.equal(partial.fp, 1);
    assert.equal(partial.fn, 1);
    assert.equal(partial.precision, 0.5);
    assert.equal(partial.recall, 0.5);
    assert.equal(partial.f1, 0.5);
  });

  describe('Failure-Mode-First Scenarios', () => {
    it('FAILURE MODE 1: Chronological chain reversal inverts graph fan-out and fails CL topology recall', () => {
      const canonicalBatch = JSON.parse(readFileSync(motzkiPath, 'utf8'));

      // Invert every isnad chain: collector first, companion last
      const reversedBatch = {
        ...canonicalBatch,
        import_id: 'reversed-test-batch',
        records: canonicalBatch.records.map(rec => ({
          ...rec,
          variants: rec.variants.map(v => ({
            ...v,
            isnad_chain: [...v.isnad_chain].reverse(),
          })),
        })),
      };

      const result = evaluateBenchmarkBatch(reversedBatch);

      // In reversed chains, 'amr-ibn-dinar' fan-out collapses or moves to the collectors/companions
      // and fails the expected CL recall
      assert.equal(result.passed, false, 'Reversed chain batch must fail the evaluation benchmark');
      assert.ok(
        result.topology.common_links.recall < 1.0 || !result.family_status.match,
        'Chronological chain reversal must disrupt CL recall or family status match'
      );
    });

    it('FAILURE MODE 2: Ghost variant hallucination drops narrator disambiguation precision', () => {
      const canonicalBatch = JSON.parse(readFileSync(motzkiPath, 'utf8'));

      // Inject hallucinated variants with non-canonical, synthetic narrator IDs
      const corruptedBatch = {
        ...canonicalBatch,
        import_id: 'corrupted-hallucinated-batch',
        records: [
          ...canonicalBatch.records,
          {
            hadith_id: 'ghost-hadith-99',
            family_id: 'family-maymunah-marriage',
            title: 'Spurious Ghost Tradition',
            source_ref: canonicalBatch.records[0].source_ref,
            variants: [
              {
                variant_id: 'variant-ghost-01',
                isnad_chain: ['maymunah', 'hallucinated-scholar-xyz', 'amr-ibn-dinar', 'fake-collector-99'],
                matn_raw: 'نص وهمي غير موجود في التراث',
              },
            ],
          },
        ],
      };

      const result = evaluateBenchmarkBatch(corruptedBatch);

      assert.equal(result.passed, false, 'Batch with hallucinated narrators must fail evaluation');
      assert.ok(result.disambiguation.precision < 1.0, 'Disambiguation precision must drop below 1.0');
      assert.ok(result.disambiguation.hallucinated_count > 0, 'Must record hallucinated narrator count');
      assert.ok(result.disambiguation.hallucinated_ids.includes('hallucinated-scholar-xyz'));
    });

    it('FAILURE MODE 3: Benchmark missing ground truth specification throws descriptive error', () => {
      const rawBatch = JSON.parse(readFileSync(motzkiPath, 'utf8'));
      delete rawBatch.ground_truth;

      assert.throws(() => {
        evaluateBenchmarkBatch(rawBatch);
      }, /missing ground_truth specification/);
    });

    it('FAILURE MODE 4: Schema-invalid batch returns validation error summary and fails pass gate', () => {
      const invalidBatch = {
        schema_version: 1,
        imported_at: 'not-a-date',
        records: [],
        ground_truth: { benchmark_id: 'invalid-test' },
      };

      const result = evaluateBenchmarkBatch(invalidBatch);
      assert.equal(result.valid_batch, false);
      assert.equal(result.passed, false);
      assert.ok(result.validation_errors.length > 0);
    });
  });

  describe('E2E Benchmark Suite Verification', () => {
    it('evaluates Motzki (1991) Maymunah benchmark with 100% CL and PCL recall', () => {
      const res = evaluateBenchmarkFile(motzkiPath);
      assert.equal(res.valid_batch, true);
      assert.equal(res.passed, true);
      assert.equal(res.family_status.detected, 'cl_detected');
      assert.equal(res.family_status.match, true);
      assert.equal(res.topology.common_links.f1, 1.0);
      assert.deepEqual(res.topology.common_links.detected, ['amr-ibn-dinar']);
      assert.equal(res.topology.partial_common_links.f1, 1.0);
      assert.deepEqual(res.topology.partial_common_links.detected.sort(), ['ibn-jurayj', 'sufyan-ibn-uyaynah'].sort());
      assert.equal(res.disambiguation.precision, 1.0);
      assert.equal(res.matn_coherence.observed_basis, 'measured_token_jaccard');
      assert.equal(res.matn_coherence.basis_match, true);
    });

    it('evaluates Schoeler (1996) Urwah benchmark with 100% CL and PCL recall', () => {
      const res = evaluateBenchmarkFile(schoelerPath);
      assert.equal(res.valid_batch, true);
      assert.equal(res.passed, true);
      assert.equal(res.family_status.detected, 'cl_detected');
      assert.equal(res.family_status.match, true);
      assert.equal(res.topology.common_links.f1, 1.0);
      assert.deepEqual(res.topology.common_links.detected, ['al-zuhri']);
      assert.equal(res.topology.partial_common_links.f1, 1.0);
      assert.deepEqual(res.topology.partial_common_links.detected.sort(), ['ma-mar-ibn-rashid', 'malik-ibn-anas'].sort());
      assert.equal(res.disambiguation.precision, 1.0);
      assert.equal(res.matn_coherence.observed_basis, 'measured_token_jaccard');
      assert.equal(res.matn_coherence.basis_match, true);
    });

    it('evaluates Pavlovitch (2016) Ibn Ishaq benchmark with pcl_only family status', () => {
      const res = evaluateBenchmarkFile(pavlovitchPath);
      assert.equal(res.valid_batch, true);
      assert.equal(res.passed, true);
      assert.equal(res.family_status.detected, 'pcl_only');
      assert.equal(res.family_status.match, true);
      assert.equal(res.topology.common_links.detected.length, 0);
      assert.equal(res.topology.partial_common_links.f1, 1.0);
      assert.deepEqual(res.topology.partial_common_links.detected.sort(), ['al-shabi', 'muhammad-ibn-ishaq'].sort());
      assert.equal(res.disambiguation.precision, 1.0);
      assert.equal(res.matn_coherence.observed_basis, 'default_constant_unmeasured');
      assert.equal(res.matn_coherence.basis_match, true);
    });

    it('runs entire benchmark suite directory and generates markdown scorecard', () => {
      const suiteResults = runBenchmarkSuite(benchmarksDir);
      assert.equal(suiteResults.suite_passed, true);
      assert.equal(suiteResults.summary.total_benchmarks, 3);
      assert.equal(suiteResults.summary.passed_benchmarks, 3);
      assert.equal(suiteResults.summary.failed_benchmarks, 0);
      assert.equal(suiteResults.summary.mean_cl_f1, 1.0);
      assert.equal(suiteResults.summary.mean_disambiguation_precision, 1.0);

      const markdown = formatMarkdownScorecard(suiteResults);
      assert.ok(markdown.includes('# Riwaq ICMA Scholarly Benchmark Evaluation Scorecard'));
      assert.ok(markdown.includes('PASSED'));
      assert.ok(markdown.includes('`motzki-1991-maymuna`'));
      assert.ok(markdown.includes('`schoeler-1996-urwa`'));
      assert.ok(markdown.includes('`pavlovitch-ibn-ishaq`'));
    });

    it('verifies verifiable repeatable artifact m4-icma-benchmark-scorecard.json exists and conforms to contract', () => {
      assert.ok(existsSync(scorecardArtifactPath), 'm4 scorecard artifact must exist');
      const artifact = JSON.parse(readFileSync(scorecardArtifactPath, 'utf8'));
      assert.equal(artifact.suite_passed, true);
      assert.equal(artifact.summary.total_benchmarks, 3);
      assert.equal(artifact.summary.passed_benchmarks, 3);
      assert.equal(artifact.summary.mean_cl_f1, 1.0);
      assert.equal(artifact.summary.mean_disambiguation_precision, 1.0);
      assert.equal(artifact.benchmarks.length, 3);
    });
  });
});
