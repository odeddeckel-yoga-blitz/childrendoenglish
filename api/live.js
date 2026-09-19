/**
 * Vocabulary Class Battle API — single Vercel function (one function slot,
 * matches the existing api/*.js maxDuration config in vercel.json).
 * Architecture ported from kidsdomath's /api/live/* App-Router routes,
 * collapsed into an action router for the classic functions runtime:
 *
 *   GET  /api/live?code=XXXXX                     → room state + leaderboard
 *                                                   (polled every 2s by every
 *                                                   screen in the room)
 *   POST /api/live {action:'create', category, durationSec}
 *                                                 → { code, hostKey }
 *   POST /api/live {action:'join', code, nickname}→ { playerId, playerKey }
 *   POST /api/live {action:'start', code, hostKey}→ { ok }
 *   POST /api/live {action:'score', code, playerId, playerKey,
 *                   score, streak, answered, correct} → { ok }
 *
 * Privacy: no accounts; only a picked (never typed) nickname + score are
 * stored; rooms auto-delete ~30 minutes after creation. See api/_lib/battleStore.js.
 */

import { getBattleStore, normalizeRoomCode } from './_lib/battleStore.js';
import { isValidCategory, isValidDuration } from './_lib/battleRules.js';

const STATUS_BY_ERROR = {
  room_not_found: 404,
  forbidden: 403,
  room_finished: 409,
  room_full: 409,
  nickname_taken: 409,
  already_started: 409,
  invalid_nickname: 400,
  bad_request: 400,
  too_many_rooms: 503,
};

function send(res, result) {
  if (result && result.error) {
    return res.status(STATUS_BY_ERROR[result.error] || 400).json({ error: result.error });
  }
  return res.status(200).json(result);
}

/** Non-negative bounded integer or null (rejects floats, strings, negatives). */
function toCount(v, max = 100000) {
  return Number.isInteger(v) && v >= 0 && v <= max ? v : null;
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  try {
    const store = getBattleStore();

    if (req.method === 'GET') {
      const code = normalizeRoomCode(req.query && req.query.code);
      if (!code) return send(res, { error: 'room_not_found' });
      const state = await store.getRoomState(code);
      if (!state) return send(res, { error: 'room_not_found' });
      return res.status(200).json(state);
    }

    if (req.method !== 'POST') {
      res.setHeader('Allow', 'GET, POST');
      return res.status(405).json({ error: 'method_not_allowed' });
    }

    let body = req.body;
    if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = null; } }
    if (!body || typeof body !== 'object') return send(res, { error: 'bad_request' });

    switch (body.action) {
      case 'create': {
        const category = isValidCategory(body.category) ? body.category : null;
        const durationSec = isValidDuration(body.durationSec) ? body.durationSec : null;
        if (!category || !durationSec) return send(res, { error: 'bad_request' });
        return send(res, await store.createRoom({ category, durationSec }));
      }
      case 'join': {
        const code = normalizeRoomCode(body.code);
        if (!code || typeof body.nickname !== 'string') return send(res, { error: 'bad_request' });
        return send(res, await store.joinRoom(code, body.nickname));
      }
      case 'start': {
        const code = normalizeRoomCode(body.code);
        if (!code || typeof body.hostKey !== 'string') return send(res, { error: 'bad_request' });
        return send(res, await store.startRoom(code, body.hostKey));
      }
      case 'score': {
        const code = normalizeRoomCode(body.code);
        if (!code || typeof body.playerId !== 'string' || typeof body.playerKey !== 'string') {
          return send(res, { error: 'bad_request' });
        }
        const score = toCount(body.score);
        const streak = toCount(body.streak, 10000);
        const answered = toCount(body.answered, 10000);
        const correct = toCount(body.correct, 10000);
        if (score === null || streak === null || answered === null || correct === null) {
          return send(res, { error: 'bad_request' });
        }
        return send(res, await store.updateScore(code, body.playerId, body.playerKey, {
          score, streak, answered, correct,
        }));
      }
      default:
        return send(res, { error: 'bad_request' });
    }
  } catch (e) {
    console.error('[battle] api error:', e && e.message);
    return res.status(500).json({ error: 'server_error' });
  }
}
