import { describe, it, expect } from 'vitest';
import { WORDS } from '../data/words';
import { WORD_COUNT } from '../data/wordCount';
import { PAGES_HOLD } from '../data/pagesHold';

describe('word count (one number everywhere)', () => {
  // Held words (pagesHold.js) are in the app but not yet counted: the count is on the /he/ holdout pages.
  it('WORD_COUNT is the live words rounded down to tens', () => {
    expect(WORD_COUNT).toBe(Math.floor(WORDS.filter((w) => !PAGES_HOLD.has(w.id)).length / 10) * 10);
  });
});
