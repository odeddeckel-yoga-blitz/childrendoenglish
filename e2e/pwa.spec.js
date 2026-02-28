import { test, expect } from '@playwright/test';

// PWA offline tests require a production build served via `npm run preview`
// These tests verify the service worker caches the app for offline use.
// Run with: npx playwright test e2e/pwa.spec.js

test.describe('PWA Offline', () => {
  // Use a longer timeout since we need to wait for service worker
  test.setTimeout(60000);

  test('app loads, caches, and works offline', async ({ page, context }) => {
    // 1. Load the app (registers service worker)
    await page.goto('/');
    await page.waitForTimeout(3000); // Give SW time to install and cache

    // Skip onboarding
    const skipBtn = page.locator('button[aria-label="Skip onboarding"]');
    if ((await skipBtn.count()) > 0) {
      await skipBtn.click();
    }

    // Verify app loaded
    await expect(page.locator('text=Children Do English')).toBeVisible({ timeout: 10000 });

    // 2. Wait for service worker to be active
    const swRegistered = await page.evaluate(async () => {
      if (!('serviceWorker' in navigator)) return false;
      const reg = await navigator.serviceWorker.getRegistration();
      return !!reg?.active;
    });

    if (!swRegistered) {
      // SW not active yet, wait a bit more and reload
      await page.waitForTimeout(5000);
      await page.reload();
      await page.waitForTimeout(3000);
    }

    // 3. Go offline
    await context.setOffline(true);

    // 4. Reload — should still work from cache
    await page.reload();
    await expect(page.locator('text=Children Do English')).toBeVisible({ timeout: 10000 });

    // 5. Verify basic navigation works offline
    await expect(page.locator('text=Play Quiz')).toBeVisible();
    await expect(page.locator('text=Learn Words')).toBeVisible();

    // 6. Go back online
    await context.setOffline(false);
  });
});
