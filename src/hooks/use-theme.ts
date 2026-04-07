'use client';

import { useSyncExternalStore, useCallback } from 'react';

type Theme = 'dark' | 'gathering';

const STORAGE_KEY = 'hearth-theme';
const STORAGE_AUTO_KEY = 'hearth-theme-auto';

function getAutoTheme(): Theme {
  const h = new Date().getHours();
  return h >= 6 && h < 18 ? 'gathering' : 'dark';
}

function applyTheme(theme: Theme) {
  document.documentElement.setAttribute(
    'data-theme',
    theme === 'gathering' ? 'gathering' : ''
  );
}

// ─── Module-level store (shared across all useTheme() callers) ───

let currentTheme: Theme = typeof window !== 'undefined'
  ? (() => {
      const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
      const isAuto = localStorage.getItem(STORAGE_AUTO_KEY) !== 'false';
      return (!isAuto && stored) ? stored : getAutoTheme();
    })()
  : 'dark';

let currentIsAuto: boolean = typeof window !== 'undefined'
  ? localStorage.getItem(STORAGE_AUTO_KEY) !== 'false'
  : true;

const listeners = new Set<() => void>();

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function notify() {
  listeners.forEach((cb) => cb());
}

function getThemeSnapshot(): Theme {
  return currentTheme;
}

function getAutoSnapshot(): boolean {
  return currentIsAuto;
}

function getServerTheme(): Theme {
  return 'dark';
}

function getServerAuto(): boolean {
  return true;
}

// Auto-switch timer (single shared interval)
let autoInterval: ReturnType<typeof setInterval> | null = null;

function startAutoInterval() {
  if (autoInterval) return;
  autoInterval = setInterval(() => {
    if (!currentIsAuto) return;
    const auto = getAutoTheme();
    if (auto !== currentTheme) {
      currentTheme = auto;
      applyTheme(auto);
      notify();
    }
  }, 60_000);
}

function stopAutoInterval() {
  if (autoInterval) {
    clearInterval(autoInterval);
    autoInterval = null;
  }
}

// Cross-tab sync via storage events
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEY || e.key === STORAGE_AUTO_KEY) {
      currentIsAuto = localStorage.getItem(STORAGE_AUTO_KEY) !== 'false';
      const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
      currentTheme = (!currentIsAuto && stored) ? stored : getAutoTheme();
      applyTheme(currentTheme);
      if (currentIsAuto) startAutoInterval(); else stopAutoInterval();
      notify();
    }
  });

  // Start auto interval if in auto mode
  if (currentIsAuto) startAutoInterval();
}

export function useTheme() {
  const theme = useSyncExternalStore(subscribe, getThemeSnapshot, getServerTheme);
  const isAutoMode = useSyncExternalStore(subscribe, getAutoSnapshot, getServerAuto);

  const setTheme = useCallback((t: Theme) => {
    currentTheme = t;
    currentIsAuto = false;
    localStorage.setItem(STORAGE_KEY, t);
    localStorage.setItem(STORAGE_AUTO_KEY, 'false');
    applyTheme(t);
    stopAutoInterval();
    notify();
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(currentTheme === 'dark' ? 'gathering' : 'dark');
  }, [setTheme]);

  const resetToAuto = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.setItem(STORAGE_AUTO_KEY, 'true');
    currentIsAuto = true;
    currentTheme = getAutoTheme();
    applyTheme(currentTheme);
    startAutoInterval();
    notify();
  }, []);

  return { theme, setTheme, toggleTheme, isAutoMode, resetToAuto };
}
