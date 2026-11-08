// Beginning Sounds (/games/beginning-sounds/, wave 2 11-08): word pool, one-right-picture / c-k / partner / position oracles
// over many dealt levels, nothing marked before the answer, the miss flow, a full run to the end card with zero errors,
// phone fit + tap size, language leak, contrast and speech sync.
import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { WORDS } from '../src/data/words.js';
import { instrumentSpeech, checkSpeech } from './lib/speech-sync.mjs';
import { cold } from './lib/cold-net.mjs';

const URL = '/games/beginning-sounds/index.html';
const PUB = path.resolve('public');

async function open(page) {
  const land = [];
  page.on('request', (r) => { if (r.url().includes('/api/land')) land.push(r.url()); });
  await page.route('**/api/**', (r) => r.fulfill({ status: 204 }));
  await page.goto(URL);
  await page.waitForFunction(() => window.BS && window.CDE_STRINGS && window.cdeSay);
  return land;
}

test('word pool: CDE photo words with audio, each under its own first letter; no tricky starts; enough words per letter', async ({ page }) => {
  await open(page);
  const d = await page.evaluate(() => ({ B: BS.B, drawn: window.CDE_DRAWN || null }));
  const byId = Object.fromEntries(WORDS.map((w) => [w.id, w]));
  const bad = [];
  for (const [l, ws] of Object.entries(d.B.LETTERS)) {
    if (ws.length < 2) bad.push(`${l}: under 2 words`);
    for (const w of ws) {
      if (w[0] !== l) bad.push(`${w} under ${l}`);
      if (!byId[w]) bad.push(`${w}: not in WORDS`);
      if (/^(ch|sh|th|wh|ph|kn|wr|qu|gn)/.test(w) || /^[cg][eiy]/.test(w)) bad.push(`${w}: first letter isn't the first sound`);
      if (!fs.existsSync(path.join(PUB, 'images', w + '.webp'))) bad.push(`${w}: no picture`);
      if (!fs.existsSync(path.join(PUB, 'audio', w + '.mp3'))) bad.push(`${w}: no audio`);
    }
  }
  for (const lv of d.B.LEVEL_LETTERS) for (const l of lv) if (!d.B.LETTERS[l]) bad.push(`level letter ${l} has no words`);
  for (const l of d.B.LEVEL_LETTERS[2]) if (!(d.B.PARTNER[l] || []).length) bad.push(`level 3 letter ${l} has no partner`);
  expect(bad).toEqual([]);
});

test('picture style: every pool word is a photo (one style per round)', async ({ page }) => {
  await page.route('**/api/**', (r) => r.fulfill({ status: 204 }));
  await page.goto('/games/odd-one-out/index.html');   // loads the site-wide style map
  await page.waitForFunction(() => window.CDE_DRAWN);
  const drawn = await page.evaluate(() => window.CDE_DRAWN);
  await open(page);
  const all = await page.evaluate(() => Object.values(BS.B.LETTERS).flat());
  expect(all.filter((w) => drawn.includes(w))).toEqual([]);
});

test('oracle: over 3,000 dealt levels — one picture starts with the letter, c/k never together, partners on level 3, uniform position', async ({ page }) => {
  await open(page);
  const r = await page.evaluate(() => {
    const B = BS.B, out = { bad: [], pos: [{}, {}, {}], n: [0, 0, 0], partner: 0, n3: 0 };
    for (let lv = 0; lv < 3; lv++) {
      for (let k = 0; k < 1000; k++) {
        const plan = BS.dbg.plan(lv);
        if (plan.length !== BS.ROUNDS) out.bad.push(`L${lv + 1}: ${plan.length} rounds`);
        if (new Set(plan.map((x) => x.letter)).size !== plan.length) out.bad.push(`L${lv + 1}: a letter twice`);
        for (const rd of plan) {
          out.n[lv]++;
          const i = rd.opts.indexOf(rd.answer); out.pos[lv][i] = (out.pos[lv][i] || 0) + 1;
          if (!B.LEVEL_LETTERS[lv].includes(rd.letter)) out.bad.push(`L${lv + 1}: letter ${rd.letter} not in level`);
          if (rd.opts.length !== 3 || new Set(rd.opts).size !== 3) out.bad.push(`bad options ${rd.opts}`);
          const starts = rd.opts.filter((w) => w[0] === rd.letter);
          if (starts.length !== 1 || starts[0] !== rd.answer) out.bad.push(`${rd.letter}: ${rd.opts}`);
          const firsts = rd.opts.map((w) => w[0]);
          if (firsts.includes('c') && firsts.includes('k')) out.bad.push(`c and k together: ${rd.opts}`);
          if (new Set(firsts).size !== 3) out.bad.push(`two pictures share a first letter: ${rd.opts}`);
          const partners = rd.opts.filter((w) => (B.PARTNER[rd.letter] || []).includes(w[0]));
          if (lv < 2 && partners.length) out.bad.push(`L${lv + 1} sound-alike ${partners} for ${rd.letter}`);
          if (lv === 2) { out.n3++; if (partners.length === 1) out.partner++; else out.bad.push(`L3 no partner for ${rd.letter}: ${rd.opts}`); }
          // the two wrong pictures never sound alike each other either (one trap per round)
          const w2 = rd.opts.filter((w) => w !== rd.answer).map((w) => w[0]);
          if ((B.PARTNER[w2[0]] || []).includes(w2[1]) || BS.dbg.sameSound(w2[0], w2[1])) out.bad.push(`wrong pair sound alike ${w2}`);
        }
      }
    }
    return out;
  });
  expect(r.bad.slice(0, 10)).toEqual([]);
  for (let lv = 0; lv < 3; lv++) for (let i = 0; i < 3; i++) {
    expect(r.pos[lv][i] / r.n[lv]).toBeGreaterThan(1 / 3 - 0.04);
    expect(r.pos[lv][i] / r.n[lv]).toBeLessThan(1 / 3 + 0.04);
  }
  expect(r.partner).toBe(r.n3);
});

test('nothing marks the answer before the tap, and the words stay hidden (also after a 3 s idle)', async ({ page }) => {
  await open(page);
  await page.click('#startBtn');
  for (let i = 0; i < 4; i++) {
    await page.waitForTimeout(i === 0 ? 3000 : 300);
    const s = await page.evaluate(() => {
      const opts = [...document.querySelectorAll('#app .opt')];
      const sty = opts.map((o) => { const cs = getComputedStyle(o); return [o.className, cs.borderColor, cs.backgroundColor, cs.opacity, cs.boxShadow].join(); });
      const words = opts.map((o) => getComputedStyle(o.querySelector('.word')).visibility);
      return { n: opts.length, sty: new Set(sty).size, words: [...new Set(words)], fb: document.querySelector('.feedback').textContent, next: !!document.getElementById('nextBtn') };
    });
    expect(s).toEqual({ n: 3, sty: 1, words: ['hidden'], fb: '', next: false });
    await page.evaluate(() => BS.dbg.solveForTest());
    await page.waitForFunction((k) => BS.S.round !== k, i, { timeout: 8000 });
  }
});

test('a miss: the right picture turns green, the words show, Next moves on', async ({ page }) => {
  await open(page);
  await page.click('#startBtn');
  const rd = await page.evaluate(() => BS.dbg.round);
  await page.evaluate(() => BS.dbg.missForTest());
  await expect(page.locator(`#app .opt[data-word="${rd.answer}"]`)).toHaveClass(/ok/);
  await expect(page.locator('#app .opt.no')).toHaveCount(1);
  await expect(page.locator('.feedback .reveal')).toHaveText(rd.answer);
  await expect(page.locator('#app .opt .word').first()).toBeVisible();
  await page.waitForTimeout(1500);
  expect(await page.evaluate(() => BS.S.round)).toBe(0);   // a miss never auto-advances
  await page.click('#nextBtn');
  await page.waitForFunction(() => BS.S.round === 1, null, { timeout: 5000 });
});

test('full run: 3 levels to the end card, zero errors, no /api/land under automation', async ({ page }) => {
  test.setTimeout(150000);
  const errs = [];
  page.on('pageerror', (e) => errs.push('pageerror ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error') errs.push('console ' + m.text()); });
  const land = await open(page);
  await page.click('#startBtn');
  for (let lv = 0; lv < 3; lv++) {
    for (let i = 0; i < 8; i++) {
      await page.waitForFunction(() => document.querySelectorAll('#app .opt').length === 3 && !BS.S.answered, null, { timeout: 8000 });
      expect(await page.evaluate(() => BS.S.lvl)).toBe(lv);
      expect(await page.evaluate(() => BS.dbg.solveForTest())).toBe(true);
      await expect(page.locator('#app .opt.ok')).toHaveCount(1);
      if (i < 7) await page.waitForFunction((k) => BS.S.round === k, i + 1, { timeout: 8000 });
    }
    if (lv < 2) {
      await expect(page.locator('#app .card h2')).toHaveText('Level done!', { timeout: 8000 });
      await expect(page.locator('#app .card .score')).toHaveText('8 / 8');
      await page.click('#nextLevelBtn');
    }
  }
  await expect(page.locator('#app .card .cde-end')).toBeVisible({ timeout: 8000 });
  await expect(page.locator('#app .card [data-kdm-primary]')).toBeVisible();
  expect(errs).toEqual([]);
  expect(land).toEqual([]);
});

for (const vp of [{ width: 360, height: 640 }, { width: 390, height: 844 }]) {
  test(`phone fit ${vp.width}x${vp.height}: every level's options, speakers and Next on screen, every control ≥ 44 px`, async ({ page }) => {
    await page.setViewportSize(vp);
    await open(page);
    const sb = await page.locator('#startBtn').boundingBox();
    expect(sb.y + sb.height).toBeLessThanOrEqual(vp.height);
    await page.click('#startBtn');
    for (let lv = 0; lv < 3; lv++) {
      if (lv) await page.evaluate((l) => BS.dbg.startLevel(l), lv);   // each level has its own layout
      await page.waitForTimeout(400);
      await page.evaluate(() => BS.dbg.missForTest());   // the miss screen is the tallest (reveal + Next)
      await page.waitForTimeout(300);
      const r = await page.evaluate(() => {
        const out = [];
        for (const e of document.querySelectorAll('#app .opt, #app .say, #nextBtn')) {
          const b = e.getBoundingClientRect();
          out.push({ c: e.className || e.id, top: b.top, bottom: b.bottom, left: b.left, right: b.right, w: b.width, h: b.height });
        }
        return { out, sw: document.documentElement.scrollWidth, sy: scrollY, reveal: document.querySelector('.feedback').getBoundingClientRect().bottom, lvl: BS.S.lvl };
      });
      expect(r.out.length).toBeGreaterThanOrEqual(3);
      for (const b of r.out) {
        expect(b.top, `L${r.lvl + 1} ${b.c}`).toBeGreaterThanOrEqual(0);
        expect(b.bottom, `L${r.lvl + 1} ${b.c}`).toBeLessThanOrEqual(vp.height);
        expect(b.left).toBeGreaterThanOrEqual(0); expect(b.right).toBeLessThanOrEqual(vp.width);
        expect(Math.min(b.w, b.h), b.c).toBeGreaterThanOrEqual(44);
      }
      expect(r.reveal).toBeLessThanOrEqual(vp.height);
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
      const plain = (v) => String(v ?? '').replace(/<[^>]+>/g, '').replace(/\{w\}/g, '').trim();
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
    await page.evaluate(() => BS.dbg.missForTest());
    await page.waitForTimeout(200);
    expect(await check()).toEqual([]);
    if (lang === 'he') await expect(page.locator('html')).toHaveAttribute('data-cde-lang', 'he');
  });
}

test('contrast: play-screen text is WCAG AA on the dark theme', async ({ page }) => {
  await open(page);
  await page.click('#startBtn');
  await page.evaluate(() => BS.dbg.missForTest());
  const bad = await page.evaluate(() => {
    const rgb = (s) => s.match(/[\d.]+/g).slice(0, 3).map(Number);
    const lum = ([r, g, b]) => { const f = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
    const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
    const BG = [30, 27, 75];
    const out = [];
    for (const sel of ['.hud-level', '.hud-label', '.hud-label .target', '.opt .word', '.feedback', '.feedback .reveal', '.tip']) {
      const e = document.querySelector(sel); if (!e) continue;
      const r = ratio(rgb(getComputedStyle(e).color), BG);
      if (r < 4.5) out.push(`${sel} ${r.toFixed(2)}`);
    }
    const nx = document.getElementById('nextBtn'), cs = getComputedStyle(nx);
    const rn = ratio(rgb(cs.color), rgb(cs.backgroundColor)); if (rn < 4.5) out.push(`next ${rn.toFixed(2)}`);
    return out;
  });
  expect(bad).toEqual([]);
});

for (const mode of ['warm', 'cold']) test(`speech sync (${mode}): a word never plays over the next round`, async ({ page }) => {
  test.skip(!!process.env.CI, 'speech-sync needs real audio output (CI has none)');
  test.setTimeout(90000);
  await instrumentSpeech(page, { audio: /\/audio\/[a-z0-9-]+\.mp3/, visual: () => (window.BS && BS.dbg.roundKey) || '', answerSel: '#app .opt' });
  await open(page);
  if (mode === 'cold') await cold(page);
  await page.click('#startBtn');
  for (let i = 0; i < 4; i++) {
    await page.waitForTimeout(700);
    await page.locator('#app .say').nth(i % 3).click();
    await page.waitForTimeout(500);
    if (i === 1) { await page.evaluate(() => BS.dbg.missForTest()); await page.waitForTimeout(200); await page.click('#nextBtn'); }
    else await page.evaluate(() => BS.dbg.solveForTest());
    await page.waitForFunction((k) => BS.S.round === k, i + 1, { timeout: 10000 });
  }
  await page.waitForTimeout(2000);
  const log = await page.evaluate(() => window.__sync);
  const r = checkSpeech(log);
  expect(r.spoken).toBeGreaterThan(4);
  expect(r.problems).toEqual([]);
});
