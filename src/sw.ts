/// <reference lib="webworker" />

import { clientsClaim } from 'workbox-core';
import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching';
import { registerRoute, NavigationRoute } from 'workbox-routing';
import { ExpirationPlugin } from 'workbox-expiration';
import { NetworkFirst } from 'workbox-strategies';

declare let self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: Array<Record<string, any>>;
};

void self.skipWaiting();
clientsClaim();
cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST || []);

const apiRoutes = [
  {
    pattern: /^https?:\/\/.*\/v1\/intelligence(?:\/|$)/,
    cacheName: 'api-intelligence',
    maxAgeSeconds: 10,
    maxEntries: 50,
  },
  {
    pattern: /^https?:\/\/.*\/v1\/search(?:\/|$)/,
    cacheName: 'api-search',
    maxAgeSeconds: 300,
    maxEntries: 100,
  },
  {
    pattern: /^https?:\/\/.*\/v1\/analytics\/(?:dashboard|funnel|inventory|buyers|market|anomalies)(?:\/|$)/,
    cacheName: 'api-analytics',
    maxAgeSeconds: 15,
    maxEntries: 50,
  },
  {
    pattern: /^https?:\/\/.*\/v1\/seller\/(?:growth|financial|channel-mix|market|customers|alerts|live-buyers|peak-hours|timeseries|sales|top-products)(?:\/|$)/,
    cacheName: 'api-seller-analytics',
    maxAgeSeconds: 15,
    maxEntries: 100,
  },
  {
    pattern: /^https?:\/\/.*\/v1\/feed(?:\/|$)/,
    cacheName: 'api-feed',
    maxAgeSeconds: 30,
    maxEntries: 40,
  },
  {
    pattern: /^https?:\/\/.*\/v1\/groupbuy\/instances(?:\/|$)/,
    cacheName: 'api-groupbuy-instances',
    maxAgeSeconds: 300,
    maxEntries: 40,
  },
  {
    pattern: /^https?:\/\/.*\/v1\/group-buy(?:\/|$)/,
    cacheName: 'api-group-buy',
    maxAgeSeconds: 30,
    maxEntries: 40,
  },
  {
    pattern: /^https?:\/\/.*\/v1\/paths(?:\/|$)/,
    cacheName: 'api-paths',
    maxAgeSeconds: 3600,
    maxEntries: 40,
  },
  {
    pattern: /^https?:\/\/.*\/v1\/navigation(?:\/|$)/,
    cacheName: 'api-navigation',
    maxAgeSeconds: 3600,
    maxEntries: 30,
  },
];

for (const route of apiRoutes) {
  registerRoute(
    ({ url }) => route.pattern.test(url.href),
    new NetworkFirst({
      cacheName: route.cacheName,
      networkTimeoutSeconds: 3,
      plugins: [
        new ExpirationPlugin({
          maxEntries: route.maxEntries,
          maxAgeSeconds: route.maxAgeSeconds,
        }),
      ],
    }),
  );
}

registerRoute(
  new NavigationRoute(({ request, url }) => {
    if (request.mode !== 'navigate') return fetch(request);
    if (url.pathname.startsWith('/v1/')) return fetch(request);
    return fetch('/index.html');
  }),
);

self.addEventListener('message', (event) => {
  if ((event.data as any)?.type === 'SKIP_WAITING') {
    void self.skipWaiting();
  }
});

export {};
