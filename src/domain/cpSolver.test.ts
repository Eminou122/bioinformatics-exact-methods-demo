import { describe, test, expect } from 'vitest';
import { solveCP1 } from './cpSolver';
import { solveConsistentPath } from './pathAlgorithms';
import { examples } from '../data/examples';

describe('CP1 Constraint Programming Solver Logic', () => {
  test('domain initialization, valid start/end, and channeling', () => {
    const vertices = ['R1', 'R2'];
    const edgesD = [{ from: 'R1', to: 'R2' }];
    const edgesG = [{ u: 'R1', v: 'R2' }];

    const result = solveCP1(vertices, edgesD, edgesG);
    expect(result.status).toBe('optimal');
    expect(result.bestPath).toEqual(['R1', 'R2']);
    
    // Check trace contains expected events
    const initEvent = result.trace.find((e) => e.type === 'initialize');
    expect(initEvent).toBeDefined();
    expect(initEvent?.domains.x['R1']).toEqual([0, 1]);
    expect(initEvent?.domains.succ['R1']).toEqual([{kind: 'vertex', vertexId: 'R2'}, {kind: 'unselected'}, {kind: 'end'}]);
  });

  test('invalid successor rejection & cycle rejection', () => {
    const vertices = ['R1', 'R2', 'R3'];
    const edgesD = [
      { from: 'R1', to: 'R2' },
      { from: 'R2', to: 'R3' },
      { from: 'R3', to: 'R1' }
    ];
    const edgesG = [
      { u: 'R1', v: 'R2' },
      { u: 'R2', v: 'R3' }
    ];

    const result = solveCP1(vertices, edgesD, edgesG);
    expect(result.status).toBe('error');
    expect(result.error?.code).toBe('CYCLE_DETECTED');
  });

  test('disconnected complete assignment rejection (induced G connectivity constraint)', () => {
    const ex = examples.find((e) => e.id === 'longest-rejected')!;
    const result = solveCP1(ex.vertices, ex.edgesD, ex.edgesG);

    expect(result.status).toBe('optimal');
    expect(result.bestPath).toEqual(['R1', 'R2', 'R3']);

    const contradictionEvent = result.trace.find(
      (e) => e.type === 'contradiction' && (e.message.includes('isolated') || e.message.includes('disconnected'))
    );
    expect(contradictionEvent).toBeDefined();
  });

  test('backtracking restores domains', () => {
    const ex = examples.find((e) => e.id === 'multiple-candidates')!;
    const result = solveCP1(ex.vertices, ex.edgesD, ex.edgesG);

    expect(result.status).toBe('optimal');
    expect(result.bestPath).toEqual(['R1', 'R2', 'R5', 'R6']);

    const backtrackEvent = result.trace.find((e) => e.type === 'backtrack');
    expect(backtrackEvent).toBeDefined();
  });

  test('incumbent updates on better valid path', () => {
    const vertices = ['R1', 'R2', 'R3'];
    const edgesD = [
      { from: 'R1', to: 'R2' },
      { from: 'R2', to: 'R3' }
    ];
    const edgesG = [
      { u: 'R1', v: 'R2' },
      { u: 'R2', v: 'R3' }
    ];

    const result = solveCP1(vertices, edgesD, edgesG);
    const incumbentEvents = result.trace.filter((e) => e.type === 'incumbent-update');
    expect(incumbentEvents.length).toBeGreaterThan(0);
  });

  test('cancellation returns incomplete on step limit cap', () => {
    const ex = examples.find((e) => e.id === 'multiple-candidates')!;
    const result = solveCP1(ex.vertices, ex.edgesD, ex.edgesG, 5);

    expect(result.status).toBe('incomplete');
    const cancelledEvent = result.trace.find((e) => e.type === 'cancelled');
    expect(cancelledEvent).toBeDefined();
    // Incomplete runs must never say optimal or proof-complete
    expect(result.status).not.toBe('optimal');
    expect(result.trace.some((e) => e.type === 'proof-complete')).toBe(false);
  });

  test('enforces successor UNSELECTED and END semantics matching selection boolean', () => {
    const vertices = ['R1', 'R2', 'R3'];
    const edgesD = [
      { from: 'R1', to: 'R2' },
      { from: 'R2', to: 'R3' }
    ];
    const edgesG = [
      { u: 'R1', v: 'R2' },
      { u: 'R2', v: 'R3' }
    ];

    const result = solveCP1(vertices, edgesD, edgesG);
    expect(result.status).toBe('optimal');
    expect(result.bestPath).toEqual(['R1', 'R2', 'R3']);

    // Check trace for candidate-complete to verify final states
    const finalStep = result.trace.find((e) => e.type === 'candidate-complete');
    expect(finalStep).toBeDefined();

    if (finalStep) {
      const domains = finalStep.domains;
      // succ[v] = UNSELECTED iff selected[v] = false
      // for R1, R2, R3 (which are in path): selected is 1, succ is NOT UNSELECTED
      expect(domains.x['R1']).toEqual([1]);
      expect(domains.x['R2']).toEqual([1]);
      expect(domains.x['R3']).toEqual([1]);

      expect(domains.succ['R1']).not.toContainEqual({kind: 'unselected'});
      expect(domains.succ['R2']).not.toContainEqual({kind: 'unselected'});
      expect(domains.succ['R3']).not.toContainEqual({kind: 'unselected'});

      // R3 is end of path (terminal node): succ[R3] = END
      expect(domains.succ['R3']).toEqual([{kind: 'end'}]);
      
      // succ[v] = u only when arc (v,u) exists and both nodes selected
      expect(domains.succ['R1']).toEqual([{ kind: 'vertex', vertexId: 'R2' }]);
      expect(domains.succ['R2']).toEqual([{ kind: 'vertex', vertexId: 'R3' }]);
    }
  });

  test('explicit singleton-path representation support', () => {
    const vertices = ['R1', 'R2'];
    const edgesD = [{ from: 'R1', to: 'R2' }];
    // G is disconnected: no edges in G at all!
    const edgesG: { u: string; v: string }[] = [];

    const result = solveCP1(vertices, edgesD, edgesG);
    expect(result.status).toBe('optimal');
    // Longest consistent path is a singleton, e.g. ['R1'] (lexicographical tie chooses R1 over R2)
    expect(result.bestPath).toEqual(['R1']);

    // Check trace for candidate-complete of singleton
    const singletonStep = result.trace.find(
      (e) => e.type === 'candidate-complete' && e.currentPath.length === 1
    );
    expect(singletonStep).toBeDefined();
    if (singletonStep) {
      // succ[R1] = END, succ[R2] = UNSELECTED, selected[R2] = 0
      expect(singletonStep.domains.succ['R1']).toEqual([{kind: 'end'}]);
      expect(singletonStep.domains.succ['R2']).toEqual([{kind: 'unselected'}]);
      expect(singletonStep.domains.x['R2']).toEqual([0]);
    }
  });

  test('boundary tests around every event-cap completion edge case', () => {
    const ex = examples.find((e) => e.id === 'simple-valide')!;
    
    // Exactly capping at 1 event -> returns incomplete
    const result1 = solveCP1(ex.vertices, ex.edgesD, ex.edgesG, 1);
    expect(result1.status).toBe('incomplete');
    expect(result1.trace.some((e) => e.type === 'proof-complete')).toBe(false);

    // Capping at high value -> returns optimal
    const result2 = solveCP1(ex.vertices, ex.edgesD, ex.edgesG, 1000);
    expect(result2.status).toBe('optimal');
    expect(result2.trace.some((e) => e.type === 'proof-complete')).toBe(true);
  });

  test('boundary regression tests using real full event count', () => {
    const ex = examples.find((e) => e.id === 'simple-valide')!;
    
    // First, run with high event cap to get the baseline full trace and its length
    const fullResult = solveCP1(ex.vertices, ex.edgesD, ex.edgesG, 1000);
    expect(fullResult.status).toBe('optimal');
    const fullTraceLength = fullResult.trace.length;
    
    // Find key event indexes in full run
    const firstCandidateCompleteIdx = fullResult.trace.findIndex(e => e.type === 'candidate-complete');
    const firstIncumbentUpdateIdx = fullResult.trace.findIndex(e => e.type === 'incumbent-update');

    expect(firstCandidateCompleteIdx).toBeGreaterThan(-1);
    expect(firstIncumbentUpdateIdx).toBeGreaterThan(-1);

    // * cap below initialization (e.g. 0)
    const capBelowInit = solveCP1(ex.vertices, ex.edgesD, ex.edgesG, 0);
    expect(capBelowInit.status).toBe('incomplete');
    expect(capBelowInit.trace.some(e => e.type === 'proof-complete')).toBe(false);

    // * cap at first event (e.g. 1)
    const capAtFirstEvent = solveCP1(ex.vertices, ex.edgesD, ex.edgesG, 1);
    expect(capAtFirstEvent.status).toBe('incomplete');
    expect(capAtFirstEvent.trace.some(e => e.type === 'proof-complete')).toBe(false);

    // * cap before candidate completion
    const capBeforeCand = solveCP1(ex.vertices, ex.edgesD, ex.edgesG, firstCandidateCompleteIdx);
    expect(capBeforeCand.status).toBe('incomplete');
    expect(capBeforeCand.trace.some(e => e.type === 'proof-complete')).toBe(false);

    // * cap before incumbent update
    const capBeforeInc = solveCP1(ex.vertices, ex.edgesD, ex.edgesG, firstIncumbentUpdateIdx);
    expect(capBeforeInc.status).toBe('incomplete');
    expect(capBeforeInc.trace.some(e => e.type === 'proof-complete')).toBe(false);

    // * cap at fullTraceLength - 2
    const capMinus2 = solveCP1(ex.vertices, ex.edgesD, ex.edgesG, fullTraceLength - 2);
    expect(capMinus2.status).toBe('incomplete');
    expect(capMinus2.trace.some(e => e.type === 'proof-complete')).toBe(false);

    // * cap at fullTraceLength - 1
    const capMinus1 = solveCP1(ex.vertices, ex.edgesD, ex.edgesG, fullTraceLength - 1);
    expect(capMinus1.status).toBe('incomplete');
    expect(capMinus1.trace.some(e => e.type === 'proof-complete')).toBe(false);

    // * cap exactly equal to fullTraceLength
    const capExact = solveCP1(ex.vertices, ex.edgesD, ex.edgesG, fullTraceLength);
    expect(capExact.status).toBe('optimal');
    expect(capExact.trace.some(e => e.type === 'proof-complete')).toBe(true);

    // * cap greater than fullTraceLength
    const capGreater = solveCP1(ex.vertices, ex.edgesD, ex.edgesG, fullTraceLength + 5);
    expect(capGreater.status).toBe('optimal');
    expect(capGreater.trace.some(e => e.type === 'proof-complete')).toBe(true);
  });

  test('equivalent cancellation tests for all boundary caps', () => {
    const ex = examples.find((e) => e.id === 'simple-valide')!;
    const fullResult = solveCP1(ex.vertices, ex.edgesD, ex.edgesG, 1000);
    const fullTraceLength = fullResult.trace.length;

    const testCaps = [
      0,
      1,
      fullResult.trace.findIndex(e => e.type === 'candidate-complete'),
      fullResult.trace.findIndex(e => e.type === 'incumbent-update'),
      fullTraceLength - 2,
      fullTraceLength - 1
    ];

    for (const cap of testCaps) {
      if (cap < 0) continue;
      const res = solveCP1(ex.vertices, ex.edgesD, ex.edgesG, cap);
      expect(res.status).toBe('incomplete');
      expect(res.trace.some(e => e.type === 'cancelled')).toBe(true);
      expect(res.trace.some(e => e.type === 'proof-complete')).toBe(false);
    }
  });

  test('differential comparison to exhaustive solver on deterministic DAG fixtures', () => {
    for (const ex of examples) {
      const cpRes = solveCP1(ex.vertices, ex.edgesD, ex.edgesG);
      const legacyRes = solveConsistentPath(ex.vertices, ex.edgesD, ex.edgesG);

      expect(cpRes.status).not.toBe('error');
      expect(legacyRes.error).toBeUndefined();

      const cpBest = cpRes.bestPath || [];
      const legacyBest = legacyRes.longestConsistentPath || [];

      expect(cpBest.length).toBe(legacyBest.length);
      expect(cpBest).toEqual(legacyBest);
    }
  });
});

  test('explicit tests with vertex IDs named END and UNSELECTED', () => {
    const vertices = ['END', 'UNSELECTED', 'NORMAL'];
    const edgesD = [
      { from: 'UNSELECTED', to: 'END' },
      { from: 'END', to: 'NORMAL' },
    ];
    const edgesG = [
      { u: 'UNSELECTED', v: 'END' },
      { u: 'END', v: 'NORMAL' },
      { u: 'UNSELECTED', v: 'NORMAL' }
    ];
    const result = solveCP1(vertices, edgesD, edgesG);
    expect(result.status).toBe('optimal');
    expect(result.bestPath).toBeDefined();
    // Path should be UNSELECTED -> END -> NORMAL
    expect(result.bestPath).toEqual(['UNSELECTED', 'END', 'NORMAL']);
  });

