// True or False (/games/true-or-false/, wave 2 11-07): word pool + sentence clips, the "a false sentence is really
// false" and 4/4 balance oracles over many dealt levels, nothing marked before the answer, the miss flow (true sentence
// shown), a full run to the end card with zero errors, phone fit + tap size, language leak, contrast and speech sync.
import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { WORDS } from '../src/data/words.js';
import { instrumentSpeech, checkSpeech } from './lib/speech-sync.mjs';
import { cold } from './lib/cold-net.mjs';

const URL = '/games/true-or-false/index.html';
const PUB = path.resolve('public');
const BODY = 'hand foot ear eye nose finger thumb tooth toe knee arm leg head hair face mouth lips teeth heart'.split(' ');

async function open(page) {
  const land = [];
  page.on('request', (r) => { if (r.url().includes('/api/land')) land.push(r.url()); });
  await page.route('**/api/**', (r) => r.fulfill({ status: 204 }));
  await page.goto(URL);
  await page.waitForFunction(() => window.TF && window.CDE_STRINGS && window.cdeSay);
  return land;
}

test('word data: CDE words with a picture, one group each, never a body part; every sentence has its clip', async ({ page }) => {
  await open(page);
  const d = await page.evaluate(() => {
    const W = TF.W, all = Object.values(W.GROUPS).flat(), sentences = [];
    for (const w of all) sentences.push(TF.dbg.isSentence(w));
    for (const k of W.KINDS) for (const w of W.GROUPS[k]) for (const kind of W.KINDS) sentences.push(TF.dbg.kindSentence(w, kind));
    return { all, kinds: W.KINDS, groups: Object.keys(W.GROUPS), similar: W.SIMILAR, clips: sentences.map((s) => [s, TF.dbg.clip(s)]) };
  });
  const byId = Object.fromEntries(WORDS.map((w) => [w.id, w]));
  const bad = [];
  if (new Set(d.all).size !== d.all.length) bad.push('a word in two groups');
  for (const id of d.all) {
    if (!byId[id]) bad.push(`${id}: not in WORDS`);
    if (!fs.existsSync(path.join(PUB, 'images', id + '.webp'))) bad.push(`${id}: no image file`);
    if (BODY.includes(id)) bad.push(`${id}: body part`);
  }
  for (const k of d.kinds) if (!d.groups.includes(k)) bad.push(`kind ${k} has no group`);
  for (const s of d.similar) for (const w of s) if (!d.all.includes(w)) bad.push(`similar: ${w} not in the pool`);
  for (const [s, url] of d.clips) if (!fs.existsSync(path.join(PUB, url))) bad.push(`no clip for "${s}"`);
  expect(bad.slice(0, 20)).toEqual([]);
});

test('oracle: over 3,000 dealt levels — 4 true / 4 false, a false sentence is really false, no picture twice', async ({ page }) => {
  await open(page);
  const r = await page.evaluate(() => {
    const W = TF.W, out = { bad: [], n: 0, longerFalse: 0, pairs: 0 };
    for (let lv = 0; lv < 3; lv++) {
      for (let k = 0; k < 1000; k++) {
        const plan = TF.dbg.plan(lv);
        if (plan.length !== TF.ROUNDS) out.bad.push(`L${lv + 1}: ${plan.length} rounds`);
        if (plan.filter((x) => x.truth).length !== 4) out.bad.push(`L${lv + 1}: ${plan.filter((x) => x.truth).length} true`);
        if (new Set(plan.map((x) => x.word)).size !== plan.length) out.bad.push(`L${lv + 1}: a picture twice`);
        for (const rd of plan) {
          out.n++;
          const g = TF.dbg.groupOf(rd.word);
          if (lv === 1) {
            if (!W.KINDS.includes(g)) out.bad.push(`L2 word ${rd.word} is not a kind word`);
            if (rd.sentence !== TF.dbg.kindSentence(rd.word, rd.said) || rd.right !== TF.dbg.kindSentence(rd.word, g)) out.bad.push(`L2 text ${rd.sentence}`);
            if (rd.truth !== (rd.said === g)) out.bad.push(`L2 truth wrong: ${rd.sentence} (${g})`);
          } else {
            if (rd.sentence !== TF.dbg.isSentence(rd.said) || rd.right !== TF.dbg.isSentence(rd.word)) out.bad.push(`L${lv + 1} text ${rd.sentence}`);
            if (rd.truth !== (rd.said === rd.word)) out.bad.push(`L${lv + 1} truth wrong: ${rd.sentence} / ${rd.word}`);
            if (!rd.truth) {
              const sg = TF.dbg.groupOf(rd.said);
              if (lv === 0 && sg === g) out.bad.push(`L1 false names the same group: ${rd.said} for ${rd.word}`);
              if (lv === 2 && sg !== g) out.bad.push(`L3 false names another group: ${rd.said} for ${rd.word}`);
              if (TF.dbg.similar(rd.word, rd.said)) out.bad.push(`look-alike named: ${rd.said} for ${rd.word}`);
            }
          }
          if (!rd.truth) { out.pairs++; if (rd.sentence.length > rd.right.length) out.longerFalse++; }
        }
      }
    }
    return out;
  });
  expect(r.bad.slice(0, 10)).toEqual([]);
  // false sentences are not systematically longer or shorter than the true one would be
  expect(r.longerFalse / r.pairs).toBeGreaterThan(0.3);
  expect(r.longerFalse / r.pairs).toBeLessThan(0.7);
});

test('nothing marks the answer before the tap (also after a 3 s idle)', async ({ page }) => {
  await open(page);
  await page.click('#startBtn');
  for (let i = 0; i < 4; i++) {
    await page.waitForTimeout(i === 0 ? 3000 : 300);
    const s = await page.evaluate(() => {
      const opts = [...document.querySelectorAll('#app .tf .opt')];
      const sty = opts.map((o) => { const cs = getComputedStyle(o); return [o.className.replace(/\b(true|false)\b/, ''), cs.borderColor, cs.backgroundColor, cs.opacity, cs.boxShadow].join(); });
      return { n: opts.length, sty: new Set(sty).size, fb: document.querySelector('.feedback').textContent, next: !!document.getElementById('nextBtn'), struck: !!document.querySelector('.sentence.struck') };
    });
    expect(s).toEqual({ n: 2, sty: 1, fb: '', next: false, struck: false });
    await page.evaluate(() => TF.dbg.solveForTest());
    await page.waitForFunction((k) => TF.S.round !== k, i, { timeout: 8000 });
  }
});

test('a miss on a false sentence: False turns green, the true sentence is shown, Next moves on', async ({ page }) => {
  await open(page);
  await page.click('#startBtn');
  // play until a false round comes up (4 of the 8 are false)
  for (let i = 0; i < 8; i++) {
    if (!(await page.evaluate(() => TF.dbg.round.truth))) break;
    await page.evaluate(() => TF.dbg.solveForTest());
    await page.waitForFunction((k) => TF.S.round === k, i + 1, { timeout: 8000 });
  }
  const rd = await page.evaluate(() => TF.dbg.round);
  expect(rd.truth).toBe(false);
  await page.evaluate(() => TF.dbg.missForTest());
  await expect(page.locator('#app .tf .opt.false')).toHaveClass(/ok/);
  await expect(page.locator('#app .tf .opt.true')).toHaveClass(/no/);
  await expect(page.locator('.feedback .reveal')).toHaveText(rd.right);
  await expect(page.locator('.sentence')).toHaveClass(/struck/);
  const at = await page.evaluate(() => TF.S.round);
  await page.waitForTimeout(1800);
  expect(await page.evaluate(() => TF.S.round)).toBe(at);   // a miss never auto-advances
  await page.click('#nextBtn');
  await page.waitForFunction((k) => TF.S.round === k + 1, at, { timeout: 6000 });
});

test('full run: 3 levels to the end card, zero errors, no /api/land under automation', async ({ page }) => {
  test.setTimeout(180000);
  const errs = [];
  page.on('pageerror', (e) => errs.push('pageerror ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error') errs.push('console ' + m.text()); });
  const land = await open(page);
  await page.click('#startBtn');
  for (let lv = 0; lv < 3; lv++) {
    for (let i = 0; i < 8; i++) {
      await page.waitForFunction(() => document.querySelectorAll('#app .tf .opt').length === 2 && !TF.S.answered, null, { timeout: 8000 });
      expect(await page.evaluate(() => TF.S.lvl)).toBe(lv);
      expect(await page.evaluate(() => TF.dbg.solveForTest())).toBe(true);
      await expect(page.locator('#app .tf .opt.ok')).toHaveCount(1);
      if (i < 7) await page.waitForFunction((k) => TF.S.round === k, i + 1, { timeout: 9000 });
    }
    if (lv < 2) {
      await expect(page.locator('#app .card h2')).toHaveText('Level done!', { timeout: 9000 });
      await expect(page.locator('#app .card .score')).toHaveText('8 / 8');
      await page.click('#nextLevelBtn');
    }
  }
  await expect(page.locator('#app .card .cde-end')).toBeVisible({ timeout: 9000 });
  await expect(page.locator('#app .card [data-kdm-primary]')).toBeVisible();
  expect(errs).toEqual([]);
  expect(land).toEqual([]);
});

for (const vp of [{ width: 360, height: 640 }, { width: 390, height: 844 }]) {
  test(`phone fit ${vp.width}x${vp.height}: picture, sentence, speaker, True/False and Next on screen, every control ≥ 44 px`, async ({ page }) => {
    await page.setViewportSize(vp);
    await open(page);
    const sb = await page.locator('#startBtn').boundingBox();
    expect(sb.y + sb.height).toBeLessThanOrEqual(vp.height);
    await page.click('#startBtn');
    for (let lv = 0; lv < 3; lv++) {
      if (lv) await page.evaluate((l) => TF.dbg.startLevel(l), lv);
      await page.waitForTimeout(400);
      // the longest sentence of the level, missed: the tallest screen (struck sentence + reveal + Next)
      await page.evaluate(() => {
        const rs = TF.S.rounds, len = (r) => r.sentence.length + r.right.length;
        const i = rs.reduce((b, r, k) => (len(r) > len(rs[b]) ? k : b), 0);
        [rs[0], rs[i]] = [rs[i], rs[0]];
        TF.S.round = 0; TF.dbg.redraw();
      });
      await page.evaluate(() => TF.dbg.missForTest());
      await page.waitForTimeout(300);
      const r = await page.evaluate(() => {
        const out = [];
        for (const e of document.querySelectorAll('#app .tf .opt, #app .say, #nextBtn, #app .pic img')) {
          const b = e.getBoundingClientRect();
          out.push({ c: e.className || e.id || e.tagName, top: b.top, bottom: b.bottom, left: b.left, right: b.right, w: b.width, h: b.height, img: e.tagName === 'IMG' });
        }
        return { out, sw: document.documentElement.scrollWidth, sy: scrollY, reveal: document.querySelector('.feedback').getBoundingClientRect().bottom, lvl: TF.S.lvl };
      });
      expect(r.out.length).toBe(5);
      for (const b of r.out) {
        expect(b.top, `L${r.lvl + 1} ${b.c}`).toBeGreaterThanOrEqual(0);
        expect(b.bottom, `L${r.lvl + 1} ${b.c}`).toBeLessThanOrEqual(vp.height);
        expect(b.left).toBeGreaterThanOrEqual(0); expect(b.right).toBeLessThanOrEqual(vp.width);
        if (!b.img) expect(Math.min(b.w, b.h), b.c).toBeGreaterThanOrEqual(44);
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
      if (lang !== 'en') {
        for (const [k, v] of Object.entries(en)) if (plain(v).length >= 6 && plain(cur[k]) !== plain(v) && txt.includes(plain(v))) found.push('en: ' + plain(v));
        // the True / False buttons are interface, not English content
        for (const b of document.querySelectorAll('#app .tf .opt')) if (/^(True|False)$/.test(b.textContent.trim())) found.push('en button: ' + b.textContent.trim());
      }
      return found;
    }, { lang, heb: HEB.source });
    expect(await check()).toEqual([]);
    await page.click('#startBtn');
    await page.waitForTimeout(300);
    expect(await check()).toEqual([]);
    await page.evaluate(() => TF.dbg.missForTest());
    await page.waitForTimeout(200);
    expect(await check()).toEqual([]);
    if (lang === 'he') await expect(page.locator('html')).toHaveAttribute('data-cde-lang', 'he');
  });
}

test('contrast: play-screen text is WCAG AA on the dark theme', async ({ page }) => {
  await open(page);
  await page.click('#startBtn');
  await page.evaluate(() => TF.dbg.missForTest());
  const bad = await page.evaluate(() => {
    const rgb = (s) => s.match(/[\d.]+/g).slice(0, 3).map(Number);
    const lum = ([r, g, b]) => { const f = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
    const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
    const BG = [30, 27, 75];
    const out = [];
    for (const sel of ['.hud-level', '.hud-label', '.stext', '.tf .opt', '.feedback', '.feedback .reveal', '.tip']) {
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

for (const mode of ['warm', 'cold']) test(`speech sync (${mode}): a sentence never plays over the next round`, async ({ page }) => {
  test.skip(!!process.env.CI, 'speech-sync needs real audio output (CI has none)');
  test.setTimeout(90000);
  await instrumentSpeech(page, { audio: /\/audio\/[a-z0-9-]+\.mp3/, visual: () => (window.TF && TF.dbg.roundKey) || '', answerSel: '#app .tf .opt' });
  await open(page);
  if (mode === 'cold') await cold(page);
  await page.click('#startBtn');
  for (let i = 0; i < 4; i++) {
    await page.waitForTimeout(700);
    await page.locator('#sayBtn').click();
    await page.waitForTimeout(500);
    if (i === 1) { await page.evaluate(() => TF.dbg.missForTest()); await page.waitForTimeout(200); await page.click('#nextBtn'); }
    else await page.evaluate(() => TF.dbg.solveForTest());
    await page.waitForFunction((k) => TF.S.round === k, i + 1, { timeout: 12000 });
  }
  await page.waitForTimeout(3000);
  const log = await page.evaluate(() => window.__sync);
  const r = checkSpeech(log);
  expect(r.spoken).toBeGreaterThan(4);
  expect(r.problems).toEqual([]);
});
