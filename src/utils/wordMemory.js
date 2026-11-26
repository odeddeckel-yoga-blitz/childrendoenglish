/** @module wordMemory — one on-device word memory for the whole site (owner OK 11-18).
 *
 * The memory IS each player's spaced-repetition record, stats.wordProgress
 * ({ [wordId]: { lastSeen, interval, correct, wrong } }, src/utils/spaced-repetition.js).
 * The in-app quizzes, Today and Daily Review already write it. Everything outside the
 * SPA — the arcade games, unit / Band I practice, the readings, word-page mini-quizzes —
 * appends results to the shared inbox (storage.js WORD_INBOX_KEY, written by
 * public/word-mem.js), and the app folds the inbox into the right player here, with
 * the same updateWordSR rule. Nothing leaves the device.
 *
 * Fold rules (kept in step with public/word-mem.js toReview()):
 *  - results are grouped per word per local day; any miss that day = ONE wrong,
 *    otherwise ONE correct — a 40-zap Word Zapper run can't push "cat" to mastered;
 *  - a correct only moves the interval up if the card wasn't already updated that
 *    day (one step up per word per day); a group older than the card's lastSeen only
 *    adds to the counters;
 *  - a reading's tap-for-meaning (k:'look') counts as a miss only for a word that
 *    isn't settled yet (unseen or interval ≤ 3);
 *  - ids that aren't app words are dropped (page-only unit words have no picture modes).
 */
import { updateWordSR } from './spaced-repetition';
import { formatLocalDate } from './storage';

const DAY = 86400000;
const RECENT_MISS_MS = 3 * DAY;
export const REVIEW_MAX = 10;
const SETTLED = 3; // interval (days) above which a look-up no longer counts as a miss

const dayOf = (t) => formatLocalDate(new Date(t));

/** Fold inbox entries into a wordProgress map (pure; returns a new map). */
export function applyInboxEntries(wordProgress, entries, { knownIds = null, now = Date.now() } = {}) {
  const groups = new Map();
  for (const e of entries || []) {
    if (!e || typeof e.w !== 'string' || !(e.t > 0)) continue;
    if (knownIds && !knownIds.has(e.w)) continue;
    const k = `${e.w}|${dayOf(e.t)}`;
    let g = groups.get(k);
    if (!g) { g = { w: e.w, t: e.t, last: e.t, ok: false, miss: false, look: false, oks: 0, misses: 0 }; groups.set(k, g); }
    g.t = Math.min(g.t, e.t); g.last = Math.max(g.last, e.t);
    if (e.ok) { g.ok = true; g.oks += 1; } else if (e.k === 'look') g.look = true; else { g.miss = true; g.misses += 1; }
  }
  let wp = { ...(wordProgress || {}) };
  for (const g of [...groups.values()].sort((a, b) => a.t - b.t)) {
    const card = wp[g.w];
    const miss = g.miss || (g.look && (!card || card.interval <= SETTLED));
    if (!miss && !g.ok) continue;
    const at = Math.min(g.last, now);
    if (card && g.t <= card.lastSeen) {
      // older than what the card already knows (e.g. an in-app quiz since): tally only
      wp[g.w] = { ...card, correct: (card.correct || 0) + (miss ? 0 : 1), wrong: (card.wrong || 0) + (miss ? 1 : 0) };
      continue;
    }
    if (miss) {
      wp = updateWordSR(wp, g.w, false);
      wp[g.w] = { ...wp[g.w], lastSeen: at };
    } else if (card && dayOf(card.lastSeen) === dayOf(g.t)) {
      wp[g.w] = { ...card, correct: (card.correct || 0) + 1 };
    } else {
      wp = updateWordSR(wp, g.w, true);
      wp[g.w] = { ...wp[g.w], lastSeen: at };
    }
  }
  return wp;
}

/** Split the inbox into the entries this player takes now and the ones to keep.
 *  mine: tagged with the active player, plus untagged (guest) ones when allowGuest.
 *  keep: other existing players' entries, and guest ones while !allowGuest.
 *  Entries of a player who no longer exists are dropped. */
export function splitInbox(inbox, { activeId, playerIds = [], allowGuest = false }) {
  const ids = new Set(playerIds);
  const mine = [];
  const keep = [];
  for (const e of inbox || []) {
    if (e.p === activeId) mine.push(e);
    else if (!e.p) (allowGuest ? mine : keep).push(e);
    else if (ids.has(e.p)) keep.push(e);
  }
  return { mine, keep };
}

/** Words up for review today: due by the interval ladder (most overdue first),
 *  then words missed in the last 3 days that aren't due yet (TodayRun's rule). */
export function reviewTodayWords(allWords, wordProgress = {}, now = Date.now()) {
  const card = (w) => wordProgress[w.id];
  // getDueWords' rule (seen, and lastSeen + interval days has passed), at `now`
  const due = allWords.filter((w) => card(w) && (now - card(w).lastSeen) / DAY >= card(w).interval)
    .sort((a, b) => ((now - card(b).lastSeen) / DAY - card(b).interval) - ((now - card(a).lastSeen) / DAY - card(a).interval));
  const dueIds = new Set(due.map((w) => w.id));
  const missed = allWords.filter((w) => {
    const c = card(w);
    return c && !dueIds.has(w.id) && c.wrong > 0 && c.interval === 1 && now - c.lastSeen < RECENT_MISS_MS;
  }).sort((a, b) => card(b).lastSeen - card(a).lastSeen);
  return [...due, ...missed];
}

/** The number the end-of-activity card shows (the review takes at most REVIEW_MAX). */
export function reviewTodayCount(allWords, wordProgress = {}, now = Date.now()) {
  return Math.min(reviewTodayWords(allWords, wordProgress, now).length, REVIEW_MAX);
}
