import { describe, test, expect } from 'vitest';
import { examples } from './examples';
import { solveConsistentPath } from '../domain/pathAlgorithms';
import { validateGraphs, hasCycle } from '../domain/graph';

describe('Examples Datasets Verification', () => {
  test('all examples are structurally valid and are DAGs', () => {
    for (const ex of examples) {
      // 1. Validate vertices match edge definitions
      const validation = validateGraphs(ex.vertices, ex.edgesD, ex.edgesG);
      expect(validation.isValid).toBe(true);

      // 2. Validate metabolic graph is a DAG (acyclic)
      const isCyclic = hasCycle(ex.vertices, ex.edgesD);
      expect(isCyclic).toBe(false);
    }
  });

  test('Example 1 (simple-valide) has expected results', () => {
    const ex = examples.find((e) => e.id === 'simple-valide')!;
    expect(ex).toBeDefined();

    const result = solveConsistentPath(ex.vertices, ex.edgesD, ex.edgesG);

    // Expect longest path in D: R1 -> R2 -> R3 -> R4
    expect(result.longestPathD).toEqual(['R1', 'R2', 'R3', 'R4']);
    // Expect longest consistent path: R1 -> R2 -> R3 -> R4
    expect(result.longestConsistentPath).toEqual(['R1', 'R2', 'R3', 'R4']);
  });

  test('Example 2 (longest-rejected) has expected results', () => {
    const ex = examples.find((e) => e.id === 'longest-rejected')!;
    expect(ex).toBeDefined();

    const result = solveConsistentPath(ex.vertices, ex.edgesD, ex.edgesG);

    // Expect longest path in D: R1 -> R2 -> R3 -> R4
    expect(result.longestPathD).toEqual(['R1', 'R2', 'R3', 'R4']);
    // Expect longest consistent path: R1 -> R2 -> R3
    expect(result.longestConsistentPath).toEqual(['R1', 'R2', 'R3']);
  });

  test('Example 3 (multiple-candidates) has expected results', () => {
    const ex = examples.find((e) => e.id === 'multiple-candidates')!;
    expect(ex).toBeDefined();

    const result = solveConsistentPath(ex.vertices, ex.edgesD, ex.edgesG);

    // Expect longest consistent path: R1 -> R2 -> R5 -> R6 (length 4)
    expect(result.longestConsistentPath).toEqual(['R1', 'R2', 'R5', 'R6']);
  });
});
