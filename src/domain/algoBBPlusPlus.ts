import { hasCycle, validateGraphs } from './graph';
import { comparePaths, isInducedGConnected } from './pathAlgorithms';

export type AlgoBBTraceType =
  | 'initialize'
  | 'seed-arc'
  | 'extend-left'
  | 'extend-right'
  | 'upper-bound'
  | 'incumbent-update'
  | 'genomic-rejection'
  | 'bound-pruning'
  | 'backtrack'
  | 'cancelled'
  | 'proof-complete'
  | 'validation-error';

export interface AlgoBBTraceEvent {
  type: AlgoBBTraceType;
  path: string[];
  incumbent: string[] | null;
  upperBound: number;
  exploredStates: number;
  prunedStates: number;
  reasonCode:
    | 'SEARCH_INITIALIZED'
    | 'SINGLETON_SEED'
    | 'ARC_SEED'
    | 'LEFT_EXTENSION'
    | 'RIGHT_EXTENSION'
    | 'SAFE_LENGTH_BOUND'
    | 'NEW_INCUMBENT'
    | 'DISCONNECTED_FINAL_CANDIDATE'
    | 'GENOMIC_CONNECTIVITY_IMPOSSIBLE'
    | 'BOUND_CANNOT_BEAT_INCUMBENT'
    | 'RETURN_TO_PARENT'
    | 'EVENT_CAP_REACHED'
    | 'CANCELLED_BY_SIGNAL'
    | 'OPTIMALITY_PROVEN'
    | 'INVALID_GRAPH'
    | 'CYCLE_DETECTED';
  seedArc?: { from: string; to: string };
  rejectionReason?: string;
}

export interface AlgoBBOptions {
  maxEvents?: number;
  isCancelled?: () => boolean;
}

export interface AlgoBBResult {
  status: 'optimal' | 'incomplete' | 'no-solution' | 'error';
  bestPath: string[] | null;
  trace: AlgoBBTraceEvent[];
  exploredStates: number;
  prunedStates: number;
  eventCapReached: boolean;
  cancelled: boolean;
  error?: {
    code: 'CYCLE_DETECTED' | 'INVALID_NODE_D' | 'INVALID_NODE_G' | 'DUPLICATE_EDGE_D' | 'DUPLICATE_EDGE_G';
    node?: string;
    message?: string;
  };
}

interface SearchState {
  path: string[];
  seedArc?: { from: string; to: string };
}

const DEFAULT_MAX_EVENTS = 5000;

function pathKey(path: string[]): string {
  return path.join('\u0001');
}

function sortedUnique(values: string[]): string[] {
  return [...new Set(values)].sort((a, b) => a.localeCompare(b));
}

function buildAdjacency(vertices: string[], edgesD: { from: string; to: string }[]) {
  const out: Record<string, string[]> = {};
  const incoming: Record<string, string[]> = {};
  for (const vertex of vertices) {
    out[vertex] = [];
    incoming[vertex] = [];
  }
  for (const edge of edgesD) {
    out[edge.from].push(edge.to);
    incoming[edge.to].push(edge.from);
  }
  for (const vertex of vertices) {
    out[vertex].sort((a, b) => a.localeCompare(b));
    incoming[vertex].sort((a, b) => a.localeCompare(b));
  }
  return { out, incoming };
}

function longestForward(
  from: string,
  out: Record<string, string[]>,
  blocked: Set<string>,
  memo: Map<string, number>
): number {
  const memoKey = `${from}|${[...blocked].sort().join(',')}`;
  const cached = memo.get(memoKey);
  if (cached !== undefined) return cached;

  let best = 0;
  for (const next of out[from] || []) {
    if (blocked.has(next)) continue;
    const nextBlocked = new Set(blocked);
    nextBlocked.add(next);
    best = Math.max(best, 1 + longestForward(next, out, nextBlocked, memo));
  }

  memo.set(memoKey, best);
  return best;
}

function longestBackward(
  from: string,
  incoming: Record<string, string[]>,
  blocked: Set<string>,
  memo: Map<string, number>
): number {
  const memoKey = `${from}|${[...blocked].sort().join(',')}`;
  const cached = memo.get(memoKey);
  if (cached !== undefined) return cached;

  let best = 0;
  for (const prev of incoming[from] || []) {
    if (blocked.has(prev)) continue;
    const nextBlocked = new Set(blocked);
    nextBlocked.add(prev);
    best = Math.max(best, 1 + longestBackward(prev, incoming, nextBlocked, memo));
  }

  memo.set(memoKey, best);
  return best;
}

function safeUpperBound(
  path: string[],
  out: Record<string, string[]>,
  incoming: Record<string, string[]>
): number {
  if (path.length === 0) return 0;
  const blocked = new Set(path);
  const left = longestBackward(path[0], incoming, blocked, new Map());
  const right = longestForward(path[path.length - 1], out, blocked, new Map());
  return path.length + left + right;
}

function collectReachable(
  starts: string[],
  adj: Record<string, string[]>,
  blocked: Set<string>
): Set<string> {
  const reachable = new Set<string>();
  const stack = [...starts];
  while (stack.length > 0) {
    const current = stack.pop()!;
    for (const next of adj[current] || []) {
      if (blocked.has(next) || reachable.has(next)) continue;
      reachable.add(next);
      stack.push(next);
    }
  }
  return reachable;
}

function canStillBecomeGConnected(
  path: string[],
  edgesG: { u: string; v: string }[],
  out: Record<string, string[]>,
  incoming: Record<string, string[]>
): boolean {
  if (path.length <= 1) return true;

  const pathSet = new Set(path);
  const possible = new Set(path);
  for (const left of collectReachable([path[0]], incoming, pathSet)) possible.add(left);
  for (const right of collectReachable([path[path.length - 1]], out, pathSet)) possible.add(right);

  const adjG: Record<string, string[]> = {};
  for (const vertex of possible) adjG[vertex] = [];
  for (const edge of edgesG) {
    if (possible.has(edge.u) && possible.has(edge.v)) {
      adjG[edge.u].push(edge.v);
      adjG[edge.v].push(edge.u);
    }
  }

  const visited = new Set<string>([path[0]]);
  const queue = [path[0]];
  let head = 0;
  while (head < queue.length) {
    const current = queue[head++];
    for (const next of adjG[current] || []) {
      if (!visited.has(next)) {
        visited.add(next);
        queue.push(next);
      }
    }
  }

  return path.every((vertex) => visited.has(vertex));
}

export function solveAlgoBBPlusPlus(
  vertices: string[],
  edgesD: { from: string; to: string }[],
  edgesG: { u: string; v: string }[],
  options: AlgoBBOptions = {}
): AlgoBBResult {
  const maxEvents = options.maxEvents ?? DEFAULT_MAX_EVENTS;
  const trace: AlgoBBTraceEvent[] = [];
  let bestPath: string[] | null = null;
  let exploredStates = 0;
  let prunedStates = 0;
  let eventCapReached = false;
  let interruptedByCap = false;
  let cancelled = false;

  const addTrace = (event: Omit<AlgoBBTraceEvent, 'incumbent' | 'exploredStates' | 'prunedStates'>): boolean => {
    if (trace.length >= maxEvents) {
      eventCapReached = true;
      interruptedByCap = true;
      return false;
    }
    trace.push({
      ...event,
      incumbent: bestPath ? [...bestPath] : null,
      exploredStates,
      prunedStates,
    });
    return true;
  };

  const emitInterruptionTrace = (): void => {
    addTrace({
      type: 'cancelled',
      path: [],
      upperBound: bestPath ? bestPath.length : 0,
      reasonCode: cancelled ? 'CANCELLED_BY_SIGNAL' : 'EVENT_CAP_REACHED',
      rejectionReason: cancelled ? 'CANCELLED_BY_SIGNAL' : 'EVENT_CAP_REACHED',
    });
  };

  const validation = validateGraphs(vertices, edgesD, edgesG);
  if (!validation.isValid) {
    addTrace({
      type: 'validation-error',
      path: [],
      upperBound: 0,
      reasonCode: 'INVALID_GRAPH',
      rejectionReason: validation.errorCode,
    });
    return {
      status: 'error',
      bestPath: null,
      trace,
      exploredStates,
      prunedStates,
      eventCapReached,
      cancelled,
      error: {
        code: validation.errorCode!,
        node: validation.invalidNode,
        message: validation.error,
      },
    };
  }

  if (hasCycle(vertices, edgesD)) {
    addTrace({
      type: 'validation-error',
      path: [],
      upperBound: 0,
      reasonCode: 'CYCLE_DETECTED',
      rejectionReason: 'CYCLE_DETECTED',
    });
    return {
      status: 'error',
      bestPath: null,
      trace,
      exploredStates,
      prunedStates,
      eventCapReached,
      cancelled,
      error: { code: 'CYCLE_DETECTED' },
    };
  }

  const { out, incoming } = buildAdjacency(vertices, edgesD);
  const normalizedVertices = sortedUnique(vertices);
  const normalizedEdges = [...edgesD].sort((a, b) => {
    const from = a.from.localeCompare(b.from);
    return from !== 0 ? from : a.to.localeCompare(b.to);
  });
  const visitedStates = new Set<string>();

  addTrace({
    type: 'initialize',
    path: [],
    upperBound: normalizedVertices.length,
    reasonCode: 'SEARCH_INITIALIZED',
  });

  function shouldStop(): boolean {
    if (eventCapReached) return true;
    if (options.isCancelled?.()) {
      cancelled = true;
      return true;
    }
    return false;
  }

  function evaluateCandidate(path: string[], upperBound: number): void {
    if (isInducedGConnected(path, edgesG)) {
      if (bestPath === null || comparePaths(path, bestPath) < 0) {
        bestPath = [...path];
        addTrace({
          type: 'incumbent-update',
          path,
          upperBound,
          reasonCode: 'NEW_INCUMBENT',
        });
      }
    } else {
      addTrace({
        type: 'genomic-rejection',
        path,
        upperBound,
        reasonCode: 'DISCONNECTED_FINAL_CANDIDATE',
        rejectionReason: 'INDUCED_G_DISCONNECTED',
      });
    }
  }

  function search(state: SearchState): void {
    if (shouldStop()) return;
    const key = pathKey(state.path);
    if (visitedStates.has(key)) return;
    visitedStates.add(key);
    exploredStates++;

    const upperBound = safeUpperBound(state.path, out, incoming);
    addTrace({
      type: 'upper-bound',
      path: state.path,
      upperBound,
      reasonCode: 'SAFE_LENGTH_BOUND',
      seedArc: state.seedArc,
    });

    if (shouldStop()) return;
    if (bestPath && upperBound < bestPath.length) {
      prunedStates++;
      addTrace({
        type: 'bound-pruning',
        path: state.path,
        upperBound,
        reasonCode: 'BOUND_CANNOT_BEAT_INCUMBENT',
        seedArc: state.seedArc,
        rejectionReason: 'UPPER_BOUND_BELOW_INCUMBENT',
      });
      addTrace({
        type: 'backtrack',
        path: state.path,
        upperBound,
        reasonCode: 'RETURN_TO_PARENT',
        seedArc: state.seedArc,
      });
      return;
    }

    if (!canStillBecomeGConnected(state.path, edgesG, out, incoming)) {
      prunedStates++;
      addTrace({
        type: 'genomic-rejection',
        path: state.path,
        upperBound,
        reasonCode: 'GENOMIC_CONNECTIVITY_IMPOSSIBLE',
        seedArc: state.seedArc,
        rejectionReason: 'NO_SELECTABLE_VERTEX_CAN_RECONNECT_G_COMPONENTS',
      });
      addTrace({
        type: 'backtrack',
        path: state.path,
        upperBound,
        reasonCode: 'RETURN_TO_PARENT',
        seedArc: state.seedArc,
      });
      return;
    }

    evaluateCandidate(state.path, upperBound);
    if (shouldStop()) return;

    const used = new Set(state.path);
    const leftOptions = (incoming[state.path[0]] || []).filter((vertex) => !used.has(vertex));
    for (const prev of leftOptions) {
      if (shouldStop()) return;
      const nextPath = [prev, ...state.path];
      addTrace({
        type: 'extend-left',
        path: nextPath,
        upperBound: safeUpperBound(nextPath, out, incoming),
        reasonCode: 'LEFT_EXTENSION',
        seedArc: state.seedArc,
      });
      search({ path: nextPath, seedArc: state.seedArc });
    }

    const rightOptions = (out[state.path[state.path.length - 1]] || []).filter((vertex) => !used.has(vertex));
    for (const next of rightOptions) {
      if (shouldStop()) return;
      const nextPath = [...state.path, next];
      addTrace({
        type: 'extend-right',
        path: nextPath,
        upperBound: safeUpperBound(nextPath, out, incoming),
        reasonCode: 'RIGHT_EXTENSION',
        seedArc: state.seedArc,
      });
      search({ path: nextPath, seedArc: state.seedArc });
    }

    addTrace({
      type: 'backtrack',
      path: state.path,
      upperBound,
      reasonCode: 'RETURN_TO_PARENT',
      seedArc: state.seedArc,
    });
  }

  for (const vertex of normalizedVertices) {
    if (shouldStop()) break;
    addTrace({
      type: 'seed-arc',
      path: [vertex],
      upperBound: safeUpperBound([vertex], out, incoming),
      reasonCode: 'SINGLETON_SEED',
    });
    search({ path: [vertex] });
  }

  for (const edge of normalizedEdges) {
    if (shouldStop()) break;
    addTrace({
      type: 'seed-arc',
      path: [edge.from, edge.to],
      upperBound: safeUpperBound([edge.from, edge.to], out, incoming),
      reasonCode: 'ARC_SEED',
      seedArc: { from: edge.from, to: edge.to },
    });
    search({ path: [edge.from, edge.to], seedArc: { from: edge.from, to: edge.to } });
  }

  const searchCompleted = !cancelled && !interruptedByCap;

  if (!searchCompleted || cancelled || interruptedByCap) {
    emitInterruptionTrace();
    return {
      status: 'incomplete',
      bestPath,
      trace,
      exploredStates,
      prunedStates,
      eventCapReached,
      cancelled,
    };
  }

  const finalBestPath = bestPath as string[] | null;

  const proofCompleteEmitted = addTrace({
    type: 'proof-complete',
    path: finalBestPath ? finalBestPath : [],
    upperBound: finalBestPath ? finalBestPath.length : 0,
    reasonCode: 'OPTIMALITY_PROVEN',
  });

  if (!searchCompleted || cancelled || interruptedByCap || !proofCompleteEmitted) {
    emitInterruptionTrace();
    return {
      status: 'incomplete',
      bestPath: finalBestPath,
      trace,
      exploredStates,
      prunedStates,
      eventCapReached,
      cancelled,
    };
  }

  return {
    status: finalBestPath ? 'optimal' : 'no-solution',
    bestPath: finalBestPath,
    trace,
    exploredStates,
    prunedStates,
    eventCapReached,
    cancelled,
  };
}
