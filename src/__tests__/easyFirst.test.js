import { describe, it, expect } from 'vitest';
import { easyWords, easyFirst, easyFirstQuiz } from '../utils/easyFirst';

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

  // 11-20: the whole first quiz, not only Q1, comes from the best-answered words of the pool.
  describe('easyFirstQuiz', () => {
    const st = { a: [100, 99], b: [100, 95], c: [100, 90], d: [100, 80], e: [100, 70], f: [100, 60], g: [100, 50], h: [100, 40], rare: [5, 5] };
    const big = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'rare'].map(W);
    it('takes `length` words from the top length+3 of the pool, easiest first', () => {
      const sel = ['h', 'g', 'f'].map(W);
      const out = easyFirstQuiz(sel, big, st, () => 0).map((w) => w.id);
      expect(out).toEqual(['a', 'b', 'c']);
      for (let i = 0; i < 20; i++) {
        const ids = easyFirstQuiz(sel, big, st).map((w) => w.id);
        expect(ids).toHaveLength(3);
        expect(new Set(ids).size).toBe(3);
        ids.forEach((id) => expect(['a', 'b', 'c', 'd', 'e', 'f']).toContain(id)); // top 3+3, never g/h/rare
        expect(st[ids[0]][1]).toBeGreaterThanOrEqual(st[ids[1]][1]);
      }
    });
    it('only pool words; too few rated words → the selection fills the rest', () => {
      const pool2 = ['a', 'rare', 'x', 'y'].map(W);
      const sel = ['x', 'y', 'rare'].map(W);
      expect(easyFirstQuiz(sel, pool2, st).map((w) => w.id)).toEqual(['a', 'x', 'y']);
    });
    it('no stats or empty → unchanged', () => {
      const sel = ['x', 'y'].map(W);
      expect(easyFirstQuiz(sel, sel, {})).toBe(sel);
      expect(easyFirstQuiz([], big, st)).toEqual([]);
    });
    it('shipped stats: a letter-A first quiz is easier than the letter-A pool', async () => {
      const { WORDS } = await import('../data/words');
      const { default: s } = await import('../data/cde-stats.json');
      const poolA = WORDS.filter((w) => w.word[0].toLowerCase() === 'a');
      const rate = (ws) => ws.reduce((t, w) => t + (s.words[w.id] ? s.words[w.id][1] / s.words[w.id][0] : 0), 0) / ws.length;
      const quiz = easyFirstQuiz(poolA.slice(0, 5), poolA, s.words);
      expect(quiz).toHaveLength(5);
      expect(rate(quiz)).toBeGreaterThan(rate(poolA));
    });
  });

  it('the shipped stats give the beginner pool at least one easy word', async () => {
    const { WORDS } = await import('../data/words');
    const { default: s } = await import('../data/cde-stats.json');
    expect(easyWords(WORDS.filter((w) => w.level === 'beginner'), s.words).length).toBeGreaterThan(0);
  });
});
