import React, { useMemo, useState } from 'react';
import type { Language, TranslationDict } from '../i18n/types';
import { examples } from '../data/examples';
import { solveSubsetDP, type SubsetDpTraceEvent } from '../domain/subsetDpSolver';
import { GraphPanel } from './GraphPanel';
import { Icon } from './Icons';
import { MethodCockpit } from './MethodCockpit';
import { MethodPlaybackControls } from './MethodPlaybackControls';
import { useMethodCockpitSync } from './useMethodCockpitSync';
import { ScenarioHandoffBanner } from './ScenarioHandoffBanner';
import { useScenarioHandoffExample } from './useScenarioHandoffExample';
import { MethodEducationBlock } from './MethodEducationBlock';

interface SubsetDpModelProps {
  lang: Language;
  dict: TranslationDict;
}

const labels = {
  fr: {
    title: 'Exact Subset Dynamic Programming',
    badge: 'Exact subset dynamic programming — exact only for small graphs when search completes.',
    intro: 'Cette méthode conserve un état canonique (subset,last) et étend seulement par des arcs de D vers un nouveau sommet.',
    repeated: 'Les répétitions sont interdites parce que la solution doit être un chemin dirigé simple.',
    stateEnough: 'L’état (subset,last) suffit : les extensions futures dépendent uniquement des sommets déjà sélectionnés et du dernier sommet.',
    dominance: 'Pour un même état (subset,last), le préfixe lexicographiquement le plus petit domine les autres préfixes.',
    limited: 'La méthode est exacte après traitement exhaustif des états atteignables, mais le nombre de subsets croît exponentiellement.',
    select: 'Exemple',
    start: 'Démarrer Subset DP',
    prev: 'Précédent',
    next: 'Suivant',
    end: 'Fin',
    reset: 'Réinitialiser',
    currentState: 'État subset courant',
    selectedSet: 'Ensemble sélectionné',
    lastVertex: 'Dernier sommet',
    path: 'Séquence du chemin',
    inspector: 'Inspecteur des états DP',
    mask: 'Mask / subset',
    retainedPath: 'Meilleur chemin retenu',
    status: 'Statut',
    transition: 'Transition',
    candidateNext: 'Sommet next candidat',
    newToSubset: 'Nouveau dans subset',
    genomic: 'Connexité génomique',
    retained: 'Retenu ou dominé',
    proof: 'Preuve exacte',
    searchCompleted: 'Recherche terminée',
    proofComplete: 'Preuve émise',
    cap: 'Cap atteint',
    cancelled: 'Annulé',
    counters: 'Compteurs',
    statesCreated: 'États créés',
    statesRetained: 'États retenus',
    transitionsEvaluated: 'Transitions évaluées',
    disconnectedRejected: 'Subsets G déconnectés rejetés',
    dominatedDuplicates: 'Doublons dominés',
    trace: 'Journal de recherche Subset DP',
    currentEvent: 'Current Event Card',
    activeStep: 'ACTIVE STEP',
    noActiveEvent: 'Aucun événement actif',
    traceLedger: 'Journal',
    yes: 'oui',
    no: 'non',
    none: 'Aucun',
    incomplete: 'Incomplet',
    exact: 'Exact',
    comparison: 'Comparaison des méthodes',
    method: 'Méthode',
    coreIdea: 'Idée centrale',
  },
  en: {
    title: 'Exact Subset Dynamic Programming',
    badge: 'Exact subset dynamic programming — exact only for small graphs when search completes.',
    intro: 'This method keeps a canonical (subset,last) state and extends only along D arcs to a new vertex.',
    repeated: 'Repeated vertices are forbidden because the solution must be one simple directed path.',
    stateEnough: 'The (subset,last) state is enough: future extensions depend only on the selected vertices and the last vertex.',
    dominance: 'For the same (subset,last) state, the lexicographically smallest prefix dominates the other prefixes.',
    limited: 'The method is exact after all reachable states are processed, but the number of subsets grows exponentially.',
    select: 'Example',
    start: 'Start Subset DP',
    prev: 'Previous',
    next: 'Next',
    end: 'End',
    reset: 'Reset',
    currentState: 'Current subset state',
    selectedSet: 'Selected set',
    lastVertex: 'Last vertex',
    path: 'Path sequence',
    inspector: 'DP State Inspector',
    mask: 'Mask / subset',
    retainedPath: 'Retained best path',
    status: 'State status',
    transition: 'Transition explanation',
    candidateNext: 'Candidate next vertex',
    newToSubset: 'New to subset',
    genomic: 'Genomic connectivity',
    retained: 'Retained or dominated',
    proof: 'Exact proof/status',
    searchCompleted: 'Search completed',
    proofComplete: 'Proof emitted',
    cap: 'Cap reached',
    cancelled: 'Cancelled',
    counters: 'Counters',
    statesCreated: 'States created',
    statesRetained: 'States retained',
    transitionsEvaluated: 'Transitions evaluated',
    disconnectedRejected: 'G-disconnected subsets rejected',
    dominatedDuplicates: 'Dominated duplicates',
    trace: 'Subset DP search journal',
    currentEvent: 'Current Event Card',
    activeStep: 'ACTIVE STEP',
    noActiveEvent: 'No active event',
    traceLedger: 'Trace ledger',
    yes: 'yes',
    no: 'no',
    none: 'None',
    incomplete: 'Incomplete',
    exact: 'Exact',
    comparison: 'Method comparison',
    method: 'Method',
    coreIdea: 'Core idea',
  },
  ar: {
    title: 'Exact Subset Dynamic Programming',
    badge: 'Exact subset dynamic programming — exact only for small graphs when search completes.',
    intro: 'تحافظ هذه الطريقة على حالة معيارية (subset,last) وتمدد فقط عبر أقواس D إلى رأس جديد.',
    repeated: 'تكرار الرؤوس ممنوع لأن الحل يجب أن يكون مساراً موجهاً بسيطاً واحداً.',
    stateEnough: 'الحالة (subset,last) كافية: الامتدادات المستقبلية تعتمد فقط على الرؤوس المختارة وآخر رأس.',
    dominance: 'للحالة نفسها (subset,last)، يحتفظ الحل بالبادئة الأصغر معجمياً لأنها تهيمن على غيرها.',
    limited: 'تكون الطريقة دقيقة بعد معالجة كل الحالات القابلة للوصول، لكن عدد subsets ينمو أسياً.',
    select: 'المثال',
    start: 'بدء Subset DP',
    prev: 'السابق',
    next: 'التالي',
    end: 'النهاية',
    reset: 'إعادة تعيين',
    currentState: 'حالة subset الحالية',
    selectedSet: 'المجموعة المختارة',
    lastVertex: 'آخر رأس',
    path: 'تسلسل المسار',
    inspector: 'فاحص حالات DP',
    mask: 'Mask / subset',
    retainedPath: 'أفضل مسار محفوظ',
    status: 'حالة الحالة',
    transition: 'شرح الانتقال',
    candidateNext: 'الرأس next المرشح',
    newToSubset: 'جديد في subset',
    genomic: 'الاتصال الجينومي',
    retained: 'محفوظ أو مهيمن عليه',
    proof: 'حالة البرهان الدقيق',
    searchCompleted: 'اكتملت البحث',
    proofComplete: 'صدر البرهان',
    cap: 'تم بلوغ الحد',
    cancelled: 'ملغى',
    counters: 'العدادات',
    statesCreated: 'الحالات المنشأة',
    statesRetained: 'الحالات المحفوظة',
    transitionsEvaluated: 'الانتقالات المقيمة',
    disconnectedRejected: 'مجموعات G غير المتصلة المرفوضة',
    dominatedDuplicates: 'الحالات المكررة المهيمن عليها',
    trace: 'سجل بحث Subset DP',
    currentEvent: 'Current Event Card',
    activeStep: 'ACTIVE STEP',
    noActiveEvent: 'لا يوجد حدث نشط',
    traceLedger: 'السجل',
    yes: 'نعم',
    no: 'لا',
    none: 'لا يوجد',
    incomplete: 'غير مكتمل',
    exact: 'دقيق',
    comparison: 'مقارنة الطرق',
    method: 'الطريقة',
    coreIdea: 'الفكرة الأساسية',
  },
} satisfies Record<Language, Record<string, string>>;

function pathText(path: string[] | null | undefined, fallback: string): string {
  return path && path.length > 0 ? `\u202A${path.join(' -> ')}\u202C` : fallback;
}

function subsetText(event: SubsetDpTraceEvent | null, fallback: string): string {
  return event?.state?.subset.length ? `\u202A{${event.state.subset.join(', ')}}\u202C` : fallback;
}

function maskText(event: SubsetDpTraceEvent | null, fallback: string): string {
  if (!event?.state) return fallback;
  return `\u202A${event.state.mask.toString(2)} / {${event.state.subset.join(', ')}}\u202C`;
}

function eventId(exampleId: string, event: SubsetDpTraceEvent, index: number): string {
  return `subset-dp:${exampleId}:${index + 1}:${event.stepCount}:${event.type}`;
}

function resolveIndex(index: number, length: number): number {
  if (length <= 0 || index < 0) return -1;
  return Math.min(index, length - 1);
}

export const SubsetDpModel: React.FC<SubsetDpModelProps> = ({ lang, dict }) => {
  const isAr = lang === 'ar';
  const t = labels[lang];
  const [selectedExampleId, setSelectedExampleId] = useState('multiple-candidates');
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [viewTab, setViewTab] = useState<'D' | 'G'>('D');
  const suppliedScenario = useScenarioHandoffExample(6);

  const currentExample = useMemo(
    () => suppliedScenario.example || examples.find((example) => example.id === selectedExampleId) || examples[0],
    [selectedExampleId, suppliedScenario.example]
  );
  const result = useMemo(
    () => solveSubsetDP(currentExample.vertices, currentExample.edgesD, currentExample.edgesG),
    [currentExample]
  );
  const traceEvents = result.trace;
  const activeIndex = resolveIndex(currentStepIndex, traceEvents.length);
  const activeEvent = activeIndex >= 0 ? traceEvents[activeIndex] : null;
  const activeEventId = activeEvent ? eventId(selectedExampleId, activeEvent, activeIndex) : null;
  const activePath = activeEvent?.state?.path || activeEvent?.bestPath || [];
  const activeInspectorKey = activeEvent?.type === 'transition'
    ? 'transition'
    : activeEvent?.type === 'proof-complete'
      ? 'proof'
      : activeEvent?.state
        ? 'state'
        : null;
  const { cockpitRef, traceScrollerRef, setInspectorScrollerRef } = useMethodCockpitSync(
    activeIndex,
    activeInspectorKey,
    traceEvents,
    activeEventId
  );

  const handleStepChange = (index: number) => setCurrentStepIndex(resolveIndex(index, traceEvents.length));
  const handleExampleSelect = (id: string) => {
    setSelectedExampleId(id);
    setCurrentStepIndex(-1);
  };

  const comparisonRows = [
    ['Legacy', 'Exhaustive simple-path enumeration'],
    ['CP2', 'Safe branch-and-bound'],
    ['ILP2', 'Rooted connectivity formulation'],
    ['Subset DP', 'Dynamic programming over subset and endpoint'],
  ];

  return (
    <div style={{ textAlign: isAr ? 'right' : 'left', direction: isAr ? 'rtl' : 'ltr' }}>
      <ScenarioHandoffBanner lang={lang} scenario={suppliedScenario.scenario} error={suppliedScenario.error} />
      <header style={{ marginBlockEnd: 'var(--space-md)' }}>
        <h2 style={{ fontSize: '1.6rem', color: 'var(--primary)', border: 'none', marginBlockEnd: 'var(--space-sm)', padding: 0 }}>
          {t.title}
        </h2>
        <p style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--primary)', backgroundColor: 'var(--primary-bg)', border: '1px solid var(--primary)', borderRadius: 'var(--radius-sm)', padding: 'var(--space-sm)' }}>
          {t.badge}
        </p>
      </header>

      <MethodEducationBlock methodId="subset-dp" lang={lang} />

      <section className="card" style={{ marginBlockEnd: 'var(--space-md)' }}>
        <p style={{ marginBlockStart: 0 }}>{t.intro}</p>
        <div className="grid grid-2" style={{ fontSize: '0.9rem' }}>
          <p>{t.repeated}</p>
          <p>{t.stateEnough}</p>
          <p>{t.dominance}</p>
          <p>{t.limited}</p>
        </div>
      </section>

      <section className="card" style={{ padding: 'var(--space-md)', marginBlockEnd: 'var(--space-md)' }}>
        <label style={{ display: 'grid', gap: 'var(--space-xs)', maxWidth: 360 }}>
          <span style={{ fontWeight: 700 }}>{t.select}</span>
          <select value={selectedExampleId} onChange={(event) => handleExampleSelect(event.target.value)} style={{ padding: 'var(--space-sm)', minHeight: 44, borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
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
            currentStepIndex={activeIndex}
            totalSteps={traceEvents.length}
            onStepChange={handleStepChange}
            onReset={() => setCurrentStepIndex(-1)}
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
              isFinalResult={activeEvent?.type === 'proof-complete'}
              isAcceptedStep={activeEvent?.genomicConnected === true || activeEvent?.type === 'proof-complete' || activeEvent?.type === 'incumbent-update'}
              lang={lang}
              dict={dict}
              mobileActiveTab={viewTab}
            />
          </>
        )}
        state={(
          <section className="card">
            <h3 style={{ color: 'var(--primary)', fontSize: '1.1rem' }}>
              <span className="icon-label"><Icon name="clipboard" /> {t.currentState}</span>
            </h3>
            <dl ref={setInspectorScrollerRef} data-testid="method-inspector-scroll" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-sm)', fontSize: '0.9rem', overflowY: 'auto' }}>
              <dt data-inspector-key="state" className={activeInspectorKey === 'state' ? 'method-cockpit__active-row' : ''}>{t.selectedSet}</dt>
              <dd dir="ltr">{subsetText(activeEvent, t.none)}</dd>
              <dt>{t.lastVertex}</dt>
              <dd dir="ltr">{activeEvent?.state?.lastVertex || t.none}</dd>
              <dt>{t.path}</dt>
              <dd dir="ltr">{pathText(activeEvent?.state?.path, t.none)}</dd>
            </dl>
            <h3 style={{ color: 'var(--primary)', fontSize: '1.1rem', marginBlockStart: 'var(--space-md)' }}>
              <span className="icon-label"><Icon name="search" /> {t.inspector}</span>
            </h3>
            <dl style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-sm)', fontSize: '0.9rem' }}>
              <dt>{t.mask}</dt><dd dir="ltr">{maskText(activeEvent, t.none)}</dd>
              <dt>{t.retainedPath}</dt><dd dir="ltr">{pathText(activeEvent?.bestPath || activeEvent?.state?.path, t.none)}</dd>
              <dt>{t.status}</dt><dd>{activeEvent?.state?.status || result.status}</dd>
            </dl>
          </section>
        )}
        constraints={(
          <section className="card">
            <h3 style={{ color: 'var(--primary)', fontSize: '1.1rem' }}>
              <span className="icon-label"><Icon name="shield" /> {t.transition}</span>
            </h3>
            <dl style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-sm)', fontSize: '0.9rem' }}>
              <dt data-inspector-key="transition" className={activeInspectorKey === 'transition' ? 'method-cockpit__active-row' : ''}>{t.candidateNext}</dt>
              <dd dir="ltr">{activeEvent?.candidateNext || t.none}</dd>
              <dt>{t.newToSubset}</dt><dd>{activeEvent?.isNewToSubset === undefined ? t.none : activeEvent.isNewToSubset ? t.yes : t.no}</dd>
              <dt>{t.genomic}</dt><dd>{activeEvent?.genomicConnected === undefined ? t.none : activeEvent.genomicConnected ? t.yes : t.no}</dd>
              <dt>{t.retained}</dt><dd>{activeEvent?.dominated ? 'dominated' : activeEvent?.retained ? 'retained' : t.none}</dd>
            </dl>
            <h3 style={{ color: 'var(--primary)', fontSize: '1.1rem', marginBlockStart: 'var(--space-md)' }}>
              <span className="icon-label"><Icon name="check" /> {t.proof}</span>
            </h3>
            <dl style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-sm)', fontSize: '0.9rem' }}>
              <dt data-inspector-key="proof" className={activeInspectorKey === 'proof' ? 'method-cockpit__active-row' : ''}>{t.searchCompleted}</dt><dd>{result.searchCompleted ? t.yes : t.no}</dd>
              <dt>{t.proofComplete}</dt><dd>{result.proofCompleteEmitted ? t.yes : t.no}</dd>
              <dt>{t.cap}</dt><dd>{result.interruptedByCap ? t.yes : t.no}</dd>
              <dt>{t.cancelled}</dt><dd>{result.cancelled ? t.yes : t.no}</dd>
            </dl>
            <p style={{ marginBlockEnd: 0, color: 'var(--primary)', fontWeight: 700 }}>
              {result.status === 'optimal' || result.status === 'no-solution' ? t.exact : t.incomplete}
            </p>
          </section>
        )}
        trace={(
          <section className="card" style={{ display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ color: 'var(--primary)', fontSize: '1.1rem', marginBlockEnd: 'var(--space-sm)' }}>
              <span className="icon-label"><Icon name="ledger" /> {t.trace}</span>
            </h3>
            <article
              data-testid="subset-dp-current-event-card"
              data-event-type={activeEvent?.type || ''}
              style={{ marginBlockEnd: 'var(--space-sm)', padding: 'var(--space-sm)', border: '2px solid var(--accent-gold)', borderInlineStart: '8px solid var(--accent-gold)', borderRadius: 'var(--radius-sm)', background: 'var(--primary-bg)' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 'var(--space-sm)', flexWrap: 'wrap' }}>
                <strong style={{ color: 'var(--primary)' }}>{t.currentEvent}</strong>
                {activeEvent && <span style={{ background: 'var(--accent-gold)', color: 'var(--primary)', borderRadius: 'var(--radius-sm)', padding: '2px 8px', fontSize: '0.7rem', fontWeight: 900 }}>{t.activeStep}</span>}
              </div>
              <div style={{ color: 'var(--primary)', fontWeight: 900 }}>{activeEvent ? `${activeIndex + 1} / ${traceEvents.length}` : `0 / ${traceEvents.length}`}</div>
              <div style={{ color: 'var(--primary)', fontWeight: 900, fontSize: '0.78rem', textTransform: 'uppercase' }}>{activeEvent?.type || t.noActiveEvent}</div>
              <p style={{ marginBlockEnd: 0, fontSize: '0.86rem' }}>{activeEvent?.message || t.noActiveEvent}</p>
            </article>
            <h4 style={{ color: 'var(--primary)', fontSize: '0.86rem', marginBlock: '0 var(--space-xs)' }}>{t.traceLedger}</h4>
            <div ref={traceScrollerRef} data-testid="method-trace-scroll" style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
              {traceEvents.map((event, index) => {
                const id = eventId(selectedExampleId, event, index);
                const isActive = id === activeEventId;
                return (
                  <button
                    key={id}
                    type="button"
                    data-trace-index={index}
                    data-event-type={event.type}
                    aria-current={isActive ? 'step' : undefined}
                    className={isActive ? 'method-cockpit__active-row' : undefined}
                    onClick={() => handleStepChange(index)}
                    style={{ textAlign: isAr ? 'right' : 'left', border: isActive ? '2px solid var(--accent-gold)' : '1px solid transparent', borderInlineStart: isActive ? '6px solid var(--accent-gold)' : '3px solid transparent', background: isActive ? 'var(--primary-bg)' : 'transparent', opacity: activeIndex < 0 || index > activeIndex ? 0.52 : 1, padding: '6px var(--space-sm)', cursor: 'pointer', borderRadius: 'var(--radius-sm)', fontFamily: 'inherit' }}
                  >
                    <strong style={{ display: 'block', color: event.type === 'genomic-rejection' || event.type === 'state-dominated' ? 'var(--danger)' : 'var(--primary)', textTransform: 'uppercase', fontSize: '0.72rem' }}>{event.type}</strong>
                    <span style={{ fontSize: '0.82rem' }}>{event.message}</span>
                  </button>
                );
              })}
            </div>
          </section>
        )}
      />

      <section className="grid grid-2" style={{ marginBlock: 'var(--space-md)' }}>
        <div className="card" style={{ margin: 0 }}>
          <h3 style={{ color: 'var(--primary)', fontSize: '1.1rem' }}>{t.counters}</h3>
          <dl style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-xs)', fontSize: '0.9rem' }}>
            <dt>{t.statesCreated}</dt><dd>{result.counters.statesCreated}</dd>
            <dt>{t.statesRetained}</dt><dd>{result.counters.statesRetained}</dd>
            <dt>{t.transitionsEvaluated}</dt><dd>{result.counters.transitionsEvaluated}</dd>
            <dt>{t.disconnectedRejected}</dt><dd>{result.counters.genomicDisconnectedSubsetsRejected}</dd>
            <dt>{t.dominatedDuplicates}</dt><dd>{result.counters.dominatedDuplicateStatesDiscarded}</dd>
          </dl>
        </div>
      </section>

      <details className="card" style={{ marginBlockEnd: 'var(--space-md)' }}>
        <summary style={{ cursor: 'pointer', fontWeight: 700, color: 'var(--primary)', marginBlockEnd: 'var(--space-sm)' }}>
          <span className="icon-label"><Icon name="book" /> {t.comparison}</span>
        </summary>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
            <thead>
              <tr>
                <th style={{ textAlign: isAr ? 'right' : 'left', borderBottom: '2px solid var(--border-color)', padding: 8 }}>{t.method}</th>
                <th style={{ textAlign: isAr ? 'right' : 'left', borderBottom: '2px solid var(--border-color)', padding: 8 }}>{t.coreIdea}</th>
              </tr>
            </thead>
            <tbody>
              {comparisonRows.map(([method, idea]) => (
                <tr key={method}>
                  <td style={{ padding: 8, borderBottom: '1px solid var(--border-color)' }}>{method}</td>
                  <td style={{ padding: 8, borderBottom: '1px solid var(--border-color)' }}>{idea}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>

      <style>{`
        @media (max-width: 767px) {
          .show-mobile-only {
            display: flex !important;
          }
        }
      `}</style>
    </div>
  );
};
