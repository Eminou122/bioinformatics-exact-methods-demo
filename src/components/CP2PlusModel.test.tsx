// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import App from '../App';

describe('CP2+ route and educational cockpit', () => {
  beforeEach(() => {
    window.history.pushState({}, '', '/methods/cp2-plus');
    window.localStorage.clear();
  });

  afterEach(() => cleanup());

  test('renders route, navigation, current event card, counters, and mobile graph tabs', () => {
    render(<App />);

    expect(screen.getByText('CP2+ — Propagation sûre de faisabilité génomique')).toBeDefined();
    expect(screen.getByRole('link', { name: 'Modèle CP2+' })).toBeDefined();
    expect(screen.getByTestId('cp2-plus-current-event-card')).toBeDefined();
    expect(screen.getByTestId('cp2-plus-counters')).toBeDefined();
    expect(screen.getByRole('button', { name: 'D', hidden: true })).toBeDefined();
    expect(screen.getByRole('button', { name: 'G', hidden: true })).toBeDefined();
  });

  test('plays through the dedicated genomic-pruning fixture and exposes the safe prune', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Démarrer CP2+' }));

    const end = screen.getByRole('button', { name: 'Fin' });
    fireEvent.click(end);
    expect(screen.getByText('Exact / preuve complète')).toBeDefined();

    const safePrunes = screen.getAllByText('SAFE GENOMIC PRUNE');
    expect(safePrunes.length).toBeGreaterThan(0);
  });

  test('supports English, French, and Arabic with RTL shell and LTR graph workspace', () => {
    render(<App />);

    fireEvent.click(screen.getByText('English'));
    expect(screen.getByText('CP2+ — Safe Genomic-Feasibility Propagation')).toBeDefined();

    fireEvent.click(screen.getByText('العربية'));
    expect(screen.getByText('CP2+ — الانتشار الآمن لإمكان الاتصال الجينومي')).toBeDefined();
    expect(document.documentElement.dir).toBe('rtl');
    expect(screen.getByTestId('cp2-plus-page').style.direction).toBe('rtl');
    expect(screen.getByTestId('cp2-plus-graph-workspace').getAttribute('dir')).toBe('ltr');
  });

  test('shows the repairable disconnected-prefix fixture without a safe prune for A to B', () => {
    render(<App />);
    fireEvent.change(screen.getByLabelText('Exemple pédagogique'), {
      target: { value: 'cp2-plus-repairable' },
    });

    expect(screen.getByText(/préfixe actuellement déconnecté/i)).toBeDefined();
    const traceButtons = screen.getAllByRole('button').filter((button) => button.textContent?.includes('A -> B'));
    expect(traceButtons.some((button) => button.textContent?.includes('SAFE GENOMIC PRUNE'))).toBe(false);
  });

  test('contains no visible emoji characters', () => {
    const { container } = render(<App />);
    expect(container.textContent).not.toMatch(/[\u{1F300}-\u{1FAFF}]/u);
  });
});
