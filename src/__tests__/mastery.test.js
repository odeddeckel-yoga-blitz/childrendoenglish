import { describe, it, expect } from 'vitest';
import { updateWordMap, applyQuiz, topicCounts, topicsJustMastered, hasEarlierProgress } from '../utils/mastery';

const D1 = '2026-10-30', D2 = '2026-10-31';

describe('mastery map rules (kit RL16)', () => {
  it('a first-try right = ● mastered (mm_mast); a re-ask right after a miss = ◐ learning', () => {
    const a = updateWordMap({}, 'cat', { correct: true, review: false, today: D1 });
    expect(a.map.cat).toEqual({ s: 2, d: D1 });
    expect(a.events).toEqual(['mm_mast']);
    const b = updateWordMap({}, 'dog', { correct: true, review: true, today: D1 });
    expect(b.map.dog).toEqual({ s: 1, d: D1 });
    expect(b.events).toEqual([]);
  });

  it('nothing decays: a miss never lowers a state; retention is measured on a later day only', () => {
    const m = { cat: { s: 2, d: D1 } };
    expect(updateWordMap(m, 'cat', { correct: false, review: false, today: D1 })).toEqual({ map: m, events: [] });
    const slip = updateWordMap(m, 'cat', { correct: false, review: false, today: D2 });
    expect(slip.map.cat.s).toBe(2);
    expect(slip.events).toEqual(['mm_slip']);
    const keep = updateWordMap(m, 'cat', { correct: true, review: false, today: D2 });
    expect(keep.map.cat).toEqual({ s: 2, d: D2 });
    expect(keep.events).toEqual(['mm_keep']);
  });

  it('a quiz applies first tries, then re-asks; events carry the word id', () => {
    const r = applyQuiz({}, { answers: [{ wordId: 'cat', correct: true }, { wordId: 'dog', correct: false }], retries: [{ wordId: 'dog', correct: true }] }, D1);
    expect(r.map).toEqual({ cat: { s: 2, d: D1 }, dog: { s: 1, d: D1 } });
    expect(r.events).toEqual([['mm_mast', 'cat']]);
  });

  it('topic counts and a topic just mastered', () => {
    const words = [{ id: 'cat', category: 'animals' }, { id: 'dog', category: 'animals' }, { id: 'red', category: 'colors' }];
    const before = { cat: { s: 2, d: D1 }, dog: { s: 1, d: D1 } };
    const after = { ...before, dog: { s: 2, d: D2 } };
    expect(topicCounts(before, words, 'animals')).toEqual({ total: 2, mastered: 1, learning: 1, unseen: 0 });
    expect(topicsJustMastered(before, after, words)).toEqual(['animals']);
    expect(hasEarlierProgress(before, D2)).toBe(true);
    expect(hasEarlierProgress(after, D2)).toBe(true);
    expect(hasEarlierProgress({ x: { s: 2, d: D2 } }, D2)).toBe(false);
  });
});
