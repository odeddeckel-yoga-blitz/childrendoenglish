// Cookieless, no-PII aggregate landing counter (ported from kidsdomath).
// GA is consent-gated, so visitors who land from Google / an AI assistant and
// bounce before consenting are invisible — and ChatGPT is this site's largest
// external channel. Stores ONLY { day, page-class, source-class, n } tallies:
// no identifier, no IP, no device storage. Table: cde_land (shared Neon
// project with kidsdomath, separate table).
import { neon } from '@neondatabase/serverless';

const PAGES = new Set(['home', 'vocab', 'hebrew', 'flashcards', 'guide', 'app', 'other']);
const SRCS = new Set(['direct', 'seo', 'ai', 'internal', 'external']);

let ready = null;
function sql() {
  const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!url) return null;
  const q = neon(url);
  if (!ready) {
    ready = q`CREATE TABLE IF NOT EXISTS cde_land (
      day date NOT NULL, page text NOT NULL, src text NOT NULL, n bigint NOT NULL DEFAULT 0,
      PRIMARY KEY (day, page, src))`;
  }
  return q;
}

export default async function handler(req, res) {
  try {
    if (req.method === 'POST') {
      let body = req.body;
      if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
      const { g, s } = body || {};
      if (!PAGES.has(g) || !SRCS.has(s)) return res.status(204).end();
      const q = sql();
      if (q) {
        await ready;
        await q`INSERT INTO cde_land (day, page, src, n) VALUES (CURRENT_DATE, ${g}, ${s}, 1)
                ON CONFLICT (day, page, src) DO UPDATE SET n = cde_land.n + 1`;
      }
      return res.status(204).end();
    }
    if (req.method === 'GET') {
      const token = process.env.LAND_REPORT_TOKEN;
      if (!token || req.query.key !== token) return res.status(403).json({ error: 'forbidden' });
      const days = Math.min(365, Math.max(1, Number(req.query.days) || 30));
      const q = sql();
      if (!q) return res.status(200).json({ days, rows: [], note: 'no database configured' });
      await ready;
      const rows = await q`SELECT day, page, src, sum(n)::int AS n FROM cde_land
        WHERE day >= CURRENT_DATE - ${days}::int GROUP BY day, page, src ORDER BY day DESC`;
      return res.status(200).json({ days, rows });
    }
    return res.status(405).end();
  } catch {
    return res.status(204).end(); // a beacon endpoint must never surface an error
  }
}
