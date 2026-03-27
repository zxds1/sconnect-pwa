/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerSW } from 'virtual:pwa-register';

const APP_BUILD_ID = __APP_BUILD_ID__;
const BUILD_ID_STORAGE_KEY = 'soko:app_build_id';
const BUILD_RELOAD_STORAGE_KEY = 'soko:app_build_reload';

type CrashBoundaryProps = {
  children: React.ReactNode;
};

type CrashBoundaryState = {
  hasError: boolean;
  message: string;
};

class AppCrashBoundary extends React.Component<CrashBoundaryProps, CrashBoundaryState> {
  constructor(props: CrashBoundaryProps) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error): CrashBoundaryState {
    return {
      hasError: true,
      message: error?.message || 'The app hit an unexpected error.',
    };
  }

  componentDidCatch(error: Error) {
    console.error('App crash boundary caught an error:', error);
  }

  handleReset = async () => {
    try {
      localStorage.removeItem(BUILD_RELOAD_STORAGE_KEY);
      sessionStorage.removeItem(BUILD_RELOAD_STORAGE_KEY);
    } catch {}
    try {
      await Promise.allSettled([unregisterServiceWorkers(), clearRuntimeCaches()]);
    } catch {}
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center p-6">
        <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl">
          <p className="text-[11px] font-black uppercase tracking-[0.24em] text-amber-300">App recovery</p>
          <h1 className="mt-2 text-2xl font-black tracking-tight">We hit a loading problem.</h1>
          <p className="mt-3 text-sm text-white/75">
            {this.state.message || 'The app ran into a runtime error while opening this screen.'}
          </p>
          <div className="mt-5 flex gap-3">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="flex-1 rounded-2xl bg-white px-4 py-3 text-sm font-black text-zinc-950"
            >
              Reload
            </button>
            <button
              type="button"
              onClick={() => void this.handleReset()}
              className="flex-1 rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-black text-white"
            >
              Reset app cache
            </button>
          </div>
        </div>
      </div>
    );
  }
}

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

const unregisterServiceWorkers = async () => {
  if (!('serviceWorker' in navigator)) return;
  const registrations = await navigator.serviceWorker.getRegistrations();
  await Promise.all(registrations.map((registration) => registration.unregister()));
};

const clearRuntimeCaches = async () => {
  if (!('caches' in window)) return;
  const keys = await caches.keys();
  await Promise.all(keys.map((key) => caches.delete(key)));
};

const syncBuildVersion = async (): Promise<boolean> => {
  if (typeof window === 'undefined') return false;
  try {
    const previousBuildId = localStorage.getItem(BUILD_ID_STORAGE_KEY);
    if (!previousBuildId) {
      localStorage.setItem(BUILD_ID_STORAGE_KEY, APP_BUILD_ID);
      sessionStorage.removeItem(BUILD_RELOAD_STORAGE_KEY);
      return false;
    }
    if (previousBuildId === APP_BUILD_ID) {
      sessionStorage.removeItem(BUILD_RELOAD_STORAGE_KEY);
      return false;
    }

    await Promise.allSettled([unregisterServiceWorkers(), clearRuntimeCaches()]);
    localStorage.setItem(BUILD_ID_STORAGE_KEY, APP_BUILD_ID);

    const pendingReload = sessionStorage.getItem(BUILD_RELOAD_STORAGE_KEY);
    if (pendingReload !== APP_BUILD_ID) {
      sessionStorage.setItem(BUILD_RELOAD_STORAGE_KEY, APP_BUILD_ID);
      window.location.reload();
      return true;
    }

    sessionStorage.removeItem(BUILD_RELOAD_STORAGE_KEY);
  } catch {
    // Ignore storage/cache failures and continue booting.
  }
  return false;
};

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

const isLocalRuntime = typeof window !== 'undefined'
  && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

window.addEventListener('vite:preloadError', () => {
  window.location.reload();
});

const boot = async () => {
  const reloadingForFreshBuild = await syncBuildVersion();
  if (reloadingForFreshBuild) return;

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <AppCrashBoundary>
        <App />
      </AppCrashBoundary>
    </StrictMode>,
  );

  if (isLocalRuntime) {
    // Local stacks need fresh API behavior; remove previously installed SW/cache layers.
    void Promise.allSettled([unregisterServiceWorkers(), clearRuntimeCaches()]);
  } else {
    const updateSW = registerSW({
      immediate: true,
      onNeedRefresh() {
        window.dispatchEvent(new Event('soko:sw-update'));
      },
      onOfflineReady() {
        window.dispatchEvent(new Event('soko:sw-ready'));
      },
      onRegisterError() {
        window.location.reload();
      }
    });

    if (typeof window !== 'undefined') {
      (window as any).__soko_updateSW = updateSW;
    }
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
};

void boot();
