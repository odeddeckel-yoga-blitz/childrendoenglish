import { test, expect } from '@playwright/test';
import { forceLadderArm, realLadderArm } from './lib/ladder-arm.mjs';

// The ladder-next split by DEVICE (src/utils/ladderArm.js, kit arm-bit salt 'ladder', 11-27). Arm 1 = the treatment
// (5-step ladder + bonus row, word memory, home Next card + 6-item More, mixed order); arm 0 = main's behaviour.
// On f4512b55 every device got the treatment, so the arm-0 tests fail there.

const DAY = 86400000;
const PID = 'player_arm';

// a returning player (created 3 days ago), parked on an 11-step position (v1 'sent', stage 9)
async function seed(page, { cycle = { batch: 0, stage: 9 }, ageMs = 3 * DAY, totalQuizzes = 3 } = {}) {
  await page.route('**/api/**', (r) => r.fulfill({ status: 204 }));
  await page.addInitScript((o) => {
    try { sessionStorage.setItem('cde-menu-more', '1'); } catch { /* ignore */ }
    if (localStorage.getItem('childrendoenglish-players')) return;
    const player = { id: o.PID, name: 'Maya', avatar: '🦊', canRead: true, createdAt: new Date(Date.now() - o.ageMs).toISOString() };
    localStorage.setItem('childrendoenglish-players', JSON.stringify({ schemaVersion: 2, activePlayerId: o.PID, players: [player] }));
    const stats = { hasSeenOnboarding: true, totalQuizzes: o.totalQuizzes, badges: [], unlockedLevels: ['beginner'], wordProgress: {}, uiLanguage: 'en' };
    if (o.cycle) stats.cycle = o.cycle;
    localStorage.setItem('childrendoenglish-player-' + o.PID, JSON.stringify(stats));
    localStorage.setItem('childrendoenglish-analytics-consent', 'declined');
  }, { PID, cycle, ageMs, totalQuizzes });
  await page.goto('/');
  await page.waitForSelector('#root > *', { timeout: 10000 });
}
const saved = (page) => page.evaluate((k) => JSON.parse(localStorage.getItem(k)), 'childrendoenglish-player-' + PID);
const moreItems = (page) => page.getByTestId('menu-more').locator('button, a').count();

async function openMap(page) {
  await page.getByTestId('ladder-strip').click();
  await expect(page.getByText('Your practice ladder')).toBeVisible({ timeout: 8000 });
}

test('arm 0 (control): main\'s home, the 11-step ladder, the record not migrated', async ({ page }) => {
  await forceLadderArm(page, 0);
  await seed(page);
  await expect(page.getByText('Continue learning')).toBeVisible({ timeout: 8000 });
  await expect(page.getByTestId('next-card')).toHaveCount(0);
  await expect(page.getByTestId('words-learned')).toHaveCount(0);
  await expect(page.getByText('Step 10 of 11')).toBeVisible();
  await expect(page.getByTestId('menu-more').getByText('My Word List')).toBeVisible();
  const ctrlMore = await moreItems(page);
  await page.waitForTimeout(500);
  expect((await saved(page)).cycle).toEqual({ batch: 0, stage: 9 }); // no v: main's record
  await page.getByText('Continue learning').click();
  await expect(page.getByText(/_____/)).toBeVisible({ timeout: 8000 }); // main's step 10 'sent' = Sentence Gap (a core step)
  await page.getByRole('button', { name: 'Back to menu' }).click(); // a ladder step's back goes to the map
  await expect(page.getByText('Your practice ladder')).toBeVisible({ timeout: 8000 });
  for (const l of ['Image Quiz', 'Two Missing Letters', 'Tricky Letter', 'Spelling Forge', 'Use the Word', 'Word Zapper']) {
    await expect(page.getByText(l, { exact: true })).toBeVisible();
  }
  await expect(page.getByTestId('ladder-bonus')).toHaveCount(0);
  await page.getByText('How the 11 steps work').click();
  await expect(page.getByText(/learn to spell them one letter at a time/)).toBeVisible();

  // the same seed in the treatment: 6-item More (2 fewer), the Next card, the 5-step path, the record migrated
  const p2 = await page.context().newPage();
  await forceLadderArm(p2, 1);
  await seed(p2);
  await expect(p2.getByTestId('next-card')).toHaveAttribute('data-kind', 'path');
  await expect(p2.getByTestId('next-card')).toContainText(/Step 5 of 5: Word Zapper/);
  await expect(p2.getByTestId('menu-more').getByText('My Word List')).toHaveCount(0);
  expect(await moreItems(p2)).toBe(ctrlMore - 2);
  await expect.poll(async () => (await saved(p2)).cycle).toMatchObject({ batch: 0, stage: 4, v: 2 });
});

test('arm 1 (treatment): the 5-step map with the bonus row', async ({ page }) => {
  await forceLadderArm(page, 1);
  await seed(page, { ageMs: 10 * 60000, cycle: null }); // same sitting: today's home, Continue on step 1
  await page.getByText('Continue learning').click();
  await expect(page.getByText('Tap to flip')).toBeVisible({ timeout: 8000 });
  await openMap(page);
  for (const l of ['Flashcards', 'Listen & Pick', 'Word Quiz', 'Category Conveyor', 'Word Zapper']) {
    await expect(page.getByText(l, { exact: true })).toBeVisible();
  }
  await expect(page.getByTestId('ladder-bonus')).toBeVisible();
  for (const gone of ['Image Quiz', 'Two Missing Letters', 'Tricky Letter']) await expect(page.getByText(gone, { exact: true })).toHaveCount(0);
});

test('word order: a new cycle starts on letter A in control, mixed (no letter label) in the treatment', async ({ page }) => {
  await forceLadderArm(page, 0);
  await seed(page, { ageMs: 10 * 60000, cycle: null });
  await expect(page.getByText(/^Word batch 1 — letter A/)).toBeVisible({ timeout: 8000 });
  const p2 = await page.context().newPage();
  await forceLadderArm(p2, 1);
  await seed(p2, { ageMs: 10 * 60000, cycle: null });
  await expect(p2.getByText('Word batch 1', { exact: true })).toBeVisible({ timeout: 8000 });
});

// The real kit file, as a visitor's browser runs it (webdriver off, the stored number in kit_arm_ladder): the arm
// holds across loads and rides on the ladder tallies as ~0 / ~1, with the cyd funnel step once per device.
for (const [u, arm] of [[0.75, 1], [0.25, 0]]) {
  test(`real kit arm ${arm}: sticky across reloads; cyc_start carries ~${arm}, cyd start1 goes once`, async ({ page }) => {
    const sent = [];
    page.on('request', (r) => {
      if (!r.url().includes('/api/land') || r.method() !== 'POST') return;
      try { for (const x of JSON.parse(r.postData() || '{}').batch || []) sent.push(`${x.e}:${x.i}`); } catch { /* not a batch */ }
    });
    await realLadderArm(page, u);
    await seed(page, { ageMs: 10 * 60000, cycle: null });
    expect(await page.evaluate(() => window.kitArm('ladder'))).toBe(arm);
    await page.getByText('Continue learning').click();
    await expect(page.getByText('Tap to flip')).toBeVisible({ timeout: 8000 });
    await expect.poll(() => sent.filter((s) => s.startsWith('cyc_start:'))).toEqual([`cyc_start:b0~${arm}`]);
    await expect.poll(() => sent.filter((s) => s.startsWith('cyd:'))).toEqual([`cyd:start1~${arm}`]);
    expect(sent.filter((s) => /^cyc_/.test(s) && !s.endsWith(`~${arm}`))).toEqual([]);

    await page.goto('/');
    await page.waitForSelector('#root > *', { timeout: 10000 });
    expect(await page.evaluate(() => [window.kitArm('ladder'), localStorage.getItem('kit_arm_ladder')])).toEqual([arm, String(u)]);
    await page.getByText('Continue learning').click();
    await expect(page.getByText('Tap to flip')).toBeVisible({ timeout: 8000 });
    await expect.poll(() => sent.filter((s) => s.startsWith('cyc_start:')).length).toBe(2);
    expect(sent.filter((s) => s.startsWith('cyd:'))).toEqual([`cyd:start1~${arm}`]); // once per device
    const steps = arm ? 5 : 11;
    await expect(page.getByTestId('ladder-strip')).toContainText(new RegExp(`of ${steps}`));
  });
}
