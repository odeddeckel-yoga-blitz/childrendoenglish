/**
 * @module arcade — combo/score math and Lightning Round constants.
 *
 * Scoring model ported from kidsdomath's arcade layer (kdm-arcade):
 *   gain = round(BASE × (1 + 0.15 × (streak − 1)) × (fast ? 1.5 : 1))
 * where `streak` is the consecutive-correct count INCLUDING the current answer,
 * and an answer is "fast" when it lands within FAST_ANSWER_MS of the question
 * being shown. Streak resets to 0 on any wrong answer or skip.
 */

export const ARCADE_BASE_POINTS = 10;
export const COMBO_STEP = 0.15;
export const FAST_BONUS = 1.5;
export const FAST_ANSWER_MS = 4000;

export const LIGHTNING_SECS = 60;

/**
 * Points gained for a correct answer.
 * @param {number} streak - consecutive-correct streak including this answer (>= 1)
 * @param {boolean} fast - answered within FAST_ANSWER_MS
 * @returns {number} integer points
 */
export function computeGain(streak, fast) {
  const s = Math.max(1, streak);
  return Math.round(ARCADE_BASE_POINTS * (1 + COMBO_STEP * (s - 1)) * (fast ? FAST_BONUS : 1));
}

/** Clamp a lightning duration (seconds) to a sane range. */
export function clampLightningSecs(secs) {
  const n = parseInt(secs, 10);
  if (!Number.isFinite(n) || Number.isNaN(n)) return LIGHTNING_SECS;
  return Math.max(3, Math.min(600, n));
}

/**
 * Lightning duration for this session. Supports a ?lightningSecs=N test hook
 * (same idea as kidsdomath's ?kdmLightningSecs).
 */
export function getLightningSecs() {
  try {
    const m = (window.location.search || '').match(/[?&]lightningSecs=(\d+)/);
    if (m) return clampLightningSecs(m[1]);
  } catch {
    /* ignore — no window / bad URL */
  }
  return LIGHTNING_SECS;
}

const MODE_ORDER = ['image', 'word', 'audio', 'listen'];

/**
 * Suggest a different quiz mode to try next (for the result screen CTA).
 * @param {string} currentMode
 * @param {boolean} canRead - pre-readers don't get the image quiz (word options)
 * @returns {string|null}
 */
export function suggestNextMode(currentMode, canRead = true) {
  const allowed = MODE_ORDER.filter(m => (canRead ? true : m !== 'image'));
  const idx = allowed.indexOf(currentMode);
  if (allowed.length === 0) return null;
  const next = allowed[(idx + 1) % allowed.length];
  return next === currentMode ? null : next;
}
