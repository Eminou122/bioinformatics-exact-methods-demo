import { useMemo } from 'react';
import { readScenarioHandoff, scenarioToExample } from '../domain/methodScenarioHandoff';

export function useScenarioHandoffExample(maxVertices?: number, blockedMessage = 'Not run — exceeds this solver’s educational safety limit.') {
  return useMemo(() => {
    const handoff = readScenarioHandoff();
    if (handoff.scenario && maxVertices !== undefined && handoff.scenario.vertices.length > maxVertices) {
      return {
        scenario: handoff.scenario,
        error: blockedMessage,
        example: null,
      };
    }
    return {
      scenario: handoff.scenario,
      error: handoff.error,
      example: handoff.scenario ? scenarioToExample(handoff.scenario) : null,
    };
  }, [blockedMessage, maxVertices]);
}
