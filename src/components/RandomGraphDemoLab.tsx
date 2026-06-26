import React, { useMemo, useState } from 'react';
import { solveCP2, type CP2SolverResult } from '../domain/cp2Solver';
import { solveCP2Plus, type CP2PlusSolverResult } from '../domain/cp2PlusSolver';
import { solveILP2, type ILP2SolverResult } from '../domain/ilp2Solver';
import {
  CP2_RANDOM_BENCHMARK_CORPUS,
  type CP2RandomBenchmarkCaseSpec,
} from '../domain/cp2RandomBenchmark';
import {
  generateAcyclicErdosRenyiGraph,
  generateAcyclicScaleFreeGraph,
  type AcyclicErdosRenyiGraph,
  type AcyclicScaleFreeGraph,
} from '../domain/randomGraphGenerators';
import { isInducedGConnected } from '../domain/pathAlgorithms';
import type { Language, TranslationDict } from '../i18n/types';
import { GraphPanel } from './GraphPanel';
import { Icon } from './Icons';
import { MethodCockpit } from './MethodCockpit';

type Family = 'acyclic-erdos-renyi' | 'acyclic-scale-free';
type GeneratedGraph = AcyclicErdosRenyiGraph | AcyclicScaleFreeGraph;
type SolverBundle = { cp2: CP2SolverResult; cp2Plus: CP2PlusSolverResult; ilp2: ILP2SolverResult | null; ilp2NotRun: boolean };

interface RandomGraphDemoLabProps {
  lang: Language;
  dict: TranslationDict;
}

const MAX_EVENTS = 200000;
const CUSTOM_ILP2_MAX_N = 10;
const CUSTOM_MAX_N = 13;

const labels = {
  fr: {
    title: 'Laboratoire de démonstration de graphes aléatoires',
    subtitle: 'Générez des graphes acycliques déterministes, inspectez D et G, puis comparez CP2, CP2+ et ILP2 quand ILP2 est sûr.',
    family: 'Famille',
    er: 'Erdős–Rényi acyclique',
    sf: 'Scale-free-style acyclique',
    preset: 'Préréglage déterministe',
    custom: 'Paramètres personnalisés',
    generate: 'Générer',
    reset: 'Réinitialiser',
    sameSeed: 'Les mêmes paramètres avec la même graine produisent le même graphe.',
    n: 'n',
    pD: 'pD',
    pG: 'pG',
    m: 'm',
    seed: 'graine',
    required: 'Valeur invalide pour',
    bounds: 'n doit rester entre 1 et 13 pour ce laboratoire navigateur.',
    probability: 'La probabilité doit être dans [0, 1].',
    integer: 'La valeur doit être un entier.',
    nonNegative: 'm doit être un entier positif ou nul.',
    graph: 'Graphe généré',
    topological: 'Ordre topologique',
    stats: 'Sommets / arcs D / arêtes G',
    run: 'Résultats des solveurs',
    path: 'Chemin canonique',
    status: 'Statut',
    proof: 'Preuve complète',
    valid: 'Chemin valide',
    complete: 'completed',
    capped: 'capped',
    cancelled: 'cancelled',
    notRun: 'not-run-preenumeration-risk',
    states: 'États explorés',
    prunes: 'Élagages',
    checks: 'Vérifications G',
    candidates: 'Candidats énumérés',
    rejects: 'Rejets',
    equality: 'Égalité exacte',
    unavailable: 'Non disponible tant que tous les solveurs pertinents ne terminent pas.',
    objective: 'Objectif',
    winner: 'Gagnant',
    validity: 'Validité',
    proofEquality: 'Preuve',
    countersNote: 'Les compteurs CP2/CP2+ comptent des états de recherche; ILP2 compte des candidats énumérés. Ils ne sont pas directement interchangeables.',
    ilp2Skip: 'ILP2 n’est pas lancé pour ce scénario afin d’éviter le risque de pré-énumération.',
    limitation: 'Générateur éducatif déterministe seulement: pas de MILP natif, pas de reproduction papier, pas de conclusion de supériorité en temps.',
  },
  en: {
    title: 'Random-Graph Demonstration Lab',
    subtitle: 'Generate deterministic acyclic graphs, inspect D and G, then compare CP2, CP2+, and ILP2 when ILP2 is safe.',
    family: 'Family',
    er: 'Acyclic Erdős–Rényi',
    sf: 'Acyclic scale-free-style',
    preset: 'Deterministic preset',
    custom: 'Custom parameters',
    generate: 'Generate',
    reset: 'Reset',
    sameSeed: 'The same parameters with the same seed produce the same graph.',
    n: 'n',
    pD: 'pD',
    pG: 'pG',
    m: 'm',
    seed: 'seed',
    required: 'Invalid value for',
    bounds: 'n must stay between 1 and 13 for this browser lab.',
    probability: 'Probability must be in [0, 1].',
    integer: 'Value must be an integer.',
    nonNegative: 'm must be a non-negative integer.',
    graph: 'Generated graph',
    topological: 'Topological order',
    stats: 'Vertices / D arcs / G edges',
    run: 'Solver results',
    path: 'Canonical path',
    status: 'Status',
    proof: 'Proof complete',
    valid: 'Path valid',
    complete: 'completed',
    capped: 'capped',
    cancelled: 'cancelled',
    notRun: 'not-run-preenumeration-risk',
    states: 'States explored',
    prunes: 'Prunes',
    checks: 'G checks',
    candidates: 'Enumerated candidates',
    rejects: 'Rejects',
    equality: 'Exact equality',
    unavailable: 'Unavailable until all relevant solvers complete.',
    objective: 'Objective',
    winner: 'Winner',
    validity: 'Validity',
    proofEquality: 'Proof',
    countersNote: 'CP2/CP2+ counters count search states; ILP2 counts enumerated candidates. They are not directly interchangeable.',
    ilp2Skip: 'ILP2 is not run for this scenario to avoid pre-enumeration risk.',
    limitation: 'Deterministic educational generator only: no native MILP, no paper reproduction, no runtime-superiority conclusion.',
  },
  ar: {
    title: 'مختبر عرض المخططات العشوائية',
    subtitle: 'أنشئ مخططات حتمية بلا دورات، وافحص D وG، ثم قارن CP2 وCP2+ وILP2 عندما يكون ILP2 آمناً.',
    family: 'العائلة',
    er: 'Erdős–Rényi بلا دورات',
    sf: 'Scale-free-style بلا دورات',
    preset: 'إعداد حتمي',
    custom: 'معلمات مخصصة',
    generate: 'توليد',
    reset: 'إعادة تعيين',
    sameSeed: 'المعلمات نفسها مع البذرة نفسها تنتج المخطط نفسه.',
    n: 'n',
    pD: 'pD',
    pG: 'pG',
    m: 'm',
    seed: 'seed',
    required: 'قيمة غير صالحة لـ',
    bounds: 'يجب أن يبقى n بين 1 و13 في مختبر المتصفح هذا.',
    probability: 'يجب أن تكون الاحتمالية ضمن [0, 1].',
    integer: 'يجب أن تكون القيمة عدداً صحيحاً.',
    nonNegative: 'يجب أن يكون m عدداً صحيحاً غير سالب.',
    graph: 'المخطط المولد',
    topological: 'الترتيب الطوبولوجي',
    stats: 'الرؤوس / أقواس D / حواف G',
    run: 'نتائج المحللات',
    path: 'المسار القانوني',
    status: 'الحالة',
    proof: 'البرهان مكتمل',
    valid: 'المسار صالح',
    complete: 'completed',
    capped: 'capped',
    cancelled: 'cancelled',
    notRun: 'not-run-preenumeration-risk',
    states: 'الحالات المستكشفة',
    prunes: 'التقليمات',
    checks: 'فحوص G',
    candidates: 'المرشحون المعدودون',
    rejects: 'الرفض',
    equality: 'المساواة الدقيقة',
    unavailable: 'غير متاحة حتى تكتمل كل المحللات ذات الصلة.',
    objective: 'الهدف',
    winner: 'الفائز',
    validity: 'الصحة',
    proofEquality: 'البرهان',
    countersNote: 'عدادات CP2/CP2+ تعد حالات البحث؛ ILP2 يعد المرشحين. هذه المقاييس ليست قابلة للمبادلة مباشرة.',
    ilp2Skip: 'لا يتم تشغيل ILP2 لهذا السيناريو لتجنب خطر ما قبل التعداد.',
    limitation: 'مولد تعليمي حتمي فقط: لا MILP أصلي، لا إعادة إنتاج لورقة، ولا استنتاج تفوق زمني.',
  },
} satisfies Record<Language, Record<string, string>>;

const presets = CP2_RANDOM_BENCHMARK_CORPUS;

function presetLabel(spec: CP2RandomBenchmarkCaseSpec): string {
  const params = Object.entries(spec.params).map(([k, v]) => `${k}=${v}`).join(', ');
  return `${spec.caseId} (${spec.tier}) ${params}`;
}

function makePositions(vertices: string[], order: string[]): Record<string, { x: number; y: number }> {
  const sorted = order.length === vertices.length ? order : vertices;
  return Object.fromEntries(sorted.map((v, i) => [v, { x: 80 + i * 95, y: 100 + (i % 2) * 95 }]));
}

function statusLabel(r: { proofCompleteEmitted: boolean; interruptedByCap: boolean; cancelled: boolean }, t: typeof labels.en): string {
  if (r.cancelled) return t.cancelled;
  if (r.interruptedByCap || !r.proofCompleteEmitted) return t.capped;
  return t.complete;
}

function pathText(path: string[] | null | undefined): string {
  return path && path.length > 0 ? path.join(' -> ') : '-';
}

function samePath(a: string[] | null | undefined, b: string[] | null | undefined): boolean {
  return JSON.stringify(a ?? []) === JSON.stringify(b ?? []);
}

function canRunILP2(graph: GeneratedGraph, selectedPreset: CP2RandomBenchmarkCaseSpec | null): boolean {
  if (selectedPreset?.tier === 'L') return false;
  return graph.vertices.length <= CUSTOM_ILP2_MAX_N;
}

function solveGraph(graph: GeneratedGraph, selectedPreset: CP2RandomBenchmarkCaseSpec | null): SolverBundle {
  const cp2 = solveCP2(graph.vertices, graph.edgesD, graph.edgesG, { maxEvents: MAX_EVENTS });
  const cp2Plus = solveCP2Plus(graph.vertices, graph.edgesD, graph.edgesG, { maxEvents: MAX_EVENTS });
  const ilp2Safe = canRunILP2(graph, selectedPreset);
  return {
    cp2,
    cp2Plus,
    ilp2: ilp2Safe ? solveILP2(graph.vertices, graph.edgesD, graph.edgesG, { maxEvents: MAX_EVENTS }) : null,
    ilp2NotRun: !ilp2Safe,
  };
}

function SolverCard({
  name,
  rows,
}: {
  name: string;
  rows: [string, React.ReactNode][];
}) {
  return (
    <article className="card" style={{ margin: 0, minWidth: 0 }}>
      <h4 style={{ color: 'var(--primary)', marginBlockEnd: 'var(--space-sm)' }}>{name}</h4>
      <dl style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', gap: 'var(--space-xs) var(--space-sm)' }}>
        {rows.map(([k, v]) => (
          <React.Fragment key={k}>
            <dt>{k}</dt>
            <dd dir="ltr" style={{ margin: 0, unicodeBidi: 'isolate', overflowWrap: 'anywhere' }}>{v}</dd>
          </React.Fragment>
        ))}
      </dl>
    </article>
  );
}

export const RandomGraphDemoLab: React.FC<RandomGraphDemoLabProps> = ({ lang, dict }) => {
  const t = labels[lang];
  const isAr = lang === 'ar';
  const [family, setFamily] = useState<Family>('acyclic-erdos-renyi');
  const [presetId, setPresetId] = useState('er-tiny-1');
  const [form, setForm] = useState({ n: '4', pD: '0.45', pG: '0.45', m: '1', seed: '101' });
  const [error, setError] = useState('');
  const [viewTab, setViewTab] = useState<'D' | 'G'>('D');

  const selectedPreset = presets.find((p) => p.caseId === presetId) ?? presets[0];
  const activePreset = selectedPreset.graphFamily === family ? selectedPreset : null;

  const generated = useMemo(() => {
    return activePreset?.graphFamily === 'acyclic-scale-free'
      ? generateAcyclicScaleFreeGraph(activePreset.params)
      : activePreset?.graphFamily === 'acyclic-erdos-renyi'
        ? generateAcyclicErdosRenyiGraph(activePreset.params)
        : generateAcyclicErdosRenyiGraph({ n: 4, pD: 0.45, pG: 0.45, seed: 101 });
  }, [activePreset]);

  const [graph, setGraph] = useState<GeneratedGraph>(generated);
  const [runPreset, setRunPreset] = useState<CP2RandomBenchmarkCaseSpec | null>(activePreset);
  const results = useMemo(() => solveGraph(graph, runPreset), [graph, runPreset]);
  const bestPath = results.cp2.bestPath ?? results.cp2Plus.bestPath ?? results.ilp2?.bestPath ?? [];
  const positions = useMemo(() => makePositions(graph.vertices, graph.topologicalOrder), [graph]);
  const allComplete = results.cp2.proofCompleteEmitted && results.cp2Plus.proofCompleteEmitted && !!results.ilp2?.proofCompleteEmitted;
  const cp2Valid = isInducedGConnected(results.cp2.bestPath ?? [], graph.edgesG);
  const cp2PlusValid = isInducedGConnected(results.cp2Plus.bestPath ?? [], graph.edgesG);
  const ilp2Valid = results.ilp2 ? isInducedGConnected(results.ilp2.bestPath ?? [], graph.edgesG) : false;

  const fillPreset = (spec: CP2RandomBenchmarkCaseSpec) => {
    setFamily(spec.graphFamily);
    setPresetId(spec.caseId);
    setForm({
      n: String(spec.params.n),
      pD: 'pD' in spec.params ? String(spec.params.pD) : form.pD,
      pG: 'pG' in spec.params ? String(spec.params.pG) : form.pG,
      m: 'm' in spec.params ? String(spec.params.m) : form.m,
      seed: String(spec.params.seed),
    });
    setError('');
  };

  const validate = (): GeneratedGraph | null => {
    const n = Number(form.n);
    const seed = Number(form.seed);
    if (!Number.isInteger(n) || n < 1 || n > CUSTOM_MAX_N) return setError(`${t.required} ${t.n}. ${t.bounds}`), null;
    if (!Number.isInteger(seed)) return setError(`${t.required} ${t.seed}. ${t.integer}`), null;
    try {
      if (family === 'acyclic-erdos-renyi') {
        const pD = Number(form.pD);
        const pG = Number(form.pG);
        if (!Number.isFinite(pD) || pD < 0 || pD > 1) return setError(`${t.required} ${t.pD}. ${t.probability}`), null;
        if (!Number.isFinite(pG) || pG < 0 || pG > 1) return setError(`${t.required} ${t.pG}. ${t.probability}`), null;
        return generateAcyclicErdosRenyiGraph({ n, pD, pG, seed });
      }
      const m = Number(form.m);
      if (!Number.isInteger(m) || m < 0) return setError(`${t.required} ${t.m}. ${t.nonNegative}`), null;
      return generateAcyclicScaleFreeGraph({ n, m, seed });
    } catch (e) {
      return setError(e instanceof Error ? e.message : String(e)), null;
    }
  };

  const generate = () => {
    const next = validate();
    if (!next) return;
    setGraph(next);
    const matchingPreset = presets.find((p) => p.graphFamily === family && JSON.stringify(p.params) === JSON.stringify(next.parameters)) ?? null;
    setRunPreset(matchingPreset);
    setError('');
    const query = new URLSearchParams({ family, n: form.n, seed: form.seed });
    if (family === 'acyclic-erdos-renyi') {
      query.set('pD', form.pD);
      query.set('pG', form.pG);
    } else {
      query.set('m', form.m);
    }
    window.history.replaceState({}, '', `${window.location.pathname}?${query.toString()}`);
  };

  const reset = () => {
    const first = presets[0];
    fillPreset(first);
    const next = first.graphFamily === 'acyclic-scale-free'
      ? generateAcyclicScaleFreeGraph(first.params)
      : generateAcyclicErdosRenyiGraph(first.params);
    setGraph(next);
    setRunPreset(first);
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
                <select value={family} onChange={(e) => setFamily(e.target.value as Family)}>
                  <option value="acyclic-erdos-renyi">{t.er}</option>
                  <option value="acyclic-scale-free">{t.sf}</option>
                </select>
              </label>
              <label>{t.preset}
                <select
                  value={presetId}
                  onChange={(e) => {
                    const spec = presets.find((p) => p.caseId === e.target.value);
                    if (spec) fillPreset(spec);
                  }}
                >
                  {presets.map((p) => <option key={p.caseId} value={p.caseId}>{presetLabel(p)}</option>)}
                </select>
              </label>
              <label>{t.n}<input aria-invalid={!!error && error.includes(t.n)} value={form.n} onChange={(e) => setForm({ ...form, n: e.target.value })} inputMode="numeric" /></label>
              {family === 'acyclic-erdos-renyi' ? (
                <>
                  <label>{t.pD}<input aria-invalid={!!error && error.includes(t.pD)} value={form.pD} onChange={(e) => setForm({ ...form, pD: e.target.value })} inputMode="decimal" /></label>
                  <label>{t.pG}<input aria-invalid={!!error && error.includes(t.pG)} value={form.pG} onChange={(e) => setForm({ ...form, pG: e.target.value })} inputMode="decimal" /></label>
                </>
              ) : (
                <label>{t.m}<input aria-invalid={!!error && error.includes(t.m)} value={form.m} onChange={(e) => setForm({ ...form, m: e.target.value })} inputMode="numeric" /></label>
              )}
              <label>{t.seed}<input aria-invalid={!!error && error.includes(t.seed)} value={form.seed} onChange={(e) => setForm({ ...form, seed: e.target.value })} inputMode="numeric" /></label>
              <button type="button" className="btn btn-primary" onClick={generate} style={{ width: 'auto' }}>{t.generate}</button>
              <button type="button" className="btn btn-secondary" onClick={reset} style={{ width: 'auto' }}>{t.reset}</button>
            </div>
            {error && <p role="alert" style={{ color: 'var(--danger)', fontWeight: 800, marginBlockEnd: 0 }}>{error}</p>}
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
              isFinalResult={allComplete}
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
              <dt>{t.topological}</dt><dd dir="ltr">{graph.topologicalOrder.join(' -> ')}</dd>
            </dl>
            <p style={{ marginBlockEnd: 0, fontWeight: 800 }}>{t.limitation}</p>
          </section>
        )}
        constraints={(
          <section className="card">
            <h3><span className="icon-label"><Icon name="shield" /> {t.run}</span></h3>
            <div className="random-lab-results">
              <SolverCard name="CP2" rows={[
                [t.status, statusLabel(results.cp2, t)],
                [t.path, pathText(results.cp2.bestPath)],
                [t.proof, String(results.cp2.proofCompleteEmitted)],
                [t.valid, String(cp2Valid)],
                [t.states, results.cp2.exploredStates],
                [t.prunes, results.cp2.prunedStates],
              ]} />
              <SolverCard name="CP2+" rows={[
                [t.status, statusLabel(results.cp2Plus, t)],
                [t.path, pathText(results.cp2Plus.bestPath)],
                [t.proof, String(results.cp2Plus.proofCompleteEmitted)],
                [t.valid, String(cp2PlusValid)],
                [t.states, results.cp2Plus.counters.statesExplored],
                [t.prunes, results.cp2Plus.counters.genomicPropagationPrunes],
                [t.checks, results.cp2Plus.counters.genomicPropagationChecks],
              ]} />
              <SolverCard name="ILP2" rows={results.ilp2 ? [
                [t.status, statusLabel(results.ilp2, t)],
                [t.path, pathText(results.ilp2.bestPath)],
                [t.proof, String(results.ilp2.proofCompleteEmitted)],
                [t.valid, String(ilp2Valid)],
                [t.candidates, results.ilp2.counters.enumeratedCandidates],
                [t.rejects, results.ilp2.rejectedCandidates],
              ] : [
                [t.status, t.notRun],
                [t.path, '-'],
                [t.proof, 'false'],
                [t.candidates, 0],
                [t.rejects, 0],
              ]} />
            </div>
            {results.ilp2NotRun && <p data-testid="ilp2-not-run-note" style={{ color: 'var(--danger)', fontWeight: 800 }}>{t.ilp2Skip}</p>}
            <p style={{ marginBlockEnd: 0, fontWeight: 700 }}>{t.countersNote}</p>
          </section>
        )}
        trace={(
          <section className="card" data-testid="random-graph-equality">
            <h3><span className="icon-label"><Icon name="ledger" /> {t.equality}</span></h3>
            {allComplete ? (
              <dl className="random-lab-dl">
                <dt>{t.objective}</dt><dd dir="ltr">{String((results.cp2.bestPath?.length ?? 0) === (results.cp2Plus.bestPath?.length ?? 0) && (results.cp2.bestPath?.length ?? 0) === (results.ilp2?.bestPath?.length ?? 0))}</dd>
                <dt>{t.winner}</dt><dd dir="ltr">{String(samePath(results.cp2.bestPath, results.cp2Plus.bestPath) && samePath(results.cp2.bestPath, results.ilp2?.bestPath))}</dd>
                <dt>{t.validity}</dt><dd dir="ltr">{String(cp2Valid === cp2PlusValid && cp2Valid === ilp2Valid)}</dd>
                <dt>{t.proofEquality}</dt><dd dir="ltr">true</dd>
              </dl>
            ) : (
              <p>{t.unavailable}</p>
            )}
          </section>
        )}
      />

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
        .random-lab-dl {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(0, 1.4fr);
          gap: var(--space-xs) var(--space-sm);
        }
        .random-lab-dl dd {
          margin: 0;
          unicode-bidi: isolate;
          overflow-wrap: anywhere;
        }
        @media (max-width: 900px) {
          .random-lab-controls,
          .random-lab-results,
          .random-lab-dl {
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
