/**
 * Vocabulary Class Battle — client-side core logic (questions, scoring,
 * nicknames, codes). Loaded as an ES module by /battle/ and imported directly
 * by vitest (api/__tests__/battle.test.js), so keep it DOM-free.
 *
 * Questions are generated CLIENT-side on each kid's device from the inlined
 * word list (battle-words.js, image ids verified at generation time). The
 * server only ever sees a picked nickname + clamped score.
 */

import { BATTLE_WORDS } from './battle-words.js';

/* ---- categories & durations (teacher setup) ---- */

export const BATTLE_CATEGORIES = [
  { id: 'mix', label: 'Big Mix (everything)', emoji: '🌈' },
  { id: 'animals', label: 'Animals', emoji: '🦁' },
  { id: 'food', label: 'Food', emoji: '🍎' },
  { id: 'everyday', label: 'Everyday Things', emoji: '🎒' },
  { id: 'colors', label: 'Colors', emoji: '🎨' },
  { id: 'numbers', label: 'Numbers', emoji: '🔢' },
  { id: 'home', label: 'At Home', emoji: '🏠' },
  { id: 'transport', label: 'Transport', emoji: '🚌' },
  { id: 'nature', label: 'Nature', emoji: '🌳' },
  { id: 'feelings', label: 'Feelings', emoji: '😊' },
  { id: 'clothing', label: 'Clothing', emoji: '👕' },
  { id: 'school', label: 'School', emoji: '✏️' },
  { id: 'sports', label: 'Sports', emoji: '⚽' },
  { id: 'toys', label: 'Toys', emoji: '🧸' },
];

export const BATTLE_DURATIONS = [
  { sec: 120, label: '2 min' },
  { sec: 180, label: '3 min' },
  { sec: 300, label: '5 min' },
];

/** Word pool for a category ('mix' = all categories combined). */
export function wordPool(categoryId) {
  if (categoryId !== 'mix' && BATTLE_WORDS[categoryId]) return BATTLE_WORDS[categoryId];
  return Object.values(BATTLE_WORDS).flat();
}

/* ---- room codes (client-side hint only; server re-validates) ---- */

const CODE_RE = /^[BCDFGHJKMNPQRSTVWXYZ]{5}$/;

export function normalizeCode(raw) {
  if (typeof raw !== 'string') return null;
  const code = raw.trim().toUpperCase();
  return CODE_RE.test(code) ? code : null;
}

/* ---- COPPA-safe nicknames (copy of api/_lib/battleNames.js; parity-tested) ---- */

export const ADJECTIVES = [
  'Brave', 'Clever', 'Swift', 'Mighty', 'Sunny', 'Cosmic', 'Turbo', 'Lucky',
  'Zippy', 'Sparky', 'Rocket', 'Daring', 'Golden', 'Frosty', 'Jolly', 'Nimble',
  'Plucky', 'Speedy', 'Stellar', 'Wild',
];

export const ANIMALS = [
  'Otter', 'Fox', 'Panda', 'Tiger', 'Eagle', 'Dolphin', 'Koala', 'Wolf',
  'Falcon', 'Rabbit', 'Cheetah', 'Penguin', 'Dragon', 'Gecko', 'Hedgehog',
  'Lynx', 'Moose', 'Narwhal', 'Octopus', 'Puffin',
];

export function suggestNicknames(count = 8, exclude = []) {
  const taken = new Set(exclude);
  const out = [];
  let guard = 0;
  while (out.length < count && guard < 500) {
    guard++;
    const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
    const animal = ANIMALS[Math.floor(Math.random() * ANIMALS.length)];
    const name = `${adj} ${animal}`;
    if (taken.has(name)) continue;
    taken.add(name);
    out.push(name);
  }
  return out;
}

/* ---- question generation: word shown+spoken, tap the right photo ---- */

function shuffled(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Build one battle question for a category.
 * `recentIds` = word ids to avoid as the target (no-repeat window).
 * Returns { id, word, he, choices: [{ id, img }] } — 4 choices, shuffled,
 * exactly one with id === question.id (the correct photo).
 */
export function makeQuestion(categoryId, recentIds = []) {
  const pool = wordPool(categoryId);
  const recent = new Set(recentIds);
  let candidates = pool.filter((w) => !recent.has(w.id));
  if (candidates.length === 0) candidates = pool; // window larger than pool
  const target = candidates[Math.floor(Math.random() * candidates.length)];

  // 3 distractor photos from the same pool (distinct words & images).
  const usedImgs = new Set([target.img]);
  const distractors = [];
  for (const w of shuffled(pool)) {
    if (w.id === target.id || usedImgs.has(w.img)) continue;
    usedImgs.add(w.img);
    distractors.push(w);
    if (distractors.length === 3) break;
  }

  return {
    id: target.id,
    word: target.w,
    he: target.he,
    choices: shuffled([target, ...distractors]).map((w) => ({ id: w.id, img: w.img })),
  };
}

/* ---- scoring (server re-clamps: monotonic + plausibility cap) ---- */

/**
 * Points for a correct answer given the streak BEFORE this answer.
 * Base 10, +2 per consecutive correct so far, capped at +10 (max 20/answer).
 * Duplicated server-side in api/_lib/battleRules.js (parity-tested).
 */
export function pointsForAnswer(streakBefore = 0) {
  return 10 + Math.min(Math.max(streakBefore, 0), 5) * 2;
}
