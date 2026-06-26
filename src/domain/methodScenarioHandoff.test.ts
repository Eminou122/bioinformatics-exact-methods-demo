// @vitest-environment jsdom
import { beforeEach, describe, expect, test } from 'vitest';
import {
  createScenarioHandoffLink,
  HANDOFF_STORAGE_PREFIX,
  readScenarioHandoff,
  type MethodScenarioHandoff,
} from './methodScenarioHandoff';

function scenario(overrides: Partial<MethodScenarioHandoff> = {}): MethodScenarioHandoff {
  return {
    scenarioId: 'scenario-test',
    source: 'random-graph-lab',
    vertices: ['R1', 'R2', 'R3'],
    edgesD: [{ from: 'R1', to: 'R2' }, { from: 'R2', to: 'R3' }],
    edgesG: [{ u: 'R1', v: 'R2' }],
    maxEvents: 200000,
    family: 'acyclic-erdos-renyi',
    parameters: { n: 3, pD: 0.5, pG: 0.5 },
    seedOrder: 1,
    seedD: 2,
    seedG: 3,
    ...overrides,
  };
}

describe('method scenario handoff transport', () => {
  beforeEach(() => {
    window.history.pushState({}, '', '/methods/random-graph-lab');
    window.sessionStorage.clear();
  });

  test('URL-safe scenario transport remains deterministic', () => {
    const link = createScenarioHandoffLink('/methods/cp2', scenario());
    const read = readScenarioHandoff(link.url.slice(link.url.indexOf('?')));

    expect(link.transport).toBe('url');
    expect(read.scenario).toEqual(scenario());
  });

  test('oversized scenario uses sessionStorage under the visible scenario ID', () => {
    const vertices = Array.from({ length: 40 }, (_, index) => `R${index + 1}`);
    const large = scenario({
      scenarioId: 'scenario-large',
      vertices,
      edgesD: vertices.slice(0, -1).map((from, index) => ({ from, to: vertices[index + 1] })),
      edgesG: vertices.slice(0, -1).map((u, index) => ({ u, v: vertices[index + 1] })),
    });
    const link = createScenarioHandoffLink('/methods/cp2', large);
    const read = readScenarioHandoff(link.url.slice(link.url.indexOf('?')));

    expect(link.transport).toBe('session');
    expect(link.url).toContain('scenarioId=scenario-large');
    expect(window.sessionStorage.getItem(`${HANDOFF_STORAGE_PREFIX}scenario-large`)).toBeTruthy();
    expect(read.scenario).toEqual(large);
  });

  test('malformed or missing stored scenario reports fallback instead of throwing', () => {
    expect(readScenarioHandoff('?scenario=bad').scenario).toBeNull();
    expect(readScenarioHandoff('?scenarioId=missing').error).toContain('built-in example');
  });
});
