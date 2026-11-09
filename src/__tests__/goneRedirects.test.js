// Every word page the site has ever served (scripts/published-word-urls.json) is either live now or 301s somewhere
// live (vercel.json). 11-09: Search Console "Not found (404)" came from 157 removed / moved word pages, including the
// whole actions, body, family and weather categories, that had no redirect.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { WORDS } from '../data/words';
import { PAGES_HOLD } from '../data/pagesHold';

const ROOT = join(import.meta.dirname, '..', '..');
const published = JSON.parse(readFileSync(join(ROOT, 'scripts', 'published-word-urls.json'), 'utf8'));
const { redirects } = JSON.parse(readFileSync(join(ROOT, 'vercel.json'), 'utf8'));
const liveWords = new Set(WORDS.filter((w) => !PAGES_HOLD.has(w.id)).map((w) => `/vocabulary/${w.category}/${w.id}/`));
const cats = new Set(WORDS.map((w) => w.category));
const livePage = (p) => liveWords.has(p) || p === '/vocabulary/' || p === '/printable-flashcards/' ||
  [...cats].some((c) => p === `/vocabulary/${c}/`);
// vercel.json sources: exact paths, or ':name(regex)' segments. Exact sources match only themselves (no implied
// trailing slash: Vercel needs both spellings listed), and ':path*' is refused because it missed '/weather/fog/' (11-09).
const toRe = (src) => {
  if (src.includes(':path*')) throw new Error(`use :path(.*) not :path* in ${src}`);
  return new RegExp('^' + src.replace(/:\w+\(([^)]+)\)/g, '(?:$1)') + '$');
};
const target = (p) => { const r = redirects.find((x) => toRe(x.source).test(p)); return r && r.destination; };
const bothSpellings = (p) => [p, p.replace(/\/$/, '')];

describe('removed and moved word pages', () => {
  it('every word page live now is recorded (run node scripts/record-published-words.mjs)', () => {
    const missing = [...liveWords].filter((p) => !published.includes(p));
    expect(missing).toEqual([]);
  });
  it('every page ever published is live or redirects to a live page', () => {
    const broken = published.filter((p) => !liveWords.has(p))
      .flatMap(bothSpellings).filter((p) => { const d = target(p); return !d || !livePage(d); });
    expect(broken).toEqual([]);
  });
  it('a moved word goes to its new page, not just the category', () => {
    expect(target('/vocabulary/body/hand/')).toBe('/vocabulary/everyday/hand/');
    expect(target('/vocabulary/colors/orange')).toBe('/vocabulary/food/orange/');
    expect(target('/vocabulary/weather/fog/')).toBe('/vocabulary/');
    expect(target('/vocabulary/weather/fog')).toBe('/vocabulary/');
    expect(target('/printable-flashcards/family/')).toBe('/printable-flashcards/');
    expect(target('/vocabulary/weather')).toBe('/vocabulary/');
    expect(target('/vocabulary/clothing/beret/')).toBe('/vocabulary/clothing/');
  });
});
