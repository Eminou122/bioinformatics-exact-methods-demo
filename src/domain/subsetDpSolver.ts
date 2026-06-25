import { hasCycle, validateGraphs } from './graph';
import { comparePaths, isInducedGConnected } from './pathAlgorithms';

export const SUBSET_DP_HARD_MAX_VERTICES = 15;

export type SubsetDpTraceType =
  | 'initialize'
  | 'seed-state'
  | 'state-dequeue'
  | 'transition'
  | 'genomic-rejection'
  | 'state-retained'
  | 'state-dominated'
  | 'incumbent-update'
  | 'cancelled'
  | 'cap-reached'
  | 'unsupported'
  | 'proof-complete'
  | 'validation-error';

export interface SubsetDpStateSnapshot {
  mask: number;
  subset: string[];
  lastVertex: string;
  path: string[];
  status: 'seeded' | 'queued' | 'retained' | 'dominated' | 'rejected' | 'processed' | 'unsupported';
}

export interface SubsetDpCounters {
  statesCreated: number;
  statesRetained: number;
  transitionsEvaluated: number;
  genomicDisconnectedSubsetsRejected: number;
  dominatedDuplicateStatesDiscarded: number;
}

export interface SubsetDpTraceEvent {
  type: SubsetDpTraceType;
  message: string;
  state: SubsetDpStateSnapshot | null;
  candidateNext?: string;
  isNewToSubset?: boolean;
  genomicConnected?: boolean;
  retained?: boolean;
  dominated?: boolean;
  reason?: string;
  bestPath: string[] | null;
  counters: SubsetDpCounters;
  stepCount: number;
}

export interface SubsetDpSolverOptions {
  maxEvents?: number;
  maxVertices?: number;
  shouldCancel?: () => boolean;
}

export interface SubsetDpSolverResult {
  status: 'optimal' | 'incomplete' | 'no-solution' | 'error' | 'unsupported';
  bestPath: string[] | null;
  trace: SubsetDpTraceEvent[];
  states: SubsetDpStateSnapshot[];
  counters: SubsetDpCounters;
  stepCount: number;
  searchCompleted: boolean;
  proofCompleteEmitted: boolean;
  interruptedByCap: boolean;
  cancelled: boolean;
  error?: {
    code:
      | 'CYCLE_DETECTED'
      | 'INVALID_NODE_D'
      | 'INVALID_NODE_G'
      | 'DUPLICATE_EDGE_D'
      | 'DUPLICATE_EDGE_G'
      | 'TOO_MANY_VERTICES';
    node?: string;
    message?: string;
  };
}

function emptyCounters(): SubsetDpCounters {
  return {
    statesCreated: 0,
    statesRetained: 0,
    transitionsEvaluated: 0,
    genomicDisconnectedSubsetsRejected: 0,
    dominatedDuplicateStatesDiscarded: 0,
  };
}

function cloneCounters(counters: SubsetDpCounters): SubsetDpCounters {
  return { ...counters };
}

function lexComparePaths(a: string[], b: string[]): number {
  const limit = Math.min(a.length, b.length);
  for (let i = 0; i < limit; i++) {
    const cmp = a[i].localeCompare(b[i]);
    if (cmp !== 0) return cmp;
  }
  return a.length - b.length;
}

function stateKey(mask: number, lastIndex: number): string {
  return `${mask}|${lastIndex}`;
}

function vertexBit(index: number): number {
  if (!Number.isInteger(index) || index < 0 || index >= SUBSET_DP_HARD_MAX_VERTICES) {
    throw new RangeError(`Subset DP bit index ${index} exceeds the hard safety range.`);
  }
  return 1 << index;
}

function subsetFromMask(mask: number, orderedVertices: string[]): string[] {
  return orderedVertices.filter((_, index) => (mask & vertexBit(index)) !== 0);
}

function snapshot(
  mask: number,
  lastVertex: string,
  path: string[],
  orderedVertices: string[],
  status: SubsetDpStateSnapshot['status']
): SubsetDpStateSnapshot {
  return {
    mask,
    subset: subsetFromMask(mask, orderedVertices),
    lastVertex,
    path: [...path],
    status,
  };
}

function buildAdjacency(vertices: string[], edgesD: { from: string; to: string }[]): Record<string, string[]> {
  const adj: Record<string, string[]> = {};
  for (const vertex of vertices) adj[vertex] = [];
  for (const edge of edgesD) adj[edge.from].push(edge.to);
  for (const vertex of vertices) adj[vertex].sort((a, b) => a.localeCompare(b));
  return adj;
}

export function retainLexicographicallySmallestState(
  retainedPath: string[] | undefined,
  candidatePath: string[]
): { retained: boolean; path: string[] } {
  if (!retainedPath || lexComparePaths(candidatePath, retainedPath) < 0) {
    return { retained: true, path: [...candidatePath] };
  }
  return { retained: false, path: [...retainedPath] };
}

function incompleteTraceEvent(
  type: 'cancelled' | 'cap-reached',
  stepCount: number,
  bestPath: string[] | null,
  counters: SubsetDpCounters
): SubsetDpTraceEvent {
  return {
    type,
    message: type === 'cancelled' ? 'Search cancelled before proof completion.' : 'Event cap reached before proof completion.',
    state: null,
    bestPath: bestPath ? [...bestPath] : null,
    counters: cloneCounters(counters),
    reason: type,
    stepCount,
  };
}

export function solveSubsetDP(
  vertices: string[],
  edgesD: { from: string; to: string }[],
  edgesG: { u: string; v: string }[],
  options: SubsetDpSolverOptions | number = {}
): SubsetDpSolverResult {
  const maxEvents = typeof options === 'number' ? options : options.maxEvents ?? 8000;
  const requestedMaxVertices = typeof options === 'number'
    ? SUBSET_DP_HARD_MAX_VERTICES
    : options.maxVertices ?? SUBSET_DP_HARD_MAX_VERTICES;
  const operationalMaxVertices = Math.min(
    SUBSET_DP_HARD_MAX_VERTICES,
    Math.max(0, Number.isFinite(requestedMaxVertices) ? Math.floor(requestedMaxVertices) : SUBSET_DP_HARD_MAX_VERTICES)
  );
  const shouldCancel = typeof options === 'number' ? undefined : options.shouldCancel;
  const orderedVertices = [...vertices].sort((a, b) => a.localeCompare(b));
  const vertexIndex = new Map(orderedVertices.map((vertex, index) => [vertex, index]));
  const trace: SubsetDpTraceEvent[] = [];
  const counters = emptyCounters();
  let stepCount = 0;
  let bestPath: string[] | null = null;
  let searchCompleted = false;
  let proofCompleteEmitted = false;
  let interruptedByCap = false;
  let cancelled = false;

  function addTrace(event: Omit<SubsetDpTraceEvent, 'bestPath' | 'counters' | 'stepCount'>): boolean {
    if (trace.length >= maxEvents) {
      interruptedByCap = true;
      return false;
    }
    stepCount++;
    trace.push({
      ...event,
      bestPath: bestPath ? [...bestPath] : null,
      counters: cloneCounters(counters),
      stepCount,
    });
    if (event.type === 'proof-complete') proofCompleteEmitted = true;
    return true;
  }

  function shouldStop(): boolean {
    if (cancelled || interruptedByCap) return true;
    if (shouldCancel?.()) {
      cancelled = true;
      return true;
    }
    return false;
  }

  function unsupportedResult(limit: number): SubsetDpSolverResult {
    const message = `Exact subset DP supports at most ${limit} vertices for this run; the non-overridable hard maximum is ${SUBSET_DP_HARD_MAX_VERTICES}.`;
    const unsupportedState: SubsetDpStateSnapshot = {
      mask: 0,
      subset: [],
      lastVertex: '',
      path: [],
      status: 'unsupported',
    };
    return {
      status: 'unsupported',
      bestPath: null,
      trace: [{
        type: 'unsupported',
        message,
        state: unsupportedState,
        bestPath: null,
        counters: emptyCounters(),
        reason: 'TOO_MANY_VERTICES',
        stepCount: 1,
      }],
      states: [unsupportedState],
      counters,
      stepCount: 1,
      searchCompleted: false,
      proofCompleteEmitted: false,
      interruptedByCap: false,
      cancelled: false,
      error: { code: 'TOO_MANY_VERTICES', message },
    };
  }

  if (orderedVertices.length > SUBSET_DP_HARD_MAX_VERTICES) {
    return unsupportedResult(SUBSET_DP_HARD_MAX_VERTICES);
  }

  const validation = validateGraphs(vertices, edgesD, edgesG);
  if (!validation.isValid) {
    return {
      status: 'error',
      bestPath: null,
      trace: [{
        type: 'validation-error',
        message: validation.error || 'Invalid graph input.',
        state: null,
        bestPath: null,
        counters: emptyCounters(),
        reason: validation.errorCode,
        stepCount: 1,
      }],
      states: [],
      counters,
      stepCount: 1,
      searchCompleted: false,
      proofCompleteEmitted: false,
      interruptedByCap: false,
      cancelled: false,
      error: { code: validation.errorCode!, node: validation.invalidNode, message: validation.error },
    };
  }

  if (hasCycle(vertices, edgesD)) {
    return {
      status: 'error',
      bestPath: null,
      trace: [{
        type: 'validation-error',
        message: 'Directed graph D contains a cycle.',
        state: null,
        bestPath: null,
        counters: emptyCounters(),
        reason: 'CYCLE_DETECTED',
        stepCount: 1,
      }],
      states: [],
      counters,
      stepCount: 1,
      searchCompleted: false,
      proofCompleteEmitted: false,
      interruptedByCap: false,
      cancelled: false,
      error: { code: 'CYCLE_DETECTED' },
    };
  }

  if (orderedVertices.length > operationalMaxVertices) {
    return unsupportedResult(operationalMaxVertices);
  }

  const adjD = buildAdjacency(orderedVertices, edgesD);
  const retained = new Map<string, string[]>();
  const queue: { mask: number; lastIndex: number }[] = [];
  const statesByKey = new Map<string, SubsetDpStateSnapshot>();

  addTrace({
    type: 'initialize',
    message: 'Initialize exact subset dynamic programming over canonical state (mask,lastVertex).',
    state: null,
    reason: 'canonical-state-mask-last',
  });

  for (const vertex of orderedVertices) {
    if (shouldStop()) break;
    const index = vertexIndex.get(vertex)!;
    const mask = vertexBit(index);
    const key = stateKey(mask, index);
    const path = [vertex];
    counters.statesCreated++;
    counters.statesRetained++;
    retained.set(key, path);
    queue.push({ mask, lastIndex: index });
    const state = snapshot(mask, vertex, path, orderedVertices, 'seeded');
    statesByKey.set(key, state);
    if (!addTrace({
      type: 'seed-state',
      message: `Seed singleton state ({${vertex}}, ${vertex}). Singletons are genomically connected.`,
      state,
      genomicConnected: true,
      retained: true,
      reason: 'singleton-connected',
    })) break;
    if (bestPath === null || comparePaths(path, bestPath) < 0) {
      bestPath = path;
      addTrace({
        type: 'incumbent-update',
        message: `New incumbent ${path.join(' -> ')}.`,
        state: snapshot(mask, vertex, path, orderedVertices, 'retained'),
        reason: 'accepted-better-state',
      });
    }
  }

  let head = 0;
  while (head < queue.length && !shouldStop()) {
    const item = queue[head++];
    const lastVertex = orderedVertices[item.lastIndex];
    const key = stateKey(item.mask, item.lastIndex);
    const path = retained.get(key);
    if (!path) continue;

    const processedState = snapshot(item.mask, lastVertex, path, orderedVertices, 'processed');
    statesByKey.set(key, processedState);
    if (!addTrace({
      type: 'state-dequeue',
      message: `Process DP state (${processedState.subset.join(', ')}, ${lastVertex}) with retained path ${path.join(' -> ')}.`,
      state: processedState,
      reason: 'future-extensions-depend-only-on-mask-and-last',
    })) break;

    for (const next of adjD[lastVertex] || []) {
      if (shouldStop()) break;
      const nextIndex = vertexIndex.get(next)!;
      const nextBit = vertexBit(nextIndex);
      const isNewToSubset = (item.mask & nextBit) === 0;
      counters.transitionsEvaluated++;
      if (!isNewToSubset) {
        addTrace({
          type: 'transition',
          message: `Reject transition to ${next}: repeated vertices are forbidden in a simple directed path.`,
          state: processedState,
          candidateNext: next,
          isNewToSubset,
          retained: false,
          reason: 'repeated-vertex',
        });
        continue;
      }

      const nextMask = item.mask | nextBit;
      const nextPath = [...path, next];
      counters.statesCreated++;
      const connected = isInducedGConnected(subsetFromMask(nextMask, orderedVertices), edgesG);
      const candidateState = snapshot(nextMask, next, nextPath, orderedVertices, connected ? 'queued' : 'rejected');
      if (!addTrace({
        type: 'transition',
        message: `Consider transition ${lastVertex} -> ${next} into state (${candidateState.subset.join(', ')}, ${next}).`,
        state: candidateState,
        candidateNext: next,
        isNewToSubset,
        genomicConnected: connected,
        reason: connected ? 'induced-G-connected' : 'induced-G-disconnected',
      })) break;

      if (!connected) {
        counters.genomicDisconnectedSubsetsRejected++;
        if (!addTrace({
          type: 'genomic-rejection',
          message: 'Candidate subset is not a valid incumbent because its induced G-subgraph is disconnected; the DP state is still retained for future extensions.',
          state: snapshot(nextMask, next, nextPath, orderedVertices, 'rejected'),
          candidateNext: next,
          isNewToSubset,
          genomicConnected: false,
          retained: false,
          reason: 'induced-G-disconnected',
        })) break;
      }

      const nextKey = stateKey(nextMask, nextIndex);
      const previous = retained.get(nextKey);
      const decision = retainLexicographicallySmallestState(previous, nextPath);
      if (decision.retained) {
        retained.set(nextKey, decision.path);
        counters.statesRetained++;
        queue.push({ mask: nextMask, lastIndex: nextIndex });
        const retainedState = snapshot(nextMask, next, decision.path, orderedVertices, 'retained');
        statesByKey.set(nextKey, retainedState);
        if (!addTrace({
          type: 'state-retained',
          message: previous
            ? 'Replace the retained path for this identical (mask,last) state with a lexicographically smaller prefix.'
            : 'Retain the first path for this (mask,last) state.',
          state: retainedState,
          candidateNext: next,
          isNewToSubset,
          genomicConnected: connected,
          retained: true,
          dominated: false,
          reason: connected ? 'lexicographically-best-prefix' : 'retained-for-future-extension',
        })) break;
        if (connected && (bestPath === null || comparePaths(decision.path, bestPath) < 0)) {
          bestPath = [...decision.path];
          if (!addTrace({
            type: 'incumbent-update',
            message: `New incumbent ${bestPath.join(' -> ')}.`,
            state: retainedState,
            reason: 'accepted-better-state',
          })) break;
        }
      } else {
        counters.dominatedDuplicateStatesDiscarded++;
        if (!addTrace({
          type: 'state-dominated',
          message: 'Discard duplicate (mask,last) state because the retained prefix is lexicographically smaller.',
          state: snapshot(nextMask, next, nextPath, orderedVertices, 'dominated'),
          candidateNext: next,
          isNewToSubset,
          genomicConnected: connected,
          retained: false,
          dominated: true,
          reason: 'same-mask-last-lex-dominated',
        })) break;
      }
    }
  }

  if (!cancelled && !interruptedByCap) {
    searchCompleted = true;
    const proofPath = bestPath ? [...bestPath] : null;
    const proofAdded = addTrace({
      type: 'proof-complete',
      message: proofPath ? `Search complete. Optimal path is ${proofPath.join(' -> ')}.` : 'Search complete. No valid path exists.',
      state: proofPath ? snapshot(proofPath.reduce((mask, vertex) => mask | vertexBit(vertexIndex.get(vertex)!), 0), proofPath[proofPath.length - 1], proofPath, orderedVertices, 'retained') : null,
      reason: 'all-reachable-dp-states-processed',
    });
    if (!proofAdded) interruptedByCap = true;
  }

  if (!searchCompleted || cancelled || interruptedByCap || !proofCompleteEmitted) {
    if (trace.length < maxEvents) {
      trace.push(incompleteTraceEvent(cancelled ? 'cancelled' : 'cap-reached', ++stepCount, bestPath, counters));
    }
    return {
      status: 'incomplete',
      bestPath,
      trace,
      states: [...statesByKey.values()],
      counters: cloneCounters(counters),
      stepCount,
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
    states: [...statesByKey.values()],
    counters: cloneCounters(counters),
    stepCount,
    searchCompleted,
    proofCompleteEmitted,
    interruptedByCap,
    cancelled,
  };
}
