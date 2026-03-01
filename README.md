# Children Do English

English vocabulary learning app for kids ages 6-12. Progressive Web App with offline support, spaced repetition, and multi-player profiles.

**Live:** [childrendoenglish.com](https://childrendoenglish.com)

## Tech Stack

- **React 18** + **Vite 6** — UI framework and build tool
- **Tailwind CSS 3.4** — Utility-first styling
- **vite-plugin-pwa** — Service worker and offline caching
- **Web Speech API** — Text-to-speech pronunciation
- **Google Analytics** — Usage analytics (consent-gated)
- **Sentry** — Error tracking
- **Vitest** — Unit tests
- **Playwright** — E2E tests

## Getting Started

```bash
npm install
npm run dev        # Start dev server at localhost:5173
npm run build      # Production build to dist/
npm run preview    # Preview production build
```

No environment variables are required for local development.

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |
| `npm test` | Run unit tests (Vitest) |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:e2e` | Run Playwright E2E tests |
| `npm run lint` | Run ESLint |
| `npm run format` | Run Prettier |
| `npm run build-data` | Fetch word images from Pixabay |
| `npm run optimize-images` | Optimize images with Sharp |

## Architecture

```
src/
  App.jsx                  # State machine (~20 states) + routing
  components/              # 30+ React components (lazy-loaded)
    admin/                 # Admin panel components
  data/
    words.js               # 300 curated words across 15 categories
    lessons.js             # Auto-generated learning path lessons
    badges.js              # Achievement badge definitions
    levels.js              # Difficulty level config
  hooks/
    useQuizFlow.js         # Quiz lifecycle (level -> mode -> load -> play -> results)
    useQuizState.js        # Per-question state (options, answer, feedback)
    useFocusTrap.js        # Keyboard focus trap for modals
  utils/
    storage.js             # localStorage persistence (multi-player)
    i18n.js                # English + Hebrew translations (~100 keys)
    spaced-repetition.js   # SM-2 inspired interval algorithm
    analytics.js           # Google Analytics wrapper (consent-gated)
    sound.js               # Web Audio API + TTS
    images.js              # Image URL helpers + preloading
  __tests__/               # Unit tests (Vitest + React Testing Library)
public/
  images/                  # Word images (512x512 WebP)
api/                       # Vercel serverless functions (admin image management)
scripts/                   # Build-time scripts (image fetch, optimization)
e2e/                       # Playwright E2E tests
```

**Key patterns:**
- State machine in `App.jsx` drives all navigation via `navigate(state, direction)`
- Multi-player: registry in `childrendoenglish-players`, per-player stats in `childrendoenglish-player-{id}`
- Browser history: `pushState`/`popstate` for top-level screens, hash routing for `#admin` and `#quiz/...`
- Pre-reader mode: `canRead` flag per player hides text-based quizzes, adds Listen & Match mode
- Learning path with lesson locking: lessons unlock sequentially as previous lessons are started

## Environment Variables

| Variable | Used By | Description |
|----------|---------|-------------|
| `VITE_GA_ID` | Client | Google Analytics ID (defaults to `G-YF34G1SGNE`) |
| `VITE_ADMIN_HASH` | Client | SHA-256 hash of admin password |
| `ADMIN_HASH` | Server | Same hash, server-side verification |
| `GITHUB_TOKEN` | Server | GitHub PAT for committing images |
| `GITHUB_REPO` | Server | GitHub repo in `owner/repo` format |
| `PIXABAY_API_KEY` | Build script | Pixabay API key for word images |
| `VITE_SENTRY_DSN` | Client | Sentry DSN for error reporting (optional) |

## Deployment

Deployed on **Vercel** with automatic deploys from `main`. Domain: `childrendoenglish.com`.

Admin panel: access via `/#admin` in the browser (password-protected).

## Adding Words

Words are defined in `src/data/words.js`. Each word object has: `id`, `word`, `phonetic`, `definition`, `exampleSentence`, `hebrewTranslation`, `category`, and `level`. Add a matching WebP image at `public/images/{id}.webp` (512x512).

## License

Private project.
