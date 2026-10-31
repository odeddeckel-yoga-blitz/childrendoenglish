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

  it('every Sound Pairs word has its own partner-checked recording in /audio/pairs/', () => {
    const src = fs.readFileSync(path.join(ROOT, 'public/games/sound-pairs/game.js'), 'utf8');
    const pairs = [...src.matchAll(/\['([a-z]+)','([a-z]+)'\]/g)].map((m) => [m[1], m[2]]);
    expect(pairs.length).toBeGreaterThanOrEqual(25);
    const words = [...new Set(pairs.flat())];
    expect(words.filter((w) => !fs.existsSync(path.join(ROOT, 'public/audio/pairs', `${w}.mp3`)))).toEqual([]);
    // every word has a meaning line (he + es) in the game's W table
    for (const w of words) expect(src).toMatch(new RegExp(`\\b${w}:\\['`));
  });

  it('every Read It! word has its own neighbour-checked recording in /audio/cvc/, and every picture exists', () => {
    const src = fs.readFileSync(path.join(ROOT, 'public/games/read-it/game.js'), 'utf8');
    const block = src.slice(src.indexOf('var LEVELS=['), src.indexOf('];', src.indexOf('var LEVELS=[')));
    const words = [...new Set([...block.matchAll(/'([a-z]{3,})'/g)].map((m) => m[1]).filter((w) => !/_/.test(w)))];
    expect(words.length).toBeGreaterThanOrEqual(80);
    expect(words.filter((w) => !fs.existsSync(path.join(ROOT, 'public/audio/cvc', `${w}.mp3`)))).toEqual([]);
    const reads = [...block.matchAll(/read:\[([^\]]*)\]/g)].flatMap((m) => [...m[1].matchAll(/'([a-z]+)'/g)].map((x) => x[1]));
    expect(reads.filter((w) => !fs.existsSync(path.join(ROOT, 'public/images', `${w}.webp`)))).toEqual([]);
  });

  it('Read It! strands follow the phonics order: 5 short-vowel CVC levels, then magic e, then digraphs', () => {
    const src = fs.readFileSync(path.join(ROOT, 'public/games/read-it/game.js'), 'utf8');
    const levels = [...src.matchAll(/\{id:'([a-z_]+)', read:\[([^\]]*)\], hear:\[(.*?)\]\]\}/g)].map((m) => ({
      id: m[1], read: [...m[2].matchAll(/'([a-z]+)'/g)].map((x) => x[1]),
      hear: [...m[3].matchAll(/\['([a-z]+)','([a-z]+)','([a-z]+)'/g)].map((x) => [x[1], x[2], x[3]]),
    }));
    expect(levels.map((l) => l.id)).toEqual(['a', 'i', 'o', 'u', 'e', 'a_e', 'i_e', 'o_e', 'sh_ch', 'th_ck']);
    for (const l of levels) {
      expect(l.read.length).toBeGreaterThanOrEqual(2); // short i has only pig and six
      expect(l.hear.length).toBeGreaterThanOrEqual(6);
      for (const q of l.hear) expect(new Set(q).size).toBe(3);
    }
    // magic e: every target is a silent-e word; digraphs: every target has its digraph
    for (const l of levels.filter((x) => x.id.endsWith('_e'))) for (const [w] of l.hear) expect(w).toMatch(/[aeiou][^aeiou]e$/);
    const DG = { sh_ch: /sh|ch/, th_ck: /th|ck/ };
    for (const l of levels.filter((x) => DG[x.id])) for (const [w] of l.hear) expect(w).toMatch(DG[l.id]);
  });

  it('every Letter Twins word (all three tracks) has a recording and a photo, starts with one of its level letters, and every letter appears', () => {
    const src = fs.readFileSync(path.join(ROOT, 'public/games/letter-twins/game.js'), 'utf8');
    const levels = [...src.matchAll(/letters:\[([^\]]*)\], words:\[([^\]]*)\]/g)].map((m) => ({ letters: [...m[1].matchAll(/'([a-z])'/g)].map((x) => x[1]), words: [...m[2].matchAll(/'([a-z]+)'/g)].map((x) => x[1]) }));
    expect(levels.length).toBe(12); // twins b/d/p/q · m/n/w/u · letter sounds
    // letter-sound levels: four letters with different first sounds (never c with k)
    const sounds = levels.slice(8);
    for (const l of sounds) {
      expect(new Set(l.letters).size).toBe(4);
      expect(l.letters.includes('c') && l.letters.includes('k')).toBe(false);
      for (const ch of l.letters) expect(l.words.filter((w) => w[0] === ch).length).toBeGreaterThanOrEqual(2);
    }
    for (const l of levels) {
      expect(missing(l.words)).toEqual([]);
      expect(l.words.filter((w) => !fs.existsSync(path.join(ROOT, 'public/images', `${w}.webp`)))).toEqual([]);
      expect(l.words.filter((w) => !l.letters.includes(w[0]))).toEqual([]);
      for (const ch of l.letters) expect(l.words.some((w) => w[0] === ch)).toBe(true);
    }
  });

  it('Class Battle loads word-audio.js before its module', () => {
    expect(fs.readFileSync(path.join(ROOT, 'public/battle/index.html'), 'utf8')).toMatch(/word-audio\.js"><\/script>\s*<script type="module" src="\/battle\/battle\.js"/);
  });
});
