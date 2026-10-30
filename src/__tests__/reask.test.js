import { describe, it, expect } from 'vitest';
import { initQueue, scheduleReask, REASK_MAX } from '../utils/reask';

const words = (n) => Array.from({ length: n }, (_, i) => ({ id: `w${i}` }));
const ids = (q) => q.map((x) => (x.retry ? `${x.w.id}*` : x.w.id));

describe('scheduleReask', () => {
  it('brings a missed word back 2 and 5 questions later', () => {
    const q = scheduleReask(initQueue(words(10)), 1);
    expect(ids(q)).toEqual(['w0', 'w1', 'w2', 'w3', 'w1*', 'w4', 'w5', 'w1*', 'w6', 'w7', 'w8', 'w9']);
    expect(q[4]).toMatchObject({ orig: 1, retry: true });
  });

  it('leaves the 5-word first quiz alone', () => {
    const q0 = initQueue(words(5));
    expect(scheduleReask(q0, 0)).toBe(q0);
  });

  it('never re-asks a re-ask', () => {
    const q = scheduleReask(initQueue(words(10)), 1);
    expect(scheduleReask(q, 4)).toBe(q);
  });

  it('clamps near the end without putting the word next to itself', () => {
    const q = scheduleReask(initQueue(words(10)), 8);
    expect(ids(q)).toEqual(['w0', 'w1', 'w2', 'w3', 'w4', 'w5', 'w6', 'w7', 'w8', 'w9', 'w8*']);
    // the last word: nothing after it to space with
    expect(ids(scheduleReask(initQueue(words(10)), 9))).toEqual(ids(initQueue(words(10))));
  });

  it(`caps the extra questions at ${REASK_MAX}`, () => {
    let q = initQueue(words(10));
    for (let i = 0; i < q.length; i++) if (!q[i].retry) q = scheduleReask(q, i);
    expect(q.filter((x) => x.retry)).toHaveLength(REASK_MAX);
    for (let i = 1; i < q.length; i++) expect(q[i].w.id).not.toBe(q[i - 1].w.id);
  });
});
