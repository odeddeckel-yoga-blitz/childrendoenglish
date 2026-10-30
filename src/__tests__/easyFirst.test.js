import { describe, it, expect } from 'vitest';
import { easyWords, easyFirst } from '../utils/easyFirst';

const W = (id) => ({ id });
const stats = { apple: [100, 96], cat: [40, 38], dog: [100, 60], rare: [5, 5], ox: [50, 46] };
const pool = ['apple', 'cat', 'dog', 'rare', 'ox', 'yak'].map(W);

describe('easyFirst (U2)', () => {
  it('easy = enough answers and ≥90% right, easiest first', () => {
    expect(easyWords(pool, stats).map((w) => w.id)).toEqual(['apple', 'cat', 'ox']);
  });

  it('an easy word already in the quiz moves to the front', () => {
    const sel = ['dog', 'yak', 'cat'].map(W);
    expect(easyFirst(sel, pool, stats).map((w) => w.id)).toEqual(['cat', 'dog', 'yak']);
  });

  it('otherwise an easy word from the pool replaces the last one, same length', () => {
    const sel = ['dog', 'yak', 'rare'].map(W);
    expect(easyFirst(sel, pool, stats, () => 0).map((w) => w.id)).toEqual(['apple', 'dog', 'yak']);
  });

  it('no easy word or no stats → unchanged', () => {
    const sel = ['dog', 'yak'].map(W);
    expect(easyFirst(sel, pool, {})).toBe(sel);
    expect(easyFirst([], pool, stats)).toEqual([]);
  });

  it('the shipped stats give the beginner pool at least one easy word', async () => {
    const { WORDS } = await import('../data/words');
    const { default: s } = await import('../data/cde-stats.json');
    expect(easyWords(WORDS.filter((w) => w.level === 'beginner'), s.words).length).toBeGreaterThan(0);
  });
});
