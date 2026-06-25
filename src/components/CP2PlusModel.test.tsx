// @vitest-environment jsdom
import { act } from 'react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import App from '../App';
import { cp2PlusTeachingExamples } from '../data/cp2PlusExamples';
import { solveCP2Plus } from '../domain/cp2PlusSolver';

describe('CP2+ route and educational cockpit', () => {
  beforeEach(() => {
    window.history.pushState({}, '', '/methods/cp2-plus');
    window.localStorage.clear();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

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
      expect(screen.getByTestId('cp2-plus-current-event-ordinal').textContent).toMatch(/ÉTAPE 0 \/ \d+/);
    }
  });

  test('keeps toolbar, card, journal row, and graph synchronized across playback controls', () => {
    vi.useFakeTimers();
    const { container } = render(<App />);
    const controls = within(screen.getByTestId('method-playback-controls'));
    const rows = Array.from(container.querySelectorAll<HTMLElement>('[data-trace-index]'));
    const total = rows.length;
    const example = cp2PlusTeachingExamples[0];
    const trace = solveCP2Plus(example.vertices, example.edgesD, example.edgesG).trace;
    const ordinalWidth = Math.max(2, String(total).length);

    const expectStep = (index: number) => {
      const ordinal = index + 1;
      expect(controls.getByText(`Étape: ${ordinal} / ${total}`)).toBeDefined();
      expect(screen.getByTestId('cp2-plus-current-event-ordinal').textContent).toBe(`ÉTAPE ${ordinal} / ${total}`);
      const activeRow = container.querySelector<HTMLElement>('[data-active-trace="true"]');
      expect(activeRow?.getAttribute('data-trace-index')).toBe(String(index));
      expect(activeRow?.textContent).toContain(`${String(ordinal).padStart(ordinalWidth, '0')} / ${total}`);
      expect(activeRow?.getAttribute('aria-label')).toMatch(new RegExp(`Étape ${ordinal} sur ${total}:`, 'i'));
      expect(container.querySelectorAll('[data-testid="directed-graph-container"] .graph-node circle[stroke-width="4"]').length)
        .toBe(trace[index].currentPath.length);
    };

    fireEvent.click(controls.getByRole('button', { name: 'Démarrer CP2+' }));
    expectStep(0);
    fireEvent.click(controls.getByRole('button', { name: 'Suivant' }));
    expectStep(1);
    fireEvent.click(controls.getByRole('button', { name: 'Précédent' }));
    expectStep(0);

    fireEvent.click(controls.getByRole('button', { name: 'Lecture' }));
    act(() => vi.advanceTimersByTime(1100));
    expectStep(1);

    fireEvent.click(controls.getByRole('button', { name: 'Fin' }));
    expectStep(total - 1);
    fireEvent.click(controls.getByRole('button', { name: 'Réinitialiser' }));
    expect(controls.getByText(`Étape: 0 / ${total}`)).toBeDefined();
    expect(screen.getByTestId('cp2-plus-current-event-ordinal').textContent).toBe(`ÉTAPE 0 / ${total}`);
    expect(container.querySelector('[data-active-trace="true"]')).toBeNull();
    expect(container.querySelectorAll('[data-testid="directed-graph-container"] .graph-node circle[stroke-width="4"]')).toHaveLength(0);
  });

  test('shows first, middle, and last row ordinals with localized accessible labels', () => {
    const { container } = render(<App />);
    const rows = Array.from(container.querySelectorAll<HTMLElement>('[data-trace-index]'));
    const total = rows.length;
    const ordinalWidth = Math.max(2, String(total).length);

    for (const index of [0, Math.floor(total / 2), total - 1]) {
      expect(rows[index].textContent).toContain(`${String(index + 1).padStart(ordinalWidth, '0')} / ${total}`);
      expect(rows[index].getAttribute('aria-label')).toMatch(new RegExp(`Étape ${index + 1} sur ${total}:`, 'i'));
    }

    fireEvent.click(screen.getByText('English'));
    expect(container.querySelector('[data-trace-index="0"]')?.getAttribute('aria-label')).toMatch(/^Step 1 of \d+:/);
    expect(screen.getByTestId('cp2-plus-current-event-ordinal').textContent).toBe(`STEP 0 / ${total}`);
    fireEvent.click(screen.getByText('العربية'));
    expect(container.querySelector('[data-trace-index="0"]')?.getAttribute('aria-label')).toMatch(/^الخطوة 1 من \d+:/);
    expect(screen.getByTestId('cp2-plus-current-event-ordinal').textContent).toBe(`الخطوة 0 / ${total}`);
    expect(screen.getByTestId('cp2-plus-current-event-ordinal').getAttribute('dir')).toBe('ltr');
  });

  test('keeps the ordinal visible in the mobile layout', () => {
    window.innerWidth = 320;
    window.dispatchEvent(new Event('resize'));
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: 'Démarrer CP2+' }));
    const ordinal = screen.getByTestId('cp2-plus-current-event-ordinal');
    expect(ordinal.textContent).toMatch(/ÉTAPE 1 \/ \d+/);
    expect(ordinal.style.whiteSpace).toBe('nowrap');
  });

  test('contains no visible emoji characters', () => {
    const { container } = render(<App />);
    expect(container.textContent).not.toMatch(/[\u{1F300}-\u{1FAFF}]/u);
  });
});
