import js from '@eslint/js';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import globals from 'globals';

export default [
  js.configs.recommended,
  {
    files: ['src/**/*.{js,jsx}'],
    plugins: {
      react: reactPlugin,
      'react-hooks': reactHooksPlugin,
    },
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.es2021,
      },
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    settings: {
      react: { version: 'detect' },
    },
    rules: {
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      'react/jsx-uses-vars': 'error',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    },
  },
  {
    files: ['src/**/*.test.{js,jsx}', 'src/setupTests.js'],
    languageOptions: {
      globals: {
        vi: 'readonly',
        describe: 'readonly',
        it: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        test: 'readonly',
      },
    },
  },
  // Node-side code: build scripts, serverless functions, tools, e2e specs and root configs.
  // e2e and tools drive Playwright, whose page.evaluate() callbacks run in the browser, so
  // they also get browser globals.
  {
    files: [
      'scripts/**/*.{js,mjs,cjs}',
      'api/**/*.{js,mjs,cjs}',
      'tools/**/*.{js,mjs,cjs}',
      'e2e/**/*.{js,mjs,cjs}',
      '*.{js,mjs,cjs}',
    ],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.node,
      },
    },
    rules: {
      'no-unused-vars': ['error', { argsIgnorePattern: '^_', caughtErrors: 'none' }],
      // `try { … } catch {}` is the house idiom for best-effort fs/JSON/storage reads.
      'no-empty': ['error', { allowEmptyCatch: true }],
    },
  },
  {
    files: ['e2e/**/*.{js,mjs,cjs}', 'tools/**/*.{js,mjs,cjs}'],
    languageOptions: {
      globals: {
        ...globals.browser,
        // Test hooks the arcade games expose on window (public/games/<g>/game.js, e.g.
        // `window.BS = {…}`), read inside page.evaluate() callbacks.
        BS: 'readonly', CC: 'readonly', FE: 'readonly', LD: 'readonly', ML: 'readonly',
        OO: 'readonly', OPP: 'readonly', PB: 'readonly', RT: 'readonly', SB: 'readonly',
        SF: 'readonly', SL: 'readonly', SS: 'readonly', TF: 'readonly', WM: 'readonly',
        WZ: 'readonly', Game: 'readonly', CDE_END: 'readonly',
        // Injected by the persona/sweep tools themselves (addInitScript / axe-core tag).
        __pt: 'readonly', __pv: 'readonly', axe: 'readonly',
      },
    },
  },
  {
    files: ['**/*.cjs'],
    languageOptions: { sourceType: 'commonjs' },
  },
  {
    // Generated output, vendored kit copies (synced byte-for-byte by
    // scripts/sync-game-kit.mjs, so fixes belong in the kit), static assets, reports
    // and agent worktrees.
    ignores: [
      'dist/',
      'node_modules/',
      'public/',
      'game-kit/',
      'templates/',
      'playwright-report/',
      'test-results/',
      'coverage/',
      '.image-work/',
      '.claude/',
    ],
  },
];
