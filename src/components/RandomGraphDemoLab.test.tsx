// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import App from '../App';

describe('Random-Graph Demonstration Lab', () => {
  beforeEach(() => {
    window.history.pushState({}, '', '/methods/random-graph-lab');
    window.localStorage.clear();
  });

  afterEach(() => cleanup());

  test('renders the route, navbar link, Method Map link, and released solver result surfaces', () => {
    render(<App />);

    expect(screen.getByTestId('random-graph-demo-lab')).toBeDefined();
    expect(screen.getByRole('link', { name: 'Graphes aléatoires' }).style.fontWeight).toBe('700');
    expect(screen.getByText('Erdős–Rényi acyclique')).toBeDefined();
    expect(screen.getByText(/Les mêmes paramètres/)).toBeDefined();
    expect(screen.getByText('CP2')).toBeDefined();
    expect(screen.getByText('CP2+')).toBeDefined();
    expect(screen.getByText('ILP2')).toBeDefined();
    expect(screen.getByRole('button', { name: 'D', hidden: true })).toBeDefined();
    expect(screen.getByRole('button', { name: 'G', hidden: true })).toBeDefined();

    fireEvent.click(screen.getByRole('link', { name: 'Carte des Méthodes' }));
    expect(screen.getByText('Laboratoire de graphes aléatoires')).toBeDefined();
    expect(screen.getByRole('link', { name: 'Lancer le laboratoire de graphes' }).getAttribute('href')).toBe('/methods/random-graph-lab');
  });

  test('switches family-specific controls and blocks invalid parameters with local feedback', () => {
    render(<App />);

    expect(screen.getByText('pD')).toBeDefined();
    expect(screen.getByText('pG')).toBeDefined();
    fireEvent.change(screen.getByLabelText('Famille'), { target: { value: 'acyclic-scale-free' } });
    expect(screen.getByText('m')).toBeDefined();

    fireEvent.change(screen.getByLabelText('n'), { target: { value: '0' } });
    fireEvent.click(screen.getByRole('button', { name: 'Générer' }));
    expect(screen.getByRole('alert').textContent).toContain('n');
  });

  test('same UI state and seed generate the same graph summary', () => {
    render(<App />);

    fireEvent.change(screen.getByLabelText('n'), { target: { value: '6' } });
    fireEvent.change(screen.getByLabelText('pD'), { target: { value: '0.5' } });
    fireEvent.change(screen.getByLabelText('pG'), { target: { value: '0.4' } });
    fireEvent.change(screen.getByLabelText('graine'), { target: { value: '42' } });
    fireEvent.click(screen.getByRole('button', { name: 'Générer' }));
    const first = screen.getByText('Ordre topologique').nextElementSibling?.textContent;

    fireEvent.click(screen.getByRole('button', { name: 'Réinitialiser' }));
    fireEvent.change(screen.getByLabelText('n'), { target: { value: '6' } });
    fireEvent.change(screen.getByLabelText('pD'), { target: { value: '0.5' } });
    fireEvent.change(screen.getByLabelText('pG'), { target: { value: '0.4' } });
    fireEvent.change(screen.getByLabelText('graine'), { target: { value: '42' } });
    fireEvent.click(screen.getByRole('button', { name: 'Générer' }));

    expect(screen.getByText('Ordre topologique').nextElementSibling?.textContent).toBe(first);
  });

  test('Tier L preset keeps ILP2 as not-run-preenumeration-risk, not capped or complete', () => {
    render(<App />);

    fireEvent.change(screen.getByLabelText('Préréglage déterministe'), { target: { value: 'er-stress-1' } });
    fireEvent.click(screen.getByRole('button', { name: 'Générer' }));

    const ilp2Card = screen.getByText('ILP2').closest('.card') as HTMLElement;
    expect(ilp2Card).toBeDefined();
    expect(ilp2Card.textContent).toContain('not-run-preenumeration-risk');
    expect(ilp2Card.textContent).toContain('false');
    expect(ilp2Card.textContent).toContain('0');
    expect(screen.getByTestId('ilp2-not-run-note').textContent).toContain('pré-énumération');
    expect(within(ilp2Card).queryByText('capped')).toBeNull();
    expect(within(ilp2Card).queryByText('completed')).toBeNull();
  });

  test('supports English and Arabic while keeping graph workspace LTR and visible text emoji-free', () => {
    const { container } = render(<App />);

    fireEvent.click(screen.getByText('English'));
    expect(screen.getByText('Random-Graph Demonstration Lab')).toBeDefined();
    expect(screen.getByText('Acyclic Erdős–Rényi')).toBeDefined();

    fireEvent.click(screen.getByText('العربية'));
    expect(document.documentElement.dir).toBe('rtl');
    expect(screen.getByTestId('random-graph-demo-lab').style.direction).toBe('rtl');
    expect(screen.getByTestId('random-graph-workspace').getAttribute('dir')).toBe('ltr');
    expect(container.querySelector('[data-testid="directed-graph-container"]')?.getAttribute('dir')).toBe('ltr');
    expect(container.textContent).not.toMatch(/[\u{1F300}-\u{1FAFF}]/u);
  });
});
