import { test, expect } from '@playwright/test';

/**
 * Playthrough gate for the 3 arcade games (infra-uplift P1).
 *
 * The shared game-kit harness (game-kit/test/playthrough.mjs) asserts the
 * KDM template contract (window.Line.dbg, #cv, #hubBack) which these games
 * deliberately don't implement — each exposes its own contract
 * (WZ / SF / CC globals). So the CI gate drives THOSE contracts through the
 * games' real input paths instead: start each game, make correct moves,
 * assert progress, and assert zero page errors.
 *
 * Also asserts the analytics-purity invariant the plan calls out: under
 * automation (navigator.webdriver) neither the land beacon nor the games'
 * learn beacons may reach /api/land.
 */

// Each game: how to wait for readiness and drive N correct moves via its contract.
const GAMES = [
  {
    id: 'word-zapper',
    ready: () => window.WZ && WZ.dbg.screen === 'play' && WZ.dbg.hasTargetSprite(),
    move: () => WZ.dbg.solveForTest(),
    score: () => WZ.dbg.score,
  },
  {
    id: 'spelling-forge',
    ready: () => window.SF && !!SF.dbg.word,
    move: () => { SF.dbg.solveForTest(); SF.forge(); },
    score: () => SF.dbg.score,
  },
  {
    id: 'category-conveyor',
    ready: () => window.CC && CC.dbg.screen === 'play' && !!CC.dbg.activeWord(),
    // tapBin takes the category KEY of the tapped bin; sorting the active
    // item into its own category is a correct move
    move: () => {
      const cat = CC.dbg.activeCat();
      if (cat) CC.tapBin(cat);
    },
    score: () => CC.dbg.score,
  },
];

for (const g of GAMES) {
  test(`${g.id}: playable via real input paths, no errors, no beacon leaks`, async ({ page }) => {
    // belt/spawn games can take >30s to feed 5 items on the mobile profile
    test.setTimeout(60000);
    const pageErrors = [];
    page.on('pageerror', (e) => pageErrors.push(String(e)));
    const beaconHits = [];
    page.on('request', (r) => {
      if (r.url().includes('/api/land')) beaconHits.push(r.url());
    });

    // explicit index.html: the vite dev server's SPA fallback swallows the
    // bare /games/<id>/ directory URL (production serves either form statically)
    await page.goto(`/games/${g.id}/index.html`);
    await page.click('#startBtn');
    await page.waitForFunction(g.ready, null, { timeout: 10000 });

    const before = await page.evaluate(g.score);
    for (let i = 0; i < 5; i++) {
      await page.evaluate(g.move);
      // let spawn/level animations settle between moves
      await page.waitForTimeout(400);
      await page.waitForFunction(g.ready, null, { timeout: 10000 }).catch(() => {});
    }
    const after = await page.evaluate(g.score);

    expect(after, `${g.id} score should grow after 5 correct moves`).toBeGreaterThan(before);
    expect(pageErrors, `${g.id} page errors`).toEqual([]);
    // webdriver exclusion must hold for land-beacon.js AND the g_lvl/g_cmp learn beacons
    expect(beaconHits, `${g.id} beacons must not fire under automation`).toEqual([]);
  });
}
