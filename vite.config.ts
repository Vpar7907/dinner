import { readFileSync } from 'node:fs';
import { fileURLToPath, URL } from 'node:url';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

const { version } = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf-8')) as { version: string };

/** A release build must have its version described in CHANGELOG.md: the app shows that list to users. */
function changelogGuard(): Plugin {
  return {
    name: 'changelog-guard',
    apply: 'build',
    buildStart() {
      const changelog = readFileSync(new URL('./CHANGELOG.md', import.meta.url), 'utf-8');
      const latest = /^##\s+\[?v?(\d+\.\d+\.\d+)/m.exec(changelog)?.[1];
      if (latest !== version) {
        this.error(`CHANGELOG.md: последняя запись — ${latest ?? 'нет'}, а в package.json версия ${version}. Добавьте запись «## ${version} — ГГГГ-ММ-ДД».`);
      }
    },
  };
}

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(version),
  },
  plugins: [
    changelogGuard(),
    react(),
    VitePWA({
      // The user decides when to switch to a new version (see app/providers/PwaManager.tsx).
      registerType: 'prompt',
      injectRegister: false,
      includeAssets: ['favicon.ico', 'apple-touch-icon-180x180.png', 'icon.svg'],
      manifest: {
        name: 'Меню недели — планировщик рациона',
        short_name: 'Меню недели',
        description: 'Планировщик меню на неделю со списком покупок и учётом запасов. Работает без интернета.',
        lang: 'ru',
        start_url: './',
        scope: './',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#fdfbf7',
        theme_color: '#f45d1b',
        categories: ['food', 'lifestyle', 'productivity'],
        icons: [
          { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
        shortcuts: [
          { name: 'Список покупок', url: './#/shopping', icons: [{ src: 'pwa-192x192.png', sizes: '192x192' }] },
          { name: 'Запасы', url: './#/pantry', icons: [{ src: 'pwa-192x192.png', sizes: '192x192' }] },
        ],
      },
      workbox: {
        // Everything the app needs is precached: the whole UI works offline after the first visit.
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
        navigateFallback: 'index.html',
        cleanupOutdatedCaches: true,
      },
      devOptions: { enabled: false },
    }),
  ],
  base: './',
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
});
