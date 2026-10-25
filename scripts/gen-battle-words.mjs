#!/usr/bin/env node
// Regenerates public/battle/battle-words.js — the static mirror of
// src/data/words.js that /battle/ imports (public/ can't import src/).
//   node scripts/gen-battle-words.mjs           write the file
//   node scripts/gen-battle-words.mjs --check   exit 1 if it is stale (a test runs this)
// BATTLE_AVOID lists, per word, the words that collides() says would be a
// second right answer (armchair for "chair", same Hebrew gloss, …), so a
// battle question never shows one as a "wrong" photo — the same rule the app's
// quizzes use.
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { WORDS, collides } from '../src/data/words.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'public', 'battle', 'battle-words.js');
const CATEGORY_ORDER = ['animals', 'food', 'home', 'transport', 'nature', 'colors', 'numbers', 'clothing', 'school', 'sports', 'feelings', 'everyday', 'toys'];

export function buildBattleWords() {
  const words = {};
  for (const c of CATEGORY_ORDER) words[c] = [];
  for (const w of WORDS) {
    if (!words[w.category]) throw new Error(`gen-battle-words: category "${w.category}" (${w.id}) missing from CATEGORY_ORDER`);
    if (!w.imageUrl || !existsSync(join(ROOT, 'public', w.imageUrl))) throw new Error(`gen-battle-words: ${w.id} has no image file (${w.imageUrl})`);
    words[w.category].push({ id: w.id, w: w.word, he: w.hebrewTranslation, img: w.imageUrl });
  }
  const avoid = {};
  for (const a of WORDS) {
    const ids = WORDS.filter((b) => b.id !== a.id && collides(a, b)).map((b) => b.id);
    if (ids.length) avoid[a.id] = ids;
  }
  return '// GENERATED from src/data/words.js by scripts/gen-battle-words.mjs — do not edit.\n'
    + `export const BATTLE_WORDS = ${JSON.stringify(words, null, 1)};\n`
    + `\n// Per word: ids that would also be a right answer — never offered as a distractor.\n`
    + `export const BATTLE_AVOID = ${JSON.stringify(avoid)};\n`;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const next = buildBattleWords();
  if (process.argv.includes('--check')) {
    if (readFileSync(OUT, 'utf-8') !== next) { console.error('battle-words.js is stale — run node scripts/gen-battle-words.mjs'); process.exit(1); }
  } else {
    writeFileSync(OUT, next);
    console.log(`wrote ${OUT}`);
  }
}
