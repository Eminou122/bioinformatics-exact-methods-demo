import React, { useMemo, useState } from 'react';
import type { Language, TranslationDict } from '../i18n/types';
import { solveCP2Plus, type CP2PlusTraceEvent } from '../domain/cp2PlusSolver';
import { cp2PlusTeachingExamples, type CP2PlusExpectedBehavior } from '../data/cp2PlusExamples';
import { GraphPanel } from './GraphPanel';
import { Icon } from './Icons';
import { MethodCockpit } from './MethodCockpit';
import { MethodPlaybackControls } from './MethodPlaybackControls';
import { useMethodCockpitSync } from './useMethodCockpitSync';
import { Link } from './Navigation';
import { ScenarioHandoffBanner } from './ScenarioHandoffBanner';
import { useScenarioHandoffExample } from './useScenarioHandoffExample';

interface CP2PlusModelProps {
  lang: Language;
  dict: TranslationDict;
  navigate: (path: string) => void;
}

const labels = {
  fr: {
    title: 'CP2+ — Propagation sûre de faisabilité génomique',
    description: 'Une implémentation CP2 améliorée qui ajoute un élagage précoce sûr de l’impossibilité génomique. Elle reste exacte lorsque la recherche se termine.',
    honesty: 'CP2+ est une spécialisation à une extrémité intégrée à CP2. Ce n’est ni une nouvelle méthode de recherche ni une reproduction d’article.',
    explanation: 'CP2+ conserve la borne de plus long suffixe dirigé de CP2. Il coupe aussi une branche seulement si même tous les sommets inutilisés atteignables vers l’avant ne peuvent reconnecter les sommets déjà sélectionnés dans G.',
    necessary: 'Ce test est une condition nécessaire seulement : une reconnexion possible dans le graphe relâché ne garantit pas qu’une complétion dirigée existe.',
    examples: 'Exemples pédagogiques',
    graphSummary: 'Résumé des graphes',
    expected: 'Comportement attendu',
    genomicPrune: 'Élagage génomique',
    noGenomicPrune: 'Aucun élagage génomique',
    directedBoundPrune: 'Élagage par borne dirigée',
    tieBreak: 'Départage',
    start: 'Démarrer CP2+',
    previous: 'Précédent',
    next: 'Suivant',
    end: 'Fin',
    reset: 'Réinitialiser',
    currentEvent: 'Événement courant',
    noEvent: 'Aucun événement actif',
    activeStep: 'ÉTAPE ACTIVE',
    step: 'ÉTAPE',
    stepA11y: 'Étape',
    of: 'sur',
    trace: 'Journal de trace',
    status: 'Preuve et statut',
    exact: 'Exact / preuve complète',
    incomplete: 'Incomplet',
    path: 'Chemin courant',
    incumbent: 'Meilleur chemin',
    bound: 'Borne dirigée',
    frontier: 'Sommets atteignables vers l’avant',
    components: 'Composantes génomiques actuelles',
    reason: 'Raison',
    counters: 'Compteurs CP2+',
    checks: 'Vérifications de propagation génomique',
    genomicPrunes: 'Élagages génomiques sûrs',
    boundPrunes: 'Élagages par borne dirigée',
    states: 'États explorés',
    events: 'Événements émis',
    comparison: 'Comparaison des élagages supplémentaires',
    method: 'Méthode',
    additional: 'Élagage supplémentaire',
    cp2Additional: 'Borne dirigée du plus long chemin',
    cp2PlusAdditional: 'Borne CP2 + propagation sûre de faisabilité génomique',
    bbAdditional: 'Test relâché de reconnexion génomique à deux extrémités',
    empty: 'Aucun',
    comparisonLab: 'Voir le laboratoire de comparaison',
    comparisonLabHint: 'Évalue les preuves du benchmark complet, pas l’exemple pédagogique actuellement sélectionné.',
  },
  en: {
    title: 'CP2+ — Safe Genomic-Feasibility Propagation',
    description: 'An enhanced CP2 implementation that adds a safe early genomic-impossibility prune. It remains exact when search completes.',
    honesty: 'CP2+ is a one-ended specialization integrated into CP2. It is not a new research method or a paper reproduction.',
    explanation: 'CP2+ preserves CP2’s directed longest-suffix bound. It also cuts a branch only when even all forward-reachable unused vertices cannot reconnect the already selected vertices in G.',
    necessary: 'This is only a necessary-condition test: reconnection in the relaxed graph does not certify that a directed completion exists.',
    examples: 'Teaching Examples',
    graphSummary: 'D/G graph summary',
    expected: 'Expected behavior',
    genomicPrune: 'Genomic prune',
    noGenomicPrune: 'No genomic prune',
    directedBoundPrune: 'Directed-bound prune',
    tieBreak: 'Tie-break',
    start: 'Start CP2+',
    previous: 'Previous',
    next: 'Next',
    end: 'End',
    reset: 'Reset',
    currentEvent: 'Current Event',
    noEvent: 'No active event',
    activeStep: 'ACTIVE STEP',
    step: 'STEP',
    stepA11y: 'Step',
    of: 'of',
    trace: 'Trace journal',
    status: 'Proof and status',
    exact: 'Exact / proof complete',
    incomplete: 'Incomplete',
    path: 'Current path',
    incumbent: 'Incumbent',
    bound: 'Directed bound',
    frontier: 'Forward-reachable vertices',
    components: 'Current genomic components',
    reason: 'Reason',
    counters: 'CP2+ counters',
    checks: 'Genomic propagation checks',
    genomicPrunes: 'Safe genomic prunes',
    boundPrunes: 'Directed-bound prunes',
    states: 'States explored',
    events: 'Events emitted',
    comparison: 'Additional-pruning comparison',
    method: 'Method',
    additional: 'Additional pruning',
    cp2Additional: 'Directed longest-path bound',
    cp2PlusAdditional: 'CP2 bound + safe genomic-feasibility propagation',
    bbAdditional: 'Two-ended relaxed genomic reconnection check',
    empty: 'None',
    comparisonLab: 'View Comparison Lab',
    comparisonLabHint: 'Evaluates evidence from the full benchmark corpus, not the currently selected teaching example.',
  },
  ar: {
    title: 'CP2+ — الانتشار الآمن لإمكان الاتصال الجينومي',
    description: 'تطبيق محسن لـ CP2 يضيف تقليماً مبكراً وآمناً عند استحالة الاتصال الجينومي. ويظل دقيقاً عند اكتمال البحث.',
    honesty: 'CP2+ تخصيص أحادي الطرف مدمج في CP2. ليس طريقة بحث جديدة ولا إعادة إنتاج لورقة علمية.',
    explanation: 'يحافظ CP2+ على حد CP2 لأطول لاحقة موجهة. ويقطع الفرع فقط إذا كانت كل الرؤوس غير المستخدمة القابلة للوصول إلى الأمام غير قادرة على إعادة وصل الرؤوس المحددة في G.',
    necessary: 'هذا اختبار لشرط ضروري فقط: إمكان الاتصال في المخطط المرخى لا يثبت وجود إكمال موجه.',
    examples: 'الأمثلة التعليمية',
    graphSummary: 'ملخص المخططين D/G',
    expected: 'السلوك المتوقع',
    genomicPrune: 'تقليم جينومي',
    noGenomicPrune: 'لا يوجد تقليم جينومي',
    directedBoundPrune: 'تقليم بالحد الموجه',
    tieBreak: 'كسر التعادل',
    start: 'بدء CP2+',
    previous: 'السابق',
    next: 'التالي',
    end: 'النهاية',
    reset: 'إعادة تعيين',
    currentEvent: 'الحدث الحالي',
    noEvent: 'لا يوجد حدث نشط',
    activeStep: 'الخطوة النشطة',
    step: 'الخطوة',
    stepA11y: 'الخطوة',
    of: 'من',
    trace: 'سجل التتبع',
    status: 'البرهان والحالة',
    exact: 'دقيق / البرهان مكتمل',
    incomplete: 'غير مكتمل',
    path: 'المسار الحالي',
    incumbent: 'أفضل مسار حالي',
    bound: 'الحد الموجه',
    frontier: 'الرؤوس القابلة للوصول إلى الأمام',
    components: 'المكونات الجينومية الحالية',
    reason: 'السبب',
    counters: 'عدادات CP2+',
    checks: 'فحوص انتشار الاتصال الجينومي',
    genomicPrunes: 'عمليات التقليم الجينومي الآمن',
    boundPrunes: 'عمليات التقليم بالحد الموجه',
    states: 'الحالات المستكشفة',
    events: 'الأحداث الصادرة',
    comparison: 'مقارنة التقليم الإضافي',
    method: 'الطريقة',
    additional: 'التقليم الإضافي',
    cp2Additional: 'حد أطول مسار موجه',
    cp2PlusAdditional: 'حد CP2 مع انتشار آمن لإمكان الاتصال الجينومي',
    bbAdditional: 'فحص مرخى ثنائي الطرف لإعادة الاتصال الجينومي',
    empty: 'لا يوجد',
    comparisonLab: 'عرض مختبر المقارنة',
    comparisonLabHint: 'يقيّم أدلة متن المعيار الكامل، وليس المثال التعليمي المحدد حالياً.',
  },
} satisfies Record<Language, Record<string, string>>;

function pathText(path: string[] | null | undefined, empty: string): string {
  return path && path.length > 0 ? `\u202A${path.join(' → ')}\u202C` : empty;
}

function listText(values: string[] | undefined, empty: string): string {
  return values && values.length > 0 ? values.join(', ') : empty;
}

function componentsText(components: string[][] | undefined, empty: string): string {
  return components && components.length > 0
    ? components.map((component) => `{${component.join(', ')}}`).join('  |  ')
    : empty;
}

function eventId(exampleId: string, event: CP2PlusTraceEvent, index: number): string {
  return `cp2-plus:${exampleId}:${index}:${event.stepCount}:${event.type}`;
}

function traceLabel(type: CP2PlusTraceEvent['type']): string {
  if (type === 'genomic-propagation-prune') return 'SAFE GENOMIC PRUNE';
  if (type === 'bound-pruning') return 'DIRECTED BOUND PRUNE';
  return type.toUpperCase();
}

function behaviorLabel(behavior: CP2PlusExpectedBehavior, t: typeof labels.en): string {
  if (behavior === 'genomic-prune') return t.genomicPrune;
  if (behavior === 'directed-bound-prune') return t.directedBoundPrune;
  if (behavior === 'tie-break') return t.tieBreak;
  return t.noGenomicPrune;
}

export const CP2PlusModel: React.FC<CP2PlusModelProps> = ({ lang, dict, navigate }) => {
  const t = labels[lang];
  const isAr = lang === 'ar';
  const [selectedId, setSelectedId] = useState(cp2PlusTeachingExamples[0].id);
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [viewTab, setViewTab] = useState<'D' | 'G'>('D');
  const suppliedScenario = useScenarioHandoffExample();
  const currentExample = useMemo(() => {
    if (!suppliedScenario.example) {
      return cp2PlusTeachingExamples.find((example) => example.id === selectedId) ?? cp2PlusTeachingExamples[0];
    }
    return {
      ...suppliedScenario.example,
      objective: {
        fr: 'Inspecter le scénario personnalisé avec la vraie trace CP2+.',
        en: 'Inspect the custom scenario with the real CP2+ trace.',
        ar: 'فحص السيناريو المخصص باستخدام أثر CP2+ الحقيقي.',
      },
      graphSummary: `${suppliedScenario.example.vertices.length} vertices, ${suppliedScenario.example.edgesD.length} D arcs, ${suppliedScenario.example.edgesG.length} G edges`,
      expectedBehavior: 'no-genomic-prune' as CP2PlusExpectedBehavior,
    };
  }, [selectedId, suppliedScenario.example]);
  const result = useMemo(
    () => solveCP2Plus(currentExample.vertices, currentExample.edgesD, currentExample.edgesG),
    [currentExample]
  );
  const trace = result.trace;
  const stepIndex = currentStepIndex < 0 ? -1 : Math.min(currentStepIndex, trace.length - 1);
  const event = stepIndex >= 0 ? trace[stepIndex] : null;
  const activeEventId = event ? eventId(selectedId, event, stepIndex) : null;
  const activeInspectorKey = event?.type.includes('genomic-propagation')
    ? 'frontier'
    : event?.type === 'upper-bound' || event?.type === 'bound-pruning'
      ? 'bound'
      : event ? 'path' : null;
  const { cockpitRef, traceScrollerRef, setInspectorScrollerRef } = useMethodCockpitSync(
    stepIndex,
    activeInspectorKey,
    trace,
    activeEventId
  );
  const activeCounters = event?.counters ?? result.counters;
  const activePath = event?.currentPath ?? [];
  const exact = result.status === 'optimal' || result.status === 'no-solution';
  const currentOrdinal = stepIndex + 1;
  const ordinalWidth = Math.max(2, String(trace.length).length);

  return (
    <div data-testid="cp2-plus-page" style={{ direction: isAr ? 'rtl' : 'ltr', textAlign: isAr ? 'right' : 'left' }}>
      <ScenarioHandoffBanner lang={lang} scenario={suppliedScenario.scenario} error={suppliedScenario.error} />
      <header style={{ marginBlockEnd: 'var(--space-md)' }}>
        <h2 style={{ color: 'var(--primary)', border: 0 }}>{t.title}</h2>
        <p style={{ fontWeight: 700 }}>{t.description}</p>
        <p style={{ padding: 'var(--space-sm)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)' }}>{t.honesty}</p>
      </header>

      <section className="card">
        <p>{t.explanation}</p>
        <p style={{ marginBlockEnd: 0, color: 'var(--primary)', fontWeight: 700 }}>{t.necessary}</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 'var(--space-sm)', marginBlockStart: 'var(--space-md)' }}>
          <Link to="/methods/cp2-plus/comparison" navigate={navigate} className="btn btn-primary" style={{ width: 'auto' }}>
            {t.comparisonLab}
          </Link>
          <span style={{ flex: '1 1 16rem', color: 'var(--neutral-medium)', fontSize: '0.85rem' }}>{t.comparisonLabHint}</span>
        </div>
      </section>

      <section className="card" data-testid="cp2-plus-teaching-examples">
        <h3 style={{ color: 'var(--primary)' }}>{t.examples}</h3>
        <div className="cp2-plus-example-grid">
          {cp2PlusTeachingExamples.map((example) => {
            const selected = example.id === selectedId;
            const title = lang === 'fr' ? example.titleFr : lang === 'ar' ? example.titleAr : example.titleEn;
            return (
              <button
                key={example.id}
                type="button"
                aria-pressed={selected}
                data-example-id={example.id}
                onClick={() => {
                  setSelectedId(example.id);
                  setCurrentStepIndex(-1);
                }}
                style={{
                  textAlign: isAr ? 'right' : 'left',
                  padding: 'var(--space-sm)',
                  border: selected ? '2px solid var(--primary)' : '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-sm)',
                  background: selected ? 'var(--primary-bg)' : 'var(--bg-card)',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                <strong style={{ display: 'block', color: 'var(--primary)' }}>{title}</strong>
                <span style={{ display: 'block', marginBlock: 4, color: 'var(--neutral-medium)' }}>{example.objective[lang]}</span>
                <span style={{ display: 'inline-block', padding: '2px 7px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', fontSize: '0.75rem', fontWeight: 800 }}>
                  {behaviorLabel(example.expectedBehavior, t as typeof labels.en)}
                </span>
              </button>
            );
          })}
        </div>
        <div style={{ marginBlockStart: 'var(--space-md)', padding: 'var(--space-sm)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)' }}>
          <p style={{ marginBlockEnd: 'var(--space-xs)', fontWeight: 700 }}>{currentExample.objective[lang]}</p>
          <p dir="ltr" style={{ marginBlockEnd: 'var(--space-xs)' }}><strong>{t.graphSummary}:</strong> <span data-testid="cp2-plus-graph-summary">{currentExample.graphSummary}</span></p>
          <p style={{ marginBlockEnd: 0 }}><strong>{t.expected}:</strong> {behaviorLabel(currentExample.expectedBehavior, t as typeof labels.en)}</p>
        </div>
      </section>

      <MethodCockpit
        cockpitRef={cockpitRef}
        controls={(
          <MethodPlaybackControls
            lang={lang}
            currentStepIndex={stepIndex}
            totalSteps={trace.length}
            onStepChange={(index) => setCurrentStepIndex(Math.max(0, Math.min(index, trace.length - 1)))}
            onReset={() => setCurrentStepIndex(-1)}
            labels={{ start: t.start, previous: t.previous, next: t.next, end: t.end, reset: t.reset }}
          />
        )}
        graph={(
          <div dir="ltr" data-testid="cp2-plus-graph-workspace">
            <div className="cp2-plus-mobile-tabs" style={{ display: 'none', marginBlockEnd: 'var(--space-sm)' }}>
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
              isFinalResult={event?.type === 'proof-complete'}
              isAcceptedStep={event?.type === 'candidate-path' || event?.type === 'incumbent-update' || event?.type === 'proof-complete'}
              lang={lang}
              dict={dict}
              mobileActiveTab={viewTab}
            />
          </div>
        )}
        state={(
          <section className="card" data-testid="cp2-plus-proof-status">
            <h3><span className="icon-label"><Icon name="clipboard" /> {t.status}</span></h3>
            <dl ref={setInspectorScrollerRef} data-testid="method-inspector-scroll" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-sm)' }}>
              <dt data-inspector-key="path">{t.path}</dt><dd dir="ltr">{pathText(activePath, t.empty)}</dd>
              <dt>{t.incumbent}</dt><dd dir="ltr">{pathText(event?.bestPath ?? result.bestPath, t.empty)}</dd>
              <dt data-inspector-key="bound">{t.bound}</dt><dd>{event?.upperBound ?? '-'}</dd>
              <dt data-inspector-key="frontier">{t.frontier}</dt><dd dir="ltr">{listText(event?.forwardReachable, t.empty)}</dd>
              <dt>{t.components}</dt><dd dir="ltr">{componentsText(event?.genomicComponents, t.empty)}</dd>
              <dt>{t.reason}</dt><dd>{event?.reason ?? t.empty}</dd>
            </dl>
            <p style={{ marginBlockEnd: 0, fontWeight: 800, color: 'var(--primary)' }}>{exact ? t.exact : t.incomplete}</p>
          </section>
        )}
        constraints={(
          <section className="card" data-testid="cp2-plus-counters">
            <h3><span className="icon-label"><Icon name="shield" /> {t.counters}</span></h3>
            <dl style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 'var(--space-sm)' }}>
              <dt>{t.checks}</dt><dd>{activeCounters.genomicPropagationChecks}</dd>
              <dt>{t.genomicPrunes}</dt><dd>{activeCounters.genomicPropagationPrunes}</dd>
              <dt>{t.boundPrunes}</dt><dd>{activeCounters.directedBoundPrunes}</dd>
              <dt>{t.states}</dt><dd>{activeCounters.statesExplored}</dd>
              <dt>{t.events}</dt><dd>{activeCounters.eventsEmitted}</dd>
            </dl>
          </section>
        )}
        trace={(
          <section className="card">
            <h3><span className="icon-label"><Icon name="ledger" /> {t.trace}</span></h3>
            <article
              data-testid="cp2-plus-current-event-card"
              style={{ border: '2px solid var(--accent-gold)', borderInlineStart: '8px solid var(--accent-gold)', borderRadius: 'var(--radius-sm)', padding: 'var(--space-sm)', marginBlockEnd: 'var(--space-sm)', background: 'var(--primary-bg)' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--space-xs)', flexWrap: 'wrap' }}>
                <strong>{t.currentEvent}</strong>
                {event && <span style={{ fontWeight: 900 }}>{t.activeStep}</span>}
              </div>
              <div data-testid="cp2-plus-current-event-ordinal" dir="ltr" style={{ unicodeBidi: 'isolate', whiteSpace: 'nowrap', fontWeight: 900, color: 'var(--primary)' }}>
                {t.step} {currentOrdinal} / {trace.length}
              </div>
              <div style={{ fontWeight: 900, color: event?.type === 'genomic-propagation-prune' ? 'var(--danger)' : 'var(--primary)' }}>
                {event ? traceLabel(event.type) : t.noEvent}
              </div>
              <p style={{ marginBlockEnd: 0 }}>{event?.message ?? t.noEvent}</p>
            </article>
            <div ref={traceScrollerRef} data-testid="method-trace-scroll" style={{ overflowY: 'auto', display: 'grid', gap: 4 }}>
              {trace.map((traceEvent, index) => {
                const id = eventId(selectedId, traceEvent, index);
                const active = id === activeEventId;
                return (
                  <button
                    key={id}
                    type="button"
                    data-trace-index={index}
                    data-trace-event-id={id}
                    data-active-trace={active ? 'true' : 'false'}
                    aria-current={active ? 'step' : undefined}
                    aria-label={`${t.stepA11y} ${index + 1} ${t.of} ${trace.length}: ${traceLabel(traceEvent.type)}`}
                    onClick={() => setCurrentStepIndex(index)}
                    className={active ? 'method-cockpit__active-row' : undefined}
                    style={{ textAlign: isAr ? 'right' : 'left', padding: 6, border: active ? '2px solid var(--accent-gold)' : '1px solid transparent', background: active ? 'var(--primary-bg)' : 'transparent', borderRadius: 'var(--radius-sm)' }}
                  >
                    <span dir="ltr" style={{ display: 'block', unicodeBidi: 'isolate', whiteSpace: 'nowrap', fontSize: '0.72rem', fontWeight: 900, color: 'var(--neutral-medium)' }}>
                      {String(index + 1).padStart(ordinalWidth, '0')} / {trace.length}
                    </span>
                    <strong style={{ display: 'block', color: traceEvent.type.includes('prune') ? 'var(--danger)' : 'var(--primary)', fontSize: '0.72rem' }}>
                      {traceLabel(traceEvent.type)}
                    </strong>
                    <span>{traceEvent.message}</span>
                  </button>
                );
              })}
            </div>
          </section>
        )}
      />

      <details className="card">
        <summary style={{ cursor: 'pointer', fontWeight: 800, color: 'var(--primary)' }}>{t.comparison}</summary>
        <div style={{ overflowX: 'auto', marginBlockStart: 'var(--space-sm)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr><th style={{ textAlign: 'start', padding: 8 }}>{t.method}</th><th style={{ textAlign: 'start', padding: 8 }}>{t.additional}</th></tr></thead>
            <tbody>
              <tr><td style={{ padding: 8 }}>CP2</td><td style={{ padding: 8 }}>{t.cp2Additional}</td></tr>
              <tr><td style={{ padding: 8 }}>CP2+</td><td style={{ padding: 8 }}>{t.cp2PlusAdditional}</td></tr>
              <tr><td style={{ padding: 8 }}>AlgoBB++</td><td style={{ padding: 8 }}>{t.bbAdditional}</td></tr>
            </tbody>
          </table>
        </div>
        <p style={{ marginBlockEnd: 0, fontWeight: 700 }}>{t.honesty}</p>
      </details>

      <style>{`
        .cp2-plus-example-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: var(--space-sm);
        }
        @media (max-width: 767px) {
          .cp2-plus-mobile-tabs { display: flex !important; }
          .cp2-plus-example-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
};
