import { solveAlgoBBPlusPlus } from './algoBBPlusPlus';
import { solveCP1 } from './cpSolver';
import { solveCP2, type CP2SolverOptions } from './cp2Solver';
import { solveCP2Plus, type CP2PlusSolverOptions } from './cp2PlusSolver';
import { solveILP1 } from './ilp1Solver';
import { solveILP2 } from './ilp2Solver';
import { isInducedGConnected, solveConsistentPath } from './pathAlgorithms';
import { solveSubsetDP } from './subsetDpSolver';

export type BenchmarkFamilyId =
  | 'fragmented-genomic'
  | 'dense-genomic'
  | 'repairable-future-bridge'
  | 'small-exhaustive'
  | 'larger-bounded-stress';

export interface CP2PlusBenchmarkCase {
  familyId: BenchmarkFamilyId;
  caseId: string;
  vertices: string[];
  edgesD: { from: string; to: string }[];
  edgesG: { u: string; v: string }[];
  maxEvents?: number;
}

interface SolverMetrics {
  path: string[] | null;
  objective: number;
  proofComplete: boolean;
  statesExplored: number;
  eventsEmitted: number;
  directedBoundPrunes: number;
}

export interface CP2PlusBenchmarkResult {
  familyId: BenchmarkFamilyId;
  caseId: string;
  vertexCount: number;
  arcCount: number;
  genomicEdgeCount: number;
  cp2: SolverMetrics;
  cp2Plus: SolverMetrics & {
    genomicPropagationChecks: number;
    genomicPropagationPrunes: number;
  };
  stateDelta: number;
  eventDelta: number;
  stateReductionPercent: number | null;
  eventReductionPercent: number | null;
  exactness: {
    objectiveMatch: boolean;
    winnerMatch: boolean;
    proofStatusMatch: boolean;
    validityMatch: boolean;
  };
}

export interface CP2PlusBenchmarkSummary {
  totalCaseCount: number;
  equalityMismatches: {
    objective: number;
    winner: number;
    proofStatus: number;
    validity: number;
  };
  reducedStateCases: number;
  equalStateCases: number;
  increasedStateCases: number;
  totalGenomicPropagationPrunes: number;
  cp2: {
    statesExplored: number;
    eventsEmitted: number;
    directedBoundPrunes: number;
  };
  cp2Plus: {
    statesExplored: number;
    eventsEmitted: number;
    directedBoundPrunes: number;
    genomicPropagationChecks: number;
    genomicPropagationPrunes: number;
  };
  perFamily: Array<{
    familyId: BenchmarkFamilyId;
    caseCount: number;
    reducedStateCases: number;
    equalStateCases: number;
    increasedStateCases: number;
    cp2StatesExplored: number;
    cp2PlusStatesExplored: number;
    genomicPropagationPrunes: number;
  }>;
  conclusion: string;
}

export interface CP2PlusBenchmarkReport {
  results: CP2PlusBenchmarkResult[];
  summary: CP2PlusBenchmarkSummary;
}

const completeDag = (vertices: string[]) => {
  const edges: { from: string; to: string }[] = [];
  for (let left = 0; left < vertices.length; left++) {
    for (let right = left + 1; right < vertices.length; right++) {
      edges.push({ from: vertices[left], to: vertices[right] });
    }
  }
  return edges;
};

const completeGenomicGraph = (vertices: string[]) => {
  const edges: { u: string; v: string }[] = [];
  for (let left = 0; left < vertices.length; left++) {
    for (let right = left + 1; right < vertices.length; right++) {
      edges.push({ u: vertices[left], v: vertices[right] });
    }
  }
  return edges;
};

const chain = (vertices: string[]) =>
  vertices.slice(0, -1).map((from, index) => ({ from, to: vertices[index + 1] }));

export const CP2_PLUS_BENCHMARK_CORPUS: readonly CP2PlusBenchmarkCase[] = [
  {
    familyId: 'fragmented-genomic',
    caseId: 'fragmented-unreachable-bridge',
    vertices: ['A', 'B', 'C', 'D'],
    edgesD: [{ from: 'A', to: 'B' }, { from: 'A', to: 'C' }, { from: 'B', to: 'D' }, { from: 'C', to: 'D' }],
    edgesG: [{ u: 'A', v: 'D' }, { u: 'B', v: 'D' }],
  },
  {
    familyId: 'fragmented-genomic',
    caseId: 'fragmented-layered',
    vertices: ['A', 'B', 'C', 'D', 'E', 'F'],
    edgesD: [
      { from: 'A', to: 'B' }, { from: 'A', to: 'C' },
      { from: 'B', to: 'D' }, { from: 'B', to: 'E' },
      { from: 'C', to: 'D' }, { from: 'C', to: 'E' },
      { from: 'D', to: 'F' }, { from: 'E', to: 'F' },
    ],
    edgesG: [{ u: 'A', v: 'F' }, { u: 'B', v: 'F' }, { u: 'C', v: 'F' }],
  },
  {
    familyId: 'fragmented-genomic',
    caseId: 'fragmented-complete-dag',
    vertices: ['A', 'B', 'C', 'D', 'E'],
    edgesD: completeDag(['A', 'B', 'C', 'D', 'E']),
    edgesG: [{ u: 'A', v: 'E' }, { u: 'B', v: 'E' }],
  },
  {
    familyId: 'dense-genomic',
    caseId: 'dense-chain',
    vertices: ['A', 'B', 'C', 'D', 'E'],
    edgesD: chain(['A', 'B', 'C', 'D', 'E']),
    edgesG: completeGenomicGraph(['A', 'B', 'C', 'D', 'E']),
  },
  {
    familyId: 'dense-genomic',
    caseId: 'dense-branching',
    vertices: ['A', 'B', 'C', 'D', 'E'],
    edgesD: [{ from: 'A', to: 'B' }, { from: 'A', to: 'C' }, { from: 'B', to: 'D' }, { from: 'C', to: 'D' }, { from: 'D', to: 'E' }],
    edgesG: completeGenomicGraph(['A', 'B', 'C', 'D', 'E']),
  },
  {
    familyId: 'dense-genomic',
    caseId: 'dense-complete-dag',
    vertices: ['A', 'B', 'C', 'D', 'E', 'F'],
    edgesD: completeDag(['A', 'B', 'C', 'D', 'E', 'F']),
    edgesG: completeGenomicGraph(['A', 'B', 'C', 'D', 'E', 'F']),
  },
  {
    familyId: 'repairable-future-bridge',
    caseId: 'repairable-single-bridge',
    vertices: ['A', 'B', 'C'],
    edgesD: chain(['A', 'B', 'C']),
    edgesG: [{ u: 'A', v: 'C' }, { u: 'B', v: 'C' }],
  },
  {
    familyId: 'repairable-future-bridge',
    caseId: 'repairable-late-bridge',
    vertices: ['A', 'B', 'C', 'D'],
    edgesD: chain(['A', 'B', 'C', 'D']),
    edgesG: [{ u: 'A', v: 'D' }, { u: 'B', v: 'D' }, { u: 'C', v: 'D' }],
  },
  {
    familyId: 'repairable-future-bridge',
    caseId: 'repairable-branch-bridge',
    vertices: ['A', 'B', 'C', 'D', 'E'],
    edgesD: [{ from: 'A', to: 'B' }, { from: 'B', to: 'C' }, { from: 'B', to: 'D' }, { from: 'C', to: 'E' }, { from: 'D', to: 'E' }],
    edgesG: [{ u: 'A', v: 'E' }, { u: 'B', v: 'E' }, { u: 'C', v: 'E' }, { u: 'D', v: 'E' }],
  },
  {
    familyId: 'small-exhaustive',
    caseId: 'small-empty-arcs',
    vertices: ['A', 'B', 'C'],
    edgesD: [],
    edgesG: [],
  },
  {
    familyId: 'small-exhaustive',
    caseId: 'small-chain',
    vertices: ['A', 'B', 'C', 'D'],
    edgesD: chain(['A', 'B', 'C', 'D']),
    edgesG: [{ u: 'A', v: 'B' }, { u: 'B', v: 'C' }, { u: 'C', v: 'D' }],
  },
  {
    familyId: 'small-exhaustive',
    caseId: 'small-tie',
    vertices: ['A', 'B', 'C'],
    edgesD: [{ from: 'A', to: 'B' }, { from: 'A', to: 'C' }],
    edgesG: [{ u: 'A', v: 'B' }, { u: 'A', v: 'C' }],
  },
  {
    familyId: 'small-exhaustive',
    caseId: 'small-disconnected-longest',
    vertices: ['A', 'B', 'C', 'D'],
    edgesD: chain(['A', 'B', 'C', 'D']),
    edgesG: [{ u: 'A', v: 'B' }, { u: 'B', v: 'C' }],
  },
  {
    familyId: 'small-exhaustive',
    caseId: 'small-diamond',
    vertices: ['A', 'B', 'C', 'D'],
    edgesD: [{ from: 'A', to: 'B' }, { from: 'A', to: 'C' }, { from: 'B', to: 'D' }, { from: 'C', to: 'D' }],
    edgesG: [{ u: 'A', v: 'B' }, { u: 'B', v: 'D' }, { u: 'A', v: 'C' }, { u: 'C', v: 'D' }],
  },
  {
    familyId: 'larger-bounded-stress',
    caseId: 'stress-fragmented-8',
    vertices: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'],
    edgesD: completeDag(['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']),
    edgesG: [{ u: 'A', v: 'H' }, { u: 'B', v: 'H' }, { u: 'C', v: 'H' }],
    maxEvents: 20000,
  },
  {
    familyId: 'larger-bounded-stress',
    caseId: 'stress-dense-8',
    vertices: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'],
    edgesD: completeDag(['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']),
    edgesG: completeGenomicGraph(['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']),
    maxEvents: 20000,
  },
];

function samePath(left: string[] | null, right: string[] | null): boolean {
  return JSON.stringify(left ?? []) === JSON.stringify(right ?? []);
}

function isValidPath(
  path: string[] | null,
  edgesD: { from: string; to: string }[],
  edgesG: { u: string; v: string }[]
): boolean {
  if (!path || path.length <= 1) return true;
  if (new Set(path).size !== path.length) return false;
  const arcs = new Set(edgesD.map((edge) => `${edge.from}\u0000${edge.to}`));
  return path.slice(0, -1).every((from, index) => arcs.has(`${from}\u0000${path[index + 1]}`))
    && isInducedGConnected(path, edgesG);
}

export function runCP2PlusBenchmarkCase(
  input: CP2PlusBenchmarkCase,
  options?: { cp2?: CP2SolverOptions; cp2Plus?: CP2PlusSolverOptions }
): CP2PlusBenchmarkResult {
  const maxEvents = input.maxEvents ?? 200000;
  const cp2 = solveCP2(input.vertices, input.edgesD, input.edgesG, { maxEvents, ...options?.cp2 });
  const cp2Plus = solveCP2Plus(input.vertices, input.edgesD, input.edgesG, { maxEvents, ...options?.cp2Plus });
  const cp2States = cp2.exploredStates;
  const cp2PlusStates = cp2Plus.counters.statesExplored;
  const cp2Events = cp2.trace.length;
  const cp2PlusEvents = cp2Plus.counters.eventsEmitted;

  return {
    familyId: input.familyId,
    caseId: input.caseId,
    vertexCount: input.vertices.length,
    arcCount: input.edgesD.length,
    genomicEdgeCount: input.edgesG.length,
    cp2: {
      path: cp2.bestPath,
      objective: cp2.bestPath?.length ?? 0,
      proofComplete: cp2.proofCompleteEmitted,
      statesExplored: cp2States,
      eventsEmitted: cp2Events,
      directedBoundPrunes: cp2.trace.filter((event) => event.type === 'bound-pruning').length,
    },
    cp2Plus: {
      path: cp2Plus.bestPath,
      objective: cp2Plus.bestPath?.length ?? 0,
      proofComplete: cp2Plus.proofCompleteEmitted,
      statesExplored: cp2PlusStates,
      eventsEmitted: cp2PlusEvents,
      directedBoundPrunes: cp2Plus.counters.directedBoundPrunes,
      genomicPropagationChecks: cp2Plus.counters.genomicPropagationChecks,
      genomicPropagationPrunes: cp2Plus.counters.genomicPropagationPrunes,
    },
    stateDelta: cp2PlusStates - cp2States,
    eventDelta: cp2PlusEvents - cp2Events,
    stateReductionPercent: cp2States > 0 ? ((cp2States - cp2PlusStates) / cp2States) * 100 : null,
    eventReductionPercent: cp2Events > 0 ? ((cp2Events - cp2PlusEvents) / cp2Events) * 100 : null,
    exactness: {
      objectiveMatch: (cp2.bestPath?.length ?? 0) === (cp2Plus.bestPath?.length ?? 0),
      winnerMatch: samePath(cp2.bestPath, cp2Plus.bestPath),
      proofStatusMatch: cp2.proofCompleteEmitted === cp2Plus.proofCompleteEmitted,
      validityMatch: isValidPath(cp2.bestPath, input.edgesD, input.edgesG)
        && isValidPath(cp2Plus.bestPath, input.edgesD, input.edgesG),
    },
  };
}

function sum(results: CP2PlusBenchmarkResult[], value: (result: CP2PlusBenchmarkResult) => number): number {
  return results.reduce((total, result) => total + value(result), 0);
}

export function generateBenchmarkConclusion(summary: Omit<CP2PlusBenchmarkSummary, 'conclusion'>): string {
  const mismatchCount = Object.values(summary.equalityMismatches).reduce((total, count) => total + count, 0);
  return `Across ${summary.totalCaseCount} deterministic educational and bounded-stress cases, CP2+ reduced states in ${summary.reducedStateCases}, matched CP2 state counts in ${summary.equalStateCases}, and explored more states in ${summary.increasedStateCases}. It emitted ${summary.cp2Plus.genomicPropagationPrunes} safe genomic propagation prunes. Exactness comparison recorded ${mismatchCount} equality mismatches. These structural results are corpus-specific; runtime was not used as a scientific conclusion.`;
}

export function summarizeCP2PlusBenchmark(results: CP2PlusBenchmarkResult[]): CP2PlusBenchmarkSummary {
  const familyIds = [...new Set(results.map((result) => result.familyId))];
  const base = {
    totalCaseCount: results.length,
    equalityMismatches: {
      objective: results.filter((result) => !result.exactness.objectiveMatch).length,
      winner: results.filter((result) => !result.exactness.winnerMatch).length,
      proofStatus: results.filter((result) => !result.exactness.proofStatusMatch).length,
      validity: results.filter((result) => !result.exactness.validityMatch).length,
    },
    reducedStateCases: results.filter((result) => result.stateDelta < 0).length,
    equalStateCases: results.filter((result) => result.stateDelta === 0).length,
    increasedStateCases: results.filter((result) => result.stateDelta > 0).length,
    totalGenomicPropagationPrunes: sum(results, (result) => result.cp2Plus.genomicPropagationPrunes),
    cp2: {
      statesExplored: sum(results, (result) => result.cp2.statesExplored),
      eventsEmitted: sum(results, (result) => result.cp2.eventsEmitted),
      directedBoundPrunes: sum(results, (result) => result.cp2.directedBoundPrunes),
    },
    cp2Plus: {
      statesExplored: sum(results, (result) => result.cp2Plus.statesExplored),
      eventsEmitted: sum(results, (result) => result.cp2Plus.eventsEmitted),
      directedBoundPrunes: sum(results, (result) => result.cp2Plus.directedBoundPrunes),
      genomicPropagationChecks: sum(results, (result) => result.cp2Plus.genomicPropagationChecks),
      genomicPropagationPrunes: sum(results, (result) => result.cp2Plus.genomicPropagationPrunes),
    },
    perFamily: familyIds.map((familyId) => {
      const family = results.filter((result) => result.familyId === familyId);
      return {
        familyId,
        caseCount: family.length,
        reducedStateCases: family.filter((result) => result.stateDelta < 0).length,
        equalStateCases: family.filter((result) => result.stateDelta === 0).length,
        increasedStateCases: family.filter((result) => result.stateDelta > 0).length,
        cp2StatesExplored: sum(family, (result) => result.cp2.statesExplored),
        cp2PlusStatesExplored: sum(family, (result) => result.cp2Plus.statesExplored),
        genomicPropagationPrunes: sum(family, (result) => result.cp2Plus.genomicPropagationPrunes),
      };
    }),
  };
  return { ...base, conclusion: generateBenchmarkConclusion(base) };
}

export function runCP2PlusBenchmark(
  corpus: readonly CP2PlusBenchmarkCase[] = CP2_PLUS_BENCHMARK_CORPUS
): CP2PlusBenchmarkReport {
  const results = corpus.map((input) => runCP2PlusBenchmarkCase(input));
  return { results, summary: summarizeCP2PlusBenchmark(results) };
}

export function compareSmallExhaustiveMethods(input: CP2PlusBenchmarkCase): Record<string, string[] | null> {
  const maxEvents = 200000;
  return {
    cp2Plus: solveCP2Plus(input.vertices, input.edgesD, input.edgesG, { maxEvents }).bestPath,
    cp2: solveCP2(input.vertices, input.edgesD, input.edgesG, { maxEvents }).bestPath,
    legacy: solveConsistentPath(input.vertices, input.edgesD, input.edgesG).longestConsistentPath,
    cp1: solveCP1(input.vertices, input.edgesD, input.edgesG, maxEvents).bestPath,
    algoBBPlusPlus: solveAlgoBBPlusPlus(input.vertices, input.edgesD, input.edgesG, { maxEvents }).bestPath,
    ilp1: solveILP1(input.vertices, input.edgesD, input.edgesG, { maxEvents }).bestPath,
    ilp2: solveILP2(input.vertices, input.edgesD, input.edgesG, { maxEvents }).bestPath,
    subsetDp: solveSubsetDP(input.vertices, input.edgesD, input.edgesG, { maxEvents }).bestPath,
  };
}
