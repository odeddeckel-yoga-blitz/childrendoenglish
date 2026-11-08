import { test, expect } from '@playwright/test';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { worksheetData, WORKSHEETS_HOLD } from '../scripts/build-worksheets.mjs';

// Printable worksheets from the wave-2 games (scripts/build-worksheets.mjs, 11-08): every picture loads, the answer key
// printed with each sheet matches its exercise and the game's own data, a phone shows it without sideways scroll, print
// hides the page chrome and puts the key on its own page, and while HELD they stay noindex and unlinked.
// Built into dist/ by `npm run build` (vite dev doesn't serve them): served from dist/, like e2e/seo-flows.spec.js.
const DIST = join(process.cwd(), 'dist');
const STATIC = /^\/printable-worksheets\//;
const PAGES = ['/printable-worksheets/', '/printable-worksheets/opposites/', '/printable-worksheets/feelings/', '/printable-worksheets/action-verbs/'];
const D = worksheetData(join(process.cwd(), 'public'));

test.beforeEach(async ({ page }) => {
  test.skip(!existsSync(join(DIST, 'printable-worksheets', 'index.html')), 'run npm run build first');
  await page.route((url) => STATIC.test(url.pathname), (route) => {
    const p = new URL(route.request().url()).pathname;
    const file = join(DIST, p.endsWith('/') ? p + 'index.html' : p);
    if (!existsSync(file)) return route.fulfill({ status: 404, body: 'not found' });
    route.fulfill({ status: 200, contentType: 'text/html', body: readFileSync(file) });
  });
  await page.route('**/api/land**', (route) => route.fulfill({ status: 204, body: '' }));
});

for (const path of PAGES) {
  test(`${path}: renders, every picture loads, no sideways scroll at 390 px`, async ({ page }) => {
    const errs = [];
    page.on('pageerror', (e) => errs.push(e.message));
    page.on('requestfailed', (r) => errs.push('failed ' + r.url()));
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(path);
    await expect(page.locator('h1')).toBeVisible();
    const imgs = page.locator('main img');
    expect(await imgs.count()).toBeGreaterThan(2);
    await page.evaluate(() => Promise.all([...document.images].map((i) => (i.complete ? 0 : new Promise((r) => { i.onload = i.onerror = r; })))));
    const broken = await page.evaluate(() => [...document.querySelectorAll('main img')].filter((i) => !i.naturalWidth).map((i) => i.getAttribute('src')));
    expect(broken).toEqual([]);
    expect(await page.evaluate(() => document.scrollingElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
    if (WORKSHEETS_HOLD) await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
    expect(errs).toEqual([]);
  });
}

test('opposites: each numbered word has exactly one opposite, and the key names it', async ({ page }) => {
  await page.goto('/printable-worksheets/opposites/');
  const left = await page.locator('.col.l .item').evaluateAll((els) => els.map((e) => e.dataset.word));
  const right = await page.locator('.col.r .item').evaluateAll((els) => els.map((e) => [e.dataset.letter, e.dataset.word]));
  const key = await page.locator('#key li').evaluateAll((els) => els.map((e) => [+e.dataset.n, e.dataset.letter]));
  expect(left).toEqual(D.opposites.left);
  expect(new Set(right.map((r) => r[1])).size).toBe(right.length);
  const src = readFileSync(join(process.cwd(), 'public/games/opposites/game.js'), 'utf-8');
  for (const [n, letter] of key) {
    const w = left[n - 1], o = right.find((r) => r[0] === letter)[1];
    expect(src, `${w} ↔ ${o}`).toMatch(new RegExp(`\\['${w}','${o}'\\]`));
  }
  // no word sits straight across from its own opposite
  right.forEach((r, i) => expect(D.opposites.key[i].letter).not.toBe(r[0]));
});

test('feelings: one marked face per word, story letters point at the right face, no face fits two stories', async ({ page }) => {
  await page.goto('/printable-worksheets/feelings/');
  const rows = await page.locator('.row3').evaluateAll((els) => els.map((e) => ({ word: e.dataset.word, answer: +e.dataset.answer, faces: [...e.querySelectorAll('img')].map((i) => i.getAttribute('src').match(/img\/(\w+)\.webp/)[1]) })));
  expect(rows.length).toBe(5);
  for (const r of rows) { expect(r.faces.length).toBe(3); expect(r.faces[r.answer]).toBe(r.word); expect(r.faces.filter((f) => f === r.word).length).toBe(1); }
  const faces = Object.fromEntries(await page.locator('.faces figure').evaluateAll((els) => els.map((e) => [e.dataset.letter, e.dataset.feel])));
  const key = await page.locator('#key ol').nth(1).locator('li').evaluateAll((els) => els.map((e) => [+e.dataset.n, e.dataset.letter]));
  const stories = D.feelings.stories;
  expect(key.length).toBe(stories.length);
  for (const [n, letter] of key) expect(faces[letter]).toBe(stories[n - 1].feel);
  const feel = { window: {} };
  (await import('node:vm')).runInNewContext(readFileSync(join(process.cwd(), 'public/games/feelings/data.js'), 'utf-8'), feel);
  const also = Object.fromEntries(feel.window.FEEL_DATA.SITUATIONS.map((s) => [s.feel, s.also]));
  for (const s of stories) for (const f of Object.values(faces)) if (f !== s.feel) expect(also[s.feel], `${s.feel} vs ${f}`).not.toContain(f);
});

test('action verbs: every picture has one phrase, the key matches, no look-alike actions on one sheet', async ({ page }) => {
  await page.goto('/printable-worksheets/action-verbs/');
  const pics = await page.locator('.pic').evaluateAll((els) => els.map((e) => e.dataset.id));
  const phrases = Object.fromEntries(await page.locator('.phrases div').evaluateAll((els) => els.map((e) => [e.dataset.letter, e.dataset.id])));
  const key = await page.locator('#key li').evaluateAll((els) => els.map((e) => [+e.dataset.n, e.dataset.letter]));
  expect(key.length).toBe(pics.length);
  for (const [n, letter] of key) expect(phrases[letter]).toBe(pics[n - 1]);
  for (const [a, b] of [['run', 'walk'], ['laugh', 'cry'], ['yawn', 'sleep']]) expect(pics.includes(a) && pics.includes(b)).toBe(false);
});

test('print: chrome hidden, the sheet shown, the answer key starts a new page', async ({ page }) => {
  await page.goto('/printable-worksheets/feelings/');
  await page.emulateMedia({ media: 'print' });
  for (const sel of ['.header', '.breadcrumb', '.print-btn', '.play-online', 'footer']) await expect(page.locator(sel).first()).toBeHidden();
  await expect(page.locator('#sheet')).toBeVisible();
  const brk = await page.locator('#key').evaluate((e) => { const s = getComputedStyle(e); return s.breakBefore + '|' + s.pageBreakBefore; });
  expect(brk).toMatch(/page|always/);
  await page.emulateMedia({ media: 'screen' });
  await page.evaluate(() => { window.__prints = 0; window.print = () => { window.__prints++; }; });
  await page.locator('[data-print]').click();
  await expect.poll(() => page.evaluate(() => window.__prints)).toBe(1);
});

test('held: no built page outside /printable-worksheets/ links to it, and the sitemap leaves it out', async () => {
  test.skip(!WORKSHEETS_HOLD, 'released');
  expect(readFileSync(join(DIST, 'sitemap.xml'), 'utf-8')).not.toContain('printable-worksheets');
  const { execFileSync } = await import('node:child_process');
  let hits = '';
  try { hits = execFileSync('grep', ['-rl', '--include=*.html', 'printable-worksheets', DIST], { encoding: 'utf-8' }); } catch { /* grep exit 1 = none */ }
  expect(hits.split('\n').filter((f) => f && !f.includes('/printable-worksheets/'))).toEqual([]);
});
