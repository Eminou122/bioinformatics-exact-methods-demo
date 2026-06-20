import { hasCycle, validateGraphs } from './graph';

export interface PathEvaluation {
  path: string[];
  isAccepted: boolean;
  isBestSoFar: boolean;
  reasonCode: 'SINGLE_NODE' | 'CONNECTED' | 'DISCONNECTED';
  disconnectedVertices: string[];
}

export interface SolverResult {
  allPaths: string[][];
  evaluatedPathsCount: number;
  acceptedPathsCount: number;
  evaluations: PathEvaluation[];
  longestPathD: string[] | null;
  longestConsistentPath: string[] | null;
  error?: {
    code: 'CYCLE_DETECTED' | 'INVALID_NODE_D' | 'INVALID_NODE_G' | 'DUPLICATE_EDGE_D' | 'DUPLICATE_EDGE_G';
    node?: string;
    message?: string;
  };
}

/**
 * Deterministic comparison function for paths.
 * Returns negative if path 'a' is better than 'b' (comes first), positive if 'b' is better, 0 if equal.
 * Better means:
 * 1. Greater number of vertices (longer).
 * 2. If length is equal, lexicographically smaller sequence of reaction IDs.
 */
export function comparePaths(a: string[], b: string[]): number {
  if (a.length !== b.length) {
    return b.length - a.length; // Descending order of length (longer first)
  }

  const len = a.length;
  for (let i = 0; i < len; i++) {
    const comp = a[i].localeCompare(b[i]);
    if (comp !== 0) {
      return comp; // Ascending order of reaction ID lexicographically (e.g. 'R1' before 'R2')
    }
  }

  return 0;
}

/**
 * Enumerates all simple directed paths in DAG D.
 * Start DFS from every vertex.
 * Includes single-vertex paths.
 * Extends through outgoing arcs.
 * Prevents repeated vertices defensively.
 */
export function enumeratePaths(
  vertices: string[],
  edgesD: { from: string; to: string }[]
): string[][] {
  const adj: Record<string, string[]> = {};
  for (const v of vertices) {
    adj[v] = [];
  }
  for (const edge of edgesD) {
    adj[edge.from].push(edge.to);
  }

  const allPaths: string[][] = [];

  function dfs(currPath: string[], visited: Set<string>) {
    allPaths.push([...currPath]);
    const u = currPath[currPath.length - 1];
    const neighbors = adj[u] || [];
    for (const v of neighbors) {
      if (!visited.has(v)) {
        visited.add(v);
        currPath.push(v);
        dfs(currPath, visited);
        currPath.pop();
        visited.delete(v);
      }
    }
  }

  for (const startNode of vertices) {
    const visited = new Set<string>([startNode]);
    dfs([startNode], visited);
  }

  return allPaths;
}

/**
 * Checks if the induced subgraph of G using only path vertices is connected.
 * Vertices are connected if every vertex in the path is reachable from the first vertex in G.
 * Single vertex is treated as connected.
 */
export function isInducedGConnected(path: string[], edgesG: { u: string; v: string }[]): boolean {
  if (path.length <= 1) {
    return true;
  }

  const pathNodes = new Set(path);

  // Build adjacency list for the induced subgraph of G
  const adjG: Record<string, string[]> = {};
  for (const node of path) {
    adjG[node] = [];
  }

  for (const edge of edgesG) {
    if (pathNodes.has(edge.u) && pathNodes.has(edge.v)) {
      adjG[edge.u].push(edge.v);
      adjG[edge.v].push(edge.u);
    }
  }

  // BFS starting from the first vertex of the path
  const visited = new Set<string>();
  const queue: string[] = [path[0]];
  visited.add(path[0]);

  let head = 0;
  while (head < queue.length) {
    const u = queue[head++];
    const neighbors = adjG[u] || [];
    for (const v of neighbors) {
      if (!visited.has(v)) {
        visited.add(v);
        queue.push(v);
      }
    }
  }

  return visited.size === path.length;
}

/**
 * Solves the (D,G)-consistent path problem exactly.
 * Validates D and G structure first. Cycle detection is run before enumeration.
 */
export function solveConsistentPath(
  vertices: string[],
  edgesD: { from: string; to: string }[],
  edgesG: { u: string; v: string }[]
): SolverResult {
  // 1. Structural checks and duplicate edge detection
  const validation = validateGraphs(vertices, edgesD, edgesG);
  if (!validation.isValid) {
    return {
      allPaths: [],
      evaluatedPathsCount: 0,
      acceptedPathsCount: 0,
      evaluations: [],
      longestPathD: null,
      longestConsistentPath: null,
      error: {
        code: validation.errorCode!,
        node: validation.invalidNode,
        message: validation.error,
      },
    };
  }

  // 2. Cycle detection before path enumeration
  if (hasCycle(vertices, edgesD)) {
    return {
      allPaths: [],
      evaluatedPathsCount: 0,
      acceptedPathsCount: 0,
      evaluations: [],
      longestPathD: null,
      longestConsistentPath: null,
      error: {
        code: 'CYCLE_DETECTED',
      },
    };
  }

  // 3. Enumerate all paths in D
  const allPaths = enumeratePaths(vertices, edgesD);

  const evaluations: PathEvaluation[] = [];
  let bestConsistent: string[] | null = null;
  let acceptedCount = 0;

  for (const path of allPaths) {
    const isAccepted = isInducedGConnected(path, edgesG);
    if (isAccepted) {
      acceptedCount++;
    }

    let isBest = false;
    if (isAccepted) {
      if (bestConsistent === null || comparePaths(path, bestConsistent) < 0) {
        bestConsistent = path;
        isBest = true;
      }
    }

    let reasonCode: 'SINGLE_NODE' | 'CONNECTED' | 'DISCONNECTED';
    const disconnectedVertices: string[] = [];

    if (path.length === 1) {
      reasonCode = 'SINGLE_NODE';
    } else if (isAccepted) {
      reasonCode = 'CONNECTED';
    } else {
      reasonCode = 'DISCONNECTED';
      
      // Track which vertices are disconnected from path[0] in induced graph
      const pathNodes = new Set(path);
      const adjG: Record<string, string[]> = {};
      for (const node of path) {
        adjG[node] = [];
      }
      for (const edge of edgesG) {
        if (pathNodes.has(edge.u) && pathNodes.has(edge.v)) {
          adjG[edge.u].push(edge.v);
          adjG[edge.v].push(edge.u);
        }
      }
      
      const visited = new Set<string>();
      const queue = [path[0]];
      visited.add(path[0]);
      let head = 0;
      while (head < queue.length) {
        const u = queue[head++];
        for (const v of adjG[u] || []) {
          if (!visited.has(v)) {
            visited.add(v);
            queue.push(v);
          }
        }
      }
      
      for (const node of path) {
        if (!visited.has(node)) {
          disconnectedVertices.push(node);
        }
      }
    }

    evaluations.push({
      path,
      isAccepted,
      isBestSoFar: isBest,
      reasonCode,
      disconnectedVertices,
    });
  }

  // Find the overall longest unconstrained path in D (using the tie-breaker)
  let longestPathD: string[] | null = null;
  if (allPaths.length > 0) {
    const sortedPathsD = [...allPaths].sort(comparePaths);
    longestPathD = sortedPathsD[0];
  }

  return {
    allPaths,
    evaluatedPathsCount: allPaths.length,
    acceptedPathsCount: acceptedCount,
    evaluations,
    longestPathD,
    longestConsistentPath: bestConsistent,
  };
}
