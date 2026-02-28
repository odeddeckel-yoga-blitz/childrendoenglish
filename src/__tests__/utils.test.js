import { describe, it, expect, beforeEach, vi } from 'vitest';
import { fisherYatesShuffle } from '../utils/shuffle';
import { spacedRepetitionSort, updateWordSR, selectQuizWords, isWordMastered } from '../utils/spaced-repetition';
import { updateStreak, updateDailyGoal } from '../utils/storage';

describe('fisherYatesShuffle', () => {
  it('returns array of same length', () => {
    const arr = [1, 2, 3, 4, 5];
    const shuffled = fisherYatesShuffle(arr);
    expect(shuffled).toHaveLength(arr.length);
  });

  it('contains same elements', () => {
    const arr = [1, 2, 3, 4, 5];
    const shuffled = fisherYatesShuffle(arr);
    expect(shuffled.sort()).toEqual(arr.sort());
  });

  it('does not mutate original', () => {
    const arr = [1, 2, 3, 4, 5];
    const copy = [...arr];
    fisherYatesShuffle(arr);
    expect(arr).toEqual(copy);
  });

  it('handles empty array', () => {
    expect(fisherYatesShuffle([])).toEqual([]);
  });

  it('handles single element', () => {
    expect(fisherYatesShuffle([42])).toEqual([42]);
  });
});

describe('spacedRepetitionSort', () => {
  const words = [
    { id: 'a' }, { id: 'b' }, { id: 'c' },
  ];

  it('unseen words get priority 1', () => {
    const sorted = spacedRepetitionSort(words, {});
    expect(sorted).toHaveLength(3);
  });

  it('overdue words come first', () => {
    const progress = {
      a: { lastSeen: Date.now() - 86400000 * 10, interval: 1 }, // overdue
      b: { lastSeen: Date.now(), interval: 30 }, // not due
    };
    const sorted = spacedRepetitionSort(words, progress);
    expect(sorted[0].id).toBe('a'); // overdue first
  });
});

describe('updateWordSR', () => {
  it('creates new entry for unseen word', () => {
    const result = updateWordSR({}, 'test', true);
    expect(result.test).toBeDefined();
    expect(result.test.correct).toBe(1);
    expect(result.test.interval).toBe(3); // first correct goes to 3
  });

  it('resets interval on wrong answer', () => {
    const progress = { test: { lastSeen: Date.now(), interval: 7, correct: 3, wrong: 0 } };
    const result = updateWordSR(progress, 'test', false);
    expect(result.test.interval).toBe(1);
    expect(result.test.wrong).toBe(1);
  });

  it('advances interval on correct answer', () => {
    const progress = { test: { lastSeen: Date.now(), interval: 3, correct: 1, wrong: 0 } };
    const result = updateWordSR(progress, 'test', true);
    expect(result.test.interval).toBe(7);
    expect(result.test.correct).toBe(2);
  });
});

describe('selectQuizWords', () => {
  const words = Array.from({ length: 20 }, (_, i) => ({ id: `word${i}` }));

  it('selects requested number of words', () => {
    const selected = selectQuizWords(words, {}, 10);
    expect(selected).toHaveLength(10);
  });

  it('returns all words if pool is small', () => {
    const smallPool = words.slice(0, 5);
    const selected = selectQuizWords(smallPool, {}, 10);
    expect(selected.length).toBeLessThanOrEqual(5);
  });

  it('no duplicates', () => {
    const selected = selectQuizWords(words, {}, 10);
    const ids = selected.map(w => w.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('isWordMastered', () => {
  it('returns false for unseen word', () => {
    expect(isWordMastered({}, 'test')).toBeFalsy();
  });

  it('returns false for low interval', () => {
    expect(isWordMastered({ test: { interval: 7 } }, 'test')).toBe(false);
  });

  it('returns true for high interval', () => {
    expect(isWordMastered({ test: { interval: 14 } }, 'test')).toBe(true);
  });
});

describe('updateStreak', () => {
  it('starts streak at 1 for new user', () => {
    const stats = { currentStreak: 0, longestStreak: 0, lastActiveDate: null };
    const result = updateStreak(stats);
    expect(result.currentStreak).toBe(1);
    expect(result.longestStreak).toBe(1);
  });

  it('increments streak for consecutive days', () => {
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    const stats = { currentStreak: 3, longestStreak: 5, lastActiveDate: yesterday };
    const result = updateStreak(stats);
    expect(result.currentStreak).toBe(4);
  });

  it('resets streak after gap', () => {
    const twoDaysAgo = new Date(Date.now() - 86400000 * 2).toISOString().slice(0, 10);
    const stats = { currentStreak: 5, longestStreak: 5, lastActiveDate: twoDaysAgo };
    const result = updateStreak(stats);
    expect(result.currentStreak).toBe(1);
  });

  it('keeps same-day stats unchanged', () => {
    const today = new Date().toISOString().slice(0, 10);
    const stats = { currentStreak: 3, longestStreak: 5, lastActiveDate: today };
    const result = updateStreak(stats);
    expect(result.currentStreak).toBe(3);
  });
});

describe('updateDailyGoal', () => {
  it('starts new day', () => {
    const stats = { dailyGoal: { date: null, wordsReviewed: 0 } };
    const result = updateDailyGoal(stats, 5);
    expect(result.dailyGoal.wordsReviewed).toBe(5);
  });

  it('accumulates on same day', () => {
    const today = new Date().toISOString().slice(0, 10);
    const stats = { dailyGoal: { date: today, wordsReviewed: 5 } };
    const result = updateDailyGoal(stats, 3);
    expect(result.dailyGoal.wordsReviewed).toBe(8);
  });
});
