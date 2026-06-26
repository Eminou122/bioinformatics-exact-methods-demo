import { describe, expect, test } from 'vitest';
import {
  CP2_RANDOM_BENCHMARK_CORPUS,
  generateCP2RandomBenchmarkConclusion,
  runCP2RandomBenchmark,
  runCP2RandomBenchmarkCase,
  summarizeCP2RandomBenchmark,
  type CP2RandomBenchmarkResult,
} from './cp2RandomBenchmark';

describe('CP2 random graph benchmark', () => {
  test('corpus is deterministic across two independent runs', () => {
    expect(JSON.stringify(runCP2RandomBenchmark())).toBe(JSON.stringify(runCP2RandomBenchmark()));
  });

  test('all 10 results include family, seed, exact generator parameters, and correct graph statistics', () => {
    const results = runCP2RandomBenchmark().results;
    expect(results).toHaveLength(10);
    for (const r of results) {
      expect(r.graphFamily).toMatch(/^acyclic-(erdos-renyi|scale-free)$/);
      expect(r.seed).toBe(r.generatorParameters.seed);
      expect(r.graph.vertexCount).toBeGreaterThanOrEqual(1);
      expect(r.graph.directedEdgeCount).toBeGreaterThanOrEqual(0);
      expect(r.graph.genomicEdgeCount).toBeGreaterThanOrEqual(0);
      const spec = CP2_RANDOM_BENCHMARK_CORPUS.find((s) => s.caseId === r.caseId)!;
      expect(r.generatorParameters).toEqual(spec.params);
      expect(r.graph.vertexCount).toBe(spec.params.n);
    }
  });

  test('all Tier S cases are complete-comparable with objective, winner, validity, and proof-complete equality', () => {
    const tierS = runCP2RandomBenchmark().results.filter((r) => r.tier === 'S');
    expect(tierS).toHaveLength(4);
    for (const r of tierS) {
      expect(r.classification).toBe('complete-comparable');
      expect(r.exactness.objectiveEquality).toBe(true);
      expect(r.exactness.winnerEquality).toBe(true);
      expect(r.exactness.validityEquality).toBe(true);
      expect(r.exactness.proofCompleteEquality).toBe(true);
    }
  });

  test('every complete-comparable result has non-null matching equality fields', () => {
    const comparable = runCP2RandomBenchmark().results.filter((r) => r.classification === 'complete-comparable');
    expect(comparable.length).toBeGreaterThan(0);
    for (const r of comparable) {
      expect(r.exactness.objectiveEquality).toBe(true);
      expect(r.exactness.winnerEquality).toBe(true);
      expect(r.exactness.validityEquality).toBe(true);
    }
  });

  test('capped results never report proof-complete and have null equality fields', () => {
    const results = runCP2RandomBenchmark().results;
    for (const r of results) {
      if (r.cap.cp2InterruptedByCap) expect(r.cp2.proofComplete).toBe(false);
      if (r.cap.cp2PlusInterruptedByCap) expect(r.cp2Plus.proofComplete).toBe(false);
      if (r.classification === 'incomplete-capped') {
        expect(r.exactness.objectiveEquality).toBeNull();
        expect(r.exactness.winnerEquality).toBeNull();
        expect(r.exactness.validityEquality).toBeNull();
      }
    }
  });

  test('summary totals are derived from results and match manually recomputed totals', () => {
    const makeResult = (overrides: Partial<CP2RandomBenchmarkResult>): CP2RandomBenchmarkResult => ({
      caseId: 'x',
      tier: 'S',
      graphFamily: 'acyclic-erdos-renyi',
      generatorParameters: { n: 4, pD: 0.5, pG: 0.5, seed: 1 },
      seed: 1,
      graph: { vertexCount: 4, directedEdgeCount: 2, genomicEdgeCount: 2 },
      cap: { maxEvents: 200000, cp2InterruptedByCap: false, cp2PlusInterruptedByCap: false },
      cp2: { status: 'optimal', objective: 3, proofComplete: true, exploredStates: 10, prunedStates: 2 },
      cp2Plus: {
        status: 'optimal', objective: 3, proofComplete: true,
        exploredStates: 8, directedBoundPrunes: 1, genomicPropagationChecks: 5, genomicPropagationPrunes: 3,
      },
      exactness: { objectiveEquality: true, winnerEquality: true, validityEquality: true, proofCompleteEquality: true },
      classification: 'complete-comparable',
      ...overrides,
    });

    const results: CP2RandomBenchmarkResult[] = [
      makeResult({ caseId: 'a' }),
      makeResult({
        caseId: 'b', tier: 'M', classification: 'incomplete-capped',
        exactness: { objectiveEquality: null, winnerEquality: null, validityEquality: null, proofCompleteEquality: false },
        cp2Plus: {
          status: 'incomplete', objective: 0, proofComplete: false,
          exploredStates: 3, directedBoundPrunes: 0, genomicPropagationChecks: 1, genomicPropagationPrunes: 0,
        },
      }),
      makeResult({ caseId: 'c', tier: 'L', classification: 'error' }),
    ];

    const summary = summarizeCP2RandomBenchmark(results);
    // totalCases derived from results.length
    expect(summary.totalCases).toBe(3);
    expect(summary.completeComparableCases).toBe(1);
    expect(summary.incompleteCappedCases).toBe(1);
    expect(summary.incompleteCancelledCases).toBe(0);
    expect(summary.errorCases).toBe(1);
    // tier counts derived from results
    expect(summary.tierCounts.S.total).toBe(1);  // only 'a'
    expect(summary.tierCounts.M.total).toBe(1);  // only 'b'
    expect(summary.tierCounts.L.total).toBe(1);  // only 'c'
    expect(summary.tierCounts.S.completeComparable).toBe(1);
    expect(summary.tierCounts.M.completeComparable).toBe(0);
    // genomic prunes summed across all results: a=3, b=0, c=3 (c uses default)
    expect(summary.totalGenomicPropagationPrunes).toBe(6);
    // equality mismatches counted only on comparable: a has all true → 0 mismatches
    expect(summary.equalityMismatches.objective).toBe(0);
    expect(summary.equalityMismatches.winner).toBe(0);
    expect(summary.equalityMismatches.validity).toBe(0);
  });

  test('runCP2RandomBenchmarkCase correctly classifies a genuinely capped run', () => {
    // er-tiny-1 with maxEvents=1 deterministically caps both solvers on the first trace event
    const r = runCP2RandomBenchmarkCase({ ...CP2_RANDOM_BENCHMARK_CORPUS[0], maxEvents: 1 });
    expect(r.classification).toBe('incomplete-capped');
    expect(r.cap.cp2InterruptedByCap || r.cap.cp2PlusInterruptedByCap).toBe(true);
    if (r.cap.cp2InterruptedByCap) expect(r.cp2.proofComplete).toBe(false);
    if (r.cap.cp2PlusInterruptedByCap) expect(r.cp2Plus.proofComplete).toBe(false);
    expect(r.exactness.objectiveEquality).toBeNull();
    expect(r.exactness.winnerEquality).toBeNull();
    expect(r.exactness.validityEquality).toBeNull();
    expect(r.cp2.status).not.toBe('optimal');
    expect(r.cp2Plus.status).not.toBe('optimal');
  });

  test('generated conclusion contains corpus-specific wording without forbidden claims', () => {
    const { summary } = runCP2RandomBenchmark();
    const conclusion = generateCP2RandomBenchmarkConclusion(summary);
    expect(conclusion).toMatch(/corpus-specific/i);
    expect(conclusion).toMatch(/generated/i);
    expect(conclusion).not.toMatch(/runtime superiority/i);
    expect(conclusion).not.toMatch(/paper reproduction/i);
    expect(conclusion).not.toMatch(/new research method/i);
    expect(conclusion).not.toMatch(/always faster/i);
    expect(conclusion).not.toMatch(/universally better/i);
  });
});
