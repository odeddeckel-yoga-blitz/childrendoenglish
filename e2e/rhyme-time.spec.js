// Rhyme Time (/games/rhyme-time/, wave 1): word data, rhyme correctness, oracle guards, phone fit, language leak,
// contrast, speech-sync and a full run to the end card with zero errors.
import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { instrumentSpeech, checkSpeech } from './lib/speech-sync.mjs';

const PAGE = '/games/rhyme-time/index.html';
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const REMOVED = `soap roof blanket grape crayon baby drizzle rainy windy cloudy sunny karate gymnasium lunchbox homework skirt pajamas
forehead chin neck cloud snow ice storm fog hail hurricane tornado frost avalanche dancing wrestling treasure head nose mouth arm
shoulder knee elbow ankle wrist chest hip cheek belly desk chalk marker overalls apron ferry pair ivory coral teal pebble attic
basket sticker ribbon whisper rug back teeth lips tummy leg face palm toe tongue hair bandana slippers bowtie textbook glue hiking
jumping fencing blocks swing pinwheel sled marble puppet yoga bracelet beret poncho poster grumpy cheerful diving pond garage raft`.split(/\s+/);
const BODY = ['hand', 'foot', 'ear', 'eye', 'finger', 'thumb', 'tooth', 'nose', 'sand', 'hose', 'boot'];
const HEB = /[֐-׿]/;

test.beforeEach(async ({ page }) => {
  await page.route('**/api/**', (r) => r.fulfill({ status: 204 }));
});

const data = (page) => page.evaluate(() => ({ FAM: RT.FAM, PH: RT.PH, NEAR: RT.NEAR, RIME: RT.RIME, DRAWN: window.CDE_DRAWN }));

test('every word is an app word with an image and audio, not removed, not a body part', async ({ page }) => {
  await page.goto(PAGE);
  const { FAM, PH } = await data(page);
  const { WORDS } = await import(pathToFileURL(path.join(ROOT, 'src/data/words.js')).href);
  const words = Object.values(FAM).flatMap((f) => f[1]);
  expect(new Set(words).size).toBe(words.length); // a word belongs to one family only
  const bad = [];
  for (const w of words) {
    const o = WORDS.find((x) => x.id === w);
    if (!o) { bad.push(`${w}: not in WORDS`); continue; }
    if (!fs.existsSync(path.join(ROOT, 'public', o.imageUrl))) bad.push(`${w}: no image ${o.imageUrl}`);
    if (o.imageUrl !== `/images/${w}.webp`) bad.push(`${w}: image path ${o.imageUrl}`);
    if (!fs.existsSync(path.join(ROOT, 'public/audio', `${w}.mp3`))) bad.push(`${w}: no audio`);
    if (REMOVED.includes(w)) bad.push(`${w}: removed word`);
    if (BODY.includes(w)) bad.push(`${w}: body part`);
    if (!PH[w]) bad.push(`${w}: no sound tags`);
  }
  expect(bad).toEqual([]);
  // every family has 2+ members, and spelling traps stay out (ear, and one is NOT with bone/phone)
  for (const [f, [, ws]] of Object.entries(FAM)) expect(ws.length, f).toBeGreaterThanOrEqual(2);
  expect(words).not.toContain('ear');
  expect(FAM.one[1]).not.toContain('one');
});

test('dealt rounds: true rhyme, no rhyming distractor, no oracle (slot, style, own picture)', async ({ page }) => {
  await page.goto(PAGE);
  const { FAM, PH, NEAR, RIME, DRAWN } = await data(page);
  expect(Array.isArray(DRAWN)).toBe(true); // the site-wide style map loaded (public/games/image-style.js)
  const ph = (w) => { const [on, vo] = PH[w].split(' '); return { on, vo, st: DRAWN.includes(w) ? 'd' : 'p' }; };
  const near = (a, b) => NEAR.some(([x, y]) => (x === a && y === b) || (x === b && y === a));
  for (const lvl of [0, 1, 2]) {
    const rounds = await page.evaluate((l) => RT.dbg.dealForTest(l, 600), lvl);
    const slot = [0, 0, 0];
    for (const r of rounds) {
      const msg = `L${lvl + 1} ${r.target}: ${r.options.join(',')}`;
      expect(r.options.length, msg).toBe(3);
      expect(new Set(r.options).size, msg).toBe(3);
      expect(r.options, msg).not.toContain(r.target); // the target's own picture is never an option
      expect(r.options, msg).toContain(r.answer);
      expect(RIME[r.answer], msg).toBe(RIME[r.target]);
      const ds = r.options.filter((w) => w !== r.answer);
      for (const d of ds) {
        expect(RIME[d], msg).not.toBe(RIME[r.target]);
        expect(near(RIME[d], RIME[r.target]), msg).toBe(false);
        // never a word that sounds like it rhymes: same vowel AND the same family ending
        expect(FAM[RIME[r.target]][1], msg).not.toContain(d);
        if (lvl === 2) expect(ph(d).on === ph(r.target).on || ph(d).vo === ph(r.target).vo, msg).toBe(true);
        else expect(FAM[RIME[d]][0], msg).toBe(lvl + 1);
      }
      expect(RIME[ds[0]], msg).not.toBe(RIME[ds[1]]);
      if (lvl < 2) expect(FAM[RIME[r.target]][0], msg).toBe(lvl + 1);
      // the answer's picture style (photo / drawing) is shared by a distractor
      expect(ds.some((d) => ph(d).st === ph(r.answer).st), msg).toBe(true);
      slot[r.options.indexOf(r.answer)]++;
    }
    // answer slot uniform: each slot 25–42 % of 600 deals (expected 33 %)
    for (const s of slot) { expect(s).toBeGreaterThan(150); expect(s).toBeLessThan(252); }
  }
  // every family member can be dealt as a level-3 target (2+ hard distractors exist)
  const short = [];
  for (const w of Object.keys(RIME)) {
    const c = await page.evaluate((x) => RT.dbg.candidatesForTest(x, 2), w);
    if (c.length < 2) short.push(w);
  }
  // a few words have too few hard distractors to be a level-3 target; they stay level-3 answers, and every family
  // keeps at least one word that can be the target
  expect(short.sort()).toEqual(['chair', 'shark', 'sheep', 'three']);
  for (const [f, [, ws]] of Object.entries(FAM)) expect(ws.some((w) => !short.includes(w)), f).toBe(true);
  const l3 = await page.evaluate(() => RT.dbg.dealForTest(2, 600));
  expect(l3.some((r) => short.includes(r.target))).toBe(false);
  for (const lvl of [0, 1, 2]) {
    const lens = await page.evaluate((l) => Array.from({ length: 50 }, () => RT.dbg.dealForTest(l, 8).length), lvl);
    expect(new Set(lens)).toEqual(new Set([8]));
  }
});

test('play screen: nothing pre-highlighted, no word text on options, idle reveals nothing', async ({ page }) => {
  await page.goto(PAGE);
  await page.click('#startBtn');
  for (let i = 0; i < 4; i++) {
    await expect(page.locator('#app .opt')).toHaveCount(3);
    const st = await page.evaluate(() => {
      const opts = [...document.querySelectorAll('#app .opt')];
      return {
        cls: opts.map((o) => o.className),
        labVisible: [...document.querySelectorAll('#app .hear .lab')].some((l) => l.getClientRects().length > 0),
        sizes: opts.map((o) => { const r = o.getBoundingClientRect(); return Math.round(r.width) + 'x' + Math.round(r.height); }),
        borders: opts.map((o) => getComputedStyle(o).borderColor + getComputedStyle(o).opacity),
        text: opts.map((o) => o.innerText.trim()),
        target: RT.dbg.round.target,
        imgs: opts.map((o) => o.querySelector('img').getAttribute('src')),
      };
    });
    expect(st.cls.every((c) => c === 'opt')).toBe(true);
    expect(st.labVisible).toBe(false);
    expect(new Set(st.sizes).size).toBe(1);
    expect(new Set(st.borders).size).toBe(1);
    expect(st.text.every((t) => t === '')).toBe(true);
    expect(st.imgs).not.toContain(`/images/${st.target}.webp`);
    if (i === 0) { // idle 4 s: no hint appears
      await page.waitForTimeout(4000);
      expect(await page.locator('#app .opt.ok, #app .opt.no, #app .opts.done').count()).toBe(0);
      expect((await page.locator('#app .feedback').innerText()).trim()).toBe('');
    }
    await page.evaluate(() => RT.dbg.solveForTest());
    await expect.poll(() => page.evaluate(() => RT.state.round), { timeout: 8000 }).toBe(i + 1);
  }
});

test('wrong tap: both words play, tip names the rhyme, the right picture is marked', async ({ page }) => {
  const played = [];
  page.on('request', (r) => { const m = r.url().match(/\/audio\/([a-z-]+)\.mp3/); if (m) played.push(m[1]); });
  await page.goto(PAGE);
  await page.click('#startBtn');
  await page.waitForTimeout(600);
  const r = await page.evaluate(() => RT.dbg.round);
  const wrong = r.options.find((w) => w !== r.answer);
  await page.locator(`#app .opt[data-word="${wrong}"]`).click();
  await expect(page.locator('#app .opt.no')).toHaveAttribute('data-word', wrong);
  await expect(page.locator('#app .opt.ok')).toHaveAttribute('data-word', r.answer);
  const fb = await page.locator('#app .feedback').innerText();
  for (const w of [r.target, r.answer, wrong]) expect(fb).toContain(w);
  await page.waitForTimeout(2500);
  expect(played).toContain(wrong);
  expect(played.filter((w) => w === r.target).length).toBeGreaterThanOrEqual(2);
  await expect(page.locator('#nextBtn')).toBeVisible();
});

test('full run to the end card: 3 levels, zero page or console errors, no emoji', async ({ page }) => {
  test.setTimeout(150000);
  const errs = [];
  page.on('requestfailed', (r) => errs.push('failed ' + r.url()));
  page.on('pageerror', (e) => errs.push('pageerror ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error') errs.push('console ' + m.text()); });
  await page.goto(PAGE);
  await page.click('#startBtn');
  for (let lvl = 0; lvl < 3; lvl++) {
    expect(await page.evaluate(() => RT.state.lvl)).toBe(lvl);
    for (let i = 0; i < 8; i++) {
      await expect(page.locator('#app .opt')).toHaveCount(3);
      if (i === 3) {
        await page.evaluate(() => RT.dbg.wrongForTest());
        await page.locator('#nextBtn').click();
      } else await page.evaluate(() => RT.dbg.solveForTest());
      if (i < 7) await expect.poll(() => page.evaluate(() => RT.state.round), { timeout: 8000 }).toBe(i + 1);
    }
    if (lvl < 2) {
      await page.locator('#nextLevelBtn').click({ timeout: 8000 });
    }
  }
  await expect(page.locator('.cde-end')).toBeVisible({ timeout: 8000 });
  await expect(page.locator('.cde-end [data-kdm-primary]')).toBeVisible();
  const txt = await page.evaluate(() => document.body.innerText);
  expect(txt).not.toMatch(/[\u{1F300}-\u{1FAFF}\u{2B50}\u{2606}\u{2605}]/u);
  expect(errs).toEqual([]);
});

for (const vp of [{ width: 360, height: 640 }, { width: 390, height: 844 }]) {
  test(`phone fit ${vp.width}x${vp.height}: start, play controls and next in view, all >= 44 px, no sideways scroll`, async ({ page }) => {
    await page.setViewportSize(vp);
    await page.goto(PAGE);
    const inView = (sel) => page.evaluate(([s, h, w]) => [...document.querySelectorAll(s)].filter((e) => e.getClientRects().length).map((e) => {
      const r = e.getBoundingClientRect();
      return { s, ok: r.top >= 0 && r.bottom <= h && r.left >= 0 && r.right <= w, big: r.width >= 44 && r.height >= 44, r: [r.left, r.top, r.width, r.height].map(Math.round) };
    }), [sel, vp.height, vp.width]);
    for (const x of await inView('#startBtn')) { expect(x.ok, JSON.stringify(x)).toBe(true); expect(x.big).toBe(true); }
    await page.click('#startBtn');
    await page.waitForTimeout(500);
    const ctl = await inView('#app .opt, #app .hear, #sayBtn, #homePill');
    expect(ctl.length).toBe(8);
    for (const x of ctl) { expect(x.ok, JSON.stringify(x)).toBe(true); expect(x.big, JSON.stringify(x)).toBe(true); }
    await page.evaluate(() => RT.dbg.wrongForTest());
    await page.waitForTimeout(300);
    for (const x of await inView('#nextBtn, #app .row .ghost')) { expect(x.ok, JSON.stringify(x)).toBe(true); expect(x.big).toBe(true); }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollHeight <= window.innerHeight + 1)).toBe(true);
  });
}

for (const lang of ['en', 'he', 'es']) {
  test(`language leak (${lang}): menu and play screen`, async ({ page }) => {
    await page.addInitScript((l) => localStorage.setItem('cde_lang', l), lang);
    await page.goto(PAGE);
    await page.waitForFunction(() => document.readyState === 'complete');
    const check = () => page.evaluate(([lng, heb]) => {
      const out = [], re = new RegExp(heb);
      if (lng !== 'he') {
        const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
        for (let n = w.nextNode(); n; n = w.nextNode()) {
          const t = n.nodeValue.trim(), el = n.parentElement;
          if (!t || !re.test(t) || !el || el.closest('[lang="he"], script, style, [hidden]')) continue;
          if (!el.getClientRects().length) continue;
          out.push('Hebrew: ' + t);
        }
      }
      if (lng !== 'en') {
        const D = window.CDE_STRINGS, en = D.en, cur = D[lng], txt = document.body.innerText;
        const plain = (v) => String(v ?? '').replace(/<[^>]+>/g, '').replace(/\{\w\}/g, '').trim();
        for (const k of Object.keys(en)) {
          const v = plain(en[k]);
          if (v.length >= 6 && plain(cur[k]) !== v && txt.includes(v)) out.push('English: ' + v);
        }
      }
      return out;
    }, [lang, HEB.source]);
    const found = [...await check()];
    await page.click('#startBtn');
    await page.waitForTimeout(700);
    found.push(...await check());
    await page.evaluate(() => RT.dbg.wrongForTest());
    await page.waitForTimeout(300);
    found.push(...await check());
    expect(found).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.getAttribute('data-cde-lang'))).toBe(lang === 'en' ? null : lang);
  });
}

test('contrast: body text is WCAG AA on the darkest and lightest backgrounds of the theme', async ({ page }) => {
  await page.goto(PAGE);
  await page.click('#startBtn');
  await page.evaluate(() => RT.dbg.wrongForTest());
  await page.waitForTimeout(300);
  const fails = await page.evaluate(() => {
    const lum = (c) => { const [r, g, b] = c.match(/[\d.]+/g).slice(0, 3).map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
    const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
    const BG = ['rgb(11,18,48)', 'rgb(30,27,75)', 'rgb(44,40,100)']; // page gradient ends + glass card over it
    const out = [];
    for (const s of ['.hud-level', '.prompt', '.feedback', '.tword', '.hear', '.ghost', '#homePill']) {
      const e = document.querySelector(s); if (!e) { out.push(s + ' missing'); continue; }
      const c = getComputedStyle(e).color;
      for (const b of BG) if (ratio(c, b) < 4.5) out.push(`${s} ${c} on ${b}: ${ratio(c, b).toFixed(2)}`);
    }
    const nx = document.querySelector('#nextBtn'); const r = ratio(getComputedStyle(nx).color, 'rgb(251,191,36)');
    if (r < 4.5) out.push('next button ' + r.toFixed(2));
    return out;
  });
  expect(fails).toEqual([]);
  // the about section on the menu
  await page.goto(PAGE);
  const c = await page.evaluate(() => getComputedStyle(document.querySelector('.about p')).color);
  expect(c).toBe('rgb(199, 210, 254)');
});

test('speech-sync (warm): a word is never still playing when the round changes', async ({ page }) => {
  test.skip(!!process.env.CI, 'speech-sync needs real audio output (CI has none)');
  test.setTimeout(90000);
  await instrumentSpeech(page, { audio: /\/audio\/[a-z0-9-]+\.mp3/, visual: () => document.querySelector('#rtTarget')?.getAttribute('data-word') || '', answerSel: '.opt, #nextBtn' });
  await page.goto(PAGE);
  await page.click('#startBtn');
  for (let i = 0; i < 5; i++) {
    await page.waitForTimeout(1500); // a child listens, then taps
    if (i % 2) {
      await page.evaluate(() => RT.dbg.wrongForTest());
      await page.waitForTimeout(400);
      await page.locator('#nextBtn').click();
    } else await page.evaluate(() => RT.dbg.solveForTest());
    await expect.poll(() => page.evaluate(() => RT.state.round), { timeout: 10000 }).toBe(i + 1);
  }
  await page.waitForTimeout(2000);
  const log = await page.evaluate(() => window.__sync);
  if (process.env.SYNC_DUMP) console.log(JSON.stringify(log.map((x) => [x.e, x.src, Math.round(x.t)])));
  const r = checkSpeech(log);
  expect(r.spoken).toBeGreaterThan(8);
  expect(r.problems).toEqual([]);
});
