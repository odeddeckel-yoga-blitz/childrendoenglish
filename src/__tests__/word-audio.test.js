import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { WORDS } from '../data/words';

// Every word must ship a pre-rendered audio file (Piper voice). Regenerate
// with scripts/generate-word-audio.sh after adding words.
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const audioFile = (text) =>
  path.join(repoRoot, 'public', 'audio', text.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-') + '.mp3');

describe('word audio files', () => {
  it('every vocabulary word has a non-trivial mp3 on disk', () => {
    const missing = [];
    for (const w of WORDS) {
      const f = audioFile(w.word);
      if (!fs.existsSync(f) || fs.statSync(f).size < 1000) missing.push(w.word);
    }
    expect(missing).toEqual([]);
  });
});
