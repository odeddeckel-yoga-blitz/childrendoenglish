import { test, expect } from '@playwright/test';
import { instrumentSpeech, checkSpeech } from './lib/speech-sync.mjs';

// Kit §8g (yoga 11-07, lessons sweep 11-07): a spoken word must not still be playing when the screen has moved on to
// the next card / question / round. Real audio (nothing stubbed), a child's pace, warm AND cold (cache off + slow net).
const AUDIO = /\/audio\/[a-z0-9-]+\.mp3/;
// cold = cache off + 300 ms / 200 KB/s for the word audio, applied after the page loads.

async function cold(page) {
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Network.enable');
  await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
  await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 300, downloadThroughput: 200 * 1024, uploadThroughput: 100 * 1024 });
}
async function newPlayer(page) {
  await page.addInitScript(() => localStorage.setItem('childrendoenglish-analytics-consent', 'declined'));
  await page.route('**/api/**', (r) => r.fulfill({ status: 204 }));
  await page.goto('/');
  await page.waitForSelector('#root > *', { timeout: 15000 });
  await page.locator('button', { hasText: 'Learn vocabulary in English' }).click();
  await page.locator('#player-name').fill('Kid');
  await page.locator('button:has-text("Start playing")').first().click();
  const read = page.locator('text=I can read!');
  if (await read.count()) await read.click();
  await page.waitForTimeout(800);
}

for (const mode of ['warm', 'cold']) {
  test(`flashcards: each word stays with its card (${mode})`, async ({ page }) => {
    test.setTimeout(90000);
    await instrumentSpeech(page, { audio: AUDIO, visual: () => document.querySelector('#root main img, #root img[alt]')?.getAttribute('src') || '' });
    await newPlayer(page);
    await page.evaluate(() => { const { activePlayerId } = JSON.parse(localStorage.getItem('childrendoenglish-players')); const k = 'childrendoenglish-player-' + activePlayerId; localStorage.setItem(k, JSON.stringify({ ...JSON.parse(localStorage.getItem(k)), totalQuizzes: 1 }));
      const reg = JSON.parse(localStorage.getItem('childrendoenglish-players')); reg.players.forEach((p) => { p.canRead = false; }); localStorage.setItem('childrendoenglish-players', JSON.stringify(reg)); });
    await page.reload(); await page.waitForSelector('#root > *');   // canRead false: flashcards speak each word (pre-readers)
    if (mode === 'cold') await cold(page);   // after load: vite dev's unbundled modules would time out at 200 KB/s
    await page.getByText(/Word batch 1/).click();
    for (let i = 0; i < 4; i++) {
      await page.waitForTimeout(700);
      await page.getByRole('button', { name: /Show the word/ }).click();
      await page.waitForTimeout(600);
      await page.getByRole('button', { name: /Know It/ }).first().click();
    }
    await page.waitForTimeout(1500);
    const log = await page.evaluate(() => window.__sync);
    if (process.env.SYNC_DUMP) console.log(JSON.stringify(log.map((x) => [x.e, x.src, Math.round(x.t)])));
    const r = checkSpeech(log);
    expect(r.spoken).toBeGreaterThan(mode === 'cold' ? 1 : 2);
    expect(r.problems).toEqual([]);
  });

  test(`listening quiz: each word stays with its question (${mode})`, async ({ page }) => {
    test.setTimeout(90000);
    await instrumentSpeech(page, { audio: AUDIO, visual: () => document.querySelector('[role=progressbar]')?.getAttribute('aria-valuenow') || '', answerSel: '[data-quiz-option], .grid button' });
    await newPlayer(page);
    if (mode === 'cold') await cold(page);
    await page.locator('[data-kdm-primary], button:has-text("START HERE")').first().click();   // a new player's first quiz = listening
    await page.locator('.grid button:visible').first().waitFor({ timeout: 30000 });   // cold: the pictures take ~8 s to load
    for (let i = 0; i < 4; i++) {
      await page.waitForTimeout(1800);   // a child listens, then taps
      const opt = page.locator('.grid button:visible').first();
      if (await opt.count()) await opt.click();
    }
    await page.waitForTimeout(2000);
    const log = await page.evaluate(() => window.__sync);
    if (process.env.SYNC_DUMP) console.log(JSON.stringify(log.map((x) => [x.e, x.src, Math.round(x.t)])));
    const r = checkSpeech(log);
    expect(r.spoken).toBeGreaterThan(2);
    expect(r.problems).toEqual([]);
  });

  test(`Spelling Forge: each word stays with its round (${mode})`, async ({ page }) => {
    test.setTimeout(90000);
    await instrumentSpeech(page, { audio: AUDIO, visual: () => (window.SF && SF.dbg.word && SF.dbg.word.en) || '' });
    await page.route('**/api/**', (r) => r.fulfill({ status: 204 }));
    await page.goto('/games/spelling-forge/index.html');
    if (mode === 'cold') await cold(page);
    await page.click('#startBtn');
    for (let i = 0; i < 3; i++) {
      await page.waitForTimeout(1500);
      await page.evaluate(() => { SF.dbg.solveForTest(); SF.forge(); });
      await page.waitForFunction(() => !SF.state.locked, null, { timeout: 15000 }).catch(() => {});
    }
    await page.waitForTimeout(2000);
    const log = await page.evaluate(() => window.__sync);
    if (process.env.SYNC_DUMP) console.log(JSON.stringify(log.map((x) => [x.e, x.src, Math.round(x.t)])));
    const r = checkSpeech(log);
    expect(r.problems).toEqual([]);
  });
}
