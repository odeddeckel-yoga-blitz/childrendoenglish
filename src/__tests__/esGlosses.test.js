// Every live word needs a Spanish gloss: the /vocabulary/<cat>/spanish/ pages now list every live
// word (step 4, mockup b: "the count is real"), and an empty gloss shows as a blank Spanish cell.
// File style (word-glosses-es.js header): bare Latin-American Spanish, lowercase, no articles.
import { describe, it, expect } from 'vitest';
import { WORDS } from '../data/words';
import { PAGES_HOLD } from '../data/pagesHold';
import ES from '../data/word-glosses-es';

describe('Spanish glosses', () => {
  it('every live word (PAGES_HOLD out) has a Spanish gloss', () => {
    const missing = WORDS.filter((w) => !PAGES_HOLD.has(w.id) && !(typeof ES[w.id] === 'string' && ES[w.id].trim()));
    expect(missing.map((w) => `${w.category}/${w.id}`)).toEqual([]);
  });
  it('held words have one too, and every gloss follows the file style', () => {
    expect(WORDS.filter((w) => !ES[w.id]).map((w) => w.id)).toEqual([]);
    const bad = Object.entries(ES).filter(([, g]) => g !== g.trim() || /^(el|la|los|las|un|una)\s/i.test(g));
    expect(bad).toEqual([]);
  });
});
