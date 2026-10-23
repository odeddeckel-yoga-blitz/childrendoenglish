// Cookieless, no-PII aggregate landing counter (ported from kidsdomath).
// GA is consent-gated, so visitors who land from Google / an AI assistant and
// bounce before consenting are invisible — and ChatGPT is this site's largest
// external channel. Stores ONLY { day, page-class, source-class, n } tallies:
// no identifier, no IP, no device storage. Table: cde_land (shared Neon
// project childrendoenglish, CDE_DATABASE_URL — own project since 2026-10-17).
import { neon } from '@neondatabase/serverless';

const PAGES = new Set(['home', 'vocab', 'hebrew', 'spanish', 'games', 'tool', 'flashcards', 'guide', 'app', 'other']);
const LANGS_OK = new Set(['en', 'he', 'es', 'ar']);
const SRCS = new Set(['direct', 'seo', 'ai', 'internal', 'external']);

// Learning events (Word Learning Optimizer) — same cookieless aggregate model:
// ONLY { day, event-kind, content-item, n } tallies. The item is a WORD ID or
// mode name, never anything about the visitor. g_open = a real (non-webdriver)
// game page open per game id; spot = a home-spotlight card click (w_<word>|g_<game>);
// ansm_ok/ansm_no = an answer split by probe (<word>@aud|img|txt) so the asset at
// fault is identifiable; wfb = explicit word feedback tap (<word>@img|aud|hard|ok);
// vis = once-per-day return bucket (new|r1|r2-7|r8-30|r31p|rpre — public/land-beacon.js);
// onb = first-visit funnel step (create_view|create_done|q1_start|q1_done|q1_quit).
const LEARN_EVS = new Set(['ans_ok', 'ans_no', 'quiz_start', 'quiz_done', 'quiz_quit', 'letter', 'g_lvl', 'g_cmp', 'g_open', 'spot', 'ansm_ok', 'ansm_no', 'wfb', 'cyc_start', 'cyc_stage', 'cyc_done', 'vis', 'onb']);
const ITEM_RE = /^[a-z0-9@_-]{1,40}$/;

// Classify a DB failure so the function log names the REAL cause — the beacon
// itself must stay silent (204), and a silent beacon + a Neon quota = invisible
// data loss (KDM lost ~2h of events on 2026-10-22 that way).
function failCause(err) {
  const m = String(err?.message || err || '');
  if (/\b402\b|quota|exceeded|compute time|data transfer limit/i.test(m)) return 'neon-quota';
  if (/\b40[13]\b|password authentication|authentication failed|invalid.*(token|credential)|role .* does not exist/i.test(m)) return 'bad-credentials';
  if (/fetch failed|ECONN|ETIMEDOUT|ENOTFOUND|timeout|\b5\d\d\b/i.test(m)) return 'neon-unreachable';
  return 'other';
}
function logFail(where, err) {
  console.error(`[land] ${where} failed — cause=${failCause(err)} status=${err?.status ?? err?.code ?? '-'} msg=${String(err?.message || err).slice(0, 300)}`);
}

let ready = null;
let warnedNoUrl = false;
function sql() {
  const url = process.env.CDE_DATABASE_URL || process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!url) {
    if (!warnedNoUrl) { warnedNoUrl = true; console.error('[land] no database URL configured — events are being DROPPED (cause=no-db-url)'); }
    return null;
  }
  const q = neon(url);
  if (!ready) {
    ready = Promise.all([
      q`CREATE TABLE IF NOT EXISTS cde_land (
        day date NOT NULL, page text NOT NULL, src text NOT NULL,
        lang text NOT NULL DEFAULT 'en', n bigint NOT NULL DEFAULT 0,
        PRIMARY KEY (day, page, src, lang))`,
      q`CREATE TABLE IF NOT EXISTS cde_learn (
        day date NOT NULL, ev text NOT NULL, item text NOT NULL,
        lang text NOT NULL DEFAULT 'en', n bigint NOT NULL DEFAULT 0,
        PRIMARY KEY (day, ev, item, lang))`,
    ]).catch((err) => { ready = null; throw err; }); // don't cache a failed init — it would drop every event until the next cold start
  }
  return q;
}

export default async function handler(req, res) {
  try {
    if (req.method === 'POST') {
      let body = req.body;
      if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
      const { g, s, batch } = body || {};
      // Interface language of the session (multilang WS4) — validated, defaults 'en'
      const l = LANGS_OK.has(body?.l) ? body.l : 'en';
      // Learning-event batch: [{e, i}, ...] (≤30 per beacon, whitelisted kinds)
      if (Array.isArray(batch)) {
        const events = batch
          .filter(x => x && LEARN_EVS.has(x.e) && typeof x.i === 'string' && ITEM_RE.test(x.i))
          .slice(0, 30);
        const q = sql();
        if (q && events.length > 0) {
          await ready;
          // Collapse duplicates client-side batches may contain
          const tally = new Map();
          for (const { e, i } of events) {
            const k = e + '\u0000' + i;
            tally.set(k, (tally.get(k) || 0) + 1);
          }
          for (const [k, n] of tally) {
            const [e, i] = k.split('\u0000');
            await q`INSERT INTO cde_learn (day, ev, item, lang, n) VALUES (CURRENT_DATE, ${e}, ${i}, ${l}, ${n})
                    ON CONFLICT (day, ev, item, lang) DO UPDATE SET n = cde_learn.n + ${n}`;
          }
        }
        return res.status(204).end();
      }
      if (!PAGES.has(g) || !SRCS.has(s)) return res.status(204).end();
      const q = sql();
      if (q) {
        await ready;
        await q`INSERT INTO cde_land (day, page, src, lang, n) VALUES (CURRENT_DATE, ${g}, ${s}, ${l}, 1)
                ON CONFLICT (day, page, src, lang) DO UPDATE SET n = cde_land.n + 1`;
      }
      return res.status(204).end();
    }
    if (req.method === 'GET') {
      const token = process.env.LAND_REPORT_TOKEN;
      if (!token || req.query.key !== token) return res.status(403).json({ error: 'forbidden' });
      const days = Math.min(365, Math.max(1, Number(req.query.days) || 30));
      const q = sql();
      if (!q) return res.status(200).json({ days, rows: [], note: 'no database configured' });
      try {
        await ready;
        const rows = await q`SELECT day, page, src, lang, sum(n)::int AS n FROM cde_land
          WHERE day >= CURRENT_DATE - ${days}::int GROUP BY day, page, src, lang ORDER BY day DESC`;
        return res.status(200).json({ days, rows });
      } catch (err) {
        logFail('report read', err);
        return res.status(503).json({ error: 'database read failed', cause: failCause(err) });
      }
    }
    return res.status(405).end();
  } catch (err) {
    logFail(req.method === 'POST' ? 'beacon write' : 'request', err);
    return res.status(204).end(); // a beacon endpoint must never surface an error
  }
}
