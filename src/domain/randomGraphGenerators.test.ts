import { describe, test, expect } from 'vitest';
import { hasCycle } from './graph';
import {
  generateAcyclicErdosRenyiGraph,
  generateAcyclicScaleFreeGraph,
} from './randomGraphGenerators';

describe('Deterministic Educational Graph Generators', () => {
  describe('Erdős–Rényi acyclic generator', () => {
    test('same seed and parameters produce deeply equal graph (determinism)', () => {
      const a = generateAcyclicErdosRenyiGraph({ n: 6, pD: 0.5, pG: 0.4, seed: 42 });
      const b = generateAcyclicErdosRenyiGraph({ n: 6, pD: 0.5, pG: 0.4, seed: 42 });
      expect(a).toEqual(b);
    });

    test('different seeds produce at least one structural difference (determinism)', () => {
      const a = generateAcyclicErdosRenyiGraph({ n: 8, pD: 0.5, pG: 0.5, seed: 1 });
      const b = generateAcyclicErdosRenyiGraph({ n: 8, pD: 0.5, pG: 0.5, seed: 2 });
      expect(a.topologicalOrder).not.toEqual(b.topologicalOrder);
    });

    test('generated D graph is acyclic (hasCycle check)', () => {
      const g = generateAcyclicErdosRenyiGraph({ n: 10, pD: 0.7, pG: 0.0, seed: 99 });
      expect(hasCycle(g.vertices, g.edgesD)).toBe(false);
    });

    test('every D arc points forward in the stored topological order', () => {
      const g = generateAcyclicErdosRenyiGraph({ n: 8, pD: 0.8, pG: 0.3, seed: 7 });
      const pos: Record<string, number> = {};
      g.topologicalOrder.forEach((v, i) => { pos[v] = i; });
      for (const { from, to } of g.edgesD) {
        expect(pos[from]).toBeLessThan(pos[to]);
      }
    });

    test('all returned data is JSON serializable', () => {
      const g = generateAcyclicErdosRenyiGraph({ n: 5, pD: 0.5, pG: 0.5, seed: 13 });
      expect(() => JSON.parse(JSON.stringify(g))).not.toThrow();
      expect(JSON.parse(JSON.stringify(g))).toEqual(g);
    });

    test('statistics exactly match emitted arrays', () => {
      const g = generateAcyclicErdosRenyiGraph({ n: 7, pD: 0.6, pG: 0.4, seed: 55 });
      expect(g.statistics.vertexCount).toBe(g.vertices.length);
      expect(g.statistics.directedEdgeCount).toBe(g.edgesD.length);
      expect(g.statistics.genomicEdgeCount).toBe(g.edgesG.length);
    });

    test('no duplicate D arcs, duplicate G edges, self-loops, or unknown endpoints', () => {
      const g = generateAcyclicErdosRenyiGraph({ n: 8, pD: 0.9, pG: 0.9, seed: 33 });
      const vSet = new Set(g.vertices);
      const seenD = new Set<string>();
      for (const { from, to } of g.edgesD) {
        expect(from).not.toBe(to);
        expect(vSet.has(from)).toBe(true);
        expect(vSet.has(to)).toBe(true);
        const key = `${from}->${to}`;
        expect(seenD.has(key)).toBe(false);
        seenD.add(key);
      }
      const seenG = new Set<string>();
      for (const { u, v } of g.edgesG) {
        expect(u).not.toBe(v);
        expect(vSet.has(u)).toBe(true);
        expect(vSet.has(v)).toBe(true);
        const [a, b] = [u, v].sort();
        const key = `${a}--${b}`;
        expect(seenG.has(key)).toBe(false);
        seenG.add(key);
      }
    });

    test('pD=0 pG=0 yields no edges', () => {
      const g = generateAcyclicErdosRenyiGraph({ n: 5, pD: 0, pG: 0, seed: 1 });
      expect(g.edgesD).toHaveLength(0);
      expect(g.edgesG).toHaveLength(0);
    });

    test('pD=1 pG=1 yields all possible forward arcs and all possible G edges', () => {
      const n = 5;
      const g = generateAcyclicErdosRenyiGraph({ n, pD: 1, pG: 1, seed: 1 });
      const maxPairs = (n * (n - 1)) / 2;
      expect(g.edgesD).toHaveLength(maxPairs);
      expect(g.edgesG).toHaveLength(maxPairs);
    });

    test('n=1 yields single vertex and no edges', () => {
      const g = generateAcyclicErdosRenyiGraph({ n: 1, pD: 1, pG: 1, seed: 1 });
      expect(g.vertices).toHaveLength(1);
      expect(g.edgesD).toHaveLength(0);
      expect(g.edgesG).toHaveLength(0);
      expect(g.family).toBe('acyclic-erdos-renyi');
    });

    test('invalid parameters are rejected with clear errors', () => {
      expect(() => generateAcyclicErdosRenyiGraph({ n: 0, pD: 0.5, pG: 0.5, seed: 1 })).toThrow();
      expect(() => generateAcyclicErdosRenyiGraph({ n: -1, pD: 0.5, pG: 0.5, seed: 1 })).toThrow();
      expect(() => generateAcyclicErdosRenyiGraph({ n: 1.5, pD: 0.5, pG: 0.5, seed: 1 })).toThrow();
      expect(() => generateAcyclicErdosRenyiGraph({ n: 5, pD: -0.1, pG: 0.5, seed: 1 })).toThrow();
      expect(() => generateAcyclicErdosRenyiGraph({ n: 5, pD: 1.1, pG: 0.5, seed: 1 })).toThrow();
      expect(() => generateAcyclicErdosRenyiGraph({ n: 5, pD: 0.5, pG: -0.1, seed: 1 })).toThrow();
      expect(() => generateAcyclicErdosRenyiGraph({ n: 5, pD: 0.5, pG: 1.1, seed: 1 })).toThrow();
      expect(() => generateAcyclicErdosRenyiGraph({ n: 5, pD: 0.5, pG: 0.5, seed: 1.5 })).toThrow();
      expect(() => generateAcyclicErdosRenyiGraph({ n: 5, pD: NaN, pG: 0.5, seed: 1 })).toThrow();
      expect(() => generateAcyclicErdosRenyiGraph({ n: 5, pD: Infinity, pG: 0.5, seed: 1 })).toThrow();
    });
  });

  describe('Scale-free-style acyclic generator', () => {
    test('same seed and parameters produce deeply equal graph (determinism)', () => {
      const a = generateAcyclicScaleFreeGraph({ n: 8, m: 2, seed: 42 });
      const b = generateAcyclicScaleFreeGraph({ n: 8, m: 2, seed: 42 });
      expect(a).toEqual(b);
    });

    test('different seeds produce at least one structural difference (determinism)', () => {
      const a = generateAcyclicScaleFreeGraph({ n: 10, m: 3, seed: 100 });
      const b = generateAcyclicScaleFreeGraph({ n: 10, m: 3, seed: 200 });
      expect(a.topologicalOrder).not.toEqual(b.topologicalOrder);
    });

    test('generated D graph is acyclic (hasCycle check)', () => {
      const g = generateAcyclicScaleFreeGraph({ n: 12, m: 3, seed: 77 });
      expect(hasCycle(g.vertices, g.edgesD)).toBe(false);
    });

    test('every D arc points forward in the stored topological order', () => {
      const g = generateAcyclicScaleFreeGraph({ n: 10, m: 3, seed: 5 });
      const pos: Record<string, number> = {};
      g.topologicalOrder.forEach((v, i) => { pos[v] = i; });
      for (const { from, to } of g.edgesD) {
        expect(pos[from]).toBeLessThan(pos[to]);
      }
    });

    test('all returned data is JSON serializable', () => {
      const g = generateAcyclicScaleFreeGraph({ n: 6, m: 2, seed: 13 });
      expect(() => JSON.parse(JSON.stringify(g))).not.toThrow();
      expect(JSON.parse(JSON.stringify(g))).toEqual(g);
    });

    test('statistics exactly match emitted arrays', () => {
      const g = generateAcyclicScaleFreeGraph({ n: 7, m: 2, seed: 55 });
      expect(g.statistics.vertexCount).toBe(g.vertices.length);
      expect(g.statistics.directedEdgeCount).toBe(g.edgesD.length);
      expect(g.statistics.genomicEdgeCount).toBe(g.edgesG.length);
    });

    test('no duplicate D arcs, duplicate G edges, self-loops, or unknown endpoints', () => {
      const g = generateAcyclicScaleFreeGraph({ n: 8, m: 4, seed: 33 });
      const vSet = new Set(g.vertices);
      const seenD = new Set<string>();
      for (const { from, to } of g.edgesD) {
        expect(from).not.toBe(to);
        expect(vSet.has(from)).toBe(true);
        expect(vSet.has(to)).toBe(true);
        const key = `${from}->${to}`;
        expect(seenD.has(key)).toBe(false);
        seenD.add(key);
      }
      const seenG = new Set<string>();
      for (const { u, v } of g.edgesG) {
        expect(u).not.toBe(v);
        expect(vSet.has(u)).toBe(true);
        expect(vSet.has(v)).toBe(true);
        const [a, b] = [u, v].sort();
        const key = `${a}--${b}`;
        expect(seenG.has(key)).toBe(false);
        seenG.add(key);
      }
    });

    test('n=1 yields single vertex and no edges', () => {
      const g = generateAcyclicScaleFreeGraph({ n: 1, m: 3, seed: 1 });
      expect(g.vertices).toHaveLength(1);
      expect(g.edgesD).toHaveLength(0);
      expect(g.edgesG).toHaveLength(0);
      expect(g.family).toBe('acyclic-scale-free');
    });

    test('m=0 yields no edges regardless of vertex count', () => {
      const g = generateAcyclicScaleFreeGraph({ n: 8, m: 0, seed: 1 });
      expect(g.edgesD).toHaveLength(0);
      expect(g.edgesG).toHaveLength(0);
    });

    test('m larger than available earlier vertices is clamped safely without error', () => {
      const g = generateAcyclicScaleFreeGraph({ n: 4, m: 100, seed: 7 });
      // max edges = 0+1+2+3 = 6 for both D and G
      expect(g.edgesD.length).toBeLessThanOrEqual(6);
      expect(g.edgesG.length).toBeLessThanOrEqual(6);
      expect(hasCycle(g.vertices, g.edgesD)).toBe(false);
    });

    test('invalid parameters are rejected with clear errors', () => {
      expect(() => generateAcyclicScaleFreeGraph({ n: 0, m: 2, seed: 1 })).toThrow();
      expect(() => generateAcyclicScaleFreeGraph({ n: -1, m: 2, seed: 1 })).toThrow();
      expect(() => generateAcyclicScaleFreeGraph({ n: 1.5, m: 2, seed: 1 })).toThrow();
      expect(() => generateAcyclicScaleFreeGraph({ n: 5, m: -1, seed: 1 })).toThrow();
      expect(() => generateAcyclicScaleFreeGraph({ n: 5, m: 1.5, seed: 1 })).toThrow();
      expect(() => generateAcyclicScaleFreeGraph({ n: 5, m: 2, seed: 1.5 })).toThrow();
      expect(() => generateAcyclicScaleFreeGraph({ n: 5, m: 2, seed: NaN })).toThrow();
    });
  });
});
