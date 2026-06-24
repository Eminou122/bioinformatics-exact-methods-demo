import React, { useMemo, useState } from 'react';
import type { Language, TranslationDict } from '../i18n/types';
import { examples } from '../data/examples';
import { solveConsistentPath } from '../domain/pathAlgorithms';
import { solveAIGuidedExact, type AIGuidedTraceEvent } from '../domain/aiGuidedExactSolver';
import { GraphPanel } from './GraphPanel';
import { Icon } from './Icons';
import { MethodCockpit } from './MethodCockpit';
import { MethodPlaybackControls } from './MethodPlaybackControls';
import { useMethodCockpitSync } from './useMethodCockpitSync';

const OLLAMA_CHAT_URL = 'http://localhost:11434/api/chat';
const CLOUD_ASSISTANT_URL = '/api/ai-branch-explanation';
const OLLAMA_TIMEOUT_MS = 8000;
const OLLAMA_MODEL = 'llama3.2:1b';

interface AIGuidedExactModelProps {
  lang: Language;
  dict: TranslationDict;
}

type LocalAssistantStatus = 'not-connected' | 'checking' | 'available' | 'unavailable';
type AssistantProvider = 'local' | 'cloud' | null;

const labels = {
  fr: {
    title: 'Explainable AI-Guided Exact Search',
    badge: 'Educational transparent AI-guided branch ordering — exact only when search completes.',
    select: 'Exemple',
    start: 'Démarrer la recherche guidée',
    prev: 'Précédent',
    next: 'Suivant',
    end: 'Fin',
    reset: 'Réinitialiser',
    currentPath: 'Chemin courant',
    currentCandidate: 'Candidat courant',
    noActiveEvent: 'Aucun événement actif',
    guideTitle: 'AI Guide Decision',
    guideRule: 'Classement seulement — le solveur déterministe vérifie.',
    rankedList: 'Liste classée des candidats',
    noCandidates: 'Aucun candidat',
    proofTitle: 'Preuve exacte / statut',
    proofComplete: 'Preuve complète',
    incomplete: 'Incomplet',
    cap: 'Limite atteinte',
    cancelled: 'Annulé',
    counters: 'Compteurs',
    trace: 'Journal de recherche',
    currentEvent: 'Événement courant',
    activeStep: 'ÉTAPE ACTIVE',
    aspect: 'Aspect',
    method: 'AI-Guided Exact Search',
    guideRole: 'Rôle du guide',
    guideRoleValue: 'Choisit l’ordre des branches',
    validity: 'Validité',
    validityValue: 'Contraintes déterministes',
    optimality: 'Optimalité',
    optimalityValue: 'Exact quand complet',
    aiClaim: 'Revendication IA',
    aiClaimValue: 'Heuristique transparente, pas un LLM',
    legacyMatch: 'Résultat Legacy',
    best: 'Meilleur chemin',
    assistantTitle: 'Experimental Local AI Assistant',
    assistantButton: 'Ask local AI for branch explanation',
    assistantSuggestion: 'Local AI suggestion — advisory only',
    assistantCloudSuggestion: 'Cloud AI suggestion — advisory only',
    assistantDisclaimer: 'The deterministic exact solver remains the only source of validity and optimality.',
    assistantLocalOnly: 'Local Ollama is attempted first when available. Cloud AI advisory fallback is used in production when configured. Both are advisory only; the deterministic exact solver remains the sole source of validity and optimality.',
    assistantNeedsCandidates: 'Advance the search to a branch-ranking step first.',
    assistantUnavailable: 'AI assistant is unavailable; the deterministic guide remains active.',
  },
  en: {
    title: 'Explainable AI-Guided Exact Search',
    badge: 'Educational transparent AI-guided branch ordering — exact only when search completes.',
    select: 'Example',
    start: 'Start guided search',
    prev: 'Previous',
    next: 'Next',
    end: 'End',
    reset: 'Reset',
    currentPath: 'Current path',
    currentCandidate: 'Current candidate',
    noActiveEvent: 'No active event',
    guideTitle: 'AI Guide Decision',
    guideRule: 'Ranking only — deterministic solver verifies.',
    rankedList: 'Ranked candidate list',
    noCandidates: 'No candidates',
    proofTitle: 'Exact proof / status',
    proofComplete: 'Proof complete',
    incomplete: 'Incomplete',
    cap: 'Event cap reached',
    cancelled: 'Cancelled',
    counters: 'Counters',
    trace: 'Search trace journal',
    currentEvent: 'Current event',
    activeStep: 'ACTIVE STEP',
    aspect: 'Aspect',
    method: 'AI-Guided Exact Search',
    guideRole: 'Guide role',
    guideRoleValue: 'Chooses branch order',
    validity: 'Validity',
    validityValue: 'Deterministic constraints',
    optimality: 'Optimality',
    optimalityValue: 'Exact when complete',
    aiClaim: 'AI claim',
    aiClaimValue: 'Transparent heuristic, not an LLM',
    legacyMatch: 'Legacy result',
    best: 'Best path',
    assistantTitle: 'Experimental Local AI Assistant',
    assistantButton: 'Ask local AI for branch explanation',
    assistantSuggestion: 'Local AI suggestion — advisory only',
    assistantCloudSuggestion: 'Cloud AI suggestion — advisory only',
    assistantDisclaimer: 'The deterministic exact solver remains the only source of validity and optimality.',
    assistantLocalOnly: 'Local Ollama is attempted first when available. Cloud AI advisory fallback is used in production when configured. Both are advisory only; the deterministic exact solver remains the sole source of validity and optimality.',
    assistantNeedsCandidates: 'Advance the search to a branch-ranking step first.',
    assistantUnavailable: 'AI assistant is unavailable; the deterministic guide remains active.',
  },
  ar: {
    title: 'Explainable AI-Guided Exact Search',
    badge: 'Educational transparent AI-guided branch ordering — exact only when search completes.',
    select: 'المثال',
    start: 'بدء البحث الموجه',
    prev: 'السابق',
    next: 'التالي',
    end: 'النهاية',
    reset: 'إعادة تعيين',
    currentPath: 'المسار الحالي',
    currentCandidate: 'المرشح الحالي',
    noActiveEvent: 'لا يوجد حدث نشط',
    guideTitle: 'قرار دليل AI',
    guideRule: 'ترتيب فقط — يتحقق المحلل الحتمي.',
    rankedList: 'قائمة المرشحين المرتبة',
    noCandidates: 'لا يوجد مرشحون',
    proofTitle: 'البرهان الدقيق / الحالة',
    proofComplete: 'برهان مكتمل',
    incomplete: 'غير مكتمل',
    cap: 'تم بلوغ الحد',
    cancelled: 'ملغى',
    counters: 'العدادات',
    trace: 'سجل تتبع البحث',
    currentEvent: 'الحدث الحالي',
    activeStep: 'الخطوة النشطة',
    aspect: 'الجانب',
    method: 'AI-Guided Exact Search',
    guideRole: 'دور الدليل',
    guideRoleValue: 'يختار ترتيب الفروع',
    validity: 'الصلاحية',
    validityValue: 'قيود حتمية',
    optimality: 'الأمثلية',
    optimalityValue: 'دقيق عند الاكتمال',
    aiClaim: 'ادعاء AI',
    aiClaimValue: 'استدلال شفاف، وليس LLM',
    legacyMatch: 'نتيجة Legacy',
    best: 'أفضل مسار',
    assistantTitle: 'Experimental Local AI Assistant',
    assistantButton: 'Ask local AI for branch explanation',
    assistantSuggestion: 'Local AI suggestion — advisory only',
    assistantCloudSuggestion: 'Cloud AI suggestion — advisory only',
    assistantDisclaimer: 'The deterministic exact solver remains the only source of validity and optimality.',
    assistantLocalOnly: 'Local Ollama is attempted first when available. Cloud AI advisory fallback is used in production when configured. Both are advisory only; the deterministic exact solver remains the sole source of validity and optimality.',
    assistantNeedsCandidates: 'Advance the search to a branch-ranking step first.',
    assistantUnavailable: 'AI assistant is unavailable; the deterministic guide remains active.',
  },
} satisfies Record<Language, Record<string, string>>;

const localAssistantStatusText: Record<LocalAssistantStatus, string> = {
  'not-connected': 'Not connected',
  checking: 'Checking Ollama',
  available: 'Available locally',
  unavailable: 'Unavailable — deterministic guide remains active',
};

const cloudAssistantStatusText: Record<LocalAssistantStatus, string> = {
  ...localAssistantStatusText,
  available: 'Available from cloud',
};

function pathText(path: string[] | null | undefined): string {
  return path && path.length > 0 ? `\u202A${path.join(' -> ')}\u202C` : 'N/A';
}

function traceEventId(exampleId: string, event: AIGuidedTraceEvent, index: number): string {
  return `ai-guided:${exampleId}:${index + 1}:${event.stepCount}:${event.type}`;
}

function canonicalIndex(index: number, traceLength: number): number {
  if (traceLength <= 0 || index < 0) return -1;
  return Math.min(index, traceLength - 1);
}

function statusText(result: ReturnType<typeof solveAIGuidedExact>, t: typeof labels.en): string {
  if (result.cancelled) return t.cancelled;
  if (result.interruptedByCap) return t.cap;
  if (result.searchCompleted && result.proofCompleteEmitted) return t.proofComplete;
  return t.incomplete;
}

function buildLocalAssistantPrompt(event: AIGuidedTraceEvent | null): string {
  const candidates = event?.rankedCandidates || [];
  return [
    `current path: ${event?.currentPath.length ? event.currentPath.join(' -> ') : 'empty'}`,
    `current candidate branches: ${candidates.map((candidate) => candidate.vertex).join(', ') || 'none'}`,
    'deterministic guide scores:',
    ...candidates.map((candidate) => `${candidate.vertex}: score=${candidate.priorityScore}, genomicSupport=${candidate.genomicSupportLinks}`),
    'instruction: rank candidates and explain in 3 short bullets.',
    'instruction: do not claim proof or validity.',
  ].join('\n');
}

function readOllamaResponseText(payload: unknown): string | null {
  if (!payload || typeof payload !== 'object') return null;
  const record = payload as { message?: { content?: unknown }; response?: unknown };
  if (typeof record.message?.content === 'string' && record.message.content.trim()) return record.message.content.trim();
  if (typeof record.response === 'string' && record.response.trim()) return record.response.trim();
  return null;
}

function readCloudAssistantResponseText(payload: unknown): string | null {
  if (!payload || typeof payload !== 'object') return null;
  const record = payload as { ok?: unknown; advisory?: unknown };
  if (record.ok !== true) return null;
  if (typeof record.advisory === 'string' && record.advisory.trim()) return record.advisory.trim();
  return null;
}

function buildCloudAssistantPayload(event: AIGuidedTraceEvent, locale: Language) {
  return {
    currentPath: event.currentPath,
    locale,
    rankedCandidates: event.rankedCandidates.slice(0, 3).map((candidate) => ({
      vertex: candidate.vertex,
      priorityScore: candidate.priorityScore,
      genomicSupportLinks: candidate.genomicSupportLinks,
    })),
  };
}

export const AIGuidedExactModel: React.FC<AIGuidedExactModelProps> = ({ lang, dict }) => {
  const isAr = lang === 'ar';
  const t = labels[lang];
  const [selectedExampleId, setSelectedExampleId] = useState('multiple-candidates');
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [viewTab, setViewTab] = useState<'D' | 'G'>('D');
  const [assistantStatus, setAssistantStatus] = useState<LocalAssistantStatus>('not-connected');
  const [assistantProvider, setAssistantProvider] = useState<AssistantProvider>(null);
  const [assistantText, setAssistantText] = useState('');

  const currentExample = useMemo(
    () => examples.find((example) => example.id === selectedExampleId) || examples[0],
    [selectedExampleId]
  );
  const result = useMemo(
    () => solveAIGuidedExact(currentExample.vertices, currentExample.edgesD, currentExample.edgesG),
    [currentExample]
  );
  const legacy = useMemo(
    () => solveConsistentPath(currentExample.vertices, currentExample.edgesD, currentExample.edgesG),
    [currentExample]
  );

  const trace = result.trace;
  const activeIndex = canonicalIndex(currentStepIndex, trace.length);
  const activeEvent = activeIndex >= 0 ? trace[activeIndex] : null;
  const hasRankedCandidates = (activeEvent?.rankedCandidates.length || 0) > 0;
  const activeId = activeEvent ? traceEventId(selectedExampleId, activeEvent, activeIndex) : null;
  const activePath = activeEvent?.currentPath || [];
  const activeInspectorKey = activeEvent?.type === 'guide-decision' ? 'guide' : activeEvent?.type === 'proof-complete' ? 'proof' : 'path';
  const { cockpitRef, traceScrollerRef, setInspectorScrollerRef, scrollCockpitIntoViewForPlay } = useMethodCockpitSync(
    activeIndex,
    activeInspectorKey,
    trace,
    activeId
  );

  const handleStepChange = (index: number) => setCurrentStepIndex(canonicalIndex(index, trace.length));
  const handleExampleSelect = (id: string) => {
    setSelectedExampleId(id);
    setCurrentStepIndex(-1);
    setAssistantStatus('not-connected');
    setAssistantProvider(null);
    setAssistantText('');
  };
  const askLocalAssistant = async () => {
    if (!activeEvent || !hasRankedCandidates) {
      setAssistantText('');
      return;
    }
    setAssistantStatus('checking');
    setAssistantProvider(null);
    setAssistantText('');
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), OLLAMA_TIMEOUT_MS);

    try {
      const response = await fetch(OLLAMA_CHAT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          model: OLLAMA_MODEL,
          stream: false,
          messages: [
            {
              role: 'user',
              content: buildLocalAssistantPrompt(activeEvent),
            },
          ],
        }),
      });
      if (!response.ok) throw new Error('Local Ollama request failed.');
      const text = readOllamaResponseText(await response.json());
      if (!text) throw new Error('Local Ollama returned malformed content.');
      setAssistantStatus('available');
      setAssistantProvider('local');
      setAssistantText(text);
    } catch {
      try {
        const cloudResponse = await fetch(CLOUD_ASSISTANT_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(buildCloudAssistantPayload(activeEvent, lang)),
        });
        if (!cloudResponse.ok) throw new Error('Cloud AI request failed.');
        const cloudText = readCloudAssistantResponseText(await cloudResponse.json());
        if (!cloudText) throw new Error('Cloud AI returned malformed content.');
        setAssistantStatus('available');
        setAssistantProvider('cloud');
        setAssistantText(cloudText);
      } catch {
        setAssistantStatus('unavailable');
        setAssistantProvider(null);
        setAssistantText(t.assistantUnavailable);
      }
    } finally {
      window.clearTimeout(timeout);
    }
  };

  return (
    <div style={{ textAlign: isAr ? 'right' : 'left', direction: isAr ? 'rtl' : 'ltr' }}>
      <div className="sr-only" aria-live="assertive">{activeEvent?.message || ''}</div>
      <header style={{ marginBlockEnd: 'var(--space-md)' }}>
        <h2 style={{ fontSize: '1.6rem', color: 'var(--primary)', border: 'none', marginBlockEnd: 'var(--space-xs)' }}>{t.title}</h2>
        <p style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--primary)', backgroundColor: 'var(--primary-bg)', border: '1px solid var(--primary)', borderRadius: 'var(--radius-sm)', padding: 'var(--space-sm)' }}>
          {t.badge}
        </p>
      </header>

      <section className="card" style={{ padding: 'var(--space-md)', marginBlockEnd: 'var(--space-md)' }}>
        <label style={{ display: 'grid', gap: 'var(--space-xs)', maxWidth: '360px' }}>
          <span style={{ fontWeight: 700 }}>{t.select}</span>
          <select value={selectedExampleId} onChange={(event) => handleExampleSelect(event.target.value)} disabled={activeEvent !== null} style={{ padding: 'var(--space-sm)', minHeight: '44px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
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
            totalSteps={trace.length}
            onStepChange={handleStepChange}
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
              isFinalResult={activeEvent?.type === 'proof-complete'}
              isAcceptedStep={activeEvent?.type === 'candidate-path' || activeEvent?.type === 'incumbent-update' || activeEvent?.type === 'proof-complete'}
              lang={lang}
              dict={dict}
              mobileActiveTab={viewTab}
            />
          </>
        )}
        state={(
          <section className="card">
            <h3 style={{ color: 'var(--primary)', fontSize: '1.1rem' }}><span className="icon-label"><Icon name="search" /> {t.guideTitle}</span></h3>
            <dl ref={setInspectorScrollerRef} data-testid="method-inspector-scroll" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-sm)', fontSize: '0.9rem', overflowY: 'auto' }}>
              <dt data-inspector-key="path" className={activeInspectorKey === 'path' ? 'method-cockpit__active-row' : ''}>{t.currentPath}</dt><dd dir="ltr">{pathText(activePath)}</dd>
              <dt data-inspector-key="candidate">{t.currentCandidate}</dt><dd dir="ltr">{activeEvent?.currentCandidate || 'N/A'}</dd>
            </dl>
            <p data-inspector-key="guide" className={activeInspectorKey === 'guide' ? 'method-cockpit__active-row' : ''} style={{ marginBlock: 'var(--space-sm)', fontWeight: 800, color: 'var(--primary)' }}>
              {t.guideRule}
            </p>
            <h4 style={{ fontSize: '0.9rem', color: 'var(--primary)' }}>{t.rankedList}</h4>
            {activeEvent?.rankedCandidates.length ? (
              <ol style={{ paddingInlineStart: isAr ? 0 : '1.25rem', paddingInlineEnd: isAr ? '1.25rem' : 0, marginBlockEnd: 0 }}>
                {activeEvent.rankedCandidates.map((candidate) => (
                  <li key={candidate.vertex} style={{ marginBlockEnd: 'var(--space-sm)' }}>
                    <strong dir="ltr">{candidate.vertex}</strong> <span dir="ltr">score {candidate.priorityScore}</span>
                    <ul style={{ marginBlockStart: 2, fontSize: '0.82rem' }}>
                      {candidate.rationale.map((reason) => <li key={reason}>{reason}</li>)}
                    </ul>
                  </li>
                ))}
              </ol>
            ) : (
              <p style={{ marginBlockEnd: 0 }}>{t.noCandidates}</p>
            )}
          </section>
        )}
        constraints={(
          <section className="card">
            <h3 data-inspector-key="proof" className={activeInspectorKey === 'proof' ? 'method-cockpit__active-row' : ''} style={{ color: 'var(--primary)', fontSize: '1.1rem' }}>
              <span className="icon-label"><Icon name="shield" /> {t.proofTitle}</span>
            </h3>
            <dl style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-sm)', fontSize: '0.9rem' }}>
              <dt>{t.best}</dt><dd dir="ltr">{pathText(activeEvent?.bestPath || result.bestPath)}</dd>
              <dt>{t.legacyMatch}</dt><dd dir="ltr">{pathText(legacy.longestConsistentPath)}</dd>
              <dt>{t.counters}</dt><dd>{result.counters.branchesExplored} branches, {result.counters.candidatesRanked} ranked</dd>
              <dt>Status</dt><dd>{statusText(result, t as typeof labels.en)}</dd>
            </dl>
            <p style={{ marginBlockEnd: 0, fontWeight: 700, color: 'var(--primary)' }}>{t.badge}</p>
          </section>
        )}
        trace={(
          <section className="card" style={{ display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ color: 'var(--primary)', fontSize: '1.1rem', marginBlockEnd: 'var(--space-sm)' }}><span className="icon-label"><Icon name="ledger" /> {t.trace}</span></h3>
            <article
              data-testid="ai-guided-active-trace-state"
              data-current-step-index={activeIndex}
              data-trace-event-id={activeId || ''}
              data-event-type={activeEvent?.type || ''}
              style={{ marginBlockEnd: 'var(--space-sm)', padding: 'var(--space-sm)', border: '2px solid var(--accent-gold)', borderInlineStart: '8px solid var(--accent-gold)', borderRadius: 'var(--radius-sm)', background: 'var(--primary-bg)' }}
            >
              <strong style={{ color: 'var(--primary)', fontSize: '0.86rem' }}>{t.currentEvent}</strong>
              {activeEvent && <span style={{ marginInlineStart: 'var(--space-sm)', background: 'var(--accent-gold)', color: 'var(--primary)', borderRadius: 'var(--radius-sm)', padding: '2px 8px', fontSize: '0.7rem', fontWeight: 900 }}>{t.activeStep}</span>}
              <div style={{ color: 'var(--primary)', fontWeight: 900, fontSize: '1rem' }}>
                {activeEvent ? `${activeIndex + 1} / ${trace.length}` : `0 / ${trace.length}`}
              </div>
              <p style={{ marginBlockEnd: 0, fontSize: '0.86rem' }}>{activeEvent?.message || t.noActiveEvent}</p>
            </article>
            <div ref={traceScrollerRef} data-testid="method-trace-scroll" style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {trace.map((event, index) => {
                const eventId = traceEventId(selectedExampleId, event, index);
                const isActive = eventId === activeId;
                return (
                  <button
                    key={eventId}
                    data-trace-index={index}
                    data-trace-event-id={eventId}
                    data-event-type={event.type}
                    data-active-trace={isActive ? 'true' : 'false'}
                    type="button"
                    aria-current={isActive ? 'step' : undefined}
                    className={isActive ? 'method-cockpit__active-row' : undefined}
                    onClick={() => handleStepChange(index)}
                    style={{ textAlign: isAr ? 'right' : 'left', border: isActive ? '2px solid var(--accent-gold)' : '1px solid transparent', borderInlineStart: isActive ? '6px solid var(--accent-gold)' : '3px solid transparent', background: isActive ? 'var(--primary-bg)' : 'transparent', padding: '6px var(--space-sm)', cursor: 'pointer', borderRadius: 'var(--radius-sm)', fontFamily: 'inherit' }}
                  >
                    <strong style={{ display: 'block', color: event.type === 'genomic-rejection' ? 'var(--danger)' : 'var(--primary)', textTransform: 'uppercase', fontSize: '0.72rem' }}>{event.type}</strong>
                    <span style={{ fontSize: '0.82rem' }}>{event.message}</span>
                  </button>
                );
              })}
            </div>
          </section>
        )}
      />

      <section className="card" style={{ marginBlockEnd: 'var(--space-md)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--space-sm)', flexWrap: 'wrap', marginBlockEnd: 'var(--space-sm)' }}>
          <h3 style={{ color: 'var(--primary)', fontSize: '1.1rem', margin: 0 }}>
            <span className="icon-label"><Icon name="info" /> {t.assistantTitle}</span>
          </h3>
          <span aria-live="polite" style={{ fontWeight: 800, color: assistantStatus === 'available' ? 'var(--success)' : assistantStatus === 'unavailable' ? 'var(--danger)' : 'var(--neutral-medium)' }}>
            {(assistantProvider === 'cloud' ? cloudAssistantStatusText : localAssistantStatusText)[assistantStatus]}
          </span>
        </div>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={askLocalAssistant}
          disabled={assistantStatus === 'checking' || !hasRankedCandidates}
          style={{ width: 'auto', minHeight: 38, marginBlockEnd: 'var(--space-sm)' }}
        >
          {t.assistantButton}
        </button>
        {!hasRankedCandidates && (
          <p style={{ marginBlock: '0 var(--space-sm)', fontWeight: 700, color: 'var(--neutral-medium)' }}>
            {t.assistantNeedsCandidates}
          </p>
        )}
        <p style={{ marginBlock: '0 var(--space-sm)', fontWeight: 700, color: 'var(--primary)' }}>
          {t.assistantDisclaimer}
        </p>
        <p style={{ marginBlock: '0 var(--space-sm)', fontSize: '0.86rem', color: 'var(--neutral-medium)' }}>
          {t.assistantLocalOnly}
        </p>
        {assistantText && (
          <div>
            <h4 style={{ color: 'var(--primary)', fontSize: '0.95rem', marginBlockEnd: 'var(--space-xs)' }}>
              {assistantProvider === 'cloud' ? t.assistantCloudSuggestion : t.assistantSuggestion}
            </h4>
            <pre style={{ whiteSpace: 'pre-wrap', maxHeight: 160, overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: 'var(--space-sm)', background: 'var(--neutral-bg-hover)', fontFamily: 'var(--font-sans)', fontSize: '0.86rem' }}>
              {assistantText}
            </pre>
          </div>
        )}
      </section>

      <section className="card" style={{ marginBlockEnd: 'var(--space-md)' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
            <thead>
              <tr>
                <th style={{ textAlign: isAr ? 'right' : 'left', borderBottom: '2px solid var(--border-color)', padding: '8px' }}>{t.aspect}</th>
                <th style={{ textAlign: isAr ? 'right' : 'left', borderBottom: '2px solid var(--border-color)', padding: '8px' }}>{t.method}</th>
              </tr>
            </thead>
            <tbody>
              {[
                [t.guideRole, t.guideRoleValue],
                [t.validity, t.validityValue],
                [t.optimality, t.optimalityValue],
                [t.aiClaim, t.aiClaimValue],
              ].map(([aspect, value]) => (
                <tr key={aspect}>
                  <td style={{ padding: '8px', borderBottom: '1px solid var(--border-color)', fontWeight: 700 }}>{aspect}</td>
                  <td style={{ padding: '8px', borderBottom: '1px solid var(--border-color)' }}>{value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

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
