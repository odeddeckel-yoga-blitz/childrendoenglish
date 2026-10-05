/** @module learningCycle — the guided learn→practice→advance loop.
 *
 * Deterministic batch sequencing over the vocabulary: beginner → intermediate →
 * advanced, alphabetical inside each level, with the learner's known letters
 * floated first when that feature is active. Each ~10-word batch is practiced
 * through a LADDER of existing quiz modes (stages), then advances — a SOFT gate:
 * finishing the ladder once moves on; true mastery accrues across days via the
 * SRS/Daily Review resurfacing (never block batch N+1 on batch N mastery).
 *
 * Cycle position lives in per-player stats as stats.cycle = { batch, stage }.
 * Older players lack the key — always read through cycleState().
 */
import { WORDS } from '../data/words';

export const BATCH_SIZE = 10;
const LEVEL_RANK = { beginner: 0, intermediate: 1, advanced: 2 };

/** Stage ladder: pre-readers skip the read-the-word stage. */
export const stagesFor = (canRead) =>
  canRead ? ['listen', 'image', 'word'] : ['listen', 'image'];

/** Deterministic full-catalog sequence (same inputs → same order, always). */
export function cycleSequence(knownLetters = null) {
  const known = knownLetters?.length ? new Set(knownLetters.map((l) => l.toLowerCase())) : null;
  return [...WORDS].sort((a, b) => {
    if (known) {
      const ak = known.has(a.word[0].toLowerCase()) ? 0 : 1;
      const bk = known.has(b.word[0].toLowerCase()) ? 0 : 1;
      if (ak !== bk) return ak - bk;
    }
    const al = LEVEL_RANK[a.level] ?? 1;
    const bl = LEVEL_RANK[b.level] ?? 1;
    if (al !== bl) return al - bl;
    const aw = a.word.toLowerCase();
    const bw = b.word.toLowerCase();
    return aw < bw ? -1 : aw > bw ? 1 : 0;
  });
}

export function batchCount(knownLetters = null) {
  return Math.ceil(cycleSequence(knownLetters).length / BATCH_SIZE);
}

/** The words of batch i (clamped; the last batch may be short). */
export function batchWords(batchIdx, knownLetters = null) {
  const seq = cycleSequence(knownLetters);
  const i = Math.max(0, Math.min(batchIdx, Math.ceil(seq.length / BATCH_SIZE) - 1));
  return seq.slice(i * BATCH_SIZE, (i + 1) * BATCH_SIZE);
}

/** Letter span label for a batch, e.g. "A" or "A–B" — the kid-facing batch name. */
export function batchLabel(batchIdx, knownLetters = null) {
  const words = batchWords(batchIdx, knownLetters);
  if (words.length === 0) return '';
  const first = words[0].word[0].toUpperCase();
  const last = words[words.length - 1].word[0].toUpperCase();
  return first === last ? first : `${first}–${last}`;
}

/** Safe read of the per-player cycle position (older stats lack the key). */
export function cycleState(stats) {
  const c = stats?.cycle;
  return { batch: c?.batch ?? 0, stage: c?.stage ?? 0 };
}

/** Advance after a COMPLETED (not quit) stage quiz. Returns the new state plus
 *  batchDone so the caller can show the reward interstitial and fire beacons. */
export function advanceCycle(stats, canRead) {
  const { batch, stage } = cycleState(stats);
  const ladder = stagesFor(canRead);
  if (stage + 1 < ladder.length) {
    return { batch, stage: stage + 1, batchDone: false };
  }
  const last = batchCount() - 1;
  return { batch: Math.min(batch + 1, last + 1), stage: 0, batchDone: true };
}

/** Mastered-words count (same definition the Progress dashboard uses). */
export function masteredCount(stats) {
  return Object.values(stats?.wordProgress || {}).filter((w) => w.interval >= 14).length;
}
