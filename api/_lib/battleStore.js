/**
 * Storage for Vocabulary Class Battle rooms — server-side only (used by
 * /api/live.js). Ported from kidsdomath's liveStore (proven shapes), adapted
 * to CDE's Vercel-functions stack and prefixed tables on the shared Neon
 * free-tier project.
 *
 * Privacy contract (keep it true — it is stated on /battle/):
 *   - No accounts. A room stores ONLY: category, duration, mode, class target,
 *     status, timestamps, random keys, and per-player { generated nickname, score, streak,
 *     answered, correct }. Nothing else. No free-text ever reaches storage
 *     (nicknames are validated against the fixed generated list).
 *   - Rooms auto-expire 30 minutes after creation, or 10 minutes after the
 *     battle's end if that is later (a long lobby + a 10-min battle must not
 *     expire mid-game), and are deleted lazily on access — no cron needed.
 *   - Per-client create limit (audit A091, 11-22): a separate, short-lived
 *     log keeps { random id, keyed 16-hex hash of the creator's IP (/64 for
 *     IPv6, api/_lib/clientBucket.js), time } per created room, never the IP
 *     itself and never linked to the room; rows go after CREATE_WINDOW_MS.
 *     Worst case: started at minute ~30, 10-min battle → deleted ~50 min
 *     after creation (ROOM_TTL_MS + MAX_DURATION_SEC + POST_GAME_TTL_MS).
 *   - Host controls (hostKey): lock (no new joins) and remove a player. A
 *     removed player's row stays only as a tombstone (nickname + zeroed
 *     counts, never sent to clients) so the playerKey stays dead and the
 *     remaining kids keep their teams (teams derive from join order).
 *
 * Two interchangeable backends behind getBattleStore():
 *   - PgBattleStore  — Neon Postgres over HTTP (@neondatabase/serverless).
 *     Used automatically when DATABASE_URL or POSTGRES_URL is set. REQUIRED
 *     in production: Vercel functions don't share memory.
 *     Tables: cde_battle_rooms / cde_battle_players / cde_battle_creates
 *     (create-if-missing, like api/land.js does with cde_land).
 *   - MemoryBattleStore — in-process Map. Dev / single-process fallback only
 *     (logs a warning when NODE_ENV=production).
 *
 * All mutating methods return { error: '<code>' } on failure instead of
 * throwing, so the route handler can map codes to HTTP statuses.
 */

import { isValidNickname } from './battleNames.js';
import { isGroupMode, defaultTarget, isValidTarget, clampScoreUpdate } from './battleRules.js';
import { teamOf, teamTotals, teamWinner } from './battleTeams.js';

export const ROOM_TTL_MS = 30 * 60 * 1000; // 30 minutes from creation
export const POST_GAME_TTL_MS = 10 * 60 * 1000; // kept 10 minutes after the battle ends
export const MAX_PLAYERS = 60;
// Unexpired rooms at once (both backends): a cheap brake on create-spam.
// A busy school day is a few dozen rooms; 300 is far above real use.
export const MAX_ACTIVE_ROOMS = 300;
// Per-client create limit (audit A091): without it one script could fill the
// 300-room cap and every teacher got too_many_rooms for 30 minutes. Generous
// for a school behind one NAT IP (a whole staff starting at the bell, plus
// re-creates), yet one client can hold at most ~36 of the 300 rooms at once
// (rooms live 30 min, so 3 windows x 12).
export const CREATE_WINDOW_MS = 10 * 60 * 1000;
export const MAX_CREATES_PER_CLIENT = 12;

// No vowels (avoids accidental words), no I/L/O/U lookalikes. 20^5 ≈ 3.2M codes.
const CODE_ALPHABET = 'BCDFGHJKMNPQRSTVWXYZ';
export const CODE_LENGTH = 5;
const CODE_RE = new RegExp(`^[${CODE_ALPHABET}]{${CODE_LENGTH}}$`);

// Unbiased pick from a CSPRNG: reject bytes >= 240 (the largest multiple of 20).
const BYTE_LIMIT = 256 - (256 % CODE_ALPHABET.length);
export function generateRoomCode() {
  let code = '';
  const buf = new Uint8Array(CODE_LENGTH * 2);
  while (code.length < CODE_LENGTH) {
    globalThis.crypto.getRandomValues(buf);
    for (const b of buf) {
      if (b < BYTE_LIMIT && code.length < CODE_LENGTH) code += CODE_ALPHABET[b % CODE_ALPHABET.length];
    }
  }
  return code;
}

/** Expiry once a battle starts: never before creation + TTL, else end + POST_GAME_TTL_MS. */
export function expiryAtStart(room, startedAt) {
  return Math.max(room.createdAt + ROOM_TTL_MS, startedAt + room.durationSec * 1000 + POST_GAME_TTL_MS);
}

export function normalizeRoomCode(raw) {
  if (typeof raw !== 'string') return null;
  const code = raw.trim().toUpperCase();
  return CODE_RE.test(code) ? code : null;
}

function randomKey() {
  return globalThis.crypto.randomUUID().replace(/-/g, '');
}

function endsAtOf(room) {
  return room.startedAt ? room.startedAt + room.durationSec * 1000 : null;
}

/** Derive the effective status, flipping running → finished when time is up. */
function effectiveStatus(room, now) {
  if (room.status === 'running' && now >= endsAtOf(room)) return 'finished';
  return room.status;
}

/** `allPlayers` = every row (tombstones too); only active ones reach the board. */
function publicState(room, allPlayers, now) {
  const players = allPlayers.filter((p) => !p.removed);
  const base = {
    code: room.code,
    category: room.category,
    durationSec: room.durationSec,
    mode: room.mode || 'solo',
    status: effectiveStatus(room, now),
    startedAt: room.startedAt || null,
    endsAt: endsAtOf(room),
    locked: !!room.locked,
    now,
  };
  if (isGroupMode(base.mode)) {
    // Team / class battle: the board never carries a per-player score. Players
    // go out as { id, nickname, team } (nicknames for the lobby join check).
    // Teams from EVERY player ever joined, so a removal never flips the others.
    const tm = teamOf(allPlayers);
    const totals = teamTotals(players, tm);
    return {
      ...base,
      target: room.target || null,
      classTotal: players.reduce((n, p) => n + (p.correct || 0), 0),
      teams: totals,
      winner: teamWinner(totals),
      players: players
        .slice()
        .sort((a, b) => a.joinedAt - b.joinedAt || String(a.id).localeCompare(String(b.id)))
        .map((p) => ({ id: p.id, nickname: p.nickname, team: tm.get(p.id) })),
    };
  }
  return {
    ...base,
    players: players
      .slice()
      .sort((a, b) => b.score - a.score || a.joinedAt - b.joinedAt)
      .map((p) => ({
        id: p.id,
        nickname: p.nickname,
        score: p.score,
        streak: p.streak,
        answered: p.answered,
        correct: p.correct,
      })),
  };
}

/** The class target, fixed at start: the teacher's nudged number, or the default. */
function targetAtStart(room, nPlayers, requested) {
  if (room.mode !== 'class') return null;
  return isValidTarget(requested) ? requested : defaultTarget(nPlayers, room.durationSec);
}

/* ------------------------------------------------------------------------- *
 * In-memory backend (dev / tests / single-process fallback)
 * ------------------------------------------------------------------------- */

class MemoryBattleStore {
  constructor() {
    // Pin to globalThis so dev-server hot reloads don't wipe active rooms.
    if (!globalThis.__cdeBattleRooms) globalThis.__cdeBattleRooms = new Map();
    this.rooms = globalThis.__cdeBattleRooms;
    if (!globalThis.__cdeBattleCreates) globalThis.__cdeBattleCreates = new Map(); // bucket → [createdAt]
    this.creates = globalThis.__cdeBattleCreates;
  }

  _sweep(now) {
    for (const [code, entry] of this.rooms) {
      if (now >= entry.room.expiresAt) this.rooms.delete(code);
    }
  }

  _get(code, now) {
    const entry = this.rooms.get(code);
    if (!entry) return null;
    if (now >= entry.room.expiresAt) {
      this.rooms.delete(code);
      return null;
    }
    return entry;
  }

  async createRoom({ category, durationSec, mode = 'solo', creator = null }) {
    const now = Date.now();
    this._sweep(now);
    for (const [b, times] of this.creates) {
      const kept = times.filter((t) => t > now - CREATE_WINDOW_MS);
      if (kept.length) this.creates.set(b, kept); else this.creates.delete(b);
    }
    if (creator && (this.creates.get(creator) || []).length >= MAX_CREATES_PER_CLIENT) {
      return { error: 'too_many_creates' };
    }
    if (this.rooms.size >= MAX_ACTIVE_ROOMS) return { error: 'too_many_rooms' };
    if (creator) this.creates.set(creator, [...(this.creates.get(creator) || []), now]);
    let code = generateRoomCode();
    let guard = 0;
    while (this.rooms.has(code) && guard++ < 50) code = generateRoomCode();
    const room = {
      code,
      category,
      durationSec,
      mode,
      target: null,
      status: 'lobby',
      locked: false,
      hostKey: randomKey(),
      startedAt: null,
      createdAt: now,
      expiresAt: now + ROOM_TTL_MS,
    };
    this.rooms.set(code, { room, players: new Map() });
    return { code, hostKey: room.hostKey };
  }

  async getRoomState(code) {
    const now = Date.now();
    const entry = this._get(code, now);
    if (!entry) return null;
    return publicState(entry.room, [...entry.players.values()], now);
  }

  async startRoom(code, hostKey, target) {
    const now = Date.now();
    const entry = this._get(code, now);
    if (!entry) return { error: 'room_not_found' };
    if (entry.room.hostKey !== hostKey) return { error: 'forbidden' };
    if (entry.room.status !== 'lobby') return { error: 'already_started' };
    const active = [...entry.players.values()].filter((p) => !p.removed).length;
    entry.room.target = targetAtStart(entry.room, active, target);
    entry.room.status = 'running';
    entry.room.startedAt = now;
    entry.room.expiresAt = expiryAtStart(entry.room, now);
    return { ok: true };
  }

  async setLocked(code, hostKey, locked) {
    const entry = this._get(code, Date.now());
    if (!entry) return { error: 'room_not_found' };
    if (entry.room.hostKey !== hostKey) return { error: 'forbidden' };
    entry.room.locked = locked;
    return { ok: true, locked };
  }

  async removePlayer(code, hostKey, playerId) {
    const entry = this._get(code, Date.now());
    if (!entry) return { error: 'room_not_found' };
    if (entry.room.hostKey !== hostKey) return { error: 'forbidden' };
    const p = entry.players.get(playerId);
    if (!p || p.removed) return { error: 'player_not_found' };
    Object.assign(p, { removed: true, score: 0, streak: 0, answered: 0, correct: 0 });
    return { ok: true };
  }

  async joinRoom(code, nickname) {
    const now = Date.now();
    if (!isValidNickname(nickname)) return { error: 'invalid_nickname' };
    const entry = this._get(code, now);
    if (!entry) return { error: 'room_not_found' };
    if (effectiveStatus(entry.room, now) === 'finished') return { error: 'room_finished' };
    if (entry.room.locked) return { error: 'room_locked' };
    const active = [...entry.players.values()].filter((p) => !p.removed).length;
    if (active >= MAX_PLAYERS) return { error: 'room_full' };
    for (const p of entry.players.values()) {
      if (p.nickname === nickname) return { error: 'nickname_taken' };
    }
    const player = {
      id: randomKey().slice(0, 12),
      playerKey: randomKey(),
      nickname,
      score: 0,
      streak: 0,
      answered: 0,
      correct: 0,
      removed: false,
      joinedAt: now,
    };
    entry.players.set(player.id, player);
    return { playerId: player.id, playerKey: player.playerKey };
  }

  async updateScore(code, playerId, playerKey, { score, streak, answered, correct }) {
    const now = Date.now();
    const entry = this._get(code, now);
    if (!entry) return { error: 'room_not_found' };
    const player = entry.players.get(playerId);
    if (!player || player.playerKey !== playerKey || player.removed) return { error: 'forbidden' };
    const v = clampScoreUpdate({ score, streak, answered, correct }, entry.room, now);
    if (!v) return { error: 'not_running' };
    // Monotonic + capped: a stale/duplicate POST can never lower or inflate.
    player.score = Math.max(player.score, v.score);
    player.streak = v.streak;
    player.answered = Math.max(player.answered, v.answered);
    player.correct = Math.max(player.correct, v.correct);
    return { ok: true };
  }
}

/* ------------------------------------------------------------------------- *
 * Postgres backend (Neon over HTTP) — production
 * ------------------------------------------------------------------------- */

class PgBattleStore {
  constructor(connectionString) {
    this.connectionString = connectionString;
    this.sqlPromise = null;
  }

  async _sql() {
    if (!this.sqlPromise) {
      this.sqlPromise = (async () => {
        const { neon } = await import('@neondatabase/serverless');
        const sql = neon(this.connectionString);
        await sql`
          CREATE TABLE IF NOT EXISTS cde_battle_rooms (
            code TEXT PRIMARY KEY,
            category TEXT NOT NULL,
            duration_sec INT NOT NULL,
            status TEXT NOT NULL DEFAULT 'lobby',
            host_key TEXT NOT NULL,
            started_at BIGINT,
            created_at BIGINT NOT NULL,
            expires_at BIGINT NOT NULL
          )`;
        // RL13 (2026-10-30): grouping mode + the class target fixed at start.
        await sql`ALTER TABLE cde_battle_rooms ADD COLUMN IF NOT EXISTS mode TEXT NOT NULL DEFAULT 'solo'`;
        await sql`ALTER TABLE cde_battle_rooms ADD COLUMN IF NOT EXISTS target INT`;
        // 2026-11-20 hardening: host lock (additive, defaulted — old rows read as unlocked).
        await sql`ALTER TABLE cde_battle_rooms ADD COLUMN IF NOT EXISTS locked BOOLEAN NOT NULL DEFAULT false`;
        await sql`
          CREATE TABLE IF NOT EXISTS cde_battle_players (
            id TEXT PRIMARY KEY,
            room_code TEXT NOT NULL REFERENCES cde_battle_rooms(code) ON DELETE CASCADE,
            nickname TEXT NOT NULL,
            player_key TEXT NOT NULL,
            score INT NOT NULL DEFAULT 0,
            streak INT NOT NULL DEFAULT 0,
            answered INT NOT NULL DEFAULT 0,
            correct INT NOT NULL DEFAULT 0,
            joined_at BIGINT NOT NULL,
            UNIQUE (room_code, nickname)
          )`;
        // 2026-11-20 hardening: host-removed players (tombstone, never sent to clients).
        await sql`ALTER TABLE cde_battle_players ADD COLUMN IF NOT EXISTS removed BOOLEAN NOT NULL DEFAULT false`;
        // 2026-11-22 (audit A091): per-client create log. No IP, no room code: a keyed hash + a time, kept 10 min.
        await sql`
          CREATE TABLE IF NOT EXISTS cde_battle_creates (
            id TEXT PRIMARY KEY,
            bucket TEXT NOT NULL,
            created_at BIGINT NOT NULL
          )`;
        await sql`CREATE INDEX IF NOT EXISTS cde_battle_creates_bucket ON cde_battle_creates (bucket, created_at)`;
        return sql;
      })();
    }
    return this.sqlPromise;
  }

  async _sweep(sql, now) {
    await sql`DELETE FROM cde_battle_rooms WHERE expires_at <= ${now}`;
  }

  _rowToRoom(row) {
    return {
      code: row.code,
      category: row.category,
      durationSec: row.duration_sec,
      mode: row.mode || 'solo',
      target: row.target == null ? null : Number(row.target),
      status: row.status,
      locked: !!row.locked,
      hostKey: row.host_key,
      startedAt: row.started_at ? Number(row.started_at) : null,
      createdAt: Number(row.created_at),
      expiresAt: Number(row.expires_at),
    };
  }

  async _getRoomRow(sql, code, now) {
    const rows = await sql`SELECT * FROM cde_battle_rooms WHERE code = ${code}`;
    if (rows.length === 0) return null;
    const room = this._rowToRoom(rows[0]);
    if (now >= room.expiresAt) {
      await sql`DELETE FROM cde_battle_rooms WHERE code = ${code}`;
      return null;
    }
    return room;
  }

  async createRoom({ category, durationSec, mode = 'solo', creator = null }) {
    const sql = await this._sql();
    const now = Date.now();
    await this._sweep(sql, now); // lazy TTL cleanup on access (so every row left is unexpired)
    // Per-client limit: record first, then count (this attempt included), so parallel requests from one
    // script cannot all pass a count taken before any of them was written. A refused or failed attempt
    // removes its own row, so retries behind a school NAT don't extend the wait.
    let createId = null;
    if (creator) {
      createId = randomKey();
      await sql`DELETE FROM cde_battle_creates WHERE created_at <= ${now - CREATE_WINDOW_MS}`;
      await sql`INSERT INTO cde_battle_creates (id, bucket, created_at) VALUES (${createId}, ${creator}, ${now})`;
      const [{ count: mine }] = await sql`
        SELECT COUNT(*)::int AS count FROM cde_battle_creates WHERE bucket = ${creator} AND created_at > ${now - CREATE_WINDOW_MS}`;
      if (mine > MAX_CREATES_PER_CLIENT) {
        await sql`DELETE FROM cde_battle_creates WHERE id = ${createId}`;
        return { error: 'too_many_creates' };
      }
    }
    const unrecord = async () => { if (createId) await sql`DELETE FROM cde_battle_creates WHERE id = ${createId}`; };
    const [{ count: live }] = await sql`SELECT COUNT(*)::int AS count FROM cde_battle_rooms`;
    if (live >= MAX_ACTIVE_ROOMS) { await unrecord(); return { error: 'too_many_rooms' }; }
    const hostKey = randomKey();
    for (let attempt = 0; attempt < 5; attempt++) {
      const code = generateRoomCode();
      try {
        await sql`
          INSERT INTO cde_battle_rooms (code, category, duration_sec, mode, status, host_key, created_at, expires_at)
          VALUES (${code}, ${category}, ${durationSec}, ${mode}, 'lobby', ${hostKey}, ${now}, ${now + ROOM_TTL_MS})`;
        return { code, hostKey };
      } catch (e) {
        if (attempt === 4) { await unrecord(); throw e; } // code collision is ~impossible 5x in a row
      }
    }
    await unrecord();
    return { error: 'too_many_rooms' };
  }

  async getRoomState(code) {
    const sql = await this._sql();
    const now = Date.now();
    const room = await this._getRoomRow(sql, code, now);
    if (!room) return null;
    const players = await sql`
      SELECT id, nickname, score, streak, answered, correct, joined_at, removed
      FROM cde_battle_players WHERE room_code = ${code}`;
    return publicState(
      room,
      players.map((p) => ({ ...p, joinedAt: Number(p.joined_at) })),
      now
    );
  }

  async startRoom(code, hostKey, target) {
    const sql = await this._sql();
    const now = Date.now();
    const room = await this._getRoomRow(sql, code, now);
    if (!room) return { error: 'room_not_found' };
    if (room.hostKey !== hostKey) return { error: 'forbidden' };
    if (room.status !== 'lobby') return { error: 'already_started' };
    let fixed = null;
    if (room.mode === 'class') {
      const [{ count }] = await sql`
        SELECT COUNT(*)::int AS count FROM cde_battle_players WHERE room_code = ${code} AND removed = false`;
      fixed = targetAtStart(room, count, target);
    }
    await sql`
      UPDATE cde_battle_rooms
      SET status = 'running', started_at = ${now}, target = ${fixed}, expires_at = ${expiryAtStart(room, now)}
      WHERE code = ${code} AND status = 'lobby'`;
    return { ok: true };
  }

  async setLocked(code, hostKey, locked) {
    const sql = await this._sql();
    const room = await this._getRoomRow(sql, code, Date.now());
    if (!room) return { error: 'room_not_found' };
    if (room.hostKey !== hostKey) return { error: 'forbidden' };
    await sql`UPDATE cde_battle_rooms SET locked = ${locked} WHERE code = ${code}`;
    return { ok: true, locked };
  }

  async removePlayer(code, hostKey, playerId) {
    const sql = await this._sql();
    const room = await this._getRoomRow(sql, code, Date.now());
    if (!room) return { error: 'room_not_found' };
    if (room.hostKey !== hostKey) return { error: 'forbidden' };
    const rows = await sql`
      UPDATE cde_battle_players
      SET removed = true, score = 0, streak = 0, answered = 0, correct = 0
      WHERE id = ${playerId} AND room_code = ${code} AND removed = false
      RETURNING id`;
    if (rows.length === 0) return { error: 'player_not_found' };
    return { ok: true };
  }

  async joinRoom(code, nickname) {
    if (!isValidNickname(nickname)) return { error: 'invalid_nickname' };
    const sql = await this._sql();
    const now = Date.now();
    const room = await this._getRoomRow(sql, code, now);
    if (!room) return { error: 'room_not_found' };
    if (effectiveStatus(room, now) === 'finished') return { error: 'room_finished' };
    if (room.locked) return { error: 'room_locked' };
    const [{ count }] = await sql`
      SELECT COUNT(*)::int AS count FROM cde_battle_players WHERE room_code = ${code} AND removed = false`;
    if (count >= MAX_PLAYERS) return { error: 'room_full' };
    const playerId = randomKey().slice(0, 12);
    const playerKey = randomKey();
    try {
      await sql`
        INSERT INTO cde_battle_players (id, room_code, nickname, player_key, joined_at)
        VALUES (${playerId}, ${code}, ${nickname}, ${playerKey}, ${now})`;
    } catch {
      return { error: 'nickname_taken' }; // UNIQUE (room_code, nickname)
    }
    return { playerId, playerKey };
  }

  async updateScore(code, playerId, playerKey, { score, streak, answered, correct }) {
    const sql = await this._sql();
    const now = Date.now();
    const room = await this._getRoomRow(sql, code, now);
    if (!room) return { error: 'room_not_found' };
    const v = clampScoreUpdate({ score, streak, answered, correct }, room, now);
    if (!v) return { error: 'not_running' }; // lobby, or past the end + grace
    const rows = await sql`
      UPDATE cde_battle_players
      SET score = GREATEST(score, ${v.score}),
          streak = ${v.streak},
          answered = GREATEST(answered, ${v.answered}),
          correct = GREATEST(correct, ${v.correct})
      WHERE id = ${playerId} AND room_code = ${code} AND player_key = ${playerKey} AND removed = false
      RETURNING id`;
    if (rows.length === 0) return { error: 'forbidden' };
    return { ok: true };
  }
}

/* ------------------------------------------------------------------------- */

let storeInstance = null;

/**
 * Returns the battle store: Postgres when DATABASE_URL/POSTGRES_URL is set,
 * otherwise the in-memory fallback (dev only — warns in production, where
 * serverless instances don't share memory).
 */
export function getBattleStore() {
  if (storeInstance) return storeInstance;
  const url = process.env.CDE_DATABASE_URL || process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (url) {
    storeInstance = new PgBattleStore(url);
  } else {
    if (process.env.NODE_ENV === 'production') {
      console.warn(
        '[battle] No DATABASE_URL/POSTGRES_URL set — Class Battle is using the in-memory store. ' +
          'This does NOT work across serverless instances; set DATABASE_URL (shared Neon project) before relying on it.'
      );
    }
    storeInstance = new MemoryBattleStore();
  }
  return storeInstance;
}

/** Test hook: reset the singleton (and optionally the memory rooms). */
export function __resetBattleStoreForTests() {
  storeInstance = null;
  delete globalThis.__cdeBattleRooms;
  delete globalThis.__cdeBattleCreates;
}
