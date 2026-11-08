import { test, expect } from '@playwright/test';
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { WORD_COUNT } from '../src/data/wordCount.js';

// Page-language triage 11-08 (site-factory briefs/cde-pages-triage): the built static pages, read
// from dist/ (CDE_DIST overrides it, e.g. to replay the checks on an older build).
//  1. Spanish pages say they are Spanish (<html lang="es">) and show no English chrome; English
//     words being taught sit inside lang="en".
//  2. Hebrew word-set pages (/units/, unit pages, Band I + its review path): every English run in
//     the RTL page is inside an LTR element, and no "…" trails an English isolate on the RTL side.
//  3. One site-wide word count: every "N words / palabras / מילים / cards" total on a generated
//     page is WORD_COUNT, written "N+" (or "over / más de / יותר מ- N"). Held until the 11-14 SEO
//     read: the /he/ landing (HE_WORD_STAT, its "500").
const DIST = process.env.CDE_DIST || join(process.cwd(), 'dist');
const STATIC = /^\/(units|band-1|vocabulary|printable-flashcards)\//;
const fileFor = (p) => join(DIST, p.endsWith('/') ? p + 'index.html' : p);
const CATS = ['animals', 'food', 'home', 'transport', 'nature', 'colors', 'numbers', 'clothing', 'school', 'sports', 'feelings', 'everyday', 'toys'];

test.beforeEach(async ({ page }) => {
  test.skip(!existsSync(join(DIST, 'units', 'index.html')), 'run npm run build first');
  await page.route((url) => STATIC.test(url.pathname), (route) => {
    const file = fileFor(new URL(route.request().url()).pathname);
    if (!existsSync(file)) return route.fulfill({ status: 404, body: 'not found' });
    route.fulfill({ status: 200, contentType: file.endsWith('.html') ? 'text/html' : 'application/octet-stream', body: readFileSync(file) });
  });
  await page.route('**/api/land**', (route) => route.fulfill({ status: 204, body: '' }));
});

// Visible text nodes (rendered, not script/style/svg/aria-hidden), with their parent's computed
// direction, the nearest lang, and whether the node follows an LTR element.
async function textNodes(page) {
  return page.evaluate(() => {
    const out = [];
    const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    for (let n = w.nextNode(); n; n = w.nextNode()) {
      const t = n.nodeValue.replace(/\s+/g, ' ').trim();
      const el = n.parentElement;
      if (!t || !el || el.closest('script, style, noscript, svg, [hidden], [aria-hidden="true"]')) continue;
      // checkVisibility also skips a closed <details> body (the crawl mesh), which keeps its boxes
      if (!el.checkVisibility({ visibilityProperty: true }) || !el.getClientRects().length) continue;
      const prev = n.previousSibling;
      out.push({
        t: t.slice(0, 70),
        dir: getComputedStyle(el).direction,
        lang: el.closest('[lang]')?.getAttribute('lang') || '',
        afterLtr: !!(prev && prev.nodeType === 1 && getComputedStyle(prev).direction === 'ltr'),
      });
    }
    return out;
  });
}

const ES_PAGES = [
  ...CATS.map((c) => `/vocabulary/${c}/spanish/`),
  ...CATS.map((c) => `/printable-flashcards/${c}/spanish/`),
  '/printable-flashcards/spanish/',
];
// English chrome that shipped on these pages (H1 "Food & Drinks in Spanish and English", "Home ›
// Vocabulary", "Print These Flashcards", "More Printable Flashcards…", "About · Privacy"), plus
// English function words that never occur in Spanish copy.
const EN_CHROME = /\b(the|and|with|of|for|Home|Vocabulary|Print|Printable|Flashcards?|View|More|All|About|Privacy|credits|words?|Spanish|English-only)\b/;

test('Spanish pages: lang="es", no English chrome outside lang="en"', async ({ page }) => {
  test.setTimeout(120000);
  const bad = [];
  for (const path of ES_PAGES) {
    await page.goto(path);
    const lang = await page.locator('html').getAttribute('lang');
    if (lang !== 'es') bad.push(`${path}: <html lang="${lang}">`);
    for (const n of await textNodes(page)) {
      if (n.lang === 'en' || n.lang === 'he') continue;
      if (EN_CHROME.test(n.t)) bad.push(`${path}: "${n.t}"`);
    }
  }
  expect(bad, bad.slice(0, 25).join('\n')).toEqual([]);
});

test('Spanish pages: the H1, breadcrumb and print button are Spanish', async ({ page }) => {
  await page.goto('/printable-flashcards/food/spanish/');
  await expect(page.locator('h1')).toHaveText(/^Tarjetas de .+ para imprimir/);
  await expect(page.locator('button[data-print]')).toHaveText('Imprimir estas tarjetas');
  await expect(page.locator('.breadcrumb')).toContainText('Inicio');
  await page.goto('/vocabulary/food/spanish/');
  await expect(page.locator('h1')).toHaveText(/ en inglés y español$/);
  await expect(page.locator('.breadcrumb')).toContainText('Inicio');
  await expect(page.locator('.bi-en').first()).toHaveAttribute('lang', 'en');
});

const HE_PAGES = ['/units/', '/units/jet-1/', '/units/jet-1/unit-1/', '/band-1/', '/band-1/animals/', '/band-1/review/', '/band-1/review/set-1/'];

test('Hebrew word-set pages: every English run is LTR-isolated, ellipses on the English side', async ({ page }) => {
  test.setTimeout(90000);
  const bad = [];
  for (const path of HE_PAGES) {
    await page.goto(path);
    expect(await page.locator('html').getAttribute('dir')).toBe('rtl');
    for (const n of await textNodes(page)) {
      if (n.dir === 'rtl' && /[A-Za-z]/.test(n.t)) bad.push(`${path}: English run in RTL text: "${n.t}"`);
      if (n.dir === 'rtl' && n.afterLtr && /^…/.test(n.t)) bad.push(`${path}: "…" after an English isolate, on the RTL side: "${n.t}"`);
    }
  }
  expect(bad, bad.slice(0, 25).join('\n')).toEqual([]);
});

test('the footer language row is in the page language, not "Idiomas · שפות · Languages"', async ({ page }) => {
  for (const [path, head] of [['/units/', 'שפות'], ['/vocabulary/food/spanish/', 'Idiomas'], ['/vocabulary/food/', 'Languages']]) {
    await page.goto(path);
    await expect(page.locator('.crawl-mesh > h2').first()).toHaveText(head);
  }
});

// --- 3. one word count (static scan of every generated page; no browser needed) ---
const walk = (d) => readdirSync(d).flatMap((f) => {
  const p = join(d, f);
  return statSync(p).isDirectory() ? walk(p) : p.endsWith('.html') ? [p] : [];
});
// Held SEO test until the 11-14 read (HE_WORD_STAT + the landing's "500").
const HELD = new Set(['he/index.html']);
const UNIT = /^(words?|palabras|tarjetas|cards|flashcards|photo words|real-photo|English words|everyday English|vocabulary flashcards|מילים|כרטיסיות)/i;

test('one word count: every site-wide total on a generated page is WORD_COUNT+', () => {
  test.skip(!existsSync(join(DIST, 'index.html')), 'run npm run build first');
  const bad = [];
  let seen = 0;
  for (const file of walk(DIST)) {
    const rel = file.slice(DIST.length + 1);
    // public/games/<game>/ pages are copied, not generated (frozen until 11-28)
    if (HELD.has(rel) || /^games\/[^/]+\//.test(rel)) continue;
    const text = readFileSync(file, 'utf8').replace(/<(style|svg)[\s\S]*?<\/\1>/g, ' ').replace(/<[^>]+>/g, ' ')
      .replace(/&[a-z]+;/g, ' ').replace(/[‎‏⁦-⁩]/g, '').replace(/\s+/g, ' ');
    for (const m of text.matchAll(/(^|[^\d,.])(\d{3})(\+?)(?![\d,%])\s*(.{0,24})/g)) {
      const n = Number(m[2]);
      if (n < 400 || !UNIT.test(m[4])) continue;
      seen++;
      const before = text.slice(Math.max(0, m.index - 14), m.index + m[1].length);
      const ok = n === WORD_COUNT && (m[3] === '+' || /(over|more than|más de|יותר מ-?|למעלה מ-?|מעל)\s*$/i.test(before));
      if (!ok) bad.push(`${rel}: "${(before + m[2] + m[3] + ' ' + m[4]).trim()}"`);
    }
  }
  expect(seen).toBeGreaterThan(20);
  expect(bad, bad.slice(0, 30).join('\n')).toEqual([]);
});
