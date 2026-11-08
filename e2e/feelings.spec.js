// Feelings (/games/feelings/, wave 2 11-08): faces + audio data, answer-position / no-repeat / level-3 'also' oracles
// over many dealt levels, nothing marked before the answer, the miss flow, a full run to the end card with zero errors,
// phone fit + tap size, language leak, contrast and speech sync.
import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { instrumentSpeech, checkSpeech } from './lib/speech-sync.mjs';
import { cold } from './lib/cold-net.mjs';

const URL = '/games/feelings/index.html';
const PUB = path.resolve('public');

async function open(page) {
  const land = [];
  page.on('request', (r) => { if (r.url().includes('/api/land')) land.push(r.url()); });
  await page.route('**/api/**', (r) => r.fulfill({ status: 204 }));
  await page.goto(URL);
  await page.waitForFunction(() => window.FE && window.CDE_STRINGS && window.cdeSay);
  return land;
}

test('word data: every feeling has its Fluent face, a word clip and a level-3 story clip; one story per feeling', async ({ page }) => {
  await open(page);
  const d = await page.evaluate(() => ({ words: FE.D.WORDS, sits: FE.D.SITUATIONS.map((x) => ({ ...x, slug: FE.dbg.slug(x.text) })) }));
  const bad = [];
  for (const w of d.words) {
    if (!fs.existsSync(path.join(PUB, 'games', 'feelings', 'img', w + '.webp'))) bad.push(`${w}: no face`);
    if (!fs.existsSync(path.join(PUB, 'audio', w + '.mp3'))) bad.push(`${w}: no audio`);
    if (d.sits.filter((x) => x.feel === w).length !== 1) bad.push(`${w}: not exactly one story`);
  }
  for (const x of d.sits) {
    if (!fs.existsSync(path.join(PUB, 'games', 'feelings', 'audio', x.slug + '.mp3'))) bad.push(`no clip for "${x.text}"`);
    if (x.also.includes(x.feel)) bad.push(`${x.feel}: lists itself in also`);
    for (const a of x.also) if (!d.words.includes(a)) bad.push(`${x.feel}: also ${a} is not a word`);
    // a story fair for 3+ other feelings would leave too few distractors for 3 options; 13 words keep 9+
    if (d.words.length - 1 - x.also.length < 2) bad.push(`${x.feel}: too few distractors`);
  }
  expect(bad).toEqual([]);
  expect(d.words.length).toBeGreaterThanOrEqual(10);
});

test('oracle: over 3,000 dealt levels — answer position uniform, no feeling twice, level 3 never offers an also-feeling', async ({ page }) => {
  await open(page);
  const r = await page.evaluate(() => {
    const out = { bad: [], pos: [{}, {}, {}], n: [0, 0, 0], asked: {} };
    for (let lv = 0; lv < 3; lv++) {
      for (let k = 0; k < 1000; k++) {
        const plan = FE.dbg.plan(lv);
        if (plan.length !== FE.ROUNDS) out.bad.push(`L${lv + 1}: ${plan.length} rounds`);
        if (new Set(plan.map((x) => x.answer)).size !== plan.length) out.bad.push(`L${lv + 1}: a feeling twice`);
        for (const rd of plan) {
          out.n[lv]++; out.asked[rd.answer] = (out.asked[rd.answer] || 0) + 1;
          const i = rd.opts.indexOf(rd.answer); out.pos[lv][i] = (out.pos[lv][i] || 0) + 1;
          if (rd.opts.length !== 3 || new Set(rd.opts).size !== 3 || i < 0) out.bad.push(`bad options ${rd.opts}`);
          if (lv === 2) {
            if (!rd.sit || rd.sit.feel !== rd.answer) out.bad.push(`L3 story for ${rd.sit && rd.sit.feel}, answer ${rd.answer}`);
            else for (const o of rd.opts) if (rd.sit.also.includes(o)) out.bad.push(`L3 offers ${o} next to "${rd.sit.text}"`);
          } else if (rd.sit) out.bad.push(`L${lv + 1} has a story`);
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
  // every feeling gets asked
  const words = await page.evaluate(() => FE.D.WORDS);
  for (const w of words) expect(r.asked[w] || 0).toBeGreaterThan(500);
});

test('nothing marks the answer before the tap, and level 1 hides the words (also after a 3 s idle)', async ({ page }) => {
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
    await page.evaluate(() => FE.dbg.solveForTest());
    await page.waitForFunction((k) => FE.S.round !== k, i, { timeout: 8000 });
  }
});

test('a miss: the right face turns green, its word is shown, Next moves on', async ({ page }) => {
  await open(page);
  await page.click('#startBtn');
  const rd = await page.evaluate(() => FE.dbg.round);
  await page.evaluate(() => FE.dbg.missForTest());
  await expect(page.locator(`#app .opt[data-word="${rd.answer}"]`)).toHaveClass(/ok/);
  await expect(page.locator('#app .opt.no')).toHaveCount(1);
  await expect(page.locator('.feedback .reveal')).toHaveText(rd.answer);
  await expect(page.locator('#app .opt .word').first()).toBeVisible();
  await page.waitForTimeout(1500);
  expect(await page.evaluate(() => FE.S.round)).toBe(0);   // a miss never auto-advances
  await page.click('#nextBtn');
  await page.waitForFunction(() => FE.S.round === 1, null, { timeout: 5000 });
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
      await page.waitForFunction(() => document.querySelectorAll('#app .opt').length === 3 && !FE.S.answered, null, { timeout: 8000 });
      expect(await page.evaluate(() => FE.S.lvl)).toBe(lv);
      expect(await page.evaluate(() => FE.dbg.solveForTest())).toBe(true);
      await expect(page.locator('#app .opt.ok')).toHaveCount(1);
      if (i < 7) await page.waitForFunction((k) => FE.S.round === k, i + 1, { timeout: 8000 });
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
      if (lv) await page.evaluate((l) => FE.dbg.startLevel(l), lv);   // each level has its own layout
      await page.waitForTimeout(400);
      await page.evaluate(() => FE.dbg.missForTest());   // the miss screen is the tallest (reveal + Next)
      await page.waitForTimeout(300);
      const r = await page.evaluate(() => {
        const out = [];
        for (const e of document.querySelectorAll('#app .opt, #app .say, #nextBtn')) {
          const b = e.getBoundingClientRect();
          out.push({ c: e.className || e.id, top: b.top, bottom: b.bottom, left: b.left, right: b.right, w: b.width, h: b.height });
        }
        return { out, sw: document.documentElement.scrollWidth, sy: scrollY, reveal: document.querySelector('.feedback').getBoundingClientRect().bottom, lvl: FE.S.lvl };
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
    await page.evaluate(() => FE.dbg.missForTest());
    await page.waitForTimeout(200);
    expect(await check()).toEqual([]);
    if (lang === 'he') await expect(page.locator('html')).toHaveAttribute('data-cde-lang', 'he');
  });
}

test('contrast: play-screen text is WCAG AA on the dark theme', async ({ page }) => {
  await open(page);
  await page.click('#startBtn');
  await page.evaluate(() => FE.dbg.missForTest());
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
  await instrumentSpeech(page, { audio: /\/audio\/[a-z0-9-]+\.mp3/, visual: () => (window.FE && FE.dbg.roundKey) || '', answerSel: '#app .opt' });
  await open(page);
  if (mode === 'cold') await cold(page);
  await page.click('#startBtn');
  for (let i = 0; i < 4; i++) {
    await page.waitForTimeout(700);
    await page.locator('#sayWord').click();
    await page.waitForTimeout(500);
    if (i === 1) { await page.evaluate(() => FE.dbg.missForTest()); await page.waitForTimeout(200); await page.click('#nextBtn'); }
    else await page.evaluate(() => FE.dbg.solveForTest());
    await page.waitForFunction((k) => FE.S.round === k, i + 1, { timeout: 10000 });
  }
  await page.waitForTimeout(2000);
  const log = await page.evaluate(() => window.__sync);
  const r = checkSpeech(log);
  expect(r.spoken).toBeGreaterThan(4);
  expect(r.problems).toEqual([]);
});
