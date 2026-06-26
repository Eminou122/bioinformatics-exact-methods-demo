import { describe, expect, test } from 'vitest';
import { getArcId } from './graph';
import { solveCP1 } from './cpSolver';
import { solveCP2 } from './cp2Solver';
import { solveAlgoBBPlusPlus } from './algoBBPlusPlus';
import { solveConsistentPath } from './pathAlgorithms';
import { solveILP1 } from './ilp1Solver';
import { deriveILP2Candidate, solveILP2, validateILP2Assignment, type ILP2DecisionData } from './ilp2Solver';

type EdgeD = { from: string; to: string };
type EdgeG = { u: string; v: string };
type CaseDef = { vertices: string[]; edgesD: EdgeD[]; edgesG: EdgeG[] };
type DifferentialPartition = { name: string; cases: CaseDef[] };

function parentId(parent: string, child: string): string {
  return `${parent}->${child}`;
}

function makeRng(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

function randomCase(n: number, seed: number): CaseDef {
  const rnd = makeRng(seed);
  const vertices = Array.from({ length: n }, (_, i) => `R${i + 1}`);
  const edgesD: EdgeD[] = [];
  const edgesG: EdgeG[] = [];
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      if (rnd() < 0.42) edgesD.push({ from: vertices[i], to: vertices[j] });
      if (rnd() < 0.38) edgesG.push({ u: vertices[i], v: vertices[j] });
    }
  }
  return { vertices, edgesD, edgesG };
}

function pairedDagCasesThrough4Vertices(): CaseDef[] {
  const vertices = ['A', 'B', 'C', 'D'];
  const possibleD: EdgeD[] = [];
  const possibleG: EdgeG[] = [];
  for (let i = 0; i < vertices.length; i++) {
    for (let j = i + 1; j < vertices.length; j++) {
      possibleD.push({ from: vertices[i], to: vertices[j] });
      possibleG.push({ u: vertices[i], v: vertices[j] });
    }
  }

  const cases: CaseDef[] = [];
  for (let dMask = 0; dMask < (1 << possibleD.length); dMask++) {
    const edgesD = possibleD.filter((_, idx) => (dMask & (1 << idx)) !== 0);
    for (let gMask = 0; gMask < (1 << possibleG.length); gMask++) {
      cases.push({
        vertices,
        edgesD,
        edgesG: possibleG.filter((_, idx) => (gMask & (1 << idx)) !== 0),
      });
    }
  }
  return cases;
}

const deterministicCorpus: CaseDef[] = [
  ...pairedDagCasesThrough4Vertices(),
  ...Array.from({ length: 750 }, (_, i) => randomCase(5, 8000 + i)),
  ...Array.from({ length: 750 }, (_, i) => randomCase(6, 9000 + i)),
  ...Array.from({ length: 750 }, (_, i) => randomCase(7, 10000 + i)),
  { vertices: ['A', 'B', 'C'], edgesD: [{ from: 'A', to: 'B' }, { from: 'B', to: 'C' }], edgesG: [] },
  { vertices: ['A', 'B', 'C'], edgesD: [{ from: 'A', to: 'B' }, { from: 'A', to: 'C' }], edgesG: [{ u: 'A', v: 'B' }, { u: 'A', v: 'C' }] },
  { vertices: ['A', 'B', 'C', 'D'], edgesD: [{ from: 'A', to: 'B' }, { from: 'A', to: 'C' }, { from: 'B', to: 'D' }, { from: 'C', to: 'D' }], edgesG: [{ u: 'A', v: 'B' }, { u: 'B', v: 'D' }, { u: 'A', v: 'C' }, { u: 'C', v: 'D' }] },
];

const differentialPartitions: DifferentialPartition[] = Array.from({ length: 8 }, (_, partitionIndex) => ({
  name: `partition ${partitionIndex + 1}`,
  cases: deterministicCorpus.filter((_, caseIndex) => caseIndex % 8 === partitionIndex),
}));

function emptyDecisions(vertices: string[], edgesD: EdgeD[], edgesG: EdgeG[]): ILP2DecisionData {
  const x: Record<string, 0 | 1> = {};
  const y: Record<string, 0 | 1> = {};
  const r: Record<string, 0 | 1> = {};
  const p: Record<string, 0 | 1> = {};
  const level: Record<string, number | null> = {};
  for (const vertex of vertices) {
    x[vertex] = 0;
    r[vertex] = 0;
    level[vertex] = null;
  }
  for (const edge of edgesD) y[getArcId(edge.from, edge.to)] = 0;
  for (const edge of edgesG) {
    p[parentId(edge.u, edge.v)] = 0;
    p[parentId(edge.v, edge.u)] = 0;
  }
  return { x, y, r, p, level };
}

function expectMatchesAll(input: CaseDef) {
  const ilp2 = solveILP2(input.vertices, input.edgesD, input.edgesG, { maxEvents: 200000 });
  const ilp1 = solveILP1(input.vertices, input.edgesD, input.edgesG, { maxEvents: 200000 });
  const legacy = solveConsistentPath(input.vertices, input.edgesD, input.edgesG);
  const cp1 = solveCP1(input.vertices, input.edgesD, input.edgesG, 200000);
  const cp2 = solveCP2(input.vertices, input.edgesD, input.edgesG, { maxEvents: 200000 });
  const bb = solveAlgoBBPlusPlus(input.vertices, input.edgesD, input.edgesG, { maxEvents: 200000 });

  expect(ilp2.status).not.toBe('error');
  expect(ilp2.status).not.toBe('incomplete');
  expect(ilp1.status).not.toBe('incomplete');
  expect(legacy.error).toBeUndefined();
  expect(cp1.status).not.toBe('incomplete');
  expect(cp2.status).not.toBe('incomplete');
  expect(bb.status).not.toBe('incomplete');

  const ilpPath = ilp2.bestPath || [];
  expect(ilpPath).toEqual(legacy.longestConsistentPath || []);
  expect(ilpPath).toEqual(cp1.bestPath || []);
  expect(ilpPath).toEqual(cp2.bestPath || []);
  expect(ilpPath).toEqual(bb.bestPath || []);
  expect(ilpPath).toEqual(ilp1.bestPath || []);
}

describe('ILP2 educational rooted-level formulation solver', () => {
  test('malformed graph validation', () => {
    const result = solveILP2(['R1'], [{ from: 'R1', to: 'R2' }], []);
    expect(result.status).toBe('error');
    expect(result.error?.code).toBe('INVALID_NODE_D');
    expect(result.trace[0]?.type).toBe('validation-error');
  });

  test('cycle rejection', () => {
    const result = solveILP2(['R1', 'R2'], [{ from: 'R1', to: 'R2' }, { from: 'R2', to: 'R1' }], [{ u: 'R1', v: 'R2' }]);
    expect(result.status).toBe('error');
    expect(result.error?.code).toBe('CYCLE_DETECTED');
  });

  test('singleton path root handling', () => {
    const result = solveILP2(['A', 'B'], [{ from: 'A', to: 'B' }], []);
    expect(result.status).toBe('optimal');
    expect(result.bestPath).toEqual(['A']);
    expect(result.bestCandidate?.root).toBe('A');
    expect(result.bestCandidate?.levels).toEqual({ A: 0 });
    expect(result.bestCandidate?.parentLinks).toEqual([]);
  });

  test('simple valid path', () => {
    expectMatchesAll({
      vertices: ['A', 'B', 'C'],
      edgesD: [{ from: 'A', to: 'B' }, { from: 'B', to: 'C' }],
      edgesG: [{ u: 'A', v: 'B' }, { u: 'B', v: 'C' }],
    });
  });

  test('longest D path rejected because G is disconnected', () => {
    const input = {
      vertices: ['A', 'B', 'C', 'D'],
      edgesD: [{ from: 'A', to: 'B' }, { from: 'B', to: 'C' }, { from: 'C', to: 'D' }],
      edgesG: [{ u: 'A', v: 'B' }, { u: 'B', v: 'C' }],
    };
    const result = solveILP2(input.vertices, input.edgesD, input.edgesG);
    expect(result.bestPath).toEqual(['A', 'B', 'C']);
    // disconnected path now caught by early induced-G check before witness construction
    const earlyReject = result.trace.find((e) => e.reason === 'induced-G-disconnected');
    expect(earlyReject).toBeDefined();
    expect(earlyReject?.type).toBe('constraint-rejection');
    expect(earlyReject?.root).toBeNull();
    expect(earlyReject?.decisions).toBeNull();
    expect(earlyReject?.parentLinks).toHaveLength(0);
    expect(earlyReject?.levels).toEqual({});
    // counter invariants
    expect(result.counters.enumeratedCandidates).toBe(10);
    expect(result.counters.rejectedDisconnectedGenomicCandidates).toBe(3);
    expect(result.counters.candidateEvaluationEvents).toBe(10);
    expect(result.counters.enumeratedCandidates).toBe(result.exploredCandidates);
    expect(result.counters.rejectedDisconnectedGenomicCandidates).toBeGreaterThan(0);
    expect(result.counters.rejectedDisconnectedGenomicCandidates + result.counters.rejectedWitnessCandidates).toBe(result.rejectedCandidates);
    expect(result.counters.acceptedFeasibleCandidates + result.rejectedCandidates).toBe(result.exploredCandidates);
    expectMatchesAll(input);
  });

  test('counters track accepted and witness aggregates for connected feasible paths', () => {
    const result = solveILP2(
      ['A', 'B', 'C'],
      [{ from: 'A', to: 'B' }, { from: 'B', to: 'C' }],
      [{ u: 'A', v: 'B' }, { u: 'B', v: 'C' }],
      { maxEvents: 200000 }
    );
    expect(result.status).toBe('optimal');
    expect(result.counters.rejectedDisconnectedGenomicCandidates).toBe(0);
    expect(result.counters.acceptedFeasibleCandidates).toBeGreaterThan(0);
    expect(result.counters.witnessLevelsAssigned).toBeGreaterThan(0);
    // invariants
    expect(result.counters.enumeratedCandidates).toBe(result.exploredCandidates);
    expect(result.counters.candidateEvaluationEvents).toBe(result.counters.enumeratedCandidates);
    expect(result.counters.rejectedDisconnectedGenomicCandidates + result.counters.rejectedWitnessCandidates).toBe(result.rejectedCandidates);
    expect(result.counters.acceptedFeasibleCandidates + result.rejectedCandidates).toBe(result.exploredCandidates);
  });

  test('complete-run counter invariants hold on a mixed-connectivity graph', () => {
    const result = solveILP2(
      ['A', 'B', 'C', 'D'],
      [{ from: 'A', to: 'B' }, { from: 'B', to: 'C' }, { from: 'C', to: 'D' }],
      [{ u: 'A', v: 'B' }, { u: 'B', v: 'C' }],
      { maxEvents: 200000 }
    );
    expect(result.proofCompleteEmitted).toBe(true);
    expect(result.counters.enumeratedCandidates).toBe(result.exploredCandidates);
    expect(result.counters.candidateEvaluationEvents).toBe(result.counters.enumeratedCandidates);
    expect(result.counters.rejectedDisconnectedGenomicCandidates + result.counters.rejectedWitnessCandidates).toBe(result.rejectedCandidates);
    expect(result.counters.acceptedFeasibleCandidates + result.rejectedCandidates).toBe(result.exploredCandidates);
    expect(result.counters.rejectedDisconnectedGenomicCandidates).toBeGreaterThan(0);
    expect(result.counters.rejectedWitnessCandidates).toBe(0);
  });

  test('root is selected and exactly one root is used', () => {
    const candidate = deriveILP2Candidate(['A', 'B'], ['A', 'B'], [{ from: 'A', to: 'B' }], [{ u: 'A', v: 'B' }]);
    expect(candidate.report.feasible).toBe(true);
    expect(candidate.root).toBe('A');
    expect(Object.values(candidate.decisions.r).filter((value) => value === 1)).toHaveLength(1);
    expect(candidate.decisions.x[candidate.root || '']).toBe(1);
  });

  test('selected non-root vertex has exactly one parent and root has no parent', () => {
    const candidate = deriveILP2Candidate(['A', 'B', 'C'], ['A', 'B', 'C'], [{ from: 'A', to: 'B' }, { from: 'B', to: 'C' }], [{ u: 'A', v: 'B' }, { u: 'B', v: 'C' }]);
    expect(candidate.report.feasible).toBe(true);
    expect(candidate.parentLinks).toHaveLength(2);
    expect(candidate.parentLinks.some((link) => link.child === candidate.root)).toBe(false);
    for (const vertex of ['B', 'C']) {
      expect(candidate.parentLinks.filter((link) => link.child === vertex)).toHaveLength(1);
    }
  });

  test('parent edge must exist in G and endpoints must be selected', () => {
    const vertices = ['A', 'B', 'C'];
    const edgesD = [{ from: 'A', to: 'B' }];
    const edgesG = [{ u: 'A', v: 'C' }];
    const decisions = emptyDecisions(vertices, edgesD, edgesG);
    decisions.x = { A: 1, B: 1, C: 0 };
    decisions.y[getArcId('A', 'B')] = 1;
    decisions.r.A = 1;
    decisions.level.A = 0;
    decisions.level.B = 1;
    decisions.p[parentId('A', 'C')] = 1;
    const report = validateILP2Assignment(vertices, edgesD, edgesG, decisions);
    expect(report.feasible).toBe(false);
    expect(report.reasons).toContain('parent-child-endpoints-must-be-selected');
  });

  test('levels strictly increase through selected parent links', () => {
    const vertices = ['A', 'B'];
    const edgesD = [{ from: 'A', to: 'B' }];
    const edgesG = [{ u: 'A', v: 'B' }];
    const decisions = emptyDecisions(vertices, edgesD, edgesG);
    decisions.x = { A: 1, B: 1 };
    decisions.y[getArcId('A', 'B')] = 1;
    decisions.r.A = 1;
    decisions.level.A = 0;
    decisions.level.B = 0;
    decisions.p[parentId('A', 'B')] = 1;
    const report = validateILP2Assignment(vertices, edgesD, edgesG, decisions);
    expect(report.feasible).toBe(false);
    expect(report.reasons).toContain('levels-must-strictly-increase-from-parent-to-child');
  });

  test('cycles in parent relations are rejected', () => {
    const vertices = ['A', 'B', 'C'];
    const edgesD = [{ from: 'A', to: 'B' }, { from: 'B', to: 'C' }];
    const edgesG = [{ u: 'A', v: 'B' }, { u: 'B', v: 'C' }, { u: 'A', v: 'C' }];
    const decisions = emptyDecisions(vertices, edgesD, edgesG);
    decisions.x = { A: 1, B: 1, C: 1 };
    decisions.y[getArcId('A', 'B')] = 1;
    decisions.y[getArcId('B', 'C')] = 1;
    decisions.r.A = 1;
    decisions.level.A = 0;
    decisions.level.B = 1;
    decisions.level.C = 2;
    decisions.p[parentId('A', 'B')] = 1;
    decisions.p[parentId('B', 'C')] = 1;
    decisions.p[parentId('C', 'A')] = 1;
    const report = validateILP2Assignment(vertices, edgesD, edgesG, decisions);
    expect(report.feasible).toBe(false);
    expect(report.reasons).toContain('root-has-selected-parent');
    expect(report.reasons).toContain('levels-must-strictly-increase-from-parent-to-child');
  });

  test('no unselected intermediary is accepted', () => {
    const vertices = ['A', 'B', 'C'];
    const edgesD = [{ from: 'A', to: 'C' }];
    const edgesG = [{ u: 'A', v: 'B' }, { u: 'B', v: 'C' }];
    const decisions = emptyDecisions(vertices, edgesD, edgesG);
    decisions.x = { A: 1, B: 0, C: 1 };
    decisions.y[getArcId('A', 'C')] = 1;
    decisions.r.A = 1;
    decisions.level.A = 0;
    decisions.level.C = 2;
    decisions.level.B = 1;
    decisions.p[parentId('A', 'B')] = 1;
    decisions.p[parentId('B', 'C')] = 1;
    const report = validateILP2Assignment(vertices, edgesD, edgesG, decisions);
    expect(report.feasible).toBe(false);
    expect(report.reasons).toContain('parent-child-endpoints-must-be-selected');
    expect(report.reasons).toContain('unselected-vertex-cannot-have-level');
  });

  test('deterministic root and tie-breaking', () => {
    const input = {
      vertices: ['A', 'B', 'C'],
      edgesD: [{ from: 'A', to: 'B' }, { from: 'A', to: 'C' }],
      edgesG: [{ u: 'A', v: 'B' }, { u: 'A', v: 'C' }],
    };
    const result = solveILP2(input.vertices, input.edgesD, input.edgesG);
    expect(result.bestPath).toEqual(['A', 'B']);
    expect(result.bestCandidate?.root).toBe('A');
    expectMatchesAll(input);
  });

  test('proof-complete, cap-boundary, and cancellation behavior', () => {
    const full = solveILP2(['A', 'B'], [{ from: 'A', to: 'B' }], [{ u: 'A', v: 'B' }], { maxEvents: 1000 });
    expect(full.status).toBe('optimal');
    expect(full.searchCompleted).toBe(true);
    expect(full.proofCompleteEmitted).toBe(true);
    expect(full.cancelled).toBe(false);
    expect(full.interruptedByCap).toBe(false);

    const capped = solveILP2(['A', 'B'], [{ from: 'A', to: 'B' }], [{ u: 'A', v: 'B' }], { maxEvents: full.trace.length - 1 });
    expect(capped.status).toBe('incomplete');
    expect(capped.proofCompleteEmitted).toBe(false);
    expect(capped.interruptedByCap).toBe(true);

    const cappedBeforeCandidateEvent = solveILP2(['A', 'B'], [{ from: 'A', to: 'B' }], [{ u: 'A', v: 'B' }], { maxEvents: 6 });
    expect(cappedBeforeCandidateEvent.status).toBe('incomplete');
    expect(cappedBeforeCandidateEvent.counters.enumeratedCandidates).toBe(1);
    expect(cappedBeforeCandidateEvent.counters.candidateEvaluationEvents).toBe(0);

    const cancelled = solveILP2(['A', 'B'], [{ from: 'A', to: 'B' }], [{ u: 'A', v: 'B' }], { shouldCancel: () => true });
    expect(cancelled.status).toBe('incomplete');
    expect(cancelled.cancelled).toBe(true);
    expect(cancelled.proofCompleteEmitted).toBe(false);
  });

  test('malformed graph boundary set', () => {
    const malformed = [
      solveILP2(['A'], [{ from: 'A', to: 'B' }], []),
      solveILP2(['A'], [], [{ u: 'A', v: 'B' }]),
      solveILP2(['A', 'B'], [{ from: 'A', to: 'B' }, { from: 'A', to: 'B' }], []),
      solveILP2(['A', 'B'], [], [{ u: 'A', v: 'B' }, { u: 'B', v: 'A' }]),
      solveILP2(['A', 'B'], [{ from: 'A', to: 'B' }, { from: 'B', to: 'A' }], [{ u: 'A', v: 'B' }]),
    ];

    expect(malformed).toHaveLength(5);
    expect(malformed.every((result) => result.status === 'error')).toBe(true);
  });

  test('deterministic differential corpus size', () => {
    expect(deterministicCorpus.length).toBe(6349);
    expect(differentialPartitions.reduce((total, partition) => total + partition.cases.length, 0)).toBe(6349);
  });

  test.each(differentialPartitions)('deterministic corpus $name matches Legacy, CP1, CP2, AlgoBB++, and ILP1', ({ cases }) => {
    let objectiveMismatches = 0;
    let winnerMismatches = 0;
    let validityMismatches = 0;
    let uncappedIncompleteRuns = 0;

    for (const input of cases) {
      const ilp2 = solveILP2(input.vertices, input.edgesD, input.edgesG, { maxEvents: 200000 });
      const ilp1 = solveILP1(input.vertices, input.edgesD, input.edgesG, { maxEvents: 200000 });
      const legacy = solveConsistentPath(input.vertices, input.edgesD, input.edgesG);
      const cp1 = solveCP1(input.vertices, input.edgesD, input.edgesG, 200000);
      const cp2 = solveCP2(input.vertices, input.edgesD, input.edgesG, { maxEvents: 200000 });
      const bb = solveAlgoBBPlusPlus(input.vertices, input.edgesD, input.edgesG, { maxEvents: 200000 });

      if ([ilp2.status, ilp1.status, cp1.status, cp2.status, bb.status].includes('incomplete')) uncappedIncompleteRuns++;
      if (ilp2.status === 'error' || ilp1.status === 'error' || cp1.status === 'error' || cp2.status === 'error' || bb.status === 'error' || legacy.error) validityMismatches++;

      const ilpPath = ilp2.bestPath || [];
      const expectedPaths = [legacy.longestConsistentPath || [], cp1.bestPath || [], cp2.bestPath || [], bb.bestPath || [], ilp1.bestPath || []];
      if (expectedPaths.some((path) => path.length !== ilpPath.length)) objectiveMismatches++;
      if (expectedPaths.some((path) => path.join('\u0001') !== ilpPath.join('\u0001'))) winnerMismatches++;
    }

    expect(objectiveMismatches).toBe(0);
    expect(winnerMismatches).toBe(0);
    expect(validityMismatches).toBe(0);
    expect(uncappedIncompleteRuns).toBe(0);
  });
});
