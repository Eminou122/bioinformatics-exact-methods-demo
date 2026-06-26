// ponytail: LCG matches project-wide test RNG (cp2Solver.test.ts, ilp2Solver.test.ts)
function makeLcg(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

function shuffle<T>(arr: T[], rng: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function weightedSampleWithoutReplacement(
  candidates: string[],
  weights: number[],
  count: number,
  rng: () => number
): string[] {
  const result: string[] = [];
  const pool = candidates.map((c, i) => ({ c, w: weights[i] }));
  for (let k = 0; k < count && pool.length > 0; k++) {
    let total = 0;
    for (const item of pool) total += item.w;
    let r = rng() * total;
    let chosen = pool.length - 1;
    for (let i = 0; i < pool.length; i++) {
      r -= pool[i].w;
      if (r < 0) { chosen = i; break; }
    }
    result.push(pool[chosen].c);
    pool.splice(chosen, 1);
  }
  return result;
}

function assertPositiveInt(val: number, name: string): void {
  if (!Number.isInteger(val) || val < 1) throw new Error(`${name} must be a positive integer`);
}
function assertNonNegInt(val: number, name: string): void {
  if (!Number.isInteger(val) || val < 0) throw new Error(`${name} must be a non-negative integer`);
}
function assertFiniteInt(val: number, name: string): void {
  if (!Number.isFinite(val) || !Number.isInteger(val)) throw new Error(`${name} must be a finite integer`);
}
function assertProb(val: number, name: string): void {
  if (!Number.isFinite(val) || val < 0 || val > 1) throw new Error(`${name} must be finite and in [0, 1]`);
}

export interface GraphStatistics {
  vertexCount: number;
  directedEdgeCount: number;
  genomicEdgeCount: number;
}

export interface ErdosRenyiParams {
  n: number;
  pD: number;
  pG: number;
  seed: number;
}

export interface ScaleFreeParams {
  n: number;
  m: number;
  seed: number;
}

export interface IndependentErdosRenyiParams {
  n: number;
  pD: number;
  pG: number;
  seedOrder: number;
  seedD: number;
  seedG: number;
}

export interface IndependentScaleFreeParams {
  n: number;
  m: number;
  seedOrder: number;
  seedD: number;
  seedG: number;
}

export interface AcyclicErdosRenyiGraph {
  family: 'acyclic-erdos-renyi';
  seed: number;
  seeds?: { seedOrder: number; seedD: number; seedG: number };
  parameters: ErdosRenyiParams | IndependentErdosRenyiParams;
  vertices: string[];
  topologicalOrder: string[];
  edgesD: { from: string; to: string }[];
  edgesG: { u: string; v: string }[];
  statistics: GraphStatistics;
}

export interface AcyclicScaleFreeGraph {
  family: 'acyclic-scale-free';
  seed: number;
  seeds?: { seedOrder: number; seedD: number; seedG: number };
  parameters: ScaleFreeParams | IndependentScaleFreeParams;
  vertices: string[];
  topologicalOrder: string[];
  edgesD: { from: string; to: string }[];
  edgesG: { u: string; v: string }[];
  statistics: GraphStatistics;
}

function assertIndependentSeeds(seedOrder: number, seedD: number, seedG: number): void {
  assertFiniteInt(seedOrder, 'seedOrder');
  assertFiniteInt(seedD, 'seedD');
  assertFiniteInt(seedG, 'seedG');
}

/**
 * Generates a deterministic acyclic Erdős–Rényi-style (D,G) graph.
 * D arcs go forward in the seeded topological order with probability pD.
 * G edges are drawn independently per unordered pair with probability pG.
 * Not a claim of exact paper distribution; educational generator only.
 */
export function generateAcyclicErdosRenyiGraph(params: ErdosRenyiParams): AcyclicErdosRenyiGraph {
  const { n, pD, pG, seed } = params;
  assertPositiveInt(n, 'n');
  assertProb(pD, 'pD');
  assertProb(pG, 'pG');
  assertFiniteInt(seed, 'seed');

  const rng = makeLcg(seed);
  const vertices = Array.from({ length: n }, (_, i) => `R${i + 1}`);
  const topologicalOrder = shuffle(vertices, rng);

  const edgesD: { from: string; to: string }[] = [];
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      if (rng() < pD) {
        edgesD.push({ from: topologicalOrder[i], to: topologicalOrder[j] });
      }
    }
  }

  const edgesG: { u: string; v: string }[] = [];
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      if (rng() < pG) {
        const [u, v] = [vertices[i], vertices[j]].sort();
        edgesG.push({ u, v });
      }
    }
  }

  edgesD.sort((a, b) => a.from.localeCompare(b.from) || a.to.localeCompare(b.to));
  edgesG.sort((a, b) => a.u.localeCompare(b.u) || a.v.localeCompare(b.v));

  return {
    family: 'acyclic-erdos-renyi',
    seed,
    parameters: params,
    vertices,
    topologicalOrder,
    edgesD,
    edgesG,
    statistics: { vertexCount: n, directedEdgeCount: edgesD.length, genomicEdgeCount: edgesG.length },
  };
}

export function generateIndependentAcyclicErdosRenyiGraph(params: IndependentErdosRenyiParams): AcyclicErdosRenyiGraph {
  const { n, pD, pG, seedOrder, seedD, seedG } = params;
  assertPositiveInt(n, 'n');
  assertProb(pD, 'pD');
  assertProb(pG, 'pG');
  assertIndependentSeeds(seedOrder, seedD, seedG);

  const vertices = Array.from({ length: n }, (_, i) => `R${i + 1}`);
  const topologicalOrder = shuffle(vertices, makeLcg(seedOrder));
  const rngD = makeLcg(seedD);
  const rngG = makeLcg(seedG);

  const edgesD: { from: string; to: string }[] = [];
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      if (rngD() < pD) edgesD.push({ from: topologicalOrder[i], to: topologicalOrder[j] });
    }
  }

  const edgesG: { u: string; v: string }[] = [];
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      if (rngG() < pG) {
        const [u, v] = [vertices[i], vertices[j]].sort();
        edgesG.push({ u, v });
      }
    }
  }

  edgesD.sort((a, b) => a.from.localeCompare(b.from) || a.to.localeCompare(b.to));
  edgesG.sort((a, b) => a.u.localeCompare(b.u) || a.v.localeCompare(b.v));

  return {
    family: 'acyclic-erdos-renyi',
    seed: seedOrder,
    seeds: { seedOrder, seedD, seedG },
    parameters: params,
    vertices,
    topologicalOrder,
    edgesD,
    edgesG,
    statistics: { vertexCount: n, directedEdgeCount: edgesD.length, genomicEdgeCount: edgesG.length },
  };
}

/**
 * Generates a deterministic acyclic scale-free-style (D,G) graph.
 * Vertices are added in seeded topological order; D and G each use
 * preferential attachment (degree + 1) to select up to m earlier vertices.
 * Not a claim of exact paper distribution; educational generator only.
 */
export function generateAcyclicScaleFreeGraph(params: ScaleFreeParams): AcyclicScaleFreeGraph {
  const { n, m, seed } = params;
  assertPositiveInt(n, 'n');
  assertNonNegInt(m, 'm');
  assertFiniteInt(seed, 'seed');

  const rng = makeLcg(seed);
  const vertices = Array.from({ length: n }, (_, i) => `S${i + 1}`);
  const topologicalOrder = shuffle(vertices, rng);

  const degD: Record<string, number> = {};
  const degG: Record<string, number> = {};
  for (const v of vertices) { degD[v] = 0; degG[v] = 0; }

  const edgesD: { from: string; to: string }[] = [];
  const edgesG: { u: string; v: string }[] = [];

  const earlier: string[] = [];
  for (let j = 1; j < n; j++) {
    earlier.push(topologicalOrder[j - 1]);
    const newV = topologicalOrder[j];
    const count = Math.min(m, j);
    if (count > 0) {
      const selectedD = weightedSampleWithoutReplacement(
        earlier, earlier.map(v => degD[v] + 1), count, rng
      );
      for (const from of selectedD) {
        edgesD.push({ from, to: newV });
        degD[from]++;
        degD[newV]++;
      }
    }
    if (count > 0) {
      const selectedG = weightedSampleWithoutReplacement(
        earlier, earlier.map(v => degG[v] + 1), count, rng
      );
      for (const other of selectedG) {
        const [u, v] = [newV, other].sort();
        edgesG.push({ u, v });
        degG[newV]++;
        degG[other]++;
      }
    }
  }

  edgesD.sort((a, b) => a.from.localeCompare(b.from) || a.to.localeCompare(b.to));
  edgesG.sort((a, b) => a.u.localeCompare(b.u) || a.v.localeCompare(b.v));

  return {
    family: 'acyclic-scale-free',
    seed,
    parameters: params,
    vertices,
    topologicalOrder,
    edgesD,
    edgesG,
    statistics: { vertexCount: n, directedEdgeCount: edgesD.length, genomicEdgeCount: edgesG.length },
  };
}

export function generateIndependentAcyclicScaleFreeGraph(params: IndependentScaleFreeParams): AcyclicScaleFreeGraph {
  const { n, m, seedOrder, seedD, seedG } = params;
  assertPositiveInt(n, 'n');
  assertNonNegInt(m, 'm');
  assertIndependentSeeds(seedOrder, seedD, seedG);

  const vertices = Array.from({ length: n }, (_, i) => `S${i + 1}`);
  const topologicalOrder = shuffle(vertices, makeLcg(seedOrder));
  const rngD = makeLcg(seedD);
  const rngG = makeLcg(seedG);
  const degD: Record<string, number> = {};
  const degG: Record<string, number> = {};
  for (const v of vertices) { degD[v] = 0; degG[v] = 0; }

  const edgesD: { from: string; to: string }[] = [];
  const edgesG: { u: string; v: string }[] = [];
  const earlier: string[] = [];
  for (let j = 1; j < n; j++) {
    earlier.push(topologicalOrder[j - 1]);
    const newV = topologicalOrder[j];
    const count = Math.min(m, j);
    for (const from of weightedSampleWithoutReplacement(earlier, earlier.map(v => degD[v] + 1), count, rngD)) {
      edgesD.push({ from, to: newV });
      degD[from]++;
      degD[newV]++;
    }
    for (const other of weightedSampleWithoutReplacement(earlier, earlier.map(v => degG[v] + 1), count, rngG)) {
      const [u, v] = [newV, other].sort();
      edgesG.push({ u, v });
      degG[newV]++;
      degG[other]++;
    }
  }

  edgesD.sort((a, b) => a.from.localeCompare(b.from) || a.to.localeCompare(b.to));
  edgesG.sort((a, b) => a.u.localeCompare(b.u) || a.v.localeCompare(b.v));

  return {
    family: 'acyclic-scale-free',
    seed: seedOrder,
    seeds: { seedOrder, seedD, seedG },
    parameters: params,
    vertices,
    topologicalOrder,
    edgesD,
    edgesG,
    statistics: { vertexCount: n, directedEdgeCount: edgesD.length, genomicEdgeCount: edgesG.length },
  };
}
