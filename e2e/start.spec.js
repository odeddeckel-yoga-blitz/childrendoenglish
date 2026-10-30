import { test, expect } from '@playwright/test';

// CUX2 / persona P2: a localized start button (/he/ → /new-player?lang=he) opens
// create-player in that language — no second landing, no language question —
// and a topic page's ?topic= carries into the first quiz.

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('childrendoenglish-analytics-consent', 'declined'));
});

test('a Hebrew start link opens create-player in Hebrew, with no language question', async ({ page }) => {
  await page.goto('/new-player?lang=he');
  await expect(page.getByRole('button', { name: /מתחילים לשחק/ })).toBeVisible({ timeout: 10000 });
  await expect(page.locator('html')).toHaveAttribute('lang', 'he');
  await expect(page.getByText('Learn vocabulary in English')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Yes' })).toHaveCount(0);
});

test('?topic= starts the first quiz on that topic', async ({ page }) => {
  await page.goto('/new-player?lang=he&topic=animals');
  await page.getByRole('button', { name: /מתחילים לשחק/ }).click();
  await expect(page.getByRole('button', { name: 'צאו מהחידון' })).toBeVisible({ timeout: 15000 });
  await expect(page.getByTestId('ladder-strip')).toHaveCount(0);
  // the quiz is up (not the menu), and its pictures are animals (same-topic distractors)
  await expect.poll(async () => page.locator('main img').count(), { timeout: 15000 }).toBeGreaterThan(1);
  const srcs = await page.locator('main img').evaluateAll((els) => els.map((e) => e.getAttribute('src')));
  const { WORDS } = await import('../src/data/words.js');
  const animalImgs = new Set(WORDS.filter((w) => w.category === 'animals').map((w) => w.imageUrl));
  expect(srcs.filter((s) => animalImgs.has(s)).length).toBeGreaterThanOrEqual(2);
});
