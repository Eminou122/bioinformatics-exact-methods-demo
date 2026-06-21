export type VertexId = string;
export type ArcId = string;
export type EdgeId = string;

export interface GraphD {
  vertices: VertexId[];
  edges: { id?: ArcId; from: VertexId; to: VertexId }[];
}

export interface GraphG {
  vertices: VertexId[];
  edges: { id?: EdgeId; u: VertexId; v: VertexId }[];
}

export function getArcId(from: VertexId, to: VertexId): ArcId {
  return `${from}->${to}`;
}

export function getEdgeId(u: VertexId, v: VertexId): EdgeId {
  const sorted = [u, v].sort();
  return `${sorted[0]}--${sorted[1]}`;
}

export interface ValidationResult {
  isValid: boolean;
  errorCode?: 'INVALID_NODE_D' | 'INVALID_NODE_G' | 'DUPLICATE_EDGE_D' | 'DUPLICATE_EDGE_G';
  invalidNode?: string;
  error?: string;
}

/**
 * Validates that all vertices referenced in D and G edges exist in the vertices list.
 * Also ensures no duplicate edges are defined in D or G.
 */
export function validateGraphs(
  vertices: string[],
  edgesD: { from: string; to: string }[],
  edgesG: { u: string; v: string }[]
): ValidationResult {
  const vertexSet = new Set(vertices);

  // Check duplicate edges in D
  const seenD = new Set<string>();
  for (const edge of edgesD) {
    if (!vertexSet.has(edge.from)) {
      return {
        isValid: false,
        errorCode: 'INVALID_NODE_D',
        invalidNode: edge.from,
        error: `L'arête métabolique fait référence à un sommet inexistant: ${edge.from}`,
      };
    }
    if (!vertexSet.has(edge.to)) {
      return {
        isValid: false,
        errorCode: 'INVALID_NODE_D',
        invalidNode: edge.to,
        error: `L'arête métabolique fait référence à un sommet inexistant: ${edge.to}`,
      };
    }

    const edgeKey = `${edge.from}->${edge.to}`;
    if (seenD.has(edgeKey)) {
      return {
        isValid: false,
        errorCode: 'DUPLICATE_EDGE_D',
        error: `Arête métabolique en double détectée : ${edge.from} -> ${edge.to}`,
      };
    }
    seenD.add(edgeKey);
  }

  // Check duplicate edges in G
  const seenG = new Set<string>();
  for (const edge of edgesG) {
    if (!vertexSet.has(edge.u)) {
      return {
        isValid: false,
        errorCode: 'INVALID_NODE_G',
        invalidNode: edge.u,
        error: `La liaison génomique fait référence à un sommet inexistant: ${edge.u}`,
      };
    }
    if (!vertexSet.has(edge.v)) {
      return {
        isValid: false,
        errorCode: 'INVALID_NODE_G',
        invalidNode: edge.v,
        error: `La liaison génomique fait référence à un sommet inexistant: ${edge.v}`,
      };
    }

    // Since G is undirected, u--v is the same as v--u
    const nodes = [edge.u, edge.v].sort();
    const edgeKey = `${nodes[0]}--${nodes[1]}`;
    if (seenG.has(edgeKey)) {
      return {
        isValid: false,
        errorCode: 'DUPLICATE_EDGE_G',
        error: `Liaison génomique en double détectée : ${edge.u} — ${edge.v}`,
      };
    }
    seenG.add(edgeKey);
  }

  return { isValid: true };
}

/**
 * Checks if the directed graph D has cycles.
 * Returns true if a cycle is found, false otherwise.
 */
export function hasCycle(vertices: string[], edgesD: { from: string; to: string }[]): boolean {
  const adj: Record<string, string[]> = {};
  for (const v of vertices) {
    adj[v] = [];
  }
  for (const edge of edgesD) {
    adj[edge.from].push(edge.to);
  }

  const visited: Record<string, 'unvisited' | 'visiting' | 'visited'> = {};
  for (const v of vertices) {
    visited[v] = 'unvisited';
  }

  function dfs(u: string): boolean {
    visited[u] = 'visiting';
    const neighbors = adj[u] || [];
    for (const v of neighbors) {
      if (visited[v] === 'visiting') {
        return true; // Cycle found
      }
      if (visited[v] === 'unvisited') {
        if (dfs(v)) return true;
      }
    }
    visited[u] = 'visited';
    return false;
  }

  for (const v of vertices) {
    if (visited[v] === 'unvisited') {
      if (dfs(v)) return true;
    }
  }

  return false;
}
