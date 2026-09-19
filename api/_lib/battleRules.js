/**
 * Shared server-side rules for Vocabulary Class Battle.
 * (Question generation itself is CLIENT-side — see public/battle/battle-core.js.
 * The server only validates category/duration and clamps scores.)
 */

// Must match the category ids in public/battle/battle-words.js (+ 'mix').
// A unit test asserts parity so the two files can't drift.
export const BATTLE_CATEGORY_IDS = [
  'animals', 'food', 'everyday', 'colors', 'numbers', 'home', 'transport',
  'nature', 'feelings', 'clothing', 'school', 'sports', 'toys', 'mix',
];

export const MIN_DURATION_SEC = 10; // low floor kept for tests/dev (UI offers 120/180/300)
export const MAX_DURATION_SEC = 600;

export function isValidCategory(id) {
  return BATTLE_CATEGORY_IDS.includes(id);
}

export function isValidDuration(sec) {
  return Number.isInteger(sec) && sec >= MIN_DURATION_SEC && sec <= MAX_DURATION_SEC;
}

/**
 * Points for a correct answer given the streak BEFORE this answer.
 * Base 10, +2 per consecutive correct so far, capped at +10 (max 20/answer).
 * Duplicated client-side in battle-core.js (parity-tested).
 */
export function pointsForAnswer(streakBefore = 0) {
  return 10 + Math.min(Math.max(streakBefore, 0), 5) * 2;
}

/**
 * Absolute per-room score sanity cap used by the server. A kid physically
 * can't read a word + tap a photo faster than ~1/sec at max bonus (20 pts),
 * so durationSec * 20 is a generous ceiling.
 */
export function maxPlausibleScore(durationSec) {
  return durationSec * 20;
}
