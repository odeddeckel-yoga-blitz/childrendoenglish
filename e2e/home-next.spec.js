import { test, expect } from '@playwright/test';
import { forceLadderArm } from './lib/ladder-arm.mjs';

// Returning home "Next" (home-next, owner 11-21; owner D4 11-26 via Factory A254: for EVERY returning player, no
// 50/50 split, no separate 4-step path). Returning = the oldest player was created ≥ 2 h before this page load; a
// first visit keeps today's home. The path on the card is the 5-step ladder.

const DAY = 86400000;
const PID = 'player_hn';
const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };

async function seed(page, { name = 'Maya', autoName = false, wordProgress = {}, cycle, totalQuizzes = 3, ageMs = 3 * DAY } = {}) {
  await page.addInitScript((o) => {
    try { sessionStorage.setItem('cde-menu-more', '0'); } catch { /* ignore */ }
    if (window.speechSynthesis) {
      try { window.speechSynthesis.speak = () => {}; window.speechSynthesis.cancel = () => {}; } catch { /* read-only */ }
    }
    if (localStorage.getItem('childrendoenglish-players')) return; // seed once; later loads keep what the app saved
    const player = { id: o.PID, name: o.name, avatar: '🦊', canRead: true, createdAt: new Date(Date.now() - o.ageMs).toISOString() };
    if (o.autoName) player.autoName = true;
    localStorage.setItem('childrendoenglish-players', JSON.stringify({ schemaVersion: 2, activePlayerId: o.PID, players: [player] }));
    const stats = {
      hasSeenOnboarding: true, totalQuizzes: o.totalQuizzes, bestScores: { beginner: 0, intermediate: 0, advanced: 0 },
      badges: [], unlockedLevels: ['beginner'], wordProgress: o.wordProgress, dailyGoal: { date: null, wordsReviewed: 0 },
      currentStreak: 0, longestStreak: 0, lastActiveDate: null, uiLanguage: 'en', quizHistory: [],
    };
    if (o.cycle) stats.cycle = o.cycle;
    localStorage.setItem('childrendoenglish-player-' + o.PID, JSON.stringify(stats));
    localStorage.setItem('childrendoenglish-analytics-consent', 'declined');
  }, { PID, name, autoName, wordProgress, cycle, totalQuizzes, ageMs, DAY });
  await page.goto('/');
  await page.waitForSelector('#root > *', { timeout: 10000 });
}

// three words missed on an earlier visit (last answer wrong → SR interval 1), one answered right
const MISSED = (now) => ({
  cat: { lastSeen: now - DAY, interval: 1, easeFactor: 2.5, correct: 0, wrong: 1 },
  dog: { lastSeen: now - DAY, interval: 1, easeFactor: 2.5, correct: 1, wrong: 2 },
  apple: { lastSeen: now - 2 * DAY, interval: 1, easeFactor: 2.5, correct: 0, wrong: 1 },
  ball: { lastSeen: now - DAY, interval: 3, easeFactor: 2.5, correct: 1, wrong: 0 },
});

// Written for the TREATMENT arm of the ladder-next split by device (src/utils/ladderArm.js): force arm 1 (Playwright's
// webdriver flag would otherwise give every page the control arm). The control arm: e2e/ladder-arm.spec.js.
test.beforeEach(async ({ page }) => { await forceLadderArm(page, 1); });

test('returning named player with misses: the Next card re-quizzes exactly those words', async ({ page }) => {
  await seed(page, { wordProgress: MISSED(Date.now()) });
  const card = page.getByTestId('next-card');
  await expect(card).toHaveAttribute('data-kind', 'mreq');
  await expect(card).toContainText('Words for Maya to try again');
  await expect(card).toContainText('A quick quiz with 3 words');
  await expect(page.getByTestId('words-learned')).toHaveText('2 words learned');
  await expect(page.getByText('Continue learning')).toHaveCount(0);
  await expect(page.getByText(/words mastered/)).toHaveCount(0);

  await card.getByText(/Words for/).click();
  const result = page.locator('span:text-is("/ 3")');
  for (let i = 0; i < 12; i++) {
    if (await result.isVisible()) break;
    const opt = page.locator('.grid.grid-cols-2 button').first();
    await opt.waitFor({ timeout: 8000 });
    const bar = page.locator('[role="progressbar"]');
    const before = await bar.getAttribute('aria-valuenow').catch(() => null);
    await opt.click();
    await expect.poll(async () => (await result.isVisible()) || (await bar.getAttribute('aria-valuenow').catch(() => null)) !== before,
      { timeout: 10000 }).toBe(true);
  }
  await expect(result).toBeVisible();
  // play-next was NOT ported (not in D4): no play-next card on the result screen
  await expect(page.getByTestId('play-next')).toHaveCount(0);
});

test('"Not me" opens the player picker', async ({ page }) => {
  await seed(page, { wordProgress: MISSED(Date.now()) });
  await page.getByTestId('not-me').click();
  await expect(page.locator('[role="dialog"]').first()).toBeVisible();
});

test('the unnamed default player never gets the missed-words card (path instead)', async ({ page }) => {
  await seed(page, { name: 'Player 1', autoName: true, wordProgress: MISSED(Date.now()) });
  await expect(page.getByTestId('next-card')).toHaveAttribute('data-kind', 'path');
  await expect(page.getByTestId('not-me')).toHaveCount(0);
});

test('an 11-step saved stage shows on the 5-step path (no 4-step path); More is short; the rest is under For grown-ups', async ({ page }) => {
  await seed(page, { cycle: { batch: 0, stage: 9 } }); // v1 'sent' = every core step but zap done
  const card = page.getByTestId('next-card');
  await expect(card).toHaveAttribute('data-kind', 'path');
  await expect(card).toContainText(/Step (5 of 5|4 of 4): Word Zapper/);
  await expect.poll(() => page.evaluate((k) => JSON.parse(localStorage.getItem(k)).cycle, 'childrendoenglish-player-' + PID))
    .toMatchObject({ batch: 0, v: 2 });
  await expect(page.getByTestId('words-learned')).toHaveText('Every word you try helps you learn!');
  const more = page.getByTestId('menu-more');
  await more.locator('summary').click();
  await expect(more.getByText('My Word List')).toHaveCount(0);
  await page.getByText(/For grown-ups/).click();
  await expect(page.getByText('My Word List')).toBeVisible();
});

test('a batch finished today: the Next card offers a new game, the path one tap away', async ({ page }) => {
  await seed(page, { cycle: { batch: 1, stage: 0, v: 2, doneDay: today() } });
  const card = page.getByTestId('next-card');
  await expect(card).toHaveAttribute('data-kind', 'game');
  await expect(card).toContainText('Try a new game: Word Zapper');
  await expect(card).toHaveAttribute('href', '/games/word-zapper/');
  await expect(page.getByTestId('path-line')).toBeVisible();
});

test('finishing a batch (Word Zapper launch) makes the next home suggest a game not yet played', async ({ page }) => {
  await page.route('**/api/**', (r) => r.fulfill({ status: 204 }));
  await seed(page, { cycle: { batch: 0, stage: 4, v: 2 } }); // zap = the last core step
  await expect(page.getByTestId('next-card')).toHaveAttribute('data-kind', 'path');
  await page.getByTestId('next-card').click();
  await page.waitForURL(/\/games\/word-zapper\/\?words=.*from=ladder/, { timeout: 10000 });
  const cycle = await page.evaluate((k) => JSON.parse(localStorage.getItem(k)).cycle, 'childrendoenglish-player-' + PID);
  expect(cycle).toMatchObject({ batch: 1, stage: 0, v: 2, doneDay: today() });
  await page.goto('/');
  const card = page.getByTestId('next-card');
  await expect(card).toHaveAttribute('data-kind', 'game');
  // Word Zapper was just launched from the app, so the card skips it
  await expect(card).toContainText('Try a new game: Missing Letter');
});

test('a player made under 2 h ago (same sitting) keeps today\'s home', async ({ page }) => {
  await seed(page, { ageMs: 10 * 60 * 1000, wordProgress: MISSED(Date.now()) });
  await expect(page.getByText('Continue learning')).toBeVisible();
  await expect(page.getByTestId('next-card')).toHaveCount(0);
});

test('the first visit is unchanged: landing page, then a new player gets today\'s home', async ({ page }) => {
  await page.addInitScript(() => { localStorage.setItem('childrendoenglish-analytics-consent', 'declined'); });
  await page.goto('/');
  await page.waitForSelector('#root > *', { timeout: 10000 });
  const enTile = page.locator('button', { hasText: 'Learn vocabulary in English' });
  await enTile.scrollIntoViewIfNeeded();
  await enTile.click();
  await page.getByRole('button', { name: 'Start playing' }).click();
  await expect(page.getByText(/Word batch 1/)).toBeVisible({ timeout: 8000 });
  await expect(page.getByTestId('next-card')).toHaveCount(0);
});
