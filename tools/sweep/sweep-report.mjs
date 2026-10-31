// Summarise a sweep-all.mjs JSON: counts per check, unique issues, examples.
import fs from 'fs';
const R = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const SITE = 'https://childrendoenglish.com';
const type = (u) => { const s = u.split('/').filter(Boolean); if (!s.length) return '/'; if (s[0] === 'vocabulary') return s.length >= 3 && !['hebrew', 'spanish'].includes(s[2]) ? 'vocabulary/word' : 'vocabulary/' + (s[2] || 'cat'); if (s[0] === 'printable-flashcards') return 'printable/' + (s[2] || (s[1] ? 'cat' : 'hub')); return s[0] + (s.length > 1 ? '/*' : ''); };
const tally = (arr) => { const m = new Map(); for (const x of arr) m.set(x, (m.get(x) || 0) + 1); return [...m].sort((a, b) => b[1] - a[1]); };
const out = {};
out.pages = R.length; out.failed = R.filter((r) => r.fail).map((r) => r.u + ' ' + r.fail);
const ok = R.filter((r) => !r.fail);
// links
const bl = ok.flatMap((r) => r.links.map((l) => l));
out.links = { total: bl.length, pages: ok.filter((r) => r.links.length).length, unique: tally(bl).slice(0, 30) };
// canonical + hreflang
const byUrl = new Map(ok.map((r) => [r.u, r]));
const canonBad = ok.filter((r) => r.head.canon !== SITE + r.u).map((r) => `${r.u} canon=${r.head.canon}`);
const hrefBad = [];
for (const r of ok) for (const [hl, href] of r.head.alts) {
  const t = href.replace(SITE, ''); if (hl === 'x-default') continue;
  const other = byUrl.get(t);
  if (!other) { if (t !== r.u) hrefBad.push(`${r.u} → ${hl} ${t} (not in sitemap/swept)`); continue; }
  if (!other.head.alts.some(([, h]) => h.replace(SITE, '') === r.u)) hrefBad.push(`${r.u} → ${hl} ${t} (no return link)`);
}
out.canonical = { bad: canonBad.length, ex: canonBad.slice(0, 15) };
out.hreflang = { bad: hrefBad.length, ex: hrefBad.slice(0, 15), pagesWithAlts: ok.filter((r) => r.head.alts.length).length };
// axe
const ax = ok.flatMap((r) => r.axe.map((a) => a.split(' :: ')[0]));
out.axe = { total: ax.length, byRule: tally(ax), byTypeRule: tally(ok.flatMap((r) => r.axe.map((a) => type(r.u) + ' | ' + a))).slice(0, 40) };
out.noalt = ok.reduce((n, r) => n + r.noalt, 0);
const sm = ok.flatMap((r) => r.small.map((s) => type(r.u) + ' | ' + s.replace(/ \d+x\d+/, (m) => m).replace(/"[^"]*"$/, '')));
out.tap = { total: ok.reduce((n, r) => n + r.small.length, 0), byType: tally(sm).slice(0, 40) };
out.rtl = { total: ok.reduce((n, r) => n + r.rtl.length, 0), ex: tally(ok.flatMap((r) => r.rtl.map((x) => type(r.u) + ' | ' + x))).slice(0, 40) };
out.english = { total: ok.reduce((n, r) => n + r.english.length, 0), ex: tally(ok.flatMap((r) => r.english.map((x) => type(r.u) + ' | ' + x))).slice(0, 40) };
out.errs = tally(ok.flatMap((r) => (r.errs || []).map((e) => type(r.u) + ' | ' + e.slice(0, 80))));
out.langs = tally(ok.map((r) => r.head.lang + '/' + r.head.dir));
console.log(JSON.stringify(out, null, 1));
