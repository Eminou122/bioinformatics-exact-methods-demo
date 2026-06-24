import { hasCycle, validateGraphs } from './graph';
import { comparePaths, isInducedGConnected } from './pathAlgorithms';

export interface AIGuideScore {
  vertex: string;
  reachableSuffixPotential: number;
  genomicSupportLinks: number;
  compatibleContinuationChoices: number;
  priorityScore: number;
  lexicalFallback: string;
  rationale: string[];
}

export type AIGuidedTraceType =
  | 'initialize'
  | 'guide-decision'
  | 'branch'
  | 'candidate-path'
  | 'genomic-rejection'
  | 'incumbent-update'
  | 'backtrack'
  | 'cancelled'
  | 'cap-reached'
  | 'proof-complete'
  | 'validation-error';

export interface AIGuidedTraceEvent {
  type: AIGuidedTraceType;
  message: string;
  currentPath: string[];
  currentCandidate: string | null;
  rankedCandidates: AIGuideScore[];
  bestPath: string[] | null;
  counters: AIGuidedCounters;
  proofStatus: {
    searchCompleted: boolean;
    proofCompleteEmitted: boolean;
    interruptedByCap: boolean;
    cancelled: boolean;
  };
  stepCount: number;
}

export interface AIGuidedCounters {
  candidatesRanked: number;
  branchesExplored: number;
  branchesPruned: number;
  guideDecisionsEmitted: number;
}

export interface AIGuidedSolverOptions {
  maxEvents?: number;
  shouldCancel?: () => boolean;
}

export interface AIGuidedSolverResult {
  status: 'optimal' | 'incomplete' | 'no-solution' | 'error';
  bestPath: string[] | null;
  trace: AIGuidedTraceEvent[];
  stepCount: number;
  searchCompleted: boolean;
  proofCompleteEmitted: boolean;
  interruptedByCap: boolean;
  cancelled: boolean;
  counters: AIGuidedCounters;
  error?: {
    code: 'CYCLE_DETECTED' | 'INVALID_NODE_D' | 'INVALID_NODE_G' | 'DUPLICATE_EDGE_D' | 'DUPLICATE_EDGE_G';
    node?: string;
    message?: string;
  };
}

function buildDirectedAdjacency(vertices: string[], edgesD: { from: string; to: string }[]): Record<string, string[]> {
  const adj: Record<string, string[]> = {};
  for (const vertex of vertices) adj[vertex] = [];
  for (const edge of edgesD) adj[edge.from].push(edge.to);
  for (const vertex of vertices) adj[vertex].sort((a, b) => a.localeCompare(b));
  return adj;
}

function buildGenomicAdjacency(vertices: string[], edgesG: { u: string; v: string }[]): Record<string, string[]> {
  const adj: Record<string, string[]> = {};
  for (const vertex of vertices) adj[vertex] = [];
  for (const edge of edgesG) {
    adj[edge.u].push(edge.v);
    adj[edge.v].push(edge.u);
  }
  return adj;
}

function reachableSuffixPotential(vertex: string, adjD: Record<string, string[]>, visited: Set<string>): number {
  let count = 1;
  for (const next of adjD[vertex] || []) {
    if (!visited.has(next)) {
      visited.add(next);
      count += reachableSuffixPotential(next, adjD, visited);
      visited.delete(next);
    }
  }
  return count;
}

export function rankAIGuidedCandidates(
  currentPath: string[],
  candidates: string[],
  adjD: Record<string, string[]>,
  adjG: Record<string, string[]>
): AIGuideScore[] {
  const selected = new Set(currentPath);
  return candidates
    .map((vertex) => {
      const visited = new Set([...currentPath, vertex]);
      const suffix = reachableSuffixPotential(vertex, adjD, visited);
      const genomicSupport = (adjG[vertex] || []).filter((neighbor) => selected.has(neighbor)).length;
      const continuationChoices = (adjD[vertex] || []).filter((next) => !visited.has(next)).length;
      const score = suffix + genomicSupport + continuationChoices;
      const rationale = [
        `High reachable suffix: ${suffix}`,
        `Genomic support links: ${genomicSupport}`,
        `Compatible continuation choices: ${continuationChoices}`,
        `Priority score: ${score}`,
      ];
      return {
        vertex,
        reachableSuffixPotential: suffix,
        genomicSupportLinks: genomicSupport,
        compatibleContinuationChoices: continuationChoices,
        priorityScore: score,
        lexicalFallback: vertex,
        rationale,
      };
    })
    .sort((a, b) => {
      if (a.priorityScore !== b.priorityScore) return b.priorityScore - a.priorityScore;
      return a.vertex.localeCompare(b.vertex);
    });
}

function cloneCounters(counters: AIGuidedCounters): AIGuidedCounters {
  return { ...counters };
}

function cloneScores(scores: AIGuideScore[]): AIGuideScore[] {
  return scores.map((score) => ({ ...score, rationale: [...score.rationale] }));
}

export function solveAIGuidedExact(
  vertices: string[],
  edgesD: { from: string; to: string }[],
  edgesG: { u: string; v: string }[],
  options: AIGuidedSolverOptions = {}
): AIGuidedSolverResult {
  const maxEvents = options.maxEvents ?? 5000;
  const shouldCancel = options.shouldCancel;
  const trace: AIGuidedTraceEvent[] = [];
  const counters: AIGuidedCounters = {
    candidatesRanked: 0,
    branchesExplored: 0,
    branchesPruned: 0,
    guideDecisionsEmitted: 0,
  };
  let stepCount = 0;
  let bestPath: string[] | null = null;
  let searchCompleted = false;
  let proofCompleteEmitted = false;
  let interruptedByCap = false;
  let cancelled = false;

  function addTrace(event: Omit<AIGuidedTraceEvent, 'bestPath' | 'counters' | 'proofStatus' | 'stepCount'>): boolean {
    if (trace.length >= maxEvents) {
      interruptedByCap = true;
      return false;
    }

    stepCount += 1;
    trace.push({
      ...event,
      rankedCandidates: cloneScores(event.rankedCandidates),
      bestPath: bestPath ? [...bestPath] : null,
      counters: cloneCounters(counters),
      proofStatus: {
        searchCompleted,
        proofCompleteEmitted,
        interruptedByCap,
        cancelled,
      },
      stepCount,
    });
    if (event.type === 'proof-complete') proofCompleteEmitted = true;
    return true;
  }

  const validation = validateGraphs(vertices, edgesD, edgesG);
  if (!validation.isValid) {
    const error = {
      code: validation.errorCode!,
      node: validation.invalidNode,
      message: validation.error,
    };
    return {
      status: 'error',
      bestPath: null,
      trace: [{
        type: 'validation-error',
        message: validation.error || 'Invalid graph input.',
        currentPath: [],
        currentCandidate: null,
        rankedCandidates: [],
        bestPath: null,
        counters: cloneCounters(counters),
        proofStatus: { searchCompleted: false, proofCompleteEmitted: false, interruptedByCap: false, cancelled: false },
        stepCount: 1,
      }],
      stepCount: 1,
      searchCompleted: false,
      proofCompleteEmitted: false,
      interruptedByCap: false,
      cancelled: false,
      counters,
      error,
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
        currentCandidate: null,
        rankedCandidates: [],
        bestPath: null,
        counters: cloneCounters(counters),
        proofStatus: { searchCompleted: false, proofCompleteEmitted: false, interruptedByCap: false, cancelled: false },
        stepCount: 1,
      }],
      stepCount: 1,
      searchCompleted: false,
      proofCompleteEmitted: false,
      interruptedByCap: false,
      cancelled: false,
      counters,
      error: { code: 'CYCLE_DETECTED' },
    };
  }

  const adjD = buildDirectedAdjacency(vertices, edgesD);
  const adjG = buildGenomicAdjacency(vertices, edgesG);
  const orderedVertices = [...vertices].sort((a, b) => a.localeCompare(b));

  addTrace({
    type: 'initialize',
    message: 'Initialize educational transparent AI-guided branch ordering over simple directed paths.',
    currentPath: [],
    currentCandidate: null,
    rankedCandidates: [],
  });

  function maybeStop(): boolean {
    if (cancelled || interruptedByCap) return true;
    if (shouldCancel?.()) {
      cancelled = true;
      return true;
    }
    return false;
  }

  function evaluateCandidate(path: string[]): void {
    const connected = isInducedGConnected(path, edgesG);
    if (!addTrace({
      type: 'candidate-path',
      message: `Deterministic solver validates candidate path ${path.join(' -> ')}.`,
      currentPath: path,
      currentCandidate: null,
      rankedCandidates: [],
    })) return;

    if (connected) {
      if (bestPath === null || comparePaths(path, bestPath) < 0) {
        bestPath = [...path];
        addTrace({
          type: 'incumbent-update',
          message: `New exact incumbent ${bestPath.join(' -> ')}.`,
          currentPath: path,
          currentCandidate: null,
          rankedCandidates: [],
        });
      }
      return;
    }

    addTrace({
      type: 'genomic-rejection',
      message: 'Candidate rejected by exact induced-G connectivity validation.',
      currentPath: path,
      currentCandidate: null,
      rankedCandidates: [],
    });
  }

  function search(currentPath: string[], visited: Set<string>): void {
    if (maybeStop()) return;

    if (currentPath.length > 0) {
      evaluateCandidate(currentPath);
      if (maybeStop()) return;
    }

    const branchCandidates = currentPath.length === 0
      ? orderedVertices
      : (adjD[currentPath[currentPath.length - 1]] || []).filter((vertex) => !visited.has(vertex));
    const ranked = rankAIGuidedCandidates(currentPath, branchCandidates, adjD, adjG);
    counters.candidatesRanked += ranked.length;
    counters.guideDecisionsEmitted += 1;

    if (!addTrace({
      type: 'guide-decision',
      message: 'AI guide ranks valid next branches only; the deterministic solver verifies every candidate.',
      currentPath,
      currentCandidate: ranked[0]?.vertex || null,
      rankedCandidates: ranked,
    })) return;

    for (const candidate of ranked) {
      if (maybeStop()) return;
      const nextPath = [...currentPath, candidate.vertex];
      counters.branchesExplored += 1;
      if (!addTrace({
        type: 'branch',
        message: currentPath.length === 0 ? `Explore start ${candidate.vertex}.` : `Explore successor ${candidate.vertex}.`,
        currentPath: nextPath,
        currentCandidate: candidate.vertex,
        rankedCandidates: ranked,
      })) return;
      visited.add(candidate.vertex);
      search(nextPath, visited);
      visited.delete(candidate.vertex);
    }

    addTrace({
      type: 'backtrack',
      message: currentPath.length === 0 ? 'Backtrack from root search state.' : `Backtrack from ${currentPath.join(' -> ')}.`,
      currentPath,
      currentCandidate: null,
      rankedCandidates: [],
    });
  }

  search([], new Set());

  if (!cancelled && !interruptedByCap) {
    searchCompleted = true;
    const proofPath = bestPath ? [...bestPath] : null;
    const proofAdded = addTrace({
      type: 'proof-complete',
      message: proofPath ? `Search complete. Exact optimal path is ${proofPath.join(' -> ')}.` : 'Search complete. No valid path exists.',
      currentPath: proofPath || [],
      currentCandidate: null,
      rankedCandidates: [],
    });
    if (!proofAdded) interruptedByCap = true;
  }

  if (!searchCompleted || cancelled || interruptedByCap || !proofCompleteEmitted) {
    const type = cancelled ? 'cancelled' : 'cap-reached';
    if (trace.length < maxEvents) {
      addTrace({
        type,
        message: cancelled ? 'Search cancelled before proof completion.' : 'Event cap reached before proof completion.',
        currentPath: [],
        currentCandidate: null,
        rankedCandidates: [],
      });
    }
    return {
      status: 'incomplete',
      bestPath,
      trace,
      stepCount,
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
    trace,
    stepCount,
    searchCompleted,
    proofCompleteEmitted,
    interruptedByCap,
    cancelled,
    counters,
  };
}
