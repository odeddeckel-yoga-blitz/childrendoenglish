import { describe, it, expect } from 'vitest';
import { mkdtempSync, readFileSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { WORDS, collides } from '../data/words';
import { BOOKS, UNITS } from '../data/units';
import { buildUnitPages } from '../../scripts/build-unit-pages.mjs';

const escapeHtml = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const publicDir = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'public');

function build(units, books = BOOKS) {
  const distDir = mkdtempSync(join(tmpdir(), 'units-'));
  const urls = buildUnitPages({
    SITE: 'https://childrendoenglish.com', distDir, publicDir, escapeHtml, WORDS, collides, BOOKS: books, UNITS: units,
    writePage: (p, html) => writeFileSync(p, html, 'utf-8'),
  });
  const read = (path) => readFileSync(join(distDir, ...path.split('/').filter(Boolean), 'index.html'), 'utf-8');
  return { urls, read };
}
const unitData = (html) => JSON.parse(html.match(/<script type="application\/json" id="unit-data">(.*?)<\/script>/s)[1]);

describe('textbook-unit pages', () => {
  it('the shipped data builds, and every test unit stays out of search', () => {
    const { urls, read } = build(UNITS);
    for (const u of UNITS.filter((x) => x.test || BOOKS[x.book].test)) {
      expect(read(`/units/${u.book}/unit-${u.unit}/`)).toContain('content="noindex, nofollow"');
      expect(urls).not.toContain(`/units/${u.book}/unit-${u.unit}/`);
    }
    if (!UNITS.some((u) => !(u.test || BOOKS[u.book].test))) {
      expect(urls).toEqual([]);
      expect(read('/units/')).toContain('content="noindex, nofollow"');
    }
  });

  it('no test book in the shipped data, and the hub never lists one next to live books (CUX1)', () => {
    expect(Object.values(BOOKS).some((b) => b.test)).toBe(false);
    expect(UNITS.some((u) => u.test)).toBe(false);
    const books = { ...BOOKS, 'tmpl': { name: 'Template Test', publisher: 'X', test: true } };
    const live = { ...UNITS[0], book: 'jet-2', unit: 3, test: false, source: 'https://example.com/list.pdf' };
    const { read } = build([live, { ...UNITS[0], book: 'tmpl', unit: 1, test: true }], books);
    expect(read('/units/')).not.toContain('Template Test');
    expect(read('/units/')).toContain('href="/units/jet-2/"');
  });

  it('a live unit is indexable and enters the sitemap with its book index and the hub', () => {
    const live = { ...UNITS[0], book: 'jet-2', unit: 3, title: undefined, test: false, source: 'https://example.com/list.pdf' };
    const { urls, read } = build([live]);
    expect(urls.sort()).toEqual(['/units/', '/units/jet-2/', '/units/jet-2/unit-3/']);
    const html = read('/units/jet-2/unit-3/');
    expect(html).toContain('content="index, follow"');
    expect(html).toContain('<title>Jet 2 Unit 3 – מילים באנגלית עם הגייה, תרגום ומשחקים</title>');
    expect(html).toContain('"@type":"FAQPage"');
    expect(html).toContain('"@type":"BreadcrumbList"');
    expect(html).toContain('Eric Cohen Books');
    expect(html).toContain('classroom.google.com/share?url=');
    expect(html).toContain('teams.microsoft.com/share?href=');
    expect(html).toContain('href="https://wa.me/?text=');
    expect(html).toContain('data-copy="https://childrendoenglish.com/units/jet-2/unit-3/"');
    expect(html).toContain('data-mode="dict"');
    // CUX9: a '▶ Practise' jump in the hero (practice sits below a long table)
    expect(html).toContain('<a class="jump-btn" href="#practice-h">');
    expect(html).toContain('data-sheet="bingo"');
    expect(html).toContain('data-sheet="search"');
    expect(html).toContain('data-sheet="cross"'); // E2: picture crossword + answer key
    expect(html).toContain('<div id="sheets-out" data-name="Jet 2 Unit 3" data-lang="he" aria-hidden="true"></div>');
    expect(html).toContain('<script defer src="/crossword.js"></script>');
    expect(html).toContain('<script defer src="/unit-sheets.js"></script>');
    // the card images are lazy: printing must go through print-btn.js, which loads them first
    expect(html).toContain('<script defer src="/print-btn.js"></script>');
    // RC12: pin as "this week in class"; the hub shows the pinned unit
    expect(html).toContain('data-pin-unit="/units/jet-2/unit-3/" data-pin-name="Jet 2 Unit 3"');
    expect(read('/units/')).toContain('id="week-unit"');
  });

  it('a live unit needs its source URL; titles and example sentences render', () => {
    const base = { book: 'jet-2', unit: 9, words: UNITS[0].words.slice(0, 4) };
    expect(() => build([base])).toThrow(/needs source/);
    const words = [{ ...base.words[0], ex: 'I eat an apple.' }, ...base.words.slice(1)];
    const { read } = build([{ ...base, title: "Let's Play", source: 'https://example.com/u9.pdf', words }]);
    const html = read('/units/jet-2/unit-9/');
    expect(html).toContain("<title>Jet 2 Unit 9: Let's Play – ");
    expect(html).toContain('<span class="ex">I eat an apple.</span>');
    expect(html).toContain('class="aligned"');
    expect(html).not.toContain('example.com');
  });

  it('every live unit: source recorded, and every word has our own example sentence', () => {
    for (const u of UNITS.filter((x) => !(x.test || BOOKS[x.book].test))) {
      expect(u.source).toMatch(/^https:\/\//);
      for (const w of u.words) expect(w.ex, `${u.book} ${u.unit} ${w.en}`).toMatch(/\w/);
    }
  });

  it('hear-and-pick options: 4 distinct Hebrew meanings, the answer correct, no colliding distractor', () => {
    const { read } = build(UNITS);
    const u = UNITS[0];
    const items = unitData(read(`/units/${u.book}/unit-${u.unit}/`));
    expect(items).toHaveLength(u.words.length);
    const byHe = new Map(WORDS.map((w) => [w.hebrewTranslation, w]));
    for (const it of items) {
      const src = u.words.find((w) => w.en === it.en);
      expect(new Set(it.opts).size).toBe(4);
      expect(it.opts[it.ans]).toBe(src.he);
      const target = WORDS.find((w) => w.id === src.wordId) || { id: 'x', word: src.en, hebrewTranslation: src.he };
      for (const o of it.opts.filter((o) => o !== src.he)) {
        const other = byHe.get(o) || { id: 'y', word: o, hebrewTranslation: o };
        expect(collides(target, other)).toBe(false);
      }
    }
  });

  it('unit-only words get no photo; CDE words show theirs', () => {
    const { read } = build(UNITS);
    const u = UNITS.find((x) => x.words.some((w) => !w.wordId) && x.words.some((w) => w.wordId));
    const html = read(`/units/${u.book}/unit-${u.unit}/`);
    for (const w of u.words) {
      const img = w.wordId && WORDS.find((x) => x.id === w.wordId).imageUrl;
      if (img) expect(html).toContain(`src="${img}"`);
    }
    const only = u.words.find((w) => !w.wordId);
    expect(unitData(html).find((x) => x.en === only.en).id).toBeNull();
  });

  it('refuses a word with no rendered audio, and an unknown wordId', () => {
    const base = { book: 'jet-2', unit: 1, source: 'https://example.com/u1.pdf', words: UNITS[0].words.slice(0, 4) };
    expect(() => build([{ ...base, words: [...base.words, { en: 'xyzzyword', he: 'בדיקה' }] }])).toThrow(/no audio/);
    expect(() => build([{ ...base, words: [...base.words, { en: 'cat', he: 'חתול', wordId: 'not-a-word' }] }])).toThrow(/not in words.js/);
  });
});
