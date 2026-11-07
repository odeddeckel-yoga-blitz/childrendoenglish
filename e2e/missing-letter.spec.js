// Missing Letter (/games/missing-letter/, wave 1 11-07): word data, answer-oracle rules, the no-free-pass miss flow,
// a full run to the end card with zero errors, phone fit + tap size, language leak, contrast and speech sync.
import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { WORDS } from '../src/data/words.js';
import { instrumentSpeech, checkSpeech } from './lib/speech-sync.mjs';

const URL = '/games/missing-letter/index.html';
const PUB = path.resolve('public');
const REMOVED = ('soap roof blanket grape crayon baby drizzle rainy windy cloudy sunny karate gymnasium lunchbox homework skirt ' +
  'pajamas forehead chin neck cloud snow ice storm fog hail hurricane tornado frost avalanche dancing wrestling treasure head ' +
  'nose mouth arm shoulder knee elbow ankle wrist chest hip cheek belly desk chalk marker overalls apron ferry pair ivory coral ' +
  'teal pebble attic basket sticker ribbon whisper rug back teeth lips tummy leg face palm toe tongue hair bandana slippers ' +
  'bowtie textbook glue hiking jumping fencing blocks swing pinwheel sled marble puppet yoga bracelet beret poncho poster ' +
  'grumpy cheerful diving pond garage raft').split(' ');
const BODY = 'hand foot ear eye nose finger thumb tooth toe knee arm leg head hair face mouth lips teeth'.split(' ');
const DICT = fs.existsSync('/usr/share/dict/words')
  ? new Set(fs.readFileSync('/usr/share/dict/words', 'utf8').split('\n').map((s) => s.trim().toLowerCase())) : null;

async function open(page, q = '') {
  await page.route('**/api/**', (r) => r.fulfill({ status: 204 }));
  await page.goto(URL + q);
  await page.waitForFunction(() => window.ML && window.CDE_STRINGS);
}
const data = (page) => page.evaluate(() => ({ levels: ML.LEVELS, block: Object.keys(ML.BLOCK), groups: ML.GROUPS }));

test('word data: every word is a CDE word with a picture and audio, never removed or a body part', async ({ page }) => {
  await open(page);
  const { levels } = await data(page);
  const byId = Object.fromEntries(WORDS.map((w) => [w.id, w]));
  const used = [...new Set(levels.flatMap((l) => l.items.map((it) => it[0])))];
  const bad = [];
  for (const id of used) {
    const w = byId[id];
    if (!w) { bad.push(`${id}: not in WORDS`); continue; }
    if (w.imageUrl !== `/images/${id}.webp`) bad.push(`${id}: imageUrl ${w.imageUrl}`);
    if (!fs.existsSync(path.join(PUB, 'images', id + '.webp'))) bad.push(`${id}: no image file`);
    if (!fs.existsSync(path.join(PUB, 'audio', id + '.mp3'))) bad.push(`${id}: no audio file`);
    if (REMOVED.includes(id)) bad.push(`${id}: removed word`);
    if (BODY.includes(id)) bad.push(`${id}: body part`);
  }
  expect(bad).toEqual([]);
  expect(levels.map((l) => new Set(l.items.map((it) => it[0])).size).every((n) => n >= 8)).toBe(true);
});

test('oracle rules per item: same-kind decoys, no real/alt word, level 3 non-words, no elimination gap', async ({ page }) => {
  await open(page);
  const { levels, block, groups } = await data(page);
  const gameWords = new Set(levels.flatMap((l) => l.items.map((it) => it[0])));
  const bad = [];
  for (const [li, lv] of levels.entries()) {
    for (const it of lv.items) {
      const [w, i, g] = it, c = w[i];
      const ds = await page.evaluate((x) => ML.dbg.decoys(x), it);
      if (!groups[g].includes(c)) bad.push(`${w}@${i}: answer ${c} not in its group ${g}`);
      if (ds.length < Math.min(lv.opts, groups[g].length) - 1) bad.push(`${w}@${i}: only ${ds.length} decoys`);
      if (li === 0 && (w.length !== 3 || i !== 1 || g !== 'V')) bad.push(`${w}: level 1 must be a 3-letter vowel gap`);
      if (li === 1 && i !== 0 && i !== w.length - 1) bad.push(`${w}@${i}: level 2 gap must be first or last`);
      if (li === 2 && (w.length < 4 || w.length > 6 || i === 0 || i === w.length - 1)) bad.push(`${w}@${i}: level 3 gap must be inside a 4–6 letter word`);
      // elimination: no gap in qu / ck / a double letter (only one letter could fit)
      if ((c === 'u' && w[i - 1] === 'q') || (c === 'c' && w[i + 1] === 'k') || w[i - 1] === c || w[i + 1] === c) bad.push(`${w}@${i}: gap solvable by elimination`);
      for (const d of ds) {
        const s = w.slice(0, i) + d + w.slice(i + 1);
        if (!groups[g].includes(d)) bad.push(`${w}: decoy ${d} is another kind of letter`);
        if (gameWords.has(s) || block.includes(s)) bad.push(`${w}: decoy makes ${s}`);
        if (li === 2 && DICT && DICT.has(s)) bad.push(`${w}: level 3 decoy makes the real word ${s}`);
      }
    }
  }
  expect(bad).toEqual([]);
});

test('dealt rounds: exactly one option spells the word, uniform answer position, 8 different words', async ({ page }) => {
  await open(page);
  const res = await page.evaluate(() => {
    const out = [];
    for (let li = 0; li < 3; li++) {
      const pos = { 3: [], 4: [] }, probs = [];
      for (let n = 0; n < 500; n++) {
        const p = ML.dbg.plan(li);
        if (p.length !== 8) probs.push('plan length ' + p.length);
        if (new Set(p.map((r) => r.word)).size !== 8) probs.push('repeated word');
        for (const r of p) {
          const spells = r.options.filter((l) => r.word.slice(0, r.gap) + l + r.word.slice(r.gap + 1) === r.word);
          if (spells.length !== 1) probs.push(r.word + ': ' + spells.length + ' options spell it');
          if (new Set(r.options).size !== r.options.length) probs.push(r.word + ': duplicate option');
          const n = Math.min(ML.LEVELS[li].opts, ML.GROUPS[r.group].length);
          if (r.options.length !== n) probs.push(r.word + ': ' + r.options.length + ' options');
          if (!r.options.every((l) => ML.GROUPS[r.group].includes(l))) probs.push(r.word + ': option outside its letter group');
          pos[n].push(r.options.indexOf(r.answer));
        }
      }
      out.push({ li, pos, probs: [...new Set(probs)] });
    }
    return out;
  });
  for (const { li, pos: byN, probs } of res) {
    expect(probs, `level ${li + 1}`).toEqual([]);
    for (const n of [3, 4]) {
    const pos = byN[n]; if (pos.length < 300) continue;
    const counts = Array(n).fill(0); pos.forEach((p) => counts[p]++);
    const exp = pos.length / n, chi = counts.reduce((a, c) => a + (c - exp) ** 2 / exp, 0);
    expect(chi, `level ${li + 1} answer positions ${counts}`).toBeLessThan(n === 3 ? 13.8 : 16.3);   // p = 0.001
    }
  }
});

test('a fresh round is not solved or hinted; a miss shows the letter and needs the right tap (no free pass)', async ({ page }) => {
  await open(page);
  await page.click('#startBtn');
  for (let k = 0; k < 3; k++) {
    await expect(page.locator('#app .opt').first()).toBeVisible();
    const st = await page.evaluate(() => {
      const opts = [...document.querySelectorAll('#app .opt')];
      const cs = opts.map((b) => getComputedStyle(b));
      return {
        blank: document.querySelector('.gap-word .blank').textContent.trim(),
        marked: document.querySelectorAll('#app .opt.ok, #app .opt.no, #app .opt:disabled').length,
        alt: document.querySelector('.pic').alt,
        sizes: new Set(opts.map((b) => Math.round(b.getBoundingClientRect().width) + 'x' + Math.round(b.getBoundingClientRect().height))).size,
        fonts: new Set(cs.map((c) => c.fontWeight + c.fontSize + c.borderColor + c.backgroundColor)).size,
        fb: document.querySelector('.feedback').textContent.trim(),
        word: ML.dbg.item.word, gap: document.querySelector('.gap-word').textContent.replace(/ /g, '_')
      };
    });
    expect(st.blank).toBe('');
    expect(st.marked).toBe(0);
    expect(st.alt).toBe('');
    expect(st.sizes).toBe(1);
    expect(st.fonts).toBe(1);
    expect(st.fb).toBe('');
    expect(st.gap).not.toBe(st.word);
    await page.evaluate(() => ML.dbg.solveForTest());
    await expect.poll(() => page.evaluate(() => ML.dbg.round), { timeout: 6000 }).toBe(k + 1);
  }
  // the miss
  const before = await page.evaluate(() => ({ round: ML.dbg.round, score: ML.dbg.score, ans: ML.dbg.item.answer }));
  await page.evaluate(() => ML.dbg.wrongForTest());
  await expect(page.locator('.gap-word .blank')).toHaveText(before.ans);
  await expect(page.locator('#app .opt.no')).toHaveCount(1);
  await expect(page.locator('#app .opt.no')).toBeDisabled();
  await expect(page.locator('.feedback .en').first()).toHaveText(before.ans);
  await page.waitForTimeout(3000);
  expect(await page.evaluate(() => ML.dbg.round)).toBe(before.round);   // no auto-advance
  await page.locator('#app .opt.no').click({ force: true });             // tapping the wrong one again does nothing
  expect(await page.evaluate(() => ML.dbg.round)).toBe(before.round);
  await page.locator(`#app .opt[data-letter="${before.ans}"]`).click();
  await expect.poll(() => page.evaluate(() => ML.dbg.round), { timeout: 6000 }).toBe(before.round + 1);
  expect(await page.evaluate(() => ML.dbg.score)).toBe(before.score);   // a corrected miss does not score
});

test('full run: 3 levels to the end card, zero page or console errors, no beacon under automation', async ({ page }) => {
  test.setTimeout(180000);
  const errors = [], land = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('request', (r) => { if (r.url().includes('/api/land')) land.push(r.url()); });
  await open(page);
  await page.click('#startBtn');
  for (let li = 0; li < 3; li++) {
    expect(await page.evaluate(() => ML.dbg.lvl)).toBe(li);
    expect(await page.evaluate(() => window.S.lvl)).toBe(li);
    for (let r = 0; r < 8; r++) {
      await expect.poll(() => page.evaluate(() => ML.dbg.round), { timeout: 6000 }).toBe(r);
      if (r === 2) await page.evaluate(() => ML.dbg.wrongForTest());
      const ans = await page.evaluate(() => ML.dbg.item.answer);
      await page.locator(`#app .opt[data-letter="${ans}"]`).click();
      if (r < 7) await expect.poll(() => page.evaluate(() => ML.dbg.round), { timeout: 6000 }).toBe(r + 1);
    }
    if (li < 2) {
      await expect(page.locator('.card h2')).toHaveText('Level done!');
      await expect(page.locator('.card .score')).toHaveText('7 / 8');
      await page.click('#nextLevelBtn');
    }
  }
  await expect(page.locator('.cde-end')).toBeVisible({ timeout: 8000 });
  await expect(page.locator('.card .score')).toHaveText('21 / 24');
  await expect(page.locator('.cde-end [data-kdm-primary]')).toBeVisible();
  expect(errors).toEqual([]);
  expect(land).toEqual([]);
});

for (const vp of [{ width: 360, height: 640 }, { width: 390, height: 844 }]) {
  test(`phone fit ${vp.width}x${vp.height}: start and every play control on screen, ≥ 44 px, no sideways scroll`, async ({ page }) => {
    await page.setViewportSize(vp);
    await open(page);
    const box = async (sel) => page.evaluate((s) => [...document.querySelectorAll(s)].filter((e) => e.offsetParent).map((e) => {
      const r = e.getBoundingClientRect(); return { s, l: r.left, t: r.top, r: r.right, b: r.bottom, w: r.width, h: r.height };
    }), sel);
    const check = async (sels) => {
      const bad = [];
      const vw = await page.evaluate(() => [innerWidth, innerHeight, document.documentElement.scrollWidth]);
      if (vw[2] > vw[0]) bad.push('sideways scroll ' + vw[2]);
      for (const s of sels) for (const b of await box(s)) {
        if (b.t < 0 || b.l < 0 || b.b > vw[1] || b.r > vw[0]) bad.push(`${s} off screen ${JSON.stringify(b)}`);
        if (/opt|say|start|next|primary/i.test(s) && (b.w < 44 || b.h < 44)) bad.push(`${s} ${b.w}x${b.h} < 44`);
      }
      return bad;
    };
    expect(await check(['#startBtn', '#homePill'])).toEqual([]);
    await page.click('#startBtn');
    for (const li of [0, 1, 2]) {
      await page.evaluate((i) => ML.dbg.startLevel(i), li);
      await page.waitForTimeout(300);
      expect(await check(['.pic', '.gap-word', '#sayBtn', '#app .opt', '.hud'])).toEqual([]);
      await page.evaluate(() => ML.dbg.wrongForTest());   // the miss line must fit too
      expect(await check(['.feedback', '#app .opt'])).toEqual([]);
    }
    await page.evaluate(() => ML.dbg.startLevel(0));
    for (let r = 0; r < 8; r++) {
      await page.evaluate(() => ML.dbg.solveForTest());
      if (r < 7) await expect.poll(() => page.evaluate(() => ML.dbg.round), { timeout: 6000 }).toBe(r + 1);
    }
    await expect(page.locator('#nextLevelBtn')).toBeVisible({ timeout: 6000 });
    expect(await check(['#nextLevelBtn'])).toEqual([]);
  });
}

const HEB = /[֐-׿]/;
for (const lang of ['en', 'he', 'es']) {
  test(`language leak (${lang}): menu and play screen`, async ({ page }) => {
    await page.addInitScript((l) => localStorage.setItem('cde_lang', l), lang);
    await open(page);
    const scan = () => page.evaluate((src) => {
      const re = new RegExp(src), heb = [];
      const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      for (let n = w.nextNode(); n; n = w.nextNode()) {
        const t = n.nodeValue.trim(), el = n.parentElement;
        if (!t || !el || el.closest('[lang="he"], script, style, [hidden], [aria-hidden="true"]') || !el.getClientRects().length) continue;
        if (re.test(t)) heb.push(t.slice(0, 40));
      }
      const D = window.CDE_STRINGS, en = D.en, cur = D[window.CDE_LANG] || {}, txt = document.body.innerText;
      const plain = (v) => String(v ?? '').replace(/<[^>]+>/g, '').split('{L}')[0].trim();
      const eng = window.CDE_LANG === 'en' ? [] : Object.entries(en).filter(([k, v]) => plain(v).length >= 6 && plain(cur[k]) !== plain(v) && txt.includes(plain(v))).map(([, v]) => plain(v));
      return { heb, eng, lang: window.CDE_LANG };
    }, HEB.source);
    const out = [];
    const look = async (where) => { const r = await scan(); expect(r.lang).toBe(lang);
      if (lang !== 'he') r.heb.forEach((t) => out.push(`${where}: Hebrew ${t}`));
      r.eng.forEach((t) => out.push(`${where}: English ${t}`)); };
    // the parent FAQ (.about) is English by design on every language; the menu check skips it
    await page.evaluate(() => { document.querySelector('.about').setAttribute('aria-hidden', 'true'); });
    await look('menu');
    await page.click('#startBtn');
    await page.waitForTimeout(500);
    await look('play');
    await page.evaluate(() => ML.dbg.wrongForTest());
    await look('miss');
    if (lang === 'he') expect(await page.evaluate(() => document.documentElement.getAttribute('data-cde-lang'))).toBe('he');
    expect(out).toEqual([]);
  });
}

test('contrast: menu and play text ≥ 4.5:1 (≥ 3:1 for large text) on its real background', async ({ page }) => {
  await open(page);
  const measure = () => page.evaluate(() => {
    const px = (c) => { const x = document.createElement('canvas').getContext('2d'); x.fillStyle = '#000'; x.fillStyle = c; x.fillRect(0, 0, 1, 1); return [...x.getImageData(0, 0, 1, 1).data]; };
    const parse = (c) => { const m = c.match(/rgba?\(([^)]+)\)/); if (!m) return px(c); const p = m[1].split(/[ ,/]+/).filter(Boolean).map(Number); return [p[0], p[1], p[2], p[3] == null ? 1 : p[3]]; };
    const lum = ([r, g, b]) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
    const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
    const stopsOf = (img) => (img.match(/rgba?\([^)]+\)|#[0-9a-f]{3,8}/gi) || []).map(parse);
    const bgs = (el) => {   // composite every ancestor's background (each gradient stop tried) over the lighter page stop
      let layers = [[[30, 27, 75]]];
      const chain = []; for (let e = el; e; e = e.parentElement) chain.unshift(e);
      for (const e of chain) {
        const cs = getComputedStyle(e), out = [];
        const own = cs.backgroundImage !== 'none' && e !== document.body ? stopsOf(cs.backgroundImage) : [];
        const bc = parse(cs.backgroundColor);
        const cands = own.length ? own : (bc[3] > 0 ? [bc] : null);
        if (!cands) continue;
        for (const base of layers.flat()) for (const c of cands) { const a = c[3] == null ? 1 : (c[3] > 1 ? c[3] / 255 : c[3]); out.push([0, 1, 2].map((k) => c[k] * a + base[k] * (1 - a))); }
        layers = [out];
      }
      return layers.flat();
    };
    const bad = [];
    for (const el of document.querySelectorAll('.sub, .pill, #startBtn, .about p, .hud-level, .hud-label, .gap-word, .opt, .feedback, .tip, .card h2, .card .score, .card p')) {
      if (!el.getClientRects().length || !el.textContent.trim()) continue;
      const cs = getComputedStyle(el); const fg = parse(cs.color);
      const big = parseFloat(cs.fontSize) >= 24 || (parseFloat(cs.fontSize) >= 18.66 && +cs.fontWeight >= 700);
      const worst = Math.min(...bgs(el).map((b) => ratio(fg, b)));
      if (worst < (big ? 3 : 4.5)) bad.push(`${el.className || el.id || el.tagName}: ${worst.toFixed(2)}`);
    }
    return bad;
  });
  expect(await measure()).toEqual([]);
  await page.click('#startBtn');
  await page.waitForTimeout(400);
  expect(await measure()).toEqual([]);
  await page.evaluate(() => ML.dbg.wrongForTest());
  expect(await measure()).toEqual([]);
});

test('speech sync (warm): each word stays with its round', async ({ page }) => {
  test.setTimeout(90000);
  await instrumentSpeech(page, { audio: /\/audio\/[a-z0-9-]+\.mp3/, visual: () => (window.ML && ML.dbg.item ? ML.dbg.round + ':' + ML.dbg.item.word : ''), answerSel: '#app .opt' });
  await open(page);
  await page.click('#startBtn');
  for (let i = 0; i < 5; i++) {
    await page.waitForTimeout(1300);   // the child listens, then taps
    if (i === 2) { await page.evaluate(() => ML.dbg.wrongForTest()); await page.waitForTimeout(900); }
    await page.evaluate(() => ML.dbg.solveForTest());
    await expect.poll(() => page.evaluate(() => ML.dbg.round), { timeout: 6000 }).toBe(i + 1);
  }
  await page.waitForTimeout(1500);
  const r = checkSpeech(await page.evaluate(() => window.__sync));
  expect(r.spoken).toBeGreaterThan(4);
  expect(r.problems).toEqual([]);
});
