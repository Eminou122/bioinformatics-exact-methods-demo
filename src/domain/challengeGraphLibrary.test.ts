import { describe, expect, test } from 'vitest';
import { CHALLENGE_GRAPHS, getChallengeGraph } from './challengeGraphLibrary';
import { hasCycle } from './graph';
import { solveCP2Plus } from './cp2PlusSolver';

function edgeKey(edge: { u: string; v: string }) {
  return [edge.u, edge.v].sort().join('--');
}

describe('challenge graph library', () => {
  test('every named challenge graph is deterministic', () => {
    for (const graph of CHALLENGE_GRAPHS) {
      expect(getChallengeGraph(graph.id)).toEqual(graph);
    }
  });

  test('each challenge graph keeps shared vertices, acyclic D, undirected G, and distinct D/G structure', () => {
    for (const graph of CHALLENGE_GRAPHS) {
      const vertices = new Set(graph.vertices);
      expect(graph.variant === 'small' || graph.variant === 'medium').toBe(true);
      expect(hasCycle(graph.vertices, graph.edgesD)).toBe(false);
      expect(graph.edgesD.every((edge) => vertices.has(edge.from) && vertices.has(edge.to))).toBe(true);
      expect(graph.edgesG.every((edge) => vertices.has(edge.u) && vertices.has(edge.v) && edge.u < edge.v)).toBe(true);
      expect(new Set(graph.edgesG.map(edgeKey)).size).toBe(graph.edgesG.length);
      expect(JSON.stringify(graph.edgesD)).not.toBe(JSON.stringify(graph.edgesG));
    }
  });

  test('fragmented and repairable families preserve their intended CP2+ behavior', () => {
    const fragmented = getChallengeGraph('fragmented-genomic-components-small')!;
    const repairable = getChallengeGraph('repairable-future-genomic-bridge-small')!;

    const fragmentedResult = solveCP2Plus(fragmented.vertices, fragmented.edgesD, fragmented.edgesG);
    const repairableResult = solveCP2Plus(repairable.vertices, repairable.edgesD, repairable.edgesG);

    expect(fragmentedResult.trace.some((event) => event.type === 'genomic-propagation-prune')).toBe(true);
    expect(repairableResult.status).toBe('optimal');
    expect(repairableResult.proofCompleteEmitted).toBe(true);
    expect(repairableResult.trace.some((event) => event.type === 'genomic-propagation-prune')).toBe(false);
  });
});
