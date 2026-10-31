// t1 (kit R2X7 verified session): once per page load, the first trusted tap on a play
// surface. land-beacon.js skips automation, so the test unsets navigator.webdriver and
// reads the beacons from the /api/land route.
import { test, expect } from '@playwright/test';

async function capture(page) {
  const evs = [];
  await page.addInitScript(() => Object.defineProperty(navigator, 'webdriver', { get: () => false }));
  await page.route('**/api/land', async (route) => {
    try { for (const x of JSON.parse(route.request().postData() || '{}').batch || []) evs.push(`${x.e}:${x.i}`); } catch { /* not JSON */ }
    await route.fulfill({ status: 204 });
  });
  await page.route('**/_vercel/**', (r) => r.fulfill({ status: 204, body: '' }));
  return evs;
}

test.skip(({ browserName, isMobile }) => browserName !== 'chromium' || isMobile, 'one run is enough');

test('a game page sends t1 once, on the first tap that is not a link', async ({ page }) => {
  const evs = await capture(page);
  await page.goto('/games/sound-pairs/index.html');
  await expect(page.locator('#startBtn')).toBeVisible();
  await page.evaluate(() => document.getElementById('startBtn').dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }))); // synthetic: never counts
  await page.waitForTimeout(300);
  expect(evs.filter((e) => e.startsWith('t1:'))).toEqual([]);
  await page.locator('#startBtn').click();
  await page.mouse.click(5, 300);
  await expect.poll(() => evs.filter((e) => e.startsWith('t1:'))).toEqual(['t1:g-sound-pairs']);
});

test('the app sends t1 only once a quiz or flashcard screen is open', async ({ page }) => {
  const evs = await capture(page);
  await page.goto('/');
  await page.locator('button', { hasText: 'Learn vocabulary in English' }).click();
  await page.waitForTimeout(300);
  expect(evs.filter((e) => e.startsWith('t1:'))).toEqual([]); // landing + create-player taps are not play
  await page.evaluate(() => document.documentElement.setAttribute('data-view', 'imageQuiz'));
  await page.mouse.click(10, 10);
  await expect.poll(() => evs.filter((e) => e.startsWith('t1:'))).toEqual(['t1:app']);
});
