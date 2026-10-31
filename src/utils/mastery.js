// Mastery map (kit RL14 + RL16 rules, owner GO 10-31): the kit's kdm-mastery.js drives vanilla
// `Game` menus; this app is React, so the rules are ported (as yoga-bits did), not the file.
// No points, streaks or timers; nothing decays; the map only moves forward.
//
// stats.wordMap = { [wordId]: { s: 1 | 2, d: 'YYYY-MM-DD' } }
//   s 1 = ◐ learning (right only on a re-ask after a miss), s 2 = ● mastered (right on the first ask)
//   d = the day it was last confirmed (mastered, or kept on a later day)
// Retention (never shown to the child): a word mastered on an EARLIER day, asked again first-try →
//   right = mm_keep, wrong = mm_slip. The state stays ● either way.
// Event names match the kit (mm_*), so reads compare across sites.

export const todayKey = (d = new Date()) => d.toISOString().slice(0, 10);

export function updateWordMap(map, id, { correct, review, today }) {
  const prev = map?.[id];
  const events = [];
  let next = prev;
  if (review) {
    if (correct && !prev) next = { s: 1, d: today };
  } else if (correct) {
    if (prev?.s === 2) { if (prev.d < today) { events.push('mm_keep'); next = { s: 2, d: today }; } }
    else { next = { s: 2, d: today }; events.push('mm_mast'); }
  } else if (prev?.s === 2 && prev.d < today) {
    events.push('mm_slip');
  }
  if (next === prev) return { map: map || {}, events };
  return { map: { ...(map || {}), [id]: next }, events };
}

/** One quiz: first tries (answers) then re-asks (retries). Returns the new map and the events. */
export function applyQuiz(map, { answers = [], retries = [] }, today) {
  let m = map || {};
  const events = [];
  for (const a of answers) {
    if (a.wordId == null || a.correct == null) continue;
    const r = updateWordMap(m, a.wordId, { correct: !!a.correct, review: false, today });
    m = r.map; for (const e of r.events) events.push([e, String(a.wordId)]);
  }
  for (const r0 of retries) {
    if (r0.wordId == null) continue;
    m = updateWordMap(m, r0.wordId, { correct: !!r0.correct, review: true, today }).map;
  }
  return { map: m, events };
}

export function topicCounts(map, words, category) {
  const list = words.filter((w) => w.category === category);
  let mastered = 0, learning = 0;
  for (const w of list) { const s = map?.[w.id]?.s; if (s === 2) mastered++; else if (s === 1) learning++; }
  return { total: list.length, mastered, learning, unseen: list.length - mastered - learning };
}

/** Categories whose every word became ● between two maps (mm_tmast). */
export function topicsJustMastered(before, after, words) {
  const cats = [...new Set(words.map((w) => w.category))];
  return cats.filter((c) => {
    const a = topicCounts(after, words, c), b = topicCounts(before, words, c);
    return a.total > 0 && a.mastered === a.total && b.mastered < b.total;
  });
}

export const hasEarlierProgress = (map, today) => Object.values(map || {}).some((v) => v.d < today);
