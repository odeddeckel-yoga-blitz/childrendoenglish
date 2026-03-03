# Children Do English

Free English vocabulary PWA for kids ages 6-12. Learn 268 words across 14 categories via image quizzes, flashcards, audio challenges, and spaced repetition. The UI is available in English and Hebrew.

## Tech Stack

- React 18
- Vite 6
- Tailwind CSS
- Workbox PWA (via vite-plugin-pwa)
- Vitest + Playwright

## Getting Started

```bash
git clone https://github.com/<your-username>/childrendoenglish.git
cd childrendoenglish
npm install
npm run dev
```

The dev server starts at [http://localhost:5173](http://localhost:5173).

## Scripts

| Script | Command | Description |
| --- | --- | --- |
| dev | `npm run dev` | Start Vite dev server |
| build | `npm run build` | Production build + generate SEO pages |
| test | `npm run test` | Run unit tests with Vitest |
| test:e2e | `npm run test:e2e` | Run end-to-end tests with Playwright |
| lint | `npm run lint` | Lint source files with ESLint |
| format | `npm run format` | Format source files with Prettier |

## Project Structure

```
childrendoenglish/
├── api/                  # Vercel serverless functions
├── e2e/                  # Playwright end-to-end tests
├── public/               # Static assets (icons, images, robots.txt)
├── scripts/              # Build-time scripts (image optimization, SEO pages)
├── src/
│   ├── __tests__/        # Vitest unit tests
│   ├── components/       # React components
│   │   ├── admin/        # Admin panel components
│   │   ├── WordQuiz.jsx
│   │   ├── ImageQuiz.jsx
│   │   ├── AudioQuiz.jsx
│   │   ├── FlashcardMode.jsx
│   │   ├── LearnMode.jsx
│   │   └── ...
│   ├── data/             # Word lists, levels, badges, lessons
│   ├── hooks/            # Custom React hooks
│   ├── utils/            # Helpers (i18n, storage, analytics, spaced repetition)
│   ├── App.jsx
│   └── main.jsx
├── index.html
├── vite.config.js
├── tailwind.config.js
├── eslint.config.js
├── playwright.config.js
└── vercel.json
```

## Deployment

The project auto-deploys to [Vercel](https://vercel.com) from the `main` branch.

## License

MIT
