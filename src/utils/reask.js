/* Bring back what was missed (roadmap RL1): a word answered wrong on its FIRST
 * try comes back 2 and 5 questions later in the same quiz (retrieval + spacing,
 * the strongest effect in the learning research). Only first tries count for
 * the score and spaced repetition; re-asks are practice. The across-visit half
 * is the Today run (todayRun.js).
 *
 * Queue items: { w: word, orig: index in the original list, retry: bool }. */

export const REASK_GAPS = [3, 6]; // 2 and 5 questions in between
export const REASK_MIN_LEN = 8;   // the 5-word first quiz stays short
export const REASK_MAX = 6;       // a quiz grows by at most this many questions

export function initQueue(words) {
  return words.map((w, i) => ({ w, orig: i, retry: false }));
}

// Returns a new queue with re-asks of queue[at] inserted (or the same queue
// when the item is itself a re-ask, the quiz is short, or the cap is reached).
export function scheduleReask(queue, at) {
  const item = queue[at];
  const originals = queue.filter((x) => !x.retry).length;
  if (!item || item.retry || originals < REASK_MIN_LEN) return queue;
  let budget = REASK_MAX - queue.filter((x) => x.retry).length;
  const q = queue.slice();
  for (const gap of REASK_GAPS) {
    if (budget <= 0) break;
    const pos = Math.min(at + gap, q.length);
    // never right after (or before) the same word: that's repetition, not recall
    if (pos <= at + 1 || q[pos - 1]?.w.id === item.w.id || q[pos]?.w.id === item.w.id) continue;
    q.splice(pos, 0, { w: item.w, orig: item.orig, retry: true });
    budget -= 1;
  }
  return q;
}
