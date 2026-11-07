import { test, expect } from '@playwright/test';

// 11-07 engagement read: the ladder's game step (conv) launched 45 times but Letter Fix, the next step, was done 8 times,
// and every Category Conveyor exit since 11-04 went to ANOTHER game — the end card's primary was "Next game".
// A child who came from the ladder (?from=ladder, with a player) now gets "Back to my words" → /app as the primary.
const PLAYER = () => localStorage.setItem('childrendoenglish-players', JSON.stringify({ activePlayerId: 'p1', players: [{ id: 'p1', name: 'Kid', avatar: '🦊' }] }));

async function endCard(page, url) {
  await page.route('**/api/**', (r) => r.fulfill({ status: 204 }));
  await page.addInitScript(PLAYER);
  await page.goto(url);
  await page.waitForFunction(() => window.CDE_END && window.CC);
  await page.evaluate(() => CDE_END({ game: 'category-conveyor', again: document.getElementById('againBtn'), good: true }));
  return page.locator('.cde-end [data-kdm-primary]');
}

test('a ladder arrival is led back to its words, not on to another game', async ({ page }) => {
  const primary = await endCard(page, '/games/category-conveyor/index.html?words=cat,dog,apple,bus&from=ladder');
  await expect(primary).toHaveAttribute('href', '/app');
  await expect(primary).toContainText('Back to my words');
  await expect(page.locator('.cde-end a[href^="/games/"]')).toHaveCount(0);
  await expect(page.locator('#homePill')).toContainText('Back to my words');
});

test('an ordinary visit keeps "Next game" as the primary after a good run', async ({ page }) => {
  const primary = await endCard(page, '/games/category-conveyor/index.html');
  await expect(primary).toHaveAttribute('href', /\/games\/sound-pairs\//);
});
