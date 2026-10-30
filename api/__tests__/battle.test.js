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
import { WORDS, collides } from '../../src/data/words.js';
import { buildBattleWords } from '../../scripts/gen-battle-words.mjs';

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

  it('textbook-unit topics: valid on the server, photo-only pools from the unit, never a lookalike as a wrong photo', async () => {
    const { BATTLE_UNITS } = await import('../../public/battle/battle-words.js');
    const { BATTLE_UNIT_CATEGORIES, wordPool, makeQuestion } = await import('../../public/battle/battle-core.js');
    const ids = Object.keys(BATTLE_UNITS);
    expect(ids.length).toBeGreaterThan(0);
    expect(BATTLE_UNIT_CATEGORIES.map((c) => c.id)).toEqual(ids);
    for (const id of ids) {
      expect(isValidCategory(id)).toBe(true);
      const pool = wordPool(id);
      expect(pool.length).toBe(BATTLE_UNITS[id].ids.length);
      expect(pool.length).toBeGreaterThanOrEqual(12);
      for (let i = 0; i < 20; i++) {
        const q = makeQuestion(id);
        expect(q.choices).toHaveLength(4);
        expect(q.choices.every((c) => BATTLE_UNITS[id].ids.includes(c.id))).toBe(true);
      }
    }
    expect(isValidCategory('u-jet-2-3')).toBe(true);
    expect(isValidCategory('u-<script>')).toBe(false);
    expect(isValidCategory('unit')).toBe(false);
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

  it('battle-words.js is fresh (node scripts/gen-battle-words.mjs)', () => {
    const file = fs.readFileSync(path.join(repoRoot, 'public', 'battle', 'battle-words.js'), 'utf-8');
    expect(file === buildBattleWords()).toBe(true);
  });

  it('never offers a second right answer as a distractor (collides())', () => {
    const byId = new Map(WORDS.map((w) => [w.id, w]));
    const chair = wordPool('home').find((w) => w.id === 'chair');
    expect(chair).toBeTruthy();
    for (const cat of [...Object.keys(BATTLE_WORDS), 'mix']) {
      for (let i = 0; i < 60; i++) {
        const q = makeQuestion(cat);
        const target = byId.get(q.id);
        for (const c of q.choices) {
          if (c.id !== q.id) expect(collides(target, byId.get(c.id)), `${q.id} vs ${c.id}`).toBe(false);
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
      expect(words.length).toBeLessThanOrEqual(90);
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

/* ---- RL13: team battle + class target (kit PATTERNS §8c) ---- */
import { teamOf, teamTotals, teamWinner } from '../_lib/battleTeams.js';
import { defaultTarget, isValidMode, TARGET_K } from '../_lib/battleRules.js';
import { defaultTarget as clientDefaultTarget, TEAM_NAMES } from '../../public/battle/battle-core.js';
import liveHandler from '../live.js';

describe('team maths', () => {
  const P = (id, joinedAt, correct = 0) => ({ id, joinedAt, correct });

  it('teamOf: alternating by join order, ties broken by id, stable under reordering', () => {
    const ps = [P('c', 30), P('a', 10), P('b', 20), P('e', 20), P('d', 40)];
    const tm = teamOf(ps);
    expect(['a', 'b', 'e', 'c', 'd'].map((id) => tm.get(id))).toEqual([0, 1, 0, 1, 0]);
    expect(teamOf(ps.slice().reverse())).toEqual(tm);
  });

  it('teamTotals: totals + average per member (odd team sizes); winner on the average', () => {
    // team 0: a(4) c(2) e(0) → 6 / 3 = 2 · team 1: b(3) d(3) → 6 / 2 = 3
    const ps = [P('a', 1, 4), P('b', 2, 3), P('c', 3, 2), P('d', 4, 3), P('e', 5, 0)];
    const t = teamTotals(ps);
    expect(t).toEqual([{ team: 0, members: 3, total: 6, avg: 2 }, { team: 1, members: 2, total: 6, avg: 3 }]);
    expect(teamWinner(t)).toBe(1);
    expect(teamWinner(teamTotals([P('a', 1, 2), P('b', 2, 2)]))).toBeNull(); // tie
    expect(teamWinner(teamTotals([P('a', 1, 5)]))).toBeNull(); // nobody on team 1
  });

  it('defaultTarget = players × minutes × k, same on server and client', () => {
    expect(TARGET_K).toBe(6);
    expect(defaultTarget(10, 180)).toBe(180);
    expect(defaultTarget(0, 120)).toBe(12); // never below one player
    for (const [n, d] of [[1, 120], [7, 180], [25, 300]]) expect(clientDefaultTarget(n, d)).toBe(defaultTarget(n, d));
    expect(isValidMode('team')).toBe(true);
    expect(isValidMode('ffa')).toBe(false);
    expect(TEAM_NAMES.map((t) => t.color)).toEqual(['#3b82f6', '#f97316']);
  });
});

describe('team / class rooms (memory store)', () => {
  // join times 1 ms apart, so join order (not the random player id) sets the teams
  beforeEach(() => { __resetBattleStoreForTests(); vi.useFakeTimers(); vi.setSystemTime(new Date('2026-10-30T10:00:00Z')); });
  afterEach(() => { vi.useRealTimers(); __resetBattleStoreForTests(); });
  const names = ['Brave Otter', 'Clever Fox', 'Swift Panda', 'Mighty Tiger', 'Sunny Eagle'];

  async function room(mode, durationSec = 120) {
    const store = getBattleStore();
    const { code, hostKey } = await store.createRoom({ category: 'animals', durationSec, mode });
    const kids = [];
    for (const n of names) { vi.advanceTimersByTime(1); kids.push(await store.joinRoom(code, n)); }
    return { store, code, hostKey, kids };
  }

  it('team: the board carries no per-player score; teams + totals instead', async () => {
    const { store, code, hostKey, kids } = await room('team');
    await store.startRoom(code, hostKey);
    await store.updateScore(code, kids[0].playerId, kids[0].playerKey, { score: 40, streak: 2, answered: 4, correct: 4 });
    await store.updateScore(code, kids[1].playerId, kids[1].playerKey, { score: 30, streak: 1, answered: 3, correct: 3 });
    const st = await store.getRoomState(code);
    expect(st.mode).toBe('team');
    for (const p of st.players) expect(Object.keys(p).sort()).toEqual(['id', 'nickname', 'team']);
    expect(st.players.map((p) => p.team)).toEqual([0, 1, 0, 1, 0]);
    expect(st.teams).toEqual([{ team: 0, members: 3, total: 4, avg: 1.3 }, { team: 1, members: 2, total: 3, avg: 1.5 }]);
    expect(st.winner).toBe(1);
    expect(st.classTotal).toBe(7);
    expect(JSON.stringify(st)).not.toMatch(/"score"|"streak"|"correct"/);
  });

  it('class: target fixed at start (default or the teacher’s), unchanged by a late join', async () => {
    const a = await room('class', 120);
    await a.store.startRoom(a.code, a.hostKey);
    expect((await a.store.getRoomState(a.code)).target).toBe(defaultTarget(5, 120)); // 60
    await a.store.joinRoom(a.code, 'Cosmic Wolf');
    expect((await a.store.getRoomState(a.code)).target).toBe(60);

    __resetBattleStoreForTests();
    const b = await room('class', 120);
    await b.store.startRoom(b.code, b.hostKey, 75);
    expect((await b.store.getRoomState(b.code)).target).toBe(75);

    __resetBattleStoreForTests();
    const c = await room('class', 120);
    await c.store.startRoom(c.code, c.hostKey, 999999); // out of range → default
    expect((await c.store.getRoomState(c.code)).target).toBe(60);
  });

  it('solo rooms are unchanged (scores on the board), and the API rejects an unknown mode', async () => {
    const { store, code } = await room('solo');
    const st = await store.getRoomState(code);
    expect(st.mode).toBe('solo');
    expect(st.players[0]).toHaveProperty('score');
    const res = { code: 0, body: null, setHeader() {}, status(c) { this.code = c; return this; }, json(b) { this.body = b; return this; } };
    await liveHandler({ method: 'POST', body: { action: 'create', category: 'animals', durationSec: 120, mode: 'ffa' } }, res);
    expect(res.code).toBe(400);
    await liveHandler({ method: 'POST', body: { action: 'create', category: 'animals', durationSec: 120 } }, res);
    expect(res.code).toBe(200);
  });
});
