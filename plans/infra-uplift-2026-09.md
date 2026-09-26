# childrendoenglish Infra Uplift — 2026-09

STATUS 2026-09-26: P1 ✅ (drift gate + e2e/games.spec.js — the shared kit harness asserts the
KDM contract the CDE games don't implement, so the gate drives each game's own WZ/SF/CC
contract instead). P2 ✅ (g_lvl/g_cmp beacons + optimizer games section). P3: email capture
REMOVED (owner decision 2026-09-26) ✅ · CLS 0.325→0.036 ✅ · sweeps ✅ (NOTE: Onboarding is
NOT dead — App.jsx routes first-run players to it; plan claim was stale). Dep upgrades: owner
said DO on own branch — pending.

Goal: close the gaps from the 2026-09-26 cross-project analysis — CI doesn't guard kit drift or
the games, the 3 arcade games have no play-depth measurement (KDM parity), and several audit-#2
product debts are still open.
Prereq: run the game-kit plan first (~/projects/shared/game-kit/PLAN-2026-09-uplift.md).
NOTE: no outreach/distribution tasks in this plan — deferred by owner decision (2026-09-22).

## P1 — CI hardening

1. **[sonnet] Kit-drift gate in CI.** Add `node scripts/sync-game-kit.mjs --check` as a step in
   `.github/workflows/ci.yml` after lint. Exits 1 on drift already; just wire it.

2. **[sonnet] Game harness in CI.** Only 3 games — cheap enough to gate every main push. In the
   main-branch Playwright section, add `node game-kit/test/playthrough.mjs` against each of
   word-zapper / spelling-forge / category-conveyor (and the realinput spec if it runs headless
   cleanly). Remember the E2E TTS stub lesson (headless speech hangs) — the games' TTS is
   already `navigator.webdriver`-guarded, verify that holds under the harness.

## P2 — Engagement parity for the games (KDM pattern)

3. **[opus] Play-depth beacons + report for the 3 games.** The games fire land-beacon page pings
   but no progress events, so bounce/depth per game is invisible (KDM measures
   levelup÷opens per game). Add `levelup`/`complete` events from each game's level-up path into
   the existing `/api/land` learn-batch channel (`cde_learn` ev names like `g_lvl@word-zapper`),
   webdriver-excluded like everything else. Then add a small "games" section to
   `tools/learning/optimizer.mjs` (opens from cde_land vs levelups from cde_learn → depth
   ranking). Keeps one beacon, one DB, one optimizer.

## P3 — Open product debt (from audit #2 + Sept sessions, still unresolved)

4. **[opus] Email capture: wire or remove.** The parent email capture still transmits nowhere —
   an undeliverable promise. Ask owner: pick an ESP (or a simple Neon table + manual export) and
   wire it, OR remove the capture UI until one exists. Either resolution beats the status quo.

5. **[opus] Mobile CLS 0.325.** Static shell vs hydrated landing height mismatch. Reserve the
   hydrated layout's height in the static shell (measure real heights on Pixel-5 viewport;
   verify with Lighthouse CI before/after).

6. **[sonnet] Small sweeps, one batch:**
   - Delete the dead `Onboarding` component (+ its tests/imports if any).
   - Word-count claims sweep: SEO copy/pitches still say "451/388/342" in places → "480+"
     (grep for stale counts across generate-seo-pages.js, llms.txt, about/FAQ, outreach kit).
   - `/vocabulary/ages-6-8/` internal-link boost: top-impression near-miss page (pos ~10 @
     100 imp) — add links from high-crawl pages (vocab index Popular row, relevant category
     pages, a guide or two).

7. **[opus] Major dep upgrades (React 19, Vite 8, Tailwind 4, ESLint 10).** Own branch, full
   unit + e2e + a production-CSP game check before merge. Lowest priority in this plan; skip if
   time-boxed.

## Standing loops (not one-off tasks — note for the session picking this up)
- Weekly: `tools/seo/optimizer.py` run → overrides → rebuild → `push-index.py` → judge in 2–3 wks.
- When cde_learn has real volume (>50 events): the Letter Path usage review
  (letter taps, Letter-Path-vs-quiz adoption, hardest words via `optimizer.mjs 14 --rivals`).
- Owner items unchanged: Sentry read-scope token; counsel check of privacy wording.
