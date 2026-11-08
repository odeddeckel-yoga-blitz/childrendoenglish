// Kit §8g speech-sync for Class Battle (11-08 sweep follow-up): a kid's word must not still be playing when the next
// question shows. /api/live is served by the real handler on its in-memory store (no database), as in
// e2e/battle-teams.spec.js. Real audio, warm AND cold; fast taps too (the word is printed, a reader taps at once).
import { test, expect } from '@playwright/test';
import handler from '../api/live.js';
import { __resetBattleStoreForTests } from '../api/_lib/battleStore.js';
import { instrumentSpeech, checkSpeech } from './lib/speech-sync.mjs';
import { cold } from './lib/cold-net.mjs';

const DUR = 120;

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
test.skip(!!process.env.CI, 'speech-sync needs real audio output (CI has none)');

test.beforeEach(() => {
  for (const k of ['CDE_DATABASE_URL', 'DATABASE_URL', 'POSTGRES_URL']) delete process.env[k];
  __resetBattleStoreForTests();
});

for (const mode of ['warm', 'cold']) {
  test(`Class Battle speech sync (${mode}): a word never plays over the next question`, async ({ browser }) => {
    test.setTimeout(120000);
    const hctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    await wire(hctx);
    const h = await hctx.newPage();
    await h.goto('/battle/index.html');
    await h.click('#btnTeacher');
    await h.click('#catGrid [data-cat="animals"]');
    await h.click('#btnCreate');
    await expect(h.locator('#roomCode')).toHaveText(/^[A-Z]{5}$/);
    const code = await h.locator('#roomCode').innerText();

    const kctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    await wire(kctx);
    const k = await kctx.newPage();
    await instrumentSpeech(k, { audio: /\/audio\/[a-z0-9-]+\.mp3/, visual: () => (document.querySelector('#sPlay.show') && document.getElementById('playWord')?.textContent) || '', answerSel: '#choices button' });
    await k.goto(`/battle/index.html#join=${code}`);
    if (mode === 'cold') await cold(k);
    await k.click('#btnCheckCode');
    await k.locator('.namebtn').first().click();
    await expect(k.locator('#sKidLobby.show')).toBeVisible();
    await h.click('#btnStart');
    await expect(k.locator('#sPlay')).toBeVisible();

    for (let i = 0; i < 8; i++) {
      await k.waitForFunction(() => window.__battleDbg.q && !window.__battleDbg.locked, null, { timeout: 10000 });
      const q = await k.evaluate(() => ({ id: window.__battleDbg.q.id, word: window.__battleDbg.q.word, other: window.__battleDbg.q.choices.find((c) => c.id !== window.__battleDbg.q.id).id }));
      // a reader taps at once (the word is printed); a listener waits for the word; one wrong answer
      await k.waitForTimeout(i % 3 === 0 ? 200 : 1600);
      await k.locator(`#choices [data-word-id="${i === 4 ? q.other : q.id}"]`).click();
      await k.waitForFunction((w) => window.__battleDbg.q && window.__battleDbg.q.word !== w && !window.__battleDbg.locked, q.word, { timeout: 10000 }).catch(() => {});
    }
    await k.waitForTimeout(2500);
    const log = await k.evaluate(() => window.__sync), r = checkSpeech(log);
    if (r.problems.length && process.env.SYNC_DEBUG) console.log(JSON.stringify(log.map((x) => [x.e, Math.round(x.t), x.src || ''])));
    expect(r.spoken).toBeGreaterThan(5);
    expect(r.problems).toEqual([]);
    await kctx.close();
    await hctx.close();
  });
}
