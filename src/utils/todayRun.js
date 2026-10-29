/**
 * "Today" run (roadmap M1): one ~5-minute session a day built from the child's
 * own history, aimed at ~80% success. Order of need:
 *   1. due words (most overdue first) — the spaced-repetition ladder
 *   2. recently missed words (wrong in the last 3 days, even if not due yet)
 *   3. at most `maxNew` unseen words from the child's highest unlocked level
 *   4. top-up with the least-settled seen words
 * Each word's question type follows how many times it has been retrieved
 * correctly, so one word meets ~10 retrievals across visits in three forms:
 *   picture → pick the English word   (0–1 correct so far)
 *   hear    → pick the picture        (2–4)
 *   spell   → build it from tiles     (5+; letters-only words up to 8 long)
 * Pre-readers always get "hear". Pure functions — no React, no storage.
 */

const DAY = 86400000;
export const TODAY_SIZE = 12;
const LEVEL_ORDER = ['beginner', 'intermediate', 'advanced'];

export function pickTodayWords(allWords, wordProgress = {}, { unlockedLevels = ['beginner'], size = TODAY_SIZE, maxNew = 3, now = Date.now(), rand = Math.random } = {}) {
  const card = (w) => wordProgress[w.id];
  const overdue = (w) => (now - card(w).lastSeen) / DAY - card(w).interval;
  const seen = allWords.filter((w) => card(w));
  const picked = [];
  const take = (list, n = size) => { for (const w of list) { if (picked.length >= size || n <= 0) return; if (!picked.includes(w)) { picked.push(w); n -= 1; } } };

  take(seen.filter((w) => overdue(w) >= 0).sort((a, b) => overdue(b) - overdue(a)));
  take(seen.filter((w) => card(w).wrong > 0 && card(w).interval === 1 && now - card(w).lastSeen < 3 * DAY));
  const top = LEVEL_ORDER.filter((l) => unlockedLevels.includes(l)).pop() || 'beginner';
  const fresh = shuffle(allWords.filter((w) => !card(w) && w.level === top), rand);
  // With nothing seen yet, the whole run is new words (still capped by size)
  take(fresh, seen.length ? maxNew : size);
  take(seen.slice().sort((a, b) => card(a).interval - card(b).interval || card(a).lastSeen - card(b).lastSeen));
  return shuffle(picked, rand);
}

export function probeFor(word, wordProgress = {}, canRead = true) {
  if (!canRead) return 'hear';
  const n = wordProgress[word.id]?.correct || 0;
  if (n >= 5 && /^[a-z]{2,8}$/i.test(word.word)) return 'spell';
  if (n >= 2) return 'hear';
  return 'picture';
}

/** The word's letters plus `decoys` extra letters, shuffled (all lower case). */
export function spellTiles(word, { decoys = 2, rand = Math.random } = {}) {
  const letters = word.toLowerCase().split('');
  const abc = 'abcdefghijklmnopqrstuvwxyz'.split('').filter((c) => !letters.includes(c));
  const extra = shuffle(abc, rand).slice(0, decoys);
  return shuffle([...letters, ...extra], rand).map((ch, i) => ({ id: i, ch }));
}

function shuffle(a, rand) {
  const b = a.slice();
  for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; }
  return b;
}
