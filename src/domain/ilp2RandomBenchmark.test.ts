import { describe, expect, test } from 'vitest';
import { CP2_RANDOM_BENCHMARK_CORPUS } from './cp2RandomBenchmark';
import {
  generateILP2RandomBenchmarkConclusion,
  runILP2RandomBenchmark,
  runILP2RandomBenchmarkCase,
  summarizeILP2RandomBenchmark,
  type ILP2RandomBenchmarkResult,
} from './ilp2RandomBenchmark';

describe('ILP2 random graph benchmark', () => {
  test('reuses the released Phase B corpus definitions directly', () => {
    const results = runILP2RandomBenchmark().results;
    expect(results).toHaveLength(CP2_RANDOM_BENCHMARK_CORPUS.length);
    for (const [i, r] of results.entries()) {
      const spec = CP2_RANDOM_BENCHMARK_CORPUS[i];
      expect(r.caseId).toBe(spec.caseId);
      expect(r.tier).toBe(spec.tier);
      expect(r.graphFamily).toBe(spec.graphFamily);
      expect(r.seed).toBe(spec.params.seed);
      expect(r.generatorParameters).toEqual(spec.params);
      expect(r.maxEvents).toBe(spec.maxEvents);
    }
  });

  test('two runs over the safe subset produce deeply equal serializable results', () => {
    const safeCorpus = CP2_RANDOM_BENCHMARK_CORPUS.filter((s) => s.tier !== 'L');
    expect(JSON.stringify(runILP2RandomBenchmark(safeCorpus))).toBe(JSON.stringify(runILP2RandomBenchmark(safeCorpus)));
  });

  test('all Tier S cases are complete-comparable with all equality fields true', () => {
    const tierS = runILP2RandomBenchmark().results.filter((r) => r.tier === 'S');
    expect(tierS).toHaveLength(4);
    for (const r of tierS) {
      expect(r.classification).toBe('complete-comparable');
      expect(r.ilp2.proofComplete).toBe(true);
      expect(r.exactness.cp2ObjectiveEquality).toBe(true);
      expect(r.exactness.cp2WinnerEquality).toBe(true);
      expect(r.exactness.cp2PlusObjectiveEquality).toBe(true);
      expect(r.exactness.cp2PlusWinnerEquality).toBe(true);
      expect(r.exactness.cp2ValidityEquality).toBe(true);
      expect(r.exactness.cp2PlusValidityEquality).toBe(true);
      expect(r.exactness.proofCompleteEquality).toBe(true);
      // new counters map correctly from solver result
      expect(r.ilp2.enumeratedCandidates).toBe(r.ilp2.exploredCandidates);
      expect(r.ilp2.candidateEvaluationEvents).toBe(r.ilp2.enumeratedCandidates);
      expect(r.ilp2.enumeratedCandidates).toBeGreaterThan(0);
      expect(r.ilp2.earlyTermination).toBe(false);
      expect(r.ilp2.candidatesSkippedAfterWinner).toBe(0);
      expect(r.ilp2.acceptedFeasibleCandidates + r.ilp2.rejectedCandidates).toBe(r.ilp2.exploredCandidates);
      expect(r.ilp2.rejectedDisconnectedGenomicCandidates + r.ilp2.rejectedWitnessCandidates).toBe(r.ilp2.rejectedCandidates);
    }
  });

  test('Tier M cases carry a truthful classification and consistent flags', () => {
    const tierM = runILP2RandomBenchmark().results.filter((r) => r.tier === 'M');
    expect(tierM).toHaveLength(4);
    const valid = ['complete-comparable', 'incomplete-capped', 'incomplete-cancelled', 'error'] as const;
    for (const r of tierM) {
      expect(valid).toContain(r.classification);
      if (r.classification !== 'complete-comparable') {
        expect(r.exactness.cp2ObjectiveEquality).toBeNull();
        expect(r.exactness.cp2WinnerEquality).toBeNull();
        expect(r.exactness.cp2PlusObjectiveEquality).toBeNull();
        expect(r.exactness.cp2PlusWinnerEquality).toBeNull();
        expect(r.exactness.cp2ValidityEquality).toBeNull();
        expect(r.exactness.cp2PlusValidityEquality).toBeNull();
        expect(r.exactness.proofCompleteEquality).toBeNull();
      }
      if (r.ilp2.interruptedByCap) {
        expect(r.ilp2.proofComplete).toBe(false);
        expect(r.ilp2.status).toBe('incomplete');
      }
    }
  });

  test('Tier L cases are not-run-preenumeration-risk and never claim proof or optimality', () => {
    const tierL = runILP2RandomBenchmark().results.filter((r) => r.tier === 'L');
    expect(tierL).toHaveLength(2);
    for (const r of tierL) {
      expect(r.classification).toBe('not-run-preenumeration-risk');
      expect(r.ilp2.status).toBe('not-run');
      expect(r.ilp2.proofComplete).toBe(false);
      // not capped — explicitly skipped before execution
      expect(r.ilp2.interruptedByCap).toBe(false);
      expect(r.ilp2.cancelled).toBe(false);
      expect(r.exactness.cp2ObjectiveEquality).toBeNull();
      expect(r.exactness.cp2WinnerEquality).toBeNull();
      expect(r.exactness.cp2PlusObjectiveEquality).toBeNull();
      expect(r.exactness.cp2PlusWinnerEquality).toBeNull();
      expect(r.exactness.cp2ValidityEquality).toBeNull();
      expect(r.exactness.cp2PlusValidityEquality).toBeNull();
      expect(r.exactness.proofCompleteEquality).toBeNull();
      // not-run: all counters must be zero
      expect(r.ilp2.enumeratedCandidates).toBe(0);
      expect(r.ilp2.rejectedDisconnectedGenomicCandidates).toBe(0);
      expect(r.ilp2.rejectedWitnessCandidates).toBe(0);
      expect(r.ilp2.acceptedFeasibleCandidates).toBe(0);
      expect(r.ilp2.candidateEvaluationEvents).toBe(0);
      expect(r.ilp2.witnessParentLinksAssigned).toBe(0);
      expect(r.ilp2.witnessLevelsAssigned).toBe(0);
      expect(r.ilp2.earlyTermination).toBe(false);
      expect(r.ilp2.candidatesSkippedAfterWinner).toBe(0);
    }
  });

  test('forced cap: maxEvents=1 produces incomplete with no proof-complete and null equality fields', () => {
    const r = runILP2RandomBenchmarkCase({ ...CP2_RANDOM_BENCHMARK_CORPUS[0], maxEvents: 1 });
    expect(r.ilp2.status).toBe('incomplete');
    expect(r.ilp2.interruptedByCap).toBe(true);
    expect(r.ilp2.proofComplete).toBe(false);
    expect(r.exactness.cp2ObjectiveEquality).toBeNull();
    expect(r.exactness.cp2WinnerEquality).toBeNull();
    expect(r.exactness.cp2PlusObjectiveEquality).toBeNull();
    expect(r.exactness.cp2PlusWinnerEquality).toBeNull();
    expect(r.exactness.cp2ValidityEquality).toBeNull();
    expect(r.exactness.cp2PlusValidityEquality).toBeNull();
    expect(r.exactness.proofCompleteEquality).toBeNull();
    expect(r.classification).not.toBe('complete-comparable');
  });

  test('metadata: family, seed, parameters, and statistics are preserved for all results', () => {
    const results = runILP2RandomBenchmark().results;
    for (const r of results) {
      const spec = CP2_RANDOM_BENCHMARK_CORPUS.find((s) => s.caseId === r.caseId)!;
      expect(r.graphFamily).toBe(spec.graphFamily);
      expect(r.seed).toBe(spec.params.seed);
      expect(r.generatorParameters).toEqual(spec.params);
      expect(r.graph.vertexCount).toBe(spec.params.n);
      expect(r.graph.directedEdgeCount).toBeGreaterThanOrEqual(0);
      expect(r.graph.genomicEdgeCount).toBeGreaterThanOrEqual(0);
    }
  });

  test('summary totals are derived from result arrays', () => {
    const makeResult = (overrides: Partial<ILP2RandomBenchmarkResult>): ILP2RandomBenchmarkResult => ({
      caseId: 'x', tier: 'S', graphFamily: 'acyclic-erdos-renyi',
      generatorParameters: { n: 4, pD: 0.5, pG: 0.5, seed: 1 }, seed: 1,
      graph: { vertexCount: 4, directedEdgeCount: 2, genomicEdgeCount: 2 },
      maxEvents: 200000,
      ilp2: {
        status: 'optimal', path: ['R1', 'R2'], objective: 2, proofComplete: true,
        searchComplete: true, interruptedByCap: false, cancelled: false,
        exploredCandidates: 5, rejectedCandidates: 1,
        enumeratedCandidates: 5, rejectedDisconnectedGenomicCandidates: 0,
        rejectedWitnessCandidates: 1, acceptedFeasibleCandidates: 4,
        candidateEvaluationEvents: 5, witnessParentLinksAssigned: 3, witnessLevelsAssigned: 4,
        earlyTermination: false, candidatesSkippedAfterWinner: 0,
        witnessRoot: 'R1', witnessParentLinkCount: 1, witnessLevelCount: 2,
      },
      pathValid: true,
      exactness: { cp2ObjectiveEquality: true, cp2WinnerEquality: true, cp2ValidityEquality: true, cp2PlusObjectiveEquality: true, cp2PlusWinnerEquality: true, cp2PlusValidityEquality: true, proofCompleteEquality: true },
      classification: 'complete-comparable',
      ...overrides,
    });

    const results: ILP2RandomBenchmarkResult[] = [
      makeResult({ caseId: 'a' }),
      makeResult({
        caseId: 'b', tier: 'M', classification: 'incomplete-capped',
        exactness: { cp2ObjectiveEquality: null, cp2WinnerEquality: null, cp2ValidityEquality: null, cp2PlusObjectiveEquality: null, cp2PlusWinnerEquality: null, cp2PlusValidityEquality: null, proofCompleteEquality: null },
      }),
      makeResult({
        caseId: 'c', tier: 'L', classification: 'not-run-preenumeration-risk',
        ilp2: { status: 'not-run', path: null, objective: 0, proofComplete: false, searchComplete: false, interruptedByCap: false, cancelled: false, exploredCandidates: 0, rejectedCandidates: 0, enumeratedCandidates: 0, rejectedDisconnectedGenomicCandidates: 0, rejectedWitnessCandidates: 0, acceptedFeasibleCandidates: 0, candidateEvaluationEvents: 0, witnessParentLinksAssigned: 0, witnessLevelsAssigned: 0, earlyTermination: false, candidatesSkippedAfterWinner: 0, witnessRoot: null, witnessParentLinkCount: null, witnessLevelCount: null },
        exactness: { cp2ObjectiveEquality: null, cp2WinnerEquality: null, cp2ValidityEquality: null, cp2PlusObjectiveEquality: null, cp2PlusWinnerEquality: null, cp2PlusValidityEquality: null, proofCompleteEquality: null },
      }),
    ];

    const summary = summarizeILP2RandomBenchmark(results);
    expect(summary.totalCases).toBe(3);
    expect(summary.completeComparableCases).toBe(1);
    expect(summary.incompleteCappedCases).toBe(1);
    expect(summary.incompleteCancelledCases).toBe(0);
    expect(summary.notRunPreenumerationRiskCases).toBe(1);
    expect(summary.errorCases).toBe(0);
    expect(summary.tierCounts.S.total).toBe(1);
    expect(summary.tierCounts.M.total).toBe(1);
    expect(summary.tierCounts.L.total).toBe(1);
    expect(summary.tierCounts.L.notRun).toBe(1);
    expect(summary.tierCounts.S.completeComparable).toBe(1);
    expect(summary.tierCounts.M.completeComparable).toBe(0);
    // mismatches counted only on comparable: case 'a' has all true → 0 mismatches
    expect(summary.equalityMismatches.cp2Objective).toBe(0);
    expect(summary.equalityMismatches.cp2Winner).toBe(0);
    expect(summary.equalityMismatches.cp2Validity).toBe(0);
    expect(summary.equalityMismatches.cp2PlusObjective).toBe(0);
    expect(summary.equalityMismatches.cp2PlusWinner).toBe(0);
    expect(summary.equalityMismatches.cp2PlusValidity).toBe(0);
  });

  test('conclusion is corpus-specific, notes not-run safety cases, and contains no forbidden claims', () => {
    const { summary } = runILP2RandomBenchmark();
    const conclusion = generateILP2RandomBenchmarkConclusion(summary);
    expect(conclusion).toMatch(/corpus-specific/i);
    expect(conclusion).toMatch(/not executed|not run|preenumeration|pre-enumeration/i);
    expect(conclusion).not.toMatch(/runtime superiority/i);
    expect(conclusion).not.toMatch(/paper reproduction/i);
    expect(conclusion).not.toMatch(/new research method/i);
    expect(conclusion).not.toMatch(/native milp/i);
    expect(conclusion).not.toMatch(/always faster/i);
    expect(conclusion).not.toMatch(/universally better/i);
  });
});
