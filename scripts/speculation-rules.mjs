// R2X19 (kit infra/perf/speculation-rules): Chrome prefetches the HTML of a game page
// when the player is about to open it (hover 200 ms / pointerdown) — PREFETCH ONLY, never
// prerender: a prefetch runs no JavaScript, so a game that is never opened sends no g_open
// beacon and our open counts stay true. Injected into every built page (game pages come from
// public/, so this runs on dist/ after all pages exist). CSP: vercel.json script-src carries
// 'inline-speculation-rules', which allows this JSON block and no inline JS; the postbuild
// validator fails the build if a page has the block and the CSP lacks the keyword.
import { readdirSync, readFileSync, writeFileSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

export const SPECULATION_RULES = `<script type="speculationrules">${JSON.stringify({
  prefetch: [{
    source: 'document',
    where: { and: [
      { selector_matches: 'a[href^="/games/"]' },
      { not: { selector_matches: 'a[href^="/games/_shared/"]' } },
      { not: { selector_matches: 'a[data-no-prefetch], a[download], a[target="_blank"]' } },
    ] },
    eagerness: 'moderate',
  }],
})}</script>`;

export function injectRules(html) {
  if (html.includes('type="speculationrules"') || !html.includes('</body>')) return html;
  return html.replace(/<\/body>(?![\s\S]*<\/body>)/, `${SPECULATION_RULES}\n</body>`);
}

function walk(dir, out = []) {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (f.endsWith('.html')) out.push(p);
  }
  return out;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const dist = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist');
  let n = 0;
  for (const p of walk(dist)) {
    const html = readFileSync(p, 'utf8');
    const out = injectRules(html);
    if (out !== html) { writeFileSync(p, out); n++; }
  }
  console.log(`Speculation rules (prefetch, moderate) on ${n} pages`);
}
