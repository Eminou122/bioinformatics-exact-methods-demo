// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import App from '../App';
import { cp2PlusTeachingExamples } from '../data/cp2PlusExamples';

describe('CP2+ route and educational cockpit', () => {
  beforeEach(() => {
    window.history.pushState({}, '', '/methods/cp2-plus');
    window.localStorage.clear();
  });

  afterEach(() => cleanup());

  test('renders the structured library, current event card, counters, and mobile graph tabs', () => {
    render(<App />);

    expect(screen.getByText('CP2+ — Propagation sûre de faisabilité génomique')).toBeDefined();
    expect(screen.getByRole('link', { name: 'Modèle CP2+' })).toBeDefined();
    expect(screen.getByTestId('cp2-plus-teaching-examples')).toBeDefined();
    expect(screen.getByTestId('cp2-plus-teaching-examples').querySelectorAll('[data-example-id]')).toHaveLength(8);
    expect(screen.getByTestId('cp2-plus-current-event-card')).toBeDefined();
    expect(screen.getByTestId('cp2-plus-counters')).toBeDefined();
    expect(screen.getByRole('button', { name: 'D', hidden: true })).toBeDefined();
    expect(screen.getByRole('button', { name: 'G', hidden: true })).toBeDefined();
  });

  test('plays through the unreachable-bridge fixture and exposes the safe prune', () => {
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

    for (const example of cp2PlusTeachingExamples) {
      expect(screen.getByText(example.titleFr)).toBeDefined();
    }

    fireEvent.click(screen.getByText('English'));
    expect(screen.getByText('CP2+ — Safe Genomic-Feasibility Propagation')).toBeDefined();
    for (const example of cp2PlusTeachingExamples) {
      expect(screen.getByText(example.titleEn)).toBeDefined();
    }

    fireEvent.click(screen.getByText('العربية'));
    expect(screen.getByText('CP2+ — الانتشار الآمن لإمكان الاتصال الجينومي')).toBeDefined();
    for (const example of cp2PlusTeachingExamples) {
      expect(screen.getByText(example.titleAr)).toBeDefined();
    }
    expect(document.documentElement.dir).toBe('rtl');
    expect(screen.getByTestId('cp2-plus-page').style.direction).toBe('rtl');
    expect(screen.getByTestId('cp2-plus-graph-workspace').getAttribute('dir')).toBe('ltr');
  });

  test('loads every example deterministically and resets playback', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Démarrer CP2+' }));

    for (const example of cp2PlusTeachingExamples) {
      const title = example.titleFr;
      fireEvent.click(screen.getByRole('button', { name: new RegExp(title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')) }));
      expect(screen.getByRole('button', { name: new RegExp(title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), pressed: true })).toBeDefined();
      expect(screen.getByTestId('cp2-plus-graph-summary').textContent).toBe(example.graphSummary);
      expect(screen.getByText(/Étape: 0 \//)).toBeDefined();
    }
  });

  test('contains no visible emoji characters', () => {
    const { container } = render(<App />);
    expect(container.textContent).not.toMatch(/[\u{1F300}-\u{1FAFF}]/u);
  });
});
