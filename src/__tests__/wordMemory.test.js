/**
 * One on-device word memory (owner OK 11-18): the games / pages write the inbox through
 * public/word-mem.js, the app folds it with src/utils/wordMemory.js. The two must agree on
 * "words to review today", so the vanilla count is checked against the app's fold here.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { applyInboxEntries, splitInbox, reviewTodayWords, reviewTodayCount, REVIEW_MAX } from '../utils/wordMemory';
import { loadWordInbox, saveWordInbox, WORD_INBOX_KEY, WORD_INBOX_MAX, resetPlayerProgress, RESUME_WINDOW_MS } from '../utils/storage';
import { WORDS } from '../data/words';

const DAY = 86400000;
const NOW = new Date(2026, 10, 30, 15, 0, 0).getTime(); // local afternoon, so "same day" is unambiguous
const KNOWN = new Set(WORDS.map((w) => w.id));
const ids = WORDS.slice(0, 40).map((w) => w.id);
const e = (w, ok, t, extra = {}) => ({ w, ok: ok ? 1 : 0, t, s: 'g-word-zapper', ...extra });

describe('applyInboxEntries (the fold)', () => {
  it('a miss resets the word to a 1-day interval at the time it happened', () => {
    const wp = applyInboxEntries({}, [e('cat', false, NOW - 1000)], { knownIds: KNOWN, now: NOW });
    expect(wp.cat).toMatchObject({ interval: 1, wrong: 1, correct: 0, lastSeen: NOW - 1000 });
  });

  it('a whole run of right answers on one day is ONE step up, never mastery', () => {
    const many = Array.from({ length: 40 }, (_, i) => e('cat', true, NOW - 5000 + i));
    const wp = applyInboxEntries({}, many, { knownIds: KNOWN, now: NOW });
    expect(wp.cat.interval).toBe(3);
    expect(wp.cat.correct).toBe(1);
  });

  it('any miss that day makes the day a miss', () => {
    const wp = applyInboxEntries({}, [e('dog', true, NOW - 3000), e('dog', false, NOW - 2000), e('dog', true, NOW - 1000)], { knownIds: KNOWN, now: NOW });
    expect(wp.dog).toMatchObject({ interval: 1, wrong: 1 });
  });

  it('a card already moved today only gains a tally; days apart each move it', () => {
    const today = { cat: { lastSeen: NOW - 60000, interval: 3, correct: 1, wrong: 0 } };
    expect(applyInboxEntries(today, [e('cat', true, NOW - 1000)], { knownIds: KNOWN, now: NOW }).cat).toMatchObject({ interval: 3, correct: 2 });
    const twoDays = applyInboxEntries({}, [e('cat', true, NOW - 4 * DAY), e('cat', true, NOW - 1000)], { knownIds: KNOWN, now: NOW });
    expect(twoDays.cat.interval).toBe(7);
  });

  it('results older than the card (an app quiz since) only add to the counters', () => {
    const wp = { cat: { lastSeen: NOW - 1000, interval: 7, correct: 3, wrong: 0 } };
    const out = applyInboxEntries(wp, [e('cat', false, NOW - 5 * 60000)], { knownIds: KNOWN, now: NOW });
    expect(out.cat).toMatchObject({ interval: 7, lastSeen: NOW - 1000, wrong: 1 });
  });

  it('a reading look-up is a miss only for a word not yet settled', () => {
    const wp = { cat: { lastSeen: NOW - 30 * DAY, interval: 14, correct: 6, wrong: 0 } };
    const out = applyInboxEntries(wp, [e('cat', false, NOW - 1000, { k: 'look' }), e('dog', false, NOW - 1000, { k: 'look' })], { knownIds: KNOWN, now: NOW });
    expect(out.cat.interval).toBe(14);
    expect(out.dog).toMatchObject({ interval: 1, wrong: 1 });
  });

  it('drops ids that are not app words and malformed rows', () => {
    const out = applyInboxEntries({}, [e('not-a-word-xyz', false, NOW), { w: 5, t: NOW }, { w: 'cat' }, null], { knownIds: KNOWN, now: NOW });
    expect(out).toEqual({});
  });
});

describe('splitInbox (whose answers are they)', () => {
  const inbox = [e('cat', 1, 1, { p: 'A' }), e('dog', 0, 2), e('cow', 1, 3, { p: 'B' }), e('pig', 0, 4, { p: 'GONE' })];
  it('the active player takes their own; guests wait unless allowed; deleted players are dropped', () => {
    const a = splitInbox(inbox, { activeId: 'A', playerIds: ['A', 'B'], allowGuest: false });
    expect(a.mine.map((x) => x.w)).toEqual(['cat']);
    expect(a.keep.map((x) => x.w)).toEqual(['dog', 'cow']);
    const b = splitInbox(inbox, { activeId: 'A', playerIds: ['A', 'B'], allowGuest: true });
    expect(b.mine.map((x) => x.w)).toEqual(['cat', 'dog']);
    expect(b.keep.map((x) => x.w)).toEqual(['cow']);
  });
});

describe('reviewTodayWords', () => {
  it('due words first (most overdue first), then words missed in the last 3 days', () => {
    const words = WORDS.slice(0, 5);
    const [a, b, c, d, f] = words.map((w) => w.id);
    const wp = {
      [a]: { lastSeen: NOW - 2 * DAY, interval: 1, correct: 1, wrong: 0 },   // due, 1 day over
      [b]: { lastSeen: NOW - 20 * DAY, interval: 7, correct: 2, wrong: 0 },  // due, 13 days over
      [c]: { lastSeen: NOW - 3600000, interval: 1, correct: 0, wrong: 1 },   // just missed
      [d]: { lastSeen: NOW - 3600000, interval: 3, correct: 1, wrong: 0 },   // settled, not due
      [f]: { lastSeen: NOW - 5 * DAY, interval: 1, correct: 0, wrong: 1 },   // due (and missed long ago)
    };
    const out = reviewTodayWords(words, wp, NOW).map((w) => w.id);
    expect(out.slice(0, 3)).toEqual([b, f, a]);
    expect(out[3]).toBe(c);
    expect(out).not.toContain(d);
    expect(reviewTodayCount(words, wp, NOW)).toBe(4);
  });
  it('the count is capped at the review size', () => {
    const wp = Object.fromEntries(ids.map((id) => [id, { lastSeen: NOW - 9 * DAY, interval: 1, correct: 0, wrong: 1 }]));
    expect(reviewTodayCount(WORDS, wp, NOW)).toBe(REVIEW_MAX);
  });
});

describe('storage guards for the inbox', () => {
  beforeEach(() => localStorage.clear());
  it('round-trips, caps, drops malformed rows and survives junk', () => {
    saveWordInbox(Array.from({ length: WORD_INBOX_MAX + 50 }, (_, i) => e('cat', 1, i + 1)));
    expect(loadWordInbox()).toHaveLength(WORD_INBOX_MAX);
    localStorage.setItem(WORD_INBOX_KEY, JSON.stringify([{ w: 'cat', t: 5 }, { w: 3 }, 'x']));
    expect(loadWordInbox()).toEqual([{ w: 'cat', t: 5 }]);
    localStorage.setItem(WORD_INBOX_KEY, '{not json');
    expect(loadWordInbox()).toEqual([]);
    saveWordInbox([]);
    expect(localStorage.getItem(WORD_INBOX_KEY)).toBeNull();
  });
  it('a progress reset forgets that player\'s waiting answers only', () => {
    saveWordInbox([e('cat', 1, 1, { p: 'A' }), e('dog', 1, 2, { p: 'B' }), e('cow', 1, 3)]);
    resetPlayerProgress('A');
    expect(loadWordInbox().map((x) => x.w)).toEqual(['dog', 'cow']);
  });
  it('blocked storage never throws', () => {
    const real = globalThis.localStorage;
    Object.defineProperty(globalThis, 'localStorage', { value: { getItem() { throw new Error('blocked'); }, setItem() { throw new Error('blocked'); }, removeItem() { throw new Error('blocked'); } }, writable: true });
    try {
      expect(loadWordInbox()).toEqual([]);
      expect(() => saveWordInbox([e('cat', 1, 1)])).not.toThrow();
    } finally {
      Object.defineProperty(globalThis, 'localStorage', { value: real, writable: true });
    }
  });
});

// ---- public/word-mem.js, the helper the games and pages call ----
const WM_SRC = readFileSync(resolve(import.meta.dirname, '../../public/word-mem.js'), 'utf8');
function loadHelper() {
  delete window.CDE_WORD; delete window.CDE_WORDMEM;
  (0, eval)(WM_SRC);
  return window.CDE_WORDMEM;
}
const setPlayers = (players, activePlayerId) => localStorage.setItem('childrendoenglish-players', JSON.stringify({ schemaVersion: 2, players, activePlayerId }));

describe('public/word-mem.js', () => {
  beforeEach(() => { localStorage.clear(); vi.useFakeTimers(); vi.setSystemTime(NOW); });
  afterEach(() => { vi.useRealTimers(); });

  it('records app word ids only, tagged with the player', () => {
    setPlayers([{ id: 'A' }], 'A');
    loadHelper();
    window.CDE_WORD('cat', true);
    window.CDE_WORD('dog', false);
    window.CDE_WORD('Bad Id!', true);
    window.CDE_WORD(undefined, true);
    window.CDE_WORD('ant', true, true);
    expect(loadWordInbox()).toEqual([
      { w: 'cat', ok: 1, t: NOW, s: 'page', p: 'A' },
      { w: 'dog', ok: 0, t: NOW, s: 'page', p: 'A' },
      { w: 'ant', ok: 0, t: NOW, s: 'page', p: 'A', k: 'look' },
    ]);
  });

  it('a family: the active player only inside the resume window, else a guest answer', () => {
    setPlayers([{ id: 'A' }, { id: 'B' }], 'B');
    const wm = loadHelper();
    localStorage.setItem('childrendoenglish-last-active', String(NOW - 10 * 60000));
    expect(wm.owner()).toBe('B');
    localStorage.setItem('childrendoenglish-last-active', String(NOW - RESUME_WINDOW_MS - 1));
    expect(wm.owner()).toBeNull();
    localStorage.removeItem('childrendoenglish-players');
    expect(wm.owner()).toBeNull();
  });

  it('with storage blocked (school profile, private mode) the helper is a silent no-op (kit PATTERNS §41)', () => {
    const real = globalThis.localStorage;
    const boom = () => { throw new Error('SecurityError'); };
    Object.defineProperty(globalThis, 'localStorage', { value: { getItem: boom, setItem: boom, removeItem: boom }, writable: true });
    try {
      const wm = loadHelper();
      expect(() => window.CDE_WORD('cat', false)).not.toThrow();
      expect(wm.toReview()).toBe(0);
      expect(wm.card(document.createElement('div'), 'game', 'en')).toBeNull();
    } finally {
      Object.defineProperty(globalThis, 'localStorage', { value: real, writable: true });
    }
  });

  it('agrees with the app fold on "words to review today" (randomized histories)', () => {
    let seed = 7;
    const rand = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
    const intervals = [1, 3, 7, 14, 30, 60];
    for (let run = 0; run < 60; run++) {
      localStorage.clear();
      const pid = run % 3 === 0 ? null : 'A';
      if (pid) setPlayers([{ id: 'A' }], 'A');
      const wp = {};
      if (pid) {
        for (const id of ids.slice(0, 15)) {
          if (rand() < 0.6) wp[id] = { lastSeen: NOW - Math.floor(rand() * 40 * DAY), interval: intervals[Math.floor(rand() * 6)], correct: 2, wrong: rand() < 0.4 ? 1 : 0 };
        }
        localStorage.setItem('childrendoenglish-player-A', JSON.stringify({ wordProgress: wp }));
      }
      const inbox = [];
      for (let k = 0; k < 25; k++) {
        const ent = e(ids[Math.floor(rand() * 20)], rand() < 0.65, NOW - Math.floor(rand() * 6 * DAY), pid ? { p: pid } : {});
        if (rand() < 0.15) { ent.ok = 0; ent.k = 'look'; }
        inbox.push(ent);
      }
      saveWordInbox(inbox);
      const wm = loadHelper();
      const folded = applyInboxEntries(wp, inbox, { knownIds: KNOWN, now: NOW });
      expect(wm.toReview(), `run ${run}`).toBe(reviewTodayCount(WORDS, folded, NOW));
    }
  });

  it('the end card shows "words to review today (N)" linking to the review, and nothing at 0', () => {
    setPlayers([{ id: 'A' }], 'A');
    const wm = loadHelper();
    const box = document.createElement('div');
    expect(wm.card(box, 'game', 'en')).toBeNull();
    window.CDE_WORD('cat', false);
    window.CDE_WORD('dog', false);
    const a = wm.card(box, 'game', 'he');
    expect(a.getAttribute('data-cde-review')).toBe('2');
    expect(a.getAttribute('href')).toBe('/app?review=1&lang=he');
    expect(a.textContent).toContain('מילים לחזרה היום');
    expect(a.querySelector('bdi').textContent).toBe('2');
    wm.card(box, 'game', 'he');
    expect(box.querySelectorAll('.cde-review')).toHaveLength(1); // a replay re-renders, never stacks
    localStorage.removeItem('childrendoenglish-players');
    window.CDE_WORD('cow', false);
    expect(wm.reviewHref('es')).toBe('/new-player?review=1&lang=es'); // a guest starts as a new player
  });
});
