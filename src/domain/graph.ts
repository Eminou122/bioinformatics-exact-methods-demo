export interface GraphD {
  vertices: string[];
  edges: { from: string; to: string }[];
}

export interface GraphG {
  vertices: string[];
  edges: { u: string; v: string }[];
}

/**
 * Validates that all vertices referenced in D and G edges exist in the vertices list.
 */
export function validateGraphs(
  vertices: string[],
  edgesD: { from: string; to: string }[],
  edgesG: { u: string; v: string }[]
): { isValid: boolean; error?: string } {
  const vertexSet = new Set(vertices);

  for (const edge of edgesD) {
    if (!vertexSet.has(edge.from)) {
      return {
        isValid: false,
        error: `L'arête métabolique fait référence à un sommet inexistant: ${edge.from}`,
      };
    }
    if (!vertexSet.has(edge.to)) {
      return {
        isValid: false,
        error: `L'arête métabolique fait référence à un sommet inexistant: ${edge.to}`,
      };
    }
  }

  for (const edge of edgesG) {
    if (!vertexSet.has(edge.u)) {
      return {
        isValid: false,
        error: `La liaison génomique fait référence à un sommet inexistant: ${edge.u}`,
      };
    }
    if (!vertexSet.has(edge.v)) {
      return {
        isValid: false,
        error: `La liaison génomique fait référence à un sommet inexistant: ${edge.v}`,
      };
    }
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
