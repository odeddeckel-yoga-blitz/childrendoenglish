// Image provenance (owner 11-04: the site credited none of its Commons photos). Every word image has a
// scripts/IMAGE_SOURCES.json entry; a Commons one carries title, file page, author and licence (CC BY / BY-SA need
// all of them on /image-credits/). 'unknown' is allowed ONLY for the photos the 11-05 backfill could not trace —
// a new word must come with its source (word-image-improver.mjs `pick` records it).
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { WORDS } from '../data/words';

const root = resolve(import.meta.dirname, '../..');
const SRC = JSON.parse(readFileSync(resolve(root, 'scripts/IMAGE_SOURCES.json'), 'utf8'));
const LEGACY = new Set(JSON.parse(readFileSync(resolve(root, 'scripts/IMAGE_SOURCES.legacy-unknown.json'), 'utf8')));

describe('image provenance', () => {
  it('every word image has a source entry', () => {
    expect(WORDS.filter((w) => !SRC[w.id]).map((w) => w.id)).toEqual([]);
  });
  it('no NEW untraced images (unknown only for the 11-05 legacy list)', () => {
    expect(WORDS.filter((w) => SRC[w.id]?.source === 'unknown' && !LEGACY.has(w.id)).map((w) => w.id)).toEqual([]);
  });
  it('Commons entries carry title, https file page, author and licence', () => {
    const bad = Object.entries(SRC).filter(([, v]) => v.source === 'wikimedia-commons'
      && !(v.title && /^https:\/\/commons\.wikimedia\.org\//.test(v.url || '') && v.author && v.licence));
    expect(bad.map(([k]) => k)).toEqual([]);
  });
});
