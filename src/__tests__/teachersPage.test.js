// /teachers/ count helpers (scripts/build-teachers-page.mjs): every number on the page comes from the data (P5).
import { describe, it, expect } from 'vitest';
import { gradeNumber, teacherBooks, band1Counts, band1Sample, buildTeachersHtml } from '../../scripts/build-teachers-page.mjs';
import { BOOKS, UNITS } from '../data/units.js';
import { BAND1_BY_ID } from '../data/band1.js';
import { WORDS, CATEGORIES } from '../data/words.js';
import { DRAWN } from '../data/imageStyle.js';

describe('teachers page helpers', () => {
  it('reads the Hebrew grade letter as a number', () => {
    expect(gradeNumber('ג׳')).toBe(3);
    expect(gradeNumber('ה׳')).toBe(5);
    expect(gradeNumber('')).toBeNull();
  });

  it('book tiles = the live units of units.js, per book, in unit order; empty books left out', () => {
    const books = teacherBooks(BOOKS, UNITS);
    const live = UNITS.filter((u) => !u.test);
    expect(books.reduce((n, b) => n + b.units.length, 0)).toBe(live.length);
    for (const b of books) {
      expect(b.units.length).toBe(live.filter((u) => u.book === b.slug).length);
      expect(b.units.map((u) => u.unit)).toEqual([...b.units.map((u) => u.unit)].sort((x, y) => x - y));
    }
    expect(books.every((b) => b.units.length > 0)).toBe(true);
    // a test unit and a book with no live unit never show
    const fake = teacherBooks({ a: { name: 'A' }, b: { name: 'B' } }, [
      { book: 'a', unit: 2, grade: 'ד׳', words: [1] }, { book: 'a', unit: 1, grade: 'ד׳', words: [1, 2] },
      { book: 'b', unit: 1, grade: 'ד׳', words: [1], test: true },
    ]);
    expect(fake.map((b) => b.slug)).toEqual(['a']);
    expect(fake[0].units.map((u) => u.unit)).toEqual([1, 2]);
    expect(fake[0].grades).toEqual([4]);
  });

  it('Band I counts are the level tallies of band1.js', () => {
    const c = band1Counts(BAND1_BY_ID);
    const vals = Object.values(BAND1_BY_ID);
    expect(c.pre).toBe(vals.filter((v) => v === 'pre').length);
    expect(c.c1).toBe(vals.filter((v) => v === 'c1').length);
    expect(c.c2).toBe(vals.filter((v) => v === 'c2').length);
    expect(c.total).toBe(vals.length);
    expect(band1Counts({ a: 'pre', b: 'c2', c: 'c2' })).toEqual({ pre: 1, c1: 0, c2: 2, total: 3 });
  });

  it('Band I sample rows follow OUR word order, never the alphabetical Ministry order', () => {
    const rows = band1Sample(WORDS, BAND1_BY_ID, 2);
    const pos = new Map(WORDS.map((w, i) => [w.id, i]));
    for (const lvl of ['pre', 'c1', 'c2']) {
      const ids = rows.filter((r) => r.lvl === lvl).map((r) => r.w.id);
      expect(ids).toHaveLength(2);
      expect(ids.map((id) => pos.get(id))).toEqual(ids.map((id) => pos.get(id)).sort((a, b) => a - b));
    }
  });

  it('the page states the data counts and puts English / Hebrew in LTR / RTL cells', () => {
    const html = buildTeachersHtml({
      SITE: 'https://x', escapeHtml: (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'),
      WORDS, CATEGORIES, CATEGORY_NAMES: {}, CATEGORY_NAMES_ES: {}, ES_GLOSSES: {}, DRAWN, BOOKS, UNITS, BAND1_BY_ID,
      band1FileText: '(file says: updated 2023-01-26)', gamesCount: 17, wordsLabel: '530+',
    });
    const c = band1Counts(BAND1_BY_ID);
    expect(html).toContain(`${c.total} of our words are on the Ministry`);
    expect(html).toContain(`Word lists for the ${UNITS.filter((u) => !u.test).length} units`);
    expect(html).toMatch(/<td lang="he" dir="rtl">/);
    expect(html).toMatch(/<td lang="en" dir="ltr">/);
    expect(html).toContain('Not connected to Eric Cohen Books');
    expect(html).toContain('file updated 2023-01-26');
    expect(html).not.toMatch(/<script>(?!\s*<\/script>)/); // CSP: no inline script
  });
});
