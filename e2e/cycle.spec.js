import { test, expect } from '@playwright/test';

// Learning cycle (plans/learning-cycle-2026-10.md): the menu leads with one
// Continue card; tapping it starts the batch's current stage quiz.

async function reachMenu(page) {
  await page.addInitScript(() => {
    localStorage.setItem('childrendoenglish-analytics-consent', 'declined');
  });
  await page.goto('/');
  await page.waitForSelector('#root > *', { timeout: 10000 });
  const enTile = page.locator('button', { hasText: 'Learn vocabulary in English' });
  await enTile.scrollIntoViewIfNeeded();
  await enTile.click();
  const nameInput = page.locator('input[type="text"]').first();
  await nameInput.waitFor({ timeout: 8000 });
  await nameInput.fill('CycleKid');
  await page.locator('button:has-text("Create")').first().click();
  const canRead = page.locator('text=I can read!');
  if (await canRead.count()) await canRead.click();
  await page.waitForTimeout(800);
}

test('menu leads with the cycle Continue card for a new player', async ({ page }) => {
  await reachMenu(page);
  await expect(page.getByText(/Word batch 1/)).toBeVisible({ timeout: 8000 });
  await expect(page.getByText('Step 1 of 3')).toBeVisible();
});

test('the cycle card starts a listen-stage quiz over the first batch', async ({ page }) => {
  await reachMenu(page);
  await page.getByText(/Word batch 1/).click();
  // Listen & Match quiz: option images render
  await expect(page.locator('button img').first()).toBeVisible({ timeout: 15000 });
});
