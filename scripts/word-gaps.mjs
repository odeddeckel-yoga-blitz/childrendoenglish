#!/usr/bin/env node
/**
 * Word-gap finder — where should the next vocabulary batch go?
 * Reports per-letter / per-category / per-level coverage so new words target
 * real gaps (thin letters break the known-letters feature and letter-path
 * practice; thin categories starve distractor pools).
 *
 * Usage: node scripts/word-gaps.mjs
 * Then: propose candidate words for the flagged gaps, validate each with
 * scripts/word-image-improver.mjs (candidates → sole-answer review → pick).
 */
import { WORDS } from '../src/data/words.js';

const THIN_LETTER = 6;   // fewer than this per letter = flagged
const THIN_CATEGORY = 20;

const byLetter = {}, byCategory = {}, byLevel = {};
for (const w of WORDS) {
  const L = w.word[0].toUpperCase();
  byLetter[L] = (byLetter[L] || 0) + 1;
  byCategory[w.category] = (byCategory[w.category] || 0) + 1;
  byLevel[w.level] = (byLevel[w.level] || 0) + 1;
}

console.log(`vocabulary: ${WORDS.length} words\n`);

console.log('— letters (⚠ = thin, missing letters shown as 0):');
for (const L of 'ABCDEFGHIJKLMNOPQRSTUVWXYZ') {
  const n = byLetter[L] || 0;
  const flag = n < THIN_LETTER ? '  ⚠' : '';
  console.log(`  ${L}: ${String(n).padStart(3)}${flag}`);
}

console.log('\n— categories:');
for (const [cat, n] of Object.entries(byCategory).sort((a, b) => a[1] - b[1])) {
  console.log(`  ${cat.padEnd(12)} ${String(n).padStart(3)}${n < THIN_CATEGORY ? '  ⚠' : ''}`);
}

console.log('\n— levels:');
for (const [lvl, n] of Object.entries(byLevel)) console.log(`  ${lvl.padEnd(12)} ${String(n).padStart(3)}`);

const thin = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').filter(L => (byLetter[L] || 0) < THIN_LETTER);
if (thin.length) console.log(`\nNext batch should prioritize letters: ${thin.join(' ')}`);

// --- Gloss gate (multilang: plans/multilang-es-ar-2026-10.md WS2.2/WS5) ---
// Generation-time check, same doctrine as the voice audit: reactive optimizers
// can't see a new word, so gloss completeness must be validated here.
// Also the text-space twin of the image sole-answer metric: two words in the
// same CATEGORY sharing one gloss make the reveal text ambiguous in that language.
const GLOSS_LANGS = ['es']; // add 'ar' when its gloss file lands
let glossExit = 0;
for (const gl of GLOSS_LANGS) {
  let glosses;
  try {
    glosses = (await import(`../src/data/word-glosses-${gl}.js`)).default;
  } catch {
    console.log(`\n— ${gl} glosses: file missing (src/data/word-glosses-${gl}.js) ⚠`);
    glossExit = 1;
    continue;
  }
  const missing = WORDS.filter((w) => !glosses[w.id]);
  const orphans = Object.keys(glosses).filter((id) => !WORDS.some((w) => w.id === id));
  const byCatGloss = {};
  const collisions = [];
  for (const w of WORDS) {
    const g = (glosses[w.id] || '').toLowerCase().trim();
    if (!g) continue;
    const key = `${w.category}::${g}`;
    if (byCatGloss[key]) {
      // True synonyms (taxi/cab) legitimately share a gloss — the existing
      // product already accepts this when their HEBREW glosses are also equal,
      // and quiz distractor logic excludes same-gloss pairs. Flag only real clashes.
      const other = WORDS.find((x) => x.id === byCatGloss[key]);
      if (!other || other.hebrewTranslation !== w.hebrewTranslation) {
        collisions.push(`${w.category}: "${glosses[w.id]}" ← ${byCatGloss[key]} + ${w.id}`);
      }
    } else byCatGloss[key] = w.id;
  }
  console.log(`\n— ${gl} glosses: ${WORDS.length - missing.length}/${WORDS.length} covered`);
  if (missing.length) { console.log(`  ⚠ missing: ${missing.map((w) => w.id).join(', ')}`); glossExit = 1; }
  if (orphans.length) console.log(`  orphan gloss keys (word removed?): ${orphans.join(', ')}`);
  if (collisions.length) { console.log(`  ⚠ same-category collisions:\n    ${collisions.join('\n    ')}`); glossExit = 1; }
  if (!missing.length && !collisions.length) console.log('  complete, no same-category collisions ✓');
}
process.exitCode = glossExit;
