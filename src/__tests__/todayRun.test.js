import { describe, it, expect } from 'vitest';
import { pickTodayWords, probeFor, spellTiles, TODAY_SIZE } from '../utils/todayRun';

const DAY = 86400000;
const NOW = 1_800_000_000_000;
const W = (id, level = 'beginner', word = id) => ({ id, word, level });
const words = [
  ...Array.from({ length: 30 }, (_, i) => W(`b${i}`)),
  ...Array.from({ length: 30 }, (_, i) => W(`i${i}`, 'intermediate')),
];
let seed = 1;
const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

describe('pickTodayWords', () => {
  it('a brand-new player gets a full run of words from their level', () => {
    const run = pickTodayWords(words, {}, { now: NOW, rand });
    expect(run).toHaveLength(TODAY_SIZE);
    expect(run.every((w) => w.level === 'beginner')).toBe(true);
  });

  it('due words first (most overdue), then recent misses, at most 3 new, then top-up', () => {
    const wp = {
      b0: { lastSeen: NOW - 10 * DAY, interval: 3, correct: 2, wrong: 0 }, // overdue 7
      b1: { lastSeen: NOW - 2 * DAY, interval: 1, correct: 1, wrong: 0 }, // overdue 1
      b2: { lastSeen: NOW - 0.5 * DAY, interval: 1, correct: 0, wrong: 2 }, // missed, not due
      b3: { lastSeen: NOW - 1 * DAY, interval: 7, correct: 3, wrong: 0 }, // settled, not due
      // enough other history to fill the run, so the new-word cap applies
      ...Object.fromEntries([4, 5, 6, 7, 8, 9, 10].map((n) => [`b${n}`, { lastSeen: NOW - DAY, interval: 14, correct: 4, wrong: 0 }])),
    };
    const run = pickTodayWords(words, wp, { now: NOW, rand, unlockedLevels: ['beginner', 'intermediate'] });
    const ids = run.map((w) => w.id);
    expect(ids).toEqual(expect.arrayContaining(['b0', 'b1', 'b2', 'b3']));
    const fresh = run.filter((w) => !wp[w.id]);
    expect(fresh).toHaveLength(3); // capped, and from the highest unlocked level
    expect(fresh.every((w) => w.level === 'intermediate')).toBe(true);
  });

  it('a child with little history still gets a full run (more new words fill the gap)', () => {
    const wp = { b0: { lastSeen: NOW - 9 * DAY, interval: 3, correct: 2, wrong: 0 }, b1: { lastSeen: NOW - 9 * DAY, interval: 3, correct: 1, wrong: 0 } };
    const run = pickTodayWords(words, wp, { now: NOW, rand });
    expect(run).toHaveLength(TODAY_SIZE);
    expect(run.map((w) => w.id)).toEqual(expect.arrayContaining(['b0', 'b1']));
  });

  it('never repeats a word in one run', () => {
    const wp = Object.fromEntries(words.slice(0, 20).map((w, i) => [w.id, { lastSeen: NOW - i * DAY, interval: 1, correct: 1, wrong: i % 2 }]));
    const run = pickTodayWords(words, wp, { now: NOW, rand });
    expect(new Set(run.map((w) => w.id)).size).toBe(run.length);
    expect(run.length).toBe(TODAY_SIZE);
  });
});

describe('probeFor', () => {
  const wp = { a: { correct: 0 }, b: { correct: 3 }, c: { correct: 6 } };
  it('picture → hear → spell as a word is retrieved more', () => {
    expect(probeFor(W('a', 'beginner', 'cat'), wp)).toBe('picture');
    expect(probeFor(W('b', 'beginner', 'cat'), wp)).toBe('hear');
    expect(probeFor(W('c', 'beginner', 'cat'), wp)).toBe('spell');
  });
  it('long or multi-word words are never spelled; pre-readers always hear', () => {
    expect(probeFor(W('c', 'beginner', 'ice cream'), wp)).toBe('hear');
    expect(probeFor(W('c', 'beginner', 'butterfly'), wp)).toBe('hear');
    expect(probeFor(W('a', 'beginner', 'cat'), wp, false)).toBe('hear');
  });
});

describe('spellTiles', () => {
  it('has every letter of the word plus 2 decoys that are not in it', () => {
    const tiles = spellTiles('apple', { rand });
    expect(tiles).toHaveLength(7);
    const letters = tiles.map((t) => t.ch);
    for (const ch of 'apple') letters.splice(letters.indexOf(ch), 1);
    expect(letters).toHaveLength(2);
    expect(letters.every((ch) => !'apple'.includes(ch))).toBe(true);
  });
});
