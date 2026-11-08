// Static-page depth (measure step 2, 11-08): public/land-beacon.js sends mqv (mini-quiz seen), s15 (visible 15 s),
// prc (print button), bpr (print dialog) and fmb (flashcard-maker Build), each once per page view and only under its
// condition. The pages are built into dist/ (vite dev doesn't serve them), so the spec serves them from dist/ like
// seo-flows.spec.js. land-beacon.js skips automation, so the test unsets navigator.webdriver and reads the beacons
// from the intercepted /api/land route — nothing leaves the machine.
import { test, expect } from '@playwright/test';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const DIST = join(process.cwd(), 'dist');
const STATIC = /^\/(vocabulary|printable-flashcards|tools)\//;
const TYPES = { '.html': 'text/html', '.js': 'text/javascript' };
const DEPTH = /^(mqv|s15|prc|bpr|fmb):/;

test.skip(({ browserName, isMobile }) => browserName !== 'chromium' || isMobile, 'one run is enough');

async function capture(page) {
  const evs = [];
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => false });
    localStorage.setItem('childrendoenglish-analytics-consent', 'declined');
    window.print = () => {}; // headless print: no dialog; beforeprint is dispatched by the test
  });
  await page.route((url) => STATIC.test(url.pathname), (route) => {
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
// A paused page clock: only runFor() moves the beacon's timers, so real test time never leaks into the 15 s.
async function frozenClock(page) {
  await page.clock.install({ time: new Date('2026-11-08T10:00:00Z') });
  await page.clock.pauseAt(new Date('2026-11-08T10:00:01Z'));
}
const depth = (evs) => evs.filter((e) => DEPTH.test(e));

test.beforeEach(() => {
  test.skip(!existsSync(join(DIST, 'vocabulary', 'animals', 'dog', 'index.html')), 'run npm run build first');
});

test('word page: mqv once when the mini-quiz scrolls into view; s15 once after 15 s of visible time', async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 600 }); // the quiz sits below the fold (y ≈ 1,140)
  await frozenClock(page);
  const evs = await capture(page);
  await page.goto('/vocabulary/animals/dog/');
  await expect.poll(() => evs.includes('pg:vocabulary_word')).toBe(true);
  await page.waitForTimeout(300);
  expect(depth(evs)).toEqual([]); // nothing on load: the quiz is off screen and no time has passed
  await page.locator('.mini-quiz').scrollIntoViewIfNeeded();
  await expect.poll(() => depth(evs)).toEqual(['mqv:vocabulary_word']);
  await page.mouse.wheel(0, -3000); await page.waitForTimeout(200);
  await page.locator('.mini-quiz').scrollIntoViewIfNeeded(); await page.waitForTimeout(300);
  await page.clock.runFor(14000);
  await page.waitForTimeout(200);
  expect(depth(evs)).toEqual(['mqv:vocabulary_word']); // seen once; 14 s is not 15
  await page.clock.runFor(1500);
  await expect.poll(() => depth(evs)).toEqual(['mqv:vocabulary_word', 's15:vocabulary_word']);
  await page.clock.runFor(60000);
  await page.waitForTimeout(200);
  expect(depth(evs)).toEqual(['mqv:vocabulary_word', 's15:vocabulary_word']);
});

test('word page: hidden time does not count toward s15', async ({ page }) => {
  await frozenClock(page);
  const evs = await capture(page);
  await page.goto('/vocabulary/animals/dog/');
  await expect.poll(() => evs.includes('pg:vocabulary_word')).toBe(true);
  const setVis = (v) => page.evaluate((st) => {
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => st });
    document.dispatchEvent(new Event('visibilitychange'));
  }, v);
  await page.clock.runFor(10000);
  await setVis('hidden');
  await page.clock.runFor(60000);
  await page.waitForTimeout(200);
  expect(depth(evs).filter((e) => e.startsWith('s15'))).toEqual([]);
  await setVis('visible');
  await page.clock.runFor(5500);
  await expect.poll(() => depth(evs).filter((e) => e.startsWith('s15'))).toEqual(['s15:vocabulary_word']);
});

test('printable page: prc once on the print button, bpr once per view on the print dialog', async ({ page }) => {
  const evs = await capture(page);
  await page.goto('/printable-flashcards/animals/spanish/');
  await expect.poll(() => evs.some((e) => e.startsWith('pg:'))).toBe(true);
  expect(depth(evs)).toEqual([]);
  const btn = page.locator('[data-print]').first();
  await btn.click(); await btn.click();
  await page.evaluate(() => { window.dispatchEvent(new Event('beforeprint')); window.dispatchEvent(new Event('beforeprint')); });
  await expect.poll(() => depth(evs)).toEqual(['prc:printable-flashcards_animals_spanish', 'bpr:printable-flashcards_animals_spanish']);
  await page.waitForTimeout(300);
  expect(depth(evs)).toHaveLength(2);
});

test('flashcard maker: fmb on Build and prc on Print, once each', async ({ page }) => {
  const evs = await capture(page);
  await page.goto('/tools/flashcard-maker/');
  await expect.poll(() => evs.includes('pg:tools_flashcard-maker')).toBe(true);
  expect(depth(evs)).toEqual([]);
  await page.locator('input[name="pick"][value="paste"]').check();
  await page.locator('#fmPaste').fill('dog\ncat\napple');
  await page.locator('#fmBuild').click();
  await expect(page.locator('#fmPrint')).toBeEnabled();
  await page.locator('#fmBuild').click();
  await page.locator('#fmPrint').click(); await page.locator('#fmPrint').click();
  await expect.poll(() => depth(evs)).toEqual(['fmb:tools_flashcard-maker', 'prc:tools_flashcard-maker']);
  await page.waitForTimeout(300);
  expect(depth(evs)).toHaveLength(2);
  expect(evs.filter((e) => e === 'pg:tools_flashcard-maker')).toHaveLength(1); // the page used to load the beacon twice
});
