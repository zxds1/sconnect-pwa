/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        injectRegister: 'auto',
        includeAssets: ['logo.jpg', 'logo-header.jpg', 'logo.svg'],
        manifest: {
          name: 'Sconnect',
          short_name: 'Sconnect',
          description: 'Sconnect commerce intelligence platform with AI and data insights.',
          start_url: '/',
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
            }
          ]
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,jpg,jpeg,webp,woff2}']
        },
        devOptions: {
          enabled: true
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
  };
});
