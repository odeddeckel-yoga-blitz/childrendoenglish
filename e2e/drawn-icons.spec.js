import { test, expect } from '@playwright/test';

// Drawn interface icons (owner 11-04: no emoji icons). An icon draws in currentColor, so inside gradient-text
// headings (color: transparent) it vanished — 6 headings shipped blank in the first pass. Every visible icon must have
// a visible colour, and every sprite reference must exist in /icons.svg.
const PAGES = ['/', '/games/', '/he/', '/battle/', '/projector/', '/games/letter-twins/', '/games/read-it/', '/games/sound-pairs/',
  '/games/spelling-forge/', '/games/word-zapper/', '/games/category-conveyor/', '/games/rhyme-time/', '/games/odd-one-out/',
  '/games/word-memory/', '/games/missing-letter/', '/games/picture-bingo/', '/games/opposites/', '/games/true-or-false/', '/games/feelings/'];

test('drawn icons are visible and resolve in the sprite', async ({ page, request }) => {
  await page.route('**/api/**', (r) => r.fulfill({ status: 204 }));
  const sprite = await (await request.get('/icons.svg')).text();
  const problems = [];
  for (const u of PAGES) {
    await page.goto(u);
    await page.waitForTimeout(300);
    const r = await page.evaluate(() => [...document.querySelectorAll('svg use')].map((use) => {
      const svg = use.closest('svg');
      return { href: use.getAttribute('href') || '', shown: !!svg.getClientRects().length, color: getComputedStyle(svg).color };
    }));
    for (const x of r) {
      const id = x.href.split('#')[1];
      if (x.href.startsWith('/icons.svg#') && !sprite.includes(`id="${id}"`)) problems.push(`${u}: ${id} not in sprite`);
      if (x.shown && /rgba\(0, 0, 0, 0\)|transparent/.test(x.color)) problems.push(`${u}: ${id} invisible (transparent colour)`);
    }
  }
  expect(problems).toEqual([]);
});
