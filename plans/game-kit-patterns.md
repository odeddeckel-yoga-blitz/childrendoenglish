# Game-Kit Contracts & Patterns

The distilled, battle-tested rules from building/redesigning ~90 kids' browser games across
kidsdomath.com (81 games) and childrendoenglish.com (3 games + battle). Every rule here was paid
for with a real bug or a real design failure. New games and retrofits MUST honor these; agents
building games should be given this file plus GENERATION.md.

## 1. The engine surface (template games)
`window.Game = {start(lvl), resumeLevel, next, roundClear, winGame, screen, level, MAX}`,
`window.Line = {build, step, commit, relocalize, resultPayload, dbg}`, `window.FX`, plus the host
site's progress object (KDMProgress-style). Internal calls go through the SHARED objects by
property (`FX.celebrate()`, `Game.roundClear()`) so runtime layers can wrap them; bare closure
calls (winGame inside next) can NOT be intercepted — design accordingly.

## 2. Honesty contracts (pedagogy)
- **No pre-commit oracle**: correctness may only be revealed on commit. Any live ✅/pulse keyed on
  solved() makes every game winnable by twiddling. (S1 audit: 71 games had this.)
- **Clean-quota gate**: `/* kdm-clean-quota v1 */if(missSince<=2)made++` — a round counts toward
  leveling only when solved with ≤2 wrong commits. Kills dial binary-search and hint-answer-copy.
- **Honest mastery**: persist scaffold-free ("clean") level counts; ⭐ requires mostly-clean
  completion; assisted completion is ✓, not mastery.
- **Two-stage drone hints**: stage 1 (3 misses / 14s idle) teaches the METHOD with the round's live
  numbers; stage 2 (6 misses) reveals the answer. Success paths never show the hint.
- **Anti-grind regeneration**: when a wrong answer REVEALS the answer (binary choice, race-proof
  animation, elimination), regenerate the numbers after the reveal (or after 2 wrongs).
  On a MULTI-PART round (two gaps, several plates) count wrongs PER PART (reset on each correct part)
  and carry finished parts into the regenerated round — a regen that wipes a part the child already
  got right is a punishment, and it sat exactly on the cliff (KDM pattern-picnic L6, the first
  two-gap level: only 54% who reached it cleared it).
- **Placed ≠ correct, and a failed commit names WHICH part**: before commit, a placed piece gets a
  neutral style — never success-green (a green ring on every placed plate read as "all right" next to
  a red "the beat is off"). After a wrong commit, mark the wrong parts (red ring) so the child fixes
  those, not the whole row. Post-commit, so it is feedback, not an oracle. (pattern-picnic build L8–10.)

- **A not-ready commit is not a miss** (KDM 2026-10-22/23, found in ~40 games by kid-play + a behavioural probe):
  LOCK IN / GO / FIRE pressed before the answer exists (nothing picked, dial untouched, cards still waiting, step 1
  not done) must show a gold "what's left" nudge and return — never `missSince++`. With the clean-quota gate, 3 such
  taps silently voided a correct round ("It took 7 tries"). Only an EVALUATED wrong answer is a miss. Arcade games
  whose button IS the move (drop, fire) are exempt.
- **Every level-1 route must be finishable** (ten-frog, integer-crossing): if a careful child's early choice can leave
  no way to finish, the round is luck (ten-frog L1: 53% of first picks could reach 10). Generate the last step FROM the
  earlier ones ("full" rule: the last lane holds a finishing option for every reachable total).
- **No level where every round has the same correct answer** (KDM scan: ~70 science games' level 1): after round 1 the
  child just taps the same option; rounds 2–3 teach nothing. Keep the opener, then mix ≥1 contrast case whose right
  answer is a DIFFERENT option (chemical-reactions: baking soda → reaction, then sugar/salt in water → no reaction).
- **Wrong options must be unambiguously wrong** (forms-of-energy: "Heat" offered as WRONG for the Sun; energy-
  transformations: "Heat" wrong for a bulb whose own reveal says "light (plus some heat)"): model each item's secondary
  truths and exclude them from the decoys.
- **No degenerate items** (compare-fraction-cliff: 57% of L1 compared a fraction with ITSELF, always "="): assert the
  generator's items actually differ along the dimension being taught.
- **The scene, labels and subtitle must not carry the answer before the prediction** (viruses: the subtitle explained
  the answer and the bacterium was labelled "living"; mars-rover: "thin air / months away" tags answered 2 of 4
  questions). Reveal-only tags appear after LOCK IN.
- **A failed commit names EVERY wrong part** (box-plot-builder, coordinate-rule-reactor): naming one at a time turns 3
  wrong parts into 3 misses → no star, though each fix was right. Mark all wrong parts; say "Also off: …".
- **Big-number answers need a method after the first miss** (map-scale-ruler L2: 7 × 25 with "Multiply" as the only
  hint, answer revealed after 6 misses = round already void): show the first rungs of a method ("count by 25s: 25, 50,
  75 … — 5 jumps"), never the answer.
- **Copy must match the board at that level** (triangle-builder L1 said "or flag it" with the flag button hidden;
  distributive-depot "any cut works!" vs "≥2 columns each side"; transversal-trail never said HOW MANY to find;
  science wrong-pick text said "LOCK IN again" after the button had become NEXT). Make copy tier-aware.
- **Whatever looks tappable must be tappable** (classification bins, crystals board cards, pattern-simon's "?" — a
  young child's first tap goes where they look; silence there reads as broken). Either wire it (pick / nudge) or make it
  look inert.
- **A distractor must never share the target's colour** (protractor-port 2026-10-23: the inner scale was drawn from L1 in
  the same pink as the target arm — "read to the pink arm" → children read the pink numbers, 180 − θ; 5 tried L1, 0
  cleared). Show a second scale / readout only from the level that needs it, in a neutral colour, and print nothing
  under a start flag ("0" + "0°" read as "00°").
- **Copy must describe the order things happen in** (elements: "Zoom in on water, then LOCK IN" — the zoom IS the
  reveal after LOCK IN, so children hunted for a zoom control): "Make your guess, then LOCK IN to zoom in."
- **Categories a child must tell apart need icons that look different** (frequency-forge: 🤚 Left-handed vs ✋
  Right-handed, 👧 vs 🧒 — matching a card to its row by icon was impossible). Use contrasting glyphs (👈 / 👉).
- **Count L1 work in placements, not taps** (frequency-forge L1 = 6 + 8 + 8 = 22 cards to sort for one level; 23
  tried, 4 reached L2). A sorting/placing game's first level: ≤ ~15 placements in total.
- **Reveal animations must be identity at rest** (soil-layers: the settle-slide offset applied in PREDICT too, so
  every slab sat 30 px high — the top one under the header, the '?' marks on the slab edges).
- **A first level asks for few wins, without a tight clock** (orbit-rider L1: 5 timed bursts at 16 s each, 3 tried / 0
  cleared; 450 games ask for 3). Keep L1 at ≤ 3 wins; if a level has a timer, give L1 the longest fuse.

## 3. The fun doctrine (gamability review, 81 games tiered)
The disease is the **answer-box dial**: computing mentally and dialing a number into a stepper
while the artwork sits as decoration. A stepper is FINE when the dial visibly drives the scene
(mercury rises, frog hops). Otherwise: **direct manipulation — the subject IS the mechanic**
(dealing crates IS division; leveling bars IS the mean; wrapping ribbons DISCOVERS π; the tap is
the commit). Proof animations on every commit (traced counts, aligned rulers, replayed paths).
Arcade tier: score = base × (1 + 0.15·streak) × 1.5-fast-bonus; two-way adaptive difficulty
(4-fast-streak up, miss rubber-bands down); ambient pressure (shields/drift) over ticking clocks
for young kids; endless survival + best-score chase for replay pull; name-promise match (a "Racer"
must race).
The fun doctrine makes a game *engaging*; the **learning-science rules in GENERATION.md** (retrieval
every item, worked-example-then-fade, immediate informational feedback, dual-coding, spacing,
interleaving, germane-not-extraneous difficulty) make it *teach*. Enforce both — engaging-but-shallow
is the convert-lab trap; both together is the 8/10.

## 3b. Word/asset imagery doctrine (childrendoenglish, 2026-09; ~100 images vetted)
When content needs a per-item image (vocabulary words, game icons, category art):
- **Never trust search hit #1**: Wikimedia Commons' first result is a book cover, archival
  scan, or worse ~50% of the time (a "nurse" query returned adult costume photos on a kids'
  site). Always fan out N candidates → contact sheet → vision review.
- **Metrics** (reference impl: CDE `scripts/word-image-improver.mjs`): recognizability
  (target audience names the item from the image alone), kid-suitability (bright, no text,
  no archival b&w, no brands), technical (≥300px, clean square crop), and the decisive
  **sole-answer score 0-2**: "what single word would a child say for this image?" — if a
  RIVAL item from the same content set is as-plausible an answer, the candidate fails
  (a jungle photo dominated by a house reads "house"; a heart-shaped balloon reads
  "balloon"; same-category rivals are fatal because they co-appear as quiz options).
- **Drop rule**: ~3 candidate rounds with fresh search terms; still no passing image →
  REMOVE the content item rather than ship a weak image. Some words are unservable
  (ukulele always reads "guitar"; an up-arrow always reads "arrow").
- **Illustration fallback** (CDE `scripts/generate-illustrations.mjs`): abstract concepts
  and photo-impossible items get hand-authored flat SVG → sharp → webp in a consistent
  pastel style — judged by the SAME metrics (a 2-peak zigzag read as the letter "M").
  **Rasterise generated SVG and LOOK at it before shipping** (yoga-bits chakra symbols, 2026-10-20):
  programmatic SVG art passes its generator and its unit tests while being visually broken — yoga's
  first pass had the lotus petals detached from the ring. Render SVG→PNG (sharp) and eyeball every
  generated asset; "the code ran" is not "the picture is right."
- **CI guard**: a unit test asserting every content item's image exists on disk and is
  non-trivial; same pattern for per-item audio if the product ships it (CDE pre-renders
  all word audio with Piper TTS — one consistent voice beats device TTS roulette).

## 3c. Discovery & retention — hub-level (kidsdomath, 2026-10)
Once a catalog outruns demand (kidsdomath reached 205 math + 200 science games), the lever is
surfacing the cold inventory to the traffic you already have — NOT more games.
- **Self-rotating spotlight ("Game of the Day")**: the hub spotlights the LOWEST-traffic
  non-graduated item (one per strand/subject). A game **graduates** — drops out so the
  next-lowest surfaces on the next build — once it clears an engagement bar (kidsdomath:
  ≥30 plays AND depth ≥2, depth = level-ups ÷ opens). Deterministic: the optimizer emits a
  committed `game-stats.json`, a prebuild `pick-*.mjs` derives the pick from it (no live
  timestamp, so it doesn't churn every build). Routes existing hub traffic to cold inventory +
  harvests the engagement data that says which items deserve promotion.
  - **Precondition — a PER-ITEM open signal** (CDE, 2026-10): depth = level-ups ÷ opens needs
    per-item *opens*. If the land beacon only tallies page/item CLASSES (CDE's did), per-item
    opens don't exist — add a per-item open event (`g_open`/`w_open`, webdriver + internal-flag
    excluded, item-id whitelisted) BEFORE depth is computable per item. (kidsdomath's beacon was
    already per-game `{day,game_id,...}`, so it needed nothing — this bites class-level beacons.)
  - **Many cold candidates → rotate the tiebreak, with a REAL hash** (CDE, 2026-10): when
    hundreds of items tie at 0 traffic, a *stable* id tiebreak pins the alphabetically-first
    forever — and it can never graduate, because spotlight clicks alone won't clear the bar. Salt
    the tiebreak with the snapshot DATE so cold items take turns per run. ⚠ a polynomial hash
    (`h*31+c`) is affine in the salt, so the arg-min is salt-invariant and the pick never moves —
    rotation silently fails. Use a mixing hash (FNV-1a + an avalanche step) and add a
    rotation test (different salt ⇒ different pick) or you won't notice it's stuck.
- **Win-screen next-game bias**: suggest a RELEVANT, not-yet-mastered next step, preferring an
  already-engaging item over a cold one. Ship as a measured version; revisit on a fixed clock.
- ⚠ **Honest caveat**: these redistribute EXISTING arrivals — they do not create new ones.
  Catalog size is never the arrival lever; distribution (backlinks/referrals) is. Build a
  spotlight to USE traffic, never to justify more inventory ahead of validated demand.

## 3d. Engagement & sharing guardrails — kids' audience (research round, 2026-10-24)
Every retention or virality feature (daily challenge, share result, class rooms, streaks, assignment
links) must pass these. They come from what drives complaints about competitors and from the kids'-privacy
rules. A feature that needs to break one is out, not "careful".
- **No upsell, store or paid tier shown to a child.** Prodigy's membership ads to kids (16 in 19 min,
  Fairplay) and "kids who pay advance faster" are its top complaints. Free, no-ads, no-cap is the brand.
- **No student email or account to play.** Asking students for an email is the COPPA problem flagged at
  Blooket. Teachers name logins as a top friction; no-login is the strongest asset — keep it.
- **Share text carries no name and no free text** — emoji + a day/level number + the URL only
  (`KidsDoMath Daily #142 ⭐⭐⭐ 🟩🟩🟨 kidsdomath.com/daily`). A typed name in shared text is personal data.
- **Live-room nicknames live for the session only** — never persisted, never in a URL, never in the beacon.
  Results and podiums are wiped when the room ends; no cross-session leaderboard (needs identity).
- **No push notifications, countdown nags or guilt copy** ("your streak will die!"). The amended COPPA rule
  (compliance 2026-04-22) dropped the push-notification ban but the FTC says it remains "concerned" about
  engagement prompts aimed at children; the UK Age Appropriate Design Code (std 13) bans nudges.
- **No streak a child can lose.** Use "days played this week" (resets weekly, never shows a loss) or a
  personal best. Duolingo itself: fear of losing a streak can stop learners starting one. A within-game
  best-streak/personal-best badge is fine — it can only go up.
- **Teacher-facing proof without student data.** "Show your teacher" = an on-screen/printable card (game,
  skill, score, date, short check code) generated in the browser; nothing about the child is sent anywhere.
- **Third-party share widgets load third-party script** (Google Classroom's `platform.js`) → prefer the plain
  share URL (`classroom.google.com/share?url=…`, as kidsdomath ships) so the CSP and privacy notice stay unchanged.

## 4. Robustness contracts (each was a shipped bug)
- **Touch drag needs `touch-action:none` on the drag source** (kidsdomath 2026-10-20). The template's
  `*{touch-action:manipulation}` (double-tap-zoom guard) lets the browser treat a finger-drag as a
  pan: the element gets 1–2 `pointermove`s, then `pointercancel` and **no `pointerup`** — every drag
  dies on phones/tablets while mouse play is fine. coordinate-rule-reactor had 0 level-ups from 16
  opens; a real-touch CDP probe found the same cancel in 78 drag games. The harness never saw it
  (solveForTest + mouse). Rule: any element with a drag `pointerdown` gets `touch-action:none`
  (`FX.enableDrag` does it), and treat `pointercancel` like `pointerup`. Verify with a real
  `Input.dispatchTouchEvent` drag (hasTouch context), not `page.mouse`.
- **kdm-no-repeat v2**: generator calls wrapped in `window.__kdmFreshO(...)`; if the round object
  contains ANY non-identity randomness (layout seeds, `token:Math.random()`, shuffled decoys) you
  MUST set `o.qkey` (stable question-identity string) or the guard silently never rerolls.
- **Timer registry**: every delayed respawn/roundClear/phase `setTimeout` goes through a tracked
  registry cleared in `build()` — stale timers rebuild rounds mid-level. (TDZ-safe under the
  harness's synchronous-setTimeout stub: pre-declare with `let x = null`.)
- **CSP**: assume production `script-src 'self'` on ALL paths — game JS in external `game.js`,
  zero inline scripts or on*= attributes (JSON-LD inline is fine, non-executing). Verify serving
  with the EXACT production CSP header + a securitypolicyviolation listener + a negative control.
- **Don't frame-block the content you WANT embedded** (kidsdomath, 2026-10): a blanket
  `X-Frame-Options: DENY` / restrictive `frame-ancestors` silently serves teachers a BLANK box
  when they embed a game in an LMS (Schoology, Google Sites, Canvas) — a free distribution channel
  killed by a security default. Split the policy by path: **static, no-login, nothing-to-clickjack
  content pages** (`/games/*`) send `frame-ancestors *`; **app/login/account pages stay `DENY`**.
  The embed only costs you anything if the page has a session to steal — a game doesn't.
- **The CSP violation report is a free "who embeds / what breaks" telemetry channel**: forward the
  `securitypolicyviolation` / `report-to` payload (host-only for framers, directive + document path
  for script-src blocks — validate, no PII) into your beacon. It tells you (a) who iframes you
  (cultivate them as referrers) and (b) which of YOUR pages still trip the production CSP. Filter
  Google-Translate-injected font/img/style violations — they were 35% of one week's report volume.
- **Image/media stalls**: a request can hang firing neither onload NOR onerror (stale-SW/network
  limbo). Every image-dependent UI needs: onerror retry-once (cache-busted) → fallback, PLUS a
  stall timeout (~7s) that forces the fallback. Fallback must keep the round PLAYABLE (word text,
  definition). Mirror loaded-state in a ref if a timer reads it (stale closures).
- **Asset integrity in CI**: a unit test asserting every referenced image exists on disk and is
  non-trivial (≥500b).
- **Schema integrity as a build gate** (CDE, 2026-10): if the site relies on JSON-LD for AI
  citation (FAQPage/HowTo/Article/BreadcrumbList), wire a `postbuild` validator that parses every
  JSON-LD block in `dist` and FAILS the build on a missing required field per `@type` (FAQPage →
  Question/Answer text present and entity-decoded; BreadcrumbList → positions; etc.). Makes schema
  coverage a non-regressing contract, and catches silent corruption — CDE's old guide answers
  carried a literal `&mdash;`. Structural + offline (not Google's Rich Results Test); the target is
  AI citation, not rich-result eligibility (FAQ rich results are gated to gov/health anyway).
- **TTS**: speechSynthesis triple-guarded — feature-detect, voices-loaded, and
  `navigator.webdriver` skip (headless TTS can stall the main thread ~14s).
- **Stale-deploy chunks** (SPA hosts): error boundaries detect chunk-load failure signatures and
  reload once (sessionStorage guard).
- **PWA**: add game/battle routes to `navigateFallbackDenylist`; remember `prompt`-mode SW keeps
  old shells alive across deploys.
- **Inner-scroll ≠ overlap fix** (flaky-CI class, recurred across several science games): resolving
  a crowded mobile panel with `#choices{overflow-y:auto}` does NOT satisfy the overlap detector —
  scrolled-off buttons keep their geometric rects and intermittently overlap the footer/actBtn, so
  the check passes on most RNG draws and fails on the tall-choice draw (red-on-main surprise). Make
  the panel actually FIT (cap choice count / shrink type / reserve a bottom dock), don't rely on
  overflow. The harness uses the game's own RNG, so a single clean run never proves it — loop it.

- **Coinciding drag targets** (angle-equation-arena 2026-10-10): two draggable handles that can land
  within a thumb of each other (two rays a few degrees apart, two markers at the same value) make the
  second one ungrabbable. Stagger the later handle inward/outward along its own ray, or offset it, whenever
  the angular/linear distance is below ~14° / ~24px — and TEST the degenerate configuration on purpose.
- **Canvas labels vs control geometry**: a label placed on a wedge's bisector sits ON both rays when the
  wedge is thin; a label near a ray end sits under its handle. Place labels beyond the geometry they
  describe (past the ray end, beside the thin wedge) and check at the thinnest configuration the
  generator can produce, not only at the first-play one.
- **Stage-1 hint must not BE the answer**: when the "collected" / "method" form the drone shows is already
  `x = n` (coefficient ±1), showing it hands over the answer on the idle path. Compare the stage-1 string
  to the answer; if they coincide, show the equation + the move to make instead.
- **Review deep levels, not just the first screens** (now automated in kidsdomath's harness: `desktop-deep`
  / `mobile-deep` captures at MAX-1 feed the geometry checks and the vision sweep). Tier-3 content is where
  layout breaks; a clean L1–L4 proves nothing about L6–L8.

- **The phone canvas band is shared with the hint drone** (clockwork-cove, more-less-meadow 2026-10-11): the
  injected "drone shown" rule shrinks `#cv` to 30vh on phones, which crushed a clock to its 44px floor and drew
  rods over the numeral. Draw code must derive every position from the LIVE band (`geo()`/`AH`), never from
  fixed fractions tuned on desktop. Raise the band only by measurement — level 1 AND deep level, drone open,
  two-line text, `#actBtn` still above the fold (`tools/game-review/drone-fit.mjs`; long-division-depot fit at
  level 1 and lost the button at MAX-1).
- **Progress readouts measure against the target set** (mirror-lab: "84% symmetric" on an untouched board
  because empty-matches-empty counted). `pct = 1 − mismatch/targetCount`, clamped; extra lit cells count against.
- **Every verb in the copy must have a live handler** (estimate-quantity-quay: "slide the mark" while
  `FX.enableDrag` existed but was never wired). Vision reviewers cannot see draggability — verify with a headless
  drag/tap and assert the value changed.
- **build()/respawn() reset ALL per-round state** (column-crunch: a carry chip from the previous round animated
  onto the next; mirror-lab: the level-1 onboarding ring persisted onto later boards because it was cleared only
  on the first tap). Anything a round creates — FX anims, onboarding ghosts, cue timers — dies in respawn.
- **Directional feedback flips with the mode** (number-line-jumps said "not far enough" when the child hopped
  too far in subtract mode). Test `st_low`/`st_high` in EVERY mode; a reverse/subtract mode inverts the sign.
- **A staged readout must read as the child's input, never as the board's state** (fraction-fill: a big "0 / 2"
  under a bar with one lit piece). Hide it until the child stages a value, or caption it "you wrote".
- **Drag-me labels sit on the rim past the knob, not across the dial** (clockwork-cove), with a backing pill and
  clamped under the HUD; a label across numerals/hands garbles the thing it points at.
- **Canvas text clamps by measured width** (mass-market pan labels, convert-lab readouts): centre a label, then
  `labelX()` it back inside the play area via `measureText`; a readout's baseline must clear the cap-height of
  the number under it (temp-trek caption −22 → −32 px).
- **A genre change gets a NEW URL; keep the old game reachable** (Galaxy Dividers 2026-09-26 → the arcade the
  owner remembered was gone; restored as Vector Vanguard three weeks later). Rebuild-as-remedy is for the same
  mechanic done better. If the new build is a different kind of game, add it beside the old one and let traffic decide.
- **Renames: grep each WORD, then read the live headings.** `GALAXY <span>DIVIDERS</span>` survived a
  whole-phrase rename and shipped as the page's own heading under the new URL. `contract-lint` now checks that
  the registry title appears in the `<title>` or a visible heading; still eyeball the live page after a rename.
- **Arcade family hygiene** (Sorting Rush siblings, 15 games, 2026-10-11b): lives drawn as `'█'.repeat(n)` render as
  one white slab — use ●/○; a combo toast at a fixed `top:64px` sits inside a 2-line orderBar — position it from the
  orderBar's live bottom; a level gate of "N consecutive FAST answers" never levels a careful child — add an
  N-correct-per-tier fallback; `start(lvl)` that ignores its argument made every deep capture secretly LV1 — the
  harness now flags it (contract-coverage "deep capture stayed at LV1").
- **Desktop boards placed at 50–60% of an 800px band strand the content far from a top-right dock** (scale-reader,
  true-false-circuit, pattern-picnic, odd-even-outpost) — use ~40% on W > 760.
- **The fixed ← Games pill owns the bottom-left ~46px**: canvas legends, the last grid row and a panel that overflows
  by a few px on phones all collided with it (recipe-rescale, hundred-chart-hunt, cash-register).
- **Fit check = every level, hint open AND closed, against the ← Games pill** (not the viewport bottom): expanded-form-express lost
  LOCK IN only at L3/L6, cash-register sat 5px into the pill with the hint CLOSED. `tools/game-review/drone-fit.mjs` measures exactly
  that; a catalogue run found 8 games overlapped and 3 tight (2026-10-11c).
- **Don't float a fixed HUD pill over the prompt card on phones; dock it, don't grow layout** (KDM
  catalogue-wide, 2026-10-18, a4e771b7 — 956/962 screens docked, 0 layout growth, 6 fall back). A
  fixed ⭐/score pill straddling the header card covers the prompt. On ≤760px, DOCK it into the card's
  existing pill row when it fits on that line (`position:static;margin-left:auto` appended into
  `#levelPill.closest('.hudrow')`), and UNDOCK back to the fixed pill when it doesn't (its `rect.top`
  rises above the level pill's) — so layout never grows either way. Call on show, paint AND resize.
- **Transient toasts go BELOW the prompt card, never over it** (same ship, `kdm-progress.js` kdmNoCount
  v2): a toast that outlives the ~1.7s respawn covers the NEXT question. Set `top = min(card.bottom+8,
  45vh)`, give it `width:max-content` (with `left:50%;translateX(-50%)` it shrink-wraps to ~half-screen
  instead of a full-width slab), and clear it on the next `pointerdown`. Ref: `kdm-arcade.js` dock()
  (kdm-arc-dock v1). Probe: 390+360px widths × catalogue, assert row height unchanged.
- **A drag target must answer a TAP** (KDM shape-splitter 2026-10-19: cuts were drag-only and a short
  press `return`ed silently — the vision playtest tapped the brownie 5× and "nothing changed"; 29% of
  opens reached L2). A young child's first move is a tap. On a press that doesn't travel, either do the
  action AT that spot through the same snap/validity path as the drag (tap = a cut through that point,
  oriented by the mode), or name the gesture in the status line ("👉 drag the cut line") — never silence.
  Signature to grep: a pointerup that measures the travel and `return`s below a threshold.
- **Controls fit the level's answer range** (KDM snack-bar-tapper 2026-10-25: L1 orders were 3–8 but the
  leftmost, biggest chip was +10 — grade-1 spotlight kids tapped (8/8) yet only 2 served a tray). Hide a
  builder/step control that can only overshoot every answer at this level, and drop it from the hint text in
  the same change ("tap +5 or +1"). A tester solving by API never sees this — kid-sim clears L1 in 13 s.
- **Ring budget on canvas targets** (KDM place-value-centipede 2026-10-25): a pulse/aim ring drawn at
  `r+7` around targets spaced `cw` apart overlaps unless `r ≤ cw/2 − ring_extra`; size the target from
  the ring, not the disc (`r = min(cw/2 − 8, …)`), which also keeps the end target's ring off the board edge.

## 5. Verification protocol (non-negotiable, per game)
1. `node test/playthrough.mjs <game>` — dbg contract, 560-round reachability sweep, win flow,
   desktop+mobile shims, 0 errors. Custom endless arcades may fail the win-flow gate BY DESIGN —
   then real-browser verification is mandatory.
2. Real Playwright, served over HTTP with the production CSP header: complete rounds via REAL
   input (mouse/touch on computed coordinates — never state pokes), verify miss paths, undo,
   score HUD, zero pageerrors, 390×844 mobile with ≥44px targets (≥64px for young kids).
3. Probe timing: when measuring round transitions, wait for STATE to change
   (waitForFunction), never fixed delays — proof animations delay respawns up to ~2.5s and
   fixed-delay probes report phantom bugs.
4. Commit only after verification; in multi-agent sessions commit immediately after verify
   (concurrent-session clobber is real) and re-grep your edits as the final step.
5. Registry/blurb/SEO copy must describe the NEW mechanic (the injector re-generates About blocks
   from the registry — stale copy resurrects at next build).
6. **A review counts ONLY if its report says "N findings" — silence is NOT a pass** (KDM, 2026-10-18,
   a silent-pass failure). Concurrent review-game runs all bound the same harness port (4399); every
   run after the first died `EADDRINUSE`, the report printed "harness: (no summary)", and that READ AS
   CLEAN — so vision + playtest silently never ran on those games. Fix: a per-process/default port,
   and the harness must print "⚠ DID NOT RUN" + exit 1 when it produces no findings line. Treat a
   missing findings count as FAILURE, never as zero findings. (Same class as webdriver-gated UI hiding
   from the harness — a check that silently no-ops looks identical to a check that passed.)
7. **Vision before ship is NOT optional for dense-DOM content** (KDM label wedge, 2026-10-18): the
   builders' own real-input checks passed all 5 games, yet VISION found 33 high findings — clipping,
   badge/star-pill collisions, a stage-1 hint leaking the answer values, white-on-white text. Automated
   playthrough proves REACHABILITY, not VISUAL correctness; for label/table/multi-panel/image-dense
   games a human-eye vision pass catches the class playthrough can't see. Don't defer it.
8. **For any PRINT page, screenshot `emulateMedia('print')` at page (A4) pixel size before ship**
   (yoga-bits flashcards, 2026-10-20): print-media bugs are invisible on screen — the first pass had
   5:7 cards overflowing to a 3rd row (breaking duplex back-sheet alignment) and text hugging the top
   margin, neither visible in the normal viewport. Generators that print (flashcards, worksheets,
   certificates) must be verified in print emulation at real page size, and duplex back-sheets checked
   for row-by-row mirror alignment.

9. **Play level 1 as KIDS, not as a solver** (KDM 2026-10-22/23 — every real L1 blocker this week was found this way;
   the gates and vision review missed all of them): real taps over HTTP at 390×844 as a careful kid, a slip kid (one
   wrong answer per round), an early-tap kid (presses the big button first), a slow kid (3–5 s per decision), a
   guesser and a pre-reader. Measure taps / time / stars to clear L1. Science (P-O-E) rounds wait for NEXT after the
   explain beat — press it; a probe that waits on a timer sees the SAME round and "finds" a repeat that isn't there.
10. **Behavioural probes in the gate** (KDM `tools/game-review/early-commit-probe.mjs`, `repeat-probe.mjs`; validate
    each probe on a known-bad old version AND the fix before trusting it): early-commit (3 commits before answering,
    then a correct answer — the round must still count; skip games with no commit button, where `Line.commit` is a
    harness shortcut that ANSWERS); repeat (60 builds through the no-repeat guard; compare the question STEM, not ids
    like o0/o1 that are slots); same-answer level (choice games whose L1 answer never varies).
11. **Review findings are leads, not facts.** Several "high" vision findings were wrong (orbit-rider's "orbit on the
    wrong side" was correct physics; "tile vs pieces" was the game's theme; confetti = after-frame residue). Verify
    each before changing a game; a reviewer that can't drag reports "the obvious tap did nothing" on drag games.
12. **Sample before you sweep.** Three 10-game samples of low-traffic games found 0 L1 blockers in 30 but real bugs that
    were PATTERNS shared by dozens of games — so the scalable move was a catalogue probe per pattern, not a full review
    of every game.

## 6. Multi-agent workflow rules
- One agent per game file; agents never touch sibling games or revert anything beyond
  build churn (`sw.js`, `version.json` ONLY — a `git checkout --` on a sibling's file once wiped
  an in-flight redesign).
- Agents report, the coordinating session commits (scoped `git add`).
- **Validate the INPUT you hand workers, not only their output** (yoga-bits, 2026-10-20): a
  list-extraction regex left a `- "` wrapper on the first item of each batch; all 10 workers noticed
  and silently dropped it, so the OUTPUT looked clean while the fed data was malformed. Gate the
  worker INPUT (the prompt payload) the same way you gate the output. (Pairs with "diff expected
  slugs vs outputs" — workers absorb upstream defects invisibly.)
- **One scratchpad SUBFOLDER per worker** (yoga-bits): two workers sharing one scratch dir collided
  on same-named helper scripts and re-ran each other's generator. Give each worker an isolated subdir.
- On transient API drops/stalls: resume-from-transcript with "re-read your files from disk first —
  trust the disk, not memory."
- **Write briefs and handoffs in Simplified Technical English (ASD-STE100 spirit)**: short
  sentences, one idea each, active voice, plain verbs, controlled vocabulary, no ambiguity. These
  are read under context-switching across many sessions — they must land in one pass. Lead with the
  task and the acceptance test; put the "why" in one line, not a paragraph. (Keep rich prose for
  genuine analysis/tradeoffs — STE is for instructions, not for thinking out loud.)

- **Agent worktrees inside the project folder break the build** (KDM 2026-10-22): Turbopack/PostCSS globbed
  `.claude/worktrees/*/node_modules` → a `node_modules/node_modules` symlink loop → TurbopackInternalError. Merge the
  fork's commits, `git worktree remove` it, THEN build. Never symlink node_modules into a worktree (use NODE_PATH).
- **Shared machine: one browser per agent**; seven parallel play-testers pushed load to ~23 and stalled runs.
- **A shared-script change rewrites hundreds of games** (e.g. a no-repeat wrapper in 492 files): forks branched before
  it must cherry-pick only their own files; check the wrapper's marker is still present after merging.

## 6b. Model routing (cost + correctness — route every Claude task by complexity)

The factory spawns a lot of Claude work; defaulting every agent/subprocess to one model is both
a cost leak (parallel build waves) and a correctness risk (over/under-powered tasks). Route by
the owner's rule: *spec-driven or mechanical → Sonnet-or-none; architectural, creative, or
strategic → Opus.*

| Task | Model | Why |
|---|---|---|
| Registry edits, normalize, inject-seo, sitemap, schema-validate, llms-full, count reconcile, optimizer *computation* | **none** (pure script) | Deterministic; an LLM adds cost + nondeterminism. Most of the pipeline is here. |
| Game BUILD from the hardened GENERATION spec (the parallel waves), content/article/word batches, surgical improver fixes, outreach-draft prep, SERP classification | **Sonnet** (latest) | The workhorse. The spec is now detailed enough that a strong Sonnet builds a spec-conformant game; this is the cost-sensitive bulk (18–25 agents/wave) — do NOT default these to Opus. |
| Vision review, playtest, image sole-answer scoring (`claude -p` subprocess) | **Sonnet** default, **Opus** for the deepest/hardest full-catalog pass (`--model=opus`) | Visual-clarity judgment; KDM's `vision.mjs` already does exactly this. |
| Novel-mechanic IDEATION / new-format design (e.g. the misconception P-O-E wing), multi-file refactors, strategy/selection/brain updates, hard debugging, deep research synthesis | **Opus** | Genuinely creative/architectural; the quality delta pays for itself here and the volume is low. |
| High-volume trivial LLM calls (bulk classify/extract/tag) if any | **Haiku** (latest) | Cheapest tier for work that still needs an LLM but no reasoning. |

**Invocation rules (from the owner's CLAUDE.md, learned the hard way):**
- Shelling to the CLI (`claude -p --model …`, Agent SDK spawns): pass a **bare tier alias**
  (`sonnet` / `opus` / `haiku`) so the call site resolves to the latest of that tier at runtime
  and never silently goes stale. `@anthropic-ai/sdk` / REST needs a **full dated ID** instead.
- **Verify a model ID resolves before pinning it** — the CLI and API catalogs differ, and a
  plausible string is rejected: `claude-sonnet-5-5` returned `[claude-code:unrecognized_model]`
  and silently failed every KDM vision run until it was changed to the `sonnet` alias. Test:
  `echo "reply OK" | claude -p --model <id> --allowedTools '' --no-session-persistence`.
- The coordinating session (Opus, on the main thread) routes: dispatch spec-driven builds and
  surgical fixes to Sonnet agents; keep ideation, strategy, and hard debugging on Opus.

## 6c. The review→improve loop (measure → fix → learn → propagate)

Once a site has a catalog and traffic, this is the standing operating procedure for making it
better — and the reason the brain compounds: a single-game review only pays for itself if the
lesson lands in a TOOL and then sweeps the whole catalog. Measure the work by what compounds, not
by the one fix. (KDM reference impl: `/review-game <id>` skill + `tools/game-review/review-game.mjs`
+ `scan-lessons.mjs`.)

| Step | What it does | Automation | Model (per §6b) |
|---|---|---|---|
| **1. Measure** | ONE command joins every signal for a game: harness + vision + playtest (incl. deep-level MAX-1 & mobile captures) + live beacon (opens-by-source, level-drop curve, cross-sell edges) + Search Console queries → one report; plus a workload / stage-1-leak / drone-coverage scan | **Fully automated** | Sonnet (vision/playtest subprocess) + none (data joins) |
| **2. Fix** | Decide what's actually real (discount vision-reviewer bias against the screenshots — grade band, harness-fired drones, observe-beat frames), edit, then re-run the same playthrough + harness + deep/mobile frames | **Verification automated; the fix is judgment** | Opus decides, Sonnet verifies |
| **3. Learn** | Turn each finding into a durable improvement, routed to its FIXED DESTINATION (below) so it stops recurring | **Checklist-automatable; deciding the lesson is the thinking** | Opus |
| **4. Propagate** | Find every other game with the same problem: catalogue-wide `scan-lessons` + `run.mjs --all` with deep captures + optimizer ranking, joined with traffic → one ranked fix list | **Fully automated**; fixes follow step 2 | none (ranking) + Opus/Sonnet (the fixes) |

**The automation boundary is the point:** steps 1 and 4 (and the verification half of 2) are pure
scripts — the judgment is confined to *what's the real bug* (2) and *what's the lesson* (3), which
is exactly the Opus work in §6b. Everything else is a script or none. If you find yourself
hand-assembling five tools to review one game, consolidate them into one command first.

**Fixed destination per lesson type** (this routing is what makes the brain compound — a lesson
with no home recurs):
- **A rule / design principle** → kit `PATTERNS.md` or `GENERATION.md` (commit the kit, bump VERSION, sync consumers).
- **A tester blind spot** (something the harness missed) → a new harness check or capture, so it can never ship again.
- **An improver recipe** (a fix pattern worth repeating) → the improver's recipe set.
- **An engagement signal** (traffic/depth/drop-off pattern) → the optimizer.
- **Always** → a one-line memory note so the next session knows it without re-deriving.

**Calibration of the measure step (2026-10-11, 20-game wave):** the vision score has ±5 run-to-run noise
(stale respawn in the wrong beat, lingering confetti, headless emoji). A post-score 1–6 points ABOVE the pre-score
is not a regression — read the new findings and keep the game unless a finding is caused by the edit. Score
before AND after, but decide on findings, not on the number. Also: run the playthrough BEFORE reading engagement
depth — river-crossing was failing it at HEAD and would have read as a UX problem.

**Measurement calibration (2026-10-23, KDM optimizer passes — the data pointed at games that weren't broken):**
- **One window per rate.** A 7-day "L1 clear" beside a "tried" that existed for 1.5 days said "3 in 4 triers fail
  pattern-simon"; the clean window said 85% clear. Compute every rate in the window where ALL its events exist.
- **Split the funnel**: opened → pressed PLAY → touched the board → cleared L1 → reached L2. "Never tried" (bounce)
  and "tried but stuck" are different failures with different fixes; cleared = max(L1-clear event, reached L2).
- **Rank by the cautious end of a Wilson range** (count × lower bound) — 0-of-3 must not outrank 40-of-100.
- **Instrumentation is a suspect first**: a new client event under-counts for days (cached old script: 141 first taps
  for 1,735 opens the next day); an event tied to a UI element (the result card) silently never fires in games that
  skip it (9 games had no L1-clear event); a fail-quiet beacon hides a DB outage (2 h lost to a Neon quota). Show
  per-day event volumes and per-game coverage before reading any game.
- **Reset to a baseline after a big pass** — save the optimizer output + raw aggregates + a git tag, then compare per
  game with a noise test. Changing ~45 games and two shared systems in two days is otherwise unreadable.

## 7. Consuming this kit
Each consumer repo carries `scripts/sync-game-kit.mjs` (copies kit files in, stamps
`.game-kit-version` with the kit commit) — run it after kit updates; CI or the script warns when
the local copy hash-drifts from the kit. The kit is canonical: fix bugs HERE first, then sync out.
Site-specific shared layers (arcade HUD, progress, beacons) stay in their repos but must honor the
contracts above.

## 8. Content→app funnel + infra gotchas (2026-10-19, yoga-bits + CDE)

The kit was game-catalogue-centric; yoga-bits is the first content→app site. Its funnel rules:
- **Deep-link contract + strict resolver + collection-wide test.** Every content page links into the
  app as `/{lang}/?start=<mode>&<item>=<content-slug>&src=<page-class>`. The app resolves the slug via
  a NORMALIZER (slugify, strip generic suffixes, exact-match normalized name OR canonical name) — not
  a fuzzy match (fuzzy = silent mis-lands). A unit test enumerates the content directory and asserts
  every slug resolves to exactly ONE app item, no collisions (yoga: 30/30). Content names and app
  names drift; a strict resolver + collection test fails at build instead of mis-landing in prod.
- **Funnel attribution rides the deep link.** Beacon `cta` item = `<class>:<slug>` on the content page,
  `src=<page-class>` on the app landing → the optimizer prints one line per content class:
  lands → cta → deep-link lands → started. Without `src`, an app landing is indistinguishable from a
  direct arrival; without per-item `cta`, you can't rank which content pages convert.
- **Verify instrumentation before trusting a zero.** When the optimizer reads 0 for a widget/content
  metric, GREP THE PRODUCTION BUNDLE for the hook (`ybLearn(`/beacon call) before concluding "nobody
  uses it" — the widget and the app ship as DIFFERENT bundles, and a hook can be missing from one.

**Infra gotchas:**
- **The build must not rewrite a bot-owned committed file.** A file a scheduled bot commits
  (`spotlight.json`) must NOT be regenerated by local `npm run build` — have the build READ it, or
  write only to `dist/`. Else every local build dirties it, `git pull --rebase` fails, and you risk
  committing a stale pick over the bot's (CDE).
- **Astro scoped `<style>` doesn't reach script-created DOM** → use `is:global` for client-rendered rows.
- **Vitest under jsdom rejects `new URL(import.meta.url)`** → `path.resolve(process.cwd(), …)`.
- **Vercel preview deployments are SSO-protected** (the Vercel MCP access-url tool 403s on scope).
  Reach them with `vercel curl`, or in Playwright with the `x-vercel-trusted-oidc-idp-token` header; still
  re-verify on PRODUCTION ~40s after push.
- **Preview must not write to the production DB** (KDM + CDE, 2026-10-25). Vercel DB vars are often ONE
  entry shared by Production + Preview (DATABASE_URL, POSTGRES_*, PG*), so previews wrote real rows to prod.
  Fix: a Neon branch `preview`; Preview-only DB vars point at it; switch the shared entries to Production-only
  (PATCH target, values untouched); prove it with a row diff of main vs the branch after a test run. Never
  test a writing preview before this is true.
- **Same-site checks read Host / X-Forwarded-Host, not a fixed host list.** A fixed allowlist 403'd every
  preview host (a full class-set simulation counted 0), and Vercel's request.url host can differ.

## 8b. Class features: live rooms + class sets (KDM + CDE, 2026-10-25)

Both sites' Class Battle had the same bugs, found only by a teacher + 5 simulated students run (phones +
desktops, a late join, a reload mid-battle). Required:
- **Reload resumes the same player with the same score and tally**, on every entry path (lobby join AND a
  `#join=CODE` link). Seed the client tally from the server row; never restart it at 0 (KDM lost answers;
  CDE lost the player).
- **Rooms expire when the page says they do.** Sweep expired rooms on regular traffic (throttled, e.g.
  once a minute per instance), not only when a room is created (CDE still held a room from a month earlier).
- **Battle distractors pass the same `collides()` rule as the games** (CDE: 149 words had a same-answer
  partner, e.g. grape/grapes). Generate the battle list from the shared data + a test that fails if stale.
- **Counting hits retry once** (after ~2 s on a network error or 5xx). An occasional double count beats
  an undercount a teacher sees.
- **The e2e is the gate:** teacher + 5 students, a late join, a reload, a join after the end (refused),
  TTL expiry (404 + rows gone), totals equal to the server, logs clean, then one tagged live smoke.
  Re-run it whenever battle, set or beacon code changes.
