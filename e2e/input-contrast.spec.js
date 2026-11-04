import { test, expect } from '@playwright/test';

// Owner 11-04: the player-name box read 1.3:1 in dark mode (light text on a white box) and the light-mode hint 2.6:1.
// Every visible text box: typed text and placeholder ≥ 4.5:1 against the box's own (composited) background.
const MEASURE = () => {
  const cv = document.createElement('canvas'); cv.width = cv.height = 1; const cx = cv.getContext('2d', { willReadFrequently: true });
  const parse = (c) => { cx.clearRect(0, 0, 1, 1); cx.fillStyle = '#000'; cx.fillStyle = c; cx.fillRect(0, 0, 1, 1); const d = cx.getImageData(0, 0, 1, 1).data; return [d[0], d[1], d[2], d[3] / 255]; };
  const over = (t, b) => [0, 1, 2].map((i) => t[i] * t[3] + b[i] * (1 - t[3])).concat(1);
  const bgOf = (el) => { const chain = []; for (let e = el; e; e = e.parentElement) chain.push(parse(getComputedStyle(e).backgroundColor)); let c = [255, 255, 255, 1]; for (const x of chain.reverse()) c = over(x, c); return c; };
  const lum = ([r, g, b]) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
  const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
  return [...document.querySelectorAll('input[type=text], input[type=search], input:not([type]), textarea')].filter((i) => i.offsetParent).map((i) => {
    const bg = bgOf(i);
    return { id: i.id || i.name || 'input', text: ratio(over(parse(getComputedStyle(i).color), bg), bg), placeholder: ratio(over(parse(getComputedStyle(i, '::placeholder').color), bg), bg) };
  });
};

for (const scheme of ['light', 'dark']) {
  test(`player name box is readable in ${scheme} mode (text and hint ≥ 4.5:1)`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: scheme });
    await page.addInitScript(() => localStorage.setItem('childrendoenglish-analytics-consent', 'declined'));
    await page.goto('/');
    await page.waitForSelector('#root > *', { timeout: 10000 });
    await page.locator('button', { hasText: 'Learn vocabulary in English' }).click();
    await page.locator('#player-name').waitFor({ timeout: 8000 });
    await page.locator('#player-name').fill('Kid');
    const boxes = await page.evaluate(MEASURE);
    expect(boxes.length).toBeGreaterThan(0);
    for (const b of boxes) {
      expect(b.text, `${b.id} text`).toBeGreaterThanOrEqual(4.5);
      expect(b.placeholder, `${b.id} placeholder`).toBeGreaterThanOrEqual(4.5);
    }
  });
}
