import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import React from 'react';
import { I18nProvider, useI18n, translations, LANGUAGES } from '@/lib/i18n';

// Helper to render with provider
function wrapper({ children }) {
  return <I18nProvider>{children}</I18nProvider>;
}

beforeEach(() => {
  localStorage.clear();
});

describe('i18n', () => {
  it('defaults to Spanish', () => {
    const { result } = renderHook(() => useI18n(), { wrapper });
    expect(result.current.lang).toBe('es');
    expect(result.current.t('myTasks')).toBe('Mis Tareas');
  });

  it('switches language to English', () => {
    const { result } = renderHook(() => useI18n(), { wrapper });
    act(() => result.current.changeLang('en'));
    expect(result.current.lang).toBe('en');
    expect(result.current.t('myTasks')).toBe('My Tasks');
  });

  it('switches language to French', () => {
    const { result } = renderHook(() => useI18n(), { wrapper });
    act(() => result.current.changeLang('fr'));
    expect(result.current.t('myTasks')).toBe('Mes Tâches');
  });

  it('switches language to Catalan', () => {
    const { result } = renderHook(() => useI18n(), { wrapper });
    act(() => result.current.changeLang('ca'));
    expect(result.current.t('myTasks')).toBe('Les Meves Tasques');
  });

  it('switches language to Portuguese', () => {
    const { result } = renderHook(() => useI18n(), { wrapper });
    act(() => result.current.changeLang('pt'));
    expect(result.current.t('myTasks')).toBe('Minhas Tarefas');
  });

  it('persists language to localStorage', () => {
    const { result } = renderHook(() => useI18n(), { wrapper });
    act(() => result.current.changeLang('en'));
    expect(localStorage.getItem('chain-timer-lang')).toBe('en');
  });

  it('reads initial language from localStorage', () => {
    localStorage.setItem('chain-timer-lang', 'fr');
    const { result } = renderHook(() => useI18n(), { wrapper });
    expect(result.current.lang).toBe('fr');
    expect(result.current.t('start')).toBe('Démarrer');
  });

  it('t() interpolates parameters', () => {
    const { result } = renderHook(() => useI18n(), { wrapper });
    expect(result.current.t('taskCompleted', { name: 'Cocinar' })).toBe('¡Cocinar completado! 🎉');
    act(() => result.current.changeLang('en'));
    expect(result.current.t('taskCompleted', { name: 'Cook' })).toBe('Cook completed! 🎉');
  });

  it('t() returns key as fallback for missing translations', () => {
    const { result } = renderHook(() => useI18n(), { wrapper });
    expect(result.current.t('nonexistentKey')).toBe('nonexistentKey');
  });

  it('plural() returns correct singular/plural forms', () => {
    const { result } = renderHook(() => useI18n(), { wrapper });
    expect(result.current.plural('interval', 1)).toBe('intervalo');
    expect(result.current.plural('interval', 5)).toBe('intervalos');
    act(() => result.current.changeLang('en'));
    expect(result.current.plural('interval', 1)).toBe('interval');
    expect(result.current.plural('interval', 2)).toBe('intervals');
  });

  it('all languages have the same keys', () => {
    const esKeys = Object.keys(translations.es).sort();
    for (const lang of ['en', 'fr', 'ca', 'pt']) {
      const langKeys = Object.keys(translations[lang]).sort();
      expect(langKeys).toEqual(esKeys);
    }
  });

  it('no translation value is empty', () => {
    for (const [lang, dict] of Object.entries(translations)) {
      for (const [key, val] of Object.entries(dict)) {
        expect(val, `${lang}.${key} should not be empty`).not.toBe('');
      }
    }
  });

  it('LANGUAGES has 5 entries with correct codes', () => {
    expect(LANGUAGES).toHaveLength(5);
    expect(LANGUAGES.map(l => l.code)).toEqual(['es', 'en', 'fr', 'ca', 'pt']);
  });

  it('all sound keys are translated in every language', () => {
    const soundKeys = ['soundBeep', 'soundBell', 'soundChime', 'soundBuzzer', 'soundSoft'];
    for (const [lang, dict] of Object.entries(translations)) {
      for (const key of soundKeys) {
        expect(dict[key], `${lang}.${key} missing`).toBeDefined();
      }
    }
  });

  it('reps key exists in every language', () => {
    for (const [lang, dict] of Object.entries(translations)) {
      expect(dict.reps, `${lang}.reps missing`).toBeDefined();
    }
  });
});
