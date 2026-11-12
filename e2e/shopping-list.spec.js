// Shopping List (/games/shopping-list/, wave 3 11-12): shelf words, oracle rules over many dealt levels, nothing
// marked before the pick, a not-ready tap is not a miss, the no-free-pass miss flow, a full run to the end card with
// zero errors, phone fit + tap size, language leak, contrast and speech sync (the list's words chain without overlap).
import { test, expect } from '@playwright/test';
import { instrumentSpeech, checkSpeech } from './lib/speech-sync.mjs';
import { cold } from './lib/cold-net.mjs';
import { badWords, chiOk, fitProblems, leak, contrastProblems, visiblePrimaries } from './lib/game-checks.mjs';

const URL = '/games/shopping-list/index.html';

async function open(page, q = '') {
  const land = [];
  page.on('request', (r) => { if (r.url().includes('/api/land')) land.push(r.url()); });
  await page.route('**/api/**', (r) => r.fulfill({ status: 204 }));
  await page.goto(URL + q);
  await page.waitForFunction(() => window.SL && window.CDE_STRINGS && window.cdeSay);
  return land;
}
const ready = (page, ms = 20000) => page.waitForFunction(() => SL.dbg.round && !SL.S.listening && !SL.S.answered && document.querySelector('.shelf .opt'), null, { timeout: ms });
const round = (page) => page.evaluate(() => SL.S.round);

test('shelf words: CDE food photos with audio, never removed or a body part; look-alike pairs are real shelf words', async ({ page }) => {
  await open(page);
  const D = await page.evaluate(() => SL.D);
  expect(badWords(D.SHELF)).toEqual([]);
  expect(new Set(D.SHELF).size).toBe(D.SHELF.length);
  expect(D.SAME.flat().filter((w) => !D.SHELF.includes(w))).toEqual([]);
  expect(D.SHELF.length).toBeGreaterThanOrEqual(20);
});

test('oracle: over 3,000 dealt levels — list on the shelf, no look-alikes together, no repeats, uniform places', async ({ page }) => {
  await open(page);
  const res = await page.evaluate(() => {
    const out = [];
    for (let li = 0; li < 3; li++) {
      const lv = SL.LEVELS[li], probs = [], pos = [];
      for (let k = 0; k < 1000; k++) {
        const p = SL.dbg.plan(li);
        if (p.length !== SL.ROUNDS) probs.push('plan length ' + p.length);
        if (new Set(p.map((r) => r.list[0])).size !== p.length) probs.push('same first word twice');
        for (const r of p) {
          if (r.shelf.length !== lv.shelf) probs.push('shelf of ' + r.shelf.length);
          if (r.list.length !== lv.n) probs.push('list of ' + r.list.length);
          if (new Set(r.shelf).size !== r.shelf.length) probs.push('duplicate on the shelf');
          if (new Set(r.list).size !== r.list.length) probs.push('duplicate in the list');
          if (!r.list.every((w) => r.shelf.includes(w))) probs.push('list word not on the shelf');
          for (const a of r.shelf) for (const b of r.shelf) if (a !== b && SL.dbg.clash(a, b)) probs.push(`look-alikes ${a}/${b} on one shelf`);
          r.list.forEach((w) => pos.push(r.shelf.indexOf(w)));
        }
      }
      out.push({ li, probs: [...new Set(probs)], pos, n: lv.shelf });
    }
    return out;
  });
  for (const r of res) {
    expect(r.probs, `level ${r.li + 1}`).toEqual([]);
    const c = chiOk(r.pos, r.n);
    expect(c.ok, `level ${r.li + 1} list places ${c.counts}`).toBe(true);
  }
});

test('nothing marks a listed food before the pick; a tap while the list is first read is not a miss', async ({ page }) => {
  await open(page);
  await page.click('#startBtn');
  await expect(page.locator('.shelf .opt')).toHaveCount(6);
  // not ready: tapping while the list is read the first time does nothing (no miss, nothing picked)
  expect(await page.evaluate(() => SL.S.listening)).toBe(true);
  await page.locator('.shelf .opt').first().click({ force: true });
  expect(await page.evaluate(() => ({ m: SL.S.missed, got: SL.S.got }))).toEqual({ m: false, got: 0 });
  await ready(page);
  await page.waitForTimeout(3000);
  const st = await page.evaluate(() => {
    const opts = [...document.querySelectorAll('.shelf .opt')];
    return {
      marked: document.querySelectorAll('.shelf .opt.hint, .shelf .opt.picked, .shelf .opt.no, .shelf .opt:disabled').length,
      alts: opts.map((b) => b.querySelector('img').alt).join(''),
      aria: opts.map((b) => b.getAttribute('aria-label')).join(' '),
      words: opts.map((b) => b.dataset.word),
      text: opts.map((b) => b.textContent.trim()).join(''),
      sizes: new Set(opts.map((b) => { const r = b.getBoundingClientRect(); return Math.round(r.width) + 'x' + Math.round(r.height); })).size,
      looks: new Set(opts.map((b) => { const c = getComputedStyle(b); return c.borderColor + c.opacity + c.boxShadow; })).size,
      basket: document.querySelector('.basket').textContent.replace(/\d/g, '').trim(),
      labels: document.querySelectorAll('.shelf .label').length,
    };
  });
  expect(st.marked).toBe(0);
  expect(st.alts).toBe('');
  expect(st.text).toBe('');
  for (const w of st.words) expect(st.aria.includes(w)).toBe(false);
  expect(st.sizes).toBe(1);
  expect(st.looks).toBe(1);
  expect(st.basket).toBe('');   // the list is never written before it is picked
  expect(st.labels).toBe(0);
});

test('a miss is never a free pass: the next food is rung and said, the round waits for it, and it does not score', async ({ page }) => {
  test.setTimeout(60000);
  await open(page);
  await page.click('#startBtn');
  await page.evaluate(() => SL.dbg.startLevel(1));
  await ready(page);
  const before = await page.evaluate(() => ({ round: SL.S.round, score: SL.S.score, need: SL.dbg.need, list: SL.dbg.round.list }));
  expect(await page.evaluate(() => SL.dbg.wrongForTest())).toBe(true);
  await expect(page.locator('.shelf .opt.hint')).toHaveCount(1);
  await expect(page.locator(`.shelf .opt.hint[data-word="${before.need}"]`)).toHaveCount(1);
  expect(await page.evaluate(() => SL.S.got)).toBe(0);
  await page.waitForTimeout(3000);
  expect(await round(page)).toBe(before.round);   // no auto-advance
  for (const w of before.list) await page.locator(`.shelf .opt[data-word="${w}"]`).click();
  await expect(page.locator('.basket .slot.filled')).toHaveCount(3);
  for (const w of before.list) await expect(page.locator(`.shelf .opt.picked[data-word="${w}"] .label`)).toHaveText(w);
  await expect.poll(() => round(page), { timeout: 10000 }).toBe(before.round + 1);
  expect(await page.evaluate(() => SL.S.score)).toBe(before.score);   // a round with a miss does not score
  // the right food too EARLY is a miss as well (order matters)
  await ready(page);
  const r2 = await page.evaluate(() => SL.dbg.round.list);
  await page.locator(`.shelf .opt[data-word="${r2[1]}"]`).click();
  expect(await page.evaluate(() => ({ m: SL.S.missed, got: SL.S.got }))).toEqual({ m: true, got: 0 });
});

test('full run: 3 levels to the end card, zero errors, no /api/land under automation, one primary button', async ({ page }) => {
  test.setTimeout(300000);
  const errs = [];
  page.on('pageerror', (e) => errs.push('pageerror ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error') errs.push('console ' + m.text()); });
  const land = await open(page);
  await page.click('#startBtn');
  for (let li = 0; li < 3; li++) {
    for (let r = 0; r < 5; r++) {
      await page.waitForFunction((k) => SL.S.round === k, r, { timeout: 15000 });
      await ready(page);
      expect(await page.evaluate(() => SL.S.lvl)).toBe(li);
      if (r === 1) expect(await page.evaluate(() => SL.dbg.wrongForTest())).toBe(true);
      for (let k = 0; k <= li + 1; k++) expect(await page.evaluate(() => SL.dbg.solveForTest())).toBe(true);
      expect(await page.evaluate(() => SL.S.answered)).toBe(true);
    }
    if (li < 2) {
      await expect(page.locator('#app .card h2')).toHaveText('Level done!', { timeout: 10000 });
      await expect(page.locator('#app .card .score')).toHaveText('4 / 5');
      await page.click('#nextLevelBtn');
    }
  }
  await expect(page.locator('#app .card .cde-end')).toBeVisible({ timeout: 10000 });
  expect(await visiblePrimaries(page)).toBe(1);
  expect(errs).toEqual([]);
  expect(land).toEqual([]);
});

for (const vp of [{ width: 390, height: 844 }, { width: 320, height: 568 }]) {
  test(`phone fit ${vp.width}x${vp.height}: basket, replay and every shelf picture on screen, ≥ 44 px, no sideways scroll`, async ({ page }) => {
    test.setTimeout(120000);
    await page.setViewportSize(vp);
    await open(page);
    expect(await fitProblems(page, ['#startBtn', '#homePill'], ['#startBtn'])).toEqual([]);
    await page.click('#startBtn');
    for (const li of [0, 1, 2]) {
      await page.evaluate((l) => SL.dbg.startLevel(l), li);
      await ready(page);
      await page.evaluate(() => SL.dbg.solveForTest());
      await page.evaluate(() => SL.dbg.wrongForTest());   // the hint + miss line must fit too
      expect(await fitProblems(page, ['.hud', '.basket .slot', '#hearBtn', '.shelf .opt', '.feedback'], ['#hearBtn', '.shelf .opt'])).toEqual([]);
      expect(await page.evaluate(() => scrollY)).toBe(0);
      // every shelf word fits uncut on a picked picture at this level's size (watermelon, strawberry)
      const cut = await page.evaluate(() => {
        const lab = document.querySelector('.shelf .opt.picked .label'), keep = lab.textContent, out = [];
        for (const w of SL.D.SHELF) { lab.textContent = w; if (lab.scrollWidth > lab.clientWidth + 1) out.push(w); }
        lab.textContent = keep; return out;
      });
      expect(cut, `level ${li + 1}`).toEqual([]);
    }
    await page.evaluate(() => SL.dbg.startLevel(0));
    for (let r = 0; r < 5; r++) {
      await page.waitForFunction((k) => SL.S.round === k, r, { timeout: 15000 });
      await ready(page);
      await page.evaluate(() => { SL.dbg.solveForTest(); SL.dbg.solveForTest(); });
    }
    await expect(page.locator('#nextLevelBtn')).toBeVisible({ timeout: 10000 });
    expect(await fitProblems(page, ['#nextLevelBtn'])).toEqual([]);
  });
}

for (const lang of ['he', 'es', 'en']) {
  test(`language leak (${lang}): menu, listening, play and miss screens`, async ({ page }) => {
    test.setTimeout(60000);
    await page.addInitScript((l) => localStorage.setItem('cde_lang', l), lang);
    await open(page);
    expect(await page.evaluate(() => window.CDE_LANG)).toBe(lang);
    const out = [];
    const look = async (where) => (await leak(page)).forEach((t) => out.push(`${where}: ${t}`));
    await page.evaluate(() => document.querySelector('.about').setAttribute('aria-hidden', 'true'));   // parent FAQ: English by design
    await look('menu');
    await page.click('#startBtn');
    await page.waitForTimeout(300);
    await look('listening');
    await ready(page);
    await look('your turn');
    await page.evaluate(() => SL.dbg.solveForTest());
    await look('one picked');
    await page.evaluate(() => SL.dbg.wrongForTest());
    await look('miss');
    if (lang === 'he') expect(await page.evaluate(() => document.documentElement.getAttribute('data-cde-lang'))).toBe('he');
    expect(out).toEqual([]);
  });
}

test('contrast: menu, play and miss text ≥ 4.5:1 (≥ 3:1 for large text) on its real background', async ({ page }) => {
  await open(page);
  const SEL = '.sub, .pill, #startBtn, .about p, .hud-level, .hud-label, .slot .num, .opt .label, .feedback, .card h2, .card .score, .card p';
  expect(await contrastProblems(page, SEL)).toEqual([]);
  await page.click('#startBtn');
  await page.waitForTimeout(500);
  expect(await contrastProblems(page, SEL)).toEqual([]);
  await ready(page);
  await page.evaluate(() => SL.dbg.solveForTest());
  await page.evaluate(() => SL.dbg.wrongForTest());
  expect(await contrastProblems(page, SEL)).toEqual([]);
});

for (const mode of ['warm', 'cold']) test(`speech sync (${mode}): the list's words never play over the next round`, async ({ page }) => {
  test.skip(!!process.env.CI, 'speech-sync needs real audio output (CI has none)');
  test.setTimeout(120000);
  await instrumentSpeech(page, { audio: /\/audio\/[a-z0-9-]+\.mp3/, visual: () => (window.SL ? SL.dbg.roundKey : ''), answerSel: '.shelf .opt' });
  await open(page);
  if (mode === 'cold') await cold(page);
  await page.click('#startBtn');
  for (let i = 0; i < 4; i++) {
    await ready(page, 30000);
    await page.waitForTimeout(700);
    if (i === 1) { await page.evaluate(() => SL.dbg.wrongForTest()); await page.waitForTimeout(900); }
    if (i === 2) { await page.click('#hearBtn'); await page.waitForTimeout(600); }   // a replay cut short by the picks
    await page.evaluate(() => SL.dbg.solveForTest());
    await page.waitForTimeout(500);
    await page.evaluate(() => SL.dbg.solveForTest());
    await expect.poll(() => round(page), { timeout: 15000 }).toBe(i + 1);
  }
  await page.waitForTimeout(1500);
  const r = checkSpeech(await page.evaluate(() => window.__sync));
  expect(r.spoken).toBeGreaterThan(8);
  expect(r.problems).toEqual([]);
});
