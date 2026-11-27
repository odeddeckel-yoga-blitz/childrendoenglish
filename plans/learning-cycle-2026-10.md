# Learning Cycle — guided learn→practice→advance loop (2026-10-05)

**STATUS: APPROVED ("Plan and then implement") — building in the same session.**

Owner's product thesis: the home page loses users — ~10 equal doors ask a child to
self-direct. Replace "choose" with "continue": learn a ~10-word batch, practice it
through games/exercises until it sticks, advance to the next batch. Start with easy
letters/words; show progress and what was mastered. Supported by our own data: the
one heavy learner self-organized exactly this way (letter A → B through listen mode),
menu breadth goes unused, audio mode is dead, games had no role.

## Design decisions (agreed with owner 2026-10-05)

1. **Batches of 10**, sequenced easy-first: beginner → intermediate → advanced,
   alphabetical within level (letters with the learner's known-letters first when
   that feature is active). ~48 batches over the 480-word catalog.
2. **Ladder, not menu**: each batch runs listen & match → image quiz → word quiz
   as STAGES of the batch (the existing modes, orchestrated). Pre-readers
   (canRead=false) get listen → image only.
3. **Soft gate**: completing the ladder once advances the batch. TRUE mastery
   accrues across days via the existing SRS/Daily Review resurfacing — batch N+1
   is never blocked on batch N mastery (spacing beats cramming; no grind-walls).
4. **Arcade = reward, not practice**: batch completion unlocks a celebratory
   interstitial with a rotating game link. Scoping games to batch words = later.
5. **One spine**: the cycle absorbs Letter Path's role as default progression;
   Letter Path stays as a practice tool, Learning Path untouched (review later).
6. **Measured from day one**: cyc_start / cyc_stage / cyc_done beacon events
   (batch-indexed) in the LEARN_EVS whitelist — stage-level funnel visible to the
   learning optimizer immediately.
7. **Multilang day one**: all cycle strings ship en + he + es.

## Build plan

- [opus] `src/utils/learningCycle.js` — deterministic sequence, batch slicing,
  stage ladder, per-player cycle state helpers (stats.cycle = {batch, stage}).
- [opus] App.jsx wiring — 'cycle' flow: start stage quiz with the batch's words
  (existing custom-words quiz path), on quiz completion advance stage/batch,
  BatchComplete interstitial (reward + next), cycle beacons.
- [opus] Menu — CycleCard hero at top: "Continue — Batch N (letter X) · stage i/3",
  words-mastered count, progress bar; new-user CTA starts the cycle (replaces
  "Play Your First Quiz!" as primary).
- [sonnet-sized, done inline] i18n keys en/he/es (~12 keys).
- [opus] api/land.js whitelist + optimizer.mjs cycle funnel section (stage
  drop-off per batch).
- Tests: unit (sequencing determinism, batch math, stage advance incl. canRead),
  e2e (new user sees Continue card; starting it opens a listen quiz; batch-
  complete screen reachable with a stubbed batch).

## Explicitly NOT in v1
- Game word-list scoping (games stay catalog-wide rewards)
- Learning Path removal/merge (owner call later)
- Audio-mode removal (parked separately)
- Letter map visual rework (CycleCard bar + existing Letter Path suffice)

## v3 — 5-step ladder + one word memory (owner OK 11-18, branch hold/ladder-memory-1118, ships after the 11-28 reads)

Data: 1 of 57 batch starts finished the 11-step v2 ladder; the step funnel fell off at the first spelling step
(11-14 read: conv 13 → lf1 4); listen-and-tap is 78% of answers at 84% done; Word Zapper and Category Conveyor are the
most played / best-completing games.

- Ladder = fc → aud → wq → conv → zap (pre-readers: fc → aud/listen → conv → zap). Every step is one short sitting.
  Spelling and sentences (lf1, forge, sent) are an optional BONUS row on the step map: tallied as cyc_stage, never part
  of the batch position. iq, lf2 and lf3 left the map.
- Migration: stats.cycle gains v = 2. A record without v indexes the 11-step LADDER_V1; migrateCycle() counts every v1
  step before the stored stage as done and moves to the first new step not done. The new ladder is a subsequence of v1
  and both end on zap, so no finished step is lost; batch, wordProgress, spelling and badges are untouched.
- One word memory: games (Word Zapper, Category Conveyor, Spelling Forge, Picture Bingo, Missing Letter), unit / Band I
  practice, reading look-ups and word-page mini-quizzes append first-try results to the localStorage inbox
  (public/word-mem.js); the app folds it into the active player's wordProgress with updateWordSR (one step up per word
  per day). Guests' answers wait for a player (after the first quiz, or at once via the review link).
- "Words to review today (N)" (due + missed in the last 3 days, max 10) on the game end card, unit and reading finish,
  free-quiz results and batch complete → Daily Review (pre-readers: the same words as a listening run). Beacon: rvw.

### Ships as a 50/50 split BY DEVICE (11-27, retro rule 3; branch feat/ladder-next-arm-1127)

- Arm = kit visitor arm, `kitArm('ladder')` (public/arm-bit.js, synced from kit infra/arm-bit.js; stored number in
  localStorage `kit_arm_ladder`, untouched by every reset). src/utils/ladderArm.js is the one helper the switch points read.
- Arm 1 = v3 above + the home Next card / 6-item More + mixed order. Arm 0 = main (11 steps, no inbox fold or review
  card, today's home, alphabetical). null (webdriver, ?internal=1, blocked storage) = control, never counted.
  The arcade-step save fix runs in both arms. Static / crawler copy keeps main's 11-step wording during the test.
- Beacon: cyc_start / cyc_stage / cyc_done / hn items end in ~0 / ~1; cyd @ start1|done1|start2 ~a = the device funnel.
  Read: tools/reads/ladder-arm-counts.mjs (rows for kit reads.mjs, split visitor-arm).
