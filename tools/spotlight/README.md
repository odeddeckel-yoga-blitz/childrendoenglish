# Home spotlight — Word & Game of the day

Routes the arrivals we already have to cold inventory and harvests the data
that says whether each item is good. It creates no traffic (kit PATTERNS §3c).

## Pieces
- `src/data/cde-stats.json` — committed snapshot (28d) written by
  `tools/learning/optimizer.mjs` or the hourly job. Words `[answers, correct]`,
  games `{opens, lvl, cmp}`, `spot` clicks, `modes` (per-probe answer split
  `<word>@aud|img|txt`), `fb` (parent feedback taps `<word>@img|aud|hard|ok`).
- `src/utils/spotlightPick.js` — lowest-traffic non-graduated item per lane
  (word: ans≥30 & acc≥0.7 graduates · game: opens≥30 & depth≥2).
- `src/utils/spotlightDecide.js` — hourly keep/swap rules + `diagnoseWord`.
- `scripts/pick-spotlight.mjs` — prebuild, deterministic (now = snapshot date).
- `tools/spotlight/hourly.mjs` + `.github/workflows/spotlight-hourly.yml` —
  the loop (needs repo secret `DATABASE_URL`). Commits only on change →
  CI + Vercel deploy rotates the cards. Decisions: `log.jsonl`; items needing
  work: `flags.json`.
- `src/components/SpotlightCards.jsx` → word card opens `WordCheck.jsx`
  (3 probes: hear→picture, picture→word, word→meaning; then one feedback tap).

## Hourly rules
sufficient = ≥5 card clicks OR ≥10 exposures since the item went up.
If sufficient → refresh snapshot + print the optimizer report (the
"engagement optimizer" step) and judge engagement: exposure ≥20 with
accuracy <0.5 (word) / depth <0.5 (game) = **poor → swap + flag**; <0.6 / <1.0
= **watch → flag, keep**. Also swap on graduation, 14d max tenure, 7d with no
traffic. 30d cooldown before an item can return.

## What the owner does (weekly, or when `flags.json` changes)
Read the flag's `diagnosis.asset`:
- **image** → re-shoot / replace the photo; run the sole-answer check
  (same-category rivals must not win the picture probe).
- **audio** → regenerate with the voice chain, ear-check, bump the SW audio cache.
- **word** → age-appropriateness first (amber precedent: DROP-RULE), then gloss.
- **unknown** → not enough per-probe data yet; leave it in the spotlight.
`tools/learning/optimizer.mjs` prints the same per-asset diagnosis for ALL
words with probe/tap data (not just the spotlighted one).
