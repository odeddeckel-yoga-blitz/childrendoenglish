// Hebrew app screens: visible Latin text that isn't marked LTR/English (the
// English content words themselves sit in lang=en/dir=ltr/bdi or are single
// words). Walks menu → More → quiz → result → flashcards → parent → learn.
import { chromium } from 'playwright';
import fs from 'fs';
const AXE = fs.readFileSync('node_modules/axe-core/axe.min.js', 'utf8');
const S = process.argv[2];
const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
await ctx.addInitScript(() => {
  const id = 'player_x';
  localStorage.setItem('childrendoenglish-players', JSON.stringify({ schemaVersion: 2, activePlayerId: id, players: [{ id, name: 'Noa', avatar: '⭐', canRead: true, createdAt: new Date().toISOString() }] }));
  localStorage.setItem('childrendoenglish-player-' + id, JSON.stringify({ hasSeenOnboarding: true, totalQuizzes: 3, uiLanguage: 'he', wordProgress: { cat: { correct: 2, incorrect: 0 } }, badges: [], unlockedLevels: ['beginner'] }));
  localStorage.setItem('childrendoenglish-analytics-consent', 'declined');
  try { sessionStorage.setItem('cde-menu-more', '1'); speechSynthesis.speak = () => {}; } catch {}
});
await ctx.route('**/api/**', (r) => r.fulfill({ status: 204 }));
const p = await ctx.newPage();
const scan = async (name) => { await p.addScriptTag({ content: AXE }).catch(() => {}); const ax = await p.evaluate(async () => window.axe ? (await axe.run(document, { runOnly: ['wcag2a', 'wcag2aa'] })).violations.flatMap((v) => v.nodes.map((n) => v.id + ' ' + n.target[0])) : ['no-axe']); const r = await p.evaluate((name) => {
  const out = []; const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let n = w.nextNode(); n; n = w.nextNode()) {
    const t = n.nodeValue.trim(); const pe = n.parentElement; if (!t || !pe || !pe.offsetParent) continue;
    if (pe.closest('[lang=en], [dir=ltr], bdi, script, style')) continue;
    if (/[A-Za-z]{2,}/.test(t) && /[A-Za-z]{2,}\s+[A-Za-z]{2,}/.test(t)) out.push(t.slice(0, 50));
  }
  return [name, [...new Set(out)]];
}, name); r.push(ax); return r; };
const res = [];
await p.goto('http://localhost:4720/'); await p.waitForTimeout(1500); res.push(await scan('menu'));
await p.getByText('שומעים ובוחרים').first().click().catch(() => {}); // via More → quiz picker? (falls through)
await p.goto('http://localhost:4720/'); await p.waitForTimeout(800);
await p.locator('text=שחקו בחידון').first().click(); await p.waitForTimeout(800); res.push(await scan('levelSelect'));
await p.goto('http://localhost:4720/'); await p.waitForTimeout(800);
await p.locator('[data-m1="continue"]').click(); await p.waitForTimeout(1500); res.push(await scan('flashcards'));
await p.getByTestId('ladder-strip').click(); await p.waitForTimeout(600); res.push(await scan('ladderMap'));
await p.getByText('שומעים ובוחרים', { exact: true }).first().click(); await p.waitForTimeout(2500); res.push(await scan('audioQuiz'));
for (let i = 0; i < 20 && !(await p.locator('[data-kdm-primary]').count()); i++) { const o = p.locator('.grid.grid-cols-2 button').first(); if (await o.count()) await o.click().catch(() => {}); await p.waitForTimeout(1500); }
await p.waitForTimeout(2500); res.push(await scan('result'));
await p.goto('http://localhost:4720/parent'); await p.waitForTimeout(1200); res.push(await scan('parent'));
await p.goto('http://localhost:4720/learn'); await p.waitForTimeout(1500); res.push(await scan('learn'));
for (const [n, l, ax] of res) console.log(n, l.length, JSON.stringify(l.slice(0, 8)), 'axe', JSON.stringify(ax));
await b.close();
