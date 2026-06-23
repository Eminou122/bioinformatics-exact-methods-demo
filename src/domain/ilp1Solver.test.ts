import { describe, expect, test } from 'vitest';
import { getArcId, getEdgeId } from './graph';
import { solveCP1 } from './cpSolver';
import { solveCP2 } from './cp2Solver';
import { solveAlgoBBPlusPlus } from './algoBBPlusPlus';
import { solveConsistentPath } from './pathAlgorithms';
import { deriveILP1Candidate, solveILP1, validateILP1Assignment, type ILP1DecisionData } from './ilp1Solver';

type EdgeD = { from: string; to: string };
type EdgeG = { u: string; v: string };
type CaseDef = { vertices: string[]; edgesD: EdgeD[]; edgesG: EdgeG[] };
type DifferentialPartition = { name: string; cases: CaseDef[] };

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

function emptyDecisions(vertices: string[], edgesD: EdgeD[], edgesG: EdgeG[]): ILP1DecisionData {
  const x: Record<string, 0 | 1> = {};
  const y: Record<string, 0 | 1> = {};
  const z: Record<string, 0 | 1> = {};
  for (const vertex of vertices) x[vertex] = 0;
  for (const edge of edgesD) y[getArcId(edge.from, edge.to)] = 0;
  for (const edge of edgesG) z[getEdgeId(edge.u, edge.v)] = 0;
  return { x, y, z };
}

function expectMatchesAll(input: CaseDef) {
  const ilp1 = solveILP1(input.vertices, input.edgesD, input.edgesG, { maxEvents: 200000 });
  const legacy = solveConsistentPath(input.vertices, input.edgesD, input.edgesG);
  const cp1 = solveCP1(input.vertices, input.edgesD, input.edgesG, 200000);
  const cp2 = solveCP2(input.vertices, input.edgesD, input.edgesG, { maxEvents: 200000 });
  const bb = solveAlgoBBPlusPlus(input.vertices, input.edgesD, input.edgesG, { maxEvents: 200000 });

  expect(ilp1.status).not.toBe('error');
  expect(ilp1.status).not.toBe('incomplete');
  expect(legacy.error).toBeUndefined();
  expect(cp1.status).not.toBe('error');
  expect(cp1.status).not.toBe('incomplete');
  expect(cp2.status).not.toBe('error');
  expect(cp2.status).not.toBe('incomplete');
  expect(bb.status).not.toBe('error');
  expect(bb.status).not.toBe('incomplete');

  const ilpPath = ilp1.bestPath || [];
  expect(ilpPath).toEqual(legacy.longestConsistentPath || []);
  expect(ilpPath).toEqual(cp1.bestPath || []);
  expect(ilpPath).toEqual(cp2.bestPath || []);
  expect(ilpPath).toEqual(bb.bestPath || []);
}

describe('ILP1 educational bounded formulation solver', () => {
  test('malformed graph validation', () => {
    const result = solveILP1(['R1'], [{ from: 'R1', to: 'R2' }], []);
    expect(result.status).toBe('error');
    expect(result.error?.code).toBe('INVALID_NODE_D');
    expect(result.trace[0]?.type).toBe('validation-error');
  });

  test('cycle rejection', () => {
    const result = solveILP1(['R1', 'R2'], [{ from: 'R1', to: 'R2' }, { from: 'R2', to: 'R1' }], [{ u: 'R1', v: 'R2' }]);
    expect(result.status).toBe('error');
    expect(result.error?.code).toBe('CYCLE_DETECTED');
  });

  test('singleton solution', () => {
    const result = solveILP1(['A', 'B'], [{ from: 'A', to: 'B' }], []);
    expect(result.status).toBe('optimal');
    expect(result.bestPath).toEqual(['A']);
    expect(result.bestCandidate?.witnessEdges).toEqual([]);
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
    const result = solveILP1(input.vertices, input.edgesD, input.edgesG);
    expect(result.bestPath).toEqual(['A', 'B', 'C']);
    expect(result.trace.some((event) => event.type === 'constraint-rejection' && event.reason?.includes('selected-vertices-not-connected-by-genomic-witness'))).toBe(true);
    expectMatchesAll(input);
  });

  test('branch and merge graphs', () => {
    expectMatchesAll({
      vertices: ['A', 'B', 'C', 'D'],
      edgesD: [{ from: 'A', to: 'B' }, { from: 'A', to: 'C' }, { from: 'B', to: 'D' }, { from: 'C', to: 'D' }],
      edgesG: [{ u: 'A', v: 'B' }, { u: 'B', v: 'D' }, { u: 'A', v: 'C' }, { u: 'C', v: 'D' }],
    });
  });

  test('x/y/z assignment consistency', () => {
    const vertices = ['A', 'B', 'C'];
    const edgesD = [{ from: 'A', to: 'B' }, { from: 'B', to: 'C' }];
    const edgesG = [{ u: 'A', v: 'B' }, { u: 'B', v: 'C' }];
    const candidate = deriveILP1Candidate(['A', 'B', 'C'], vertices, edgesD, edgesG);
    expect(candidate.report.feasible).toBe(true);
    expect(candidate.decisions.x).toMatchObject({ A: 1, B: 1, C: 1 });
    expect(candidate.decisions.y[getArcId('A', 'B')]).toBe(1);
    expect(candidate.decisions.y[getArcId('B', 'C')]).toBe(1);
    expect(Object.values(candidate.decisions.z).filter((value) => value === 1)).toHaveLength(2);
  });

  test('D path constraints reject forks', () => {
    const vertices = ['A', 'B', 'C'];
    const edgesD = [{ from: 'A', to: 'B' }, { from: 'A', to: 'C' }];
    const edgesG = [{ u: 'A', v: 'B' }, { u: 'A', v: 'C' }];
    const decisions = emptyDecisions(vertices, edgesD, edgesG);
    decisions.x = { A: 1, B: 1, C: 1 };
    decisions.y[getArcId('A', 'B')] = 1;
    decisions.y[getArcId('A', 'C')] = 1;
    decisions.z[getEdgeId('A', 'B')] = 1;
    decisions.z[getEdgeId('A', 'C')] = 1;
    const report = validateILP1Assignment(vertices, edgesD, edgesG, decisions);
    expect(report.feasible).toBe(false);
    expect(report.reasons).toContain('selected-vertex-has-multiple-successors');
  });

  test('D path constraints reject disconnected selected fragments', () => {
    const vertices = ['A', 'B', 'C', 'D'];
    const edgesD = [{ from: 'A', to: 'B' }, { from: 'C', to: 'D' }];
    const edgesG = [{ u: 'A', v: 'B' }, { u: 'B', v: 'C' }, { u: 'C', v: 'D' }];
    const decisions = emptyDecisions(vertices, edgesD, edgesG);
    decisions.x = { A: 1, B: 1, C: 1, D: 1 };
    decisions.y[getArcId('A', 'B')] = 1;
    decisions.y[getArcId('C', 'D')] = 1;
    decisions.z[getEdgeId('A', 'B')] = 1;
    decisions.z[getEdgeId('B', 'C')] = 1;
    decisions.z[getEdgeId('C', 'D')] = 1;
    const report = validateILP1Assignment(vertices, edgesD, edgesG, decisions);
    expect(report.feasible).toBe(false);
    expect(report.reasons).toContain('selected-arcs-do-not-form-one-directed-path');
  });

  test('G witness rejects unselected intermediate vertices', () => {
    const vertices = ['A', 'B', 'C'];
    const edgesD = [{ from: 'A', to: 'C' }];
    const edgesG = [{ u: 'A', v: 'B' }, { u: 'B', v: 'C' }];
    const decisions = emptyDecisions(vertices, edgesD, edgesG);
    decisions.x = { A: 1, B: 0, C: 1 };
    decisions.y[getArcId('A', 'C')] = 1;
    decisions.z[getEdgeId('A', 'B')] = 1;
    const report = validateILP1Assignment(vertices, edgesD, edgesG, decisions);
    expect(report.feasible).toBe(false);
    expect(report.reasons).toContain('genomic-witness-uses-unselected-vertex');
  });

  test('G tree witness contains exactly k minus 1 edges for k selected vertices', () => {
    const vertices = ['A', 'B', 'C'];
    const edgesD = [{ from: 'A', to: 'B' }, { from: 'B', to: 'C' }];
    const edgesG = [{ u: 'A', v: 'B' }, { u: 'B', v: 'C' }, { u: 'A', v: 'C' }];
    const candidate = deriveILP1Candidate(['A', 'B', 'C'], vertices, edgesD, edgesG);
    expect(candidate.report.feasible).toBe(true);
    expect(candidate.witnessEdges).toHaveLength(2);
  });

  test('deterministic lexical tie-breaking', () => {
    const input = {
      vertices: ['A', 'B', 'C'],
      edgesD: [{ from: 'A', to: 'B' }, { from: 'A', to: 'C' }],
      edgesG: [{ u: 'A', v: 'B' }, { u: 'A', v: 'C' }],
    };
    const result = solveILP1(input.vertices, input.edgesD, input.edgesG);
    expect(result.bestPath).toEqual(['A', 'B']);
    expectMatchesAll(input);
  });

  test('proof-complete behavior', () => {
    const result = solveILP1(['A'], [], []);
    expect(result.status).toBe('optimal');
    expect(result.searchCompleted).toBe(true);
    expect(result.proofCompleteEmitted).toBe(true);
    expect(result.cancelled).toBe(false);
    expect(result.interruptedByCap).toBe(false);
    expect(result.trace.at(-1)?.type).toBe('proof-complete');
  });

  test('event-cap boundaries', () => {
    const input = {
      vertices: ['A', 'B', 'C'],
      edgesD: [{ from: 'A', to: 'B' }, { from: 'B', to: 'C' }],
      edgesG: [{ u: 'A', v: 'B' }, { u: 'B', v: 'C' }],
    };
    const full = solveILP1(input.vertices, input.edgesD, input.edgesG, { maxEvents: 1000 });
    const fullTraceLength = full.trace.length;
    expect(full.status).toBe('optimal');

    for (const cap of [0, 1, fullTraceLength - 1]) {
      const capped = solveILP1(input.vertices, input.edgesD, input.edgesG, { maxEvents: cap });
      expect(capped.status).toBe('incomplete');
      expect(capped.proofCompleteEmitted).toBe(false);
    }

    expect(solveILP1(input.vertices, input.edgesD, input.edgesG, { maxEvents: fullTraceLength }).status).toBe('optimal');
    expect(solveILP1(input.vertices, input.edgesD, input.edgesG, { maxEvents: fullTraceLength + 5 }).status).toBe('optimal');
  });

  test('cancellation', () => {
    const result = solveILP1(['A', 'B'], [{ from: 'A', to: 'B' }], [{ u: 'A', v: 'B' }], {
      shouldCancel: () => true,
    });
    expect(result.status).toBe('incomplete');
    expect(result.cancelled).toBe(true);
    expect(result.proofCompleteEmitted).toBe(false);
    expect(result.trace.some((event) => event.type === 'cancelled')).toBe(true);
  });

  test('vertex IDs END and UNSELECTED', () => {
    expectMatchesAll({
      vertices: ['END', 'UNSELECTED', 'NORMAL'],
      edgesD: [{ from: 'UNSELECTED', to: 'END' }, { from: 'END', to: 'NORMAL' }],
      edgesG: [{ u: 'UNSELECTED', v: 'END' }, { u: 'END', v: 'NORMAL' }, { u: 'UNSELECTED', v: 'NORMAL' }],
    });
  });

  test('deterministic differential corpus size', () => {
    expect(deterministicCorpus.length).toBe(6349);
    expect(differentialPartitions.reduce((total, partition) => total + partition.cases.length, 0)).toBe(6349);
  });

  test.each(differentialPartitions)('deterministic corpus $name matches Legacy, CP1, CP2, and AlgoBB++', ({ cases }) => {
    let objectiveMismatches = 0;
    let winnerMismatches = 0;
    let validityMismatches = 0;
    let uncappedIncompleteRuns = 0;

    for (const input of cases) {
      const ilp1 = solveILP1(input.vertices, input.edgesD, input.edgesG, { maxEvents: 200000 });
      const legacy = solveConsistentPath(input.vertices, input.edgesD, input.edgesG);
      const cp1 = solveCP1(input.vertices, input.edgesD, input.edgesG, 200000);
      const cp2 = solveCP2(input.vertices, input.edgesD, input.edgesG, { maxEvents: 200000 });
      const bb = solveAlgoBBPlusPlus(input.vertices, input.edgesD, input.edgesG, { maxEvents: 200000 });

      if ([ilp1.status, cp1.status, cp2.status, bb.status].includes('incomplete')) uncappedIncompleteRuns++;
      if (ilp1.status === 'error' || cp1.status === 'error' || cp2.status === 'error' || bb.status === 'error' || legacy.error) validityMismatches++;

      const ilpPath = ilp1.bestPath || [];
      const expectedPaths = [legacy.longestConsistentPath || [], cp1.bestPath || [], cp2.bestPath || [], bb.bestPath || []];
      if (expectedPaths.some((path) => path.length !== ilpPath.length)) objectiveMismatches++;
      if (expectedPaths.some((path) => path.join('\u0001') !== ilpPath.join('\u0001'))) winnerMismatches++;
    }

    expect(objectiveMismatches).toBe(0);
    expect(winnerMismatches).toBe(0);
    expect(validityMismatches).toBe(0);
    expect(uncappedIncompleteRuns).toBe(0);
  });

  test('malformed graph boundary set', () => {
    const malformed = [
      solveILP1(['A'], [{ from: 'A', to: 'B' }], []),
      solveILP1(['A'], [], [{ u: 'A', v: 'B' }]),
      solveILP1(['A', 'B'], [{ from: 'A', to: 'B' }, { from: 'A', to: 'B' }], []),
      solveILP1(['A', 'B'], [], [{ u: 'A', v: 'B' }, { u: 'B', v: 'A' }]),
      solveILP1(['A', 'B'], [{ from: 'A', to: 'B' }, { from: 'B', to: 'A' }], [{ u: 'A', v: 'B' }]),
    ];

    expect(malformed).toHaveLength(5);
    expect(malformed.every((result) => result.status === 'error')).toBe(true);
  });
});
