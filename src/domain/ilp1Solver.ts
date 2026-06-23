import { hasCycle, getArcId, getEdgeId, validateGraphs } from './graph';
import { comparePaths, enumeratePaths } from './pathAlgorithms';

export type ILP1TraceType =
  | 'initialize'
  | 'define-variable'
  | 'assign-vertex'
  | 'assign-metabolic-arc'
  | 'assign-genomic-edge'
  | 'constraint-check'
  | 'candidate-path'
  | 'connectivity-witness'
  | 'constraint-rejection'
  | 'incumbent-update'
  | 'backtrack'
  | 'cancelled'
  | 'cap-reached'
  | 'proof-complete'
  | 'validation-error';

export interface ILP1DecisionData {
  x: Record<string, 0 | 1>;
  y: Record<string, 0 | 1>;
  z: Record<string, 0 | 1>;
}

export interface ILP1ConstraintReport {
  feasible: boolean;
  reasons: string[];
  canonicalPath: string[] | null;
}

export interface ILP1Candidate {
  path: string[];
  decisions: ILP1DecisionData;
  witnessEdges: { u: string; v: string }[];
  report: ILP1ConstraintReport;
}

export interface ILP1TraceEvent {
  type: ILP1TraceType;
  message: string;
  currentPath: string[];
  bestPath: string[] | null;
  decisions: ILP1DecisionData | null;
  witnessEdges: { u: string; v: string }[];
  exploredCandidates: number;
  rejectedCandidates: number;
  reason?: string;
  stepCount: number;
}

export interface ILP1SolverResult {
  status: 'optimal' | 'incomplete' | 'no-solution' | 'error';
  bestPath: string[] | null;
  bestCandidate: ILP1Candidate | null;
  trace: ILP1TraceEvent[];
  stepCount: number;
  exploredCandidates: number;
  rejectedCandidates: number;
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

export interface ILP1SolverOptions {
  maxEvents?: number;
  shouldCancel?: () => boolean;
}

function cloneDecisions(decisions: ILP1DecisionData | null): ILP1DecisionData | null {
  if (!decisions) return null;
  return {
    x: { ...decisions.x },
    y: { ...decisions.y },
    z: { ...decisions.z },
  };
}

function initializeDecisionData(
  vertices: string[],
  edgesD: { from: string; to: string }[],
  edgesG: { u: string; v: string }[]
): ILP1DecisionData {
  const x: Record<string, 0 | 1> = {};
  const y: Record<string, 0 | 1> = {};
  const z: Record<string, 0 | 1> = {};

  for (const vertex of vertices) x[vertex] = 0;
  for (const edge of edgesD) y[getArcId(edge.from, edge.to)] = 0;
  for (const edge of edgesG) z[getEdgeId(edge.u, edge.v)] = 0;

  return { x, y, z };
}

function buildGAdjacency(vertices: string[], edgesG: { u: string; v: string }[], selected: Set<string>) {
  const adj: Record<string, string[]> = {};
  for (const vertex of vertices) {
    if (selected.has(vertex)) adj[vertex] = [];
  }
  for (const edge of edgesG) {
    if (selected.has(edge.u) && selected.has(edge.v)) {
      adj[edge.u].push(edge.v);
      adj[edge.v].push(edge.u);
    }
  }
  for (const vertex of Object.keys(adj)) adj[vertex].sort((a, b) => a.localeCompare(b));
  return adj;
}

export function buildGenomicWitness(
  selectedPath: string[],
  vertices: string[],
  edgesG: { u: string; v: string }[]
): { connected: boolean; witnessEdges: { u: string; v: string }[] } {
  if (selectedPath.length <= 1) {
    return { connected: true, witnessEdges: [] };
  }

  const selected = new Set(selectedPath);
  const adj = buildGAdjacency(vertices, edgesG, selected);
  const root = [...selectedPath].sort((a, b) => a.localeCompare(b))[0];
  const visited = new Set<string>([root]);
  const queue = [root];
  const witnessEdges: { u: string; v: string }[] = [];
  let head = 0;

  while (head < queue.length) {
    const current = queue[head++];
    for (const next of adj[current] || []) {
      if (!visited.has(next)) {
        visited.add(next);
        queue.push(next);
        witnessEdges.push({ u: current, v: next });
      }
    }
  }

  return {
    connected: visited.size === selected.size,
    witnessEdges: visited.size === selected.size ? witnessEdges : [],
  };
}

export function deriveILP1Candidate(
  path: string[],
  vertices: string[],
  edgesD: { from: string; to: string }[],
  edgesG: { u: string; v: string }[]
): ILP1Candidate {
  const decisions = initializeDecisionData(vertices, edgesD, edgesG);
  for (const vertex of path) decisions.x[vertex] = 1;
  for (let i = 0; i < path.length - 1; i++) {
    decisions.y[getArcId(path[i], path[i + 1])] = 1;
  }

  const witness = buildGenomicWitness(path, vertices, edgesG);
  for (const edge of witness.witnessEdges) {
    decisions.z[getEdgeId(edge.u, edge.v)] = 1;
  }

  const report = validateILP1Assignment(vertices, edgesD, edgesG, decisions);
  return {
    path,
    decisions,
    witnessEdges: witness.witnessEdges,
    report,
  };
}

export function validateILP1Assignment(
  vertices: string[],
  edgesD: { from: string; to: string }[],
  edgesG: { u: string; v: string }[],
  decisions: ILP1DecisionData
): ILP1ConstraintReport {
  const reasons: string[] = [];
  const selectedVertices = vertices.filter((vertex) => decisions.x[vertex] === 1);
  const selected = new Set(selectedVertices);
  const incomingCount: Record<string, number> = {};
  const outgoingCount: Record<string, number> = {};
  const outSelected: Record<string, string[]> = {};
  const inSelected: Record<string, string[]> = {};

  for (const vertex of vertices) {
    incomingCount[vertex] = 0;
    outgoingCount[vertex] = 0;
    outSelected[vertex] = [];
    inSelected[vertex] = [];
  }

  for (const edge of edgesD) {
    const selectedArc = decisions.y[getArcId(edge.from, edge.to)] === 1;
    if (!selectedArc) continue;
    if (!selected.has(edge.from) || !selected.has(edge.to)) {
      reasons.push('selected-arc-has-unselected-endpoint');
    }
    outgoingCount[edge.from]++;
    incomingCount[edge.to]++;
    outSelected[edge.from].push(edge.to);
    inSelected[edge.to].push(edge.from);
  }

  for (const vertex of selectedVertices) {
    if (incomingCount[vertex] > 1) reasons.push('selected-vertex-has-multiple-predecessors');
    if (outgoingCount[vertex] > 1) reasons.push('selected-vertex-has-multiple-successors');
  }

  let canonicalPath: string[] | null = null;
  if (selectedVertices.length === 0) {
    reasons.push('no-selected-vertices');
  } else if (selectedVertices.length === 1) {
    const only = selectedVertices[0];
    if (incomingCount[only] !== 0 || outgoingCount[only] !== 0) reasons.push('singleton-has-selected-arcs');
    canonicalPath = [only];
  } else {
    const starts = selectedVertices.filter((vertex) => incomingCount[vertex] === 0);
    const ends = selectedVertices.filter((vertex) => outgoingCount[vertex] === 0);
    const selectedArcCount = edgesD.filter((edge) => decisions.y[getArcId(edge.from, edge.to)] === 1).length;
    if (starts.length !== 1 || ends.length !== 1) reasons.push('selected-arcs-do-not-form-one-directed-path');
    if (selectedArcCount !== selectedVertices.length - 1) reasons.push('selected-arc-count-not-k-minus-one');

    if (starts.length === 1) {
      const path: string[] = [];
      const seen = new Set<string>();
      let current: string | undefined = starts[0];
      while (current !== undefined) {
        if (seen.has(current)) {
          reasons.push('repeated-vertex-in-path');
          break;
        }
        seen.add(current);
        path.push(current);
        const nextValues: string[] = outSelected[current];
        current = nextValues.length === 1 ? nextValues[0] : undefined;
      }
      if (seen.size !== selectedVertices.length) reasons.push('selected-vertices-are-disconnected-fragments');
      canonicalPath = path;
    }
  }

  const selectedGEdges = edgesG.filter((edge) => decisions.z[getEdgeId(edge.u, edge.v)] === 1);
  for (const edge of selectedGEdges) {
    if (!selected.has(edge.u) || !selected.has(edge.v)) {
      reasons.push('genomic-witness-uses-unselected-vertex');
    }
  }

  if (selectedVertices.length <= 1) {
    if (selectedGEdges.length !== 0) reasons.push('singleton-witness-must-have-zero-edges');
  } else {
    if (selectedGEdges.length !== selectedVertices.length - 1) reasons.push('genomic-tree-edge-count-not-k-minus-one');
    const adj: Record<string, string[]> = {};
    for (const vertex of selectedVertices) adj[vertex] = [];
    for (const edge of selectedGEdges) {
      if (selected.has(edge.u) && selected.has(edge.v)) {
        adj[edge.u].push(edge.v);
        adj[edge.v].push(edge.u);
      }
    }
    const visited = new Set<string>();
    const queue = [selectedVertices[0]];
    visited.add(selectedVertices[0]);
    let head = 0;
    while (head < queue.length) {
      const current = queue[head++];
      for (const next of adj[current] || []) {
        if (!visited.has(next)) {
          visited.add(next);
          queue.push(next);
        }
      }
    }
    if (visited.size !== selectedVertices.length) reasons.push('selected-vertices-not-connected-by-genomic-witness');
  }

  return {
    feasible: reasons.length === 0,
    reasons: [...new Set(reasons)],
    canonicalPath,
  };
}

function incompleteTraceEvent(
  type: 'cancelled' | 'cap-reached',
  stepCount: number,
  bestPath: string[] | null,
  exploredCandidates: number,
  rejectedCandidates: number
): ILP1TraceEvent {
  return {
    type,
    message: type === 'cancelled' ? 'Search cancelled before proof completion.' : 'Event cap reached before proof completion.',
    currentPath: [],
    bestPath: bestPath ? [...bestPath] : null,
    decisions: null,
    witnessEdges: [],
    exploredCandidates,
    rejectedCandidates,
    reason: type,
    stepCount,
  };
}

export function solveILP1(
  vertices: string[],
  edgesD: { from: string; to: string }[],
  edgesG: { u: string; v: string }[],
  options: ILP1SolverOptions | number = {}
): ILP1SolverResult {
  const maxEvents = typeof options === 'number' ? options : options.maxEvents ?? 6000;
  const shouldCancel = typeof options === 'number' ? undefined : options.shouldCancel;
  const trace: ILP1TraceEvent[] = [];
  let stepCount = 0;
  let exploredCandidates = 0;
  let rejectedCandidates = 0;
  let bestPath: string[] | null = null;
  let bestCandidate: ILP1Candidate | null = null;
  let searchCompleted = false;
  let proofCompleteEmitted = false;
  let interruptedByCap = false;
  let cancelled = false;

  function addTrace(event: Omit<ILP1TraceEvent, 'bestPath' | 'exploredCandidates' | 'rejectedCandidates' | 'stepCount'>): boolean {
    if (trace.length >= maxEvents) {
      interruptedByCap = true;
      return false;
    }
    stepCount++;
    trace.push({
      ...event,
      bestPath: bestPath ? [...bestPath] : null,
      decisions: cloneDecisions(event.decisions),
      witnessEdges: event.witnessEdges.map((edge) => ({ ...edge })),
      exploredCandidates,
      rejectedCandidates,
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

  const validation = validateGraphs(vertices, edgesD, edgesG);
  if (!validation.isValid) {
    return {
      status: 'error',
      bestPath: null,
      bestCandidate: null,
      trace: [{
        type: 'validation-error',
        message: validation.error || 'Invalid graph input.',
        currentPath: [],
        bestPath: null,
        decisions: null,
        witnessEdges: [],
        exploredCandidates: 0,
        rejectedCandidates: 0,
        reason: validation.errorCode,
        stepCount: 1,
      }],
      stepCount: 1,
      exploredCandidates: 0,
      rejectedCandidates: 0,
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
      bestCandidate: null,
      trace: [{
        type: 'validation-error',
        message: 'Directed graph D contains a cycle.',
        currentPath: [],
        bestPath: null,
        decisions: null,
        witnessEdges: [],
        exploredCandidates: 0,
        rejectedCandidates: 0,
        reason: 'CYCLE_DETECTED',
        stepCount: 1,
      }],
      stepCount: 1,
      exploredCandidates: 0,
      rejectedCandidates: 0,
      searchCompleted: false,
      proofCompleteEmitted: false,
      interruptedByCap: false,
      cancelled: false,
      error: { code: 'CYCLE_DETECTED' },
    };
  }

  addTrace({
    type: 'initialize',
    message: 'Initialize ILP1 educational bounded formulation.',
    currentPath: [],
    decisions: null,
    witnessEdges: [],
    reason: 'bounded-enumeration',
  });
  for (const family of ['x_v', 'y_a', 'z_e']) {
    addTrace({
      type: 'define-variable',
      message: `Define binary variable family ${family}.`,
      currentPath: [],
      decisions: null,
      witnessEdges: [],
      reason: family,
    });
  }

  const paths = enumeratePaths(vertices, edgesD).sort(comparePaths);
  for (const path of paths) {
    if (shouldStop()) break;
    exploredCandidates++;
    const candidate = deriveILP1Candidate(path, vertices, edgesD, edgesG);

    if (!addTrace({
      type: 'candidate-path',
      message: `Evaluate candidate path ${path.join(' -> ')}.`,
      currentPath: path,
      decisions: candidate.decisions,
      witnessEdges: candidate.witnessEdges,
      reason: 'candidate-path',
    })) break;

    for (const vertex of path) {
      if (!addTrace({
        type: 'assign-vertex',
        message: `Set x[${vertex}] = 1.`,
        currentPath: path,
        decisions: candidate.decisions,
        witnessEdges: candidate.witnessEdges,
        reason: vertex,
      })) break;
    }
    for (let i = 0; i < path.length - 1; i++) {
      if (!addTrace({
        type: 'assign-metabolic-arc',
        message: `Set y[${path[i]}->${path[i + 1]}] = 1.`,
        currentPath: path,
        decisions: candidate.decisions,
        witnessEdges: candidate.witnessEdges,
        reason: getArcId(path[i], path[i + 1]),
      })) break;
    }
    for (const edge of candidate.witnessEdges) {
      if (!addTrace({
        type: 'assign-genomic-edge',
        message: `Set z[${getEdgeId(edge.u, edge.v)}] = 1.`,
        currentPath: path,
        decisions: candidate.decisions,
        witnessEdges: candidate.witnessEdges,
        reason: getEdgeId(edge.u, edge.v),
      })) break;
    }
    if (interruptedByCap) break;

    if (!addTrace({
      type: 'connectivity-witness',
      message: candidate.witnessEdges.length === path.length - 1
        ? 'Genomic witness is a tree over selected vertices.'
        : 'No complete genomic witness exists for this selected set.',
      currentPath: path,
      decisions: candidate.decisions,
      witnessEdges: candidate.witnessEdges,
      reason: candidate.witnessEdges.length === path.length - 1 ? 'tree-witness' : 'missing-witness',
    })) break;

    if (!addTrace({
      type: 'constraint-check',
      message: candidate.report.feasible ? 'All ILP1 educational constraints are satisfied.' : 'ILP1 educational constraints reject this candidate.',
      currentPath: path,
      decisions: candidate.decisions,
      witnessEdges: candidate.witnessEdges,
      reason: candidate.report.feasible ? 'feasible' : candidate.report.reasons.join(','),
    })) break;

    if (!candidate.report.feasible) {
      rejectedCandidates++;
      if (!addTrace({
        type: 'constraint-rejection',
        message: 'Candidate rejected by ILP1 constraint interpretation.',
        currentPath: path,
        decisions: candidate.decisions,
        witnessEdges: candidate.witnessEdges,
        reason: candidate.report.reasons.join(','),
      })) break;
    } else if (bestPath === null || comparePaths(path, bestPath) < 0) {
      bestPath = [...path];
      bestCandidate = candidate;
      if (!addTrace({
        type: 'incumbent-update',
        message: `New ILP1 incumbent ${path.join(' -> ')}.`,
        currentPath: path,
        decisions: candidate.decisions,
        witnessEdges: candidate.witnessEdges,
        reason: 'objective-and-lexical-improvement',
      })) break;
    }

    if (!addTrace({
      type: 'backtrack',
      message: 'Return to candidate enumeration.',
      currentPath: path,
      decisions: candidate.decisions,
      witnessEdges: candidate.witnessEdges,
      reason: 'candidate-complete',
    })) break;
  }

  if (!cancelled && !interruptedByCap) {
    searchCompleted = true;
    const proofPath = bestPath ? [...bestPath] : null;
    const proofAdded = addTrace({
      type: 'proof-complete',
      message: proofPath ? `Search complete. Optimal path is ${proofPath.join(' -> ')}.` : 'Search complete. No feasible path exists.',
      currentPath: proofPath || [],
      decisions: bestCandidate?.decisions || null,
      witnessEdges: bestCandidate?.witnessEdges || [],
      reason: 'proof-complete',
    });
    if (!proofAdded) interruptedByCap = true;
  }

  if (!searchCompleted || cancelled || interruptedByCap || !proofCompleteEmitted) {
    if (trace.length < maxEvents) {
      trace.push(incompleteTraceEvent(cancelled ? 'cancelled' : 'cap-reached', ++stepCount, bestPath, exploredCandidates, rejectedCandidates));
    }
    return {
      status: 'incomplete',
      bestPath,
      bestCandidate,
      trace,
      stepCount,
      exploredCandidates,
      rejectedCandidates,
      searchCompleted,
      proofCompleteEmitted,
      interruptedByCap,
      cancelled,
    };
  }

  return {
    status: bestPath ? 'optimal' : 'no-solution',
    bestPath,
    bestCandidate,
    trace,
    stepCount,
    exploredCandidates,
    rejectedCandidates,
    searchCompleted,
    proofCompleteEmitted,
    interruptedByCap,
    cancelled,
  };
}
