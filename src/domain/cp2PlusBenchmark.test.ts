import { describe, expect, test } from 'vitest';
import {
  CP2_PLUS_BENCHMARK_CORPUS,
  compareSmallExhaustiveMethods,
  generateBenchmarkConclusion,
  runCP2PlusBenchmark,
  summarizeCP2PlusBenchmark,
  type CP2PlusBenchmarkResult,
} from './cp2PlusBenchmark';
import { solveCP2 } from './cp2Solver';
import { solveCP2Plus } from './cp2PlusSolver';

describe('CP2+ evidence benchmark engine', () => {
  test('the benchmark corpus and results are deterministic', () => {
    expect(JSON.stringify(runCP2PlusBenchmark())).toBe(JSON.stringify(runCP2PlusBenchmark()));
  });

  test('CP2+ exactly matches CP2 on every completed case', () => {
    const completed = runCP2PlusBenchmark().results.filter(
      (result) => result.cp2.proofComplete && result.cp2Plus.proofComplete
    );
    expect(completed.length).toBeGreaterThan(0);
    expect(completed.every((result) => Object.values(result.exactness).every(Boolean))).toBe(true);
  });

  test('small exhaustive cases match every comparable exact method', () => {
    const cases = CP2_PLUS_BENCHMARK_CORPUS.filter((input) => input.familyId === 'small-exhaustive');
    for (const input of cases) {
      const paths = Object.values(compareSmallExhaustiveMethods(input)).map((path) => path ?? []);
      expect(paths.every((path) => JSON.stringify(path) === JSON.stringify(paths[0]))).toBe(true);
    }
  });

  test('fragmented cases include safe genomic pruning', () => {
    const fragmented = runCP2PlusBenchmark().results.filter((result) => result.familyId === 'fragmented-genomic');
    expect(fragmented.some((result) => result.cp2Plus.genomicPropagationPrunes > 0)).toBe(true);
  });

  test('repairable future bridges are not falsely pruned', () => {
    const repairable = runCP2PlusBenchmark().results.filter(
      (result) => result.familyId === 'repairable-future-bridge'
    );
    expect(repairable.every((result) => result.cp2Plus.genomicPropagationPrunes === 0)).toBe(true);
    expect(repairable.every((result) => result.exactness.winnerMatch)).toBe(true);
  });

  test('dense cases make no false positive performance claim', () => {
    const report = runCP2PlusBenchmark();
    const dense = report.summary.perFamily.find((family) => family.familyId === 'dense-genomic');
    expect(dense).toBeDefined();
    expect(report.summary.conclusion).not.toMatch(/dense.*(?:faster|better)/i);
    expect(report.summary.conclusion).toContain('corpus-specific');
  });

  test('caps and cancellation preserve incomplete proof semantics', () => {
    const input = CP2_PLUS_BENCHMARK_CORPUS.find((item) => item.familyId === 'repairable-future-bridge')!;
    const capped = [
      solveCP2(input.vertices, input.edgesD, input.edgesG, { maxEvents: 1 }),
      solveCP2Plus(input.vertices, input.edgesD, input.edgesG, { maxEvents: 1 }),
    ];
    const cancelled = [
      solveCP2(input.vertices, input.edgesD, input.edgesG, { shouldCancel: () => true }),
      solveCP2Plus(input.vertices, input.edgesD, input.edgesG, { shouldCancel: () => true }),
    ];

    expect(capped.every((result) => result.status === 'incomplete')).toBe(true);
    expect(capped.every((result) => result.interruptedByCap && !result.proofCompleteEmitted)).toBe(true);
    expect(cancelled.every((result) => result.status === 'incomplete')).toBe(true);
    expect(cancelled.every((result) => result.cancelled && !result.proofCompleteEmitted)).toBe(true);
  });

  test('aggregate arithmetic is exact', () => {
    const result = (overrides: Partial<CP2PlusBenchmarkResult>): CP2PlusBenchmarkResult => ({
      familyId: 'dense-genomic',
      caseId: 'x',
      vertexCount: 1,
      arcCount: 0,
      genomicEdgeCount: 0,
      cp2: { path: ['A'], objective: 1, proofComplete: true, statesExplored: 10, eventsEmitted: 20, directedBoundPrunes: 2 },
      cp2Plus: { path: ['A'], objective: 1, proofComplete: true, statesExplored: 8, eventsEmitted: 18, directedBoundPrunes: 1, genomicPropagationChecks: 4, genomicPropagationPrunes: 2 },
      stateDelta: -2,
      eventDelta: -2,
      stateReductionPercent: 20,
      eventReductionPercent: 10,
      exactness: { objectiveMatch: true, winnerMatch: true, proofStatusMatch: true, validityMatch: true },
      ...overrides,
    });
    const summary = summarizeCP2PlusBenchmark([
      result({}),
      result({
        caseId: 'y',
        cp2: { path: ['A'], objective: 1, proofComplete: true, statesExplored: 5, eventsEmitted: 7, directedBoundPrunes: 1 },
        cp2Plus: { path: ['A'], objective: 1, proofComplete: true, statesExplored: 5, eventsEmitted: 9, directedBoundPrunes: 1, genomicPropagationChecks: 3, genomicPropagationPrunes: 0 },
        stateDelta: 0,
        eventDelta: 2,
      }),
    ]);

    expect(summary.totalCaseCount).toBe(2);
    expect(summary.reducedStateCases).toBe(1);
    expect(summary.equalStateCases).toBe(1);
    expect(summary.cp2.statesExplored).toBe(15);
    expect(summary.cp2Plus.eventsEmitted).toBe(27);
    expect(summary.totalGenomicPropagationPrunes).toBe(2);
  });

  test('generated conclusions exclude forbidden claims', () => {
    const conclusion = generateBenchmarkConclusion(runCP2PlusBenchmark().summary);
    expect(conclusion.toLowerCase()).not.toContain('always faster');
    expect(conclusion.toLowerCase()).not.toContain('universally better');
    expect(conclusion.toLowerCase()).not.toContain('new research method');
    expect(conclusion.toLowerCase()).not.toContain('paper reproduction');
  });
});
