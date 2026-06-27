import { describe, expect, test } from 'vitest';
import { hasCycle } from './graph';
import { HARD_RANDOM_GRAPH_CORPUS, generateHardRandomGraph } from './hardRandomGraphCorpus';

function gKey(edge: { u: string; v: string }) {
  return `${edge.u}--${edge.v}`;
}

function reachableFrom(start: string, edgesD: { from: string; to: string }[]): Set<string> {
  const adj = new Map<string, string[]>();
  for (const edge of edgesD) adj.set(edge.from, [...(adj.get(edge.from) || []), edge.to]);
  const seen = new Set<string>([start]);
  const stack = [...(adj.get(start) || [])];
  while (stack.length > 0) {
    const next = stack.pop()!;
    if (seen.has(next)) continue;
    seen.add(next);
    stack.push(...(adj.get(next) || []));
  }
  return seen;
}

describe('hard random graph corpus', () => {
  test('has the planned deterministic tier counts', () => {
    expect(HARD_RANDOM_GRAPH_CORPUS.filter((spec) => spec.tier === 'S')).toHaveLength(20);
    expect(HARD_RANDOM_GRAPH_CORPUS.filter((spec) => spec.tier === 'M')).toHaveLength(20);
    expect(HARD_RANDOM_GRAPH_CORPUS.filter((spec) => spec.tier === 'L')).toHaveLength(10);
    for (const spec of HARD_RANDOM_GRAPH_CORPUS) {
      expect(generateHardRandomGraph(spec)).toEqual(generateHardRandomGraph(spec));
      expect(spec.allowedSolvers).toContain('CP2');
      expect(spec.allowedSolvers).toContain('CP2+');
    }
  });

  test('every case has shared vertices, acyclic D, and undirected G', () => {
    for (const spec of HARD_RANDOM_GRAPH_CORPUS) {
      const graph = generateHardRandomGraph(spec);
      const vertices = new Set(graph.vertices);
      expect(hasCycle(graph.vertices, graph.edgesD)).toBe(false);
      expect(graph.edgesD.every((edge) => vertices.has(edge.from) && vertices.has(edge.to))).toBe(true);
      expect(graph.edgesG.every((edge) => vertices.has(edge.u) && vertices.has(edge.v) && edge.u < edge.v)).toBe(true);
      expect(new Set(graph.edgesG.map(gKey)).size).toBe(graph.edgesG.length);
    }
  });

  test('small-D-core / huge-G case has a large shared vertex set and tiny reachable D core', () => {
    const spec = HARD_RANDOM_GRAPH_CORPUS.find((candidate) => candidate.caseId === 'hard-stress-core-huge-g-67')!;
    const graph = generateHardRandomGraph(spec);
    const reachable = reachableFrom(graph.topologicalOrder[0], graph.edgesD);

    expect(graph.vertices).toHaveLength(67);
    expect(reachable.size).toBeGreaterThanOrEqual(4);
    expect(reachable.size).toBeLessThanOrEqual(6);
    expect(graph.edgesG.length).toBeGreaterThan(graph.edgesD.length * 20);
  });

  test('solver tier limits keep ILP2 and ILP2+ off stress cases', () => {
    for (const spec of HARD_RANDOM_GRAPH_CORPUS) {
      if (spec.tier === 'L') {
        expect(spec.allowedSolvers).toEqual(['CP2', 'CP2+']);
      } else {
        expect(spec.allowedSolvers).toContain('ILP2');
        expect(spec.allowedSolvers).toContain('ILP2+');
      }
    }
  });
});
