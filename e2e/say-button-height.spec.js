import { test, expect } from '@playwright/test';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

// 11-07 Monday sweep: swapping the 🔊 emoji for a drawn icon (11-04) shrank the line box, so the "Listen" / "Hear the
// sentence" buttons fell to 42 px on every word page and 37 px on the guides (tap targets < 44 px: 158 → 2,185
// sitewide). An icon swap must keep every icon button ≥ 44 px. Static pages come from dist/ (vite dev doesn't serve them).
const DIST = join(process.cwd(), 'dist');
const STATIC = /^\/(vocabulary|guides)\//;

test('say buttons on word, topic and guide pages are at least 44 px tall', async ({ page }) => {
  test.skip(!existsSync(join(DIST, 'vocabulary', 'animals', 'index.html')), 'run npm run build first');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.route((url) => STATIC.test(url.pathname), (route) => {
    const p = new URL(route.request().url()).pathname;
    const file = join(DIST, p.endsWith('/') ? p + 'index.html' : p);
    if (!existsSync(file)) return route.fulfill({ status: 404, body: 'not found' });
    route.fulfill({ status: 200, contentType: file.endsWith('.html') ? 'text/html' : 'application/octet-stream', body: readFileSync(file) });
  });
  await page.route('**/api/**', (r) => r.fulfill({ status: 204 }));
  const small = [];
  let seen = 0;
  for (const u of ['/vocabulary/animals/cat/', '/vocabulary/food/apple/', '/guides/how-to-teach-kids-english-vocabulary/']) {
    await page.goto(u);
    const hs = await page.$$eval('button.say-btn', (els) => els.filter((e) => e.getClientRects().length)
      .map((e) => Math.round(e.getBoundingClientRect().height)));
    seen += hs.length;
    for (const h of hs) if (h < 44) small.push(`${u}: say-btn ${h}px`);
  }
  expect(seen).toBeGreaterThan(3);
  expect(small).toEqual([]);
});
