// component-clicks-server v1.50.1 (kit infra/kpi, 2026-11-01, All-ZC) — framework-agnostic server half.
// The site's beacon endpoint (Next route, Vercel fn, Express…) calls parseComponentBeacon(body, userAgent) and, when
// it returns a record, store.record(rec). Postgres via any `query(text, params)` function (neon: sql.query), else memory.
// Privacy: validated static ids only (no free text), aggregate daily rows, no identifier, no IP.

export const COMPONENT_DDL = `CREATE TABLE IF NOT EXISTS component_daily (
  day date NOT NULL,
  tpl text NOT NULL,
  route text NOT NULL,
  comp text NOT NULL,
  imp integer NOT NULL DEFAULT 0,
  clk integer NOT NULL DEFAULT 0,
  PRIMARY KEY (day, tpl, route, comp)
)`

const TPL_RE = /^[a-z0-9_-]{1,40}(\/\*)?$/
const ROUTE_RE = /^\/[a-z0-9/-]{0,80}$/
const COMP_RE = /^[a-z0-9_.-]{1,60}$/
// Known automation only (v1.50.1: no generic words like 'preview'/'fetch', which real browsers and in-app webviews can carry).
export const BOT_UA = /bot\b|bot\/|crawl|spider|slurp|headlesschrome|lighthouse|pagespeed|facebookexternalhit|whatsapp\/|python-requests|python-urllib|aiohttp|\bcurl\/|\bwget\/|go-http-client|okhttp|java\/|axios\/|node-fetch|undici/i
const MAX_ITEMS = 60, MAX_CLK = 20

// body: the parsed beacon JSON. Returns { tpl, route, items: [[comp, imp, clk]] } or null (drop quietly).
export function parseComponentBeacon (body, userAgent = '') {
  const cc = body && body.cc
  if (!cc || typeof cc !== 'object') return null
  if (userAgent && BOT_UA.test(userAgent)) return null
  const { t, r, i } = cc
  if (typeof t !== 'string' || !TPL_RE.test(t) || typeof r !== 'string' || !ROUTE_RE.test(r) || !Array.isArray(i)) return null
  const m = new Map()
  for (const it of i.slice(0, MAX_ITEMS)) {
    if (!Array.isArray(it) || typeof it[0] !== 'string' || !COMP_RE.test(it[0])) continue
    const imp = it[1] === 1 ? 1 : 0
    const clk = Number.isInteger(it[2]) ? Math.max(0, Math.min(MAX_CLK, it[2])) : 0
    if (!imp && !clk) continue
    const prev = m.get(it[0]) || [0, 0]
    m.set(it[0], [Math.max(prev[0], imp, clk ? 1 : 0), Math.min(MAX_CLK, prev[1] + clk)])   // one row per id (UPSERT needs unique keys)
  }
  if (!m.size) return null
  return { tpl: t, route: r, items: [...m].map(([c, [imp, clk]]) => [c, imp, clk]) }
}

const today = () => new Date().toISOString().slice(0, 10)
const since = (days) => new Date(Date.now() - days * 86400000).toISOString().slice(0, 10)

// query(text, params) → Promise<rows>. One multi-row UPSERT per beacon.
export function pgComponentStore (query) {
  let ready = null
  // a failed DDL (cold DB, quota) must not stick: drop the cached promise so the next beacon retries (v1.50.1)
  const init = () => (ready ||= query(COMPONENT_DDL, []).catch((e) => { ready = null; throw e }))
  return {
    async record (rec, day = today()) {
      await init()
      await query(
        `INSERT INTO component_daily (day, tpl, route, comp, imp, clk)
         SELECT $1::date, $2, $3, u.c, u.i, u.k FROM unnest($4::text[], $5::int[], $6::int[]) AS u(c, i, k)
         ON CONFLICT (day, tpl, route, comp) DO UPDATE SET imp = component_daily.imp + EXCLUDED.imp, clk = component_daily.clk + EXCLUDED.clk`,
        [day, rec.tpl, rec.route, rec.items.map((x) => x[0]), rec.items.map((x) => x[1]), rec.items.map((x) => x[2])])
    },
    // Summed over the window: [{tpl, route, comp, imp, clk}] — the input of component-clicks-report.mjs.
    // v1.65 (KDM 11-08): ORDER BY tpl cut every template after the alphabet's 20,000th row (in-game 'game-*' rows filled
    // it, so 'home' and the listing pages came back empty). Now: optional template-prefix filter { only, skip } and the
    // cut drops the least-seen rows, never whole templates by name.
    async report (days = 7, { only, skip } = {}) {
      await init()
      const where = ['day >= $1::date'], params = [since(days)]
      if (only) { params.push(String(only) + '%'); where.push(`tpl LIKE $${params.length}`) }
      if (skip) { params.push(String(skip) + '%'); where.push(`tpl NOT LIKE $${params.length}`) }
      return await query(
        `SELECT tpl, route, comp, SUM(imp)::int AS imp, SUM(clk)::int AS clk FROM component_daily
         WHERE ${where.join(' AND ')} GROUP BY tpl, route, comp ORDER BY imp DESC, tpl LIMIT 20000`, params)
    },
  }
}

export function memoryComponentStore () {
  const m = new Map()
  return {
    async record (rec, day = today()) {
      for (const [c, imp, clk] of rec.items) {
        const k = [day, rec.tpl, rec.route, c].join('|')
        const t = m.get(k) || [0, 0]; t[0] += imp; t[1] += clk; m.set(k, t)
      }
    },
    async report (days = 7, { only, skip } = {}) {
      const cut = since(days), agg = new Map()
      for (const [k, [imp, clk]] of m) {
        const [day, tpl, route, comp] = k.split('|')
        if (day < cut || (only && !tpl.startsWith(only)) || (skip && tpl.startsWith(skip))) continue
        const kk = [tpl, route, comp].join('|'), t = agg.get(kk) || [0, 0]
        t[0] += imp; t[1] += clk; agg.set(kk, t)
      }
      return [...agg].map(([k, [imp, clk]]) => { const [tpl, route, comp] = k.split('|'); return { tpl, route, comp, imp, clk } })
    },
  }
}
