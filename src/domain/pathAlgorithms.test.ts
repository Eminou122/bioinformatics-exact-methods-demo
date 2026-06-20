import { describe, test, expect } from 'vitest';
import { hasCycle, validateGraphs } from './graph';
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

  // 2. Solver-level cycle rejection
  test('solver rejects graphs with cycles and stops safely', () => {
    const vertices = ['R1', 'R2', 'R3'];
    const cyclicEdges = [
      { from: 'R1', to: 'R2' },
      { from: 'R2', to: 'R3' },
      { from: 'R3', to: 'R1' },
    ];
    const edgesG = [
      { u: 'R1', v: 'R2' },
      { u: 'R2', v: 'R3' },
    ];

    const result = solveConsistentPath(vertices, cyclicEdges, edgesG);
    expect(result.error).toBeDefined();
    expect(result.error?.code).toBe('CYCLE_DETECTED');
    expect(result.allPaths).toEqual([]);
  });

  // 3. Node validation error
  test('solver rejects graphs with invalid vertices', () => {
    const vertices = ['R1', 'R2'];
    const edgesD = [{ from: 'R1', to: 'R3' }]; // R3 is invalid
    const edgesG = [{ u: 'R1', v: 'R2' }];

    const result = solveConsistentPath(vertices, edgesD, edgesG);
    expect(result.error).toBeDefined();
    expect(result.error?.code).toBe('INVALID_NODE_D');
    expect(result.error?.node).toBe('R3');
  });

  // 4. Duplicate edge rejection
  test('validation rejects duplicate edges', () => {
    const vertices = ['R1', 'R2'];
    const edgesD = [
      { from: 'R1', to: 'R2' },
      { from: 'R1', to: 'R2' }, // duplicate
    ];
    const edgesG = [{ u: 'R1', v: 'R2' }];

    const validation = validateGraphs(vertices, edgesD, edgesG);
    expect(validation.isValid).toBe(false);
    expect(validation.errorCode).toBe('DUPLICATE_EDGE_D');

    const edgesGDuplicate = [
      { u: 'R1', v: 'R2' },
      { u: 'R2', v: 'R1' }, // duplicate (undirected)
    ];
    const validationG = validateGraphs(vertices, [{ from: 'R1', to: 'R2' }], edgesGDuplicate);
    expect(validationG.isValid).toBe(false);
    expect(validationG.errorCode).toBe('DUPLICATE_EDGE_G');
  });

  // 5. Simple directed path enumeration & uniqueness
  test('every simple directed path is enumerated and there are no duplicate paths', () => {
    const vertices = ['R1', 'R2', 'R3'];
    const edges = [
      { from: 'R1', to: 'R2' },
      { from: 'R2', to: 'R3' },
    ];

    const paths = enumeratePaths(vertices, edges);
    
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

  // 6. Branching and merging DAG behavior
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

  // 7. Singleton path connectivity
  test('singleton path connectivity is always true', () => {
    const edgesG = [{ u: 'R1', v: 'R2' }];
    expect(isInducedGConnected(['R1'], edgesG)).toBe(true);
    expect(isInducedGConnected(['R2'], edgesG)).toBe(true);
  });

  // 8. Valid induced connectivity
  test('valid induced connectivity detects connected components in G using only path vertices', () => {
    const edgesG = [
      { u: 'R1', v: 'R2' },
      { u: 'R2', v: 'R3' },
    ];
    expect(isInducedGConnected(['R1', 'R2', 'R3'], edgesG)).toBe(true);
  });

  // 9. Isolated selected vertex rejection
  test('isolated selected vertex rejection rejects paths with isolated nodes in G', () => {
    const edgesG = [
      { u: 'R1', v: 'R2' },
      // R3 is isolated
    ];
    expect(isInducedGConnected(['R1', 'R2', 'R3'], edgesG)).toBe(false);
  });

  // 10. Unselected vertices must not affect induced connectivity
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

  // 11. Deterministic tie-break behavior
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
});
