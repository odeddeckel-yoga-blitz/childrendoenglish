import { test, expect } from '@playwright/test';

test.describe('Children Do English App', () => {
  test('loads and shows onboarding for new user', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('text=Welcome')).toBeVisible();
  });

  test('can skip onboarding to menu', async ({ page }) => {
    await page.goto('/');
    // Click the X (skip) button
    await page.locator('button[aria-label="Skip onboarding"]').click();
    await expect(page.locator('text=Children Do English')).toBeVisible();
    await expect(page.locator('text=Play Quiz')).toBeVisible();
  });

  test('shows menu with all main buttons', async ({ page }) => {
    // Set localStorage to skip onboarding
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('childrendoenglish-stats', JSON.stringify({
        hasSeenOnboarding: true,
        totalQuizzes: 0,
        bestScores: { beginner: 0, intermediate: 0, advanced: 0 },
        badges: [],
        unlockedLevels: ['beginner'],
        wordProgress: {},
        dailyGoal: { date: null, wordsReviewed: 0 },
        currentStreak: 0,
        longestStreak: 0,
        lastActiveDate: null,
        uiLanguage: 'en',
        quizHistory: [],
      }));
    });
    await page.reload();

    await expect(page.locator('text=Play Quiz')).toBeVisible();
    await expect(page.locator('text=Learn Words')).toBeVisible();
    await expect(page.locator('text=Flashcards')).toBeVisible();
    await expect(page.locator('text=My Word List')).toBeVisible();
  });

  test('can navigate to level select', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('childrendoenglish-stats', JSON.stringify({
        hasSeenOnboarding: true,
        totalQuizzes: 0,
        bestScores: {},
        badges: [],
        unlockedLevels: ['beginner'],
        wordProgress: {},
        dailyGoal: { date: null, wordsReviewed: 0 },
        currentStreak: 0,
        longestStreak: 0,
        lastActiveDate: null,
        uiLanguage: 'en',
        quizHistory: [],
      }));
    });
    await page.reload();

    await page.locator('text=Play Quiz').click();
    await expect(page.locator('text=Choose Level')).toBeVisible();
    await expect(page.locator('text=Beginner')).toBeVisible();
  });
});
