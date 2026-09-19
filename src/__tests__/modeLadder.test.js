import { describe, it, expect } from 'vitest';
import { MODE_LADDER, recommendedMode } from '../utils/modeLadder';

const quiz = (mode, score, total = 10) => ({ date: '2026-09-19', mode, level: 'beginner', score, total });

describe('recommendedMode', () => {
  it('recommends listen (the easiest mode) for a brand-new player', () => {
    expect(recommendedMode([], true)).toBe('listen');
    expect(recommendedMode(undefined, true)).toBe('listen');
  });

  it('advances up the ladder as modes are passed at 80%+', () => {
    expect(recommendedMode([quiz('listen', 8)], true)).toBe('word');
    expect(recommendedMode([quiz('listen', 8), quiz('word', 9)], true)).toBe('image');
    expect(recommendedMode([quiz('listen', 8), quiz('word', 9), quiz('image', 10)], true)).toBe('audio');
  });

  it('does not advance on a failed attempt (<80%)', () => {
    expect(recommendedMode([quiz('listen', 7)], true)).toBe('listen');
  });

  it('skips image for pre-readers', () => {
    expect(recommendedMode([quiz('listen', 8), quiz('word', 8)], false)).toBe('audio');
  });

  it('returns null once every available mode is passed', () => {
    const all = MODE_LADDER.map(m => quiz(m, 9));
    expect(recommendedMode(all, true)).toBeNull();
  });

  it('ignores malformed history entries', () => {
    expect(recommendedMode([{ mode: 'listen', score: 5, total: 0 }], true)).toBe('listen');
  });
});
