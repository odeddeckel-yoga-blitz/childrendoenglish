import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
import asyncCss from './vite-plugin-async-css.js';
import { SW_FALLBACK_ALLOW, SW_IMAGE_RE, SW_AUDIO_RE, swCacheCaps } from './sw-routes.js';
import { WORD_COUNT } from './src/data/wordCount.js';

// index.html's prerendered copy and meta write the one word count as %WORD_COUNT% (persona P5:
// the same number as the app and every generated page; it was a stale hand-typed 480).
const wordCountHtml = () => ({
  name: 'cde-word-count',
  transformIndexHtml: { order: 'pre', handler: (html) => html.replaceAll('%WORD_COUNT%', String(WORD_COUNT)) },
});

// Runtime-cache caps follow the real file counts (sw-routes.js; 1.5x headroom, swCacheCaps.test.js).
const SW_CAPS = swCacheCaps();

export default defineConfig({
  plugins: [
    wordCountHtml(),
    react(),
    tailwindcss(),
    asyncCss(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['favicon.png', 'icon-192.png', 'icon-512.png', 'og-image.png'],
      workbox: {
        globPatterns: ['**/*.{js,css,html}', 'favicon.png', 'icon-192.png', 'icon-512.png', 'og-image.png'],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        clientsClaim: true,
        skipWaiting: true,
        navigateFallbackAllowlist: [SW_FALLBACK_ALLOW],
        navigateFallbackDenylist: [/\/images\//, /\/api\//, /\/battle\//, /\/vocabulary\//, /\/printable-flashcards\//, /\/guides\//, /\/about\//, /\/he\//, /\.webp$/, /\.png$/, /\.js$/, /\.css$/],
        runtimeCaching: [
          {
            urlPattern: SW_IMAGE_RE,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'word-images-v11',
              expiration: {
                // Must exceed the full image set or the cache thrashes and quizzes re-fetch.
                maxEntries: SW_CAPS.imageCap,
                maxAgeSeconds: 30 * 24 * 60 * 60,
              },
            },
          },
          {
            urlPattern: SW_AUDIO_RE,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'word-audio-v5',
              expiration: {
                // Word, sentence (audio/s), CVC, pairs and game audio: all match /audio/.
                maxEntries: SW_CAPS.audioCap,
                maxAgeSeconds: 30 * 24 * 60 * 60,
              },
            },
          },
          {
            // API calls are live data (battle polls /api/live every 2 s, beacons): never cache them.
            // Under the catch-all below, each poll was written to Cache Storage and pushed real
            // pages out of the 'pages' cache.
            urlPattern: /\/api\//,
            handler: 'NetworkOnly',
          },
          {
            urlPattern: /^https?:\/\/.*$/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'pages',
              expiration: {
                // Static pages plus each game's html/js/css; a few visited games fill 50.
                maxEntries: 200,
                maxAgeSeconds: 24 * 60 * 60,
              },
            },
          },
        ],
      },
      manifest: {
        name: 'Children Do English',
        short_name: 'KidsEnglish',
        description: 'Fun English vocabulary learning for kids ages 6-12',
        theme_color: '#2563eb',
        background_color: '#eff6ff',
        display: 'standalone',
        orientation: 'portrait',
        categories: ['education', 'games', 'kids'],
        icons: [
          {
            src: 'icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          // Full-bleed, lettering inside the 40% safe zone (scripts/generate-icons.js maskable).
          // The `any` icons have transparent rounded corners, which showed through the mask.
          {
            src: 'icon-maskable-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable',
          },
          {
            src: 'icon-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
    }),
  ],
  build: {
    rollupOptions: {
      output: {
        // Vite 8 (rolldown) replaced object-form manualChunks with codeSplitting
        codeSplitting: {
          groups: [
            { name: 'icons', test: /node_modules[\\/]lucide-react[\\/]/ },
            { name: 'vendor', test: /node_modules[\\/](react|react-dom|scheduler)[\\/]/ },
          ],
        },
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.js',
    exclude: ['e2e/**', 'node_modules/**', 'game-kit/**', 'templates/**', '.claude/**'], // .claude/worktrees = agent checkouts (11-08) // templates/ = kit harness CLIs, .spec named but not vitest suites
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['src/**/*.{js,jsx}'],
      exclude: ['src/setupTests.js', 'src/__tests__/**'],
    },
  },
});
