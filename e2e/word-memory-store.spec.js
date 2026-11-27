import { test, expect } from '@playwright/test';
import { forceLadderArm } from './lib/ladder-arm.mjs';

// One word memory (owner OK 11-18): a game posts its first-try result per word to the shared inbox
// (public/word-mem.js), its end card offers "words to review today (N)", and the app folds the inbox
// into the player and opens the short review. Guests' answers wait for a player.
const INBOX = 'childrendoenglish-word-inbox';

async function seedPlayer(page, extra = {}) {
  await page.addInitScript((x) => {
    if (sessionStorage.getItem('seeded')) return;
    sessionStorage.setItem('seeded', '1');
    localStorage.setItem('childrendoenglish-analytics-consent', 'declined');
    const player = { id: 'p1', name: 'Kid', avatar: '🦊', canRead: true, createdAt: new Date().toISOString() };
    localStorage.setItem('childrendoenglish-players', JSON.stringify({ schemaVersion: 2, players: [player], activePlayerId: 'p1' }));
    localStorage.setItem('childrendoenglish-player-p1', JSON.stringify({ totalQuizzes: 2, hasSeenOnboarding: true, ...x }));
  }, extra);
}

async function zapperRun(page) {
  await page.route('**/api/**', (r) => r.fulfill({ status: 204 }));
  await page.goto('/games/word-zapper/index.html');
  await page.waitForFunction(() => window.WZ && window.CDE_END && window.CDE_WORD && window.CDE_WORDMEM);
  await page.evaluate(() => WZ.start());
  await page.waitForFunction(() => WZ.dbg.targetWord());
  const missed = await page.evaluate(() => { const w = WZ.dbg.targetWord(); WZ.dbg.wrongForTest(); WZ.dbg.solveForTest(); return w; });
  await page.waitForFunction((m) => WZ.dbg.targetWord() && WZ.dbg.targetWord() !== m, missed);
  const right = await page.evaluate(() => { const w = WZ.dbg.targetWord(); WZ.dbg.solveForTest(); return w; });
  return { missed, right };
}
// let targets fall until the shields are gone: the real game-over screen calls CDE_END itself
async function zapperOver(page) {
  for (let i = 0; i < 12; i++) {
    if (await page.evaluate(() => WZ.dbg.screen === 'over')) break;
    await page.waitForFunction(() => WZ.dbg.hasTargetSprite() || WZ.dbg.screen === 'over');
    await page.evaluate(() => WZ.dbg.dropTarget());
    await page.waitForTimeout(300);
  }
  await page.waitForFunction(() => WZ.dbg.screen === 'over');
}
const missedIds = (inbox) => [...new Set(inbox.filter((e) => !e.ok).map((e) => e.w))];

// Written for the TREATMENT arm of the ladder-next split by device (src/utils/ladderArm.js): force arm 1 (Playwright's
// webdriver flag would otherwise give every page the control arm). The control arm: e2e/ladder-arm.spec.js.
test.beforeEach(async ({ page }) => { await forceLadderArm(page, 1); });

test('Word Zapper writes first-try results; its end card opens the review with the missed word', async ({ page }) => {
  await seedPlayer(page);
  const { missed, right } = await zapperRun(page);
  let inbox = await page.evaluate((k) => JSON.parse(localStorage.getItem(k)), INBOX);
  expect(inbox.map((e) => [e.w, e.ok, e.p, e.s])).toEqual([[missed, 0, 'p1', 'g-word-zapper'], [right, 1, 'p1', 'g-word-zapper']]);

  await zapperOver(page); // each fallen target is a miss for its word
  inbox = await page.evaluate((k) => JSON.parse(localStorage.getItem(k)), INBOX);
  const toReview = Math.min(missedIds(inbox).length, 10);
  const link = page.locator('.cde-end .cde-review');
  await expect(link).toBeVisible();
  await expect(link).toContainText(`Words to review today (${toReview})`);
  await expect(link).toHaveAttribute('href', '/app?review=1');
  await expect(page.locator('.cde-end [data-kdm-primary]')).toHaveCount(1); // still one primary action (P1)

  await link.click();
  await expect(page.getByText('Daily Review')).toBeVisible({ timeout: 10000 });
  await expect(page.getByText(new RegExp(`Question 1 of ${toReview}`))).toBeVisible();
  const after = await page.evaluate((k) => ({ inbox: localStorage.getItem(k), wp: JSON.parse(localStorage.getItem('childrendoenglish-player-p1')).wordProgress }), INBOX);
  expect(after.inbox).toBeNull();
  expect(after.wp[missed]).toMatchObject({ interval: 1, wrong: 1 });
  if (!missedIds(inbox).includes(right)) expect(after.wp[right]).toMatchObject({ interval: 3, correct: 1 });
});

test('a ladder arrival keeps "Back to my words" as its only door (no review link)', async ({ page }) => {
  await seedPlayer(page);
  await page.route('**/api/**', (r) => r.fulfill({ status: 204 }));
  await page.goto('/games/category-conveyor/index.html?words=cat,dog,apple,bus&from=ladder');
  await page.waitForFunction(() => window.CC && window.CDE_END && window.CDE_WORDMEM);
  await page.evaluate(() => { window.CDE_WORD('cat', false); window.CDE_END({ game: 'category-conveyor', again: document.getElementById('againBtn'), good: true }); });
  await expect(page.locator('.cde-end [data-kdm-primary]')).toContainText('Back to my words');
  await expect(page.locator('.cde-end .cde-review')).toHaveCount(0);
});

test('a guest\'s game answers wait for a player; the review link brings them along', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('childrendoenglish-analytics-consent', 'declined'));
  const { missed } = await zapperRun(page);
  const inbox = await page.evaluate((k) => JSON.parse(localStorage.getItem(k)), INBOX);
  expect(inbox.every((e) => !e.p)).toBe(true);
  await zapperOver(page);
  const link = page.locator('.cde-end .cde-review');
  await expect(link).toHaveAttribute('href', '/new-player?review=1');
  await link.click();
  await page.getByRole('button', { name: 'Start playing' }).click();
  await expect(page.getByText('Daily Review')).toBeVisible({ timeout: 10000 });
  const wp = await page.evaluate(() => {
    const { activePlayerId } = JSON.parse(localStorage.getItem('childrendoenglish-players'));
    return JSON.parse(localStorage.getItem('childrendoenglish-player-' + activePlayerId)).wordProgress;
  });
  expect(wp[missed]).toMatchObject({ interval: 1, wrong: 1 });
});

test('a brand-new player without the review link starts fresh (guest answers stay waiting)', async ({ page }) => {
  await page.addInitScript(() => {
    if (sessionStorage.getItem('seeded')) return;
    sessionStorage.setItem('seeded', '1');
    localStorage.setItem('childrendoenglish-analytics-consent', 'declined');
    localStorage.setItem('childrendoenglish-word-inbox', JSON.stringify([{ w: 'cat', ok: 0, t: Date.now(), s: 'g-word-zapper' }]));
  });
  await page.goto('/new-player');
  await page.getByRole('button', { name: 'Start playing' }).click();
  await expect(page.getByText(/Word batch 1/)).toBeVisible({ timeout: 10000 });
  const st = await page.evaluate(() => {
    const { activePlayerId } = JSON.parse(localStorage.getItem('childrendoenglish-players'));
    return { wp: JSON.parse(localStorage.getItem('childrendoenglish-player-' + activePlayerId)).wordProgress, inbox: localStorage.getItem('childrendoenglish-word-inbox') };
  });
  expect(st.wp).toEqual({});
  expect(JSON.parse(st.inbox)).toHaveLength(1);
});

// app.spec.js's helper: answer the first option until the result screen ("/ n") shows
async function completeQuiz(page, n) {
  const result = page.locator(`span:text-is("/ ${n}")`);
  for (let i = 0; i < n + 6; i++) {
    if (await result.isVisible()) break;
    const answerBtns = page.locator('.grid.grid-cols-2 button').first();
    await answerBtns.waitFor({ timeout: 5000 });
    const bar = page.locator('[role="progressbar"]');
    const before = await bar.getAttribute('aria-valuenow').catch(() => null);
    await answerBtns.click();
    await expect.poll(async () => (await result.isVisible()) || (await bar.getAttribute('aria-valuenow').catch(() => null)) !== before,
      { timeout: 10000 }).toBe(true);
  }
  await expect(result).toBeVisible({ timeout: 5000 });
}

test('a free quiz result shows the review card and it opens Daily Review', async ({ page }) => {
  // a word missed an hour ago (not in the quiz) → at least 1 to review whatever the quiz answers are
  await seedPlayer(page, { wordProgress: { zebra: { lastSeen: Date.now() - 3600000, interval: 1, correct: 0, wrong: 1 } } });
  await page.goto('/');
  await page.waitForSelector('#root > *', { timeout: 10000 });
  await expect(page.getByText(/Word batch 1/)).toBeVisible({ timeout: 8000 });
  await page.evaluate(() => { location.hash = '#quiz/image/cat,dog,apple,bus'; });
  await expect(page.getByRole('button', { name: 'Quit quiz' })).toBeVisible({ timeout: 10000 });
  await completeQuiz(page, 4);
  const card = page.getByTestId('review-today');
  await expect(card).toBeVisible({ timeout: 10000 });
  await expect(card).toContainText(/Words to review today \(\d+\)/);
  await card.click();
  await expect(page.getByText('Daily Review')).toBeVisible({ timeout: 10000 });
});
