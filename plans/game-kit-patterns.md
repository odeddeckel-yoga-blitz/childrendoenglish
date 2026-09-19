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
- **Image/media stalls**: a request can hang firing neither onload NOR onerror (stale-SW/network
  limbo). Every image-dependent UI needs: onerror retry-once (cache-busted) → fallback, PLUS a
  stall timeout (~7s) that forces the fallback. Fallback must keep the round PLAYABLE (word text,
  definition). Mirror loaded-state in a ref if a timer reads it (stale closures).
- **Asset integrity in CI**: a unit test asserting every referenced image exists on disk and is
  non-trivial (≥500b).
- **TTS**: speechSynthesis triple-guarded — feature-detect, voices-loaded, and
  `navigator.webdriver` skip (headless TTS can stall the main thread ~14s).
- **Stale-deploy chunks** (SPA hosts): error boundaries detect chunk-load failure signatures and
  reload once (sessionStorage guard).
- **PWA**: add game/battle routes to `navigateFallbackDenylist`; remember `prompt`-mode SW keeps
  old shells alive across deploys.

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

## 6. Multi-agent workflow rules
- One agent per game file; agents never touch sibling games or revert anything beyond
  build churn (`sw.js`, `version.json` ONLY — a `git checkout --` on a sibling's file once wiped
  an in-flight redesign).
- Agents report, the coordinating session commits (scoped `git add`).
- On transient API drops/stalls: resume-from-transcript with "re-read your files from disk first —
  trust the disk, not memory."

## 7. Consuming this kit
Each consumer repo carries `scripts/sync-game-kit.mjs` (copies kit files in, stamps
`.game-kit-version` with the kit commit) — run it after kit updates; CI or the script warns when
the local copy hash-drifts from the kit. The kit is canonical: fix bugs HERE first, then sync out.
Site-specific shared layers (arcade HUD, progress, beacons) stay in their repos but must honor the
contracts above.
