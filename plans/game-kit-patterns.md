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

## 3b-gate. Media gates: every clip is heard back, every answer image is the sole answer and licensed (CDE + yoga, 2026-11-04)
A file that exists is not a file that is right. CDE shipped `knight.mp3` (2026-09-22) and passed every "audio exists"
test, because nobody listened to the batch. A quiz image that reads as a same-round rival ("jungle" photo that reads
"house") gives the child two right answers. An image with no recorded licence is a takedown waiting to happen. Each site
runs two kit gates (`test/audio-gate.py`, `test/image-gate.mjs`) driven by one JSON config (`test/media-gates/<site>.json`):

- **Audio heard back.** Every clip for a word or phrase is transcribed locally (faster-whisper `small.en`, CPU int8,
  `vad_filter=False`, a neutral one-answer `initialPrompt`) and must match its intended text after normalisation.
  Tolerance is per site: CDE (English words) = exact, plus plurals, "contains" and a homophone list; yoga (Sanskrit) =
  ratio ≥ 0.85 with spaces ignored. A fuzzy pass still fails when the transcript is closer to another item's text.
  Rules: never `base.en` (deaf to sub-second clips); never put the expected text in the prompt; a flag is a candidate,
  so listen before re-rendering. **Run after every audio batch**, before the batch is committed.
- **Rivals = the site's real rounds.** The image gate derives each item's rivals from the site's own data: same category,
  the site's confusable groups, minus the pairs the site's distractor picker keeps apart (CDE `collides`, yoga
  `isImageTwin`). When the picker changes, the config's `rivals` must change with it.
- **Sole answer, two levels.** Always on, free: no missing or tiny files, no two items sharing one image, no near-copy of a
  rival's image (32×32 RGB distance ≤ 1.5). Greyscale dHash was tried and dropped: it called distinct emoji faces, colour
  swatches and number tiles twins. Pixel distance only catches **copies**. "A different picture that reads as the rival"
  needs the optional vision judge (`--judge`: `claude -p --model sonnet`, the bare alias, never a dated id). The judge
  sees the target and its rivals as an unlabelled, shuffled list (so it is never told the answer) and names every plausible
  option. A rival picked over the target = finding (sole-answer 0). The target picked with a rival also plausible =
  advisory (sole-answer 1, the improver's "prefer a better candidate"). Run it on new or changed images, not nightly on
  the whole catalogue.
- **Provenance is recorded at install time.** Whatever installs an image (an improver `pick`, a staging script, a
  generator) writes its manifest entry in the same step. Use a source tag the site accepts
  (`"gemini"` = AI-generated on the owner's account), or `{source, licence, author, url}` for third-party files. Missing,
  `legacy`, `unknown` or a CC-BY* entry with no author = finding. Backfilling later is archaeology: CDE's 530 Wikimedia and
  generated images have no record of which Commons file each came from.
- **Wiring.** Both gates exit 1 on a finding. Run the deterministic image gate in pre-push (about 2 s). Run the audio gate
  and `--judge` by hand after a media batch (minutes, local CPU or paid calls), and note the result in the commit's
  `Lesson:`/verification line.

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

## 3e. Persona standard — kids, teachers, parents on every site (UX audit 2026-10-30; owner GO)
Three people use these sites and each needs a different first move: the **child** wants to play, the **teacher** wants
to set up a class in under a minute, the **parent** wants to know "is it safe, free, and what do I pick?". The KDM
audit (`~/projects/shared/ux-audit-2026-10-30/kdm.md`) found an end screen with 13 actions + a toast for 3 audiences,
"Play" buttons that only scrolled, teacher menus in the kid's path, and four different game counts. These five rules
are the contract; each site builds against them. Checks: `test/persona-check.mjs` (P1/P2/P4 on game pages, phone size)
and `test/persona-counts.mjs` (P5, static) — run from the site root; both exit 1 on a breach.

- **P1 · End screen = ONE primary button.** The next step is picked by the result: a low score → retry the same
  content (or the easier step); a good score → the next game/lesson. Mark it `data-kdm-primary`. "Play again" is
  secondary. Everything else (harder mode, lightning round, more like this, popular, home) goes behind one
  "More choices" disclosure. Nothing may cover the primary: a site-wide toast/pill/banner hides while an end screen is
  open (KDM's "Nice! Next" toast covered the summary's buttons on phones). No game listed twice on one screen.
  *Check:* exactly one visible `[data-kdm-primary]` in the end screen, and `elementFromPoint` at its centre hits it.
- **P2 · Every Play/Start button starts play.** It opens the game (or the first question) in one tap — never a
  scroll-to, never an extra menu, never a language/grade question on a page that is already localized or graded.
  A list-jump is a secondary text link ("See all 24 games ↓"), not the green button. The big label says PLAY (▶);
  a themed verb may sit under it for flavour. Mark it `data-kdm-play`.
  *Check:* tapping the menu's play button puts `Game.screen` on 'play' within 2 s without just scrolling.
- **P3 · Teacher front door.** A "Teachers" link in the header/nav and on the home page (a one-line
  "Teacher? → · Parent? →" strip is enough) leads to ONE teacher page whose first screen shows **≤ 3 big actions**
  (e.g. start a class battle · make a set/choice board · "safe for school" to forward to IT). Essays go below.
  Every page has the same header with a way home — including tool pages (/live, /join, safe-for-school).
- **P4 · Kid screens stay adult-free.** Teacher/parent items — class codes, "show your teacher" work codes, Class
  Battle cards, "Use in class", share-to-Classroom — are **not shown in the kid play path** (game menu, play screen,
  end screen, the kids' hub) unless the child arrived from a teacher link (a set/battle link or `?class=1`), or they sit
  behind one small "For grown-ups" disclosure. Mark such elements `data-kdm-audience="teacher"` so the check can see
  them. Grown-up prompts on kid screens must read as a person wrote them (no "one one more one less problem").
  *Check:* no visible `[data-kdm-audience=teacher]` on menu/play/end without a teacher arrival.
- **P5 · One name and one count per thing, from one data source.** One label for "home" (KDM: "🏠 All games") on
  pills, summaries, toasts and headers. One grade scheme and one difficulty scheme site-wide. Catalogue counts come
  from the registry through one shared rounding helper ("500+ math & science games") — never typed into a page.
  Zero-value stats are hidden, not shown as "0 flawless".
  *Check:* `persona-counts.mjs` flags string literals with a number next to a catalogue noun (comments and
  `persona-ok` lines pass).

Adoption order that worked for KDM: P1 toast fix (1 h, visible bug) → P1 end screen → P2 Play buttons → P4 markers →
P3 teacher page → P5 counts. Calibrate `persona-check` on one known-bad page before trusting a green run.

## 3f. Page-quality standard — "does it look professional?" (KDM + CDE + yoga reviews, 2026-11-08; owner GO)
The owner judged the home, game entry and listing pages of KDM, then every page type of CDE and yoga-bits. Each review
used site data, research, two rounds with Gemini and the personas. The same faults showed up on all three sites, and
the pages that already worked shared one shape. These rules apply to every NEW page, template, home, landing and
game entry page. They also apply to any existing page a session touches.
Sources: site-factory/briefs/{kdm-home-review,kdm-game-page-review,kdm-pages-triage,cde-pages-triage,yoga-pages-triage}/
Review artifacts:
- KDM: home 9SERd2keFAtGYH7ix3Txm2, game page SgeXyfPKuwZkLgvuvomRcS, page families FkjsFWb8Gjr7VQ2dqTTmGi;
- CDE: 2kRuRcG41hXWfur7erizc9;
- yoga: Buqq6gCy7xMuSTTJfmKgZw.

**Q1 · One clear action on the first screen.** Measure at 390×844 and 1366×**668**. A real Chromebook shows about
100 px less than 768.
- Every page's main action (PLAY, the mini-quiz, Start, a game card) is visible without scrolling.
- Measured: what worked on every site had this, and what failed buried it:
  - worked: CDE hub 60% → game, in-game first tap 80%;
  - failed: CDE word-page quiz at y≈1,140 (97% left with no tap); Spanish play link at y 8,868; yoga quiz above the how-to.
- Text, FAQ, SEO paragraphs and "for parents" go BELOW the first action.

**Q2 · Answer the search first, then invite play.** A content page (word, pose, topic) shows what was searched in
the first screen: picture + name + pronunciation/one audio + the first step or definition. A widget about OTHER
items goes after it (yoga: 5.4% answered a quiz placed above the steps).

**Q3 · Say it once.** No banner that repeats the card under it. No description written three times. One audio
control per item. Templated sentences shared by >10 pages get rewritten per item. Google's spam policy names
cookie-cutter pages:
- CDE 530 word pages: banner = card, at 0.10% CTR;
- KDM: description written 3×;
- yoga: 35–38 FAQs sharing sentences.

**Q4 · Use the screen.** No phone-width column centred on a laptop or Chromebook for a HOME, LISTING or STUDY page.
- At ≥1024 px use the width: a game grid of 4 columns at ~285 px (KDM, measured: 3 fit too few, 5–7 shrink the
  screenshot below ~85 px), or a 2-column hero.
- In-game play may stay centred.
- The owner called the phone-card look "unprofessional" on all three sites.

**Q5 · Show the product.** Cards and heroes use a real screenshot of the game/app (KDM card-shots, CDE hub), not an
emoji or a stock icon. Landing pages show a picture of the product before any paragraph. Gemini's "ghost town" read
appeared on every page that had none.

**Q6 · One design system per site.**
- One page frame (header, width, footer) shared by app, content and tool pages. Yoga app vs Astro and the CDE
  banner vs app vs flashcard maker read as different sites.
- ONE primary button colour; secondary actions are outline or text.
- One icon family. No emoji as UI chrome next to drawn icons; flags are not language labels.
- Contrast ≥4.5:1 on every text token, measured. KDM teal 1.79:1 and CDE grey labels 2.4:1 went unseen for weeks;
  recurring `a11y-scan` covers it.
- The phone nav is ONE row (≤64 px, a menu button). Yoga's wrapped to 3 rows / ~230 px on every page.
- No sticky full-width bars on laptop.

**Q7 · A localized page is localized everywhere.**
- `<html lang>` and `dir` match the page. Every string comes from i18n: H1, nav, breadcrumb, buttons, TOC headings,
  tags, footer.
- Mixed-language runs use `<bdi>`/`dir=ltr`.
- Language switch = language names in their own script ("עברית · Español"), never codes or flags.
- Found: CDE Spanish pages `lang=en` with an English H1 and buttons; the CDE hub all English for Hebrew users (its
  largest audience); yoga's 325 locale posts with English "Contents"/tags; CDE Band I bidi garbling.
- Add an RTL render test that fails on garbling.

**Q8 · Copy a person would write.**
- Generated copy needs grammar tests: a/an ("is a adjective" was on 228 CDE pages).
- No count typed by hand. Every "N games/words" comes from what the page actually renders (P5): 488 vs 530,
  "Five games" vs 17, registry 15 vs hub 17.

**Q9 · Trust lines are verifiable or absent.**
- No "open-source" for a private repo; no "real photos" on drawn/emoji images (the claim follows image-style per item).
- No "no tracking" while analytics run; say what runs ("no personal data, cookieless analytics").
- No "Common Core aligned" without per-item codes; no native-speaker claims for TTS ("computer voice").
- No invented reviewers or credentials. A named real person + method + sources + contact on /about.
- Health-adjacent: hedge benefits (ASA 2024: relaxation/tension/well-being OK; no medical or breathing-condition claims).

**Q10 · The teacher has a door, not a gate.** A visible "Teachers" link on the home page and in the nav leads to
one /teachers page with ≤3 big actions first (P3). No "Grown-ups" gate, no "Teacher mode" toggle, no flip cards or
tabs that hide text (crawlers and AI read visible text). NN/g: no horizontal carousels for young kids.

**How to run a page-quality review** (each step was needed at least once):
1. **Site triage**: every page type × count × bot-filtered visitors (exclude no-referrer crawler countries: CDE
   Singapore was ~50% of WA, yoga China ~25%) × search × next-step rate × no-tap rate × language. Screenshots at both
   folds. A ranked shortlist by traffic × how bad.
2. **Research** (web only) + Factory's own look.
3. **Gemini, two rounds.** Round 1 critique; round 2 = the real data + objections. Round 1 always guessed metrics and
   proposed text-hiding patterns (flip cards, tabs, gates) that it withdrew after the challenge.
4. **Measure before changing**: add "action seen" + "stayed 15 s" signals. Fix beacon bugs first; CDE found a
   double-loaded beacon and a var collision that voided the old baselines.
5. **Mockups → owner OK → build on HALF of a page family** (deterministic split, logged), the other half as control.
   Judge as difference in differences (see LESSONS 11-08 entry-B). Use 2–4 school weeks with a GSC/Bing-AI guardrail.
6. **One visible change per page family per read window.** Bug fixes (lang, bidi, grammar, false claims) ship first,
   on their own, judged by CTR. Don't push into a running read (CDE waited for the 11-14 title holdout).

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
- **PWA = allowlist, never a denylist** (CDE 2026-10-30; yoga had the same bug). With
  vite-plugin-pwa, set `navigateFallbackAllowlist` to the app's OWN routes only, built from the
  same source the host uses (CDE: `sw-routes.js` reads vercel.json `rewrites` → `/` +
  `/play`, `/today`…), plus a unit test that static sections are NOT matched. A
  `navigateFallbackDenylist` silently rots: every static section added later (CDE /games/ /units/
  /band-1/ /es/ …; yoga /mudras/ /chair-yoga/ /ytt/) was served the APP SHELL to anyone who had
  the SW installed. That means returning visitors, so first-visit tests and SEO crawls never see
  it. Check: load `/` until the SW controls the page, then navigate to each static
  section and assert its own `<title>`. A network-first navigation SW (KDM `public/sw.js`,
  offline page only when offline) is not affected. Also remember that a `prompt`-mode SW
  keeps old shells alive across deploys.
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

- **Big media: a round can be NOT READY — expose `Line.dbg.busy`** (KDM real-or-ai 2026-10-29: ~2 MB photo pairs that may
  not be re-encoded). While the picture loads: hide the answer controls and CHECK, show a spinner card, ignore
  `commit()`, and after ~20 s (or a failed load) offer "⟳ Try another picture"; time it with `setInterval`, since
  the harness fast-forwards `setTimeout`. Load BOTH sides of a real/fake pair before showing either (load time
  must not hint the answer), preload only the next round, and pre-draw the first round while the menu shows.
  `dbg.busy` is true until the round is playable, and playthrough, kid-sim, capture and playtest all wait on it.
  Without it, every tool judged the loading frame: "blank picture" vision findings, a careful kid-sim stuck
  at 1 commit, playthrough failing "did not reach win".
- **Scrolling side panels: `#facRight>*{flex-shrink:0}` and a sticky commit button** (same game). In a flex-column
  panel with `overflow:auto`, a multi-line feedback box shrinks to its `min-height` and its text spills over
  CHECK. On phones, the answer feedback plus CHECK fell below the fold once an "investigate" box opened. Make
  CHECK `position:sticky;bottom:…` and scroll the panel to the feedback after each answer. Verify with a
  click-level phone run, not dbg: the API tester never scrolls.

- **Time is seconds, never layout pixels** (KDM venn-voyage 2026-11-02: unplayable on most phones). A falling item's
  speed was `(contactY − spawnY) / 7.5 s`; on a 390×664 phone the lane between spawn and contact was 0 px, so every item
  "timed out" the moment it appeared, and at 320×568 the lane was negative. Desktop was fine, so no desktop test saw it.
  Drive timed things by a fraction of their lifetime (`f += dt / life`) and map the fraction onto whatever space exists;
  clamp any layout-derived distance with `Math.max(0, …)` and give it a floor.
- **Boards and maps scale to the width** (KDM fraction-propulsion star map 2026-11-02): fixed 96-px nodes laid out in
  columns overlapped on a 390-px phone ("YOU" on top of a sector). Size nodes from `(W − margins) / cols`, with a
  minimum tap size (≥ 44 px) and font sizes from the node size; check 320 px.
- **The CHECK label fits on one line at 320 px** (KDM expression-lab "✅ GO — LOG THE ANSWER" wrapped and pushed itself
  below the fold). Budget ≈ 14 characters including the emoji; long labels go in the status line.
- **A tap target is ≥ 32 px in both directions on a phone** (KDM hundred-chart-hunt: chart rows were 21 px tall at
  390 px — a finger lands on the row above; real-input run 11-02). Grids that can't fit give the board more height on
  narrow screens rather than shrinking rows.
- **A miss-triggered helper describes the round ON SCREEN** (KDM cash-register 2026-11-09). Arcade games move on after a
  miss, but `showDrone(o)` ran only inside `miss()`, so the helper kept quoting the missed customer's goal ("🎯 40¢" for
  a 75¢ order) until the next correct serve. Its build advice said "keep adding coins" after an overshoot. Rule:
  re-render (or hide) the helper wherever a new round starts, and phrase it for both directions (too little → add,
  too much → take one out). Gate: `tools/game-review/hint-stale-probe.mjs` (KDM) fails when a visible helper still
  quotes the missed round's numbers after the round changes. On 11-09 it flagged prime-factory, pie-lab and
  true-false-circuit.

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

13. **Tap-reach: can a real finger reach every control, round after round, on a SMALL phone?** (KDM 2026-10-30,
    `test/tap-reach.mjs`; found by the owner's own Real or AI? playthrough, which every dbg-driven gate had passed). The
    harness drives games through `Line.dbg` — it never taps, so it can't see a control a child can't reach. Checks the
    PLAY screen at 320×568 and 390×664 (VISIBLE area, browser bars excluded — full-screen sizes hid the bug), level 1 AND
    the top level, round 1 AND round 2 (stale panel scroll only shows after a round). Each visible enabled control must be
    on screen, inside its scroller's visible box, and be what `elementFromPoint` hits at its centre; nothing is scrolled
    for the child. Primary button blocked or a control covered/clipped = exit 1; "scroll to reach" is soft. Also reports
    page errors at phone sizes (error-smoke runs one desktop size; a short canvas made a negative `arc()` radius).
    Calibrated on the bad version before trusting it. A game it never got into (no `Game.start`, load failed) is
    reported NOT CHECKED and fails the run — other sites need an adapter (CDE wrote one: real taps menu → r1 → r2). KDM catalogue (508 games): 1 primary + 16 covered/clipped + 259
    CHECK-below-the-fold → fixed with `kdm-pinned-act` (phones: controls in a scroll box, CHECK pinned below it, box
    scrolls to top each round; a 7% "tap here" scale pulse clipped inside the box → pulse brightness instead) and a 46px
    strip under the fixed "← Games" pill. Lesson: **a scroller must reset per round, a sticky button must never sit ON
    TOP of controls, and anything fixed (back pill, toasts) needs its own strip on short screens.**

14. **Presolved deals: does a round ever START solved?** (KDM 2026-10-30, `tools/game-review/presolved-probe.mjs`; found
    when kid-sim's careful persona stalled on clock-climb, whose hands start at 12:00 and 1 round in 12 asked for 12:00).
    Deal 20 rounds per level via `Line.build(L)` and count `Line.dbg.solved()` at deal. A ready/early-tap guard that lets
    a commit through when `solved()` is true does NOT catch this — CHECK untouched simply wins. KDM catalogue: 16 hits.
    Fixes, by shape — and never one that makes the START an oracle ("the start is always wrong" names the answer when
    there are two): **dial/stepper** → start on a neutral value that is never an answer (estimate-quantity-quay's
    closer/farther marker starts ON the midpoint, nim-nook's take starts at 0 = "nothing chosen", and CHECK with
    nothing chosen is a nudge, not a miss); **target vs start** → never target the start (temp-trek, clock-climb);
    **drop/aim arcades** → slide the spawn/launcher off a scoring spot, never once the child has aimed (a few deals keep
    every spot scoring — fine, no wrong answer exists). Triage first: a round whose answer IS "nothing to do"
    (already simplest, no line of symmetry, already a function, a safe hop) is a real question — allowlist it with the
    reason, don't "fix" it.
15. **Tools that drive a browser need a per-item hang cap and a progress line.** A kid-sim run hung silently for 4 h
    (38 s CPU) on one game; it now races each play against a cap (6 min, 9 for the slow persona), marks it `hung`,
    closes that context and moves on, printing `n/N id` to stderr. A probe with no progress output is
    indistinguishable from a probe that's working.
16. **Generated multiple choice: fuzz the option LENGTHS, not just the answer slot.** KDM spot-the-mistake (R2K1):
    8,000 generated cards showed the correct diagnosis was the LONGEST option 100% of the time in two games and 0% in
    another — a child picks by length. Fix: several phrasings of the right answer at different lengths, chosen so it is
    longest about 1 time in N options; gate on the measured rate (~33% for 3 options), not on inspection.
17. **Test hooks must take the same path as play.** `Line.build` calling the raw generator (not the no-repeat
    guard real play uses) made repeat-probe flag 5 KDM games for repeats children never saw — and would equally hide a
    real one. Route the hook through the same wrapper; scan the catalogue when one game shows it. Likewise a
    `Line.dbg.o` GETTER returns a fresh object per read: harness "same round?" checks must fall back to `qkey`, not
    identity (kid-sim saw a new round every tick in reaction-lab and never pressed DROP).
18. **Calm mode (pressure timers off) is one gate per timer line** — `if(!window.KDM_CALM) x+=dt…` plus the speed bonus
    (`fast=…&&!KDM_CALM`), a shared script that defaults ON for the youngest grades (`data-grade-lo ≤ 2`) with a menu
    switch, and a state hook (`window.__kdmCalm`). Don't gate games where motion IS the game (lanes, snakes) or where
    the timer is the skill being practised (a times-tables check). KDM R2K24, 16 K–2 games, 2026-10-30.
19. **Correctness sweep: is there exactly ONE right answer, computed independently, and nothing that gives it away?**
    (KDM 2026-10-31, `test/correctness-sweep.mjs` + `test/science-judge.mjs`; 508 games, 32.5K rounds.) Deal every
    level many times via `Line.build`; recompute arithmetic from the round's own numbers (flag only PARTIAL mismatch —
    equation games reuse a/b with other meanings); check duplicates, exactly-one-correct (the answer may be a VALUE, an
    INDEX into the options, or a theta/target), and giveaways over ≥ 16 rounds (fixed slot, longest/shortest label,
    middle/min-max number). Run solvability in a SECOND pass on fresh deals (a solved belt round's state leaks into the
    next deal) and commit staged answers for stage→commit games. Science content can't be checked by code: dump the
    rounds and have a model judge each stated answer (`science-judge.mjs`, CLI tier alias) — verdicts are LEADS, a
    person reads them before a game changes. KDM found: 9 science games where the right option was always the
    longest/shortest, a duplicate option from a generator bug, and a camel 'water-storing hump' (it stores fat).
    Calibrate first: 7 of the first 21 hits were the checker's own matcher (index answers), not the games.
20. **Endless games that boot into play** mark `<body data-kdm-endless>`; persona-check then reports P1/P2 n/a.
21. **After a WRONG answer on a phone, can the child see why?** (KDM 2026-10-31, `test/feedback-visible.mjs`.) A pinned
    button + scrolling controls box (kdm-pinned-act) hid #statusLine — the only line that says WHY — below the box's
    visible part or under the button; at 320×568 it was below the screen. 257 of 507 KDM games; number-detective kept 65%
    of triers on level 1 and nobody ever saw a reason. Probe: make a REAL miss (commit a staged wrong answer — many
    wrongForTest hooks only stage), then require the line in the viewport, inside every scroll ancestor, not covered (sample
    the TEXT rect, not the box: a pill over a full-width line's edge covers no words). Fix once, shared: mirror the line's
    text in a non-interactive bubble above the main button when it is hidden right after a miss shake or a red message.
22. **Engagement diagnosis: COUNT, then LOOK, on a phone with real taps.** Six KDM 'stuck on level 1' games (10-31): not one
    was workload. Causes found: a board that LOOKS tappable but ignores taps; the answer button below the fold; the clue as
    the faintest text; jargon names with no meaning; a demo finger hovering over the most tempting WRONG option; an
    unfinished CHECK counted as a miss; a menu promising ants that calm mode freezes; first-play coach pointing at a hidden
    button. Every one was invisible to the dbg-driven gates — screenshots at 390×664 found them.
23. **Predict-observe-explain: after a WRONG prediction, is NEXT on screen?** (KDM 2026-10-31, `test/poe-next-visible.mjs`.)
    The shared "✓ It was … — <rule>" explain line pushed NEXT below the fold; real players (no auto-advance) sat at ⭐1/3.
    44 of 200 KDM science games. Probe as a real player (navigator.webdriver=false): wrongForTest → wait for phase
    'explain' → NEXT inside the viewport and hit by a tap at its centre. Fix once, shared: the reveal keeps NEXT pinned
    and puts the explanation above it in a capped, scrolling card. Tolerance: bottom == innerHeight is on screen (+0.5px).
24. **A shared phone-layout script must not run ONCE at parse time.** kdm-pinned-act checked `matchMedia` before layout
    settled; ~1 in 8 fresh loads at 320×568 got no pinned box and CHECK landed off screen. Run the setup idempotently
    and retry on load, 250 ms, 1 s and resize until it applies. Measure fresh loads in a loop (24/24), not one load.
25. **Every answer option on screen BEFORE the pick.** (KDM 2026-10-31, tap-reach "below the fold only".) 173 of 200 science
    games showed 1–2 of 3–4 cards on a phone; the rest sat in a scroll box under a mostly empty picture — a child saw one
    card, often the wrong one. Fix once, shared (kdm-poe-fit): per round, before paint, hide the duplicate heading, compact
    the cards, then shrink the picture in steps (46 → 42 → 38 %, never less) until cards + LOCK IN fit; restore the picture
    when the experiment runs. Treat "below the fold only" on OPTIONS as a defect, not a soft warning.
26. **Check every LINE of a message, not its centre.** A two-line miss reason passed with its centre visible while line 2
    wrapped under the pinned button (70 KDM games). Probe and fix both use Range.getClientRects() per line, and the
    mirror rechecks at 1 s (a panel can reflow after the first check).

27. **Play every level with real taps, on real engines, on 4 screens — not dbg** (KDM 2026-11-02 real-tap sweep, 446
    games). `test/real-tap-levels.mjs` stages the answer through dbg but TAPS the real CHECK and NEXT, level after level:
    views `phone` (iPhone 13), `se` (iPhone SE on **WebKit** = Safari's engine), `android` (Galaxy S8), `desktop`, and
    `chromebook` (1366×768, CPU slowed 4× — a school laptop; run it on every timed game). `--levels=all`. Found: a game
    unplayable on phones (§4 "time in seconds"), a star map overlapping on phones, CHECK below the fold at L2/L3 only.
    Runner traps that each produced hundreds of false flags (build any new runner around them): CHECK is disabled
    during the ~1 s feedback beat (wait, don't tap); a game that auto-advances once staged makes the tap miss (flag only
    if nothing moved); a solve can change neither `made` nor `o` (compare a coarse state signature); `#actBtn` can be a
    helper (TURN PIECE) or a 2-px placeholder (the answer tap commits); **`offsetParent` is null for a `position:fixed`
    CHECK** — use `checkVisibility()`; a ready-pulse scales CHECK a few px past the edge (8 px tolerance).
28. **Messy-kid probes** (`test/messy-kid.mjs`, phone): wrong→right, CHECK double-tapped 90 ms apart (counted twice?
    level skipped? judged as a miss on the next round?), 5 taps during the feedback beat, tab frozen 10 s and resumed,
    turned sideways and back, 20 s of random taps. After each, a correct answer + CHECK must still move the game on.
29. **Real input, no dbg shortcut, on the top-traffic games** (`test/real-input-levels.mjs` + a per-game driver that may
    READ the round but enters the answer only with taps/drags/keys; the runner lints drivers for solveForTest/commit/
    dispatchEvent). Drags on the phone go through real touch events (CDP), not the mouse. This is the only gate that
    sees a hidden extra step (graph-tricks) or a target too small for a finger; staging through dbg hides both.
30. **tap-reach checks EVERY level (≤9), and a CHECK that needs scrolling is a hard fail.** L1 + Lmax missed three games
    whose controls grew at L2/L3 (§4 "Fit check = every level" said so since 10-11; the gate didn't).

31. **A commit with nothing chosen is never right** (KDM 2026-11-02: pattern-parade, angle-aim, shape-sort-shack had
    `commit(){ resolve(O.ans) }` — a harness helper — bound to Enter/Space; a child pressing Enter 3× cleared level 1).
    `commit()` judges the child's own pick (`if (O.picked != null) resolve(O.picked)`), never the answer; keys choose an
    option, they don't answer. Gate: `blank-commit-probe.mjs` (Enter, Space, visible CHECK on fresh L1–L3 rounds; fails if
    one wins every time). Found only by a real-input run: every dbg gate stages an answer before committing.

32. **Content that grows DURING a round must not push CHECK away** (KDM 2026-11-02: expression-lab's work log adds a row
    per real step; by step 4 GO sat below a 375×667 screen). Staged-answer gates (tap-reach, harness) never grow it, so
    they passed. Creator: CHECK pinned on phones (template default since 1.51.0) or the growing list scrolls inside a
    capped box. Tester: `real-tap-levels.mjs --serve --gate --levels=all --views=se,android` on every changed game
    before a push (passing games are stamped by file hash; pre-push only checks the stamps with `--check-stamps` —
    browsers inside pre-push held the GitHub connection open until it dropped). A flagged game is re-run alone and only
    a repeat counts (one missed tap under load blocked a push on 11-02).

34. **A move the game TEACHES is never scored as a miss** (KDM 2026-11-02, deep-sea-vector-salvage: the mine levels say
    "move one axis at a time", but `correct = vec === need` judged leg 1 against the whole vector → shake, "OFF BY", a
    miss and the struggle scaffold for doing exactly what it said). A taught multi-step route gives step credit
    ("✅ Leg 1 done"). And `solveForTest()` must play the route a child would (around the mine): its straight shot bounced
    for ever, so levels 5–6 were never reached by ANY gate. An endless last level exposes `Game.MAX` so a runner knows
    it reached the end.

35. **`#actBtn` is the commit — an answer option parked there says so** (KDM 2026-11-02, price-detective: from L7 `#actBtn`
    is the "✔ ALL CORRECT" stamp; every tool tapped it as CHECK after staging the guilty row, so it answered "clean" and
    L7 never cleared in the runner). Such a button gets `data-kdm-role="answer"`; real-tap-levels, messy-kid and
    blank-commit-probe then commit through the contract instead. Catalogue check: 495/502 `#actBtn` call `Line.commit()`;
    lock/seal/forge/engage are commits under another name, tangram-harbor's is a helper (noted by the runner).

36. **A test helper never lifts the game's commit lock** (KDM 2026-11-02, circuit-lemmings + mirror-breakout:
    `solveForTest(){ … locked=false }`. Called by a runner during the 2.3 s level-end wait, it re-armed GO; a second
    `roundClear` was queued and NEXT bounced from the win screen back to the result card — ~half of all runs, on every
    view). Helpers start with `if (locked) return;` (or `settle()` the in-flight move first) and `dbg.busy` exposes the
    lock so tools wait. Gate: KDM `contract-lint` rule `helper-unlock`. A flaky "NEXT did nothing" is worth tracing: here
    the flake was the tool's own hook.

37. **A double tap answers once** (KDM 2026-11-02 messy-kid: fraction-stack, prime-asteroids, ratio-pop — the 2nd tap
    of a quick double tap landed on the NEXT round, which appears at once, and the child got a red "❌" for a move they
    never made). The template carries `kdm-tapguard v1` (a 2nd click on a committing `#actBtn` within 400 ms is dropped,
    capture phase); KDM injects it into every game via normalize-games. Tester: messy-kid double-tap probe (the 1st tap
    must have scored; a red line must SAY wrong — colour alone is not a verdict).

38. **The answer key agrees with the TRUE value, not only the method's estimate** (KDM 2026-11-03 answer-check,
    fraction-estimation-cove: "is the robot's claim reasonable?" was judged only against the benchmark estimate; 3/8 + 6/7
    rounds to 1½, so "≈ 1¾" passed although the real sum is 1.23 — 22 of 100 such rounds had a wrong or borderline key).
    A judged claim is "yes" only when near both the estimate and the true value, "no" only when far from both; draw again
    otherwise. Tester: `answer-check` (a text judge rules each staged answer; a SCORED round judged wrong is the
    finding), plus a per-game fuzz of the round generator when the key is a rule.

39. **The prompt and the miss line fit EVERY round a level deals** (KDM 2026-11-03 struggle-replay + answer-check:
    price-detective L5–6 said "breaks its shelf tag" on rounds whose error was the line's math; bar-graph-builder's
    "how many MORE" miss said "count higher up the bar"; capacity-canyon said "change L into mL" when both were mL;
    shape-sort-shack's "count the sides" can't split square from rectangle; temp-trek cited 20° on a scale that marks
    −20/0/40). Text keyed by level band must be checked against each mode that band can deal; a miss line names the
    step that fixes THIS round. Tester: `struggle-replay` (replay the level real players quit on, wrong twice, vision
    judge + a human read of the frames).

40. **A canvas layout budgets the gaps, not just the item size** (KDM 2026-11-03, doubles-dash: the dot radius was
    capped by `width / (2·cols)` while each group also needs ½r gaps and a 1.4r centre margin, so the outer dot of each
    group sat half off a 390 px phone — "3 + 3" showed 2½ a side). Compute the cap from the full row width. Reveal text
    that has no room under its labels moves (or becomes the sign between them) — never clamp it onto them.
    Tester: `edge-clip-probe` (strongly coloured pixels in the canvas's outer columns; scenery drawn to the edge on
    purpose also lights up — read the frame).

41. **Storage can throw — every localStorage/sessionStorage touch is guarded** (KDM 2026-11-03 env-probe,
    deep-sea-vector-salvage: four bare `localStorage.getItem` calls → the game never loaded where storage is blocked:
    cookies off, a locked-down school profile, some embedded frames). Tester: `env-probe` (plain, LMS iframe,
    storage-throws, 125/150 % zoom, slow Wi-Fi, shared scripts missing; a setting is flagged only when plain passes).
    Catalogue: 1 of 511.

42. **Shared overlays never sit on the controls a retry needs** (KDM 2026-11-03 struggle-replay: the miss bubble
    (kdm-feedback-mirror) floated just above CHECK — over the last row of answers in doubles-dash, bond-breaker,
    place-value-blocks-bay, capacity-canyon; and the pinned controls box hid answers below its fold with no sign).
    Bubble v1.4 sits at the top of the controls panel (its title/how-to text) and hides on the next touch; pinned-act
    v2.2 shows a "▾ more" chip while a CONTROL is below the fold. Tester: `feedback-visible` `bubble-covers` (old 4/4
    flagged → new 0/4). A test hook that already commits (wrongForTest) must not be followed by a second CHECK in a
    runner — it reads as the game saying "set your answer first" (struggle-replay false positives, 3 games).
43. **A phone fit never hides the round's question** (KDM 2026-11-03: kdm-poe-fit v1 hid `#panelHead` on phones on the
    assumption the HUD asks the same; in 146 of 200 science games it held round-specific words shown nowhere else —
    reduce-reuse-recycle showed a can and "which R?" with no action). Compact a panel head before hiding it; hide it only
    when every non-generic word is visible elsewhere. Anything a round needs to be answered lives outside a hideable
    heading. Keeping the question costs room: pay with the picture, not the answers (kept head → picture 33 → 29 % at
    320×568; without that, 117 games' cards fell below the fold). Testers: `poe-question-visible` (320×568 + 390×664)
    AND `tap-reach` on the same games — each fix alone passes its own gate and fails the other's.
44. **Every input a round needs is on screen at round start on a 320×568 phone, not only CHECK** (KDM 2026-11-03:
    factor-dig's 💨 PRIME chip and number-line-jumps' −1/+1 row sat below the fold behind the pinned button; a pre-reader
    saw one button). Order the phone panel status → inputs → teach text. "▾ more" is a fallback, not a layout.
    Tester: `tap-reach --inputs` (round 1 at 320×568: any input needing a scroll is a finding; it also caught
    number-line-jumps' +10 wrapping to a 2nd row on the ±10 levels after the first fix).
45. **A later level never marks wrong what an earlier level taught, and the picture never pre-draws the asked
    direction** (KDM 2026-11-03 growing-toward-light: L1 taught "shoots bend toward a side light", L2 kept a side light
    and marked "sideways" wrong, while the predict frame already showed the upright shoot). Check each mode's reveal
    against every other mode's answer; before a direction prediction draw only the start state.
46. **A skill ladder ramps each new sub-skill, easiest first** (KDM 2026-11-03 count-by-cove: 5s arrived at L2 before
    10s, opening on 20,25,30,?). The first round of a new step starts at the step itself (10,20,30,?).
47. **Miss text: first miss names the strategy, second gives the answer and why; one fixed "count again!" for every
    miss is a defect** (KDM 2026-11-03 add-attack; contract-lint `lone-miss`, advisory). Name controls by their on-screen label ("+1"), never a look-alike
    emoji (➕ rendered grey), and no low-contrast symbol emoji (➖) as a choice icon on dark themes.
48. **A level generator must have more than one output** (KDM 2026-11-03 what-is-a-wave: `LEVELS[0]=()=>genIsWave(true)`
    always returned the rope; the no-repeat guard can't help a constant). Fuzz each level ~20× and require ≥3 distinct
    rounds where the pool allows. Tester: `test/gen-fuzz.mjs` (6 dbg rounds per level; a constant level fails).
49. **A round's heading never names the answer** (KDM 2026-11-03 terminal-velocity L2: head "⚖️ Balance the forces",
    the right card the only ⚖️ one and worded "(balanced)"). Head = the question's topic ("Forces at top speed"), never
    the result; no head icon that the right card shares (blocking) and no head word only it shares (advisory). The sweep
    found 72 of 200 science games heading the round with the right card's icon (🔄 / 🔋 / 🌍): KDM strips shared icons
    from the heading in PREDICT (kdm-poe-headicon v1). Tester: `test/head-oracle.mjs`.
50. **A toast sits over the card that raised it, not the window centre** (KDM 2026-11-03 measure-meadow: the clean-quota
    toast, centred on 1280 px, covered the side panel's answer buttons and result line). Words a 5-year-old reads.
51. **A phone fit may shrink the picture only while the scene still fits in it** (KDM 2026-11-04: the science fit's
    42/38/33/29 % steps ran 88 of 200 scenes off the bottom at 320×568 — animal-migration's scene gone, food-chain's
    Sun → algae → fish row halved — and 20 at 390×664; the first math fit cropped 46 of 78, clock-climb's clock among
    them). Games size scenes from the WIDTH or fixed minimums, so a shorter box crops instead of re-laying out. Guard
    at runtime: learn the canvas's bottom-edge ink at full size, and after each picture step back off if it rose.
    Every gate passed while the scene was cut (tap-reach, question-visible, playthrough): a fit needs its own crop
    tester. Tester: `test/fit-clip.mjs` (fit on vs off, bottom-edge ink). Shared: KDM kdm-poe-fit v3.4, kdm-phone-fit v1.1.
52. **A helper's claim is re-checked as the board changes** (KDM 2026-11-04 number-sudoku: "the left column is missing
    just one number" stayed up after the child filled it and after the solve — the hint went false). Re-word on every
    refresh (no extra scaffold count, no cursor jump); hide it once the round is solved. A toast about the LAST round
    leaves when the next round starts (≥1.8 s readable) and speaks in the past tense ("You got that one!").
53. **Distractors carry no tell-tale qualifier, and the scene carries no card's icon** (KDM 2026-11-04 animal-migration:
    "Pet dog" / "Pet turtle" vs "Monarch" — the word "Pet" ruled them out; the scene band "☀️ WARM GROUNDS · food 🍃"
    showed the two right reasons' icons). Name every option the same way; scene labels in PREDICT are words only.
    head-oracle covers DOM headings; canvas labels need the vision review (a static scan can't tell PREDICT from reveal).
54. **Every word in an instruction names something on screen** (KDM 2026-11-04 gene-squadron: "Move under the diver" —
    "diver" was the Galaga term for the diving ship; the child saw a glowing ship). Use what the child sees.
55. **The optimizer read covers the whole path, not just in-game depth** (owner 11-04: the ~Oct 28 game-flow read never
    happened; page→game rates were a monthly eyeball). Every site's optimizer carries the standing sections in
    infra/optimizer-pattern.md — movement between games, site pages → games, in-game controls, errors × bounce, AI
    referrals — each from aggregate tallies only, and each listed in recurring.json so due.mjs brings it up.

56. **A shared script's change runs that script's catalogue gates before it ships** (KDM 2026-11-04: the science phone
    fit cropped 88 scenes and went live twice, 10-31 and 11-03, with every gate green — the pre-push probes only run on
    game FILES a commit touches, and a shared script touches none). Map each shared script to the classes of bug it can
    cause and the gates that see them (fit → question-visible + crop + reach; anything → phone error-smoke + playthrough
    sample); the push hook refuses a changed shared script without a pass stamped for its exact bytes.
    Tool: `tools/shared-gate.mjs --run|--check`.
57. **Whole-catalogue gates run weekly, not only on what a push touches** (KDM 2026-11-04: tap-reach found 19 games with
    CHECK below a 320 fold since 10-30, head-oracle 72 icon giveaways, gen-fuzz a constant level, level-count 22 wrong
    FAQs — all only when run over every game). `tools/catalogue-sweep.mjs` runs them all (~2.5 h) and reports what is NEW
    since the last sweep. Phone error-smoke plays EVERY level at 320×568 (canvas code threw on negative radii only there);
    `test/scene-cut.mjs` compares the phone canvas's bottom edge with desktop (clock-climb hid half its clock with no fit
    at all); constant-by-design levels go in an allow file with a reason, so gen-fuzz can gate.
58. **AI images stay the generator's bytes, with their provenance** (KDM Real or AI?: BFL terms forbid altering or
    stripping Content Credentials). Store content-addressed (name = sha256 of the bytes), keep the originals, and gate
    every push that touches the images: each served AI file has a byte-identical original that still carries its C2PA
    chunk; monthly `--live` re-hashes the served files. Tool: `infra/privacy/provenance-check.mjs`. Gemini images: keep the
    SynthID / provenance metadata (yoga variant).
59. **A silent beacon is an outage** (KDM 10-22: the database quota ran out, /api/land kept answering 204 and dropped a
    day of plays; every later read looked like a traffic collapse). Every status / optimizer read checks game opens per
    bot-filtered visitor against the median of the SAME kind of day (weekends run ~half), and flags zero or a >50% drop.
    Tool: `infra/kpi/data-health.mjs` (verified on simulated weekday and weekend silences).
60. **The screen speaks only the interface's language: no stray script, no untranslated chrome** (CDE 2026-11-04:
    Word Zapper and Spelling Forge showed the Hebrew gloss to English players (`#targetHe` "מקשיבים…", the `.subhe`
    menu line, the forge photo's `#heWord`), a day after the flashcards were fixed for the same thing. Found by reading
    string tables, not by any gate.) Two rules, per page, per interface locale, on load and after a little play:
    (a) in a UI that is not Hebrew, no visible Hebrew unless the text's **nearest** `[lang]` ancestor declares `he`
    (mark a deliberate Hebrew label, like the picker's "עברית", with `lang="he"`); (b) in a UI that is not the source
    locale, no source-locale string of the page's **own** translation table (or of a keyed element's served HTML
    default) on screen: an untranslated button, toast or fallback. **Never allowlist `dir="rtl"` / `direction:rtl`**:
    every leaking box was RTL-styled for the Hebrew it was built to hold, so "skip RTL" skips exactly the leak. Gloss
    and translation lines are written per locale (`''` = hidden for the source locale), not shown by default and hidden
    later. Game content that is the language being taught is not in the chrome table, so (b) leaves it alone. Text
    drawn on a canvas is not read: keep chrome in the DOM. Tester: `test/language-leak.mjs` (`--preset=cde|kdm`,
    or `--switch` / `--table` / `--pages` flags). It fails on pre-fix CDE (a5af444: 4 findings on 2 games) and passes
    on HEAD.

33. **Every issue goes round the loop** — fix → creator rule → tester gate (fails on the old game, passes on the fix) →
    optimizer → catalogue sweep → kit + `LESSONS.jsonl`. Enforced by `hooks/commit-msg` (a game change needs a
    `Lesson:` trailer). See `ISSUE-LOOP.md`.

61. **No emoji as interface icons; content emoji are fine** (owner 2026-11-04: emoji in nav, headings, buttons, badges,
    cards and shared game chrome make the site read as AI-built; a stock icon pack with repeats does too). Site and game
    CHROME uses one hand-drawn icon set (infra/icons: 24-grid, 2 px round stroke, currentColor, RTL-mirrored arrows,
    aria-hidden when decorative); card icons are hand-drawn per game, one idea each, no repeated motif. Game CONTENT emoji
    (animals, objects, the answers) stay — swapping those risks new icon-oracle giveaways and needs full re-testing.
    Gate: `test/chrome-emoji.mjs` — a ratchet (a chrome file may lose emoji, never gain them) until the rollout is done.
    Two rollout traps (CDE 11-04): (a) a currentColor icon VANISHES inside gradient-text headings (background-clip:text;
    color:transparent) — 6 CDE headings shipped blank; give heading icons their own colour, and test that every visible
    `<svg><use>` has a non-transparent computed colour and resolves in the sprite. (b) Emoji → markup breaks textContent
    sinks: trace each string's sink; use innerHTML only for STATIC strings, never for player names or word data (XSS) —
    keep data as text nodes and add the icon as its own element.
62. **A funnel ratio uses one window for its numerator and its denominator** (CDE 2026-11-07: the optimizer counted
    Spelling Forge opens from 10-10 but starts only from 10-28, when `g_start` began logging, and read "72 of 115 kids
    never press Start"; like-for-like it was 43/55 = 78%, in line with the other games — a fix was nearly built for a
    counting artefact). An event that started logging later clips BOTH sides to its first-seen date; the report prints
    each event's first-seen date next to the ratio and warns when a ratio's two counts span different windows.
    Guard: infra/optimizer-pattern.md "Same-window ratios"; CDE tools/learning/optimizer.mjs `startWin`.
63. **A step of a multi-step flow leads back into the flow, not on to something else** (CDE 2026-11-07: the learning
    ladder's 5th step launches a game on its own page; the game's end card offered "Next game" first, so 45 launches led
    to 8 next-step completions and every exit since 11-04 went to another game). When a page is opened AS a step
    (`?from=<flow>`), its end card's primary action and its home control return to the flow's next step; "play again" stays
    secondary and unrelated "next" offers drop out. Tester: CDE e2e/ladder-return.spec.js (fails on the old end card).

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

## 7b. Committing in the SHARED kit folder (yoga 11-07)
Several sessions (KDM, CDE, yoga, Factory) commit in `~/projects/shared/game-kit` at the same time, often with
uncommitted work in progress in the same tree.
- **Never `git commit --amend`, `rebase` or `reset` here.** Your "last commit" may no longer be yours: on 11-07 an amend
  rewrote KDM's 1.63.4 under yoga's message, and a follow-up `reset --soft` swept KDM's next commit into yoga's.
- **Commit fresh, named files only** (`git add <path>`, never `-A`/`-u`/`.`), check `git diff --cached --stat` first, and
  `git log -1` right before anything that touches history.
- A file someone else has edited but not committed: stage only your lines (write `HEAD version + your change` to a
  blob, `git hash-object -w` + `git update-index --cacheinfo`), so their edit stays in their working copy.
- **Repair** without touching the working tree: `git commit-tree <tree> -p <parent>` to rebuild commits (keep the other
  author's name/date/message), then `git update-ref refs/heads/main <new> <expected-old>`; tell the owner session its
  commit has a new SHA. Never `reset --hard`.

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

## 8c. Team battle + class target (KDM RL13, agreed with CDE 2026-10-29; shipped KDM 2026-10-30)

Cooperative beats competitive for a class (Roseth 2008); individual leaderboards lowered scores (Hanus & Fox 2015).
Two grouping modes sit next to the existing scoring modes; scoring underneath stays Standard.
- **`team`: 2 teams by join order** (1st, 3rd, 5th… player → team 0, ties by id). Kids choose nothing, and a reload
  or rejoin keeps the team because it is derived from the player's own join time (§8b: reload resumes the same player).
  **Winner = average per member**: teams can differ by one player. Show the totals too.
- **`class`: the whole class vs a target** = players × minutes × k (k: facts 8, game 2 rounds cleared). The teacher
  can nudge it ± in the lobby. The target is stored on the room **at start**, so a late join doesn't move the goal.
- **No individual score on the board in either mode.** Nicknames appear only in the lobby (the "did I join?" check).
  The room payload sends players as `{id, nickname, team}`, never a per-player score.
- **No new data:** team = derived, target = one integer on the room row (KDM: `live_rooms.target`).
- **Names + colours per language** (the colour is the team's identity on the projector):
  en Comets 🔵 / Rockets 🟠 · he שביטים / טילים · es Cometas / Cohetes (#3b82f6 / #f97316).
- **Gate:** a unit test for teamOf/teamTotals/defaultTarget, plus an e2e: teacher + 5 students, an odd team size, a
  reload mid-battle (same team), team board shows no per-player scores, and the target is fixed at start.
  KDM reference: `src/lib/liveTeams.js`, `e2e/live-team-battle.spec.ts`.


## 8d. Post-deploy smoke: one tool, every site (2026-11-04)

**Rule.** After every production deploy, run `node <kit>/tools/smoke.mjs <base> --site=<site>`. Run it again inside every optimizer read. It must exit 0 before you call a deploy done. Do not schedule it: no cron, launchd job or routine.

**Why one tool.** KDM's optimizer tripwires (CSP, deindex, canonical, sitemap, beacon, headers, 404 sweep) and yoga's deploy-smoke (beacon, phone taps, CTA, auth) each caught real bugs on one site only. The bug classes are shared: a self-blocking CSP, an unwired beacon, a covered CTA on phones, a stale deploy. So the check lives in the kit and each site supplies a config.

**Contracts every site config must keep**

1. **Read-only and low-rate.** Node requests run at ≤ 2 req/s with a bot UA, and the tool reads no secrets.
2. **No analytics inflation.** Browser pages load with `?internal=1`, and every beacon, CSP-report and analytics request is *aborted* in the browser. The only beacon write is a **documented no-op body**, an empty batch that the handler loops over without writing. Verify that in the handler before you configure it; if no no-op exists, omit `body`.
3. **Auth probes never sign up.** Submit only when *every* sign-in proof holds. The proofs are the sign-in marker, one password field that is not `new-password`, no sign-up-only field, and a submit label that says sign in. Sign-up requests are also aborted at the network layer. Credentials are always a fresh `smoke-probe-<hex>@example.com` and a random password; never configured, never real. Production hosts are listed in `auth.liveHosts` and skipped unless `--auth-live` is passed.
   *Lesson (yoga 11-01): the modal opened in sign-up mode, and a probe that "signed in" created a real account.*
4. **Runtime CSP only counts what the page cannot survive.** A blocked `eval` with no page error is a library feature probe, such as zod v4's JIT `new Function("")`, and is only a note. *Lesson (yoga 11-04): the first live run flagged it as a self-block, which was a false alarm.*
5. **Tap CTAs name the real primary control.** "The first link in `<main>`" picked a 44 px breadcrumb on CDE and a 17 px inline language link. Inline text links are exempt from the 24 px rule (WCAG 2.5.8), so configure the card or CTA selector per hub.
6. **live = local reads git, not the working tree.** It compares `git show <ref>:<file>` with the live bytes. On a mismatch it names the cause: live equals `origin/main` (HEAD is unpushed) or neither (stale or failed deploy). Use `--ref=origin/main` to ask "is what's pushed live?"

**Evidence (11-04 live runs, read-only).**
- KDM: 10 ✓ and 1 ✗. The ✗ is `liveLocal`: `kdm-game-clicks.js` live equals origin/main, and HEAD `e239f246` is on an unpushed branch. With `--ref=origin/main`, all 13 files match.
- CDE: 11 ✓, auth off.
- yoga: auth skipped on the live host; csp, tap and cta ✓ after the fixes in contracts 4 and 5. `liveLocal` ✗ for the same unpushed-HEAD reason (`analytics.js`).
- A broken fixture (port 4740) turned every check red.

**Checklist for a new site (NEW-SITE-PLAYBOOK).** Add `smoke.config.<site>.json` with repo, base, blockInBrowser, hubs and their CTA selectors, the beacon no-op body (after reading the handler), the framing rule, the sitemap minimum and the sweep pattern. Get a green run before the first launch announcement.


## 8e. Site-level checks: taps, CI, translations, health claims, hreflang (yoga-bits 10-30 → 11-04)

The game gates (§5) never load the site's own pages, its CI or its prose. Each of the checks below found a live bug
that had shipped on yoga-bits. All of them run against a site with only a `site-checks.json` config. See
`infra/yoga-derived-checks.README.md` for the configs for yoga, KDM and CDE.

1. **Every link and button on home and hubs takes a real tap on a phone, and nothing that looks like a card is dead.**
   - *Yoga 11-01:* a see-through sticky CTA (fixed, z-40, semi-transparent padding) swallowed every tap in its strip.
     The last footer links could never be tapped. The Android install banner's full-width wrapper did the same. The
     home "How It Works" cards, stat chips and feature tiles looked tappable and did nothing.
   - *Rule:* a fixed or sticky wrapper is `pointer-events:none` and only the control inside it is
     `pointer-events:auto`. A sticky bar shows only where it is needed. A card either opens what it describes or doesn't
     look like a card.
   - *Gate:* `test/site-tap-cover.mjs` at 390×844 and 320×568, run after each deploy. It hit-tests the centre of the
     **first line box** (`getClientRects()[0]`). The centre of the whole box of a wrapped link lands on neighbouring
     text, which caused 3 false alarms on 11-04 (real taps confirmed all 3 were fine). The dead-card probe flags a card
     with its own `cursor:pointer`, or a `/card|tile/` class with a card look, that has no link, button or handler.
   - *11-04 sweep:* CDE `/he/` and `/es/` have 12 such `feature-card`s.
2. **"CI is red" always says why: a billing block or a real failure.**
   - *Yoga 10-31 → 11-01:* the Actions minutes ran out, and the red runs then hid a critical and then a high
     npm-audit finding for about 3 days, because "red" had come to mean "billing".
   - *Gate:* `test/ci-health.mjs`, run on every status check. It classifies a red run from the job's check-run
     annotation ("The job was not started because … spending limit"), which needs only repo scope. Otherwise it names
     the failing step and its error lines.
   - **The minutes / billing API needs the gh `user` scope, which only the owner can add (`gh auth refresh -s user`).
     Never attempt it from a tool or an agent.**
3. **A translation passes when independent judges agree, not when one reviewer says so.**
   - *Yoga 10-31:* the owner reads only Hebrew and English, so a native check was never going to happen.
   - *Gate:* `infra/i18n/consensus.mjs`. An edit lands only when ≥2 judges flag the same passage: C (claude sonnet
     editor), B (blind back-translation by opus, compared with the English by opus), optional G (Gemini) and D
     (deterministic formal register). Removing a claim or restoring a dropped caution also lands. `--tiebreak` sends a
     single-judge point to a fresh third judge, and the fix needs 2 of 3.
   - **Guards:**
     - An edit that drops a hedge is skipped. "Many people find…" is deliberate.
     - Rewrites of title and description are reverted and listed for a human, because those belong to SEO.
     - Edited JSON must still parse.
   - `fill-gaps.mjs` translates only the sections that were never translated. It keeps existing lines verbatim
     (≥97%) and the frontmatter byte-identical, or it writes nothing.
   - *Yoga totals:* 223 units, 899 agreed and 62 tie-break fixes.
   - **Every `claude` call uses a bare alias** (`--model sonnet|opus|haiku`, never a dated id) plus
     `--no-session-persistence` and `--allowedTools ''`.
   - **Stop hooks must exit early under headless `claude -p`.** On 11-02, each `claude -p` call fired the user's Stop
     hooks, and those ran vitest until the load average hit 450. Keep concurrency at 3–4.
4. **No health claim is stated as fact, in content or in page code.**
   - *Yoga 10-30:* Downward Dog "helps relieve stress and mild depression", and 70+ lines like it ran across 11
     locales. *10-31:* the `.astro` category pages said "reduced cortisol levels, lower heart rate", because the
     content tests never read page code.
   - *Gate:* `test/health-claim.mjs`, run before push. It flags a claim verb within about 40 characters of a condition
     ("cures anxiety", "lowers blood pressure"), or a noun claim ("clinically proven", "detoxifies", "boosts
     immunity"), when the sentence has no hedge ("may", "some people find", "research suggests", "talk to your doctor").
     It skips cautions and negations. Allowlist entries are `path::sentence-substring`.
   - English only. The translations are covered by the claim rules in 8e.3.
   - *11-04 sweep:* 3 hits in KDM `vitamins` ("Vitamin C fights colds", "fights colds and heals cuts").
5. **Every hreflang alternate answers 200 and links back.**
   - *Yoga 10-30:* every article declared all 10 translations, but most locales carried only 20 of the 55 articles,
     so 245 alternates answered 404 live for weeks. Google drops a cluster with broken or one-way members.
   - *Gate:* `infra/seo/hreflang-check.mjs`.
     - After a build, `--serve=dist --all` checks the whole build in about 30 s (yoga: 3,162 pages, 23,562 links).
     - Live, it samples the sitemap at ≤2 requests a second, read-only, without following redirects. A 3xx is a
       finding.
     - A return link counts if it is in the target's HTML or in its sitemap entry.
   - *11-04 sweep:*
     - Yoga has 230 one-way links: EN `/poses/`, `/breaths/category/*` and `/breaths/level/*` carry no hreflang, while
       their locale versions point at them.
     - CDE `/he/english-games/toys/` claims an EN page whose cluster names a different `he` URL.

6. **Every text box can be read in both themes: typed text and hint at ≥ 4.5:1 against the box's own background.**
   - Scope: every visible, enabled `input` (no type, or type text / search / email / number / password / tel / url),
     `textarea`, `[contenteditable]`, `select`, `[role=combobox]` and `[aria-haspopup=listbox]` trigger. For a select,
     the shown choice is the text that counts. Check it in light, dark via `prefers-color-scheme`, and dark via the
     site's class toggle (`.dark` on `<html>`).
   - **A theme override of text colour ships with the matching field background, in the same change.** Lightening
     `color` for dark mode (`.dark .text-slate-700`, `dark:text-white`) while the box keeps a light fill
     (`bg-white/70`) is the CDE 11-04 bug, measured at 1.25:1. The reverse (a dark fill with no light text) fails the
     same way. Prefer one global rule per theme for every text box: background + colour + border together.
   - **Always set the placeholder colour, in both themes,** with `opacity: 1`. Browser and Tailwind default greys
     (slate-400, gray-300, `#757575` on a dark field) fail. Measured 11-04: CDE 2.6, KDM 1.47–3.06, yoga 2.54 / 3.17.
   - **Measure against the composited background where the box really sits, on every page that uses it.** Composite
     each ancestor's background-colour and opacity from `<html>` down onto the page canvas, and check each gradient
     stop. Never assume white: the same component can sit on white on one page and slate-100 on another.
   - **Resolve colours through the browser, not a regex.** Tailwind v4 computes `oklch()` / `oklab()`, and a parser
     that only reads `rgb()` gets these wrong. Paint the computed colour on a 1×1 canvas and read the pixel.
   - Measure the end state. Finish transitions and entrance animations first, because a mid-fade ancestor lowers
     the contrast.
   - Gate: `node <kit>/test/input-contrast.mjs --preset=<site> …`, which exits 1 when a box is under the minimum.
     Negative fixture `test/fixtures/input-contrast/` (the CDE 11-04 CSS) must keep failing: 5 findings in 3 modes.
     Each site lists the pages that have text boxes, and the clicks that reveal them, in its preset. When a new text
     box ships, add its page to the preset.

## 8f. Push-limit hooks must cover every worktree (yoga-bits 11-05, from a CDE find)
A pre-push cooldown / daily cap (KDM, yoga, CDE) is only as good as the copies it runs in. Three ways it silently
stopped counting:
- **(a) Relative `core.hooksPath` = no hook in older worktrees.** `core.hooksPath=.githooks` resolves inside each
  worktree's own checkout. Worktrees on branches older than the hook have no `.githooks/pre-push`, so they ran NO hook
  (yoga: 3 worktrees, 11-05). Set it ABSOLUTE: `git config core.hooksPath "$PWD/.githooks"` (config is shared by all
  worktrees), or install the hook in every worktree.
- **(b) The log/stamp must live in `git rev-parse --git-common-dir`.** `--git-dir` is per worktree
  (`.git/worktrees/<name>`), so each worktree kept its own cooldown log and its pushes never counted (CDE).
- **(c) A cooldown guarded by `if [ -f "$STAMP" ]` lets a worktree's FIRST push through** (no stamp there yet, KDM).
  With (b) the stamp is shared; also cross-check the shared push reflog (`git reflog show origin/main` in the common
  dir) so a missing or deleted stamp can't open the gate.
- **(d) A passing dry run of the hook APPENDS to the log**, so the next real push is refused for hours. Test on a copy
  (`cp .git/deploy-push-log /tmp/…` and restore) or with the log path overridden.
*Check:* `tools/due.mjs <site>` warns when any worktree has no effective pre-push hook while the main checkout has one.

## 8g. Spoken content stays with its visual (yoga-bits 11-07, owner bug)
Owner: "the name of the pose is voiced only after the visual has already moved to the next pose". The quiz spoke the
answer's name 250 ms after the answer (fire-and-forget) and advanced at 1,100 ms (500 in speed mode); names take
1.5–2.5 s, so most of EVERY name played over the next pose, worse on a cold phone load (clip download first).
- **Rule:** an auto-advance that follows speech waits for the speech to END (clip `ended` / utterance `onend` /
  error), capped (yoga 4 s); pause any round timer for the extra wait; stop speech before the next item; preload the
  clip while its item is on screen; where the pace is too fast for speech (speed modes), don't auto-speak.
- **A tapped name stops when the card changes** (learn/flashcards/drills), or it plays over the next card.
- **Why tests missed it:** content tests checked the recordings, game tests stubbed or ignored speech, no test ever
  timed audio against the screen, and the race only shows with real clip durations.
- *Check:* `test/speech-sync.mjs` (real audio, nothing stubbed): every clip/utterance timed `playing`→`ended`
  against a per-frame sample of what's on screen; fails if the visual changes while it plays or it starts late. Run
  warm AND cold (cache off + throttled). Yoga's `e2e/audio-sync.spec.js` failed on every answer of the old code.
- Side effect to expect: e2e loops that answer on a fixed sleep get slower rounds → wait for the next item instead.
