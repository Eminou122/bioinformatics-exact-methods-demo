import { hasCycle, validateGraphs } from './graph';
import { comparePaths, isInducedGConnected } from './pathAlgorithms';

export type CP2TraceType =
  | 'initialize'
  | 'choose-variable'
  | 'assign-successor'
  | 'candidate-path'
  | 'upper-bound'
  | 'incumbent-update'
  | 'genomic-rejection'
  | 'bound-pruning'
  | 'backtrack'
  | 'cancelled'
  | 'cap-reached'
  | 'proof-complete'
  | 'validation-error';

export interface CP2TraceEvent {
  type: CP2TraceType;
  message: string;
  currentPath: string[];
  bestPath: string[] | null;
  upperBound: number;
  exploredStates: number;
  prunedStates: number;
  reason?: string;
  variable?: string;
  value?: string;
  stepCount: number;
}

export interface CP2SolverResult {
  status: 'optimal' | 'incomplete' | 'no-solution' | 'error';
  bestPath: string[] | null;
  trace: CP2TraceEvent[];
  stepCount: number;
  exploredStates: number;
  prunedStates: number;
  searchCompleted: boolean;
  proofCompleteEmitted: boolean;
  interruptedByCap: boolean;
  cancelled: boolean;
  error?: {
    code: 'CYCLE_DETECTED' | 'INVALID_NODE_D' | 'INVALID_NODE_G' | 'DUPLICATE_EDGE_D' | 'DUPLICATE_EDGE_G';
    node?: string;
    message?: string;
  };
}

export interface CP2SolverOptions {
  maxEvents?: number;
  shouldCancel?: () => boolean;
}

function buildAdjacency(vertices: string[], edgesD: { from: string; to: string }[]) {
  const adj: Record<string, string[]> = {};
  for (const v of vertices) adj[v] = [];
  for (const edge of edgesD) adj[edge.from].push(edge.to);
  for (const v of vertices) adj[v].sort((a, b) => a.localeCompare(b));
  return adj;
}

function longestSuffixFrom(
  vertex: string,
  adjD: Record<string, string[]>,
  visited: Set<string>,
  memo: Map<string, number>
): number {
  const blocked = [...visited].sort().join('\u0001');
  const key = `${vertex}\u0000${blocked}`;
  const cached = memo.get(key);
  if (cached !== undefined) return cached;

  let best = 1;
  for (const next of adjD[vertex] || []) {
    if (!visited.has(next)) {
      visited.add(next);
      best = Math.max(best, 1 + longestSuffixFrom(next, adjD, visited, memo));
      visited.delete(next);
    }
  }

  memo.set(key, best);
  return best;
}

function safeUpperBound(currentPath: string[], vertices: string[], adjD: Record<string, string[]>): number {
  if (currentPath.length === 0) {
    let best = 0;
    for (const v of [...vertices].sort((a, b) => a.localeCompare(b))) {
      best = Math.max(best, longestSuffixFrom(v, adjD, new Set([v]), new Map()));
    }
    return best;
  }

  const visited = new Set(currentPath);
  return currentPath.length - 1 + longestSuffixFrom(currentPath[currentPath.length - 1], adjD, visited, new Map());
}

function prefixCanStillBeatIncumbent(currentPath: string[], incumbent: string[] | null, upperBound: number): boolean {
  if (!incumbent) return true;
  if (upperBound > incumbent.length) return true;
  if (upperBound < incumbent.length) return false;

  for (let i = 0; i < currentPath.length && i < incumbent.length; i++) {
    const cmp = currentPath[i].localeCompare(incumbent[i]);
    if (cmp < 0) return true;
    if (cmp > 0) return false;
  }

  return currentPath.length <= incumbent.length;
}

function makeIncompleteTraceEvent(
  type: 'cancelled' | 'cap-reached',
  stepCount: number,
  bestPath: string[] | null,
  exploredStates: number,
  prunedStates: number
): CP2TraceEvent {
  return {
    type,
    message: type === 'cancelled' ? 'Search cancelled before proof completion.' : 'Event cap reached before proof completion.',
    currentPath: [],
    bestPath: bestPath ? [...bestPath] : null,
    upperBound: 0,
    exploredStates,
    prunedStates,
    stepCount,
  };
}

export function solveCP2(
  vertices: string[],
  edgesD: { from: string; to: string }[],
  edgesG: { u: string; v: string }[],
  options: CP2SolverOptions | number = {}
): CP2SolverResult {
  const maxEvents = typeof options === 'number' ? options : options.maxEvents ?? 5000;
  const shouldCancel = typeof options === 'number' ? undefined : options.shouldCancel;
  const trace: CP2TraceEvent[] = [];
  let stepCount = 0;
  let exploredStates = 0;
  let prunedStates = 0;
  let bestPath: string[] | null = null;
  let searchCompleted = false;
  let proofCompleteEmitted = false;
  let interruptedByCap = false;
  let cancelled = false;

  function addTrace(event: Omit<CP2TraceEvent, 'stepCount' | 'bestPath' | 'exploredStates' | 'prunedStates'>): boolean {
    if (trace.length >= maxEvents) {
      interruptedByCap = true;
      return false;
    }

    stepCount++;
    trace.push({
      ...event,
      bestPath: bestPath ? [...bestPath] : null,
      exploredStates,
      prunedStates,
      stepCount,
    });
    if (event.type === 'proof-complete') proofCompleteEmitted = true;
    return true;
  }

  const validation = validateGraphs(vertices, edgesD, edgesG);
  if (!validation.isValid) {
    return {
      status: 'error',
      bestPath: null,
      trace: [{
        type: 'validation-error',
        message: validation.error || 'Invalid graph input.',
        currentPath: [],
        bestPath: null,
        upperBound: 0,
        exploredStates: 0,
        prunedStates: 0,
        reason: validation.errorCode,
        stepCount: 1,
      }],
      stepCount: 1,
      exploredStates: 0,
      prunedStates: 0,
      searchCompleted: false,
      proofCompleteEmitted: false,
      interruptedByCap: false,
      cancelled: false,
      error: {
        code: validation.errorCode!,
        node: validation.invalidNode,
        message: validation.error,
      },
    };
  }

  if (hasCycle(vertices, edgesD)) {
    return {
      status: 'error',
      bestPath: null,
      trace: [{
        type: 'validation-error',
        message: 'Directed graph D contains a cycle.',
        currentPath: [],
        bestPath: null,
        upperBound: 0,
        exploredStates: 0,
        prunedStates: 0,
        reason: 'CYCLE_DETECTED',
        stepCount: 1,
      }],
      stepCount: 1,
      exploredStates: 0,
      prunedStates: 0,
      searchCompleted: false,
      proofCompleteEmitted: false,
      interruptedByCap: false,
      cancelled: false,
      error: { code: 'CYCLE_DETECTED' },
    };
  }

  const adjD = buildAdjacency(vertices, edgesD);
  const orderedVertices = [...vertices].sort((a, b) => a.localeCompare(b));
  const initialUpperBound = safeUpperBound([], vertices, adjD);

  addTrace({
    type: 'initialize',
    message: 'Initialize CP2 bounded search over simple directed paths in D.',
    currentPath: [],
    upperBound: initialUpperBound,
  });

  function maybeStop(): boolean {
    if (cancelled || interruptedByCap) return true;
    if (shouldCancel?.()) {
      cancelled = true;
      return true;
    }
    return false;
  }

  function search(currentPath: string[], visited: Set<string>): void {
    if (maybeStop()) return;

    exploredStates++;
    const upperBound = safeUpperBound(currentPath, vertices, adjD);
    if (!addTrace({
      type: 'upper-bound',
      message: `Upper bound for this branch is ${upperBound}.`,
      currentPath,
      upperBound,
      reason: 'current length plus longest remaining directed suffix in D',
    })) return;

    if (bestPath && !prefixCanStillBeatIncumbent(currentPath, bestPath, upperBound)) {
      prunedStates++;
      addTrace({
        type: 'bound-pruning',
        message: 'Branch cannot improve the incumbent under length and lexical tie policy.',
        currentPath,
        upperBound,
        reason: upperBound < bestPath.length ? 'upper-bound-below-incumbent' : 'equal-length-lexical-safety',
      });
      return;
    }

    if (currentPath.length > 0) {
      const connected = isInducedGConnected(currentPath, edgesG);
      if (addTrace({
        type: 'candidate-path',
        message: `Evaluate candidate path ${currentPath.join(' -> ')}.`,
        currentPath,
        upperBound,
        reason: connected ? 'genomic-connected' : 'genomic-disconnected',
      }) && connected && (bestPath === null || comparePaths(currentPath, bestPath) < 0)) {
        bestPath = [...currentPath];
        addTrace({
          type: 'incumbent-update',
          message: `New incumbent ${bestPath.join(' -> ')}.`,
          currentPath,
          upperBound,
          reason: 'accepted-better-candidate',
        });
      } else if (!connected) {
        addTrace({
          type: 'genomic-rejection',
          message: 'Candidate rejected because selected vertices do not induce a connected subgraph in G.',
          currentPath,
          upperBound,
          reason: 'induced-G-disconnected',
        });
      }
    }

    const branchValues = currentPath.length === 0
      ? orderedVertices
      : (adjD[currentPath[currentPath.length - 1]] || []).filter((v) => !visited.has(v));

    addTrace({
      type: 'choose-variable',
      message: currentPath.length === 0 ? 'Choose a start vertex.' : `Choose a successor of ${currentPath[currentPath.length - 1]}.`,
      currentPath,
      upperBound,
      variable: currentPath.length === 0 ? 'start' : `succ[${currentPath[currentPath.length - 1]}]`,
    });

    for (const next of branchValues) {
      if (maybeStop()) return;
      const nextPath = [...currentPath, next];
      addTrace({
        type: 'assign-successor',
        message: currentPath.length === 0 ? `Assign start = ${next}.` : `Assign successor = ${next}.`,
        currentPath: nextPath,
        upperBound: safeUpperBound(nextPath, vertices, adjD),
        variable: currentPath.length === 0 ? 'start' : `succ[${currentPath[currentPath.length - 1]}]`,
        value: next,
      });
      visited.add(next);
      search(nextPath, visited);
      visited.delete(next);
    }

    addTrace({
      type: 'backtrack',
      message: currentPath.length === 0 ? 'Backtrack from root search state.' : `Backtrack from ${currentPath.join(' -> ')}.`,
      currentPath,
      upperBound,
    });
  }

  search([], new Set());

  if (!cancelled && !interruptedByCap) {
    searchCompleted = true;
    const proofPath = bestPath === null ? null : [...bestPath];
    const proofAdded = addTrace({
      type: 'proof-complete',
      message: proofPath ? `Search complete. Optimal path is ${proofPath.join(' -> ')}.` : 'Search complete. No valid path exists.',
      currentPath: proofPath || [],
      upperBound: proofPath ? proofPath.length : 0,
    });
    if (!proofAdded) interruptedByCap = true;
  }

  if (!searchCompleted || cancelled || interruptedByCap || !proofCompleteEmitted) {
    const incompleteType = cancelled ? 'cancelled' : 'cap-reached';
    if (trace.length < maxEvents) {
      trace.push(makeIncompleteTraceEvent(incompleteType, ++stepCount, bestPath, exploredStates, prunedStates));
    }
    return {
      status: 'incomplete',
      bestPath,
      trace,
      stepCount,
      exploredStates,
      prunedStates,
      searchCompleted,
      proofCompleteEmitted,
      interruptedByCap,
      cancelled,
    };
  }

  return {
    status: bestPath ? 'optimal' : 'no-solution',
    bestPath,
    trace,
    stepCount,
    exploredStates,
    prunedStates,
    searchCompleted,
    proofCompleteEmitted,
    interruptedByCap,
    cancelled,
  };
}
