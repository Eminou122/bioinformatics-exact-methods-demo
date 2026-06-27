import { describe, expect, test } from 'vitest';
import { CHALLENGE_GRAPHS } from './challengeGraphLibrary';
import { generateWithDGDistinctionRetries, validateDGStructuralDistinction, validateNamedChallengeDistinction } from './dgStructuralDistinction';

describe('D/G structural distinction validator', () => {
  test('returns passed for deliberately distinct valid graphs', () => {
    const report = validateDGStructuralDistinction({
      vertices: ['R1', 'R2', 'R3', 'R4'],
      edgesD: [{ from: 'R1', to: 'R2' }],
      edgesG: [{ u: 'R3', v: 'R4' }],
      seeds: { seedOrder: 1, seedD: 2, seedG: 3 },
    });

    expect(report.status).toBe('passed');
    expect(report.sharedVertexIds).toBe(true);
    expect(report.dAcyclic).toBe(true);
    expect(report.gUndirected).toBe(true);
    expect(report.independentStreams).toBe(true);
  });

  test('returns warning for valid but structurally similar D/G graphs', () => {
    const report = validateDGStructuralDistinction({
      vertices: ['R1', 'R2', 'R3'],
      edgesD: [{ from: 'R1', to: 'R2' }, { from: 'R1', to: 'R3' }],
      edgesG: [{ u: 'R1', v: 'R2' }, { u: 'R1', v: 'R3' }],
      seeds: { seedOrder: 1, seedD: 2, seedG: 3 },
    });

    expect(report.status).toBe('warning');
    expect(report.projectedEdgeOverlapRatio).toBe(1);
  });

  test('bounded regeneration is deterministic and exposes final seeds', () => {
    const run = () => generateWithDGDistinctionRetries({ seedD: 1, seedG: 2 }, (seedD, seedG) => ({
      family: 'acyclic-erdos-renyi' as const,
      seed: 1,
      seeds: { seedOrder: 1, seedD, seedG },
      parameters: { n: 4, pD: 0, pG: 0, seedOrder: 1, seedD, seedG },
      vertices: ['R1', 'R2', 'R3', 'R4'],
      topologicalOrder: ['R1', 'R2', 'R3', 'R4'],
      edgesD: seedD > 1000 ? [{ from: 'R1', to: 'R2' }] : [{ from: 'R1', to: 'R2' }, { from: 'R1', to: 'R3' }],
      edgesG: seedG > 1000 ? [{ u: 'R3', v: 'R4' }] : [{ u: 'R1', v: 'R2' }, { u: 'R1', v: 'R3' }],
      statistics: { vertexCount: 4, directedEdgeCount: 1, genomicEdgeCount: 1 },
    }));

    const a = run();
    const b = run();
    expect(a).toEqual(b);
    expect(a.report.status).toBe('regenerated');
    expect(a.report.attempts).toBe(1);
    expect(a.report.finalSeedD).toBe(1001);
    expect(a.report.finalSeedG).toBe(1002);
  });

  test('named challenge graphs are validated without regeneration', () => {
    const report = validateNamedChallengeDistinction({
      ...CHALLENGE_GRAPHS[0],
      seeds: { seedOrder: 0, seedD: 0, seedG: 0 },
    });

    expect(report.attempts).toBe(0);
    expect(report.status).not.toBe('regenerated');
  });
});
