import { test, expect } from '@playwright/test';

// Mastery map (kit RL16 rules): hidden for a child with no answers; once words are
// answered it shows each category with ● / ◐ / ○ counts, and a topic tap starts a quiz.
function seed(page, wordMap) {
  return page.addInitScript((wordMap) => {
    localStorage.setItem('cde_lang', 'en');
    const player = { id: 'player_mm', name: 'Map', avatar: '🦊', canRead: true, createdAt: new Date().toISOString() };
    localStorage.setItem('childrendoenglish-players', JSON.stringify({ schemaVersion: 2, players: [player], activePlayerId: player.id }));
    localStorage.setItem('childrendoenglish-player-player_mm', JSON.stringify({
      totalQuizzes: 2, bestScores: { beginner: 8, intermediate: 0, advanced: 0 }, badges: [], unlockedLevels: ['beginner'],
      wordProgress: { cat: { lastSeen: Date.now(), interval: 1, correct: 1, wrong: 0 } }, wordMap,
      dailyGoal: { date: null, wordsReviewed: 0 }, currentStreak: 0, longestStreak: 0, lastActiveDate: null,
      hasSeenOnboarding: true, uiLanguage: 'en', quizHistory: [],
      arcade: { bestByMode: {}, lightningBest: {}, lightningRounds: 0, categoriesTried: [], modesPlayed: [] },
    }));
  }, wordMap);
}

test('no map before any answer', async ({ page }) => {
  await seed(page, {});
  await page.goto('/');
  await expect(page.getByRole('button', { name: /^Continue/ })).toBeVisible({ timeout: 10000 });
  await expect(page.getByTestId('mastery-map')).toHaveCount(0);
});

test('the map shows progress by category and a topic tap starts a quiz', async ({ page }) => {
  await seed(page, { cat: { s: 2, d: '2026-10-01' }, dog: { s: 1, d: '2026-10-01' } });
  await page.goto('/');
  const map = page.getByTestId('mastery-map');
  await expect(map).toBeVisible({ timeout: 10000 });
  const animals = map.locator('[data-topic="animals"]');
  await expect(animals).toHaveAttribute('aria-label', /Animals: 1 know them, 1 getting there, \d+ not yet/);
  await animals.click();
  await expect(page.getByRole('button', { name: 'Quit quiz' })).toBeVisible({ timeout: 10000 });
});
