// Sentence Builder (/games/sentence-builder/, wave 2 11-08): sentences + clips, tile oracles over many dealt levels
// (lowercase, no full stop, never dealt in order, uniform first-word position, the level-3 extra article), tap-back,
// the miss flow, a full run to the end card with zero errors, phone fit + tap size, language leak, contrast and speech.
import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { instrumentSpeech, checkSpeech } from './lib/speech-sync.mjs';
import { cold } from './lib/cold-net.mjs';

const URL = '/games/sentence-builder/index.html';
const PUB = path.resolve('public');

async function open(page) {
  const land = [];
  page.on('request', (r) => { if (r.url().includes('/api/land')) land.push(r.url()); });
  await page.route('**/api/**', (r) => r.fulfill({ status: 204 }));
  await page.goto(URL);
  await page.waitForFunction(() => window.SB && window.CDE_STRINGS && window.cdeSay);
  return land;
}

test('data: every sentence a level can deal has its clip and its picture', async ({ page }) => {
  await open(page);
  const d = await page.evaluate(() => {
    const W = SB.W, out = [];
    for (const g of Object.keys(W.GROUPS)) for (const w of W.GROUPS[g]) out.push([w, SB.dbg.sentence(SB.dbg.words(w, 0))]);
    for (const k of W.KINDS) for (const w of W.GROUPS[k]) out.push([w, SB.dbg.sentence(SB.dbg.words(w, 1))]);
    return out.map(([w, s]) => [w, s, SB.dbg.clip(s)]);
  });
  const bad = [];
  for (const [w, s, url] of d) {
    if (!fs.existsSync(path.join(PUB, url))) bad.push(`no clip for "${s}"`);
    if (!fs.existsSync(path.join(PUB, 'images', w + '.webp'))) bad.push(`${w}: no picture`);
  }
  expect(bad.slice(0, 20)).toEqual([]);
});

test('oracle: over 3,000 dealt levels — lowercase tiles, no full stop, never in order, uniform first word, one wrong extra article', async ({ page }) => {
  await open(page);
  const r = await page.evaluate(() => {
    const out = { bad: [], first: [{}, {}, {}], n: [0, 0, 0] };
    for (let lv = 0; lv < 3; lv++) {
      for (let k = 0; k < 1000; k++) {
        const plan = SB.dbg.plan(lv);
        if (plan.length !== SB.ROUNDS) out.bad.push(`L${lv + 1}: ${plan.length} rounds`);
        if (new Set(plan.map((x) => x.word)).size !== plan.length) out.bad.push(`L${lv + 1}: a picture twice`);
        for (const rd of plan) {
          out.n[lv]++;
          for (const t of rd.tiles) if (t !== t.toLowerCase() || /[.!?,]/.test(t)) out.bad.push(`tile "${t}"`);
          if (rd.tiles.slice(0, rd.answer.length).join(' ') === rd.answer.join(' ')) out.bad.push(`dealt in order: ${rd.text}`);
          const rest = rd.tiles.slice(); for (const w of rd.answer) { const i = rest.indexOf(w); if (i < 0) out.bad.push(`missing tile ${w}`); else rest.splice(i, 1); }
          if (lv === 2) {
            if (rest.length !== 1 || !['a', 'an'].includes(rest[0]) || rest[0] !== rd.extra) out.bad.push(`L3 extra ${rest}`);
            // the extra article must be the wrong one for the picture word, so it can't stand in front of it
            const art = rd.answer[0];
            if (rd.extra === art) out.bad.push(`L3 extra ${rd.extra} fits "${rd.text}"`);
          } else if (rest.length) out.bad.push(`L${lv + 1} extra tiles ${rest}`);
          if (rd.text !== rd.answer.join(' ').replace(/^./, (c) => c.toUpperCase()) + '.') out.bad.push(`text ${rd.text}`);
          const i = rd.tiles.indexOf(rd.answer[0]); out.first[lv][i] = (out.first[lv][i] || 0) + 1;
        }
      }
    }
    return out;
  });
  expect(r.bad.slice(0, 10)).toEqual([]);
  // the first word's tile sits anywhere (a duplicate "a" makes indexOf favour the left, so allow a wide band)
  for (let lv = 0; lv < 3; lv++) {
    const k = Object.keys(r.first[lv]).length;
    expect(k).toBe(lv === 0 ? 4 : lv === 1 ? 5 : 6);
    for (const v of Object.values(r.first[lv])) expect(v / r.n[lv]).toBeGreaterThan(0.06);
  }
});

test('tiles: a placed tile goes back with a tap; nothing is marked before the sentence is full', async ({ page }) => {
  await open(page);
  await page.click('#startBtn');
  await page.waitForTimeout(300);
  const rd = await page.evaluate(() => SB.dbg.round);
  const first = page.locator('#app .bank .tile').first();
  await first.click();
  await expect(page.locator('#app .slots .placed')).toHaveCount(1);
  await expect(first).toHaveClass(/used/);
  await page.locator('#app .slots .placed').first().click();
  await expect(page.locator('#app .slots .placed')).toHaveCount(0);
  await expect(first).not.toHaveClass(/used/);
  // all but the last tile placed: still no verdict, no feedback
  for (let i = 0; i < rd.answer.length - 1; i++) await page.locator('#app .bank .tile:not(.used)').first().click();
  const s = await page.evaluate(() => ({ cls: document.querySelector('#app .slots').className, fb: document.querySelector('.feedback').textContent, ans: SB.S.answered }));
  expect(s).toEqual({ cls: 'slots', fb: '', ans: false });
});

test('level 3 keeps the sentence unread: no speaker and no clip until it is built', async ({ page }) => {
  const clips = [];
  page.on('request', (r) => { if (r.url().includes('/true-or-false/audio/')) clips.push(r.url()); });
  await open(page);
  await page.click('#startBtn');
  await page.evaluate(() => SB.dbg.startLevel(2));
  await page.waitForTimeout(800);
  await expect(page.locator('#sayBtn')).toBeHidden();
  const before = clips.length;
  await page.waitForTimeout(600);
  expect(clips.length).toBe(before);
  await page.evaluate(() => SB.dbg.solveForTest());
  await expect(page.locator('#sayBtn')).toBeVisible();
});

test('a miss: the slots turn red, the right sentence is shown, Next moves on', async ({ page }) => {
  await open(page);
  await page.click('#startBtn');
  const rd = await page.evaluate(() => SB.dbg.round);
  await page.evaluate(() => SB.dbg.missForTest());
  await expect(page.locator('#app .slots')).toHaveClass(/no/);
  await expect(page.locator('.feedback .reveal')).toHaveText(rd.text);
  await page.waitForTimeout(1800);
  expect(await page.evaluate(() => SB.S.round)).toBe(0);   // a miss never auto-advances
  await page.click('#nextBtn');
  await page.waitForFunction(() => SB.S.round === 1, null, { timeout: 6000 });
});

test('full run: 3 levels to the end card, zero errors, no /api/land under automation', async ({ page }) => {
  test.setTimeout(150000);
  const errs = [];
  page.on('pageerror', (e) => errs.push('pageerror ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error') errs.push('console ' + m.text()); });
  const land = await open(page);
  await page.click('#startBtn');
  for (let lv = 0; lv < 3; lv++) {
    for (let i = 0; i < 6; i++) {
      await page.waitForFunction(() => document.querySelectorAll('#app .bank .tile').length >= 4 && !SB.S.answered, null, { timeout: 9000 });
      expect(await page.evaluate(() => SB.S.lvl)).toBe(lv);
      expect(await page.evaluate(() => SB.dbg.solveForTest())).toBe(true);
      await expect(page.locator('#app .slots')).toHaveClass(/ok/);
      if (i < 5) await page.waitForFunction((k) => SB.S.round === k, i + 1, { timeout: 9000 });
    }
    if (lv < 2) {
      await expect(page.locator('#app .card h2')).toHaveText('Level done!', { timeout: 9000 });
      await expect(page.locator('#app .card .score')).toHaveText('6 / 6');
      await page.click('#nextLevelBtn');
    }
  }
  await expect(page.locator('#app .card .cde-end')).toBeVisible({ timeout: 9000 });
  await expect(page.locator('#app .card [data-kdm-primary]')).toBeVisible();
  expect(errs).toEqual([]);
  expect(land).toEqual([]);
});

for (const vp of [{ width: 360, height: 640 }, { width: 390, height: 844 }]) {
  test(`phone fit ${vp.width}x${vp.height}: picture, slots, tiles and Next on screen, every control ≥ 44 px`, async ({ page }) => {
    await page.setViewportSize(vp);
    await open(page);
    const sb = await page.locator('#startBtn').boundingBox();
    expect(sb.y + sb.height).toBeLessThanOrEqual(vp.height);
    await page.click('#startBtn');
    for (let lv = 0; lv < 3; lv++) {
      if (lv) await page.evaluate((l) => SB.dbg.startLevel(l), lv);
      // the longest sentence of the level first, then missed: the tallest screen (full slots + reveal + Next)
      await page.evaluate(() => {
        const rs = SB.S.rounds, len = (r) => r.tiles.join(' ').length;
        const i = rs.reduce((b, r, k) => (len(r) > len(rs[b]) ? k : b), 0);
        [rs[0], rs[i]] = [rs[i], rs[0]];
        SB.S.round = 0; SB.dbg.redraw();
      });
      await page.waitForTimeout(300);
      const before = await page.evaluate(() => [...document.querySelectorAll('#app .bank .tile')].map((e) => { const b = e.getBoundingClientRect(); return [b.bottom, b.right, b.width, b.height]; }));
      for (const [bot, right, w, h] of before) { expect(bot).toBeLessThanOrEqual(vp.height); expect(right).toBeLessThanOrEqual(vp.width); expect(Math.min(w, h)).toBeGreaterThanOrEqual(44); }
      await page.evaluate(() => SB.dbg.missForTest());
      await page.waitForTimeout(300);
      const r = await page.evaluate(() => {
        const out = [];
        for (const e of document.querySelectorAll('#app .slots .placed, #app .say:not([hidden]), #nextBtn')) {
          const b = e.getBoundingClientRect();
          out.push({ c: e.className || e.id, top: b.top, bottom: b.bottom, left: b.left, right: b.right, w: b.width, h: b.height });
        }
        return { out, sw: document.documentElement.scrollWidth, sy: scrollY, reveal: document.querySelector('.feedback').getBoundingClientRect().bottom, lvl: SB.S.lvl };
      });
      for (const b of r.out) {
        expect(b.top, `L${r.lvl + 1} ${b.c}`).toBeGreaterThanOrEqual(0);
        expect(b.bottom, `L${r.lvl + 1} ${b.c}`).toBeLessThanOrEqual(vp.height);
        expect(b.left).toBeGreaterThanOrEqual(0); expect(b.right).toBeLessThanOrEqual(vp.width);
        expect(Math.min(b.w, b.h), b.c).toBeGreaterThanOrEqual(44);
      }
      expect(r.reveal, `L${r.lvl + 1} reveal`).toBeLessThanOrEqual(vp.height);
      expect(r.sw).toBeLessThanOrEqual(vp.width);
      expect(r.sy).toBe(0);
    }
  });
}

const HEB = /[֐-׿]/;
for (const lang of ['en', 'he', 'es']) {
  test(`language (${lang}): menu + play + reveal, no wrong-language interface text`, async ({ page }) => {
    await page.addInitScript((l) => localStorage.setItem('cde_lang', l), lang);
    await open(page);
    const check = () => page.evaluate(({ lang, heb }) => {
      const re = new RegExp(heb), D = window.CDE_STRINGS, en = D.en, cur = D[lang];
      const plain = (v) => String(v ?? '').replace(/<[^>]+>/g, '').trim();
      const txt = document.body.innerText, found = [];
      if (lang !== 'he') {
        const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
        for (let n = w.nextNode(); n; n = w.nextNode()) {
          const el = n.parentElement;
          if (re.test(n.nodeValue) && el && !el.closest('[lang="he"],script,style,[hidden]') && el.getClientRects().length) found.push('he: ' + n.nodeValue.trim());
        }
      }
      if (lang !== 'en') for (const [k, v] of Object.entries(en)) if (plain(v).length >= 6 && plain(cur[k]) !== plain(v) && txt.includes(plain(v))) found.push('en: ' + plain(v));
      return found;
    }, { lang, heb: HEB.source });
    expect(await check()).toEqual([]);
    await page.click('#startBtn');
    await page.waitForTimeout(300);
    await page.evaluate(() => SB.dbg.missForTest());
    await page.waitForTimeout(200);
    expect(await check()).toEqual([]);
    if (lang === 'he') await expect(page.locator('html')).toHaveAttribute('data-cde-lang', 'he');
  });
}

test('contrast: play-screen text is WCAG AA on the dark theme', async ({ page }) => {
  await open(page);
  await page.click('#startBtn');
  const bad = await page.evaluate(async () => {
    const rgb = (s) => s.match(/[\d.]+/g).slice(0, 3).map(Number);
    const lum = ([r, g, b]) => { const f = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
    const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
    const BG = [30, 27, 75];
    const out = [];
    for (const sel of ['.hud-level', '.hud-label', '.bank .tile', '.tip']) {
      const e = document.querySelector(sel); if (!e) continue;
      const r = ratio(rgb(getComputedStyle(e).color), BG);
      if (r < 4.5) out.push(`${sel} ${r.toFixed(2)}`);
    }
    document.querySelector('#app .bank .tile').click();
    const p = document.querySelector('#app .slots .placed'), cp = getComputedStyle(p);
    const rp = ratio(rgb(cp.color), rgb(cp.backgroundColor)); if (rp < 4.5) out.push(`placed ${rp.toFixed(2)}`);
    SB.dbg.redraw(); SB.dbg.missForTest();
    for (const sel of ['.feedback', '.feedback .reveal']) {
      const e = document.querySelector(sel); const r = ratio(rgb(getComputedStyle(e).color), BG); if (r < 4.5) out.push(`${sel} ${r.toFixed(2)}`);
    }
    for (const sel of ['.slots.no .placed', '#nextBtn']) {
      const e = document.querySelector(sel), cs = getComputedStyle(e); const r = ratio(rgb(cs.color), rgb(cs.backgroundColor)); if (r < 4.5) out.push(`${sel} ${r.toFixed(2)}`);
    }
    return out;
  });
  expect(bad).toEqual([]);
});

for (const mode of ['warm', 'cold']) test(`speech sync (${mode}): a sentence never plays over the next round`, async ({ page }) => {
  test.skip(!!process.env.CI, 'speech-sync needs real audio output (CI has none)');
  test.setTimeout(90000);
  await instrumentSpeech(page, { audio: /\/audio\/[a-z0-9-]+\.mp3/, visual: () => (window.SB && SB.dbg.roundKey) || '', answerSel: '#app .bank .tile' });
  await open(page);
  if (mode === 'cold') await cold(page);
  await page.click('#startBtn');
  for (let i = 0; i < 4; i++) {
    await page.waitForTimeout(700);
    await page.locator('#sayBtn').click();
    await page.waitForTimeout(500);
    if (i === 1) { await page.evaluate(() => SB.dbg.missForTest()); await page.waitForTimeout(200); await page.click('#nextBtn'); }
    else await page.evaluate(() => SB.dbg.solveForTest());
    await page.waitForFunction((k) => SB.S.round === k, i + 1, { timeout: 12000 });
  }
  await page.waitForTimeout(3000);
  const log = await page.evaluate(() => window.__sync);
  const r = checkSpeech(log);
  expect(r.spoken).toBeGreaterThan(4);
  expect(r.problems).toEqual([]);
});
