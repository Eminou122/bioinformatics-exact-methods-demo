import { describe, test, expect } from 'vitest';
import { hasCycle } from './graph';
import {
  enumeratePaths,
  isInducedGConnected,
  comparePaths,
  solveConsistentPath,
} from './pathAlgorithms';

describe('Biomethods Path Algorithms', () => {
  // 1. Cycle detection
  test('cycle detection detects cyclic and acyclic graphs correctly', () => {
    const vertices = ['R1', 'R2', 'R3'];
    const acyclicEdges = [
      { from: 'R1', to: 'R2' },
      { from: 'R2', to: 'R3' },
    ];
    const cyclicEdges = [
      { from: 'R1', to: 'R2' },
      { from: 'R2', to: 'R3' },
      { from: 'R3', to: 'R1' },
    ];

    expect(hasCycle(vertices, acyclicEdges)).toBe(false);
    expect(hasCycle(vertices, cyclicEdges)).toBe(true);
  });

  // 2. Simple directed path enumeration & uniqueness
  test('every simple directed path is enumerated and there are no duplicate paths', () => {
    const vertices = ['R1', 'R2', 'R3'];
    const edges = [
      { from: 'R1', to: 'R2' },
      { from: 'R2', to: 'R3' },
    ];

    const paths = enumeratePaths(vertices, edges);
    
    // Total expected paths:
    // Starting R1: [R1], [R1, R2], [R1, R2, R3]
    // Starting R2: [R2], [R2, R3]
    // Starting R3: [R3]
    expect(paths.length).toBe(6);

    const pathStrings = paths.map((p) => p.join(','));
    const uniquePaths = new Set(pathStrings);
    expect(uniquePaths.size).toBe(6); // No duplicate paths

    expect(pathStrings).toContain('R1');
    expect(pathStrings).toContain('R1,R2');
    expect(pathStrings).toContain('R1,R2,R3');
    expect(pathStrings).toContain('R2');
    expect(pathStrings).toContain('R2,R3');
    expect(pathStrings).toContain('R3');
  });

  // 3. Branching and merging DAG behavior
  test('branching and merging DAG behavior is handled correctly', () => {
    const vertices = ['R1', 'R2', 'R3', 'R4'];
    const edges = [
      { from: 'R1', to: 'R2' },
      { from: 'R1', to: 'R3' },
      { from: 'R2', to: 'R4' },
      { from: 'R3', to: 'R4' },
    ];

    const paths = enumeratePaths(vertices, edges).map((p) => p.join(','));
    expect(paths).toContain('R1,R2,R4');
    expect(paths).toContain('R1,R3,R4');
  });

  // 4. Singleton path connectivity
  test('singleton path connectivity is always true', () => {
    const edgesG = [{ u: 'R1', v: 'R2' }];
    expect(isInducedGConnected(['R1'], edgesG)).toBe(true);
    expect(isInducedGConnected(['R2'], edgesG)).toBe(true);
  });

  // 5. Valid induced connectivity
  test('valid induced connectivity detects connected components in G', () => {
    const edgesG = [
      { u: 'R1', v: 'R2' },
      { u: 'R2', v: 'R3' },
    ];
    expect(isInducedGConnected(['R1', 'R2', 'R3'], edgesG)).toBe(true);
  });

  // 6. Isolated selected vertex rejection
  test('isolated selected vertex rejection rejects paths with isolated nodes in G', () => {
    const edgesG = [
      { u: 'R1', v: 'R2' },
      // R3 is isolated
    ];
    expect(isInducedGConnected(['R1', 'R2', 'R3'], edgesG)).toBe(false);
  });

  // 7. Unselected vertices must not affect induced connectivity
  test('unselected vertices do not affect induced connectivity', () => {
    const edgesG = [
      { u: 'R1', v: 'R2' },
      { u: 'R2', v: 'R3' },
    ];

    // R2 is unselected, which breaks connection between R1 and R3 in the induced graph
    expect(isInducedGConnected(['R1', 'R3'], edgesG)).toBe(false);

    // R3 is unselected, but R1-R2 is connected in G
    expect(isInducedGConnected(['R1', 'R2'], edgesG)).toBe(true);
  });

  // 8. Deterministic tie-break behavior
  test('deterministic tie-break behavior orders paths correctly', () => {
    // 1st rule: greater number of vertices (longer)
    const longPath = ['R1', 'R2', 'R3'];
    const shortPath = ['R1', 'R2'];
    expect(comparePaths(longPath, shortPath)).toBeLessThan(0); // longPath is better (first)
    expect(comparePaths(shortPath, longPath)).toBeGreaterThan(0);

    // 2nd rule: compare reaction IDs lexicographically
    const pathA = ['R1', 'R2'];
    const pathB = ['R1', 'R3'];
    expect(comparePaths(pathA, pathB)).toBeLessThan(0); // pathA is better ('R2' < 'R3')
    expect(comparePaths(pathB, pathA)).toBeGreaterThan(0);

    const pathC = ['R2', 'R3'];
    const pathD = ['R1', 'R4'];
    expect(comparePaths(pathC, pathD)).toBeGreaterThan(0); // pathD is better because 'R1' < 'R2'
  });

  // 9. Expected outcomes for all three datasets
  test('Expected outcomes for Dataset 1: Simple valid example', () => {
    const vertices = ['R1', 'R2', 'R3', 'R4'];
    const edgesD = [
      { from: 'R1', to: 'R2' },
      { from: 'R2', to: 'R3' },
      { from: 'R3', to: 'R4' },
    ];
    const edgesG = [
      { u: 'R1', v: 'R2' },
      { u: 'R2', v: 'R3' },
      { u: 'R3', v: 'R4' },
    ];

    const result = solveConsistentPath(vertices, edgesD, edgesG);
    expect(result.longestPathD).toEqual(['R1', 'R2', 'R3', 'R4']);
    expect(result.longestConsistentPath).toEqual(['R1', 'R2', 'R3', 'R4']);
  });

  test('Expected outcomes for Dataset 2: Longest path rejected', () => {
    const vertices = ['R1', 'R2', 'R3', 'R4', 'R5'];
    const edgesD = [
      { from: 'R1', to: 'R2' },
      { from: 'R2', to: 'R3' },
      { from: 'R3', to: 'R4' },
      { from: 'R2', to: 'R5' },
    ];
    const edgesG = [
      { u: 'R1', v: 'R2' },
      { u: 'R2', v: 'R3' },
      { u: 'R2', v: 'R5' },
      // R4 is isolated in G
    ];

    const result = solveConsistentPath(vertices, edgesD, edgesG);
    // Longest path in D is R1->R2->R3->R4 (length 4)
    expect(result.longestPathD).toEqual(['R1', 'R2', 'R3', 'R4']);
    // But it's disconnected in G because R4 is isolated.
    // Longest consistent path is R1->R2->R3 (length 3, or R1->R2->R5, length 3)
    // Between R1->R2->R3 and R1->R2->R5, lexicographical tiebreaker prefers R1->R2->R3
    expect(result.longestConsistentPath).toEqual(['R1', 'R2', 'R3']);
  });

  test('Expected outcomes for Dataset 3: Multiple candidate paths', () => {
    const vertices = ['R1', 'R2', 'R3', 'R4', 'R5', 'R6'];
    const edgesD = [
      { from: 'R1', to: 'R2' },
      { from: 'R2', to: 'R4' },
      { from: 'R1', to: 'R3' },
      { from: 'R3', to: 'R4' },
      { from: 'R2', to: 'R5' },
      { from: 'R5', to: 'R6' },
    ];
    const edgesG = [
      { u: 'R1', v: 'R2' },
      { u: 'R2', v: 'R4' },
      { u: 'R1', v: 'R3' },
      { u: 'R3', v: 'R4' },
      { u: 'R2', v: 'R5' },
      { u: 'R5', v: 'R6' },
    ];

    const result = solveConsistentPath(vertices, edgesD, edgesG);
    // Expected winner is R1->R2->R5->R6 (length 4)
    expect(result.longestConsistentPath).toEqual(['R1', 'R2', 'R5', 'R6']);
  });
});
