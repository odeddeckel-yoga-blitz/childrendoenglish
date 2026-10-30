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

// Textbook-unit topics (u-<book>-<unit>, generated into battle-words.js). The
// server stores the id only; questions are built client-side from the list.
export const UNIT_CATEGORY_RE = /^u-[a-z0-9]+(?:-[a-z0-9]+)*-\d{1,2}$/;

export function isValidCategory(id) {
  return BATTLE_CATEGORY_IDS.includes(id) || (typeof id === 'string' && UNIT_CATEGORY_RE.test(id));
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

/*
 * Grouping modes (roadmap RL13, kit PATTERNS §8c, agreed with KDM 2026-10-29).
 * Cooperative beats competitive for a class (Roseth 2008); individual
 * leaderboards lowered scores (Hanus & Fox 2015).
 *   solo  — the original race: everyone on one leaderboard.
 *   team  — two teams by join order; winner = average per member.
 *   class — the whole class vs a target fixed at start.
 * team and class never show a per-player score. CDE counts WORDS RIGHT
 * (correct) toward a team or the class, not points: "our class got 80 words"
 * reads better on a projector than streak-weighted points.
 */
export const BATTLE_MODES = ['solo', 'team', 'class'];
export const isValidMode = (m) => BATTLE_MODES.includes(m);
export const isGroupMode = (m) => m === 'team' || m === 'class';

// class target = players × minutes × k (CDE k = 6 words right per kid-minute).
export const TARGET_K = 6;
export const MAX_TARGET = 5000;
export function defaultTarget(nPlayers, durationSec) {
  return Math.max(1, Math.round(Math.max(1, nPlayers) * (durationSec / 60) * TARGET_K));
}
export const isValidTarget = (t) => Number.isInteger(t) && t >= 1 && t <= MAX_TARGET;
