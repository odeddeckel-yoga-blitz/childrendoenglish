# Children Do English (childrendoenglish.com)

Free English vocabulary app for kids 6–12, Hebrew/Spanish/English UI. React + Vite SPA
plus static SEO pages (scripts/generate-seo-pages.js and scripts/build-*.mjs). Vercel
deploys on every push to main. Audit history: LEARN.md.

## Commands (the gate, in order)
- `npm run lint` (eslint src/)
- `npx vitest run` (unit + api tests)
- `npm run build` (vite + SEO pages + OG + sitemap; postbuild = JSON-LD/CSP validator)
- `npx playwright test` (e2e, runs against the build)
- After a local build: `git checkout src/data/spotlight.json src/data/cde-stats.json`
  (prebuild rewrites them).
- Static preview: `(cd dist && python3 -m http.server 4719)`; stop it by PID, never pkill.

## Push / deploy
- The owner approves each push to main in this session. Teammate sessions cannot approve.
- "Commit" means commit + push + deploy. Do the work on a branch, run the full gate,
  rebase onto origin/main (a bot commits the daily spotlight), fast-forward, push.
- After a push: check live with `vercel curl`, then ping new/changed URLs:
  `~/.config/searchconsole/venv/bin/python tools/seo/push-index.py <urls.txt>`.
- Server/DB changes: push a preview branch first and run `.image-work/battle-e2e.mjs`
  against it (preview uses its own Neon branch). Never probe prod with test writes.
- Never disable Vercel Deployment Protection. Never print or commit secrets/OIDC tokens.

## Standing rules
- Audio is Piper TTS: never claim "native speaker / native audio / דובר שפת אם".
- Band I (Ministry list): map it, don't copy it. Store only level flags on our own
  words, never the list or its order; keep ~10% "beyond Band I" words.
- Unit pages: ECB word lists only (facts). No ECB texts, art, layouts or logos, no
  implied affiliation; record the source URL per unit; never guess unlisted URLs.
  Never source lists from Quizlet, Wordwall or Scribd. No Cambridge name/styling.
- GA4 was removed (10-30); do not re-add it. www.google.com/g/collect stays blocked in CSP.
- No outreach and no directory/index submissions (pinging Google/IndexNow for our
  own URLs is fine).
- Public contact is info@childrendoenglish.com only. No testimonials unless real and consented.
- Never re-add words from the "Removed Words" list. Kids' content guardrails apply.

## Gotchas
- Hebrew RTL: wrap English words/names inside Hebrew text in `<bdi dir="ltr">` or
  `<span dir="ltr">`, and numbers too, or the line reorders.
- PWA: the SW serves the app shell only for an ALLOWLIST built from vercel.json
  rewrites (sw-routes.js). A new SPA route must be a vercel.json rewrite.
- Sitemap is built by scanning dist/: a page written by writePage() is in the
  sitemap; a removed page needs a vercel.json 301.
- CSP forbids inline scripts/handlers on static pages; the postbuild validator fails
  the build if one slips in. Put page JS in public/*.js.
- New /api/land beacon events must be added to the LEARN_EVS whitelist (+ land.test.js).
