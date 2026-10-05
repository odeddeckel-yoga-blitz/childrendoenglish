import { describe, it, expect } from 'vitest';
import {
  cycleSequence, batchWords, batchLabel, batchCount, cycleState,
  advanceCycle, stagesFor, BATCH_SIZE,
} from '../utils/learningCycle';
import { WORDS } from '../data/words';

describe('learningCycle', () => {
  it('sequence is deterministic and covers the whole vocabulary once', () => {
    const a = cycleSequence();
    const b = cycleSequence();
    expect(a.map(w => w.id)).toEqual(b.map(w => w.id));
    expect(a.length).toBe(WORDS.length);
    expect(new Set(a.map(w => w.id)).size).toBe(WORDS.length);
  });

  it('starts with beginner words, alphabetical', () => {
    const seq = cycleSequence();
    expect(seq[0].level).toBe('beginner');
    const firstBatch = seq.slice(0, BATCH_SIZE);
    expect(firstBatch.every(w => w.level === 'beginner')).toBe(true);
    const words = firstBatch.map(w => w.word.toLowerCase());
    expect([...words].sort()).toEqual(words);
  });

  it('known letters float their words to the front', () => {
    const seq = cycleSequence(['m']);
    expect(seq[0].word[0].toLowerCase()).toBe('m');
    const mCount = WORDS.filter(w => w.word[0].toLowerCase() === 'm').length;
    expect(seq.slice(0, mCount).every(w => w.word[0].toLowerCase() === 'm')).toBe(true);
  });

  it('batch math covers everything without overlap', () => {
    const n = batchCount();
    expect(n).toBe(Math.ceil(WORDS.length / BATCH_SIZE));
    const seen = new Set();
    for (let i = 0; i < n; i++) batchWords(i).forEach(w => seen.add(w.id));
    expect(seen.size).toBe(WORDS.length);
    expect(batchWords(0).length).toBe(BATCH_SIZE);
  });

  it('batchLabel names the letter span', () => {
    expect(batchLabel(0)).toMatch(/^[A-Z](–[A-Z])?$/);
  });

  it('cycleState tolerates legacy stats without the key', () => {
    expect(cycleState({})).toEqual({ batch: 0, stage: 0 });
    expect(cycleState(null)).toEqual({ batch: 0, stage: 0 });
    expect(cycleState({ cycle: { batch: 3, stage: 1 } })).toEqual({ batch: 3, stage: 1 });
  });

  it('readers climb a 3-stage ladder, pre-readers a 2-stage one', () => {
    expect(stagesFor(true)).toEqual(['listen', 'image', 'word']);
    expect(stagesFor(false)).toEqual(['listen', 'image']);
  });

  it('advanceCycle walks stages then rolls the batch (soft gate)', () => {
    let st = { cycle: { batch: 0, stage: 0 } };
    let next = advanceCycle(st, true);
    expect(next).toEqual({ batch: 0, stage: 1, batchDone: false });
    next = advanceCycle({ cycle: { batch: 0, stage: 2 } }, true);
    expect(next.batch).toBe(1);
    expect(next.stage).toBe(0);
    expect(next.batchDone).toBe(true);
    // pre-reader rolls after stage 1
    next = advanceCycle({ cycle: { batch: 5, stage: 1 } }, false);
    expect(next.batchDone).toBe(true);
    expect(next.batch).toBe(6);
  });
});
