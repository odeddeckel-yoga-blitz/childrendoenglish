// Cookieless, no-PII aggregate landing counter (ported from kidsdomath).
// GA is consent-gated, so visitors who land from Google / an AI assistant and
// bounce before consenting are invisible — and ChatGPT is this site's largest
// external channel. Stores ONLY { day, page-class, source-class, n } tallies:
// no identifier, no IP, no device storage. Table: cde_land (shared Neon
// project childrendoenglish, CDE_DATABASE_URL — own project since 2026-10-17).
import { neon } from '@neondatabase/serverless';
import { parseComponentBeacon, pgComponentStore } from './_lib/component-clicks-server.mjs';

// 'teachers' is reserved (11-08): the /teachers page doesn't exist yet; land-beacon.js already classes its path.
const PAGES = new Set(['home', 'vocab', 'hebrew', 'spanish', 'games', 'tool', 'flashcards', 'guide', 'app', 'unit', 'battle', 'teachers', 'other']);
const LANGS_OK = new Set(['en', 'he', 'es', 'ar']);
const SRCS = new Set(['direct', 'seo', 'ai', 'internal', 'external']);

// Learning events (Word Learning Optimizer) — same cookieless aggregate model:
// ONLY { day, event-kind, content-item, n } tallies. The item is a WORD ID or
// mode name, never anything about the visitor. g_open = a real (non-webdriver)
// game page open per game id; g_start = a run actually started (spelling-forge); spot = a home-spotlight card click (w_<word>|g_<game>);
// ansm_ok/ansm_no = an answer split by probe (<word>@aud|img|txt) so the asset at
// fault is identifiable; wfb = explicit word feedback tap (<word>@img|aud|hard|ok);
// vis = once-per-day return bucket (new|r1|r2-7|r8-30|r31p|rpre — public/land-beacon.js);
// ansx = a wrong quiz answer's pick (<target>@<chosen word id>);
// fcr = ladder flashcards reach (c1..c10|done) — where in the deck kids leave;
// pg/cta/mq = a static page's view / click into the app or a game / first
// mini-quiz tap, item = page-path key (public/land-beacon.js) → click-to-play rate;
// onb = first-visit funnel step (create_view|create_done|q1_start|q1_done|q1_quit);
// qs = quiz start-source funnel: [new-]<menu|ladder|shared|letter|mywords|learn|again|quick|topic|other>_<start|done|quit> (useQuizFlow);
// aie/aiv = AI attribution v1 (kit land-beacon.md): item = engine (chatgpt|perplexity|copilot|
// gemini|claude|other); aie with every ai open, aiv once visible 5 s. Not opens.
// mp = Sound Pairs answer per sound contrast (<p-b|a-u|e-a|th|th-d|ee-i|v-w>_<ok|no>) — public/games/sound-pairs;
// cvc = Read It! answer per short vowel and activity (<a|i|o|u|e>_<r|h>_<ok|no>) — public/games/read-it;
// sheet = a unit-page activity sheet printed (bingo|search) — public/unit-sheets.js — or the word list copied as TSV (tsv, public/unit-practice.js);
// zv = a Word Zapper run's variant (<pics|words>-<all|animals|food|transport|things|nature>);
// rs = app result screen (UX baseline 2026-10-31): <lo|hi|quit>_<view|retry|next|nextquiz|again|more|lightning|game|menu>, lo = under 70%;
// ge = arcade end card: <game>_<view-good|view-low|next|again|menu> (public/games/end-card.js);
// ltw = Letter Twins answer per level and first letter (<bd|pb|pq|all>_<b|d|p|q>_<ok|no>) — public/games/letter-twins;
// qr = a printed sheet's QR code scanned (item = page path key, public/print-btn.js);
// bt = Class Battle use (create | start_p<1|2-5|6-15|16+> | join) — public/battle/battle.js.
// mqv/s15/prc/bpr/fmb = static-page depth (measure step 2, 11-08), item = the same page key as pg, each once per
// page view: mini-quiz >=50 % on screen while visible / visible 15 s in total / print button tapped / print dialog
// opened (beforeprint) / flashcard-maker Build tapped — public/land-beacon.js.
const LEARN_EVS = new Set(['ans_ok', 'ans_no', 'quiz_start', 'quiz_done', 'quiz_quit', 'letter', 'g_lvl', 'g_cmp', 'g_open', 'g_start', 'spot', 'ansm_ok', 'ansm_no', 'wfb', 'cyc_start', 'cyc_stage', 'cyc_done', 'vis', 'onb', 'ansx', 'fcr', 'pg', 'cta', 'mq', 'bt', 'qs', 'aie', 'aiv', 'sheet', 'mp', 'cvc', 'zv', 'b1r', 'wk', 'rq_ok', 'rq_no', 'rs', 'ge', 'qr', 'ltw', 't1', 'mm_menu', 'mm_ret', 'mm_pick', 'mm_mast', 'mm_tmast', 'mm_keep', 'mm_slip', 'pb', 'oo', 'rt', 'op', 'tf', 'fe', 'sb', 'bs', 'ss',
  // Standing optimizer sections (kit 1.59 §5.55, owner 11-04): movement between activities, page class → game,
  // returning-day start surface, script errors, phone load-speed buckets. Item shapes are pinned in EV_ITEM below.
  'g2', 'g3', 'hop', 'vp', 'rets', 'jserr', 'cwv',
  // Static-page depth (measure step 2, 11-08): item = a page key (no @), pinned in EV_ITEM.
  'mqv', 's15', 'prc', 'bpr', 'fmb',
  // Push method v2 (11-11): act = any action on a static page (once per view, item = its page key); jserrsig = a script
  // error's signature <file>_<line>_<type> (kit land-beacon.md §jserr; never message text), next to the plain jserr.
  'act', 'jserrsig']);
// distinct error signatures recorded per day; past this a NEW signature is dropped (a known one still counts)
export const JSERRSIG_DAY_CAP = 50;
const ITEM_RE = /^[a-z0-9@_-]{1,40}$/;
const AI_ATTR_RE = /^ai[ev]_(chatgpt|perplexity|copilot|gemini|claude|other)$/; // fixed engine enum (kit spec)
const SURF = '(g-[a-z0-9-]{1,30}|app|pg-[a-z]{1,12})';
const PAGE_KEY = /^[a-z0-9_-]{1,40}$/; // pg's item: the page path as a key (vocabulary_word for every word page)
const HOW = /^(ladder|menu|hub|game|app|page|ext|direct)$/;
const EV_ITEM = {
  g2: HOW, g3: HOW,
  hop: /^[a-z0-9-]{1,20}@[a-z0-9-]{1,20}$/,
  vp: /^[a-z]{1,12}$/,
  rets: new RegExp(`^${SURF}$`),
  jserr: new RegExp(`^${SURF}$`),
  cwv: new RegExp(`^(lcp|cls|inp)_(good|ni|poor)@${SURF}$`),
  ...Object.fromEntries(['mqv', 's15', 'prc', 'bpr', 'fmb', 'act'].map((e) => [e, PAGE_KEY])),
  jserrsig: /^[a-z0-9-]{1,24}_\d{1,5}_(type|ref|range|syntax|other)$/,
};

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
let ccStore = null;
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

// Class Battle promises a room is deleted ~30 min after creation, but its store
// (api/_lib/battleStore.js) only sweeps when someone touches battle. Every page
// view lands here, so an abandoned room goes with the next visitor anywhere on
// the site. Throttled per instance; a missing table (no battle yet) is fine.
let lastBattleSweep = 0;
async function sweepBattleRooms(q) {
  const now = Date.now();
  if (now - lastBattleSweep < 60_000) return;
  lastBattleSweep = now;
  try { await q`DELETE FROM cde_battle_rooms WHERE expires_at <= ${now}`; } catch { /* table not created yet */ }
}

export default async function handler(req, res) {
  try {
    if (req.method === 'POST') {
      let body = req.body;
      if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
      // Component clicks (kit infra/kpi): one page view's {cc:{t, r, i}} tally → ONE multi-row UPSERT into
      // component_daily (day, tpl, route, comp, imp, clk). Validated static ids only; bot user agents dropped.
      if (body && body.cc) {
        const rec = parseComponentBeacon(body, req.headers?.['user-agent'] || '');
        const q = rec && sql();
        if (q) {
          await ready; // sql() started the shared table init; awaiting it keeps a failure inside this try
          ccStore ||= pgComponentStore((text, params) => q.query(text, params));
          await ccStore.record(rec); // kit 1.50.1+: a failed table init is retried, not cached
        }
        return res.status(204).end();
      }
      const { g, s, batch } = body || {};
      // Interface language of the session (multilang WS4) — validated, defaults 'en'
      const l = LANGS_OK.has(body?.l) ? body.l : 'en';
      // Learning-event batch: [{e, i}, ...] (≤30 per beacon, whitelisted kinds)
      if (Array.isArray(batch)) {
        const events = batch
          .filter(x => x && LEARN_EVS.has(x.e) && typeof x.i === 'string' && ITEM_RE.test(x.i))
          .filter(x => (x.e !== 'aie' && x.e !== 'aiv') || AI_ATTR_RE.test(`${x.e}_${x.i}`))
          .filter(x => !EV_ITEM[x.e] || EV_ITEM[x.e].test(x.i))
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
            if (e === 'jserrsig') {
              const [cap] = await q`SELECT bool_or(item = ${i}) AS known, count(*)::int AS seen FROM cde_learn
                WHERE day = CURRENT_DATE AND ev = 'jserrsig'`;
              if (cap && !cap.known && cap.seen >= JSERRSIG_DAY_CAP) continue;
            }
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
        await sweepBattleRooms(q);
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
