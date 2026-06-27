import {
  generateIndependentAcyclicErdosRenyiGraph,
  generateIndependentAcyclicScaleFreeGraph,
  type AcyclicErdosRenyiGraph,
  type AcyclicScaleFreeGraph,
  type IndependentErdosRenyiParams,
  type IndependentScaleFreeParams,
} from './randomGraphGenerators';
import { generateWithDGDistinctionRetries, validateDGStructuralDistinction, type DGDistinctionReport } from './dgStructuralDistinction';

export type HardRandomTier = 'S' | 'M' | 'L';
export type HardRandomFamily =
  | 'small-d-core-large-dense-g'
  | 'large-branching-d-fragmented-g'
  | 'dense-d-sparse-g'
  | 'sparse-d-dense-g'
  | 'anti-correlated-dg'
  | 'community-g-decoys'
  | 'repairable-bridge'
  | 'no-solution'
  | 'layered-high-path-count'
  | 'lexical-tie-dag';
export type AllowedSolver = 'Legacy' | 'CP1' | 'CP2' | 'CP2+' | 'AlgoBB++' | 'ILP1' | 'ILP2' | 'ILP2+' | 'Subset DP';
export type HardRandomParams = IndependentErdosRenyiParams | IndependentScaleFreeParams | { n: number; coreSize?: number; layers?: number; width?: number; seedOrder: number; seedD: number; seedG: number };
export type HardRandomGeneratedGraph = (AcyclicErdosRenyiGraph | AcyclicScaleFreeGraph) & { distinction: DGDistinctionReport };

export interface HardRandomCaseSpec {
  caseId: string;
  tier: HardRandomTier;
  graphFamily: 'acyclic-erdos-renyi' | 'acyclic-scale-free' | 'constructed';
  family: HardRandomFamily;
  params: HardRandomParams;
  maxEvents: number;
  structuralProperty: string;
  educationalPurpose: string;
  allowedSolvers: AllowedSolver[];
}

const allSmall: AllowedSolver[] = ['Legacy', 'CP1', 'CP2', 'CP2+', 'AlgoBB++', 'ILP1', 'ILP2', 'ILP2+', 'Subset DP'];
const medium: AllowedSolver[] = ['CP2', 'CP2+', 'ILP2', 'ILP2+'];
const stress: AllowedSolver[] = ['CP2', 'CP2+'];

function er(caseId: string, tier: HardRandomTier, family: HardRandomFamily, n: number, pD: number, pG: number, seedOrder: number, seedD: number, seedG: number): HardRandomCaseSpec {
  return { caseId, tier, graphFamily: 'acyclic-erdos-renyi', family, params: { n, pD, pG, seedOrder, seedD, seedG }, maxEvents: tier === 'L' ? 30000 : 200000, structuralProperty: family.replaceAll('-', ' '), educationalPurpose: purpose[family], allowedSolvers: tier === 'S' ? allSmall : tier === 'M' ? medium : stress };
}

function sf(caseId: string, tier: HardRandomTier, family: HardRandomFamily, n: number, m: number, seedOrder: number, seedD: number, seedG: number): HardRandomCaseSpec {
  return { caseId, tier, graphFamily: 'acyclic-scale-free', family, params: { n, m, seedOrder, seedD, seedG }, maxEvents: tier === 'L' ? 30000 : 200000, structuralProperty: family.replaceAll('-', ' '), educationalPurpose: purpose[family], allowedSolvers: tier === 'S' ? allSmall : tier === 'M' ? medium : stress };
}

function constructed(caseId: string, tier: HardRandomTier, family: HardRandomFamily, n: number, seedOrder: number, seedD: number, seedG: number, extra: Partial<HardRandomParams> = {}): HardRandomCaseSpec {
  return { caseId, tier, graphFamily: 'constructed', family, params: { n, seedOrder, seedD, seedG, ...extra }, maxEvents: tier === 'L' ? 30000 : 200000, structuralProperty: family.replaceAll('-', ' '), educationalPurpose: purpose[family], allowedSolvers: tier === 'S' ? allSmall : tier === 'M' ? medium : stress };
}

const purpose: Record<HardRandomFamily, string> = {
  'small-d-core-large-dense-g': 'Large shared vertex set where the reachable D core is deliberately tiny.',
  'large-branching-d-fragmented-g': 'Many directed branches become infeasible because G is fragmented.',
  'dense-d-sparse-g': 'Directed continuations are abundant while genomic connectivity is restrictive.',
  'sparse-d-dense-g': 'Dense G cannot invent directed paths that D does not contain.',
  'anti-correlated-dg': 'Long D candidates tend to fail induced-G connectivity.',
  'community-g-decoys': 'Large genomic communities exist outside the useful D start/core.',
  'repairable-bridge': 'Later vertices can reconnect an induced genomic subgraph.',
  'no-solution': 'Valid input where only the permitted singleton baseline is feasible.',
  'layered-high-path-count': 'Layered DAG creates many directed candidates.',
  'lexical-tie-dag': 'Equal-length paths expose canonical lexical tie behavior.',
};

export const HARD_RANDOM_GRAPH_CORPUS: readonly HardRandomCaseSpec[] = [
  er('hard-s-branch-frag-0', 'S', 'large-branching-d-fragmented-g', 6, 0.65, 0.1, 1001, 1002, 1003),
  er('hard-s-branch-frag-1', 'S', 'large-branching-d-fragmented-g', 6, 0.75, 0.08, 1011, 1012, 1013),
  er('hard-s-dense-sparse-1', 'S', 'dense-d-sparse-g', 6, 0.9, 0.12, 1021, 1022, 1023),
  er('hard-s-sparse-dense-1', 'S', 'sparse-d-dense-g', 5, 0.18, 0.85, 1031, 1032, 1033),
  er('hard-s-anticorr-1', 'S', 'anti-correlated-dg', 6, 0.78, 0.1, 1041, 1042, 1043),
  constructed('hard-s-community-decoy-1', 'S', 'community-g-decoys', 6, 1051, 1052, 1053),
  constructed('hard-s-repair-bridge-1', 'S', 'repairable-bridge', 6, 1061, 1062, 1063),
  constructed('hard-s-no-solution-1', 'S', 'no-solution', 5, 1071, 1072, 1073),
  constructed('hard-s-layered-1', 'S', 'layered-high-path-count', 6, 1081, 1082, 1083, { layers: 3, width: 2 }),
  constructed('hard-s-lexical-1', 'S', 'lexical-tie-dag', 6, 1091, 1092, 1093),
  sf('hard-s-sf-branch-1', 'S', 'large-branching-d-fragmented-g', 6, 2, 1101, 1102, 1103),
  sf('hard-s-sf-dense-sparse-1', 'S', 'dense-d-sparse-g', 6, 3, 1111, 1112, 1113),
  er('hard-s-repair-er-1', 'S', 'repairable-bridge', 6, 0.55, 0.28, 1121, 1122, 1123),
  er('hard-s-community-er-1', 'S', 'community-g-decoys', 6, 0.45, 0.4, 1131, 1132, 1133),
  er('hard-s-layered-er-1', 'S', 'layered-high-path-count', 6, 0.82, 0.5, 1141, 1142, 1143),
  er('hard-s-lexical-er-1', 'S', 'lexical-tie-dag', 5, 1, 1, 1151, 1152, 1153),
  er('hard-s-anticorr-2', 'S', 'anti-correlated-dg', 5, 0.7, 0.05, 1161, 1162, 1163),
  er('hard-s-sparse-dense-2', 'S', 'sparse-d-dense-g', 6, 0.22, 0.9, 1171, 1172, 1173),
  constructed('hard-s-community-decoy-2', 'S', 'community-g-decoys', 6, 1181, 1182, 1183),
  constructed('hard-s-no-solution-2', 'S', 'no-solution', 6, 1191, 1192, 1193),
  constructed('hard-m-core-huge-g-32', 'M', 'small-d-core-large-dense-g', 32, 2001, 2002, 2003, { coreSize: 6 }),
  er('hard-m-branch-frag-1', 'M', 'large-branching-d-fragmented-g', 8, 0.7, 0.08, 2011, 2012, 2013),
  er('hard-m-dense-sparse-1', 'M', 'dense-d-sparse-g', 8, 0.82, 0.16, 2021, 2022, 2023),
  er('hard-m-sparse-dense-1', 'M', 'sparse-d-dense-g', 8, 0.2, 0.82, 2031, 2032, 2033),
  er('hard-m-anticorr-1', 'M', 'anti-correlated-dg', 9, 0.72, 0.1, 2041, 2042, 2043),
  constructed('hard-m-community-decoy-1', 'M', 'community-g-decoys', 9, 2051, 2052, 2053),
  constructed('hard-m-repair-bridge-1', 'M', 'repairable-bridge', 8, 2061, 2062, 2063),
  constructed('hard-m-no-solution-1', 'M', 'no-solution', 8, 2071, 2072, 2073),
  constructed('hard-m-layered-1', 'M', 'layered-high-path-count', 10, 2081, 2082, 2083, { layers: 5, width: 2 }),
  constructed('hard-m-lexical-1', 'M', 'lexical-tie-dag', 7, 2091, 2092, 2093),
  sf('hard-m-sf-branch-1', 'M', 'large-branching-d-fragmented-g', 8, 2, 2101, 2102, 2103),
  sf('hard-m-sf-dense-sparse-1', 'M', 'dense-d-sparse-g', 9, 3, 2111, 2112, 2113),
  er('hard-m-repair-er-1', 'M', 'repairable-bridge', 8, 0.5, 0.28, 2121, 2122, 2123),
  er('hard-m-community-er-1', 'M', 'community-g-decoys', 9, 0.42, 0.42, 2131, 2132, 2133),
  er('hard-m-layered-er-1', 'M', 'layered-high-path-count', 10, 0.62, 0.62, 2141, 2142, 2143),
  er('hard-m-lexical-er-1', 'M', 'lexical-tie-dag', 7, 0.92, 0.92, 2151, 2152, 2153),
  er('hard-m-anticorr-2', 'M', 'anti-correlated-dg', 10, 0.65, 0.12, 2161, 2162, 2163),
  er('hard-m-sparse-dense-2', 'M', 'sparse-d-dense-g', 9, 0.24, 0.85, 2171, 2172, 2173),
  constructed('hard-m-core-huge-g-40', 'M', 'small-d-core-large-dense-g', 40, 2181, 2182, 2183, { coreSize: 5 }),
  constructed('hard-m-no-solution-2', 'M', 'no-solution', 10, 2191, 2192, 2193),
  constructed('hard-stress-core-huge-g-67', 'L', 'small-d-core-large-dense-g', 67, 3001, 3002, 3003, { coreSize: 5 }),
  er('hard-stress-branch-frag-1', 'L', 'large-branching-d-fragmented-g', 12, 0.62, 0.08, 3011, 3012, 3013),
  er('hard-stress-dense-sparse-1', 'L', 'dense-d-sparse-g', 12, 0.72, 0.16, 3021, 3022, 3023),
  er('hard-stress-sparse-dense-1', 'L', 'sparse-d-dense-g', 13, 0.2, 0.8, 3031, 3032, 3033),
  er('hard-stress-anticorr-1', 'L', 'anti-correlated-dg', 12, 0.65, 0.1, 3041, 3042, 3043),
  constructed('hard-stress-community-decoy-1', 'L', 'community-g-decoys', 13, 3051, 3052, 3053),
  constructed('hard-stress-repair-bridge-1', 'L', 'repairable-bridge', 12, 3061, 3062, 3063),
  constructed('hard-stress-no-solution-1', 'L', 'no-solution', 13, 3071, 3072, 3073),
  constructed('hard-stress-layered-1', 'L', 'layered-high-path-count', 13, 3081, 3082, 3083, { layers: 4, width: 3 }),
  constructed('hard-stress-lexical-1', 'L', 'lexical-tie-dag', 12, 3091, 3092, 3093),
];

function denseG(vertices: string[], skip = 0): { u: string; v: string }[] {
  return vertices.flatMap((u, i) => vertices.slice(i + 1).filter((_, j) => (i + j + skip) % 3 !== 0).map((v) => {
    const [a, b] = [u, v].sort();
    return { u: a, v: b };
  }));
}

function constructedGraph(spec: HardRandomCaseSpec): AcyclicErdosRenyiGraph {
  const p = spec.params;
  const vertices = Array.from({ length: p.n }, (_, i) => `R${i + 1}`);
  const coreSize = 'coreSize' in p ? p.coreSize : undefined;
  const widthParam = 'width' in p ? p.width : undefined;
  const core = vertices.slice(0, Math.min(coreSize ?? 6, p.n));
  let edgesD: { from: string; to: string }[];
  let edgesG: { u: string; v: string }[];
  if (spec.family === 'small-d-core-large-dense-g') {
    edgesD = core.slice(0, -1).map((from, i) => ({ from, to: core[i + 1] }));
    edgesG = denseG(vertices);
  } else if (spec.family === 'community-g-decoys') {
    edgesD = vertices.slice(0, Math.min(5, p.n) - 1).map((from, i) => ({ from, to: vertices[i + 1] }));
    edgesG = [vertices.slice(0, 3), vertices.slice(3)].flatMap((part) => denseG(part, 1));
  } else if (spec.family === 'repairable-bridge') {
    edgesD = vertices.slice(0, -1).map((from, i) => ({ from, to: vertices[i + 1] }));
    edgesG = vertices.slice(0, -1).map((u, i) => ({ u, v: vertices[i + 1] })).filter((_, i) => i !== 1 || p.n <= 5);
  } else if (spec.family === 'no-solution') {
    edgesD = vertices.slice(0, -1).map((from, i) => ({ from, to: vertices[i + 1] }));
    edgesG = [];
  } else if (spec.family === 'layered-high-path-count') {
    const width = widthParam ?? 2;
    edgesD = vertices.flatMap((from, i) => vertices.slice(i + 1, i + 1 + width).map((to) => ({ from, to })));
    edgesG = denseG(vertices, 2);
  } else {
    const mid = Math.floor(p.n / 2);
    edgesD = vertices.slice(0, mid).flatMap((from) => vertices.slice(mid, Math.min(p.n, mid + 3)).map((to) => ({ from, to })));
    edgesG = denseG(vertices);
  }
  edgesD.sort((a, b) => a.from.localeCompare(b.from) || a.to.localeCompare(b.to));
  edgesG = edgesG.map((edge) => {
    const [u, v] = [edge.u, edge.v].sort();
    return { u, v };
  }).sort((a, b) => a.u.localeCompare(b.u) || a.v.localeCompare(b.v));
  return {
    family: 'acyclic-erdos-renyi',
    seed: p.seedOrder,
    seeds: { seedOrder: p.seedOrder, seedD: p.seedD, seedG: p.seedG },
    parameters: { n: p.n, pD: 0, pG: 0, seedOrder: p.seedOrder, seedD: p.seedD, seedG: p.seedG },
    vertices,
    topologicalOrder: vertices,
    edgesD,
    edgesG,
    statistics: { vertexCount: vertices.length, directedEdgeCount: edgesD.length, genomicEdgeCount: edgesG.length },
  };
}

function baseGenerate(spec: HardRandomCaseSpec, seedD: number, seedG: number): AcyclicErdosRenyiGraph | AcyclicScaleFreeGraph {
  const params = { ...spec.params, seedD, seedG } as HardRandomParams;
  if (spec.graphFamily === 'constructed') return constructedGraph({ ...spec, params });
  if (spec.graphFamily === 'acyclic-erdos-renyi') return generateIndependentAcyclicErdosRenyiGraph(params as IndependentErdosRenyiParams);
  return generateIndependentAcyclicScaleFreeGraph(params as IndependentScaleFreeParams);
}

export function generateHardRandomGraph(spec: HardRandomCaseSpec): HardRandomGeneratedGraph {
  const generated = generateWithDGDistinctionRetries(
    { seedD: spec.params.seedD, seedG: spec.params.seedG },
    (seedD, seedG) => baseGenerate(spec, seedD, seedG)
  );
  return { ...generated.graph, distinction: generated.report };
}

export function validateHardRandomGraph(spec: HardRandomCaseSpec): DGDistinctionReport {
  return validateDGStructuralDistinction(generateHardRandomGraph(spec));
}

export function hardPresetLabel(spec: HardRandomCaseSpec): string {
  return `${spec.caseId} (${spec.tier}) n=${spec.params.n}, seedOrder=${spec.params.seedOrder}, seedD=${spec.params.seedD}, seedG=${spec.params.seedG}`;
}
