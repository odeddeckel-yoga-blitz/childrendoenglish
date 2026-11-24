/**
 * Class Battle hardening (2026-11-20): score window + rate caps, host lock and
 * remove, the create cap, start-time expiry, CSPRNG room codes.
 * Every store test runs against BOTH backends: the in-memory dev store and the
 * production Postgres store over a fake `neon()` that understands exactly the
 * statements battleStore.js sends (an unknown statement throws, so a query
 * change without a matching fake fails here instead of passing silently).
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

/* ---------------- fake Neon (Postgres path) ---------------- */
const db = { rooms: new Map(), players: new Map(), creates: new Map() };
const norm = (strings) => strings.join('?').replace(/\s+/g, ' ').trim();
function cascade(code) {
  db.rooms.delete(code);
  for (const [id, p] of db.players) if (p.room_code === code) db.players.delete(id);
}
function run(q, v) {
  if (/^(CREATE TABLE|ALTER TABLE|CREATE INDEX)/.test(q)) return [];
  // per-client create log (audit A091)
  if (q === 'DELETE FROM cde_battle_creates WHERE created_at <= ?') {
    for (const [id, c] of db.creates) if (c.created_at <= v[0]) db.creates.delete(id);
    return [];
  }
  if (q === 'INSERT INTO cde_battle_creates (id, bucket, created_at) VALUES (?, ?, ?)') {
    db.creates.set(v[0], { id: v[0], bucket: v[1], created_at: v[2] });
    return [];
  }
  if (q === 'SELECT COUNT(*)::int AS count FROM cde_battle_creates WHERE bucket = ? AND created_at > ?') {
    return [{ count: [...db.creates.values()].filter((c) => c.bucket === v[0] && c.created_at > v[1]).length }];
  }
  if (q === 'DELETE FROM cde_battle_creates WHERE id = ?') { db.creates.delete(v[0]); return []; }
  if (q === 'DELETE FROM cde_battle_rooms WHERE expires_at <= ?') {
    for (const [code, r] of db.rooms) if (r.expires_at <= v[0]) cascade(code);
    return [];
  }
  if (q === 'SELECT COUNT(*)::int AS count FROM cde_battle_rooms') return [{ count: db.rooms.size }];
  if (q.startsWith('INSERT INTO cde_battle_rooms')) {
    const [code, category, duration_sec, mode, host_key, created_at, expires_at] = v;
    if (db.rooms.has(code)) throw new Error('duplicate key');
    db.rooms.set(code, { code, category, duration_sec, mode, status: 'lobby', host_key, created_at, expires_at, started_at: null, target: null, locked: false });
    return [];
  }
  if (q === 'SELECT * FROM cde_battle_rooms WHERE code = ?') return db.rooms.has(v[0]) ? [{ ...db.rooms.get(v[0]) }] : [];
  if (q === 'DELETE FROM cde_battle_rooms WHERE code = ?') { cascade(v[0]); return []; }
  if (q.startsWith('SELECT id, nickname, score, streak, answered, correct, joined_at, removed FROM cde_battle_players WHERE room_code = ?')) {
    return [...db.players.values()].filter((p) => p.room_code === v[0]).map((p) => ({ ...p }));
  }
  if (q === 'SELECT COUNT(*)::int AS count FROM cde_battle_players WHERE room_code = ? AND removed = false') {
    return [{ count: [...db.players.values()].filter((p) => p.room_code === v[0] && !p.removed).length }];
  }
  if (q === "UPDATE cde_battle_rooms SET status = 'running', started_at = ?, target = ?, expires_at = ? WHERE code = ? AND status = 'lobby'") {
    const r = db.rooms.get(v[3]);
    if (r && r.status === 'lobby') Object.assign(r, { status: 'running', started_at: v[0], target: v[1], expires_at: v[2] });
    return [];
  }
  if (q === 'UPDATE cde_battle_rooms SET locked = ? WHERE code = ?') { db.rooms.get(v[1]).locked = v[0]; return []; }
  if (q.startsWith('INSERT INTO cde_battle_players')) {
    const [id, room_code, nickname, player_key, joined_at] = v;
    if ([...db.players.values()].some((p) => p.room_code === room_code && p.nickname === nickname)) throw new Error('unique');
    db.players.set(id, { id, room_code, nickname, player_key, joined_at, score: 0, streak: 0, answered: 0, correct: 0, removed: false });
    return [];
  }
  if (q === 'UPDATE cde_battle_players SET removed = true, score = 0, streak = 0, answered = 0, correct = 0 WHERE id = ? AND room_code = ? AND removed = false RETURNING id') {
    const p = db.players.get(v[0]);
    if (!p || p.room_code !== v[1] || p.removed) return [];
    Object.assign(p, { removed: true, score: 0, streak: 0, answered: 0, correct: 0 });
    return [{ id: p.id }];
  }
  if (q === 'UPDATE cde_battle_players SET score = GREATEST(score, ?), streak = ?, answered = GREATEST(answered, ?), correct = GREATEST(correct, ?) WHERE id = ? AND room_code = ? AND player_key = ? AND removed = false RETURNING id') {
    const [score, streak, answered, correct, id, code, key] = v;
    const p = db.players.get(id);
    if (!p || p.room_code !== code || p.player_key !== key || p.removed) return [];
    Object.assign(p, { score: Math.max(p.score, score), streak, answered: Math.max(p.answered, answered), correct: Math.max(p.correct, correct) });
    return [{ id }];
  }
  throw new Error(`fake neon: unhandled statement: ${q}`);
}
vi.mock('@neondatabase/serverless', () => ({
  neon: () => (strings, ...vals) => Promise.resolve().then(() => run(norm(strings), vals)),
}));

import {
  getBattleStore, __resetBattleStoreForTests, generateRoomCode, expiryAtStart,
  ROOM_TTL_MS, POST_GAME_TTL_MS, MAX_ACTIVE_ROOMS, CREATE_WINDOW_MS, MAX_CREATES_PER_CLIENT,
} from '../_lib/battleStore.js';
import { clientBucket, clientIp, normalizeClientIp } from '../_lib/clientBucket.js';
import { clampScoreUpdate, maxPlausibleCount, SCORE_GRACE_MS, COUNT_SLACK, MAX_DURATION_SEC } from '../_lib/battleRules.js';
import liveHandler from '../live.js';

const DB_ENV = ['CDE_DATABASE_URL', 'DATABASE_URL', 'POSTGRES_URL'];
const saved = Object.fromEntries(DB_ENV.map((k) => [k, process.env[k]]));
function useBackend(kind) {
  for (const k of DB_ENV) delete process.env[k];
  if (kind === 'pg') process.env.CDE_DATABASE_URL = 'postgres://fake/neon';
  db.rooms.clear();
  db.players.clear();
  db.creates.clear();
  __resetBattleStoreForTests();
}
function restoreEnv() {
  for (const k of DB_ENV) { if (saved[k] === undefined) delete process.env[k]; else process.env[k] = saved[k]; }
  __resetBattleStoreForTests();
}

const S = (score, correct, answered = correct, streak = 0) => ({ score, streak, answered, correct });
const NAMES = ['Brave Otter', 'Clever Fox', 'Swift Panda', 'Mighty Tiger', 'Sunny Eagle'];

/* ---------------- pure rules ---------------- */
describe('score clamp rules', () => {
  const room = { durationSec: 120, startedAt: 1_000_000 };
  it('refuses the lobby and after the end + grace; accepts inside the grace', () => {
    expect(clampScoreUpdate(S(10, 1), { durationSec: 120, startedAt: null }, 5)).toBeNull();
    expect(clampScoreUpdate(S(10, 1), room, room.startedAt - 1)).toBeNull();
    const end = room.startedAt + 120_000;
    expect(clampScoreUpdate(S(10, 1), room, end + SCORE_GRACE_MS - 1)).not.toBeNull();
    expect(clampScoreUpdate(S(10, 1), room, end + SCORE_GRACE_MS)).toBeNull();
  });
  it('counts ≤ elapsed seconds + slack and ≤ durationSec; correct ≤ answered; score ≤ 20/correct; streak ≤ correct', () => {
    expect(maxPlausibleCount(0, 120)).toBe(COUNT_SLACK);
    expect(maxPlausibleCount(30_900, 120)).toBe(30 + COUNT_SLACK);
    expect(maxPlausibleCount(10 * 60_000, 120)).toBe(120);
    const v = clampScoreUpdate(S(99999, 10000, 10000, 10000), room, room.startedAt + 10_000);
    expect(v).toEqual({ answered: 15, correct: 15, score: 300, streak: 15 });
    expect(clampScoreUpdate(S(50, 9, 4, 2), room, room.startedAt + 60_000)).toEqual({ answered: 4, correct: 4, score: 50, streak: 2 });
    // elapsed stops at the end: a post in the grace gets the full-battle cap, not more
    expect(clampScoreUpdate(S(99999, 999), room, room.startedAt + 120_000 + 4000).correct).toBe(120);
  });
});

describe('room codes', () => {
  it('come from the CSPRNG, never Math.random; same alphabet + length', () => {
    const spy = vi.spyOn(Math, 'random');
    const seen = new Set();
    for (let i = 0; i < 500; i++) {
      const c = generateRoomCode();
      expect(c).toMatch(/^[BCDFGHJKMNPQRSTVWXYZ]{5}$/);
      seen.add(c);
    }
    expect(spy).not.toHaveBeenCalled();
    expect(seen.size).toBeGreaterThan(490);
    spy.mockRestore();
  });
});

/* ---------------- both backends ---------------- */
describe.each(['memory', 'pg'])('battle store hardening (%s)', (kind) => {
  beforeEach(() => {
    useBackend(kind);
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-20T09:00:00Z'));
  });
  afterEach(() => { vi.useRealTimers(); restoreEnv(); });

  async function room(mode = 'solo', durationSec = 120, n = 2) {
    const store = getBattleStore();
    const { code, hostKey } = await store.createRoom({ category: 'animals', durationSec, mode });
    const kids = [];
    for (const name of NAMES.slice(0, n)) { vi.advanceTimersByTime(1); kids.push(await store.joinRoom(code, name)); }
    return { store, code, hostKey, kids };
  }
  const score = (r, i, s) => r.store.updateScore(r.code, r.kids[i].playerId, r.kids[i].playerKey, s);
  const player = async (r, i) => (await r.store.getRoomState(r.code)).players.find((p) => p.id === r.kids[i].playerId);

  it('a score in the lobby is refused and stores nothing', async () => {
    const r = await room();
    expect(await score(r, 0, S(40, 4))).toEqual({ error: 'not_running' });
    expect((await player(r, 0)).score).toBe(0);
  });

  it('a score after the end is refused (a last in-flight post inside the grace still lands)', async () => {
    const r = await room('solo', 60);
    await r.store.startRoom(r.code, r.hostKey);
    vi.advanceTimersByTime(60_000 + 2000); // finished, inside the grace
    expect(await score(r, 0, S(100, 10))).toEqual({ ok: true });
    vi.advanceTimersByTime(SCORE_GRACE_MS);
    expect(await score(r, 0, S(1200, 60))).toEqual({ error: 'not_running' });
    const p = await player(r, 0);
    expect([p.score, p.correct]).toEqual([100, 10]);
  });

  it('caps a devtools score: correct ≤ elapsed + slack, ≤ durationSec, score ≤ 20 per correct', async () => {
    const r = await room('solo', 120);
    await r.store.startRoom(r.code, r.hostKey);
    vi.advanceTimersByTime(10_000);
    await score(r, 0, S(100000, 10000, 10000, 10000));
    let p = await player(r, 0);
    expect([p.correct, p.answered, p.score, p.streak]).toEqual([15, 15, 300, 15]);
    vi.advanceTimersByTime(200_000); // well past the end + grace
    expect(await score(r, 0, S(100000, 10000))).toEqual({ error: 'not_running' });
    // a fresh room: one post at the very end is capped at durationSec
    const r2 = await room('solo', 120);
    await r2.store.startRoom(r2.code, r2.hostKey);
    vi.advanceTimersByTime(119_000);
    await score(r2, 0, S(100000, 10000));
    p = await player(r2, 0);
    expect([p.correct, p.score]).toEqual([120, 2400]);
  });

  it('team mode: one kid claiming 10000 words cannot outvote a team', async () => {
    const r = await room('team', 120, 4); // teams: kids 0,2 vs 1,3
    await r.store.startRoom(r.code, r.hostKey);
    vi.advanceTimersByTime(30_000);
    await score(r, 0, S(200000, 10000));
    await score(r, 1, S(400, 20));
    await score(r, 3, S(400, 20));
    const st = await r.store.getRoomState(r.code);
    expect(st.teams.map((t) => t.total)).toEqual([35, 40]);
    expect(st.winner).toBe(1);
  });

  it('lock: host key required; blocks new joins (state says locked); unlock lets them in again', async () => {
    const r = await room('solo', 120, 1);
    expect(await r.store.setLocked(r.code, 'not-the-key', true)).toEqual({ error: 'forbidden' });
    expect(await r.store.setLocked(r.code, r.hostKey, true)).toEqual({ ok: true, locked: true });
    expect((await r.store.getRoomState(r.code)).locked).toBe(true);
    expect(await r.store.joinRoom(r.code, 'Clever Fox')).toEqual({ error: 'room_locked' });
    await r.store.startRoom(r.code, r.hostKey);
    expect(await r.store.joinRoom(r.code, 'Clever Fox')).toEqual({ error: 'room_locked' }); // late join too
    await r.store.setLocked(r.code, r.hostKey, false);
    expect((await r.store.joinRoom(r.code, 'Clever Fox')).playerId).toBeTruthy(); // late join still allowed when open
  });

  it('remove: host key required; gone from the board + totals; their key can no longer score; teams stay put', async () => {
    const r = await room('team', 120, 4);
    await r.store.startRoom(r.code, r.hostKey);
    vi.advanceTimersByTime(30_000);
    for (let i = 0; i < 4; i++) await score(r, i, S(100, 5 + i));
    const before = await r.store.getRoomState(r.code);
    const teamOfKid = (st, i) => st.players.find((p) => p.id === r.kids[i].playerId).team;
    expect(await r.store.removePlayer(r.code, 'nope', r.kids[0].playerId)).toEqual({ error: 'forbidden' });
    expect(await r.store.removePlayer(r.code, r.hostKey, r.kids[0].playerId)).toEqual({ ok: true });
    expect(await r.store.removePlayer(r.code, r.hostKey, r.kids[0].playerId)).toEqual({ error: 'player_not_found' });
    const after = await r.store.getRoomState(r.code);
    expect(after.players.map((p) => p.id)).not.toContain(r.kids[0].playerId);
    expect(JSON.stringify(after)).not.toContain(NAMES[0]);
    expect(after.classTotal).toBe(before.classTotal - 5);
    expect(after.teams[0]).toMatchObject({ members: 1, total: 7 });
    for (const i of [1, 2, 3]) expect(teamOfKid(after, i)).toBe(teamOfKid(before, i));
    expect(await score(r, 0, S(400, 20))).toEqual({ error: 'forbidden' });
    expect((await r.store.getRoomState(r.code)).classTotal).toBe(after.classTotal);
    // the nickname stays taken (the same kid can't slip back under it)
    expect(await r.store.joinRoom(r.code, NAMES[0])).toEqual({ error: 'nickname_taken' });
  });

  it('class target at start counts only players still in', async () => {
    const r = await room('class', 120, 3);
    await r.store.removePlayer(r.code, r.hostKey, r.kids[0].playerId);
    await r.store.startRoom(r.code, r.hostKey);
    expect((await r.store.getRoomState(r.code)).target).toBe(2 * 2 * 6);
  });

  it(`create is refused past ${MAX_ACTIVE_ROOMS} unexpired rooms, and allowed again once they expire`, async () => {
    const store = getBattleStore();
    for (let i = 0; i < MAX_ACTIVE_ROOMS; i++) {
      expect((await store.createRoom({ category: 'mix', durationSec: 120 })).code).toBeTruthy();
    }
    expect(await store.createRoom({ category: 'mix', durationSec: 120 })).toEqual({ error: 'too_many_rooms' });
    vi.advanceTimersByTime(ROOM_TTL_MS);
    expect((await store.createRoom({ category: 'mix', durationSec: 120 })).code).toBeTruthy();
  });

  it(`per-client create limit (A091): ${MAX_CREATES_PER_CLIENT} per window, other clients unaffected, sliding release`, async () => {
    const store = getBattleStore();
    const mk = (creator) => store.createRoom({ category: 'mix', durationSec: 120, creator });
    for (let i = 0; i < MAX_CREATES_PER_CLIENT; i++) {
      expect((await mk('aaaa')).code).toBeTruthy();
      vi.advanceTimersByTime(1000);
    }
    expect(await mk('aaaa')).toEqual({ error: 'too_many_creates' });
    expect(await mk('aaaa')).toEqual({ error: 'too_many_creates' }); // a refused retry...
    expect((await mk('bbbb')).code).toBeTruthy(); // another school is fine
    expect((await mk(null)).code).toBeTruthy(); // unknown client: no per-client limit
    // ...does not extend the wait: the first create ages out at CREATE_WINDOW_MS after it
    vi.advanceTimersByTime(CREATE_WINDOW_MS - MAX_CREATES_PER_CLIENT * 1000);
    expect((await mk('aaaa')).code).toBeTruthy();
    expect(await mk('aaaa')).toEqual({ error: 'too_many_creates' });
    if (kind === 'pg') {
      // the log holds no IP and no room code, and refused attempts left no row
      for (const c of db.creates.values()) expect(Object.keys(c).sort()).toEqual(['bucket', 'created_at', 'id']);
      expect([...db.creates.values()].filter((c) => c.bucket === 'aaaa').length).toBe(MAX_CREATES_PER_CLIENT);
    }
  });

  it('one client cannot fill the global room cap (A091)', async () => {
    const store = getBattleStore();
    let made = 0;
    for (let i = 0; i < MAX_ACTIVE_ROOMS; i++) {
      const r = await store.createRoom({ category: 'mix', durationSec: 120, creator: 'attacker' });
      if (r.code) made++;
      else expect(r).toEqual({ error: 'too_many_creates' });
      vi.advanceTimersByTime(5000); // ~25 min of steady spam, inside the room TTL
    }
    expect(made).toBeLessThanOrEqual(MAX_CREATES_PER_CLIENT * Math.ceil(ROOM_TTL_MS / CREATE_WINDOW_MS));
    expect((await store.createRoom({ category: 'mix', durationSec: 120, creator: 'teacher' })).code).toBeTruthy();
  });

  it('a room refused by the global cap does not count against the client', async () => {
    const store = getBattleStore();
    for (let i = 0; i < MAX_ACTIVE_ROOMS; i++) await store.createRoom({ category: 'mix', durationSec: 120 });
    vi.advanceTimersByTime(ROOM_TTL_MS - 1000); // the cap rooms are still alive
    for (let i = 0; i < MAX_CREATES_PER_CLIENT + 2; i++) {
      expect(await store.createRoom({ category: 'mix', durationSec: 120, creator: 'cccc' })).toEqual({ error: 'too_many_rooms' });
    }
    vi.advanceTimersByTime(1000); // the cap rooms expire; the refused attempts are 1 s old, well inside the window
    for (let i = 0; i < MAX_CREATES_PER_CLIENT; i++) {
      expect((await store.createRoom({ category: 'mix', durationSec: 120, creator: 'cccc' })).code).toBeTruthy();
    }
  });

  it('expiry: a lobby room still goes at 30 min; a battle started late lives until 10 min after its end', async () => {
    const a = await room('solo', 120, 1);
    vi.advanceTimersByTime(ROOM_TTL_MS);
    expect(await a.store.getRoomState(a.code)).toBeNull();

    const b = await room('solo', MAX_DURATION_SEC, 1);
    vi.advanceTimersByTime(29 * 60_000);
    await b.store.startRoom(b.code, b.hostKey);
    vi.advanceTimersByTime(MAX_DURATION_SEC * 1000 - 5000); // 5 s before the end — past the old 30-min TTL
    expect((await b.store.getRoomState(b.code)).status).toBe('running');
    expect(await score(b, 0, S(100, 5))).toEqual({ ok: true });
    vi.advanceTimersByTime(5000 + POST_GAME_TTL_MS - 1000);
    expect((await b.store.getRoomState(b.code)).status).toBe('finished'); // podium still readable
    vi.advanceTimersByTime(1000);
    expect(await b.store.getRoomState(b.code)).toBeNull();
  });

  it('expiry never shortens: a quick battle keeps the 30-minute floor', async () => {
    const r = await room('solo', 60, 1);
    await r.store.startRoom(r.code, r.hostKey);
    vi.advanceTimersByTime(ROOM_TTL_MS - 1000);
    expect(await r.store.getRoomState(r.code)).not.toBeNull();
    vi.advanceTimersByTime(1000);
    expect(await r.store.getRoomState(r.code)).toBeNull();
  });
});

describe('expiryAtStart', () => {
  it('= max(created + 30 min, start + duration + 10 min); worst case 50 min after creation', () => {
    const created = 0;
    expect(expiryAtStart({ createdAt: created, durationSec: 120 }, 60_000)).toBe(ROOM_TTL_MS);
    const worst = expiryAtStart({ createdAt: created, durationSec: MAX_DURATION_SEC }, ROOM_TTL_MS - 1);
    expect(worst).toBe(ROOM_TTL_MS - 1 + MAX_DURATION_SEC * 1000 + POST_GAME_TTL_MS);
    expect(worst).toBeLessThan(50 * 60_000);
  });
});

/* ---------------- HTTP layer ---------------- */
describe('/api/live host actions', () => {
  beforeEach(() => useBackend('memory'));
  afterEach(restoreEnv);
  async function call(body) {
    const res = { code: 0, body: null, setHeader() {}, status(c) { this.code = c; return this; }, json(b) { this.body = b; return this; } };
    await liveHandler({ method: 'POST', body }, res);
    return res;
  }

  it('lock / remove need the host key (403), a well-formed body (400), and map their errors', async () => {
    const { body: { code, hostKey } } = await call({ action: 'create', category: 'animals', durationSec: 120 });
    const { body: kid } = await call({ action: 'join', code, nickname: 'Brave Otter' });
    expect((await call({ action: 'lock', code, hostKey: 'x', locked: true })).code).toBe(403);
    expect((await call({ action: 'lock', code, hostKey, locked: 'yes' })).code).toBe(400);
    expect((await call({ action: 'lock', code, locked: true })).code).toBe(400);
    expect((await call({ action: 'remove', code, hostKey: 'x', playerId: kid.playerId })).code).toBe(403);
    expect((await call({ action: 'remove', code, hostKey })).code).toBe(400);
    expect((await call({ action: 'remove', code, hostKey, playerId: 'nobody' })).code).toBe(404);
    expect((await call({ action: 'score', code, playerId: kid.playerId, playerKey: kid.playerKey, ...S(10, 1) })).code).toBe(409); // lobby
    expect((await call({ action: 'lock', code, hostKey, locked: true })).body).toEqual({ ok: true, locked: true });
    const late = await call({ action: 'join', code, nickname: 'Clever Fox' });
    expect([late.code, late.body.error]).toEqual([409, 'room_locked']);
    expect((await call({ action: 'remove', code, hostKey, playerId: kid.playerId })).body).toEqual({ ok: true });
  });
});

/* ---------------- per-client create limit over HTTP (audit A091) ---------------- */
describe('/api/live create limit per IP', () => {
  beforeEach(() => useBackend('memory'));
  afterEach(restoreEnv);
  async function create(headers) {
    const res = {
      code: 0, body: null, headers: {},
      setHeader(k, v) { this.headers[k] = v; }, status(c) { this.code = c; return this; }, json(b) { this.body = b; return this; },
    };
    await liveHandler({ method: 'POST', headers, body: { action: 'create', category: 'animals', durationSec: 120 } }, res);
    return res;
  }

  it(`the ${MAX_CREATES_PER_CLIENT + 1}th create from one IP in the window answers 429 too_many_creates; other IPs still create`, async () => {
    const school = { 'x-real-ip': '203.0.113.7', 'x-forwarded-for': '203.0.113.7' };
    for (let i = 0; i < MAX_CREATES_PER_CLIENT; i++) expect((await create(school)).code).toBe(200);
    const r = await create(school);
    expect([r.code, r.body]).toEqual([429, { error: 'too_many_creates' }]);
    expect(r.headers['Retry-After']).toBeTruthy();
    expect((await create({ 'x-real-ip': '198.51.100.2' })).code).toBe(200);
    expect((await create({ 'x-forwarded-for': '198.51.100.3, 10.0.0.1' })).code).toBe(200);
  });

  it('one IPv6 /64 counts as one client', async () => {
    for (let i = 0; i < MAX_CREATES_PER_CLIENT; i++) expect((await create({ 'x-real-ip': `2001:db8:1:2::${i + 1}` })).code).toBe(200);
    expect((await create({ 'x-real-ip': '2001:db8:1:2:ffff:ffff:ffff:ffff' })).code).toBe(429);
    expect((await create({ 'x-real-ip': '2001:db8:1:3::1' })).code).toBe(200);
  });
});

describe('clientBucket', () => {
  it('normalizes IPv4, IPv4-mapped IPv6 and IPv6 /64; rejects junk', () => {
    expect(normalizeClientIp('203.0.113.7')).toBe('203.0.113.7');
    expect(normalizeClientIp('::ffff:203.0.113.7')).toBe('203.0.113.7');
    expect(normalizeClientIp('2001:db8::1')).toBe('2001:0db8:0000:0000::/64');
    expect(normalizeClientIp('[2001:DB8:0:0:1:2:3:4]')).toBe('2001:0db8:0000:0000::/64');
    expect(normalizeClientIp('::1')).toBe('0000:0000:0000:0000::/64');
    for (const bad of ['', 'unknown', '999.1.1.1', '1.2.3', '2001:db8::1::2', 'gggg::1', null, 42]) {
      expect(normalizeClientIp(bad)).toBeNull();
    }
  });
  it('prefers x-real-ip, then the first x-forwarded-for hop, then the socket', () => {
    expect(clientIp({ headers: { 'x-real-ip': '1.1.1.1', 'x-forwarded-for': '2.2.2.2' } })).toBe('1.1.1.1');
    expect(clientIp({ headers: { 'x-forwarded-for': '2.2.2.2, 3.3.3.3' } })).toBe('2.2.2.2');
    expect(clientIp({ headers: {}, socket: { remoteAddress: '4.4.4.4' } })).toBe('4.4.4.4');
    expect(clientIp({})).toBeNull();
  });
  it('is a keyed 16-hex hash, never the IP; same IP → same bucket; unknown → null', () => {
    const a = clientBucket({ headers: { 'x-real-ip': '203.0.113.7' } });
    expect(a).toMatch(/^[0-9a-f]{16}$/);
    expect(a).not.toContain('203');
    expect(clientBucket({ headers: { 'x-forwarded-for': '203.0.113.7' } })).toBe(a);
    expect(clientBucket({ headers: { 'x-real-ip': '203.0.113.8' } })).not.toBe(a);
    expect(clientBucket({ headers: {} })).toBeNull();
  });
});
