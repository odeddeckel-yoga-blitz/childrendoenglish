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

## 4. Robustness contracts (each was a shipped bug)
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

## 6. Multi-agent workflow rules
- One agent per game file; agents never touch sibling games or revert anything beyond
  build churn (`sw.js`, `version.json` ONLY — a `git checkout --` on a sibling's file once wiped
  an in-flight redesign).
- Agents report, the coordinating session commits (scoped `git add`).
- On transient API drops/stalls: resume-from-transcript with "re-read your files from disk first —
  trust the disk, not memory."
- **Write briefs and handoffs in Simplified Technical English (ASD-STE100 spirit)**: short
  sentences, one idea each, active voice, plain verbs, controlled vocabulary, no ambiguity. These
  are read under context-switching across many sessions — they must land in one pass. Lead with the
  task and the acceptance test; put the "why" in one line, not a paragraph. (Keep rich prose for
  genuine analysis/tradeoffs — STE is for instructions, not for thinking out loud.)

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
- **Vercel preview deployments are SSO-protected** (the Vercel MCP access-url tool 403s on scope) →
  verify on PRODUCTION ~40s after push, not on the preview URL.
