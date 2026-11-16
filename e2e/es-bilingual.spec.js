import { test, expect } from '@playwright/test';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { WORDS } from '../src/data/words.js';
import { PAGES_HOLD } from '../src/data/pagesHold.js';
import ES from '../src/data/word-glosses-es.js';

// Step 4, mockup b (owner-approved 11-08): the Spanish bilingual category page
// /vocabulary/<cat>/spanish/, read from dist/ (CDE_DIST overrides it, e.g. to replay on an older build).
//  1. a "Jugar con …" play button right under the H1, above the fold on a 360×800 phone, into that
//     topic's quiz with a Spanish UI (it was only at the page bottom: y 18,456 on a phone);
//  2. the language switch names the languages (English · עברית · Español), not "EN" / "עב";
//  3. "voz generada por computadora" beside the first speaker (audio is Piper TTS);
//  4. the count is real: every live word in the category (PAGES_HOLD out), each with a Spanish gloss;
//  5. one title per page, the same in <title>, og and twitter (the 11-14 holdout ended; counts follow the live words).
const DIST = process.env.CDE_DIST || join(process.cwd(), 'dist');
const fileFor = (p) => join(DIST, p.endsWith('/') ? p + 'index.html' : p);
const CATS = ['animals', 'food', 'home', 'transport', 'nature', 'colors', 'numbers', 'clothing', 'school', 'sports', 'feelings', 'everyday', 'toys'];
const liveIn = (c) => WORDS.filter((w) => w.category === c && !PAGES_HOLD.has(w.id));

test.use({ viewport: { width: 360, height: 800 } });

test.beforeEach(async ({ page }) => {
  test.skip(!existsSync(fileFor('/vocabulary/animals/spanish/')), 'run npm run build first');
  await page.route((url) => /^\/vocabulary\//.test(url.pathname), (route) => {
    const file = fileFor(new URL(route.request().url()).pathname);
    if (!existsSync(file)) return route.fulfill({ status: 404, body: 'not found' });
    route.fulfill({ status: 200, contentType: 'text/html', body: readFileSync(file) });
  });
  await page.route('**/api/land**', (route) => route.fulfill({ status: 204, body: '' }));
});

test('play button: under the H1, above the fold at 360×800, into this topic in Spanish', async ({ page }) => {
  await page.goto('/vocabulary/animals/spanish/');
  const play = page.locator('a.es-play');
  await expect(play).toHaveText(/^\s*Jugar con los animales\s*$/);
  const box = await play.boundingBox();
  const h1 = await page.locator('h1').boundingBox();
  expect(box.y).toBeGreaterThan(h1.y);
  expect(box.y + box.height).toBeLessThanOrEqual(800);
  expect(box.y).toBeLessThan(240); // mockup: y ≈ 190 (built: 187)
  expect(box.height).toBeGreaterThanOrEqual(44);
  // the bottom link stays
  await expect(page.locator('.cta a[href^="/?lang=es"]')).toHaveCount(1);
  for (const c of CATS) {
    const html = readFileSync(fileFor(`/vocabulary/${c}/spanish/`), 'utf8');
    const href = (html.match(/<a class="es-play" href="([^"]+)"/) || [])[1] || '';
    const u = new URL(href.replace(/&amp;/g, '&'), 'https://x');
    expect(u.pathname, c).toBe('/new-player');
    expect(u.searchParams.get('lang'), c).toBe('es');
    expect(u.searchParams.get('topic'), c).toBe(c);
  }
});

test('language switch shows language names, not codes', async ({ page }) => {
  await page.goto('/vocabulary/food/spanish/');
  const texts = (await page.locator('nav.site-head a').allInnerTexts()).map((t) => t.trim());
  expect(texts.filter((t) => /^(EN|ES|HE|AR|עב)$/i.test(t))).toEqual([]);
  for (const name of ['English', 'עברית', 'Español']) expect(texts).toContain(name);
  await expect(page.locator('nav.site-head a[aria-current="true"]')).toHaveText('Español');
});

test('the computer-voice line sits beside the first speaker button', async ({ page }) => {
  await page.goto('/vocabulary/animals/spanish/');
  const line = page.locator('.tts-line');
  await expect(line).toContainText('voz generada por computadora');
  await expect(line).toBeVisible();
  const say = page.locator('.bi-say').first();
  await expect(say).toHaveAttribute('data-say', /^\/audio\/.+\.mp3$/);
  const a = await line.boundingBox(), b = await say.boundingBox();
  expect(b.y - (a.y + a.height)).toBeLessThan(200); // the line is right above the first row
});

test('the count is real: every live word, each with a Spanish gloss', () => {
  for (const c of CATS) {
    const html = readFileSync(fileFor(`/vocabulary/${c}/spanish/`), 'utf8');
    const live = liveIn(c);
    const rows = [...html.matchAll(/<div class="bi-es-word">([^<]*)<\/div>/g)].map((m) => m[1].trim());
    expect(rows.length, c).toBe(live.length);
    expect(rows.filter((r) => !r), c).toEqual([]);
    expect(html, c).toContain(`&mdash; ${live.length} palabras bilingües`);
    for (const w of live) expect(ES[w.id], w.id).toBeTruthy();
  }
});

test('titles: every /spanish/ page has one title, the same in <title>, og and twitter (the step-1 snapshot retired 11-16: the 11-14 holdout ended and the counts in the titles follow the live words)', () => {
  for (const c of CATS) {
    const h = readFileSync(fileFor(`/vocabulary/${c}/spanish/`), 'utf8');
    const g = (re) => (h.match(re) || [])[1];
    const title = g(/<title>([^<]*)<\/title>/);
    expect(title, c).toBeTruthy();
    expect([g(/<meta property="og:title" content="([^"]*)"/), g(/<meta name="twitter:title" content="([^"]*)"/)], c).toEqual([title, title]);
  }
});
