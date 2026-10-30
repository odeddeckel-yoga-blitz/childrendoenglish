// Band I pages (scripts/build-band1-pages.mjs) + the mapping (src/data/band1.js).
// The rules the owner set (2026-10-29): map, don't copy — only OUR words are
// flagged, ~10% non-Band-I bonus words per topic are visibly chipped, the
// coverage counts only real Band I words, and nothing is in Ministry order.
import { describe, it, expect } from 'vitest';
import { WORDS } from '../data/words';
import { UNITS } from '../data/units';
import { BAND1_BY_ID, BAND1_BY_TEXT, BAND1_TOTAL } from '../data/band1';
import { band1Topics, band1Path, PATH_SETS } from '../../scripts/build-band1-pages.mjs';

const HE = { animals: 'חיות', food: 'אוכל ושתייה' };

describe('Band I mapping', () => {
  it('flags only words CDE already has — the Ministry list itself is not stored', () => {
    const ids = new Set(WORDS.map((w) => w.id));
    expect(Object.keys(BAND1_BY_ID).every((id) => ids.has(id))).toBe(true);
    const unitText = new Set(UNITS.flatMap((u) => u.words.filter((w) => !w.wordId).map((w) => w.en.toLowerCase().trim())));
    expect(Object.keys(BAND1_BY_TEXT).every((t) => unitText.has(t))).toBe(true);
    const levels = new Set([...Object.values(BAND1_BY_ID), ...Object.values(BAND1_BY_TEXT)]);
    expect([...levels].every((l) => ['pre', 'c1', 'c2'].includes(l))).toBe(true);
    // a partial mapping, well short of the whole list
    expect(Object.keys(BAND1_BY_ID).length + Object.keys(BAND1_BY_TEXT).length).toBeLessThan(BAND1_TOTAL * 0.5);
  });
});

describe('Band I topics', () => {
  const topics = band1Topics({ WORDS, BAND1_BY_ID, CATEGORY_NAMES_HE: HE });

  it('~10% bonus words per topic, chipped; the count covers Band I words only', () => {
    for (const t of topics) {
      const band = t.words.filter((w) => w.tag !== 'extra');
      const extra = t.words.filter((w) => w.tag === 'extra');
      expect(band.length).toBe(t.bandCount);
      const available = WORDS.filter((w) => t.cats.includes(w.category) && !BAND1_BY_ID[w.id]).length;
      expect(extra.length).toBe(Math.min(available, Math.max(1, Math.ceil(t.bandCount * 0.1))));
      for (const w of extra) expect(BAND1_BY_ID[w.wordId]).toBeUndefined();
      for (const w of t.words) expect(w.chip?.label).toBeTruthy();
    }
  });

  it('ordered by level then our own word order — not alphabetical', () => {
    const rank = { pre: 0, c1: 1, c2: 2, extra: 3 };
    for (const t of topics) {
      const r = t.words.map((w) => rank[w.tag]);
      expect(r).toEqual([...r].sort((a, b) => a - b));
    }
    const food = topics.find((t) => t.slug === 'food').words.filter((w) => w.tag === 'c1').map((w) => w.en);
    expect(food).not.toEqual([...food].sort());
  });

  it('every page word has audio-ready data (gloss + example sentence)', () => {
    for (const t of topics) for (const w of t.words) { expect(w.he).toBeTruthy(); expect(w.ex).toBeTruthy(); }
  });
});

describe('Band I review path (RC4)', () => {
  const sets = band1Path({ WORDS, BAND1_BY_ID, CATEGORY_NAMES_HE: HE });
  const bandOf = (s) => s.words.filter((w) => w.tag !== 'extra');

  it('14 near-equal sets cover every Band I word exactly once', () => {
    expect(sets).toHaveLength(PATH_SETS);
    const ids = sets.flatMap((s) => bandOf(s).map((w) => w.wordId));
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.length).toBe(Object.keys(BAND1_BY_ID).length);
    const sizes = sets.map((s) => s.bandCount);
    expect(Math.max(...sizes) - Math.min(...sizes)).toBeLessThanOrEqual(1);
  });

  it('easiest level first across the whole path', () => {
    const rank = { pre: 0, c1: 1, c2: 2 };
    const r = sets.flatMap((s) => bandOf(s).map((w) => rank[w.tag]));
    expect(r).toEqual([...r].sort((a, b) => a - b));
  });

  it('one chipped bonus word per set, not on Band I, never repeated', () => {
    const extras = sets.map((s) => s.words.filter((w) => w.tag === 'extra'));
    for (const e of extras) {
      expect(e).toHaveLength(1);
      expect(BAND1_BY_ID[e[0].wordId]).toBeUndefined();
      expect(e[0].chip.label).toMatch(/בונוס/);
    }
    const ids = extras.map((e) => e[0].wordId);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
