// CDE adapter for the kit persona check (PATTERNS §3e, P1/P2/P4). The kit's
// tools/persona/persona-check.mjs drives games through Game.start/winGame, which
// CDE games don't have, so this plays each game like a child at 390×664 (phone,
// touch) and applies the same rules:
//   P2  tapping the menu's start button starts play in one tap (menu gone, no scroll-only)
//   P1  on the end screen: exactly ONE visible [data-kdm-primary], and a tap at its
//       centre hits it (nothing covers it); plus a way home that isn't a domain name
//   P4  no visible [data-kdm-audience=teacher] on menu / play / end
// node tools/persona/cde-persona.mjs [base] [--lang=he] [game …]   exit 1 on a breach
import { chromium } from 'playwright';
const args = process.argv.slice(2);
const BASE = args.find((a) => a.startsWith('http')) || 'http://localhost:4719';
const LANG = (args.find((a) => a.startsWith('--lang=')) || '--lang=en').slice(7);
const ALL = ['sound-pairs', 'read-it', 'letter-twins', 'spelling-forge', 'word-zapper', 'category-conveyor'];
const GAMES = args.filter((a) => ALL.includes(a)).length ? args.filter((a) => ALL.includes(a)) : ALL;

// play to the end screen with real taps (or the game's own test contract)
const PLAY = {
  async 'sound-pairs'(p) { await playRounds(p, 'pairs'); },
  async 'read-it'(p) { await playRounds(p, 'cvc'); },
  async 'letter-twins'(p) {
    for (let guard = 0; guard < 80; guard++) {
      if (await p.locator('.cde-end').count()) return;
      if (await p.locator('.card .primary').count() && !(await p.locator('.opt').count())) { await p.locator('.card .primary').first().click(); continue; }
      await p.waitForSelector('.opt', { timeout: 8000 });
      const w = await p.evaluate(() => (document.querySelector('.pic')?.getAttribute('src') || '').replace(/^.*\/|\.webp$/g, ''));
      await p.click(`.opt[data-letter="${w[0]}"]`); await p.waitForTimeout(1300);
    }
  },
  async 'spelling-forge'(p) {
    for (let i = 0; i < 200 && !(await vis(p, '#win')); i++) {
      await p.evaluate(() => { if (window.SF?.dbg?.word && !SF.state.locked) { SF.dbg.solveForTest(); SF.forge(); } });
      await p.waitForTimeout(250);
    }
  },
  async 'word-zapper'(p) {
    for (let i = 0; i < 120 && !(await vis(p, '#over')); i++) { await p.evaluate(() => window.WZ?.dbg?.dropTarget()); await p.waitForTimeout(250); }
  },
  async 'category-conveyor'(p) {
    for (let i = 0; i < 240 && !(await vis(p, '#over')); i++) await p.waitForTimeout(500); // no sorting → the belt stops
  },
};
async function playRounds(p, dir) {
  for (let guard = 0; guard < 120; guard++) {
    if (await p.locator('.card [data-kdm-primary], .card .primary').count() && !(await p.locator('.opt').count())) {
      const end = await p.locator('.cde-end').count();
      if (end) return;
      await p.locator('.card .primary').first().click(); continue; // level done → next level
    }
    await p.waitForSelector('.opt', { timeout: 8000 }); await p.waitForTimeout(450);
    const read = await p.$('#readWord');
    const target = read ? await read.textContent() : await p.evaluate(() => window.__last);
    await p.click(`.opt[data-word="${target}"]`); await p.waitForTimeout(1100);
  }
  void dir;
}
const vis = (p, sel) => p.evaluate((s) => { const e = document.querySelector(s); if (!e) return false; const r = e.getBoundingClientRect(), c = getComputedStyle(e); return r.width > 2 && r.height > 2 && c.display !== 'none' && c.visibility !== 'hidden' && +c.opacity > 0.05; }, sel);
const teacher = (p) => p.evaluate(() => [...document.querySelectorAll('[data-kdm-audience="teacher"]')].filter((e) => e.offsetParent !== null).length);

const b = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
let bad = 0;
for (const id of GAMES) {
  const ctx = await b.newContext({ viewport: { width: 390, height: 664 }, isMobile: true, hasTouch: true });
  await ctx.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => false });
    const A = window.Audio; window.__last = null;
    window.Audio = function (src) { const a = new A(src); const m = /\/audio\/(?:pairs|cvc)\/([a-z]+)\.mp3/.exec(src || ''); if (m) window.__last = m[1]; return a; };
  });
  await ctx.route('**/api/**', (r) => r.fulfill({ status: 204 }));
  const p = await ctx.newPage(); const errs = [];
  p.on('pageerror', (e) => errs.push(e.message));
  const out = [];
  await p.goto(`${BASE}/games/${id}/?lang=${LANG}`, { waitUntil: 'load' }); await p.waitForTimeout(600);
  if (await teacher(p)) out.push('P4 menu: teacher item visible');
  const y0 = await p.evaluate(() => scrollY);
  const box = await p.locator('#startBtn').boundingBox();
  if (!box) out.push('P2: no start button');
  else {
    await p.mouse.click(box.x + box.width / 2, box.y + box.height / 2); await p.waitForTimeout(2000);
    if (await vis(p, '#menu')) out.push((await p.evaluate(() => scrollY)) !== y0 ? 'P2: start only scrolled' : 'P2: menu still up 2 s after start');
  }
  if (await teacher(p)) out.push('P4 play: teacher item visible');
  await PLAY[id](p); await p.waitForTimeout(900);
  const p1 = await p.evaluate(() => {
    const prim = [...document.querySelectorAll('[data-kdm-primary]')].filter((e) => { const r = e.getBoundingClientRect(), c = getComputedStyle(e); return r.width > 2 && r.height > 2 && c.display !== 'none' && c.visibility !== 'hidden' && e.offsetParent !== null; });
    if (prim.length !== 1) return { why: `P1: ${prim.length} visible primaries` };
    prim[0].scrollIntoView({ block: 'center' });
    const r = prim[0].getBoundingClientRect(), hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    if (!hit || !(hit === prim[0] || prim[0].contains(hit))) return { why: `P1: primary covered by ${hit ? hit.tagName + '#' + hit.id + '.' + hit.className : 'nothing'}` };
    const home = [...document.querySelectorAll('.cde-end a')].find((a) => /\/app$|\/new-player/.test(a.getAttribute('href') || ''));
    const domain = [...document.querySelectorAll('a')].filter((a) => a.offsetParent !== null && /childrendoenglish\.com/.test(a.textContent) && a.id !== 'homePill');
    return { label: prim[0].textContent.trim(), why: !home ? 'P1: no way home on the end screen' : domain.length ? 'P1: a domain-name link is still the way out' : null };
  });
  if (process.env.SHOT) await p.screenshot({ path: `${process.env.SHOT}/persona-${id}-${LANG}.png` });
  if (p1.why) out.push(p1.why);
  if (await teacher(p)) out.push('P4 end: teacher item visible');
  out.push(...errs.map((e) => 'pageerror: ' + e));
  bad += out.length;
  console.log(`${out.length ? '✗' : '✓'} ${id} [${LANG}]${p1.label ? ' primary="' + p1.label + '"' : ''}${out.length ? '\n    ' + out.join('\n    ') : ''}`);
  await ctx.close();
}
await b.close();
process.exit(bad ? 1 : 0);
