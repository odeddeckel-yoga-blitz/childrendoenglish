// component-clicks v1 (kit infra/kpi, 2026-11-01, All-ZC) — dead-component detection on hub/landing pages.
// Browser ESM, no dependencies, byte-identical across sites (per-site differences go through the options).
//
// What it counts, per page view: for every link / button / tab / [data-c] element on a tracked page,
//   imp = 1 if it was ≥50% visible for ≥1 s (once per page view), clk = clicks on it (capped).
// One delegated click listener + one IntersectionObserver. Nothing is sent per event: the page view's tally goes out
// in one beacon when the page is hidden, unloaded, or the SPA route changes.
//
// Privacy (land-beacon contract): no cookie, no identifier, no element text, no input values, no query strings.
// A component id is built from static structure only: data-c, else section + role + index.
// Template = which page layout this is, so pages of one family pool into one row set (per-URL counts rarely reach a
// threshold at our traffic). Template comes from [data-c-tpl] on the page, else options.templates, else a route rule.
//
// Payload handed to options.send: { cc: { t: template, r: route, i: [[id, imp, clk], …] } } (≤ maxItems per call).
// Inspect without sending: window.__componentClicks() → { active, tpl, route, inventory: [ids on the page now] }.

const CAND = 'a[href],button,[role="button"],[role="tab"],[data-c]'
const LANDMARK = 'section,nav,header,footer,aside,main'
const clean = (s, n) => String(s).toLowerCase().replace(/[^a-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, n)

export function normRoute (path) {
  let p = String(path || '/').split(/[?#]/)[0].toLowerCase()
  if (p.length > 1) p = p.replace(/\/+$/, '')
  p = p.replace(/[^a-z0-9/-]/g, '-').slice(0, 80)
  return p.startsWith('/') ? p : '/' + p
}

// Default template rule: a route with 2+ segments belongs to the family of its first segment ('/math-games/x' →
// '/math-games/*'); a one-segment route ending in -<number> pools as '…-n'; any other one-segment route is its own template. Sites override with [data-c-tpl] or options.templates.
export function templateFor (route, templates = [], doc) {
  const marked = doc && doc.querySelector && doc.querySelector('[data-c-tpl]')
  if (marked) { const t = clean(marked.getAttribute('data-c-tpl'), 40); if (t) return t }
  for (const t of templates) if (t && t.re && t.re.test(route)) return clean(t.name, 40)
  const segs = route.split('/').filter(Boolean)
  if (!segs.length) return 'home'
  if (segs.length > 1) return clean(segs[0], 36) + '/*'
  // v1.50.2: a numbered family in one segment ('/math-games-for-grade-3', '/multiplication-table-of-7') pools as '…-n'
  const num = /^(.*[a-z])-\d+$/.exec(segs[0])
  return num ? clean(num[1], 38) + '-n' : clean(segs[0], 40)
}

function roleOf (el) {
  const r = el.getAttribute('data-c-role'); if (r) return clean(r, 8)
  const aria = el.getAttribute('role')
  if (aria === 'tab') return 'tab'
  if (el.tagName === 'BUTTON' || aria === 'button') return 'btn'
  if (el.tagName === 'A' && el.querySelector('img,svg,h2,h3,h4')) return 'card'
  return 'link'
}

// Section key: [data-c-sec], else a landmark with an id, else the landmark's tag + its index among same-tag landmarks.
// Never heading text: it differs between pages of one template ("Grade 3 games" vs "Grade 4 games").
function sectionOf (el, doc) {
  const s = el.closest('[data-c-sec]'); if (s) return clean(s.getAttribute('data-c-sec'), 24) || 'sec'
  const lm = el.closest(LANDMARK)
  if (!lm) return 'body'
  if (lm.id && !/\d{3,}/.test(lm.id)) return clean(lm.id, 24) || 'sec'
  const tag = lm.tagName.toLowerCase()
  return tag + [...doc.querySelectorAll(tag)].indexOf(lm)
}

// Ids for every candidate on the page, in document order. Index = position among same section+role.
export function componentIds (doc) {
  const out = new Map(), seen = new Map()
  for (const el of doc.querySelectorAll(CAND)) {
    if (el.closest('[data-c-ignore]')) continue
    if (el.parentElement && el.parentElement.closest(CAND) && !el.hasAttribute('data-c')) continue   // count the outer card once
    let id
    const dc = el.getAttribute('data-c')
    if (dc) id = clean(dc, 60)
    else {
      const base = sectionOf(el, doc) + '.' + roleOf(el)
      const n = seen.get(base) || 0; seen.set(base, n + 1)
      id = base + n
    }
    if (id) out.set(el, id)
  }
  return out
}

export function installComponentClicks (opts = {}) {
  const w = opts.window || (typeof window !== 'undefined' ? window : null)
  if (!w || !w.document) return null
  const doc = w.document
  const exclude = opts.exclude || []
  const templates = opts.templates || []
  const minMs = opts.minVisibleMs ?? 1000
  const maxItems = opts.maxItems ?? 60
  const maxClk = opts.maxClicksPerView ?? 20
  const send = typeof opts.send === 'function' ? opts.send : null
  const blocked = () => {
    try { if (w.navigator && w.navigator.webdriver) return true } catch (e) { /* ignore */ }
    try { return !!(opts.skip && opts.skip()) } catch (e) { return true }
  }

  let route, tpl, active, ids, tally, shown, timers, io
  function begin () {
    route = normRoute(w.location.pathname)
    active = !exclude.some((re) => re.test(route))
    tpl = active ? templateFor(route, templates, doc) : ''
    ids = new Map(); tally = new Map(); shown = new WeakSet(); timers = new Map()
    if (io) io.disconnect()
    io = null
    if (active && typeof w.IntersectionObserver === 'function') {
      io = new w.IntersectionObserver(onSeen, { threshold: [0, 0.5] })
      rescan()
    }
  }
  function bump (id, k) {
    const t = tally.get(id) || [0, 0]
    if (k === 0) t[0] = 1
    else { t[0] = 1; t[1] = Math.min(maxClk, t[1] + 1) }   // a click implies it was seen
    tally.set(id, t)
  }
  function onSeen (entries) {
    for (const e of entries) {
      const el = e.target
      if (shown.has(el)) continue
      if (e.isIntersecting && e.intersectionRatio >= 0.5) {
        if (!timers.has(el)) timers.set(el, w.setTimeout(() => { timers.delete(el); shown.add(el); const id = ids.get(el); if (id) bump(id, 0); io && io.unobserve(el) }, minMs))
      } else if (timers.has(el)) { w.clearTimeout(timers.get(el)); timers.delete(el) }
    }
  }
  function rescan () {
    if (!active) return
    ids = componentIds(doc)
    if (io) for (const el of ids.keys()) if (!shown.has(el)) io.observe(el)
  }
  function flush () {
    if (!active || !tally.size) return
    const items = [...tally].map(([id, t]) => [id, t[0], t[1]])
    tally = new Map()
    if (!send || blocked()) return
    for (let i = 0; i < items.length; i += maxItems) {
      try { send({ cc: { t: tpl, r: route, i: items.slice(i, i + maxItems) } }) } catch (e) { /* never break the page */ }
    }
  }
  function onClick (e) {
    if (!active) return
    const el = e.target && e.target.closest && e.target.closest(CAND)
    if (!el) return
    let id = ids.get(el)
    if (!id) { rescan(); id = ids.get(el) }
    if (!id) { const outer = el.parentElement && el.parentElement.closest(CAND); id = outer && ids.get(outer) }
    if (id) bump(id, 1)
  }
  function checkRoute () { if (normRoute(w.location.pathname) !== route) { flush(); begin() } }

  begin()
  doc.addEventListener('click', onClick, true)
  const onVis = () => { if (doc.visibilityState === 'hidden') flush() }
  const onPop = () => w.setTimeout(checkRoute, 0)
  w.addEventListener('pagehide', flush)
  doc.addEventListener('visibilitychange', onVis)
  w.addEventListener('popstate', onPop)
  let mt = null
  const mo = typeof w.MutationObserver === 'function'
    ? new w.MutationObserver(() => { if (mt) return; mt = w.setTimeout(() => { mt = null; checkRoute(); rescan() }, 300) })
    : null
  if (mo) mo.observe(doc.body || doc.documentElement, { childList: true, subtree: true })
  const iv = w.setInterval(checkRoute, 1000)   // client-side route change that adds no DOM node yet

  const api = () => ({ active, tpl, route, inventory: active ? [...new Set(componentIds(doc).values())] : [] })
  try { w.__componentClicks = api } catch (e) { /* ignore */ }
  return { flush, inspect: api, stop () {   // full teardown (React StrictMode mounts effects twice in dev: no double counting)
    flush(); doc.removeEventListener('click', onClick, true); w.removeEventListener('pagehide', flush)
    doc.removeEventListener('visibilitychange', onVis); w.removeEventListener('popstate', onPop)
    w.clearInterval(iv); if (mt) w.clearTimeout(mt); if (mo) mo.disconnect(); if (io) io.disconnect(); active = false
  } }
}

// Site config schema (the only per-site part):
//   { endpoint: '/api/land',                        // POST target; the body is {cc:{…}} (sendBeacon, fail-quiet)
//     exclude:  [/^\/games\//],                     // leaf content pages: never tracked
//     templates: [{ name: 'grade-landing', re: /^\/math-games-for-grade\/\d+$/ }],   // optional, first match wins
//     internal: { param: 'internal', key: 'kdm_dev' } }   // ?internal=1 sets localStorage[key]='1' → never send
export function checkConfig (cfg) {
  const errs = []
  if (!cfg || typeof cfg !== 'object') return ['config must be an object']
  if (typeof cfg.endpoint !== 'string' || !cfg.endpoint.startsWith('/')) errs.push('endpoint: a same-origin path like /api/land')
  if (!Array.isArray(cfg.exclude) || !cfg.exclude.every((r) => r instanceof RegExp)) errs.push('exclude: RegExp[] of leaf routes')
  if (cfg.templates && !(Array.isArray(cfg.templates) && cfg.templates.every((t) => t && typeof t.name === 'string' && t.re instanceof RegExp))) errs.push('templates: [{name, re: RegExp}]')
  if (cfg.internal && !(typeof cfg.internal.param === 'string' && typeof cfg.internal.key === 'string')) errs.push('internal: {param, key}')
  return errs
}

export function installFromConfig (cfg, w = typeof window !== 'undefined' ? window : null) {
  if (!w || checkConfig(cfg).length) return null
  const flag = cfg.internal
  const skip = () => {
    if (!flag) return false
    try {
      if (new RegExp('[?&]' + flag.param + '=1').test(w.location.search)) w.localStorage.setItem(flag.key, '1')
      return w.localStorage.getItem(flag.key) === '1'
    } catch (e) { return false }
  }
  const send = (p) => { try { w.navigator.sendBeacon(cfg.endpoint, JSON.stringify(p)) } catch (e) { /* fail-quiet */ } }
  return installComponentClicks({ window: w, send, skip, exclude: cfg.exclude, templates: cfg.templates || [] })
}
