// R2C4: the Hebrew newcomer's first set — English words Hebrew already uses.
import { describe, it, expect } from 'vitest';
import { buildSet, STARTER_IDS } from '../utils/learningCycle';
import { WORDS } from '../data/words';

describe('starter set (R2C4)', () => {
  it('10 known loanwords, all real app words with a gloss, in the listed order', () => {
    const { words, token } = buildSet('starter');
    expect(token).toBe('starter');
    expect(words.map((w) => w.id)).toEqual(STARTER_IDS);
    expect(words).toHaveLength(10);
    for (const w of words) expect(w.hebrewTranslation).toBeTruthy();
  });
  it('every starter word exists in WORDS (a removed word would silently shrink the set)', () => {
    const ids = new Set(WORDS.map((w) => w.id));
    expect(STARTER_IDS.filter((id) => !ids.has(id))).toEqual([]);
  });
});
