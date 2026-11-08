// /teachers/ (step 4, mockup d, 11-08) and the flashcard-maker restyle. Pages are built into dist/ (vite dev doesn't
// serve them), so the spec serves them from dist/ like page-depth.spec.js. All of these fail on the old build: there
// was no /teachers/ page, the maker's disabled Print was opacity .4 (1.94:1) and its form started at y ≈ 830.
import { test, expect } from '@playwright/test';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { UNITS, BOOKS } from '../src/data/units.js';
import { BAND1_BY_ID } from '../src/data/band1.js';
import { WORDS as ALL_WORDS, CATEGORIES } from '../src/data/words.js';
import { PAGES_HOLD } from '../src/data/pagesHold.js';
import { DRAWN } from '../src/data/imageStyle.js';

const DIST = join(process.cwd(), 'dist');
// teachers.js + land-beacon.js too: the vite server on :5199 may be another checkout's (reuseExistingServer).
const STATIC = /^\/((teachers|tools|printable-flashcards)\/|(teachers|land-beacon)\.js$)/;
// the generated pages leave out the held words (src/data/pagesHold.js)
const WORDS = ALL_WORDS.filter((w) => !PAGES_HOLD.has(w.id));
const TYPES = { '.html': 'text/html', '.js': 'text/javascript' };

test.skip(({ browserName, isMobile }) => browserName !== 'chromium' || isMobile, 'one run is enough');
test.beforeEach(() => {
  test.skip(!existsSync(join(DIST, 'tools', 'flashcard-maker', 'index.html')), 'run npm run build first');
});

async function serve(page, { beacons } = {}) {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => false });
    localStorage.setItem('childrendoenglish-analytics-consent', 'declined');
  });
  await page.route((url) => STATIC.test(url.pathname), (route) => {
    const p = new URL(route.request().url()).pathname;
    const file = join(DIST, p.endsWith('/') ? p + 'index.html' : p);
    if (!existsSync(file)) return route.fulfill({ status: 404, body: 'not found' });
    route.fulfill({ status: 200, contentType: TYPES[file.slice(file.lastIndexOf('.'))] || 'application/octet-stream', body: readFileSync(file) });
  });
  await page.route('**/api/land**', async (route) => {
    try { if (beacons) beacons.push(JSON.parse(route.request().postData() || '{}')); } catch { /* not JSON */ }
    await route.fulfill({ status: 204 });
  });
  await page.route('**/_vercel/**', (r) => r.fulfill({ status: 204, body: '' }));
}

// WCAG contrast of an element's text on its background, with the element's opacity blended over the page (white).
async function contrastOf(locator) {
  return locator.evaluate((el) => {
    const rgb = (s) => (s.match(/[\d.]+/g) || []).map(Number);
    const cs = getComputedStyle(el);
    let op = 1;
    for (let n = el; n; n = n.parentElement) op *= Number(getComputedStyle(n).opacity);
    const bgRaw = rgb(cs.backgroundColor);
    const bgA = bgRaw.length > 3 ? bgRaw[3] : 1;
    const over = (c, a, base) => c.slice(0, 3).map((v, i) => v * a + base[i] * (1 - a));
    const bg = over(over(bgRaw, bgA, [255, 255, 255]), op, [255, 255, 255]);
    const fg = over(rgb(cs.color), op, [255, 255, 255]);
    const L = (c) => { const [r, g, b] = c.map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
    const [a, b] = [L(fg), L(bg)].sort((x, y) => y - x);
    return (a + 0.05) / (b + 0.05);
  });
}

test('/teachers/: five sections, counts from the data, Band I columns with dir, beacons as "teachers"', async ({ page }) => {
  const beacons = [];
  await serve(page, { beacons });
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.goto('/teachers/');
  for (const id of ['units', 'band1', 'printables', 'maker', 'battle']) await expect(page.locator(`section#${id}`)).toBeVisible();
  await expect(page.locator('h1')).toHaveText('Free English vocabulary for your class');

  // textbook units: one tile per book with a live unit, unit count = units.js
  const live = UNITS.filter((u) => !u.test);
  const books = Object.keys(BOOKS).filter((b) => live.some((u) => u.book === b));
  await expect(page.locator('#units .book')).toHaveCount(books.length);
  for (const b of books) {
    const n = live.filter((u) => u.book === b).length;
    await expect(page.locator(`#units .book[data-book="${b}"] li`)).toHaveCount(n);
    await expect(page.locator(`#units .book[data-book="${b}"] h3 small`)).toContainText(`${n} unit`);
  }
  await expect(page.locator('#units')).toContainText('Not connected to Eric Cohen Books');
  await expect(page.locator('#units img')).toHaveCount(0); // no publisher art

  // Band I: counts per level from band1.js; English LTR / Hebrew RTL cells
  const vals = Object.values(BAND1_BY_ID);
  for (const lvl of ['pre', 'c1', 'c2']) await expect(page.locator(`#band1 [data-level="${lvl}"] b`)).toHaveText(String(vals.filter((v) => v === lvl).length));
  await expect(page.locator('#band1')).toContainText(`${vals.length} of our words`);
  await expect(page.locator('#band1 thead th').nth(0)).toHaveAttribute('dir', 'ltr');
  await expect(page.locator('#band1 thead th').nth(1)).toHaveAttribute('dir', 'rtl');
  const rows = page.locator('#band1 tbody tr');
  expect(await rows.count()).toBeGreaterThan(0);
  for (let i = 0; i < await rows.count(); i++) {
    await expect(rows.nth(i).locator('td').nth(0)).toHaveAttribute('dir', 'ltr');
    await expect(rows.nth(i).locator('td').nth(1)).toHaveAttribute('dir', 'rtl');
    // the Hebrew cell renders right-aligned, the English cell left-aligned (no bidi reordering inside one cell)
    expect(await rows.nth(i).locator('td').nth(1).evaluate((td) => getComputedStyle(td).direction)).toBe('rtl');
  }
  await expect(page.locator('#band1 a[href="/band-1/"]')).toBeVisible();

  // printables: topic count from the data; preview sheets come before the print links
  const topics = CATEGORIES.filter((c) => WORDS.some((w) => w.category === c)).length;
  await expect(page.locator('#printables > p').first()).toContainText(`${topics} topics`);
  await expect(page.locator('#printables .sheet')).toHaveCount(3);

  // Class Battle has its own description and start link
  await expect(page.locator('#battle a[href="/battle/"]')).toBeVisible();
  await expect(page.locator('#battle')).toContainText('computer voice');

  // the land beacon classes the page as "teachers"
  await expect.poll(() => beacons.some((b) => b.g === 'teachers')).toBe(true);
});

test('/teachers/: the maker form opens the flashcard maker with its settings, one picture style per sheet', async ({ page }) => {
  await serve(page);
  // a topic with both photos and drawings
  const cat = CATEGORIES.find((c) => { const ws = WORDS.filter((w) => w.category === c); return ws.some((w) => DRAWN.has(w.id)) && ws.some((w) => !DRAWN.has(w.id)); });
  await page.goto('/teachers/');
  await page.locator('#tCat').selectOption(cat);
  await page.locator('#maker input[name="per"][value="4"]').check();
  await page.locator('#maker input[name="back"][value="es"]').check();
  await expect(page.locator('#tFmPrev .cell')).toHaveCount(4); // live preview follows the form
  await page.locator('#tFm button[type="submit"]').click();
  await page.waitForURL(/\/tools\/flashcard-maker\/\?/);
  await expect(page.locator('input[name="per"][value="4"]')).toBeChecked();
  await expect(page.locator('input[name="back"][value="es"]')).toBeChecked();
  await expect(page.locator('#fmPrint')).toBeEnabled();
  const n = WORDS.filter((w) => w.category === cat).length;
  await expect(page.locator('#fmCount')).toHaveText(String(n));
  // no sheet mixes a drawing with a photo
  const styles = await page.locator('#fmSheets .sheet.front').evaluateAll((sheets) => sheets.map((s) => [...s.querySelectorAll('img')].map((i) => i.getAttribute('src'))));
  for (const srcs of styles) {
    const kinds = new Set(srcs.map((src) => (DRAWN.has(src.replace(/^\/images\/|\.webp$/g, '')) ? 'drawn' : 'photo')));
    expect(kinds.size).toBeLessThanOrEqual(1);
  }
});

test('flashcard maker: form near the top at 1366×768, pill toggles, disabled Print ≥ 4.5:1', async ({ page }) => {
  await serve(page);
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.goto('/tools/flashcard-maker/');
  const top = (await page.locator('input[name="pick"]').first().boundingBox()).y;
  expect(top).toBeLessThan(400);
  await expect(page.locator('#fmPrint')).toBeDisabled();
  expect(await contrastOf(page.locator('#fmPrint'))).toBeGreaterThanOrEqual(4.5);
  // pills: the radio sits under its label pill and the checked one is filled
  const pill = page.locator('label.pill:has(input[name="per"][value="9"]) span');
  await page.locator('label.pill:has(input[name="per"][value="9"])').click(); // a real tap lands on the pill
  await expect(page.locator('input[name="per"][value="9"]')).toBeChecked();
  expect(await pill.evaluate((s) => getComputedStyle(s).backgroundColor)).toBe('rgb(37, 99, 235)');
  // "Drawings only" keeps drawings (and text cards) only
  await page.locator('#fmCat').selectOption('colors');
  await page.locator('input[name="pics"][value="drawn"]').check();
  await page.locator('#fmBuild').click();
  const srcs = await page.locator('#fmSheets img').evaluateAll((imgs) => imgs.map((i) => i.getAttribute('src').replace(/^\/images\/|\.webp$/g, '')));
  expect(srcs.length).toBeGreaterThan(0);
  expect(srcs.filter((id) => !DRAWN.has(id))).toEqual([]);
  // the English header carries the teacher door
  await expect(page.locator('.site-head a[href="/teachers/"]')).toBeVisible();
});
