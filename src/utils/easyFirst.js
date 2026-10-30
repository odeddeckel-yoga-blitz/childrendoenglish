// U2 (audit, 10-30): a brand-new player's first question should be one most kids
// get right, so the first tap is a win. "Easy" comes from the committed 28-day
// word stats (cde-stats.json: id → [answers, correct]), not from a guess.
export const EASY_MIN_ANSWERS = 30;
export const EASY_MIN_RATE = 0.9;
const TOP = 5; // pick among the 5 easiest so the first word varies

// Words in `pool` that most kids answer right, easiest first.
export function easyWords(pool, statsWords = {}) {
  return pool
    .map((w) => {
      const [n = 0, ok = 0] = statsWords[w.id] || [];
      return { w, n, rate: n ? ok / n : 0 };
    })
    .filter((x) => x.n >= EASY_MIN_ANSWERS && x.rate >= EASY_MIN_RATE)
    .sort((a, b) => b.rate - a.rate || b.n - a.n)
    .map((x) => x.w);
}

// Returns `selected` with an easy word first: an easy word already in the quiz
// moves to the front; otherwise one from the pool takes the last slot's place.
// Unchanged when the pool has no easy word.
export function easyFirst(selected, pool, statsWords, rand = Math.random) {
  if (!selected.length) return selected;
  const easy = easyWords(pool, statsWords);
  if (!easy.length) return selected;
  const easyIds = new Set(easy.slice(0, TOP).map((w) => w.id));
  const inQuiz = selected.findIndex((w) => easyIds.has(w.id));
  if (inQuiz >= 0) return [selected[inQuiz], ...selected.filter((_, i) => i !== inQuiz)];
  const pick = easy.slice(0, TOP)[Math.floor(rand() * Math.min(TOP, easy.length))];
  return [pick, ...selected.slice(0, -1)];
}
