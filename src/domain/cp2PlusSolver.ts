import { hasCycle, validateGraphs } from './graph';
import { comparePaths, isInducedGConnected } from './pathAlgorithms';

export type CP2PlusTraceType =
  | 'initialize'
  | 'choose-variable'
  | 'assign-successor'
  | 'candidate-path'
  | 'upper-bound'
  | 'incumbent-update'
  | 'genomic-rejection'
  | 'genomic-propagation-check'
  | 'genomic-propagation-prune'
  | 'bound-pruning'
  | 'backtrack'
  | 'cancelled'
  | 'cap-reached'
  | 'proof-complete'
  | 'validation-error';

export interface CP2PlusCounters {
  genomicPropagationChecks: number;
  genomicPropagationPrunes: number;
  directedBoundPrunes: number;
  statesExplored: number;
  eventsEmitted: number;
}

export interface CP2PlusTraceEvent {
  type: CP2PlusTraceType;
  message: string;
  currentPath: string[];
  bestPath: string[] | null;
  upperBound: number;
  counters: CP2PlusCounters;
  reason?: string;
  variable?: string;
  value?: string;
  forwardReachable?: string[];
  genomicComponents?: string[][];
  stepCount: number;
}

export interface CP2PlusSolverResult {
  status: 'optimal' | 'incomplete' | 'no-solution' | 'error';
  bestPath: string[] | null;
  trace: CP2PlusTraceEvent[];
  counters: CP2PlusCounters;
  stepCount: number;
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

export interface CP2PlusSolverOptions {
  maxEvents?: number;
  shouldCancel?: () => boolean;
}

function buildDirectedAdjacency(vertices: string[], edgesD: { from: string; to: string }[]) {
  const adj: Record<string, string[]> = {};
  for (const vertex of vertices) adj[vertex] = [];
  for (const edge of edgesD) adj[edge.from].push(edge.to);
  for (const vertex of vertices) adj[vertex].sort((a, b) => a.localeCompare(b));
  return adj;
}

function buildGenomicAdjacency(vertices: string[], edgesG: { u: string; v: string }[]) {
  const adj: Record<string, string[]> = {};
  for (const vertex of vertices) adj[vertex] = [];
  for (const edge of edgesG) {
    adj[edge.u].push(edge.v);
    adj[edge.v].push(edge.u);
  }
  for (const vertex of vertices) adj[vertex].sort((a, b) => a.localeCompare(b));
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
    for (const vertex of [...vertices].sort((a, b) => a.localeCompare(b))) {
      best = Math.max(best, longestSuffixFrom(vertex, adjD, new Set([vertex]), new Map()));
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
    const comparison = currentPath[i].localeCompare(incumbent[i]);
    if (comparison < 0) return true;
    if (comparison > 0) return false;
  }

  return currentPath.length <= incumbent.length;
}

export function collectForwardReachable(
  currentPath: string[],
  adjD: Record<string, string[]>
): string[] {
  if (currentPath.length === 0) return [];

  const used = new Set(currentPath);
  const reachable = new Set<string>();
  const stack = [currentPath[currentPath.length - 1]];

  while (stack.length > 0) {
    const current = stack.pop()!;
    for (const next of adjD[current] || []) {
      if (used.has(next) || reachable.has(next)) continue;
      reachable.add(next);
      stack.push(next);
    }
  }

  return [...reachable].sort((a, b) => a.localeCompare(b));
}

function selectedGenomicComponents(
  currentPath: string[],
  possibleVertices: Set<string>,
  adjG: Record<string, string[]>
): string[][] {
  const selected = new Set(currentPath);
  const seenSelected = new Set<string>();
  const components: string[][] = [];

  for (const start of currentPath) {
    if (seenSelected.has(start)) continue;
    const queue = [start];
    const seenPossible = new Set([start]);
    const component: string[] = [];
    let head = 0;

    while (head < queue.length) {
      const current = queue[head++];
      if (selected.has(current)) {
        seenSelected.add(current);
        component.push(current);
      }
      for (const next of adjG[current] || []) {
        if (possibleVertices.has(next) && !seenPossible.has(next)) {
          seenPossible.add(next);
          queue.push(next);
        }
      }
    }

    components.push(component.sort((a, b) => a.localeCompare(b)));
  }

  return components;
}

export function inspectGenomicPropagation(
  currentPath: string[],
  adjD: Record<string, string[]>,
  adjG: Record<string, string[]>
): { forwardReachable: string[]; genomicComponents: string[][]; canReconnect: boolean } {
  if (currentPath.length <= 1) {
    return {
      forwardReachable: currentPath.length === 0 ? [] : collectForwardReachable(currentPath, adjD),
      genomicComponents: currentPath.length === 0 ? [] : [[currentPath[0]]],
      canReconnect: true,
    };
  }

  const forwardReachable = collectForwardReachable(currentPath, adjD);
  const possibleVertices = new Set([...currentPath, ...forwardReachable]);
  const genomicComponents = selectedGenomicComponents(currentPath, new Set(currentPath), adjG);
  return {
    forwardReachable,
    genomicComponents,
    canReconnect: selectedGenomicComponents(currentPath, possibleVertices, adjG).length <= 1,
  };
}

function emptyCounters(): CP2PlusCounters {
  return {
    genomicPropagationChecks: 0,
    genomicPropagationPrunes: 0,
    directedBoundPrunes: 0,
    statesExplored: 0,
    eventsEmitted: 0,
  };
}

export function solveCP2Plus(
  vertices: string[],
  edgesD: { from: string; to: string }[],
  edgesG: { u: string; v: string }[],
  options: CP2PlusSolverOptions | number = {}
): CP2PlusSolverResult {
  const maxEvents = typeof options === 'number' ? options : options.maxEvents ?? 5000;
  const shouldCancel = typeof options === 'number' ? undefined : options.shouldCancel;
  const trace: CP2PlusTraceEvent[] = [];
  const counters = emptyCounters();
  let stepCount = 0;
  let bestPath: string[] | null = null;
  let searchCompleted = false;
  let proofCompleteEmitted = false;
  let interruptedByCap = false;
  let cancelled = false;

  function addTrace(
    event: Omit<CP2PlusTraceEvent, 'stepCount' | 'bestPath' | 'counters'>
  ): boolean {
    if (trace.length >= maxEvents) {
      interruptedByCap = true;
      return false;
    }

    stepCount++;
    counters.eventsEmitted++;
    trace.push({
      ...event,
      bestPath: bestPath ? [...bestPath] : null,
      counters: { ...counters },
      stepCount,
    });
    if (event.type === 'proof-complete') proofCompleteEmitted = true;
    return true;
  }

  const validation = validateGraphs(vertices, edgesD, edgesG);
  if (!validation.isValid) {
    const event: CP2PlusTraceEvent = {
      type: 'validation-error',
      message: validation.error || 'Invalid graph input.',
      currentPath: [],
      bestPath: null,
      upperBound: 0,
      counters: { ...counters, eventsEmitted: 1 },
      reason: validation.errorCode,
      stepCount: 1,
    };
    return {
      status: 'error',
      bestPath: null,
      trace: [event],
      counters: event.counters,
      stepCount: 1,
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
    const event: CP2PlusTraceEvent = {
      type: 'validation-error',
      message: 'Directed graph D contains a cycle.',
      currentPath: [],
      bestPath: null,
      upperBound: 0,
      counters: { ...counters, eventsEmitted: 1 },
      reason: 'CYCLE_DETECTED',
      stepCount: 1,
    };
    return {
      status: 'error',
      bestPath: null,
      trace: [event],
      counters: event.counters,
      stepCount: 1,
      searchCompleted: false,
      proofCompleteEmitted: false,
      interruptedByCap: false,
      cancelled: false,
      error: { code: 'CYCLE_DETECTED' },
    };
  }

  const adjD = buildDirectedAdjacency(vertices, edgesD);
  const adjG = buildGenomicAdjacency(vertices, edgesG);
  const orderedVertices = [...vertices].sort((a, b) => a.localeCompare(b));
  const initialUpperBound = safeUpperBound([], vertices, adjD);

  addTrace({
    type: 'initialize',
    message: 'Initialize CP2+ bounded search over simple directed paths in D.',
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

    counters.statesExplored++;
    const upperBound = safeUpperBound(currentPath, vertices, adjD);
    if (!addTrace({
      type: 'upper-bound',
      message: `Directed upper bound for this branch is ${upperBound}.`,
      currentPath,
      upperBound,
      reason: 'current length plus longest remaining directed suffix in D',
    })) return;

    if (bestPath && !prefixCanStillBeatIncumbent(currentPath, bestPath, upperBound)) {
      counters.directedBoundPrunes++;
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
      counters.genomicPropagationChecks++;
      const inspection = inspectGenomicPropagation(currentPath, adjD, adjG);
      if (!addTrace({
        type: 'genomic-propagation-check',
        message: inspection.canReconnect
          ? 'Forward-reachable unused vertices still leave genomic reconnection possible.'
          : 'Selected vertices remain separated even after adding every forward-reachable unused vertex.',
        currentPath,
        upperBound,
        reason: inspection.canReconnect ? 'relaxed-forward-reconnection-possible' : 'no-forward-reachable-genomic-bridge',
        forwardReachable: inspection.forwardReachable,
        genomicComponents: inspection.genomicComponents,
      })) return;

      if (!inspection.canReconnect) {
        counters.genomicPropagationPrunes++;
        addTrace({
          type: 'genomic-propagation-prune',
          message: 'SAFE GENOMIC PRUNE: no forward-reachable genomic bridge can reconnect the selected components.',
          currentPath,
          upperBound,
          reason: 'no-forward-reachable-genomic-bridge',
          forwardReachable: inspection.forwardReachable,
          genomicComponents: inspection.genomicComponents,
        });
        return;
      }

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
          message: 'Current candidate is disconnected in G, but its branch remains searchable because repair is still possible.',
          currentPath,
          upperBound,
          reason: 'induced-G-disconnected',
        });
      }
    }

    const branchValues = currentPath.length === 0
      ? orderedVertices
      : (adjD[currentPath[currentPath.length - 1]] || []).filter((vertex) => !visited.has(vertex));

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
    addTrace({
      type: incompleteType,
      message: cancelled ? 'Search cancelled before proof completion.' : 'Event cap reached before proof completion.',
      currentPath: [],
      upperBound: 0,
    });
    return {
      status: 'incomplete',
      bestPath,
      trace,
      counters: { ...counters },
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
    counters: { ...counters },
    stepCount,
    searchCompleted,
    proofCompleteEmitted,
    interruptedByCap,
    cancelled,
  };
}
