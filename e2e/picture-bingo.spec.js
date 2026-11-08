// Picture Bingo (wave 1, 11-07): word data, dealing (no oracle, uniform layout), the call rules, wrong taps,
// "not on my card" calls, a full run to the end card, phone fit + tap size, language leak, contrast, class mode,
// and speech-sync with real audio.
import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import { WORDS } from '../src/data/words.js';
import { instrumentSpeech, checkSpeech } from './lib/speech-sync.mjs';
import { cold } from './lib/cold-net.mjs';

const URL = '/games/picture-bingo/index.html';
const REMOVED = 'soap roof blanket grape crayon baby drizzle rainy windy cloudy sunny karate gymnasium lunchbox homework skirt pajamas forehead chin neck cloud snow ice storm fog hail hurricane tornado frost avalanche dancing wrestling treasure head nose mouth arm shoulder knee elbow ankle wrist chest hip cheek belly desk chalk marker overalls apron ferry pair ivory coral teal pebble attic basket sticker ribbon whisper rug back teeth lips tummy leg face palm toe tongue hair bandana slippers bowtie textbook glue hiking jumping fencing blocks swing pinwheel sled marble puppet yoga bracelet beret poncho poster grumpy cheerful diving pond garage raft'.split(' ');
const BODY = ['hand', 'foot', 'ear', 'eye', 'finger', 'thumb', 'tooth', 'heart', 'bone'];

// Logic tests: no audio files → cdeSay's fallback (TTS is off under automation) → calls advance at once.
async function open(page, { audio = false, lang, cls, viewport } = {}) {
  const errors = [];
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  const land = [];
  await page.route('**/api/**', (r) => { land.push(r.request().url()); r.fulfill({ status: 204 }); });
  if (!audio) await page.route('**/audio/**', (r) => r.fulfill({ status: 404, body: '' }));
  if (viewport) await page.setViewportSize(viewport);
  await page.addInitScript(([l, c]) => { try { if (l) localStorage.setItem('cde_lang', l); if (c) localStorage.setItem('cde_pb_class', '1'); } catch (e) {} }, [lang || '', !!cls]);
  await page.goto(URL);
  await page.waitForFunction(() => window.PB && window.cdeSay && document.readyState === 'complete');
  await page.evaluate(() => { const o = window.cdeSay; window.__said = []; window.cdeSay = function (w, f) { window.__said.push(w); return o(w, f); }; });
  // 404 audio logs a console error per word: that's this test's doing, not the game's
  return { errors: () => errors.filter((e) => !/404|Failed to load resource/.test(e)), land };
}
const waitCall = (page) => page.waitForFunction(() => PB.dbg.call && !PB.dbg.busy, null, { timeout: 8000 });

test('word data: every word is a CDE word with a picture and audio, never removed or a body part', async ({ page }) => {
  await open(page);
  const topics = await page.evaluate(() => PB.TOPICS);
  const byId = Object.fromEntries(WORDS.map((w) => [w.id, w]));
  const bad = [];
  const all = Object.values(topics).flat();
  expect(new Set(all).size).toBe(all.length); // a word lives in one topic only
  for (const id of all) {
    const w = byId[id];
    if (!w) { bad.push(id + ': not in WORDS'); continue; }
    if (w.imageUrl !== `/images/${id}.webp` || !fs.existsSync(`public${w.imageUrl}`)) bad.push(id + ': image');
    if (!fs.existsSync(`public/audio/${id}.mp3`)) bad.push(id + ': audio');
    if (REMOVED.includes(id) || BODY.includes(id)) bad.push(id + ': removed / body part');
  }
  expect(bad).toEqual([]);
  // drawn/emoji pictures leave the card topics (one style per card, 11-07): every topic still fills a 5/4 or 4-per-topic
  // card, and enough topics fill a one-topic card of 9
  for (const [t, ws] of Object.entries(topics)) expect(ws.length, t).toBeGreaterThanOrEqual(5);
  expect(Object.values(topics).filter((ws) => ws.length >= 9).length).toBeGreaterThanOrEqual(3);
});

test('dealing: card sizes, topics, decoys off the card, uniform layout', async ({ page }) => {
  await open(page);
  const r = await page.evaluate(() => {
    const T = PB.TOPICS, topicOf = {}; Object.entries(T).forEach(([t, ws]) => ws.forEach((w) => { topicOf[w] = t; }));
    const errs = [], pos = Array(9).fill(0), pos16 = Array(16).fill(0);
    for (let n = 0; n < 3000; n++) {
      for (let lv = 0; lv < 3; lv++) {
        const d = PB.dbg.deal(lv), size = lv === 2 ? 16 : 9;
        if (d.card.length !== size || new Set(d.card).size !== size) errs.push(`L${lv + 1} size/dupes`);
        const ts = new Set(d.card.map((w) => topicOf[w]));
        if (ts.size !== [2, 1, 4][lv]) errs.push(`L${lv + 1} topics ${[...ts]}`);
        if (lv === 2) { for (const t of ts) if (d.card.filter((w) => topicOf[w] === t).length !== 4) errs.push('L3 not 4 per topic');
          if (d.decoySlots.length < 1 || d.decoySlots.length > 2 || d.decoySlots.some((s) => s < 1 || s > 3)) errs.push('decoy slots ' + d.decoySlots);
          if (d.decoyPool.some((w) => d.card.includes(w))) errs.push('decoy on card');
        } else if (d.decoySlots.length) errs.push('decoys before L3');
        // the alphabetically first word's square: must be uniform over the card
        const first = [...d.card].sort()[0];
        if (lv === 2) pos16[d.card.indexOf(first)]++; else if (lv === 1) pos[d.card.indexOf(first)]++;
      }
    }
    return { errs: [...new Set(errs)], pos, pos16 };
  });
  expect(r.errs).toEqual([]);
  for (const c of r.pos) expect(Math.abs(c - 3000 / 9) / (3000 / 9)).toBeLessThan(0.2);
  for (const c of r.pos16) expect(Math.abs(c - 3000 / 16) / (3000 / 16)).toBeLessThan(0.3);
});

test('no oracle over many calls: the called square never stands out, a call never targets a marked square', async ({ page }) => {
  test.setTimeout(120000);
  const h = await open(page);
  await page.click('#startBtn');
  const bad = [];
  let calls = 0, decoys = 0;
  for (let round = 0; round < 6; round++) {
    for (const lv of [0, 1, 2]) {
      await page.evaluate((l) => PB.dbg.startLevel(l), lv);
      for (let k = 0; k < 20; k++) {
        await waitCall(page);
        const s = await page.evaluate(() => {
          const sq = [...document.querySelectorAll('#grid .sq')], st = (e) => { const c = getComputedStyle(e); return [c.borderColor, c.boxShadow, c.transform, c.opacity, c.outlineStyle, c.animationName, e.className].join('|'); };
          const open = sq.filter((e) => !e.classList.contains('marked'));
          return { call: PB.dbg.call, decoy: PB.dbg.decoy, card: PB.dbg.card, marked: PB.dbg.marked, lvl: PB.dbg.lvl,
            looks: [...new Set(open.map(st))].length, focusSq: (() => { const a = document.activeElement && document.activeElement.closest('.sq'); return !!a && !PB.dbg.decoy && PB.dbg.card[+a.dataset.i] === PB.dbg.call; })(),
            notOn: !!document.getElementById('notOn'), labels: sq.map((e) => e.textContent.trim()).filter(Boolean).length };
        });
        calls++;
        if (s.looks !== 1) bad.push(`L${s.lvl + 1}: unmarked squares look different (${s.looks})`);
        if (s.focusSq) bad.push('the called square has focus at call time');
        if (s.labels) bad.push('text on the card');
        if (s.notOn !== (s.lvl === 2)) bad.push('not-on-my-card button shown wrong');
        if (s.decoy) { decoys++; if (s.card.includes(s.call)) bad.push('decoy is on the card'); }
        else { const i = s.card.indexOf(s.call); if (i < 0) bad.push('call not on card'); else if (s.marked[i]) bad.push('call targets a marked square'); }
        await page.evaluate(() => PB.dbg.solveForTest());
        await page.waitForFunction(() => PB.dbg.busy || !PB.dbg.call || document.querySelector('#app .card'));
        if (await page.locator('#app .card').count()) break;
        if (await page.evaluate(() => PB.dbg.bingo)) { await page.locator('#app .card').waitFor(); break; }
      }
      await expect(page.locator('#app .card')).toBeVisible();
    }
  }
  expect(bad).toEqual([]);
  expect(calls).toBeGreaterThan(50);
  expect(decoys).toBeGreaterThanOrEqual(6);
  expect(h.errors()).toEqual([]);
});

test('wrong tap: no mark, a miss, shake, and the call is said again; "not on my card" both ways', async ({ page }) => {
  await open(page);
  await page.click('#startBtn');
  await waitCall(page);
  const before = await page.evaluate(() => ({ said: window.__said.length, call: PB.dbg.call }));
  await page.evaluate(() => PB.dbg.wrongForTest());
  const after = await page.evaluate(() => ({ said: window.__said.slice(), marked: PB.dbg.marked.filter(Boolean).length, misses: PB.dbg.S.misses, shake: document.querySelectorAll('.sq.shake').length, call: PB.dbg.call }));
  expect(after.marked).toBe(0);
  expect(after.misses).toBe(1);
  expect(after.shake).toBe(1);
  expect(after.call).toBe(before.call);
  expect(after.said.length).toBe(before.said + 1);
  expect(after.said.at(-1)).toBe(before.call);
  // level 3: "not on my card" on a real call is a miss; a picture tap on a decoy call is a miss
  await page.evaluate(() => PB.dbg.startLevel(2));
  let sawDecoy = false, sawReal = false;
  for (let k = 0; k < 20 && !(sawDecoy && sawReal); k++) {
    await waitCall(page);
    const s = await page.evaluate(() => ({ decoy: PB.dbg.decoy, m: PB.dbg.S.misses }));
    if (s.decoy && !sawDecoy) {
      await page.locator('#grid .sq:not(.marked)').first().click();
      expect(await page.evaluate(() => PB.dbg.S.misses)).toBe(s.m + 1);
      sawDecoy = true;
    } else if (!s.decoy && !sawReal) {
      await page.click('#notOn');
      expect(await page.evaluate(() => PB.dbg.S.misses)).toBe(s.m + 1);
      expect(await page.locator('#notOn.shake').count()).toBe(1);
      sawReal = true;
    }
    await page.evaluate(() => PB.dbg.solveForTest());
    await page.waitForFunction(() => PB.dbg.busy);
  }
  expect(sawDecoy && sawReal).toBe(true);
});

test('full run to the end card: bingo lines, no errors, no beacon under automation', async ({ page }) => {
  test.setTimeout(60000);
  const h = await open(page);
  await expect(page.locator('#startBtn')).toBeVisible();
  await page.click('#startBtn');
  for (let lv = 0; lv < 3; lv++) {
    expect(await page.evaluate(() => window.S.lvl)).toBe(lv); // game-clicks.js reads S.lvl
    while (!(await page.locator('#app .card').count())) {
      await waitCall(page).catch(() => {});
      if (await page.locator('#app .card').count()) break;
      await page.evaluate(() => PB.dbg.solveForTest());
      await page.waitForTimeout(30);
      const b = await page.evaluate(() => PB.dbg.bingo);
      if (b) {
        expect(await page.locator('#grid .sq.line').count()).toBe(lv === 2 ? 4 : 3);
        await expect(page.locator('#fb .bingo')).toBeVisible();
        await page.locator('#app .card').waitFor();
      }
    }
    if (lv < 2) { await expect(page.locator('#app .card h2')).toContainText('Card done'); await page.click('#nextLevel'); }
  }
  await expect(page.locator('#app .card h2')).toContainText('All three cards done');
  await expect(page.locator('.cde-end')).toBeVisible();
  await expect(page.locator('.cde-end a[href*="/games/"]')).toBeVisible();
  expect(h.errors()).toEqual([]);
  expect(h.land.filter((u) => u.includes('/api/land'))).toEqual([]);
});

for (const vp of [{ width: 360, height: 640 }, { width: 390, height: 844 }]) {
  for (const cls of [false, true]) {
    test(`phone fit ${vp.width}×${vp.height}${cls ? ' (class mode)' : ''}: no scroll, nothing clipped, taps ≥ 44 px`, async ({ page }) => {
      await open(page, { viewport: vp, cls });
      const fits = async (sel) => page.evaluate((s) => [...document.querySelectorAll(s)].filter((e) => e.getClientRects().length).map((e) => {
        const r = e.getBoundingClientRect(); return { s, w: Math.round(r.width), h: Math.round(r.height), top: r.top, bottom: r.bottom, left: r.left, right: r.right };
      }), sel);
      const menu = await fits('#startBtn');
      expect(menu[0].bottom).toBeLessThanOrEqual(vp.height);
      await page.click('#startBtn');
      for (const lv of [0, 2]) {
        await page.evaluate((l) => PB.dbg.startLevel(l), lv);
        await waitCall(page);
        const els = await fits('#sayBtn, #grid .sq, #notOn');
        expect(els.length).toBe(lv === 2 ? 18 : 10);
        for (const e of els) {
          expect(e.w, e.s).toBeGreaterThanOrEqual(44); expect(e.h, e.s).toBeGreaterThanOrEqual(44);
          expect(e.top).toBeGreaterThanOrEqual(0); expect(e.bottom).toBeLessThanOrEqual(vp.height);
          expect(e.left).toBeGreaterThanOrEqual(0); expect(e.right).toBeLessThanOrEqual(vp.width);
        }
        const scroll = await page.evaluate(() => document.scrollingElement.scrollHeight - innerHeight);
        expect(scroll).toBeLessThanOrEqual(1);
        // the home pill must not sit on top of the play controls
        const pill = (await fits('#homePill'))[0], top = Math.min(...els.map((e) => e.top));
        expect(pill.bottom).toBeLessThanOrEqual(top);
      }
    });
  }
}

// Linux / Android fonts set wider than a Mac's, so a line that fits here wrapped on CI (11-08: class mode 3-11 px
// past a 360x640 screen, Received 3). Verdana sets like CI's DejaVu Sans and reproduces it on a Mac.
test('phone fit 360×640 class mode with wider fonts: no scroll', async ({ page }) => {
  await open(page, { viewport: { width: 360, height: 640 }, cls: true });
  await page.addStyleTag({ content: 'body,body *{font-family:Verdana,"DejaVu Sans",sans-serif!important;}' });
  await page.click('#startBtn');
  for (const lv of [0, 2]) {
    await page.evaluate((l) => PB.dbg.startLevel(l), lv);
    await waitCall(page);
    const scroll = await page.evaluate(() => document.scrollingElement.scrollHeight - innerHeight);
    expect(scroll, `level ${lv + 1}`).toBeLessThanOrEqual(1);
  }
});

test('class mode: toggle, bigger card on a projector, each call said twice, slower pace', async ({ page }) => {
  await open(page, { viewport: { width: 1280, height: 800 } });
  await page.click('#startBtn');
  await waitCall(page);
  const small = await page.locator('#grid').boundingBox();
  await page.goto(URL);
  await page.waitForFunction(() => window.PB && document.readyState === 'complete');
  await page.click('#classBtn');
  await expect(page.locator('#classBtn')).toHaveAttribute('aria-pressed', 'true');
  await page.reload(); // remembered
  await page.waitForFunction(() => window.PB && document.readyState === 'complete');
  await expect(page.locator('#classBtn')).toHaveAttribute('aria-pressed', 'true');
  await page.evaluate(() => { const o = window.cdeSay; window.__said = []; window.cdeSay = function (w, f) { window.__said.push(w); return o(w, f); }; });
  await page.click('#startBtn');
  await waitCall(page);
  const big = await page.locator('#grid').boundingBox();
  expect(big.width).toBeGreaterThan(small.width * 1.2);
  await page.waitForTimeout(2200);
  const said = await page.evaluate(() => window.__said);
  expect(said.length).toBe(2);
  expect(said[0]).toBe(said[1]);
});

for (const lang of ['en', 'he', 'es']) {
  test(`language: ${lang} menu + play show no wrong-language chrome`, async ({ page }) => {
    await open(page, { lang });
    const check = () => page.evaluate((lg) => {
      const out = [], HEB = /[֐-׿]/;
      const D = window.CDE_STRINGS, en = D.en, cur = D[lg] || {};
      const plain = (v) => String(v ?? '').replace(/<[^>]+>/g, '').trim();
      const txt = document.body.innerText;
      if (lg !== 'en') for (const [k, v] of Object.entries(en)) if (plain(v).length >= 6 && plain(cur[k]) !== plain(v) && txt.includes(plain(v))) out.push('English: ' + plain(v));
      if (lg !== 'he') { const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
        for (let n = w.nextNode(); n; n = w.nextNode()) { const e = n.parentElement; if (HEB.test(n.nodeValue) && e && e.offsetParent && !e.closest('[lang="he"],script,style,[hidden]')) out.push('Hebrew: ' + n.nodeValue.trim()); } }
      return out;
    }, lang);
    const found = [...await check()];
    await page.click('#startBtn');
    await waitCall(page);
    await page.evaluate(() => PB.dbg.wrongForTest());
    found.push(...await check());
    await page.evaluate(() => PB.dbg.startLevel(2));
    await waitCall(page);
    found.push(...await check());
    expect(found).toEqual([]);
    if (lang === 'he') await expect(page.locator('#sayBtn')).toContainText('לשמוע שוב');
  });
}

test('contrast: play-screen text is readable (WCAG AA; 3:1 for large bold buttons)', async ({ page }) => {
  await open(page);
  await page.click('#startBtn');
  await page.evaluate(() => PB.dbg.startLevel(2));
  await waitCall(page);
  const r = await page.evaluate(() => {
    const lum = (c) => { const [r, g, b] = c.match(/\d+(\.\d+)?/g).slice(0, 3).map(Number).map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
    const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
    const BG = 'rgb(30, 27, 75)'; // the lighter end of the page gradient (#1e1b4b)
    return {
      hud: ratio(getComputedStyle(document.querySelector('.hud')).color, BG),
      call: ratio(getComputedStyle(document.querySelector('.hud-call')).color, BG),
      fb: ratio(getComputedStyle(document.querySelector('#fb')).color, BG),
      notOn: ratio(getComputedStyle(document.querySelector('#notOn')).color, BG),
      say: ratio(getComputedStyle(document.querySelector('#sayBtn')).color, 'rgb(139, 92, 246)'), // lighter end of its gradient
    };
  });
  for (const k of ['hud', 'call', 'fb', 'notOn']) expect(r[k], k).toBeGreaterThanOrEqual(4.5);
  expect(r.say).toBeGreaterThanOrEqual(3);
});

for (const mode of ['warm', 'cold']) test(`speech-sync (real audio, ${mode}): a call has finished before the next call shows`, async ({ page }) => {
  test.skip(!!process.env.CI, 'speech-sync needs real audio output (CI has none)');
  test.setTimeout(60000);
  await instrumentSpeech(page, { audio: /\/audio\/[a-z0-9-]+\.mp3/, visual: () => document.getElementById('hud')?.getAttribute('data-call') || '', answerSel: '.sq, #notOn' });
  await page.route('**/api/**', (r) => r.fulfill({ status: 204 }));
  await page.goto(URL);
  if (mode === 'cold') await cold(page);
  await page.waitForFunction(() => window.PB && document.readyState === 'complete');
  // warm: fetch every card word once (cold skips it: with the cache off it only queued ~100 clips ahead of the call on
  // the slow line, which no child's browser does)
  if (mode === 'warm') await page.evaluate(() => Promise.all(Object.values(PB.TOPICS).flat().map((w) => fetch('/audio/' + w + '.mp3'))));
  await page.click('#startBtn');
  for (const lv of [0, 2]) {
    // the jump to level 3 is the test's shortcut, not a child's: it waits for the word to end first
    if (lv) await page.evaluate(() => new Promise((r) => window.cdeSayDone(4000, r)).then(() => PB.dbg.startLevel(2)));
    for (let k = 0; k < 5; k++) {
      await page.waitForFunction(() => PB.dbg.call && !PB.dbg.busy, null, { timeout: 10000 }).catch(() => {});
      if (await page.locator('#app .card').count()) break;
      // a child taps only after the word has started (on a slow line it starts late): wait for this call's word
      await page.waitForFunction(() => { const l = window.__sync, v = l.map((x) => x.e).lastIndexOf('visual'); return l.slice(v).some((x) => x.e === 'start'); }, null, { timeout: 8000 }).catch(() => {});
      await page.waitForTimeout(k % 2 ? 150 : 900); // fast taps (mid-word) and a child's pace
      await page.evaluate(() => PB.dbg.solveForTest());
    }
  }
  await page.waitForTimeout(2500);
  const r = checkSpeech(await page.evaluate(() => window.__sync));
  expect(r.spoken).toBeGreaterThan(5);
  expect(r.problems).toEqual([]);
});
