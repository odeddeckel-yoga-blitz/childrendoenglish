// Read It! strands 2–3 (B2): the menu chips jump to magic e and to the digraphs,
// the HUD names the strand, the strand's first round shows its tip, and a whole
// level can be played to the level-done card.
import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.route('**/api/**', (r) => r.fulfill({ status: 204 }));
});

async function playLevel(page) {
  for (let i = 0; i < 8; i++) {
    const s = await page.evaluate(() => window.__riState());
    expect(s.round).toBe(i);
    await page.locator(`#app .opt[data-word="${s.target}"]`).click();
    await expect.poll(() => page.evaluate(() => window.__riState().round), { timeout: 4000 }).not.toBe(i);
  }
}

test('magic e chip (Hebrew): level 6 of 10, tip, a full level', async ({ page }) => {
  await page.goto('/games/read-it/index.html?lang=he');
  await page.locator('[data-strand="2"]').click();
  await expect(page.locator('.hud-level')).toContainText('שלב 6 מתוך 10');
  await expect(page.locator('.hud-level .tag')).toHaveText('a_e');
  await expect(page.locator('.tip')).toContainText('cape');
  await playLevel(page);
  await expect(page.locator('.card h2')).toHaveText('השלב הושלם!');
  await expect(page.locator('.card .score')).toHaveText('8 / 8');
});

test('digraph chip: sh · ch level, every option is a real button with a word', async ({ page }) => {
  await page.goto('/games/read-it/index.html');
  await page.locator('[data-strand="3"]').click();
  await expect(page.locator('.hud-level')).toContainText('Level 9 of 10');
  await expect(page.locator('.hud-level .tag')).toHaveText('sh · ch');
  await expect(page.locator('#app .opt')).toHaveCount(3);
  await playLevel(page);
  await expect(page.locator('.card h2')).toHaveText('Level done!');
});
