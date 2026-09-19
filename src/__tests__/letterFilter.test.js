import { describe, it, expect } from 'vitest';
import { filterByKnownLetters, letterCounts } from '../utils/letterFilter';
import { WORDS } from '../data/words';

const mini = [
  { word: 'cat' }, { word: 'Car' }, { word: 'dog' }, { word: 'apple' },
];

describe('filterByKnownLetters', () => {
  it('returns everything when no letters are set (null or empty)', () => {
    expect(filterByKnownLetters(mini, null)).toHaveLength(4);
    expect(filterByKnownLetters(mini, [])).toHaveLength(4);
  });

  it('keeps only words starting with known letters, case-insensitive', () => {
    const out = filterByKnownLetters(mini, ['c']);
    expect(out.map(w => w.word)).toEqual(['cat', 'Car']);
  });

  it('supports multiple letters', () => {
    const out = filterByKnownLetters(mini, ['C', 'A']);
    expect(out.map(w => w.word)).toEqual(['cat', 'Car', 'apple']);
  });

  it('letter C alone still yields a playable pool from the real vocabulary', () => {
    const out = filterByKnownLetters(WORDS, ['C']);
    expect(out.length).toBeGreaterThanOrEqual(10);
    expect(out.every(w => w.word[0].toUpperCase() === 'C')).toBe(true);
  });
});

describe('letterCounts', () => {
  it('counts words per starting letter', () => {
    const counts = letterCounts(mini);
    expect(counts.C).toBe(2);
    expect(counts.D).toBe(1);
    expect(counts.A).toBe(1);
  });

  it('every vocabulary word is counted exactly once', () => {
    const counts = letterCounts(WORDS);
    expect(Object.values(counts).reduce((a, b) => a + b, 0)).toBe(WORDS.length);
  });
});

describe('getDistractors with letter restriction', () => {
  it('draws options from the restricted pool when it suffices', async () => {
    const { getDistractors, WORDS: ALL } = await import('../data/words');
    const cPool = filterByKnownLetters(ALL, ['C']);
    const target = cPool.find(w => w.word === 'cat');
    for (let i = 0; i < 10; i++) {
      const d = getDistractors(target, 3, cPool);
      expect(d).toHaveLength(3);
      expect(d.every(w => w.word[0].toUpperCase() === 'C')).toBe(true);
    }
  });

  it('tops up from the full vocabulary when the pool is too small', async () => {
    const { getDistractors, WORDS: ALL } = await import('../data/words');
    const uPool = filterByKnownLetters(ALL, ['U']);
    const target = uPool[0];
    const d = getDistractors(target, 3, uPool);
    expect(d).toHaveLength(3);
  });
});
