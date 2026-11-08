// Word-page A/B (step 4, mockup a "Word page, Option A", owner OK 11-08; live from WORD_PAGE_AB.start).
// Half of each category's /vocabulary/<category>/<word>/ pages get the Option A layout (scripts/word-page-a.mjs),
// the rest keep the old page (B = control). The arm is a hash of the word id with a fixed salt, so a word never
// changes arm when words are added or removed; the salt was picked once (11-08) so every category was within 2 words
// of an even split, and drawn/emoji words split 67/129. Do NOT change the salt while the test runs: it reshuffles
// every page and voids the read.
//
// Logging: each word page carries <body data-wv="a|b" data-pic="photo|drawn">; public/land-beacon.js turns that into
// the page key `vocabulary_word-<arm>-<pic>` (wordPageKey below) — a key /api/land already accepts (PAGE_KEY), so no
// api change. tools/learning/standing-sections.mjs splits the "word" page type by arm and picture style.
// Tests: src/__tests__/wordPageVariant.test.js, e2e/word-page-a.spec.js.

export const WORD_PAGE_AB = { id: 'word-a', salt: 'wp1360', start: '2026-11-17' };

// FNV-1a with a murmur3 finaliser: the plain FNV low bit is far from even on short ids.
function hash32(s) {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193); }
  h ^= h >>> 16; h = Math.imul(h, 0x85ebca6b); h ^= h >>> 13; h = Math.imul(h, 0xc2b2ae35); h ^= h >>> 16;
  return h >>> 0;
}

/** 'a' (Option A layout) or 'b' (today's page) for a word id. */
export const wordPageVariant = (id) => ((hash32(`${WORD_PAGE_AB.salt}:${id}`) >>> 31) ? 'a' : 'b');

/** The beacon page key for an arm × picture style ('photo' | 'drawn'); land-beacon.js builds the same string. */
export const wordPageKey = (arm, pic) => `vocabulary_word-${arm}-${pic}`;
/** Parses a word-page key → { arm, pic } (arm/pic null on the pre-test key 'vocabulary_word'), or null if not one. */
export function parseWordPageKey(key) {
  if (key === 'vocabulary_word') return { arm: null, pic: null };
  const m = /^vocabulary_word-(a|b)-(photo|drawn)$/.exec(key);
  return m ? { arm: m[1], pic: m[2] } : null;
}

/** words → { [category]: { a: [ids], b: [ids] } } */
export function variantSplit(words) {
  const out = {};
  for (const w of words) ((out[w.category] ||= { a: [], b: [] })[wordPageVariant(w.id)]).push(w.id);
  return out;
}

/** Live page URLs of one arm (for a Google CTR read per arm: GSC page filter / optimizer --word-ab-urls). */
export const wordPageUrls = (words, arm, site = 'https://childrendoenglish.com') =>
  words.filter((w) => wordPageVariant(w.id) === arm).map((w) => `${site}/vocabulary/${w.category}/${w.id}/`);
