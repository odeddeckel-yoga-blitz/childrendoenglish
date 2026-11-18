import { test, expect } from '@playwright/test';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

// Audit 11-18 content (branch content/printables-es-1118): printable week packs (/he/printables/, /es/fichas/), the
// Spanish primary hub and readings (/es/primaria/, /es/lecturas/), per-year + feelings word lists, and the chant pilot.
// Static pages built into dist/ by `npm run build` (vite dev doesn't serve them): served from dist/, like worksheets.spec.
const DIST = join(process.cwd(), 'dist');
const STATIC = /^\/(he\/printables|es\/(fichas|primaria|lecturas)|chants|vocabulary\/(words-for-\d+-year-olds|feelings-words-for-kids)|band-1\/reading)\//;
const html = (p) => readFileSync(join(DIST, p, 'index.html'), 'utf8');
const PAGES = [
  '/he/printables/', '/he/printables/jet-2-unit-3/', '/he/printables/grade-4/', '/es/fichas/', '/es/fichas/animals/',
  '/es/primaria/', '/es/lecturas/', '/es/lecturas/my-dog/', '/vocabulary/words-for-6-year-olds/', '/vocabulary/words-for-10-year-olds/',
  '/vocabulary/feelings-words-for-kids/', '/chants/', '/chants/days-of-the-week/',
];

test.beforeEach(async ({ page }) => {
  test.skip(!existsSync(join(DIST, 'he', 'printables', 'index.html')), 'run npm run build first');
  await page.route((url) => STATIC.test(url.pathname), (route) => {
    const p = new URL(route.request().url()).pathname;
    const file = join(DIST, p.endsWith('/') ? p + 'index.html' : p);
    if (!existsSync(file)) return route.fulfill({ status: 404, body: 'not found' });
    route.fulfill({ status: 200, contentType: 'text/html', body: readFileSync(file) });
  });
  await page.route('**/api/land**', (route) => route.fulfill({ status: 204, body: '' }));
});

for (const path of PAGES) {
  test(`${path}: renders in its language, pictures load, self canonical, no sideways scroll at 390 px`, async ({ page }) => {
    const errs = [];
    page.on('pageerror', (e) => errs.push(e.message));
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(path);
    await expect(page.locator('h1')).toBeVisible();
    const lang = path.startsWith('/he/') ? 'he' : path.startsWith('/es/') ? 'es' : 'en';
    await expect(page.locator('html')).toHaveAttribute('lang', lang);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `https://childrendoenglish.com${path}`);
    await page.evaluate(() => { document.querySelectorAll('img[loading=lazy]').forEach((i) => { i.loading = 'eager'; }); });
    await page.evaluate(() => Promise.all([...document.images].map((i) => (i.complete ? 0 : new Promise((r) => { i.onload = i.onerror = r; })))));
    const broken = await page.evaluate(() => [...document.querySelectorAll('main img')].filter((i) => !i.naturalWidth).map((i) => i.getAttribute('src')));
    expect(broken).toEqual([]);
    expect(await page.evaluate(() => document.scrollingElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', path.startsWith('/chants/') ? /noindex/ : /^index/);
    expect(errs).toEqual([]);
  });
}

test('a week pack: the key matches the matching sheet, and print shows only the 5 sheets', async ({ page }) => {
  await page.goto('/he/printables/jet-2-unit-3/');
  const rows = await page.locator('#pk-match .pk-col.l .pk-item').evaluateAll((els) => els.map((e) => [e.dataset.n, e.dataset.word]));
  expect(rows).toHaveLength(8);
  for (const [n, word] of rows) {
    const letter = await page.locator(`#pk-key li[data-n="${n}"]`).getAttribute('data-letter');
    await expect(page.locator(`#pk-match .pk-col.r .pk-item[data-letter="${letter}"]`)).toHaveAttribute('data-word', word);
  }
  await expect(page.locator('.pk-label').first()).toContainText('כיתה ד׳');
  await page.emulateMedia({ media: 'print' });
  await expect(page.locator('.pk-tools')).toBeHidden();
  await expect(page.locator('.hero')).toBeHidden();
  await expect(page.locator('.pk-sheet')).toHaveCount(5);
  for (const s of await page.locator('.pk-sheet').all()) await expect(s).toBeVisible();
});

test('the unit page links its week pack; the Spanish pack says primaria', async ({ page }) => {
  expect(html('units/jet-2/unit-3')).toContain('href="/he/printables/jet-2-unit-3/"');
  await page.goto('/es/fichas/animals/');
  await expect(page.locator('.pk-label').first()).toContainText('Primaria');
});

test('Spanish reading: tap a word for its Spanish, the questions answer in Spanish', async ({ page }) => {
  await page.goto('/es/lecturas/my-dog/');
  await page.locator('.rtext .w', { hasText: /^dog$/ }).first().click();
  await expect(page.locator('#gloss')).toContainText('perro');
  await page.locator('.q[data-q="0"] .opt[data-ok]').click();
  await expect(page.locator('.q[data-q="0"] .fb')).toContainText('¡Correcto!');
  // hreflang twins, both ways
  expect(html('es/lecturas/my-dog')).toContain('hreflang="he" href="https://childrendoenglish.com/band-1/reading/my-dog/"');
  expect(html('band-1/reading/my-dog')).toContain('hreflang="es" href="https://childrendoenglish.com/es/lecturas/my-dog/"');
});

test('the Hebrew reading keeps its Hebrew interface', async ({ page }) => {
  await page.goto('/band-1/reading/my-dog/');
  await page.locator('.q[data-q="0"] .opt[data-ok]').click();
  await expect(page.locator('.q[data-q="0"] .fb')).toContainText('נכון!');
});

test('chant pilot: Start lights the first line', async ({ page }) => {
  await page.goto('/chants/days-of-the-week/');
  await page.locator('[data-chant-play]').click();
  await expect(page.locator('.cl.on')).toHaveCount(1, { timeout: 8000 });
  await page.locator('[data-chant-play]').click();
  await expect(page.locator('.cl.on')).toHaveCount(0);
});

test('Spanish category twins and Spanish flashcards lead with Spanish titles', () => {
  for (const [p, re] of [['vocabulary/colors/spanish', /^Colores en inglés y español para niños/], ['vocabulary/sports/spanish', /^Deportes y actividades en inglés y español/],
    ['printable-flashcards/animals/spanish', /^Tarjetas de animales en inglés y español para imprimir/]]) {
    expect(html(p).match(/<title>([^<]*)<\/title>/)[1]).toMatch(re);
  }
});
