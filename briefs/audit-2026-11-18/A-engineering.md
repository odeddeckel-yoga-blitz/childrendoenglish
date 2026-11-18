# CDE audit, part A: engineering, performance, resilience, security, observability (2026-11-18)

Repo HEAD `1f02a0a` (2026-11-18 08:13 +0200); 512 commits since the 07-17 audit. Read-only. The build ran in a `git archive HEAD` copy
(scratchpad/buildcopy) so the prebuild would not rewrite tracked `src/data/*.json`.
**Note for the owner:** `src/data/cde-stats.json` showed as modified in the working tree at 10:11:39. This audit did not write it.
Another local process (optimizer, snapshot or hourly) probably did. It was left untouched.

## Evidence run
| check | result |
|---|---|
| `npm run lint` (src/) | 0 errors |
| `npx eslint .` (excluding .claude/worktrees, game-kit) | **2,414 errors**: e2e 1,151, tools 350, scripts 291, templates 51, api 34, configs 5 (~1,880 in tracked files) + .image-work 532 (gitignored). Of these, 2,362 are `no-undef` (no node globals) and 52 are real lint (unused vars, empty blocks, dupe key) |
| `npx vitest run` | 87 files / **628 tests pass** (18 s) |
| `npm run build` (HEAD copy) | exit 0 in 6.8 s; 770 HTML pages; sitemap 768 URLs; JSON-LD validator passes (2,142 blocks); 563 words |
| `npm audit` | 14 (4 moderate, 10 high), all in the dev/build chain (picomatch ReDoS, minimatch, glob through vite/vitest/workbox/eslint). `--omit=dev`: **0** |
| ncu | majors pending: @sentry/browser 10→11, vitest/coverage 4→5, vite-plugin-pwa 1→2, lucide-react 0.577→1.75, jsdom 28→31, jest-dom 6→7; minors on react, vite, neon, playwright 1.58→1.65 |
| Lighthouse mobile `/` | **Perf 99**, A11y 100, BP 100; LCP 2.1 s, **CLS 0.01**, TBT 90 ms |
| Lighthouse desktop `/` | 100/100/100; LCP 0.5 s, CLS 0.006 |
| Lighthouse mobile `/he/` | 100/100; CLS 0 |
| Lighthouse mobile `/vocabulary/animals/` | 100/100; 448 KiB; 219 KiB image-delivery savings |
| Playwright, storage throwing (local dist) | **white screen** on `/` and `/?lang=he`: #root text 0, no controls. Stack: `useInstallPrompt` effect |
| Playwright, no speechSynthesis + Audio throwing | renders fine, 0 errors |
| Playwright offline after one visit (SW) | `/`, `/play`, `/vocabulary/animals/`, `/games/word-zapper/` all render |
| Playwright CSP probe on the live page | **`https://o….ingest.de.sentry.io` is blocked by `connect-src`**. The live DSN host is `*.ingest.de.sentry.io`, but the CSP allows only `*.ingest.sentry.io` |
| GitHub Actions | CI green, but each run takes **22m42s–22m56s against `timeout-minutes: 25`**; 5 Dependabot PRs open since March |

## Prior LEARN.MD findings: re-verified
| # | 07-17 finding | status now |
|---|---|---|
| E1 | src/ lint clean | ✅ still clean |
| E2 | App.jsx 707 lines, 15 useEffects, decomposition half-done | 🔴 **OPEN, worse**: 1,159 lines, 23 useEffects |
| E3 | `eslint .` = 167 errors outside src; CI lints src only | 🔴 **OPEN, worse**: about 1,880 in tracked files; CI still runs `npm run lint` (src/) at ci.yml:47; eslint.config.js has no node-globals block |
| E4 | dupe key `butterfly`, scripts/fetch-images.js:128 | 🟡 OPEN (still reported by `no-dupe-keys`) |
| E5 | 229/229 unit tests | ✅ now 628/628 |
| R1 | src/utils/analytics.js unguarded localStorage at module scope (white screen with blocked storage) | ✅ analytics.js is now no-op stubs. ⚠ **The white screen remains**, moved to src/hooks/useInstallPrompt.js:36 (verified) |
| P1 | Mobile CLS 0.325, perf 77 | ✅ FIXED: CLS 0.01, perf 99 |
| P2 | Desktop 99 | ✅ 100 |
| S1 | api/ timing-unsafe compare | 🟡 OPEN: commit-image.js:8, fetch-image.js:11 (`hash === env`, unsalted SHA-256); also land.js GET `req.query.key !== token` |
| S2 | imageBase64 unvalidated | 🟡 OPEN: commit-image.js:45 (no size, type or webp-magic check before a GitHub commit) |
| A1 | Hardcoded English "Skip to content" and aria-labels break Hebrew SR | 🟡 MOSTLY FIXED in React (`t('skipToContent')` App.jsx:1113; 55 `aria-label={t(…)}`). Still English: LandingPage.jsx:158 "No", LanguagePicker.jsx:42, Menu.jsx:127, ProfilePicker.jsx:56, ProgressDashboard.jsx:58. Static Hebrew pages carry English `aria-label="Site"` / `"Explore ChildrenDoEnglish"` / `"breadcrumb"` (generate-seo-pages.js:62, :103) on every /he/ page |
| M1 | Maskable icons reuse `any` PNGs | 🟡 OPEN: vite.config.js:88-99; icon-512 has transparent rounded corners, so the mask shows corners |
| D1 | Dormancy and dependency CVEs | 🟡 Repo very active (512 commits). Prod deps 0 vulns; dev chain 10 high; majors pending; Dependabot ignores majors and its 5 PRs have sat open since March |

## 4 · Engineering & Code Quality: **7/10**
🔴 Critical
- CI takes 22m49s against a 25-minute timeout (ci.yml:28). One slow e2e run means a red main, and every push pays about 23 minutes.

🟡 Warnings
- App.jsx is 1,159 lines with 23 effects, up from 707 and 15. It holds routing (hash routes at :559), state, lazy imports and screens.
- scripts/generate-seo-pages.js is a 5,703-line monolith that generates every static page type.
- The lint blind spot is 11× bigger (167 → ~1,880 tracked). `no-undef` hides real bugs (dupe key, unused imports in scripts/fetch-real-images.js:11).
- Arcade games each carry their own copy of the word list (public/games/*/game.js `WORDS=[…{he,es}]`). Only 3 games are drift-pinned (src/__tests__/gameGlossSync.test.js).
- CI runs on Node 20 (ci.yml:36), which reached end of life in April 2026.
- `api/package.json` pins sharp ^0.34.5 with no lockfile, while the root has sharp 0.35.5 as a devDependency that api/fetch-image.js uses at runtime.

🟢 Working
- 628 unit tests, including a11y (vitest-axe), Safari-compat, SW-route, i18n and schema tests. 42 Playwright specs run in CI on main and PRs.
- Postbuild JSON-LD/CSP/RTL validator. Kit drift check in CI. Pre-push budget hook. Build is fast (7 s).
- Data is a single source (src/data/words.js) with WORD_COUNT test-guarded.

💡 Actions
- ci.yml:28,47: raise the timeout to 40 minutes or shard Playwright (`--shard`); switch to `npx eslint .` once the node-globals block lands.
- eslint.config.js: add a block for `{api,scripts,tools,e2e,templates}/**` with `globals.node`, and ignore `.image-work/**` and `.claude/**`. Then fix the about 52 real errors.
- ci.yml:36: move to Node 22 LTS (or 24).
- App.jsx: extract the hash router (:559-570) and the screen switch (:1092+) into `useHashRoute` and `ScreenRouter`.

## 5 · Performance & Core Web Vitals: **9/10**
🟢 Mobile 99 / desktop 100. LCP 2.1 s mobile, CLS 0.01, TBT 90 ms. /he/ and /vocabulary/ score 100. Initial JS is about 144 KB gzip (index 78.5 + vendor 65.9). Sentry is lazy (idle callback). SW precache is 2.1 MB / 149 entries.

🟡 Warnings
- `src/data/words.js` (181 KB source) ships in the **entry chunk** (index-*.js 297 KB raw), imported at App.jsx:20. Every added word grows landing-page JS.
- Word images are served at 512 px for about 100 px tiles: 219 KiB wasted on /vocabulary/animals/ (dog.webp alone 102 KiB). There is no srcset or thumbnail size.
- public/land-beacon.js and component-clicks.js are unminified (6 KiB). They load on every page.
- SW runtime rule `^https?://.*$` NetworkFirst (vite.config.js:58) also catches `/api/live?code=` polls, so every 2-second poll writes to Cache Storage.

💡 Actions
- Lazy-load WORDS: `import('./data/words')` after landing, or a slim `{id,word,he}` index for the landing.
- Have scripts/optimize-images.js emit `-256.webp` thumbs and add `srcset` on grids.
- vite.config.js:58: add `/\/api\//` as `NetworkOnly`.

## 8 · Accessibility: **8/10**
🟢 Lighthouse a11y 100 on all 4 pages tested. Skip link and most aria-labels are localized in the React app. `<html lang="he" dir="rtl">` is set on /he/. Reduced motion is respected in games. vitest-axe suite.

🟡 Warnings
- Static /he/ pages announce nav landmarks in English ("Site", "Explore ChildrenDoEnglish", "breadcrumb"); see generate-seo-pages.js:62, :103.
- 5 hardcoded English aria-labels in React (listed under A1 above).
- Lighthouse `label-content-name-mismatch`: language links (`aria-label="English"`, visible text differs) on /he/, and `say-btn aria-label="Hear the word"` on vocab pages.
- No full keyboard walk was done this round; Lighthouse and the axe suite are the evidence.

💡 Actions
- generate-seo-pages.js:62,103: take labels from the page-language string table.
- Replace the 5 literals with `t()` keys.
- Drop `aria-label` on the language links, or include the visible text in it.

## 9 · Mobile & Responsive / PWA: **8/10**
🟢 Offline works after one visit (verified on app, vocab and game pages). The SW update prompt plus a stale-chunk auto-reload in ErrorBoundary. A route allowlist is built from vercel.json. viewport-fit=cover. Lighthouse BP 100.

🟡 Warnings
- Maskable icons reuse the transparent rounded `any` icons (vite.config.js:88-99).
- `apple-touch-icon` is the 512 px transparent favicon (index.html:27), so iOS shows black corners. `apple-touch-startup-image` is the same icon.
- **SW audio cache `maxEntries: 800` (vite.config.js:54) is below the 1,020 audio files.** The image cache (800) is close to 659 images. The comment at :41 says the cap "must exceed the full set or the cache thrashes".
- The manifest is English only (`short_name: "KidsEnglish"`) and has no `screenshots`, so Android shows the basic install sheet.

💡 Actions
- Add `icon-maskable-512.png` (full-bleed, 80% safe zone) and a 180 px opaque apple-touch icon.
- Derive the cache caps from the file counts at build time, or set them to 2,000.

## 10 · Security: **7.5/10**
🟢 Strong headers live: CSP without unsafe-inline scripts, HSTS preload, XFO DENY, nosniff, Permissions-Policy, Referrer-Policy. A postbuild gate blocks inline scripts. Battle uses random 128-bit keys, validated enums, bounded ints, and nicknames from a whitelist (no free text). Beacon input is regex-whitelisted with parameterized SQL.

🟡 Warnings
- `api/commit-image.js` holds a **GitHub write token** behind a password that `#admin` on the public site checks. The hash is unsalted SHA-256, compared with `===` (:8). The rate limit is in-memory per instance (:12), so a cold start resets it. GitHub's error text is echoed to the client (:96).
- `api/land.js` has no rate limit or origin check on POST. Anyone can inflate `cde_land`/`cde_learn`, the data the optimizer decides from. Each batch runs up to 30 sequential upserts plus a `jserrsig` SELECT.
- `api/land.js:212`: the report token sits in the query string (it ends up in logs) and is compared with `!==`.
- `api/live.js`: no per-IP limit. Room creation in Postgres is unbounded (too_many_rooms exists only in the memory store).
- The CSP has no `report-to`/`report-uri`. That is why the Sentry block below went unseen.

💡 Actions
- commit-image.js / fetch-image.js: `crypto.timingSafeEqual` on hashes, scrypt, and size and magic checks on imageBase64 (≤600 KB, `RIFF…WEBP`). Better: disable commit-image in prod and run it locally only.
- Add a Vercel Firewall rate-limit rule on `/api/land` and `/api/live` (POST).
- land.js:212: take the token from an `Authorization` header and use timingSafeEqual.

## 11 · Vulnerabilities: **8/10**
🟢 Prod deps: 0 vulns. No `dangerouslySetInnerHTML` in src/. Static-page `innerHTML` only joins own constants and numeric casts (`+n`). Battle renders nicknames with textContent and replaceChildren. No third-party scripts: Sentry is first-party bundled and GA was removed.

🟡 Warnings
- Dev chain has 10 high (picomatch ReDoS through vite/vitest/workbox) and 4 moderate (minimatch, glob). Build-time only, but CI and the local machine run them.

💡 Actions
- Bump vite 8.3.8, vitest 5 and vite-plugin-pwa 2 together. Add an `overrides` entry for picomatch ≥4.0.3 if upstream lags.

## 13 · API design: **7/10**
🟢 Clear single-function action router for battle with a status map (`STATUS_BY_ERROR`), `Cache-Control: no-store` and 405 with `Allow`. Beacon failures are classified (`failCause`: neon-quota, bad-credentials, unreachable) while the client still gets 204. A table-init failure is not cached.

🟡 Warnings
- `/api/health` returns a static `ok` and never touches Neon, so it cannot detect the 10-22-style quota outage.
- `CREATE TABLE IF NOT EXISTS` runs on every cold start (land.js:90-101). Schema lives in request code with no migrations.
- Battle clients poll every 2 seconds per screen (about 15 req/s for a 30-kid class), each doing 2–3 queries against a Launch-tier Neon.
- `fetch-image.js` / `commit-image.js` destructure `req.body` without a null check, so a missing body gives a 500.
- No API versioning; that is acceptable at this scale.

💡 Actions
- health.js: add `?deep=1` running `SELECT 1` on Neon (5 s timeout) for the kit smoke.
- Move DDL to a migration script.
- Consider ETag/`If-None-Match` or a 3–5 s poll on /api/live.

## 18 · Failure & edge-case resilience: **6/10**
🔴 Critical
- **Blocked storage still white-screens the app (verified).** `src/hooks/useInstallPrompt.js:36` calls `localStorage.getItem` unguarded in an effect. App.jsx's only ErrorBoundary is *inside* App (App.jsx:1128), so the error unmounts the whole root, including the prerendered shell. #root text goes to 0 on `/` and `/?lang=he`.

🟡 Warnings
- `src/utils/notifications.js:21,28,49,52` and `src/utils/classUnit.js` are fine (guarded or behind guarded paths). public/land-beacon.js:5 and public/battle/battle.js:633 have possibly unguarded accesses (heuristic, not verified).
- `src/utils/sound.js:82` `playWordFile` has no timeout. On a stalled or slow network the promise never resolves (neither `onplaying` nor `onerror` fires), so the TTS fallback never runs. `stopWordAudio` (pause) also leaves it pending.
- Battle on a flaky classroom network: the 2-second poll has no visible backoff or reconnect state (not tested).

🟢 Working
- No speechSynthesis plus failing Audio: renders with 0 errors.
- Offline navigation works after one visit.
- Stale-chunk auto-reload (ErrorBoundary.jsx:20-36).
- Arcade games have an error pill ("tap to reload").
- The beacon never surfaces errors.

💡 Actions
- useInstallPrompt.js:36: wrap it in try/catch (or use storage.js helpers).
- main.jsx:23: wrap `<App/>` in a root ErrorBoundary.
- Add a Playwright spec that makes storage throw.
- sound.js:82: add `setTimeout(() => resolve(false), 2500)` plus an `onstalled` handler so TTS steps in.

## 20 · Dependencies & supply chain: **6.5/10**
🟢 Lockfile present, `npm ci` in CI, a small runtime set (react, react-dom, neon, sentry, lucide), an override for serialize-javascript, Dependabot configured.

🟡 Warnings
- Dependabot ignores all majors (.github/dependabot.yml:8) and its 5 PRs have sat open since March (eslint 9.x, vitest 4.1.2, sentry 10.46, web-vitals), all superseded.
- 6 majors pending. Sentry 11 is relevant once Sentry works again.
- `api/package.json` has a separate unlocked `sharp ^0.34.5`.
- Actions pinned by tag (`@v4`), not SHA.
- The `spotlight-hourly` workflow has `contents: write` plus the DB secret on a daily cron.

💡 Actions
- Close the stale PRs and allow minor/patch groups (`groups:`).
- Remove api/package.json's sharp or lock it.
- Pin actions to SHAs.

## 24 · Observability & monitoring: **4/10**
🔴 Critical
- **Client Sentry is silently dead (verified).** The live DSN posts to `o….ingest.de.sentry.io`, but the CSP `connect-src https://*.ingest.sentry.io` (vercel.json CSP) does not match that host: a CSP `*.` wildcard only matches hosts ending in `.ingest.sentry.io`. Every browser crash report, including ErrorBoundary's `captureException`, is blocked. The `jserr`/`jserrsig` beacon is the only client error signal.
- No CSP violation reporting, so the block went unseen.

🟡 Warnings
- `scripts/errors-check.mjs` reads only 12 h of Vercel logs and runs only when a session runs it. No push alerting exists for beacon DB failures (`[land] … cause=neon-quota` is only logged).
- `/api/health` is shallow.
- No uptime monitor seen in the repo.

🟢 Working
- Sentry scrubbing (no child names, no breadcrumbs).
- `failCause` classification in land.js.
- Recurring checks through due.mjs (kit smoke, hreflang, tap, lang, contrast, images, audio, creds).
- jserr/jserrsig/jserx and cwv beacons give aggregate client health.

💡 Actions
- vercel.json CSP `connect-src`: add `https://*.ingest.de.sentry.io` (or use a Sentry `tunnel` through /api).
- Add `report-to` pointing at Sentry's CSP endpoint.
- Make `/api/health?deep=1` check Neon, and point a free uptime ping or the kit smoke at it.

## Blockers to adding content and features
1. **Word data in the entry chunk** (App.jsx:20 imports WORDS, 181 KB source). Landing JS grows linearly with words.
2. **Arcade games duplicate the word list** inside each `public/games/<g>/game.js` with inline `he`/`es`. A new word or a new language (ar) means editing up to 24 files. Only 3 are drift-tested. A shared `public/games/words.json`, generated from words.js at build, would remove this.
3. **i18n is three hand-kept 600-line dictionaries** (src/utils/i18n.js en, i18n-he.js, i18n-es.js; i18n-ar.js is a 4-line stub). Static pages have their own string tables inside the 5,703-line generate-seo-pages.js, plus per-game `l10n.js`. Adding Arabic touches at least 3 separate string systems. The `hebrewTranslation` column in words.js and the separate `word-glosses-es/ar.js` files are inconsistent.
4. **SW cache caps are hardcoded** (vite.config.js:43,54: 800 each). Audio (1,020 files) already exceeds them, so more words mean more offline cache thrash.
5. **CI time** (23 of 25 minutes). Each added e2e spec risks a timeout.
6. `WORD_COUNT = 560` is a hand-kept literal (src/data/wordCount.js). It is test-guarded, so this is low friction.
7. The build pipeline itself is **not** a blocker: 7 s for 770 pages; the sitemap is built from dist/.
