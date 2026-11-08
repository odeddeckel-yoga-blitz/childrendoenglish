import { test, expect } from '@playwright/test';
import fs from 'fs';
import { instrumentSpeech, checkSpeech } from './lib/speech-sync.mjs';
import { cold } from './lib/cold-net.mjs';

// Word Memory (/games/word-memory/): picture ↔ English word concentration game.
const URL = '/games/word-memory/index.html';
const REMOVED = 'soap roof blanket grape crayon baby drizzle rainy windy cloudy sunny karate gymnasium lunchbox homework skirt pajamas forehead chin neck cloud snow ice storm fog hail hurricane tornado frost avalanche dancing wrestling treasure head nose mouth arm shoulder knee elbow ankle wrist chest hip cheek belly desk chalk marker overalls apron ferry pair ivory coral teal pebble attic basket sticker ribbon whisper rug back teeth lips tummy leg face palm toe tongue hair bandana slippers bowtie textbook glue hiking jumping fencing blocks swing pinwheel sled marble puppet yoga bracelet beret poncho poster grumpy cheerful diving pond garage raft'.split(' ');
const BODY = ['hand', 'foot', 'feet', 'ear', 'eye', 'finger', 'nose', 'thumb', 'toe', 'lip'];
const HEB = /[֐-׿]/;

async function open(page, { lang = 'en', errors } = {}) {
  await page.route('**/api/**', (r) => r.fulfill({ status: 204 }));
  if (errors) {
    page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
    page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  }
  await page.addInitScript((l) => { try { localStorage.setItem('cde_lang', l); } catch (e) {} }, lang);
  await page.goto(URL);
  await page.waitForFunction(() => window.WM && window.CDE_STRINGS);
}
const state = (page) => page.evaluate(() => WM.dbg.state);

// Every face-down card is the same: no face node, no image, no word, generic label.
async function faceDownLeaks(page) {
  return page.evaluate(() => {
    const out = [], words = [], st = WM.dbg.state;
    st.deck.forEach((c) => words.push(c.id));
    const shapes = new Set();
    document.querySelectorAll('#wmBoard .mc').forEach((b, i) => {
      if (st.deck[i].up || st.deck[i].done) return;
      if (b.querySelector('.face, img')) out.push(`card ${i}: has a face node`);
      if (b.hasAttribute('title') || b.hasAttribute('alt') || b.hasAttribute('data-kind') || b.hasAttribute('data-id')) out.push(`card ${i}: extra attribute`);
      const lab = b.getAttribute('aria-label') || '';
      if (words.some((w) => lab.toLowerCase().includes(w))) out.push(`card ${i}: label names the word`);
      if (words.some((w) => (b.textContent || '').toLowerCase().includes(w))) out.push(`card ${i}: text names the word`);
      shapes.add(b.className + '|' + b.outerHTML.replace(/data-i="\d+"/, '').replace(/aria-label="[^"]*"/, ''));
    });
    if (shapes.size > 1) out.push('face-down cards differ in markup: ' + [...shapes].join(' ≠ ').slice(0, 300));
    return out;
  });
}

// Play one level perfectly through the real tap path (solveForTest clicks the cards).
async function solveLevel(page) {
  const lvl = (await state(page)).lvl;
  for (let k = 0; k < 160; k++) {
    const st = await state(page);
    if (st.phase !== 'play' || st.lvl !== lvl) return;
    if (!st.lock && st.up.length === 0 && st.queued.length === 0) await page.evaluate(() => WM.dbg.solveForTest());
    await page.waitForTimeout(250);
  }
}

test('word data: every card word is a CDE word with a picture and audio, never removed or a body part', async ({ page }) => {
  await open(page);
  const topics = await page.evaluate(() => WM.TOPICS);
  const { WORDS } = await import('../src/data/words.js');
  const ids = [];
  for (const [t, rows] of Object.entries(topics)) {
    expect(rows.length, t).toBeGreaterThanOrEqual(12);
    for (const [id, word] of rows) {
      ids.push(id);
      const w = WORDS.find((x) => x.id === id);
      expect(w, id).toBeTruthy();
      expect(w.word, id).toBe(word);
      expect(w.category, id).toBe(t);
      expect(w.imageUrl, id).toBe('/images/' + id + '.webp');
      expect(fs.existsSync('public' + w.imageUrl), id + ' image').toBe(true);
      expect(fs.existsSync('public/audio/' + id + '.mp3'), id + ' audio').toBe(true);
      expect(REMOVED.includes(id), id + ' removed').toBe(false);
      expect(BODY.includes(id), id + ' body part').toBe(false);
    }
  }
  expect(new Set(ids).size).toBe(ids.length);
});

test('deal: nothing starts face up or matched, faces are not in the DOM, layout is a uniform shuffle', async ({ page }) => {
  test.setTimeout(90000);
  await open(page);
  await page.click('#startBtn');
  for (const lvl of [0, 1, 2]) {
    await page.evaluate((l) => WM.dbg.restartForTest(l), lvl);
    const st = await state(page);
    expect(st.deck.length).toBe([6, 8, 12][lvl]);
    expect(st.deck.every((c) => !c.up && !c.done)).toBe(true);
    expect(st.found).toBe(0); expect(st.up).toEqual([]);
    expect(await page.locator('#app img').count()).toBe(0);
    expect(await faceDownLeaks(page)).toEqual([]);
    const labels = await page.locator('#wmBoard .mc').evaluateAll((bs) => bs.map((b) => b.getAttribute('aria-label')));
    labels.forEach((l, i) => expect(l).toBe(`Card ${i + 1}, face down`));
  }
  // 400 level-3 deals: each position is a picture about half the time, partners are adjacent about 2/N of the time,
  // every id appears once as a picture and once as a word, and the words vary.
  const r = await page.evaluate(() => {
    const N = 12, D = 400, pic = new Array(N).fill(0), seen = new Set(); let adj = 0, pairs = 0, bad = 0;
    for (let d = 0; d < D; d++) {
      WM.dbg.restartForTest(2);
      const deck = WM.dbg.state.deck;
      if (deck.some((c) => c.up || c.done)) bad++;
      const pos = {};
      deck.forEach((c, i) => { if (c.kind === 'p') pic[i]++; seen.add(c.id); (pos[c.id] = pos[c.id] || []).push(c.kind + i); });
      Object.values(pos).forEach((v) => { if (v.length !== 2 || v[0][0] === v[1][0]) bad++; pairs++; if (Math.abs(+v[0].slice(1) - +v[1].slice(1)) === 1) adj++; });
    }
    return { pic: pic.map((x) => x / D), adj: adj / pairs, bad, words: seen.size };
  });
  expect(r.bad).toBe(0);
  r.pic.forEach((p) => { expect(p).toBeGreaterThan(0.38); expect(p).toBeLessThan(0.62); });
  expect(Math.abs(r.adj - 2 / 12)).toBeLessThan(0.05);
  expect(r.words).toBeGreaterThanOrEqual(15);
});

test('play: a wrong pair turns back and hides its faces, a full run reaches the end card with no errors', async ({ page }) => {
  test.setTimeout(120000);
  const errors = [], land = [];
  page.on('request', (q) => { if (q.url().includes('/api/land')) land.push(q.url()); });
  await open(page, { errors });
  await page.click('[data-topic="food"]');
  await page.click('#startBtn');
  let st = await state(page);
  expect(st.topic).toBe('food');
  // a wrong pair: one picture + a word that is not its word
  const a = st.deck.findIndex((c) => c.kind === 'p');
  const b = st.deck.findIndex((c) => c.kind === 'w' && c.id !== st.deck[a].id);
  await page.locator(`.mc[data-i="${a}"]`).click();
  await expect(page.locator(`.mc[data-i="${a}"] img`)).toHaveCount(1);
  expect(await page.locator(`.mc[data-i="${a}"]`).getAttribute('aria-label')).toContain(st.deck[a].id);
  await page.locator(`.mc[data-i="${b}"]`).click();
  await expect.poll(async () => (await state(page)).moves).toBe(1);
  await expect.poll(async () => (await state(page)).up.length, { timeout: 6000 }).toBe(0);
  await expect(page.locator('#wmBoard .face')).toHaveCount(0);
  expect(await page.locator(`.mc[data-i="${a}"]`).getAttribute('aria-label')).toBe(`Card ${a + 1}, face down`);
  expect(await faceDownLeaks(page)).toEqual([]);
  await solveLevel(page);
  await expect(page.locator('#wmNext')).toBeVisible({ timeout: 8000 });
  await page.click('#wmNext');
  await solveLevel(page);
  await expect(page.locator('.stars')).toHaveAttribute('aria-label', '3 of 3 stars', { timeout: 8000 }); // perfect level 2
  await page.click('#wmNext');
  expect((await state(page)).deck.length).toBe(12);
  await solveLevel(page);
  await expect(page.locator('.cde-end')).toBeVisible({ timeout: 8000 });
  await expect(page.locator('.cde-end [data-kdm-primary]')).toBeVisible();
  expect((await state(page)).phase).toBe('end');
  expect(land).toEqual([]);
  expect(errors).toEqual([]);
});

for (const vp of [{ width: 360, height: 640 }, { width: 390, height: 844 }]) {
  test(`phone fit ${vp.width}x${vp.height}: Start and all 12 cards on screen, no scroll, targets >= 44 px`, async ({ page }) => {
    await page.setViewportSize(vp);
    await open(page);
    const box = (sel) => page.locator(sel).first().boundingBox();
    const sb = await box('#startBtn');
    expect(sb.y + sb.height).toBeLessThanOrEqual(vp.height);
    for (const t of await page.locator('.topic').all()) { const b = await t.boundingBox(); expect(b.height).toBeGreaterThanOrEqual(44); expect(b.y + b.height).toBeLessThanOrEqual(vp.height); }
    await page.click('#startBtn');
    for (const lvl of [0, 1, 2]) {
      await page.evaluate((l) => WM.dbg.restartForTest(l), lvl);
      const r = await page.evaluate(() => {
        const pill = document.getElementById('homePill').getBoundingClientRect(), hud = document.getElementById('wmHud').getBoundingClientRect();
        const cs = [...document.querySelectorAll('#wmBoard .mc')].map((c) => c.getBoundingClientRect());
        return { iw: innerWidth, ih: innerHeight, sh: document.documentElement.scrollHeight, sw: document.documentElement.scrollWidth,
          pillBottom: pill.bottom, hudTop: hud.top, min: Math.min(...cs.map((c) => Math.min(c.width, c.height))),
          maxB: Math.max(...cs.map((c) => c.bottom)), maxR: Math.max(...cs.map((c) => c.right)), minL: Math.min(...cs.map((c) => c.left)) };
      });
      expect(r.min, `lvl ${lvl} card size`).toBeGreaterThanOrEqual(44);
      expect(r.maxB, `lvl ${lvl} bottom`).toBeLessThanOrEqual(r.ih);
      expect(r.maxR).toBeLessThanOrEqual(r.iw); expect(r.minL).toBeGreaterThanOrEqual(0);
      expect(r.sh, `lvl ${lvl} page scrolls`).toBeLessThanOrEqual(r.ih + 1);
      expect(r.sw).toBeLessThanOrEqual(r.iw);
      expect(r.pillBottom).toBeLessThanOrEqual(r.hudTop + 1);
      if (lvl === 2 && vp.width === 360) expect(r.min).toBeGreaterThanOrEqual(80);
    }
    // a long word fits its card
    await page.evaluate(() => WM.dbg.restartForTest(2));
    const st = await state(page);
    const w = st.deck.findIndex((c) => c.kind === 'w');
    await page.locator(`.mc[data-i="${w}"]`).click();
    const fits = await page.locator(`.mc[data-i="${w}"] .w`).evaluate((t) => t.scrollWidth <= t.parentElement.clientWidth + 1);
    expect(fits).toBe(true);
  });
}

for (const lang of ['en', 'he', 'es']) {
  test(`language: no wrong-language text on the menu or the board (${lang})`, async ({ page }) => {
    await open(page, { lang });
    const check = async () => page.evaluate(({ lang, src }) => {
      const out = [], re = new RegExp(src);
      if (lang === 'en') {
        const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
        for (let n = w.nextNode(); n; n = w.nextNode()) {
          const el = n.parentElement; if (!re.test(n.nodeValue) || !el || el.closest('[lang="he"],script,style,[hidden]')) continue;
          if (el.getClientRects().length) out.push(n.nodeValue.trim());
        }
        return out;
      }
      const D = window.CDE_STRINGS, en = D.en, cur = D[lang], txt = document.body.innerText;
      const plain = (v) => String(v ?? '').replace(/<[^>]+>/g, '').trim();
      Object.entries(en).forEach(([k, v]) => { if (plain(v).length >= 5 && plain(cur[k]) !== plain(v) && new RegExp('(^|[^\\p{L}])' + plain(v).replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '($|[^\\p{L}])', 'u').test(txt)) out.push(plain(v)); });
      if (lang === 'es' && re.test(txt)) out.push('hebrew in es');
      return out;
    }, { lang, src: HEB.source });
    expect(await check()).toEqual([]);
    await page.click('#startBtn');
    // one found pair (shows the meaning line in he/es) and one turned card
    await page.evaluate(() => WM.dbg.solveForTest());
    await expect.poll(async () => (await state(page)).found, { timeout: 6000 }).toBe(1);
    expect(await check()).toEqual([]);
    const gl = page.locator('.face .gl');
    if (lang === 'en') await expect(gl).toHaveCount(0); else await expect(gl).toHaveCount(1);
  });
}

test('contrast: menu, HUD and card text meet WCAG AA', async ({ page }) => {
  await open(page);
  const ratio = () => page.evaluate(() => {
    const lum = (c) => { const m = c.match(/[\d.]+/g).map(Number); const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(m[0]) + 0.7152 * f(m[1]) + 0.0722 * f(m[2]); };
    const bgOf = (el) => { for (let e = el; e; e = e.parentElement) { const b = getComputedStyle(e).backgroundColor; const a = b.match(/[\d.]+/g); if (a && (a.length < 4 || +a[3] > 0.5)) return b; } return 'rgb(30,27,75)'; };
    const out = {};
    for (const sel of ['.sub', '.pick-label', '.topic', '#wmHud', '.tip', '.face .w']) {
      const el = document.querySelector(sel); if (!el || !el.getClientRects().length) continue;
      const a = lum(getComputedStyle(el).color), b = lum(bgOf(el));
      out[sel] = (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
    }
    return out;
  });
  const menu = await ratio();
  await page.click('#startBtn');
  const st = await state(page);
  await page.locator(`.mc[data-i="${st.deck.findIndex((c) => c.kind === 'w')}"]`).click();
  const play = await ratio();
  const all = { ...menu, ...play };
  expect(Object.keys(all).length).toBeGreaterThanOrEqual(5);
  for (const [k, v] of Object.entries(all)) expect(v, k).toBeGreaterThanOrEqual(4.5);
});

for (const mode of ['warm', 'cold']) test(`speech-sync: a word is never still playing when the next card turns or the board changes (${mode})`, async ({ page }) => {
  test.skip(!!process.env.CI, 'speech-sync needs real audio output (CI has none)');
  test.setTimeout(90000);
  await instrumentSpeech(page, {
    audio: /\/audio\/[a-z0-9-]+\.mp3/,
    visual: () => [...document.querySelectorAll('#wmBoard .mc.up')].map((b) => b.dataset.i).join(',') + '|' + (document.querySelector('#app .card h2')?.textContent || ''),
    answerSel: '.mc',
  });
  await open(page);
  if (mode === 'cold') await cold(page);
  await page.click('#startBtn');
  // warm the cache: one real run of the level's words
  await page.evaluate(() => Promise.all(WM.dbg.state.deck.map((c) => fetch('/audio/' + c.id + '.mp3'))));
  const st = await state(page);
  const tapIdx = async (i) => { await page.locator(`.mc[data-i="${i}"]`).click(); await page.waitForTimeout(300); };
  // word first, then a wrong picture fast (must wait for the word), then every pair word-first / picture-first
  const w0 = st.deck.findIndex((c) => c.kind === 'w');
  const wrongPic = st.deck.findIndex((c) => c.kind === 'p' && c.id !== st.deck[w0].id);
  await tapIdx(w0); await tapIdx(wrongPic);
  await expect.poll(async () => (await state(page)).up.length, { timeout: 6000 }).toBe(0);
  const ids = [...new Set(st.deck.map((c) => c.id))];
  for (const [n, id] of ids.entries()) {
    const p = st.deck.findIndex((c) => c.id === id && c.kind === 'p'), w = st.deck.findIndex((c) => c.id === id && c.kind === 'w');
    const [x, y] = n % 2 ? [p, w] : [w, p];
    await tapIdx(x); await tapIdx(y);
    await expect.poll(async () => (await state(page)).found, { timeout: 6000 }).toBe(n + 1);
  }
  await expect(page.locator('#wmNext')).toBeVisible({ timeout: 8000 });
  await page.waitForTimeout(500);
  const log = await page.evaluate(() => window.__sync); if (process.env.SYNC_DUMP) console.log(JSON.stringify(log.map((x) => [x.e, x.src, Math.round(x.t)])));
  const r = checkSpeech(log);
  expect(r.spoken).toBeGreaterThan(2);
  expect(r.problems).toEqual([]);
});
