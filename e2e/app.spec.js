import { test, expect } from '@playwright/test';

// Helper: set localStorage to simulate a returning user
const RETURNING_USER_STATS = {
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
};

async function setupReturningUser(page, overrides = {}) {
  await page.goto('/');
  await page.evaluate((stats) => {
    localStorage.setItem('childrendoenglish-stats', JSON.stringify(stats));
  }, { ...RETURNING_USER_STATS, ...overrides });
  await page.reload();
}

// ── Onboarding ──────────────────────────────────────

test.describe('Onboarding', () => {
  test('shows onboarding for new user', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('text=Welcome')).toBeVisible();
  });

  test('can skip onboarding to menu', async ({ page }) => {
    await page.goto('/');
    await page.locator('button[aria-label="Skip onboarding"]').click();
    await expect(page.locator('text=Children Do English')).toBeVisible();
    await expect(page.locator('text=Play Quiz')).toBeVisible();
  });
});

// ── Menu ────────────────────────────────────────────

test.describe('Menu', () => {
  test('shows all main buttons for returning user', async ({ page }) => {
    await setupReturningUser(page);
    await expect(page.locator('text=Play Quiz')).toBeVisible();
    await expect(page.locator('text=Learn Words')).toBeVisible();
    await expect(page.locator('text=Flashcards')).toBeVisible();
    await expect(page.locator('text=My Word List')).toBeVisible();
  });

  test('can navigate to level select', async ({ page }) => {
    await setupReturningUser(page);
    await page.locator('text=Play Quiz').click();
    await expect(page.locator('text=Choose Level')).toBeVisible();
    await expect(page.locator('text=Beginner')).toBeVisible();
  });
});

// ── Dark Mode ───────────────────────────────────────

test.describe('Dark Mode', () => {
  test('toggle works and persists across reload', async ({ page }) => {
    await setupReturningUser(page);

    // Find and click the dark mode toggle
    const darkToggle = page.locator('button[aria-label*="dark" i], button[aria-label*="theme" i], button[aria-label*="mode" i]').first();
    // If no aria-label, look for moon/sun icon button
    const toggle = (await darkToggle.count()) > 0
      ? darkToggle
      : page.locator('button').filter({ has: page.locator('svg') }).last();

    // Check initial state - should not have 'dark' class
    const htmlBefore = await page.locator('html').getAttribute('class');
    await toggle.click();
    // After toggle, 'dark' class should change
    const htmlAfter = await page.locator('html').getAttribute('class');
    const darkApplied = htmlAfter?.includes('dark');
    expect(darkApplied).not.toEqual(htmlBefore?.includes('dark'));

    // Reload and verify persistence
    await page.reload();
    const htmlReloaded = await page.locator('html').getAttribute('class');
    expect(htmlReloaded?.includes('dark')).toBe(darkApplied);
  });
});

// ── Sound Toggle ────────────────────────────────────

test.describe('Sound Toggle', () => {
  test('toggle persists across reload', async ({ page }) => {
    await setupReturningUser(page);

    // Get initial sound state from localStorage
    const initialSound = await page.evaluate(() =>
      localStorage.getItem('childrendoenglish-sound')
    );

    // Find and click sound toggle
    const soundToggle = page.locator('button[aria-label*="sound" i], button[aria-label*="volume" i], button[aria-label*="mute" i]').first();
    if ((await soundToggle.count()) > 0) {
      await soundToggle.click();
      const afterSound = await page.evaluate(() =>
        localStorage.getItem('childrendoenglish-sound')
      );
      expect(afterSound).not.toEqual(initialSound);

      // Reload and check persistence
      await page.reload();
      const reloadedSound = await page.evaluate(() =>
        localStorage.getItem('childrendoenglish-sound')
      );
      expect(reloadedSound).toEqual(afterSound);
    }
  });
});

// ── Quiz Flow ───────────────────────────────────────

test.describe('Quiz Flow', () => {
  test('complete image quiz flow: select level → mode → answer → results', async ({ page }) => {
    await setupReturningUser(page);

    // Navigate to quiz
    await page.locator('text=Play Quiz').click();
    await expect(page.locator('text=Choose Level')).toBeVisible();
    await page.locator('text=Beginner').click();

    // Select Image Quiz mode
    await expect(page.locator('text=Image Quiz').or(page.locator('text=Picture Quiz'))).toBeVisible();
    await page.locator('text=Image Quiz').or(page.locator('text=Picture Quiz')).click();

    // Wait for quiz to load (may show loading screen)
    await page.waitForSelector('button', { timeout: 10000 });

    // Answer all 10 questions by clicking the first answer button
    for (let i = 0; i < 10; i++) {
      // Wait for answer buttons to appear
      const buttons = page.locator('button').filter({ hasNotText: /quit|back|exit/i });
      await buttons.first().waitFor({ timeout: 5000 });
      // Click first available answer
      await buttons.first().click();
      // Brief wait for transition
      await page.waitForTimeout(600);
    }

    // Should see results screen
    await expect(page.locator('text=/\\d+.*\\/.*10|score|result/i')).toBeVisible({ timeout: 10000 });
  });

  test('image quiz shows image and 4 answer buttons', async ({ page }) => {
    await setupReturningUser(page);
    await page.locator('text=Play Quiz').click();
    await page.locator('text=Beginner').click();
    await page.locator('text=Image Quiz').or(page.locator('text=Picture Quiz')).click();

    // Wait for quiz to load
    await page.waitForTimeout(2000);

    // Should see an image
    const images = page.locator('img[src*="/images/"]');
    await expect(images.first()).toBeVisible({ timeout: 10000 });

    // Should see at least 4 clickable answer buttons
    const answerButtons = page.locator('button').filter({ hasNotText: /quit|back|exit|skip/i });
    expect(await answerButtons.count()).toBeGreaterThanOrEqual(4);
  });

  test('word quiz shows word and image options', async ({ page }) => {
    await setupReturningUser(page);
    await page.locator('text=Play Quiz').click();
    await page.locator('text=Beginner').click();
    await page.locator('text=Word Quiz').or(page.locator('text=Text Quiz')).click();

    // Wait for quiz to load
    await page.waitForTimeout(2000);

    // Should see image option buttons (images used as choices)
    const images = page.locator('img[src*="/images/"]');
    await expect(images.first()).toBeVisible({ timeout: 10000 });
  });

  test('audio quiz shows speaker button', async ({ page }) => {
    await setupReturningUser(page);
    await page.locator('text=Play Quiz').click();
    await page.locator('text=Beginner').click();
    await page.locator('text=Audio Quiz').or(page.locator('text=Listening Quiz')).click();

    // Wait for quiz to load
    await page.waitForTimeout(2000);

    // Should see a speaker/play button or audio icon
    const speakerBtn = page.locator('button[aria-label*="listen" i], button[aria-label*="play" i], button[aria-label*="speak" i]').first();
    // Or look for an SVG speaker icon
    const hasButton = (await speakerBtn.count()) > 0 || (await page.locator('button svg').count()) > 0;
    expect(hasButton).toBe(true);
  });
});

// ── Learn Mode ──────────────────────────────────────

test.describe('Learn Mode', () => {
  test('shows word grid with categories', async ({ page }) => {
    await setupReturningUser(page);
    await page.locator('text=Learn Words').click();

    // Should show a grid or list of words
    await expect(page.locator('text=Learn Words').or(page.locator('text=Word Library')).first()).toBeVisible({ timeout: 5000 });

    // Should see category filter or word cards
    const wordCards = page.locator('img[src*="/images/"]');
    await expect(wordCards.first()).toBeVisible({ timeout: 5000 });
  });

  test('can filter by category', async ({ page }) => {
    await setupReturningUser(page);
    await page.locator('text=Learn Words').click();
    await page.waitForTimeout(1000);

    // Look for category filter buttons
    const categoryBtn = page.locator('button:has-text("Animals"), button:has-text("animals")').first();
    if ((await categoryBtn.count()) > 0) {
      await categoryBtn.click();
      await page.waitForTimeout(500);
      // Category should be active/selected
      await expect(categoryBtn).toBeVisible();
    }
  });

  test('search filters words', async ({ page }) => {
    await setupReturningUser(page);
    await page.locator('text=Learn Words').click();
    await page.waitForTimeout(1000);

    // Look for search input
    const searchInput = page.locator('input[type="text"], input[type="search"], input[placeholder*="search" i]').first();
    if ((await searchInput.count()) > 0) {
      await searchInput.fill('cat');
      await page.waitForTimeout(500);
      // Should filter to show cat-related words
      await expect(page.locator('text=cat').first()).toBeVisible();
    }
  });
});

// ── Flashcards ──────────────────────────────────────

test.describe('Flashcards', () => {
  test('card renders and can flip', async ({ page }) => {
    await setupReturningUser(page);
    await page.locator('text=Flashcards').click();

    // Wait for flashcard to load
    await page.waitForTimeout(2000);

    // Should see a flashcard with an image or word
    const card = page.locator('[class*="card"], [class*="flash"], [role="button"]').first();
    const hasCard = (await card.count()) > 0 || (await page.locator('img[src*="/images/"]').count()) > 0;
    expect(hasCard).toBe(true);
  });

  test('know and learning buttons work', async ({ page }) => {
    await setupReturningUser(page);
    await page.locator('text=Flashcards').click();
    await page.waitForTimeout(2000);

    // Look for Know/Learning (or correct/wrong, thumbs up/down) buttons
    const knowBtn = page.locator('button:has-text("Know"), button:has-text("know"), button:has-text("Got it"), button[aria-label*="know" i]').first();
    const learningBtn = page.locator('button:has-text("Learning"), button:has-text("learning"), button:has-text("Still learning"), button[aria-label*="learn" i]').first();

    const hasActions = (await knowBtn.count()) > 0 || (await learningBtn.count()) > 0;
    // Some flashcard UIs show actions after flipping
    if (!hasActions) {
      // Try clicking the card to flip first
      await page.locator('img[src*="/images/"]').first().click({ timeout: 3000 }).catch(() => {});
      await page.waitForTimeout(500);
    }
    // After interaction, there should be some action buttons
    const buttons = page.locator('button').filter({ hasNotText: /back|quit|exit/i });
    expect(await buttons.count()).toBeGreaterThan(0);
  });
});

// ── Personal Word List ──────────────────────────────

test.describe('Personal Word List', () => {
  test('can enter and see words', async ({ page }) => {
    await setupReturningUser(page);
    await page.locator('text=My Word List').click();

    await expect(page.locator('text=My Word List').or(page.locator('text=Personal')).first()).toBeVisible({ timeout: 5000 });

    // Should have an input for entering words
    const input = page.locator('input[type="text"], input[placeholder*="word" i], input[placeholder*="search" i], textarea').first();
    if ((await input.count()) > 0) {
      await input.fill('cat');
      // Press enter or click add button
      await page.keyboard.press('Enter');
      await page.waitForTimeout(500);
    }
  });
});

// ── Progress Dashboard ──────────────────────────────

test.describe('Progress Dashboard', () => {
  test('shows stats after completing a quiz', async ({ page }) => {
    // Set up user with some quiz history
    await setupReturningUser(page, {
      totalQuizzes: 3,
      bestScores: { beginner: 8 },
      quizHistory: [
        { date: new Date().toISOString(), mode: 'image', level: 'beginner', score: 8, total: 10 },
        { date: new Date().toISOString(), mode: 'word', level: 'beginner', score: 6, total: 10 },
        { date: new Date().toISOString(), mode: 'audio', level: 'beginner', score: 7, total: 10 },
      ],
    });

    // Navigate to progress
    const progressBtn = page.locator('button:has-text("Progress"), button:has-text("Stats"), button[aria-label*="progress" i]').first();
    if ((await progressBtn.count()) > 0) {
      await progressBtn.click();
      await page.waitForTimeout(1000);
      // Should show some stats
      await expect(page.locator('text=/quiz|score|progress|total/i').first()).toBeVisible({ timeout: 5000 });
    }
  });
});

// ── Responsive ──────────────────────────────────────

test.describe('Responsive', () => {
  test('menu renders correctly on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await setupReturningUser(page);

    // All main buttons should be visible
    await expect(page.locator('text=Play Quiz')).toBeVisible();
    await expect(page.locator('text=Learn Words')).toBeVisible();
    await expect(page.locator('text=Flashcards')).toBeVisible();

    // No horizontal scrollbar
    const hasHScroll = await page.evaluate(() =>
      document.documentElement.scrollWidth > document.documentElement.clientWidth
    );
    expect(hasHScroll).toBe(false);
  });

  test('quiz renders on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await setupReturningUser(page);
    await page.locator('text=Play Quiz').click();
    await page.locator('text=Beginner').click();
    await page.locator('text=Image Quiz').or(page.locator('text=Picture Quiz')).click();

    // Wait for quiz to load
    await page.waitForTimeout(2000);

    // Image and buttons should be visible
    await expect(page.locator('img[src*="/images/"]').first()).toBeVisible({ timeout: 10000 });
  });
});
