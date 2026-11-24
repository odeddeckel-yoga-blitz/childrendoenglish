# LEARN.MD — Audit Knowledge Base

Runs: 2026-03-13/14, 2026-07-17, 2026-11-18 (full report: briefs/audit-2026-11-18/).

## Meta / Process
- **Learning**: Four parallel read-only reviews (engineering · SEO/trust · learning value · usage data) covered all 25 dimensions in about 12 minutes. Owner questions about "offering more" are answered by the curriculum-overlap + usage reviews, not by the technical ones.
- **Signal**: The owner phrases the audit around a goal ("advance children's learning") → weight dimensions 1/3/17/19 and the idea list.
- **Action**: Keep the 4-way split; brief each agent with the owner's standing rules + "grep memory/briefs for prior decisions" (stops re-proposing dropped ideas).
- **First seen**: 2026-11-18 · **Confidence**: Medium
- **Learning**: Dormancy drove the 07-17 risk; from 10/2026 the repo is very active, so dormancy is no longer the lead risk. The lead risk is now depth/retention.
- **First seen**: 2026-07-17 · **Updated**: 2026-11-18 · **Confidence**: High

## Learning value / Curriculum — HIGH SIGNAL (new 11-18)
- **Learning**: CDE is a picture-noun tool: 563 app words, 91% nouns, 6 verbs, ~1% of the Starters function words; speaking zero; 8 reading texts. Coverage: Cambridge Starters 38% (app) / 67% (with pages); Israeli Band I 15% / 37%.
- **Signal**: Parse the parts of speech in src/data/words.js; overlap with the Cambridge YLE lists (parsed copies are in the 11-18 scratchpad; re-parse from the cambridgeenglish.org PDFs) and the MoE 2020 elementary curriculum.
- **Action**: Re-run the overlap each audit; track verbs, function words and readings counts as the headline depth metrics.
- **First seen**: 2026-11-18 · **Confidence**: High (automated parse ±3 pts)

## Retention / Business Model
- **Learning**: 84% of browser-days are new; returns he 27–34%, en 8–14%, es 7–10%. The learning ladder finishes 4% of batches (1/57 cycles). 78% of answers are hear-and-tap. Games build no shared word memory.
- **Signal**: cde_learn batch start vs done; `vis` repeat days (no learner id exists, so browser-days are the only proxy).
- **Action**: Check that the ladder shortening (owner-asked 11-12) and a shared word memory have shipped; re-measure the return rate per language.
- **First seen**: 2026-03-13 · **Updated**: 2026-11-18 (email capture removed; problem reframed as depth + ladder length) · **Confidence**: High

## Observability — HIGH SIGNAL (new 11-18)
- **Learning**: The browser Sentry DSN host is `o….ingest.de.sentry.io`; the CSP allows `*.ingest.sentry.io`, which matches one label only, so every browser report is blocked. There is no CSP report-uri, so nobody noticed. /api/health doesn't check the DB.
- **Signal**: grep the ingest host in the live entry bundle vs the `connect-src` in the live headers (`vercel curl -sI /`).
- **Action**: Whenever a third-party SDK is added or changed, diff its host against the CSP. Add CSP reporting.
- **First seen**: 2026-11-18 · **Confidence**: High (verified on live)

## Trust Signals — REPEAT OFFENDER
- **Learning**: index.html and /about/ were fixed; the "no data collection" claim survived in **llms.txt** (line 8): a hand-written file outside the copy sweep. /about/ names the maker only at the bottom (ai-feel 2/5).
- **Signal**: `grep -i collect` over public/llms*.txt and every static shell, not only the React copy.
- **Action**: Generate llms.txt at build time from the same facts as the privacy page.
- **First seen**: 2026-03-13 · **Updated**: 2026-11-18 (4th run, moved to llms.txt) · **Confidence**: High

## Privacy & COPPA
- **Learning**: Data is minimal and the email capture is removed. But the policy exists only as an SPA route: /privacy returns the home-page HTML, so it is invisible to crawlers and no-JS readers; there is no GDPR rights section, and /he and /es don't link to it. The Sentry IP toggle is still owner-owed.
- **Signal**: `vercel curl -s /privacy | grep '<title>'` equals the home title.
- **Action**: Static /privacy/ pages per language. Legal copy needs an explicit owner OK.
- **First seen**: 2026-03-14 · **Updated**: 2026-11-18 · **Confidence**: High

## Failure Resilience
- **Learning**: analytics.js was fixed (it is now stubs), but a new unguarded localStorage at useInstallPrompt.js:36, with no root ErrorBoundary, still white-screens storage-blocked browsers. The SW audio cache cap (800) is below the ~2,300 sound files.
- **Signal**: grep `localStorage` outside utils/storage.js; compare the cache caps in vite.config.js against the asset counts.
- **Action**: Lint rule or test: ban direct localStorage outside storage.js.
- **First seen**: 2026-07-17 · **Updated**: 2026-11-18 (moved file, same class) · **Confidence**: High

## Engineering & Code Quality
- **Learning**: Tests 229 → 628, all passing; src lint is clean. But App.jsx has grown to 1,159 lines / 23 effects, `eslint .` shows ~1,880 errors outside src (CI still lints src only), and CI runs ~23 of its 25 minutes on Node 20 (end of life). Arcade games each hold a copy of the word list (up to 24 files per change); there are 3 string systems.
- **Signal**: `npx eslint . | tail -1`; the CI run duration; `wc -l src/App.jsx`.
- **Action**: Node 24 + Playwright shards + `eslint .` in CI; one shared word source for the games.
- **First seen**: 2026-03-14 · **Updated**: 2026-11-18 · **Confidence**: High

## Performance
- **Learning**: The CLS fix held (0.01); mobile 99, desktop 100. The one remaining lever: words.js (181 KB) is in the entry chunk and grows with every word added.
- **Action**: Spot-check only next time, plus the entry-chunk size.
- **First seen**: 2026-03-13 · **Updated**: 2026-11-18 · **Confidence**: High

## Analytics
- **Learning**: GA4 was removed 10-30; the cookieless Neon beacon (~70 event kinds, bot filter, AI attribution) replaces it, and the 07-17 GA issues are moot. Gaps: no learner continuity (no D7/D30 retention), no learning-gain measure, daily aggregates that can't be joined, no session length.
- **Signal**: `SELECT DISTINCT ev FROM cde_learn`.
- **Action**: Propose privacy-reviewed bucketed counters; don't re-add GA.
- **First seen**: 2026-03-14 · **Updated**: 2026-11-18 · **Confidence**: High

## SEO / Indexing
- **Learning**: The sitemap holds 768 URLs; 10/10 sampled URLs are indexed (the Hebrew flashcards are now indexed too); clicks went 14 → 189/week. Word pages convert at 0.3% (title/meta tweaks proved flat 10-24, so don't re-tune them). The real unserved demand: Hebrew grade games (positions 5–10), the Hebrew head terms (positions 36–41), Spanish hubs (/es/ is the only one), English per-age lists. Every sitemap entry still has the same lastmod.
- **Signal**: The GSC 90-day query export grouped by language and intent.
- **Action**: Start from the B report's unserved-demand list; check the grade-page retitle result.
- **First seen**: 2026-03-13 · **Updated**: 2026-11-18 · **Confidence**: High

## GEO
- **Learning**: ChatGPT is still ~20% of outside arrivals (98% of AI traffic); Google organic overtook it in 11/2026. llms-full.txt shipped (no es glosses).
- **First seen**: 2026-03-13 · **Updated**: 2026-11-18 · **Confidence**: High

## i18n
- **Learning**: RTL is correct and the string files match, but static /he/ pages carry an English footer, English nav aria labels (generate-seo-pages.js:62/103) and `lang=en` on the Hebrew vocab pages; 5 hardcoded React aria-labels remain.
- **Signal**: grep `aria-label="` in src/components and the page generator.
- **First seen**: 2026-07-17 · **Updated**: 2026-11-18 · **Confidence**: High

## Low-Signal Dimensions (fast-track next time)
- **Performance**, **Accessibility (8)**, **Mobile (8)**, **SEO on-page**, **Production dependency vulnerabilities (0)**: healthy across 3–4 runs; spot-check only.
- **Security (7.5)**: timing-safe compares and imageBase64 validation fixed 11-18. 11-22 (A090): the GitHub-write admin image tool (api/commit-image.js, api/fetch-image.js, the #admin route) was removed from the site; image work is the local `word-image-improver.mjs pick`. GITHUB_TOKEN/ADMIN_HASH still need deleting from the Vercel env. 11-22 (A091): per-IP Class Battle room-create limit; /api/health is static unless `?deep=1`. Still open: Vercel Firewall rate limits on POST /api/land and /api/live.

## High-Signal Dimensions (extra scrutiny next time)
- **Learning depth** (verbs, function words, readings, speaking): did any of the 11-18 ideas ship?
- **Ladder completion + return rate** per language.
- **Observability**: is Sentry receiving browser events?
- **Trust/privacy**: llms.txt, a static privacy page, a maker card at the top of /about/.
- **CI health**: duration vs timeout, Node version.
