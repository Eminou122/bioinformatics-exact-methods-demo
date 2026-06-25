import React, { useMemo, useState } from 'react';
import type { Language, TranslationDict } from '../i18n/types';
import { solveCP2Plus, type CP2PlusTraceEvent } from '../domain/cp2PlusSolver';
import type { ExampleDataset } from '../data/examples';
import { GraphPanel } from './GraphPanel';
import { Icon } from './Icons';
import { MethodCockpit } from './MethodCockpit';
import { MethodPlaybackControls } from './MethodPlaybackControls';
import { useMethodCockpitSync } from './useMethodCockpitSync';

interface CP2PlusModelProps {
  lang: Language;
  dict: TranslationDict;
}

const labels = {
  fr: {
    title: 'CP2+ — Propagation sûre de faisabilité génomique',
    description: 'Une implémentation CP2 améliorée qui ajoute un élagage précoce sûr de l’impossibilité génomique. Elle reste exacte lorsque la recherche se termine.',
    honesty: 'CP2+ est une spécialisation à une extrémité intégrée à CP2. Ce n’est ni une nouvelle méthode de recherche ni une reproduction d’article.',
    explanation: 'CP2+ conserve la borne de plus long suffixe dirigé de CP2. Il coupe aussi une branche seulement si même tous les sommets inutilisés atteignables vers l’avant ne peuvent reconnecter les sommets déjà sélectionnés dans G.',
    necessary: 'Ce test est une condition nécessaire seulement : une reconnexion possible dans le graphe relâché ne garantit pas qu’une complétion dirigée existe.',
    example: 'Exemple pédagogique',
    start: 'Démarrer CP2+',
    previous: 'Précédent',
    next: 'Suivant',
    end: 'Fin',
    reset: 'Réinitialiser',
    currentEvent: 'Événement courant',
    noEvent: 'Aucun événement actif',
    activeStep: 'ÉTAPE ACTIVE',
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
  },
  en: {
    title: 'CP2+ — Safe Genomic-Feasibility Propagation',
    description: 'An enhanced CP2 implementation that adds a safe early genomic-impossibility prune. It remains exact when search completes.',
    honesty: 'CP2+ is a one-ended specialization integrated into CP2. It is not a new research method or a paper reproduction.',
    explanation: 'CP2+ preserves CP2’s directed longest-suffix bound. It also cuts a branch only when even all forward-reachable unused vertices cannot reconnect the already selected vertices in G.',
    necessary: 'This is only a necessary-condition test: reconnection in the relaxed graph does not certify that a directed completion exists.',
    example: 'Teaching example',
    start: 'Start CP2+',
    previous: 'Previous',
    next: 'Next',
    end: 'End',
    reset: 'Reset',
    currentEvent: 'Current Event',
    noEvent: 'No active event',
    activeStep: 'ACTIVE STEP',
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
  },
  ar: {
    title: 'CP2+ — الانتشار الآمن لإمكان الاتصال الجينومي',
    description: 'تطبيق محسن لـ CP2 يضيف تقليماً مبكراً وآمناً عند استحالة الاتصال الجينومي. ويظل دقيقاً عند اكتمال البحث.',
    honesty: 'CP2+ تخصيص أحادي الطرف مدمج في CP2. ليس طريقة بحث جديدة ولا إعادة إنتاج لورقة علمية.',
    explanation: 'يحافظ CP2+ على حد CP2 لأطول لاحقة موجهة. ويقطع الفرع فقط إذا كانت كل الرؤوس غير المستخدمة القابلة للوصول إلى الأمام غير قادرة على إعادة وصل الرؤوس المحددة في G.',
    necessary: 'هذا اختبار لشرط ضروري فقط: إمكان الاتصال في المخطط المرخى لا يثبت وجود إكمال موجه.',
    example: 'مثال تعليمي',
    start: 'بدء CP2+',
    previous: 'السابق',
    next: 'التالي',
    end: 'النهاية',
    reset: 'إعادة تعيين',
    currentEvent: 'الحدث الحالي',
    noEvent: 'لا يوجد حدث نشط',
    activeStep: 'الخطوة النشطة',
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
  },
} satisfies Record<Language, Record<string, string>>;

const fixtures: (ExampleDataset & { purpose: Record<Language, string> })[] = [
  {
    id: 'cp2-plus-prune',
    titleFr: 'Élagage génomique sûr',
    titleEn: 'Safe genomic prune',
    titleAr: 'تقليم جينومي آمن',
    descriptionFr: 'C relie A et B dans G, mais C est inaccessible après B dans D.',
    descriptionEn: 'C bridges A and B in G, but C is unreachable after B in D.',
    descriptionAr: 'يربط C بين A وB في G، لكنه غير قابل للوصول بعد B في D.',
    teachingPointFr: 'Le préfixe A → B est coupé car aucun pont génomique atteignable vers l’avant ne subsiste.',
    teachingPointEn: 'Prefix A → B is pruned because no forward-reachable genomic bridge remains.',
    teachingPointAr: 'يُقلم المسار A → B لعدم وجود جسر جينومي قابل للوصول إلى الأمام.',
    purpose: {
      fr: 'Prouve que l’existence d’un pont dans G ne suffit pas : il doit être atteignable depuis le dernier sommet.',
      en: 'Shows that a bridge in G is insufficient: it must be reachable from the endpoint.',
      ar: 'يوضح أن وجود جسر في G لا يكفي؛ يجب أن يكون قابلاً للوصول من نهاية المسار.',
    },
    vertices: ['A', 'B', 'C'],
    edgesD: [{ from: 'A', to: 'B' }],
    edgesG: [{ u: 'A', v: 'C' }, { u: 'B', v: 'C' }],
    nodePositions: { A: { x: 100, y: 120 }, B: { x: 350, y: 120 }, C: { x: 225, y: 230 } },
  },
  {
    id: 'cp2-plus-repairable',
    titleFr: 'Préfixe déconnecté mais réparable',
    titleEn: 'Disconnected but repairable prefix',
    titleAr: 'مسار جزئي منفصل لكنه قابل للإصلاح',
    descriptionFr: 'A → B est déconnecté dans G, puis C reconnecte les deux sommets.',
    descriptionEn: 'A → B is disconnected in G, then C reconnects both vertices.',
    descriptionAr: 'يكون A → B منفصلاً في G، ثم يعيد C وصل الرأسين.',
    teachingPointFr: 'CP2+ conserve le préfixe parce que C est atteignable vers l’avant.',
    teachingPointEn: 'CP2+ keeps the prefix because C is forward reachable.',
    teachingPointAr: 'يحتفظ CP2+ بالمسار لأن C قابل للوصول إلى الأمام.',
    purpose: {
      fr: 'Prouve qu’un préfixe actuellement déconnecté ne doit pas être élagué lorsqu’un pont futur est atteignable.',
      en: 'Shows that a currently disconnected prefix must survive when a future bridge is reachable.',
      ar: 'يوضح ضرورة إبقاء المسار الجزئي المنفصل عندما يكون جسر مستقبلي قابلاً للوصول.',
    },
    vertices: ['A', 'B', 'C'],
    edgesD: [{ from: 'A', to: 'B' }, { from: 'B', to: 'C' }],
    edgesG: [{ u: 'A', v: 'C' }, { u: 'B', v: 'C' }],
    nodePositions: { A: { x: 80, y: 150 }, B: { x: 280, y: 150 }, C: { x: 480, y: 150 } },
  },
];

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

export const CP2PlusModel: React.FC<CP2PlusModelProps> = ({ lang, dict }) => {
  const t = labels[lang];
  const isAr = lang === 'ar';
  const [selectedId, setSelectedId] = useState(fixtures[0].id);
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [viewTab, setViewTab] = useState<'D' | 'G'>('D');
  const currentExample = fixtures.find((fixture) => fixture.id === selectedId) ?? fixtures[0];
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

  return (
    <div data-testid="cp2-plus-page" style={{ direction: isAr ? 'rtl' : 'ltr', textAlign: isAr ? 'right' : 'left' }}>
      <header style={{ marginBlockEnd: 'var(--space-md)' }}>
        <h2 style={{ color: 'var(--primary)', border: 0 }}>{t.title}</h2>
        <p style={{ fontWeight: 700 }}>{t.description}</p>
        <p style={{ padding: 'var(--space-sm)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)' }}>{t.honesty}</p>
      </header>

      <section className="card">
        <p>{t.explanation}</p>
        <p style={{ marginBlockEnd: 0, color: 'var(--primary)', fontWeight: 700 }}>{t.necessary}</p>
      </section>

      <section className="card">
        <label style={{ display: 'grid', gap: 'var(--space-xs)', maxWidth: 440 }}>
          <strong>{t.example}</strong>
          <select
            value={selectedId}
            onChange={(change) => {
              setSelectedId(change.target.value);
              setCurrentStepIndex(-1);
            }}
            style={{ minHeight: 44, padding: 'var(--space-sm)' }}
          >
            {fixtures.map((fixture) => (
              <option key={fixture.id} value={fixture.id}>
                {lang === 'fr' ? fixture.titleFr : lang === 'ar' ? fixture.titleAr : fixture.titleEn}
              </option>
            ))}
          </select>
        </label>
        <p style={{ marginBlock: 'var(--space-sm) 0' }}>{currentExample.purpose[lang]}</p>
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
              <strong>{t.currentEvent}</strong>
              {event && <span style={{ float: isAr ? 'left' : 'right', fontWeight: 900 }}>{t.activeStep}</span>}
              <div style={{ fontWeight: 900, color: event?.type === 'genomic-propagation-prune' ? 'var(--danger)' : 'var(--primary)' }}>
                {event?.type === 'genomic-propagation-prune' ? 'SAFE GENOMIC PRUNE' : event?.type.toUpperCase() ?? t.noEvent}
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
                    onClick={() => setCurrentStepIndex(index)}
                    className={active ? 'method-cockpit__active-row' : undefined}
                    style={{ textAlign: isAr ? 'right' : 'left', padding: 6, border: active ? '2px solid var(--accent-gold)' : '1px solid transparent', background: active ? 'var(--primary-bg)' : 'transparent', borderRadius: 'var(--radius-sm)' }}
                  >
                    <strong style={{ display: 'block', color: traceEvent.type.includes('prune') ? 'var(--danger)' : 'var(--primary)', fontSize: '0.72rem' }}>
                      {traceEvent.type === 'genomic-propagation-prune' ? 'SAFE GENOMIC PRUNE' : traceEvent.type.toUpperCase()}
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
        @media (max-width: 767px) {
          .cp2-plus-mobile-tabs { display: flex !important; }
        }
      `}</style>
    </div>
  );
};
