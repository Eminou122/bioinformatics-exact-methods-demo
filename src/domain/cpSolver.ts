import { hasCycle, validateGraphs, type VertexId } from './graph';
import { comparePaths, isInducedGConnected } from './pathAlgorithms';


export type SuccessorState =
  | { kind: "unselected" }
  | { kind: "end" }
  | { kind: "vertex"; vertexId: VertexId };

export function stateToString(s: SuccessorState): string {
  if (s.kind === 'unselected') return 'UNSELECTED';
  if (s.kind === 'end') return 'END';
  return s.vertexId;
}

export function hasStateKind(arr: SuccessorState[], kind: SuccessorState['kind']): boolean {
  return arr.some(s => s.kind === kind);
}

export function hasStateVertex(arr: SuccessorState[], vertexId: VertexId): boolean {
  return arr.some(s => s.kind === 'vertex' && s.vertexId === vertexId);
}

export interface CP1Domains {
  x: Record<string, number[]>; // [0, 1], [0], or [1]
  succ: Record<string, SuccessorState[]>; // outgoing neighbors + 'UNSELECTED' + 'END'
  start: SuccessorState[]; // potential start nodes
  end: SuccessorState[]; // potential end nodes
}

export interface CP1TraceEvent {
  type:
    | 'initialize'
    | 'choose-variable'
    | 'choose-value'
    | 'propagate'
    | 'domain-remove'
    | 'contradiction'
    | 'backtrack'
    | 'candidate-complete'
    | 'incumbent-update'
    | 'cancelled'
    | 'proof-complete'
    | 'validation-error';
  variable?: string;
  value?: unknown;
  message: string;
  domains: CP1Domains;
  currentPath: string[];
  bestPath: string[] | null;
  stepCount: number;
}

export interface CP1SolverResult {
  status: 'optimal' | 'incomplete' | 'no-solution' | 'error';
  bestPath: string[] | null;
  trace: CP1TraceEvent[];
  stepCount: number;
  error?: {
    code: 'CYCLE_DETECTED' | 'INVALID_NODE_D' | 'INVALID_NODE_G' | 'DUPLICATE_EDGE_D' | 'DUPLICATE_EDGE_G';
    node?: string;
    message?: string;
  };
}

/**
 * Deep copies the solver domains state.
 */
function cloneDomains(domains: CP1Domains): CP1Domains {
  const x: Record<string, number[]> = {};
  for (const k in domains.x) {
    x[k] = [...domains.x[k]];
  }
  const succ: Record<string, SuccessorState[]> = {};
  for (const k in domains.succ) {
    succ[k] = [...domains.succ[k]];
  }
  return {
    x,
    succ,
    start: [...domains.start],
    end: [...domains.end],
  };
}

export function solveCP1(
  vertices: string[],
  edgesD: { from: string; to: string }[],
  edgesG: { u: string; v: string }[],
  maxEvents: number = 1000
): CP1SolverResult {
  const trace: CP1TraceEvent[] = [];
  let stepCount = 0;
  let bestPath: string[] | null = null;
  let searchCompleted = false;
  let proofCompleteEmitted = false;
  let interruptedByCap = false;
  let cancelled = false;

  function addTrace(
    type: CP1TraceEvent['type'],
    message: string,
    domains: CP1Domains,
    currentPath: string[],
    variable?: string,
    value?: unknown
  ) {
    stepCount++;

    if (type !== 'cancelled' && type !== 'proof-complete') {
      if (trace.length >= maxEvents) {
        cancelled = true;
        interruptedByCap = true;
        return;
      }
    }

    if (type === 'proof-complete') {
      if (trace.length >= maxEvents) {
        cancelled = true;
        interruptedByCap = true;
        return;
      }
      proofCompleteEmitted = true;
    }

    trace.push({
      type,
      variable,
      value,
      message,
      domains: cloneDomains(domains),
      currentPath: [...currentPath],
      bestPath: bestPath ? [...bestPath] : null,
      stepCount,
    });
  }

  // 1. Validation
  const validation = validateGraphs(vertices, edgesD, edgesG);
  if (!validation.isValid) {
    const errorDetails = {
      code: validation.errorCode!,
      node: validation.invalidNode,
      message: validation.error,
    };
    return {
      status: 'error',
      bestPath: null,
      trace: [],
      stepCount: 0,
      error: errorDetails,
    };
  }

  if (hasCycle(vertices, edgesD)) {
    return {
      status: 'error',
      bestPath: null,
      trace: [],
      stepCount: 0,
      error: { code: 'CYCLE_DETECTED' },
    };
  }

  // 2. Initialize domains
  const adjD: Record<string, string[]> = {};
  const adjG: Record<string, string[]> = {};
  for (const v of vertices) {
    adjD[v] = [];
    adjG[v] = [];
  }
  for (const edge of edgesD) {
    adjD[edge.from].push(edge.to);
  }
  for (const edge of edgesG) {
    adjG[edge.u].push(edge.v);
    adjG[edge.v].push(edge.u);
  }

  const initialDomains: CP1Domains = {
    x: {},
    succ: {},
    start: [...vertices.map(v => ({ kind: 'vertex', vertexId: v } as SuccessorState)), { kind: 'unselected' }],
    end: [...vertices.map(v => ({ kind: 'vertex', vertexId: v } as SuccessorState)), { kind: 'unselected' }],
  };

  for (const v of vertices) {
    initialDomains.x[v] = [0, 1];
    initialDomains.succ[v] = [...adjD[v].map(u => ({ kind: 'vertex', vertexId: u } as SuccessorState)), { kind: 'unselected' }, { kind: 'end' }];
  }

  addTrace(
    'initialize',
    'Initialize domains: x_v ∈ {0,1}, succ_v ∈ {outgoing(v), UNSELECTED, END}, start/end ∈ V ∪ {UNSELECTED}.',
    initialDomains,
    []
  );

  // Connectivity propagation helper
  function checkConnectivityPropagation(
    currentPath: string[]
  ): { ok: boolean; prunedVar?: string; prunedVal?: unknown; msg?: string } {
    if (currentPath.length <= 1) return { ok: true };

    const pathNodes = new Set(currentPath);
    const unvisited = vertices.filter((v) => !pathNodes.has(v));

    for (const u of currentPath) {
      const hasGEdgeInPath = adjG[u].some((v) => pathNodes.has(v));
      if (!hasGEdgeInPath) {
        // u is isolated inside the current path.
        // Can it be reconnected by any remaining unvisited nodes?
        const hasGEdgeToUnvisited = adjG[u].some((v) => unvisited.includes(v));
        if (!hasGEdgeToUnvisited) {
          // Permanently disconnected!
          return {
            ok: false,
            prunedVar: `x[${u}]`,
            prunedVal: 1,
            msg: `Node ${u} is isolated in G and has no G-edges to any remaining unvisited nodes. It can never be connected to the path.`,
          };
        }
      }
    }

    return { ok: true };
  }

  // Domain propagation helper
  function propagateDomains(
    domains: CP1Domains
  ): boolean {
    let changed = true;
    while (changed) {
      changed = false;

      for (const v of vertices) {
        const xDom = domains.x[v];
        const succDom = domains.succ[v];

        // succ[v] = UNSELECTED <=> x[v] = 0
        if (xDom.length === 1 && xDom[0] === 0) {
          if (succDom.length > 1 || succDom[0].kind !== 'unselected') {
            domains.succ[v] = [{ kind: 'unselected' }];
            changed = true;
          }
        }
        if (succDom.length === 1 && succDom[0].kind === 'unselected') {
          if (xDom.length > 1 || xDom[0] !== 0) {
            domains.x[v] = [0];
            changed = true;
          }
        }

        // succ[v] != UNSELECTED <=> x[v] = 1
        if (xDom.length === 1 && xDom[0] === 1) {
          if (hasStateKind(succDom, 'unselected')) {
            domains.succ[v] = succDom.filter((s) => s.kind !== 'unselected');
            changed = true;
          }
        }
        if (!hasStateKind(succDom, 'unselected')) {
          if (xDom.length > 1 || xDom[0] !== 1) {
            domains.x[v] = [1];
            changed = true;
          }
        }

        // succ[v] = u (neighbor node ID) => x[u] = 1
        if (succDom.length === 1 && succDom[0].kind !== 'unselected' && succDom[0].kind !== 'end') {
          const u = (succDom[0] as { kind: 'vertex', vertexId: VertexId }).vertexId;
          if (domains.x[u] && (domains.x[u].length > 1 || domains.x[u][0] !== 1)) {
            domains.x[u] = [1];
            changed = true;
          }
        }
      }

      // Check if any domain is empty (contradiction)
      for (const v of vertices) {
        if (domains.x[v].length === 0 || domains.succ[v].length === 0) {
          return false;
        }
      }
    }
    return true;
  }

  // Recursive backtracking solver
  function search(currentPath: string[], domains: CP1Domains): boolean {
    if (cancelled || interruptedByCap) return false;

    // Run propagation before making a decision
    const connCheck = checkConnectivityPropagation(currentPath);
    if (!connCheck.ok) {
      addTrace(
        'contradiction',
        `Pruned: ${connCheck.msg}`,
        domains,
        currentPath,
        connCheck.prunedVar,
        connCheck.prunedVal
      );
      addTrace('backtrack', `Backtracking from path prefix: ${currentPath.join(' -> ')}`, domains, currentPath);
      return false;
    }

    // Run domain filtering propagation
    if (!propagateDomains(domains)) {
      addTrace(
        'contradiction',
        `Contradiction in domain propagation.`,
        domains,
        currentPath
      );
      addTrace('backtrack', `Backtracking due to propagation failure.`, domains, currentPath);
      return false;
    }

    // Determine if the path is complete
    const isPathEmpty = currentPath.length === 0;
    const currentEndNode = isPathEmpty ? null : currentPath[currentPath.length - 1];

    if (!isPathEmpty && currentEndNode) {
      // We have a path. Branch on the successor of the currentEndNode
      const succDomain = domains.succ[currentEndNode];

      if (succDomain.length === 0) {
        addTrace(
          'contradiction',
          `No valid successors remaining for node ${currentEndNode}.`,
          domains,
          currentPath
        );
        addTrace('backtrack', `Backtracking from path prefix: ${currentPath.join(' -> ')}`, domains, currentPath);
        return false;
      }

      // Sort branch options to try extending first, then ending ('END').
      // Remove UNSELECTED from branch options since currentEndNode is selected
      const branchOptions = succDomain.filter((s) => s.kind !== 'unselected').sort((a, b) => {
        if (a.kind === 'end') return 1;
        if (b.kind === 'end') return -1;
        if (a.kind === 'vertex' && b.kind === 'vertex') return a.vertexId.localeCompare(b.vertexId);
        return 0;
      });

      addTrace(
        'choose-variable',
        `Select successor variable succ[${currentEndNode}] (domain: [${succDomain.map(stateToString).join(', ')}]).`,
        domains,
        currentPath,
        `succ[${currentEndNode}]`
      );

      for (const val of branchOptions) {
        if (cancelled || interruptedByCap) return false;

        const nextDomains = cloneDomains(domains);
        nextDomains.succ[currentEndNode] = [val];

        addTrace(
          'choose-value',
          `Assign succ[${currentEndNode}] = ${stateToString(val)}.`,
          nextDomains,
          currentPath,
          `succ[${currentEndNode}]`,
          val
        );

        if (val.kind === 'end') {
          // Path ends here!
          // Force all nodes in the path to be selected (x = 1, succ != UNSELECTED)
          // and all other nodes to be unselected (x = 0, succ = UNSELECTED)
          for (const v of vertices) {
            if (currentPath.includes(v)) {
              nextDomains.x[v] = [1];
            } else {
              nextDomains.x[v] = [0];
              nextDomains.succ[v] = [{ kind: 'unselected' }];
            }
          }
          nextDomains.end = [{ kind: 'vertex', vertexId: currentEndNode }];

          addTrace(
            'propagate',
            `Path completed. Set x_v = 1 for path nodes, x_v = 0/succ_v = UNSELECTED for others. Set end = ${currentEndNode}.`,
            nextDomains,
            currentPath
          );

          // Evaluate candidate path
          const isGConnected = isInducedGConnected(currentPath, edgesG);
          if (isGConnected) {
            addTrace(
              'candidate-complete',
              `Candidate path ${currentPath.join(' -> ')} is connected in G.`,
              nextDomains,
              currentPath
            );

            // Update incumbent
            if (bestPath === null || comparePaths(currentPath, bestPath) < 0) {
              bestPath = [...currentPath];
              addTrace(
                'incumbent-update',
                `New best (D,G)-consistent path found: ${bestPath.join(' → ')} (length ${bestPath.length}).`,
                nextDomains,
                currentPath
              );
            }
          } else {
            addTrace(
              'contradiction',
              `Candidate path ${currentPath.join(' -> ')} is rejected because its vertices are disconnected in G.`,
              nextDomains,
              currentPath
            );
          }
          
          addTrace('backtrack', `Backtracking to find alternative paths.`, nextDomains, currentPath);
        } else {
          // val is a node. Extend path!
          const valVertex = (val as { kind: 'vertex', vertexId: VertexId }).vertexId;
          if (currentPath.includes(valVertex)) {
            // Cycle check
            addTrace(
              'contradiction',
              `Cycle detected: node ${valVertex} is already in the path.`,
              nextDomains,
              currentPath
            );
            addTrace('backtrack', `Backtracking.`, nextDomains, currentPath);
            continue;
          }

          nextDomains.x[valVertex] = [1];
          const extendedPath = [...currentPath, valVertex];

          addTrace(
            'propagate',
            `Set x[${valVertex}] = 1. Extend path to ${extendedPath.join(' -> ')}.`,
            nextDomains,
            extendedPath
          );

          search(extendedPath, nextDomains);
        }
      }
    } else {
      // Path is empty: branch on the start node
      const startOptions = domains.start.filter((v) => v.kind === 'vertex') as { kind: 'vertex', vertexId: VertexId }[];
      
      addTrace(
        'choose-variable',
        `Select start node variable (domain: [${startOptions.map(stateToString).join(', ')}]).`,
        domains,
        [],
        'start'
      );

      for (const startNodeState of startOptions) {
        const startNode = startNodeState.vertexId;
        if (cancelled || interruptedByCap) return false;

        const nextDomains = cloneDomains(domains);
        nextDomains.start = [startNodeState];
        nextDomains.x[startNode] = [1];

        addTrace(
          'choose-value',
          `Assign start = ${startNode}. Set x[${startNode}] = 1.`,
          nextDomains,
          [startNode],
          'start',
          startNode
        );

        search([startNode], nextDomains);
      }
    }

    return true;
  }

  // Start search
  search([], initialDomains);

  if (!cancelled && !interruptedByCap) {
    searchCompleted = true;
  }

  if (searchCompleted && !cancelled && !interruptedByCap) {
    const optimalPath = bestPath as string[] | null;
    addTrace(
      'proof-complete',
      optimalPath
        ? `Search complete. Optimal solution is ${optimalPath.join(' → ')}.`
        : 'Search complete. No valid (D,G)-consistent path exists.',
      initialDomains,
      optimalPath ? optimalPath : []
    );
  }

  const allConditionsForOptimalMet =
    searchCompleted &&
    !cancelled &&
    !interruptedByCap &&
    proofCompleteEmitted;

  if (!allConditionsForOptimalMet) {
    const hasCancelledEvent = trace.some((e) => e.type === 'cancelled');
    if (!hasCancelledEvent) {
      trace.push({
        type: 'cancelled',
        message: 'Solver reached step limit or was cancelled.',
        domains: cloneDomains(initialDomains),
        currentPath: [],
        bestPath: bestPath ? [...bestPath] : null,
        stepCount: ++stepCount,
      });
    }
    return {
      status: 'incomplete',
      bestPath,
      trace,
      stepCount,
    };
  }

  return {
    status: bestPath ? 'optimal' : 'no-solution',
    bestPath,
    trace,
    stepCount,
  };
}
