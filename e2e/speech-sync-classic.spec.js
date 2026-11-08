import { test, expect } from '@playwright/test';
import { instrumentSpeech, checkSpeech } from './lib/speech-sync.mjs';
import { cold } from './lib/cold-net.mjs';

// Kit §8g speech-sync for the first-wave word games that play their own clips (Sound Pairs, Letter Twins, Read It):
// a word must not still be playing when the next round shows. Real audio, a child's pace, warm AND cold (11-08 sweep).
// The round is read from the page: the options' words / letters plus the shown word and pictures.
const GAMES = [
  { id: 'sound-pairs', audio: /\/audio\/pairs\/[a-z0-9-]+\.mp3/ },
  { id: 'letter-twins', audio: /\/audio\/[a-z0-9-]+\.mp3/ },
  { id: 'read-it', audio: /\/audio\/cvc\/[a-z0-9-]+\.mp3/ },
];
const visual = () => {
  const app = document.getElementById('app');
  if (!app || !app.querySelector('.opt')) return '';
  return [...app.querySelectorAll('.opt')].map((b) => b.dataset.word || b.dataset.letter || '').join(',') + '|' +
    (document.getElementById('readWord')?.textContent || '') + '|' + [...app.querySelectorAll('img')].map((i) => i.getAttribute('src')).join(',');
};

test.skip(!!process.env.CI, 'speech-sync needs real audio output (CI has none)');

for (const g of GAMES) for (const mode of ['warm', 'cold']) {
  test(`${g.id} speech sync (${mode}): a word never plays over the next round`, async ({ page }) => {
    test.setTimeout(120000);
    await instrumentSpeech(page, { audio: g.audio, visual, answerSel: '#app .opt' });
    await page.addInitScript(() => { try { localStorage.setItem('cde_internal', '1'); } catch (e) {} });
    await page.route('**/api/**', (r) => r.fulfill({ status: 204 }));
    await page.goto(`/games/${g.id}/index.html`);
    if (mode === 'cold') await cold(page);
    await page.click('#startBtn');
    for (let i = 0; i < 6; i++) {
      await page.waitForSelector('#app .opt');
      const before = await page.evaluate(visual);
      await page.waitForTimeout(1600); // a child listens, then taps
      // right answers mostly (the word plays on the tap), one wrong to cover the Next path
      await page.evaluate((wrong) => {
        const opts = [...document.querySelectorAll('#app .opt')];
        const ok = opts.filter((b) => b.dataset.right === '1');
        (wrong ? opts[opts.length - 1] : opts[Math.floor(Math.random() * opts.length)]).click();
        return ok.length;
      }, i === 2);
      // the round moves on by itself after a right answer; a wrong one shows Next (Sound Pairs only after both words)
      const nx = page.locator('#app button.next');
      for (let t = 0; t < 60; t++) {
        if (await page.evaluate((f) => (new Function('return (' + f + ')()'))(), visual.toString()) !== before) break;
        if (await nx.count()) { await page.waitForTimeout(1500); await nx.first().click(); }
        await page.waitForTimeout(250);
      }
    }
    await page.waitForTimeout(2500);
    const log = await page.evaluate(() => window.__sync), r = checkSpeech(log);
    if (r.problems.length && process.env.SYNC_DEBUG) console.log(JSON.stringify(log.map((x) => [x.e, Math.round(x.t), x.src || ''])));
    expect(r.spoken).toBeGreaterThan(5);
    expect(r.problems).toEqual([]);
  });
}

// The two arcades speak the word to find / sort as it comes up; the screen's "round" is that word.
const ARCADES = [
  { id: 'word-zapper', key: () => (window.WZ && WZ.dbg.screen === 'play' && WZ.dbg.targetWord()) || '',
    ready: () => window.WZ && WZ.dbg.screen === 'play' && WZ.dbg.hasTargetSprite(), move: () => WZ.dbg.solveForTest() },
  { id: 'category-conveyor', key: () => (window.CC && CC.dbg.screen === 'play' && CC.dbg.activeWord()) || '',
    ready: () => window.CC && CC.dbg.screen === 'play' && !!CC.dbg.activeWord(), move: () => { const c = CC.dbg.activeCat(); if (c) CC.tapBin(c); } },
];
for (const g of ARCADES) for (const mode of ['warm', 'cold']) {
  test(`${g.id} speech sync (${mode}): the word to find never plays over the next one`, async ({ page }) => {
    test.setTimeout(120000);
    await instrumentSpeech(page, { audio: /\/audio\/[a-z0-9-]+\.mp3/, visual: g.key, answerSel: 'canvas, .bin, button' });
    await page.addInitScript(() => { try { localStorage.setItem('cde_internal', '1'); } catch (e) {} });
    await page.route('**/api/**', (r) => r.fulfill({ status: 204 }));
    await page.goto(`/games/${g.id}/index.html`);
    if (mode === 'cold') await cold(page);
    await page.click('#startBtn');
    for (let i = 0; i < 6; i++) {
      await page.waitForFunction(g.ready, null, { timeout: 15000 });
      const before = await page.evaluate(g.key);
      await page.waitForTimeout(1800); // a child hears the word, then finds it
      await page.evaluate(g.move);
      await page.waitForFunction(([f, b]) => { const v = (new Function('return (' + f + ')()'))(); return v && v !== b; }, [g.key.toString(), before], { timeout: 15000 }).catch(() => {});
    }
    await page.waitForTimeout(2500);
    const log = await page.evaluate(() => window.__sync), r = checkSpeech(log);
    if (r.problems.length && process.env.SYNC_DEBUG) console.log(JSON.stringify(log.map((x) => [x.e, Math.round(x.t), x.src || ''])));
    expect(r.spoken).toBeGreaterThan(4);
    expect(r.problems).toEqual([]);
  });
}

// Projector: the teacher reveals a card (the word plays) and goes on to the next card at a teacher's pace.
for (const mode of ['warm', 'cold']) {
  test(`projector speech sync (${mode}): a word never plays over the next card`, async ({ page, isMobile }) => {
    test.skip(isMobile, 'a projector is a desktop screen');
    test.setTimeout(90000);
    await instrumentSpeech(page, { audio: /\/audio\/[a-z0-9-]+\.mp3/, visual: () => document.getElementById('count')?.textContent || '', answerSel: '#bNext' });
    await page.route('**/api/**', (r) => r.fulfill({ status: 204 }));
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/projector/index.html');
    if (mode === 'cold') await cold(page);
    await page.click('#catGrid [data-id="animals"]');
    await page.click('#go');
    for (let i = 0; i < 5; i++) {
      await page.waitForTimeout(1200);
      await page.click('#bNext'); // reveal: the word plays
      await page.waitForTimeout(i % 2 ? 2000 : 500); // a quick teacher goes on before the word ends
      await page.click('#bNext');
    }
    await page.waitForTimeout(2500);
    const r = checkSpeech(await page.evaluate(() => window.__sync));
    expect(r.spoken).toBeGreaterThan(3);
    expect(r.problems).toEqual([]);
  });
}
