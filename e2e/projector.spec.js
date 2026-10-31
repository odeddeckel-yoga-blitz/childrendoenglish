import { test, expect } from '@playwright/test';

// X1 projector mode: picture → the class answers aloud → reveal (English + Hebrew) → next, by
// mouse or keyboard; a unit link preselects the unit; Hebrew via ?lang=he.
test.skip(({ browserName, isMobile }) => browserName !== 'chromium' || isMobile, 'a projector is a desktop screen');

test('picture, reveal, next — by click and by keyboard', async ({ page }) => {
  await page.route('**/api/**', (r) => r.fulfill({ status: 204 }));
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto('/projector/index.html');
  await page.click('#catGrid [data-id="animals"]');
  await page.click('#go');
  await expect(page.locator('#stage img')).toBeVisible();
  await expect(page.locator('#count')).toHaveText('1 / 20');
  await expect(page.locator('#answer .en')).toHaveCount(0);
  await page.keyboard.press('Enter');
  const word = await page.locator('#answer .en').innerText();
  expect(word.length).toBeGreaterThan(1);
  await expect(page.locator('#answer .he')).not.toHaveText('');
  await page.keyboard.press('Space');
  await expect(page.locator('#count')).toHaveText('2 / 20');
  await expect(page.locator('#answer .en')).toHaveCount(0);
  await page.click('#bNext'); // Next on a hidden card reveals first
  await expect(page.locator('#answer .en')).toHaveCount(1);
  await page.keyboard.press('Escape');
  await expect(page.locator('#setup')).toBeVisible();
});

test('a unit link preselects the unit; Hebrew labels; word mode shows the English word', async ({ page }) => {
  await page.route('**/api/**', (r) => r.fulfill({ status: 204 }));
  await page.goto('/projector/index.html?unit=u-jet-2-2&lang=he');
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  await expect(page.locator('#tGo')).toHaveText('התחלה');
  await expect(page.locator('#catGrid [data-id="u-jet-2-2"]')).toHaveAttribute('aria-pressed', 'true');
  await page.click('#modeGrid [data-id="word"]');
  await page.click('#go');
  await expect(page.locator('#stage .bigword')).toBeVisible();
});
