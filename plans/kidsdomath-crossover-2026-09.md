# What kidsdomath can give childrendoenglish (2026-09-18 review)

kidsdomath spent July becoming a game FACTORY. The transferable assets, in rough order of value:

## The factory inventory
1. **Game-generation system**: templates/game-template (single-file HTML5/canvas, Game/Line/FX
   engine, 8-level ramp, menu/play/result/win) + plans/game-generation-prompt.md (the spec agents
   build from, with all hard-won rules baked in) + test harness (playthrough.mjs: dbg contract,
   solveForTest, 560-round reachability sweep, desktop+mobile) + real-input Playwright verification
   culture. One agent run ≈ one verified game.
2. **Injectable mechanics layers** (normalize-games.mjs pipeline): kdm-arcade (score/combo/streak
   HUD, per-game best, Lightning Round, collectible critters, first-run finger demo, Continue),
   kdm-progress (cross-game progress, Next-up path toast, day streaks, landing beacon),
   no-repeat-v2 (qkey), endscreen, CTA emphasis, reduced-motion, a11y.
3. **Design doctrine** (the gamability review): "the math is the mechanic" → here, "the WORD is the
   mechanic"; answer-box quiz = low ceiling; direct manipulation + proof animations; honest mastery
   (clean rounds); two-stage hints (method before answer); anti-grind regeneration.
4. **SEO machinery**: per-game indexable pages w/ injected meta/About (inject-game-seo pattern),
   footer crawl mesh (already ported 09-18), Indexing API workflow, comparison-page GEO magnet.
5. **Class Battle**: liveStore pattern (Neon/memory), code-join, COPPA-safe nicknames — a
   vocabulary battle is a re-skin, not a rebuild.

## The honest read on CDE today
Quiz modes (Image/Audio/ListenMatch) are tap-choice = fast input = RETROFIT tier: solid pedagogy
(SR is a genuine moat), zero stakes/juice/replay pull. Score exists; no combo, no timer modes, no
best-score chase, no "one more round". Retention relies on the daily-review habit alone.

## Suggestions (prioritized)

### S1 — Generate standalone vocab arcade games with the kidsdomath factory ⭐ biggest win
New /games/*.html static pages on childrendoenglish.com (SPA untouched), each generated+verified by
an agent from the shared template, using CDE's own word data (342 words, photos, Hebrew, TTS).
Double payoff: FUN (real games, not quizzes) + SEO (each game = an indexable landing page opening
the "english vocabulary games / esl games for kids" query families CDE has zero presence in).
Concepts mapped to proven kidsdomath patterns:
- **Word Zapper** (even-steven "Sorting Rush" pattern): images drift down, TTS says a word, tap the
  matching image before it lands; shields, adaptive speed, combo scoring.
- **Spelling Forge** (column-crunch tile-pad pattern): hear the word, build it letter-tile by
  letter-tile; letter chips fly in as physics.
- **Category Conveyor** (sort-sorter pattern): items stream past, flick each into its category bin.
- **Word Detective** (price-detective/number-detective pattern): clue-driven elimination on a word
  board ("it's an animal… it can fly…").
- **Memory Rush** (galaxy pattern): THE differentiator — spawn-weight the words by the player's OWN
  spaced-repetition weakness data (galaxy's pickFactorPair). Spaced repetition inside an arcade =
  something no competitor has; CDE already owns the data.

### S2 — Retrofit the arcade layer into the existing quizzes
Port kdm-arcade semantics into the React quiz flow: combo multiplier + fast-answer bonus, per-mode
best scores, opt-in 60s Lightning Round after a completed quiz (age-gated like g12), and extend the
badge system into a critters-style collectible hatchery (cross-mode earn rules). CDE already has
badges + daily streak — this is an upgrade, not a new system.

### S3 — Port the guard-rails
- No-repeat/qkey: verify quiz distractor sets can't repeat identically back-to-back.
- Honest mastery: track hint-free/clean answers distinct from completed (CDE SR already has
  correct/wrong — surface "mastered cleanly" in the parent dashboard).
- Stale-chunk auto-reload: DONE 09-18.
- Landing beacon (/api/land): CDE's GA is consent-gated too — the same blind spot kidsdomath had;
  port the cookieless source-class beacon to see the ChatGPT channel properly.

### S4 — Class Battle: Vocabulary edition
Re-skin kidsdomath's /live for word-image questions (teacher picks category, kids join by code).
The ESL classroom market is BIGGER than the math one for this feature. liveStore + API shapes are
copy-adaptable; needs its own Neon (or share the existing free-tier project with a table prefix).

### S5 — Extract a shared game-kit
Move templates/game-template + generation prompt + harness + shared JS layers into
~/projects/shared/game-kit (or a git submodule) so kidsdomath, childrendoenglish, and future
projects (yoga-bits? anatomycourse?) consume one factory. Prevents the two-copies drift problem
kidsdomath itself suffered (template-drift lesson in LEARN.MD).

### Do NOT
- Don't rewrite the React quizzes as static games — the SPA (SR, players, PWA) is CDE's moat.
- Don't fork the template per-project without the kit extraction (drift).
- Don't build S4 before S1 ships games worth battling over.

### Suggested sequence
S1 first (2-3 games as a pilot wave — Word Zapper, Spelling Forge, Category Conveyor — with per-game
SEO pages + sitemap + footer-mesh links), then S3 beacon + S2 lightning/combo, then more S1 waves,
S4 when teacher outreach starts, S5 whenever the second wave makes drift real.
