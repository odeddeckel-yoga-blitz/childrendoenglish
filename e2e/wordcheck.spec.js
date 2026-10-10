import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

// Word of the day → WordCheck (2026-10-10): the home spotlight card opens an
// in-app 3-probe check in the CURRENT interface language, then one feedback
// tap, then back to the menu. Guards the surface that produces the per-asset
// diagnosis data (ansm_* / wfb beacons).
const spotlight = JSON.parse(readFileSync(new URL('../src/data/spotlight.json', import.meta.url), 'utf8'));
const WORD = spotlight.word.id;

function seedPlayer(page, { lang = 'en', canRead = true } = {}) {
  return page.addInitScript(({ lang, canRead }) => {
    localStorage.setItem('childrendoenglish-analytics-consent', 'declined');
    localStorage.setItem('cde_lang', lang);
    const player = { id: 'player_wc1', name: 'Check', avatar: '🦉', canRead, createdAt: new Date().toISOString() };
    localStorage.setItem('childrendoenglish-players', JSON.stringify({ schemaVersion: 2, players: [player], activePlayerId: player.id }));
  }, { lang, canRead });
}

async function answerCorrect(page) {
  const opt = page.locator(`button[data-opt="${WORD}"]`);
  await expect(opt).toBeVisible({ timeout: 8000 });
  await opt.click();
}

test('word of the day runs 3 probes, takes a feedback tap and returns to the menu', async ({ page }) => {
  await seedPlayer(page);
  await page.goto('/');
  await page.waitForSelector('#root > *', { timeout: 10000 });
  await expect(page.getByText("Today's picks")).toBeVisible({ timeout: 8000 });
  await page.locator('button[data-spot="word"]').click();
  await expect(page.getByText('Tap the picture you hear')).toBeVisible({ timeout: 8000 });
  await expect(page.locator('button[data-opt]')).toHaveCount(4);
  await answerCorrect(page);
  await expect(page.getByText('Which word is this?')).toBeVisible({ timeout: 8000 });
  await answerCorrect(page);
  await expect(page.getByText('What does it mean?')).toBeVisible({ timeout: 8000 });
  await answerCorrect(page);
  await expect(page.getByText('3 of 3 right')).toBeVisible({ timeout: 8000 });
  await page.locator('button[data-fb="ok"]').click();
  await expect(page.getByText('Thanks! That helps us fix it.')).toBeVisible();
  await page.getByText('Back to home').click();
  await expect(page.getByText("Today's picks")).toBeVisible({ timeout: 8000 });
});

test('Hebrew interface stays Hebrew through the word check', async ({ page }) => {
  await seedPlayer(page, { lang: 'he' });
  await page.goto('/?lang=he'); // same query hook the multilang spec uses
  await page.waitForSelector('#root > *', { timeout: 10000 });
  await expect(page.getByText('הבחירות של היום')).toBeVisible({ timeout: 8000 });
  await page.locator('button[data-spot="word"]').click();
  await expect(page.getByText('הקישו על התמונה ששמעתם')).toBeVisible({ timeout: 8000 });
  await expect(page.locator('[data-testid="word-check"]')).toHaveAttribute('dir', 'rtl');
  await answerCorrect(page);
  await expect(page.getByText('איזו מילה זו?')).toBeVisible({ timeout: 8000 });
});

test('pre-readers get a single listening probe', async ({ page }) => {
  await seedPlayer(page, { canRead: false });
  await page.goto('/');
  await page.waitForSelector('#root > *', { timeout: 10000 });
  await page.locator('button[data-spot="word"]').click();
  await expect(page.getByText('1/1')).toBeVisible({ timeout: 8000 });
  await answerCorrect(page);
  await expect(page.getByText('1 of 1 right')).toBeVisible({ timeout: 8000 });
});
