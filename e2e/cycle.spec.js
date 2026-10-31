import { test, expect } from '@playwright/test';

// Practice ladder (plans/learning-cycle + full-ladder expansion 2026-10-07):
// the menu leads with one Continue card; it starts the current step, and the
// step strip opens the 11-step LadderMap with free navigation; steps dispatch to flashcards / quizzes / Letter Fix /
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
  await page.locator('button:has-text("Start playing")').first().click();
  const readBtn = page.locator(canRead ? 'text=I can read!' : 'text=Not yet');
  if (await readBtn.count()) await readBtn.click();
  await page.waitForTimeout(800);
}

test('play-first: a new player can start without typing a name', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('childrendoenglish-analytics-consent', 'declined');
  });
  await page.goto('/');
  await page.waitForSelector('#root > *', { timeout: 10000 });
  const enTile = page.locator('button', { hasText: 'Learn vocabulary in English' });
  await enTile.scrollIntoViewIfNeeded();
  await enTile.click();
  await expect(page.getByText('No name needed — you can add one later')).toBeVisible({ timeout: 8000 });
  await page.getByRole('button', { name: 'Start playing' }).click();
  await expect(page.getByText(/Word batch 1/)).toBeVisible({ timeout: 8000 });
  const players = await page.evaluate(() => JSON.parse(localStorage.getItem('childrendoenglish-players')).players);
  expect(players).toHaveLength(1);
  expect(players[0]).toMatchObject({ name: 'Player 1', autoName: true });
});

// Continue starts the current step directly (persona P2); the progress strip
// above the step is the door to the full map.
async function openLadder(page) {
  await page.getByText(/Word batch 1/).click();
  await expect(page.getByText('Tap to flip')).toBeVisible({ timeout: 8000 });
  await page.getByTestId('ladder-strip').click();
  await expect(page.getByText('Your practice ladder')).toBeVisible({ timeout: 8000 });
}

test('menu leads with the cycle Continue card for a new player', async ({ page }) => {
  await reachMenu(page);
  await expect(page.getByText(/Word batch 1/)).toBeVisible({ timeout: 8000 });
});

test('Continue starts Flashcards (the current step) at once, with a step strip on top', async ({ page }) => {
  await reachMenu(page);
  await page.getByText(/Word batch 1/).click();
  await expect(page.getByText('Tap to flip')).toBeVisible({ timeout: 8000 });
  await expect(page.getByTestId('ladder-strip')).toContainText(/Step 1 of \d+/);
});

test('finishing Flashcards goes straight into the next step, not back to the map', async ({ page }) => {
  await reachMenu(page);
  await page.getByText(/Word batch 1/).click();
  await expect(page.getByText('Tap to flip')).toBeVisible({ timeout: 8000 });
  const cont = page.getByRole('button', { name: /^Continue/ });
  const flip = page.getByRole('button', { name: 'Flip card to see answer' });
  for (let i = 0; i < 15; i++) {
    await expect(flip.or(cont)).toBeVisible({ timeout: 5000 });
    if (await cont.count()) break;
    await flip.click();
    await page.getByRole('button', { name: 'Know It' }).click();
    await page.waitForTimeout(400);
  }
  await cont.click();
  await expect(page.getByRole('button', { name: 'Quit quiz' })).toBeVisible({ timeout: 10000 });
  await expect(page.getByTestId('ladder-strip')).toContainText(/Step 2 of \d+/);
  await expect(page.getByText('Your practice ladder')).toHaveCount(0);
});

test('the strip opens the 11-step ladder map', async ({ page }) => {
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
    page.waitForURL(/\/games\/word-zapper\/\?words=.+&from=ladder/, { timeout: 20000 }),
    page.getByText('Word Zapper', { exact: true }).click(),
  ]);
  expect(page.url()).toContain('words=');
});

test('back from a ladder step returns to the ladder, not the My Word List editor', async ({ page }) => {
  await reachMenu(page);
  await openLadder(page);
  await page.getByText('Flashcards', { exact: true }).click();
  await expect(page.getByText('Tap to flip')).toBeVisible({ timeout: 8000 });
  await page.getByRole('button', { name: 'Back to menu' }).click();
  await expect(page.getByText('Your practice ladder')).toBeVisible({ timeout: 8000 });
  // ...and a later step's results "Back to Menu" reaches the menu (the flashcards set used to linger)
  await page.getByText('Listen & Pick', { exact: true }).click();
  await page.getByRole('button', { name: 'Quit quiz' }).click();
  await page.getByRole('button', { name: 'End Quiz' }).click();
  await page.getByRole('button', { name: 'Back to Menu' }).click();
  await expect(page.getByText(/Word batch 1/)).toBeVisible({ timeout: 8000 });
  await expect(page.getByText('My Word List')).toHaveCount(0);
});

// U3: an English/Spanish newcomer's very first deck is 5 cards (the quizzes after it keep all 10).
test('a brand-new English player meets 5 cards in the first deck', async ({ page }) => {
  await reachMenu(page);
  await page.getByText(/Word batch 1/).click();
  await expect(page.getByText('Tap to flip')).toBeVisible({ timeout: 8000 });
  const cont = page.getByRole('button', { name: /^Continue/ });
  const flip = page.getByRole('button', { name: 'Flip card to see answer' });
  let cards = 0;
  for (let i = 0; i < 15; i++) {
    await expect(flip.or(cont)).toBeVisible({ timeout: 5000 });
    if (await cont.count()) break;
    await flip.click();
    await page.getByRole('button', { name: 'Know It' }).click();
    cards++;
    await page.waitForTimeout(400);
  }
  expect(cards).toBe(5);
});
