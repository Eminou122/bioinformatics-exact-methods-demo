// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import App from '../App';

describe('Random-Graph Demonstration Lab', () => {
  beforeEach(() => {
    window.history.pushState({}, '', '/methods/random-graph-lab');
    window.localStorage.clear();
  });

  afterEach(() => cleanup());

  test('renders the route, primary nav link, Method Map link, and released solver result surfaces', () => {
    render(<App />);

    expect(screen.getByTestId('random-graph-demo-lab')).toBeDefined();
    expect(screen.getByRole('link', { name: 'Graphes aléatoires' }).style.fontWeight).toBe('700');
    expect(screen.getByText('Erdős–Rényi acyclique')).toBeDefined();
    expect(screen.getByText(/Les graines affichées/)).toBeDefined();
    expect(screen.getAllByText('CP2').length).toBeGreaterThan(0);
    expect(screen.getAllByText('CP2+').length).toBeGreaterThan(0);
    expect(screen.getAllByText('ILP2').length).toBeGreaterThan(0);
    expect(screen.getAllByText('ILP2+').length).toBeGreaterThan(0);
    expect(screen.getByText(/Validation D\/G/)).toBeDefined();
    expect(screen.getByText('Tous les solveurs exacts applicables')).toBeDefined();
    expect(screen.getByRole('button', { name: 'D', hidden: true })).toBeDefined();
    expect(screen.getByRole('button', { name: 'G', hidden: true })).toBeDefined();

    fireEvent.click(screen.getByRole('link', { name: 'Carte des Méthodes' }));
    expect(screen.getByText('Laboratoire de graphes aléatoires')).toBeDefined();
    expect(screen.getByTestId('method-map-random-graph-demo-lab').textContent).toContain('Démonstration exécutable');
    expect(within(screen.getByTestId('method-map-random-graph-demo-lab')).getByRole('link', { name: 'Ouvrir' }).getAttribute('href')).toBe('/methods/random-graph-lab');
  });

  test('owns the page-local cockpit wrapper and layout repair styles', () => {
    const { container } = render(<App />);

    const shell = screen.getByTestId('random-lab-cockpit-shell');
    const cockpit = screen.getByTestId('method-cockpit');
    const graphPanel = container.querySelector('.graph-panel-container') as HTMLElement;
    const styles = Array.from(container.querySelectorAll('style')).map((style) => style.textContent || '').join('\n');

    expect(shell.classList.contains('random-lab-cockpit-shell')).toBe(true);
    expect(shell.contains(cockpit)).toBe(true);
    expect(cockpit.className).toBe('method-cockpit');
    expect(styles).toContain('.random-lab-cockpit-shell .method-cockpit');
    expect(styles).toContain('grid-template-columns: minmax(0, 1fr)');
    expect(styles).toContain('grid-template-rows: auto');
    expect(styles).toContain('align-items: start');
    expect(styles).toContain('min-height: 430px');
    expect(styles).toContain('overflow: visible');
    expect(screen.getByTestId('method-cockpit-graph').contains(graphPanel)).toBe(true);
  });

  test('keeps Test in Methods after the full graph visualization in DOM order', () => {
    const { container } = render(<App />);

    const graphPanel = container.querySelector('.graph-panel-container') as HTMLElement;
    const handoff = screen.getByTestId('random-graph-method-handoff');

    expect(graphPanel.compareDocumentPosition(handoff) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(handoff.textContent).toContain('Tester dans les méthodes');
  });

  test('renders both graph panels for the narrow-screen stacked layout', () => {
    const { container } = render(<App />);
    const wrappers = container.querySelectorAll('.graph-panel-container .graph-workspace-grid > div');

    expect(wrappers.length).toBe(2);
    expect(Array.from(wrappers).every((wrapper) => !wrapper.classList.contains('mobile-hide-graph'))).toBe(true);
    expect(Array.from(wrappers).every((wrapper) => wrapper.getAttribute('aria-hidden') === 'false')).toBe(true);
  });

  test('does not add the Random Graph Lab wrapper to normal MethodCockpit pages', () => {
    window.history.pushState({}, '', '/methods/cp1');
    const { container } = render(<App />);

    expect(container.querySelector('.random-lab-cockpit-shell')).toBeNull();
    expect(screen.getByTestId('method-cockpit').className).toBe('method-cockpit');
  });

  test('switches family-specific controls and blocks invalid parameters with local feedback', () => {
    render(<App />);

    expect(screen.getByText('pD')).toBeDefined();
    expect(screen.getByText('pG')).toBeDefined();
    fireEvent.change(screen.getByLabelText('Famille'), { target: { value: 'acyclic-scale-free' } });
    expect(screen.getByText('m')).toBeDefined();
    const preset = screen.getByLabelText('Préréglage déterministe') as HTMLSelectElement;
    expect([...preset.options].some((option) => option.textContent?.includes('hard-'))).toBe(true);

    fireEvent.change(screen.getByLabelText('n'), { target: { value: '0' } });
    fireEvent.click(screen.getByRole('button', { name: 'Générer' }));
    expect(screen.getByRole('alert').textContent).toContain('n');
  });

  test('same UI state and seed generate the same graph summary', () => {
    render(<App />);

    fireEvent.change(screen.getByLabelText('n'), { target: { value: '6' } });
    fireEvent.change(screen.getByLabelText('pD'), { target: { value: '0.5' } });
    fireEvent.change(screen.getByLabelText('pG'), { target: { value: '0.4' } });
    fireEvent.change(screen.getByLabelText('seedOrder'), { target: { value: '42' } });
    fireEvent.change(screen.getByLabelText('seedD'), { target: { value: '43' } });
    fireEvent.change(screen.getByLabelText('seedG'), { target: { value: '44' } });
    fireEvent.click(screen.getByRole('button', { name: 'Générer' }));
    const first = screen.getByText('Ordre topologique').nextElementSibling?.textContent;

    fireEvent.click(screen.getByRole('button', { name: 'Réinitialiser' }));
    fireEvent.change(screen.getByLabelText('n'), { target: { value: '6' } });
    fireEvent.change(screen.getByLabelText('pD'), { target: { value: '0.5' } });
    fireEvent.change(screen.getByLabelText('pG'), { target: { value: '0.4' } });
    fireEvent.change(screen.getByLabelText('seedOrder'), { target: { value: '42' } });
    fireEvent.change(screen.getByLabelText('seedD'), { target: { value: '43' } });
    fireEvent.change(screen.getByLabelText('seedG'), { target: { value: '44' } });
    fireEvent.click(screen.getByRole('button', { name: 'Générer' }));

    expect(screen.getByText('Ordre topologique').nextElementSibling?.textContent).toBe(first);
  });

  test('selecting a preset synchronizes family and visible parameters', () => {
    render(<App />);

    fireEvent.change(screen.getByLabelText('Préréglage déterministe'), { target: { value: 'hard-m-dense-sparse-1' } });
    expect((screen.getByLabelText('Famille') as HTMLSelectElement).value).toBe('acyclic-erdos-renyi');
    expect((screen.getByLabelText('n') as HTMLInputElement).value).toBe('8');
    expect((screen.getByLabelText('pD') as HTMLInputElement).value).toBe('0.82');

    fireEvent.change(screen.getByLabelText('Famille'), { target: { value: 'acyclic-scale-free' } });
    expect((screen.getByLabelText('Préréglage déterministe') as HTMLSelectElement).value).toContain('sf');
  });

  test('new random scenario displays replayable values', () => {
    const values = [0, 5, 10, 20, 30, 40, 50, 60];
    vi.spyOn(crypto, 'getRandomValues').mockImplementation((array: ArrayBufferView<ArrayBuffer>) => {
      new Uint32Array(array.buffer, array.byteOffset, 1)[0] = values.shift() ?? 1;
      return array;
    });
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: 'Nouveau scénario aléatoire' }));
    const snapshot = {
      n: (screen.getByLabelText('n') as HTMLInputElement).value,
      pD: (screen.getByLabelText('pD') as HTMLInputElement).value,
      pG: (screen.getByLabelText('pG') as HTMLInputElement).value,
      seedOrder: (screen.getByLabelText('seedOrder') as HTMLInputElement).value,
      seedD: (screen.getByLabelText('seedD') as HTMLInputElement).value,
      seedG: (screen.getByLabelText('seedG') as HTMLInputElement).value,
      order: screen.getByText('Ordre topologique').nextElementSibling?.textContent,
    };
    fireEvent.click(screen.getByRole('button', { name: 'Générer' }));
    expect((screen.getByLabelText('n') as HTMLInputElement).value).toBe(snapshot.n);
    expect((screen.getByLabelText('pD') as HTMLInputElement).value).toBe(snapshot.pD);
    expect((screen.getByLabelText('pG') as HTMLInputElement).value).toBe(snapshot.pG);
    expect((screen.getByLabelText('seedOrder') as HTMLInputElement).value).toBe(snapshot.seedOrder);
    expect((screen.getByLabelText('seedD') as HTMLInputElement).value).toBe(snapshot.seedD);
    expect((screen.getByLabelText('seedG') as HTMLInputElement).value).toBe(snapshot.seedG);
    expect(screen.getByText('Ordre topologique').nextElementSibling?.textContent).toBe(snapshot.order);
  });

  test('small tier renders all applicable exact solver rows and CP3/CP4 boundary', () => {
    render(<App />);

    for (const name of ['Legacy', 'CP1', 'CP2', 'CP2+', 'AlgoBB++', 'ILP1', 'ILP2', 'ILP2+', 'Subset DP']) {
      expect(screen.getByTestId(`solver-row-${name}`).textContent).toContain('complete-comparable');
    }
    expect(screen.getByTestId('solver-row-CP3').textContent).toContain('not-applicable-cyclic-trail-method');
    expect(screen.getByTestId('solver-row-CP4').textContent).toContain('Not applicable — cyclic-trail method.');
  });

  test('medium tier applies educational safety limits without hiding CP2, CP2+, ILP2, and ILP2+', () => {
    render(<App />);

    fireEvent.change(screen.getByLabelText('Préréglage déterministe'), { target: { value: 'hard-m-dense-sparse-1' } });
    fireEvent.click(screen.getByRole('button', { name: 'Générer' }));

    expect(screen.getByTestId('solver-row-CP2').textContent).toContain('complete-comparable');
    expect(screen.getByTestId('solver-row-CP2+').textContent).toContain('complete-comparable');
    expect(screen.getByTestId('solver-row-ILP2').textContent).not.toContain('not-run-preenumeration-risk');
    expect(screen.getByTestId('solver-row-ILP2+').textContent).not.toContain('not-run-preenumeration-risk');
    expect(screen.getByTestId('solver-row-Legacy').textContent).toContain('not-run-educational-safety-limit');
    expect(screen.getByTestId('solver-row-Subset DP').textContent).toContain('Not run — exceeds this solver’s educational safety limit.');
  });

  test('Tier L preset keeps ILP2 and ILP2+ as not-run-preenumeration-risk, not capped or complete', () => {
    render(<App />);

    fireEvent.change(screen.getByLabelText('Préréglage déterministe'), { target: { value: 'hard-stress-no-solution-1' } });
    fireEvent.click(screen.getByRole('button', { name: 'Générer' }));

    const ilp2Card = screen.getByTestId('solver-row-ILP2');
    const ilp2PlusCard = screen.getByTestId('solver-row-ILP2+');
    expect(ilp2Card).toBeDefined();
    expect(ilp2Card.textContent).toContain('not-run-preenumeration-risk');
    expect(ilp2PlusCard.textContent).toContain('not-run-preenumeration-risk');
    expect(ilp2Card.textContent).toContain('false');
    expect(screen.getByTestId('ilp2-not-run-note').textContent).toContain('pré-énumération');
    expect(within(ilp2Card).queryByText('capped')).toBeNull();
    expect(within(ilp2Card).queryByText('completed')).toBeNull();
  });

  test('exactness comparison appears only for complete comparable runs', () => {
    render(<App />);
    expect(screen.getByTestId('random-graph-equality').textContent).toContain('complete-comparable');

    fireEvent.change(screen.getByLabelText('Préréglage déterministe'), { target: { value: 'hard-stress-no-solution-1' } });
    fireEvent.click(screen.getByRole('button', { name: 'Générer' }));
    expect(screen.getByTestId('random-graph-equality').textContent).toContain('Disponible seulement');
  });

  test('ILP2+ counters and explanation are truthful', () => {
    render(<App />);

    const row = screen.getByTestId('solver-row-ILP2+');
    expect(row.textContent).toContain('earlyTermination');
    expect(row.textContent).toContain('candidatesSkippedAfterWinner');
    expect(screen.getByTestId('ilp2-plus-truth-note').textContent).toContain('does not skip path enumeration');
  });

  test('supports English and Arabic while keeping graph workspace LTR and visible text emoji-free', () => {
    const { container } = render(<App />);

    fireEvent.click(screen.getByText('English'));
    expect(screen.getByRole('heading', { name: 'Random-Graph Demonstration Lab', level: 2 })).toBeDefined();
    expect(screen.getByText('Acyclic Erdős–Rényi')).toBeDefined();

    fireEvent.click(screen.getByText('العربية'));
    expect(document.documentElement.dir).toBe('rtl');
    expect(screen.getByTestId('random-graph-demo-lab').style.direction).toBe('rtl');
    expect(screen.getByTestId('random-graph-workspace').getAttribute('dir')).toBe('ltr');
    expect(container.querySelector('[data-testid="directed-graph-container"]')?.getAttribute('dir')).toBe('ltr');
    expect(container.textContent).not.toMatch(/[\u{1F300}-\u{1FAFF}]/u);
  });

  test('small generated scenario opens in every applicable Method page with a handoff banner', () => {
    const routes = [
      ['Ouvrir dans Legacy', '/legacy'],
      ['Ouvrir dans CP1', '/methods/cp1'],
      ['Ouvrir dans CP2', '/methods/cp2'],
      ['Ouvrir dans CP2+', '/methods/cp2-plus'],
      ['Ouvrir dans AlgoBB++', '/methods/algobb-plus-plus'],
      ['Ouvrir dans ILP1', '/methods/ilp1'],
      ['Ouvrir dans ILP2', '/methods/ilp2'],
      ['Ouvrir dans ILP2+', '/methods/ilp2-plus'],
      ['Ouvrir dans Subset DP', '/methods/subset-dp'],
    ] as const;

    for (const [button, route] of routes) {
      cleanup();
      window.history.pushState({}, '', '/methods/random-graph-lab');
      render(<App />);
      fireEvent.click(screen.getByRole('button', { name: button }));
      expect(window.location.pathname).toBe(route);
      expect(screen.getByTestId('scenario-handoff-banner').textContent).toContain('random-graph-lab');
      expect(screen.getByTestId('scenario-handoff-banner').textContent).toContain('seedOrder');
    }
  }, 15000);

  test('malformed handoff safely falls back to the built-in example', () => {
    window.history.pushState({}, '', '/methods/cp2?scenario=bad');
    render(<App />);

    expect(screen.getByTestId('scenario-handoff-fallback').textContent).toContain('indisponible ou invalide');
    expect(screen.getByText('CP2 — CP1 avec Bornes Supérieures Sûres')).toBeDefined();
  });

  test('oversized scenario uses sessionStorage with a visible scenario ID', () => {
    render(<App />);

    fireEvent.change(screen.getByLabelText('n'), { target: { value: '13' } });
    fireEvent.change(screen.getByLabelText('pD'), { target: { value: '0' } });
    fireEvent.change(screen.getByLabelText('pG'), { target: { value: '1' } });
    fireEvent.click(screen.getByRole('button', { name: 'Générer' }));
    fireEvent.click(screen.getByRole('button', { name: 'Ouvrir dans CP2' }));

    const id = new URLSearchParams(window.location.search).get('scenarioId');
    expect(id).toBeTruthy();
    expect(window.sessionStorage.getItem(`method-scenario-handoff:${id}`)).toBeTruthy();
    expect(screen.getByTestId('scenario-handoff-banner').textContent).toContain(id!);
  });

  test('medium and stress method actions keep safety limits truthful', () => {
    render(<App />);

    fireEvent.change(screen.getByLabelText('Préréglage déterministe'), { target: { value: 'hard-m-dense-sparse-1' } });
    fireEvent.click(screen.getByRole('button', { name: 'Générer' }));
    expect((screen.getByRole('button', { name: 'Ouvrir dans CP2' }) as HTMLButtonElement).disabled).toBe(false);
    expect((screen.getByRole('button', { name: 'Ouvrir dans CP2+' }) as HTMLButtonElement).disabled).toBe(false);
    expect((screen.getByRole('button', { name: 'Ouvrir dans ILP2+' }) as HTMLButtonElement).disabled).toBe(false);
    expect((screen.getByRole('button', { name: 'Ouvrir dans Legacy' }) as HTMLButtonElement).disabled).toBe(true);

    fireEvent.change(screen.getByLabelText('Préréglage déterministe'), { target: { value: 'hard-stress-no-solution-1' } });
    fireEvent.click(screen.getByRole('button', { name: 'Générer' }));
    expect((screen.getByRole('button', { name: 'Ouvrir dans ILP2' }) as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByRole('button', { name: 'Ouvrir dans ILP2+' }) as HTMLButtonElement).disabled).toBe(true);
    expect(screen.getByTestId('random-graph-method-handoff').textContent).toContain('not-run-preenumeration-risk');
    expect(screen.getByTestId('random-graph-method-handoff').textContent).toContain('Not applicable — cyclic-trail method.');
  });

  test('challenge graph selection loads a deterministic handoff scenario', () => {
    render(<App />);

    fireEvent.change(screen.getByLabelText('Graphes défis déterministes'), { target: { value: 'diamond-merge-lexical-ties-small' } });
    fireEvent.click(screen.getByRole('button', { name: 'Charger le graphe défi' }));
    expect(screen.getAllByText('Famille').find((el) => el.tagName === 'DT')?.nextElementSibling?.textContent).toBe('challenge-graph');

    fireEvent.click(screen.getByRole('button', { name: 'Ouvrir dans CP2+' }));
    expect(screen.getByTestId('scenario-handoff-banner').textContent).toContain('diamond-merge-lexical-ties-small');
  });

  // H3A tests
  test('H3A: default UI shows Complexity, D/G relationship, and Generate as primary controls', () => {
    render(<App />);

    const builder = screen.getByTestId('simple-scenario-builder');
    expect(builder).toBeDefined();
    // Complexity and D/G relationship selects present in builder
    expect(within(builder).getByRole('combobox', { name: 'Complexité' })).toBeDefined();
    expect(within(builder).getByRole('combobox', { name: 'Relation D/G' })).toBeDefined();
    expect(within(builder).getByRole('button', { name: 'Générer un nouveau scénario aléatoire' })).toBeDefined();
    // complexity options include all five levels
    const complexitySelect = within(builder).getByRole('combobox', { name: 'Complexité' }) as HTMLSelectElement;
    const optionValues = [...complexitySelect.options].map((o) => o.value);
    expect(optionValues).toEqual(['tiny', 'small', 'medium', 'large', 'huge']);
    // D/G mode options include all six modes
    const modeSelect = within(builder).getByRole('combobox', { name: 'Relation D/G' }) as HTMLSelectElement;
    const modeValues = [...modeSelect.options].map((o) => o.value);
    expect(modeValues).toEqual(['independent', 'similar', 'dense-g-sparse-d', 'dense-d-sparse-g', 'small-d-core-huge-g', 'fragmented-g']);
  });

  test('H3A: technical controls are inside the Advanced reproducibility details element', () => {
    render(<App />);

    const advanced = screen.getByTestId('advanced-reproducibility');
    expect(advanced.tagName.toLowerCase()).toBe('details');
    // seeds live inside details
    expect(within(advanced).getByLabelText('seedOrder')).toBeDefined();
    expect(within(advanced).getByLabelText('seedD')).toBeDefined();
    expect(within(advanced).getByLabelText('seedG')).toBeDefined();
    expect(within(advanced).getByLabelText('n')).toBeDefined();
    expect(within(advanced).getByLabelText('pD')).toBeDefined();
    // Advanced replay buttons inside details
    expect(within(advanced).getByRole('button', { name: 'Générer' })).toBeDefined();
    expect(within(advanced).getByRole('button', { name: 'Réinitialiser' })).toBeDefined();
    expect(within(advanced).getByRole('button', { name: 'Nouveau scénario aléatoire' })).toBeDefined();
  });

  test('H3A: Huge complexity shows truthful next-generation-phase notice and disables primary generate', () => {
    render(<App />);

    const complexitySelect = screen.getByRole('combobox', { name: 'Complexité' }) as HTMLSelectElement;
    fireEvent.change(complexitySelect, { target: { value: 'huge' } });

    const notice = screen.getByTestId('next-phase-notice');
    expect(notice.textContent).toContain('Disponible dans la prochaine phase de génération.');
    const generateBtn = screen.getByRole('button', { name: 'Générer un nouveau scénario aléatoire' }) as HTMLButtonElement;
    expect(generateBtn.disabled).toBe(true);
  });

  test('H3A: Large complexity also shows next-generation-phase notice', () => {
    render(<App />);

    fireEvent.change(screen.getByRole('combobox', { name: 'Complexité' }), { target: { value: 'large' } });
    expect(screen.getByTestId('next-phase-notice')).toBeDefined();
  });

  test('H3A: Similar structure baseline mode shows next-generation-phase notice', () => {
    render(<App />);

    fireEvent.change(screen.getByRole('combobox', { name: 'Relation D/G' }), { target: { value: 'similar' } });
    expect(screen.getByTestId('next-phase-notice')).toBeDefined();
    expect(screen.getByTestId('next-phase-notice').textContent).toContain('prochaine phase');
  });

  test('H3A: Tiny+Independent generate button is enabled and generates a graph', () => {
    render(<App />);

    const complexitySelect = screen.getByRole('combobox', { name: 'Complexité' });
    const modeSelect = screen.getByRole('combobox', { name: 'Relation D/G' });
    fireEvent.change(complexitySelect, { target: { value: 'tiny' } });
    fireEvent.change(modeSelect, { target: { value: 'independent' } });

    const generateBtn = screen.getByRole('button', { name: 'Générer un nouveau scénario aléatoire' }) as HTMLButtonElement;
    expect(generateBtn.disabled).toBe(false);
    fireEvent.click(generateBtn);
    // graph summary still visible (vertices / D arcs / G edges)
    expect(screen.getByText('Sommets / arcs D / arêtes G')).toBeDefined();
  });

  test('H3A: prepared hard cases loader is a details accordion with optgroups', () => {
    render(<App />);

    const loader = screen.getByTestId('prepared-hard-cases');
    expect(loader.tagName.toLowerCase()).toBe('details');
    // optgroup label attributes (not in textContent — check DOM attribute)
    const select = screen.getByTestId('prepared-case-select');
    const optgroups = Array.from(select.querySelectorAll('optgroup'));
    const groupLabels = optgroups.map((g) => g.getAttribute('label') ?? '');
    expect(groupLabels.some((l) => l.includes('S'))).toBe(true);
    expect(groupLabels.some((l) => l.includes('M'))).toBe(true);
    expect(groupLabels.some((l) => l.includes('L'))).toBe(true);
    // each group has options
    expect(optgroups[0].querySelectorAll('option').length).toBeGreaterThan(0);
    // prepared case notice is visible inside loader
    expect(within(loader).getByTestId('prepared-case-notice')).toBeDefined();
  });

  test('H3A: graph summary shows reachable D-core size', () => {
    render(<App />);

    const dCoreEl = screen.getByTestId('reachable-d-core-size');
    expect(dCoreEl).toBeDefined();
    const val = Number(dCoreEl.textContent);
    expect(val).toBeGreaterThanOrEqual(1);
  });

  test('H3A: scientific rule sentence visible in header', () => {
    render(<App />);

    const rule = screen.getByTestId('scientific-rule');
    expect(rule.textContent).toContain('D et G partagent toujours les mêmes sommets');
  });

  test('H3A: D/G distinction result preserved and visible in graph summary', () => {
    render(<App />);

    expect(screen.getByText('Résultat')).toBeDefined();
    expect(screen.getByText('overlap / density / degree')).toBeDefined();
  });

  test('H3A: EN and AR labels render correctly for new controls', () => {
    render(<App />);

    fireEvent.click(screen.getByText('English'));
    expect(screen.getByRole('combobox', { name: 'Complexity' })).toBeDefined();
    expect(screen.getByRole('combobox', { name: 'D/G relationship' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Generate new random scenario' })).toBeDefined();
    expect(screen.getByTestId('scientific-rule').textContent).toContain('D and G always share the same reaction vertices');

    fireEvent.click(screen.getByText('العربية'));
    expect(screen.getByRole('combobox', { name: 'التعقيد' })).toBeDefined();
    expect(screen.getByRole('combobox', { name: 'العلاقة D/G' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'توليد سيناريو عشوائي جديد' })).toBeDefined();
    expect(screen.getByTestId('scientific-rule').textContent).toContain('D وG يشتركان دائماً');
  });
});
