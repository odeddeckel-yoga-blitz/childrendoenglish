import { test, expect } from '@playwright/test';

// Multilang scaffolding (plans/multilang-es-ar-2026-10.md WS1): the Español hero
// tile must start the app in Spanish — lazy strings loaded, <html lang> flipped,
// LTR kept. Also guards the ?lang=es hreflang entry point.

test('Español hero tile starts the app in Spanish', async ({ page }) => {
  await page.goto('/');
  await page.click('text=Interfaz en español');
  await expect.poll(() => page.evaluate(() => document.documentElement.lang)).toBe('es');
  await expect.poll(() => page.evaluate(() => document.documentElement.dir)).toBe('ltr');
});

test('?lang=es entry point sets Spanish', async ({ page }) => {
  await page.goto('/?lang=es');
  await expect.poll(() => page.evaluate(() => document.documentElement.lang)).toBe('es');
});

test('language picker lists all ready languages', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /Language:/ }).click();
  const options = page.getByRole('option');
  await expect(options).toHaveCount(3); // en, he, es (ar hidden until ready)
  await expect(page.getByRole('option', { name: /עברית/ })).toBeVisible();
});
