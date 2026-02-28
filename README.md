# Children Do English

A web-based English vocabulary learning app for kids ages 6-12. Helps English and Hebrew speakers grow their English vocabulary through image quizzes, word quizzes, audio quizzes, flashcards, and spaced repetition.

**Live**: [childrendoenglish.com](https://childrendoenglish.com)

## Stack

- React 18 + Vite 6 + Tailwind 3.4
- PWA with offline support (Workbox)
- No backend — all data stored in localStorage
- Deployed on Vercel

## Getting Started

```bash
npm install
npm run dev
```

The app runs at `http://localhost:5173`. No environment variables are required for local development.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |
| `npm test` | Run unit tests (Vitest) |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:e2e` | Run E2E tests (Playwright) |
| `npm run build-data` | Build word data from Pixabay (requires `PIXABAY_API_KEY`) |
| `npm run optimize-images` | Optimize images with Sharp |

## Environment Variables

See `.env.example` for all variables. Only needed for admin panel and data scripts — not required for local development.

| Variable | Used By | Description |
|----------|---------|-------------|
| `VITE_ADMIN_HASH` | Client (admin login) | SHA-256 hash of admin password |
| `ADMIN_HASH` | Server (API routes) | Same hash, server-side verification |
| `GITHUB_TOKEN` | Server (API routes) | GitHub PAT for committing images |
| `GITHUB_REPO` | Server (API routes) | GitHub repo in `owner/repo` format |
| `PIXABAY_API_KEY` | Build script | Pixabay API key for word images |

## Admin Panel

Access via `/#admin` in the browser. Password-protected (SHA-256 hash compared against `VITE_ADMIN_HASH`). Used for replacing word images from Wikimedia Commons.

## Project Structure

```
src/
  components/       # React components
    admin/          # Admin panel components
  data/             # Static word data, levels, badges
  hooks/            # Custom React hooks (useQuizState)
  utils/            # Pure utilities (shuffle, spaced repetition, storage, sound)
public/
  images/           # Word images (WebP)
api/                # Vercel serverless functions (admin image management)
scripts/            # Build-time scripts
tests/              # Unit and E2E tests
```

## Adding Words

Words are defined in `src/data/words.js`. Each word object has: `id`, `word`, `phonetic`, `definition`, `exampleSentence`, `hebrewTranslation`, `category`, and `level`. Add a matching WebP image at `public/images/{id}.webp` (512x512 recommended).

## Tests

Unit tests cover spaced repetition, shuffle, storage, and data integrity. E2E tests cover the full quiz flow, all three quiz modes, dark mode, learn mode, and flashcards.

```bash
npm test              # Unit tests
npm run test:e2e      # E2E tests (requires Playwright browsers)
```

## License

Private project.
