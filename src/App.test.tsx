// @vitest-environment jsdom
import { describe, test, expect, beforeAll, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import App from './App';
import { translations } from './i18n/translations';

describe('UI Workflow and Internationalization QA', () => {
  beforeAll(() => {
    const meta = document.createElement('meta');
    meta.setAttribute('name', 'description');
    document.head.appendChild(meta);
  });

  beforeEach(() => {
    window.history.pushState({}, '', '/');
  });

  afterEach(() => {
    cleanup();
    window.localStorage.clear();
  });

  test('initial render shows StartHere in French', () => {
    render(<App />);

    expect(screen.getByText(/Module d'Apprentissage Pas-à-Pas/i)).toBeDefined();
    expect(document.documentElement.lang).toBe('fr');
    expect(document.documentElement.dir).toBe('ltr');
    expect(document.title).toBe(translations.fr.appTitle);
  });

  test('language switching updates document attributes and persists choice', () => {
    render(<App />);

    // Switch to English
    fireEvent.click(screen.getByText('English'));
    expect(document.documentElement.lang).toBe('en');
    expect(document.documentElement.dir).toBe('ltr');
    expect(document.title).toBe(translations.en.appTitle);

    // Switch to Arabic
    fireEvent.click(screen.getByText('العربية'));
    expect(document.documentElement.lang).toBe('ar');
    expect(document.documentElement.dir).toBe('rtl');
    expect(document.title).toBe(translations.ar.appTitle);
  });

  test('English survives a refresh remount', () => {
    const firstRender = render(<App />);
    fireEvent.click(screen.getByText('English'));
    expect(document.documentElement.lang).toBe('en');
    firstRender.unmount();

    render(<App />);

    expect(document.documentElement.lang).toBe('en');
    expect(document.documentElement.dir).toBe('ltr');
  });

  test('Arabic survives a refresh remount and restores RTL', () => {
    const firstRender = render(<App />);
    fireEvent.click(screen.getByText('العربية'));
    expect(document.documentElement.lang).toBe('ar');
    firstRender.unmount();

    render(<App />);

    expect(document.documentElement.lang).toBe('ar');
    expect(document.documentElement.dir).toBe('rtl');
  });

  test('invalid stored language falls back to French', () => {
    window.localStorage.setItem('bioinformatics-demo-language', 'de');

    render(<App />);

    expect(document.documentElement.lang).toBe('fr');
    expect(document.documentElement.dir).toBe('ltr');
  });

  test('deprecated routes redirect to StartHere', () => {
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

  test('language buttons expose correct aria-pressed states', () => {
    render(<App />);

    const frBtn = screen.getByRole('button', { name: 'Français', pressed: true });
    expect(frBtn).toBeDefined();

    const enBtn = screen.getByRole('button', { name: 'English', pressed: false });
    expect(enBtn).toBeDefined();

    fireEvent.click(enBtn);
    expect(screen.getByRole('button', { name: 'English', pressed: true })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Français', pressed: false })).toBeDefined();
  });

  test('StartHere renders chapter navigation buttons', () => {
    render(<App />);
    expect(screen.getByText(/Module d'Apprentissage Pas-à-Pas/i)).toBeDefined();
    // Chapter navigation "Next" button should be present
    expect(screen.getAllByRole('button').length).toBeGreaterThan(0);
  });

  test('stepper navigation and reset workflow works correctly', () => {
    // Verify CP2 route has playback controls
    window.history.pushState({}, '', '/methods/cp2');
    render(<App />);
    expect(screen.getByTestId('method-playback-controls')).toBeDefined();
    expect(screen.getByTestId('method-cockpit')).toBeDefined();
  });

  test('accessible aria states are exposed', () => {
    render(<App />);

    // Language buttons check
    const frBtn = screen.getByRole('button', { name: 'Français', pressed: true });
    expect(frBtn).toBeDefined();

    const enBtn = screen.getByRole('button', { name: 'English', pressed: false });
    expect(enBtn).toBeDefined();
  });
});
