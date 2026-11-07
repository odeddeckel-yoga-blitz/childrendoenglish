// Odd One Out (/games/odd-one-out/, wave 1 11-07): word data, picture-style + ambiguity + position oracles over many
// dealt rounds, nothing marked before the answer, the miss flow, a full run to the end card with zero errors,
// phone fit + tap size, language leak, contrast and speech sync.
import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { WORDS } from '../src/data/words.js';
import { instrumentSpeech, checkSpeech } from './lib/speech-sync.mjs';

const URL = '/games/odd-one-out/index.html';
const PUB = path.resolve('public');
const SRC = JSON.parse(fs.readFileSync(path.resolve('scripts/IMAGE_SOURCES.json'), 'utf8'));
const REMOVED = ('soap roof blanket grape crayon baby drizzle rainy windy cloudy sunny karate gymnasium lunchbox homework skirt ' +
  'pajamas forehead chin neck cloud snow ice storm fog hail hurricane tornado frost avalanche dancing wrestling treasure head ' +
  'nose mouth arm shoulder knee elbow ankle wrist chest hip cheek belly desk chalk marker overalls apron ferry pair ivory coral ' +
  'teal pebble attic basket sticker ribbon whisper rug back teeth lips tummy leg face palm toe tongue hair bandana slippers ' +
  'bowtie textbook glue hiking jumping fencing blocks swing pinwheel sled marble puppet yoga bracelet beret poncho poster ' +
  'grumpy cheerful diving pond garage raft').split(' ');
const BODY = 'hand foot ear eye nose finger thumb tooth toe knee arm leg head hair face mouth lips teeth heart'.split(' ');
// Commons files that are drawings, not photos (checked by eye on a contact sheet 11-07). Own / Twemoji = drawn.
const DRAWN_COMMONS = ['table', 'pencil', 'microscope', 'folder'];
// Word pairs that must never be on opposite sides of any level pair (would make two answers defensible).
const CROSS = [['orange', 'fruit'], ['orange', 'colors'], ['tomato', 'fruit'], ['tomato', 'veg'], ['drone', 'toys'], ['drone', 'transport'],
  ['hen', 'animals'], ['hen', 'food'], ['chicken', 'food'], ['ball', 'toys'], ['ball', 'sports'], ['skateboard', 'toys'], ['tricycle', 'transport'],
  ['turtle', 'sea'], ['penguin', 'sea'], ['penguin', 'farm'], ['duck', 'farm'], ['peach', 'colors'], ['olive', 'colors'], ['helmet', 'clothing'], ['uniform', 'school']];

async function open(page, q = '') {
  const land = [];
  page.on('request', (r) => { if (r.url().includes('/api/land')) land.push(r.url()); });
  await page.route('**/api/**', (r) => r.fulfill({ status: 204 }));
  await page.goto(URL + q);
  await page.waitForFunction(() => window.OO && window.CDE_STRINGS && window.cdeSay);
  return land;
}
const data = (page) => page.evaluate(() => ({ levels: OO.LEVELS, groups: OO.GROUPS, amb: OO.AMBIGUOUS, drawn: OO.DRAWN }));

test('word data: CDE words with picture + audio, never removed / body part / ambiguous; drawn list matches the sources', async ({ page }) => {
  await open(page);
  const { levels, groups, amb, drawn } = await data(page);
  const byId = Object.fromEntries(WORDS.map((w) => [w.id, w]));
  const used = [...new Set(Object.values(groups).flat())];
  const bad = [];
  for (const id of used) {
    const w = byId[id];
    if (!w) { bad.push(`${id}: not in WORDS`); continue; }
    if (w.imageUrl !== `/images/${id}.webp`) bad.push(`${id}: imageUrl ${w.imageUrl}`);
    if (!fs.existsSync(path.join(PUB, 'images', id + '.webp'))) bad.push(`${id}: no image file`);
    if (!fs.existsSync(path.join(PUB, 'audio', id + '.mp3'))) bad.push(`${id}: no audio file`);
    if (REMOVED.includes(id)) bad.push(`${id}: removed word`);
    if (BODY.includes(id)) bad.push(`${id}: body part`);
    if (amb[id]) bad.push(`${id}: on the ambiguity list but used`);
    const src = SRC[id]?.source;
    const isDrawn = src === 'own' || src === 'twemoji' || src === 'fluent-emoji' || DRAWN_COMMONS.includes(id);
    if (isDrawn !== drawn.includes(id)) bad.push(`${id}: style ${drawn.includes(id) ? 'drawn' : 'photo'} but source ${src}`);
  }
  // DRAWN is the site-wide style map now (public/games/image-style.js), so it lists words this game doesn't use
  for (const lv of levels) for (const [a, b] of lv.pairs) {
    const both = groups[a].filter((w) => groups[b].includes(w));
    if (both.length) bad.push(`${a}/${b} share ${both.join(',')}`);
    if (groups[a].length < 4 || groups[b].length < 4) bad.push(`${a}/${b}: a group under 4 words`);
  }
  for (const [w, g] of CROSS) if (groups[g].includes(w)) bad.push(`${w} in ${g} (fits two groups)`);
  expect(bad).toEqual([]);
  expect(levels.length).toBe(3);
});

test('oracle: over 7,200 dealt rounds — one clean odd one, no lone drawing/photo, uniform position, no length tell', async ({ page }) => {
  await open(page);
  const r = await page.evaluate(() => {
    const out = { bad: [], pos: [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]], longest: [0, 0, 0], shortest: [0, 0, 0], n: [0, 0, 0], drawnOdd: [0, 0, 0], pairs: [{}, {}, {}], styles: {} };
    for (let lv = 0; lv < 3; lv++) {
      for (let k = 0; k < 300; k++) {
        const plan = OO.dbg.plan(lv);
        if (plan.length !== OO.ROUNDS) out.bad.push(`L${lv + 1}: ${plan.length} rounds`);
        const seen = new Set();
        for (const rd of plan) {
          const c = rd.cards, odd = rd.odd, G = OO.GROUPS[rd.g], O = OO.GROUPS[rd.o];
          out.n[lv]++; out.pairs[lv][rd.pair] = 1;
          if (new Set(c).size !== 4) out.bad.push(`dup card ${c}`);
          if (!OO.LEVELS[lv].pairs.some((p) => p.includes(rd.g) && p.includes(rd.o))) out.bad.push(`L${lv + 1}: pair ${rd.g}/${rd.o} not in level`);
          const inG = c.filter((w) => G.includes(w) && !O.includes(w)), inO = c.filter((w) => O.includes(w) && !G.includes(w));
          if (inG.length !== 3 || inO.length !== 1 || inO[0] !== odd) out.bad.push(`two possible odd ones: ${c} (${rd.g}/${rd.o})`);
          const d = c.filter((w) => OO.dbg.style(w) === 'D').length;
          out.styles[d] = (out.styles[d] || 0) + 1;
          if (d === 1 || d === 3) out.bad.push(`lone style card: ${c}`);
          if (OO.dbg.style(odd) === 'D') out.drawnOdd[lv]++;
          if (d === 2) { out.mixed = (out.mixed || 0) + 1; if (OO.dbg.style(odd) === 'D') out.mixedOddDrawn = (out.mixedOddDrawn || 0) + 1; }
          out.pos[lv][c.indexOf(odd)]++;
          const L = c.map((w) => w.length), mx = Math.max(...L), mn = Math.min(...L);
          if (odd.length === mx && L.filter((x) => x === mx).length === 1) out.longest[lv]++;
          if (odd.length === mn && L.filter((x) => x === mn).length === 1) out.shortest[lv]++;
          c.forEach((w) => seen.add(w));
        }
      }
    }
    return out;
  });
  expect(r.bad.slice(0, 10)).toEqual([]);
  for (let lv = 0; lv < 3; lv++) {
    for (const p of r.pos[lv]) { expect(p / r.n[lv]).toBeGreaterThan(0.21); expect(p / r.n[lv]).toBeLessThan(0.29); }
    // a length tell would push these well above chance (1 in 4 minus ties)
    expect(r.longest[lv] / r.n[lv]).toBeLessThan(0.36);
    expect(r.shortest[lv] / r.n[lv]).toBeLessThan(0.36);
  }
  // every pair of every level is dealt
  expect(Object.keys(r.pairs[0]).length).toBe(6);
  expect(Object.keys(r.pairs[1]).length).toBe(3);
  expect(Object.keys(r.pairs[2]).length).toBe(5);
  expect(r.styles[1] || 0).toBe(0);
  expect(r.styles[3] || 0).toBe(0);
  // 2 drawings + 2 photos: the odd one is a drawing about half the time, so the style pairs never narrow the choice
  expect(r.mixed).toBeGreaterThan(100);
  expect(r.mixedOddDrawn / r.mixed).toBeGreaterThan(0.35);
  expect(r.mixedOddDrawn / r.mixed).toBeLessThan(0.65);
});

test('nothing marks the odd one before the answer (also after a 3 s idle)', async ({ page }) => {
  await open(page);
  await page.click('#startBtn');
  for (let i = 0; i < 4; i++) {
    await page.waitForTimeout(i === 0 ? 3000 : 300);
    const s = await page.evaluate(() => {
      const opts = [...document.querySelectorAll('#app .opt')];
      const cls = opts.map((o) => o.className + '|' + o.closest('.oo-card').className);
      const sty = opts.map((o) => { const cs = getComputedStyle(o); return [cs.borderColor, cs.backgroundColor, cs.opacity, cs.boxShadow, cs.fontWeight].join(); });
      const words = opts.map((o) => getComputedStyle(o.querySelector('.word')).fontSize);
      return { n: opts.length, cls: new Set(cls).size, sty: new Set(sty).size, words: new Set(words).size,
        tags: opts.map((o) => o.querySelector('.tag').textContent).join(''), fb: document.querySelector('.feedback').textContent, next: !!document.getElementById('nextBtn') };
    });
    expect(s).toEqual({ n: 4, cls: 1, sty: 1, words: 1, tags: '', fb: '', next: false });
    await page.evaluate(() => OO.dbg.solveForTest());
    await page.waitForFunction((k) => OO.S.round !== k, i, { timeout: 8000 });
  }
});

test('a miss: the odd one turns green, both groups are named, Next moves on', async ({ page }) => {
  await open(page);
  await page.click('#startBtn');
  const rd = await page.evaluate(() => OO.dbg.round);
  await page.evaluate(() => OO.dbg.missForTest());
  await expect(page.locator(`#app .opt[data-word="${rd.odd}"]`)).toHaveClass(/ok/);
  await expect(page.locator('#app .opt.no')).toHaveCount(1);
  const names = await page.evaluate((r) => [OO.NAMES.en[r.g][1], OO.NAMES.en[r.o][0]], rd);
  await expect(page.locator('.feedback .reveal')).toHaveText(`3 ${names[0]}, 1 ${names[1]}`);
  await expect(page.locator(`.oo-card[data-word="${rd.odd}"] .tag`)).toHaveText(names[1]);
  await page.waitForTimeout(1500);
  expect(await page.evaluate(() => OO.S.round)).toBe(0);   // a miss never auto-advances
  await page.click('#nextBtn');
  await page.waitForFunction(() => OO.S.round === 1, null, { timeout: 5000 });
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
      await page.waitForFunction(() => document.querySelectorAll('#app .opt').length === 4 && !OO.S.answered, null, { timeout: 8000 });
      expect(await page.evaluate(() => OO.S.lvl)).toBe(lv);
      expect(await page.evaluate(() => OO.dbg.solveForTest())).toBe(true);
      await expect(page.locator('#app .opt.ok')).toHaveCount(1);
      if (i < 7) await page.waitForFunction((k) => OO.S.round === k, i + 1, { timeout: 8000 });
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
  test(`phone fit ${vp.width}x${vp.height}: start, 4 cards, speakers and Next on screen, every control ≥ 44 px`, async ({ page }) => {
    await page.setViewportSize(vp);
    await open(page);
    const sb = await page.locator('#startBtn').boundingBox();
    expect(sb.y + sb.height).toBeLessThanOrEqual(vp.height);
    await page.click('#startBtn');
    await page.waitForTimeout(400);
    await page.evaluate(() => OO.dbg.missForTest());   // the miss screen is the tallest (reveal + Next)
    await page.waitForTimeout(300);
    const r = await page.evaluate(() => {
      const out = [];
      for (const e of document.querySelectorAll('#app .opt, #app .say, #nextBtn')) {
        const b = e.getBoundingClientRect();
        out.push({ c: e.className || e.id, top: b.top, bottom: b.bottom, left: b.left, right: b.right, w: b.width, h: b.height });
      }
      return { out, sw: document.documentElement.scrollWidth, sy: scrollY, reveal: document.querySelector('.feedback').getBoundingClientRect().bottom };
    });
    expect(r.out.length).toBe(9);
    for (const b of r.out) {
      expect(b.top, b.c).toBeGreaterThanOrEqual(0);
      expect(b.bottom, b.c).toBeLessThanOrEqual(vp.height);
      expect(b.left).toBeGreaterThanOrEqual(0); expect(b.right).toBeLessThanOrEqual(vp.width);
      expect(Math.min(b.w, b.h), b.c).toBeGreaterThanOrEqual(44);
    }
    expect(r.reveal).toBeLessThanOrEqual(vp.height);
    expect(r.sw).toBeLessThanOrEqual(vp.width);
    expect(r.sy).toBe(0);
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
      if (lang !== 'en') {
        for (const [k, v] of Object.entries(en)) if (plain(v).length >= 6 && plain(cur[k]) !== plain(v) && txt.includes(plain(v))) found.push('en: ' + plain(v));
        // English group names must not appear (game words are single English words; group names are interface)
        for (const [g, [sg, pl]] of Object.entries(OO.NAMES.en)) for (const s of [sg, pl]) if (s.includes(' ') && txt.includes(s)) found.push('en group: ' + s);
      }
      return found;
    }, { lang, heb: HEB.source });
    expect(await check()).toEqual([]);
    await page.click('#startBtn');
    await page.waitForTimeout(300);
    const rd = await page.evaluate(() => OO.dbg.round);
    await page.evaluate(() => OO.dbg.missForTest());
    await page.waitForTimeout(200);
    expect(await check()).toEqual([]);
    const names = await page.evaluate(({ r, lang }) => [OO.NAMES[lang][r.g][1], OO.NAMES[lang][r.o][0]], { r: rd, lang });
    await expect(page.locator('.feedback .reveal')).toHaveText(`3 ${names[0]}, 1 ${names[1]}`);
    if (lang === 'he') await expect(page.locator('html')).toHaveAttribute('data-cde-lang', 'he');
  });
}

test('contrast: play-screen text is WCAG AA on the dark theme', async ({ page }) => {
  await open(page);
  await page.click('#startBtn');
  await page.evaluate(() => OO.dbg.missForTest());
  const bad = await page.evaluate(() => {
    const rgb = (s) => s.match(/[\d.]+/g).slice(0, 3).map(Number);
    const lum = ([r, g, b]) => { const f = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
    const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
    const BG = [30, 27, 75];   // --bg1, the lightest part of the page gradient (worst case under glass cards)
    const out = [];
    for (const sel of ['.hud-level', '.hud-label', '.opt .word', '.opt .tag', '.feedback', '.feedback .reveal', '.tip']) {
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

test('speech sync (warm): a word never plays over the next round', async ({ page }) => {
  test.skip(!!process.env.CI, 'speech-sync needs real audio output (CI has none)');
  test.setTimeout(90000);
  await instrumentSpeech(page, { audio: /\/audio\/[a-z0-9-]+\.mp3/, visual: () => (window.OO && OO.dbg.roundKey) || '', answerSel: '#app .opt' });
  await open(page);
  await page.click('#startBtn');
  for (let i = 0; i < 4; i++) {
    await page.waitForTimeout(700);
    await page.locator('#app .say').nth(i % 4).click();   // a child listens to one word, then answers
    await page.waitForTimeout(500);
    if (i === 1) { await page.evaluate(() => OO.dbg.missForTest()); await page.waitForTimeout(200); await page.click('#nextBtn'); }
    else await page.evaluate(() => OO.dbg.solveForTest());
    await page.waitForFunction((k) => OO.S.round === k, i + 1, { timeout: 10000 });
  }
  await page.waitForTimeout(2000);
  const log = await page.evaluate(() => window.__sync);
  const r = checkSpeech(log);
  expect(r.spoken).toBeGreaterThan(4);
  expect(r.problems).toEqual([]);
});
