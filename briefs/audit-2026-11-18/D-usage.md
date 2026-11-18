# CDE usage audit (D-usage), data as of 2026-11-18, read-only Neon queries

Sources: Neon cde_land / cde_learn (data starts 2026-09-19 / 09-24, so "90 days" = all ~61 days), `npm run engagement` (DB-only, no model calls; raw output in scratchpad/opt28.txt). GA4 and Vercel WA skipped (Neon primary). No ledger of per-learner identity exists (cookieless by design).

## 1. Volume and trend
"Visit" proxy = `vis` (once per browser per day, cookieless "browser-day"). cde_land "opens" are page loads and 'internal' (in-site navigation) is ~half of them, so do not read them as visits.

| Week (Mon) | page loads (cde_land) | en | he | es | vis browser-days |
|---|---|---|---|---|---|
| 09-21 | 281 | 281 | 0 | 0 | - |
| 10-05 | 615 | 416 | 96 | 103 | - |
| 10-19 | 853 | 515 | 218 | 120 | 369 |
| 10-26 | 1525 | 1040 | 405 | 80 | 475 |
| 11-02 | 1668 | 1024 | 482 | 162 | 576 |
| 11-09 | 2061 | 1263 | 607 | 191 | 645 |
| 11-16 (3 days) | 548 | 330 | 116 | 102 | 194 |

- 28d: 2146 browser-days (~77/day; last 14 days ~90/day), 1418 en (66%), 474 he (22%), 254 es (12%). Steady ~4x growth since early Oct, now flat-to-slightly-up at ~90 browser-days/day. Tiny absolute audience.
- Landing source, 28d page loads (non-bot): internal 3568, direct 1327, seo 953 (he 420, en 430, es 103), ai 591 (chatgpt 465 of 473 attributed; gemini 6, perplexity 2), external 22. AI engines: chatgpt 336/465 stayed 5 s.
- Landing page class 28d: games 1491, vocab 1378, app 860, home 708, hebrew 648, flashcards 542, spanish 192, unit 189, guide 122, tool 111.
- Bots: since 11-13 bot share is 0% for seo/ai, 17% for direct (human tap rate: seo 67%, ai 79%, direct 31%).

## 2. Returning use (finding: weak, but not zero)
- 2146 browser-days: 350 returning (16%), 1796 new (84%). Returning split: next-day 212, 2-7 d 110, 8-30 d 18, 31 d+ 0 (tracking only 4 weeks old).
- By language: he 27% returning, en 14%, es 10%. Hebrew (classroom/parent audience) is the only retention-positive group.
- Returning days start on: app 55%, word pages 11%, hebrew 7%, unit 5%.
- Caveat: browser-day cohorts cannot tell "same child over weeks" from device sharing; no learner id, no cohort retention curve, no D7/D30 per first-visit cohort. The beacon can only say what share of a day's browsers had been seen before.
- Learning cycle (the multi-step ladder): 187 batch starts, 8 batch completions (4%); step completions fc 64 > aud 74 > wq 32 > iq 24 > conv 47 > later steps <10. Only ~10 cycles ever completed (cyc_done 10 all time). Nobody works through the full ladder.
- First visit funnel (since 10-22): create-player shown 521, created 428 (82%), 1st quiz started 286 (67%), finished 167 (58%), quit 26, vanished 93. Q1..Q5 answered: 199, 181, 166, 154, 149.
- Movement: only 14% of browser-days start a 2nd activity; of those, 61% go on to a 3rd. Top moves: audio quiz to flashcards 46, flashcards to word quiz 23, word quiz to image quiz 22, missing-letter to sound-pairs 22, word-memory to rhyme-time 18, zapper to conveyor 17.

## 3. Games (28d; 960 opens, 4558 level-ups, 213 completes; all of this is the 28d window, g_open starts 10-10)
| Game | opens | starts | level-ups | completes | depth (levelups/open) |
|---|---|---|---|---|---|
| word-zapper | 194 | - | 3342 | 46 | 17.2 |
| spelling-forge | 147 | 73 | 286 | 12 | 1.95 |
| missing-letter | 122 | 101 | 113 | 26 | 0.93 |
| read-it | 118 | 92 | 109 | 5 | 0.92 |
| category-conveyor | 105 | - | 334 | 63 | 3.18 |
| word-memory | 74 | 39 | 94 | 26 | 1.27 |
| sound-pairs | 62 | 49 | 133 | 6 | 2.15 |
| rhyme-time | 44 | 20 | 23 | 6 | 0.52 |
| picture-bingo | 25 | 22 | 47 | 7 | 1.88 |
| letter-twins | 19 | 16 | 37 | 6 | 1.95 |
| odd-one-out | 15 | 12 | 26 | 8 | 1.73 |
| feelings | 11 | 8 | 3 | 0 | 0.27 |
| opposites | 7 | 4 | 3 | 0 | 0.43 |
| true-or-false 4, simon-says 4, sentence-builder 3, letter-drop 3, shopping-list 2, beginning-sounds 1 | <=4 each | | | ~1 | |

Word Zapper is the engagement outlier (17 levels per open, 12 levels in play; 43 taps on the L12 sound button). Category Conveyor has the best completion rate (63/105). Dead/near-dead: opposites, true-or-false, simon-says, sentence-builder, letter-drop, shopping-list, beginning-sounds, feelings (0 completes), all added 11-08 to 11-14, so some are just new and un-linked (home to game open conversion is 1%).
- Site pages to game: games hub 25% (259/1052), app 19%, home 1% (2/361), unit 1% (1/167).
- Games hub click-to-play 64% (369 views); games hub nav links "nav0.link1/link3" 115 imp, 0 clicks (dead).

## 4. Quiz modes in the app (28d; 90d = same order)
| Mode | starts | done | completion |
|---|---|---|---|
| listen (hear-then-pick) | 1180 | 989 | 84% |
| audio | 337 | 227 | 67% |
| word | 132 | 98 | 74% |
| image | 114 | 61 | 54% |
| unit-hear | 79 | 45 | 57% |
| today | 25 | 12 | 48% |
| unit-gap 11, unit-spell 6 (0 done), unit-build 5, unit-dict 3, read-my-dog 2 | <=11 | | |

- Listen mode is ~65% of all quiz starts: kids use the easy listen-and-pick and the "again" restart (276 of 312 done). Hebrew UI = 65% of quiz starts and 80% of answers (he 12,180 answers, en 5,327, es 652).
- Wrong rate: he 21%, es 19%, en 13%.
- Letter Path: 548 taps total, A 148 and B 65 dominate (alphabet order effect: kids rarely get past A-C), Q..V near 3-6.
- Mastery (mm_*): 2514 mm_mast events, 660 menu opens, 221 mm_ret, 144 mm_pick; this is the newer "My Mastery" loop, decent use. Mastery word items are alphabetical heads (apple, ant, alphabet, airplane...), another sign that content past the first letters is barely reached.

## 5. Content: hardest and easiest (word level, 28d, floor 10 attempts)
Hardest (wrong rate): cab 80% (10), cloud 69%, circle 67%, carpet 61% (he 70%), quail 61%, curious 59%, indigo 59%, chimney 54%, cannon 52%, spoon 52% (he 54%, en 0%), apron 44%, calculator 42%, can 42%, mountain 43%, key 38%. These are mostly audio-probe failures (aud 11-59%), not image problems, so listen/pronunciation quality or homophones (cab/can, cloud/clown) are the lever, not new images.
Easiest: most beginner words have <15% wrong (en baseline 13%).
Content not reached: words beyond the first alphabet letters get very little volume (most appear in "insufficient data"); wrong-answer confusions concentrate in a-words (arrow, archery, anchor, alphabet).
Static page content with the most views (28d): word pages 485 (play-click 1%), games hub 369, /he 208, games_word-zapper 174, missing-letter 124, read-it 119, spelling-forge 97, category-conveyor 97, es 88, vocabulary_ages-6-8 82, units_jet-1_unit-1 71, animals 70, printable-flashcards 63.
Lowest-converting static: word pages (1-2% click to play), unit pages (1%), vocabulary category pages (0-7%), tools flashcard-maker (0%), he_grade-4 (2%).

## 6. Word pages vs the app
- Word pages: 485 views in 28d (reach limited: indexed late), only 2% play-click, quiz-tap 1%, 5% stayed 15 s (en). New Option-A word page (live 11-17): 13 views, 31% play-click, quiz-seen 100%, quiz-tap 8% (too early).
- Category pages 36% stay 15 s, 5% play-click; age pages 47% stay, 11% play, 8% quiz-tap; guide pages 86% quiz-seen, 11% quiz-tap.
- he pages: play-click 35%; games hub he 72%; es-pages 52%. Hebrew entry pages convert 10-20x better than English word pages.
- cta total 28d 849 on 3668 pg views (~23%), driven by games hub and /he.
- Phone performance fine: lcp good 98%.

## 7. Printables and worksheets
- Printable pages: en 51 views, es 55, he 16, printable-index 33; print-button tap 19-24%, print dialog 13-31% (best intent per view on the site). Maker (flashcard maker) 19 views, 53% Build, 21% print.
- Sheets printed (sheet ev): cross 11, bingo 11, search 6, tsv copy 3 (all-time). prc/bpr all-time: 39/48. QR scans: none recorded (qr ev absent).
- Unit pages: 138 views, print 4%, dialog 7%.
- Printable volume is small (about 150 views/28 d) but converts to print at ~1 in 4, which is what a teacher/parent wants.

## 8. Errors
- jserr total 71 (since 11-04): 24 app, 14 pg-vocab, 8 pg-hebrew, 7 pg-flashcards, 6 conveyor, 5 games, 4 spanish; jserx (not ours) 3.
- 28d: 71 jserr per ~2146 browser-days = 3.3 per 100 visits (per page loads 0.4%). 19 of them are `component-clicks_92_syntax` (one known bug, the same signature, likely a browser too old), 3 unit-sheets_143_syntax, 1 conveyor type error. Conveyor has the worst rate: 6/73 opens (8%). Recording health: ok, no gaps.

## 9. Dimension 16 - Analytics & Tracking: 7/10

Strengths (🟢): privacy-clean cookieless design (no PII), rich event taxonomy (about 70 event kinds, per-asset diagnosis: aud/img/txt split per word, wrong-pick matrix, rival check), dead-component detector, recording-health monitor, per-page-type depth, A/B read framework (reads.jsonl), bot/human split, AI-engine attribution. Operated loop with decision rules.

🔴 Top gaps:
1. No learner continuity: no persistent pseudonymous learner/device id, so no D1/D7/D30 cohort retention, no per-child progress over weeks, no sessions per learner. Only the once-a-day `vis` bucket (r1/r2-7/r8-30) and 4 weeks of history.
2. No outcome / learning-gain measure: answers are aggregated per word with no per-learner first-correct vs later-correct, so "did the word stick" (pre/post, spaced re-test, mastery curve per word) is not computable; mm_mast exists but lacks a retention/delay dimension.
3. No time-on-task / session length or sessions per visit (only s15 stay on static pages, quiz start/done); cannot say how many minutes a child practises, or how many words per sitting.
4. Counters are aggregated by day, so you cannot join dimensions (language x mode x source x word; arrival source to first quiz to repeat). Arrival-source split exists only for first quizzes (small n), and lang is missing from several item-level tables in the report.

🟡 Smaller: no visit count in cde_land (internal navigation inflates "opens"; 'visit' must be proxied by vis); g_cmp/starts missing for conveyor and zapper (starts not recorded); data window is only 61 days; GA4/Vercel not reconciled; qr ev empty; learning-cycle ladder drop-off is visible but the reason is not; battle tables empty (0 rooms, 12 bt events).
💡 Ideas: add a local-only (device) "last seen/streak/words mastered" counter sent as buckets (still no PII); log time-bucketed session length; log per-word 2nd-attempt result for spaced retention (word x day-gap buckets); store first-source on the vis event so retention can be split by acquisition channel.

## 10. Five decision-relevant insights
1. Audience is ~90 browser-days/day, 84% new; growth came from SEO/ChatGPT/Hebrew class traffic. Retention (16% returning, he 27%) is the weakest link, so build for return (My Mastery streak/"words to review today", teacher assignment links), not more entry pages.
2. The product is a quiz machine: listen quiz is 65% of starts and 84% completion; the multi-step ladder finishes in 4% of batches and about 10 cycles ever. Shorten or reshape the ladder (a 5-word "daily review" ending in a win) instead of adding steps.
3. Game depth is concentrated in Word Zapper (17 levels/open); Category Conveyor completes best. 8 of 19 games get <=11 opens and the home page sends 1% of its views to games, so surface Zapper/Conveyor-style fast-feedback games and cut or fold the dead ones (opposites, true-or-false, simon-says, sentence-builder, letter-drop, shopping-list, beginning-sounds).
4. The hardest words are audio-probe failures (cab, cloud, circle, carpet, quail, indigo, curious, spoon): fix audio/lead-in and homophone distractors, add a "hear it again/slow" aid, rather than commissioning more images; Hebrew UI learners get 21% wrong vs 13% en, so add Hebrew gloss/support as a hint on retry.
5. Content reach is shallow (alphabetical bias: A words dominate Letter Path and mastery events; 559 words but a small head gets all the play). Add an obvious "next topic" path and a topic-based start so kids reach the rest of the 559 words; and word pages convert to play at 1% (new Option A at 31%, n=13: confirm by 11-23 read). Printables convert to print at ~24%, a strong teacher lever: promote worksheets and bingo/crossword sheets on unit and /he pages.
