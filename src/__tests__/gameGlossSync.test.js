// The arcade games carry their own copies of the word list (they are standalone
// static pages). Those copies drifted silently twice (nervous, tiger, cream, one,
// two — found in the 2026-10-11 gloss pass), so CI now pins them to words.js.
import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { WORDS } from '../data/words';
import ES from '../data/word-glosses-es';

const byId = Object.fromEntries(WORDS.map((w) => [w.id, w]));
const RE = /\{id:'([a-z_-]+)',en:'[^']*',he:(['"])((?:\\.|(?!\2).)*)\2,es:(['"])((?:\\.|(?!\4).)*)\4/g;

describe('arcade game glosses match words.js', () => {
  for (const g of ['category-conveyor', 'spelling-forge', 'word-zapper']) {
    it(g, () => {
      const src = fs.readFileSync(path.resolve(import.meta.dirname, '../../public/games', g, 'game.js'), 'utf8');
      const drift = [];
      let n = 0;
      for (const m of src.matchAll(RE)) {
        const w = byId[m[1]];
        if (!w) continue;
        n++;
        const he = m[3].replace(/\\'/g, "'"), es = m[5].replace(/\\'/g, "'");
        if (he !== w.hebrewTranslation) drift.push(`${m[1]} he ${he} ≠ ${w.hebrewTranslation}`);
        if (es !== ES[m[1]]) drift.push(`${m[1]} es ${es} ≠ ${ES[m[1]]}`);
      }
      expect(n).toBeGreaterThan(20);
      expect(drift).toEqual([]);
    });
  }
});
