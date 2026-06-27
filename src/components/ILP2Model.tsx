import React, { useMemo, useState } from 'react';
import type { Language, TranslationDict } from '../i18n/types';
import { examples } from '../data/examples';
import { solveConsistentPath } from '../domain/pathAlgorithms';
import { solveILP1 } from '../domain/ilp1Solver';
import { solveILP2, solveILP2Plus, type ILP2TraceEvent } from '../domain/ilp2Solver';
import { GraphPanel } from './GraphPanel';
import { Icon } from './Icons';
import { MethodCockpit } from './MethodCockpit';
import { MethodPlaybackControls } from './MethodPlaybackControls';
import { useMethodCockpitSync } from './useMethodCockpitSync';
import { ScenarioHandoffBanner } from './ScenarioHandoffBanner';
import { useScenarioHandoffExample } from './useScenarioHandoffExample';
import { MethodEducationBlock } from './MethodEducationBlock';

interface ILP2ModelProps {
  lang: Language;
  dict: TranslationDict;
  variant?: 'ilp2' | 'ilp2-plus';
}

const labels = {
  fr: {
    title: 'ILP2 — Rooted Connectivity with Levels',
    badge: 'ILP2 educational bounded formulation — exact only for small DAG examples.',
    honesty: 'Cette page expose une formulation ILP2 éducative et la résout par énumération déterministe bornée dans le navigateur. Aucun solveur MILP natif ni moteur externe n’est utilisé.',
    root: 'La racine r agit comme l’ancre du témoin génomique sélectionné.',
    parents: 'Les liens p_uv orientent des arêtes réelles de G pour relier chaque réaction sélectionnée à la racine.',
    levels: 'Les niveaux level_v augmentent strictement de parent à enfant, ce qui empêche les cycles de parenté.',
    ilp1Diff: 'ILP1 utilise des arêtes z formant un arbre non orienté; ILP2 encode le même témoin comme racine, parents orientés et niveaux.',
    sameAnswer: 'Les deux formulations doivent retourner le même meilleur chemin valide sur les petits DAG non interrompus.',
    select: 'Exemple',
    start: 'Démarrer ILP2',
    prev: 'Précédent',
    next: 'Suivant',
    end: 'Fin',
    reset: 'Réinitialiser',
    selectedPath: 'Chemin sélectionné',
    incumbent: 'Incumbent actuel',
    chosenRoot: 'Racine choisie',
    parentLinks: 'Liens parents génomiques',
    levelTable: 'Table des niveaux',
    variables: 'Variables x/y/r/p/level',
    validation: 'Validation ILP2',
    trace: 'Trace ILP2',
    reason: 'Raison',
    explored: 'Candidats explorés',
    rejected: 'Candidats rejetés',
    exact: 'Exact / preuve complète',
    incomplete: 'Incomplet',
    cancelled: 'Annulé',
    cap: 'Limite d’événements atteinte',
    method: 'Méthode',
    idea: 'Idée de connectivité génomique',
    completion: 'Complétion',
    ilp1: 'ILP1',
    ilp2: 'ILP2',
    ilp1Idea: 'Arêtes témoins formant un arbre sélectionné',
    ilp2Idea: 'Racine + liens parents + niveaux',
    technical: 'Détails différentiels et techniques',
    best: 'Meilleur chemin',
    legacy: 'Énumération Legacy',
    noPath: 'Aucun',
    ilp2PlusTitle: 'ILP2+ — Arrêt anticipé par préfixe canonique',
    ilp2PlusBadge: 'ILP2+ énumère et trie d’abord tous les chemins; exact seulement pour petits DAG.',
    ilp2PlusHonesty: 'ILP2+ utilise le même objectif, le même départage canonique, le même témoin racine-niveaux et les mêmes règles de faisabilité que ILP2. Il ajoute seulement un arrêt anticipé après le premier gagnant canonique faisable; il ne saute pas l’énumération des chemins, ne rend pas les grands graphes sûrs, n’est pas un MILP natif, n’est pas une reproduction d’article et ne prouve aucune supériorité universelle en temps.',
    ilp2PlusTruth: 'ILP2+ fully enumerates and canonically sorts paths first. It may skip later candidate evaluation after the first feasible canonical winner. It does not skip path enumeration.',
    ilp2PlusCounters: 'Compteurs ILP2+',
    ilp2PlusCounterHelp: 'Ces compteurs séparent l’énumération complète des chemins de l’évaluation des candidats qui peut être réduite.',
  },
  en: {
    title: 'ILP2 — Rooted Connectivity with Levels',
    badge: 'ILP2 educational bounded formulation — exact only for small DAG examples.',
    honesty: 'This page exposes an educational ILP2 formulation and solves it with bounded deterministic browser enumeration. No native MILP solver or external engine is used.',
    root: 'The root r acts as the anchor of the selected genomic witness.',
    parents: 'The p_uv links orient real G edges so every selected reaction connects back to the root.',
    levels: 'The level_v values strictly increase from parent to child, preventing circular parent relationships.',
    ilp1Diff: 'ILP1 uses z edges as an undirected tree witness; ILP2 encodes the same witness as a root, oriented parents, and levels.',
    sameAnswer: 'Both formulations should return the same valid best path on uncapped small DAG examples.',
    select: 'Example',
    start: 'Start ILP2',
    prev: 'Previous',
    next: 'Next',
    end: 'End',
    reset: 'Reset',
    selectedPath: 'Selected path',
    incumbent: 'Current incumbent',
    chosenRoot: 'Chosen root',
    parentLinks: 'Genomic parent links',
    levelTable: 'Level table',
    variables: 'x/y/r/p/level variables',
    validation: 'ILP2 validation',
    trace: 'ILP2 trace',
    reason: 'Reason',
    explored: 'Explored candidates',
    rejected: 'Rejected candidates',
    exact: 'Exact / proof complete',
    incomplete: 'Incomplete',
    cancelled: 'Cancelled',
    cap: 'Event cap reached',
    method: 'Method',
    idea: 'Genomic connectivity idea',
    completion: 'Completion',
    ilp1: 'ILP1',
    ilp2: 'ILP2',
    ilp1Idea: 'Selected tree witness edges',
    ilp2Idea: 'Root + parent links + levels',
    technical: 'Differential and technical details',
    best: 'Best path',
    legacy: 'Legacy enumeration',
    noPath: 'None',
    ilp2PlusTitle: 'ILP2+ — Canonical Prefix Early Termination',
    ilp2PlusBadge: 'ILP2+ enumerates and sorts all paths first; exact only for small DAG examples.',
    ilp2PlusHonesty: 'ILP2+ uses the same objective, canonical tie-break, rooted-level witness model, and feasibility rules as ILP2. It adds only sorted-prefix early termination after the first feasible canonical winner; it does not skip path enumeration, does not make Large/Huge graphs safe, is not native MILP, is not a paper reproduction, and never proves universal runtime superiority.',
    ilp2PlusTruth: 'ILP2+ fully enumerates and canonically sorts paths first. It may skip later candidate evaluation after the first feasible canonical winner. It does not skip path enumeration.',
    ilp2PlusCounters: 'ILP2+ counters',
    ilp2PlusCounterHelp: 'These counters separate full path enumeration from candidate evaluation, which may be reduced.',
  },
  ar: {
    title: 'ILP2 — Rooted Connectivity with Levels',
    badge: 'ILP2 educational bounded formulation — exact only for small DAG examples.',
    honesty: 'تعرض هذه الصفحة صياغة ILP2 تعليمية وتحلها بتعداد حتمي محدود داخل المتصفح. لا يتم استخدام أي محلل MILP أصلي أو محرك خارجي.',
    root: 'تعمل الجذر r كمرساة لشاهد الاتصال الجينومي المختار.',
    parents: 'توجه روابط p_uv حوافاً حقيقية في G حتى تتصل كل تفاعلات مختارة بالجذر.',
    levels: 'تزداد قيم level_v بصرامة من الأب إلى الابن، وهذا يمنع علاقات الأبوة الدائرية.',
    ilp1Diff: 'يستخدم ILP1 حواف z كشجرة شاهدة غير موجهة؛ أما ILP2 فيرمز الشاهد نفسه بجذر وروابط آباء موجهة ومستويات.',
    sameAnswer: 'يجب أن تعيد الصيغتان أفضل مسار صالح نفسه في أمثلة DAG الصغيرة غير المتوقفة.',
    select: 'المثال',
    start: 'بدء ILP2',
    prev: 'السابق',
    next: 'التالي',
    end: 'النهاية',
    reset: 'إعادة تعيين',
    selectedPath: 'المسار المختار',
    incumbent: 'Incumbent الحالي',
    chosenRoot: 'الجذر المختار',
    parentLinks: 'روابط الأبوة الجينومية',
    levelTable: 'جدول المستويات',
    variables: 'متغيرات x/y/r/p/level',
    validation: 'التحقق من ILP2',
    trace: 'تتبع ILP2',
    reason: 'السبب',
    explored: 'المرشحون المستكشفون',
    rejected: 'المرشحون المرفوضون',
    exact: 'دقيق / برهان مكتمل',
    incomplete: 'غير مكتمل',
    cancelled: 'ملغى',
    cap: 'تم بلوغ حد الأحداث',
    method: 'الطريقة',
    idea: 'فكرة الاتصال الجينومي',
    completion: 'الاكتمال',
    ilp1: 'ILP1',
    ilp2: 'ILP2',
    ilp1Idea: 'حواف شجرة شاهدة مختارة',
    ilp2Idea: 'جذر + روابط آباء + مستويات',
    technical: 'تفاصيل تفاضلية وتقنية',
    best: 'أفضل مسار',
    legacy: 'التعداد Legacy',
    noPath: 'لا يوجد',
    ilp2PlusTitle: 'ILP2+ — إيقاف مبكر حسب البادئة القانونية',
    ilp2PlusBadge: 'ILP2+ يعدد ويفرز كل المسارات أولاً؛ دقيق فقط لأمثلة DAG الصغيرة.',
    ilp2PlusHonesty: 'يستخدم ILP2+ الهدف نفسه، وقاعدة كسر التعادل القانونية نفسها، ونموذج الشاهد ذي الجذر والمستويات نفسه، وقواعد الإمكان نفسها مثل ILP2. يضيف فقط إيقافاً مبكراً بعد أول فائز قانوني ممكن؛ لا يتجاوز تعداد المسارات، ولا يجعل الرسوم Large/Huge آمنة، وليس MILP أصلياً، وليس إعادة إنتاج لورقة علمية، ولا يثبت تفوقاً زمنياً عاماً.',
    ilp2PlusTruth: 'ILP2+ fully enumerates and canonically sorts paths first. It may skip later candidate evaluation after the first feasible canonical winner. It does not skip path enumeration.',
    ilp2PlusCounters: 'عدادات ILP2+',
    ilp2PlusCounterHelp: 'تفصل هذه العدادات تعداد المسارات الكامل عن تقييم المرشحين الذي قد ينخفض.',
  },
} satisfies Record<Language, Record<string, string>>;

function pathText(path: string[] | null | undefined): string {
  return path && path.length > 0 ? `\u202A${path.join(' -> ')}\u202C` : 'N/A';
}

function completionText(event: ILP2TraceEvent | null, result: ReturnType<typeof solveILP2>, t: typeof labels.en): string {
  if (event?.type === 'cancelled' || result.cancelled) return t.cancelled;
  if (event?.type === 'cap-reached' || result.interruptedByCap) return t.cap;
  if (result.status === 'optimal' || result.status === 'no-solution') return t.exact;
  return t.incomplete;
}

export const ILP2Model: React.FC<ILP2ModelProps> = ({ lang, dict, variant = 'ilp2' }) => {
  const isPlus = variant === 'ilp2-plus';
  const isAr = lang === 'ar';
  const t = labels[lang];
  const [selectedExampleId, setSelectedExampleId] = useState('multiple-candidates');
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [viewTab, setViewTab] = useState<'D' | 'G'>('D');
  const suppliedScenario = useScenarioHandoffExample(10, 'not-run-preenumeration-risk');

  const currentExample = useMemo(
    () => suppliedScenario.example || examples.find((ex) => ex.id === selectedExampleId) || examples[0],
    [selectedExampleId, suppliedScenario.example]
  );
  const ilp2Result = useMemo(
    () => (isPlus ? solveILP2Plus : solveILP2)(currentExample.vertices, currentExample.edgesD, currentExample.edgesG),
    [currentExample, isPlus]
  );
  const ilp1Result = useMemo(
    () => solveILP1(currentExample.vertices, currentExample.edgesD, currentExample.edgesG),
    [currentExample]
  );
  const legacyResult = useMemo(
    () => solveConsistentPath(currentExample.vertices, currentExample.edgesD, currentExample.edgesG),
    [currentExample]
  );

  const traceEvents = ilp2Result.trace;
  const isRunning = currentStepIndex !== -1 && traceEvents.length > 0;
  const currentEvent = isRunning ? traceEvents[currentStepIndex] || null : null;
  const activePath = currentEvent?.currentPath || [];
  const activeDecisions = currentEvent?.decisions || ilp2Result.bestCandidate?.decisions || null;
  const activeRoot = currentEvent?.root || ilp2Result.bestCandidate?.root || null;
  const activeParentLinks = currentEvent?.parentLinks || ilp2Result.bestCandidate?.parentLinks || [];
  const activeLevels = currentEvent?.levels || ilp2Result.bestCandidate?.levels || {};

  const selectedVariables = useMemo(() => {
    if (!activeDecisions) return [];
    return [
      ...Object.entries(activeDecisions.x).filter(([, value]) => value === 1).map(([key]) => `x[${key}] = 1`),
      ...Object.entries(activeDecisions.y).filter(([, value]) => value === 1).map(([key]) => `y[${key}] = 1`),
      ...Object.entries(activeDecisions.r).filter(([, value]) => value === 1).map(([key]) => `r[${key}] = 1`),
      ...Object.entries(activeDecisions.p).filter(([, value]) => value === 1).map(([key]) => `p[${key}] = 1`),
      ...Object.entries(activeDecisions.level).filter(([, value]) => value !== null).map(([key, value]) => `level[${key}] = ${value}`),
    ];
  }, [activeDecisions]);

  const activeInspectorKey = selectedVariables[0] || (currentEvent ? 'selectedPath' : null);
  const { cockpitRef, traceScrollerRef, setInspectorScrollerRef, scrollCockpitIntoViewForPlay } = useMethodCockpitSync(currentStepIndex, activeInspectorKey, traceEvents);

  const rows = [
    { method: t.ilp1, idea: t.ilp1Idea, completion: ilp1Result.status === 'optimal' || ilp1Result.status === 'no-solution' ? t.exact : t.incomplete },
    { method: t.ilp2, idea: t.ilp2Idea, completion: ilp2Result.status === 'optimal' || ilp2Result.status === 'no-solution' ? t.exact : t.incomplete },
  ];

  return (
    <div style={{ textAlign: isAr ? 'right' : 'left', direction: isAr ? 'rtl' : 'ltr' }}>
      <ScenarioHandoffBanner lang={lang} scenario={suppliedScenario.scenario} error={suppliedScenario.error} />
      <div className="sr-only" aria-live="assertive">{currentEvent?.message || ''}</div>
      <header style={{ marginBlockEnd: 'var(--space-md)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 'var(--space-sm)', flexWrap: 'wrap', alignItems: 'center' }}>
          <h2 style={{ fontSize: '1.6rem', color: 'var(--primary)', border: 'none', margin: 0, padding: 0 }}>{isPlus ? t.ilp2PlusTitle : t.title}</h2>
          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--primary)', backgroundColor: 'var(--primary-bg)', border: '1px solid var(--primary)', borderRadius: 'var(--radius-sm)', padding: 'var(--space-xs) var(--space-sm)' }}>
            Exact small-graph implementation
          </span>
        </div>
        <p style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--neutral-medium)', backgroundColor: 'var(--neutral-bg-hover)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: 'var(--space-sm)' }}>{isPlus ? t.ilp2PlusBadge : t.badge}</p>
      </header>

      <MethodEducationBlock methodId={isPlus ? 'ilp2-plus' : 'ilp2'} lang={lang} />

      <section className="card" style={{ marginBlockEnd: 'var(--space-md)' }}>
        <p style={{ marginBlockStart: 0 }}>{isPlus ? t.ilp2PlusHonesty : t.honesty}</p>
        {isPlus && <p dir="ltr" data-testid="ilp2-plus-exact-wording" style={{ fontWeight: 800, color: 'var(--primary)' }}>{t.ilp2PlusTruth}</p>}
        <div className="grid grid-2" style={{ fontSize: '0.9rem' }}>
          <p dir="ltr">x_v in {'{0,1}'}; y_a in {'{0,1}'}; r_v in {'{0,1}'}</p>
          <p dir="ltr">p_uv in {'{0,1}'}; level_v in {'{0, ..., |V|-1}'}</p>
          <p>{t.root}</p>
          <p>{t.parents}</p>
          <p>{t.levels}</p>
          <p>{t.ilp1Diff}</p>
        </div>
        <p style={{ marginBlockEnd: 0, color: 'var(--primary)', fontWeight: 700 }}>{t.sameAnswer}</p>
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
            <h3 style={{ color: 'var(--primary)', fontSize: '1.1rem' }}><span className="icon-label"><Icon name="clipboard" /> {t.validation}</span></h3>
            <dl style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-sm)', fontSize: '0.9rem' }}>
              <dt data-inspector-key="selectedPath" className={activeInspectorKey === 'selectedPath' ? 'method-cockpit__active-row' : ''}>{t.selectedPath}</dt><dd dir="ltr">{pathText(activePath)}</dd>
              <dt>{t.incumbent}</dt><dd dir="ltr">{pathText(currentEvent?.bestPath || ilp2Result.bestPath)}</dd>
              <dt>{t.chosenRoot}</dt><dd dir="ltr">{activeRoot || 'N/A'}</dd>
              <dt>{t.explored}</dt><dd>{currentEvent?.exploredCandidates ?? ilp2Result.exploredCandidates}</dd>
              <dt>{t.rejected}</dt><dd>{currentEvent?.rejectedCandidates ?? ilp2Result.rejectedCandidates}</dd>
              <dt>{t.reason}</dt><dd>{currentEvent?.reason || '-'}</dd>
            </dl>
            {isPlus && (
              <div data-testid="ilp2-plus-counters" style={{ marginBlockStart: 'var(--space-md)' }}>
                <h4 style={{ color: 'var(--primary)', marginBlock: '0 var(--space-xs)' }}>{t.ilp2PlusCounters}</h4>
                <p style={{ marginBlockStart: 0, fontSize: '0.84rem', color: 'var(--neutral-medium)' }}>{t.ilp2PlusCounterHelp}</p>
                <dl dir="ltr" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', gap: 'var(--space-xs) var(--space-sm)', fontSize: '0.82rem' }}>
                  {Object.entries({
                    enumeratedCandidates: ilp2Result.counters.enumeratedCandidates,
                    acceptedFeasibleCandidates: ilp2Result.counters.acceptedFeasibleCandidates,
                    candidateEvaluationEvents: ilp2Result.counters.candidateEvaluationEvents,
                    earlyTermination: String(ilp2Result.counters.earlyTermination),
                    candidatesSkippedAfterWinner: ilp2Result.counters.candidatesSkippedAfterWinner,
                    witnessParentLinksAssigned: ilp2Result.counters.witnessParentLinksAssigned,
                    witnessLevelsAssigned: ilp2Result.counters.witnessLevelsAssigned,
                  }).map(([key, value]) => (
                    <React.Fragment key={key}>
                      <dt>{key}</dt>
                      <dd>{value}</dd>
                    </React.Fragment>
                  ))}
                </dl>
              </div>
            )}
            <p style={{ marginBlockEnd: 0, fontWeight: 700, color: 'var(--primary)' }}>{completionText(currentEvent, ilp2Result, t as typeof labels.en)}</p>
          </section>
        )}
        constraints={(
          <section className="card">
            <h3 style={{ color: 'var(--primary)', fontSize: '1.1rem' }}><span className="icon-label"><Icon name="network" /> {t.variables}</span></h3>
            <div ref={setInspectorScrollerRef} data-testid="method-inspector-scroll" dir="ltr" style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', fontFamily: 'monospace', fontSize: '0.8rem', overflowY: 'auto' }}>
              {selectedVariables.length > 0 ? selectedVariables.map((value) => (
                <span key={value} data-inspector-key={value} className={activeInspectorKey === value ? 'method-cockpit__active-row' : ''} style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '4px 6px', background: 'var(--neutral-bg-hover)' }}>{value}</span>
              )) : <span>N/A</span>}
            </div>
            <h4 style={{ marginBlockStart: 'var(--space-md)', marginBlockEnd: 'var(--space-xs)' }}>{t.parentLinks}</h4>
            <p dir="ltr" style={{ margin: 0, fontFamily: 'monospace', fontSize: '0.84rem' }}>
              {activeParentLinks.length > 0 ? activeParentLinks.map((link) => `${link.parent}->${link.child}`).join(', ') : 'N/A'}
            </p>
            <h4 style={{ marginBlockStart: 'var(--space-md)', marginBlockEnd: 'var(--space-xs)' }}>{t.levelTable}</h4>
            <p dir="ltr" style={{ margin: 0, fontFamily: 'monospace', fontSize: '0.84rem' }}>
              {Object.keys(activeLevels).length > 0 ? Object.entries(activeLevels).map(([vertex, level]) => `${vertex}:${level}`).join(', ') : 'N/A'}
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
          <span className="icon-label"><Icon name="search" /> {t.technical}</span>
        </summary>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem', marginBlockEnd: 'var(--space-md)' }}>
            <thead>
              <tr>
                <th style={{ textAlign: isAr ? 'right' : 'left', borderBottom: '2px solid var(--border-color)', padding: '8px' }}>{t.method}</th>
                <th style={{ textAlign: isAr ? 'right' : 'left', borderBottom: '2px solid var(--border-color)', padding: '8px' }}>{t.idea}</th>
                <th style={{ textAlign: isAr ? 'right' : 'left', borderBottom: '2px solid var(--border-color)', padding: '8px' }}>{t.completion}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.method}>
                  <td style={{ padding: '8px', borderBottom: '1px solid var(--border-color)' }}>{row.method}</td>
                  <td style={{ padding: '8px', borderBottom: '1px solid var(--border-color)' }}>{row.idea}</td>
                  <td style={{ padding: '8px', borderBottom: '1px solid var(--border-color)' }}>{row.completion}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p style={{ marginBlockStart: 0 }}><strong>{t.legacy}:</strong> {legacyResult.longestConsistentPath ? pathText(legacyResult.longestConsistentPath) : t.noPath}</p>
        <p style={{ marginBlockEnd: 0 }}><strong>{t.ilp2} {t.best}:</strong> {ilp2Result.bestPath ? pathText(ilp2Result.bestPath) : t.noPath}</p>
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
