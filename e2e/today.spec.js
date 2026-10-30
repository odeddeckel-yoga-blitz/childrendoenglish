import { test, expect } from '@playwright/test';

// "Today" run (M1): the menu card opens the day's run; each word is asked in
// the form its history calls for — picture → word (new / 0–1 right), hear →
// picture (2–4 right), spell from tiles (5+ right) — and the run ends on the
// summary with the SR state saved.
const DAY = 86400000;
function seed(page) {
  return page.addInitScript((DAY) => {
    localStorage.setItem('childrendoenglish-analytics-consent', 'declined');
    localStorage.setItem('cde_lang', 'en');
    const player = { id: 'player_today', name: 'Today', avatar: '🦊', canRead: true, createdAt: new Date().toISOString() };
    localStorage.setItem('childrendoenglish-players', JSON.stringify({ schemaVersion: 2, players: [player], activePlayerId: player.id }));
    const old = Date.now() - 20 * DAY;
    localStorage.setItem('childrendoenglish-player-player_today', JSON.stringify({
      totalQuizzes: 3, bestScores: { beginner: 8, intermediate: 0, advanced: 0 }, badges: [], unlockedLevels: ['beginner'],
      wordProgress: {
        fish: { lastSeen: old, interval: 1, correct: 0, wrong: 1 }, // → picture
        dog: { lastSeen: old, interval: 3, correct: 3, wrong: 0 }, // → hear
        cat: { lastSeen: old, interval: 7, correct: 6, wrong: 0 }, // → spell
      },
      dailyGoal: { date: null, wordsReviewed: 0 }, currentStreak: 0, longestStreak: 0, lastActiveDate: null,
      hasSeenOnboarding: true, uiLanguage: 'en', quizHistory: [],
      arcade: { bestByMode: {}, lightningBest: {}, lightningRounds: 0, categoriesTried: [], modesPlayed: [] },
    }));
  }, DAY);
}

test('Today: picture, hear and spell questions, then the summary', async ({ page }) => {
  await seed(page);
  await page.goto('/');
  await page.waitForSelector('#root > *', { timeout: 10000 });
  await page.getByTestId('menu-more').locator('summary').click(); // Today sits under More
  await page.locator('[data-testid="today-card"]').click();
  const run = page.locator('[data-testid="today-run"]');
  await expect(run).toBeVisible({ timeout: 10000 });
  const seen = new Set();
  for (let n = 0; n < 12; n++) {
    if (await page.getByText('Done for today!').isVisible()) break;
    const probe = await run.getAttribute('data-probe');
    seen.add(probe);
    const before = await page.locator('[role="progressbar"]').getAttribute('aria-valuenow');
    if (probe === 'picture') {
      const id = (await run.locator('img').first().getAttribute('src')).match(/\/images\/([^/.]+)\./)[1];
      await run.locator(`button[data-word="${id}"]`).click();
    } else if (probe === 'hear') {
      await run.locator('button[data-word="dog"]').click();
    } else {
      for (const ch of 'cat') await run.locator(`button[data-tile="${ch}"]:not([disabled])`).first().click();
    }
    await expect(page.getByText('Done for today!').or(page.locator(`[role="progressbar"]:not([aria-valuenow="${before}"])`))).toBeVisible({ timeout: 6000 });
  }
  await expect(page.getByText('Done for today!')).toBeVisible();
  expect([...seen].sort()).toEqual(['hear', 'picture', 'spell']);
  await expect(page.getByText(/^\d+\/\d+$/).first()).toBeVisible();
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('childrendoenglish-player-player_today')).wordProgress.cat);
  expect(saved.correct).toBe(7);
});
