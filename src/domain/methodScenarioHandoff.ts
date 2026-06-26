import type { ExampleDataset } from '../data/examples';
import { hasCycle, validateGraphs } from './graph';

export type ScenarioSource = 'random-graph-lab' | 'challenge-graph';

export interface MethodScenarioHandoff {
  scenarioId: string;
  source: ScenarioSource;
  vertices: string[];
  edgesD: { from: string; to: string }[];
  edgesG: { u: string; v: string }[];
  maxEvents: number;
  family: string;
  parameters: Record<string, string | number | boolean>;
  seedOrder: number;
  seedD: number;
  seedG: number;
  challengeGraphId?: string;
}

export const HANDOFF_QUERY_KEY = 'scenario';
export const HANDOFF_ID_QUERY_KEY = 'scenarioId';
export const HANDOFF_STORAGE_PREFIX = 'method-scenario-handoff:';
export const MAX_URL_SCENARIO_CHARS = 1800;

export type HandoffTransport = 'url' | 'session';

export interface HandoffLink {
  url: string;
  scenarioId: string;
  transport: HandoffTransport;
}

export interface HandoffReadResult {
  scenario: MethodScenarioHandoff | null;
  scenarioId: string | null;
  error: string | null;
}

function encodeScenario(scenario: MethodScenarioHandoff): string {
  return encodeURIComponent(JSON.stringify(scenario));
}

function decodeScenario(value: string): MethodScenarioHandoff {
  return JSON.parse(decodeURIComponent(value));
}

export function makeScenarioId(source: ScenarioSource): string {
  const suffix = Math.random().toString(36).slice(2, 8);
  return `${source}-${Date.now().toString(36)}-${suffix}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function validateHandoffScenario(value: unknown): MethodScenarioHandoff | null {
  if (!isRecord(value)) return null;
  const vertices = value.vertices;
  const edgesD = value.edgesD;
  const edgesG = value.edgesG;
  if (
    typeof value.scenarioId !== 'string'
    || (value.source !== 'random-graph-lab' && value.source !== 'challenge-graph')
    || !Array.isArray(vertices)
    || !vertices.every((v) => typeof v === 'string')
    || !Array.isArray(edgesD)
    || !edgesD.every((e) => isRecord(e) && typeof e.from === 'string' && typeof e.to === 'string')
    || !Array.isArray(edgesG)
    || !edgesG.every((e) => isRecord(e) && typeof e.u === 'string' && typeof e.v === 'string')
    || typeof value.maxEvents !== 'number'
    || typeof value.family !== 'string'
    || !isRecord(value.parameters)
    || typeof value.seedOrder !== 'number'
    || typeof value.seedD !== 'number'
    || typeof value.seedG !== 'number'
  ) {
    return null;
  }
  const vertexSet = new Set(vertices);
  if (
    edgesD.some((e) => !vertexSet.has(e.from) || !vertexSet.has(e.to))
    || edgesG.some((e) => !vertexSet.has(e.u) || !vertexSet.has(e.v) || e.u === e.v)
  ) {
    return null;
  }
  if (!validateGraphs(vertices, edgesD, edgesG).isValid || hasCycle(vertices, edgesD)) {
    return null;
  }
  return value as unknown as MethodScenarioHandoff;
}

export function createScenarioHandoffLink(route: string, scenario: MethodScenarioHandoff): HandoffLink {
  const encoded = encodeScenario(scenario);
  const url = new URL(route, window.location.origin);
  if (encoded.length <= MAX_URL_SCENARIO_CHARS) {
    url.searchParams.set(HANDOFF_QUERY_KEY, encoded);
    return { url: `${url.pathname}${url.search}`, scenarioId: scenario.scenarioId, transport: 'url' };
  }
  window.sessionStorage.setItem(`${HANDOFF_STORAGE_PREFIX}${scenario.scenarioId}`, JSON.stringify(scenario));
  url.searchParams.set(HANDOFF_ID_QUERY_KEY, scenario.scenarioId);
  return { url: `${url.pathname}${url.search}`, scenarioId: scenario.scenarioId, transport: 'session' };
}

export function readScenarioHandoff(search = window.location.search): HandoffReadResult {
  const params = new URLSearchParams(search);
  const inline = params.get(HANDOFF_QUERY_KEY);
  const id = params.get(HANDOFF_ID_QUERY_KEY);
  try {
    if (inline) {
      const scenario = validateHandoffScenario(decodeScenario(inline));
      return scenario
        ? { scenario, scenarioId: scenario.scenarioId, error: null }
        : { scenario: null, scenarioId: null, error: 'Malformed scenario handoff. Loaded the built-in example.' };
    }
    if (id) {
      const stored = window.sessionStorage.getItem(`${HANDOFF_STORAGE_PREFIX}${id}`);
      if (!stored) {
        return { scenario: null, scenarioId: id, error: 'Stored scenario was not found. Loaded the built-in example.' };
      }
      const scenario = validateHandoffScenario(JSON.parse(stored));
      return scenario
        ? { scenario, scenarioId: scenario.scenarioId, error: null }
        : { scenario: null, scenarioId: id, error: 'Stored scenario was malformed. Loaded the built-in example.' };
    }
  } catch {
    return { scenario: null, scenarioId: id, error: 'Scenario handoff could not be read. Loaded the built-in example.' };
  }
  return { scenario: null, scenarioId: null, error: null };
}

export function positionsForVertices(vertices: string[]): Record<string, { x: number; y: number }> {
  return Object.fromEntries(vertices.map((v, i) => [v, { x: 80 + (i % 5) * 120, y: 80 + Math.floor(i / 5) * 120 }]));
}

export function scenarioToExample(scenario: MethodScenarioHandoff): ExampleDataset {
  const title = scenario.challengeGraphId ?? scenario.scenarioId;
  return {
    id: scenario.scenarioId,
    titleFr: `Scénario personnalisé ${title}`,
    titleEn: `Custom scenario ${title}`,
    titleAr: `سيناريو مخصص ${title}`,
    descriptionFr: 'Scénario fourni par le laboratoire de graphes aléatoires.',
    descriptionEn: 'Scenario supplied by the Random Graph Lab.',
    descriptionAr: 'سيناريو وارد من مختبر المخططات العشوائية.',
    teachingPointFr: 'Les solveurs utilisent les mêmes sommets et les mêmes arêtes D/G fournis.',
    teachingPointEn: 'The solvers use the supplied vertices and D/G edges.',
    teachingPointAr: 'تستخدم المحللات الرؤوس وحواف D/G المقدمة.',
    vertices: scenario.vertices,
    edgesD: scenario.edgesD,
    edgesG: scenario.edgesG,
    nodePositions: positionsForVertices(scenario.vertices),
  };
}
