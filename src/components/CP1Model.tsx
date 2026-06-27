import React, { useState, useMemo } from 'react';
import type { Language, TranslationDict } from '../i18n/types';
import { solveCP1, stateToString } from '../domain/cpSolver';
import type { CP1TraceEvent } from '../domain/cpSolver';
import { solveConsistentPath } from '../domain/pathAlgorithms';
import { GraphPanel } from './GraphPanel';
import { examples } from '../data/examples';
import { Icon } from './Icons';
import { MethodCockpit } from './MethodCockpit';
import { MethodPlaybackControls } from './MethodPlaybackControls';
import { useMethodCockpitSync } from './useMethodCockpitSync';
import { cp1InspectorKeys, getCP1InspectorKeyForTraceEvent } from './cp1InspectorSync';
import { ScenarioHandoffBanner } from './ScenarioHandoffBanner';
import { useScenarioHandoffExample } from './useScenarioHandoffExample';
import { MethodEducationBlock } from './MethodEducationBlock';

interface CP1ModelProps {
  lang: Language;
  dict: TranslationDict;
}

export const CP1Model: React.FC<CP1ModelProps> = ({ lang, dict }) => {
  const isAr = lang === 'ar';
  
  // State for example selection
  const [selectedExampleId, setSelectedExampleId] = useState<string>('simple-valide');
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(-1); // -1: not started
  const [viewTab, setViewTab] = useState<'D' | 'G'>('D'); // Mobile layout tab
  const suppliedScenario = useScenarioHandoffExample(6);

  const currentExample = useMemo(() => {
    if (suppliedScenario.example) return suppliedScenario.example;
    return examples.find((ex) => ex.id === selectedExampleId) || examples[0];
  }, [selectedExampleId, suppliedScenario.example]);

  // Run CP1 solver
  const cpResult = useMemo(() => {
    return solveCP1(currentExample.vertices, currentExample.edgesD, currentExample.edgesG);
  }, [currentExample]);

  // Run Legacy solver for comparison
  const legacyResult = useMemo(() => {
    return solveConsistentPath(currentExample.vertices, currentExample.edgesD, currentExample.edgesG);
  }, [currentExample]);

  const traceEvents = cpResult.trace;
  const isRunning = currentStepIndex !== -1 && traceEvents.length > 0;
  const currentEvent: CP1TraceEvent | null = isRunning && currentStepIndex < traceEvents.length
    ? traceEvents[currentStepIndex]
    : null;

  // Derive visual highlights from current event
  const graphVisuals = useMemo(() => {
    if (!isRunning || !currentEvent) {
      return {
        highlightedNodes: new Set<string>(),
        activePath: [] as string[],
        isFinalResult: false,
        isAcceptedStep: false,
      };
    }

    const path = currentEvent.currentPath;
    const isFinal = currentEvent.type === 'proof-complete';
    const isAccepted = currentEvent.type === 'candidate-complete' || currentEvent.type === 'incumbent-update' || isFinal;

    return {
      highlightedNodes: new Set(path),
      activePath: path,
      isFinalResult: isFinal,
      isAcceptedStep: isAccepted,
    };
  }, [isRunning, currentEvent]);

  // Differential validation comparison check
  const differentialMatch = useMemo(() => {
    if (cpResult.status === 'error' || legacyResult.error) return null;
    const cpBest = cpResult.bestPath || [];
    const legacyBest = legacyResult.longestConsistentPath || [];
    
    const lenMatch = cpBest.length === legacyBest.length;
    let pathMatch = true;
    for (let i = 0; i < Math.max(cpBest.length, legacyBest.length); i++) {
      if (cpBest[i] !== legacyBest[i]) {
        pathMatch = false;
        break;
      }
    }
    return lenMatch && pathMatch;
  }, [cpResult, legacyResult]);

  const handleExampleSelect = (id: string) => {
    setSelectedExampleId(id);
    setCurrentStepIndex(-1);
  };

  const handleRun = () => {
    setCurrentStepIndex(0);
  };

  const handleReset = () => {
    setCurrentStepIndex(-1);
  };

  const handleStepChange = (index: number) => {
    if (index >= 0 && index < traceEvents.length) {
      setCurrentStepIndex(index);
    }
  };

  // Accessibility: Screen Reader Announcer derived dynamically
  const ariaLiveMsg = currentEvent ? `CP1 Solver: ${currentEvent.message}` : '';

  const renderedInspectorKeys = useMemo(() => cp1InspectorKeys(currentExample.vertices), [currentExample.vertices]);
  const activeInspectorKey = getCP1InspectorKeyForTraceEvent(currentEvent, renderedInspectorKeys);
  const { cockpitRef, traceScrollerRef, setInspectorScrollerRef, scrollCockpitIntoViewForPlay } = useMethodCockpitSync(currentStepIndex, activeInspectorKey, traceEvents);

  const labels = {
    fr: {
      title: 'Modèle Éducatif CP1 — Programmation par Contraintes',
      badgeStatus: 'CP1-inspired browser educational model — exact only for bounded small DAG examples.',
      badgeExact: 'Badge : Implémentation Graphe Borné Exact',
      varInspector: 'Inspecteur des Variables CP1',
      traceLedger: 'Journal des Traces CP1 (Recherche)',
      diffTitle: 'Validation Différentielle (CP1 vs Énumération)',
      diffStatus: 'Résultats de comparaison déterministe',
      varName: 'Variable',
      varDomain: 'Domaine de Recherche',
      stepIndicator: 'Étape de Recherche CP1',
      bestPath: 'Meilleur chemin cohérent trouvé',
      noPath: 'Aucun chemin cohérent pour le moment',
      compareObjective: 'Objectif (Longueur)',
      comparePath: 'Chemin optimal',
      comparisonMatch: 'Les résultats coïncident parfaitement ! Le départage déterministe est respecté.',
      comparisonMismatch: 'Alerte : Divergence dans la résolution exacte.',
      btnStart: 'Démarrer la recherche CP1',
      btnPrev: 'Étape Précédente',
      btnNext: 'Étape Suivante',
      btnReset: 'Réinitialiser',
      constraintsTitle: 'Vérification des Contraintes CP1',
      c1: '1. Successions valides dans D',
      c2: '2. Ensemble des sommets induit un chemin dirigé',
      c3: '3. Exactement une source et un puits',
      c4: '4. Cohérence d\'adjacence G-connectée',
      c5: '5. Maximisation de l\'objectif',
      solverStatus: 'État du Solveur',
      solverOptimal: 'Preuve d\'optimalité accomplie',
      solverIncomplete: 'Recherche incomplète (limite de pas atteinte)',
      solverNoSol: 'Aucun chemin cohérent possible dans ce graphe'
    },
    en: {
      title: 'CP1 Educational Model — Constraint Programming',
      badgeStatus: 'CP1-inspired browser educational model — exact only for bounded small DAG examples.',
      badgeExact: 'Badge: Exact Small-Graph Implementation',
      varInspector: 'CP1 Variable Inspector',
      traceLedger: 'CP1 Search Trace Ledger',
      diffTitle: 'Differential Validation (CP1 vs Enumeration)',
      diffStatus: 'Deterministic Comparison Results',
      varName: 'Variable',
      varDomain: 'Search Domain',
      stepIndicator: 'CP1 Search Step',
      bestPath: 'Best consistent path found',
      noPath: 'No consistent path found yet',
      compareObjective: 'Objective (Length)',
      comparePath: 'Optimal Path',
      comparisonMatch: 'The results match perfectly! Deterministic tie-breaker is satisfied.',
      comparisonMismatch: 'Alert: Discrepancy in exact path resolution.',
      btnStart: 'Start CP1 Search',
      btnPrev: 'Prev Step',
      btnNext: 'Next Step',
      btnReset: 'Reset Solver',
      constraintsTitle: 'CP1 Constraint Evaluation',
      c1: '1. Successor variables follow valid arcs of D',
      c2: '2. Selected nodes form exactly one directed path',
      c3: '3. Exactly one start and one end node',
      c4: '4. Selected nodes induce a connected subgraph in G',
      c5: '5. Maximise objective length',
      solverStatus: 'Solver Status',
      solverOptimal: 'Proof of optimality complete',
      solverIncomplete: 'Incomplete search (step limit reached)',
      solverNoSol: 'No consistent path exists in this graph'
    },
    ar: {
      title: 'نموذج CP1 التعليمي — البرمجة بالقيود',
      badgeStatus: 'CP1-inspired browser educational model — exact only for bounded small DAG examples.',
      badgeExact: 'Badge: Exact Small-Graph Implementation',
      varInspector: 'مفتش متغيرات CP1',
      traceLedger: 'سجل تتبع بحث CP1',
      diffTitle: 'التحقق التفاضلي (CP1 مقابل التعداد)',
      diffStatus: 'نتائج المقارنة الحتمية',
      varName: 'المتغير',
      varDomain: 'نطاق البحث (Domain)',
      stepIndicator: 'خطوة بحث CP1',
      bestPath: 'أفضل مسار متسق تم العثور عليه',
      noPath: 'لا يوجد مسار متسق حتى الآن',
      compareObjective: 'الهدف (الطول)',
      comparePath: 'المسار الأمثل',
      comparisonMatch: 'النتائج متطابقة تماماً! تم استيفاء كسر التعادل الحتمي.',
      comparisonMismatch: 'تنبيه: يوجد اختلاف في الحل الدقيق للمسار.',
      btnStart: 'بدء بحث CP1',
      btnPrev: 'الخطوة السابقة',
      btnNext: 'الخطوة التالية',
      btnReset: 'إعادة تعيين المحلل',
      constraintsTitle: 'تقييم قيود نموذج CP1',
      c1: '١. المتغيرات اللاحقة تتبع الأقواس الصالحة في D',
      c2: '٢. العقد المحددة تشكل مساراً موجهاً واحداً بالضبط',
      c3: '٣. نقطة بداية واحدة ونقطة نهاية واحدة بالضبط',
      c4: '٤. العقد المحددة تشكل مخططاً فرعياً متصلاً في G',
      c5: '٥. تعظيم طول المسار المستهدف',
      solverStatus: 'حالة المحلل',
      solverOptimal: 'اكتمل إثبات الحل الأمثل',
      solverIncomplete: 'بحث غير مكتمل (تم الوصول للحد الأقصى من الخطوات)',
      solverNoSol: 'لا يوجد مسار متسق في هذا المخطط'
    }
  };

  const t = labels[lang];

  return (
    <div style={{ textAlign: isAr ? 'right' : 'left', direction: isAr ? 'rtl' : 'ltr' }}>
      <ScenarioHandoffBanner lang={lang} scenario={suppliedScenario.scenario} error={suppliedScenario.error} />
      
      {/* Screen Reader Announcements */}
      <div className="sr-only" aria-live="assertive">{ariaLiveMsg}</div>

      <header style={{ marginBlockEnd: 'var(--space-md)' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-sm)', justifyContent: 'space-between', alignItems: 'center', marginBlockEnd: 'var(--space-xs)' }}>
          <h2 style={{ fontSize: '1.6rem', color: 'var(--primary)', border: 'none', margin: 0, padding: 0 }}>
            {t.title}
          </h2>
          <span style={{
            fontSize: '0.8rem',
            fontWeight: 700,
            color: 'var(--primary)',
            backgroundColor: 'var(--primary-bg)',
            border: '1px solid var(--primary)',
            paddingBlock: 'var(--space-xs)',
            paddingInline: 'var(--space-sm)',
            borderRadius: 'var(--radius-sm)'
          }}>
            {t.badgeExact}
          </span>
        </div>
        
        {/* CP1 disclaimer notice with neutral info styling */}
        <p style={{
          fontSize: '0.9rem',
          fontWeight: 600,
          color: 'var(--neutral-medium)',
          backgroundColor: 'var(--neutral-bg-hover)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-sm)',
          padding: 'var(--space-sm)',
          marginBlockStart: 'var(--space-sm)',
        }}>
          {t.badgeStatus}
        </p>
      </header>

      <MethodEducationBlock methodId="cp1" lang={lang} />

      {/* Dataset Selection */}
      <section className="card" style={{ padding: 'var(--space-md)', marginBlockEnd: 'var(--space-md)' }}>
        <h3 style={{ fontSize: '1.05rem', marginBlockEnd: 'var(--space-sm)' }}>{dict.selectionTitle}</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-md)', alignItems: 'center' }}>
          <select
            value={selectedExampleId}
            onChange={(e) => handleExampleSelect(e.target.value)}
            disabled={currentStepIndex !== -1}
            style={{
              padding: 'var(--space-sm)',
              fontSize: '0.95rem',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-color)',
              minHeight: '44px',
              minWidth: '250px'
            }}
          >
            {examples.map((ex) => (
              <option key={ex.id} value={ex.id}>
                {lang === 'fr' ? ex.titleFr : (lang === 'en' ? ex.titleEn : ex.titleAr)}
              </option>
            ))}
          </select>
          <div style={{ flex: 1, fontSize: '0.85rem', color: 'var(--neutral-medium)' }}>
            <strong>{dict.teachingPoint}</strong>
            {lang === 'fr' ? currentExample.teachingPointFr : (lang === 'en' ? currentExample.teachingPointEn : currentExample.teachingPointAr)}
          </div>
        </div>
      </section>

      <MethodCockpit
        cockpitRef={cockpitRef}
        controls={(
          <MethodPlaybackControls
            lang={lang}
            currentStepIndex={currentStepIndex}
            totalSteps={traceEvents.length}
            onStepChange={handleStepChange}
            onReset={handleReset}
            onPlayRequest={scrollCockpitIntoViewForPlay}
            labels={{
              start: t.btnStart,
              previous: t.btnPrev,
              next: t.btnNext,
              reset: t.btnReset,
              end: lang === 'fr' ? 'Aller à la Fin' : (lang === 'en' ? 'Jump to End' : 'الانتقال للنهاية'),
              counter: t.stepIndicator,
            }}
          />
        )}
        graph={(
          <>
            <div className="show-mobile-only" style={{ display: 'none', marginBlockEnd: 'var(--space-sm)' }}>
              <div className="lang-selector-group" style={{ width: '100%' }}>
                <button className={`lang-btn ${viewTab === 'D' ? 'active' : ''}`} style={{ flex: 1 }} onClick={() => setViewTab('D')}>D (Metabolism)</button>
                <button className={`lang-btn ${viewTab === 'G' ? 'active' : ''}`} style={{ flex: 1 }} onClick={() => setViewTab('G')}>G (Genome)</button>
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
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '1.15rem', color: 'var(--primary)', marginBlockEnd: 'var(--space-md)' }}>
            <span className="icon-label"><Icon name="clipboard" /> {t.varInspector}</span>
          </h3>

          {!isRunning ? (
            <div style={{ display: 'grid', gap: 'var(--space-sm)', fontSize: '0.9rem', color: 'var(--neutral-medium)' }}>
              <p style={{ margin: 0 }}>
                {lang === 'fr'
                  ? 'La recherche affichera les domaines x, succ, start et end au fil des affectations.'
                  : (lang === 'en'
                    ? 'Search will show x, succ, start, and end domains as assignments are made.'
                    : 'سيعرض البحث نطاقات x و succ و start و end أثناء التعيين.')}
              </p>
              <div dir="ltr" style={{ display: 'grid', gap: '4px', fontFamily: 'monospace', background: 'var(--neutral-bg-hover)', borderRadius: 'var(--radius-sm)', padding: 'var(--space-sm)' }}>
                <span>x[v] ∈ {'{0,1}'}</span>
                <span>succ[v] ∈ outgoing(v) ∪ {'{END, UNSELECTED}'}</span>
                <span>start,end ∈ V ∪ {'{UNSELECTED}'}</span>
              </div>
              <button onClick={handleRun} className="btn btn-primary" style={{ width: 'fit-content' }}>
                <span className="icon-label"><Icon name="play" /> {t.btnStart}</span>
              </button>
            </div>
          ) : (
            <div ref={setInspectorScrollerRef} data-testid="method-inspector-scroll" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)', overflowY: 'auto', flex: 1 }}>
              {/* Chosen start / end */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)', borderBottom: '1px solid var(--border-color)', paddingBottom: 'var(--space-sm)' }}>
                <div data-inspector-key="start" className={activeInspectorKey === 'start' ? 'method-cockpit__active-row' : ''}>
                  <strong style={{ fontSize: '0.85rem', color: 'var(--neutral-medium)' }}>start</strong>
                  <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--primary)' }}>
                    {currentEvent?.domains.start.map(stateToString).join(', ') || 'UNSELECTED'}
                  </div>
                </div>
                <div data-inspector-key="end" className={activeInspectorKey === 'end' ? 'method-cockpit__active-row' : ''}>
                  <strong style={{ fontSize: '0.85rem', color: 'var(--neutral-medium)' }}>end</strong>
                  <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--primary)' }}>
                    {currentEvent?.domains.end.map(stateToString).join(', ') || 'UNSELECTED'}
                  </div>
                </div>
              </div>

              {/* Table of variables */}
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                    <th style={{ textAlign: isAr ? 'right' : 'left', paddingBlock: '6px' }}>{t.varName}</th>
                    <th style={{ textAlign: isAr ? 'right' : 'left', paddingBlock: '6px' }}>{t.varDomain}</th>
                  </tr>
                </thead>
                <tbody>
                  {currentExample.vertices.map((v) => {
                    const xDomain = currentEvent?.domains.x[v] || [];
                    const succDomain = currentEvent?.domains.succ[v] || [];
                    const isSelectedInPath = currentEvent?.currentPath.includes(v);

                    return (
                      <React.Fragment key={v}>
                        <tr data-inspector-key={`x[${v}]`} className={activeInspectorKey === `x[${v}]` ? 'method-cockpit__active-row' : ''} style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: isSelectedInPath ? 'var(--primary-bg)' : 'transparent' }}>
                          <td style={{ paddingBlock: '8px', fontWeight: 700 }}>x[{v}] (selected boolean)</td>
                          <td style={{ paddingBlock: '8px', fontFamily: 'monospace' }}>
                            {"{"}{xDomain.join(', ')}{"}"}
                          </td>
                        </tr>
                        <tr data-inspector-key={`succ[${v}]`} className={activeInspectorKey === `succ[${v}]` ? 'method-cockpit__active-row' : ''} style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: isSelectedInPath ? 'var(--primary-bg)' : 'transparent' }}>
                          <td style={{ paddingBlock: '8px', fontWeight: 700 }}>succ[{v}] (successor vertex)</td>
                          <td style={{ paddingBlock: '8px', fontFamily: 'monospace' }}>
                            {"{"}{succDomain.map(stateToString).join(', ')}{"}"}
                          </td>
                        </tr>
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
        )}
        constraints={(
        <div className="card">
          <h3 style={{ fontSize: '1.15rem', color: 'var(--primary)', marginBlockEnd: 'var(--space-md)' }}>
            <span className="icon-label"><Icon name="shield" /> {t.constraintsTitle}</span>
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)', fontSize: '0.9rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
              <span style={{ color: isRunning ? 'var(--primary)' : 'var(--neutral-light)' }}><Icon name="check" /></span>
              <span>{t.c1}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
              <span style={{ color: isRunning ? 'var(--primary)' : 'var(--neutral-light)' }}><Icon name="check" /></span>
              <span>{t.c2}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
              <span style={{ color: isRunning ? 'var(--primary)' : 'var(--neutral-light)' }}><Icon name="check" /></span>
              <span>{t.c3}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
              <span style={{
                color: currentEvent?.type === 'candidate-complete' || currentEvent?.type === 'incumbent-update'
                  ? 'var(--primary)'
                  : (currentEvent?.type === 'contradiction' && currentEvent?.message.includes('disconnected') ? 'var(--danger)' : 'var(--neutral-light)')
              }}>
                <Icon name={currentEvent?.type === 'contradiction' && currentEvent?.message.includes('disconnected') ? 'x' : 'check'} />
              </span>
              <span>{t.c4}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
              <span style={{ color: isRunning ? 'var(--primary)' : 'var(--neutral-light)' }}><Icon name="check" /></span>
              <span>{t.c5}</span>
            </div>
          </div>
        </div>
        )}
        trace={(
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '1.15rem', color: 'var(--primary)', marginBlockEnd: 'var(--space-md)' }}>
            <span className="icon-label"><Icon name="ledger" /> {t.traceLedger}</span>
          </h3>
          
          <div ref={traceScrollerRef} data-testid="method-trace-scroll" style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {traceEvents.map((evt, idx) => {
              const isActive = idx === currentStepIndex;
              let badgeColor = 'var(--neutral-medium)';

              if (evt.type === 'choose-variable' || evt.type === 'choose-value') {
                badgeColor = 'var(--neutral-dark)';
              } else if (evt.type === 'propagate') {
                badgeColor = 'var(--primary)';
              } else if (evt.type === 'contradiction' || evt.type === 'backtrack') {
                badgeColor = 'var(--danger)';
              } else if (evt.type === 'incumbent-update' || evt.type === 'proof-complete') {
                badgeColor = 'var(--accent-gold)';
              }

              return (
                <button
                  key={idx}
                  type="button"
                  data-trace-index={idx}
                  data-active-trace={isActive ? 'true' : 'false'}
                  onClick={() => handleStepChange(idx)}
                  aria-pressed={isActive}
                  style={{
                    padding: '6px var(--space-sm)',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: isActive ? 'var(--neutral-bg-hover)' : 'transparent',
                    borderLeft: !isAr && isActive ? '3px solid var(--accent-gold)' : '3px solid transparent',
                    borderRight: isAr && isActive ? '3px solid var(--accent-gold)' : '3px solid transparent',
                    borderTop: 'none',
                    borderBottom: 'none',
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                    transition: 'all var(--transition-fast)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '2px',
                    width: '100%',
                    textAlign: isAr ? 'right' : 'left',
                    background: 'none',
                    fontFamily: 'inherit',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                    <span style={{ fontWeight: 700, color: badgeColor, textTransform: 'uppercase', fontSize: '0.7rem' }}>
                      {evt.type}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--neutral-light)' }}>
                      #{idx + 1}
                    </span>
                  </div>
                  <div style={{ color: 'var(--neutral-dark)', textAlign: isAr ? 'right' : 'left' }}>{evt.message}</div>
                </button>
              );
            })}
          </div>
        </div>
        )}
      />

      {/* Differential validation panel and final results */}
      <details className="card" style={{ marginBlockEnd: 'var(--space-md)' }}>
        <summary style={{ cursor: 'pointer', fontWeight: 700, color: 'var(--primary)', marginBlockEnd: 'var(--space-sm)' }}>
          <span className="icon-label"><Icon name="search" /> {t.diffTitle}</span>
        </summary>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)', marginBlockEnd: 'var(--space-md)' }}>
          {/* CP1 outcome */}
          <div style={{ padding: 'var(--space-sm)', backgroundColor: 'var(--neutral-bg-hover)', borderRadius: 'var(--radius-sm)' }}>
            <h4 style={{ fontSize: '0.95rem', marginBlockEnd: 'var(--space-xs)' }}>CP1 Solver Output:</h4>
            <div style={{ fontSize: '0.9rem' }}>
              <div><strong>{t.solverStatus}:</strong> {cpResult.status === 'optimal' ? t.solverOptimal : (cpResult.status === 'no-solution' ? t.solverNoSol : t.solverIncomplete)}</div>
              <div><strong>{cpResult.status === 'incomplete' ? (lang === 'fr' ? 'Meilleure solution trouvée avant complétion.' : (lang === 'ar' ? 'أفضل حل تم العثور عليه قبل الاكتمال.' : 'Best solution found before completion.')) : t.comparePath}:</strong> {cpResult.bestPath ? `\u202A${cpResult.bestPath.join(' → ')}\u202C` : 'N/A'}</div>
              <div><strong>{t.compareObjective}:</strong> {cpResult.bestPath ? cpResult.bestPath.length : 0}</div>
            </div>
          </div>

          {/* Legacy exhaustive outcome */}
          <div style={{ padding: 'var(--space-sm)', backgroundColor: 'var(--neutral-bg-hover)', borderRadius: 'var(--radius-sm)' }}>
            <h4 style={{ fontSize: '0.95rem', marginBlockEnd: 'var(--space-xs)' }}>Exhaustive Enumeration Output:</h4>
            <div style={{ fontSize: '0.9rem' }}>
              <div><strong>{t.solverStatus}:</strong> {legacyResult.error ? 'Error' : 'Complete Search'}</div>
              <div><strong>{t.comparePath}:</strong> {legacyResult.longestConsistentPath ? `\u202A${legacyResult.longestConsistentPath.join(' → ')}\u202C` : 'N/A'}</div>
              <div><strong>{t.compareObjective}:</strong> {legacyResult.longestConsistentPath ? legacyResult.longestConsistentPath.length : 0}</div>
            </div>
          </div>
        </div>

        {differentialMatch !== null && cpResult.status !== 'incomplete' && (
          <div style={{
            padding: 'var(--space-md)',
            borderRadius: 'var(--radius-sm)',
            border: differentialMatch ? '2px solid var(--primary)' : '2px solid var(--danger-border)',
            backgroundColor: differentialMatch ? 'var(--primary-bg)' : 'var(--danger-bg)',
            color: differentialMatch ? 'var(--primary)' : 'var(--danger)',
            fontWeight: 600,
            fontSize: '0.95rem'
          }}>
            {differentialMatch ? t.comparisonMatch : t.comparisonMismatch}
          </div>
        )}
      </details>

      {/* CSS specific styles injection */}
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
