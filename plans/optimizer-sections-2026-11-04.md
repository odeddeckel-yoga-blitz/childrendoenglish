# Standing optimizer sections on CDE (kit 1.58–1.59, owner OK 11-04: "do all above")

Kit refs: RECURRING.md, recurring.json, tools/due.mjs, infra/optimizer-pattern.md (§5.55), infra/kpi/game-clicks.js.
KDM reference: kidsdomath eb5a9446 + 1398dfa2 (public/games/_shared/kdm-progress.js, tools/engagement/optimizer.mjs).

| # | section | CDE data (all aggregate: no identifier, path, message or timing sent) | where |
|---|---|---|---|
| 1 | recurring checks | `.recurring-log.jsonl` (committed); `due.mjs cde` on status / what next | CLAUDE.md "Recurring checks" |
| 2 | movement between activities | `g2` / `g3` @ how (2nd / 3rd distinct activity in a tab), `hop` @ from@to; tab list in sessionStorage `cde_acts` / `cde_last`, never sent | land-beacon.js (game pages), src/utils/activityFlow.js (app screens, via App.jsx) |
| 3 | site pages → games | `vp` @ referrer page class on a game open ÷ that class's cde_land loads; static pages keep pg/cta | land-beacon.js |
| 4 | in-game controls | component_daily, route `/games/<id>`, tpl `game-menu` / `game-l<N>` / `game-result`, comp = id or first class | public/games/game-clicks.js (loaded by land-beacon.js on game pages; no game file edited) |
| 5 | errors × bounce | `jserr` @ surface, ≤1 per page load, same-origin scripts only | land-beacon.js |
| 6 | AI referrals | existing aie/aiv + cde_land src='ai' by page class | report only |
| 7 | returning players | existing `vis` buckets + `rets` @ the surface a returning day starts on | land-beacon.js |
| 8 | phone load speed | `cwv` @ `<lcp|cls|inp>_<good|ni|poor>@<surface>`, phones ≤760 px, 1 load in 4 | land-beacon.js |

Surface = `g-<game>` · `app` · `pg-<page class>`. Server: api/land.js LEARN_EVS + EV_ITEM pins each item shape.
Report: tools/learning/standing-sections.mjs (called by optimizer.mjs). Privacy page: one sentence (en/he/es), 11-04.

Known limits: land-beacon.js is deferred, so an error thrown before it loads is not counted; an SPA ladder step that is
not a quiz/flashcards (letter-fix, sentence) reads as `menu`; hops across a reload of the same tab are kept (same tab
list), a new tab starts a new list.

First real read: ~Nov 11 (7 days of tallies). Checks: page-to-game-read, errors-bounce-read, game-flow-read (3 d);
ingame-controls-read, returning-read, speed-read, ai-referrals-read (7 d).
