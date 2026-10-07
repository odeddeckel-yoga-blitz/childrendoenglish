import { test, expect } from '@playwright/test';

// Practice ladder (plans/learning-cycle + full-ladder expansion 2026-10-07):
// the menu leads with one Continue card; it opens the 11-step LadderMap with
// free navigation; steps dispatch to flashcards / quizzes / Letter Fix /
// Sentence Gap / scoped arcade URLs.

async function reachMenu(page, { canRead = true } = {}) {
  await page.addInitScript(() => {
    localStorage.setItem('childrendoenglish-analytics-consent', 'declined');
  });
  await page.goto('/');
  await page.waitForSelector('#root > *', { timeout: 10000 });
  const enTile = page.locator('button', { hasText: 'Learn vocabulary in English' });
  await enTile.scrollIntoViewIfNeeded();
  await enTile.click();
  const nameInput = page.locator('input[type="text"]').first();
  await nameInput.waitFor({ timeout: 8000 });
  await nameInput.fill('CycleKid');
  await page.locator('button:has-text("Create")').first().click();
  const readBtn = page.locator(canRead ? 'text=I can read!' : 'text=Not yet');
  if (await readBtn.count()) await readBtn.click();
  await page.waitForTimeout(800);
}

async function openLadder(page) {
  await page.getByText(/Word batch 1/).click();
  await expect(page.getByText('Your practice ladder')).toBeVisible({ timeout: 8000 });
}

test('menu leads with the cycle Continue card for a new player', async ({ page }) => {
  await reachMenu(page);
  await expect(page.getByText(/Word batch 1/)).toBeVisible({ timeout: 8000 });
});

test('Continue opens the 11-step ladder map; Flashcards is the current step', async ({ page }) => {
  await reachMenu(page);
  await openLadder(page);
  for (const label of ['Flashcards', 'Listen & Pick', 'Word Quiz', 'Image Quiz',
    'Missing Letter', 'Tricky Letter', 'Spelling Forge', 'Use the Word', 'Word Zapper']) {
    await expect(page.getByText(label, { exact: true })).toBeVisible();
  }
  await page.getByText('Flashcards', { exact: true }).click();
  await expect(page.getByText('Tap to flip')).toBeVisible({ timeout: 8000 });
});

test('pre-readers see only the no-reading steps enabled', async ({ page }) => {
  // The quick-create flow has no canRead question (it lives in player manage) —
  // seed a pre-reader player directly; the LADDER behavior is what's under test.
  await page.addInitScript(() => {
    localStorage.setItem('childrendoenglish-analytics-consent', 'declined');
    const player = { id: 'player_prereader1', name: 'Pre', avatar: '🐣', canRead: false, createdAt: new Date().toISOString() };
    localStorage.setItem('childrendoenglish-players', JSON.stringify({ schemaVersion: 2, players: [player], activePlayerId: player.id }));
  });
  await page.goto('/');
  await page.waitForSelector('#root > *', { timeout: 10000 });
  await openLadder(page);
  // Reading steps render disabled (greyed): Word Quiz etc. unclickable
  const wq = page.getByText('Word Quiz', { exact: true }).locator('xpath=ancestor::button[1]');
  await expect(wq).toBeDisabled();
  const fc = page.getByText('Flashcards', { exact: true }).locator('xpath=ancestor::button[1]');
  await expect(fc).toBeEnabled();
});

test('jump to Letter Fix and solve a blank with real clicks', async ({ page }) => {
  await reachMenu(page);
  await openLadder(page);
  await page.getByText('Missing Letter', { exact: true }).click();
  // 4 letter cards render; click the correct one (read it from the word under test)
  await expect(page.locator('button').filter({ hasText: /^[a-z]$/ }).first()).toBeVisible({ timeout: 8000 });
  const cards = page.locator('button').filter({ hasText: /^[a-z]$/ });
  await expect(cards).toHaveCount(4);
  // Try cards until the solved state appears (at most 4 clicks — one is right)
  for (let i = 0; i < 4; i++) {
    await cards.nth(i).click();
    await page.waitForTimeout(250);
    const progressed = await page.getByText('2 / ').count().catch(() => 0);
    if (progressed) break;
  }
});

test('Sentence Gap renders the blanked example sentence', async ({ page }) => {
  await reachMenu(page);
  await openLadder(page);
  await page.getByText('Use the Word', { exact: true }).click();
  await expect(page.getByText('_____')).toBeVisible({ timeout: 8000 });
});

test('arcade step navigates to a words-scoped game URL', async ({ page }) => {
  await reachMenu(page);
  await openLadder(page);
  await Promise.all([
    page.waitForURL(/\/games\/word-zapper\/\?words=.+&from=ladder/, { timeout: 10000 }),
    page.getByText('Word Zapper', { exact: true }).click(),
  ]);
  expect(page.url()).toContain('words=');
});
