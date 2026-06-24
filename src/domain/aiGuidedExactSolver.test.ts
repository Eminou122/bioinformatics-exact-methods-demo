import { describe, expect, test } from 'vitest';
import { examples } from '../data/examples';
import { solveAlgoBBPlusPlus } from './algoBBPlusPlus';
import { solveCP1 } from './cpSolver';
import { solveCP2 } from './cp2Solver';
import { solveILP1 } from './ilp1Solver';
import { solveILP2 } from './ilp2Solver';
import { solveConsistentPath } from './pathAlgorithms';
import { rankAIGuidedCandidates, solveAIGuidedExact } from './aiGuidedExactSolver';

const differentialCases = examples.map((example) => ({
  name: example.id,
  vertices: example.vertices,
  edgesD: example.edgesD,
  edgesG: example.edgesG,
}));

function pathKey(path: string[] | null | undefined): string {
  return path ? path.join('>') : '';
}

describe('Explainable AI-guided exact search', () => {
  test('matches Legacy and implemented exact methods on a bounded educational corpus', () => {
    let mismatches = 0;

    for (const input of differentialCases) {
      const ai = solveAIGuidedExact(input.vertices, input.edgesD, input.edgesG, { maxEvents: 200000 });
      const legacy = solveConsistentPath(input.vertices, input.edgesD, input.edgesG);
      const cp1 = solveCP1(input.vertices, input.edgesD, input.edgesG, 200000);
      const cp2 = solveCP2(input.vertices, input.edgesD, input.edgesG, { maxEvents: 200000 });
      const bb = solveAlgoBBPlusPlus(input.vertices, input.edgesD, input.edgesG, { maxEvents: 200000 });
      const ilp1 = solveILP1(input.vertices, input.edgesD, input.edgesG, { maxEvents: 200000 });
      const ilp2 = solveILP2(input.vertices, input.edgesD, input.edgesG, { maxEvents: 200000 });
      const expected = pathKey(legacy.longestConsistentPath);

      for (const actual of [ai.bestPath, cp1.bestPath, cp2.bestPath, bb.bestPath, ilp1.bestPath, ilp2.bestPath]) {
        if (pathKey(actual) !== expected) mismatches += 1;
      }

      expect(ai.status).toBe('optimal');
      expect(ai.searchCompleted).toBe(true);
      expect(ai.proofCompleteEmitted).toBe(true);
    }

    expect(mismatches).toBe(0);
  });

  test('guide ranking is deterministic and exposes the complete score rationale', () => {
    const adjD = {
      R1: ['R2', 'R3'],
      R2: ['R4'],
      R3: [],
      R4: [],
    };
    const adjG = {
      R1: ['R3'],
      R2: [],
      R3: ['R1'],
      R4: [],
    };

    const first = rankAIGuidedCandidates(['R1'], ['R2', 'R3'], adjD, adjG);
    const second = rankAIGuidedCandidates(['R1'], ['R2', 'R3'], adjD, adjG);

    expect(second).toEqual(first);
    expect(first[0].rationale).toEqual([
      'High reachable suffix: 2',
      'Genomic support links: 0',
      'Compatible continuation choices: 1',
      'Priority score: 3',
    ]);
  });

  test('lexical fallback is deterministic when guide scores tie', () => {
    const adjD = { R1: ['R3', 'R2'], R2: [], R3: [] };
    const adjG = { R1: [], R2: [], R3: [] };
    const ranked = rankAIGuidedCandidates(['R1'], ['R3', 'R2'], adjD, adjG);

    expect(ranked.map((entry) => entry.vertex)).toEqual(['R2', 'R3']);
    expect(ranked.map((entry) => entry.lexicalFallback)).toEqual(['R2', 'R3']);
  });

  test('guide ordering can differ from lexical exploration order', () => {
    const adjD = { R1: ['R2', 'R3'], R2: [], R3: ['R4'], R4: [] };
    const adjG = { R1: [], R2: [], R3: [], R4: [] };
    const ranked = rankAIGuidedCandidates(['R1'], ['R2', 'R3'], adjD, adjG);

    expect(ranked.map((entry) => entry.vertex)).toEqual(['R3', 'R2']);
  });

  test('guide ordering never changes validity', () => {
    const vertices = ['R1', 'R2', 'R3', 'R4'];
    const edgesD = [
      { from: 'R1', to: 'R2' },
      { from: 'R1', to: 'R3' },
      { from: 'R3', to: 'R4' },
    ];
    const edgesG = [{ u: 'R1', v: 'R2' }];

    const ai = solveAIGuidedExact(vertices, edgesD, edgesG);
    const legacy = solveConsistentPath(vertices, edgesD, edgesG);

    expect(pathKey(ai.bestPath)).toBe(pathKey(legacy.longestConsistentPath));
    expect(ai.trace.some((event) => event.type === 'genomic-rejection')).toBe(true);
  });

  test('cap returns incomplete and does not emit proof completion', () => {
    const input = differentialCases[2];
    const capped = solveAIGuidedExact(input.vertices, input.edgesD, input.edgesG, { maxEvents: 4 });

    expect(capped.status).toBe('incomplete');
    expect(capped.interruptedByCap).toBe(true);
    expect(capped.searchCompleted).toBe(false);
    expect(capped.proofCompleteEmitted).toBe(false);
  });

  test('cancellation returns incomplete and does not emit proof completion', () => {
    const input = differentialCases[0];
    const cancelled = solveAIGuidedExact(input.vertices, input.edgesD, input.edgesG, {
      shouldCancel: () => true,
    });

    expect(cancelled.status).toBe('incomplete');
    expect(cancelled.cancelled).toBe(true);
    expect(cancelled.searchCompleted).toBe(false);
    expect(cancelled.proofCompleteEmitted).toBe(false);
  });

  test('proof-complete is emitted only on full search', () => {
    const input = differentialCases[0];
    const complete = solveAIGuidedExact(input.vertices, input.edgesD, input.edgesG);
    const capped = solveAIGuidedExact(input.vertices, input.edgesD, input.edgesG, { maxEvents: 2 });

    expect(complete.trace.at(-1)?.type).toBe('proof-complete');
    expect(capped.trace.some((event) => event.type === 'proof-complete')).toBe(false);
  });
});
