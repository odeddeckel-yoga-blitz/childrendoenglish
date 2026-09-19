// Quiz-mode difficulty ladder, easiest → hardest by reading demand:
// listen (hear → tap picture, zero reading), word (read one word → tap picture),
// image (picture → read 4 word options), audio (hear → read 4 word options).
export const MODE_LADDER = ['listen', 'word', 'image', 'audio'];

const PASS_RATIO = 0.8;

/**
 * The next mode worth nudging the kid toward: the first rung of the ladder
 * they haven't yet passed a quiz in (≥80% score). Returns null when every
 * available mode has been passed — no chip needed for veterans.
 */
export function recommendedMode(quizHistory = [], canRead = true) {
  const passed = new Set(
    quizHistory
      .filter(q => q.total > 0 && q.score / q.total >= PASS_RATIO)
      .map(q => q.mode)
  );
  const ladder = canRead ? MODE_LADDER : MODE_LADDER.filter(m => m !== 'image');
  return ladder.find(m => !passed.has(m)) || null;
}
