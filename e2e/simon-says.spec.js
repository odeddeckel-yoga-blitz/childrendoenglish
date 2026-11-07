// Simon Says (/games/simon-says/, wave 2 11-08): pictures + clips, trap / order / look-alike / position oracles
// over many dealt levels, nothing marked before the answer, the miss flow, a full run to the end card with zero errors,
// phone fit + tap size, language leak, contrast and speech sync.
import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { instrumentSpeech, checkSpeech } from './lib/speech-sync.mjs';

const URL = '/games/simon-says/index.html';
const PUB = path.resolve('public');

async function open(page) {
  const land = [];
  page.on('request', (r) => { if (r.url().includes('/api/land')) land.push(r.url()); });
  await page.route('**/api/**', (r) => r.fulfill({ status: 204 }));
  await page.goto(URL);
  await page.waitForFunction(() => window.SS && window.CDE_STRINGS && window.cdeSay);
  return land;
}

test('data: every action has its Fluent picture; every instruction a level can deal has its clip', async ({ page }) => {
  await open(page);
  const d = await page.evaluate(() => {
    const D = SS.D, A = D.ACTIONS, t = [];
    for (const k of Object.keys(A)) t.push(SS.dbg.text([k], false), SS.dbg.text([k], true));
    for (const p of D.SAYS_PAIRS) t.push(SS.dbg.text(p, false));
    for (const p of D.TRAP_PAIRS) t.push(SS.dbg.text(p, true));
    return { ids: Object.keys(A), clips: t.map((x) => [x, SS.dbg.slug(x)]), pairs: D.SAYS_PAIRS.concat(D.TRAP_PAIRS) };
  });
  const bad = [];
  for (const k of d.ids) if (!fs.existsSync(path.join(PUB, 'games', 'simon-says', 'img', k + '.webp'))) bad.push(`${k}: no picture`);
  for (const [t, slug] of d.clips) if (!fs.existsSync(path.join(PUB, 'games', 'simon-says', 'audio', slug + '.mp3'))) bad.push(`no clip for "${t}"`);
  for (const [a, b] of d.pairs) if (await page.evaluate(([x, y]) => SS.dbg.similar(x, y), [a, b])) bad.push(`look-alike pair ${a}/${b}`);
  expect(bad).toEqual([]);
  expect(d.ids.length).toBeGreaterThanOrEqual(12);
});

test('oracle: over 3,000 dealt levels — trap counts, named actions shown, no look-alikes, uniform position', async ({ page }) => {
  await open(page);
  const r = await page.evaluate(() => {
    const out = { bad: [], pos: [{}, {}, {}], n: [0, 0, 0] };
    for (let lv = 0; lv < 3; lv++) {
      const L = SS.LEVELS[lv];
      for (let k = 0; k < 1000; k++) {
        const plan = SS.dbg.plan(lv);
        if (plan.length !== SS.ROUNDS) out.bad.push(`L${lv + 1}: ${plan.length} rounds`);
        if (plan.filter((x) => x.trap).length !== L.traps) out.bad.push(`L${lv + 1}: ${plan.filter((x) => x.trap).length} traps`);
        if (lv < 2 && new Set(plan.map((x) => x.seq[0])).size !== plan.length) out.bad.push(`L${lv + 1}: an action twice`);
        for (const rd of plan) {
          out.n[lv]++;
          if (rd.opts.length !== L.opts || new Set(rd.opts).size !== L.opts) out.bad.push(`L${lv + 1} options ${rd.opts}`);
          if (rd.seq.length !== (lv === 2 ? 2 : 1)) out.bad.push(`L${lv + 1} seq ${rd.seq}`);
          for (const s of rd.seq) if (!rd.opts.includes(s)) out.bad.push(`named action ${s} not shown`);
          for (let i = 0; i < rd.opts.length; i++) for (let j = i + 1; j < rd.opts.length; j++) if (SS.dbg.similar(rd.opts[i], rd.opts[j])) out.bad.push(`look-alikes ${rd.opts[i]}/${rd.opts[j]}`);
          if (rd.text !== SS.dbg.text(rd.seq, rd.trap)) out.bad.push(`text ${rd.text}`);
          if (rd.trap === rd.text.startsWith('Simon says')) out.bad.push(`trap/text mismatch ${rd.text}`);
          const i = rd.opts.indexOf(rd.seq[0]); out.pos[lv][i] = (out.pos[lv][i] || 0) + 1;
        }
      }
    }
    return out;
  });
  expect(r.bad.slice(0, 10)).toEqual([]);
  for (let lv = 0; lv < 3; lv++) {
    const k = lv === 2 ? 4 : 3;
    for (let i = 0; i < k; i++) {
      expect(r.pos[lv][i] / r.n[lv]).toBeGreaterThan(1 / k - 0.04);
      expect(r.pos[lv][i] / r.n[lv]).toBeLessThan(1 / k + 0.04);
    }
  }
});

test('a trap: tapping the named action is a miss; Stay still turns green', async ({ page }) => {
  await open(page);
  await page.click('#startBtn');
  await page.evaluate(() => SS.dbg.startLevel(1));
  await page.evaluate(() => { const rs = SS.S.rounds, i = rs.findIndex((x) => x.trap); [rs[0], rs[i]] = [rs[i], rs[0]]; SS.dbg.redraw(); });
  const rd = await page.evaluate(() => SS.dbg.round);
  expect(rd.trap).toBe(true);
  await expect(page.locator('#app .stext')).toHaveText(rd.text);
  await page.locator(`#app .opt[data-act="${rd.seq[0]}"]`).click();
  await expect(page.locator('#stillBtn')).toHaveClass(/ok/);
  await expect(page.locator(`#app .opt[data-act="${rd.seq[0]}"]`)).toHaveClass(/no/);
  await expect(page.locator('#nextBtn')).toBeVisible();
});

test('level 3: two taps in order win; the right pair in the wrong order is a miss', async ({ page }) => {
  await open(page);
  await page.click('#startBtn');
  await page.evaluate(() => SS.dbg.startLevel(2));
  await page.evaluate(() => { const rs = SS.S.rounds, i = rs.findIndex((x) => !x.trap); [rs[0], rs[i]] = [rs[i], rs[0]]; SS.dbg.redraw(); });
  let rd = await page.evaluate(() => SS.dbg.round);
  await page.locator(`#app .opt[data-act="${rd.seq[0]}"]`).click();
  expect(await page.evaluate(() => SS.S.answered)).toBe(false);
  await expect(page.locator(`#app .opt[data-act="${rd.seq[0]}"] .step`)).toHaveText('1');
  await page.locator(`#app .opt[data-act="${rd.seq[1]}"]`).click();
  expect(await page.evaluate(() => SS.S.score)).toBe(1);
  await page.waitForFunction(() => SS.S.round === 1, null, { timeout: 8000 });
  await page.evaluate(() => { const rs = SS.S.rounds; const i = rs.findIndex((x, k) => k >= 1 && !x.trap); [rs[1], rs[i]] = [rs[i], rs[1]]; SS.dbg.redraw(); });
  rd = await page.evaluate(() => SS.dbg.round);
  await page.locator(`#app .opt[data-act="${rd.seq[1]}"]`).click();
  expect(await page.evaluate(() => SS.S.answered)).toBe(true);
  await expect(page.locator('#nextBtn')).toBeVisible();
});

test('nothing marks the answer before the tap (also after a 3 s idle)', async ({ page }) => {
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
    await page.evaluate(() => SS.dbg.solveForTest());
    await page.waitForFunction((k) => SS.S.round !== k, i, { timeout: 9000 });
  }
});

test('a miss: the right picture turns green, Next moves on', async ({ page }) => {
  await open(page);
  await page.click('#startBtn');
  const rd = await page.evaluate(() => SS.dbg.round);
  await page.evaluate(() => SS.dbg.missForTest());
  await expect(page.locator(`#app .opt[data-act="${rd.seq[0]}"]`)).toHaveClass(/ok/);
  await expect(page.locator('#app .opt.no')).toHaveCount(1);
  await page.waitForTimeout(1500);
  expect(await page.evaluate(() => SS.S.round)).toBe(0);   // a miss never auto-advances
  await page.click('#nextBtn');
  await page.waitForFunction(() => SS.S.round === 1, null, { timeout: 6000 });
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
      await page.waitForFunction(() => document.querySelectorAll('#app .opt').length >= 3 && !SS.S.answered, null, { timeout: 8000 });
      expect(await page.evaluate(() => SS.S.lvl)).toBe(lv);
      expect(await page.evaluate(() => SS.dbg.solveForTest())).toBe(true);
      await expect(page.locator('#app .ok')).not.toHaveCount(0);
      if (i < 7) await page.waitForFunction((k) => SS.S.round === k, i + 1, { timeout: 8000 });
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
      if (lv) await page.evaluate((l) => SS.dbg.startLevel(l), lv);   // each level has its own layout
      await page.waitForTimeout(400);
      await page.evaluate(() => SS.dbg.missForTest());   // the miss screen is the tallest (reveal + Next)
      await page.waitForTimeout(300);
      const r = await page.evaluate(() => {
        const out = [];
        for (const e of document.querySelectorAll('#app .opt, #app .say, #stillBtn, #nextBtn')) {
          const b = e.getBoundingClientRect();
          out.push({ c: e.className || e.id, top: b.top, bottom: b.bottom, left: b.left, right: b.right, w: b.width, h: b.height });
        }
        return { out, sw: document.documentElement.scrollWidth, sy: scrollY, reveal: document.querySelector('.feedback').getBoundingClientRect().bottom, lvl: SS.S.lvl };
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
    await page.evaluate(() => SS.dbg.missForTest());
    await page.waitForTimeout(200);
    expect(await check()).toEqual([]);
    if (lang === 'he') await expect(page.locator('html')).toHaveAttribute('data-cde-lang', 'he');
  });
}

test('contrast: play-screen text is WCAG AA on the dark theme', async ({ page }) => {
  await open(page);
  await page.click('#startBtn');
  await page.evaluate(() => SS.dbg.missForTest());
  const bad = await page.evaluate(() => {
    const rgb = (s) => s.match(/[\d.]+/g).slice(0, 3).map(Number);
    const lum = ([r, g, b]) => { const f = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
    const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
    const BG = [30, 27, 75];
    const out = [];
    for (const sel of ['.hud-level', '.hud-label', '.stext', '.opt .word', '.feedback', '.tip']) {
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
  await instrumentSpeech(page, { audio: /\/audio\/[a-z0-9-]+\.mp3/, visual: () => (window.SS && SS.dbg.roundKey) || '', answerSel: '#app .opt' });
  await open(page);
  await page.click('#startBtn');
  for (let i = 0; i < 4; i++) {
    await page.waitForTimeout(700);
    await page.locator('#sayBtn').click();
    await page.waitForTimeout(500);
    if (i === 1) { await page.evaluate(() => SS.dbg.missForTest()); await page.waitForTimeout(200); await page.click('#nextBtn'); }
    else await page.evaluate(() => SS.dbg.solveForTest());
    await page.waitForFunction((k) => SS.S.round === k, i + 1, { timeout: 10000 });
  }
  await page.waitForTimeout(2000);
  const log = await page.evaluate(() => window.__sync);
  const r = checkSpeech(log);
  expect(r.spoken).toBeGreaterThan(4);
  expect(r.problems).toEqual([]);
});
