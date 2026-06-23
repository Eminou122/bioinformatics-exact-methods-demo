import { describe, expect, test } from 'vitest';
import { solveCP2 } from './cp2Solver';
import { solveCP1 } from './cpSolver';
import { solveConsistentPath } from './pathAlgorithms';

type EdgeD = { from: string; to: string };
type EdgeG = { u: string; v: string };
type CaseDef = { vertices: string[]; edgesD: EdgeD[]; edgesG: EdgeG[] };

function expectMatchesLegacyAndCP1(input: CaseDef) {
  const cp2 = solveCP2(input.vertices, input.edgesD, input.edgesG, { maxEvents: 200000 });
  const cp1 = solveCP1(input.vertices, input.edgesD, input.edgesG, 200000);
  const legacy = solveConsistentPath(input.vertices, input.edgesD, input.edgesG);

  expect(cp2.status).not.toBe('error');
  expect(cp2.status).not.toBe('incomplete');
  expect(cp1.status).not.toBe('error');
  expect(cp1.status).not.toBe('incomplete');
  expect(legacy.error).toBeUndefined();
  expect(cp2.bestPath || []).toEqual(legacy.longestConsistentPath || []);
  expect(cp2.bestPath || []).toEqual(cp1.bestPath || []);
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

describe('CP2 educational bounded exact solver', () => {
  test('malformed input validation', () => {
    const result = solveCP2(['R1'], [{ from: 'R1', to: 'R2' }], []);
    expect(result.status).toBe('error');
    expect(result.error?.code).toBe('INVALID_NODE_D');
    expect(result.trace[0]?.type).toBe('validation-error');
  });

  test('cycle rejection', () => {
    const result = solveCP2(['R1', 'R2'], [{ from: 'R1', to: 'R2' }, { from: 'R2', to: 'R1' }], [{ u: 'R1', v: 'R2' }]);
    expect(result.status).toBe('error');
    expect(result.error?.code).toBe('CYCLE_DETECTED');
  });

  test('simple valid path', () => {
    expectMatchesLegacyAndCP1({
      vertices: ['R1', 'R2', 'R3'],
      edgesD: [{ from: 'R1', to: 'R2' }, { from: 'R2', to: 'R3' }],
      edgesG: [{ u: 'R1', v: 'R2' }, { u: 'R2', v: 'R3' }],
    });
  });

  test('longest D path rejected by disconnected G', () => {
    const input = {
      vertices: ['R1', 'R2', 'R3', 'R4'],
      edgesD: [{ from: 'R1', to: 'R2' }, { from: 'R2', to: 'R3' }, { from: 'R3', to: 'R4' }],
      edgesG: [{ u: 'R1', v: 'R2' }, { u: 'R2', v: 'R3' }],
    };
    const result = solveCP2(input.vertices, input.edgesD, input.edgesG);
    expect(result.bestPath).toEqual(['R1', 'R2', 'R3']);
    expect(result.trace.some((e) => e.type === 'genomic-rejection' && e.currentPath.includes('R4'))).toBe(true);
    expectMatchesLegacyAndCP1(input);
  });

  test('branching and merging', () => {
    expectMatchesLegacyAndCP1({
      vertices: ['A', 'B', 'C', 'D'],
      edgesD: [{ from: 'A', to: 'B' }, { from: 'A', to: 'C' }, { from: 'B', to: 'D' }, { from: 'C', to: 'D' }],
      edgesG: [{ u: 'A', v: 'B' }, { u: 'B', v: 'D' }, { u: 'A', v: 'C' }, { u: 'C', v: 'D' }],
    });
  });

  test('deterministic tie-breaking', () => {
    const input = {
      vertices: ['A', 'B', 'C'],
      edgesD: [{ from: 'A', to: 'B' }, { from: 'A', to: 'C' }],
      edgesG: [{ u: 'A', v: 'B' }, { u: 'A', v: 'C' }],
    };
    const result = solveCP2(input.vertices, input.edgesD, input.edgesG);
    expect(result.bestPath).toEqual(['A', 'B']);
    expectMatchesLegacyAndCP1(input);
  });

  test('safe upper-bound pruning', () => {
    const result = solveCP2(
      ['A', 'B', 'C', 'D', 'E'],
      [{ from: 'A', to: 'B' }, { from: 'B', to: 'C' }, { from: 'A', to: 'D' }, { from: 'D', to: 'E' }],
      [{ u: 'A', v: 'B' }, { u: 'B', v: 'C' }, { u: 'A', v: 'D' }, { u: 'D', v: 'E' }]
    );
    expect(result.status).toBe('optimal');
    expect(result.bestPath).toEqual(['A', 'B', 'C']);
    expect(result.prunedStates).toBeGreaterThan(0);
    expect(result.trace.some((e) => e.type === 'bound-pruning')).toBe(true);
  });

  test('equal-length lexical tie safety', () => {
    const result = solveCP2(
      ['A', 'B', 'C', 'D', 'E'],
      [{ from: 'A', to: 'B' }, { from: 'B', to: 'C' }, { from: 'A', to: 'D' }, { from: 'D', to: 'E' }],
      [{ u: 'A', v: 'B' }, { u: 'B', v: 'C' }, { u: 'A', v: 'D' }, { u: 'D', v: 'E' }]
    );
    expect(result.trace.some((e) => e.type === 'bound-pruning' && e.reason === 'equal-length-lexical-safety')).toBe(true);
  });

  test('future genomic reconnection is not falsely pruned', () => {
    const input = {
      vertices: ['A', 'B', 'C'],
      edgesD: [{ from: 'A', to: 'B' }, { from: 'B', to: 'C' }],
      edgesG: [{ u: 'A', v: 'C' }, { u: 'B', v: 'C' }],
    };
    const result = solveCP2(input.vertices, input.edgesD, input.edgesG);
    expect(result.bestPath).toEqual(['A', 'B', 'C']);
    expect(result.trace.some((e) => e.type === 'genomic-rejection' && e.currentPath.join(',') === 'A,B')).toBe(true);
    expect(result.trace.some((e) => e.type === 'bound-pruning' && e.currentPath.join(',') === 'A,B')).toBe(false);
    expectMatchesLegacyAndCP1(input);
  });

  test('proof-complete behavior', () => {
    const result = solveCP2(['A'], [], []);
    expect(result.status).toBe('optimal');
    expect(result.searchCompleted).toBe(true);
    expect(result.proofCompleteEmitted).toBe(true);
    expect(result.cancelled).toBe(false);
    expect(result.interruptedByCap).toBe(false);
    expect(result.trace.at(-1)?.type).toBe('proof-complete');
  });

  test('event caps at exact trace boundaries', () => {
    const input = {
      vertices: ['R1', 'R2', 'R3'],
      edgesD: [{ from: 'R1', to: 'R2' }, { from: 'R2', to: 'R3' }],
      edgesG: [{ u: 'R1', v: 'R2' }, { u: 'R2', v: 'R3' }],
    };
    const full = solveCP2(input.vertices, input.edgesD, input.edgesG, { maxEvents: 1000 });
    expect(full.status).toBe('optimal');
    const fullTraceLength = full.trace.length;

    for (const cap of [0, 1, fullTraceLength - 2, fullTraceLength - 1]) {
      const capped = solveCP2(input.vertices, input.edgesD, input.edgesG, { maxEvents: cap });
      expect(capped.status).toBe('incomplete');
      expect(capped.proofCompleteEmitted).toBe(false);
    }

    const exact = solveCP2(input.vertices, input.edgesD, input.edgesG, { maxEvents: fullTraceLength });
    expect(exact.status).toBe('optimal');
    expect(exact.proofCompleteEmitted).toBe(true);
  });

  test('cancellation', () => {
    const result = solveCP2(['A', 'B'], [{ from: 'A', to: 'B' }], [{ u: 'A', v: 'B' }], {
      shouldCancel: () => true,
    });
    expect(result.status).toBe('incomplete');
    expect(result.cancelled).toBe(true);
    expect(result.proofCompleteEmitted).toBe(false);
    expect(result.trace.some((e) => e.type === 'cancelled')).toBe(true);
  });

  test('explicit tests with vertex IDs END and UNSELECTED', () => {
    expectMatchesLegacyAndCP1({
      vertices: ['END', 'UNSELECTED', 'NORMAL'],
      edgesD: [{ from: 'UNSELECTED', to: 'END' }, { from: 'END', to: 'NORMAL' }],
      edgesG: [{ u: 'UNSELECTED', v: 'END' }, { u: 'END', v: 'NORMAL' }, { u: 'UNSELECTED', v: 'NORMAL' }],
    });
  });

  test('differential comparison against Legacy and CP1 on deterministic named cases', () => {
    const namedCases: CaseDef[] = [
      { vertices: ['A', 'B', 'C'], edgesD: [], edgesG: [] },
      { vertices: ['A', 'B', 'C'], edgesD: [{ from: 'A', to: 'B' }], edgesG: [] },
      { vertices: ['A', 'B', 'C', 'D'], edgesD: [{ from: 'A', to: 'B' }, { from: 'A', to: 'C' }, { from: 'B', to: 'D' }, { from: 'C', to: 'D' }], edgesG: [{ u: 'A', v: 'B' }, { u: 'C', v: 'D' }] },
      { vertices: ['A', 'B', 'C', 'D'], edgesD: [{ from: 'A', to: 'B' }, { from: 'B', to: 'C' }, { from: 'C', to: 'D' }], edgesG: [{ u: 'A', v: 'D' }, { u: 'B', v: 'D' }, { u: 'C', v: 'D' }] },
    ];

    for (const input of namedCases) expectMatchesLegacyAndCP1(input);
  });

  test('strong deterministic corpus has zero mismatches', () => {
    const corpus: CaseDef[] = [
      ...pairedDagCasesThrough4Vertices(),
      ...Array.from({ length: 750 }, (_, i) => randomCase(5, 5000 + i)),
      ...Array.from({ length: 750 }, (_, i) => randomCase(6, 6000 + i)),
      ...Array.from({ length: 750 }, (_, i) => randomCase(7, 7000 + i)),
      { vertices: ['A', 'B', 'C'], edgesD: [{ from: 'A', to: 'B' }, { from: 'B', to: 'C' }], edgesG: [] },
      { vertices: ['A', 'B', 'C', 'D'], edgesD: [{ from: 'A', to: 'B' }, { from: 'A', to: 'C' }, { from: 'B', to: 'D' }, { from: 'C', to: 'D' }], edgesG: [{ u: 'A', v: 'B' }, { u: 'B', v: 'D' }, { u: 'A', v: 'C' }, { u: 'C', v: 'D' }] },
      { vertices: ['A', 'B', 'C'], edgesD: [{ from: 'A', to: 'B' }, { from: 'A', to: 'C' }], edgesG: [{ u: 'A', v: 'B' }, { u: 'A', v: 'C' }] },
    ];

    let objectiveMismatches = 0;
    let winnerMismatches = 0;
    let validityMismatches = 0;
    let uncappedIncompleteRuns = 0;

    for (const input of corpus) {
      const cp2 = solveCP2(input.vertices, input.edgesD, input.edgesG, { maxEvents: 200000 });
      const cp1 = solveCP1(input.vertices, input.edgesD, input.edgesG, 200000);
      const legacy = solveConsistentPath(input.vertices, input.edgesD, input.edgesG);

      if (cp2.status === 'incomplete' || cp1.status === 'incomplete') uncappedIncompleteRuns++;
      if (cp2.status === 'error' || cp1.status === 'error' || legacy.error) validityMismatches++;

      const cp2Best = cp2.bestPath || [];
      const cp1Best = cp1.bestPath || [];
      const legacyBest = legacy.longestConsistentPath || [];
      if (cp2Best.length !== legacyBest.length || cp2Best.length !== cp1Best.length) objectiveMismatches++;
      if (cp2Best.join('\u0001') !== legacyBest.join('\u0001') || cp2Best.join('\u0001') !== cp1Best.join('\u0001')) winnerMismatches++;
    }

    expect(corpus.length).toBe(6349);
    expect(objectiveMismatches).toBe(0);
    expect(winnerMismatches).toBe(0);
    expect(validityMismatches).toBe(0);
    expect(uncappedIncompleteRuns).toBe(0);
  });

  test('malformed graphs remain rejected in the corpus boundary set', () => {
    const malformed = [
      solveCP2(['A'], [{ from: 'A', to: 'B' }], []),
      solveCP2(['A'], [], [{ u: 'A', v: 'B' }]),
      solveCP2(['A', 'B'], [{ from: 'A', to: 'B' }, { from: 'A', to: 'B' }], []),
      solveCP2(['A', 'B'], [], [{ u: 'A', v: 'B' }, { u: 'B', v: 'A' }]),
      solveCP2(['A', 'B'], [{ from: 'A', to: 'B' }, { from: 'B', to: 'A' }], [{ u: 'A', v: 'B' }]),
    ];

    expect(malformed.every((result) => result.status === 'error')).toBe(true);
  });
});
