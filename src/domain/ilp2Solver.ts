import { getArcId, hasCycle, validateGraphs } from './graph';
import { comparePaths, enumeratePaths, isInducedGConnected } from './pathAlgorithms';

export type ILP2TraceType =
  | 'initialize'
  | 'define-variable'
  | 'candidate-path'
  | 'assign-vertex'
  | 'assign-metabolic-arc'
  | 'select-root'
  | 'assign-parent'
  | 'assign-level'
  | 'rooted-witness'
  | 'constraint-check'
  | 'constraint-rejection'
  | 'incumbent-update'
  | 'backtrack'
  | 'cancelled'
  | 'cap-reached'
  | 'proof-complete'
  | 'validation-error';

export interface ILP2DecisionData {
  x: Record<string, 0 | 1>;
  y: Record<string, 0 | 1>;
  r: Record<string, 0 | 1>;
  p: Record<string, 0 | 1>;
  level: Record<string, number | null>;
}

export interface ILP2ConstraintReport {
  feasible: boolean;
  reasons: string[];
  canonicalPath: string[] | null;
}

export interface ILP2Candidate {
  path: string[];
  decisions: ILP2DecisionData;
  root: string | null;
  parentLinks: { parent: string; child: string }[];
  levels: Record<string, number>;
  report: ILP2ConstraintReport;
}

export interface ILP2TraceEvent {
  type: ILP2TraceType;
  message: string;
  currentPath: string[];
  bestPath: string[] | null;
  decisions: ILP2DecisionData | null;
  root: string | null;
  parentLinks: { parent: string; child: string }[];
  levels: Record<string, number>;
  exploredCandidates: number;
  rejectedCandidates: number;
  reason?: string;
  stepCount: number;
}

export interface ILP2SolverResult {
  status: 'optimal' | 'incomplete' | 'no-solution' | 'error';
  bestPath: string[] | null;
  bestCandidate: ILP2Candidate | null;
  trace: ILP2TraceEvent[];
  stepCount: number;
  exploredCandidates: number;
  rejectedCandidates: number;
  searchCompleted: boolean;
  proofCompleteEmitted: boolean;
  interruptedByCap: boolean;
  cancelled: boolean;
  counters: ILP2Counters;
  error?: {
    code: 'CYCLE_DETECTED' | 'INVALID_NODE_D' | 'INVALID_NODE_G' | 'DUPLICATE_EDGE_D' | 'DUPLICATE_EDGE_G';
    node?: string;
    message?: string;
  };
}

export interface ILP2SolverOptions {
  maxEvents?: number;
  shouldCancel?: () => boolean;
}

export interface ILP2Counters {
  enumeratedCandidates: number;
  rejectedDisconnectedGenomicCandidates: number;
  rejectedWitnessCandidates: number;
  acceptedFeasibleCandidates: number;
  candidateEvaluationEvents: number;
  witnessParentLinksAssigned: number;
  witnessLevelsAssigned: number;
  earlyTermination: boolean;
  candidatesSkippedAfterWinner: number;
}

const ILP2_PLUS_COMPARATOR_INVARIANT = 'No later candidate can outrank the first feasible candidate under the existing canonical comparator.';
const ILP2_PLUS_TERMINATION_TRACE = 'The candidate list was fully enumerated and canonically sorted. No later candidate can outrank this feasible winner.';

function parentId(parent: string, child: string): string {
  return `${parent}->${child}`;
}

function cloneDecisions(decisions: ILP2DecisionData | null): ILP2DecisionData | null {
  if (!decisions) return null;
  return {
    x: { ...decisions.x },
    y: { ...decisions.y },
    r: { ...decisions.r },
    p: { ...decisions.p },
    level: { ...decisions.level },
  };
}

function initializeDecisionData(vertices: string[], edgesD: { from: string; to: string }[], edgesG: { u: string; v: string }[]): ILP2DecisionData {
  const x: Record<string, 0 | 1> = {};
  const y: Record<string, 0 | 1> = {};
  const r: Record<string, 0 | 1> = {};
  const p: Record<string, 0 | 1> = {};
  const level: Record<string, number | null> = {};

  for (const vertex of vertices) {
    x[vertex] = 0;
    r[vertex] = 0;
    level[vertex] = null;
  }
  for (const edge of edgesD) y[getArcId(edge.from, edge.to)] = 0;
  for (const edge of edgesG) {
    p[parentId(edge.u, edge.v)] = 0;
    p[parentId(edge.v, edge.u)] = 0;
  }
  return { x, y, r, p, level };
}

function buildSelectedGAdjacency(vertices: string[], edgesG: { u: string; v: string }[], selected: Set<string>): Record<string, string[]> {
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

export function buildRootedLevelWitness(
  selectedPath: string[],
  vertices: string[],
  edgesG: { u: string; v: string }[]
): { connected: boolean; root: string | null; parentLinks: { parent: string; child: string }[]; levels: Record<string, number> } {
  if (selectedPath.length === 0) return { connected: false, root: null, parentLinks: [], levels: {} };

  const selected = new Set(selectedPath);
  const root = [...selectedPath].sort((a, b) => a.localeCompare(b))[0];
  const adj = buildSelectedGAdjacency(vertices, edgesG, selected);
  const visited = new Set<string>([root]);
  const queue = [root];
  const parentLinks: { parent: string; child: string }[] = [];
  const levels: Record<string, number> = { [root]: 0 };
  let head = 0;

  while (head < queue.length) {
    const current = queue[head++];
    for (const next of adj[current] || []) {
      if (!visited.has(next)) {
        visited.add(next);
        queue.push(next);
        parentLinks.push({ parent: current, child: next });
        levels[next] = levels[current] + 1;
      }
    }
  }

  return {
    connected: visited.size === selected.size,
    root: visited.size === selected.size ? root : null,
    parentLinks: visited.size === selected.size ? parentLinks : [],
    levels: visited.size === selected.size ? levels : {},
  };
}

export function deriveILP2Candidate(
  path: string[],
  vertices: string[],
  edgesD: { from: string; to: string }[],
  edgesG: { u: string; v: string }[]
): ILP2Candidate {
  const decisions = initializeDecisionData(vertices, edgesD, edgesG);
  for (const vertex of path) decisions.x[vertex] = 1;
  for (let i = 0; i < path.length - 1; i++) {
    decisions.y[getArcId(path[i], path[i + 1])] = 1;
  }

  const witness = buildRootedLevelWitness(path, vertices, edgesG);
  if (witness.root) decisions.r[witness.root] = 1;
  for (const [vertex, level] of Object.entries(witness.levels)) {
    decisions.level[vertex] = level;
  }
  for (const link of witness.parentLinks) {
    decisions.p[parentId(link.parent, link.child)] = 1;
  }

  const report = validateILP2Assignment(vertices, edgesD, edgesG, decisions);
  return {
    path,
    decisions,
    root: witness.root,
    parentLinks: witness.parentLinks,
    levels: witness.levels,
    report,
  };
}

export function validateILP2Assignment(
  vertices: string[],
  edgesD: { from: string; to: string }[],
  edgesG: { u: string; v: string }[],
  decisions: ILP2DecisionData
): ILP2ConstraintReport {
  const reasons: string[] = [];
  const selectedVertices = vertices.filter((vertex) => decisions.x[vertex] === 1);
  const selected = new Set(selectedVertices);
  const incomingCount: Record<string, number> = {};
  const outgoingCount: Record<string, number> = {};
  const outSelected: Record<string, string[]> = {};

  for (const vertex of vertices) {
    incomingCount[vertex] = 0;
    outgoingCount[vertex] = 0;
    outSelected[vertex] = [];
  }

  for (const edge of edgesD) {
    if (decisions.y[getArcId(edge.from, edge.to)] !== 1) continue;
    if (!selected.has(edge.from) || !selected.has(edge.to)) reasons.push('selected-arc-has-unselected-endpoint');
    outgoingCount[edge.from]++;
    incomingCount[edge.to]++;
    outSelected[edge.from].push(edge.to);
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

  const roots = vertices.filter((vertex) => decisions.r[vertex] === 1);
  if (selectedVertices.length > 0) {
    if (roots.length !== 1) reasons.push('non-empty-solution-must-have-exactly-one-root');
  } else if (roots.length > 0) {
    reasons.push('empty-solution-cannot-have-root');
  }

  const root = roots[0];
  if (root && !selected.has(root)) reasons.push('root-must-be-selected');

  const realGEdges = new Set(edgesG.flatMap((edge) => [parentId(edge.u, edge.v), parentId(edge.v, edge.u)]));
  const parentCount: Record<string, number> = {};
  const children: Record<string, string[]> = {};
  for (const vertex of vertices) {
    parentCount[vertex] = 0;
    children[vertex] = [];
  }

  for (const [id, value] of Object.entries(decisions.p)) {
    if (value !== 1) continue;
    const [parent, child] = id.split('->');
    if (!parent || !child) {
      reasons.push('parent-link-id-is-malformed');
      continue;
    }
    if (!realGEdges.has(id)) reasons.push('parent-edge-must-exist-in-g');
    if (!selected.has(parent) || !selected.has(child)) reasons.push('parent-child-endpoints-must-be-selected');
    if (parent === child) reasons.push('parent-child-self-loop-not-allowed');
    parentCount[child] = (parentCount[child] || 0) + 1;
    children[parent] = [...(children[parent] || []), child];
    const parentLevel = decisions.level[parent];
    const childLevel = decisions.level[child];
    if (parentLevel === null || childLevel === null || childLevel <= parentLevel) {
      reasons.push('levels-must-strictly-increase-from-parent-to-child');
    }
  }

  for (const vertex of selectedVertices) {
    const level = decisions.level[vertex];
    if (level === null || level < 0 || !Number.isInteger(level)) reasons.push('selected-vertex-must-have-integer-level');
    if (vertex === root) {
      if (parentCount[vertex] !== 0) reasons.push('root-has-selected-parent');
      if (level !== 0) reasons.push('root-level-must-be-zero');
    } else if (parentCount[vertex] !== 1) {
      reasons.push('selected-non-root-must-have-exactly-one-parent');
    }
  }

  for (const vertex of vertices) {
    if (!selected.has(vertex) && decisions.level[vertex] !== null) reasons.push('unselected-vertex-cannot-have-level');
  }

  if (selectedVertices.length > 0 && root && selected.has(root)) {
    const visited = new Set<string>([root]);
    const queue = [root];
    let head = 0;
    while (head < queue.length) {
      const current = queue[head++];
      for (const child of children[current] || []) {
        if (!visited.has(child)) {
          visited.add(child);
          queue.push(child);
        }
      }
    }
    if (visited.size !== selectedVertices.length) reasons.push('parent-relations-do-not-connect-all-selected-vertices-to-root');
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
): ILP2TraceEvent {
  return {
    type,
    message: type === 'cancelled' ? 'Search cancelled before proof completion.' : 'Event cap reached before proof completion.',
    currentPath: [],
    bestPath: bestPath ? [...bestPath] : null,
    decisions: null,
    root: null,
    parentLinks: [],
    levels: {},
    exploredCandidates,
    rejectedCandidates,
    reason: type,
    stepCount,
  };
}

const ZERO_COUNTERS: ILP2Counters = {
  enumeratedCandidates: 0,
  rejectedDisconnectedGenomicCandidates: 0,
  rejectedWitnessCandidates: 0,
  acceptedFeasibleCandidates: 0,
  candidateEvaluationEvents: 0,
  witnessParentLinksAssigned: 0,
  witnessLevelsAssigned: 0,
  earlyTermination: false,
  candidatesSkippedAfterWinner: 0,
};

// ponytail: shared core; earlyTerminate=false for ILP2, true for ILP2+
function solveILP2Core(
  vertices: string[],
  edgesD: { from: string; to: string }[],
  edgesG: { u: string; v: string }[],
  options: ILP2SolverOptions | number,
  earlyTerminate: boolean
): ILP2SolverResult {
  const maxEvents = typeof options === 'number' ? options : options.maxEvents ?? 7000;
  const shouldCancel = typeof options === 'number' ? undefined : options.shouldCancel;
  const trace: ILP2TraceEvent[] = [];
  let stepCount = 0;
  let exploredCandidates = 0;
  let rejectedCandidates = 0;
  let bestPath: string[] | null = null;
  let bestCandidate: ILP2Candidate | null = null;
  let searchCompleted = false;
  let proofCompleteEmitted = false;
  let interruptedByCap = false;
  let cancelled = false;
  const counters: ILP2Counters = { ...ZERO_COUNTERS };

  function addTrace(event: Omit<ILP2TraceEvent, 'bestPath' | 'exploredCandidates' | 'rejectedCandidates' | 'stepCount'>): boolean {
    if (trace.length >= maxEvents) {
      interruptedByCap = true;
      return false;
    }
    stepCount++;
    trace.push({
      ...event,
      bestPath: bestPath ? [...bestPath] : null,
      decisions: cloneDecisions(event.decisions),
      parentLinks: event.parentLinks.map((link) => ({ ...link })),
      levels: { ...event.levels },
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
        root: null,
        parentLinks: [],
        levels: {},
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
      counters: { ...ZERO_COUNTERS },
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
        root: null,
        parentLinks: [],
        levels: {},
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
      counters: { ...ZERO_COUNTERS },
      error: { code: 'CYCLE_DETECTED' },
    };
  }

  addTrace({
    type: 'initialize',
    message: 'Initialize ILP2 educational bounded formulation.',
    currentPath: [],
    decisions: null,
    root: null,
    parentLinks: [],
    levels: {},
    reason: 'bounded-enumeration',
  });
  for (const family of ['x_v', 'y_a', 'r_v', 'p_uv', 'level_v']) {
    addTrace({
      type: 'define-variable',
      message: `Define ILP2 decision family ${family}.`,
      currentPath: [],
      decisions: null,
      root: null,
      parentLinks: [],
      levels: {},
      reason: family,
    });
  }

  const paths = enumeratePaths(vertices, edgesD).sort(comparePaths);
  const totalPaths = paths.length;
  for (const path of paths) {
    if (shouldStop()) break;
    exploredCandidates++;
    counters.enumeratedCandidates++;

    if (!isInducedGConnected(path, edgesG)) {
      counters.rejectedDisconnectedGenomicCandidates++;
      rejectedCandidates++;
      if (!addTrace({
        type: 'constraint-rejection',
        message: `Path ${path.join(' -> ')} rejected: selected induced G is disconnected.`,
        currentPath: path,
        decisions: null,
        root: null,
        parentLinks: [],
        levels: {},
        reason: 'induced-G-disconnected',
      })) break;
      counters.candidateEvaluationEvents++;
      continue;
    }

    const candidate = deriveILP2Candidate(path, vertices, edgesD, edgesG);
    counters.witnessParentLinksAssigned += candidate.parentLinks.length;
    counters.witnessLevelsAssigned += Object.keys(candidate.levels).length;

    if (!addTrace({
      type: 'candidate-path',
      message: `Evaluate candidate path ${path.join(' -> ')}.`,
      currentPath: path,
      decisions: candidate.decisions,
      root: candidate.root,
      parentLinks: candidate.parentLinks,
      levels: candidate.levels,
      reason: 'candidate-path',
    })) break;
    counters.candidateEvaluationEvents++;

    for (const vertex of path) {
      if (!addTrace({
        type: 'assign-vertex',
        message: `Set x[${vertex}] = 1.`,
        currentPath: path,
        decisions: candidate.decisions,
        root: candidate.root,
        parentLinks: candidate.parentLinks,
        levels: candidate.levels,
        reason: vertex,
      })) break;
    }
    for (let i = 0; i < path.length - 1; i++) {
      if (!addTrace({
        type: 'assign-metabolic-arc',
        message: `Set y[${path[i]}->${path[i + 1]}] = 1.`,
        currentPath: path,
        decisions: candidate.decisions,
        root: candidate.root,
        parentLinks: candidate.parentLinks,
        levels: candidate.levels,
        reason: getArcId(path[i], path[i + 1]),
      })) break;
    }
    if (candidate.root && !addTrace({
      type: 'select-root',
      message: `Select genomic root r[${candidate.root}] = 1.`,
      currentPath: path,
      decisions: candidate.decisions,
      root: candidate.root,
      parentLinks: candidate.parentLinks,
      levels: candidate.levels,
      reason: candidate.root,
    })) break;
    for (const link of candidate.parentLinks) {
      if (!addTrace({
        type: 'assign-parent',
        message: `Set p[${link.parent}->${link.child}] = 1.`,
        currentPath: path,
        decisions: candidate.decisions,
        root: candidate.root,
        parentLinks: candidate.parentLinks,
        levels: candidate.levels,
        reason: parentId(link.parent, link.child),
      })) break;
    }
    for (const [vertex, level] of Object.entries(candidate.levels)) {
      if (!addTrace({
        type: 'assign-level',
        message: `Set level[${vertex}] = ${level}.`,
        currentPath: path,
        decisions: candidate.decisions,
        root: candidate.root,
        parentLinks: candidate.parentLinks,
        levels: candidate.levels,
        reason: vertex,
      })) break;
    }
    if (interruptedByCap) break;

    if (!addTrace({
      type: 'rooted-witness',
      message: candidate.root
        ? 'Root, parent links, and levels connect the selected vertices in G.'
        : 'No rooted genomic witness exists for this selected set.',
      currentPath: path,
      decisions: candidate.decisions,
      root: candidate.root,
      parentLinks: candidate.parentLinks,
      levels: candidate.levels,
      reason: candidate.root ? 'rooted-level-witness' : 'missing-rooted-witness',
    })) break;

    if (!addTrace({
      type: 'constraint-check',
      message: candidate.report.feasible ? 'All ILP2 educational constraints are satisfied.' : 'ILP2 educational constraints reject this candidate.',
      currentPath: path,
      decisions: candidate.decisions,
      root: candidate.root,
      parentLinks: candidate.parentLinks,
      levels: candidate.levels,
      reason: candidate.report.feasible ? 'feasible' : candidate.report.reasons.join(','),
    })) break;

    if (!candidate.report.feasible) {
      rejectedCandidates++;
      counters.rejectedWitnessCandidates++;
      if (!addTrace({
        type: 'constraint-rejection',
        message: 'Candidate rejected by ILP2 root/parent/level constraints.',
        currentPath: path,
        decisions: candidate.decisions,
        root: candidate.root,
        parentLinks: candidate.parentLinks,
        levels: candidate.levels,
        reason: candidate.report.reasons.join(','),
      })) break;
    } else {
      counters.acceptedFeasibleCandidates++;
      if (bestPath === null || comparePaths(path, bestPath) < 0) {
        bestPath = [...path];
        bestCandidate = candidate;
        if (!addTrace({
          type: 'incumbent-update',
          message: `New ILP2 incumbent ${path.join(' -> ')}.`,
          currentPath: path,
          decisions: candidate.decisions,
          root: candidate.root,
          parentLinks: candidate.parentLinks,
          levels: candidate.levels,
          reason: 'objective-and-lexical-improvement',
        })) break;
      }
      if (earlyTerminate && counters.acceptedFeasibleCandidates === 1) {
        const skippedAfterWinner = totalPaths - exploredCandidates;
        if (skippedAfterWinner > 0) {
          if (!addTrace({
            type: 'constraint-check',
            message: ILP2_PLUS_TERMINATION_TRACE,
            currentPath: path,
            decisions: candidate.decisions,
            root: candidate.root,
            parentLinks: candidate.parentLinks,
            levels: candidate.levels,
            reason: 'sorted-prefix-termination',
          })) break;
          counters.candidatesSkippedAfterWinner = skippedAfterWinner;
          counters.earlyTermination = true;
          break;
        }
      }
    }

    if (!addTrace({
      type: 'backtrack',
      message: 'Return to bounded path enumeration.',
      currentPath: path,
      decisions: candidate.decisions,
      root: candidate.root,
      parentLinks: candidate.parentLinks,
      levels: candidate.levels,
      reason: 'candidate-complete',
    })) break;
  }

  if (!cancelled && !interruptedByCap) {
    searchCompleted = true;
    const proofPath = bestPath ? [...bestPath] : null;
    const proofMessage = proofPath
      ? (counters.earlyTermination
        ? `Search complete (early termination). Optimal path is ${proofPath.join(' -> ')}. ${ILP2_PLUS_COMPARATOR_INVARIANT} ${exploredCandidates} of ${totalPaths} candidates evaluated.`
        : `Search complete. Optimal path is ${proofPath.join(' -> ')}.`)
      : 'Search complete. No feasible path exists.';
    const proofAdded = addTrace({
      type: 'proof-complete',
      message: proofMessage,
      currentPath: proofPath || [],
      decisions: bestCandidate?.decisions || null,
      root: bestCandidate?.root || null,
      parentLinks: bestCandidate?.parentLinks || [],
      levels: bestCandidate?.levels || {},
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
      counters,
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
    counters,
  };
}

export function solveILP2(
  vertices: string[],
  edgesD: { from: string; to: string }[],
  edgesG: { u: string; v: string }[],
  options: ILP2SolverOptions | number = {}
): ILP2SolverResult {
  return solveILP2Core(vertices, edgesD, edgesG, options, false);
}

export function solveILP2Plus(
  vertices: string[],
  edgesD: { from: string; to: string }[],
  edgesG: { u: string; v: string }[],
  options: ILP2SolverOptions | number = {}
): ILP2SolverResult {
  return solveILP2Core(vertices, edgesD, edgesG, options, true);
}
