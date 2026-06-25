import { describe, expect, test } from 'vitest';
import { examples } from '../data/examples';
import { solveAlgoBBPlusPlus } from './algoBBPlusPlus';
import { solveCP1 } from './cpSolver';
import { solveCP2 } from './cp2Solver';
import { solveILP1 } from './ilp1Solver';
import { solveILP2 } from './ilp2Solver';
import { solveConsistentPath } from './pathAlgorithms';
import {
  retainLexicographicallySmallestState,
  solveSubsetDP,
  SUBSET_DP_HARD_MAX_VERTICES,
} from './subsetDpSolver';

function key(path: string[] | null | undefined): string {
  return (path || []).join('\u0001');
}

interface DifferentialInput {
  vertices: string[];
  edgesD: { from: string; to: string }[];
  edgesG: { u: string; v: string }[];
}

function deterministicValue(caseIndex: number, left: number, right: number, salt: number): number {
  let value = (
    Math.imul(caseIndex + 1, 0x45d9f3b)
    ^ Math.imul(left + 11, 0x27d4eb2d)
    ^ Math.imul(right + 17, 0x165667b1)
    ^ salt
  ) >>> 0;
  value ^= value >>> 16;
  value = Math.imul(value, 0x7feb352d) >>> 0;
  value ^= value >>> 15;
  value = Math.imul(value, 0x846ca68b) >>> 0;
  value ^= value >>> 16;
  return value / 0x100000000;
}

function generateDifferentialCorpus(size: number): DifferentialInput[] {
  return Array.from({ length: size }, (_, caseIndex) => {
    const vertexCount = 3 + (caseIndex % 6);
    const vertices = Array.from({ length: vertexCount }, (_, index) => String.fromCharCode(65 + index));
    const mode = caseIndex % 8;
    const directedKeys = new Set<string>();
    const genomicKeys = new Set<string>();

    const addD = (fromIndex: number, toIndex: number) => {
      if (fromIndex < toIndex && toIndex < vertexCount) directedKeys.add(`${fromIndex}|${toIndex}`);
    };
    const addG = (leftIndex: number, rightIndex: number) => {
      if (leftIndex === rightIndex) return;
      const left = Math.min(leftIndex, rightIndex);
      const right = Math.max(leftIndex, rightIndex);
      if (right < vertexCount) genomicKeys.add(`${left}|${right}`);
    };

    const directedDensity = mode === 0 ? 0.18 : mode === 1 ? 0.78 : mode === 3 ? 0.28 : 0.45;
    for (let left = 0; left < vertexCount; left++) {
      for (let right = left + 1; right < vertexCount; right++) {
        if (mode === 3 && (left === vertexCount - 1 || right === vertexCount - 1)) continue;
        if (deterministicValue(caseIndex, left, right, 0x9e3779b9) < directedDensity) addD(left, right);
      }
    }

    if (mode === 2 && vertexCount >= 4) {
      addD(0, 1);
      addD(0, 2);
      addD(1, vertexCount - 1);
      addD(2, vertexCount - 1);
    }
    if (mode === 4) {
      addD(0, 2);
      addD(1, 2);
    }

    if (mode === 5) {
      const split = Math.ceil(vertexCount / 2);
      for (let index = 0; index + 1 < split; index++) addG(index, index + 1);
      for (let index = split; index + 1 < vertexCount; index++) addG(index, index + 1);
    } else if (mode === 6) {
      for (let index = 0; index + 1 < vertexCount; index++) addG(index, index + 1);
    } else {
      const genomicDensity = mode === 1 ? 0.82 : mode === 7 ? 0.12 : 0.4;
      for (let left = 0; left < vertexCount; left++) {
        for (let right = left + 1; right < vertexCount; right++) {
          if (deterministicValue(caseIndex, left, right, 0x85ebca6b) < genomicDensity) addG(left, right);
        }
      }
    }

    if (mode === 4) {
      addG(0, 2);
      addG(1, 2);
    }

    return {
      vertices,
      edgesD: [...directedKeys].sort().map((edge) => {
        const [from, to] = edge.split('|').map(Number);
        return { from: vertices[from], to: vertices[to] };
      }),
      edgesG: [...genomicKeys].sort().map((edge) => {
        const [u, v] = edge.split('|').map(Number);
        return { u: vertices[u], v: vertices[v] };
      }),
    };
  });
}

const generatedDifferentialCorpus = generateDifferentialCorpus(512);
const generatedDifferentialPartitions = Array.from({ length: 8 }, (_, partitionIndex) =>
  generatedDifferentialCorpus.filter((_, caseIndex) => caseIndex % 8 === partitionIndex)
);

describe('Exact subset dynamic programming solver', () => {
  test('solves singleton graph', () => {
    const result = solveSubsetDP(['R1'], [], []);
    expect(result.status).toBe('optimal');
    expect(result.bestPath).toEqual(['R1']);
    expect(result.searchCompleted).toBe(true);
    expect(result.proofCompleteEmitted).toBe(true);
  });

  test('solves a simple directed path', () => {
    const result = solveSubsetDP(
      ['R1', 'R2', 'R3'],
      [{ from: 'R1', to: 'R2' }, { from: 'R2', to: 'R3' }],
      [{ u: 'R1', v: 'R2' }, { u: 'R2', v: 'R3' }]
    );
    expect(result.bestPath).toEqual(['R1', 'R2', 'R3']);
  });

  test('solves a branching DAG', () => {
    const result = solveSubsetDP(
      ['A', 'B', 'C', 'D'],
      [{ from: 'A', to: 'B' }, { from: 'A', to: 'C' }, { from: 'B', to: 'D' }, { from: 'C', to: 'D' }],
      [{ u: 'A', v: 'B' }, { u: 'B', v: 'D' }, { u: 'A', v: 'C' }, { u: 'C', v: 'D' }]
    );
    expect(result.bestPath).toEqual(['A', 'B', 'D']);
  });

  test('rejects disconnected genomic subsets', () => {
    const result = solveSubsetDP(
      ['A', 'B', 'C'],
      [{ from: 'A', to: 'B' }, { from: 'B', to: 'C' }],
      [{ u: 'A', v: 'B' }]
    );
    expect(result.bestPath).toEqual(['A', 'B']);
    expect(result.counters.genomicDisconnectedSubsetsRejected).toBeGreaterThan(0);
    expect(result.trace.some((event) => event.type === 'genomic-rejection')).toBe(true);
  });

  test('accepts connected genomic subsets', () => {
    const result = solveSubsetDP(
      ['A', 'B', 'C'],
      [{ from: 'A', to: 'B' }, { from: 'B', to: 'C' }],
      [{ u: 'A', v: 'C' }, { u: 'C', v: 'B' }]
    );
    expect(result.bestPath).toEqual(['A', 'B', 'C']);
  });

  test('uses lexical tie-break for equal-length winners', () => {
    const result = solveSubsetDP(
      ['A', 'B', 'C'],
      [{ from: 'A', to: 'C' }, { from: 'B', to: 'C' }],
      [{ u: 'A', v: 'C' }, { u: 'B', v: 'C' }]
    );
    expect(result.bestPath).toEqual(['A', 'C']);
  });

  test('retains lexicographically smallest path for identical (mask,last) state', () => {
    const retained = retainLexicographicallySmallestState(['B', 'A', 'D'], ['A', 'B', 'D']);
    expect(retained.retained).toBe(true);
    expect(retained.path).toEqual(['A', 'B', 'D']);
  });

  test('safely discards dominated duplicate state', () => {
    const retained = retainLexicographicallySmallestState(['A', 'B', 'D'], ['B', 'A', 'D']);
    expect(retained.retained).toBe(false);
    expect(retained.path).toEqual(['A', 'B', 'D']);
  });

  test('accepts exactly the 15-vertex hard boundary', () => {
    const vertices = Array.from({ length: SUBSET_DP_HARD_MAX_VERTICES }, (_, index) => `R${index + 1}`);
    const result = solveSubsetDP(vertices, [], []);
    expect(result.status).toBe('optimal');
    expect(result.bestPath).toEqual(['R1']);
    expect(result.searchCompleted).toBe(true);
    expect(result.proofCompleteEmitted).toBe(true);
  });

  test('rejects 16 vertices safely without reporting a solved result', () => {
    const vertices = Array.from({ length: SUBSET_DP_HARD_MAX_VERTICES + 1 }, (_, index) => `R${index + 1}`);
    const result = solveSubsetDP(vertices, [], []);
    expect(result.status).toBe('unsupported');
    expect(result.status).not.toBe('optimal');
    expect(result.status).not.toBe('no-solution');
    expect(result.error?.code).toBe('TOO_MANY_VERTICES');
    expect(result.bestPath).toBeNull();
    expect(result.searchCompleted).toBe(false);
    expect(result.proofCompleteEmitted).toBe(false);
    expect(result.counters.statesCreated).toBe(0);
  });

  test('cannot override the 15-vertex hard maximum through public options', () => {
    const vertices = Array.from({ length: 32 }, (_, index) => `R${index + 1}`);
    const result = solveSubsetDP(vertices, [], [], { maxVertices: 32, maxEvents: 200000 });
    expect(result.status).toBe('unsupported');
    expect(result.status).not.toBe('optimal');
    expect(result.status).not.toBe('no-solution');
    expect(result.error?.code).toBe('TOO_MANY_VERTICES');
    expect(result.trace).toHaveLength(1);
    expect(result.trace[0].type).toBe('unsupported');
    expect(result.counters.statesCreated).toBe(0);
  });

  test('allows a smaller operational vertex limit but never expands the hard maximum', () => {
    const vertices = ['A', 'B', 'C', 'D'];
    const result = solveSubsetDP(vertices, [], [], { maxVertices: 3 });
    expect(result.status).toBe('unsupported');
    expect(result.error?.code).toBe('TOO_MANY_VERTICES');
  });

  test('cap returns incomplete and preserves incumbent', () => {
    const result = solveSubsetDP(
      ['A', 'B', 'C'],
      [{ from: 'A', to: 'B' }, { from: 'B', to: 'C' }],
      [{ u: 'A', v: 'B' }, { u: 'B', v: 'C' }],
      { maxEvents: 3 }
    );
    expect(result.status).toBe('incomplete');
    expect(result.interruptedByCap).toBe(true);
    expect(result.proofCompleteEmitted).toBe(false);
    expect(result.bestPath).toEqual(['A']);
  });

  test('cancellation returns incomplete and preserves incumbent', () => {
    let calls = 0;
    const result = solveSubsetDP(
      ['A', 'B'],
      [{ from: 'A', to: 'B' }],
      [{ u: 'A', v: 'B' }],
      { shouldCancel: () => ++calls > 1 }
    );
    expect(result.status).toBe('incomplete');
    expect(result.cancelled).toBe(true);
    expect(result.proofCompleteEmitted).toBe(false);
    expect(result.bestPath).toEqual(['A']);
  });

  test('proof complete is emitted only after exhaustive DP processing', () => {
    const full = solveSubsetDP(['A', 'B'], [{ from: 'A', to: 'B' }], [{ u: 'A', v: 'B' }]);
    expect(full.status).toBe('optimal');
    expect(full.searchCompleted).toBe(true);
    expect(full.trace.at(-1)?.type).toBe('proof-complete');

    const capped = solveSubsetDP(['A', 'B'], [{ from: 'A', to: 'B' }], [{ u: 'A', v: 'B' }], { maxEvents: full.trace.length - 1 });
    expect(capped.status).toBe('incomplete');
    expect(capped.proofCompleteEmitted).toBe(false);
  });

  test('handles malformed graph input', () => {
    const result = solveSubsetDP(['A'], [{ from: 'A', to: 'B' }], []);
    expect(result.status).toBe('error');
    expect(result.error?.code).toBe('INVALID_NODE_D');
  });

  test('differential comparison against existing exact methods on deterministic corpus', () => {
    let objectiveMismatches = 0;
    let winnerMismatches = 0;
    let validityMismatches = 0;
    let uncappedIncompleteRuns = 0;

    const partitions = [examples.filter((_, index) => index % 2 === 0), examples.filter((_, index) => index % 2 === 1)];
    for (const partition of partitions) {
      for (const input of partition) {
        const legacy = solveConsistentPath(input.vertices, input.edgesD, input.edgesG);
        const cp1 = solveCP1(input.vertices, input.edgesD, input.edgesG, 200000);
        const cp2 = solveCP2(input.vertices, input.edgesD, input.edgesG, { maxEvents: 200000 });
        const bb = solveAlgoBBPlusPlus(input.vertices, input.edgesD, input.edgesG, { maxEvents: 200000 });
        const ilp1 = solveILP1(input.vertices, input.edgesD, input.edgesG, { maxEvents: 200000 });
        const ilp2 = solveILP2(input.vertices, input.edgesD, input.edgesG, { maxEvents: 200000 });
        const dp = solveSubsetDP(input.vertices, input.edgesD, input.edgesG, { maxEvents: 200000 });

        const results = [cp1.bestPath, cp2.bestPath, bb.bestPath, ilp1.bestPath, ilp2.bestPath, dp.bestPath];
        const expected = legacy.longestConsistentPath;

        if (legacy.error || [cp1, cp2, bb, ilp1, ilp2, dp].some((result) => result.status === 'error')) validityMismatches++;
        if ([cp2, bb, ilp1, ilp2, dp].some((result) => result.status === 'incomplete')) uncappedIncompleteRuns++;
        if (results.some((path) => (path?.length || 0) !== (expected?.length || 0))) objectiveMismatches++;
        if (results.some((path) => key(path) !== key(expected))) winnerMismatches++;
      }
    }

    expect(examples.length).toBe(5);
    expect(objectiveMismatches).toBe(0);
    expect(winnerMismatches).toBe(0);
    expect(validityMismatches).toBe(0);
    expect(uncappedIncompleteRuns).toBe(0);
  });

  test('generated deterministic differential corpus has eight stable 64-case partitions', () => {
    expect(generatedDifferentialCorpus).toHaveLength(512);
    expect(generatedDifferentialPartitions.every((partition) => partition.length === 64)).toBe(true);
  });

  test.each(generatedDifferentialPartitions.map((partition, partitionIndex) => [partitionIndex, partition] as const))(
    'generated deterministic small-DAG partition %i matches every existing exact method',
    (_partitionIndex, partition) => {
      let objectiveMismatches = 0;
      let winnerMismatches = 0;
      let validityMismatches = 0;
      let uncappedIncompleteRuns = 0;

      for (const input of partition) {
        const legacy = solveConsistentPath(input.vertices, input.edgesD, input.edgesG);
        const cp1 = solveCP1(input.vertices, input.edgesD, input.edgesG, 200000);
        const cp2 = solveCP2(input.vertices, input.edgesD, input.edgesG, { maxEvents: 200000 });
        const bb = solveAlgoBBPlusPlus(input.vertices, input.edgesD, input.edgesG, { maxEvents: 200000 });
        const ilp1 = solveILP1(input.vertices, input.edgesD, input.edgesG, { maxEvents: 200000 });
        const ilp2 = solveILP2(input.vertices, input.edgesD, input.edgesG, { maxEvents: 200000 });
        const dp = solveSubsetDP(input.vertices, input.edgesD, input.edgesG, { maxEvents: 200000 });
        const exactResults = [cp1, cp2, bb, ilp1, ilp2, dp];
        const paths = exactResults.map((result) => result.bestPath);
        const expected = legacy.longestConsistentPath;

        if (legacy.error || exactResults.some((result) => result.status === 'error')) validityMismatches++;
        if (exactResults.some((result) => result.status === 'incomplete')) uncappedIncompleteRuns++;
        if (paths.some((path) => (path?.length || 0) !== (expected?.length || 0))) objectiveMismatches++;
        if (paths.some((path) => key(path) !== key(expected))) winnerMismatches++;
      }

      expect(objectiveMismatches).toBe(0);
      expect(winnerMismatches).toBe(0);
      expect(validityMismatches).toBe(0);
      expect(uncappedIncompleteRuns).toBe(0);
    }
  );

  test('counts malformed boundary cases separately from the valid differential corpus', () => {
    const malformedBoundaryCases: DifferentialInput[] = [
      { vertices: ['A'], edgesD: [{ from: 'A', to: 'B' }], edgesG: [] },
      { vertices: ['A'], edgesD: [], edgesG: [{ u: 'A', v: 'B' }] },
      { vertices: ['A', 'B'], edgesD: [{ from: 'A', to: 'B' }, { from: 'A', to: 'B' }], edgesG: [] },
      { vertices: ['A', 'B'], edgesD: [], edgesG: [{ u: 'A', v: 'B' }, { u: 'B', v: 'A' }] },
      { vertices: ['A', 'B'], edgesD: [{ from: 'A', to: 'B' }, { from: 'B', to: 'A' }], edgesG: [] },
    ];
    let validityMismatches = 0;

    for (const input of malformedBoundaryCases) {
      const legacy = solveConsistentPath(input.vertices, input.edgesD, input.edgesG);
      const results = [
        solveCP1(input.vertices, input.edgesD, input.edgesG, 200000),
        solveCP2(input.vertices, input.edgesD, input.edgesG, { maxEvents: 200000 }),
        solveAlgoBBPlusPlus(input.vertices, input.edgesD, input.edgesG, { maxEvents: 200000 }),
        solveILP1(input.vertices, input.edgesD, input.edgesG, { maxEvents: 200000 }),
        solveILP2(input.vertices, input.edgesD, input.edgesG, { maxEvents: 200000 }),
        solveSubsetDP(input.vertices, input.edgesD, input.edgesG, { maxEvents: 200000 }),
      ];
      if (!legacy.error || results.some((result) => result.status !== 'error')) validityMismatches++;
    }

    expect(malformedBoundaryCases).toHaveLength(5);
    expect(validityMismatches).toBe(0);
  });
});
