// @vitest-environment jsdom
import { describe, test, expect, beforeAll, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup, act, within } from '@testing-library/react';
import App from '../App';
import { translations } from '../i18n/translations';
import { solveCP1 } from '../domain/cpSolver';
import type { CP1TraceEvent } from '../domain/cpSolver';
import { solveConsistentPath } from '../domain/pathAlgorithms';
import { examples } from '../data/examples';
import { getCP1InspectorKeyForTraceEvent } from './cp1InspectorSync';
import { useMethodCockpitSync } from './useMethodCockpitSync';
import { GraphPanel } from './GraphPanel';

function MethodCockpitSyncHarness({
  activeTraceIndex,
  activeInspectorKey,
  traceIdentity,
}: {
  activeTraceIndex: number;
  activeInspectorKey: string | null;
  traceIdentity: unknown;
}) {
  const { traceScrollerRef, setInspectorScrollerRef } = useMethodCockpitSync(
    activeTraceIndex,
    activeInspectorKey,
    traceIdentity
  );

  return (
    <>
      <div ref={traceScrollerRef} data-testid="method-trace-scroll">
        <div data-trace-index="0">first</div>
        <div data-trace-index="1">second</div>
      </div>
      <div ref={setInspectorScrollerRef} data-testid="method-inspector-scroll">
        <div data-inspector-key="x[R1]">x R1</div>
      </div>
    </>
  );
}

function getCP2ActiveTraceParts(container: HTMLElement) {
  const currentCard = screen.getByTestId('cp2-active-trace-state') as HTMLElement;
  const activeTrace = container.querySelector('[aria-current="step"]') as HTMLElement | null;
  expect(activeTrace).toBeDefined();
  expect(container.querySelectorAll('[aria-current="step"]').length).toBe(1);
  return {
    currentCard,
    activeTrace: activeTrace as HTMLElement,
    cardEventId: currentCard.getAttribute('data-trace-event-id') || '',
    activeEventId: activeTrace?.getAttribute('data-trace-event-id') || '',
    cardIndex: currentCard.getAttribute('data-current-step-index') || '',
    activeIndex: activeTrace?.getAttribute('data-trace-index') || '',
    cardType: currentCard.getAttribute('data-event-type') || '',
    activeType: activeTrace?.getAttribute('data-event-type') || '',
  };
}

function expectCP2CanonicalTraceMatch(container: HTMLElement, zeroBasedIndex: number) {
  const parts = getCP2ActiveTraceParts(container);
  const ordinal = zeroBasedIndex + 1;
  expect(parts.cardIndex).toBe(String(zeroBasedIndex));
  expect(parts.activeIndex).toBe(String(zeroBasedIndex));
  expect(parts.cardEventId).toBeTruthy();
  expect(parts.cardEventId).toBe(parts.activeEventId);
  expect(parts.cardType).toBe(parts.activeType);
  expect(screen.getByText(new RegExp(`Étape: ${ordinal} /`, 'i'))).toBeDefined();
  expect(screen.getByTestId('cp2-current-event-title').textContent).toBe('Current event');
  expect(screen.getByTestId('cp2-current-event-ordinal').textContent).toContain(`${ordinal} /`);
  expect(screen.getByTestId('cp2-current-event-type').textContent).toBe(parts.activeType.toUpperCase());
  expect(screen.getByTestId('cp2-current-event-status').textContent).toBe('ACTIVE STEP');
  expect(parts.activeTrace.textContent).toContain('ACTIVE STEP');
  expect(parts.activeTrace.textContent).toContain(parts.activeType.toUpperCase());
  const activeMessage = within(parts.activeTrace).getByTestId('cp2-active-trace-message');
  expect(screen.getByTestId('cp2-current-event-description').textContent).toBe(activeMessage.textContent);
  expect(activeMessage.textContent?.trim().length).toBeGreaterThan(0);
  const futureRows = Array.from(container.querySelectorAll<HTMLElement>('[data-trace-index]'))
    .filter((row) => Number(row.getAttribute('data-trace-index')) > zeroBasedIndex);
  expect(futureRows.every((row) => !row.textContent?.includes('ACTIVE STEP'))).toBe(true);
}

describe('Routing and Educational UI QA Suite', () => {
  beforeAll(() => {
    const meta = document.createElement('meta');
    meta.setAttribute('name', 'description');
    document.head.appendChild(meta);
  });

  afterEach(() => {
    cleanup();
    window.localStorage.clear();
  });

  test('all routes render properly through navbar navigation', () => {
    render(<App />);

    // Root route should render Start Here by default
    expect(screen.getByText(/Module d'Apprentissage Pas-à-Pas/i)).toBeDefined();

    // Click "Carte des Méthodes"
    const methodsLink = screen.getByText('Carte des Méthodes');
    fireEvent.click(methodsLink);
    expect(screen.getByText('Carte des Méthodes de Recherche')).toBeDefined();

    // Click "Modèle CP1"
    const cp1Link = screen.getByText('Modèle CP1');
    fireEvent.click(cp1Link);
    expect(screen.getByText('Modèle Éducatif CP1 — Programmation par Contraintes')).toBeDefined();

    // Click "Modèle CP2"
    const cp2Link = screen.getByText('Modèle CP2');
    fireEvent.click(cp2Link);
    expect(screen.getByText('CP2 — CP1 avec Bornes Supérieures Sûres')).toBeDefined();

    const aiGuidedLink = screen.getByText('Recherche guidée AI');
    fireEvent.click(aiGuidedLink);
    expect(screen.getAllByText('Explainable AI-Guided Exact Search').length).toBeGreaterThan(0);

    // Click "Modèle ILP1"
    const ilp1Link = screen.getByText('Modèle ILP1');
    fireEvent.click(ilp1Link);
    expect(screen.getByText('ILP1 — Décisions Binaires et Contraintes Linéaires')).toBeDefined();

    // Click "Modèle ILP2"
    const ilp2Link = screen.getByText('Modèle ILP2');
    fireEvent.click(ilp2Link);
    expect(screen.getByText('ILP2 — Rooted Connectivity with Levels')).toBeDefined();

    // Click "Démo Énumération (Legacy)"
    const legacyLink = screen.getByText('Démo Énumération (Legacy)');
    fireEvent.click(legacyLink);
    expect(screen.getByText(translations.fr.selectionTitle)).toBeDefined();
  });

  test('Subset DP is labeled as an educational exact method, not a paper-derived method', () => {
    window.history.pushState({}, '', '/methods');
    render(<App />);

    const subsetCard = screen.getByText('Exact Subset Dynamic Programming').closest('.card') as HTMLElement;
    expect(subsetCard).toBeDefined();
    expect(within(subsetCard).getByText('Méthode exacte pédagogique')).toBeDefined();
    expect(subsetCard.textContent).not.toMatch(/Educational Paper|papier pédagogique/i);

    fireEvent.click(screen.getByText('English'));
    const englishSubsetCard = screen.getByText('Exact Subset Dynamic Programming').closest('.card') as HTMLElement;
    expect(within(englishSubsetCard).getByText('Educational exact method')).toBeDefined();
    expect(englishSubsetCard.textContent).not.toContain('Educational Paper');
  });

  test('all public routes render their expected page surfaces', () => {
    const routes = [
      { path: '/', text: /Module d'Apprentissage Pas-à-Pas/i },
      { path: '/methods', text: /Carte des Méthodes de Recherche/i },
      { path: '/methods/cp1', text: /Modèle Éducatif CP1/i },
      { path: '/methods/algobb-plus-plus', text: /AlgoBB\+\+ éducatif/i },
      { path: '/methods/cp2', text: /CP2/i },
      { path: '/methods/ai-guided-exact', text: /Explainable AI-Guided Exact Search/i },
      { path: '/methods/subset-dp', text: /Exact Subset Dynamic Programming/i },
      { path: '/methods/ilp1', text: /ILP1/i },
      { path: '/methods/cp3', text: /CP3/i },
      { path: '/methods/cp4', text: /CP4/i },
      { path: '/methods/ilp1', text: /ILP1/i },
      { path: '/methods/ilp2', text: /ILP2/i },
      { path: '/methods/hnet', text: /HNet/i },
      { path: '/methods/enumeration', text: /Énumération Arc-par-Arc/i },
      { path: '/methods/conservation', text: /Regroupement de Pistes/i },
      { path: '/legacy', text: translations.fr.selectionTitle },
    ];

    for (const route of routes) {
      cleanup();
      window.history.pushState({}, '', route.path);
      render(<App />);
      expect(screen.getAllByText(route.text).length).toBeGreaterThan(0);
    }
  });

  test('method badges match declared status', () => {
    window.history.pushState({}, '', '/methods');
    render(<App />);

    // Check CP1 has exact badge
    expect(screen.getAllByText(/Implémentation graphe borné exact/i).length).toBeGreaterThan(0);
    // Check CP2 is now included in the exact small-graph implementation group
    expect(screen.getAllByText(/Implémentation exacte pour petits DAG/i).length).toBeGreaterThanOrEqual(2);
    // Check ILP1 and ILP2 are now included in the exact small-graph implementation group
    expect(screen.getByText(/Formulation éducative bornée exacte/i)).toBeDefined();
    expect(screen.getByText(/racine génomique, liens parents et niveaux/i)).toBeDefined();
    // Check paper-only methods still keep reference badges
    expect(screen.getAllByText(/Méthode de référence papier/i).length).toBeGreaterThan(0);
    // Check Enumeration has simulation badge
    expect(screen.getAllByText(/Simulation pédagogique/i).length).toBeGreaterThan(0);
  });

  test('Start Here chapters and checkpoint questions function correctly', () => {
    window.history.pushState({}, '', '/');
    render(<App />);

    // We are on Chapter 1 by default: "1. Qu'est-ce qu'un graphe ?"
    expect(screen.getAllByText(/1. Qu'est-ce qu'un graphe \?/i).length).toBeGreaterThan(0);

    // Answer the checkpoint question. Correct option is "Des sommets et des liaisons" (Index 0)
    const optionBtn = screen.getByText('Des sommets et des liaisons');
    fireEvent.click(optionBtn);

    // Feedback should show correct message
    expect(screen.getByText(/Correct !/i)).toBeDefined();
  });

  test('language switcher preserves path and updates directionality', () => {
    window.history.pushState({}, '', '/methods/cp1');
    render(<App />);

    // Title is in French
    expect(screen.getByText('Modèle Éducatif CP1 — Programmation par Contraintes')).toBeDefined();

    // Switch to English
    const enBtn = screen.getByText('English');
    fireEvent.click(enBtn);

    // Verify path is preserved (we are still on CP1 Model) and translation changed
    expect(screen.getByText('CP1 Educational Model — Constraint Programming')).toBeDefined();
    expect(document.documentElement.lang).toBe('en');
    expect(document.documentElement.dir).toBe('ltr');

    // Switch to Arabic
    const arBtn = screen.getByText('العربية');
    fireEvent.click(arBtn);

    // Check Arabic title and RTL direction
    expect(screen.getByText('نموذج CP1 التعليمي — البرمجة بالقيود')).toBeDefined();
    expect(document.documentElement.lang).toBe('ar');
    expect(document.documentElement.dir).toBe('rtl');
  });

  test('SVG arrow directions and geometry do not change in Arabic RTL', () => {
    window.history.pushState({}, '', '/legacy');
    render(<App />);

    const graphSection = screen.getByText(translations.fr.visTitle);
    expect(graphSection).toBeDefined();

    const arBtn = screen.getByText('العربية');
    fireEvent.click(arBtn);

    const svgD = document.querySelector('svg');
    expect(svgD).toBeDefined();
    expect(svgD?.getAttribute('dir')).toBeNull();
  });

  test('SVG coordinates, markerEnd, arrows, nodes, paths, and markers are completely invariant across French, English, and Arabic', () => {
    window.history.pushState({}, '', '/legacy');
    const { container } = render(<App />);

    const getSvgGeometry = () => {
      // Node circles
      const circles = Array.from(container.querySelectorAll('circle')).map(c => ({
        cx: c.getAttribute('cx'),
        cy: c.getAttribute('cy'),
        r: c.getAttribute('r'),
      }));
      // Node transforms
      const nodeGroups = Array.from(container.querySelectorAll('.graph-node')).map(n => n.getAttribute('transform'));
      // Lines
      const lines = Array.from(container.querySelectorAll('line')).map(l => ({
        x1: l.getAttribute('x1'),
        y1: l.getAttribute('y1'),
        x2: l.getAttribute('x2'),
        y2: l.getAttribute('y2'),
        markerEnd: l.getAttribute('marker-end') || l.getAttribute('markerEnd'),
      }));
      // Paths
      const paths = Array.from(container.querySelectorAll('path')).map(p => ({
        d: p.getAttribute('d'),
        markerEnd: p.getAttribute('marker-end') || p.getAttribute('markerEnd'),
      }));
      // Markers in defs
      const markers = Array.from(container.querySelectorAll('marker')).map(m => ({
        id: m.getAttribute('id'),
        refX: m.getAttribute('refX'),
        refY: m.getAttribute('refY'),
        markerWidth: m.getAttribute('markerWidth'),
        markerHeight: m.getAttribute('markerHeight'),
      }));
      return { circles, nodeGroups, lines, paths, markers };
    };

    // French
    const geomFr = getSvgGeometry();

    // Switch to English
    const enBtn = screen.getByText('English');
    fireEvent.click(enBtn);
    const geomEn = getSvgGeometry();

    // Switch to Arabic
    const arBtn = screen.getByText('العربية');
    fireEvent.click(arBtn);
    const geomAr = getSvgGeometry();

    // Verify complete structural invariance
    expect(geomFr).toEqual(geomEn);
    expect(geomEn).toEqual(geomAr);
  });

  test('Mobile viewport tabs are functional and toggle visibility/accessibility at 320px and 390px', () => {
    window.history.pushState({}, '', '/methods/cp1');
    const { container } = render(<App />);

    // Test both 320px and 390px viewports
    const viewports = [320, 390];
    for (const width of viewports) {
      // Set viewport width
      window.innerWidth = width;
      window.dispatchEvent(new Event('resize'));

      // Force mobile view display in jsdom
      const mobileSelector = container.querySelector('.show-mobile-only') as HTMLElement;
      if (mobileSelector) {
        mobileSelector.style.display = 'flex';
      }

      // Find the mobile view selector controls
      const btnTabD = screen.getByRole('button', { name: /D \(Metabolism\)/i, hidden: true });
      const btnTabG = screen.getByRole('button', { name: /G \(Genome\)/i, hidden: true });

      // Both controls must be available
      expect(btnTabD).toBeDefined();
      expect(btnTabG).toBeDefined();

      // Get the two wrapper containers of DirectedGraph and GenomicGraph.
      const wrappers = container.querySelectorAll('.graph-panel-container .grid-2 > div');
      expect(wrappers.length).toBe(2);
      const wrapperD = wrappers[0];
      const wrapperG = wrappers[1];

      // --- Select Graph D ---
      fireEvent.click(btnTabD);

      // Verify only Graph D is visible and accessible
      expect(wrapperD.classList.contains('mobile-hide-graph')).toBe(false);
      expect(wrapperD.getAttribute('aria-hidden')).toBe('false');

      // Verify inactive Graph G is not visible or accessible
      expect(wrapperG.classList.contains('mobile-hide-graph')).toBe(true);
      expect(wrapperG.getAttribute('aria-hidden')).toBe('true');

      // --- Select Graph G ---
      fireEvent.click(btnTabG);

      // Verify only Graph G is visible and accessible
      expect(wrapperG.classList.contains('mobile-hide-graph')).toBe(false);
      expect(wrapperG.getAttribute('aria-hidden')).toBe('false');

      // Verify inactive Graph D is not visible or accessible
      expect(wrapperD.classList.contains('mobile-hide-graph')).toBe(true);
      expect(wrapperD.getAttribute('aria-hidden')).toBe('true');
    }
  });

  test('shared graph visualization uses readable viewports, labels, arrows, and genomic edge states', () => {
    window.history.pushState({}, '', '/methods/cp1');
    const { container } = render(<App />);

    const directedSvg = container.querySelector('[data-testid="directed-graph-svg"]');
    const genomicSvg = container.querySelector('[data-testid="genomic-graph-svg"]');
    expect(directedSvg).toBeDefined();
    expect(genomicSvg).toBeDefined();

    expect(directedSvg?.getAttribute('viewBox')).not.toBe('0 0 600 300');
    expect(genomicSvg?.getAttribute('viewBox')).not.toBe('0 0 600 300');
    expect(directedSvg?.getAttribute('preserveAspectRatio')).toBe('xMidYMid meet');
    expect(genomicSvg?.getAttribute('preserveAspectRatio')).toBe('xMidYMid meet');

    const nodeCircles = Array.from(container.querySelectorAll('[data-testid="directed-graph-svg"] circle'));
    expect(nodeCircles.some((circle) => circle.getAttribute('r') === '30')).toBe(true);
    expect(Array.from(container.querySelectorAll('text')).some((text) => text.textContent === 'R1')).toBe(true);

    const markers = Array.from(container.querySelectorAll('[data-testid="directed-graph-svg"] marker'));
    expect(markers.length).toBeGreaterThan(0);
    expect(markers.every((marker) => marker.getAttribute('markerWidth') === '10')).toBe(true);
    expect(container.querySelectorAll('[data-state="inactive-directed-edge"]').length).toBeGreaterThan(0);
    expect(container.querySelectorAll('[data-state="inactive-genomic-edge"]').length).toBeGreaterThan(0);

    fireEvent.click(screen.getAllByRole('button', { name: /Démarrer la recherche CP1/i })[0]);
    fireEvent.click(within(screen.getByTestId('method-playback-controls')).getByRole('button', { name: /Aller à la Fin/i }));
    expect(container.querySelectorAll('[data-state="active-genomic-edge"]').length).toBeGreaterThan(0);
  });

  test('every built-in example graph uses padded SVG viewBox and non-clipping graph containers', () => {
    for (const example of examples) {
      cleanup();
      const { container } = render(
        <GraphPanel
          vertices={example.vertices}
          edgesD={example.edgesD}
          edgesG={example.edgesG}
          nodePositions={example.nodePositions}
          highlightedNodes={new Set(example.vertices)}
          activePath={example.vertices}
          isFinalResult={false}
          isAcceptedStep
          lang="fr"
          dict={translations.fr}
        />
      );

      const positions = example.vertices.map((vertex) => example.nodePositions[vertex]);
      const minX = Math.min(...positions.map((position) => position.x));
      const maxX = Math.max(...positions.map((position) => position.x));
      const minY = Math.min(...positions.map((position) => position.y));
      const maxY = Math.max(...positions.map((position) => position.y));

      for (const selector of ['[data-testid="directed-graph-svg"]', '[data-testid="genomic-graph-svg"]']) {
        const svg = container.querySelector(selector) as SVGElement;
        const [viewMinX, viewMinY, viewWidth, viewHeight] = (svg.getAttribute('viewBox') || '').split(' ').map(Number);
        expect(viewMinX).toBeLessThanOrEqual(minX - 60);
        expect(viewMinY).toBeLessThanOrEqual(minY - 60);
        expect(viewMinX + viewWidth).toBeGreaterThanOrEqual(maxX + 60);
        expect(viewMinY + viewHeight).toBeGreaterThanOrEqual(maxY + 60);
        expect(svg.style.aspectRatio).toBe('');
        expect(svg.style.height).toBe('100%');
      }

      expect((container.querySelector('[data-testid="directed-graph-container"]') as HTMLElement).style.overflow).toBe('visible');
      expect((container.querySelector('[data-testid="genomic-graph-container"]') as HTMLElement).style.overflow).toBe('visible');
    }
  });

  test('CP1, CP2, Subset DP, ILP1, ILP2, AlgoBB++, and Legacy render graph sections with LTR graph containers in Arabic', () => {
    const routes = ['/methods/cp1', '/methods/cp2', '/methods/ai-guided-exact', '/methods/subset-dp', '/methods/ilp1', '/methods/ilp2', '/methods/algobb-plus-plus', '/legacy'];

    for (const route of routes) {
      cleanup();
      window.localStorage.clear();
      window.history.pushState({}, '', route);
      const { container } = render(<App />);
      expect(screen.getAllByText(translations.fr.visTitle).length).toBeGreaterThan(0);

      fireEvent.click(screen.getByText('العربية'));
      expect(document.documentElement.dir).toBe('rtl');
      expect(container.querySelector('[data-testid="directed-graph-container"]')?.getAttribute('dir')).toBe('ltr');
      expect(container.querySelector('[data-testid="genomic-graph-container"]')?.getAttribute('dir')).toBe('ltr');
    }
  });

  test('responsive layout components behave correctly across different screen resolutions', () => {
    window.history.pushState({}, '', '/methods/cp1');
    render(<App />);

    // Selector for mobile D/G graph tab controls
    const tabSelector = document.querySelector('.show-mobile-only');
    expect(tabSelector).toBeDefined();

    // Verify presence of synchronized containers for desktop and layout containers for mobile
    const cpVarInspector = screen.getByText(/Inspecteur des Variables CP1/i);
    expect(cpVarInspector).toBeDefined();
  });

  test('CP1, CP2, AI-guided, AlgoBB++, ILP1, and ILP2 display compact playback controls', () => {
    const routes = ['/methods/cp1', '/methods/cp2', '/methods/ai-guided-exact', '/methods/algobb-plus-plus', '/methods/ilp1', '/methods/ilp2'];

    for (const route of routes) {
      cleanup();
      window.history.pushState({}, '', route);
      render(<App />);
      expect(screen.getByTestId('method-playback-controls')).toBeDefined();
      expect(screen.getByRole('button', { name: /lecture|play|تشغيل/i })).toBeDefined();
      expect(screen.getByRole('button', { name: /réinitialiser|reset|إعادة/i })).toBeDefined();
    }
  }, 15000);

  test('CP1, CP2, AI-guided, AlgoBB++, ILP1, and ILP2 render the shared method cockpit', () => {
    const routes = ['/methods/cp1', '/methods/cp2', '/methods/ai-guided-exact', '/methods/algobb-plus-plus', '/methods/ilp1', '/methods/ilp2'];

    for (const route of routes) {
      cleanup();
      window.history.pushState({}, '', route);
      render(<App />);
      expect(screen.getByTestId('method-cockpit')).toBeDefined();
      expect(screen.getByTestId('method-cockpit-grid').classList.contains('method-cockpit__body')).toBe(true);
      expect(screen.getByTestId('method-cockpit-graph')).toBeDefined();
      expect(screen.getByTestId('method-cockpit-state')).toBeDefined();
      expect(screen.getByTestId('method-cockpit-constraints')).toBeDefined();
      expect(screen.getByTestId('method-cockpit-trace')).toBeDefined();
    }
  });

  test('manual and automatic step changes do not call document-level scroll APIs', () => {
    vi.useFakeTimers();
    const scrollToSpy = vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined);
    const scrollIntoViewSpy = vi.fn();
    Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
      configurable: true,
      value: scrollIntoViewSpy,
    });

    window.history.pushState({}, '', '/methods/cp2');
    render(<App />);

    const controls = within(screen.getByTestId('method-playback-controls'));
    fireEvent.click(controls.getByRole('button', { name: /Démarrer|Start|بدء/i }));
    fireEvent.click(controls.getByRole('button', { name: /Suivant|Next step|التالية/i }));
    fireEvent.click(controls.getByRole('button', { name: /Précédent|Previous|السابقة/i }));
    fireEvent.click(controls.getByRole('button', { name: /Lecture|Play|تشغيل/i }));
    scrollToSpy.mockClear();
    act(() => {
      vi.advanceTimersByTime(1100);
    });

    expect(scrollToSpy).not.toHaveBeenCalled();
    expect(scrollIntoViewSpy).not.toHaveBeenCalled();
    scrollToSpy.mockRestore();
    vi.useRealTimers();
  });

  test('each cockpit exposes one current active trace item after start', () => {
    const routes = ['/methods/cp1', '/methods/cp2', '/methods/ai-guided-exact', '/methods/algobb-plus-plus', '/methods/ilp1', '/methods/ilp2'];

    for (const route of routes) {
      cleanup();
      window.history.pushState({}, '', route);
      const { container } = render(<App />);
      const controls = within(screen.getByTestId('method-playback-controls'));
      fireEvent.click(controls.getByRole('button', { name: /Démarrer|Start|بدء/i }));
      expect(container.querySelectorAll('[data-active-trace="true"]').length).toBe(1);
    }
  });

  test('CP1 inspector active row follows trace step changes', () => {
    window.history.pushState({}, '', '/methods/cp1');
    const { container } = render(<App />);
    const controls = within(screen.getByTestId('method-playback-controls'));

    fireEvent.click(controls.getByRole('button', { name: /Démarrer|Start|بدء/i }));
    fireEvent.click(controls.getByRole('button', { name: /Suivant|Next step|التالية/i }));
    const firstActive = container.querySelector('[data-inspector-key].method-cockpit__active-row')?.getAttribute('data-inspector-key');

    fireEvent.click(controls.getByRole('button', { name: /Suivant|Next step|التالية/i }));
    const secondActive = container.querySelector('[data-inspector-key].method-cockpit__active-row')?.getAttribute('data-inspector-key');

    expect(firstActive).toBeTruthy();
    expect(secondActive).toBeTruthy();
  });

  test('CP1 maps representative trace events to exact rendered inspector keys', () => {
    const example = examples.find((ex) => ex.id === 'simple-valide') || examples[0];
    const result = solveCP1(example.vertices, example.edgesD, example.edgesG);
    const renderedKeys = new Set(['start', 'end', ...example.vertices.flatMap((vertex) => [`x[${vertex}]`, `succ[${vertex}]`])]);

    const startEvent = result.trace.find((event) => event.variable === 'start');
    const successorEvent = result.trace.find((event) => event.variable?.startsWith('succ['));
    const xAssignmentEvent = result.trace.find(
      (event) => !event.variable && /\bSet x\[[^\]]+\]\s*=\s*1\b/.test(event.message)
    );
    const endEvent = result.trace.find((event) => event.message.includes('Set end ='));

    expect(getCP1InspectorKeyForTraceEvent(startEvent || null, renderedKeys)).toBe('start');
    expect(getCP1InspectorKeyForTraceEvent(successorEvent || null, renderedKeys)).toMatch(/^succ\[R\d+\]$/);
    expect(getCP1InspectorKeyForTraceEvent(xAssignmentEvent || null, renderedKeys)).toMatch(/^x\[R\d+\]$/);
    expect(getCP1InspectorKeyForTraceEvent(endEvent || null, renderedKeys)).toBe('end');
  });

  test('CP1 does not derive an inspector key when no matching rendered row exists', () => {
    const event = {
      type: 'propagate',
      variable: 'x[missing]',
      message: 'Set x[missing] = 1.',
      currentPath: ['missing'],
      bestPath: null,
      stepCount: 1,
      domains: { x: {}, succ: {}, start: [], end: [] },
    } satisfies CP1TraceEvent;

    expect(getCP1InspectorKeyForTraceEvent(event, new Set(['start', 'end', 'x[R1]', 'succ[R1]']))).toBeNull();
  });

  test('CP1 inspector scroll fires once per valid trace-index/key transition', () => {
    window.history.pushState({}, '', '/methods/cp1');
    const { rerender } = render(<App />);
    const controls = within(screen.getByTestId('method-playback-controls'));
    fireEvent.click(controls.getByRole('button', { name: /Démarrer|Start|بدء/i }));

    const inspectorPanel = screen.getByTestId('method-inspector-scroll') as HTMLElement;
    let inspectorScrollWrites = 0;
    Object.defineProperty(inspectorPanel, 'scrollTop', {
      configurable: true,
      get: () => 0,
      set: () => {
        inspectorScrollWrites += 1;
      },
    });
    expect(inspectorScrollWrites).toBe(0);

    fireEvent.click(controls.getByRole('button', { name: /Suivant|Next step|التالية/i }));
    expect(inspectorScrollWrites).toBe(1);

    rerender(<App />);
    expect(inspectorScrollWrites).toBe(1);

    fireEvent.click(controls.getByRole('button', { name: /Suivant|Next step|التالية/i }));
    expect(inspectorScrollWrites).toBe(2);
  });

  test('missing inspector key does not trigger an inspector scroll action', () => {
    const traceIdentity = [{ type: 'example' }];
    const { rerender } = render(
      <MethodCockpitSyncHarness activeTraceIndex={-1} activeInspectorKey={null} traceIdentity={traceIdentity} />
    );
    const inspectorPanel = screen.getByTestId('method-inspector-scroll') as HTMLElement;
    let inspectorScrollWrites = 0;
    Object.defineProperty(inspectorPanel, 'scrollTop', {
      configurable: true,
      get: () => 0,
      set: () => {
        inspectorScrollWrites += 1;
      },
    });

    rerender(<MethodCockpitSyncHarness activeTraceIndex={0} activeInspectorKey="x[missing]" traceIdentity={traceIdentity} />);
    expect(inspectorScrollWrites).toBe(0);
  });

  test('CP2 trace scroll fires once per trace-index transition and not on same-index rerender', () => {
    window.history.pushState({}, '', '/methods/cp2');
    const { container, rerender } = render(<App />);
    const tracePanel = screen.getByTestId('method-trace-scroll') as HTMLElement;
    let traceScrollWrites = 0;
    Object.defineProperty(tracePanel, 'scrollTop', {
      configurable: true,
      get: () => 0,
      set: () => {
        traceScrollWrites += 1;
      },
    });

    const controls = within(screen.getByTestId('method-playback-controls'));
    fireEvent.click(controls.getByRole('button', { name: /Démarrer|Start|بدء/i }));
    expect(traceScrollWrites).toBe(1);
    const firstActiveId = screen.getByTestId('cp2-active-trace-state').getAttribute('data-trace-event-id');
    expect(firstActiveId).toBeTruthy();
    expect((container.querySelector('[aria-current="step"]') as HTMLElement).getAttribute('data-trace-event-id')).toBe(firstActiveId);

    rerender(<App />);
    expect(traceScrollWrites).toBe(1);
    expect(screen.getByTestId('cp2-active-trace-state').getAttribute('data-trace-event-id')).toBe(firstActiveId);
    expect((container.querySelector('[aria-current="step"]') as HTMLElement).getAttribute('data-trace-event-id')).toBe(firstActiveId);

    fireEvent.click(controls.getByRole('button', { name: /Suivant|Next step|التالية/i }));
    expect(traceScrollWrites).toBe(2);
    expect(screen.getByTestId('cp2-active-trace-state').getAttribute('data-trace-event-id')).not.toBe(firstActiveId);
    expect((container.querySelector('[aria-current="step"]') as HTMLElement).getAttribute('data-trace-event-id')).toBe(screen.getByTestId('cp2-active-trace-state').getAttribute('data-trace-event-id'));
  });

  test('CP2 canonical step drives current event card, active trace, graph state, and inspector source at representative steps', () => {
    window.history.pushState({}, '', '/methods/cp2');
    const { container } = render(<App />);
    const controls = within(screen.getByTestId('method-playback-controls'));

    fireEvent.click(controls.getByRole('button', { name: /Démarrer|Start|بدء/i }));
    expectCP2CanonicalTraceMatch(container, 0);
    expect(container.querySelector('[data-testid="directed-graph-container"]')).toBeDefined();
    expect(container.querySelector('[data-inspector-key].method-cockpit__active-row')).toBeDefined();

    for (const targetIndex of [4, 7, 9, 14]) {
      while (Number(screen.getByTestId('cp2-active-trace-state').getAttribute('data-current-step-index')) < targetIndex) {
        const before = Number(screen.getByTestId('cp2-active-trace-state').getAttribute('data-current-step-index'));
        fireEvent.click(controls.getByRole('button', { name: /Suivant|Next step|التالية/i }));
        expect(Number(screen.getByTestId('cp2-active-trace-state').getAttribute('data-current-step-index'))).toBe(before + 1);
      }
      expectCP2CanonicalTraceMatch(container, targetIndex);
    }

    fireEvent.click(controls.getByRole('button', { name: /Fin|Aller à la fin|Go to end|النهاية/i }));
    const finalIndex = Number(screen.getByTestId('cp2-active-trace-state').getAttribute('data-current-step-index'));
    expectCP2CanonicalTraceMatch(container, finalIndex);
  });

  test('CP2 playback advances one canonical index per tick and never activates future trace rows', () => {
    vi.useFakeTimers();
    window.history.pushState({}, '', '/methods/cp2');
    const { container } = render(<App />);
    const controls = within(screen.getByTestId('method-playback-controls'));

    fireEvent.click(controls.getByRole('button', { name: /Démarrer|Start|بدء/i }));
    fireEvent.click(controls.getByRole('button', { name: /Lecture|Play|تشغيل/i }));
    for (let expectedIndex = 1; expectedIndex <= 10; expectedIndex += 1) {
      act(() => {
        vi.advanceTimersByTime(1100);
      });
      expectCP2CanonicalTraceMatch(container, expectedIndex);
      expect(screen.getByText(new RegExp(`Étape: ${expectedIndex + 1} /`, 'i'))).toBeDefined();
    }
    vi.useRealTimers();
  }, 15000);

  test('CP2 previous reset end and example changes keep active trace aligned', () => {
    window.history.pushState({}, '', '/methods/cp2');
    const { container } = render(<App />);
    const controls = within(screen.getByTestId('method-playback-controls'));

    fireEvent.click(controls.getByRole('button', { name: /Démarrer|Start|بدء/i }));
    fireEvent.click(controls.getByRole('button', { name: /Suivant|Next step|التالية/i }));
    const staleDescription = screen.getByTestId('cp2-current-event-description').textContent;
    fireEvent.click(controls.getByRole('button', { name: /Précédent|Previous|السابقة/i }));
    expectCP2CanonicalTraceMatch(container, 0);

    fireEvent.click(controls.getByRole('button', { name: /Fin|Aller à la fin|Go to end|النهاية/i }));
    const finalIndex = Number(screen.getByTestId('cp2-active-trace-state').getAttribute('data-current-step-index'));
    expectCP2CanonicalTraceMatch(container, finalIndex);

    fireEvent.click(controls.getByRole('button', { name: /Réinitialiser|Reset|إعادة/i }));
    expect(screen.getByTestId('cp2-active-trace-state').getAttribute('data-current-step-index')).toBe('-1');
    expect(screen.getByTestId('cp2-current-event-description').textContent).not.toBe(staleDescription);
    expect(screen.getByTestId('cp2-current-event-description').textContent).toBe('No active event');
    expect(container.querySelector('[aria-current="step"]')).toBeNull();

    const select = screen.getByLabelText(/Exemple|Example|المثال/i);
    fireEvent.change(select, { target: { value: 'simple-valide' } });
    expect(screen.getByTestId('cp2-active-trace-state').getAttribute('data-current-step-index')).toBe('-1');
    expect(screen.getByTestId('cp2-current-event-description').textContent).toBe('No active event');
    expect(container.querySelector('[aria-current="step"]')).toBeNull();
  });

  test('Play requests one cockpit viewport scroll and reduced motion disables smooth scrolling', () => {
    vi.useFakeTimers();
    const scrollToSpy = vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined);
    const originalMatchMedia = window.matchMedia;
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 700 });
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: vi.fn().mockReturnValue({ matches: false }),
    });

    window.history.pushState({}, '', '/methods/cp1');
    const { container, unmount } = render(<App />);
    const cockpit = container.querySelector('[data-testid="method-cockpit"]') as HTMLElement;
    cockpit.getBoundingClientRect = () => ({ top: 900, bottom: 1500, height: 600, left: 0, right: 1000, width: 1000, x: 0, y: 900, toJSON: () => ({}) });

    const controls = within(screen.getByTestId('method-playback-controls'));
    fireEvent.click(controls.getByRole('button', { name: /Démarrer|Start|بدء/i }));
    expect(scrollToSpy).not.toHaveBeenCalled();
    fireEvent.click(controls.getByRole('button', { name: /Lecture|Play|تشغيل/i }));
    expect(scrollToSpy).toHaveBeenCalledTimes(1);
    expect(scrollToSpy).toHaveBeenLastCalledWith(expect.objectContaining({ behavior: 'smooth' }));
    unmount();

    scrollToSpy.mockClear();
    (window.matchMedia as unknown as ReturnType<typeof vi.fn>).mockReturnValue({ matches: true });
    window.history.pushState({}, '', '/methods/cp1');
    const reduced = render(<App />);
    const reducedCockpit = reduced.container.querySelector('[data-testid="method-cockpit"]') as HTMLElement;
    reducedCockpit.getBoundingClientRect = () => ({ top: 900, bottom: 1500, height: 600, left: 0, right: 1000, width: 1000, x: 0, y: 900, toJSON: () => ({}) });
    const reducedControls = within(screen.getByTestId('method-playback-controls'));
    fireEvent.click(reducedControls.getByRole('button', { name: /Démarrer|Start|بدء/i }));
    fireEvent.click(reducedControls.getByRole('button', { name: /Lecture|Play|تشغيل/i }));
    expect(scrollToSpy).toHaveBeenCalledTimes(1);
    expect(scrollToSpy).toHaveBeenLastCalledWith(expect.objectContaining({ behavior: 'auto' }));

    scrollToSpy.mockRestore();
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: originalMatchMedia,
    });
    vi.useRealTimers();
  });

  test('trace journal uses an internal scroll panel inside the cockpit', () => {
    window.history.pushState({}, '', '/methods/ilp1');
    render(<App />);

    const controls = within(screen.getByTestId('method-playback-controls'));
    fireEvent.click(controls.getByRole('button', { name: /Démarrer|Start|بدء/i }));
    const tracePanel = screen.getByTestId('method-trace-scroll') as HTMLElement;
    expect(tracePanel.style.overflowY).toBe('auto');
    expect(screen.getByTestId('method-cockpit-trace').contains(tracePanel)).toBe(true);
  });

  test('desktop cockpit class and mobile stacked fallback CSS are present', () => {
    window.history.pushState({}, '', '/methods/cp1');
    const { container } = render(<App />);

    expect(container.querySelector('.method-cockpit__body')).toBeDefined();
    expect(container.querySelector('.method-cockpit__controls')).toBeDefined();
    expect(Array.from(container.querySelectorAll('style')).some((style) => style.textContent?.includes('@media (max-width: 1023px)'))).toBe(true);
  });

  test('shared playback advances, pauses, resets, and stops at the final trace step', () => {
    vi.useFakeTimers();
    window.history.pushState({}, '', '/methods/cp2');
    render(<App />);

    const controls = within(screen.getByTestId('method-playback-controls'));
    fireEvent.click(controls.getByRole('button', { name: /Start|Démarrer|بدء/i }));
    expect(screen.getByText(/Étape: 1 \//i)).toBeDefined();

    fireEvent.click(controls.getByRole('button', { name: /Lecture|Play|تشغيل/i }));
    act(() => {
      vi.advanceTimersByTime(1100);
    });
    expect(screen.getByText(/Étape: 2 \//i)).toBeDefined();

    fireEvent.click(controls.getByRole('button', { name: /Pause/i }));
    act(() => {
      vi.advanceTimersByTime(2200);
    });
    expect(screen.getByText(/Étape: 2 \//i)).toBeDefined();

    fireEvent.click(controls.getByRole('button', { name: /Fin|Aller à la fin|Go to end|النهاية/i }));
    const finalCounter = screen.getByText(/Étape: \d+ \/ \d+/i).textContent;
    act(() => {
      vi.advanceTimersByTime(2200);
    });
    expect(screen.getByText(finalCounter || '')).toBeDefined();

    fireEvent.click(controls.getByRole('button', { name: /Réinitialiser|Reset|إعادة/i }));
    expect(screen.getByText(/Étape: 0 \//i)).toBeDefined();
    vi.useRealTimers();
  });

  test('manual actions and example changes stop playback without duplicate interval behavior', () => {
    vi.useFakeTimers();
    window.history.pushState({}, '', '/methods/ilp1');
    render(<App />);

    const controls = within(screen.getByTestId('method-playback-controls'));
    fireEvent.click(controls.getByRole('button', { name: /Démarrer|Start|بدء/i }));
    fireEvent.click(controls.getByRole('button', { name: /Lecture|Play|تشغيل/i }));
    act(() => {
      vi.advanceTimersByTime(1100);
    });
    const afterOneTick = screen.getByText(/Étape: \d+ \/ \d+/i).textContent;
    fireEvent.click(controls.getByRole('button', { name: /Suivant|Next step|التالية/i }));
    const afterManualNext = screen.getByText(/Étape: \d+ \/ \d+/i).textContent;
    act(() => {
      vi.advanceTimersByTime(2200);
    });
    expect(screen.getByText(afterManualNext || '')).toBeDefined();
    expect(afterManualNext).not.toBe(afterOneTick);

    fireEvent.click(controls.getByRole('button', { name: /Réinitialiser|Reset|إعادة/i }));
    const select = screen.getByLabelText(/Exemple|Example|المثال/i);
    fireEvent.change(select, { target: { value: 'simple-valide' } });
    expect(screen.getByText(/Étape: 0 \//i)).toBeDefined();
    vi.useRealTimers();
  });

  test('mobile playback controls remain usable at 320px and 390px', () => {
    window.history.pushState({}, '', '/methods/cp1');
    const { container } = render(<App />);

    for (const width of [320, 390]) {
      window.innerWidth = width;
      window.dispatchEvent(new Event('resize'));
      const controls = screen.getByTestId('method-playback-controls') as HTMLElement;
      expect(controls.style.flexWrap).toBe('wrap');
      expect(container.querySelector('.method-playback-bar')).toBeDefined();
    }
  });

  test('graph panels use compact responsive sizing rather than old tall fixed layout', () => {
    window.history.pushState({}, '', '/methods/cp1');
    const { container } = render(<App />);
    const directed = container.querySelector('[data-testid="directed-graph-container"]') as HTMLElement;
    const svg = container.querySelector('[data-testid="directed-graph-svg"]') as SVGElement;
    expect(directed.style.minHeight).not.toBe('360px');
    expect(directed.style.overflow).toBe('visible');
    expect(svg.style.minHeight).not.toBe('270px');
    expect(svg.style.aspectRatio).toBe('');
    expect(svg.style.height).toBe('100%');
  });

  test('CP2 page supports mobile graph tabs at 320px and 390px', () => {
    window.history.pushState({}, '', '/methods/cp2');
    const { container } = render(<App />);

    const viewports = [320, 390];
    for (const width of viewports) {
      window.innerWidth = width;
      window.dispatchEvent(new Event('resize'));

      const mobileSelector = container.querySelector('.show-mobile-only') as HTMLElement;
      if (mobileSelector) {
        mobileSelector.style.display = 'flex';
      }

      const btnTabD = screen.getByRole('button', { name: 'D', hidden: true });
      const btnTabG = screen.getByRole('button', { name: 'G', hidden: true });
      const wrappers = container.querySelectorAll('.graph-panel-container .grid-2 > div');
      expect(wrappers.length).toBe(2);

      fireEvent.click(btnTabG);
      expect(wrappers[0].classList.contains('mobile-hide-graph')).toBe(true);
      expect(wrappers[1].getAttribute('aria-hidden')).toBe('false');

      fireEvent.click(btnTabD);
      expect(wrappers[0].getAttribute('aria-hidden')).toBe('false');
      expect(wrappers[1].classList.contains('mobile-hide-graph')).toBe(true);
    }
  }, 15000);

  test('AI-guided exact route supports shared cockpit, guide card, mobile graph tabs, and Arabic RTL shell', () => {
    window.history.pushState({}, '', '/methods/ai-guided-exact');
    const { container } = render(<App />);

    expect(screen.getAllByText('Explainable AI-Guided Exact Search').length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Educational transparent AI-guided branch ordering/i).length).toBeGreaterThan(0);
    expect(screen.getByTestId('method-cockpit')).toBeDefined();

    const controls = within(screen.getByTestId('method-playback-controls'));
    fireEvent.click(controls.getByRole('button', { name: /Démarrer|Start|بدء/i }));
    expect(screen.getByText('AI Guide Decision')).toBeDefined();
    expect(screen.getByText(/Classement seulement|Ranking only|ترتيب فقط/i)).toBeDefined();

    window.innerWidth = 320;
    window.dispatchEvent(new Event('resize'));
    const mobileSelector = container.querySelector('.show-mobile-only') as HTMLElement;
    if (mobileSelector) mobileSelector.style.display = 'flex';
    fireEvent.click(screen.getByRole('button', { name: 'G', hidden: true }));
    expect(container.querySelectorAll('.mobile-hide-graph').length).toBeGreaterThan(0);

    fireEvent.click(screen.getByText('العربية'));
    expect(document.documentElement.lang).toBe('ar');
    expect(document.documentElement.dir).toBe('rtl');
    expect(container.querySelector('[data-testid="directed-graph-container"]')?.getAttribute('dir')).toBe('ltr');
    expect(screen.getByText(/ترتيب فقط/i)).toBeDefined();
  });

  test('optional local AI assistant renders without making an automatic request', () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    window.history.pushState({}, '', '/methods/ai-guided-exact');

    render(<App />);

    expect(screen.getByText('Experimental Local AI Assistant')).toBeDefined();
    expect(screen.getByText('Not connected')).toBeDefined();
    const button = screen.getByRole('button', { name: 'Ask local AI for branch explanation' }) as HTMLButtonElement;
    expect(button.disabled).toBe(true);
    fireEvent.click(button);
    expect(fetchMock).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });

  test('local AI assistant explains when a branch-ranking step is required', () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    window.history.pushState({}, '', '/methods/ai-guided-exact');

    render(<App />);

    expect((screen.getByRole('button', { name: 'Ask local AI for branch explanation' }) as HTMLButtonElement).disabled).toBe(true);
    expect(screen.getByText('Advance the search to a branch-ranking step first.')).toBeDefined();
    expect(fetchMock).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });

  test('local AI assistant button enables at branch-ranking steps', () => {
    window.history.pushState({}, '', '/methods/ai-guided-exact');

    render(<App />);
    const controls = within(screen.getByTestId('method-playback-controls'));
    fireEvent.click(controls.getByRole('button', { name: /Démarrer|Start|بدء/i }));
    fireEvent.click(controls.getByRole('button', { name: /Suivant|Next|التالي/i }));

    expect((screen.getByRole('button', { name: 'Ask local AI for branch explanation' }) as HTMLButtonElement).disabled).toBe(false);
  });

  test('local AI assistant renders local and cloud advisory status note', () => {
    window.history.pushState({}, '', '/methods/ai-guided-exact');

    render(<App />);

    expect(screen.getByText('Local Ollama is attempted first when available. Cloud AI advisory fallback is used in production when configured. Both are advisory only; the deterministic exact solver remains the sole source of validity and optimality.')).toBeDefined();
  });

  test('unavailable Ollama does not break deterministic guide', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    window.history.pushState({}, '', '/methods/ai-guided-exact');

    render(<App />);
    const controls = within(screen.getByTestId('method-playback-controls'));
    fireEvent.click(controls.getByRole('button', { name: /Démarrer|Start|بدء/i }));
    fireEvent.click(controls.getByRole('button', { name: /Suivant|Next|التالي/i }));
    expect(screen.getByText(/Classement seulement|Ranking only|ترتيب فقط/i)).toBeDefined();

    fireEvent.click(screen.getByRole('button', { name: 'Ask local AI for branch explanation' }));

    expect(await screen.findByText('Unavailable — deterministic guide remains active')).toBeDefined();
    expect(screen.getByText(/AI assistant is unavailable/i)).toBeDefined();
    expect(screen.getByText(/Classement seulement|Ranking only|ترتيب فقط/i)).toBeDefined();
    vi.unstubAllGlobals();
  });

  test('cloud AI response is labeled advisory only after Ollama is unavailable', async () => {
    const fetchMock = vi.fn().mockImplementation((url: string) => {
      if (url === 'http://localhost:11434/api/chat') return Promise.reject(new Error('offline'));
      return Promise.resolve({
        ok: true,
        json: async () => ({
          ok: true,
          provider: 'groq',
          advisory: '- R2 remains the top ranked branch.\n- R3 has less deterministic support.\n- The exact solver remains authoritative.',
          errorCode: null,
        }),
      });
    });
    vi.stubGlobal('fetch', fetchMock);
    window.history.pushState({}, '', '/methods/ai-guided-exact');

    render(<App />);
    const controls = within(screen.getByTestId('method-playback-controls'));
    fireEvent.click(controls.getByRole('button', { name: /Démarrer|Start|بدء/i }));
    fireEvent.click(controls.getByRole('button', { name: /Suivant|Next|التالي/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Ask local AI for branch explanation' }));

    expect(await screen.findByText('Available from cloud')).toBeDefined();
    expect(screen.getByText('Cloud AI suggestion — advisory only')).toBeDefined();
    expect(screen.getByText('The deterministic exact solver remains the only source of validity and optimality.')).toBeDefined();
    expect(screen.getByText(/R2 remains the top ranked branch/i)).toBeDefined();
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[1][0]).toBe('/api/ai-branch-explanation');
    const cloudRequest = JSON.parse(fetchMock.mock.calls[1][1].body);
    expect(cloudRequest.currentPath).toBeDefined();
    expect(cloudRequest.locale).toBe('fr');
    expect(cloudRequest.rankedCandidates.length).toBeLessThanOrEqual(3);
    expect(JSON.stringify(fetchMock.mock.calls)).not.toContain('GROQ_API_KEY');
    vi.unstubAllGlobals();
  });

  test('cloud AI error preserves deterministic guide without provider details', async () => {
    const fetchMock = vi.fn().mockImplementation((url: string) => {
      if (url === 'http://localhost:11434/api/chat') return Promise.reject(new Error('offline'));
      return Promise.resolve({
        ok: false,
        json: async () => ({ ok: false, provider: 'groq', advisory: '', errorCode: 'MISSING_KEY' }),
      });
    });
    vi.stubGlobal('fetch', fetchMock);
    window.history.pushState({}, '', '/methods/ai-guided-exact');

    render(<App />);
    const controls = within(screen.getByTestId('method-playback-controls'));
    fireEvent.click(controls.getByRole('button', { name: /Démarrer|Start|بدء/i }));
    fireEvent.click(controls.getByRole('button', { name: /Suivant|Next|التالي/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Ask local AI for branch explanation' }));

    expect(await screen.findByText('Unavailable — deterministic guide remains active')).toBeDefined();
    expect(screen.getByText(/AI assistant is unavailable/i)).toBeDefined();
    expect(screen.getByText(/Classement seulement|Ranking only|ترتيب فقط/i)).toBeDefined();
    expect(document.body.textContent).not.toContain('MISSING_KEY');
    vi.unstubAllGlobals();
  });

  test('local AI response is labeled advisory only and sent to localhost Ollama', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        message: {
          content: '- Prefer R2 by score.\n- R3 has weaker genomic support.\n- Deterministic solver must verify.',
        },
      }),
    });
    vi.stubGlobal('fetch', fetchMock);
    window.history.pushState({}, '', '/methods/ai-guided-exact');

    render(<App />);
    const controls = within(screen.getByTestId('method-playback-controls'));
    fireEvent.click(controls.getByRole('button', { name: /Démarrer|Start|بدء/i }));
    fireEvent.click(controls.getByRole('button', { name: /Suivant|Next|التالي/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Ask local AI for branch explanation' }));

    expect(await screen.findByText('Available locally')).toBeDefined();
    expect(screen.getByText('Local AI suggestion — advisory only')).toBeDefined();
    expect(screen.getByText('The deterministic exact solver remains the only source of validity and optimality.')).toBeDefined();
    expect(screen.getByText(/Prefer R2 by score/i)).toBeDefined();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toBe('http://localhost:11434/api/chat');
    const request = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(request.model).toBe('llama3.2:1b');
    expect(request.stream).toBe(false);
    expect(request.messages[0].content).toContain('current path:');
    expect(request.messages[0].content).toContain('deterministic guide scores:');
    expect(request.messages[0].content).toContain('instruction: do not claim proof or validity.');
    vi.unstubAllGlobals();
  });

  test('local AI assistant is never called automatically during playback', () => {
    vi.useFakeTimers();
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    window.history.pushState({}, '', '/methods/ai-guided-exact');

    render(<App />);
    const controls = within(screen.getByTestId('method-playback-controls'));
    fireEvent.click(controls.getByRole('button', { name: /Démarrer|Start|بدء/i }));
    fireEvent.click(controls.getByRole('button', { name: /Lecture|Play|تشغيل/i }));
    act(() => {
      vi.advanceTimersByTime(3300);
    });

    expect(fetchMock).not.toHaveBeenCalled();
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  test('ILP1 page supports mobile graph tabs at 320px and 390px', () => {
    window.history.pushState({}, '', '/methods/ilp1');
    const { container } = render(<App />);

    const viewports = [320, 390];
    for (const width of viewports) {
      window.innerWidth = width;
      window.dispatchEvent(new Event('resize'));

      const mobileSelector = container.querySelector('.show-mobile-only') as HTMLElement;
      if (mobileSelector) {
        mobileSelector.style.display = 'flex';
      }

      const btnTabD = screen.getByRole('button', { name: 'D', hidden: true });
      const btnTabG = screen.getByRole('button', { name: 'G', hidden: true });
      const wrappers = container.querySelectorAll('.graph-panel-container .grid-2 > div');
      expect(wrappers.length).toBe(2);

      fireEvent.click(btnTabG);
      expect(wrappers[0].classList.contains('mobile-hide-graph')).toBe(true);
      expect(wrappers[1].getAttribute('aria-hidden')).toBe('false');

      fireEvent.click(btnTabD);
      expect(wrappers[0].getAttribute('aria-hidden')).toBe('false');
      expect(wrappers[1].classList.contains('mobile-hide-graph')).toBe(true);
    }
  });

  test('ILP2 page supports mobile graph tabs at 320px and 390px', () => {
    window.history.pushState({}, '', '/methods/ilp2');
    const { container } = render(<App />);

    const viewports = [320, 390];
    for (const width of viewports) {
      window.innerWidth = width;
      window.dispatchEvent(new Event('resize'));

      const mobileSelector = container.querySelector('.show-mobile-only') as HTMLElement;
      if (mobileSelector) {
        mobileSelector.style.display = 'flex';
      }

      const btnTabD = screen.getByRole('button', { name: 'D', hidden: true });
      const btnTabG = screen.getByRole('button', { name: 'G', hidden: true });
      const wrappers = container.querySelectorAll('.graph-panel-container .grid-2 > div');
      expect(wrappers.length).toBe(2);

      fireEvent.click(btnTabG);
      expect(wrappers[0].classList.contains('mobile-hide-graph')).toBe(true);
      expect(wrappers[1].getAttribute('aria-hidden')).toBe('false');

      fireEvent.click(btnTabD);
      expect(wrappers[0].getAttribute('aria-hidden')).toBe('false');
      expect(wrappers[1].classList.contains('mobile-hide-graph')).toBe(true);
    }
  });

  test('AlgoBB++ page supports trace controls, mobile graph tabs, and Arabic RTL shell', () => {
    window.history.pushState({}, '', '/methods/algobb-plus-plus');
    const { container } = render(<App />);

    expect(screen.getAllByText(/AlgoBB\+\+ éducatif/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/bounded implementation/i)).toBeDefined();

    fireEvent.click(screen.getByRole('button', { name: /Démarrer/i }));
    expect(screen.getByRole('button', { name: /Suivant/i })).toBeDefined();
    fireEvent.keyDown(screen.getByRole('button', { name: /Suivant/i }), { key: 'Enter' });

    window.innerWidth = 320;
    window.dispatchEvent(new Event('resize'));
    const mobileSelector = container.querySelector('.show-mobile-only') as HTMLElement;
    if (mobileSelector) mobileSelector.style.display = 'flex';
    fireEvent.click(screen.getByRole('button', { name: /Afficher le graphe génomique G/i }));
    expect(container.querySelectorAll('.mobile-hide-graph').length).toBeGreaterThan(0);

    fireEvent.click(screen.getByText('العربية'));
    expect(document.documentElement.lang).toBe('ar');
    expect(document.documentElement.dir).toBe('rtl');
    const svg = container.querySelector('svg');
    expect(svg?.getAttribute('dir')).toBeNull();
  });

  test('differential boundary caps and malformed inputs validation', () => {
    const malformedVertices = ['R1'];
    // Invalid edge referencing non-existent vertex
    const badEdgesD = [{ from: 'R1', to: 'R2' }];
    const edgesG: { u: string; v: string }[] = [];

    const cpRes = solveCP1(malformedVertices, badEdgesD, edgesG);
    const legacyRes = solveConsistentPath(malformedVertices, badEdgesD, edgesG);

    // Both must reject with error status
    expect(cpRes.status).toBe('error');
    expect(legacyRes.error).toBeDefined();
    expect(cpRes.error?.code).toBe('INVALID_NODE_D');
  });
  test('Subset DP route supports cockpit playback, current event card, Arabic RTL shell, LTR graphs, mobile tabs, and no visible emoji', () => {
    window.history.pushState({}, '', '/methods/subset-dp');
    const { container } = render(<App />);

    expect(screen.getAllByText(/Exact Subset Dynamic Programming/i).length).toBeGreaterThan(0);
    expect(screen.getByTestId('method-cockpit')).toBeDefined();
    expect(screen.getByTestId('method-playback-controls')).toBeDefined();
    expect(screen.getByTestId('subset-dp-current-event-card')).toBeDefined();
    expect(screen.getByText(/DP State Inspector|Inspecteur des états DP/i)).toBeDefined();

    const controls = within(screen.getByTestId('method-playback-controls'));
    fireEvent.click(controls.getByRole('button', { name: /Démarrer Subset DP/i }));
    expect(screen.getByTestId('subset-dp-current-event-card').textContent).toContain('ACTIVE STEP');
    fireEvent.click(controls.getByRole('button', { name: /Suivant/i }));
    expect(screen.getByTestId('subset-dp-current-event-card').textContent).toMatch(/2 \/ \d+/);

    fireEvent.click(screen.getByText('العربية'));
    expect(document.documentElement.dir).toBe('rtl');
    expect(container.querySelector('[data-testid="directed-graph-container"]')?.getAttribute('dir')).toBe('ltr');
    expect(container.querySelector('[data-testid="genomic-graph-container"]')?.getAttribute('dir')).toBe('ltr');

    window.innerWidth = 320;
    window.dispatchEvent(new Event('resize'));
    const mobileSelector = container.querySelector('.show-mobile-only') as HTMLElement;
    if (mobileSelector) mobileSelector.style.display = 'flex';
    expect(screen.getByRole('button', { name: 'D', hidden: true })).toBeDefined();
    expect(screen.getByRole('button', { name: 'G', hidden: true })).toBeDefined();

    expect(/[\u{1F300}-\u{1FAFF}]/u.test(document.body.textContent || '')).toBe(false);
  }, 15000);
});
