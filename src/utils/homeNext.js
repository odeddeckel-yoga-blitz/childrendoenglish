/** @module homeNext — the returning player's "Next" home (owner 11-21 build on feat/home-next; owner 11-26 D4 via
 *  Factory A254: the Next card and the trimmed More for EVERY returning player, no 50/50 split, and no separate
 *  4-step path: the path is the 5-step ladder of learningCycle.js). Since 11-27 (retro rule 3) it ships as the
 *  treatment arm of the ladder-next split by device (ladderArm.js): the control arm keeps main's home.
 *
 *  A returning load = the device's oldest player was created ≥ FIRST_VISIT_MS before this page load, so a
 *  brand-new family's first sitting (create → quiz → a game page → back) keeps today's first-visit home.
 *
 *  Beacon (pinned in api/land.js EV_ITEM), daily totals only, no identifier:
 *    hn @ see_<k>~1 the Next card showed kind k (mreq|path|game), once per device-day (~1: the ladder-next arm,
 *                   src/utils/ladderArm.js; only the treatment arm has the card)
 *    hn @ next_<k>  it was tapped
 *    mreq_notme @ tap  "Not me" on the missed-words card (the card names the active player)
 *  Stored on the device only: the games launched from the app (cde-hn-games), the day a new-game card was
 *  tapped (cde-hn-gday) and which see_ tallies went out today (cde-hn-sent).
 */
import { sendLearnBatch } from './learnBeacon';
import { armTag, ladderTreat } from './ladderArm';
import { formatLocalDate } from './storage';
import { SPOTLIGHT_GAMES } from '../data/arcadeGames';

const SENT_KEY = 'cde-hn-sent';
const GAMES_KEY = 'cde-hn-games';
const GDAY_KEY = 'cde-hn-gday';

export const FIRST_VISIT_MS = 2 * 60 * 60 * 1000;
export const MIN_MISSED = 3;
export const MISSED_QUIZ_LEN = 5;
// a miss older than this is not "since the last visit" any more (and the SR review covers it)
export const MISSED_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;
export const NEXT_KINDS = ['mreq', 'path', 'game'];

const safeStore = (store) => {
  try { return store || globalThis.localStorage || null; } catch { return null; }
};
const readJSON = (store, key) => {
  try { return JSON.parse(store.getItem(key) || 'null'); } catch { return null; }
};
const today = (now = new Date()) => formatLocalDate(now);

/** True when the app opened with players that were created before this sitting. */
export function isReturningLoad(registry, now = Date.now()) {
  const players = registry?.players || [];
  if (!players.length) return false;
  const oldest = Math.min(...players.map((p) => Date.parse(p?.createdAt) || 0)); // no date = an old (migrated) player
  return now - oldest >= FIRST_VISIT_MS;
}

/** The gate: the Next card + 6-item More show on a returning load of the TREATMENT arm only (ladder-next split). */
export function showsHomeNext(registry, treat = ladderTreat(), now = Date.now()) {
  return treat && isReturningLoad(registry, now);
}

/** One Next-card tally (hn @ item). once = at most once per local day per device. */
export function nextTally(item, { once = false, store, now } = {}) {
  if (once) {
    const s = safeStore(store);
    if (!s) return false;
    const d = today(now);
    const sent = readJSON(s, SENT_KEY);
    const items = sent?.d === d && Array.isArray(sent.i) ? sent.i : [];
    if (items.includes(item)) return false;
    try { s.setItem(SENT_KEY, JSON.stringify({ d, i: [...items, item].slice(-20) })); } catch { return false; }
  }
  sendLearnBatch([{ e: 'hn', i: item + armTag() }]); // the card is treatment-only, so this is ~1 (ladderArm.js)
  return true;
}

/** A named player: typed a name. The play-first default ("Player 1", autoName) and the legacy migrated
 *  "Player 1 ⭐" are not, so the missed-words card never names a stranger. */
export function isNamedPlayer(p) {
  if (!p || p.autoName || !String(p.name || '').trim()) return false;
  if (p.name === 'Player 1' && p.avatar === '⭐') return false;
  return true;
}

/** Words whose LAST answer was wrong (SR resets a miss to interval 1; a right answer moves it to ≥3),
 *  answered before this visit began and within MISSED_MAX_AGE_MS. Most recent misses first. */
export function missedWords(wordProgress, words, since, now = Date.now()) {
  const byId = new Map((words || []).map((w) => [w.id, w]));
  return Object.entries(wordProgress || {})
    .filter(([id, p]) => p && byId.has(id) && (p.wrong || 0) > 0 && p.interval === 1
      && p.lastSeen > 0 && p.lastSeen < since && now - p.lastSeen <= MISSED_MAX_AGE_MS)
    .sort((a, b) => b[1].lastSeen - a[1].lastSeen || (a[0] < b[0] ? -1 : 1))
    .map(([id]) => byId.get(id));
}

/** "N words learned": words the player has answered right at least once. */
export function learnedCount(stats) {
  return Object.values(stats?.wordProgress || {}).filter((p) => (p?.correct || 0) > 0).length;
}

// Games the Next card may suggest, strongest follow-ons first (data 11-20: word-zapper, missing-letter).
// Only home-spotlight candidates: the wave 2/3 games stay hub-only until their own reads (arcadeGames.js).
const READER_ORDER = ['word-zapper', 'missing-letter', 'picture-bingo', 'word-memory', 'odd-one-out', 'rhyme-time',
  'category-conveyor', 'letter-twins', 'read-it', 'sound-pairs', 'spelling-forge'];
const PRE_READER_ORDER = ['word-zapper', 'picture-bingo', 'word-memory', 'odd-one-out', 'sound-pairs', 'category-conveyor'];
// best-score keys the game pages already write (read only; no game file changes)
const BEST_KEYS = {
  'odd-one-out': 'cde_oo_best', 'word-memory': 'cde_wm_best', 'sound-pairs': 'cde_sp_best',
  'spelling-forge': 'childrendoenglish-spelling-forge',
};
export const gameName = (id) => SPOTLIGHT_GAMES.find((g) => g.id === id)?.name || id;

/** Games this device has played: launched from the app (our list) or that left a score behind. */
export function playedGames(store) {
  const s = safeStore(store);
  const out = new Set();
  if (!s) return out;
  const mine = readJSON(s, GAMES_KEY);
  if (Array.isArray(mine)) mine.forEach((g) => out.add(g));
  const arcade = readJSON(s, 'cde_arcade');
  if (arcade && typeof arcade === 'object') Object.keys(arcade).forEach((g) => out.add(g));
  for (const [g, k] of Object.entries(BEST_KEYS)) { try { if (s.getItem(k) != null) out.add(g); } catch { /* storage off */ } }
  return out;
}

export function noteGameLaunch(id, store) {
  const s = safeStore(store);
  if (!s || !id) return;
  const mine = readJSON(s, GAMES_KEY);
  const list = Array.isArray(mine) ? mine : [];
  if (list.includes(id)) return;
  try { s.setItem(GAMES_KEY, JSON.stringify([...list, id].slice(-40))); } catch { /* storage off */ }
}

// The Next card offers a new game once per day after a finished batch; after that tap it goes back to the path.
export function nextGameTappedToday(store, now) {
  const s = safeStore(store);
  try { return !!s && s.getItem(GDAY_KEY) === today(now); } catch { return false; }
}
export function noteNextGameTap(id, store, now) {
  const s = safeStore(store);
  try { s?.setItem(GDAY_KEY, today(now)); } catch { /* storage off */ }
  noteGameLaunch(id, s);
}

/** The first suggested game this device hasn't played, or null. */
export function nextNewGame(played, canRead = true) {
  const order = canRead ? READER_ORDER : PRE_READER_ORDER;
  return order.find((g) => !played?.has?.(g)) || null;
}

/** The Next card: one step, in the owner's order. (a) missed-word re-quiz for a NAMED player with ≥3 misses
 *  since the last visit; (b) the next learning-path step; (c) a new game, when the path is done or a batch
 *  was finished today. Falls back to the path. */
export function pickNext({ player, missed = [], pathDone = false, batchDoneToday = false, newGame = null } = {}) {
  if (isNamedPlayer(player) && missed.length >= MIN_MISSED) return { kind: 'mreq', words: missed.slice(0, MISSED_QUIZ_LEN) };
  if ((pathDone || batchDoneToday) && newGame) return { kind: 'game', game: newGame };
  return { kind: 'path' };
}

/** A template with {{key}} slots → parts, so a name or a number can be wrapped (<bdi>) inside Hebrew text. */
export function splitTemplate(str, keys) {
  const re = new RegExp(`(\\{\\{(?:${keys.join('|')})\\}\\})`, 'g');
  return String(str).split(re).filter((x) => x !== '').map((x) => {
    const m = /^\{\{(\w+)\}\}$/.exec(x);
    return m && keys.includes(m[1]) ? { key: m[1] } : { text: x };
  });
}
