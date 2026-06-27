import React, { useMemo, useState } from 'react';
import type { Language, TranslationDict } from '../i18n/types';
import { solveAlgoBBPlusPlus, type AlgoBBTraceEvent } from '../domain/algoBBPlusPlus';
import { solveCP1 } from '../domain/cpSolver';
import { solveConsistentPath } from '../domain/pathAlgorithms';
import { examples } from '../data/examples';
import { GraphPanel } from './GraphPanel';
import { Icon } from './Icons';
import { MethodCockpit } from './MethodCockpit';
import { MethodPlaybackControls } from './MethodPlaybackControls';
import { useMethodCockpitSync } from './useMethodCockpitSync';
import { ScenarioHandoffBanner } from './ScenarioHandoffBanner';
import { useScenarioHandoffExample } from './useScenarioHandoffExample';
import { MethodEducationBlock } from './MethodEducationBlock';

interface AlgoBBPlusPlusModelProps {
  lang: Language;
  dict: TranslationDict;
}

const pathText = (path: string[] | null | undefined) => (path && path.length > 0 ? path.join(' -> ') : 'N/A');

export const AlgoBBPlusPlusModel: React.FC<AlgoBBPlusPlusModelProps> = ({ lang, dict }) => {
  const isAr = lang === 'ar';
  const [selectedExampleId, setSelectedExampleId] = useState('multiple-candidates');
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [viewTab, setViewTab] = useState<'D' | 'G'>('D');
  const suppliedScenario = useScenarioHandoffExample(6);

  const currentExample = useMemo(
    () => suppliedScenario.example || examples.find((example) => example.id === selectedExampleId) || examples[0],
    [selectedExampleId, suppliedScenario.example]
  );

  const algoResult = useMemo(
    () => solveAlgoBBPlusPlus(currentExample.vertices, currentExample.edgesD, currentExample.edgesG),
    [currentExample]
  );
  const legacyResult = useMemo(
    () => solveConsistentPath(currentExample.vertices, currentExample.edgesD, currentExample.edgesG),
    [currentExample]
  );
  const cp1Result = useMemo(
    () => solveCP1(currentExample.vertices, currentExample.edgesD, currentExample.edgesG),
    [currentExample]
  );

  const trace = algoResult.trace;
  const currentEvent: AlgoBBTraceEvent | null =
    currentStepIndex >= 0 && currentStepIndex < trace.length ? trace[currentStepIndex] : null;
  const activeInspectorKey = currentEvent?.type === 'upper-bound' || currentEvent?.type === 'bound-pruning'
    ? labelsPlaceholder('upperBound')
    : currentEvent?.type === 'incumbent-update'
      ? labelsPlaceholder('incumbent')
      : currentEvent
        ? labelsPlaceholder('candidate')
        : null;

  const graphVisuals = useMemo(() => {
    const path = currentEvent?.path || [];
    return {
      highlightedNodes: new Set(path),
      activePath: path,
      isFinalResult: currentEvent?.type === 'proof-complete',
      isAcceptedStep: currentEvent?.type === 'incumbent-update' || currentEvent?.type === 'proof-complete',
    };
  }, [currentEvent]);

  const labels = {
    fr: {
      title: 'AlgoBB++ éducatif',
      badge: 'AlgoBB++ educational bounded implementation — exact only for small DAG examples.',
      problemTitle: 'Quel problème est résolu ?',
      problem:
        'La page cherche le plus long chemin dirigé simple dans D dont les sommets induisent un sous-graphe connecté dans G.',
      branch: 'Branche : un choix de prolonger le chemin courant à gauche ou à droite par un arc valide de D.',
      incumbent: 'Incumbent : le meilleur chemin cohérent déjà trouvé.',
      lower: 'Borne inférieure : la longueur de cet incumbent, qui ne peut que s’améliorer.',
      upper: 'Borne supérieure : une limite sûre sur la longueur maximale encore possible depuis le candidat courant.',
      pruning: 'Élagage : une branche est abandonnée seulement si une borne sûre prouve qu’elle ne peut pas battre l’incumbent.',
      seed: 'Arc germe : chaque arc dirigé de D sert de point de départ, avec des graines singleton pour couvrir les gagnants isolés.',
      genomic:
        'Validation génomique : un candidat complet doit être connecté dans G; un préfixe déconnecté reste autorisé si des sommets futurs peuvent encore le reconnecter.',
      paperOnly:
        'CoverSet preprocessing et community-based arc ordering sont présentés ici comme concepts de l’article seulement.',
      start: 'Démarrer',
      reset: 'Réinitialiser',
      prev: 'Précédent',
      next: 'Suivant',
      jump: 'Fin',
      candidate: 'Candidat courant',
      incumbentLabel: 'Incumbent courant',
      upperBound: 'Borne supérieure sûre',
      explored: 'États explorés',
      pruned: 'États élagués',
      reason: 'Raison',
      trace: 'Trace interactive',
      comparison: 'Comparaison non chronométrée',
      method: 'Méthode',
      result: 'Résultat',
      exploredStates: 'États explorés',
      prunedStates: 'États élagués',
      completion: 'Complétion',
      exact: 'Exact',
      incomplete: 'Incomplet',
      bestBeforeCompletion: 'Meilleure solution trouvée avant complétion',
      showD: 'Afficher le graphe métabolique D',
      showG: 'Afficher le graphe génomique G',
      legacy: 'Énumération historique',
      cp1: 'Modèle inspiré CP1',
      algobb: 'AlgoBB++ éducatif',
      select: 'Exemple',
      preview: 'La démonstration affichera les graines, extensions, bornes sûres, rejets génomiques et retours arrière.',
    },
    en: {
      title: 'AlgoBB++ Educational',
      badge: 'AlgoBB++ educational bounded implementation — exact only for small DAG examples.',
      problemTitle: 'What problem does this solve?',
      problem:
        'This page finds the longest simple directed path in D whose selected vertices induce a connected subgraph in G.',
      branch: 'Branch: a decision to extend the current path left or right through a valid arc of D.',
      incumbent: 'Incumbent: the best consistent path found so far.',
      lower: 'Lower bound: the incumbent length, which can only improve.',
      upper: 'Upper bound: a safe limit on the maximum path length still possible from the current candidate.',
      pruning: 'Pruning: a branch is abandoned only when a safe bound proves it cannot beat the incumbent.',
      seed: 'Seed arc: every directed arc of D is used as a starting work item, with singleton seeds covering isolated winners.',
      genomic:
        'Genomic connectivity validation: a complete candidate must be connected in G; a disconnected partial path is allowed if future vertices can still reconnect it.',
      paperOnly:
        'CoverSet preprocessing and community-based arc ordering are shown as paper-reference concepts only.',
      start: 'Start',
      reset: 'Reset',
      prev: 'Previous',
      next: 'Next',
      jump: 'End',
      candidate: 'Current candidate',
      incumbentLabel: 'Current incumbent',
      upperBound: 'Safe upper bound',
      explored: 'Explored states',
      pruned: 'Pruned states',
      reason: 'Reason',
      trace: 'Interactive trace',
      comparison: 'Non-runtime comparison',
      method: 'Method',
      result: 'Result',
      exploredStates: 'Explored states',
      prunedStates: 'Pruned states',
      completion: 'Completion',
      exact: 'Exact',
      incomplete: 'Incomplete',
      bestBeforeCompletion: 'Best solution found before completion',
      showD: 'Show metabolic graph D',
      showG: 'Show genomic graph G',
      legacy: 'Legacy enumeration',
      cp1: 'CP1-inspired model',
      algobb: 'AlgoBB++ educational',
      select: 'Example',
      preview: 'The walkthrough will show seeds, extensions, safe bounds, genomic rejections, and backtracking.',
    },
    ar: {
      title: 'AlgoBB++ التعليمي',
      badge: 'AlgoBB++ educational bounded implementation — exact only for small DAG examples.',
      problemTitle: 'ما المشكلة التي يحلها؟',
      problem:
        'تبحث هذه الصفحة عن أطول مسار موجه بسيط في D بحيث تشكل رؤوسه المختارة مخططاً فرعياً متصلاً في G.',
      branch: 'الفرع: قرار بتوسيع المسار الحالي يساراً أو يميناً عبر قوس صالح في D.',
      incumbent: 'Incumbent: أفضل مسار متسق تم العثور عليه حتى الآن.',
      lower: 'الحد الأدنى: طول أفضل مسار حالي، ولا يمكن إلا أن يتحسن.',
      upper: 'الحد الأعلى: حد آمن لأكبر طول مسار لا يزال ممكناً من المرشح الحالي.',
      pruning: 'التقليم: يتم ترك فرع فقط عندما يثبت حد آمن أنه لا يستطيع تجاوز أفضل حل حالي.',
      seed: 'القوس البذرة: كل قوس موجه في D يصبح نقطة بداية، مع بذور منفردة لتغطية الفائزين المعزولين.',
      genomic:
        'التحقق من الاتصال الجينومي: يجب أن يكون المرشح الكامل متصلاً في G؛ أما المسار الجزئي المنفصل فيبقى مسموحاً إذا كان يمكن لرؤوس لاحقة إعادة وصله.',
      paperOnly:
        'CoverSet preprocessing و community-based arc ordering معروضان هنا كمفاهيم مرجعية من الورقة فقط.',
      start: 'بدء',
      reset: 'إعادة تعيين',
      prev: 'السابق',
      next: 'التالي',
      jump: 'النهاية',
      candidate: 'المرشح الحالي',
      incumbentLabel: 'أفضل حل حالي',
      upperBound: 'حد أعلى آمن',
      explored: 'الحالات المستكشفة',
      pruned: 'الحالات المقلمة',
      reason: 'السبب',
      trace: 'تتبع تفاعلي',
      comparison: 'مقارنة بدون قياس زمني',
      method: 'الطريقة',
      result: 'النتيجة',
      exploredStates: 'الحالات المستكشفة',
      prunedStates: 'الحالات المقلمة',
      completion: 'الاكتمال',
      exact: 'دقيق',
      incomplete: 'غير مكتمل',
      bestBeforeCompletion: 'أفضل حل تم العثور عليه قبل الاكتمال',
      showD: 'عرض المخطط الاستقلابي D',
      showG: 'عرض المخطط الجينومي G',
      legacy: 'التعداد القديم',
      cp1: 'نموذج مستوحى من CP1',
      algobb: 'AlgoBB++ التعليمي',
      select: 'مثال',
      preview: 'سيعرض التشغيل البذور، والتمديدات، والحدود الآمنة، والرفض الجينومي، والرجوع للخلف.',
    },
  }[lang];

  function labelsPlaceholder(key: 'candidate' | 'incumbent' | 'upperBound'): string {
    return key;
  }

  const { cockpitRef, traceScrollerRef, setInspectorScrollerRef, scrollCockpitIntoViewForPlay } = useMethodCockpitSync(currentStepIndex, activeInspectorKey, trace);

  const reasonLabels: Record<AlgoBBTraceEvent['reasonCode'], string> = {
    SEARCH_INITIALIZED: 'search initialized',
    SINGLETON_SEED: 'singleton seed',
    ARC_SEED: 'arc seed',
    LEFT_EXTENSION: 'left extension through D',
    RIGHT_EXTENSION: 'right extension through D',
    SAFE_LENGTH_BOUND: 'safe length upper bound',
    NEW_INCUMBENT: 'new incumbent',
    DISCONNECTED_FINAL_CANDIDATE: 'complete candidate disconnected in G',
    GENOMIC_CONNECTIVITY_IMPOSSIBLE: 'no future selectable vertex can reconnect G components',
    BOUND_CANNOT_BEAT_INCUMBENT: 'upper bound cannot beat incumbent',
    RETURN_TO_PARENT: 'backtrack',
    EVENT_CAP_REACHED: 'event cap reached',
    CANCELLED_BY_SIGNAL: 'cancelled',
    OPTIMALITY_PROVEN: 'proof complete',
    INVALID_GRAPH: 'invalid graph',
    CYCLE_DETECTED: 'cycle detected',
  };

  const rows = [
    {
      method: labels.legacy,
      result: pathText(legacyResult.longestConsistentPath),
      explored: legacyResult.evaluatedPathsCount,
      pruned: 0,
      completion: legacyResult.error ? 'Error' : labels.exact,
    },
    {
      method: labels.cp1,
      result: pathText(cp1Result.bestPath),
      explored: cp1Result.stepCount,
      pruned: cp1Result.trace.filter((event) => event.type === 'contradiction').length,
      completion: cp1Result.status === 'optimal' || cp1Result.status === 'no-solution' ? labels.exact : labels.incomplete,
    },
    {
      method: labels.algobb,
      result: algoResult.status === 'incomplete' ? `${labels.bestBeforeCompletion}: ${pathText(algoResult.bestPath)}` : pathText(algoResult.bestPath),
      explored: algoResult.exploredStates,
      pruned: algoResult.prunedStates,
      completion: algoResult.status === 'optimal' || algoResult.status === 'no-solution' ? labels.exact : labels.incomplete,
    },
  ];

  const handleSelect = (id: string) => {
    setSelectedExampleId(id);
    setCurrentStepIndex(-1);
  };

  const goToStep = (index: number) => {
    if (index >= 0 && index < trace.length) setCurrentStepIndex(index);
  };

  return (
    <div style={{ textAlign: isAr ? 'right' : 'left', direction: isAr ? 'rtl' : 'ltr' }}>
      <ScenarioHandoffBanner lang={lang} scenario={suppliedScenario.scenario} error={suppliedScenario.error} />
      <div className="sr-only" aria-live="polite">
        {currentEvent ? `${currentEvent.type}: ${reasonLabels[currentEvent.reasonCode]}` : ''}
      </div>

      <header style={{ marginBlockEnd: 'var(--space-md)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 'var(--space-sm)', flexWrap: 'wrap' }}>
          <h2 style={{ fontSize: '1.6rem', color: 'var(--primary)', margin: 0 }}>
            <span className="icon-label"><Icon name="route" /> {labels.title}</span>
          </h2>
          <span
            style={{
              border: '1px solid var(--primary)',
              backgroundColor: 'var(--primary-bg)',
              color: 'var(--primary)',
              borderRadius: 'var(--radius-sm)',
              padding: 'var(--space-xs) var(--space-sm)',
              fontWeight: 700,
              fontSize: '0.78rem',
              direction: 'ltr',
              unicodeBidi: 'isolate',
            }}
          >
            <span className="icon-label"><Icon name="info" size={15} /> {labels.badge}</span>
          </span>
        </div>
      </header>

      <MethodEducationBlock methodId="algobb-plus-plus" lang={lang} />

      <section className="card" style={{ marginBlockEnd: 'var(--space-md)' }}>
          <h3 style={{ color: 'var(--primary)', marginBlockEnd: 'var(--space-xs)' }}>
            <span className="icon-label"><Icon name="network" /> {labels.problemTitle}</span>
          </h3>
        <p>{labels.problem}</p>
        <div className="grid grid-2" style={{ fontSize: '0.9rem' }}>
          {[labels.branch, labels.incumbent, labels.lower, labels.upper, labels.pruning, labels.seed, labels.genomic, labels.paperOnly].map(
            (text) => (
              <div key={text} style={{ padding: 'var(--space-sm)', backgroundColor: 'var(--neutral-bg-hover)', borderRadius: 'var(--radius-sm)' }}>
                {text}
              </div>
            )
          )}
        </div>
      </section>

      <section className="card" style={{ marginBlockEnd: 'var(--space-md)' }}>
        <label htmlFor="algobb-example" style={{ fontWeight: 700, display: 'block', marginBlockEnd: 'var(--space-xs)' }}>
          {labels.select}
        </label>
        <select
          id="algobb-example"
          value={selectedExampleId}
          onChange={(event) => handleSelect(event.target.value)}
          disabled={currentStepIndex !== -1}
          style={{ minHeight: '44px', minWidth: '260px', maxWidth: '100%', borderRadius: 'var(--radius-sm)' }}
        >
          {examples.map((example) => (
            <option key={example.id} value={example.id}>
              {lang === 'fr' ? example.titleFr : lang === 'ar' ? example.titleAr : example.titleEn}
            </option>
          ))}
        </select>
      </section>

      <MethodCockpit
        cockpitRef={cockpitRef}
        controls={(
          <MethodPlaybackControls
            lang={lang}
            currentStepIndex={currentStepIndex}
            totalSteps={trace.length}
            onStepChange={goToStep}
            onReset={() => setCurrentStepIndex(-1)}
            onPlayRequest={scrollCockpitIntoViewForPlay}
            labels={{ start: labels.start, previous: labels.prev, next: labels.next, end: labels.jump, reset: labels.reset }}
          />
        )}
        graph={(
          <>
            <div className="show-mobile-only" style={{ display: 'none', marginBlockEnd: 'var(--space-sm)' }}>
              <div className="lang-selector-group" style={{ width: '100%' }}>
                <button className={`lang-btn ${viewTab === 'D' ? 'active' : ''}`} onClick={() => setViewTab('D')} style={{ flex: 1 }} aria-label={labels.showD}>
                  D
                </button>
                <button className={`lang-btn ${viewTab === 'G' ? 'active' : ''}`} onClick={() => setViewTab('G')} style={{ flex: 1 }} aria-label={labels.showG}>
                  G
                </button>
              </div>
            </div>
            <GraphPanel
              vertices={currentExample.vertices}
              edgesD={currentExample.edgesD}
              edgesG={currentExample.edgesG}
              nodePositions={currentExample.nodePositions}
              highlightedNodes={graphVisuals.highlightedNodes}
              activePath={graphVisuals.activePath}
              isFinalResult={graphVisuals.isFinalResult}
              isAcceptedStep={graphVisuals.isAcceptedStep}
              lang={lang}
              dict={dict}
              mobileActiveTab={viewTab}
            />
          </>
        )}
        state={(
          <section className="card">
          {currentStepIndex === -1 && (
            <div style={{ backgroundColor: 'var(--neutral-bg-hover)', borderRadius: 'var(--radius-sm)', padding: 'var(--space-sm)', marginBlockEnd: 'var(--space-md)', color: 'var(--neutral-medium)', fontSize: '0.9rem' }}>
              {labels.preview}
            </div>
          )}
          <div ref={setInspectorScrollerRef} data-testid="method-inspector-scroll" className="grid grid-2" style={{ marginBlockEnd: 'var(--space-md)', overflowY: 'auto' }}>
            {[
              ['candidate', labels.candidate, pathText(currentEvent?.path)],
              ['incumbent', labels.incumbentLabel, pathText(currentEvent?.incumbent)],
              ['upperBound', labels.upperBound, String(currentEvent?.upperBound ?? 0)],
              ['explored', labels.explored, String(currentEvent?.exploredStates ?? 0)],
              ['pruned', labels.pruned, String(currentEvent?.prunedStates ?? 0)],
              ['reason', labels.reason, currentEvent ? reasonLabels[currentEvent.reasonCode] : 'N/A'],
            ].map(([key, label, value]) => (
              <div key={key} data-inspector-key={key} className={activeInspectorKey === key ? 'method-cockpit__active-row' : ''} style={{ backgroundColor: 'var(--neutral-bg-hover)', borderRadius: 'var(--radius-sm)', padding: 'var(--space-sm)' }}>
                <div style={{ color: 'var(--neutral-medium)', fontSize: '0.78rem', fontWeight: 700 }}>{label}</div>
                <div style={{ direction: 'ltr', unicodeBidi: 'isolate', fontWeight: 700 }}>{value}</div>
              </div>
            ))}
          </div>
          </section>
        )}
        constraints={(
          <section className="card">
            <h3 style={{ color: 'var(--primary)', marginBlockEnd: 'var(--space-sm)' }}>{labels.problemTitle}</h3>
            <p>{labels.upper}</p>
            <p>{labels.pruning}</p>
            <p style={{ marginBlockEnd: 0 }}>{labels.genomic}</p>
          </section>
        )}
        trace={(
          <section className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ color: 'var(--primary)', marginBlockEnd: 'var(--space-sm)' }}>{labels.trace}</h3>
          <div ref={traceScrollerRef} data-testid="method-trace-scroll" style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {trace.map((event, index) => {
              const active = index === currentStepIndex;
              return (
                <button
                  key={`${event.type}-${index}`}
                  data-trace-index={index}
                  data-active-trace={active ? 'true' : 'false'}
                  type="button"
                  onClick={() => goToStep(index)}
                  aria-pressed={active}
                  style={{
                    textAlign: isAr ? 'right' : 'left',
                    border: active ? '2px solid var(--primary)' : '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-sm)',
                    background: active ? 'var(--primary-bg)' : 'white',
                    padding: 'var(--space-xs) var(--space-sm)',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                  }}
                >
                  <strong>{index + 1}. {event.type}</strong>
                  <div style={{ fontSize: '0.82rem', color: 'var(--neutral-medium)' }}>
                    {reasonLabels[event.reasonCode]}
                    {event.rejectionReason ? `: ${event.rejectionReason}` : ''}
                  </div>
                  <div style={{ direction: 'ltr', unicodeBidi: 'isolate', fontSize: '0.82rem' }}>{pathText(event.path)}</div>
                </button>
              );
            })}
          </div>
        </section>
        )}
      />

      <details className="card" style={{ marginBlockEnd: 'var(--space-md)' }}>
        <summary style={{ cursor: 'pointer', fontWeight: 700, color: 'var(--primary)', marginBlockEnd: 'var(--space-sm)' }}>
          {labels.comparison}
        </summary>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '640px' }}>
            <thead>
              <tr>
                {[labels.method, labels.result, labels.exploredStates, labels.prunedStates, labels.completion].map((heading) => (
                  <th key={heading} style={{ textAlign: isAr ? 'right' : 'left', borderBottom: '2px solid var(--border-color)', padding: '8px' }}>
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.method}>
                  <td style={{ padding: '8px', borderBottom: '1px solid var(--border-color)' }}>{row.method}</td>
                  <td style={{ padding: '8px', borderBottom: '1px solid var(--border-color)', direction: 'ltr', unicodeBidi: 'isolate' }}>{row.result}</td>
                  <td style={{ padding: '8px', borderBottom: '1px solid var(--border-color)', textAlign: 'end' }}>{row.explored}</td>
                  <td style={{ padding: '8px', borderBottom: '1px solid var(--border-color)', textAlign: 'end' }}>{row.pruned}</td>
                  <td style={{ padding: '8px', borderBottom: '1px solid var(--border-color)' }}>
                    <span className="icon-label">
                      <Icon name={row.completion === labels.exact ? 'check' : 'alert'} size={15} />
                      {row.completion}
                    </span>
                  </td>
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
