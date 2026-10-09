#!/usr/bin/env node
// Post-build structured-data gate (GEO): parses every JSON-LD block in dist/,
// validates the required properties per @type, and prints FAQPage/HowTo
// coverage per page type. Exit 1 on any invalid JSON or missing required
// field. Usage: node scripts/validate-schema.mjs [--quiet]
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const DIST = 'dist';
const quiet = process.argv.includes('--quiet');
const REQUIRED = {
  FAQPage: (d) => Array.isArray(d.mainEntity) && d.mainEntity.length > 0 && d.mainEntity.every((q) =>
    q['@type'] === 'Question' && typeof q.name === 'string' && q.name.trim() && q.acceptedAnswer?.['@type'] === 'Answer' && typeof q.acceptedAnswer.text === 'string' && q.acceptedAnswer.text.trim()),
  HowTo: (d) => typeof d.name === 'string' && Array.isArray(d.step) && d.step.length > 0 && d.step.every((s) => s['@type'] === 'HowToStep' && (s.text || s.name)),
  BreadcrumbList: (d) => Array.isArray(d.itemListElement) && d.itemListElement.every((i, k) => i['@type'] === 'ListItem' && i.position === k + 1 && i.name && i.item),
  Article: (d) => d.headline && d.author && d.publisher && d.datePublished,
  DefinedTerm: (d) => d.name && d.description && d.inDefinedTermSet,
  DefinedTermSet: (d) => d.name && Array.isArray(d.hasDefinedTerm) && d.hasDefinedTerm.length > 0,
  ItemList: (d) => Array.isArray(d.itemListElement) && d.itemListElement.length > 0,
  WebApplication: (d) => d.name && d.url && d.applicationCategory,
  VideoGame: (d) => d.name && d.url,
  Organization: (d) => d.name && d.url,
  WebSite: (d) => d.name && d.url,
  Person: (d) => d.name,
};

function pageType(rel) {
  if (/^\/vocabulary\/[a-z]+\/(hebrew|spanish)\/$/.test(rel)) return 'bilingual-category';
  if (/^\/vocabulary\/[a-z]+\/[a-z0-9_-]+\/$/.test(rel)) return 'word';
  if (/^\/vocabulary\/ages-[0-9-]+\/$/.test(rel)) return 'age';
  if (/^\/vocabulary\/[a-z]+\/$/.test(rel)) return 'category';
  if (rel === '/vocabulary/') return 'vocab-index';
  if (rel === '/guides/') return 'guides-index';
  if (rel.startsWith('/guides/')) return 'guide';
  if (rel.startsWith('/printable-flashcards/')) return 'flashcards';
  if (rel.startsWith('/he/english-games/')) return 'he-games';
  if (rel.startsWith('/he/')) return 'hebrew';
  if (rel.startsWith('/es/')) return 'spanish';
  if (rel.startsWith('/games/')) return 'games';
  if (rel.startsWith('/tools/')) return 'tool';
  return 'other';
}
function* pages(dir) {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) yield* pages(p);
    else if (f === 'index.html') yield p;
  }
}

const cov = {}; const errors = []; let blocks = 0;
for (const file of pages(DIST)) {
  const rel = '/' + file.slice(DIST.length + 1).replace(/index\.html$/, '');
  const type = pageType(rel);
  const c = (cov[type] = cov[type] || { n: 0, answer: 0, answerFirst: 0, types: {} });
  c.n++;
  const html = readFileSync(file, 'utf8');
  if (/class="[^"]*\banswer-first\b/.test(html)) c.answerFirst++;
  let hasAnswerSchema = false;
  for (const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    blocks++;
    let data;
    try { data = JSON.parse(m[1]); } catch (e) { errors.push(`${rel}: invalid JSON-LD (${e.message})`); continue; }
    for (const d of Array.isArray(data) ? data : [data]) {
      const items = d['@graph'] ? d['@graph'] : [d];
      for (const it of items) {
        const t = it['@type'];
        c.types[t] = (c.types[t] || 0) + 1;
        if (t === 'FAQPage' || t === 'HowTo') hasAnswerSchema = true;
        const check = REQUIRED[t];
        if (!check) { errors.push(`${rel}: unknown @type ${t} (add a rule)`); continue; }
        if (!check(it)) errors.push(`${rel}: ${t} missing required properties`);
      }
    }
  }
  if (hasAnswerSchema) c.answer++;
}

const pct = (a, b) => (b ? Math.round((100 * a) / b) : 0);
console.log(`structured data: ${blocks} JSON-LD blocks across ${Object.values(cov).reduce((a, c) => a + c.n, 0)} pages`);
console.log('page type           pages  FAQ/HowTo   answer-first   types');
for (const [t, c] of Object.entries(cov).sort((a, b) => b[1].n - a[1].n)) {
  if (!quiet || t === 'word' || t === 'category' || t === 'guide' || t === 'age') {
    console.log(`${t.padEnd(20)}${String(c.n).padStart(5)}  ${String(pct(c.answer, c.n) + '%').padStart(6)}      ${String(pct(c.answerFirst, c.n) + '%').padStart(6)}      ${Object.entries(c.types).map(([k, v]) => `${k}:${v}`).join(' ')}`);
  }
}
if (errors.length) {
  console.error(`\n✗ ${errors.length} schema problems:`);
  for (const e of errors.slice(0, 30)) console.error('  ' + e);
  process.exit(1);
}
console.log('\n✓ every JSON-LD block parses and carries its required properties');
