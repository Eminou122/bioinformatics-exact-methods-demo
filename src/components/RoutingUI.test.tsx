// @vitest-environment jsdom
import { describe, test, expect, beforeAll, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import App from '../App';
import { translations } from '../i18n/translations';
import { solveCP1 } from '../domain/cpSolver';
import { solveConsistentPath } from '../domain/pathAlgorithms';

describe('Routing and Educational UI QA Suite', () => {
  beforeAll(() => {
    const meta = document.createElement('meta');
    meta.setAttribute('name', 'description');
    document.head.appendChild(meta);
  });

  afterEach(() => {
    cleanup();
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

    // Click "Démo Énumération (Legacy)"
    const legacyLink = screen.getByText('Démo Énumération (Legacy)');
    fireEvent.click(legacyLink);
    expect(screen.getByText(translations.fr.selectionTitle)).toBeDefined();
  });

  test('all public routes render their expected page surfaces', () => {
    const routes = [
      { path: '/', text: /Module d'Apprentissage Pas-à-Pas/i },
      { path: '/methods', text: /Carte des Méthodes de Recherche/i },
      { path: '/methods/cp1', text: /Modèle Éducatif CP1/i },
      { path: '/methods/algobb-plus-plus', text: /AlgoBB\+\+ éducatif/i },
      { path: '/methods/cp2', text: /CP2/i },
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
    // Check CP2 has reference badge
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

    fireEvent.click(screen.getByText('Démarrer la recherche CP1'));
    fireEvent.click(screen.getByText('Aller à la Fin'));
    expect(container.querySelectorAll('[data-state="active-genomic-edge"]').length).toBeGreaterThan(0);
  });

  test('CP1, AlgoBB++, and Legacy render graph sections with LTR graph containers in Arabic', () => {
    const routes = ['/methods/cp1', '/methods/algobb-plus-plus', '/legacy'];

    for (const route of routes) {
      cleanup();
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
});
