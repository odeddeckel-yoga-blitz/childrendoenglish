> **GAME-KIT NOTE (v1.0.0):** This spec originated in kidsdomath and is the canonical generation
> prompt for template games. Read PATTERNS.md FIRST — it holds the cross-project contracts. When
> generating for another site, adapt the site-specific parts: progress-object name and script
> paths (KDMProgress, /games/_shared/*), analytics/beacon script tags, brand styling, and the
> host's CSP (external game.js if script-src 'self'). Everything else applies verbatim.

# KidsDoMath — Game Generation Prompt & Spec

The reusable recipe for building a new bundled math game for the hub. Paste the
**Prompt** section to spin one up; the rest is the checklist that makes it match
the existing games and pass review. Starter code: `templates/game-template/index.html`.

---

## PROMPT (paste this, fill the ⟨blanks⟩)

> You are building one more single-file math game for the KidsDoMath hub. Topic: **⟨topic, e.g. measurement & unit conversion⟩**, target **Grade ⟨2–8⟩**, ages ~8–11 (assume a **pre/early reader** — clarity beats prose).
>
> **Core rule: the math IS the mechanic, never a quiz gate.** Manipulating the game *is* doing the math. Design ONE tactile mechanic where the visual/physical action embodies the concept (like the reactor tubes = equivalent fractions, the spinner sectors = probability, the fill bar = decimal magnitude). Reject any design that pops a "what is X?" question.
>
> Before coding, brainstorm **3–5 candidate mechanics** and cross out any that are quiz-shaped or divorce the notation from the physical action (see **Rejected designs**); build the survivor, and favour one with **≥3 valid solution paths**.
>
> Build it by copying `templates/game-template/index.html`, then replacing the `Line` module's puzzle logic, the `T` string table, and the `FX.draw()` canvas rendering. Keep the scaffold (string table, FX loop, Game, Dash stub, chrome, KOC onboarding kit) intact.
>
> **English-only — do NOT add Hebrew, RTL, a language toggle (`#langBtn`/`toggleLang`), an `he:{…}` dictionary, `ltr()` bidi-wrapping, or `navigator.language`/`?lang`/localStorage language detection.** The template ships English-only by construction; keep it that way.
>
> Requirements: **3 modes**, ~**8 levels**, quota **3 per level**, forgiving (no game-over — a miss just recycles), and the **KOC onboarding kit** (below). Verify with the standard harness, then merge into the hub.
>
> **Copy = important first, short, to the point** (the `T` string table). The `kdm-texthierarchy` CSS makes the title/instruction/START dominate and demotes the SEO prose — write copy that earns that hierarchy:
> - `sub` (menu first screen): **ONE short line** — what the player does, not a paragraph. Put any extra mechanic detail in `tag` (kept dim/small below START). Never restate the whole game before the player has pressed START.
> - `orderText` / `panelHead` (in-game): lead with the **imperative + the current target** ("Zap the lowest — is 6 even or odd?"). Don't echo the same sentence in both the HUD and the dock; let the action buttons carry their own micro-labels.
> - hint (drone stage 1 / `.hint`): the **single next move in ≤6 words**, never a re-explanation of the rules.
>
> **⭐ The biggest number on screen MUST be the number the accept-logic checks against.** If a move is judged
> against a *derived* value (spendable = wallet − reserve; a target minus a kept amount; a "stay under" limit),
> make **that derived value the hero** HUD number — not a larger total the player will read as the limit. A kid
> compares the item/answer to whatever number is biggest and brightest; if that number isn't the one your
> `commit`/validation actually uses, a valid-looking move gets rejected as a mistake and the game reads as
> broken. (Real bug: budget-boss showed the $16 wallet total big while the buy-logic used $11 spendable →
> "I have $16, the item is $14, why declined?") Show the total/reserve as *secondary context*, the decision
> number as the hero. This whole class is invisible to the mechanical harness (it plays via your own verdict) —
> the deep-level `hud-logic-mismatch.mjs` vision check is what guards it.

---

## Mechanic ideation (do this before writing code)

Don't ship the first idea — the strongest games (Fraction Propulsion, Function Factory) came from
enumerating candidates and rejecting the weak ones. For the topic, list **3–5 candidate mechanics**, judge
each against *"does manipulating it literally do the math?"*, then synthesize the survivor. A good synthesis
layers: **concrete embodiment → multi-step / compound → adaptive scaffolding** (the old X-EEE "Loop 5").

### Rejected designs (anti-patterns — never ship these)
- **Quiz gate.** A popup "What is x?" that blocks play. Breaks flow, spikes anxiety. The action must BE the answer.
- **Type-the-answer-in-a-box.** Divorces the notation from the physical action — a quiz with extra steps.
- **Drag-and-*drop* as the primary control** (dragging tokens across the screen into slots/targets). Fiddly for
  kids on touch; the KOC review confirmed taps / steppers / canvas-taps beat it. NOTE this is distinct from
  *single-axis direct manipulation* (grab a bar/slider/point and slide it up-down or along a line) — that is
  encouraged (see the hidden-multi-select fix): the object moves in place under your finger, no drop target.
- **Notation divorced from the action** (a formula bar you edit while a separate thing animates). Keep the
  symbol and the motion in the same place.
- **Mandatory parent-diagnostics panel.** Built into the early games, then removed product-wide — it competed
  with kid clarity. Don't add one.
- **Punishing game-over / lives.** Use the forgiving recycle model instead — a miss shakes +
  teaches + recycles, it must NEVER end the run. This is invisible to reachability/playtest (the
  game still wins) yet silently crushes mid-game retention: a 2026-10-03 beacon read showed
  pattern-weaver losing ~everyone past L5 to a 3-shield game-over, and a sweep found the same
  legacy pattern in **14 other games** (shields that decrement on a miss and `gameOver()` at zero).
  **Enforced by the `forgiving-model` mechanical check** — it flags a lives/shields/hearts counter
  whose depletion triggers a run-ending call, so a game that ships it fails review/CI. A bare
  `gameOver()` definition left unused is fine; the ban is on *calling* it from a miss path.
- **Hidden multi-select.** A single stepper/control that only affects *one* of several manipulable objects,
  with no signal that the others are selectable/movable. Players adjust the default object, can't reach the
  target, and conclude the puzzle is unsolvable. (This shipped in Stat Lab v1: tap-to-select-a-bar worked but
  was invisible, so a player could only move "bar 1" and `mean = 2` was unreachable.) **Fix:** make every
  object *directly manipulable* (drag the bar/point/dial itself so touching it moves it — the object jumps to
  your finger, giving instant "I'm grabbable" feedback) AND pulse a wordless affordance cue (↕ / grab glyph) on
  *each* object on first play. Keep a stepper only as a fine-adjust for the last-touched object.
- **Pre-commit answer oracle.** NEVER reveal correctness before the player commits. If the status line flips
  to "✅ …!", the act button pulses, or the canvas recolors green the moment the dialed value equals the
  answer, every puzzle is winnable by tapping +/− and watching for green — zero math. (Shipped in ~70 games;
  swept out 2026-07-04.) The template now gates all three on `locked && solved()` — correctness shows only in
  the post-commit celebrate window. Keep it that way: `refresh()` computes `ok = locked && sv` and uses `ok`
  (never raw `sv`) for status text/color/pulse, and `pushFX` passes `solved: locked&&solved()`. Live
  NON-answer feedback (running totals, over/under-by-N, beam tilt) is encouraged — it teaches; the ✅ doesn't.
- **Ease physical state changes; don't SNAP them.** When a result is carried by a physical-looking element —
  a balance beam tipping, a needle landing, a bar/gauge filling, a pan sinking — animate it toward its new value
  (a light under-damped spring or an eased lerp stepped once per drawn frame) instead of jumping in one frame.
  The motion conveys causality ("I picked the heavier one → *that* pan sinks") and reads as alive, not a slide
  swap. Reset it on each new puzzle and honor `prefers-reduced-motion` (snap). Reference spring (~6 lines,
  stepped in the draw loop): `vel += (target−cur)*0.20; vel *= 0.74; cur += vel;` (snap to target once both the
  gap and vel fall below ~4e-4). Pattern proven in mass-market's beam.
- **Scaffold ghosts that contain the answer.** A goal label ('goal 700'), ghost outline at the solution,
  pre-highlighted correct chips, or counts printed on the bars the question asks about — all defeat the mode.
  Ghosts/targets are either the task statement itself (fill-to-the-line modes) or a RESCUE that appears only
  via the miss-3 / 14s-idle scaffold path (`droneShown`), never the default render.
- **Answer-key hints.** The drone rescue must be TWO-STAGE (the template ships it): stage 1 (3 misses or 14s
  idle) teaches the METHOD with the live puzzle's numbers — 'change = paid − price' + LED `10 − 7` — and
  NEVER contains the final answer — and CHECK that it doesn't by construction: if your "collected form" or
  "worked step" reduces to the answer itself (e.g. `x + 30 = 2x → x = 30`), stage 1 must show the equation plus
  the move to make, not the result (angle-equation-arena, 2026-10-10); stage 2 (`droneFull`, 3 further misses) appends the `🎯 answer` LED as the
  last resort. The IDLE path never escalates past stage 1 (an idle spoiler costs the kid their first attempt).
  Write one method sentence per mode. Numeric-dial games also give a commit-gated directional nudge
  (`st_low`/`st_high` — on wrong COMMIT only, never live in refresh(), or the S1 oracle returns as bisection).
- **Bypass of a by-eye / spatial answer (an anti-pattern FAMILY — classify the answer type first).** Before you
  pick controls and feedback, decide what kind of answer the mode has, because it determines what's legitimate:
  - **COMPUTED-NUMBER answer** (a count, sum, fraction, percent, angle, clock time, arithmetic/balance result):
    a +/− stepper IS the right input and a commit-gated `st_low`/`st_high` nudge is fine error-correction. A
    33-game sweep found ~29/30 steppers legitimate this way — **don't reflexively strip steppers.** (Calendar
    Quest v1's actual bug was pairing a stepper with a *positional* answer, below — not the stepper itself.)
  - **BY-EYE POSITION / MAGNITUDE answer** (where a value sits on a line / scale / grid / gauge; tap where you
    land; the Nth item): the interaction must force *reading the space*. Lock down ALL of these — leave any one
    in and the mode silently degrades into dial-a-number:
    1. **ONE direct-manipulation input, no numeric stepper.** A fixed-step stepper from a known origin (marker
       starts at 0) is *countable* to a shown target even with the value hidden — Angle Arsenal's ±10° estimate
       let a kid press +10° to a round angle without judging it. Drag-only. If the host has *only* a stepper,
       ADD drag by inverting the scale's own transform (`yOf(temp)`→`tempFromY(y)`); don't ship estimation on the
       stepper. (Fine-adjust steppers are OK only where the NUMBER is the object — dials/bars — never for position.)
    2. **No directional too-high/low nudge** — on a positional task it's just bisection; the kid follows the arrow,
       not the reasoning. Give STRUCTURAL feedback (restate what the tap *produced* vs. asked: "you counted 3 days
       — the order asks for 4") or, for a place-by-feel estimate, a post-commit accuracy read ("off by N").
    3. **No pre-commit oracle** — no live ✅ / green / `.koc-ready` the moment the value matches; reveal only
       post-commit (this is the general Pre-commit-oracle rule above, and it bites hardest here).
    4. **No leaked live value** — hide the numeric readout and any on-canvas value label (→ `?` until commit);
       for a place-by-feel estimate also go **sparse** (only the landmark ticks: 0 / mid / end, or 0°/90°/180°).
    Reveal the true value only *after* the commit.
  - **Two escapes that make a by-eye task safe WITHOUT the full lockdown:** (a) if the *target* is hidden from
    the prompt (Balance Bay's weigh mode reveals the mass only through the beam tilt), a countable stepper is fine
    — you can't count to an unknown; (b) showing a *probe's own value* on a number line is the position↔value link
    the game teaches, not a bypass. The genuinely-caught hits are scale-READING tasks (gauge / thermometer /
    cylinder) with a numeric readout + a too-high/low arrow, where you dial-and-follow without reading the scale.
  - **Audit the convergence channels as a SET** — removing one aid can promote another to the bypass. Liquid Lab
    hid the ml readout AND had no target line, so the leftover too-high/low arrow became the *only* reference (dial
    550+200 without adding). Check readout, directional arrow, `.koc-ready` glow, and target line/ghost *together*.
    Positive technique for scale-READING games: hide the player's live numeric value, keep only a *visual* target
    (a gold fill-to-here line), so reading the scale IS the mechanic.
- **Unexplained state colors / a pre-selected default.** Never open a round with an answer already selected —
  it reads as "already answered" (Calendar Quest v1 pre-picked the 1st and printed "you picked the 1st" before
  any input). Start unanswered, inviting the action. And never mark an anchor/reference with a bare colored cell
  the player must decode: label it (a 🚩 START flag + a one-line on-canvas legend, "🚩 = start · tap where you
  land"). Every persistent highlight earns an on-screen word or legend.

## The mechanic (design rubric)

- **Learning-depth check — does it TEACH the concept or just TEST it?** The deepest check, and the easiest to
  fail while everything else looks fine. Ask: is the target reasoning REQUIRED and VISIBLE on the play surface,
  or can the child reach the answer with the reasoning happening in their head / off-screen? A "measure" game
  where you compute the number mentally then dial a stepper to it *tests* conversion; a dual-scale gauge where
  you read one unit against the other *teaches* it. (Convert Lab v1 passed every mechanical + playtest check yet
  taught nothing — the gauge just held a number computed elsewhere.) If the child can succeed without doing the
  math the game names, the math isn't the mechanic — redesign so the reasoning is the action and is externalized
  on the surface (see the calendar-count-trail / dual-scale examples above).
- **One embodied mechanic, 3 modes.** Modes are variations of the same interaction that hit the topic from
  3 angles (e.g. build / compare / inverse). Each mode reuses the same controls + `solved()` shape.
- **Prefer ≥3 valid solution paths.** Where the topic allows, let the target be reachable multiple ways
  (Fraction Propulsion: any equivalent fraction; Function Factory: many operator combos) — it rewards
  experimentation over one "right" keypress. Single-answer modes are fine when the concept demands it
  (rounding, telling time).
- **8 levels** (default), `need = 3` correct per level → level clears → `Game.next()`. After `MAX` → win
  screen. `MAX` is a soft default — bump it when you add modes so every mode is reachable within `MAX` levels
  (NLN runs `MAX=10` for its 9 modes).
- **Forgiving.** No game-over. A wrong commit shakes + sparks; the player retries. (Older games had lives;
  new ones don't.)
- **⭐ The wrong-answer message must NAME THE NEXT ACTION, not just the error.** If the game stays on the same
  problem for a retry, saying *why* it's wrong ("off by 20 g", "look again") is not enough — the player can't
  tell whether the game is waiting for another try or has moved on, so they guess. State the retry + the control:
  "slide the needle and LOCK IN again", "tap the heavier item and LOCK IN again". (Real bug: mass-market's read
  mode left the needle draggable after a miss but only said "off by X — read the ticks again", so players didn't
  know a retry was expected.) This is invisible to the mechanical harness — it retries via your `dbg` contract,
  so it never feels the "am I stuck?" gap; the `feedback-quality` vision check (clause c) guards it.
- **Generators must be provably solvable.** Generate the answer first, then derive the target, so a solution
  always exists. Add a unit check in the DOM-stub test (e.g. "rounding targets are exact multiples", "between
  gap ≥ 1 unit").
- **Layout:** canvas visualization on the left (`#facLeft`, ~58–64%), controls on the right (`#facRight`).
  The math object lives on the canvas; steppers/taps live in the panel.
- **Tiered difficulty.** Each generator takes a `tier` (1|2|3) and widens its ranges — the template demo and
  `LEVELS` illustrate this. Never cold-open on the hardest case; `tier` should climb with the level index.
- **One hard thing at a time (no difficulty-stacking).** When a level introduces a NEW mechanic or dimension
  (a drift current, an obstacle to dodge, negatives, a second operation…), **ease the OTHER difficulty dials at
  that same level** so the player learns the new thing while the rest is easy — never ship a level where a brand-
  new mechanic lands AND the core math is also near its peak. Stacking two hard things at one level is the #1
  cause of a mid-game drop-off cliff. Concretely: at the introduction level, lower the number ranges / step size
  back toward tier-1 for a board or two, then let them climb again once the new mechanic is familiar. (Real case:
  *deep-sea-vector-salvage* introduced drift currents while vector deltas were still near max — ~77% of players
  quit across those two levels; the fix was to drop the delta size at the current-introduction levels, not to
  remove currents. The engagement optimizer's **⚠ Difficulty cliffs** table flags this pattern automatically.)
- **Direct-manipulation drag.** The template ships `FX.enableDrag({hit, valueAt, onDrag})` — grab the object
  and it follows the finger. Use it instead of re-rolling pointer plumbing (that's where the
  hidden-multi-select bug lives).
- **Externalize the reasoning on the play surface.** Where the skill is counting or enumeration across a visual
  structure, render the running count/enumeration ON the objects — number the hops from the start to the tap
  (1 · 2 · 3 · 4), number the Nth-item occurrences (#1 · #2 · #3) right in the column — so the intermediate
  reasoning is *read off the board*, not held in the kid's head or hidden until the rescue hint. (Calendar Quest
  v2: a numbered count-trail + numbered weekdays turned "do it in your head" into direct perception, and made
  wrong answers self-explaining — the kid sees the count fall short.)
- **Dual-representation for a RELATIONSHIP concept (conversion, equivalence, ratio).** When the skill is "these
  two things are equal / related by ×N", show BOTH representations aligned so the relationship is *seen*, not
  computed. (Convert Lab v2: a dual-scale gauge — metres on the left, centimetres on the right, aligned so 3 m
  sits at the same height as 300 cm — turned "compute 3×100 in your head then dial a number" into "read across
  two rulers". The ×100 became the visible tick density, i.e. the mechanic, not a prerequisite mental step.)
  This is a fill-to-the-line mode: the asked amount (3 m) marks the target height; the kid reads the *other*
  scale for the answer number, so nothing is leaked.
  ⚠ **A cheaper *temporal* variant when the two names share ONE spot on a single scale (improper vs mixed
  fraction, ½ vs 0.5 vs 50% on a number line).** Instead of two synced scales, randomly show one name or the
  other as the prompt across problems, land both on the SAME position, and on the solve-reveal print the equality
  ("12/5 = 2 2/5"). The equivalence is taught as a *magnitude fact* — same place, two names — not a conversion
  procedure, and it costs one extra display string (a `disp2` field), not a second scale. (NLN improper/mixed.)
- **Canvas-primary games need vertical room on mobile.** Games where the canvas IS the puzzle (gauges, number
  lines, thermometers, tall scales) get crushed by the mobile inline-hint canvas-shrink (`kdm-hint-fix` drops
  `#cv` to ~30vh while the drone shows). A single readout tolerates it; a tall/dual-scale does not. Keep the
  visualization legible at ~30vh (few, large ticks; abbreviated labels) or lay it out horizontally — and check
  the mobile "drone showing" state explicitly, not just first-play.
- **⭐ The `#orderBar` HUD overlays the TOP of the canvas on mobile — draw below `geo().topSafe`.** `#orderBar`
  is `position:absolute; top:12px` and, on phones (full-width canvas), sits *over* the top band of the play
  area. Any goal label, `🎯` target, or the top of a beam/scale/tree/dial drawn near `y≈oy` is silently
  occluded. This is a RECURRING flaw — in the 2026-09-05 batch FOUR games (mass-market, balance-puzzle-bay,
  area-formula-forge, part-whole-port + coin-combo-cove's goal pill) each independently re-fixed it by measuring
  `orderBar.getBoundingClientRect().bottom`. The template's `geo()` now returns **`topSafe`** (canvas-y below
  which you're clear of the HUD) and **`cySafe`** (centre of the HUD-clear region). Use them: centre top-heavy
  content on `cySafe`, and clamp any top label/target to `>= topSafe`. Never draw a must-read element in the top
  band without clamping. Verify on mobile 390×844 with the HUD present, not just desktop. ⚠ **Watch the glyph
  ascent, not just the baseline.** A text baseline that clears `topSafe` can still poke into the HUD, because
  the glyph's ascent (~0.8× font size) extends above the baseline — clamp using the glyph's top edge (baseline
  − ascent), not the baseline y itself.
- **⭐ CSS-driven canvas resizes don't fire `window.resize` — canvas hit-testing goes STALE.** The mobile
  hint shrinks `#cv` via a `:has()` reflow (58vh→40vh); an orientation flip or dynamic-viewport change does the
  same. None of these dispatch a `window 'resize'` event, so a game whose only hook is
  `window.addEventListener('resize',resize)` keeps its OLD internal `W/H`. For games that hit-test taps against
  the canvas (dock/cell/marker zones), the controls then land outside the resized canvas and become untappable —
  the "stuck on mobile after the hint pops up" bug (odd-even-outpost, 2026-09-05; was latent in ~59 canvas
  games). **`normalize-games.mjs` now auto-injects a `kdm-canvasfit` `ResizeObserver` on `#cv` that re-dispatches
  `window 'resize'` on any box change — so this is handled for you.** But: keep your `resize()` idempotent and
  driven off `cv.getBoundingClientRect()` (never cached page dims), and STILL playtest the mobile hint state
  (trigger 3 misses / 14s idle) — tap a control AFTER the hint appears, don't just check first-play.
- **Estimation is a reusable DEPTH pattern for any magnitude concept.** For number sense — whole numbers,
  fractions, decimals, measurement — the deepest mode is the same shape: a sparse scale (endpoints + one
  midpoint, minor ticks OFF), the target value HIDDEN, place-by-feel with a tolerance band, then reveal the
  exact spot + an accuracy read ("bullseye" / "off by N"). One marker-drag mechanic generalizes across all of
  those number types by swapping only the target and the label formatter — build it once and add modes, don't
  build a new game per number type. (Motion Math / Siegler number-line: magnitude estimation is what predicts
  later math achievement, not exact placement.) This is a by-eye answer, so it needs the full bypass lockdown —
  see "Bypass of a by-eye / spatial answer" (drag-only, no directional nudge, no pre-commit oracle, hidden value,
  sparse scale, reveal after commit).
  **Estimation-mode verification checklist (7 channels)** — before shipping, confirm all seven independently;
  leaving one open promotes it into the bypass (see "Audit the convergence channels as a SET" above):
  1. Input is drag-only (no numeric stepper).
  2. No directional too-high/low nudge, live or on commit.
  3. No pre-commit oracle (no live ✅ / glow keyed to `solved()`).
  4. No leaked live numeric readout.
  5. Sparse scale — landmark ticks only (0 / mid / end, or 0°/90°/180°), minor ticks off.
  6. Target value hidden until commit.
  7. Reveal-on-commit includes an accuracy read ("bullseye" / "off by N"), not just correct/wrong.
- **Show the user's units, not the engine's proxy.** When the model stores a scaled internal value (e.g. a
  0–100 position standing in for a 0–1 fraction, or basis points for a decimal), never surface that raw number
  — it's meaningless to the kid and actively misleads ("75" on a line labelled 0 · ½ · 1). Render one
  human-facing display string in the child's own terms (`3/4`, `0.75`) and pass THAT to the renderer, not the
  proxy. Corollary bug class: when a new mode branches the renderer on a field, confirm the draw call actually
  receives that field — a mode that never reaches the renderer fails silently (the visual just doesn't change).
- **A count-the-cells visual must render the EMPTY cells as clearly as the filled ones.** For a hundred-grid,
  ten-frame, or area model where the answer is "how many are shaded", the child reads the shaded fraction
  *against the whole grid* — so if empty cells are near-invisible (very low alpha on a dark ground), the shaded
  region floats as a shape with no frame to count against and even a strong reader misjudges it (Triple Match's
  100-grid rendered empties at .10 alpha → a clean 50% read as 40%). Give every cell a visible outline + a light
  empty fill, and anchor benchmark rows/lines (a halfway marker).
- **Multi-mode games: one mode-family TABLE, not parallel predicate lists.** Once a game has ≥4 modes, do NOT
  scatter `mode==='a'||mode==='b'||…` membership tests across the logic and the renderer — they *will* drift as
  you add modes, and the renderer half fails silently (NLN twice shipped a mode whose solve worked but whose
  on-canvas reveal never drew, because the logic predicate `isEst()` and the render predicate `isE` had
  different membership). Instead declare a single `const MODES = { place:{}, frac:{tol:1,mag:1,sparse:1,
  reveal:1}, … }` and derive every behavior from it (`MP(mode).sparse`, `.reveal`, `.tol`, …), read by both the
  game logic and the draw code. Adding a mode becomes one row; divergence is structurally impossible. Per-mode
  *dispatch* (unique strings/art per mode) stays as `if/else`; only *family membership* goes in the table.
- **Replay hooks (partly shipped).** The template menu now shows a **▶ Continue · LV n** button driven by
  `KDMProgress` (`maxLevel`) — `Game.start(lvl)` resumes there; this hook ships by default. A persisted
  best-streak badge or unlockable cosmetic theme is still the biggest untapped lever for deeper repeat play;
  add deliberately, don't bloat.

## Learning-science design rules (evidence-based — enforce these)

The fun doctrine makes a game engaging; these make it *teach*. Each rule has research behind it;
a game-generation pass should satisfy all ten.

1. **Retrieval every item** — the core loop must make the learner *produce* an answer
   (type/select/drag/construct), not watch an explanation then confirm. No passive pre-attempt
   screens. (Testing effect — Roediger & Karpicke 2006.)
2. **Prefer generation over recognition** — fill-in / build / estimate-then-check beats
   pick-from-a-list where feasible; even partial generation (first digit, a guess) helps.
   (Generation effect — Slamecka & Graf 1978.)
3. **Worked example first, then FADE** — a brand-new skill opens with 1–2 worked/guided items;
   remove hints and scaffolding as accuracy rises. A static difficulty/hint level is wrong for
   both ends. (Worked-example + expertise-reversal — Sweller & Cooper 1985; Kalyuga 2003.)
4. **Immediate, informational feedback** — on each item, right/wrong *plus the correct answer and
   why* ("6, because 2×3"), never a bare buzzer; no long delay for young learners. (Shute 2008;
   Hattie & Timperley 2007.)
5. **One concept per screen; the prompt is the hero** — kill decorative media/animation/sound that
   competes with the task (extraneous cognitive load); put prompt, input, and feedback in one
   place (no split-attention). (Cognitive load theory — Sweller 1988.)
6. **Dual-code the concept** — show it as symbol *and* a manipulable quantity/visual (ten-frame,
   number line, area model) and let the kid act on it; never gratuitous imagery. (Paivio; Mayer.)
7. **Space and re-surface** — missed and mastered items reappear after a gap (later in the session
   and in a later session); the item pool is not one-and-done. (Spacing — Cepeda 2006.)
8. **Interleave once basics land** — shuffle problem types so the learner must first choose the
   strategy; introduce each type blocked first, then mix. (Rohrer & Taylor 2007.)
9. **Add germane difficulty, never extraneous** — spacing/interleaving/generation are *desirable*
   difficulties (keep them); confusing UI, split attention, and over-tight timers are extraneous
   (remove them). If a novice's in-session accuracy falls below ~50–60%, you've overshot.
   (Bjork & Bjork 2011.)
10. **Fail → instruct, by level** — ready learners may attempt a *conceptual* item before the
    explanation (productive failure), but ALWAYS pair failure with corrective instruction; a true
    novice on a procedural fact gets worked-examples/errorless, not open-ended struggle (which just
    encodes the error). (Kapur 2008.)

Bonus: citing the principle on the page (and shipping genuinely research-grounded content) is also
a GEO "original/authoritative source" signal — see the playbook's distribution section.

## KOC onboarding kit (REQUIRED — this is what separates a 5/10 game from an 8/10)

Pre-readers can't parse instructions. Every game must have:

1. **Idle-triggered scaffolding.** The AI-drone hint fires after **3 misses OR ~14s idle** on the current
   problem (not misses-only). A passive, confused kid is the common case, but the hint must not nag: it appears
   only after real struggle. `startIdle()/clearIdle()` in the template. NOTE: `scripts/normalize-games.mjs`
   enforces the 14s/3-miss thresholds and turns `#drone` into a small, **tap-through** (`pointer-events:none`)
   floating hint character floated just *outside* the play area, over the panel's instruction line — **mobile**
   drops it just below the canvas, **desktop** nudges it just right of the canvas — so it's guaranteed clear of
   both the puzzle and the primary controls (an audit showed no corner of a packed canvas is reliably empty).
   Keep `#drone` a plain positioned child of `#facLeft` so the normalize CSS can place it; nothing per-game to do.
   ⚠ **But the cold-start FIRST problem is the exception: surface the help PROACTIVELY, don't gate it behind
   failure.** A 7-game retention audit of the most-played games found the dominant churn driver was scaffolding
   that only appears after 3 misses / 14s idle (or a proof that only renders *after* a correct answer) — so a
   cold young arrival who doesn't instantly recall the fact has no route to a first success except repeated
   failure → bounce. On the first problem of a fresh session (`firstEver`), show the key fact/visual on the play
   surface immediately: name the column sum ("ONES: 7 + 5 = ?" — Column Crunch), show the front item's price by
   the buttons (Budget Boss), light the part-whole gauge live (Number Bonds' `findPart` was dead till the win),
   draw the pairing dots *on* the number at decision time (Even Steven showed them only post-answer). They still
   do the reasoning; you just make it VISIBLE at the moment of the decision instead of after they've already lost.
   ⚠ **Guarantee an EASY first problem for a cold arrival.** The single strongest predictor of a new visitor
   continuing is a first success. Gate the very first board (`Game.level===1 && firstEver`) to a trivially easy,
   scaffold-friendly case — Temp Trek's first read is forced above-zero (`pick([10,15,20])`), Skip Trip opens
   "2, 4, 6, __", Even Steven's first number is a small even. The game's full difficulty/hook still lands from
   level 2 (and the harder cases preserve the SEO promise), but the opening tap is a guaranteed win, not a
   blind 50/50 or a below-zero puzzle in the first 5 seconds.
2. **Wordless first-play affordance cue — on the manipulable object, not just the panel.** On the **first problem of each mode** (tracked via a `cuedModes` set in the template — fires once per mode,
   not just once per session), pulse the primary control (`.koc-cue` → shared `kocCue` keyframes). **Critically, if the math
   objects live on the canvas (bars, points, dials) and there is more than one, cue *each* of them** (e.g. a
   bobbing ↕ / grab glyph over every bar) so "all of these are grabbable" is shown, not hidden behind a
   select-then-adjust step. A cue on only the stepper teaches the wrong affordance — see the hidden-multi-select
   anti-pattern. For canvas-drag games, glow the drag handle.
   ⚠ **Cue coherence — a shared/reused first-play cue (e.g. an auto finger walkthrough) must resolve to a REAL
   discrete input control, NEVER fall back to the bare `#cv` canvas as a phantom demo.** If the cue logic
   targets a tagged container (e.g. `#ctlBox`/`#tiles`/`#choices`) and falls through to the canvas when none of
   those exist, a game whose real controls live untagged in the side panel gets a finger pointing at empty play
   area while the actual input sits elsewhere on screen. Tag your discrete-input container so the shared cue can
   find it, or explicitly opt out (a `window.__kdmNoArcadeDemo`-style flag) if the game already shows its own
   cue. A pure canvas-tap/drag game (the canvas IS the input) is fine as-is.
3. **Visual READY confirmation.** When input matches the target, pulse the action button green (`.koc-ready`
   → `kocReady` keyframes) so "you've got it, now commit" is obvious before the click. Corollary (auto-injected
   by `normalize-games.mjs` as `kdm-cta-emphasis`): the submit button is *de-emphasised* until it has
   `.koc-ready` — it must not out-shout the input controls a child uses FIRST (a fully-lit "RING IT UP" at 0¢
   pulls the tap before any coin is added). Toggle `.koc-ready` on the submit button (`readyPulse(solved())`)
   in your live `refresh()` so the dim→bright transition tracks correctness; don't hard-style the button to
   always-bright.
   **Single forward action (⚠ hard rule for 2+ action buttons).** Never show two primary action buttons
   (`.act/.spin/.seal/.claim`) on screen at the same time. A young non-reader can't tell which one advances —
   they read affordance, not labels (number-detective shipped ✔ NEXT CLUE + 🔒 CLOSE THE CASE side by side and
   kids couldn't move to the next case). If your game has phases (e.g. gather-clues → commit), make the button
   **phase-aware**: toggle `display` so only the button that advances the CURRENT step is visible
   (`syncButtons()` keyed off `O.phase` in `refresh()`). The review harness now enforces this
   (`checks/ambiguous-action.mjs` flags ≥2 visible action buttons) — but design it right the first time; the
   model-playtester reads too fluently to feel this confusion, so it won't save you.
4. **Visual-first hints.** The drone leads with the LED/diagram (a worked example / ghost target), sentence
   second.
5. **Visual goal cue on the canvas.** Show the target as a ghost/gold marker or fill-to-here zone — don't
   rely on the order text alone.

(`.koc-ready` / `.koc-cue` CSS is auto-injected by `scripts/normalize-games.mjs`; the JS hooks are in the
template. See `plans/games-koc-improvement-2026-06-30.md` for the per-dimension rubric.)

## Workload check (before you call a game "done")
Count the ACTIONS a player needs per level-up: load the game, `Game.start(1)`, and sum the required moves across
the quota (3 rounds × moves per round). The exemplars that hold depth ≥ 3 (pattern-parade, gator-gulp) need a
handful; number-detective needed ~57 stamps per level and sat at 0.23 level-ups/open until its boards shrank
(2026-10-10). If a level-up costs more than ~15 deliberate actions, cut the board/quota/steps — nothing else you
polish will matter.

**Calibrated 2026-10-11b (20-game wave + catalogue scan):** games at ≤ ~30–40 taps per level-up hold depth 2+
(integer-island 27 → 2.24, subtract-squad 39 → 2.15); games at 50–120 sat at 0.3–0.9 (recipe-rescale 0.34 at up to
120, pictograph-pier, factor-forge, angle-pairs-post 96 → 0.44). Measure it: `node tools/game-review/workload-scan.mjs
<id>` clicks every stepper, reads the real change in `dbg.o` and samples 12 rounds per level. Fix it in this order:
1. **Step by the unit the math is about** — one icon = the key (pictograph-pier), one row (times-table-tower), the
   larger number (factor-forge LCM), one pen (division-remainder-ranch), one 10% crate (percent-change-port), 45° = half
   a right angle (angle-pairs-post), $100 notes, bundles of 5 tallies. The step itself teaches.
2. A bigger ± pair that appears only on rounds whose range needs it (hide it at L1).
3. Hold-to-run on − / + (420 ms, then 120 ms repeat; the held press swallows its click) for fine adjustment.
4. Start the dial where the math starts (the base price, the double), not at 0, when 0 is never the answer.
5. Only then cut the quota (`need` 3 → 2). A board game can also auto-consequence moves (logic-grid: a ✓ crosses out
   its row and column) — half the taps, no pedagogy lost.
Never add a step that lands on the answer, and keep `reachable()` true for every generated round.

## Readout honesty (before you call a game "done")
- A readout that shows a value the child has NOT entered must either stay hidden until they stage one or carry
  the caption "you wrote" — an untouched "0 / 2" under a lit bar reads as the bar's value (fraction-fill).
- A progress % counts matches against the TARGET set, not against every cell (mirror-lab read 84% untouched).
- Every verb in the copy ("drag", "slide", "tap the pan") has a live handler on the thing named; prove it with a
  headless drag/tap that changes `dbg.o`.
- Directional feedback (`st_low` / `st_high`) is tested in every mode — subtract/reverse modes invert the sign.
- Pieces that the child must COUNT use ONE colour; separate neighbours with spokes/gaps, never with a second hue
  (alternating pink/purple read as "not lit").

## Arcade addendum (endless real-time games — Vector Vanguard is the reference)
Arcades (Space Invaders / Tetris / Breakout loops) are welcome — Add Attack is #4 all-time with depth 2.21 —
but they bend three contracts, so do this explicitly (see kidsdomath `plans/arcade-classics-brief.md`):
- **Soft lives, not game-over.** Shields deplete on misses; at zero the SECTOR restarts (same difficulty,
  score kept, one-line teach of the fact that broke the shield). Never eject the child from the run.
- **Teach inside the loop.** The missed fact becomes the next target (Vector Vanguard: `recordFact` → drill route).
- **A terminal state for the hub contract.** Report `KDMProgress.played({completed:true})` at a sector cap and
  make the harness-facing `Game.screen` return `'win'` past it, so Continue/mastery and the playthrough work.
- **Harness shim is mandatory**: `window.Game` (`screen`/`level`/`start`) + `window.Line` (`build`/`commit`/
  `dbg` with the full contract), stage-only `solveForTest`, `commit()` auto-dismisses any between-wave
  overlay, and the fire control carries `data-kdm-primary` so the mobile smoke test finds it.
- **Progress survives a restart** (Game of the Day review, 2026-10-13 — prime-chomp, 27% of opens reached L2): a sector
  restart resets the board and shields, NEVER the level quota. Zeroing `made` on three ghost catches erased the
  child's work and re-walled level 1. Keep `made`; generate only the targets still owed.
- **Grid-steering games: a tap on a cell WALKS there** (one square per ~150 ms, ghosts still live, any d-pad/key/swipe
  cancels), and **a tap on the player's own cell commits** (CHOMP/ENGULF). Moving one square per tap made a phone child
  tap 5× to reach a number and then hunt for a separate button. The commit stays a deliberate second tap — never
  auto-eat on arrival (that would be a tap-the-choice quiz). First-play copy says it: "Tap a number to walk there, then CHOMP."

## PLAY must be reachable by a real tap (2026-10-17 — kidsdomath, catalogue-wide)
- **Never centre a full-screen, possibly-tall column with `justify-content:center`.** Overflow goes UP as well as down, and
  the part above scroll position 0 can't be scrolled to. Injected SEO/FAQ/"More games" blocks made kidsdomath menus taller
  than a phone: ▶ PLAY was above the screen in 483 of 497 games at 375×667 (ten-frog: 17 opens, 0 level-ups). Start-align,
  `overflow-y:auto`, auto margins on first/last child to centre when it fits (the template now does this).
- **Test the entry path a child uses.** Harnesses that call `Game.start()` skip the menu entirely. Run
  `tools/game-review/play-reach.mjs` (kidsdomath): webdriver spoofed false, 375×667 + 390×844 + desktop, PLAY must be on
  screen AND be the element a tap at its centre hits.

## Say what a child can't see (2026-10-17 — kidsdomath, 6-game cliff round + catalogue scans)
- **A round that doesn't count must say so.** The clean-quota gate (≤2 misses) is right, but silent: a celebration while ⭐
  stays put reads as broken (131 games). Call the shared `kdmNoCount(misses)` (or say it in the status line).
- **A miss message must name the real cause and the control.** circuit-lemmings said "Short circuit … gap ?" for a
  bulb shortcut — children were stuck until the answer hint. Test every miss path's text, not just that it fires.
- **Teach the new idea where phones can see it.** 34 games hid the panel `.hint` on phones to save space, so new modes were
  never explained there (shared fix shows it on the first level of each new mode). Don't hide the only teach line.
- **The first-play finger must point at something tappable** (13 games pointed at a read-only #ctlBox).
- **Cliffs are read one level early by mistake:** the level-up beacon fires on NEXT, so a drop "L2→L3" is children failing L2.

## Commit button & meters (2026-10-11b)
- **The commit button brightens on STAGING, never on correctness.** The injected `kdm-cta-emphasis` dims `.btn.act`
  until `.koc-ready`; a game that sets `koc-ready` only on `locked && solved()` leaves LOCK IN looking disabled for the
  whole round (~100 games shipped that way). `readyPulse(ok || (!locked && staged))`, where staged = the child changed
  anything this round. Glowing on a CORRECT staged value would be an answer oracle — never.
- **No decorative meters.** A lives/shield pill that never moves (forgiving games where misses cost nothing) is a
  dishonest readout: hide it. Show shields only where they really drop (Vector Vanguard). Same for "3 shields" copy.
- **Status line before input = a first-action prompt** ("👆 Tap + to set your count."), never "count: 0".
- **Wrong-answer copy cites the child's own value AND names the control**: "📉 10 is too low — tap + (one 🐟 = 5)".
- **Canvas text is drawn upright in world space** — labels drawn after `ctx.rotate` tilt with the beam and collide with
  rims (balance-bay). `restore()` first, then draw.
- **A panel hint and the drone must name the same target** (logic-grid said "Start with clue 1" while the drone said
  "re-read clue 3"). Derive both from one picker.

## No answer oracles before commit (2026-10-11c — found in 11 games)
Anything that changes when the STAGED answer becomes correct tells the child the answer before they commit:
- a commit button that glows only when right (`readyPulse(sv)` / `readyPulse(!locked && solved())`);
- a status line that says "✅ Just right — LOCK IT!" while they are still dialing (`sv ? L('st_ok') : …` without `locked`);
- live "too low / too high" while staging (its silence = correct) — show the child's own value/equation neutrally, judge on commit;
- a stage-1 hint whose worked chain ends on the answer ("count 1 hour BACK: 8 → 7") — stage 1 shows the method's first step + "…";
- chips/answers that appear only once a construction step is exactly right (a deliberate scaffold — judge case by case).
Gate verdicts on `locked`. `tools/game-review/contract-lint.mjs` (status-oracle) and `cta-probe.mjs` (glow on a correct vs wrong staged
value) catch the first two mechanically. Deliberate live-feedback builders (mirror-lab) mark the line `LIVE-FEEDBACK`.

## Round flow (2026-10-11c)
- **Scaffolds fade by level, never by a one-way switch.** mean-machine showed its sum ÷ count working only until the first solve
  ever (`proactive=false` forever) — round 2 was suddenly mental arithmetic; depth 0.16. Keep the working visible through level 1
  and the first round of each new mode.
- **Multi-phase rounds:** name the step ("Step 1 of 2"), celebrate only the ROUND (a full confetti on a phase reads as "done" while
  the quota doesn't move — mental-math-mesa), and make an early commit press a gentle next-step hint, not a miss.
- **Board/puzzle games count MOVES, not taps:** moves × quota per level ≤ ~15; vary `need` per level by move count
  (tower-of-hanoi: 3 towers × 7–15 moves = depth 0.21 → NEED=[2,2,1,1,2,1,1,1]). The stepper workload scan can't see these.
- **`showDrone()` must redraw the canvas** (`pushFX()`) when the canvas reads the hint flag — on the idle path the guide never appeared.
- **Respawn ≥ ~900 ms after `celebrate()` and clear particles in respawn** — 360 ms left the burst over the next board (the source of
  the "leftover confetti" vision noise in every wave).
- **Reset the status line in build()/respawn()** — a stale "✅ Tower rebuilt in 15 moves" sat beside a fresh puzzle.
- **Tap-to-commit games** (tapping the answer commits) keep `#actBtn` only as a hidden contract stub; the probes skip it.
- **Every wait is announced and looks disabled** (arcade vision + model playtest, 2026-10-12 — 7 of 9 playtest stalls):
  between waves/boards, ball in flight, caught/home beats and the level-clear delay show a "⏳ Wait — next … coming"
  line (short countdown where it helps) and grey the controls with `disabled` + a `.waiting` class (opacity ~.4,
  grayscale). The shared quiet-CTA dim alone still reads as pressable. Drive it from `refresh()` off the lock/phase,
  never as a one-off toggle.
- **Status copy comes from LIVE state, not the event:** "Find 2 — bonk again!" with no 2 on screen, "FIRE again" after
  the launcher reloaded, a "✅ done" line beside a fresh board. Reset the line in build()/respawn, keep a miss teach only
  as "↩ Last shot: …", give hit notes a ~1.3 s life, and beware soft-status guards (skipped for ~2.5 s) that outlast a
  1–2 s respawn. When the copy asks for a new choice after a miss, clear the staged value.
- **Placeholder copy is a stuck state:** "🚀 …", "🛰 …" read as frozen. Name the wait.
- **Neutral visuals must not pre-solve:** idle ships drawn in rows of 5 answered "÷5"; fixed-position 👇 cues read as
  pointing at an answer. Arrange idle visuals by a non-answer unit; use one uniform cue on every option.
- **One flash label at a time, anchored to its object**; label every non-answer prop on the board (a safety net read as
  "the bridge", a power-up pellet read as a trap).

## Level-1 kid traps (2026-10-23 — kidsdomath, ~45 games fixed; see PATTERNS §2 + §5.9–5.12)
Build these into the generator, not into a later fix pass:
- **Not-ready commit = gold nudge, not a miss.** In commit(): if nothing is picked / the dial is untouched / the
  answer is incomplete, set a gold "what's left" status and return BEFORE any `missSince++`.
- **Level 1 is never luck.** If later steps depend on earlier choices, generate the last step from the earlier ones so
  every route a careful child takes can finish.
- **Level 1 never has one answer.** Open with the canonical case, then mix contrast cases whose correct answer is a
  different option (≤70% of L1 rounds may share an answer). Every contrast item gets its own explanation.
- **Decoys are certainly wrong** (exclude each item's secondary truths) and items are never degenerate (the two things
  compared actually differ).
- **Nothing on screen answers the question before the prediction** — reveal-only labels after LOCK IN.
- **Name every wrong part after a wrong commit; show a method after the first miss on any answer a child can't do in
  their head** (count-by ladder, first rungs only).
- **Copy is tier-aware**: never name a control that's hidden at this level; say how many to find.
- **Anything drawn like a button responds** (pick it, or nudge toward the real control).
- **Emit the funnel events**: open, play, tap1, clear1 (even without a result card — reaching L2 implies it), levelup.

## Design-review lens — the 3 personas (quick pre-ship check)

Sanity-check the finished game against three players (from the original X-EEE prompt; they map to the KOC
dimensions we later measured empirically):
- **The power-gamer (Tavor, ~9):** enough juice (particles / shake / shockwave on success), fast live feedback
  as they adjust, and ≥3 solution paths so there's room to optimize.
- **The anxious learner (Maya, ~10):** forgiving (recycle, no game-over); scaffolding on **3 misses OR idle (~14s)**;
  progressive difficulty (never cold-open on the hardest case — start fractions on halves, not 15ths).
- **The parent (glance test):** the math is legible from the visual alone in **≤3s** — no parent panel needed;
  the embodiment IS the explanation.

## Architecture (identical every game — don't reinvent)

Single-file, zero-dependency HTML. `"use strict"`. Modules in this order:
`Math utils · strings (T + L + applyText) · FX (canvas) · Dash (no-op stub) · Game (screens) · Line (puzzle)`.
Expose `window.Game/Line/Dash/FX` for inline `onclick`s. Call `applyText()` at the **very bottom** (after all
modules exist — top-level `const` is in the temporal dead zone earlier, so calling it before the modules are
defined throws).

Screens: `menu · play · result · win`. `Line` owns build/solved/render and a read-only `dbg` hook
(`{get o(){return O}, solved, reachable, ...}`) used by the test harness. The template ships a **commit-lock**
(`let locked=false` → `if(locked)return` at the top of `commit()`, `locked=true` on a solve, `locked=false` in
`build()`/`respawn()`): without it a fast double-tap during the ~380–520ms post-solve window double-counts one
solve toward the quota — keep it. If your control isn't a single stepper (e.g. per-column digit dials, an X/Y
pair), also expose `dbg.solveForTest()` that snaps the controls to the answer, so the harness can solve any
control layout generically (single-stepper games don't need it — the harness dials `dbg.o` to the target).

When copying patterns from a prior game, **prefer a recent template-derived one (e.g. `prime-factory`)** as
the reference. Older games like `stat-lab` carry legacy RTL / `T={en:…}` remnants from before the EN-only
switch and should not be used as copy sources.

When passing arrays/objects into `FX.setConfig`, always push a **copy** (e.g. `bars:[...O.bars]`), not the
live reference — mutating it later corrupts the renderer's snapshot.

## Accessibility (template ships these — keep them)

- **Keyboard:** Arrow keys adjust the value; Enter / Space commits (remap to your control if it's not a
  stepper).
- **ARIA:** `aria-live="polite"` on `#statusLine`; `aria-label` on `#cv`. The viewport no longer disables
  zoom (`user-scalable=no` was dropped).
- **Reduced motion:** the normalizer injects `@media(prefers-reduced-motion:reduce)` to kill KOC pulses
  across all games. Success must also be signaled by a **shape or glyph** (✓, fill change) — not hue alone —
  so it works for colorblind kids.
- **Crash recovery:** the template ships `#errPill` + `window.onerror` — a runtime error shows a reload pill
  instead of silently freezing the game.

## English-only (do NOT add Hebrew / RTL / a language toggle)

Games are **English-only by construction.** The template already ships this way — keep it. Do **NOT** add any
of the bilingual machinery earlier games carried:

- **No Hebrew dictionary.** `T` is a single flat English string table (`T = {title:'…', …}`), not
  `{en:{…}, he:{…}}`. `L(key, ...args)` reads it directly (values are strings or functions). Every
  user-facing string still goes through `L()` — including canvas labels and win/result/drone text.
- **No language toggle.** Do not add `#langBtn`, `toggleLang`, a 🇮🇱/🇺🇸 button, or `window.toggleLang`.
- **No language detection.** Do not read `navigator.language`, `?lang=`, a `<game>_lang` cookie, or
  `localStorage`. There is nothing to detect — it's always English.
- **No RTL.** Do not set `<html dir=rtl>`, `dir='rtl'`, or add `html[dir=rtl] …` CSS. Do not add a `body`
  `he`/`rtl` class. `applyText()` sets `document.documentElement.lang='en'` and nothing else.
- **`ltr(s)` is a passthrough** (`const ltr=s=>s;`) kept only so copied code that still calls it works. Do
  not reintroduce the `⁦…⁩` bidi-wrapping — with no Hebrew, there is nothing to protect from bidi-flip.
- **Canvas text** stays LTR (`ctx.direction='ltr'` each frame is fine as-is); no per-string direction logic
  needed.

## Hub conventions (chrome)

- `← Games` back-link: `<a id="hubBack" href="/">` fixed bottom-left (in the template).
- **No language toggle** — English-only games carry no `#langBtn` (see the English-only section). The
  template has none; don't add one.
- **Parent diagnostics are removed** — `Dash` is a no-op stub, no `#dashToggle`/`#dash`. (The normalizer also
  force-hides them.)
- Mobile: `#play` stacks column; `#cv{bottom:auto;height:~46dvh}` keeps the canvas in the top band; opaque
  `#facRight` background; action button `margin-bottom:40px` to clear the back pill.
- Real title spaces, not `&nbsp;` (normalizer strips them, but author clean).

## Hub progress contract (Continue / mastery / progression paths)

The hub personalizes ("Play next", per-path progress dots, parent curriculum map) by reading one localStorage
key, **`kdm_games`**, that every game writes via the shared script `/games/_shared/kdm-progress.js`. The
template already ships this — keep it:

- **The `<script src="/games/_shared/kdm-progress.js">` in `<head>`** — loads before game code so `window.KDMProgress`
  exists. Auto-records an **open** on load (powers Continue / recently-played) with zero extra work.
- **`KDMProgress.played({ level })`** on each level-up (template: in `next()` after `level++`) — tracks `maxLevel`.
- **`KDMProgress.played({ completed: true })`** on win (template: at the top of `winGame()`) — the ⭐ "mastered"
  signal used by paths + the parent map, and it tells the recommender to stop suggesting the game.

If you keep the standard `next()`/`winGame()` names, the normalizer wires these for you (idempotent) — but the
template already has them explicitly, so leave them in. **Custom, non-template structures (endless/arcade like
galaxy-dividers, voyage-based like deep-sea) must call `KDMProgress.played()` by hand** at their own real
progression points: pick a sensible "mastered" milestone (a level/wave/voyage threshold), since an endless game
has no single win. Always guard with `if (window.KDMProgress)`.

## Accent tokens (IMPORTANT gotcha)

Registry `accent` must be an **already-emitted** `kid-*` token. A brand-new `@theme` color token in
`globals.css` is **tree-shaken by Tailwind v4** unless a statically-visible utility references it — and
GameCard's dynamic `var(--color-${accent})` is NOT static, so a fresh token silently fails to render.
**Reuse an existing token** (teal/purple/pink/blue/green/orange/sky/mint/lavender/yellow/gold/red — all
emitted), or add the new token AND a static usage (e.g. reference it in a real CSS rule like `:focus-visible`
uses `--color-kid-orange`). The game's own in-file palette is independent — only the hub *card* accent needs a token.

## Verification gate (run every one — this is non-negotiable)

The harness lives in `templates/game-template/test/`; see `README.md` there for the full `dbg` contract.

**Required `dbg` contract** (the template ships this; every game must keep it):
`Line.dbg = { o, solved, reachable(o), solveForTest(), wrongForTest(), jumpToLevel(n), made, need }`
- `reachable(o)` — returns whether `target` is attainable via the real controls given current object
  ranges (guards unsolvable/pre-solved generations). The generator must reject unreachable targets, not just
  already-solved ones.
- `solveForTest()` — snaps `O` to a solved state without touching the DOM. Single-stepper games may omit it
  (the playthrough dials `dbg.o` to the target directly); any multi-control layout must provide it.
  **It STAGES, it never commits**: no `commit()`, `resolve()`, `choose()`-that-locks, `finishTower()`, last
  `doCross()`. The harness runs stage → `solved()` → `commit()`; a helper that resolves the round respawns it
  before `solved()` is read and the playthrough FAILS at HEAD silently — six games shipped that way
  (river-crossing, angle-aim, pattern-parade, shape-sort-shack, gator-gulp, tower-of-hanoi, 2026-10-11).
  `tools/game-review/contract-lint.mjs` flags it statically; a multi-move puzzle drives all moves but the
  last and stages the last (note "STAGE" in the body so the lint knows).
- **Generators must terminate.** A `while(duplicates)` that bumps a value with `Math.min(hi, m+1)` is a no-op
  at the cap → infinite loop for a real player (tally-tower hung 60 min). Bound every repair loop by the
  range, push the duplicate the OTHER way at a cap, and never loop on a condition the bump can fail to change.
- `wrongForTest()` — drives a deliberate WRONG answer (the opposite tap / a value nudged off the answer) so the
  review tool's feedback-frame capture lands on a real miss+teach state instead of a leftover success. Without
  it, the wrong-answer frame commits from the already-advanced state and shows a WIN — a false "no feedback"
  reading. Ship it. Staging-only is fine (set the wrong value + `onInput()`, like `solveForTest`): the review
  harness commits for you when no miss registered (it hooks `FX.setShake` / the red `#statusLine`). If the
  game commits inside `wrongForTest` itself, `return true` so the intent is explicit.
- `jumpToLevel(n)` — jump straight to a deep level so deep-level clarity checks (`hud-logic-mismatch.mjs`) can
  reach a round where the mode has shifted. Steppers get it free (`Game.start(n)`; the template delegates to
  it). A **real-time game** (belt/wave/lap) whose `start()` ignores levels MUST implement it: set the level,
  regenerate the round, spawn one live target. Without it the deep-level check can't reach the game and logs
  `⚠shallow` — a silent coverage gap.

1. **Syntax:** extract the `<script>` and `node --check`.

2. **Generic automated gate** (`templates/game-template/test/playthrough.mjs`):
   ```
   node templates/game-template/test/playthrough.mjs ~/projects/<id>/index.html
   ```
   Asserts: 0 page errors; `#cv` + `#hubBack` present; English-only (no `#langBtn`, `dir≠rtl`); reachability
   sweep (~560 generated targets all pass `dbg.reachable()`); win-flow via `dbg.solveForTest()` across all
   levels/modes → `Game.screen==='win'`; and a **mobile 390×844** smoke pass.

3. **Hit-tested real-input spec** (`templates/game-template/test/realinput.spec.mjs`):
   Adapt `solveWithRealInput(page)` to solve a puzzle using REAL `page.mouse` / locator clicks on the actual
   controls — **never `page.evaluate` calling `Line.*` directly** (that's what hid the Stat Lab hidden-select
   bug: the test "passed" while the tap target was undiscoverable to real players). If the mechanic has *N*
   manipulable objects, exercise **more than one**. Produces desktop + **mobile 390×844** screenshots to `/tmp`.

4. **Eyeball the `/tmp` screenshots:** affordance cue visible on all manipulable objects, no overlaps, numbers
   legible, `dir` is empty (no RTL).

5. **Playtest gate** — `node tools/game-review/run.mjs --playtest <id>`: a model PLAYS from screenshots, one
   move at a time. If it gets stuck, or its obvious tap doesn't advance the game, a child will too. But note:
   a clean playtest means *playable*, which is NOT the same as *teaches* — convert-lab passed the playtest
   while being pedagogically hollow. So the playtest clears usability; the learning-depth check (rubric) clears
   the pedagogy. Run both; a game must pass both.

## Merge steps (checklist)

1. `mkdir -p public/games/<id> && cp ~/projects/<id>/index.html public/games/<id>/index.html`
2. Append an entry to `src/data/games.js` `GAMES[]`: `{id, href:'/games/<id>', internal:false, addedAt,
   accent (emitted token), emoji, image:null, tags, title:{en}, blurb:{en}, locales:['en']}` — English-only,
   so no `he` title/blurb and `locales:['en']`.
   **AND add a matching `GAME_META['<id>']` entry** (same file, the map merged into each game): `{strand,
   grades:[lo,hi], difficulty:1|2|3, skills:[…], prereqs:[…]}`. This places the game in the hub's **grade
   bands (G1–2/3–4/5–6), progression path, and parent curriculum map**. Skip it and **the build fails**:
   `scripts/validate-registry.mjs` runs in `prebuild` and errors on a missing or invalid `GAME_META` entry
   (bad `strand`/`grades`/`difficulty`, missing bundle, tag/strand mismatch).
   - `strand` = one `CATEGORIES` key (`arithmetic·fractions·geometry·algebra·data·time`) — its path bucket.
   - `grades` = the intended grade range (drives band membership + the "Grades 3–4" card label).
   - `difficulty` = order within the path (1 easiest). `skills` = concept keys (subset of `tags`).
   - `prereqs` = soft prerequisite game ids (usually `[]`).
   Run `pnpm validate-registry` to confirm the entry is valid before moving on.
3. ~~Add a per-game rewrite to `next.config.mjs`~~ **NO LONGER NEEDED (stale step).** A single
   dynamic rewrite `{source:'/games/:slug([a-z0-9-]+)', destination:'/games/:slug/index.html'}`
   now covers EVERY bundled game. Any new id matching `[a-z0-9-]+` just works — do not add per-game rewrites.
4. `git commit` + `git push`, then deploy with `npx vercel --prod --yes` (the CLI works — the old "token
   expired" note was stale; used successfully throughout 2026-09). Gotcha: the CLI sometimes times out
   *polling* deploy status (`ETIMEDOUT`) *after* the build already uploaded — re-run it, or `curl` the live URL
   and grep for a change you made, rather than assuming the deploy failed. (If GitHub→Vercel auto-deploy is also
   wired for this project, the push alone suffices — verify which is active.)
5. Poll `https://kidsdomath.com/games/<id>` until live (grep for the English title).
6. Verify the live page (English), then **submit for indexing**: GSC `sitemaps().submit()` + Indexing API
   `urlNotifications().publish(URL_UPDATED)` (creds `~/.config/searchconsole/credentials.json`, siteOwner on
   `https://kidsdomath.com/`). The sitemap is registry-driven so the URL is auto-included.
7. Analytics is automatic: the hub fires `game_open{game_id}` on card launch; `game_id` is a registered GA4
   custom dimension. Top Played fills in after ~24–48h ingestion (`scripts/top-games-report.py`).

## Build-time safety net

`scripts/normalize-games.mjs` runs in `prebuild` and injects, into every `public/games/*/index.html`
(idempotent, marker-guarded): `touch-action:manipulation`, diagnostics-hide, `#play`/`#facRight`
pointer-events, title `&nbsp;`→space, the `.koc-ready`/`.koc-cue` animation classes, the
**`/games/_shared/kdm-progress.js` script tag**, and the **`KDMProgress.played({completed})`/`({level})`
hooks** into standard `winGame()`/`next()` structures (all guarded by their own call/marker, so a game that
already has them — like the template — is untouched). So a freshly copied game gets progress reporting on
deploy even if it lacks it — but the template authors them into the source too, and run `pnpm normalize-games`
before committing so the repo matches the deploy.

`kdm-progress.js` also fires a best-effort `game_progress{game_id, level, completed}` event via
`window.gtag` if present — no per-game work needed. (A no-op on static game pages today; lights up if GA is
added there.)

## No-repeat contract (kdm-no-repeat v2)
Every generator call must stay wrapped in `window.__kdmFreshO(...)` (injected helper; rerolls until
the round differs from the previous). If your round object contains ANY per-round randomness that
isn't part of the question's identity (layout seeds, `token:Math.random()`, shuffled decoy order),
you MUST also set `qkey` — a stable string naming the question (e.g. `'sides:'+shape.name`,
`mode+':'+start+':'+dur`) — or the guard silently never rerolls and kids see the same question twice.

- **kdm-norepeat-stem v1 (2026-10-23)** wraps the generator: the qkey alone missed repeats when it carried incidental
  parts (the shuffled decoy set), so "Cat + new decoys" looked new. The wrapper compares the question STEM (round object
  minus choices, picks, qkey and random floats) and regenerates a back-to-back repeat (≤24 extra calls per round).
  Two-question levels keep a natural order (never 3 in a row) — strict no-repeat there forced A,B,A,B, which gives the
  answer away. The template ships it; consumers inject it with a retrofit + a `--check` in prebuild.

## Cross-app harvest — content integrity + i18n (2026-10-19, CDE + yoga-bits)

**Content integrity:**
- **NO invented social proof.** Generators MUST NOT write testimonials, quotes, ratings, or "X
  parents trust us" text. CI-grep for named-quote patterns (`testimonial`, "What Parents Say",
  `— Name X., City`). CDE had shipped 6 invented named parent/teacher quotes (EN + HE) since March —
  an FTC fake-review risk, and it directly undercuts a "no sign-up / trustworthy" positioning. (⚠ KDM
  `src/lib/i18n.js` ~L666–673 has the same Sarah/David/Rachel pattern — appears unrendered/dead, but
  owner's call to delete.)
- **Composite titles must check containment.** When a title/description template concatenates fields
  (`"{name} ({canonical})"`), SKIP the parenthetical when one field already contains the other —
  else you ship "Nadi Shodhana (Nadi Shodhana Pranayama)" across every locale for weeks (yoga-bits).

**i18n (any multi-locale site):**
- **ASCII-stripped locale files are a silent, title-level defect.** A locale validator must reject any
  Latin-with-diacritics language (de/es/fr/pt/it/nl…) whose file has implausibly few non-ASCII chars —
  AND run the same check on the UI string table (those strings feed every title/description). yoga-bits
  shipped "Anfanger"/"Respiracao"/"Debutant" across ~1,900 strings + 35 UI keys, uncaught for weeks.
- **English-leak heuristic for non-Latin locales.** In ja/ko/zh/hi files, any pure-ASCII value (beyond
  a whitelist of proper nouns/numbers) is an untranslated leak → fail the merge. Cheap; catches the
  most common worker failure.
- **Localized templates need language-aware fill.** Run `fill(s, vars, lang)`; for Korean, resolve
  hedged particles 은(는)/이(가)/을(를) by the batchim of the substituted value's last syllable (skip a
  trailing parenthetical). Workers emit the hedged form, which native readers flag instantly; the
  resolver is ~10 lines.
- **Native-review pass contract.** For ko/ja (any language with a reader), a second worker pass
  outputs ONLY changed entries, and an apply script enforces key set + array lengths + placeholder
  preservation — full-file reviewer rewrites reintroduce drift; diff-only + validator stays auto-merge-safe.
- **English-leak validators must be CASE-SENSITIVE for marker words** (yoga-bits, 2026-10-20): a
  case-insensitive "TODO" check false-positived on Spanish "todo" (= "all/every"). Match marker words
  (TODO/FIXME/English stopwords) case-sensitively, or whitelist the target-language homographs.
- **Diff the full expected SLUG LIST against the OUTPUTS, never trust worker reports** (yoga-bits): a
  slug dropped from a batch prompt was silently missing in all 3 languages; the workers reported
  success for what they DID do. Reconcile `expected_slugs − produced_slugs` after every batch.
- **Calibrate length gates PER LANGUAGE** (yoga-bits): ja runs ~25% longer per English word than ko,
  so a single CJK length divisor flags real ja translations as too-long. Set the acceptable
  length-ratio band per target language, not one global divisor.
- **A quiz distractor label must be the FULL distinguishing feature, not a shared sub-feature**
  (yoga-bits mudra quiz, 2026-10-20): Gyan and Chin mudra both "index + thumb" and differ only by palm
  direction — distractors labeled by the finger pair were indistinguishable (two "correct" options).
  Assert UNIQUENESS on the rendered option labels; if two options collapse to the same string, the
  label is describing a shared sub-feature, not the discriminator. (Text-only form of the §3b
  same-category-rivals-are-fatal rule.)
- **Strip `{placeholders}` before measuring script-share / length ratios** (yoga-bits, 2026-10-20): a
  zh FAQ answer with 6 `{placeholders}` failed the Han-character-ratio validator — the Latin-script
  placeholder tokens dragged the ratio down. Remove template tokens (and URLs, numbers, proper-noun
  whitelist) before computing any script-share or length metric on translated strings.
