import { describe, it, expect } from 'vitest';
import { decideSpotlight, judgeLane, RULES } from '../utils/spotlightDecide';
import { ARCADE, SPOTLIGHT_GAMES } from '../data/arcadeGames';

const words = [
  { id: 'apple', word: 'apple', category: 'food', hebrewTranslation: 'תפוח', imageUrl: '/images/apple.webp' },
  { id: 'bear', word: 'bear', category: 'animals', hebrewTranslation: 'דוב', imageUrl: '/images/bear.webp' },
  { id: 'cat', word: 'cat', category: 'animals', hebrewTranslation: 'חתול', imageUrl: '/images/cat.webp' },
  { id: 'dog', word: 'dog', category: 'animals', hebrewTranslation: 'כלב', imageUrl: '/images/dog.webp' },
];
const snap = { generatedAt: '2026-10-09T00:00:00.000Z', words: {}, games: {} };
const T0 = '2026-10-10T20:00:00.000Z';
const at = (days) => new Date(Date.parse(T0) + days * 86400000).toISOString();
const base = () => ({ word: { id: 'cat', since: T0 }, game: { id: 'category-conveyor', since: T0 }, history: [] });

describe('judgeLane', () => {
  it('keeps a young item with no traffic, and keeps an engaging one', () => {
    expect(judgeLane('word', { id: 'cat', since: T0 }, null, snap, at(1)).action).toBe('keep');
    const v = judgeLane('word', { id: 'cat', since: T0 }, { spot: 6, exposure: 25, good: 20 }, snap, at(3));
    expect(v.action).toBe('keep'); expect(v.sufficient).toBe(true); expect(v.flag).toBeNull();
  });
  it('swaps + flags on poor engagement after enough exposure; only flags on watch-level', () => {
    const poor = judgeLane('word', { id: 'cat', since: T0 }, { spot: 0, exposure: 24, good: 6 }, snap, at(2));
    expect(poor.action).toBe('swap'); expect(poor.flag.severity).toBe('poor');
    const watch = judgeLane('game', { id: 'word-zapper', since: T0 }, { spot: 0, exposure: 30, good: 20 }, snap, at(2));
    expect(watch.action).toBe('keep'); expect(watch.flag.severity).toBe('watch');
  });
  it('rotates an idle item after idleTenureDays and any item after maxTenureDays', () => {
    expect(judgeLane('word', { id: 'cat', since: T0 }, { spot: 1, exposure: 2, good: 2 }, snap, at(RULES.idleTenureDays)).action).toBe('swap');
    expect(judgeLane('word', { id: 'cat', since: T0 }, { spot: 9, exposure: 50, good: 45 }, snap, at(RULES.idleTenureDays)).action).toBe('keep');
    expect(judgeLane('word', { id: 'cat', since: T0 }, { spot: 9, exposure: 50, good: 45 }, snap, at(RULES.maxTenureDays)).action).toBe('swap');
  });
  it('swaps a graduated item', () => {
    const s = { ...snap, words: { cat: [40, 36] } };
    expect(judgeLane('word', { id: 'cat', since: T0 }, null, s, at(1)).action).toBe('swap');
  });
});

describe('decideSpotlight', () => {
  it('fills empty lanes and stamps since', () => {
    const r = decideSpotlight({ prev: null, snap, words, games: ARCADE, now: T0 });
    expect(r.next.word.id).toBeTruthy(); expect(r.next.word.since).toBe(T0);
    expect(r.next.game.since).toBe(T0); expect(r.changes).toHaveLength(2);
    expect(r.runOptimizer).toBe(false);
  });
  it('is deterministic and a no-op on keep', () => {
    const a = decideSpotlight({ prev: base(), snap, words, games: ARCADE, now: at(1) });
    const b = decideSpotlight({ prev: base(), snap, words, games: ARCADE, now: at(1) });
    expect(a.next).toEqual(b.next); expect(a.changes).toEqual([]);
    expect(a.next.word.since).toBe(T0);
  });
  it('swaps to a different item, records history, and respects the cooldown', () => {
    const prev = base();
    const r = decideSpotlight({ prev, snap, words, games: ARCADE, now: at(RULES.idleTenureDays), live: { word: { spot: 0, exposure: 0, good: 0 } } });
    expect(r.changes.find((c) => c.lane === 'word')).toMatchObject({ from: 'cat' });
    expect(r.next.word.id).not.toBe('cat');
    expect(r.next.word.since).toBe(at(RULES.idleTenureDays));
    expect(r.next.history.some((h) => h.lane === 'word' && h.from === 'cat')).toBe(true);
    // a second rotation must not come back to 'cat' within the cooldown
    const r2 = decideSpotlight({ prev: r.next, snap, words, games: ARCADE, now: at(2 * RULES.idleTenureDays), live: { word: { spot: 0, exposure: 0, good: 0 } } });
    expect(r2.next.word.id).not.toBe('cat');
    expect(r2.next.word.id).not.toBe(r.next.word.id);
  });
  it('asks for the optimizer when either lane has sufficient traffic', () => {
    const r = decideSpotlight({ prev: base(), snap, words, games: ARCADE, now: at(1), live: { game: { spot: RULES.sufficientSpot, exposure: 0, good: 0 } } });
    expect(r.runOptimizer).toBe(true);
  });
});

describe('11-07 spotlight review: the deployed pick drifted from the committed one', () => {
  it('the prebuild (fillOnly, no live counts) never swaps a committed pick, even past idleTenureDays', () => {
    const r = decideSpotlight({ prev: base(), snap, words, games: ARCADE, now: at(RULES.maxTenureDays + 1), fillOnly: true });
    expect(r.changes).toEqual([]);
    expect(r.next.word.id).toBe('cat');
    expect(r.next.game.id).toBe('category-conveyor');
  });
  it('fillOnly still fills an empty lane', () => {
    const r = decideSpotlight({ prev: { history: [] }, snap, words, games: ARCADE, now: T0, fillOnly: true });
    expect(r.next.word?.id).toBeTruthy();
    expect(r.next.game?.id).toBeTruthy();
  });
  it('keeps the current game rather than swapping to an already-graduated one', () => {
    const s2 = { ...snap, games: { 'word-zapper': { opens: 106, lvl: 1374, cmp: 24 }, 'spelling-forge': { opens: 115, lvl: 191, cmp: 5 } } };
    const prev = { word: { id: 'cat', since: T0 }, game: { id: 'spelling-forge', since: T0 },
      history: [{ lane: 'game', from: 'category-conveyor', to: 'spelling-forge', reason: 'max tenure 14d', at: T0 }] };
    const r = decideSpotlight({ prev, snap: s2, words, games: ARCADE, now: at(RULES.maxTenureDays), live: { game: { spot: 9, exposure: 12, good: 20 } } });
    expect(r.next.game.id).toBe('spelling-forge');
    expect(r.changes.filter((c) => c.lane === 'game')).toEqual([]);
  });
  it('with all six /games/ games eligible, the 11-08 swap picks the coldest one (owner 11-07)', () => {
    const s3 = { ...snap, games: { 'word-zapper': { opens: 106, lvl: 1374, cmp: 24 }, 'spelling-forge': { opens: 115, lvl: 191, cmp: 5 },
      'category-conveyor': { opens: 66, lvl: 243, cmp: 49 }, 'letter-twins': { opens: 6, lvl: 9, cmp: 1 },
      'read-it': { opens: 45, lvl: 23, cmp: 0 }, 'sound-pairs': { opens: 22, lvl: 29, cmp: 1 } } };
    const prev = { word: { id: 'cat', since: T0 }, game: { id: 'spelling-forge', since: T0 },
      history: [{ lane: 'game', from: 'category-conveyor', to: 'spelling-forge', reason: 'max tenure 14d', at: T0 }] };
    const six = SPOTLIGHT_GAMES.slice(0, 6);
    const r = decideSpotlight({ prev, snap: s3, words, games: six, now: at(RULES.maxTenureDays), live: { game: { spot: 9, exposure: 12, good: 20 } } });
    expect(r.next.game.id).toBe('letter-twins');
    // wave-1 games (11-07) start at 0 opens, so the next swap gives one of them its launch exposure
    const r2 = decideSpotlight({ prev, snap: s3, words, games: SPOTLIGHT_GAMES, now: at(RULES.maxTenureDays), live: { game: { spot: 9, exposure: 12, good: 20 } } });
    expect(SPOTLIGHT_GAMES.slice(6).map((g) => g.id)).toContain(r2.next.game.id);
  });
});

describe('diagnoseWord', () => {
  it('names the asset from parent taps first, then from the weakest probe', async () => {
    const { diagnoseWord } = await import('../utils/spotlightDecide');
    expect(diagnoseWord({ fb: { 'cat@aud': 2 }, modes: { 'cat@img': [10, 2] } }, 'cat').asset).toBe('audio');
    expect(diagnoseWord({ modes: { 'cat@img': [10, 3], 'cat@aud': [10, 9], 'cat@txt': [4, 0] } }, 'cat').asset).toBe('image'); // txt has <5 answers
    expect(diagnoseWord({ modes: { 'cat@img': [10, 8] } }, 'cat').asset).toBe('unknown');
    expect(diagnoseWord({}, 'cat').evidence).toMatch(/no per-probe data/);
  });
});
