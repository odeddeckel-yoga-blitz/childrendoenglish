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
