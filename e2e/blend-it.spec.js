// Blend It (/games/blend-it/, wave 3 11-12): word pool, answer-oracle rules over many dealt levels, nothing marked or
// spoken-early before the tap, the no-free-pass miss flow, a full run to the end card with zero errors, phone fit + tap
// size, language leak, contrast and speech sync.
import { test, expect } from '@playwright/test';
import { instrumentSpeech, checkSpeech } from './lib/speech-sync.mjs';
import { cold } from './lib/cold-net.mjs';
import { badWords, chiOk, fitProblems, leak, contrastProblems, visiblePrimaries } from './lib/game-checks.mjs';

const URL = '/games/blend-it/index.html';

async function open(page, q = '') {
  const land = [];
  page.on('request', (r) => { if (r.url().includes('/api/land')) land.push(r.url()); });
  await page.route('**/api/**', (r) => r.fulfill({ status: 204 }));
  await page.goto(URL + q);
  await page.waitForFunction(() => window.BI && window.CDE_STRINGS && window.cdeSay);
  return land;
}
const round = (page) => page.evaluate(() => BI.S.round);

test('word pool: CDE photo words with audio, consonant-vowel-consonant, never removed or a body part', async ({ page }) => {
  await open(page);
  const pool = await page.evaluate(() => BI.POOL);
  expect(badWords(pool)).toEqual([]);
  expect(pool.filter((w) => !/^[b-df-hj-np-tv-z][aeiou][b-df-hj-np-tv-z]$/.test(w) || /[rwy]$/.test(w))).toEqual([]);
  expect(pool.length).toBeGreaterThanOrEqual(18);
});

test('oracle: over 3,000 dealt levels — one right picture, level rules, no repeats, uniform answer position', async ({ page }) => {
  await open(page);
  const res = await page.evaluate(() => {
    const out = [];
    for (let li = 0; li < 3; li++) {
      const probs = [], pos = [];
      let near = 0;
      for (let k = 0; k < 1000; k++) {
        const p = BI.dbg.plan(li);
        if (p.length !== BI.ROUNDS) probs.push('plan length ' + p.length);
        if (new Set(p.map((r) => r.word)).size !== p.length) probs.push('a word twice in a level');
        for (const r of p) {
          if (r.opts.filter((w) => w === r.word).length !== 1) probs.push(r.word + ': not exactly one right picture');
          if (new Set(r.opts).size !== r.opts.length) probs.push(r.word + ': duplicate picture');
          if (r.opts.length !== BI.LEVELS[li].opts) probs.push(r.word + ': ' + r.opts.length + ' pictures');
          const ds = r.opts.filter((w) => w !== r.word);
          if (li === 0 && ds.some((d) => BI.dbg.same(d, r.word) > 0 || d[1] === r.word[1])) probs.push(r.word + ': L1 decoy shares a letter in place');
          if (li === 1 && BI.POOL.some((x) => x !== r.word && BI.dbg.same(x, r.word) === 2) && !ds.some((d) => BI.dbg.same(d, r.word) === 2)) probs.push(r.word + ': L2 has a near word but none dealt');
          if (li === 1 && ds.some((d) => BI.dbg.same(d, r.word) === 2)) near++;
          if (li === 2 && ds.some((d) => d[1] !== r.word[1])) probs.push(r.word + ': L3 decoy with another vowel');
          pos.push(r.opts.indexOf(r.word));
        }
      }
      out.push({ li, probs: [...new Set(probs)], pos, n: [3, 4, 4][li], near });
    }
    return out;
  });
  for (const r of res) {
    expect(r.probs, `level ${r.li + 1}`).toEqual([]);
    const c = chiOk(r.pos, r.n);
    expect(c.ok, `level ${r.li + 1} answer positions ${c.counts}`).toBe(true);
  }
  expect(res[1].near).toBeGreaterThan(1000);   // look-alikes really show up on level 2
});

test('nothing marks the answer before the tap (also after a 3 s idle); level 3 speaks nothing before the tap', async ({ page }) => {
  await page.addInitScript(() => {
    window.__played = [];
    const play = HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play = function (...a) { window.__played.push(this.currentSrc || this.src); return play.apply(this, a); };
    if (window.speechSynthesis) { const sp = speechSynthesis.speak.bind(speechSynthesis); speechSynthesis.speak = (u) => { window.__played.push('tts:' + u.text); return sp(u); }; }
  });
  await open(page);
  await page.click('#startBtn');
  await expect(page.locator('#app .opt')).toHaveCount(3);
  await page.waitForTimeout(3000);
  const st = await page.evaluate(() => {
    const opts = [...document.querySelectorAll('#app .opt')];
    return {
      marked: document.querySelectorAll('#app .opt.ok, #app .opt.no, #app .opt:disabled').length,
      labels: [...document.querySelectorAll('#app .opt .label')].filter((e) => e.getClientRects().length).length,
      alts: opts.map((b) => b.querySelector('img').alt).join(''),
      aria: opts.map((b) => b.getAttribute('aria-label')),
      words: opts.map((b) => b.dataset.word),
      sizes: new Set(opts.map((b) => { const r = b.getBoundingClientRect(); return Math.round(r.width) + 'x' + Math.round(r.height); })).size,
      looks: new Set(opts.map((b) => { const c = getComputedStyle(b); return c.borderColor + c.opacity + c.boxShadow; })).size,
      fb: document.querySelector('.feedback').textContent.trim(),
    };
  });
  expect(st.marked).toBe(0);
  expect(st.labels).toBe(0);
  expect(st.alts).toBe('');
  for (const [i, a] of st.aria.entries()) for (const w of st.words) expect(a.includes(w), `aria-label ${i}`).toBe(false);
  expect(st.sizes).toBe(1);
  expect(st.looks).toBe(1);
  expect(st.fb).toBe('');
  // level 3: the letters light up but no word clip is fetched or played before the first tap
  expect(await page.evaluate(() => window.__played.length)).toBeGreaterThan(0);   // levels 1–2 do speak the word
  await page.evaluate(() => { BI.dbg.startLevel(2); window.__played = []; });
  await page.waitForTimeout(3200);
  expect(await page.locator('.tiles.joined').count()).toBe(1);
  await page.click('#sayBtn');   // level 3's replay button lights the letters again, silently
  await page.waitForTimeout(2500);
  expect(await page.evaluate(() => window.__played)).toEqual([]);
  await page.evaluate(() => BI.dbg.solveForTest());
  await expect.poll(() => page.evaluate(() => window.__played.length)).toBeGreaterThan(0);   // spoken after the tap
});

test('a miss is never a free pass: the picture is marked, the round waits for the right tap, and it does not score', async ({ page }) => {
  await open(page);
  await page.click('#startBtn');
  for (const li of [0, 2]) {
    await page.evaluate((l) => BI.dbg.startLevel(l), li);
    await expect(page.locator('#app .opt')).toHaveCount(li ? 4 : 3);
    const before = await page.evaluate(() => ({ round: BI.S.round, score: BI.S.score, word: BI.dbg.round.word }));
    expect(await page.evaluate(() => BI.dbg.wrongForTest())).toBe(true);
    await expect(page.locator('#app .opt.no')).toHaveCount(1);
    await expect(page.locator('#app .opt.no')).toBeDisabled();
    await expect(page.locator('#app .opt.ok')).toHaveCount(0);   // the right one is not revealed
    await page.waitForTimeout(3000);
    expect(await round(page)).toBe(before.round);                  // no auto-advance
    await page.locator('#app .opt.no').click({ force: true });     // tapping the wrong one again does nothing
    expect(await round(page)).toBe(before.round);
    await page.locator(`#app .opt[data-word="${before.word}"]`).click();
    await expect(page.locator('#app .opt.ok .label')).toHaveText(before.word);
    await expect.poll(() => round(page), { timeout: 8000 }).toBe(before.round + 1);
    expect(await page.evaluate(() => BI.S.score)).toBe(before.score);   // a corrected miss does not score
  }
});

test('full run: 3 levels to the end card, zero errors, no /api/land under automation, one primary button', async ({ page }) => {
  test.setTimeout(180000);
  const errs = [];
  page.on('pageerror', (e) => errs.push('pageerror ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error') errs.push('console ' + m.text()); });
  const land = await open(page);
  await page.click('#startBtn');
  for (let li = 0; li < 3; li++) {
    for (let r = 0; r < 6; r++) {
      await page.waitForFunction((k) => BI.S.round === k && !BI.S.answered && document.querySelector('#app .opt'), r, { timeout: 10000 });
      expect(await page.evaluate(() => BI.S.lvl)).toBe(li);
      if (r === 1) expect(await page.evaluate(() => BI.dbg.wrongForTest())).toBe(true);
      expect(await page.evaluate(() => BI.dbg.solveForTest())).toBe(true);
      await expect(page.locator('#app .opt.ok')).toHaveCount(1);
    }
    if (li < 2) {
      await expect(page.locator('#app .card h2')).toHaveText('Level done!', { timeout: 10000 });
      await expect(page.locator('#app .card .score')).toHaveText('5 / 6');
      await page.click('#nextLevelBtn');
    }
  }
  await expect(page.locator('#app .card .cde-end')).toBeVisible({ timeout: 10000 });
  expect(await visiblePrimaries(page)).toBe(1);
  expect(errs).toEqual([]);
  expect(land).toEqual([]);
});

for (const vp of [{ width: 390, height: 844 }, { width: 320, height: 568 }]) {
  test(`phone fit ${vp.width}x${vp.height}: every level's tiles, pictures and buttons on screen, ≥ 44 px, no sideways scroll`, async ({ page }) => {
    test.setTimeout(90000);
    await page.setViewportSize(vp);
    await open(page);
    expect(await fitProblems(page, ['#startBtn', '#homePill'], ['#startBtn'])).toEqual([]);
    await page.click('#startBtn');
    for (const li of [0, 1, 2]) {
      await page.evaluate((l) => BI.dbg.startLevel(l), li);
      await page.waitForTimeout(400);
      expect(await fitProblems(page, ['.hud', '.tiles', '#sayBtn', '#app .opt'], ['#sayBtn', '#app .opt'])).toEqual([]);
      await page.evaluate(() => BI.dbg.wrongForTest());   // the miss line must fit too
      expect(await fitProblems(page, ['.feedback', '#app .opt'], ['#app .opt'])).toEqual([]);
      expect(await page.evaluate(() => scrollY)).toBe(0);
    }
    await page.evaluate(() => BI.dbg.startLevel(0));
    for (let r = 0; r < 6; r++) {
      await page.waitForFunction((k) => BI.S.round === k && !BI.S.answered && document.querySelector('#app .opt'), r, { timeout: 10000 });
      await page.evaluate(() => BI.dbg.solveForTest());
    }
    await expect(page.locator('#nextLevelBtn')).toBeVisible({ timeout: 10000 });
    expect(await fitProblems(page, ['#nextLevelBtn'])).toEqual([]);
  });
}

for (const lang of ['he', 'es', 'en']) {
  test(`language leak (${lang}): menu, play and miss screens`, async ({ page }) => {
    await page.addInitScript((l) => localStorage.setItem('cde_lang', l), lang);
    await open(page);
    expect(await page.evaluate(() => window.CDE_LANG)).toBe(lang);
    const out = [];
    const look = async (where) => (await leak(page)).forEach((t) => out.push(`${where}: ${t}`));
    await page.evaluate(() => document.querySelector('.about').setAttribute('aria-hidden', 'true'));   // parent FAQ: English by design
    await look('menu');
    await page.click('#startBtn');
    await page.waitForTimeout(500);
    await look('play');
    await page.evaluate(() => BI.dbg.wrongForTest());
    await look('miss');
    if (lang === 'he') expect(await page.evaluate(() => document.documentElement.getAttribute('data-cde-lang'))).toBe('he');
    expect(out).toEqual([]);
  });
}

test('contrast: menu, play and miss text ≥ 4.5:1 (≥ 3:1 for large text) on its real background', async ({ page }) => {
  await open(page);
  const SEL = '.sub, .pill, #startBtn, .about p, .hud-level, .hud-label, .tile, .feedback, .tip, .card h2, .card .score, .card p, .opt .label';
  expect(await contrastProblems(page, SEL)).toEqual([]);
  await page.click('#startBtn');
  await page.waitForTimeout(2600);   // letters lit
  expect(await contrastProblems(page, SEL)).toEqual([]);
  await page.evaluate(() => BI.dbg.wrongForTest());
  expect(await contrastProblems(page, SEL)).toEqual([]);
  await page.evaluate(() => BI.dbg.solveForTest());
  await page.waitForTimeout(300);
  expect(await contrastProblems(page, SEL)).toEqual([]);
});

for (const mode of ['warm', 'cold']) test(`speech sync (${mode}): a word never plays over the next round`, async ({ page }) => {
  test.skip(!!process.env.CI, 'speech-sync needs real audio output (CI has none)');
  test.setTimeout(90000);
  await instrumentSpeech(page, { audio: /\/audio\/[a-z0-9-]+\.mp3/, visual: () => (window.BI ? BI.dbg.roundKey : ''), answerSel: '#app .opt' });
  await open(page);
  if (mode === 'cold') await cold(page);
  await page.click('#startBtn');
  for (let i = 0; i < 5; i++) {
    await page.waitForTimeout(i % 2 ? 1300 : 2800);   // sometimes before the word is spoken, sometimes after
    if (i === 2) { await page.evaluate(() => BI.dbg.wrongForTest()); await page.waitForTimeout(900); }
    await page.evaluate(() => BI.dbg.solveForTest());
    await expect.poll(() => round(page), { timeout: 10000 }).toBe(i + 1);
  }
  await page.waitForTimeout(1500);
  const r = checkSpeech(await page.evaluate(() => window.__sync));
  expect(r.spoken).toBeGreaterThan(4);
  expect(r.problems).toEqual([]);
});
