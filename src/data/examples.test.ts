import { describe, test, expect } from 'vitest';
import { examples } from './examples';
import { solveConsistentPath } from '../domain/pathAlgorithms';

describe('Examples Datasets Verification', () => {
  test('all examples are structurally valid and are DAGs', () => {
    for (const ex of examples) {
      const result = solveConsistentPath(ex.vertices, ex.edgesD, ex.edgesG);
      // Ensure there are no validation or cycle errors
      expect(result.error).toBeUndefined();
    }
  });

  test('Example 1 (simple-valide) has expected results and exact counts', () => {
    const ex = examples.find((e) => e.id === 'simple-valide')!;
    expect(ex).toBeDefined();

    const result = solveConsistentPath(ex.vertices, ex.edgesD, ex.edgesG);

    // Expect longest path in D: R1 -> R2 -> R3 -> R4
    expect(result.longestPathD).toEqual(['R1', 'R2', 'R3', 'R4']);
    // Expect longest consistent path: R1 -> R2 -> R3 -> R4
    expect(result.longestConsistentPath).toEqual(['R1', 'R2', 'R3', 'R4']);

    // Exact oracle counts: 10 evaluated, 10 accepted
    expect(result.evaluatedPathsCount).toBe(10);
    expect(result.acceptedPathsCount).toBe(10);
  });

  test('Example 2 (longest-rejected) has expected results and exact counts', () => {
    const ex = examples.find((e) => e.id === 'longest-rejected')!;
    expect(ex).toBeDefined();

    const result = solveConsistentPath(ex.vertices, ex.edgesD, ex.edgesG);

    // Expect longest path in D: R1 -> R2 -> R3 -> R4
    expect(result.longestPathD).toEqual(['R1', 'R2', 'R3', 'R4']);
    // Expect longest consistent path: R1 -> R2 -> R3
    expect(result.longestConsistentPath).toEqual(['R1', 'R2', 'R3']);

    // Exact oracle counts: 13 evaluated, 10 accepted
    expect(result.evaluatedPathsCount).toBe(13);
    expect(result.acceptedPathsCount).toBe(10);
  });

  test('Example 3 (multiple-candidates) has expected results and exact counts', () => {
    const ex = examples.find((e) => e.id === 'multiple-candidates')!;
    expect(ex).toBeDefined();

    const result = solveConsistentPath(ex.vertices, ex.edgesD, ex.edgesG);

    // Expect longest consistent path: R1 -> R2 -> R5 -> R6 (length 4)
    expect(result.longestConsistentPath).toEqual(['R1', 'R2', 'R5', 'R6']);

    // Exact oracle counts: 17 evaluated, 17 accepted
    expect(result.evaluatedPathsCount).toBe(17);
    expect(result.acceptedPathsCount).toBe(17);
  });
});
