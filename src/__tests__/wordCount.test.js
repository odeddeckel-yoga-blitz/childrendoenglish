import { describe, it, expect } from 'vitest';
import { WORDS } from '../data/words';
import { WORD_COUNT } from '../data/wordCount';

describe('word count (one number everywhere)', () => {
  it('WORD_COUNT is WORDS.length rounded down to tens', () => {
    expect(WORD_COUNT).toBe(Math.floor(WORDS.length / 10) * 10);
  });
});
