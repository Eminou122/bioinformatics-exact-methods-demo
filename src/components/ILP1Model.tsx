import React, { useMemo, useState } from 'react';
import type { Language, TranslationDict } from '../i18n/types';
import { examples } from '../data/examples';
import { solveConsistentPath } from '../domain/pathAlgorithms';
import { solveCP1 } from '../domain/cpSolver';
import { solveCP2 } from '../domain/cp2Solver';
import { solveAlgoBBPlusPlus } from '../domain/algoBBPlusPlus';
import { solveILP1, type ILP1TraceEvent } from '../domain/ilp1Solver';
import { GraphPanel } from './GraphPanel';
import { Icon } from './Icons';
import { MethodCockpit } from './MethodCockpit';
import { MethodPlaybackControls } from './MethodPlaybackControls';
import { useMethodCockpitSync } from './useMethodCockpitSync';
import { ScenarioHandoffBanner } from './ScenarioHandoffBanner';
import { useScenarioHandoffExample } from './useScenarioHandoffExample';
import { MethodEducationBlock } from './MethodEducationBlock';

interface ILP1ModelProps {
  lang: Language;
  dict: TranslationDict;
}

const labels = {
  fr: {
    title: 'ILP1 — Décisions Binaires et Contraintes Linéaires',
    badge: 'ILP1 educational bounded formulation — exact only for small DAG examples.',
    honesty: 'Cette page expose une formulation ILP1 éducative et la résout par recherche déterministe bornée dans le navigateur. Aucun moteur CPLEX, Gurobi, GLPK, OR-Tools ou solveur MILP natif n’est utilisé.',
    model: 'Un problème de graphe devient un modèle d’optimisation en choisissant des variables binaires, puis en gardant seulement les affectations qui respectent les contraintes.',
    xv: 'x_v indique si une réaction v est sélectionnée.',
    ya: 'y_a indique si un arc métabolique dirigé a est utilisé dans le chemin.',
    ze: 'z_e indique si une arête génomique e appartient au témoin de connectivité.',
    path: 'Les contraintes dans D empêchent les fourches, les fragments disjoints et les sommets répétés.',
    witness: 'Les arêtes z dans G forment un arbre témoin qui connecte uniquement les sommets sélectionnés.',
    objective: 'L’objectif est de sélectionner autant de réactions compatibles que possible.',
    bounded: 'La démo reste bornée aux petits DAG pour rester transparente et exécutable dans le navigateur.',
    select: 'Exemple',
    start: 'Démarrer ILP1',
    prev: 'Précédent',
    next: 'Suivant',
    end: 'Fin',
    reset: 'Réinitialiser',
    selectedPath: 'Chemin sélectionné',
    incumbent: 'Incumbent actuel',
    explored: 'Candidats explorés',
    rejected: 'Candidats rejetés',
    status: 'État',
    exact: 'Exact / preuve complète',
    incomplete: 'Incomplet',
    cancelled: 'Annulé',
    cap: 'Limite d’événements atteinte',
    variables: 'Variables x/y/z sélectionnées',
    witnessTitle: 'Témoin de connectivité génomique',
    constraints: 'Validation des contraintes ILP1',
    trace: 'Trace ILP1',
    reason: 'Raison',
    method: 'Méthode',
    best: 'Meilleur résultat',
    style: 'Style de contraintes',
    completion: 'Complétion',
    legacy: 'Énumération Legacy',
    cp1: 'Modèle inspiré CP1',
    cp2: 'Modèle éducatif CP2',
    ilp1: 'Modèle éducatif ILP1',
    algobb: 'AlgoBB++',
    enumStyle: 'Énumérer et valider',
    cp1Style: 'Propagation de contraintes',
    cp2Style: 'CP + bornes supérieures sûres',
    ilpStyle: 'Variables binaires + contraintes',
    bbStyle: 'Branch-and-bound borné',
    noPath: 'Aucun',
    exactLabel: 'Exact',
  },
  en: {
    title: 'ILP1 — Binary Decisions and Linear Constraints',
    badge: 'ILP1 educational bounded formulation — exact only for small DAG examples.',
    honesty: 'This page exposes an educational ILP1 formulation and solves it with bounded deterministic browser search. No CPLEX, Gurobi, GLPK, OR-Tools, or native MILP engine is used.',
    model: 'A graph problem becomes an optimization model by choosing binary variables, then keeping only assignments that satisfy the constraints.',
    xv: 'x_v says whether reaction vertex v is selected.',
    ya: 'y_a says whether directed metabolic arc a is used in the path.',
    ze: 'z_e says whether genomic edge e belongs to the connectivity witness.',
    path: 'Constraints in D prevent forks, disconnected fragments, and repeated vertices.',
    witness: 'The z edges in G form a witness tree connecting only the selected vertices.',
    objective: 'The objective is to select as many compatible reactions as possible.',
    bounded: 'The demo stays bounded to small DAGs so it remains transparent and executable in the browser.',
    select: 'Example',
    start: 'Start ILP1',
    prev: 'Previous',
    next: 'Next',
    end: 'End',
    reset: 'Reset',
    selectedPath: 'Selected path',
    incumbent: 'Current incumbent',
    explored: 'Explored candidates',
    rejected: 'Rejected candidates',
    status: 'Status',
    exact: 'Exact / proof complete',
    incomplete: 'Incomplete',
    cancelled: 'Cancelled',
    cap: 'Event cap reached',
    variables: 'Selected x/y/z variables',
    witnessTitle: 'Genomic connectivity witness',
    constraints: 'ILP1 constraint validation',
    trace: 'ILP1 trace',
    reason: 'Reason',
    method: 'Method',
    best: 'Best result',
    style: 'Constraint style',
    completion: 'Completion',
    legacy: 'Legacy enumeration',
    cp1: 'CP1-inspired model',
    cp2: 'CP2 educational model',
    ilp1: 'ILP1 educational model',
    algobb: 'AlgoBB++',
    enumStyle: 'Enumerate and validate',
    cp1Style: 'Constraint propagation',
    cp2Style: 'CP + safe upper bounds',
    ilpStyle: 'Binary variables + constraints',
    bbStyle: 'Bounded branch-and-bound',
    noPath: 'None',
    exactLabel: 'Exact',
  },
  ar: {
    title: 'ILP1 — قرارات ثنائية وقيود خطية',
    badge: 'ILP1 educational bounded formulation — exact only for small DAG examples.',
    honesty: 'تعرض هذه الصفحة صياغة ILP1 تعليمية وتحلها ببحث حتمي محدود داخل المتصفح. لا يتم استخدام CPLEX أو Gurobi أو GLPK أو OR-Tools أو أي محرك MILP أصلي.',
    model: 'تتحول مسألة المخطط إلى نموذج تحسين عبر اختيار متغيرات ثنائية، ثم قبول التعيينات التي تحقق القيود فقط.',
    xv: 'x_v يحدد هل رأس التفاعل v مختار.',
    ya: 'y_a يحدد هل القوس الاستقلابي الموجه a مستخدم في المسار.',
    ze: 'z_e يحدد هل الحافة الجينومية e ضمن شاهد الاتصال.',
    path: 'قيود D تمنع التفرعات، والأجزاء المنفصلة، وتكرار الرؤوس.',
    witness: 'حواف z في G تشكل شجرة شاهدة تصل الرؤوس المختارة فقط.',
    objective: 'الهدف هو اختيار أكبر عدد ممكن من التفاعلات المتوافقة.',
    bounded: 'يبقى العرض محدوداً بمخططات DAG صغيرة حتى يكون واضحاً وقابلاً للتنفيذ في المتصفح.',
    select: 'المثال',
    start: 'بدء ILP1',
    prev: 'السابق',
    next: 'التالي',
    end: 'النهاية',
    reset: 'إعادة تعيين',
    selectedPath: 'المسار المختار',
    incumbent: 'Incumbent الحالي',
    explored: 'المرشحون المستكشفون',
    rejected: 'المرشحون المرفوضون',
    status: 'الحالة',
    exact: 'دقيق / برهان مكتمل',
    incomplete: 'غير مكتمل',
    cancelled: 'ملغى',
    cap: 'تم بلوغ حد الأحداث',
    variables: 'متغيرات x/y/z المختارة',
    witnessTitle: 'شاهد الاتصال الجينومي',
    constraints: 'التحقق من قيود ILP1',
    trace: 'تتبع ILP1',
    reason: 'السبب',
    method: 'الطريقة',
    best: 'أفضل نتيجة',
    style: 'نمط القيود',
    completion: 'الاكتمال',
    legacy: 'التعداد Legacy',
    cp1: 'نموذج مستوحى من CP1',
    cp2: 'نموذج CP2 التعليمي',
    ilp1: 'نموذج ILP1 التعليمي',
    algobb: 'AlgoBB++',
    enumStyle: 'تعداد ثم تحقق',
    cp1Style: 'نشر القيود',
    cp2Style: 'CP + حدود عليا آمنة',
    ilpStyle: 'متغيرات ثنائية + قيود',
    bbStyle: 'تفريع وتقييد محدود',
    noPath: 'لا يوجد',
    exactLabel: 'دقيق',
  },
} satisfies Record<Language, Record<string, string>>;

function pathText(path: string[] | null): string {
  return path && path.length > 0 ? `\u202A${path.join(' -> ')}\u202C` : 'N/A';
}

function completionText(event: ILP1TraceEvent | null, result: ReturnType<typeof solveILP1>, t: typeof labels.en): string {
  if (event?.type === 'cancelled' || result.cancelled) return t.cancelled;
  if (event?.type === 'cap-reached' || result.interruptedByCap) return t.cap;
  if (result.status === 'optimal' || result.status === 'no-solution') return t.exact;
  return t.incomplete;
}

export const ILP1Model: React.FC<ILP1ModelProps> = ({ lang, dict }) => {
  const isAr = lang === 'ar';
  const t = labels[lang];
  const [selectedExampleId, setSelectedExampleId] = useState('multiple-candidates');
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [viewTab, setViewTab] = useState<'D' | 'G'>('D');
  const suppliedScenario = useScenarioHandoffExample(6);

  const currentExample = useMemo(
    () => suppliedScenario.example || examples.find((ex) => ex.id === selectedExampleId) || examples[0],
    [selectedExampleId, suppliedScenario.example]
  );
  const ilp1Result = useMemo(
    () => solveILP1(currentExample.vertices, currentExample.edgesD, currentExample.edgesG),
    [currentExample]
  );
  const cp1Result = useMemo(() => solveCP1(currentExample.vertices, currentExample.edgesD, currentExample.edgesG), [currentExample]);
  const cp2Result = useMemo(() => solveCP2(currentExample.vertices, currentExample.edgesD, currentExample.edgesG), [currentExample]);
  const legacyResult = useMemo(() => solveConsistentPath(currentExample.vertices, currentExample.edgesD, currentExample.edgesG), [currentExample]);
  const bbResult = useMemo(() => solveAlgoBBPlusPlus(currentExample.vertices, currentExample.edgesD, currentExample.edgesG), [currentExample]);

  const traceEvents = ilp1Result.trace;
  const isRunning = currentStepIndex !== -1 && traceEvents.length > 0;
  const currentEvent = isRunning ? traceEvents[currentStepIndex] || null : null;
  const activePath = currentEvent?.currentPath || [];
  const activeDecisions = currentEvent?.decisions || ilp1Result.bestCandidate?.decisions || null;
  const activeWitness = currentEvent?.witnessEdges || ilp1Result.bestCandidate?.witnessEdges || [];

  const selectedVariables = useMemo(() => {
    if (!activeDecisions) return [];
    return [
      ...Object.entries(activeDecisions.x).filter(([, value]) => value === 1).map(([key]) => `x[${key}] = 1`),
      ...Object.entries(activeDecisions.y).filter(([, value]) => value === 1).map(([key]) => `y[${key}] = 1`),
      ...Object.entries(activeDecisions.z).filter(([, value]) => value === 1).map(([key]) => `z[${key}] = 1`),
    ];
  }, [activeDecisions]);
  const activeInspectorKey = selectedVariables[0] || (currentEvent ? 'selectedPath' : null);
  const { cockpitRef, traceScrollerRef, setInspectorScrollerRef, scrollCockpitIntoViewForPlay } = useMethodCockpitSync(currentStepIndex, activeInspectorKey, traceEvents);

  const rows = [
    { method: t.legacy, best: legacyResult.longestConsistentPath, style: t.enumStyle, completion: legacyResult.error ? t.incomplete : t.exactLabel },
    { method: t.cp1, best: cp1Result.bestPath, style: t.cp1Style, completion: cp1Result.status === 'optimal' || cp1Result.status === 'no-solution' ? t.exact : t.incomplete },
    { method: t.cp2, best: cp2Result.bestPath, style: t.cp2Style, completion: cp2Result.status === 'optimal' || cp2Result.status === 'no-solution' ? t.exact : t.incomplete },
    { method: t.ilp1, best: ilp1Result.bestPath, style: t.ilpStyle, completion: ilp1Result.status === 'optimal' || ilp1Result.status === 'no-solution' ? t.exact : t.incomplete },
    { method: t.algobb, best: bbResult.bestPath, style: t.bbStyle, completion: bbResult.status === 'optimal' || bbResult.status === 'no-solution' ? t.exact : t.incomplete },
  ];

  return (
    <div style={{ textAlign: isAr ? 'right' : 'left', direction: isAr ? 'rtl' : 'ltr' }}>
      <ScenarioHandoffBanner lang={lang} scenario={suppliedScenario.scenario} error={suppliedScenario.error} />
      <div className="sr-only" aria-live="assertive">{currentEvent?.message || ''}</div>
      <header style={{ marginBlockEnd: 'var(--space-md)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 'var(--space-sm)', flexWrap: 'wrap', alignItems: 'center' }}>
          <h2 style={{ fontSize: '1.6rem', color: 'var(--primary)', border: 'none', margin: 0, padding: 0 }}>{t.title}</h2>
          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--primary)', backgroundColor: 'var(--primary-bg)', border: '1px solid var(--primary)', borderRadius: 'var(--radius-sm)', padding: 'var(--space-xs) var(--space-sm)' }}>
            Exact small-graph implementation
          </span>
        </div>
        <p style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--neutral-medium)', backgroundColor: 'var(--neutral-bg-hover)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: 'var(--space-sm)' }}>{t.badge}</p>
      </header>

      <MethodEducationBlock methodId="ilp1" lang={lang} />

      <section className="card" style={{ marginBlockEnd: 'var(--space-md)' }}>
        <p style={{ marginBlockStart: 0 }}>{t.honesty}</p>
        <p>{t.model}</p>
        <div className="grid grid-2" style={{ fontSize: '0.9rem' }}>
          <p dir="ltr">{t.xv}</p>
          <p dir="ltr">{t.ya}</p>
          <p dir="ltr">{t.ze}</p>
          <p>{t.path}</p>
          <p>{t.witness}</p>
          <p>{t.objective}</p>
        </div>
        <p style={{ marginBlockEnd: 0, color: 'var(--primary)', fontWeight: 700 }}>{t.bounded}</p>
      </section>

      <section className="card" style={{ padding: 'var(--space-md)', marginBlockEnd: 'var(--space-md)' }}>
        <label style={{ display: 'grid', gap: 'var(--space-xs)', maxWidth: '360px' }}>
          <span style={{ fontWeight: 700 }}>{t.select}</span>
          <select value={selectedExampleId} onChange={(event) => { setSelectedExampleId(event.target.value); setCurrentStepIndex(-1); }} disabled={isRunning} style={{ padding: 'var(--space-sm)', minHeight: '44px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
            {examples.map((example) => (
              <option key={example.id} value={example.id}>
                {lang === 'fr' ? example.titleFr : lang === 'ar' ? example.titleAr : example.titleEn}
              </option>
            ))}
          </select>
        </label>
      </section>

      <MethodCockpit
        cockpitRef={cockpitRef}
        controls={(
          <MethodPlaybackControls
            lang={lang}
            currentStepIndex={currentStepIndex}
            totalSteps={traceEvents.length}
            onStepChange={setCurrentStepIndex}
            onReset={() => setCurrentStepIndex(-1)}
            onPlayRequest={scrollCockpitIntoViewForPlay}
            labels={{ start: t.start, previous: t.prev, next: t.next, end: t.end, reset: t.reset }}
          />
        )}
        graph={(
          <>
            <div className="show-mobile-only" style={{ display: 'none', marginBlockEnd: 'var(--space-sm)' }}>
              <div className="lang-selector-group" style={{ width: '100%' }}>
                <button className={`lang-btn ${viewTab === 'D' ? 'active' : ''}`} style={{ flex: 1 }} onClick={() => setViewTab('D')}>D</button>
                <button className={`lang-btn ${viewTab === 'G' ? 'active' : ''}`} style={{ flex: 1 }} onClick={() => setViewTab('G')}>G</button>
              </div>
            </div>
            <GraphPanel
              vertices={currentExample.vertices}
              edgesD={currentExample.edgesD}
              edgesG={currentExample.edgesG}
              nodePositions={currentExample.nodePositions}
              highlightedNodes={new Set(activePath)}
              activePath={activePath}
              isFinalResult={currentEvent?.type === 'proof-complete'}
              isAcceptedStep={currentEvent?.type === 'constraint-check' || currentEvent?.type === 'incumbent-update' || currentEvent?.type === 'proof-complete'}
              lang={lang}
              dict={dict}
              mobileActiveTab={viewTab}
            />
          </>
        )}
        state={(
          <section className="card">
          <h3 style={{ color: 'var(--primary)', fontSize: '1.1rem' }}><span className="icon-label"><Icon name="clipboard" /> {t.constraints}</span></h3>
          <dl style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-sm)', fontSize: '0.9rem' }}>
            <dt data-inspector-key="selectedPath" className={activeInspectorKey === 'selectedPath' ? 'method-cockpit__active-row' : ''}>{t.selectedPath}</dt><dd dir="ltr">{pathText(activePath)}</dd>
            <dt>{t.incumbent}</dt><dd dir="ltr">{pathText(currentEvent?.bestPath || ilp1Result.bestPath)}</dd>
            <dt>{t.explored}</dt><dd>{currentEvent?.exploredCandidates ?? ilp1Result.exploredCandidates}</dd>
            <dt>{t.rejected}</dt><dd>{currentEvent?.rejectedCandidates ?? ilp1Result.rejectedCandidates}</dd>
            <dt>{t.reason}</dt><dd>{currentEvent?.reason || '-'}</dd>
          </dl>
          <p style={{ marginBlockEnd: 0, fontWeight: 700, color: 'var(--primary)' }}>{completionText(currentEvent, ilp1Result, t as typeof labels.en)}</p>
          </section>
        )}
        constraints={(
          <section className="card">
          <h3 style={{ color: 'var(--primary)', fontSize: '1.1rem' }}><span className="icon-label"><Icon name="network" /> {t.variables}</span></h3>
          <div ref={setInspectorScrollerRef} data-testid="method-inspector-scroll" dir="ltr" style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', fontFamily: 'monospace', fontSize: '0.82rem', overflowY: 'auto' }}>
            {selectedVariables.length > 0 ? selectedVariables.map((value) => (
              <span key={value} data-inspector-key={value} className={activeInspectorKey === value ? 'method-cockpit__active-row' : ''} style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '4px 6px', background: 'var(--neutral-bg-hover)' }}>{value}</span>
            )) : <span>N/A</span>}
          </div>
          <h4 style={{ marginBlockStart: 'var(--space-md)', marginBlockEnd: 'var(--space-xs)' }}>{t.witnessTitle}</h4>
          <p dir="ltr" style={{ margin: 0, fontFamily: 'monospace', fontSize: '0.86rem' }}>
            {activeWitness.length > 0 ? activeWitness.map((edge) => `${edge.u}--${edge.v}`).join(', ') : 'N/A'}
          </p>
        </section>
        )}
        trace={(
      <section className="card" style={{ display: 'flex', flexDirection: 'column' }}>
        <h3 style={{ color: 'var(--primary)', fontSize: '1.1rem' }}><span className="icon-label"><Icon name="ledger" /> {t.trace}</span></h3>
        <div ref={traceScrollerRef} data-testid="method-trace-scroll" style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {traceEvents.map((event, idx) => {
            const isActive = idx === currentStepIndex;
            return (
              <button
                key={`${event.type}-${idx}`}
                data-trace-index={idx}
                data-active-trace={isActive ? 'true' : 'false'}
                type="button"
                aria-pressed={isActive}
                onClick={() => setCurrentStepIndex(idx)}
                style={{ textAlign: isAr ? 'right' : 'left', border: 'none', borderInlineStart: isActive ? '3px solid var(--accent-gold)' : '3px solid transparent', background: isActive ? 'var(--neutral-bg-hover)' : 'transparent', padding: '6px var(--space-sm)', cursor: 'pointer', borderRadius: 'var(--radius-sm)', fontFamily: 'inherit' }}
              >
                <strong style={{ display: 'block', color: event.type === 'constraint-rejection' ? 'var(--danger)' : 'var(--primary)', textTransform: 'uppercase', fontSize: '0.72rem' }}>{event.type}</strong>
                <span style={{ fontSize: '0.82rem' }}>{event.message}</span>
              </button>
            );
          })}
        </div>
      </section>
        )}
      />

      <details className="card" style={{ marginBlockEnd: 'var(--space-md)' }}>
        <summary style={{ cursor: 'pointer', fontWeight: 700, color: 'var(--primary)', marginBlockEnd: 'var(--space-sm)' }}>
          <span className="icon-label"><Icon name="search" /> ILP1 / CP / Legacy</span>
        </summary>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
            <thead>
              <tr>
                <th style={{ textAlign: isAr ? 'right' : 'left', borderBottom: '2px solid var(--border-color)', padding: '8px' }}>{t.method}</th>
                <th style={{ textAlign: isAr ? 'right' : 'left', borderBottom: '2px solid var(--border-color)', padding: '8px' }}>{t.best}</th>
                <th style={{ textAlign: isAr ? 'right' : 'left', borderBottom: '2px solid var(--border-color)', padding: '8px' }}>{t.style}</th>
                <th style={{ textAlign: isAr ? 'right' : 'left', borderBottom: '2px solid var(--border-color)', padding: '8px' }}>{t.completion}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.method}>
                  <td style={{ padding: '8px', borderBottom: '1px solid var(--border-color)' }}>{row.method}</td>
                  <td style={{ padding: '8px', borderBottom: '1px solid var(--border-color)' }} dir="ltr">{row.best ? pathText(row.best) : t.noPath}</td>
                  <td style={{ padding: '8px', borderBottom: '1px solid var(--border-color)' }}>{row.style}</td>
                  <td style={{ padding: '8px', borderBottom: '1px solid var(--border-color)' }}>{row.completion}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>

      <style>{`
        .sr-only {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
          border: 0;
        }
        @media (max-width: 767px) {
          .show-mobile-only {
            display: flex !important;
          }
        }
      `}</style>
    </div>
  );
};
