/**
 * Unit tests for Vocabulary Class Battle (S4).
 * Battle code deliberately lives OUTSIDE src/ (api/_lib + public/battle),
 * so these tests import from those locations directly.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  ADJECTIVES as SERVER_ADJECTIVES,
  ANIMALS as SERVER_ANIMALS,
  isValidNickname,
  suggestNicknames as serverSuggest,
} from '../_lib/battleNames.js';
import {
  BATTLE_CATEGORY_IDS,
  isValidCategory,
  isValidDuration,
  pointsForAnswer as serverPoints,
  maxPlausibleScore,
} from '../_lib/battleRules.js';
import {
  generateRoomCode,
  normalizeRoomCode,
  getBattleStore,
  __resetBattleStoreForTests,
  ROOM_TTL_MS,
  CODE_LENGTH,
} from '../_lib/battleStore.js';
import {
  ADJECTIVES as CLIENT_ADJECTIVES,
  ANIMALS as CLIENT_ANIMALS,
  BATTLE_CATEGORIES,
  BATTLE_DURATIONS,
  makeQuestion,
  wordPool,
  normalizeCode as clientNormalizeCode,
  pointsForAnswer as clientPoints,
  suggestNicknames as clientSuggest,
} from '../../public/battle/battle-core.js';
import { BATTLE_WORDS } from '../../public/battle/battle-words.js';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

/* ------------------------------------------------------------------ */
describe('nickname validation (COPPA-safe: picked, never typed)', () => {
  it('accepts every generated adjective+animal combination', () => {
    for (const adj of SERVER_ADJECTIVES) {
      for (const animal of SERVER_ANIMALS) {
        expect(isValidNickname(`${adj} ${animal}`)).toBe(true);
      }
    }
  });

  it('rejects free text and near-misses', () => {
    expect(isValidNickname('Oded')).toBe(false);
    expect(isValidNickname('Brave')).toBe(false);
    expect(isValidNickname('Brave  Otter')).toBe(false); // double space
    expect(isValidNickname(' Brave Otter')).toBe(false);
    expect(isValidNickname('Brave Otter!')).toBe(false);
    expect(isValidNickname('brave otter')).toBe(false); // case matters
    expect(isValidNickname('Otter Brave')).toBe(false); // order matters
    expect(isValidNickname('Brave Otter Extra')).toBe(false);
    expect(isValidNickname('<script>alert(1)</script>')).toBe(false);
    expect(isValidNickname('')).toBe(false);
    expect(isValidNickname(null)).toBe(false);
    expect(isValidNickname(42)).toBe(false);
  });

  it('suggestions are unique, valid, and respect the exclude list', () => {
    for (const suggest of [serverSuggest, clientSuggest]) {
      const exclude = ['Brave Otter', 'Clever Fox'];
      const names = suggest(8, exclude);
      expect(names).toHaveLength(8);
      expect(new Set(names).size).toBe(8);
      for (const n of names) {
        expect(isValidNickname(n)).toBe(true);
        expect(exclude).not.toContain(n);
      }
    }
  });

  it('client copy of the name lists matches the server (drift guard)', () => {
    expect(CLIENT_ADJECTIVES).toEqual(SERVER_ADJECTIVES);
    expect(CLIENT_ANIMALS).toEqual(SERVER_ANIMALS);
  });
});

/* ------------------------------------------------------------------ */
describe('room codes', () => {
  it('generates 5-letter vowel-free codes', () => {
    for (let i = 0; i < 200; i++) {
      const code = generateRoomCode();
      expect(code).toHaveLength(CODE_LENGTH);
      expect(code).toMatch(/^[BCDFGHJKMNPQRSTVWXYZ]{5}$/);
    }
  });

  it('normalizes case/whitespace and rejects junk (server + client agree)', () => {
    for (const normalize of [normalizeRoomCode, clientNormalizeCode]) {
      expect(normalize(' bcdfg ')).toBe('BCDFG');
      expect(normalize('BCDFG')).toBe('BCDFG');
      expect(normalize('ABCDE')).toBeNull(); // vowel
      expect(normalize('BCDF')).toBeNull(); // too short
      expect(normalize('BCDFGH')).toBeNull();
      expect(normalize('BCD1G')).toBeNull();
      expect(normalize(12345)).toBeNull();
      expect(normalize(null)).toBeNull();
    }
  });
});

/* ------------------------------------------------------------------ */
describe('battle rules', () => {
  it('validates categories against the shared list', () => {
    expect(isValidCategory('animals')).toBe(true);
    expect(isValidCategory('mix')).toBe(true);
    expect(isValidCategory('multiplication')).toBe(false);
    expect(isValidCategory('')).toBe(false);
  });

  it('server category ids match battle-words categories + mix (drift guard)', () => {
    const wordCats = new Set(Object.keys(BATTLE_WORDS));
    const uiCats = new Set(BATTLE_CATEGORIES.map((c) => c.id));
    expect(new Set(BATTLE_CATEGORY_IDS)).toEqual(new Set([...wordCats, 'mix']));
    expect(uiCats).toEqual(new Set(BATTLE_CATEGORY_IDS));
  });

  it('validates durations and the UI durations pass', () => {
    for (const d of BATTLE_DURATIONS) expect(isValidDuration(d.sec)).toBe(true);
    expect(isValidDuration(9)).toBe(false);
    expect(isValidDuration(601)).toBe(false);
    expect(isValidDuration(120.5)).toBe(false);
    expect(isValidDuration('120')).toBe(false);
  });

  it('scoring: base 10, +2/streak, capped at 20; client matches server', () => {
    expect(serverPoints(0)).toBe(10);
    expect(serverPoints(1)).toBe(12);
    expect(serverPoints(5)).toBe(20);
    expect(serverPoints(50)).toBe(20);
    expect(serverPoints(-3)).toBe(10);
    for (let s = 0; s <= 12; s++) expect(clientPoints(s)).toBe(serverPoints(s));
  });

  it('plausibility cap scales with duration', () => {
    expect(maxPlausibleScore(120)).toBe(2400);
    expect(maxPlausibleScore(300)).toBe(6000);
  });
});

/* ------------------------------------------------------------------ */
describe('question generation (client-side)', () => {
  it('produces 4 distinct photo choices with exactly one correct', () => {
    for (const cat of [...Object.keys(BATTLE_WORDS), 'mix']) {
      for (let i = 0; i < 25; i++) {
        const q = makeQuestion(cat);
        expect(q.word).toBeTruthy();
        expect(q.choices).toHaveLength(4);
        expect(new Set(q.choices.map((c) => c.id)).size).toBe(4);
        expect(new Set(q.choices.map((c) => c.img)).size).toBe(4);
        expect(q.choices.filter((c) => c.id === q.id)).toHaveLength(1);
        const pool = wordPool(cat);
        for (const c of q.choices) {
          expect(pool.some((w) => w.id === c.id && w.img === c.img)).toBe(true);
        }
      }
    }
  });

  it('avoids the recent-ids window', () => {
    const pool = wordPool('toys');
    const recent = pool.slice(0, 10).map((w) => w.id);
    for (let i = 0; i < 50; i++) {
      const q = makeQuestion('toys', recent);
      expect(recent).not.toContain(q.id);
    }
  });

  it('still works when the no-repeat window exceeds the pool', () => {
    const all = wordPool('toys').map((w) => w.id);
    const q = makeQuestion('toys', all);
    expect(all).toContain(q.id); // falls back rather than hanging
  });

  it('every battle word image exists in public/images', () => {
    for (const words of Object.values(BATTLE_WORDS)) {
      expect(words.length).toBeGreaterThanOrEqual(15);
      expect(words.length).toBeLessThanOrEqual(60);
      for (const w of words) {
        expect(w.img).toMatch(/^\/images\/[\w-]+\.webp$/);
        expect(fs.existsSync(path.join(repoRoot, 'public', w.img))).toBe(true);
      }
    }
  });
});

/* ------------------------------------------------------------------ */
describe('memory battle store (dev fallback)', () => {
  beforeEach(() => {
    __resetBattleStoreForTests();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-19T10:00:00Z'));
  });
  afterEach(() => {
    vi.useRealTimers();
    __resetBattleStoreForTests();
  });

  it('full lifecycle: create → join → start → score → finished', async () => {
    const store = getBattleStore();
    const { code, hostKey } = await store.createRoom({ category: 'animals', durationSec: 120 });
    expect(code).toMatch(/^[BCDFGHJKMNPQRSTVWXYZ]{5}$/);
    expect(hostKey).toBeTruthy();

    const join = await store.joinRoom(code, 'Brave Otter');
    expect(join.playerId).toBeTruthy();
    const join2 = await store.joinRoom(code, 'Clever Fox');

    // free-text and duplicate nicknames are rejected server-side
    expect(await store.joinRoom(code, 'Real Name')).toEqual({ error: 'invalid_nickname' });
    expect(await store.joinRoom(code, 'Brave Otter')).toEqual({ error: 'nickname_taken' });

    // host-key gating
    expect(await store.startRoom(code, 'wrong-key')).toEqual({ error: 'forbidden' });
    expect(await store.startRoom(code, hostKey)).toEqual({ ok: true });
    expect(await store.startRoom(code, hostKey)).toEqual({ error: 'already_started' });

    await store.updateScore(code, join.playerId, join.playerKey, {
      score: 30, streak: 3, answered: 3, correct: 3,
    });
    await store.updateScore(code, join2.playerId, join2.playerKey, {
      score: 10, streak: 1, answered: 2, correct: 1,
    });

    let state = await store.getRoomState(code);
    expect(state.status).toBe('running');
    expect(state.endsAt).toBe(state.startedAt + 120000);
    expect(state.players.map((p) => p.nickname)).toEqual(['Brave Otter', 'Clever Fox']); // sorted by score
    expect(state.players[0].score).toBe(30);

    // monotonic: a stale lower score can never lower the stored one
    await store.updateScore(code, join.playerId, join.playerKey, {
      score: 5, streak: 0, answered: 1, correct: 1,
    });
    // clamped: an implausible score is capped at durationSec * 20
    await store.updateScore(code, join2.playerId, join2.playerKey, {
      score: 999999, streak: 0, answered: 4, correct: 4,
    });
    state = await store.getRoomState(code);
    expect(state.players.find((p) => p.id === join.playerId).score).toBe(30);
    expect(state.players.find((p) => p.id === join2.playerId).score).toBe(2400);

    // wrong player key is forbidden
    expect(
      await store.updateScore(code, join.playerId, 'bad-key', {
        score: 40, streak: 0, answered: 4, correct: 4,
      })
    ).toEqual({ error: 'forbidden' });

    // server clock flips running → finished
    vi.advanceTimersByTime(121000);
    state = await store.getRoomState(code);
    expect(state.status).toBe('finished');
    expect(await store.joinRoom(code, 'Swift Panda')).toEqual({ error: 'room_finished' });
  });

  it('rooms expire after the 30-minute TTL (lazy cleanup)', async () => {
    const store = getBattleStore();
    const { code } = await store.createRoom({ category: 'mix', durationSec: 120 });
    expect(await store.getRoomState(code)).not.toBeNull();
    vi.advanceTimersByTime(ROOM_TTL_MS + 1000);
    expect(await store.getRoomState(code)).toBeNull();
    expect(await store.joinRoom(code, 'Brave Otter')).toEqual({ error: 'room_not_found' });
  });

  it('unknown rooms read as not found', async () => {
    const store = getBattleStore();
    expect(await store.getRoomState('BCDFG')).toBeNull();
    expect(await store.startRoom('BCDFG', 'k')).toEqual({ error: 'room_not_found' });
  });
});
