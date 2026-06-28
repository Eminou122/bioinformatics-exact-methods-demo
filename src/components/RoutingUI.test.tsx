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
import * as ilp2Solver from '../domain/ilp2Solver';

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

  test('primary navigation contains exactly 6 destinations in FR, EN, and AR', () => {
    render(<App />);

    expect(screen.getByText(/Module d'Apprentissage Pas-à-Pas/i)).toBeDefined();

    const nav = screen.getByRole('navigation', { name: 'Navigation principale' });
    expect(within(nav).getAllByRole('link').map((link) => link.textContent)).toEqual([
      'Commencer Ici',
      'Modèle CP2',
      'Modèle CP2+',
      'Graphes aléatoires',
      'Modèle ILP2',
      'Modèle ILP2+',
    ]);

    fireEvent.click(screen.getByText('English'));
    expect(within(nav).getAllByRole('link').map((link) => link.textContent)).toEqual([
      'Start Here',
      'CP2 Model',
      'CP2+ Model',
      'Random Graphs',
      'ILP2 Model',
      'ILP2+ Model',
    ]);

    fireEvent.click(screen.getByText('العربية'));
    expect(within(nav).getAllByRole('link').map((link) => link.textContent)).toEqual([
      'ابدأ هنا',
      'نموذج CP2',
      'نموذج CP2+',
      'مخططات عشوائية',
      'نموذج ILP2',
      'نموذج ILP2+',
    ]);
  });

  test('deprecated routes redirect to Start Here', () => {
    const deprecated = ['/legacy', '/methods/cp1', '/methods/algobb-plus-plus', '/methods/ilp1', '/methods/subset-dp', '/methods'];
    for (const route of deprecated) {
      cleanup();
      window.localStorage.clear();
      window.history.pushState({}, '', route);
      render(<App />);
      expect(window.location.pathname).toBe('/');
      expect(screen.getAllByText(/Module d'Apprentissage Pas-à-Pas/i).length).toBeGreaterThan(0);
    }
  });

  test('all public routes render their expected page surfaces', () => {
    const routes = [
      { path: '/', text: /Module d'Apprentissage Pas-à-Pas/i },
      { path: '/methods/cp2', text: /CP2/i },
      { path: '/methods/cp2-plus', text: /CP2\+/i },
      { path: '/methods/random-graph-lab', text: /Laboratoire de démonstration/i },
      { path: '/methods/ilp2', text: /ILP2/i },
      { path: '/methods/ilp2-plus', text: /ILP2\+/i },
    ];

    for (const route of routes) {
      cleanup();
      window.history.pushState({}, '', route.path);
      render(<App />);
      expect(screen.getAllByText(route.text).length).toBeGreaterThan(0);
    }
  });

  test('every runnable method page renders one educational block without replacing graph or cockpit surfaces', () => {
    const routes = [
      { path: '/methods/cp2', methodId: 'cp2', cockpit: true },
      { path: '/methods/cp2-plus', methodId: 'cp2-plus', cockpit: true },
      { path: '/methods/ilp2', methodId: 'ilp2', cockpit: true },
      { path: '/methods/ilp2-plus', methodId: 'ilp2-plus', cockpit: true },
    ];

    for (const route of routes) {
      cleanup();
      window.history.pushState({}, '', route.path);
      const { container } = render(<App />);
      const blocks = screen.getAllByTestId('method-education-block');
      expect(blocks).toHaveLength(1);
      expect(blocks[0].getAttribute('data-method-id')).toBe(route.methodId);
      expect(within(blocks[0]).getByText(/Ce que cette méthode résout/i)).toBeDefined();
      expect(within(blocks[0]).getByText(/Fonctionnement/i)).toBeDefined();
      expect(within(blocks[0]).getByText(/Ce que la méthode retourne/i)).toBeDefined();
      expect(within(blocks[0]).getByText(/Exactitude et sécurité/i)).toBeDefined();
      expect(container.querySelector('[data-testid="directed-graph-svg"]')).toBeDefined();
      expect(container.querySelector('[data-testid="genomic-graph-svg"]')).toBeDefined();
      if (route.cockpit) {
        expect(screen.getByTestId('method-cockpit')).toBeDefined();
      }
    }
  });

  test('CP2+ educational block states the safe genomic propagation distinction', () => {
    window.history.pushState({}, '', '/methods/cp2-plus');
    render(<App />);

    fireEvent.click(screen.getByText('English'));
    const block = screen.getByTestId('method-education-block');
    expect(block.textContent).toContain('CP2+ adds safe genomic-feasibility propagation.');
    expect(block.textContent).toContain('It can prune a partial path only when no legal future extension can repair genomic connectivity.');
    expect(block.textContent).toContain('It does not change the objective, tie-break rule, or legal path definition.');
  });

  test('CP2+ extended pruning explanation is collapsed initially and opens on demand', () => {
    window.history.pushState({}, '', '/methods/cp2-plus');
    render(<App />);

    fireEvent.click(screen.getByText('English'));
    const details = screen.getByTestId('cp2-plus-safe-prune-details') as HTMLDetailsElement;
    expect(details.open).toBe(false);
    expect(screen.getByText('Why CP2+ can prune safely')).toBeDefined();
    expect(details.textContent).toContain('CP2 prunes by a safe directed upper bound');
    expect(details.textContent).toContain('CP2+ does not change the objective, tie-break rule, or legal path definition');

    fireEvent.click(screen.getByText('Why CP2+ can prune safely'));
    expect(details.open).toBe(true);
  });

  test('ILP2 educational block states the pre-enumeration safety limitation', () => {
    window.history.pushState({}, '', '/methods/ilp2');
    render(<App />);

    fireEvent.click(screen.getByText('English'));
    const block = screen.getByTestId('method-education-block');
    expect(block.textContent).toContain('Educational rooted-level witness formulation');
    expect(block.textContent).toContain('candidate paths are fully enumerated before the cap can protect candidate-list creation');
  });

  test('ILP2+ route renders the dedicated page with exact wording and counters', () => {
    const ilp2Spy = vi.spyOn(ilp2Solver, 'solveILP2');
    const ilp2PlusSpy = vi.spyOn(ilp2Solver, 'solveILP2Plus');
    window.history.pushState({}, '', '/methods/ilp2-plus');
    render(<App />);

    fireEvent.click(screen.getByText('English'));
    expect(screen.getByRole('heading', { name: /ILP2\+ — Canonical Prefix Early Termination/i })).toBeDefined();
    expect(screen.getByTestId('method-education-block').getAttribute('data-method-id')).toBe('ilp2-plus');
    expect(screen.getByTestId('ilp2-plus-exact-wording').textContent).toContain('It does not skip path enumeration.');
    const counters = screen.getByTestId('ilp2-plus-counters').textContent || '';
    for (const key of ['enumeratedCandidates', 'acceptedFeasibleCandidates', 'candidateEvaluationEvents', 'earlyTermination', 'candidatesSkippedAfterWinner', 'witnessParentLinksAssigned', 'witnessLevelsAssigned']) {
      expect(counters).toContain(key);
    }
    expect(ilp2PlusSpy).toHaveBeenCalled();
    expect(ilp2Spy).not.toHaveBeenCalled();
    ilp2Spy.mockRestore();
    ilp2PlusSpy.mockRestore();
  });

  test('ILP2+ page renders French, English, and Arabic labels with RTL prose', () => {
    window.history.pushState({}, '', '/methods/ilp2-plus');
    render(<App />);

    expect(screen.getByRole('heading', { name: /Arrêt anticipé/i })).toBeDefined();
    fireEvent.click(screen.getByText('English'));
    expect(screen.getByText(/Canonical Prefix Early Termination/i)).toBeDefined();
    fireEvent.click(screen.getByText('العربية'));
    expect(document.documentElement.dir).toBe('rtl');
    expect(screen.getByTestId('method-education-block').getAttribute('dir')).toBe('rtl');
    expect(screen.getByRole('heading', { name: /إيقاف مبكر/i })).toBeDefined();
    expect(screen.getByTestId('ilp2-plus-exact-wording').getAttribute('dir')).toBe('ltr');
  });

  test('method educational blocks render complete French English and Arabic content', () => {
    window.history.pushState({}, '', '/methods/cp2-plus');
    render(<App />);

    let block = screen.getByTestId('method-education-block');
    expect(within(block).getByText(/Ce que cette méthode résout/i)).toBeDefined();
    expect(block.getAttribute('dir')).toBe('ltr');

    fireEvent.click(screen.getByText('English'));
    block = screen.getByTestId('method-education-block');
    expect(within(block).getByText(/What this method solves/i)).toBeDefined();
    expect(block.textContent).toContain('What it returns');

    fireEvent.click(screen.getByText('العربية'));
    block = screen.getByTestId('method-education-block');
    expect(block.getAttribute('dir')).toBe('rtl');
    expect(within(block).getByText(/ما الذي تحله هذه الطريقة/i)).toBeDefined();
    expect(block.textContent).toContain('ما الذي ترجعه');
    expect(document.documentElement.dir).toBe('rtl');
  });

  test('method educational copy does not label capped or cancelled runs as optimal', () => {
    window.history.pushState({}, '', '/methods/cp2');
    render(<App />);

    fireEvent.click(screen.getByText('English'));
    const cp2Block = screen.getByTestId('method-education-block');
    expect(cp2Block.textContent).toContain('a capped run is best-so-far, not optimal');
    expect(cp2Block.textContent).not.toMatch(/capped run is optimal|cancelled run is optimal/i);
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
    window.history.pushState({}, '', '/methods/cp2');
    render(<App />);

    // Title is in French
    expect(screen.getByText(/CP2 — CP1 avec Bornes Supérieures Sûres/i)).toBeDefined();

    // Switch to English
    const enBtn = screen.getByText('English');
    fireEvent.click(enBtn);

    expect(document.documentElement.lang).toBe('en');
    expect(document.documentElement.dir).toBe('ltr');

    // Switch to Arabic
    const arBtn = screen.getByText('العربية');
    fireEvent.click(arBtn);

    expect(document.documentElement.lang).toBe('ar');
    expect(document.documentElement.dir).toBe('rtl');
  });

  test('SVG arrow directions and geometry do not change in Arabic RTL', () => {
    window.history.pushState({}, '', '/methods/cp2');
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
    window.history.pushState({}, '', '/methods/cp2');
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
    window.history.pushState({}, '', '/methods/cp2');
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
      const btnTabD = screen.getByRole('button', { name: 'D', hidden: true });
      const btnTabG = screen.getByRole('button', { name: 'G', hidden: true });

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
    window.history.pushState({}, '', '/methods/cp2');
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

    fireEvent.click(screen.getAllByRole('button', { name: /Démarrer CP2|Start CP2|بدء CP2/i })[0]);
    fireEvent.click(within(screen.getByTestId('method-playback-controls')).getByRole('button', { name: /^(Fin|End|النهاية)$/i }));
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

  test('CP2, ILP2, and ILP2+ render graph sections with LTR graph containers in Arabic', () => {
    const routes = ['/methods/cp2', '/methods/ilp2', '/methods/ilp2-plus'];

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
    window.history.pushState({}, '', '/methods/cp2');
    render(<App />);

    // Selector for mobile D/G graph tab controls
    const tabSelector = document.querySelector('.show-mobile-only');
    expect(tabSelector).toBeDefined();

    // Verify method cockpit rendered
    expect(screen.getByTestId('method-cockpit')).toBeDefined();
  });

  test('CP2, ILP2, and ILP2+ display compact playback controls', () => {
    const routes = ['/methods/cp2', '/methods/ilp2', '/methods/ilp2-plus'];

    for (const route of routes) {
      cleanup();
      window.history.pushState({}, '', route);
      render(<App />);
      expect(screen.getByTestId('method-playback-controls')).toBeDefined();
      expect(screen.getByRole('button', { name: /lecture|play|تشغيل/i })).toBeDefined();
      expect(screen.getByRole('button', { name: /réinitialiser|reset|إعادة/i })).toBeDefined();
    }
  }, 15000);

  test('CP2, ILP2, and ILP2+ render the shared method cockpit', () => {
    const routes = ['/methods/cp2', '/methods/ilp2', '/methods/ilp2-plus'];

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
    const routes = ['/methods/cp2', '/methods/ilp2', '/methods/ilp2-plus'];

    for (const route of routes) {
      cleanup();
      window.history.pushState({}, '', route);
      const { container } = render(<App />);
      const controls = within(screen.getByTestId('method-playback-controls'));
      fireEvent.click(controls.getByRole('button', { name: /Démarrer|Start|بدء/i }));
      expect(container.querySelectorAll('[data-active-trace="true"]').length).toBe(1);
    }
  });

  test('CP2 active trace state updates on step changes', () => {
    window.history.pushState({}, '', '/methods/cp2');
    render(<App />);
    const controls = within(screen.getByTestId('method-playback-controls'));

    fireEvent.click(controls.getByRole('button', { name: /Démarrer|Start|بدء/i }));
    const firstIndex = screen.getByTestId('cp2-active-trace-state').getAttribute('data-current-step-index');

    fireEvent.click(controls.getByRole('button', { name: /Suivant|Next step|التالية/i }));
    const secondIndex = screen.getByTestId('cp2-active-trace-state').getAttribute('data-current-step-index');

    expect(firstIndex).toBe('0');
    expect(Number(secondIndex)).toBeGreaterThan(0);
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

    window.history.pushState({}, '', '/methods/ilp2');
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
    window.history.pushState({}, '', '/methods/ilp2');
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
    window.history.pushState({}, '', '/methods/ilp2');
    render(<App />);

    const controls = within(screen.getByTestId('method-playback-controls'));
    fireEvent.click(controls.getByRole('button', { name: /Démarrer|Start|بدء/i }));
    const tracePanel = screen.getByTestId('method-trace-scroll') as HTMLElement;
    expect(tracePanel.style.overflowY).toBe('auto');
    expect(screen.getByTestId('method-cockpit-trace').contains(tracePanel)).toBe(true);
  });

  test('desktop cockpit class and mobile stacked fallback CSS are present', () => {
    window.history.pushState({}, '', '/methods/cp2');
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
    window.history.pushState({}, '', '/methods/ilp2');
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
    window.history.pushState({}, '', '/methods/cp2');
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
    window.history.pushState({}, '', '/methods/cp2');
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
  }, 15000);

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
});
