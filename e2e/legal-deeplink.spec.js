import { test, expect } from '@playwright/test';

// 11-07 AI-feel parent journey: the About page's "Read our full privacy policy" link (/privacy) and /terms opened the
// home landing for a new visitor (and the menu for a returning one), so a parent checking before letting a child play
// never saw the policy. A direct link now opens the page itself for everyone.
const PLAYER = () => localStorage.setItem('childrendoenglish-players', JSON.stringify({ activePlayerId: 'p1', players: [{ id: 'p1', name: 'Kid', avatar: '🦊' }] }));

for (const [path, title] of [['/privacy', 'Privacy Policy'], ['/terms', 'Terms of Service']]) {
  test(`a new visitor opening ${path} sees the page, and Back goes to the landing`, async ({ page }) => {
    await page.route('**/api/**', (r) => r.fulfill({ status: 204 }));
    await page.goto(path);
    await expect(page.getByRole('heading', { level: 2, name: title })).toBeVisible();
    expect(new URL(page.url()).pathname).toBe(path);
    await page.locator('main button[aria-label], button[aria-label]').first().click();
    await expect(page).toHaveURL(/\/$/);
  });

  test(`a returning player opening ${path} sees the page`, async ({ page }) => {
    await page.route('**/api/**', (r) => r.fulfill({ status: 204 }));
    await page.addInitScript(PLAYER);
    await page.goto(path);
    await expect(page.getByRole('heading', { level: 2, name: title })).toBeVisible();
  });
}
