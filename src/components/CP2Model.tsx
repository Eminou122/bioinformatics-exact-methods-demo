import React, { useMemo, useState } from 'react';
import type { Language, TranslationDict } from '../i18n/types';
import { examples } from '../data/examples';
import { solveConsistentPath } from '../domain/pathAlgorithms';
import { solveCP1 } from '../domain/cpSolver';
import { solveCP2, type CP2TraceEvent } from '../domain/cp2Solver';
import { GraphPanel } from './GraphPanel';
import { Icon } from './Icons';
import { MethodCockpit } from './MethodCockpit';
import { MethodPlaybackControls } from './MethodPlaybackControls';
import { useMethodCockpitSync } from './useMethodCockpitSync';
import { ScenarioHandoffBanner } from './ScenarioHandoffBanner';
import { useScenarioHandoffExample } from './useScenarioHandoffExample';
import { MethodEducationBlock } from './MethodEducationBlock';

interface CP2ModelProps {
  lang: Language;
  dict: TranslationDict;
}

const labels = {
  fr: {
    title: 'CP2 — CP1 avec Bornes Supérieures Sûres',
    badge: 'CP2 educational bounded implementation — exact only for small DAG examples.',
    intro: 'CP1 demande : "Ce chemin peut-il devenir valide ?" CP2 ajoute : "Cette branche peut-elle encore devenir meilleure que la meilleure réponse connue ?"',
    incumbent: 'Incumbent : le meilleur chemin valide conservé pendant la recherche.',
    upperBound: 'Borne supérieure : longueur maximale encore possible dans D depuis l’état courant, sans supposer de connexité dans G.',
    pruning: 'Élagage sûr : une branche est coupée seulement si cette borne ne peut pas battre l’incumbent, y compris la règle lexicographique.',
    effort: 'CP2 peut réduire l’effort de recherche en évitant des continuations qui ne peuvent plus améliorer le résultat.',
    sameAnswer: 'Comme la borne surestime ce qui reste possible, CP2 doit retourner le même optimum que CP1 et l’énumération exhaustive quand la preuve est complète.',
    select: 'Exemple',
    start: 'Démarrer CP2',
    prev: 'Précédent',
    next: 'Suivant',
    end: 'Fin',
    reset: 'Réinitialiser',
    partial: 'Chemin partiel',
    currentIncumbent: 'Incumbent actuel',
    currentBound: 'Borne supérieure actuelle',
    explored: 'États explorés',
    pruned: 'États élagués',
    reason: 'Raison',
    trace: 'CP2 Search Trace',
    currentEvent: 'Current event',
    activeStep: 'ACTIVE STEP',
    traceLedger: 'Trace ledger',
    noActiveEvent: 'No active event',
    completion: 'État de complétion',
    exact: 'Exact / preuve complète',
    incomplete: 'Incomplet',
    cancelled: 'Annulé',
    cap: 'Limite d’événements atteinte',
    method: 'Méthode',
    best: 'Meilleur résultat',
    states: 'États explorés',
    prunedStates: 'États élagués',
    completionCol: 'Complétion',
    legacy: 'Énumération Legacy',
    cp1: 'Modèle inspiré CP1',
    cp2: 'Modèle éducatif CP2',
    exactLabel: 'Exact',
    noPath: 'Aucun',
  },
  en: {
    title: 'CP2 — CP1 with Safe Upper Bounds',
    badge: 'CP2 educational bounded implementation — exact only for small DAG examples.',
    intro: 'CP1 asks: "Can this path become valid?" CP2 additionally asks: "Can this branch still become better than the best answer?"',
    incumbent: 'Incumbent: the best valid path retained during search.',
    upperBound: 'Upper bound: the maximum path length still possible in D from the current state, without assuming G connectivity.',
    pruning: 'Safe pruning: a branch is cut only when this bound cannot beat the incumbent, including the lexical tie rule.',
    effort: 'CP2 can reduce search effort by skipping continuations that can no longer improve the result.',
    sameAnswer: 'Because the bound overestimates what remains possible, CP2 must return the same optimum as CP1 and exhaustive enumeration when proof is complete.',
    select: 'Example',
    start: 'Start CP2',
    prev: 'Previous',
    next: 'Next',
    end: 'End',
    reset: 'Reset',
    partial: 'Current partial path',
    currentIncumbent: 'Current incumbent',
    currentBound: 'Current upper bound',
    explored: 'Explored states',
    pruned: 'Pruned states',
    reason: 'Reason',
    trace: 'CP2 Search Trace',
    currentEvent: 'Current event',
    activeStep: 'ACTIVE STEP',
    traceLedger: 'Trace ledger',
    noActiveEvent: 'No active event',
    completion: 'Completion state',
    exact: 'Exact / proof complete',
    incomplete: 'Incomplete',
    cancelled: 'Cancelled',
    cap: 'Event cap reached',
    method: 'Method',
    best: 'Best result',
    states: 'Explored states',
    prunedStates: 'Pruned states',
    completionCol: 'Completion',
    legacy: 'Legacy enumeration',
    cp1: 'CP1-inspired model',
    cp2: 'CP2 educational model',
    exactLabel: 'Exact',
    noPath: 'None',
  },
  ar: {
    title: 'CP2 — CP1 مع حدود عليا آمنة',
    badge: 'CP2 educational bounded implementation — exact only for small DAG examples.',
    intro: 'يسأل CP1: "هل يمكن أن يصبح هذا المسار صالحاً؟" ويضيف CP2: "هل يمكن لهذا الفرع أن يصبح أفضل من أفضل إجابة حالية؟"',
    incumbent: 'Incumbent: أفضل مسار صالح محفوظ أثناء البحث.',
    upperBound: 'الحد الأعلى: أكبر طول مسار ممكن في D من الحالة الحالية، من دون افتراض الاتصال في G.',
    pruning: 'التقليم الآمن: يقطع الفرع فقط عندما لا يمكن لهذا الحد أن يتفوق على Incumbent، مع قاعدة التعادل الأبجدية.',
    effort: 'يمكن أن يقلل CP2 جهد البحث بتجاوز الامتدادات التي لم تعد قادرة على تحسين النتيجة.',
    sameAnswer: 'لأن الحد يبالغ في تقدير ما تبقى ممكناً، يجب أن يرجع CP2 نفس الحل الأمثل مثل CP1 والتعداد الشامل عند اكتمال البرهان.',
    select: 'المثال',
    start: 'بدء CP2',
    prev: 'السابق',
    next: 'التالي',
    end: 'النهاية',
    reset: 'إعادة تعيين',
    partial: 'المسار الجزئي الحالي',
    currentIncumbent: 'Incumbent الحالي',
    currentBound: 'الحد الأعلى الحالي',
    explored: 'الحالات المستكشفة',
    pruned: 'الحالات المقلمة',
    reason: 'السبب',
    trace: 'CP2 Search Trace',
    currentEvent: 'Current event',
    activeStep: 'ACTIVE STEP',
    traceLedger: 'Trace ledger',
    noActiveEvent: 'No active event',
    completion: 'حالة الاكتمال',
    exact: 'دقيق / برهان مكتمل',
    incomplete: 'غير مكتمل',
    cancelled: 'ملغى',
    cap: 'تم بلوغ حد الأحداث',
    method: 'الطريقة',
    best: 'أفضل نتيجة',
    states: 'الحالات المستكشفة',
    prunedStates: 'الحالات المقلمة',
    completionCol: 'الاكتمال',
    legacy: 'التعداد Legacy',
    cp1: 'نموذج مستوحى من CP1',
    cp2: 'نموذج CP2 التعليمي',
    exactLabel: 'دقيق',
    noPath: 'لا يوجد',
  },
} satisfies Record<Language, Record<string, string>>;

function pathText(path: string[] | null): string {
  return path && path.length > 0 ? `\u202A${path.join(' -> ')}\u202C` : 'N/A';
}

function completionLabel(event: CP2TraceEvent | null, result: ReturnType<typeof solveCP2>, t: typeof labels.en): string {
  if (event?.type === 'cancelled' || result.cancelled) return t.cancelled;
  if (event?.type === 'cap-reached' || result.interruptedByCap) return t.cap;
  if (result.status === 'optimal' || result.status === 'no-solution') return t.exact;
  return t.incomplete;
}

function getCP2TraceEventId(exampleId: string, event: CP2TraceEvent, index: number): string {
  return `cp2:${exampleId}:${index + 1}:${event.stepCount}:${event.type}`;
}

function resolveCanonicalStepIndex(index: number, traceLength: number): number {
  if (traceLength <= 0 || index < 0) return -1;
  return Math.min(index, traceLength - 1);
}

function formatTraceType(type: CP2TraceEvent['type'] | undefined): string {
  return type ? type.toUpperCase() : '';
}

export const CP2Model: React.FC<CP2ModelProps> = ({ lang, dict }) => {
  const isAr = lang === 'ar';
  const t = labels[lang];
  const [selectedExampleId, setSelectedExampleId] = useState('multiple-candidates');
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [viewTab, setViewTab] = useState<'D' | 'G'>('D');
  const suppliedScenario = useScenarioHandoffExample();

  const currentExample = useMemo(
    () => suppliedScenario.example || examples.find((ex) => ex.id === selectedExampleId) || examples[0],
    [selectedExampleId, suppliedScenario.example]
  );
  const cp2Result = useMemo(
    () => solveCP2(currentExample.vertices, currentExample.edgesD, currentExample.edgesG),
    [currentExample]
  );
  const cp1Result = useMemo(
    () => solveCP1(currentExample.vertices, currentExample.edgesD, currentExample.edgesG),
    [currentExample]
  );
  const legacyResult = useMemo(
    () => solveConsistentPath(currentExample.vertices, currentExample.edgesD, currentExample.edgesG),
    [currentExample]
  );

  const traceEvents = cp2Result.trace;
  const canonicalStepIndex = resolveCanonicalStepIndex(currentStepIndex, traceEvents.length);
  const canonicalTraceEvent = canonicalStepIndex >= 0 ? traceEvents[canonicalStepIndex] : null;
  const canonicalTraceOrdinal = canonicalStepIndex >= 0 ? canonicalStepIndex + 1 : 0;
  const canonicalTraceEventId = canonicalTraceEvent ? getCP2TraceEventId(selectedExampleId, canonicalTraceEvent, canonicalStepIndex) : null;
  const isRunning = canonicalTraceEvent !== null;
  const activePath = canonicalTraceEvent?.currentPath || [];
  const activeInspectorKey = canonicalTraceEvent?.variable || (
    canonicalTraceEvent?.type === 'upper-bound' || canonicalTraceEvent?.type === 'bound-pruning'
      ? 'currentBound'
      : canonicalTraceEvent?.type === 'incumbent-update'
        ? 'currentIncumbent'
        : canonicalTraceEvent
          ? 'partial'
          : null
  );
  const { cockpitRef, traceScrollerRef, setInspectorScrollerRef } = useMethodCockpitSync(
    canonicalStepIndex,
    activeInspectorKey,
    traceEvents,
    canonicalTraceEventId
  );

  const handleStepChange = (index: number) => {
    setCurrentStepIndex(resolveCanonicalStepIndex(index, traceEvents.length));
  };

  const handleExampleSelect = (id: string) => {
    setSelectedExampleId(id);
    setCurrentStepIndex(-1);
  };

  const rows = [
    {
      method: t.legacy,
      best: legacyResult.longestConsistentPath,
      explored: legacyResult.evaluatedPathsCount,
      pruned: 0,
      completion: legacyResult.error ? t.incomplete : t.exactLabel,
    },
    {
      method: t.cp1,
      best: cp1Result.bestPath,
      explored: cp1Result.trace.length,
      pruned: cp1Result.trace.filter((e) => e.type === 'contradiction').length,
      completion: cp1Result.status === 'optimal' || cp1Result.status === 'no-solution' ? t.exact : t.incomplete,
    },
    {
      method: t.cp2,
      best: cp2Result.bestPath,
      explored: cp2Result.exploredStates,
      pruned: cp2Result.prunedStates,
      completion: cp2Result.status === 'optimal' || cp2Result.status === 'no-solution' ? t.exact : t.incomplete,
    },
  ];

  return (
    <div style={{ textAlign: isAr ? 'right' : 'left', direction: isAr ? 'rtl' : 'ltr' }}>
      <ScenarioHandoffBanner lang={lang} scenario={suppliedScenario.scenario} returnTo={suppliedScenario.returnTo} error={suppliedScenario.error} />
      <div className="sr-only" aria-live="assertive">{canonicalTraceEvent?.message || ''}</div>
      <header style={{ marginBlockEnd: 'var(--space-md)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 'var(--space-sm)', flexWrap: 'wrap', alignItems: 'center' }}>
          <h2 style={{ fontSize: '1.6rem', color: 'var(--primary)', border: 'none', margin: 0, padding: 0 }}>{t.title}</h2>
          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--primary)', backgroundColor: 'var(--primary-bg)', border: '1px solid var(--primary)', borderRadius: 'var(--radius-sm)', padding: 'var(--space-xs) var(--space-sm)' }}>
            Exact small-graph implementation
          </span>
        </div>
        <p style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--neutral-medium)', backgroundColor: 'var(--neutral-bg-hover)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: 'var(--space-sm)' }}>
          {t.badge}
        </p>
      </header>

      <MethodEducationBlock methodId="cp2" lang={lang} />

      <section className="card" style={{ marginBlockEnd: 'var(--space-md)' }}>
        <p style={{ marginBlockStart: 0 }}>{t.intro}</p>
        <div className="grid grid-2" style={{ fontSize: '0.9rem' }}>
          <p>{t.incumbent}</p>
          <p>{t.upperBound}</p>
          <p>{t.pruning}</p>
          <p>{t.effort}</p>
        </div>
        <p style={{ marginBlockEnd: 0, color: 'var(--primary)', fontWeight: 700 }}>{t.sameAnswer}</p>
      </section>

      <section className="card" style={{ padding: 'var(--space-md)', marginBlockEnd: 'var(--space-md)' }}>
        <label style={{ display: 'grid', gap: 'var(--space-xs)', maxWidth: '360px' }}>
          <span style={{ fontWeight: 700 }}>{t.select}</span>
          <select value={selectedExampleId} onChange={(e) => handleExampleSelect(e.target.value)} disabled={isRunning} style={{ padding: 'var(--space-sm)', minHeight: '44px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
            {examples.map((ex) => (
              <option key={ex.id} value={ex.id}>
                {lang === 'fr' ? ex.titleFr : lang === 'ar' ? ex.titleAr : ex.titleEn}
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
            currentStepIndex={canonicalStepIndex}
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
              isFinalResult={canonicalTraceEvent?.type === 'proof-complete'}
              isAcceptedStep={canonicalTraceEvent?.type === 'candidate-path' || canonicalTraceEvent?.type === 'incumbent-update' || canonicalTraceEvent?.type === 'proof-complete'}
              lang={lang}
              dict={dict}
              mobileActiveTab={viewTab}
            />
          </>
        )}
        state={(
          <section className="card">
          <h3 style={{ color: 'var(--primary)', fontSize: '1.1rem' }}><span className="icon-label"><Icon name="clipboard" /> {t.completion}</span></h3>
          <dl ref={setInspectorScrollerRef} data-testid="method-inspector-scroll" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-sm)', fontSize: '0.9rem', overflowY: 'auto' }}>
            {canonicalTraceEvent?.variable && (
              <>
                <dt data-inspector-key={canonicalTraceEvent.variable} className={activeInspectorKey === canonicalTraceEvent.variable ? 'method-cockpit__active-row' : ''}>Variable</dt><dd dir="ltr">{canonicalTraceEvent.variable}</dd>
              </>
            )}
            <dt data-inspector-key="partial" className={activeInspectorKey === 'partial' ? 'method-cockpit__active-row' : ''}>{t.partial}</dt><dd dir="ltr">{pathText(activePath)}</dd>
            <dt data-inspector-key="currentIncumbent" className={activeInspectorKey === 'currentIncumbent' ? 'method-cockpit__active-row' : ''}>{t.currentIncumbent}</dt><dd dir="ltr">{pathText(canonicalTraceEvent?.bestPath || cp2Result.bestPath)}</dd>
            <dt data-inspector-key="currentBound" className={activeInspectorKey === 'currentBound' ? 'method-cockpit__active-row' : ''}>{t.currentBound}</dt><dd>{canonicalTraceEvent?.upperBound ?? '-'}</dd>
            <dt data-inspector-key="explored" className={activeInspectorKey === 'explored' ? 'method-cockpit__active-row' : ''}>{t.explored}</dt><dd>{canonicalTraceEvent?.exploredStates ?? cp2Result.exploredStates}</dd>
            <dt data-inspector-key="pruned" className={activeInspectorKey === 'pruned' ? 'method-cockpit__active-row' : ''}>{t.pruned}</dt><dd>{canonicalTraceEvent?.prunedStates ?? cp2Result.prunedStates}</dd>
            <dt data-inspector-key="reason" className={activeInspectorKey === 'reason' ? 'method-cockpit__active-row' : ''}>{t.reason}</dt><dd>{canonicalTraceEvent?.reason || '-'}</dd>
          </dl>
          <p style={{ marginBlockEnd: 0, fontWeight: 700, color: 'var(--primary)' }}>{completionLabel(canonicalTraceEvent, cp2Result, t as typeof labels.en)}</p>
          </section>
        )}
        constraints={(
          <section className="card">
            <h3 style={{ color: 'var(--primary)', fontSize: '1.1rem' }}><span className="icon-label"><Icon name="shield" /> {t.pruning}</span></h3>
            <p>{t.upperBound}</p>
            <p>{t.pruning}</p>
            <p style={{ marginBlockEnd: 0, color: 'var(--primary)', fontWeight: 700 }}>{t.sameAnswer}</p>
          </section>
        )}
        trace={(
        <section className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ color: 'var(--primary)', fontSize: '1.1rem', marginBlockEnd: 'var(--space-sm)' }}><span className="icon-label"><Icon name="ledger" /> {t.trace}</span></h3>
          <article
            data-testid="cp2-active-trace-state"
            data-current-step-index={canonicalStepIndex}
            data-trace-event-id={canonicalTraceEventId || ''}
            data-event-type={canonicalTraceEvent?.type || ''}
            style={{
              marginBlockEnd: 'var(--space-sm)',
              padding: 'var(--space-sm)',
              border: '2px solid var(--accent-gold)',
              borderInlineStart: '8px solid var(--accent-gold)',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--primary-bg)',
              boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 'var(--space-sm)', alignItems: 'center', flexWrap: 'wrap', marginBlockEnd: 'var(--space-xs)' }}>
              <strong data-testid="cp2-current-event-title" style={{ color: 'var(--primary)', fontSize: '0.86rem' }}>{t.currentEvent}</strong>
              {isRunning && canonicalTraceEvent && (
                <span data-testid="cp2-current-event-status" style={{ background: 'var(--accent-gold)', color: 'var(--primary)', borderRadius: 'var(--radius-sm)', padding: '2px 8px', fontSize: '0.7rem', fontWeight: 900, letterSpacing: 0 }}>
                  {t.activeStep}
                </span>
              )}
            </div>
            <div data-testid="cp2-current-event-ordinal" style={{ color: 'var(--primary)', fontWeight: 900, fontSize: '1rem' }}>
              {isRunning && canonicalTraceEvent ? `${canonicalTraceOrdinal} / ${traceEvents.length}` : `0 / ${traceEvents.length}`}
            </div>
            <div data-testid="cp2-current-event-type" style={{ color: 'var(--primary)', fontWeight: 900, fontSize: '0.78rem', textTransform: 'uppercase', marginBlockStart: 2 }}>
              {formatTraceType(canonicalTraceEvent?.type) || t.noActiveEvent}
            </div>
            <p data-testid="cp2-current-event-description" style={{ marginBlockEnd: 0, fontSize: '0.86rem' }}>
              {canonicalTraceEvent?.message || t.noActiveEvent}
            </p>
          </article>
          <h4 style={{ color: 'var(--primary)', fontSize: '0.86rem', marginBlock: '0 var(--space-xs)' }}>{t.traceLedger}</h4>
          <div ref={traceScrollerRef} data-testid="method-trace-scroll" style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {traceEvents.map((event, idx) => {
              const eventId = getCP2TraceEventId(selectedExampleId, event, idx);
              const isActive = eventId === canonicalTraceEventId;
              const isFuture = canonicalStepIndex < 0 || idx > canonicalStepIndex;
              return (
                <button
                  key={eventId}
                  data-trace-index={idx}
                  data-trace-event-id={eventId}
                  data-event-type={event.type}
                  data-active-trace={isActive ? 'true' : 'false'}
                  data-current-step-index={isActive ? canonicalStepIndex : undefined}
                  type="button"
                  aria-pressed={isActive}
                  aria-current={isActive ? 'step' : undefined}
                  className={isActive ? 'method-cockpit__active-row' : undefined}
                  onClick={() => handleStepChange(idx)}
                  style={{ textAlign: isAr ? 'right' : 'left', border: isActive ? '2px solid var(--accent-gold)' : '1px solid transparent', borderInlineStart: isActive ? '6px solid var(--accent-gold)' : '3px solid transparent', background: isActive ? 'var(--primary-bg)' : 'transparent', opacity: isFuture ? 0.52 : 1, padding: '6px var(--space-sm)', cursor: 'pointer', borderRadius: 'var(--radius-sm)', fontFamily: 'inherit' }}
                >
                  {isActive && (
                    <span data-testid="cp2-current-event-label" style={{ display: 'block', fontSize: '0.72rem', fontWeight: 800, color: 'var(--accent-gold)', marginBlockEnd: 2 }}>
                      {t.activeStep}
                    </span>
                  )}
                  <strong style={{ display: 'block', color: event.type === 'bound-pruning' || event.type === 'genomic-rejection' ? 'var(--danger)' : 'var(--primary)', textTransform: 'uppercase', fontSize: '0.72rem' }}>{formatTraceType(event.type)}</strong>
                  <span data-testid={isActive ? 'cp2-active-trace-message' : undefined} style={{ fontSize: '0.82rem' }}>{event.message}</span>
                </button>
              );
            })}
          </div>
        </section>
        )}
      />

      <details className="card" style={{ marginBlockEnd: 'var(--space-md)' }}>
        <summary style={{ cursor: 'pointer', fontWeight: 700, color: 'var(--primary)', marginBlockEnd: 'var(--space-sm)' }}>
          <span className="icon-label"><Icon name="search" /> CP1 / CP2 / Legacy</span>
        </summary>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
            <thead>
              <tr>
                <th style={{ textAlign: isAr ? 'right' : 'left', borderBottom: '2px solid var(--border-color)', padding: '8px' }}>{t.method}</th>
                <th style={{ textAlign: isAr ? 'right' : 'left', borderBottom: '2px solid var(--border-color)', padding: '8px' }}>{t.best}</th>
                <th style={{ textAlign: 'end', borderBottom: '2px solid var(--border-color)', padding: '8px' }}>{t.states}</th>
                <th style={{ textAlign: 'end', borderBottom: '2px solid var(--border-color)', padding: '8px' }}>{t.prunedStates}</th>
                <th style={{ textAlign: isAr ? 'right' : 'left', borderBottom: '2px solid var(--border-color)', padding: '8px' }}>{t.completionCol}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.method}>
                  <td style={{ padding: '8px', borderBottom: '1px solid var(--border-color)' }}>{row.method}</td>
                  <td style={{ padding: '8px', borderBottom: '1px solid var(--border-color)' }} dir="ltr">{row.best ? pathText(row.best) : t.noPath}</td>
                  <td style={{ padding: '8px', borderBottom: '1px solid var(--border-color)', textAlign: 'end' }}>{row.explored}</td>
                  <td style={{ padding: '8px', borderBottom: '1px solid var(--border-color)', textAlign: 'end' }}>{row.pruned}</td>
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
