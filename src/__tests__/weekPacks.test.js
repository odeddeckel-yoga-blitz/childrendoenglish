import { describe, it, expect } from 'vitest';
import { packData, pickPackWords, wordSearch, blanks, PACK_WORDS, PACK_SIDE, PACK_GRADES } from '../../scripts/build-week-packs.mjs';
import { gradeWords } from '../../scripts/build-grade-pages.mjs';
import { WORDS, CATEGORIES } from '../data/words';
import { UNITS, BOOKS } from '../data/units';
import { BAND1_BY_ID } from '../data/band1';
import ES_GLOSSES from '../data/word-glosses-es';
import { CHANTS, chantLine } from '../data/chants';
import { sentenceAudio } from '../../scripts/sentence-audio.mjs';


// Printable week packs (audit 11-18 idea 6): every pack the build makes, checked the way a teacher would — every word
// in the search is really in the grid, the key matches each sheet, nothing gives the answer away.
const byId = new Map(WORDS.map((w) => [w.id, w]));
const live = UNITS.filter((u) => !u.test && !BOOKS[u.book]?.test);
const PACKS = [
  ...live.map((u) => [`he-${u.book}-${u.unit}`, u.words.map((w) => ({ en: w.en, gloss: w.he, img: w.wordId ? byId.get(w.wordId)?.imageUrl || null : null, ex: w.ex || null }))]),
  ...PACK_GRADES.map((n) => [`he-grade-${n}`, gradeWords(n, { WORDS, BAND1_BY_ID }).map((w) => ({ en: w.word, gloss: w.hebrewTranslation, img: w.imageUrl, ex: w.exampleSentence }))]),
  ...CATEGORIES.map((c) => [`es-${c}`, WORDS.filter((w) => w.category === c && ES_GLOSSES[w.id]).map((w) => ({ en: w.word, gloss: ES_GLOSSES[w.id], img: w.imageUrl, ex: w.exampleSentence }))]),
];

describe('week packs', () => {
  it('covers every live unit, grades 3–6 and the 13 Spanish topics', () => {
    expect(live.length).toBeGreaterThanOrEqual(11);
    expect(PACKS).toHaveLength(live.length + 4 + CATEGORIES.length);
  });

  for (const [id, items] of PACKS) {
    it(`${id}: a full pack whose answer key matches its sheets`, () => {
      const d = packData(id, items);
      expect(d.words.length).toBe(PACK_WORDS);
      expect(new Set(d.words.map((w) => w.gloss)).size).toBe(d.words.length);       // matching has one right answer
      // matching: 8 rows, the glosses deranged (no gloss on its own word's row)
      expect(d.match).toHaveLength(PACK_SIDE);
      d.match.forEach((w, i) => expect(d.right[i]).not.toBe(w));
      expect(new Set(d.right)).toEqual(new Set(d.match));
      // word search: every listed word spells out along its cells, left→right or top→down
      expect(d.search.placed.length).toBeGreaterThanOrEqual(PACK_WORDS - 1);
      for (const p of d.search.placed) {
        expect(p.cells.map(([y, x]) => d.search.grid[y][x]).join('')).toBe(p.word.toUpperCase());
        const [[y0, x0], [y1, x1]] = p.cells;
        expect((y1 - y0) + (x1 - x0)).toBe(1);
      }
      // fill in the letters: first letter shown, at least one blank, the shown letters are the word's
      for (const l of d.letters) {
        expect(l.shown[0]).toBe(l.en.toLowerCase()[0]);
        expect(l.shown.some((c) => c === null)).toBe(true);
        l.shown.forEach((c, i) => c && expect(c).toBe(l.en.toLowerCase()[i]));
      }
      // read and draw: short sentences that contain their word
      expect(d.draw.length).toBeGreaterThanOrEqual(2);
      for (const s of d.draw) expect(s.ex.toLowerCase()).toContain(s.en.toLowerCase());
      // the same pack every build
      expect(packData(id, items)).toEqual(d);
    });
  }

  it('picks single words with pictures first and skips a repeated gloss', () => {
    const got = pickPackWords([
      { en: 'ice cream', gloss: 'a' }, { en: 'cat', gloss: 'b' }, { en: 'dog', gloss: 'c', img: '/x' }, { en: 'cats', gloss: 'b' },
    ], 2);
    expect(got.map((w) => w.en)).toEqual(['cat', 'dog']);
  });

  it('a word search that cannot fit a word leaves it out of the list rather than printing an impossible find', () => {
    const { placed } = wordSearch(['abcdefghijklmn'], 1, 12);
    expect(placed).toEqual([]);
    expect(blanks('cat', 3).filter((c) => c === null).length).toBe(1);
  });
});

describe('chant cards pilot', () => {
  it('3 chants, 4 lines of 4 beat groups, every line with its rendered audio, never called a song', () => {
    expect(CHANTS).toHaveLength(3);
    for (const c of CHANTS) {
      expect(c.lines.length).toBeGreaterThanOrEqual(4);
      for (const beats of c.lines) {
        expect(beats).toHaveLength(4);
        expect(sentenceAudio(chantLine(beats))).toBeTruthy();
      }
      expect(JSON.stringify(c)).not.toMatch(/\bsongs?\b/i);
    }
  });
});
