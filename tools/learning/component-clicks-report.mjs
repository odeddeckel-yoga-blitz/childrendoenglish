// component-clicks-report v1 (kit infra/kpi, 2026-11-01, All-ZC) — the optimizer's "Dead components" section.
// Pure functions over aggregated rows { tpl, route, comp, imp, clk } (summed over the read window, e.g. 7 days) and an
// optional inventory { [tpl]: [comp ids present on the page] } from window.__componentClicks().
// Output is SUGGESTIONS only: every page change still needs the owner's OK.

export const DEFAULTS = { minImp: 100, bottomPct: 0.1, urlMinTplImp: 1000 }

function sumBy (rows, keyFn) {
  const m = new Map()
  for (const r of rows) {
    const k = keyFn(r)
    const t = m.get(k) || { imp: 0, clk: 0 }
    t.imp += r.imp | 0; t.clk += r.clk | 0
    m.set(k, t)
  }
  return m
}

function judge (comps, minImp, bottomPct) {
  const rated = comps.filter((c) => c.imp >= minImp).map((c) => ({ ...c, ctr: c.clk / c.imp }))
  const dead = rated.filter((c) => c.clk === 0).sort((a, b) => b.imp - a.imp)
  const live = rated.filter((c) => c.clk > 0).sort((a, b) => a.ctr - b.ctr)
  const nLow = Math.floor(rated.length * bottomPct) - dead.length   // needs ≥10 judged components to name any
  const low = nLow > 0 ? live.slice(0, nLow) : []
  return { rated: rated.length, dead, low }
}

// rows: [{tpl, route, comp, imp, clk}]; inventory: {tpl: [comp]} (optional)
export function deadComponents (rows, inventory = {}, opts = {}) {
  const { minImp, bottomPct, urlMinTplImp } = { ...DEFAULTS, ...opts }
  const byTplComp = sumBy(rows, (r) => r.tpl + '\u0000' + r.comp)
  const tpls = new Map()
  for (const [k, t] of byTplComp) {
    const [tpl, comp] = k.split('\u0000')
    if (!tpls.has(tpl)) tpls.set(tpl, [])
    tpls.get(tpl).push({ comp, ...t })
  }
  for (const tpl of Object.keys(inventory)) if (!tpls.has(tpl)) tpls.set(tpl, [])

  const out = []
  for (const [tpl, comps] of tpls) {
    const imp = comps.reduce((s, c) => s + c.imp, 0), clk = comps.reduce((s, c) => s + c.clk, 0)
    const j = judge(comps, minImp, bottomPct)
    const seen = new Set(comps.filter((c) => c.imp > 0).map((c) => c.comp))
    const neverSeen = (inventory[tpl] || []).filter((c) => !seen.has(c))
    // Per-URL drill-down only once the template has volume; a URL row still needs minImp per component.
    let urls = []
    if (imp >= urlMinTplImp) {
      const byUrl = sumBy(rows.filter((r) => r.tpl === tpl), (r) => r.route + '\u0000' + r.comp)
      const perRoute = new Map()
      for (const [k, t] of byUrl) {
        const [route, comp] = k.split('\u0000')
        if (!perRoute.has(route)) perRoute.set(route, [])
        perRoute.get(route).push({ comp, ...t })
      }
      urls = [...perRoute].map(([route, cs]) => ({ route, ...judge(cs, minImp, bottomPct) })).filter((u) => u.dead.length || u.low.length)
    }
    out.push({ tpl, imp, clk, rated: j.rated, dead: j.dead, low: j.low, neverSeen, urls })
  }
  return out.sort((a, b) => b.imp - a.imp)
}

export function suggest (kind) {
  if (kind === 'dead') return 'seen often, never clicked: reword it, or remove it if nothing depends on it'
  if (kind === 'low') return 'clicked far less than its neighbours: reword it or move it up'
  return 'on the page but never seen: a placement problem, not appeal; move it up or drop it'
}

export function formatReport (res, { days = 7, maxPerList = 8 } = {}) {
  const L = [`Dead components (last ${days} d; ≥${DEFAULTS.minImp} impressions to be judged; suggestions only, every page change needs the owner's OK)`]
  if (!res.length) { L.push('  no component data yet'); return L.join('\n') }
  for (const t of res) {
    L.push(`  ${t.tpl}: ${t.imp} impressions, ${t.clk} clicks, ${t.rated} components judged`)
    for (const c of t.dead.slice(0, maxPerList)) L.push(`    ✗ dead   ${c.comp} (${c.imp} imp, 0 clicks) → ${suggest('dead')}`)
    for (const c of t.low.slice(0, maxPerList)) L.push(`    ↓ low    ${c.comp} (${c.imp} imp, ${(100 * c.ctr).toFixed(1)}% CTR) → ${suggest('low')}`)
    if (t.neverSeen.length) L.push(`    ∅ never seen (${t.neverSeen.length}): ${t.neverSeen.slice(0, maxPerList).join(', ')}${t.neverSeen.length > maxPerList ? ', …' : ''} → ${suggest('never')}`)
    for (const u of t.urls.slice(0, 5)) L.push(`      url ${u.route}: ${u.dead.length} dead, ${u.low.length} low`)
  }
  return L.join('\n')
}
