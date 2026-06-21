// @vitest-environment jsdom
import { describe, test, expect, beforeAll, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import App from './App';
import { translations } from './i18n/translations';

describe('UI Workflow and Internationalization QA', () => {
  beforeAll(() => {
    // Setup document structure mocks if needed
    const meta = document.createElement('meta');
    meta.setAttribute('name', 'description');
    document.head.appendChild(meta);
  });

  beforeEach(() => {
    window.history.pushState({}, '', '/legacy');
  });

  afterEach(() => {
    cleanup();
  });

  test('initial dataset renders correctly', () => {
    render(<App />);
    
    // Check that French is default and example selector is present
    const datasetHeading = screen.getByText(translations.fr.selectionTitle);
    expect(datasetHeading).toBeDefined();

    // Check that Example 1 is initially selected and has its description
    const ex1Btn = screen.getByText(/1. Exemple simple valide/);
    expect(ex1Btn).toBeDefined();
  });

  test('language switching keeps the selected dataset and active step', () => {
    render(<App />);

    // Switch to Example 2
    const ex2Btn = screen.getByText(/2. Le plus long chemin est rejeté/);
    fireEvent.click(ex2Btn);

    // Switch to English
    const enBtn = screen.getByText('English');
    fireEvent.click(enBtn);

    // Verify language changed but dataset remains Example 2
    expect(screen.getByText(translations.en.selectionTitle)).toBeDefined();
    const activeExBtn = screen.getByRole('button', { name: /The longest path is rejected/, pressed: true });
    expect(activeExBtn).toBeDefined();

    // Verify document properties changed
    expect(document.documentElement.lang).toBe('en');
    expect(document.documentElement.dir).toBe('ltr');
    expect(document.title).toBe(translations.en.appTitle);

    // Run solver in English
    const runBtn = screen.getByText(translations.en.btnRun);
    fireEvent.click(runBtn);

    // Stepper is visible: check step counter
    expect(screen.getByText(/Candidate 1 \/ 13/)).toBeDefined();

    // Switch to Arabic
    const arBtn = screen.getByText('العربية');
    fireEvent.click(arBtn);

    // Verify language changed to Arabic, step remains Candidate 1, and RTL is set
    expect(document.documentElement.lang).toBe('ar');
    expect(document.documentElement.dir).toBe('rtl');
    expect(screen.getByText(/المرشح 1 \/ 13/)).toBeDefined(); 
  });

  test('stepper navigation and reset workflow works correctly', () => {
    render(<App />);

    // Run exact method (initially on Example 1)
    const runBtn = screen.getByText(translations.fr.btnRun);
    fireEvent.click(runBtn);

    // We should be on Candidate 1/10
    expect(screen.getByText(/Candidat 1 \/ 10/)).toBeDefined();

    // Click "Suivant" (Next)
    const nextBtn = screen.getByText(translations.fr.btnNext);
    fireEvent.click(nextBtn);
    expect(screen.getByText(/Candidat 2 \/ 10/)).toBeDefined();

    // Click "Précédent" (Previous)
    const prevBtn = screen.getByText(translations.fr.btnPrev);
    fireEvent.click(prevBtn);
    expect(screen.getByText(/Candidat 1 \/ 10/)).toBeDefined();

    // Click "Résultat Final" (Final Result)
    const finalBtn = screen.getByText(translations.fr.stepFinalResult);
    fireEvent.click(finalBtn);
    expect(screen.getByText(translations.fr.stepCompletedTitle)).toBeDefined();

    // Check that comparative panel is visible
    expect(screen.getByText(translations.fr.metricLongestD)).toBeDefined();
    expect(screen.getByText(translations.fr.metricLongestDG)).toBeDefined();

    // Click "Réinitialiser" (Reset)
    const resetBtn = screen.getByText(translations.fr.btnReset);
    fireEvent.click(resetBtn);

    // Results panel and stepper should disappear
    expect(screen.queryByText(translations.fr.stepCompletedTitle)).toBeNull();
    expect(screen.queryByText(translations.fr.metricLongestD)).toBeNull();
  });

  test('dataset change after reset does not retain previous step state', () => {
    render(<App />);

    // Run first example
    fireEvent.click(screen.getByText(translations.fr.btnRun));
    expect(screen.getByText(/Candidat 1 \/ 10/)).toBeDefined();

    // Reset
    fireEvent.click(screen.getByText(translations.fr.btnReset));

    // Change to Example 3
    const ex3Btn = screen.getByText(/3. Plusieurs chemins candidats/);
    fireEvent.click(ex3Btn);

    // Run Example 3
    fireEvent.click(screen.getByText(translations.fr.btnRun));
    expect(screen.getByText(/Candidat 1 \/ 17/)).toBeDefined(); // Example 3 has 17 candidate paths
  });

  test('accessible aria states are exposed', () => {
    render(<App />);

    // Example 1 button should have aria-pressed="true"
    const ex1Btn = screen.getByRole('button', { name: /1. Exemple simple valide/, pressed: true });
    expect(ex1Btn).toBeDefined();

    // Example 2 button should have aria-pressed="false"
    const ex2Btn = screen.getByRole('button', { name: /2. Le plus long chemin est rejeté/, pressed: false });
    expect(ex2Btn).toBeDefined();

    // Language buttons check
    const frBtn = screen.getByRole('button', { name: 'Français', pressed: true });
    expect(frBtn).toBeDefined();

    const enBtn = screen.getByRole('button', { name: 'English', pressed: false });
    expect(enBtn).toBeDefined();
  });
});
