/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerSW } from 'virtual:pwa-register';

const storedTheme = (() => {
  try {
    return localStorage.getItem('soko:theme');
  } catch {
    return null;
  }
})();
const prefersDarkQuery = typeof window !== 'undefined'
  ? window.matchMedia?.('(prefers-color-scheme: dark)') ?? null
  : null;
const resolveTheme = (mode: string | null) => {
  if (mode === 'light' || mode === 'dark') return mode;
  return prefersDarkQuery?.matches ? 'dark' : 'light';
};
const initialTheme = resolveTheme(storedTheme);
document.documentElement.dataset.theme = initialTheme;

if (prefersDarkQuery) {
  const handleChange = () => {
    let mode: string | null = null;
    try {
      mode = localStorage.getItem('soko:theme');
    } catch {
      mode = null;
    }
    if (mode === 'system' || !mode) {
      document.documentElement.dataset.theme = resolveTheme(mode);
    }
  };
  if (typeof prefersDarkQuery.addEventListener === 'function') {
    prefersDarkQuery.addEventListener('change', handleChange);
  } else if (typeof prefersDarkQuery.addListener === 'function') {
    prefersDarkQuery.addListener(handleChange);
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

const updateSW = registerSW({
  immediate: true,
  onNeedRefresh() {
    window.dispatchEvent(new Event('soko:sw-update'));
  },
  onOfflineReady() {
    window.dispatchEvent(new Event('soko:sw-ready'));
  }
});

if (typeof window !== 'undefined') {
  (window as any).__soko_updateSW = updateSW;
}

const splash = document.getElementById('app-splash');
if (splash) {
  requestAnimationFrame(() => {
    splash.classList.add('fade-out');
    window.setTimeout(() => {
      splash.remove();
    }, 400);
  });
}
