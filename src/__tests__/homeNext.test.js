import { describe, it, expect, beforeEach, vi } from 'vitest';

const sent = [];
vi.mock('../utils/learnBeacon', () => ({ sendLearnBatch: (ev) => sent.push(...ev), sendLearn: (e, i) => sent.push({ e, i }) }));

const {
  FIRST_VISIT_MS, isReturningLoad, nextTally, isNamedPlayer, missedWords, learnedCount, pickNext, nextNewGame,
  playedGames, noteGameLaunch, nextGameTappedToday, noteNextGameTap, splitTemplate, MIN_MISSED, MISSED_QUIZ_LEN,
} = await import('../utils/homeNext');

const mem = () => {
  const m = new Map();
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k), m };
};
const W = (id) => ({ id, word: id, category: 'x' });
const WORDS = ['cat', 'dog', 'sun', 'hat', 'cup', 'box', 'pen'].map(W);
const NOW = Date.parse('2026-11-21T12:00:00Z');
const DAY = 86400000;

beforeEach(() => { sent.length = 0; });

describe('returning load (who gets the Next home; owner D4: everyone returning, no split)', () => {
  it('returning = the oldest player predates this sitting by 2 h (no date = an old migrated player)', () => {
    const iso = (ms) => new Date(ms).toISOString();
    expect(isReturningLoad(null, NOW)).toBe(false);
    expect(isReturningLoad({ players: [] }, NOW)).toBe(false);
    expect(isReturningLoad({ players: [{ createdAt: iso(NOW - 10 * 60000) }] }, NOW)).toBe(false);
    expect(isReturningLoad({ players: [{ createdAt: iso(NOW - FIRST_VISIT_MS) }] }, NOW)).toBe(true);
    expect(isReturningLoad({ players: [{ createdAt: iso(NOW - 60000) }, { createdAt: iso(NOW - 3 * DAY) }] }, NOW)).toBe(true);
    expect(isReturningLoad({ players: [{}] }, NOW)).toBe(true);
  });
});

describe('Next card tallies', () => {
  it('sends hn @ item; once = once per local day; no arm events', () => {
    const s = mem();
    const now = new Date(NOW);
    expect(nextTally('see_mreq', { once: true, store: s, now })).toBe(true);
    expect(nextTally('see_mreq', { once: true, store: s, now })).toBe(false);
    expect(nextTally('see_mreq', { once: true, store: s, now: new Date(NOW + DAY) })).toBe(true);
    nextTally('next_path');
    expect(sent).toEqual([{ e: 'hn', i: 'see_mreq' }, { e: 'hn', i: 'see_mreq' }, { e: 'hn', i: 'next_path' }]);
  });
});

describe('named player / Not-me rule', () => {
  it('only a typed name counts; the play-first default and the legacy Player 1 do not', () => {
    expect(isNamedPlayer({ name: 'Maya', avatar: '🦊' })).toBe(true);
    expect(isNamedPlayer({ name: 'Player 1', avatar: '🦊', autoName: true })).toBe(false);
    expect(isNamedPlayer({ name: 'שחקן 1', avatar: '🐱', autoName: true })).toBe(false);
    expect(isNamedPlayer({ name: 'Player 1', avatar: '⭐' })).toBe(false);
    expect(isNamedPlayer({ name: '  ', avatar: '🦊' })).toBe(false);
    expect(isNamedPlayer(null)).toBe(false);
  });
});

describe('missed words since the last visit', () => {
  const since = NOW - 1000;
  const wp = {
    cat: { lastSeen: NOW - DAY, interval: 1, correct: 0, wrong: 1 },       // missed last visit
    dog: { lastSeen: NOW - 2 * DAY, interval: 1, correct: 2, wrong: 3 },   // missed (after rights)
    sun: { lastSeen: NOW - DAY, interval: 3, correct: 1, wrong: 1 },       // missed then right → not missed
    hat: { lastSeen: NOW, interval: 1, correct: 0, wrong: 1 },             // missed THIS visit → not counted
    cup: { lastSeen: NOW - 40 * DAY, interval: 1, correct: 0, wrong: 1 },  // too old
    box: { lastSeen: NOW - 3 * DAY, interval: 1, correct: 0, wrong: 2 },
    gone: { lastSeen: NOW - DAY, interval: 1, correct: 0, wrong: 1 },      // no longer a word
  };
  it('keeps last-answer-wrong words from before this visit, newest first', () => {
    expect(missedWords(wp, WORDS, since, NOW).map((w) => w.id)).toEqual(['cat', 'dog', 'box']);
    expect(missedWords({}, WORDS, since, NOW)).toEqual([]);
  });
  it('learnedCount = words answered right at least once', () => {
    expect(learnedCount({ wordProgress: wp })).toBe(2);
    expect(learnedCount({})).toBe(0);
  });
});

describe('the Next card picker', () => {
  const named = { name: 'Maya', avatar: '🦊' };
  const missed = WORDS.slice(0, 7);
  it('(a) re-quiz for a named player with ≥3 misses, capped at 5 words', () => {
    const n = pickNext({ player: named, missed, newGame: 'word-zapper' });
    expect(n.kind).toBe('mreq');
    expect(n.words).toHaveLength(MISSED_QUIZ_LEN);
  });
  it('never for the unnamed default player, nor under 3 misses', () => {
    expect(pickNext({ player: { name: 'Player 1', autoName: true }, missed }).kind).toBe('path');
    expect(pickNext({ player: named, missed: missed.slice(0, MIN_MISSED - 1) }).kind).toBe('path');
  });
  it('(b) the path, then (c) a new game when the path is done or a batch was finished today', () => {
    expect(pickNext({ player: named, newGame: 'word-zapper' })).toEqual({ kind: 'path' });
    expect(pickNext({ player: named, batchDoneToday: true, newGame: 'missing-letter' })).toEqual({ kind: 'game', game: 'missing-letter' });
    expect(pickNext({ player: named, pathDone: true, newGame: 'word-zapper' })).toEqual({ kind: 'game', game: 'word-zapper' });
    expect(pickNext({ player: named, pathDone: true, newGame: null })).toEqual({ kind: 'path' });
  });
  it('the re-quiz outranks a finished batch', () => {
    expect(pickNext({ player: named, missed, batchDoneToday: true, newGame: 'word-zapper' }).kind).toBe('mreq');
  });
});

describe('new games', () => {
  it('suggests the strongest follow-ons first, skipping played ones (ours or a saved score)', () => {
    const s = mem();
    expect(nextNewGame(playedGames(s), true)).toBe('word-zapper');
    s.setItem('cde_arcade', JSON.stringify({ 'word-zapper': { best: 3 } }));
    expect(nextNewGame(playedGames(s), true)).toBe('missing-letter');
    noteGameLaunch('missing-letter', s);
    s.setItem('cde_wm_best', '{}');
    expect(playedGames(s).has('word-memory')).toBe(true);
    expect(nextNewGame(playedGames(s), true)).toBe('picture-bingo');
    expect(nextNewGame(new Set(['word-zapper']), false)).toBe('picture-bingo'); // pre-readers: no reading games
  });
  it('a tapped new-game card counts for the day and records the game', () => {
    const s = mem();
    const now = new Date(NOW);
    expect(nextGameTappedToday(s, now)).toBe(false);
    noteNextGameTap('picture-bingo', s, now);
    expect(nextGameTappedToday(s, now)).toBe(true);
    expect(nextGameTappedToday(s, new Date(NOW + DAY))).toBe(false);
    expect(playedGames(s).has('picture-bingo')).toBe(true);
  });
});

describe('splitTemplate', () => {
  it('splits {{slots}} so values can be wrapped for RTL', () => {
    expect(splitTemplate('מילים לנסות שוב, {{name}}', ['name'])).toEqual([{ text: 'מילים לנסות שוב, ' }, { key: 'name' }]);
    expect(splitTemplate('Step {{step}} of {{total}}', ['step', 'total'])).toEqual([{ text: 'Step ' }, { key: 'step' }, { text: ' of ' }, { key: 'total' }]);
  });
});
