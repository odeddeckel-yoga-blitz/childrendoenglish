// One picture style per quiz round (owner 11-07): the style map is generated from IMAGE_SOURCES, and the quiz's
// distractors share the target's style. A lone emoji among photos (or a photo among drawings) gives the answer away.
import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { render } from '../../scripts/gen-image-style.mjs';
import { WORDS, getDistractors } from '../data/words';
import { pictureStyle } from '../data/imageStyle';

const ROOT = path.resolve(import.meta.dirname, '../..');

describe('picture style', () => {
  it('src/data/imageStyle.js and public/games/image-style.js are fresh (node scripts/gen-image-style.mjs)', () => {
    const { app, games } = render();
    expect(fs.readFileSync(path.join(ROOT, 'src/data/imageStyle.js'), 'utf8')).toBe(app);
    expect(fs.readFileSync(path.join(ROOT, 'public/games/image-style.js'), 'utf8')).toBe(games);
  });
  it('quiz distractors share the target picture style for every word', () => {
    const mixed = [];
    for (const w of WORDS) for (let i = 0; i < 3; i++) {
      const ds = getDistractors(w, 3);
      if (ds.some((d) => pictureStyle(d.id) !== pictureStyle(w.id))) { mixed.push(w.id); break; }
    }
    expect(mixed).toEqual([]);
  });
});
