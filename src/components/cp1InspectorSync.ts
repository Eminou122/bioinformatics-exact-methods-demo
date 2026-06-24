import type { CP1TraceEvent } from '../domain/cpSolver';

export function cp1InspectorKeys(vertices: string[]): Set<string> {
  return new Set(['start', 'end', ...vertices.flatMap((vertex) => [`x[${vertex}]`, `succ[${vertex}]`])]);
}

export function getCP1InspectorKeyForTraceEvent(event: CP1TraceEvent | null, renderedKeys: Set<string>): string | null {
  if (!event) return null;

  const exactVariable = event.variable && renderedKeys.has(event.variable) ? event.variable : null;
  if (exactVariable) return exactVariable;

  const xAssignment = event.message.match(/\bSet x\[([^\]]+)\]\s*=\s*1\b/);
  if (xAssignment) {
    const key = `x[${xAssignment[1]}]`;
    return renderedKeys.has(key) ? key : null;
  }

  if (event.message.includes('Set end =')) {
    return renderedKeys.has('end') ? 'end' : null;
  }

  if (event.type === 'proof-complete' || event.message.includes('Search complete.')) {
    return renderedKeys.has('end') ? 'end' : null;
  }

  return null;
}
