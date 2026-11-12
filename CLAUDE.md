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
- Production push budget (owner, 10-31): .githooks/pre-push allows a push to main only
  >=3 h after the last one (owner 11-05; was 2 h) and <=4 per UTC day (docs-only and branch pushes don't count;
  hooks install from origin/main into .git/kit-hooks: `sh scripts/install-hooks.sh` once per clone; post-merge and the kit sync refresh it, kit PATTERNS §8f(e)). Batch commits. Broken live page:
  `CDE_PUSH_NOW=1 git push`.
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
- Every word image records its source in scripts/IMAGE_SOURCES.json (title, file page, author, licence;
  `word-image-improver.mjs pick` writes it). /image-credits/ is built from it; src/__tests__/imageSources.test.js fails
  on a new image without one. Owner 11-04: CC BY / BY-SA photos must be credited.

## Recurring checks (kit RECURRING.md, owner OK 11-04)
- On "status", "what next" or the start of a session: run
  `node ~/projects/shared/game-kit/tools/due.mjs cde` and put the overdue/due checks in the answer.
  Offer to run the session ones; remind once about the owner ones (never run those).
- After running one: `node ~/projects/shared/game-kit/tools/due.mjs cde --done=<id> --result=ok|found|skipped --note="…"`
  (appends to `.recurring-log.jsonl`, committed). No new crons, launchd jobs or routines.
- The optimizer's standing sections (tools/learning/standing-sections.mjs) cover the *-read checks.
- Kit gates (1.60+), one npm script each: `npm run kit:smoke | kit:hreflang | kit:tap | kit:lang | kit:contrast |
  kit:images | kit:audio | kit:creds` (live site; read-only). Kit sync: `node scripts/sync-game-kit.mjs --from-origin`.
  Dated follow-up reads: `.recurring-reads.jsonl` via `due.mjs cde --add-read=<id> --due=YYYY-MM-DD --what="…"`.

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
