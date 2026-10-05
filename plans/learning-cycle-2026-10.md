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
