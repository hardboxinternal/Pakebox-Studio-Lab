import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import {defineConfig} from 'vite';
import {VitePWA} from 'vite-plugin-pwa';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Ambil timestamp commit git terbaru saat build
function getGitCommitDate(): string {
  try {
    // Format: "2026-11-24 22:03:27 +0700"
    const raw = execSync('git log -1 --format=%ci', { encoding: 'utf-8' }).trim();
    // Konversi ke objek Date lalu format WIB (UTC+7)
    const date = new Date(raw);
    const formatter = new Intl.DateTimeFormat('id-ID', {
      timeZone: 'Asia/Jakarta',
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    return formatter.format(date); // e.g. "Senin, 24 November 2026 pukul 22.03"
  } catch {
    return 'Tidak diketahui';
  }
}

const GIT_COMMIT_DATE = getGitCommitDate();

export default defineConfig(() => {
  return {
    define: {
      __GIT_COMMIT_DATE__: JSON.stringify(GIT_COMMIT_DATE),
    },
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['icon.svg', 'apple-touch-icon.png', 'pwa-192x192.png', 'pwa-512x512.png', 'pwa-maskable-512x512.png'],
        manifest: {
          id: '/',
          name: 'PAKEBOX STUDIO',
          short_name: 'PAKEBOX',
          description: 'Aplikasi kalkulator box custom, manajemen data bahan, cetak, dan database biaya finishing jasa rakit.',
          theme_color: '#07140F',
          background_color: '#07140F',
          display: 'standalone',
          start_url: '/',
          scope: '/',
          icons: [
            {
              src: '/pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/pwa-maskable-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            {
              urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'gstatic-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
          ],
        },
        devOptions: {
          enabled: true,
          type: 'module',
        },
      }),
      {
        name: 'pwa-hmr-safe-register',
        enforce: 'pre',
        resolveId(id) {
          if (id.includes('@vite-plugin-pwa/pwa-entry-point-loaded')) {
            return '\0virtual:pwa-entry-point-safe';
          }
        },
        load(id) {
          if (
            id === '\0virtual:pwa-entry-point-safe' ||
            id.includes('@vite-plugin-pwa/pwa-entry-point-loaded')
          ) {
            return `export default function registerDevSW() {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    navigator.serviceWorker.register('/dev-sw.js?dev-sw', { scope: '/', type: 'classic' }).catch(() => {});
  }
}`;
          }
        },
      },
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
