import { chromium } from 'playwright';
const S = process.argv[2], PAGES = process.argv.slice(3);
const b = await chromium.launch();
let bad = 0;
for (const u of PAGES) {
  const p = await (await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })).newPage();
  const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  await p.route('**/api/**', (r) => r.fulfill({ status: 204 }));
  await p.goto('http://localhost:4719' + u);
  const data = JSON.parse(await p.locator('#unit-data').textContent());
  const byHe = new Map(data.map((d) => [d.he, d]));
  const out = {};
  for (const mode of ['gap', 'build']) {
    await p.click(`.mode[data-mode="${mode}"]`);
    let n = 0, ok = 0, amb = 0;
    for (let r = 0; r < 12; r++) {
      if (await p.locator('#practice .feedback').filter({ hasText: 'סיימתם' }).count()) break;
      const clue = await p.locator('#practice .clue').textContent();
      if (mode === 'gap') {
        const he = clue.replace('השלימו את המשפט במילה שפירושה: ', '');
        const it = byHe.get(he); const opts = await p.locator('#practice .opt').allTextContents();
        // ambiguity check: does another option ALSO have the clue's meaning?
        if (opts.filter((o) => data.find((d) => d.en === o)?.he === he).length !== 1) amb++;
        await p.locator('#practice .opt', { hasText: new RegExp(`^${it.en}$`) }).click();
      } else {
        const sentence = await p.evaluate(() => null);
        const en = clue.match(/המילה (.+?) \(/)[1]; const it = data.find((d) => d.en === en);
        for (const t of it.ex.trim().split(/\s+/)) await p.locator('#practice .tile:not([disabled])', { hasText: t }).filter({ hasText: new RegExp(`^${t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`) }).first().click();
        void sentence;
      }
      n++;
      if (await p.locator('#practice .feedback').filter({ hasText: 'נכון' }).count()) ok++;
      if (r === 0) await p.screenshot({ path: `${S}/sent-${mode}-${u.replace(/\W+/g, '_')}.png` });
      await p.locator('#practice .next').click();
    }
    const end = await p.locator('#practice .feedback').textContent();
    out[mode] = { n, ok, amb, end };
  }
  if (errs.length) bad++;
  console.log(u, JSON.stringify(out), errs.length ? 'ERR ' + errs.join(' | ') : '');
  await p.close();
}
await b.close(); process.exit(bad ? 1 : 0);
