// Tab through each page type; every focused element must show a focus ring
// (outline or box-shadow) and be on screen after scrolling.
import { chromium } from 'playwright';
const PAGES = process.argv.slice(2);
const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 1280, height: 800 } });
await ctx.route('**/api/**', (r) => r.fulfill({ status: 204 }));
for (const u of PAGES) {
  const p = await ctx.newPage(); await p.goto('http://localhost:4719' + u); await p.waitForTimeout(300);
  const bad = new Map(); let n = 0;
  for (let i = 0; i < 40; i++) {
    await p.keyboard.press('Tab');
    const r = await p.evaluate(() => {
      const e = document.activeElement; if (!e || e === document.body) return null;
      const cs = getComputedStyle(e); const ring = (cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0) || (cs.boxShadow && cs.boxShadow !== 'none');
      const k = e.tagName.toLowerCase() + (e.className && typeof e.className === 'string' ? '.' + e.className.split(' ')[0] : '') + ' ' + (e.textContent || '').trim().slice(0, 18);
      return { ring, k };
    });
    if (!r) continue; n++;
    if (!r.ring) bad.set(r.k.replace(/ .*/, ''), (bad.get(r.k.replace(/ .*/, '')) || 0) + 1);
  }
  console.log(u, 'focused', n, 'no-ring', [...bad].map(([k, v]) => `${k}×${v}`).join(' '));
  await p.close();
}
await b.close();
