// Component clicks (kit infra/kpi v1.50.0): CDE's per-site config. public/cc-init.js installs it on every page
// (static SEO pages + the SPA); src/__tests__/componentClicks.test.js pins the routes below.
// Routes arrive normalised by the kit (lowercase, no trailing slash).
export const CC_CONFIG = {
  endpoint: '/api/land',
  // Leaf content and play surfaces are never tracked: word pages, games, reading passages, the flashcard maker,
  // and the app's play routes (quiz screens that keep the /app URL are muted by PLAY_VIEW gating in cc-init.js).
  exclude: [
    /^\/vocabulary\/[^/]+\/(?!hebrew$|spanish$)[^/]+$/,
    /^\/games\/[^/]+/,
    /^\/band-1\/reading\/[^/]+/,
    /^\/tools\//,
    /^\/(learn|flashcards|daily-review|today|battle|projector|privacy|terms)(\/|$)/,
  ],
  // First match wins; one-segment routes fall back to the kit's route rule ('/' → home, '/games' → games, …).
  templates: [
    { name: 'teachers', re: /^\/((he|es)\/)?(for-)?teachers$/ }, // reserved 11-08: the page ships later; before he-hub
    { name: 'he-games-age', re: /^\/he\/english-games\/ages-[^/]+$/ },
    { name: 'he-games-topic', re: /^\/he\/english-games\/[^/]+$/ },
    { name: 'he-words-set', re: /^\/he\/english-words\/[^/]+$/ },
    { name: 'he-grade', re: /^\/he\/grade-\d+$/ },
    { name: 'he-hub', re: /^\/he\/[^/]+$/ },
    { name: 'vocab-age', re: /^\/vocabulary\/ages-[^/]+$/ },
    { name: 'vocab-category-lang', re: /^\/vocabulary\/[^/]+\/(hebrew|spanish)$/ },
    { name: 'vocab-category', re: /^\/vocabulary\/[^/]+$/ },
    { name: 'printable-lang', re: /^\/printable-flashcards\/[^/]+\/(hebrew|spanish)$/ },
    { name: 'printable-category', re: /^\/printable-flashcards\/[^/]+$/ },
    { name: 'grade', re: /^\/grade-\d+$/ },
    { name: 'band1-hub', re: /^\/band-1$/ },
    { name: 'band1-reading-hub', re: /^\/band-1\/reading$/ },
    { name: 'band1-review-hub', re: /^\/band-1\/review$/ },
    { name: 'band1-review-set', re: /^\/band-1\/review\/[^/]+$/ },
    { name: 'band1-topic', re: /^\/band-1\/[^/]+$/ },
    { name: 'unit', re: /^\/units\/[^/]+\/[^/]+$/ },
    { name: 'unit-series', re: /^\/units\/[^/]+$/ },
    { name: 'guide', re: /^\/guides\/[^/]+$/ },
  ],
  internal: { param: 'internal', key: 'cde_internal' },
};

// SPA views that are navigation (each has its own URL in App.jsx STATE_TO_PATH). Every other view — quizzes,
// flashcards, results, onboarding, the ladder — is play and stays out of the counts.
export const NAV_VIEWS = new Set(['landing', 'menu', 'levelSelect', 'badges', 'progress', 'learningPath', 'parentDashboard',
  'playerSelect', 'playerManage', 'playerCreate', 'personalList', 'letterPath']);

// Play blocks inside otherwise-tracked static pages (unit practice, reading questions).
export const PLAY_BLOCKS = '.practice, #practice, .modes, [data-reading]';
