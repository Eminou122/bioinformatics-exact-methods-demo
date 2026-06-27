import { getEdgeId, hasCycle } from './graph';

export type DGDistinctionStatus = 'passed' | 'warning' | 'regenerated';

export interface DGStructuralGraph {
  vertices: string[];
  edgesD: { from: string; to: string }[];
  edgesG: { u: string; v: string }[];
  seeds?: { seedOrder: number; seedD: number; seedG: number };
}

export interface DGDistinctionReport {
  status: DGDistinctionStatus;
  attempts: number;
  finalSeedD: number;
  finalSeedG: number;
  sharedVertexIds: boolean;
  dAcyclic: boolean;
  gUndirected: boolean;
  independentStreams: boolean;
  projectedEdgeOverlapRatio: number;
  densityDifference: number;
  degreeProfileDistance: number;
  gConnectedComponents: number;
  dReachabilityPairs: number;
  notes: string[];
}

export interface RegeneratedDGDistinction<T extends DGStructuralGraph> {
  graph: T;
  report: DGDistinctionReport;
}

function pairCount(n: number): number {
  return Math.max(1, (n * (n - 1)) / 2);
}

function normalizedG(edgesG: { u: string; v: string }[]): Set<string> {
  return new Set(edgesG.map((edge) => getEdgeId(edge.u, edge.v)));
}

function sharedVertexIds(graph: DGStructuralGraph): boolean {
  const vertices = new Set(graph.vertices);
  return graph.edgesD.every((edge) => vertices.has(edge.from) && vertices.has(edge.to))
    && graph.edgesG.every((edge) => vertices.has(edge.u) && vertices.has(edge.v));
}

function gIsUndirected(graph: DGStructuralGraph): boolean {
  const seen = new Set<string>();
  for (const edge of graph.edgesG) {
    if (edge.u === edge.v) return false;
    const id = getEdgeId(edge.u, edge.v);
    if (id !== `${edge.u}--${edge.v}` || seen.has(id)) return false;
    seen.add(id);
  }
  return true;
}

function componentCount(vertices: string[], edgesG: { u: string; v: string }[]): number {
  const adj = Object.fromEntries(vertices.map((vertex) => [vertex, [] as string[]]));
  for (const edge of edgesG) {
    adj[edge.u]?.push(edge.v);
    adj[edge.v]?.push(edge.u);
  }
  const seen = new Set<string>();
  let count = 0;
  for (const vertex of vertices) {
    if (seen.has(vertex)) continue;
    count++;
    const stack = [vertex];
    seen.add(vertex);
    while (stack.length > 0) {
      for (const next of adj[stack.pop()!] || []) {
        if (!seen.has(next)) {
          seen.add(next);
          stack.push(next);
        }
      }
    }
  }
  return count;
}

function reachabilityPairs(vertices: string[], edgesD: { from: string; to: string }[]): number {
  const adj = Object.fromEntries(vertices.map((vertex) => [vertex, [] as string[]]));
  for (const edge of edgesD) adj[edge.from]?.push(edge.to);
  let pairs = 0;
  for (const start of vertices) {
    const seen = new Set<string>();
    const stack = [...(adj[start] || [])];
    while (stack.length > 0) {
      const next = stack.pop()!;
      if (seen.has(next)) continue;
      seen.add(next);
      stack.push(...(adj[next] || []));
    }
    pairs += seen.size;
  }
  return pairs;
}

function degreeProfileDistance(graph: DGStructuralGraph): number {
  const dDegree = Object.fromEntries(graph.vertices.map((vertex) => [vertex, 0]));
  const gDegree = Object.fromEntries(graph.vertices.map((vertex) => [vertex, 0]));
  for (const edge of graph.edgesD) {
    dDegree[edge.from] = (dDegree[edge.from] || 0) + 1;
    dDegree[edge.to] = (dDegree[edge.to] || 0) + 1;
  }
  for (const edge of graph.edgesG) {
    gDegree[edge.u] = (gDegree[edge.u] || 0) + 1;
    gDegree[edge.v] = (gDegree[edge.v] || 0) + 1;
  }
  return graph.vertices.reduce((sum, vertex) => sum + Math.abs((dDegree[vertex] || 0) - (gDegree[vertex] || 0)), 0)
    / Math.max(1, graph.vertices.length);
}

export function validateDGStructuralDistinction(graph: DGStructuralGraph, attempts = 0): DGDistinctionReport {
  const dPairs = new Set(graph.edgesD.map((edge) => getEdgeId(edge.from, edge.to)));
  const gPairs = normalizedG(graph.edgesG);
  const overlap = [...dPairs].filter((pair) => gPairs.has(pair)).length / Math.max(dPairs.size, gPairs.size, 1);
  const densityD = graph.edgesD.length / pairCount(graph.vertices.length);
  const densityG = graph.edgesG.length / pairCount(graph.vertices.length);
  const densityDifference = Math.abs(densityD - densityG);
  const degreeDistance = degreeProfileDistance(graph);
  const baseValid = sharedVertexIds(graph) && !hasCycle(graph.vertices, graph.edgesD) && gIsUndirected(graph);
  const independentStreams = Number.isFinite(graph.seeds?.seedOrder)
    && Number.isFinite(graph.seeds?.seedD)
    && Number.isFinite(graph.seeds?.seedG)
    && graph.seeds?.seedD !== graph.seeds?.seedG;
  const weaklyDistinct = overlap > 0.7 || (densityDifference < 0.1 && degreeDistance < 0.25);
  const status: DGDistinctionStatus = !baseValid || !independentStreams || weaklyDistinct ? 'warning' : attempts > 0 ? 'regenerated' : 'passed';
  const notes = [
    independentStreams
      ? 'Independent seed streams are recorded; they do not guarantee different-looking graphs.'
      : 'Independent seed metadata is missing or reused.',
    weaklyDistinct
      ? 'D/G structures are valid but visually or statistically close.'
      : 'D/G structures are visibly distinct by overlap, density, and degree profile.',
  ];

  return {
    status,
    attempts,
    finalSeedD: graph.seeds?.seedD ?? 0,
    finalSeedG: graph.seeds?.seedG ?? 0,
    sharedVertexIds: sharedVertexIds(graph),
    dAcyclic: !hasCycle(graph.vertices, graph.edgesD),
    gUndirected: gIsUndirected(graph),
    independentStreams,
    projectedEdgeOverlapRatio: overlap,
    densityDifference,
    degreeProfileDistance: degreeDistance,
    gConnectedComponents: componentCount(graph.vertices, graph.edgesG),
    dReachabilityPairs: reachabilityPairs(graph.vertices, graph.edgesD),
    notes,
  };
}

export function validateNamedChallengeDistinction(graph: DGStructuralGraph): DGDistinctionReport {
  const report = validateDGStructuralDistinction({ ...graph, seeds: { seedOrder: 0, seedD: 1, seedG: 2 } }, 0);
  return {
    ...report,
    status: report.sharedVertexIds && report.dAcyclic && report.gUndirected ? 'passed' : 'warning',
    attempts: 0,
    finalSeedD: graph.seeds?.seedD ?? 0,
    finalSeedG: graph.seeds?.seedG ?? 0,
    independentStreams: false,
    notes: ['Named challenge graph; designed D/G distinction is reported without regeneration.'],
  };
}

export function generateWithDGDistinctionRetries<T extends DGStructuralGraph>(
  seeds: { seedD: number; seedG: number },
  generate: (seedD: number, seedG: number) => T
): RegeneratedDGDistinction<T> {
  let best = generate(seeds.seedD, seeds.seedG);
  let bestReport = validateDGStructuralDistinction(best, 0);
  for (let attempt = 0; attempt <= 3; attempt++) {
    const graph = attempt === 0 ? best : generate(seeds.seedD + attempt * 1000, seeds.seedG + attempt * 1000);
    const report = validateDGStructuralDistinction(graph, attempt);
    if (report.status === 'passed' || report.status === 'regenerated') return { graph, report };
    best = graph;
    bestReport = report;
  }
  return { graph: best, report: { ...bestReport, status: 'warning' } };
}
