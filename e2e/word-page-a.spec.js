// Word page Option A (step 4, mockup a "cat" / "nervous") on EVERY word page (owner 11-16 dropped the A/B; the split
// code in src/data/wordPageVariant.js stays behind WORD_PAGE_ROLLOUT). Runs on the BUILT pages in dist/ (served through a
// route like page-depth.spec.js; run `npm run build` first). Checks, per the mockup notes: one audio control labelled
// "computer voice", quiz + example + CTA above the fold on a phone (360×800) and a Chromebook (1366×768), Hebrew and
// Spanish glosses labelled by language, a picture credit that never calls a drawing a photo, a one-style quiz round,
// the CTA's live category count, the beacon key carrying the arm — and the old control page (cat) now on Option A.
import { test, expect } from '@playwright/test';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { WORDS } from '../src/data/words.js';
import { PAGES_HOLD } from '../src/data/pagesHold.js';
import { DRAWN } from '../src/data/imageStyle.js';
import { wordPageVariant, wordPageLayout, WORD_PAGE_ROLLOUT } from '../src/data/wordPageVariant.js';

const DIST = join(process.cwd(), 'dist');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript' };
const live = (cat) => WORDS.filter((w) => w.category === cat && !PAGES_HOLD.has(w.id)).length;

test.skip(({ browserName, isMobile }) => browserName !== 'chromium' || isMobile, 'viewports are set per test');
test.beforeEach(() => {
  test.skip(!existsSync(join(DIST, 'vocabulary', 'feelings', 'nervous', 'index.html')), 'run npm run build first');
});

async function serve(page) {
  const evs = [];
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => false });
    localStorage.setItem('childrendoenglish-analytics-consent', 'declined');
  });
  // the page scripts come from this tree's dist/ too: a vite reused on :5199 may belong to another checkout
  await page.route((url) => /^\/(vocabulary\/|land-beacon\.js$|vocab-quiz\.js$)/.test(url.pathname), (route) => {
    const p = new URL(route.request().url()).pathname;
    const file = join(DIST, p.endsWith('/') ? p + 'index.html' : p);
    if (!existsSync(file)) return route.fulfill({ status: 404, body: 'not found' });
    route.fulfill({ status: 200, contentType: TYPES[file.slice(file.lastIndexOf('.'))] || 'application/octet-stream', body: readFileSync(file) });
  });
  await page.route('**/api/land**', async (route) => {
    try { for (const x of JSON.parse(route.request().postData() || '{}').batch || []) evs.push(`${x.e}:${x.i}`); } catch { /* not JSON */ }
    await route.fulfill({ status: 204 });
  });
  await page.route('**/_vercel/**', (r) => r.fulfill({ status: 204, body: '' }));
  return evs;
}
const bottom = (page, sel) => page.locator(sel).first().evaluate((e) => e.getBoundingClientRect().bottom + window.scrollY);

// The mockup's two words (emoji + photo) and the A page with the longest definition + example (worst case for the fold).
const A_LONGEST = WORDS.filter((w) => !PAGES_HOLD.has(w.id) && wordPageVariant(w.id) === 'a')
  .sort((x, y) => (y.definition.length + y.exampleSentence.length) - (x.definition.length + x.exampleSentence.length))[0];
const A_PAGES = [
  { path: '/vocabulary/feelings/nervous/', cat: 'feelings', noun: 'feelings', short: 'Feelings', drawn: true, es: 'nervioso' },
  { path: '/vocabulary/animals/elephant/', cat: 'animals', noun: 'animal', short: 'Animals', drawn: false, es: 'elefante' },
  { path: `/vocabulary/${A_LONGEST.category}/${A_LONGEST.id}/`, cat: A_LONGEST.category },
];

test('Option A is on every word page (owner 11-16: no A/B), whatever the old arm', () => {
  expect(WORD_PAGE_ROLLOUT.arm).toBe('a');
  for (const id of ['nervous', 'elephant', 'cat']) expect(wordPageLayout(id)).toBe('a');
  expect(wordPageVariant('cat')).toBe('b'); // old control arm: proves the rollout, not the hash, decides
});

for (const pg of A_PAGES) {
  for (const [w, h] of [[360, 800], [1366, 768]]) {
    test(`Option A ${pg.path} at ${w}×${h}: quiz, example and CTA above the fold, no sideways scroll`, async ({ page }) => {
      await page.setViewportSize({ width: w, height: h });
      await serve(page);
      await page.goto(pg.path);
      await expect(page.locator('body')).toHaveAttribute('data-wv', 'a');
      for (const sel of ['.mini-quiz', '.wa-ex', '.wa-cta a']) expect(await bottom(page, sel), sel).toBeLessThanOrEqual(h);
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(w);
    });
  }
}

for (const pg of A_PAGES.slice(0, 2)) {
  test(`Option A ${pg.path}: one audio control, labelled glosses, credit, one-style quiz, live CTA count`, async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    await serve(page);
    await page.goto(pg.path);
    const id = pg.path.split('/')[3];
    // banner = breadcrumb + H1 only: no Hebrew-first line for every visitor
    await expect(page.locator('h1')).toHaveText(id);
    await expect(page.locator('.wa-band [lang="he"]')).toHaveCount(0);
    // ONE audio control, labelled computer voice
    await expect(page.locator('[data-say]')).toHaveCount(1);
    await expect(page.locator('.wa-hear')).toContainText(`Hear “${id}”`);
    await expect(page.locator('.wa-voice')).toHaveText('computer voice');
    // glosses side by side, labelled by language name
    await expect(page.locator('.wa-gl b')).toHaveText(['Hebrew', 'Spanish']);
    await expect(page.locator('.wa-gl [lang="he"]')).toHaveText(WORDS.find((x) => x.id === id).hebrewTranslation);
    await expect(page.locator('.wa-gl [lang="es"]')).toHaveText(pg.es);
    const [g1, g2] = await page.locator('.wa-gl').evaluateAll((els) => els.map((e) => e.getBoundingClientRect().top));
    expect(Math.abs(g1 - g2)).toBeLessThan(2);
    // credit: a drawing is a "Picture", only a photo is a "Photo"
    const credit = await page.locator('.wa-credit').innerText();
    if (pg.drawn) { expect(credit).toMatch(/^Picture: Twemoji emoji drawing, CC BY 4\.0/); expect(credit).not.toMatch(/photo/i); }
    else expect(credit).toMatch(/^Photo: .+, CC BY/);
    // quiz: 3 pictures, the answer among them, one picture style
    const ks = await page.locator('.mq-opt').evaluateAll((els) => els.map((e) => e.dataset.k));
    expect(ks).toHaveLength(3);
    expect(ks).toContain(id);
    expect(new Set(ks.map((k) => DRAWN.has(k))).size).toBe(1);
    await expect(page.locator('.mini-quiz h2')).toHaveText(`Quick check: tap the picture of “${id}”`);
    // CTA: Practise <Category>, the live count (PAGES_HOLD excluded), into the category's practice
    await expect(page.locator('.wa-cta a')).toHaveText(`Practise ${pg.short}`);
    await expect(page.locator('.wa-cta p')).toHaveText(`${live(pg.cat)} ${pg.noun} words · free · no sign-up`);
    await expect(page.locator('.wa-cta a')).toHaveAttribute('href', new RegExp(`^/new-player\\?topic=${pg.cat}&`));
  });
}

test('Option A beacon: page view and the first quiz tap carry the arm and picture style', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  const evs = await serve(page);
  await page.goto('/vocabulary/feelings/nervous/');
  await expect.poll(() => evs.includes('pg:vocabulary_word-a-drawn')).toBe(true);
  await page.locator('.mq-opt').first().click();
  await expect.poll(() => evs.includes('mq:vocabulary_word-a-drawn')).toBe(true);
});

test('the old control page (cat) now gets Option A too, marked a for the beacon', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  const evs = await serve(page);
  await page.goto('/vocabulary/animals/cat/');
  await expect(page.locator('body')).toHaveAttribute('data-wv', 'a');
  await expect(page.locator('body')).toHaveAttribute('data-pic', 'photo');
  await expect(page.locator('.wa-band')).toHaveCount(1);
  await expect(page.locator('.word-hero')).toHaveCount(0);
  await expect(page.locator('[data-say]')).toHaveCount(1);
  await expect.poll(() => evs.includes('pg:vocabulary_word-a-photo')).toBe(true);
});
