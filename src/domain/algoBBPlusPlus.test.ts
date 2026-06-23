import { describe, expect, test } from 'vitest';
import { solveAlgoBBPlusPlus } from './algoBBPlusPlus';
import { solveConsistentPath } from './pathAlgorithms';

const ids = (n: number) => Array.from({ length: n }, (_, i) => `R${i + 1}`);

function allOrderedDagEdges(vertices: string[]) {
  const edges: { from: string; to: string }[] = [];
  for (let i = 0; i < vertices.length; i++) {
    for (let j = i + 1; j < vertices.length; j++) {
      edges.push({ from: vertices[i], to: vertices[j] });
    }
  }
  return edges;
}

function edgeSubsets<T>(items: T[]): T[][] {
  const subsets: T[][] = [];
  for (let mask = 0; mask < 1 << items.length; mask++) {
    const subset: T[] = [];
    for (let bit = 0; bit < items.length; bit++) {
      if ((mask & (1 << bit)) !== 0) subset.push(items[bit]);
    }
    subsets.push(subset);
  }
  return subsets;
}

function undirectedPairs(vertices: string[]) {
  const pairs: { u: string; v: string }[] = [];
  for (let i = 0; i < vertices.length; i++) {
    for (let j = i + 1; j < vertices.length; j++) {
      pairs.push({ u: vertices[i], v: vertices[j] });
    }
  }
  return pairs;
}

function deterministicGraph(n: number, salt: number) {
  const vertices = ids(n);
  const edgesD: { from: string; to: string }[] = [];
  const edgesG: { u: string; v: string }[] = [];
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      if (((i + 1) * 17 + (j + 1) * 31 + salt) % 5 < 3) {
        edgesD.push({ from: vertices[i], to: vertices[j] });
      }
      if (((i + 1) * 19 + (j + 1) * 23 + salt) % 7 < 4) {
        edgesG.push({ u: vertices[i], v: vertices[j] });
      }
    }
  }
  return { vertices, edgesD, edgesG };
}

interface DifferentialMetrics {
  corpusSize: number;
  objectiveMismatches: number;
  winnerMismatches: number;
  validityMismatches: number;
  uncappedIncompleteRuns: number;
}

function expectMatchesLegacy(
  vertices: string[],
  edgesD: { from: string; to: string }[],
  edgesG: { u: string; v: string }[]
) {
  const bb = solveAlgoBBPlusPlus(vertices, edgesD, edgesG, { maxEvents: 1000000 });
  const legacy = solveConsistentPath(vertices, edgesD, edgesG);
  expect(bb.status).not.toBe('incomplete');
  expect(bb.error).toEqual(legacy.error);
  expect(bb.bestPath ?? null).toEqual(legacy.longestConsistentPath);
  expect(bb.bestPath ? bb.bestPath.length : 0).toBe(legacy.longestConsistentPath ? legacy.longestConsistentPath.length : 0);
}

function compareAgainstLegacy(
  metrics: DifferentialMetrics,
  vertices: string[],
  edgesD: { from: string; to: string }[],
  edgesG: { u: string; v: string }[]
) {
  metrics.corpusSize++;
  const bb = solveAlgoBBPlusPlus(vertices, edgesD, edgesG, { maxEvents: 1000000 });
  const legacy = solveConsistentPath(vertices, edgesD, edgesG);

  if (bb.status === 'incomplete') {
    metrics.uncappedIncompleteRuns++;
    return;
  }

  if ((bb.error?.code ?? null) !== (legacy.error?.code ?? null)) {
    metrics.validityMismatches++;
    return;
  }

  const bbLength = bb.bestPath ? bb.bestPath.length : 0;
  const legacyLength = legacy.longestConsistentPath ? legacy.longestConsistentPath.length : 0;
  if (bbLength !== legacyLength) {
    metrics.objectiveMismatches++;
    return;
  }

  if (JSON.stringify(bb.bestPath ?? null) !== JSON.stringify(legacy.longestConsistentPath ?? null)) {
    metrics.winnerMismatches++;
  }
}

describe('AlgoBB++ educational bounded solver', () => {
  test('validation of malformed graphs', () => {
    const result = solveAlgoBBPlusPlus(['R1'], [{ from: 'R1', to: 'R2' }], []);
    expect(result.status).toBe('error');
    expect(result.error?.code).toBe('INVALID_NODE_D');
    expect(result.trace.at(-1)?.type).toBe('validation-error');
  });

  test('cycle rejection', () => {
    const result = solveAlgoBBPlusPlus(['R1', 'R2'], [{ from: 'R1', to: 'R2' }, { from: 'R2', to: 'R1' }], [
      { u: 'R1', v: 'R2' },
    ]);
    expect(result.status).toBe('error');
    expect(result.error?.code).toBe('CYCLE_DETECTED');
  });

  test('deterministic tie-breaking matches the legacy solver', () => {
    const vertices = ['A', 'B', 'C'];
    const edgesD = [{ from: 'A', to: 'C' }, { from: 'B', to: 'C' }];
    const edgesG = [{ u: 'A', v: 'C' }, { u: 'B', v: 'C' }];
    expectMatchesLegacy(vertices, edgesD, edgesG);
    expect(solveAlgoBBPlusPlus(vertices, edgesD, edgesG).bestPath).toEqual(['A', 'C']);
  });

  test('simple valid graph', () => {
    const vertices = ['R1', 'R2', 'R3'];
    const edgesD = [{ from: 'R1', to: 'R2' }, { from: 'R2', to: 'R3' }];
    const edgesG = [{ u: 'R1', v: 'R2' }, { u: 'R2', v: 'R3' }];
    const result = solveAlgoBBPlusPlus(vertices, edgesD, edgesG);
    expect(result.status).toBe('optimal');
    expect(result.bestPath).toEqual(['R1', 'R2', 'R3']);
  });

  test('longest metabolic path rejected by disconnected G', () => {
    const vertices = ['R1', 'R2', 'R3', 'R4'];
    const edgesD = [{ from: 'R1', to: 'R2' }, { from: 'R2', to: 'R3' }, { from: 'R3', to: 'R4' }];
    const edgesG = [{ u: 'R1', v: 'R2' }, { u: 'R2', v: 'R3' }];
    const result = solveAlgoBBPlusPlus(vertices, edgesD, edgesG);
    expect(result.bestPath).toEqual(['R1', 'R2', 'R3']);
    expect(result.trace.some((event) => event.type === 'genomic-rejection')).toBe(true);
  });

  test('branching graph', () => {
    const vertices = ['R1', 'R2', 'R3', 'R4', 'R5'];
    const edgesD = [
      { from: 'R1', to: 'R2' },
      { from: 'R1', to: 'R3' },
      { from: 'R2', to: 'R4' },
      { from: 'R3', to: 'R4' },
      { from: 'R4', to: 'R5' },
    ];
    const edgesG = [
      { u: 'R1', v: 'R2' },
      { u: 'R2', v: 'R4' },
      { u: 'R4', v: 'R5' },
      { u: 'R1', v: 'R3' },
    ];
    expectMatchesLegacy(vertices, edgesD, edgesG);
  });

  test('safe upper-bound pruning', () => {
    const vertices = ['A', 'B', 'C', 'D', 'E'];
    const edgesD = [{ from: 'A', to: 'B' }, { from: 'B', to: 'C' }, { from: 'D', to: 'E' }];
    const edgesG = [{ u: 'A', v: 'B' }, { u: 'B', v: 'C' }, { u: 'D', v: 'E' }];
    const result = solveAlgoBBPlusPlus(vertices, edgesD, edgesG);
    expect(result.bestPath).toEqual(['A', 'B', 'C']);
    expect(result.prunedStates).toBeGreaterThan(0);
    expect(result.trace.some((event) => event.type === 'bound-pruning')).toBe(true);
  });

  test('no false genomic partial-path pruning', () => {
    const vertices = ['A', 'B', 'C'];
    const edgesD = [{ from: 'A', to: 'B' }, { from: 'B', to: 'C' }];
    const edgesG = [{ u: 'A', v: 'C' }, { u: 'B', v: 'C' }];
    const result = solveAlgoBBPlusPlus(vertices, edgesD, edgesG);
    expect(result.status).toBe('optimal');
    expect(result.bestPath).toEqual(['A', 'B', 'C']);
  });

  test('proof-complete behavior', () => {
    const result = solveAlgoBBPlusPlus(['R1'], [], []);
    expect(result.status).toBe('optimal');
    expect(result.trace.at(-1)?.type).toBe('proof-complete');
  });

  test('event-cap incomplete behavior', () => {
    const result = solveAlgoBBPlusPlus(['R1', 'R2'], [{ from: 'R1', to: 'R2' }], [{ u: 'R1', v: 'R2' }], {
      maxEvents: 2,
    });
    expect(result.status).toBe('incomplete');
    expect(result.eventCapReached).toBe(true);
    expect(result.trace.some((event) => event.type === 'proof-complete')).toBe(false);
  });

  test('event-cap boundary behavior retains proof integrity', () => {
    const vertices = ['R1', 'R2', 'R3'];
    const edgesD = [{ from: 'R1', to: 'R2' }, { from: 'R2', to: 'R3' }];
    const edgesG = [{ u: 'R1', v: 'R2' }, { u: 'R2', v: 'R3' }];
    const full = solveAlgoBBPlusPlus(vertices, edgesD, edgesG, { maxEvents: 1000000 });
    const fullTraceLength = full.trace.length;
    const firstUpperBound = full.trace.findIndex((event) => event.type === 'upper-bound');
    const firstIncumbent = full.trace.findIndex((event) => event.type === 'incumbent-update');

    const incompleteCaps = [
      0,
      1,
      firstUpperBound,
      firstIncumbent,
      fullTraceLength - 2,
      fullTraceLength - 1,
    ];

    for (const cap of incompleteCaps) {
      const result = solveAlgoBBPlusPlus(vertices, edgesD, edgesG, { maxEvents: cap });
      expect(result.status, `cap ${cap}`).toBe('incomplete');
      expect(result.eventCapReached, `cap ${cap}`).toBe(true);
      expect(result.trace.some((event) => event.type === 'proof-complete'), `cap ${cap}`).toBe(false);
    }

    for (const cap of [fullTraceLength, fullTraceLength + 5]) {
      const result = solveAlgoBBPlusPlus(vertices, edgesD, edgesG, { maxEvents: cap });
      expect(result.status, `cap ${cap}`).toBe('optimal');
      expect(result.eventCapReached, `cap ${cap}`).toBe(false);
      expect(result.trace.at(-1)?.type, `cap ${cap}`).toBe('proof-complete');
    }
  });

  test('cancellation behavior', () => {
    const result = solveAlgoBBPlusPlus(['R1', 'R2'], [{ from: 'R1', to: 'R2' }], [{ u: 'R1', v: 'R2' }], {
      isCancelled: () => true,
    });
    expect(result.status).toBe('incomplete');
    expect(result.cancelled).toBe(true);
    expect(result.trace.at(-1)?.type).toBe('cancelled');
  });

  test('differential tests against the legacy exhaustive solver', () => {
    const metrics: DifferentialMetrics = {
      corpusSize: 0,
      objectiveMismatches: 0,
      winnerMismatches: 0,
      validityMismatches: 0,
      uncappedIncompleteRuns: 0,
    };

    for (let n = 1; n <= 4; n++) {
      const vertices = ids(n);
      const dagSubsets = edgeSubsets(allOrderedDagEdges(vertices));
      const gSubsets = edgeSubsets(undirectedPairs(vertices));
      for (const edgesD of dagSubsets) {
        for (const edgesG of gSubsets) {
          compareAgainstLegacy(metrics, vertices, edgesD, edgesG);
        }
      }
    }

    for (const n of [5, 6, 7]) {
      for (let salt = 1; salt <= 750; salt++) {
        const testCase = deterministicGraph(n, n * 10000 + salt);
        compareAgainstLegacy(metrics, testCase.vertices, testCase.edgesD, testCase.edgesG);
      }
    }

    const specialCases = [
      deterministicGraph(5, 11),
      deterministicGraph(6, 17),
      deterministicGraph(7, 23),
      { vertices: ['R1', 'R2', 'R3'], edgesD: [{ from: 'R1', to: 'R2' }], edgesG: [] },
      {
        vertices: ['R1', 'R2', 'R3', 'R4'],
        edgesD: [{ from: 'R1', to: 'R2' }, { from: 'R1', to: 'R3' }, { from: 'R2', to: 'R4' }, { from: 'R3', to: 'R4' }],
        edgesG: [{ u: 'R1', v: 'R2' }, { u: 'R2', v: 'R4' }, { u: 'R1', v: 'R3' }, { u: 'R3', v: 'R4' }],
      },
      { vertices: ['R1', 'R2'], edgesD: [], edgesG: [] },
      {
        vertices: ['END', 'UNSELECTED', 'R3'],
        edgesD: [{ from: 'END', to: 'UNSELECTED' }, { from: 'UNSELECTED', to: 'R3' }],
        edgesG: [{ u: 'END', v: 'R3' }, { u: 'UNSELECTED', v: 'R3' }],
      },
      { vertices: ['R1'], edgesD: [{ from: 'R1', to: 'R2' }], edgesG: [] },
      { vertices: ['R1'], edgesD: [], edgesG: [{ u: 'R1', v: 'R2' }] },
      { vertices: ['R1', 'R2'], edgesD: [{ from: 'R1', to: 'R2' }, { from: 'R2', to: 'R1' }], edgesG: [{ u: 'R1', v: 'R2' }] },
    ];

    for (const testCase of specialCases) {
      compareAgainstLegacy(metrics, testCase.vertices, testCase.edgesD, testCase.edgesG);
    }

    expect(metrics.corpusSize).toBe(6425);
    expect(metrics.objectiveMismatches).toBe(0);
    expect(metrics.winnerMismatches).toBe(0);
    expect(metrics.validityMismatches).toBe(0);
    expect(metrics.uncappedIncompleteRuns).toBe(0);
  });
});
