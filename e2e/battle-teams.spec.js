// Class Battle team + class modes (RL13, kit PATTERNS §8c gate): a teacher and
// 5 kids, odd team sizes, a reload mid-battle keeps the team, the team board
// shows no names and no per-player scores, and the class goal is fixed at start.
// /api/live is served by the real handler on its in-memory store (no database).
import { test, expect } from '@playwright/test';
import handler from '../api/live.js';
import { __resetBattleStoreForTests } from '../api/_lib/battleStore.js';

const DUR = 20; // seconds: the setup offers 2–5 min, the route shortens it for the test
const NICKS = /(Brave|Clever|Swift|Mighty|Sunny|Cosmic|Turbo|Lucky|Zippy|Sparky|Rocket|Daring|Golden|Frosty|Jolly|Nimble|Plucky|Speedy|Stellar|Wild) [A-Z]/;

async function wire(ctx) {
  await ctx.route('**/api/land', (r) => r.fulfill({ status: 204 }));
  await ctx.route('**/api/live**', async (route) => {
    const req = route.request();
    const url = new URL(req.url());
    let body = req.method() === 'POST' ? JSON.parse(req.postData() || '{}') : undefined;
    if (body && body.action === 'create') body = { ...body, durationSec: DUR };
    const res = { code: 200, out: null, setHeader() {}, status(c) { this.code = c; return this; }, json(b) { this.out = b; return this; } };
    await handler({ method: req.method(), query: Object.fromEntries(url.searchParams), body }, res);
    await route.fulfill({ status: res.code, json: res.out });
  });
}

test.describe.configure({ mode: 'serial' });
test.skip(({ browserName, isMobile }) => browserName !== 'chromium' || isMobile, 'one multi-client run is enough');

test.beforeEach(() => {
  for (const k of ['CDE_DATABASE_URL', 'DATABASE_URL', 'POSTGRES_URL']) delete process.env[k];
  __resetBattleStoreForTests();
});

async function host(browser, mode) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  await wire(ctx);
  const page = await ctx.newPage();
  await page.goto('/battle/index.html');
  await page.click('#btnTeacher');
  if (mode !== 'team') await page.click(`#modeGrid [data-mode="${mode}"]`);
  await expect(page.locator(`#modeGrid [data-mode="${mode}"]`)).toHaveAttribute('aria-pressed', 'true');
  await page.click('#catGrid [data-cat="animals"]');
  await page.click('#btnCreate');
  await expect(page.locator('#roomCode')).toHaveText(/^[A-Z]{5}$/);
  return { page, code: await page.locator('#roomCode').innerText() };
}

async function kid(browser, code) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  await wire(ctx);
  const page = await ctx.newPage();
  await page.goto(`/battle/index.html#join=${code}`);
  await page.click('#btnCheckCode');
  await page.locator('.namebtn').first().click();
  await expect(page.locator('#sKidLobby.show, #sPlay.show')).toBeVisible(); // a late join goes straight to play
  return page;
}

async function answerRight(page, n) {
  for (let i = 0; i < n; i++) {
    const id = await page.evaluate(() => window.__battleDbg.q && !window.__battleDbg.locked && window.__battleDbg.q.id);
    if (!id) { await page.waitForTimeout(200); i--; continue; }
    await page.locator(`#choices [data-word-id="${id}"]`).click();
    await page.waitForTimeout(650);
  }
}

test('team battle: Comets vs Rockets, no per-player scores, reload keeps the team', async ({ browser }) => {
  test.setTimeout(90000);
  const { page: h, code } = await host(browser, 'team');
  const kids = [];
  for (let i = 0; i < 5; i++) kids.push(await kid(browser, code));
  // join order alternates: 3 Comets, 2 Rockets — each kid sees their team
  await expect(h.locator('#hostPlayers .chip.t0')).toHaveCount(3);
  await expect(h.locator('#hostPlayers .chip.t1')).toHaveCount(2);
  await expect(kids[0].locator('#kidTeam')).toHaveText("You're on the 🔵 Comets!");
  await expect(kids[1].locator('#kidTeam')).toHaveText("You're on the 🟠 Rockets!");

  await h.click('#btnStart');
  await expect(kids[0].locator('#sPlay')).toBeVisible();
  await expect(kids[3].locator('#kidGroup')).toHaveText('🟠 Rockets');
  await answerRight(kids[0], 3);
  await answerRight(kids[1], 2);

  // reload mid-battle: same player, same team, own words-right count kept
  await kids[3].reload();
  await expect(kids[3].locator('#sPlay')).toBeVisible();
  await expect(kids[3].locator('#kidGroup')).toHaveText('🟠 Rockets');
  await answerRight(kids[3], 2);
  await expect(kids[3].locator('#kidScore')).toHaveText('2');

  // projector: two team rows (average + total), no nickname, no player score
  await expect(h.locator('#hostBoard .brow.team')).toHaveCount(2);
  await expect(h.locator('#hostBoard .brow.t0')).toContainText('3 players');
  await expect(h.locator('#hostBoard .brow.t1')).toContainText('4 words'); // kid 1 (2) + kid 3 (2)
  expect(await h.locator('#hostBoard').innerText()).not.toMatch(NICKS);

  // end: Rockets 4/2 = 2 per player beat Comets 3/3 = 1
  await expect(h.locator('#podiumTitle')).toHaveText('🏆 The 🟠 Rockets win!', { timeout: DUR * 1000 + 10000 });
  expect(await h.locator('#podiumList').innerText()).not.toMatch(NICKS);
  await expect(kids[0].locator('#podiumSelf')).toContainText('3 words right for the 🔵 Comets');
  const state = await h.evaluate(() => window.__battleDbg.room);
  for (const p of state.players) expect(Object.keys(p).sort()).toEqual(['id', 'nickname', 'team']);
});

test('class battle: the teacher nudges the goal; a late join does not move it', async ({ browser }) => {
  test.setTimeout(90000);
  const { page: h, code } = await host(browser, 'class');
  const kids = [await kid(browser, code), await kid(browser, code)];
  await expect(kids[0].locator('#kidTeam')).toContainText('one goal together');
  // default = 2 players × (20 s / 60) × 6 = 4, shown as the 5-word floor; +5 +5 → 14
  await expect(h.locator('#targetVal')).toHaveText('5');
  await h.click('#targetUp');
  await h.click('#targetUp');
  await expect(h.locator('#targetVal')).toHaveText('14');
  await h.click('#btnStart');
  await expect(h.locator('#hostBoard .gtxt')).toHaveText('🎯 0 / 14 words');
  kids.push(await kid(browser, code)); // late join after start
  await answerRight(kids[0], 2);
  await answerRight(kids[2], 1);
  await expect(h.locator('#hostBoard .gtxt')).toHaveText('🎯 3 / 14 words');
  await expect(kids[2].locator('#kidGroup')).toHaveText(/🎯 \d+ \/ 14/);
  await expect(h.locator('#podiumTitle')).toHaveText('💪 So close! Try again?', { timeout: DUR * 1000 + 10000 });
});
