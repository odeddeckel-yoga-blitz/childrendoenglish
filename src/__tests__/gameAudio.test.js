// Every word a game or Class Battle can speak has a recorded file: they play
// /audio/<word>.mp3 (public/games/word-audio.js) and fall back to the device
// voice only if the file fails — a missing file would silently mean robot TTS.
import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { WORDS } from '../data/words';

const ROOT = path.resolve(import.meta.dirname, '../..');
const key = (w) => w.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-');
const missing = (words) => [...new Set(words)].filter((w) => !fs.existsSync(path.join(ROOT, 'public/audio', `${key(w)}.mp3`)));

describe('recorded word audio coverage', () => {
  it('every app word (and so every quiz answer option and every Battle word) has a recording', () => {
    expect(missing(WORDS.map((w) => w.word))).toEqual([]);
  });

  it.each(['category-conveyor', 'spelling-forge', 'word-zapper'])('every %s word has a recording, and the game loads word-audio.js', (g) => {
    const src = fs.readFileSync(path.join(ROOT, 'public/games', g, 'game.js'), 'utf8');
    const words = [...src.matchAll(/en:'([^']+)'/g)].map((m) => m[1]);
    expect(words.length).toBeGreaterThan(40);
    expect(missing(words)).toEqual([]);
    expect(fs.readFileSync(path.join(ROOT, 'public/games', g, 'index.html'), 'utf8')).toMatch(/<script src="\.\.\/word-audio\.js" defer><\/script>\s*<script src="\.\/game\.js"/);
  });

  it('Class Battle loads word-audio.js before its module', () => {
    expect(fs.readFileSync(path.join(ROOT, 'public/battle/index.html'), 'utf8')).toMatch(/word-audio\.js"><\/script>\s*<script type="module" src="\/battle\/battle\.js"/);
  });
});
