import React, { useMemo, useState } from 'react';
import { solveConsistentPath } from '../domain/pathAlgorithms';
import { solveCP1 } from '../domain/cpSolver';
import { solveCP2, type CP2SolverResult } from '../domain/cp2Solver';
import { solveCP2Plus, type CP2PlusSolverResult } from '../domain/cp2PlusSolver';
import { solveAlgoBBPlusPlus } from '../domain/algoBBPlusPlus';
import { solveILP1 } from '../domain/ilp1Solver';
import { solveILP2, type ILP2SolverResult } from '../domain/ilp2Solver';
import { solveSubsetDP } from '../domain/subsetDpSolver';
import {
  CP2_RANDOM_BENCHMARK_CORPUS,
  type CP2RandomBenchmarkCaseSpec,
} from '../domain/cp2RandomBenchmark';
import {
  generateIndependentAcyclicErdosRenyiGraph,
  generateIndependentAcyclicScaleFreeGraph,
  type AcyclicErdosRenyiGraph,
  type AcyclicScaleFreeGraph,
} from '../domain/randomGraphGenerators';
import { CHALLENGE_GRAPHS, challengeToScenario, type ChallengeGraph } from '../domain/challengeGraphLibrary';
import { createScenarioHandoffLink, makeScenarioId, type MethodScenarioHandoff } from '../domain/methodScenarioHandoff';
import { isInducedGConnected } from '../domain/pathAlgorithms';
import type { Language, TranslationDict } from '../i18n/types';
import { GraphPanel } from './GraphPanel';
import { Icon } from './Icons';
import { MethodCockpit } from './MethodCockpit';

type Family = 'acyclic-erdos-renyi' | 'acyclic-scale-free';
type ChallengeGeneratedGraph = {
  family: 'challenge-graph';
  vertices: string[];
  topologicalOrder: string[];
  edgesD: { from: string; to: string }[];
  edgesG: { u: string; v: string }[];
  statistics: { vertexCount: number; directedEdgeCount: number; genomicEdgeCount: number };
  seeds: { seedOrder: number; seedD: number; seedG: number };
  parameters: Record<string, string | number | boolean>;
  challengeGraphId: string;
};
type GeneratedGraph = AcyclicErdosRenyiGraph | AcyclicScaleFreeGraph | ChallengeGeneratedGraph;
type SolverState =
  | 'complete-comparable'
  | 'incomplete-capped'
  | 'incomplete-cancelled'
  | 'not-run-preenumeration-risk'
  | 'not-run-educational-safety-limit'
  | 'not-applicable-cyclic-trail-method';

interface RandomGraphDemoLabProps {
  lang: Language;
  dict: TranslationDict;
}

interface FormState {
  n: string;
  pD: string;
  pG: string;
  m: string;
  seedOrder: string;
  seedD: string;
  seedG: string;
}

interface SolverRow {
  name: string;
  state: SolverState;
  status: string;
  path: string;
  valid: string;
  proof: string;
  metric: string;
  comparablePath?: string[] | null;
}

type SolverBundle = {
  cp2: CP2SolverResult;
  cp2Plus: CP2PlusSolverResult;
  ilp2: ILP2SolverResult | null;
  rows: SolverRow[];
};

const MAX_EVENTS = 200000;
const CUSTOM_ILP2_MAX_N = 10;
const CUSTOM_MAX_N = 13;
const SMALL_MAX_N = 6;
const CUSTOM_ID = 'custom';

const labels = {
  fr: {
    title: 'Laboratoire de démonstration de graphes aléatoires',
    subtitle: 'Générez D et G indépendamment avec des graines visibles, puis comparez les solveurs exacts acycliques applicables.',
    family: 'Famille',
    er: 'Erdős–Rényi acyclique',
    sf: 'Scale-free-style acyclique',
    preset: 'Préréglage déterministe',
    custom: 'Paramètres personnalisés',
    generate: 'Générer',
    reset: 'Réinitialiser',
    newRandom: 'Nouveau scénario aléatoire',
    sameSeed: 'Les graines affichées seedOrder, seedD et seedG rejouent exactement le scénario. D et G sont générés indépendamment.',
    n: 'n',
    pD: 'pD',
    pG: 'pG',
    m: 'm',
    seedOrder: 'seedOrder',
    seedD: 'seedD',
    seedG: 'seedG',
    required: 'Valeur invalide pour',
    bounds: 'n doit rester entre 1 et 13 pour ce laboratoire navigateur.',
    probability: 'La probabilité doit être dans [0, 1].',
    integer: 'La valeur doit être un entier.',
    nonNegative: 'm doit être un entier positif ou nul.',
    graph: 'Graphe généré',
    topological: 'Ordre topologique',
    stats: 'Sommets / arcs D / arêtes G',
    primary: 'Résultats principaux',
    allSolvers: 'Tous les solveurs exacts applicables',
    path: 'Chemin canonique',
    status: 'Statut',
    proof: 'Preuve complète',
    valid: 'Chemin valide',
    state: 'État',
    metric: 'Métrique locale',
    equality: 'Égalité exacte',
    unavailable: 'Disponible seulement quand tous les solveurs applicables comparés terminent.',
    countersNote: 'Each solver reports work in its own search model. Candidate counts and explored states are not interchangeable.',
    ilp2Skip: 'ILP2 n’est pas lancé pour ce scénario afin d’éviter le risque de pré-énumération.',
    safetySkip: 'Not run — exceeds this solver’s educational safety limit.',
    cyclicSkip: 'Not applicable — cyclic-trail method.',
    limitation: 'Générateur éducatif déterministe seulement: pas de MILP natif, pas de reproduction papier, pas de conclusion de supériorité en temps.',
    challenges: 'Graphes défis déterministes',
    challengePurpose: 'Objectif pédagogique',
    loadChallenge: 'Charger le graphe défi',
    testMethods: 'Tester dans les méthodes',
    openLegacy: 'Ouvrir dans Legacy',
    openCP1: 'Ouvrir dans CP1',
    openCP2: 'Ouvrir dans CP2',
    openCP2Plus: 'Ouvrir dans CP2+',
    openAlgo: 'Ouvrir dans AlgoBB++',
    openILP1: 'Ouvrir dans ILP1',
    openILP2: 'Ouvrir dans ILP2',
    openSubset: 'Ouvrir dans Subset DP',
    blocked: 'Indisponible pour ce palier de sécurité.',
    scenarioId: 'ID du scénario',
  },
  en: {
    title: 'Random-Graph Demonstration Lab',
    subtitle: 'Generate D and G independently with visible seeds, then compare all applicable acyclic exact solvers.',
    family: 'Family',
    er: 'Acyclic Erdős–Rényi',
    sf: 'Acyclic scale-free-style',
    preset: 'Deterministic preset',
    custom: 'Custom parameters',
    generate: 'Generate',
    reset: 'Reset',
    newRandom: 'New random scenario',
    sameSeed: 'The displayed seedOrder, seedD, and seedG replay the exact scenario. D and G are independently generated.',
    n: 'n',
    pD: 'pD',
    pG: 'pG',
    m: 'm',
    seedOrder: 'seedOrder',
    seedD: 'seedD',
    seedG: 'seedG',
    required: 'Invalid value for',
    bounds: 'n must stay between 1 and 13 for this browser lab.',
    probability: 'Probability must be in [0, 1].',
    integer: 'Value must be an integer.',
    nonNegative: 'm must be a non-negative integer.',
    graph: 'Generated graph',
    topological: 'Topological order',
    stats: 'Vertices / D arcs / G edges',
    primary: 'Primary solver results',
    allSolvers: 'All applicable exact solvers',
    path: 'Canonical path',
    status: 'Status',
    proof: 'Proof complete',
    valid: 'Path valid',
    state: 'State',
    metric: 'Local metric',
    equality: 'Exact equality',
    unavailable: 'Available only when every compared applicable solver completes.',
    countersNote: 'Each solver reports work in its own search model. Candidate counts and explored states are not interchangeable.',
    ilp2Skip: 'ILP2 is not run for this scenario to avoid pre-enumeration risk.',
    safetySkip: 'Not run — exceeds this solver’s educational safety limit.',
    cyclicSkip: 'Not applicable — cyclic-trail method.',
    limitation: 'Deterministic educational generator only: no native MILP, no paper reproduction, no runtime-superiority conclusion.',
    challenges: 'Deterministic challenge graphs',
    challengePurpose: 'Teaching purpose',
    loadChallenge: 'Load challenge graph',
    testMethods: 'Test in Methods',
    openLegacy: 'Open in Legacy',
    openCP1: 'Open in CP1',
    openCP2: 'Open in CP2',
    openCP2Plus: 'Open in CP2+',
    openAlgo: 'Open in AlgoBB++',
    openILP1: 'Open in ILP1',
    openILP2: 'Open in ILP2',
    openSubset: 'Open in Subset DP',
    blocked: 'Unavailable for this safety tier.',
    scenarioId: 'Scenario ID',
  },
  ar: {
    title: 'مختبر عرض المخططات العشوائية',
    subtitle: 'أنشئ D وG بشكل مستقل باستخدام بذور ظاهرة، ثم قارن كل المحللات الدقيقة غير الدورية القابلة للتطبيق.',
    family: 'العائلة',
    er: 'Erdős–Rényi بلا دورات',
    sf: 'Scale-free-style بلا دورات',
    preset: 'إعداد حتمي',
    custom: 'معلمات مخصصة',
    generate: 'توليد',
    reset: 'إعادة تعيين',
    newRandom: 'سيناريو عشوائي جديد',
    sameSeed: 'تعيد seedOrder وseedD وseedG الظاهرة تشغيل السيناريو نفسه بدقة. يتم توليد D وG بشكل مستقل.',
    n: 'n',
    pD: 'pD',
    pG: 'pG',
    m: 'm',
    seedOrder: 'seedOrder',
    seedD: 'seedD',
    seedG: 'seedG',
    required: 'قيمة غير صالحة لـ',
    bounds: 'يجب أن يبقى n بين 1 و13 في مختبر المتصفح هذا.',
    probability: 'يجب أن تكون الاحتمالية ضمن [0, 1].',
    integer: 'يجب أن تكون القيمة عدداً صحيحاً.',
    nonNegative: 'يجب أن يكون m عدداً صحيحاً غير سالب.',
    graph: 'المخطط المولد',
    topological: 'الترتيب الطوبولوجي',
    stats: 'الرؤوس / أقواس D / حواف G',
    primary: 'نتائج المحللات الأساسية',
    allSolvers: 'كل المحللات الدقيقة القابلة للتطبيق',
    path: 'المسار القانوني',
    status: 'الحالة',
    proof: 'البرهان مكتمل',
    valid: 'المسار صالح',
    state: 'حالة التشغيل',
    metric: 'مقياس محلي',
    equality: 'المساواة الدقيقة',
    unavailable: 'تظهر فقط عندما تكتمل كل المحللات القابلة للمقارنة.',
    countersNote: 'Each solver reports work in its own search model. Candidate counts and explored states are not interchangeable.',
    ilp2Skip: 'لا يتم تشغيل ILP2 لهذا السيناريو لتجنب خطر ما قبل التعداد.',
    safetySkip: 'Not run — exceeds this solver’s educational safety limit.',
    cyclicSkip: 'Not applicable — cyclic-trail method.',
    limitation: 'مولد تعليمي حتمي فقط: لا MILP أصلي، لا إعادة إنتاج لورقة، ولا استنتاج تفوق زمني.',
    challenges: 'مخططات تحدي حتمية',
    challengePurpose: 'الغرض التعليمي',
    loadChallenge: 'تحميل مخطط التحدي',
    testMethods: 'اختبار في صفحات الطرق',
    openLegacy: 'فتح في Legacy',
    openCP1: 'فتح في CP1',
    openCP2: 'فتح في CP2',
    openCP2Plus: 'فتح في CP2+',
    openAlgo: 'فتح في AlgoBB++',
    openILP1: 'فتح في ILP1',
    openILP2: 'فتح في ILP2',
    openSubset: 'فتح في Subset DP',
    blocked: 'غير متاح لهذا مستوى الأمان.',
    scenarioId: 'معرف السيناريو',
  },
} satisfies Record<Language, Record<string, string>>;

const presets = CP2_RANDOM_BENCHMARK_CORPUS;

function presetLabel(spec: CP2RandomBenchmarkCaseSpec): string {
  const params = Object.entries(spec.params).map(([k, v]) => `${k}=${v}`).join(', ');
  return `${spec.caseId} (${spec.tier}) ${params}`;
}

function formFromPreset(spec: CP2RandomBenchmarkCaseSpec, previous?: FormState): FormState {
  return {
    n: String(spec.params.n),
    pD: 'pD' in spec.params ? String(spec.params.pD) : previous?.pD ?? '0.45',
    pG: 'pG' in spec.params ? String(spec.params.pG) : previous?.pG ?? '0.45',
    m: 'm' in spec.params ? String(spec.params.m) : previous?.m ?? '1',
    seedOrder: String(spec.params.seed),
    seedD: String(spec.params.seed + 1),
    seedG: String(spec.params.seed + 2),
  };
}

function makePositions(vertices: string[], order: string[]): Record<string, { x: number; y: number }> {
  const sorted = order.length === vertices.length ? order : vertices;
  return Object.fromEntries(sorted.map((v, i) => [v, { x: 80 + i * 95, y: 100 + (i % 2) * 95 }]));
}

function pathText(path: string[] | null | undefined): string {
  return path && path.length > 0 ? path.join(' -> ') : '-';
}

function proofState(r: { proofCompleteEmitted: boolean; interruptedByCap: boolean; cancelled: boolean }): SolverState {
  if (r.cancelled) return 'incomplete-cancelled';
  if (r.interruptedByCap || !r.proofCompleteEmitted) return 'incomplete-capped';
  return 'complete-comparable';
}

function basicState(status: string): SolverState {
  return status === 'optimal' || status === 'no-solution' ? 'complete-comparable' : 'incomplete-capped';
}

function validText(path: string[] | null | undefined, graph: GeneratedGraph): string {
  return path && path.length > 0 ? String(isInducedGConnected(path, graph.edgesG)) : '-';
}

function metric(label: string, value: number): string {
  return `${label}: ${value}`;
}

function canRunILP2(graph: GeneratedGraph, selectedPreset: CP2RandomBenchmarkCaseSpec | null): boolean {
  if (selectedPreset?.tier === 'L') return false;
  return graph.vertices.length <= CUSTOM_ILP2_MAX_N;
}

function makeSkippedRow(name: string, state: SolverState, status: string): SolverRow {
  return { name, state, status, path: '-', valid: '-', proof: 'false', metric: '-' };
}

function solveGraph(graph: GeneratedGraph, selectedPreset: CP2RandomBenchmarkCaseSpec | null, t: typeof labels.en): SolverBundle {
  const n = graph.vertices.length;
  const small = n <= SMALL_MAX_N;
  const stress = n > CUSTOM_ILP2_MAX_N;
  const legacy = small ? solveConsistentPath(graph.vertices, graph.edgesD, graph.edgesG) : null;
  const cp1 = small ? solveCP1(graph.vertices, graph.edgesD, graph.edgesG, MAX_EVENTS) : null;
  const cp2 = solveCP2(graph.vertices, graph.edgesD, graph.edgesG, { maxEvents: MAX_EVENTS });
  const cp2Plus = solveCP2Plus(graph.vertices, graph.edgesD, graph.edgesG, { maxEvents: MAX_EVENTS });
  const algo = small ? solveAlgoBBPlusPlus(graph.vertices, graph.edgesD, graph.edgesG, { maxEvents: MAX_EVENTS }) : null;
  const ilp1 = small ? solveILP1(graph.vertices, graph.edgesD, graph.edgesG, { maxEvents: MAX_EVENTS }) : null;
  const ilp2Safe = canRunILP2(graph, selectedPreset);
  const ilp2 = ilp2Safe ? solveILP2(graph.vertices, graph.edgesD, graph.edgesG, { maxEvents: MAX_EVENTS }) : null;
  const subset = small ? solveSubsetDP(graph.vertices, graph.edgesD, graph.edgesG, { maxEvents: MAX_EVENTS, maxVertices: SMALL_MAX_N }) : null;
  const rows: SolverRow[] = [];

  rows.push(legacy ? {
    name: 'Legacy',
    state: legacy.error ? 'incomplete-capped' : 'complete-comparable',
    status: legacy.error ? 'error' : 'optimal',
    path: pathText(legacy.longestConsistentPath),
    valid: validText(legacy.longestConsistentPath, graph),
    proof: String(!legacy.error),
    metric: metric('evaluated paths', legacy.evaluatedPathsCount),
    comparablePath: legacy.longestConsistentPath,
  } : makeSkippedRow('Legacy', 'not-run-educational-safety-limit', t.safetySkip));
  rows.push(cp1 ? {
    name: 'CP1',
    state: basicState(cp1.status),
    status: cp1.status,
    path: pathText(cp1.bestPath),
    valid: validText(cp1.bestPath, graph),
    proof: String(cp1.status === 'optimal' || cp1.status === 'no-solution'),
    metric: metric('trace events', cp1.stepCount),
    comparablePath: cp1.bestPath,
  } : makeSkippedRow('CP1', 'not-run-educational-safety-limit', t.safetySkip));
  rows.push({
    name: 'CP2',
    state: proofState(cp2),
    status: cp2.status,
    path: pathText(cp2.bestPath),
    valid: validText(cp2.bestPath, graph),
    proof: String(cp2.proofCompleteEmitted),
    metric: `${metric('explored states', cp2.exploredStates)}; ${metric('pruned states', cp2.prunedStates)}`,
    comparablePath: cp2.bestPath,
  });
  rows.push({
    name: 'CP2+',
    state: proofState(cp2Plus),
    status: cp2Plus.status,
    path: pathText(cp2Plus.bestPath),
    valid: validText(cp2Plus.bestPath, graph),
    proof: String(cp2Plus.proofCompleteEmitted),
    metric: `${metric('explored states', cp2Plus.counters.statesExplored)}; ${metric('G checks', cp2Plus.counters.genomicPropagationChecks)}`,
    comparablePath: cp2Plus.bestPath,
  });
  rows.push(algo ? {
    name: 'AlgoBB++',
    state: algo.cancelled ? 'incomplete-cancelled' : algo.eventCapReached ? 'incomplete-capped' : basicState(algo.status),
    status: algo.status,
    path: pathText(algo.bestPath),
    valid: validText(algo.bestPath, graph),
    proof: String(!algo.cancelled && !algo.eventCapReached && (algo.status === 'optimal' || algo.status === 'no-solution')),
    metric: `${metric('explored states', algo.exploredStates)}; ${metric('pruned states', algo.prunedStates)}`,
    comparablePath: algo.bestPath,
  } : makeSkippedRow('AlgoBB++', 'not-run-educational-safety-limit', t.safetySkip));
  rows.push(ilp1 ? {
    name: 'ILP1',
    state: proofState(ilp1),
    status: ilp1.status,
    path: pathText(ilp1.bestPath),
    valid: validText(ilp1.bestPath, graph),
    proof: String(ilp1.proofCompleteEmitted),
    metric: `${metric('enumerated candidates', ilp1.exploredCandidates)}; ${metric('rejected candidates', ilp1.rejectedCandidates)}`,
    comparablePath: ilp1.bestPath,
  } : makeSkippedRow('ILP1', 'not-run-educational-safety-limit', t.safetySkip));
  rows.push(ilp2 ? {
    name: 'ILP2',
    state: proofState(ilp2),
    status: ilp2.status,
    path: pathText(ilp2.bestPath),
    valid: validText(ilp2.bestPath, graph),
    proof: String(ilp2.proofCompleteEmitted),
    metric: `${metric('enumerated candidates', ilp2.counters.enumeratedCandidates)}; ${metric('accepted candidates', ilp2.counters.acceptedFeasibleCandidates)}`,
    comparablePath: ilp2.bestPath,
  } : makeSkippedRow('ILP2', stress ? 'not-run-preenumeration-risk' : 'not-run-educational-safety-limit', stress ? 'not-run-preenumeration-risk' : t.safetySkip));
  rows.push(subset ? {
    name: 'Subset DP',
    state: proofState(subset),
    status: subset.status,
    path: pathText(subset.bestPath),
    valid: validText(subset.bestPath, graph),
    proof: String(subset.proofCompleteEmitted),
    metric: `${metric('DP states', subset.counters.statesCreated)}; ${metric('transitions', subset.counters.transitionsEvaluated)}`,
    comparablePath: subset.bestPath,
  } : makeSkippedRow('Subset DP', 'not-run-educational-safety-limit', t.safetySkip));
  rows.push(makeSkippedRow('CP3', 'not-applicable-cyclic-trail-method', t.cyclicSkip));
  rows.push(makeSkippedRow('CP4', 'not-applicable-cyclic-trail-method', t.cyclicSkip));
  return { cp2, cp2Plus, ilp2, rows };
}

function randomInt(maxExclusive: number): number {
  const cryptoApi = globalThis.crypto;
  if (cryptoApi?.getRandomValues) {
    const value = new Uint32Array(1);
    cryptoApi.getRandomValues(value);
    return value[0] % maxExclusive;
  }
  return Math.floor(Math.random() * maxExclusive);
}

function makeGraph(family: Family, form: FormState): GeneratedGraph {
  const n = Number(form.n);
  const seedOrder = Number(form.seedOrder);
  const seedD = Number(form.seedD);
  const seedG = Number(form.seedG);
  return family === 'acyclic-erdos-renyi'
    ? generateIndependentAcyclicErdosRenyiGraph({ n, pD: Number(form.pD), pG: Number(form.pG), seedOrder, seedD, seedG })
    : generateIndependentAcyclicScaleFreeGraph({ n, m: Number(form.m), seedOrder, seedD, seedG });
}

function challengeAsGraph(challenge: ChallengeGraph): ChallengeGeneratedGraph {
  return {
    family: 'challenge-graph',
    vertices: challenge.vertices,
    topologicalOrder: challenge.vertices,
    edgesD: challenge.edgesD,
    edgesG: challenge.edgesG,
    statistics: {
      vertexCount: challenge.vertices.length,
      directedEdgeCount: challenge.edgesD.length,
      genomicEdgeCount: challenge.edgesG.length,
    },
    seeds: { seedOrder: 0, seedD: 0, seedG: 0 },
    parameters: { challengeGraphId: challenge.id, variant: challenge.variant },
    challengeGraphId: challenge.id,
  };
}

function graphToScenario(graph: GeneratedGraph): MethodScenarioHandoff {
  const scenarioId = makeScenarioId(graph.family === 'challenge-graph' ? 'challenge-graph' : 'random-graph-lab');
  if (graph.family === 'challenge-graph') {
    const challenge = CHALLENGE_GRAPHS.find((candidate) => candidate.id === graph.challengeGraphId);
    return challenge ? challengeToScenario(challenge, scenarioId) : {
      scenarioId,
      source: 'challenge-graph',
      vertices: graph.vertices,
      edgesD: graph.edgesD,
      edgesG: graph.edgesG,
      maxEvents: MAX_EVENTS,
      family: graph.family,
      parameters: graph.parameters,
      seedOrder: 0,
      seedD: 0,
      seedG: 0,
      challengeGraphId: graph.challengeGraphId,
    };
  }
  return {
    scenarioId,
    source: 'random-graph-lab',
    vertices: graph.vertices,
    edgesD: graph.edgesD,
    edgesG: graph.edgesG,
    maxEvents: MAX_EVENTS,
    family: graph.family,
    parameters: { ...graph.parameters },
    seedOrder: graph.seeds?.seedOrder ?? 0,
    seedD: graph.seeds?.seedD ?? 0,
    seedG: graph.seeds?.seedG ?? 0,
  };
}

function openRoute(route: string, graph: GeneratedGraph) {
  const link = createScenarioHandoffLink(route, graphToScenario(graph));
  window.history.pushState({}, '', link.url);
  window.dispatchEvent(new Event('popstate'));
  window.scrollTo(0, 0);
}

function methodActions(graph: GeneratedGraph, selectedPreset: CP2RandomBenchmarkCaseSpec | null, t: typeof labels.en) {
  const n = graph.vertices.length;
  const small = n <= SMALL_MAX_N;
  const stress = n > CUSTOM_ILP2_MAX_N;
  const ilp2Allowed = canRunILP2(graph, selectedPreset);
  return [
    { label: t.openLegacy, route: '/legacy', allowed: small, reason: t.safetySkip },
    { label: t.openCP1, route: '/methods/cp1', allowed: small, reason: t.safetySkip },
    { label: t.openCP2, route: '/methods/cp2', allowed: true, reason: '' },
    { label: t.openCP2Plus, route: '/methods/cp2-plus', allowed: true, reason: '' },
    { label: t.openAlgo, route: '/methods/algobb-plus-plus', allowed: small, reason: t.safetySkip },
    { label: t.openILP1, route: '/methods/ilp1', allowed: small, reason: t.safetySkip },
    { label: t.openILP2, route: '/methods/ilp2', allowed: ilp2Allowed, reason: stress ? 'not-run-preenumeration-risk' : t.safetySkip },
    { label: t.openSubset, route: '/methods/subset-dp', allowed: small, reason: t.safetySkip },
  ];
}

function SolverCard({ row, t, testId }: { row: SolverRow; t: typeof labels.en; testId?: string }) {
  return (
    <article className="card random-lab-solver-card" data-testid={testId}>
      <h4 style={{ color: 'var(--primary)', marginBlockEnd: 'var(--space-sm)' }}>{row.name}</h4>
      <dl>
        <dt>{t.state}</dt><dd dir="ltr">{row.state}</dd>
        <dt>{t.status}</dt><dd dir="ltr">{row.status}</dd>
        <dt>{t.path}</dt><dd dir="ltr">{row.path}</dd>
        <dt>{t.valid}</dt><dd dir="ltr">{row.valid}</dd>
        <dt>{t.proof}</dt><dd dir="ltr">{row.proof}</dd>
        <dt>{t.metric}</dt><dd dir="ltr">{row.metric}</dd>
      </dl>
    </article>
  );
}

export const RandomGraphDemoLab: React.FC<RandomGraphDemoLabProps> = ({ lang, dict }) => {
  const t = labels[lang];
  const isAr = lang === 'ar';
  const firstPreset = presets[0];
  const [family, setFamily] = useState<Family>('acyclic-erdos-renyi');
  const [presetId, setPresetId] = useState(firstPreset.caseId);
  const [form, setForm] = useState<FormState>(formFromPreset(firstPreset));
  const [error, setError] = useState('');
  const [viewTab, setViewTab] = useState<'D' | 'G'>('D');
  const [graph, setGraph] = useState<GeneratedGraph>(() => makeGraph('acyclic-erdos-renyi', formFromPreset(firstPreset)));
  const [runPreset, setRunPreset] = useState<CP2RandomBenchmarkCaseSpec | null>(firstPreset);
  const [selectedChallengeId, setSelectedChallengeId] = useState(CHALLENGE_GRAPHS[0].id);
  const familyPresets = presets.filter((p) => p.graphFamily === family);
  const results = useMemo(() => solveGraph(graph, runPreset, t), [graph, runPreset, t]);
  const bestPath = results.cp2.bestPath ?? results.cp2Plus.bestPath ?? results.ilp2?.bestPath ?? [];
  const positions = useMemo(() => makePositions(graph.vertices, graph.topologicalOrder), [graph]);
  const comparableRows = results.rows.filter((row) => row.state === 'complete-comparable' && row.name !== 'CP3' && row.name !== 'CP4');
  const showEquality = comparableRows.length > 0 && results.rows.every((row) => (
    row.state === 'complete-comparable' || row.state === 'not-applicable-cyclic-trail-method'
  ));
  const equality = showEquality && comparableRows.every((row) => pathText(row.comparablePath) === pathText(comparableRows[0].comparablePath));
  const selectedChallenge = CHALLENGE_GRAPHS.find((challenge) => challenge.id === selectedChallengeId) ?? CHALLENGE_GRAPHS[0];
  const actions = methodActions(graph, runPreset, t);

  const fillPreset = (spec: CP2RandomBenchmarkCaseSpec) => {
    setFamily(spec.graphFamily);
    setPresetId(spec.caseId);
    setForm(formFromPreset(spec, form));
    setError('');
  };

  const changeFamily = (nextFamily: Family) => {
    const nextPreset = presets.find((p) => p.graphFamily === nextFamily)!;
    setFamily(nextFamily);
    setPresetId(nextPreset.caseId);
    setForm(formFromPreset(nextPreset, form));
    setError('');
  };

  const patchForm = (patch: Partial<FormState>) => {
    setForm({ ...form, ...patch });
    setPresetId(CUSTOM_ID);
  };

  const validate = (): GeneratedGraph | null => {
    const n = Number(form.n);
    for (const [key, label] of [['seedOrder', t.seedOrder], ['seedD', t.seedD], ['seedG', t.seedG]] as const) {
      if (!Number.isInteger(Number(form[key]))) return setError(`${t.required} ${label}. ${t.integer}`), null;
    }
    if (!Number.isInteger(n) || n < 1 || n > CUSTOM_MAX_N) return setError(`${t.required} ${t.n}. ${t.bounds}`), null;
    try {
      if (family === 'acyclic-erdos-renyi') {
        const pD = Number(form.pD);
        const pG = Number(form.pG);
        if (!Number.isFinite(pD) || pD < 0 || pD > 1) return setError(`${t.required} ${t.pD}. ${t.probability}`), null;
        if (!Number.isFinite(pG) || pG < 0 || pG > 1) return setError(`${t.required} ${t.pG}. ${t.probability}`), null;
      } else {
        const m = Number(form.m);
        if (!Number.isInteger(m) || m < 0) return setError(`${t.required} ${t.m}. ${t.nonNegative}`), null;
      }
      return makeGraph(family, form);
    } catch (e) {
      return setError(e instanceof Error ? e.message : String(e)), null;
    }
  };

  const generate = () => {
    const next = validate();
    if (!next) return;
    setGraph(next);
    setRunPreset(presetId === CUSTOM_ID ? null : presets.find((p) => p.caseId === presetId) ?? null);
    setError('');
    const query = new URLSearchParams({ family, n: form.n, seedOrder: form.seedOrder, seedD: form.seedD, seedG: form.seedG });
    if (family === 'acyclic-erdos-renyi') {
      query.set('pD', form.pD);
      query.set('pG', form.pG);
    } else {
      query.set('m', form.m);
    }
    window.history.replaceState({}, '', `${window.location.pathname}?${query.toString()}`);
  };

  const loadChallenge = () => {
    setGraph(challengeAsGraph(selectedChallenge));
    setRunPreset(null);
    setPresetId(CUSTOM_ID);
    setError('');
  };

  const reset = () => {
    fillPreset(firstPreset);
    const nextForm = formFromPreset(firstPreset, form);
    setGraph(makeGraph(firstPreset.graphFamily, nextForm));
    setRunPreset(firstPreset);
  };

  const newRandomScenario = () => {
    const nextFamily: Family = randomInt(2) === 0 ? 'acyclic-erdos-renyi' : 'acyclic-scale-free';
    const n = 4 + randomInt(10);
    const nextForm: FormState = {
      n: String(n),
      pD: (0.25 + randomInt(51) / 100).toFixed(2),
      pG: (0.20 + randomInt(56) / 100).toFixed(2),
      m: String(1 + randomInt(Math.min(3, Math.max(1, n - 1)))),
      seedOrder: String(randomInt(1_000_000)),
      seedD: String(randomInt(1_000_000)),
      seedG: String(randomInt(1_000_000)),
    };
    setFamily(nextFamily);
    setPresetId(CUSTOM_ID);
    setForm(nextForm);
    setGraph(makeGraph(nextFamily, nextForm));
    setRunPreset(null);
    setError('');
  };

  return (
    <div data-testid="random-graph-demo-lab" style={{ direction: isAr ? 'rtl' : 'ltr', textAlign: isAr ? 'right' : 'left', minWidth: 0 }}>
      <header style={{ marginBlockEnd: 'var(--space-md)' }}>
        <h2 style={{ color: 'var(--primary)' }}>{t.title}</h2>
        <p style={{ fontWeight: 700 }}>{t.subtitle}</p>
        <p style={{ padding: 'var(--space-sm)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)' }}>{t.sameSeed}</p>
      </header>

      <MethodCockpit
        controls={(
          <section className="card" aria-labelledby="random-graph-controls-title" style={{ marginBlockEnd: 'var(--space-sm)' }}>
            <h3 id="random-graph-controls-title"><span className="icon-label"><Icon name="network" /> {t.custom}</span></h3>
            <div className="random-lab-controls">
              <label>{t.family}
                <select value={family} onChange={(e) => changeFamily(e.target.value as Family)}>
                  <option value="acyclic-erdos-renyi">{t.er}</option>
                  <option value="acyclic-scale-free">{t.sf}</option>
                </select>
              </label>
              <label>{t.preset}
                <select value={presetId} onChange={(e) => {
                  if (e.target.value === CUSTOM_ID) return setPresetId(CUSTOM_ID);
                  const spec = presets.find((p) => p.caseId === e.target.value);
                  if (spec) fillPreset(spec);
                }}>
                  <option value={CUSTOM_ID}>{t.custom}</option>
                  {familyPresets.map((p) => <option key={p.caseId} value={p.caseId}>{presetLabel(p)}</option>)}
                </select>
              </label>
              <label>{t.n}<input aria-invalid={!!error && error.includes(t.n)} value={form.n} onChange={(e) => patchForm({ n: e.target.value })} inputMode="numeric" /></label>
              {family === 'acyclic-erdos-renyi' ? (
                <>
                  <label>{t.pD}<input aria-invalid={!!error && error.includes(t.pD)} value={form.pD} onChange={(e) => patchForm({ pD: e.target.value })} inputMode="decimal" /></label>
                  <label>{t.pG}<input aria-invalid={!!error && error.includes(t.pG)} value={form.pG} onChange={(e) => patchForm({ pG: e.target.value })} inputMode="decimal" /></label>
                </>
              ) : (
                <label>{t.m}<input aria-invalid={!!error && error.includes(t.m)} value={form.m} onChange={(e) => patchForm({ m: e.target.value })} inputMode="numeric" /></label>
              )}
              <label>{t.seedOrder}<input dir="ltr" aria-invalid={!!error && error.includes(t.seedOrder)} value={form.seedOrder} onChange={(e) => patchForm({ seedOrder: e.target.value })} inputMode="numeric" /></label>
              <label>{t.seedD}<input dir="ltr" aria-invalid={!!error && error.includes(t.seedD)} value={form.seedD} onChange={(e) => patchForm({ seedD: e.target.value })} inputMode="numeric" /></label>
              <label>{t.seedG}<input dir="ltr" aria-invalid={!!error && error.includes(t.seedG)} value={form.seedG} onChange={(e) => patchForm({ seedG: e.target.value })} inputMode="numeric" /></label>
              <button type="button" className="btn btn-primary" onClick={generate} style={{ width: 'auto' }}>{t.generate}</button>
              <button type="button" className="btn btn-secondary" onClick={reset} style={{ width: 'auto' }}>{t.reset}</button>
              <button type="button" className="btn btn-secondary" onClick={newRandomScenario} style={{ width: 'auto' }}>{t.newRandom}</button>
            </div>
            {error && <p role="alert" style={{ color: 'var(--danger)', fontWeight: 800, marginBlockEnd: 0 }}>{error}</p>}
            <div style={{ marginBlockStart: 'var(--space-md)', borderBlockStart: '1px solid var(--border-color)', paddingBlockStart: 'var(--space-sm)' }}>
              <h4 style={{ color: 'var(--primary)' }}>{t.challenges}</h4>
              <div className="random-lab-controls">
                <label>{t.challenges}
                  <select value={selectedChallengeId} onChange={(e) => setSelectedChallengeId(e.target.value)}>
                    {CHALLENGE_GRAPHS.map((challenge) => (
                      <option key={challenge.id} value={challenge.id}>{challenge.title[lang]}</option>
                    ))}
                  </select>
                </label>
                <p style={{ margin: 0, alignSelf: 'end' }}><strong>{t.challengePurpose}:</strong> {selectedChallenge.purpose[lang]}</p>
                <button type="button" className="btn btn-secondary" onClick={loadChallenge} style={{ width: 'auto' }}>{t.loadChallenge}</button>
              </div>
            </div>
          </section>
        )}
        graph={(
          <div dir="ltr" data-testid="random-graph-workspace">
            <div className="random-lab-mobile-tabs" style={{ display: 'none', marginBlockEnd: 'var(--space-sm)' }}>
              <div className="lang-selector-group" style={{ width: '100%' }}>
                <button className={`lang-btn ${viewTab === 'D' ? 'active' : ''}`} style={{ flex: 1 }} onClick={() => setViewTab('D')}>D</button>
                <button className={`lang-btn ${viewTab === 'G' ? 'active' : ''}`} style={{ flex: 1 }} onClick={() => setViewTab('G')}>G</button>
              </div>
            </div>
            <GraphPanel
              vertices={graph.vertices}
              edgesD={graph.edgesD}
              edgesG={graph.edgesG}
              nodePositions={positions}
              highlightedNodes={new Set(bestPath)}
              activePath={bestPath}
              isFinalResult={showEquality}
              isAcceptedStep
              lang={lang}
              dict={dict}
              mobileActiveTab={viewTab}
            />
          </div>
        )}
        state={(
          <section className="card">
            <h3><span className="icon-label"><Icon name="clipboard" /> {t.graph}</span></h3>
            <dl className="random-lab-dl">
              <dt>{t.family}</dt><dd dir="ltr">{graph.family}</dd>
              <dt>{t.stats}</dt><dd dir="ltr">{`${graph.statistics.vertexCount} / ${graph.statistics.directedEdgeCount} / ${graph.statistics.genomicEdgeCount}`}</dd>
              <dt>{t.seedOrder}</dt><dd dir="ltr">{graph.seeds?.seedOrder}</dd>
              <dt>{t.seedD}</dt><dd dir="ltr">{graph.seeds?.seedD}</dd>
              <dt>{t.seedG}</dt><dd dir="ltr">{graph.seeds?.seedG}</dd>
              <dt>{t.topological}</dt><dd dir="ltr">{graph.topologicalOrder.join(' -> ')}</dd>
            </dl>
            <p style={{ marginBlockEnd: 0, fontWeight: 800 }}>{t.limitation}</p>
          </section>
        )}
        constraints={(
          <section className="card">
            <h3><span className="icon-label"><Icon name="shield" /> {t.primary}</span></h3>
            <div className="random-lab-results">
              {results.rows.filter((row) => ['CP2', 'CP2+', 'ILP2'].includes(row.name)).map((row) => <SolverCard key={row.name} row={row} t={t} />)}
            </div>
            {results.rows.find((row) => row.name === 'ILP2')?.state === 'not-run-preenumeration-risk' && <p data-testid="ilp2-not-run-note" style={{ color: 'var(--danger)', fontWeight: 800 }}>{t.ilp2Skip}</p>}
            <p style={{ marginBlockEnd: 0, fontWeight: 700 }}>{t.countersNote}</p>
          </section>
        )}
        trace={(
          <section className="card" data-testid="random-graph-all-solvers">
            <h3><span className="icon-label"><Icon name="ledger" /> {t.allSolvers}</span></h3>
            <div className="random-lab-results all-solvers">
              {results.rows.map((row) => <SolverCard key={row.name} row={row} t={t} testId={`solver-row-${row.name}`} />)}
            </div>
            <section data-testid="random-graph-equality" style={{ marginBlockStart: 'var(--space-sm)' }}>
              <h4 style={{ color: 'var(--primary)' }}>{t.equality}</h4>
              {showEquality ? <p dir="ltr">complete-comparable: {String(equality)}</p> : <p>{t.unavailable}</p>}
            </section>
          </section>
        )}
      />

      <section className="card" data-testid="random-graph-method-handoff" style={{ marginBlockStart: 'var(--space-md)' }}>
        <h3><span className="icon-label"><Icon name="route" /> {t.testMethods}</span></h3>
        <div className="random-lab-method-actions">
          {actions.map((action) => (
            <div key={action.route} className="random-lab-method-action">
              <button
                type="button"
                className="btn btn-secondary"
                disabled={!action.allowed}
                onClick={() => openRoute(action.route, graph)}
                style={{ width: '100%' }}
              >
                {action.label}
              </button>
              {!action.allowed && <small dir="ltr">{action.reason}</small>}
            </div>
          ))}
        </div>
        <p style={{ marginBlockEnd: 0 }} dir="ltr">CP3 / CP4: {t.cyclicSkip}</p>
      </section>

      <style>{`
        .random-lab-controls {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: var(--space-sm);
          align-items: end;
        }
        .random-lab-controls label {
          display: grid;
          gap: 4px;
          font-weight: 800;
          min-width: 0;
        }
        .random-lab-controls input,
        .random-lab-controls select {
          min-width: 0;
          width: 100%;
          padding: 8px;
          border: 1px solid var(--border-color);
          border-radius: var(--radius-sm);
          font: inherit;
        }
        .random-lab-controls [aria-invalid="true"] {
          border-color: var(--danger);
        }
        .random-lab-results {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: var(--space-sm);
        }
        .random-lab-results.all-solvers {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
        .random-lab-dl,
        .random-lab-solver-card dl {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(0, 1.4fr);
          gap: var(--space-xs) var(--space-sm);
        }
        .random-lab-dl dd,
        .random-lab-solver-card dd {
          margin: 0;
          unicode-bidi: isolate;
          overflow-wrap: anywhere;
        }
        .random-lab-method-actions {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: var(--space-sm);
        }
        .random-lab-method-action {
          display: grid;
          gap: 4px;
          min-width: 0;
        }
        .random-lab-method-action small {
          color: var(--danger);
          font-weight: 800;
          overflow-wrap: anywhere;
        }
        @media (max-width: 900px) {
          .random-lab-controls,
          .random-lab-results,
          .random-lab-results.all-solvers,
          .random-lab-method-actions,
          .random-lab-dl,
          .random-lab-solver-card dl {
            grid-template-columns: 1fr;
          }
        }
        @media (max-width: 767px) {
          .random-lab-mobile-tabs { display: flex !important; }
        }
      `}</style>
    </div>
  );
};
