import { describe, expect, test } from 'vitest';
import { solveCP2 } from '../domain/cp2Solver';
import { solveCP2Plus } from '../domain/cp2PlusSolver';
import { isInducedGConnected, solveConsistentPath } from '../domain/pathAlgorithms';
import { cp2PlusTeachingExamples } from './cp2PlusExamples';

function solve(id: string) {
  const example = cp2PlusTeachingExamples.find((item) => item.id === id)!;
  return {
    example,
    result: solveCP2Plus(example.vertices, example.edgesD, example.edgesG, { maxEvents: 200000 }),
  };
}

describe('CP2+ teaching example library', () => {
  test('contains eight unique deterministic curated examples', () => {
    expect(cp2PlusTeachingExamples).toHaveLength(8);
    expect(new Set(cp2PlusTeachingExamples.map((example) => example.id)).size).toBe(8);

    for (const example of cp2PlusTeachingExamples) {
      const first = solveCP2Plus(example.vertices, example.edgesD, example.edgesG, { maxEvents: 200000 });
      const second = solveCP2Plus(example.vertices, example.edgesD, example.edgesG, { maxEvents: 200000 });
      expect(second).toEqual(first);
    }
  });

  test.each([
    'cp2-plus-unreachable-bridge',
    'cp2-plus-backward-bridge',
  ])('%s produces a safe genomic prune', (id) => {
    const { result } = solve(id);
    expect(result.trace.some((event) => event.type === 'genomic-propagation-prune')).toBe(true);
  });

  test('forward-reachable bridge keeps A to B searchable', () => {
    const { result } = solve('cp2-plus-forward-bridge');
    expect(result.bestPath).toEqual(['A', 'B', 'C']);
    expect(result.trace.some(
      (event) => event.type === 'genomic-propagation-prune' && event.currentPath.join(',') === 'A,B'
    )).toBe(false);
  });

  test('multi-component recovery retains the three-component A to B to C prefix', () => {
    const { result } = solve('cp2-plus-multi-component');
    const check = result.trace.find(
      (event) => event.type === 'genomic-propagation-check' && event.currentPath.join(',') === 'A,B,C'
    );
    expect(check?.genomicComponents).toEqual([['A'], ['B'], ['C']]);
    expect(check?.forwardReachable).toEqual(['X', 'Y']);
    expect(result.trace.some(
      (event) => event.type === 'genomic-propagation-prune' && event.currentPath.join(',') === 'A,B,C'
    )).toBe(false);
  });

  test('directed dead end produces the original CP2 bound prune', () => {
    const { result } = solve('cp2-plus-directed-dead-end');
    expect(result.trace.some((event) => event.type === 'bound-pruning')).toBe(true);
    expect(result.counters.directedBoundPrunes).toBeGreaterThan(0);
  });

  test('lexicographic tie matches CP2 and Legacy exactly', () => {
    const { example, result } = solve('cp2-plus-lexical-tie');
    const cp2 = solveCP2(example.vertices, example.edgesD, example.edgesG, { maxEvents: 200000 });
    const legacy = solveConsistentPath(example.vertices, example.edgesD, example.edgesG);
    expect(result.bestPath).toEqual(['A', 'C']);
    expect(result.bestPath).toEqual(cp2.bestPath);
    expect(result.bestPath).toEqual(legacy.longestConsistentPath);
  });

  test.each(cp2PlusTeachingExamples)('$id remains a valid exact CP2+ instance', (example) => {
    const result = solveCP2Plus(example.vertices, example.edgesD, example.edgesG, { maxEvents: 200000 });
    expect(result.status).toBe('optimal');
    expect(result.proofCompleteEmitted).toBe(true);
    expect(result.bestPath).not.toBeNull();
    expect(isInducedGConnected(result.bestPath!, example.edgesG)).toBe(true);
  });

  test('dense genomic graph performs checks without genomic pruning', () => {
    const { result } = solve('cp2-plus-dense-genomic');
    expect(result.counters.genomicPropagationChecks).toBeGreaterThan(0);
    expect(result.counters.genomicPropagationPrunes).toBe(0);
  });
});
