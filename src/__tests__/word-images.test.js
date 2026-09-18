import { describe, it, expect } from 'vitest';
import { existsSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { WORDS } from '../data/words';

// Integrity guard: every word's image must exist in public/ and be a real file.
// A missing/empty image renders as an unanswerable blank card in the quizzes
// (user-reported Sep 2026) — this makes CI catch it before deploy.
describe('word image integrity', () => {
  const pub = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'public');

  it('every word has an existing, non-trivial image file', () => {
    const problems = [];
    for (const w of WORDS) {
      const url = w.imageUrl || `/images/${w.id}.webp`;
      if (!url.startsWith('/')) continue; // external URLs not checked here
      const p = join(pub, url);
      if (!existsSync(p)) problems.push(`${w.id}: missing ${url}`);
      else if (statSync(p).size < 500) problems.push(`${w.id}: suspiciously small (${statSync(p).size}b)`);
    }
    expect(problems).toEqual([]);
  });

  it('covers the full word list', () => {
    expect(WORDS.length).toBeGreaterThanOrEqual(300);
  });
});
