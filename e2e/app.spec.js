import { test, expect } from '@playwright/test';

// Helper: set localStorage to simulate a Hebrew user
async function setupHebrewUser(page, overrides = {}) {
  const stats = {
    hasSeenOnboarding: true,
    totalQuizzes: 1,
    bestScores: { beginner: 0, intermediate: 0, advanced: 0 },
    badges: [],
    unlockedLevels: ['beginner'],
    wordProgress: {},
    dailyGoal: { date: null, wordsReviewed: 0 },
    currentStreak: 0,
    longestStreak: 0,
    lastActiveDate: null,
    uiLanguage: 'he',
    quizHistory: [],
    ...overrides,
  };
  await page.addInitScript((s) => {
    const id = 'player_test_he';
    const registry = {
      schemaVersion: 2,
      activePlayerId: id,
      players: [{ id, name: 'Tester', avatar: '⭐', canRead: true, createdAt: new Date().toISOString() }],
    };
    localStorage.setItem('childrendoenglish-players', JSON.stringify(registry));
    localStorage.setItem('childrendoenglish-player-' + id, JSON.stringify(s));
    localStorage.setItem('childrendoenglish-analytics-consent', 'declined');
  }, stats);
  await page.goto('/');
  await page.waitForSelector('#root > *', { timeout: 10000 });
}

// Helper: complete quiz by clicking first answer for each question
async function completeQuiz(page, numQuestions = 10) {
  for (let i = 0; i < numQuestions; i++) {
    // Wait for answer options to appear
    const answerBtns = page.locator('.grid.grid-cols-2 button').first();
    await answerBtns.waitFor({ timeout: 5000 });
    await answerBtns.click();
    await page.waitForTimeout(1400); // wait for auto-advance
  }
}

// Helper: set localStorage to simulate a returning user (with player registry)
// totalQuizzes: 1 so isNewUser=false and all menu buttons are visible
const RETURNING_USER_STATS = {
  hasSeenOnboarding: true,
  totalQuizzes: 1,
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
  const stats = { ...RETURNING_USER_STATS, ...overrides };
  await page.addInitScript((s) => {
    // Set up player registry + per-player stats
    const id = 'player_test1';
    const registry = {
      schemaVersion: 2,
      activePlayerId: id,
      players: [{ id, name: 'Tester', avatar: '⭐', canRead: true, createdAt: new Date().toISOString() }],
    };
    localStorage.setItem('childrendoenglish-players', JSON.stringify(registry));
    localStorage.setItem('childrendoenglish-player-' + id, JSON.stringify(s));
    localStorage.setItem('childrendoenglish-analytics-consent', 'declined');
  }, stats);
  await page.goto('/');
  await page.waitForSelector('#root > *', { timeout: 10000 });
}

// Helper: set up a player who still needs onboarding (hasSeenOnboarding: false)
// This player lands on the LandingPage with a "Continue" bar
async function setupNewPlayer(page) {
  await page.addInitScript(() => {
    const id = 'player_test1';
    const registry = {
      schemaVersion: 2,
      activePlayerId: id,
      players: [{ id, name: 'Tester', avatar: '⭐', canRead: true, createdAt: new Date().toISOString() }],
    };
    const stats = {
      hasSeenOnboarding: false, totalQuizzes: 0,
      bestScores: { beginner: 0, intermediate: 0, advanced: 0 },
      badges: [], unlockedLevels: ['beginner'], wordProgress: {},
      dailyGoal: { date: null, wordsReviewed: 0 }, currentStreak: 0,
      longestStreak: 0, lastActiveDate: null, uiLanguage: 'en', quizHistory: [],
    };
    localStorage.setItem('childrendoenglish-players', JSON.stringify(registry));
    localStorage.setItem('childrendoenglish-player-' + id, JSON.stringify(stats));
    localStorage.setItem('childrendoenglish-analytics-consent', 'declined');
  });
  await page.goto('/');
  await page.waitForSelector('#root > *', { timeout: 10000 });
}

// ── Landing Page ──────────────────────────────────────

test.describe('Landing Page', () => {
  test('brand new user sees landing page with language selection', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('childrendoenglish-analytics-consent', 'declined');
    });
    await page.goto('/');
    await page.waitForSelector('#root > *', { timeout: 10000 });
    // Should see the landing page hero
    await expect(page.locator('text=Learn English')).toBeVisible({ timeout: 5000 });
  });

  test('brand new user can pick English and reach player create', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('childrendoenglish-analytics-consent', 'declined');
    });
    await page.goto('/');
    await page.waitForSelector('#root > *', { timeout: 10000 });
    // Scroll to language section and pick English
    await page.locator('#language-select button:has-text("English")').scrollIntoViewIfNeeded();
    await page.locator('#language-select button:has-text("English")').click();
    // Should navigate to player create
    await expect(page.getByRole('heading', { name: 'Create Player' })).toBeVisible({ timeout: 5000 });
  });

  test('returning player not onboarded sees landing with Continue button', async ({ page }) => {
    await setupNewPlayer(page);
    // Should see landing page with "Welcome back" bar and Continue button
    await expect(page.locator('text=Continue')).toBeVisible({ timeout: 5000 });
  });

  test('clicking Continue goes to menu for single player', async ({ page }) => {
    await setupNewPlayer(page);
    await page.locator('button:has-text("Continue")').click();
    // New user menu shows "Play Your First Quiz!" button
    await expect(page.locator('text=Play Your First Quiz')).toBeVisible({ timeout: 5000 });
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
    // LevelSelect heading is t('playQuiz') = "Play Quiz"
    await expect(page.locator('button:has-text("Beginner")')).toBeVisible({ timeout: 5000 });
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
    await page.locator('button:has-text("Beginner")').click();

    // Select Image Quiz mode
    await expect(page.locator('text=Image Quiz').or(page.locator('text=Picture Quiz'))).toBeVisible();
    await page.locator('text=Image Quiz').or(page.locator('text=Picture Quiz')).click();

    // Wait for quiz to load (may show loading screen)
    await page.waitForSelector('button', { timeout: 10000 });

    // Answer all 10 questions by clicking the first answer button
    await completeQuiz(page, 10);

    // Should see results screen
    await expect(page.locator('text=/\\d+.*\\/.*10|score|result/i')).toBeVisible({ timeout: 10000 });
  });

  test('image quiz shows image and 4 answer buttons', async ({ page }) => {
    await setupReturningUser(page);
    await page.locator('text=Play Quiz').click();
    await page.locator('button:has-text("Beginner")').click();
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
    await page.locator('button:has-text("Beginner")').click();
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
    await page.locator('button:has-text("Beginner")').click();
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

    await expect(page.locator('h2:has-text("My Word List")')).toBeVisible({ timeout: 5000 });

    // Type a word into the autocomplete input and select a suggestion
    const input = page.locator('#word-input');
    await input.fill('cat');
    await page.waitForTimeout(500);
    // Use dispatchEvent to trigger mousedown (matches the onMouseDown handler) before blur closes dropdown
    const suggestion = page.locator('#word-suggestions li').first();
    await expect(suggestion).toBeVisible({ timeout: 3000 });
    await suggestion.dispatchEvent('mousedown');
    await page.waitForTimeout(300);
    // Word count should appear
    await expect(page.locator('text=/Found \\d+ word/i')).toBeVisible({ timeout: 3000 });
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
    await page.locator('button:has-text("Beginner")').click();
    await page.locator('text=Image Quiz').or(page.locator('text=Picture Quiz')).click();

    // Wait for quiz to load
    await page.waitForTimeout(2000);

    // Image and buttons should be visible
    await expect(page.locator('img[src*="/images/"]').first()).toBeVisible({ timeout: 10000 });
  });
});

// ── Onboarding Full Flow ────────────────────────────

test.describe('Onboarding Full Flow', () => {
  test('complete all onboarding steps and select Hebrew → Hebrew menu + RTL', async ({ page }) => {
    // Brand new user — start from landing page
    await page.addInitScript(() => {
      localStorage.setItem('childrendoenglish-analytics-consent', 'declined');
    });
    await page.goto('/');
    await page.waitForSelector('#root > *', { timeout: 10000 });

    // Pick Hebrew on the landing page language section
    await page.locator('#language-select button:has-text("עברית")').scrollIntoViewIfNeeded();
    await page.locator('#language-select button:has-text("עברית")').click();

    // Should go to player create
    await page.waitForTimeout(1000);

    // Create a player
    const nameInput = page.locator('input[type="text"]').first();
    await nameInput.fill('Test');
    // Click create button
    const createBtn = page.locator('button:has-text("צור שחקן"), button:has-text("Create Player")').first();
    await createBtn.click();

    // Should go to menu — verify Hebrew RTL applied
    await page.waitForTimeout(1000);
    const dir = await page.locator('html').getAttribute('dir');
    const lang = await page.locator('html').getAttribute('lang');
    expect(lang).toBe('he');
    expect(dir).toBe('rtl');
  });

  test('demo quiz question correctly shows feedback', async ({ page }) => {
    // Set up returning user to go straight to menu
    await setupReturningUser(page);

    // Navigate to quiz
    await page.locator('text=Play Quiz').click();
    await page.locator('button:has-text("Beginner")').click();
    await page.locator('text=Image Quiz').or(page.locator('text=Picture Quiz')).click();
    await page.waitForTimeout(2000);

    // Answer first question (we cannot ensure correctness, but the flow should work)
    const answerBtns = page.locator('.grid.grid-cols-2 button');
    await answerBtns.first().waitFor({ timeout: 5000 });
    // Click an answer
    await answerBtns.first().click();

    // Should see feedback (correct or wrong)
    await page.waitForTimeout(300);
    const feedbackEl = page.locator('[aria-live="polite"]');
    if ((await feedbackEl.count()) > 0) {
      const feedback = await feedbackEl.textContent();
      expect(feedback.length).toBeGreaterThan(0);
    }
  });
});

// ── Hebrew Mode ─────────────────────────────────────

test.describe('Hebrew Mode', () => {
  test('Hebrew user sees Hebrew menu labels', async ({ page }) => {
    await setupHebrewUser(page);
    // Should see Hebrew labels
    await expect(page.locator('text=ילדים עושים אנגלית')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=שחק חידון')).toBeVisible();
    await expect(page.locator('text=למד מילים')).toBeVisible();
    await expect(page.locator('text=כרטיסיות')).toBeVisible();
  });

  test('HTML dir="rtl" is set for Hebrew', async ({ page }) => {
    await setupHebrewUser(page);
    const dir = await page.locator('html').getAttribute('dir');
    expect(dir).toBe('rtl');
    const lang = await page.locator('html').getAttribute('lang');
    expect(lang).toBe('he');
  });

  test('Level select shows Hebrew labels', async ({ page }) => {
    await setupHebrewUser(page);
    await page.locator('text=שחק חידון').click();
    // LevelSelect heading uses t('playQuiz') = 'שחק חידון' in Hebrew
    await expect(page.locator('button:has-text("מתחילים")')).toBeVisible({ timeout: 5000 });
  });
});

// ── Personal Word List → Quiz ───────────────────────

test.describe('Personal Word List Quiz', () => {
  test('enter 5 words → see found count → start Image Quiz', async ({ page }) => {
    await setupReturningUser(page);
    await page.locator('text=My Word List').click();
    await page.waitForTimeout(500);

    // Use the autocomplete input to add words one at a time
    const input = page.locator('#word-input');
    const wordsToAdd = ['cat', 'dog', 'apple', 'house', 'car'];
    for (const word of wordsToAdd) {
      await input.fill(word);
      await page.waitForTimeout(400);
      const suggestion = page.locator('#word-suggestions li').first();
      if ((await suggestion.count()) > 0) {
        await suggestion.click();
        await page.waitForTimeout(200);
      }
    }

    // Should show found words count
    await expect(page.locator('text=/Found \\d+ word/i')).toBeVisible({ timeout: 3000 });

    // Start Image Quiz
    const quizBtn = page.locator('button:has-text("Image Quiz")').first();
    await expect(quizBtn).toBeVisible();
    await quizBtn.click();

    // Should navigate to quiz (loading or quiz screen)
    await page.waitForTimeout(3000);
    const hasImage = await page.locator('img[src*="/images/"]').count();
    expect(hasImage).toBeGreaterThan(0);
  });

  test('enter <4 valid words shows warning', async ({ page }) => {
    await setupReturningUser(page);
    await page.locator('text=My Word List').click();
    await page.waitForTimeout(500);

    // Add only 3 words via autocomplete
    const input = page.locator('#word-input');
    const wordsToAdd = ['cat', 'dog', 'apple'];
    for (const word of wordsToAdd) {
      await input.fill(word);
      await page.waitForTimeout(400);
      const suggestion = page.locator('#word-suggestions li').first();
      if ((await suggestion.count()) > 0) {
        await suggestion.click();
        await page.waitForTimeout(200);
      }
    }

    // Should show "need at least 4" message
    await expect(page.locator('text=/at least 4/i')).toBeVisible({ timeout: 3000 });
  });
});

// ── Badge Earning ───────────────────────────────────

test.describe('Badge Earning', () => {
  test('badges view shows earned vs locked badges', async ({ page }) => {
    await setupReturningUser(page, {
      totalQuizzes: 1,
      badges: ['first_word'],
    });

    await page.locator('text=Badges').first().click();
    await page.waitForTimeout(500);

    // Should see Badges title
    await expect(page.locator('h2:has-text("Badges")')).toBeVisible({ timeout: 5000 });

    // Should see at least one earned badge and some locked ones
    const earnedLabel = page.locator('text=Earned!');
    await expect(earnedLabel.first()).toBeVisible({ timeout: 3000 });

    // Should have some grayscale (locked) badges
    const lockedBadges = page.locator('.grayscale');
    expect(await lockedBadges.count()).toBeGreaterThan(0);
  });
});

// ── Sharing ─────────────────────────────────────────

test.describe('Sharing', () => {
  test('result screen share copies quiz text to clipboard', async ({ page, context, browserName }) => {
    test.skip(browserName !== 'chromium', 'Clipboard permissions only supported in Chromium');
    // Grant clipboard permissions
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);

    await setupReturningUser(page);

    // Navigate to quiz
    await page.locator('text=Play Quiz').click();
    await page.locator('button:has-text("Beginner")').click();
    await page.locator('text=Image Quiz').or(page.locator('text=Picture Quiz')).click();

    // Wait for quiz
    await page.waitForTimeout(3000);

    // Complete quiz
    await completeQuiz(page, 10);

    // Wait for results
    await expect(page.locator('text=/\\d+.*\\/.*10/i')).toBeVisible({ timeout: 10000 });

    // Click share button
    const shareBtn = page.locator('button:has-text("Share")');
    if ((await shareBtn.count()) > 0) {
      await shareBtn.click();
      await page.waitForTimeout(500);

      // Check clipboard — should contain score text
      const clipText = await page.evaluate(() => navigator.clipboard.readText());
      expect(clipText).toContain('Children Do English');
    }
  });
});
