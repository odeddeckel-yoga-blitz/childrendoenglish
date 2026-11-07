import { test, expect } from '@playwright/test';

// Wrong language on screen (11-04: Word Zapper / Spelling Forge showed the Hebrew gloss to English players a day after
// the flashcards were fixed for the same thing — found only by reading the string tables).
//  · en / es interface: no visible Hebrew, except inside an element that declares itself Hebrew (lang="he",
//    e.g. the language picker's "עברית").
//  · he / es interface: no English interface string of the game's own table (CDE_STRINGS.en) on screen — an
//    untranslated button or toast. Game CONTENT (the English words being learned) is English by design.

const GAMES = ['letter-twins', 'read-it', 'sound-pairs', 'spelling-forge', 'word-zapper', 'category-conveyor', 'rhyme-time', 'odd-one-out', 'word-memory', 'missing-letter', 'picture-bingo', 'opposites', 'true-or-false', 'feelings', 'sentence-builder'];
const HEB = /[֐-׿]/;

// Visible text outside elements that declare themselves Hebrew.
async function strayHebrew(page) {
  return page.evaluate((src) => {
    const re = new RegExp(src);
    const out = [];
    const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    for (let n = w.nextNode(); n; n = w.nextNode()) {
      const t = n.nodeValue.trim();
      if (!t || !re.test(t)) continue;
      const el = n.parentElement;
      if (!el || el.closest('[lang="he"], script, style, noscript, [hidden], [aria-hidden="true"]')) continue;
      const cs = getComputedStyle(el);
      if (cs.display === 'none' || cs.visibility === 'hidden' || !el.getClientRects().length) continue;
      out.push(t.slice(0, 60));
    }
    return out;
  }, HEB.source);
}

// English interface strings of this game's table that are on screen in a non-English interface.
async function untranslated(page) {
  return page.evaluate(() => {
    const D = window.CDE_STRINGS || {}, en = D.en || {}, cur = D[window.CDE_LANG] || {};
    const txt = document.body.innerText;
    const plain = (v) => String(v ?? '').replace(/<[^>]+>/g, '').replace(/[\u2066-\u2069]/g, '').trim();
    // Same text in both tables (letter content like "sh · ch · th · ck", markup aside) is not untranslated.
    return Object.entries(en)
      .filter(([k, v]) => typeof v === 'string' && plain(v).length >= 6 && plain(cur[k]) !== plain(v))
      .map(([, v]) => plain(v))
      // whole words only: es "Transporte" contains en "Transport" but is translated (11-07)
      .filter((v) => new RegExp('(^|[^\\p{L}])' + v.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(?![\\p{L}])', 'u').test(txt));
  });
}

async function playABit(page, id) {
  await page.click('#startBtn');
  await page.waitForTimeout(1200);
  if (id === 'spelling-forge') await page.evaluate(() => { SF.dbg.solveForTest(); SF.forge(); });
  else {
    const opt = page.locator('#app .opt, .bin').first();
    if (await opt.count()) await opt.click({ force: true }).catch(() => {});
  }
  await page.waitForTimeout(900);
}

for (const lang of ['en', 'es', 'he']) {
  test(`games: no wrong-language text in the ${lang} interface`, async ({ page }) => {
    await page.route('**/api/**', (r) => r.fulfill({ status: 204 }));
    const found = [];
    for (const id of GAMES) {
      await page.goto(`/games/${id}/index.html?lang=${lang}`);
      await page.waitForFunction(() => document.readyState === 'complete');
      const check = async (where) => {
        if (lang !== 'he') for (const t of await strayHebrew(page)) found.push(`${id} ${where}: Hebrew "${t}"`);
        if (lang !== 'en') for (const t of await untranslated(page)) found.push(`${id} ${where}: English "${t}"`);
      };
      await check('menu');
      await playABit(page, id);
      await check('play');
    }
    expect(found).toEqual([]);
  });
}

test('app: no Hebrew in the English interface (menu, flashcards front and back)', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('childrendoenglish-analytics-consent', 'declined'));
  await page.goto('/');
  await page.waitForSelector('#root > *', { timeout: 10000 });
  await page.locator('button', { hasText: 'Learn vocabulary in English' }).click();
  await page.locator('input[type="text"]').first().waitFor({ timeout: 8000 });
  await page.locator('input[type="text"]').first().fill('LeakKid');
  await page.locator('button:has-text("Start playing")').first().click();
  const read = page.locator('text=I can read!');
  if (await read.count()) await read.click();
  await page.waitForTimeout(800);
  const found = [];
  for (const t of await strayHebrew(page)) found.push(`menu: "${t}"`);
  await page.evaluate(() => {
    const { activePlayerId } = JSON.parse(localStorage.getItem('childrendoenglish-players'));
    const key = 'childrendoenglish-player-' + activePlayerId;
    localStorage.setItem(key, JSON.stringify({ ...JSON.parse(localStorage.getItem(key)), totalQuizzes: 1 }));
  });
  await page.reload();
  await page.waitForSelector('#root > *', { timeout: 10000 });
  await page.getByText(/Word batch 1/).click();
  await page.getByRole('button', { name: /Show the word/ }).click();
  await page.waitForTimeout(500);
  for (const t of await strayHebrew(page)) found.push(`flashcard back: "${t}"`);
  expect(found).toEqual([]);
});
