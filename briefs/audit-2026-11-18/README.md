# CDE full audit, 2026-11-18

This is the full audit (`~/projects/shared/complete-product-audit.md`), centred on the owner's question: **what else can we offer to advance children's English learning?** It was read-only: nothing was pushed or changed live, and no paid model calls were made.

Detail per area:
- [A-engineering.md](A-engineering.md): engineering, performance, a11y, security, resilience and observability
- [B-seo-trust.md](B-seo-trust.md): SEO, GEO, privacy, copy, trust and i18n, plus unserved search demand
- [C-learning.md](C-learning.md): inventory, curriculum gaps (Cambridge YLE and the Israeli MoE), competitors and the "offer more" ideas
- [D-usage.md](D-usage.md): usage data (Neon beacons, 61 days)

Two findings were re-checked by hand on the live site:
- The Sentry host in the live bundle is `o….ingest.de.sentry.io`, but the CSP allows only `*.ingest.sentry.io`. So browser error reports are blocked.
- `llms.txt` line 8 still says "no data collection", and `/privacy` serves the home-page HTML (the policy exists only as a client-side app route).

## Scores

| # | Dimension | Score | One line |
|---|---|---|---|
| 1 | UX | 6 | About 7 overlapping progress paths, and only 1 in 57 learning cycles finishes a batch. Games and the app share no progress. |
| 2 | Design | 7 | Consistent icons and credited photos, but the photo/Fluent styles are mixed and 4 images are flagged. |
| 3 | Onboarding | 7 | No sign-up and one tap to a game. The app asks for a player before showing any value, and never asks the grade. |
| 4 | Engineering | 7 | 628 tests pass. App.jsx has grown to 1,159 lines, about 1,880 lint errors sit outside src/, and CI takes 23 of its 25 minutes. |
| 5 | Performance | 9 | Mobile 99, desktop 100, CLS fixed (was 0.325). words.js sits in the entry chunk. |
| 6 | SEO | 7 | Clicks went from 14 to 189 a week. Word pages convert at 0.3%, and the Hebrew head terms are on page 4. |
| 7 | GEO | 6 | ChatGPT is still about 20% of outside arrivals, but llms.txt is stale. |
| 8 | Accessibility | 8 | 5 English aria-labels are hardcoded, and the nav labels on static /he/ pages are in English. |
| 9 | Mobile / PWA | 8 | The audio cache cap (800) is below the number of sound files, and the maskable icons are reused. |
| 10 | Security | 7.5 | API password checks are not timing-safe. /api/land and /api/live have no rate limit, and imageBase64 is not validated. |
| 11 | Vulnerabilities | 8 | 0 in production dependencies, 14 in dev dependencies (10 high). |
| 12 | Privacy | 7 | Collects very little and the email capture is gone. The policy needs JavaScript to show, has no GDPR rights section, and /he and /es don't link to it. |
| 13 | API | 7 | /api/health doesn't check the database. |
| 14 | Copy | 6 | A Hebrew grammar error, out-of-date stats in the Hebrew copy, and the static shell lists words that don't exist. |
| 15 | Trust | 6 | The maker is named only at the bottom of /about/, and the "no data collection" line is still in llms.txt. |
| 16 | Analytics | 7 | Rich, cookieless events. No learner continuity, so D7/D30 retention and learning gain can't be measured. |
| 17 | Business alignment | 6 | 84% of browser-days are new. Return rates: he 27–34%, en 8–14%, es 7–10%. |
| 18 | Resilience | 6 | Blocked browser storage gives a white screen (useInstallPrompt.js:36, with no root error boundary). |
| 19 | Competitive | 5 | The free, no-ads, no-sign-up, he/es, textbook-mapped offer is unique. Behind on verbs, sentences, speaking, stories and grade paths. |
| 20 | Dependencies | 6.5 | CI still runs on Node 20, 6 major upgrades are pending, and Dependabot PRs have been open since March. |
| 22 | i18n | 6 | The Hebrew footer is in English, the Hebrew vocabulary pages are tagged `en`, and Spanish has only one real hub URL. |
| 24 | Observability | 4 | Sentry is blocked by the CSP and there is no CSP violation reporting, so nobody noticed. |

Not scored: 21 (no developer API), 23 and 25 (the site has no AI features; the build-time judge runs already have a meter and a cap).

## The answer to the owner's question: what to offer more

**Diagnosis**
- CDE teaches **picture nouns** well: 563 words, 91% nouns, with full he/es glosses.
- Everything past that is thin:
  - **6 verbs**;
  - about 1% of the Starters function words;
  - **no speaking practice**;
  - **8 reading texts**;
  - no free-typed spelling;
  - Spanish has no curriculum or reading layer.
- It covers 38% of the Cambridge Starters list (67% counting the unit pages) and 15% of the Israeli Band I list (37% with pages).
- The core learner is a Hebrew-speaking child in grades 3–6, the group with the highest return rate. From grade 4, school asks for sentences and 1,000+ words, so a successful child outgrows CDE in about a school year. **This is the most dangerous gap.**
- Usage agrees:
  - 78% of answers are "hear the word, tap the picture";
  - the multi-step ladder finishes 4% of batches;
  - Word Zapper and Category Conveyor carry the games;
  - the hard words fail on **audio** (cab/can, cloud/clown), not on images;
  - 84% of browser-days are first visits.

**Ranked ideas.** Effort is S/M/L. "Prior" notes where an idea touches an earlier owner decision.

| # | Idea | Gap it fills | Effort | Prior |
|---|---|---|---|---|
| 0 | **Cut the ladder from 11 steps to about 5.** Only 1 in 57 batches finishes; most kids stop at the first spelling step. | Completion | S–M | Owner asked for it 11-12 and it is queued. Do it first: ideas 1, 4 and 8 assume it. |
| 1 | **One word memory across the site.** Games, unit pages and readings feed the child's spaced review, and the end card says "words to review today". | Retention, return visits | M | Parked 10-05, never rejected |
| 2 | **Graded readers:** 8 → about 40 short texts in 5 levels, with he/es word help, read-along TTS, questions and a printable. | Reading short texts | M | New |
| 3 | **Verbs, adjective pairs and chunks:** bring batches 6–7 of the 1,000-word plan forward. Function words are taught only inside sentence games. | Vocabulary breadth, grammar base | L | Planned 11-07; this re-prioritises it |
| 4 | **Grade paths in the app** for Israeli grades 3–6 ("Which grade or book?"). | Curriculum alignment | M | /he/grade-N pages are static only today |
| 5 | **"Say it" practice with no microphone:** hear it, say it aloud, replay, tap "I said it", plus 10 mini dialogues. | Speaking (zero today) | S–M | Owner said no to mic recording (10-31) and pronunciation grading was rejected (10-24). This avoids both. |
| 6 | **Printable "week packs"** per unit and grade, plus Spanish *primaria* packs. | Writing offline; teacher and parent use | S | Printables have the best intent on the site (about 24% of views click print) |
| 7 | **Grammar pilot wave 2** from the MoE grade-4 table (*be*, *there is*, *can*, imperatives, *-ing*). | Grammar in context | M | Builds on the 11-17 pilot. The 20-game wing stays dropped. |
| 8 | **"Type it" spelling:** free recall on an on-screen keyboard. | Productive writing | S | "Word Race" was on the 11-07 list, never built |
| 9 | **Audio fixes for the hard words:** homophone-aware distractors, a slow-replay button, and a Hebrew hint on retry. | Listening accuracy | S | Comes from the usage data (he 21% wrong vs en 13%) |
| 10 | **Progress certificate / word passport.** The name stays on the device. | Motivation | S | "Earned word cards" idea from 10-24 |
| 11 | **Class word-set links + a weekly class challenge.** | Classroom use | S–M | Approved 11-12, queued |
| 12 | **Spanish parity:** es word help on readings, a *primaria* hub, Spanish titles first. | Spanish depth | S–M | The cognates game was killed 11-12; avoid it |
| 13 | **Offline family pack** (a topic's pictures and audio), plus raising the audio cache cap. | Access | M | New |
| 14 | **Chant cards:** a read-along with the beat, never called "songs" (TTS). Try one first. | Recite a chant (MoE can-do) | M | New |
| 15 | **Missing Starters nouns and new topics** (about 100). | Breadth | L | Planned 11-07; batch 1 shipped |
| 16 | **Parent "this week at home" card.** | Parents | S | Planned 10-24 |

**Search demand that matches these ideas** (GSC/Bing 90 days, see B):
- Hebrew grade games "משחקים באנגלית לכיתה ג–ו": about 80 queries, 407 impressions, positions 5–10. Fits ideas 4 and 6.
- Hebrew head terms "אנגלית לילדים (במחשב)": 289 impressions at positions 36–41.
- Spanish "inglés para niños / ejercicios / tarjetas": 0 clicks, and /es/ is the only Spanish hub. Fits idea 12.
- English "vocabulary words for N year olds": 219 impressions, with no per-age pages.
- English feelings words "X meaning for kids": 804 impressions, 2 clicks.

## Priority actions (impact × effort)

| P | Action | Dim | Impact | Effort | Why | Gate |
|---|---|---|---|---|---|---|
| 1 | Add `https://*.ingest.de.sentry.io` to CSP connect-src (vercel.json) and add CSP reporting | 24 | H | S | Browser crash reports are lost today | Standing fix OK |
| 2 | Guard localStorage in useInstallPrompt.js:36 and add a root ErrorBoundary | 18 | H | S | White screen when cookies or storage are blocked | Standing fix OK |
| 3 | Rebuild llms.txt at build time: correct data claims, 560+ words, the maker, the new hubs | 7/15 | H | S | ChatGPT is about 20% of arrivals, and the file contradicts the privacy policy | Copy OK |
| 4 | Static /privacy/, /he/privacy/ and /es/privacy/ pages with a GDPR rights section, linked from every footer | 12 | H | M | A kids' site with no crawlable policy | **Owner OK (legal copy)** |
| 5 | Ladder 11 → about 5 steps | 1/17 | H | M | 1/57 batches finish | Owner-asked; after 11-28 |
| 6 | One word memory across games, units and readings | 17 | H | M | Return visits are the weak link | Owner go |
| 7 | Retitle /he/grade-N/ to "משחקים באנגלית לכיתה X" and put the grade's games first | 6 | M–H | S | 407 impressions at positions 5–10 | Per-push OK (title test lane) |
| 8 | Hard-word audio: homophone distractors, slow replay | 1 | M | S | The top-10 hardest words fail on audio | Games frozen → after 11-28 |
| 9 | Graded readers wave 1 (about 15 texts) | 19 | H | M | Reading stops at 8 texts | Owner go; ~$2–4 consensus check |
| 10 | Verb and adjective batch forward (from the 1,000-word plan) | 19 | H | L | 6 verbs | Owner go |
| 11 | Rate-limit /api/land and /api/live with the Vercel Firewall | 10 | M | S | Anyone can inflate the optimizer data or open unbounded battle rooms | Owner OK (firewall config) |
| 12 | Timing-safe compares and an imageBase64 check, or remove the GitHub-write API from prod | 10 | M | S | Flagged since 07-17 | Standing fix OK |
| 13 | Hebrew fixes: footer and nav aria labels, the `lang` tag on /he vocab pages, the "ועוקבים" grammar, the stats | 22/14 | M | S | Hebrew is the core audience | Standing fix OK |
| 14 | Maker card at the top of /about/, plus he/es /about/ | 15 | M | S | Judged 2/5 | Owner content call |
| 15 | Printable week packs | 3/17 | M | S | Best intent on the site | Owner go |
| 16 | "Say it" no-mic practice | 19 | M | S–M | Speaking is zero | Owner go (touches 10-31/10-24 decisions) |
| 17 | CI: Node 24, Playwright shards, `eslint .` with node globals | 4/20 | M | S | CI is 2 minutes from its timeout | Standing fix OK |
| 18 | Lazy-load words.js and raise the audio cache cap above 2,300 | 5/9 | M | S | Every new word makes the landing page heavier | Standing fix OK |
| 19 | Add a DB check to /api/health | 24 | M | S | Would have caught the 10-22-style Neon outage | Standing fix OK |
| 20 | Bucketed, device-local counters (streak, words mastered) and a second-attempt event | 16 | M | S | Without them, learning gain and retention can't be measured | Privacy review first |

## Adversarial view (a sceptical parent or teacher)

1. "My grade-4 kid needs sentences and verbs; this is picture flashcards." (idea 3/7)
2. "There's no privacy page I can open, and the AI summary says 'no data collection' while the site uses Sentry." (P3/P4)
3. "It forgets what my kid learned in the games." (idea 1)
4. "The voice says 'can' when the picture is a cab." (P8)
5. "Who makes this?" (P14)

## Executive summary

- **Technical health is good:** fast (99/100), accessible, well tested (628 tests), a cookieless analytics design, and no production-dependency vulnerabilities.
- **Single biggest risk: depth, not traffic.**
  - CDE is a picture-noun tool.
  - The Hebrew grade 3–6 child who returns most often outgrows it within about a school year.
  - The learning path itself is so long that almost nobody finishes a batch.
- **Single biggest strength:** a free, no-ads, no-sign-up product with Hebrew and Spanish explanations, mapped to Israeli textbooks. No ranking competitor combines these.
- **Order of work:**
  1. The small fixes this week under the standing fix OK: Sentry CSP, the white screen, llms.txt, Hebrew labels.
  2. After the 11-28 freeze: the shorter ladder and one shared word memory, so kids finish and come back.
  3. Depth that matches demand: graded readers, verbs and adjectives, grade paths, then grammar wave 2 and no-mic speaking.
