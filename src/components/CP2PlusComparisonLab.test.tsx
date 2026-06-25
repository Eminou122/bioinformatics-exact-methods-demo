// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import App from '../App';
import { runCP2PlusBenchmark } from '../domain/cp2PlusBenchmark';

describe('CP2+ Comparison Lab', () => {
  beforeEach(() => {
    window.history.pushState({}, '', '/methods/cp2-plus/comparison');
    window.localStorage.clear();
  });

  afterEach(() => cleanup());

  test('renders the public route and is reachable from CP2+ and the Method Map', () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: 'Laboratoire de comparaison CP2+' })).toBeDefined();
    expect(screen.getByRole('link', { name: 'Modèle CP2+' }).style.fontWeight).toBe('700');

    fireEvent.click(screen.getByRole('link', { name: 'Retour à CP2+' }));
    const labLink = screen.getByRole('link', { name: 'Voir le laboratoire de comparaison' });
    expect(labLink.getAttribute('href')).toBe('/methods/cp2-plus/comparison');
    expect(labLink.parentElement?.textContent).toContain('benchmark complet');

    fireEvent.click(screen.getByRole('link', { name: 'Carte des Méthodes' }));
    expect(screen.getByRole('link', { name: 'Voir le laboratoire CP2+' }).getAttribute('href')).toBe('/methods/cp2-plus/comparison');
  });

  test('renders aggregate metrics directly from the benchmark engine', () => {
    render(<App />);
    const { summary } = runCP2PlusBenchmark();
    const expected = {
      'total-cases': summary.totalCaseCount,
      'objective-mismatches': summary.equalityMismatches.objective,
      'winner-mismatches': summary.equalityMismatches.winner,
      'proof-mismatches': summary.equalityMismatches.proofStatus,
      'validity-mismatches': summary.equalityMismatches.validity,
      'cp2-states': summary.cp2.statesExplored,
      'cp2-plus-states': summary.cp2Plus.statesExplored,
      'state-reduction': summary.cp2.statesExplored - summary.cp2Plus.statesExplored,
      'cp2-events': summary.cp2.eventsEmitted,
      'cp2-plus-events': summary.cp2Plus.eventsEmitted,
      'event-reduction': summary.cp2.eventsEmitted - summary.cp2Plus.eventsEmitted,
      'genomic-checks': summary.cp2Plus.genomicPropagationChecks,
      'genomic-prunes': summary.cp2Plus.genomicPropagationPrunes,
      'state-case-counts': `${summary.reducedStateCases} / ${summary.equalStateCases} / ${summary.increasedStateCases}`,
    };

    for (const [key, value] of Object.entries(expected)) {
      expect(screen.getByTestId(`comparison-metric-${key}`).textContent).toContain(String(value));
    }
    expect(summary.equalityMismatches).toEqual({ objective: 0, winner: 0, proofStatus: 0, validity: 0 });
  });

  test('shows all families, equality results, conclusion, and permanent limitation', () => {
    const { container } = render(<App />);
    const report = runCP2PlusBenchmark();
    const families = [
      'fragmented-genomic',
      'dense-genomic',
      'repairable-future-bridge',
      'small-exhaustive',
      'larger-bounded-stress',
    ];

    for (const familyId of families) {
      const family = container.querySelector(`[data-family-id="${familyId}"]`);
      expect(family).not.toBeNull();
      expect(family?.textContent).toContain('Toutes les vérifications concordent');
    }
    expect(screen.getByTestId('cp2-plus-generated-conclusion').textContent).toContain(report.summary.conclusion);
    expect(screen.getByTestId('cp2-plus-limitation-note')).toBeDefined();
  });

  test('provides English, French, and Arabic content with RTL shell and LTR metrics', () => {
    render(<App />);
    expect(screen.getByText('Preuves structurelles déterministes comparant CP2 et CP2+.')).toBeDefined();

    fireEvent.click(screen.getByText('English'));
    expect(screen.getByText('Deterministic structural evidence comparing CP2 and CP2+.')).toBeDefined();
    expect(screen.getByText('Fragmented genomic cases')).toBeDefined();

    fireEvent.click(screen.getByText('العربية'));
    expect(screen.getByText('أدلة بنيوية حتمية تقارن بين CP2 وCP2+.')).toBeDefined();
    expect(document.documentElement.dir).toBe('rtl');
    expect(screen.getByTestId('cp2-plus-comparison-lab').style.direction).toBe('rtl');
    expect(within(screen.getByTestId('comparison-metric-cp2-states')).getByText('417').getAttribute('dir')).toBe('ltr');
  });

  test('uses narrow responsive grids without horizontal overflow and has no visible emoji', () => {
    window.innerWidth = 320;
    window.dispatchEvent(new Event('resize'));
    const { container } = render(<App />);
    const page = screen.getByTestId('cp2-plus-comparison-lab');

    expect(page.style.maxWidth).toBe('100%');
    expect(page.style.minWidth).toBe('0px');
    expect(container.querySelector('.cp2-comparison-summary')).toBeDefined();
    expect(container.querySelector('.cp2-comparison-families')).toBeDefined();
    expect(container.textContent).not.toMatch(/[\u{1F300}-\u{1FAFF}]/u);

    window.innerWidth = 390;
    window.dispatchEvent(new Event('resize'));
    expect(page.style.maxWidth).toBe('100%');
  });
});
