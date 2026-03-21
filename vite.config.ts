/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {webcrypto} from 'node:crypto';
import {defineConfig, loadEnv} from 'vite';
import {VitePWA} from 'vite-plugin-pwa';

const globalAny = globalThis as any;
if (!globalAny.crypto) {
  globalAny.crypto = webcrypto;
}
if (!globalAny.global) {
  globalAny.global = globalAny;
}
if (!globalAny.global.crypto) {
  globalAny.global.crypto = globalAny.crypto;
}

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  const isDev = mode === 'development';
  return {
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        injectRegister: 'auto',
        minify: false,
        includeAssets: ['logo.jpg', 'logo-header.jpg', 'logo.svg'],
        manifest: {
          name: 'Sconnect',
          short_name: 'Sconnect',
          description: 'Sconnect commerce intelligence platform with AI and data insights.',
          start_url: '/',
          scope: '/',
          id: '/',
          display: 'standalone',
          background_color: '#0b0b0d',
          theme_color: '#0b0b0d',
          icons: [
            {
              src: '/logo.jpg',
              sizes: '192x192',
              type: 'image/jpeg'
            },
            {
              src: '/logo.jpg',
              sizes: '512x512',
              type: 'image/jpeg'
            },
            {
              src: '/logo.svg',
              sizes: 'any',
              type: 'image/svg+xml'
            }
          ]
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,jpg,jpeg,webp,woff2}'],
          runtimeCaching: [
            {
              urlPattern: /^https?:\/\/.*\/v1\/intelligence(?:\/|$)/,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'api-intelligence',
                networkTimeoutSeconds: 3,
                expiration: {
                  maxEntries: 50,
                  maxAgeSeconds: 10
                }
              }
            },
            {
              urlPattern: /^https?:\/\/.*\/v1\/search(?:\/|$)/,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'api-search',
                networkTimeoutSeconds: 3,
                expiration: {
                  maxEntries: 100,
                  maxAgeSeconds: 300
                }
              }
            },
            {
              urlPattern: /^https?:\/\/.*\/v1\/analytics\/(?:dashboard|funnel|inventory|buyers|market|anomalies)(?:\/|$)/,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'api-analytics',
                networkTimeoutSeconds: 3,
                expiration: {
                  maxEntries: 50,
                  maxAgeSeconds: 15
                }
              }
            },
            {
              urlPattern: /^https?:\/\/.*\/v1\/seller\/(?:growth|financial|channel-mix|market|customers|alerts|live-buyers|peak-hours|timeseries|sales|top-products)(?:\/|$)/,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'api-seller-analytics',
                networkTimeoutSeconds: 3,
                expiration: {
                  maxEntries: 100,
                  maxAgeSeconds: 15
                }
              }
            },
            {
              urlPattern: /^https?:\/\/.*\/v1\/feed(?:\/|$)/,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'api-feed',
                networkTimeoutSeconds: 3,
                expiration: {
                  maxEntries: 40,
                  maxAgeSeconds: 30
                }
              }
            },
            {
              urlPattern: /^https?:\/\/.*\/v1\/groupbuy\/instances(?:\/|$)/,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'api-groupbuy-instances',
                networkTimeoutSeconds: 3,
                expiration: {
                  maxEntries: 40,
                  maxAgeSeconds: 300
                }
              }
            },
            {
              urlPattern: /^https?:\/\/.*\/v1\/paths(?:\/|$)/,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'api-paths',
                networkTimeoutSeconds: 3,
                expiration: {
                  maxEntries: 40,
                  maxAgeSeconds: 3600
                }
              }
            },
            {
              urlPattern: /^https?:\/\/.*\/v1\/navigation(?:\/|$)/,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'api-navigation',
                networkTimeoutSeconds: 3,
                expiration: {
                  maxEntries: 30,
                  maxAgeSeconds: 3600
                }
              }
            }
          ]
        },
        devOptions: {
          enabled: isDev
        }
      })
    ],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      port: 3000,
      hmr: process.env.DISABLE_HMR !== 'true',
    },
    build: {
      chunkSizeWarningLimit: 2200,
      rollupOptions: {
        output: {
          manualChunks: {
            react: ['react', 'react-dom'],
            maps: ['mapbox-gl'],
            charts: ['recharts'],
            motion: ['motion'],
            ai: ['@google/genai'],
            markdown: ['react-markdown'],
          },
        },
      },
    },
  };
});
