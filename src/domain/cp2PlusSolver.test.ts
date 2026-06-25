import { describe, expect, test } from 'vitest';
import { examples } from '../data/examples';
import { solveAlgoBBPlusPlus } from './algoBBPlusPlus';
import { solveCP1 } from './cpSolver';
import { solveCP2 } from './cp2Solver';
import {
  collectForwardReachable,
  inspectGenomicPropagation,
  solveCP2Plus,
} from './cp2PlusSolver';
import { solveILP1 } from './ilp1Solver';
import { solveILP2 } from './ilp2Solver';
import { isInducedGConnected, solveConsistentPath } from './pathAlgorithms';
import { solveSubsetDP } from './subsetDpSolver';

type CaseDef = {
  vertices: string[];
  edgesD: { from: string; to: string }[];
  edgesG: { u: string; v: string }[];
};

const repairable: CaseDef = {
  vertices: ['A', 'B', 'C'],
  edgesD: [{ from: 'A', to: 'B' }, { from: 'B', to: 'C' }],
  edgesG: [{ u: 'A', v: 'C' }, { u: 'B', v: 'C' }],
};

const unreachableBridge: CaseDef = {
  vertices: ['A', 'B', 'C'],
  edgesD: [{ from: 'A', to: 'B' }],
  edgesG: [{ u: 'A', v: 'C' }, { u: 'B', v: 'C' }],
};

const backwardOnlyBridge: CaseDef = {
  vertices: ['C', 'A', 'B'],
  edgesD: [{ from: 'C', to: 'A' }, { from: 'A', to: 'B' }],
  edgesG: [{ u: 'A', v: 'C' }, { u: 'B', v: 'C' }],
};

function adjacency(vertices: string[], edges: { from: string; to: string }[]) {
  const result: Record<string, string[]> = Object.fromEntries(vertices.map((vertex) => [vertex, []]));
  for (const edge of edges) result[edge.from].push(edge.to);
  return result;
}

function genomicAdjacency(vertices: string[], edges: { u: string; v: string }[]) {
  const result: Record<string, string[]> = Object.fromEntries(vertices.map((vertex) => [vertex, []]));
  for (const edge of edges) {
    result[edge.u].push(edge.v);
    result[edge.v].push(edge.u);
  }
  return result;
}

function generatedCorpus(size: number): CaseDef[] {
  return Array.from({ length: size }, (_, caseIndex) => {
    const n = 2 + (caseIndex % 4);
    const vertices = Array.from({ length: n }, (_, index) => `R${index + 1}`);
    const edgesD: CaseDef['edgesD'] = [];
    const edgesG: CaseDef['edgesG'] = [];
    for (let left = 0; left < n; left++) {
      for (let right = left + 1; right < n; right++) {
        if (((caseIndex + 3) * (left + 5) + right * 7) % 11 < 5) {
          edgesD.push({ from: vertices[left], to: vertices[right] });
        }
        if (((caseIndex + 7) * (left + 2) + right * 13) % 17 < 7) {
          edgesG.push({ u: vertices[left], v: vertices[right] });
        }
      }
    }
    return { vertices, edgesD, edgesG };
  });
}

describe('CP2+ safe genomic-feasibility propagation', () => {
  test('keeps a disconnected prefix when a forward-reachable bridge can repair it', () => {
    const result = solveCP2Plus(repairable.vertices, repairable.edgesD, repairable.edgesG);
    const check = result.trace.find(
      (event) => event.type === 'genomic-propagation-check' && event.currentPath.join(',') === 'A,B'
    );

    expect(result.bestPath).toEqual(['A', 'B', 'C']);
    expect(check?.forwardReachable).toEqual(['C']);
    expect(check?.genomicComponents).toEqual([['A'], ['B']]);
    expect(result.trace.some(
      (event) => event.type === 'genomic-propagation-prune' && event.currentPath.join(',') === 'A,B'
    )).toBe(false);
  });

  test('prunes when the only genomic bridge is unreachable after last', () => {
    const result = solveCP2Plus(unreachableBridge.vertices, unreachableBridge.edgesD, unreachableBridge.edgesG);
    const prune = result.trace.find(
      (event) => event.type === 'genomic-propagation-prune' && event.currentPath.join(',') === 'A,B'
    );

    expect(prune?.forwardReachable).toEqual([]);
    expect(prune?.genomicComponents).toEqual([['A'], ['B']]);
    expect(prune?.message).toContain('SAFE GENOMIC PRUNE');
    expect(result.counters.genomicPropagationPrunes).toBeGreaterThan(0);
  });

  test('does not count a backward-only bridge as forward reachable', () => {
    const result = solveCP2Plus(backwardOnlyBridge.vertices, backwardOnlyBridge.edgesD, backwardOnlyBridge.edgesG);
    const prune = result.trace.find(
      (event) => event.type === 'genomic-propagation-prune' && event.currentPath.join(',') === 'A,B'
    );

    expect(prune?.forwardReachable).toEqual([]);
    expect(prune?.genomicComponents).toEqual([['A'], ['B']]);
  });

  test('never includes used path vertices in F', () => {
    const adjD = adjacency(
      ['A', 'B', 'C', 'D'],
      [{ from: 'A', to: 'B' }, { from: 'B', to: 'A' }, { from: 'B', to: 'C' }, { from: 'C', to: 'D' }]
    );
    expect(collectForwardReachable(['A', 'B'], adjD)).toEqual(['C', 'D']);
  });

  test('does not genomic-prune already connected paths', () => {
    const input: CaseDef = {
      vertices: ['A', 'B', 'C'],
      edgesD: [{ from: 'A', to: 'B' }, { from: 'B', to: 'C' }],
      edgesG: [{ u: 'A', v: 'B' }],
    };
    const result = solveCP2Plus(input.vertices, input.edgesD, input.edgesG);
    expect(result.trace.some(
      (event) => event.type === 'genomic-propagation-prune' && event.currentPath.join(',') === 'A,B'
    )).toBe(false);
  });

  test('empty and singleton states remain valid', () => {
    const adjD = adjacency(['A'], []);
    const adjG = genomicAdjacency(['A'], []);
    expect(inspectGenomicPropagation([], adjD, adjG).canReconnect).toBe(true);
    expect(inspectGenomicPropagation(['A'], adjD, adjG)).toEqual({
      forwardReachable: [],
      genomicComponents: [['A']],
      canReconnect: true,
    });
    expect(solveCP2Plus(['A'], [], []).bestPath).toEqual(['A']);
  });

  test.each(examples)('matches CP2 and Legacy on existing example $id', (input) => {
    const plus = solveCP2Plus(input.vertices, input.edgesD, input.edgesG, { maxEvents: 200000 });
    const cp2 = solveCP2(input.vertices, input.edgesD, input.edgesG, { maxEvents: 200000 });
    const legacy = solveConsistentPath(input.vertices, input.edgesD, input.edgesG);
    expect(plus.status).not.toBe('incomplete');
    expect(plus.bestPath).toEqual(cp2.bestPath);
    expect(plus.bestPath).toEqual(legacy.longestConsistentPath);
  });

  test('matches every comparable exact method on a controlled 64-case corpus', () => {
    const corpus = generatedCorpus(64);
    const metrics = {
      objectiveMismatches: 0,
      winnerMismatches: 0,
      validityMismatches: 0,
      uncappedIncompleteRuns: 0,
    };

    for (const input of corpus) {
      const plus = solveCP2Plus(input.vertices, input.edgesD, input.edgesG, { maxEvents: 200000 });
      const legacy = solveConsistentPath(input.vertices, input.edgesD, input.edgesG);
      const results = [
        plus,
        solveCP1(input.vertices, input.edgesD, input.edgesG, 200000),
        solveCP2(input.vertices, input.edgesD, input.edgesG, { maxEvents: 200000 }),
        solveAlgoBBPlusPlus(input.vertices, input.edgesD, input.edgesG, { maxEvents: 200000 }),
        solveILP1(input.vertices, input.edgesD, input.edgesG, { maxEvents: 200000 }),
        solveILP2(input.vertices, input.edgesD, input.edgesG, { maxEvents: 200000 }),
        solveSubsetDP(input.vertices, input.edgesD, input.edgesG, { maxEvents: 200000 }),
      ];
      const expected = legacy.longestConsistentPath ?? [];

      if (results.some((result) => result.status === 'incomplete')) metrics.uncappedIncompleteRuns++;
      if (results.some((result) => (result.bestPath?.length ?? 0) !== expected.length)) metrics.objectiveMismatches++;
      if (results.some((result) => JSON.stringify(result.bestPath ?? []) !== JSON.stringify(expected))) metrics.winnerMismatches++;
      if (plus.bestPath && !isInducedGConnected(plus.bestPath, input.edgesG)) metrics.validityMismatches++;
    }

    expect(metrics).toEqual({
      objectiveMismatches: 0,
      winnerMismatches: 0,
      validityMismatches: 0,
      uncappedIncompleteRuns: 0,
    });
  });

  test('cap returns incomplete without proof completion and preserves an incumbent', () => {
    const full = solveCP2Plus(repairable.vertices, repairable.edgesD, repairable.edgesG, { maxEvents: 1000 });
    const incumbentIndex = full.trace.findIndex((event) => event.type === 'incumbent-update');
    const capped = solveCP2Plus(repairable.vertices, repairable.edgesD, repairable.edgesG, {
      maxEvents: incumbentIndex + 1,
    });

    expect(capped.status).toBe('incomplete');
    expect(capped.bestPath).not.toBeNull();
    expect(capped.proofCompleteEmitted).toBe(false);
    expect(capped.trace.some((event) => event.type === 'proof-complete')).toBe(false);
  });

  test('cancellation returns incomplete without proof completion', () => {
    let calls = 0;
    const result = solveCP2Plus(repairable.vertices, repairable.edgesD, repairable.edgesG, {
      shouldCancel: () => ++calls > 6,
    });
    expect(result.status).toBe('incomplete');
    expect(result.cancelled).toBe(true);
    expect(result.proofCompleteEmitted).toBe(false);
    expect(result.trace.some((event) => event.type === 'proof-complete')).toBe(false);
  });

  test('reports a nonzero dedicated genomic prune count', () => {
    const result = solveCP2Plus(unreachableBridge.vertices, unreachableBridge.edgesD, unreachableBridge.edgesG);
    expect(result.counters.genomicPropagationPrunes).toBeGreaterThan(0);
    expect(result.counters.eventsEmitted).toBe(result.trace.length);
  });
});
