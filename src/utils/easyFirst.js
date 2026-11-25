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

// 11-20 read (since 11-07): first quizzes that got past Q1 still lost a third of
// the letter-path starts by Q5 (new-letter 34/68 done), and U2 only eased Q1 —
// Q2 became the most-missed first-quiz question (27% wrong vs Q1 19%). So a
// brand-new player's WHOLE first quiz now comes from the pool's best-answered
// words: the top (length + SPARE) by right-rate among words with enough answers,
// `length` of them at random (the quiz still varies), easiest first. Words come
// only from `pool` (a ladder batch stays inside its batch); short on rated words
// → the rest of `selected` fills in. No stats → `selected` unchanged.
const SPARE = 3;
export function easyFirstQuiz(selected, pool, statsWords = {}, rand = Math.random) {
  const len = selected.length;
  if (!len) return selected;
  const ranked = pool
    .map((w) => {
      const [n = 0, ok = 0] = statsWords[w.id] || [];
      return { w, n, rate: n ? ok / n : 0 };
    })
    .filter((x) => x.n >= EASY_MIN_ANSWERS)
    .sort((a, b) => b.rate - a.rate || b.n - a.n);
  if (!ranked.length) return selected;
  const top = ranked.slice(0, len + SPARE);
  const picked = [];
  while (picked.length < len && top.length) picked.push(top.splice(Math.floor(rand() * top.length), 1)[0]);
  picked.sort((a, b) => b.rate - a.rate || b.n - a.n);
  const ids = new Set(picked.map((x) => x.w.id));
  const fill = selected.filter((w) => !ids.has(w.id)).slice(0, len - picked.length);
  return [...picked.map((x) => x.w), ...fill];
}
