// Letter Drop (/games/letter-drop/, wave 3 11-12): word data, the falling-letter oracle rules, the no-free-pass miss
// (a heart, the letter shown, still has to be caught), soft lives, a full run to the end card with zero errors, phone
// fit + tap size, language leak, contrast and speech sync.
import { test, expect } from '@playwright/test';
import { instrumentSpeech, checkSpeech } from './lib/speech-sync.mjs';
import { cold } from './lib/cold-net.mjs';
import { badWords, chiOk, fitProblems, leak, contrastProblems, visiblePrimaries } from './lib/game-checks.mjs';

const URL = '/games/letter-drop/index.html';

async function open(page, q = '') {
  const land = [];
  page.on('request', (r) => { if (r.url().includes('/api/land')) land.push(r.url()); });
  await page.route('**/api/**', (r) => r.fulfill({ status: 204 }));
  await page.goto(URL + q);
  await page.waitForFunction(() => window.LD && window.CDE_STRINGS && window.cdeSay);
  return land;
}
// catch the next letter through its real falling button (waits until one is in reach)
async function catchNext(page) {
  await page.waitForFunction(() => LD.dbg.solveForTest(), null, { timeout: 15000, polling: 100 });
}
async function miss(page) {
  await page.waitForFunction(() => LD.dbg.wrongForTest(), null, { timeout: 15000, polling: 100 });
}
// catch every remaining letter of the current word
async function finishWord(page) {
  const w = await page.evaluate(() => LD.dbg.word);
  const k = w.length - (await page.evaluate(() => LD.S.pos));
  for (let i = 0; i < k; i++) await catchNext(page);
}

test('word data: CDE photo words with audio, 3 / 4 / 5 letters per level, never removed or a body part', async ({ page }) => {
  await open(page);
  const D = await page.evaluate(() => LD.D);
  expect(badWords(D.LEVELS.flat())).toEqual([]);
  D.LEVELS.forEach((ws, li) => {
    expect(ws.filter((w) => w.length !== li + 3 || !/^[a-z]+$/.test(w)), `level ${li + 1}`).toEqual([]);
    expect(new Set(ws).size, `level ${li + 1}`).toBeGreaterThanOrEqual(15);
  });
  for (const [k, v] of Object.entries(D.CONFUSE)) expect(v.includes(k), `${k} confused with itself`).toBe(false);
});

test('oracle: the needed letter is only part of what falls, decoys are never it, lanes are uniform', async ({ page }) => {
  await open(page);
  const r = await page.evaluate(() => {
    const out = { bad: [], needOn: 0, nOn: 0, needOff: 0, nOff: 0, own: 0, ownN: 0, lanes: [] };
    for (const ws of LD.D.LEVELS) for (const w of ws) for (let pos = 0; pos < w.length; pos++) {
      const need = w[pos], others = w.split('').filter((c, i) => i !== pos && c !== need);
      for (let k = 0; k < 200; k++) {
        const on = LD.dbg.chooseLetter(w, pos, true, 0);
        out.nOn++; if (on === need) out.needOn++;
        if (on !== need && others.length) { out.ownN++; if (others.includes(on)) out.own++; }
        const off = LD.dbg.chooseLetter(w, pos, false, 0);
        out.nOff++; if (off === need) out.needOff++;
        if (LD.dbg.chooseLetter(w, pos, false, 2) !== need) out.bad.push(`${w}@${pos}: no needed letter after 2 dry spawns`);
        if (!/^[a-z]$/.test(on) || !/^[a-z]$/.test(off)) out.bad.push(`${w}: not a letter`);
      }
    }
    for (let k = 0; k < 4000; k++) out.lanes.push(LD.dbg.chooseLane([0, 1, 2, 3]));
    out.bad = [...new Set(out.bad)];
    return out;
  });
  expect(r.bad).toEqual([]);
  expect(r.needOn / r.nOn).toBeLessThan(0.2);    // with one in reach, the needed letter is rare
  expect(r.needOff / r.nOff).toBeGreaterThan(0.4);
  expect(r.needOff / r.nOff).toBeLessThan(0.6);  // even with none in reach it is not every letter
  expect(r.own / r.ownN).toBeGreaterThan(0.3);   // the word's own other letters fall: order matters
  const c = chiOk(r.lanes, 4);
  expect(c.ok, `lanes ${c.counts}`).toBe(true);
});

test('a live drop: every tile looks the same, the needed letter is a minority and uses every lane; nothing marks it', async ({ page }) => {
  test.setTimeout(60000);
  await open(page);
  await page.click('#startBtn');
  await page.waitForTimeout(9000);
  const st = await page.evaluate(() => {
    const ts = [...document.querySelectorAll('#field .tile:not(.got):not(.bad)')];
    return {
      n: ts.length,
      looks: new Set(ts.map((b) => { const c = getComputedStyle(b); return c.backgroundColor + c.borderColor + c.color + c.width + c.height + c.fontSize + c.boxShadow; })).size,
      classes: new Set(ts.map((b) => b.className)).size,
      spawned: LD.dbg.spawned,
      fieldH: LD.dbg.fieldH,
      // the word's slots are not buttons and must not look like the falling tiles or a button (11-12: a .ghost class
      // name clash drew level 1's faint letters as bordered boxes that looked tappable)
      slotBox: [...document.querySelectorAll('.slot')].map((s) => { const c = getComputedStyle(s); return c.borderTopWidth + ' ' + c.borderLeftWidth + ' ' + c.backgroundColor; }),
    };
  });
  for (const b of st.slotBox) expect(b).toBe('0px 0px rgba(0, 0, 0, 0)');
  expect(st.n).toBeGreaterThan(2);
  expect(st.looks).toBe(1);
  expect(st.classes).toBe(1);
  const needShare = st.spawned.filter((s) => s.need).length / st.spawned.length;
  expect(needShare).toBeLessThan(0.75);
  expect(st.spawned.length).toBeGreaterThan(5);
});

test('a miss is never a free pass: a heart, the letter shows, the word waits for it, and it does not score', async ({ page }) => {
  test.setTimeout(90000);
  await open(page);
  await page.click('#startBtn');
  await page.evaluate(() => LD.dbg.startLevel(1));   // level 2: empty slots
  await catchNext(page);
  const before = await page.evaluate(() => ({ pos: LD.S.pos, need: LD.dbg.need, round: LD.S.round, score: LD.S.score, hearts: LD.S.hearts }));
  await expect(page.locator('.slot').nth(before.pos)).toHaveText('');
  await miss(page);
  expect(await page.evaluate(() => ({ pos: LD.S.pos, hearts: LD.S.hearts }))).toEqual({ pos: before.pos, hearts: before.hearts - 1 });
  await expect(page.locator('.slot').nth(before.pos)).toHaveText(before.need);
  await expect(page.locator('.slot.shown')).toHaveCount(1);
  await expect(page.locator('.feedback .en').first()).toHaveText(before.need);
  await expect(page.locator('.hearts .hrt.on')).toHaveCount(2);
  await page.waitForTimeout(3000);
  expect(await page.evaluate(() => ({ pos: LD.S.pos, round: LD.S.round }))).toEqual({ pos: before.pos, round: before.round });
  await finishWord(page);
  await expect.poll(() => page.evaluate(() => LD.S.round), { timeout: 10000 }).toBe(before.round + 1);
  expect(await page.evaluate(() => LD.S.score)).toBe(before.score);
});

test('out of hearts: soft lives — the same word again with 3 new hearts, progress kept, never thrown out, no score', async ({ page }) => {
  test.setTimeout(90000);
  const errs = [];
  page.on('pageerror', (e) => errs.push(e.message));
  await open(page);
  await page.click('#startBtn');
  await page.waitForFunction(() => LD.S.running);
  await finishWord(page);   // word 1 clean
  await page.waitForFunction(() => LD.S.round === 1 && LD.S.running, null, { timeout: 15000 });
  const word = await page.evaluate(() => LD.dbg.word);
  await catchNext(page);
  for (let i = 0; i < 3; i++) await miss(page);
  await expect(page.locator('.feedback')).toContainText('Out of hearts!');
  await page.waitForFunction(() => LD.S.running && LD.S.hearts === 3, null, { timeout: 10000 });
  expect(await page.evaluate(() => ({ lvl: LD.S.lvl, round: LD.S.round, pos: LD.S.pos, word: LD.dbg.word, score: LD.S.score }))).toEqual({ lvl: 0, round: 1, pos: 0, word, score: 1 });
  await expect(page.locator('.feedback')).toContainText('3 new hearts');
  await expect(page.locator('#app .card')).toHaveCount(0);   // no game-over card, no end card
  await finishWord(page);
  await page.waitForFunction(() => LD.S.round === 2, null, { timeout: 15000 });
  expect(await page.evaluate(() => LD.S.score)).toBe(1);    // the restarted word does not score
  expect(errs).toEqual([]);
});

test('full run: 3 levels to the end card, zero errors, no /api/land under automation, one primary button', async ({ page }) => {
  test.setTimeout(420000);
  const errs = [];
  page.on('pageerror', (e) => errs.push('pageerror ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error') errs.push('console ' + m.text()); });
  const land = await open(page);
  await page.click('#startBtn');
  for (let li = 0; li < 3; li++) {
    for (let r = 0; r < 5; r++) {
      await page.waitForFunction((k) => LD.S.round === k && !LD.S.answered && document.querySelector('#field'), r, { timeout: 15000 });
      expect(await page.evaluate(() => LD.S.lvl)).toBe(li);
      if (r === 1) await miss(page);
      await finishWord(page);
      expect(await page.evaluate(() => LD.S.answered)).toBe(true);
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
  test(`phone fit ${vp.width}x${vp.height}: picture, slots, hearts and the whole drop field on screen, tiles ≥ 44 px, no sideways scroll`, async ({ page }) => {
    test.setTimeout(120000);
    await page.setViewportSize(vp);
    await open(page);
    expect(await fitProblems(page, ['#startBtn', '#homePill'], ['#startBtn'])).toEqual([]);
    await page.click('#startBtn');
    for (const li of [0, 1, 2]) {
      await page.evaluate((l) => LD.dbg.startLevel(l), li);
      await page.waitForTimeout(3500);
      await miss(page);   // the miss line must fit too
      await page.waitForTimeout(400);
      expect(await fitProblems(page, ['.hud', '.pic', '.slot', '#sayBtn', '.feedback', '#field'], ['#sayBtn'])).toEqual([]);
      const t = await page.evaluate(() => {
        const f = document.querySelector('#field').getBoundingClientRect();
        return [...document.querySelectorAll('#field .tile')].map((b) => { const r = b.getBoundingClientRect(); return { l: r.left - f.left, r: f.right - r.right, w: r.width, h: r.height }; });
      });
      expect(t.length).toBeGreaterThan(0);
      for (const x of t) { expect(x.l).toBeGreaterThanOrEqual(0); expect(x.r).toBeGreaterThanOrEqual(0); expect(Math.min(x.w, x.h)).toBeGreaterThanOrEqual(44); }
      expect(await page.evaluate(() => [scrollY, document.documentElement.scrollHeight <= innerHeight + 1])).toEqual([0, true]);
    }
    await page.evaluate(() => LD.dbg.startLevel(0));
    for (let r = 0; r < 5; r++) {
      await page.waitForFunction((k) => LD.S.round === k && !LD.S.answered && document.querySelector('#field'), r, { timeout: 15000 });
      await finishWord(page);
    }
    await expect(page.locator('#nextLevelBtn')).toBeVisible({ timeout: 10000 });
    expect(await fitProblems(page, ['#nextLevelBtn'])).toEqual([]);
  });
}

for (const lang of ['he', 'es', 'en']) {
  test(`language leak (${lang}): menu, play, miss and out-of-hearts screens`, async ({ page }) => {
    test.setTimeout(60000);
    await page.addInitScript((l) => localStorage.setItem('cde_lang', l), lang);
    await open(page);
    expect(await page.evaluate(() => window.CDE_LANG)).toBe(lang);
    const out = [];
    const look = async (where) => (await leak(page)).forEach((t) => out.push(`${where}: ${t}`));
    await page.evaluate(() => document.querySelector('.about').setAttribute('aria-hidden', 'true'));   // parent FAQ: English by design
    await look('menu');
    await page.click('#startBtn');
    await catchNext(page);
    await look('play');
    await miss(page);
    await look('miss');
    await miss(page); await miss(page);
    await expect(page.locator('.feedback')).not.toBeEmpty();
    await page.waitForFunction(() => LD.S.running && LD.S.hearts === 3, null, { timeout: 10000 });
    await look('out of hearts');
    if (lang === 'he') expect(await page.evaluate(() => document.documentElement.getAttribute('data-cde-lang'))).toBe('he');
    expect(out).toEqual([]);
  });
}

test('contrast: menu, play, miss and out-of-hearts text ≥ 4.5:1 (≥ 3:1 for large text) on its real background', async ({ page }) => {
  test.setTimeout(60000);
  await open(page);
  const SEL = '.sub, .pill, #startBtn, .about p, .hud-level, .slot, .tile, .feedback, .card h2, .card .score, .card p';
  expect(await contrastProblems(page, SEL)).toEqual([]);
  await page.click('#startBtn');
  await catchNext(page);
  expect(await contrastProblems(page, SEL)).toEqual([]);
  await miss(page);
  await page.waitForTimeout(400);
  expect(await contrastProblems(page, SEL)).toEqual([]);
  await miss(page); await miss(page);
  await page.waitForFunction(() => LD.S.running && LD.S.hearts === 3, null, { timeout: 10000 });
  expect(await contrastProblems(page, SEL)).toEqual([]);
});

for (const mode of ['warm', 'cold']) test(`speech sync (${mode}): a word never plays over the next word`, async ({ page }) => {
  test.skip(!!process.env.CI, 'speech-sync needs real audio output (CI has none)');
  test.setTimeout(150000);
  await instrumentSpeech(page, { audio: /\/audio\/[a-z0-9-]+\.mp3/, visual: () => (window.LD ? LD.dbg.roundKey : ''), answerSel: '#field .tile' });
  await open(page);
  if (mode === 'cold') await cold(page);
  await page.click('#startBtn');
  for (let i = 0; i < 4; i++) {
    await page.waitForFunction((k) => LD.S.round === k && LD.S.running, i, { timeout: 20000 });
    if (i === 1) await miss(page);
    if (i === 2) await page.click('#sayBtn');
    await finishWord(page);
  }
  await expect.poll(() => page.evaluate(() => LD.S.round), { timeout: 15000 }).toBe(4);
  await page.waitForTimeout(1500);
  const r = checkSpeech(await page.evaluate(() => window.__sync));
  expect(r.spoken).toBeGreaterThan(6);
  expect(r.problems).toEqual([]);
});
