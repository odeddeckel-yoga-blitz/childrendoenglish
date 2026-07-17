# LEARN.MD — Audit Knowledge Base

## Meta / Process
- **Learning**: Repo went dormant 2026-03-15 → 2026-07: dependency CVEs re-accumulated (15 vulns incl. 4 new undici highs after the March "fix"), and sitemap lastmod froze. Dormancy itself is the top risk driver.
- **Signal**: `git log -1 --format=%ci` first, before anything else. Uniform `<lastmod>` in sitemap.xml = date of last deploy.
- **Action**: Any audit after a >2-month gap should start with `npm audit` + `npx npm-check-updates`.
- **First seen**: 2026-07-17
- **Confidence**: High

## SEO / Indexing
- **Learning**: Sitemap gap FIXED — 397 URLs live, auto-generated in build (`generate-sitemap.js` after vite build). Remaining issues: uniform build-date `<lastmod>` on all 397 URLs (weak freshness signal, generate-sitemap.js:64), and index coverage still UNVERIFIED because GSC API access is broken.
- **Signal**: `curl -s https://childrendoenglish.com/sitemap.xml | grep -c '<loc>'` → 397.
- **Action**: Fix GSC access first (below), then pull index coverage — the March fix's payoff has never been measured.
- **First seen**: 2026-03-13 · **Updated**: 2026-07-17 (fixed; verification blocked)
- **Confidence**: High

## GSC API Access — BROKEN
- **Learning**: The shared creds (`~/.config/searchconsole/credentials.json`) are `siteUnverifiedUser` for https://childrendoenglish.com/ — all searchanalytics/sitemaps calls 403. `credentials-rw.json` refresh token is revoked (`invalid_grant`). GA4 Data API works fine (property 526390448).
- **Action**: Re-verify site ownership for the OAuth user in GSC UI, or run `python3 ~/.config/searchconsole/reauth.py` interactively. Until then, no query/index data for this site.
- **First seen**: 2026-07-17
- **Confidence**: High

## Analytics
- **Learning**: quizQuit fix from March is HALF-DONE: `useQuizState.js:106` fires quiz_quit, but `handleQuit` → `onComplete({quit:true})` and `handleQuizComplete` (useQuizFlow.js:79-141) ignores the flag — quits ALSO fire quiz_complete, increment totalQuizzes, and award badges. GA completion counts are inflated (~4 of 23 "completions" in 28d were quits). Also: quizQuit fires with level=undefined.
- **Learning**: The 372 static /vocabulary/ pages carry NO GA tag — the site's largest surface is analytically invisible. Their traffic is only inferred via `utm_source=seo` CTAs into the app (top source: 21 of 46 sessions in 90d).
- **Learning**: Missing events: landing CTA click, consent accept, email submit/skip, share click, iOS installs. `analytics.onboardingStep` helper orphaned. Initial screen_view not fired on cold load.
- **Signal**: Compare quiz_complete vs quiz_quit in GA4; grep gtag in a live /vocabulary/ page (0 hits).
- **Action**: Guard handleQuizComplete with `results.quit`; add consent-gated GA to static page template in generate-seo-pages.js.
- **First seen**: 2026-03-14 · **Updated**: 2026-07-17
- **Confidence**: High

## Trust Signals — REPEAT OFFENDER
- **Learning**: "Zero ads, zero data collection" (index.html:279-280) and about-page "never sent to any server" STILL live despite two audits flagging it. Sentry initializes unconditionally in PROD (main.jsx:8-18) — not consent-gated, contradicting the copy. React trust card was softened but the static shell was missed.
- **Action**: Fix index.html + /about/ copy AND decide Sentry consent-gating in the same commit. Third consecutive flag — treat as must-fix.
- **First seen**: 2026-03-13 · **Updated**: 2026-07-17 (still unfixed)
- **Confidence**: High

## Onboarding
- **Learning**: Time-to-value FIXED: 8-9 taps → 3 taps + name typing (landing language card → PlayerCreate → quick-start quiz). NEW: the Onboarding component + try-it demo is now DEAD CODE — `handleCreatePlayer` sets `hasSeenOnboarding:true` (usePlayerManagement.js:21); only legacy profiles can reach it.
- **Action**: Repurpose the demo as landing-page instant-play (best) or delete it. Name entry is still mandatory before any play — consider guest path.
- **First seen**: 2026-03-14 · **Updated**: 2026-07-17
- **Confidence**: High

## Engineering & Code Quality
- **Learning**: src/ lint clean (0 errors, was 12); i18n dupes fixed. App.jsx still 707 lines but useEffects down to 15 with logic in 5 custom hooks — decomposition half-done. BLIND SPOT: `eslint .` = 167 errors outside src/ (eslint.config.js scopes globals to src/**; CI lints src only); real bug found there (dupe key 'butterfly', scripts/fetch-images.js:128). 229/229 unit tests pass.
- **Signal**: Run BOTH `npm run lint` and `npx eslint .`.
- **Action**: Add node-globals block for scripts/api/e2e; switch CI to `eslint .`.
- **First seen**: 2026-03-14 · **Updated**: 2026-07-17
- **Confidence**: High

## Failure Resilience
- **Learning**: storage.js is fully guarded, but src/utils/analytics.js:7,11,16 hits localStorage UNGUARDED at module scope (main.jsx:21, before React mounts) — full cookie-block browsers white-screen before ErrorBoundary exists.
- **Action**: Wrap analytics.js storage access in storage.js's guard pattern.
- **First seen**: 2026-07-17
- **Confidence**: High

## Performance
- **Learning**: Desktop 99. Mobile 77 with **CLS 0.325 (poor)** — static HTML shell is replaced by hydrated React landing of different height (body shift 0.311), plus consent banner reflow. LCP fine (2.4s mobile). PSI keyless API quota-blocked all day; local Lighthouse against live site works.
- **Signal**: Lighthouse mobile CLS; compare static shell height vs hydrated landing.
- **Action**: Match shell dimensions to hydrated landing; mount consent banner without reflow.
- **First seen**: 2026-03-13 · **Updated**: 2026-07-17 (CLS regression is the new perf issue)
- **Confidence**: High

## Privacy & COPPA
- **Learning**: Policy text fixed (Sentry disclosed, email contradiction resolved). Remaining: Sentry not consent-gated (tension with copy, see Trust), and **ParentEmailCapture promises "progress reports and learning tips" but the email never leaves localStorage — the promise is undeliverable**.
- **Action**: Either wire email to an ESP and send the report, or remove the capture + promise.
- **First seen**: 2026-03-14 · **Updated**: 2026-07-17
- **Confidence**: High

## Retention / Business Model
- **Learning**: Still ~3.5/10. No monetization path at all. "Notifications" are local `new Notification()` fired only while the app is open (notifications.js:38-59) — no Push API, useless for re-engagement. Email capture dead-end. Share button + shareable word-list URLs exist but are untracked. GA shows retention is the real problem: 16 new vs 3 returning users in 28d.
- **Learning**: Content ceiling: 342 words ≈ 2-3 months for an engaged child; competitors (Khan Kids, Duolingo ABC, Lingokids) are unbounded. Defensible wedge = only free Hebrew↔English vocab tool for ages 6-12.
- **Action**: Parent email loop (ESP) is the one COPPA-safe owned channel; word-pack expansion addresses the ceiling.
- **First seen**: 2026-03-13 · **Updated**: 2026-07-17
- **Confidence**: High

## GEO (AI Engine Optimization)
- **Learning**: llms.txt count fixed (342). llms-full.txt still 404. AI referrals are REAL: chatgpt.com is ~20% of sessions (9/46 in 90d), "AI Assistant" the top GA channel in the last 28d — GEO is this site's working acquisition channel ahead of Google organic (4 sessions/90d).
- **Action**: Ship llms-full.txt; add comparison tables to guides (AI engines lift tables). Watch this channel in GA.
- **First seen**: 2026-03-13 · **Updated**: 2026-07-17
- **Confidence**: High

## Low-Signal Dimensions (fast-track next time)
- **Security**: 8-9/10 across three audits (headers, CSP, no injection). Minor: api/ timing-unsafe compare, imageBase64 unvalidated.
- **Accessibility**: 8-9/10 consistently. Residual: hardcoded "Skip to content"/aria-labels break Hebrew SR users.
- **Mobile/PWA**: 7.5-9/10, solid; maskable icons reuse `any` PNGs.
- **SEO on-page**: meta/canonical/hreflang/JSON-LD all verified clean twice — spot-check only.

## High-Signal Dimensions (extra scrutiny next time)
- **Trust copy** — verify index.html:279-280 finally fixed (3rd flag)
- **Analytics** — verify quit-guard in handleQuizComplete; GA on static pages
- **Business/Retention** — email loop wired? returning-user share moving?
- **Dependencies** — was `npm audit fix` run? majors still pending?
- **GSC access** — re-verified? index coverage finally measured?
