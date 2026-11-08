// Word-page A/B (step 4): the arm assignment (src/data/wordPageVariant.js) and the Option A helpers
// (scripts/word-page-a.mjs): quiz round, picture credit, category labels.
import { describe, it, expect } from 'vitest';
import { WORDS, collides } from '../data/words.js';
import { PAGES_HOLD } from '../data/pagesHold.js';
import { pictureStyle } from '../data/imageStyle.js';
import { wordPageVariant, variantSplit, wordPageKey, parseWordPageKey, wordPageUrls, WORD_PAGE_AB } from '../data/wordPageVariant.js';
import { pickQuizRound, pictureCredit, shortAuthor, categoryNoun, categoryShort, boldWord } from '../../scripts/word-page-a.mjs';
import { isPhoto } from '../../scripts/page-copy.mjs';

const LIVE = WORDS.filter((w) => !PAGES_HOLD.has(w.id));

describe('word-page A/B assignment', () => {
  it('splits every category about in half (within 2 words or 10 %)', () => {
    const split = variantSplit(LIVE);
    expect(Object.keys(split).length).toBeGreaterThan(10);
    for (const [cat, { a, b }] of Object.entries(split)) {
      const n = a.length + b.length;
      expect(Math.abs(a.length - n / 2), `${cat}: ${a.length}/${n}`).toBeLessThanOrEqual(Math.max(2, 0.1 * n));
    }
  });
  it('splits drawn and photo words about in half too', () => {
    const drawn = LIVE.filter((w) => pictureStyle(w.id) === 'drawn');
    const a = drawn.filter((w) => wordPageVariant(w.id) === 'a').length;
    expect(Math.abs(a - drawn.length / 2)).toBeLessThanOrEqual(0.1 * drawn.length);
  });
  it('is stable: a word keeps its arm whatever else is in the list, and the salt is pinned', () => {
    expect(WORD_PAGE_AB.salt).toBe('wp1360'); // changing it reshuffles every page mid-test
    // pinned arms of the two mockup words and a few others (changing these means the test was reshuffled)
    expect(['cat', 'nervous', 'dog', 'happy', 'elephant'].map(wordPageVariant)).toEqual(['b', 'a', 'b', 'a', 'a']);
    const full = variantSplit(LIVE);
    const more = variantSplit([...LIVE, { id: 'zz-new-word', category: 'animals' }, { id: 'aardvark', category: 'animals' }]);
    for (const cat of Object.keys(full)) {
      expect(more[cat].a.filter((id) => id !== 'zz-new-word' && id !== 'aardvark')).toEqual(full[cat].a);
    }
    const half = variantSplit(LIVE.filter((_, i) => i % 2));
    for (const [cat, { a }] of Object.entries(half)) for (const id of a) expect(full[cat].a).toContain(id);
  });
  it('page keys round-trip; the old key still parses', () => {
    expect(wordPageKey('a', 'drawn')).toBe('vocabulary_word-a-drawn');
    expect(parseWordPageKey('vocabulary_word-b-photo')).toEqual({ arm: 'b', pic: 'photo' });
    expect(parseWordPageKey('vocabulary_word')).toEqual({ arm: null, pic: null });
    expect(parseWordPageKey('vocabulary_word-c-photo')).toBeNull();
    expect(parseWordPageKey('vocabulary_animals')).toBeNull();
    expect(wordPageKey('a', 'photo')).toMatch(/^[a-z0-9_-]{1,40}$/); // api/land.js PAGE_KEY accepts it: no api change
  });
  it('URL lists per arm cover every live word page once', () => {
    const a = wordPageUrls(LIVE, 'a'), b = wordPageUrls(LIVE, 'b');
    expect(a.length + b.length).toBe(LIVE.length);
    expect(a).toContain('https://childrendoenglish.com/vocabulary/feelings/nervous/');
    expect(b).toContain('https://childrendoenglish.com/vocabulary/animals/cat/');
  });
});

describe('Option A mini-quiz round', () => {
  it('every live word: 3 different pictures, all one style, no colliding / confusable pair, answer included', () => {
    for (const w of LIVE) {
      const r = pickQuizRound(w, LIVE.filter((x) => x.category === w.category), LIVE);
      expect(r, w.id).toHaveLength(3);
      expect(r.map((x) => x.id)).toContain(w.id);
      expect(new Set(r.map((x) => pictureStyle(x.id))).size, w.id).toBe(1);
      for (const x of r) for (const y of r) if (x !== y) expect(collides(x, y), `${w.id}: ${x.id}/${y.id}`).toBe(false);
    }
  });
  it('nervous: emoji only, never worried or scared (CONFUSABLE_PAIRS)', () => {
    const nervous = LIVE.find((w) => w.id === 'nervous');
    const ids = pickQuizRound(nervous, LIVE.filter((x) => x.category === 'feelings'), LIVE).map((x) => x.id);
    expect(ids).not.toContain('worried');
    expect(ids).not.toContain('scared');
  });
  it('is deterministic and does not always put the answer first', () => {
    const firsts = LIVE.slice(0, 60).map((w) => pickQuizRound(w, LIVE.filter((x) => x.category === w.category), LIVE)[0].id === w.id);
    expect(firsts.some(Boolean)).toBe(true);
    expect(firsts.every(Boolean)).toBe(false);
    const cat = LIVE.find((w) => w.id === 'cat');
    const pool = LIVE.filter((x) => x.category === 'animals');
    expect(pickQuizRound(cat, pool, LIVE)).toEqual(pickQuizRound(cat, pool, LIVE));
  });
});

describe('Option A picture credit', () => {
  it('a photo says Photo + author + licence', () => {
    expect(pictureCredit('cat')).toMatchObject({ label: 'Photo', text: 'Alvesgaspar, CC BY-SA 3.0' });
  });
  it('an emoji says what it is, never Photo', () => {
    expect(pictureCredit('nervous')).toMatchObject({ label: 'Picture', text: 'Twemoji emoji drawing, CC BY 4.0' });
  });
  it('only real photos (page-copy isPhoto) are ever labelled Photo', () => {
    for (const w of LIVE) {
      const c = pictureCredit(w.id);
      expect(c.label, w.id).toBe(isPhoto(w.id) ? 'Photo' : 'Picture');
      expect(c.text.length, w.id).toBeLessThan(90);
    }
  });
  it('long Commons author fields are cut, not dropped', () => {
    expect(shortAuthor('Alvesgaspar')).toBe('Alvesgaspar');
    const s = shortAuthor('Anax_imperator_qtl2.jpg: Quartl Cetonia-aurata.jpg: Crumps Unidentified_Mantid_Species');
    expect(s.length).toBeLessThanOrEqual(37);
    expect(s.endsWith('…')).toBe(true);
  });
});

describe('Option A labels', () => {
  it('category noun and short name', () => {
    expect(categoryNoun('animals', 'Animals')).toBe('animal');
    expect(categoryNoun('feelings', 'Feelings & Emotions')).toBe('feelings');
    expect(categoryShort('Feelings & Emotions')).toBe('Feelings');
  });
  it('bolds the word in the example, escaped', () => {
    expect(boldWord('The cat sat on the <mat>.', 'cat')).toBe('The <strong>cat</strong> sat on the &lt;mat&gt;.');
    expect(boldWord('Cats purr.', 'cat')).toBe('<strong>Cats</strong> purr.');
  });
});
