/**
 * Storage for Vocabulary Class Battle rooms — server-side only (used by
 * /api/live.js). Ported from kidsdomath's liveStore (proven shapes), adapted
 * to CDE's Vercel-functions stack and prefixed tables on the shared Neon
 * free-tier project.
 *
 * Privacy contract (keep it true — it is stated on /battle/):
 *   - No accounts. A room stores ONLY: category, duration, status, timestamps,
 *     random keys, and per-player { generated nickname, score, streak,
 *     answered, correct }. Nothing else. No free-text ever reaches storage
 *     (nicknames are validated against the fixed generated list).
 *   - Rooms auto-expire 30 minutes after creation and are deleted lazily on
 *     access — no cron needed.
 *
 * Two interchangeable backends behind getBattleStore():
 *   - PgBattleStore  — Neon Postgres over HTTP (@neondatabase/serverless).
 *     Used automatically when DATABASE_URL or POSTGRES_URL is set. REQUIRED
 *     in production: Vercel functions don't share memory.
 *     Tables: cde_battle_rooms / cde_battle_players (create-if-missing, like
 *     api/land.js does with cde_land).
 *   - MemoryBattleStore — in-process Map. Dev / single-process fallback only
 *     (logs a warning when NODE_ENV=production).
 *
 * All mutating methods return { error: '<code>' } on failure instead of
 * throwing, so the route handler can map codes to HTTP statuses.
 */

import { isValidNickname } from './battleNames.js';
import { maxPlausibleScore } from './battleRules.js';

export const ROOM_TTL_MS = 30 * 60 * 1000; // 30 minutes
export const MAX_PLAYERS = 60;
const MAX_MEMORY_ROOMS = 500;

// No vowels (avoids accidental words), no I/L/O/U lookalikes. 20^5 ≈ 3.2M codes.
const CODE_ALPHABET = 'BCDFGHJKMNPQRSTVWXYZ';
export const CODE_LENGTH = 5;
const CODE_RE = new RegExp(`^[${CODE_ALPHABET}]{${CODE_LENGTH}}$`);

export function generateRoomCode() {
  let code = '';
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  }
  return code;
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

function publicState(room, players, now) {
  return {
    code: room.code,
    category: room.category,
    durationSec: room.durationSec,
    status: effectiveStatus(room, now),
    startedAt: room.startedAt || null,
    endsAt: endsAtOf(room),
    now,
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

/* ------------------------------------------------------------------------- *
 * In-memory backend (dev / tests / single-process fallback)
 * ------------------------------------------------------------------------- */

class MemoryBattleStore {
  constructor() {
    // Pin to globalThis so dev-server hot reloads don't wipe active rooms.
    if (!globalThis.__cdeBattleRooms) globalThis.__cdeBattleRooms = new Map();
    this.rooms = globalThis.__cdeBattleRooms;
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

  async createRoom({ category, durationSec }) {
    const now = Date.now();
    this._sweep(now);
    if (this.rooms.size >= MAX_MEMORY_ROOMS) return { error: 'too_many_rooms' };
    let code = generateRoomCode();
    let guard = 0;
    while (this.rooms.has(code) && guard++ < 50) code = generateRoomCode();
    const room = {
      code,
      category,
      durationSec,
      status: 'lobby',
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

  async startRoom(code, hostKey) {
    const now = Date.now();
    const entry = this._get(code, now);
    if (!entry) return { error: 'room_not_found' };
    if (entry.room.hostKey !== hostKey) return { error: 'forbidden' };
    if (entry.room.status !== 'lobby') return { error: 'already_started' };
    entry.room.status = 'running';
    entry.room.startedAt = now;
    return { ok: true };
  }

  async joinRoom(code, nickname) {
    const now = Date.now();
    if (!isValidNickname(nickname)) return { error: 'invalid_nickname' };
    const entry = this._get(code, now);
    if (!entry) return { error: 'room_not_found' };
    if (effectiveStatus(entry.room, now) === 'finished') return { error: 'room_finished' };
    if (entry.players.size >= MAX_PLAYERS) return { error: 'room_full' };
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
    if (!player || player.playerKey !== playerKey) return { error: 'forbidden' };
    const cap = maxPlausibleScore(entry.room.durationSec);
    // Monotonic + capped: a stale/duplicate POST can never lower or inflate.
    player.score = Math.min(Math.max(player.score, score), cap);
    player.streak = streak;
    player.answered = Math.max(player.answered, answered);
    player.correct = Math.max(player.correct, correct);
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
      status: row.status,
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

  async createRoom({ category, durationSec }) {
    const sql = await this._sql();
    const now = Date.now();
    await this._sweep(sql, now); // lazy TTL cleanup on access
    const hostKey = randomKey();
    for (let attempt = 0; attempt < 5; attempt++) {
      const code = generateRoomCode();
      try {
        await sql`
          INSERT INTO cde_battle_rooms (code, category, duration_sec, status, host_key, created_at, expires_at)
          VALUES (${code}, ${category}, ${durationSec}, 'lobby', ${hostKey}, ${now}, ${now + ROOM_TTL_MS})`;
        return { code, hostKey };
      } catch (e) {
        if (attempt === 4) throw e; // code collision is ~impossible 5x in a row
      }
    }
    return { error: 'too_many_rooms' };
  }

  async getRoomState(code) {
    const sql = await this._sql();
    const now = Date.now();
    const room = await this._getRoomRow(sql, code, now);
    if (!room) return null;
    const players = await sql`
      SELECT id, nickname, score, streak, answered, correct, joined_at
      FROM cde_battle_players WHERE room_code = ${code}`;
    return publicState(
      room,
      players.map((p) => ({ ...p, joinedAt: Number(p.joined_at) })),
      now
    );
  }

  async startRoom(code, hostKey) {
    const sql = await this._sql();
    const now = Date.now();
    const room = await this._getRoomRow(sql, code, now);
    if (!room) return { error: 'room_not_found' };
    if (room.hostKey !== hostKey) return { error: 'forbidden' };
    if (room.status !== 'lobby') return { error: 'already_started' };
    await sql`
      UPDATE cde_battle_rooms SET status = 'running', started_at = ${now}
      WHERE code = ${code} AND status = 'lobby'`;
    return { ok: true };
  }

  async joinRoom(code, nickname) {
    if (!isValidNickname(nickname)) return { error: 'invalid_nickname' };
    const sql = await this._sql();
    const now = Date.now();
    const room = await this._getRoomRow(sql, code, now);
    if (!room) return { error: 'room_not_found' };
    if (effectiveStatus(room, now) === 'finished') return { error: 'room_finished' };
    const [{ count }] = await sql`
      SELECT COUNT(*)::int AS count FROM cde_battle_players WHERE room_code = ${code}`;
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
    const cap = maxPlausibleScore(room.durationSec);
    const rows = await sql`
      UPDATE cde_battle_players
      SET score = LEAST(GREATEST(score, ${score}), ${cap}),
          streak = ${streak},
          answered = GREATEST(answered, ${answered}),
          correct = GREATEST(correct, ${correct})
      WHERE id = ${playerId} AND room_code = ${code} AND player_key = ${playerKey}
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
  const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
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
}
