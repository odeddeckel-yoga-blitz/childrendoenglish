import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
import asyncCss from './vite-plugin-async-css.js';

export default defineConfig({
  plugins: [
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
        navigateFallbackDenylist: [/\/images\//, /\/api\//, /\/battle\//, /\/vocabulary\//, /\/printable-flashcards\//, /\/guides\//, /\/about\//, /\/he\//, /\.webp$/, /\.png$/, /\.js$/, /\.css$/],
        runtimeCaching: [
          {
            urlPattern: /\/images\/.*\.webp$/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'word-images-v3',
              expiration: {
                // Must exceed the full image set (409 words + numbers/colors
                // ≈470 files) or the cache thrashes and quizzes re-fetch.
                maxEntries: 800,
                maxAgeSeconds: 30 * 24 * 60 * 60,
              },
            },
          },
          {
            urlPattern: /\/audio\/.*\.mp3$/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'word-audio-v2',
              expiration: {
                maxEntries: 800,
                maxAgeSeconds: 30 * 24 * 60 * 60,
              },
            },
          },
          {
            urlPattern: /^https?:\/\/.*$/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'pages',
              expiration: {
                maxEntries: 50,
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
          {
            src: 'icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable',
          },
          {
            src: 'icon-512.png',
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
    exclude: ['e2e/**', 'node_modules/**', 'game-kit/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['src/**/*.{js,jsx}'],
      exclude: ['src/setupTests.js', 'src/__tests__/**'],
    },
  },
});
