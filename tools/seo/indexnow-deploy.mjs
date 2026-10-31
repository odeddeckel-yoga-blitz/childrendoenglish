#!/usr/bin/env node
// indexnow-deploy.mjs — ping IndexNow (Bing, Yandex, Seznam, Naver…) with the URLs a
// PRODUCTION deploy actually changed. Node >= 18, zero dependencies. Syncable kit code:
// per-site differences go through flags/env, never edits. Roadmap item R2X3.
//
// WHY: Bing is KDM's largest search referrer, and IndexNow is how you tell it a page changed.
// But Bing flagged "avoid batch mode" on yoga-bits, so this sends a SMALL per-deploy list of
// genuinely changed pages, never a whole-sitemap dump. Google ignores IndexNow (Google pushes stay
// in push-index.py / optimizer.mjs --push-unindexed).
//
// GUARDRAILS (owner-required):
//   1. Production only: sends only when VERCEL_ENV==='production' (or INDEXNOW_DEPLOY_ENV=production,
//      or --production for a local post-deploy hook). Otherwise it's a no-op and exits 0.
//   2. Real content changes only: build churn (sw.js, version.json, hashed assets, source maps,
//      _next/static, lockfiles, the key file itself, non-page URLs) is filtered out.
//   3. Shared append-only log (index-pushes.jsonl, {ts, site, url, engine, status}). A URL that was
//      successfully pushed (HTTP 200/202) to the same engine within 14 days is skipped.
//   4. Per-deploy cap (default 50). Overflow is logged as status "capped" and NOT sent.
//   5. Every response is logged (one line per URL, with the HTTP status of its POST).
//   6. Not batch mode: one small POST per deploy. If the change set looks like a whole-sitemap
//      dump (>= 80% of the new sitemap AND more than the cap), the whole send is refused and logged
//      "refused-bulk".
//
// KEY FILE: the IndexNow key is PUBLIC by design. It's served at https://<host>/<key>.txt and its
// content must equal the key. This script reads it from the site's key file (--key-file, or the
// single 32-hex *.txt in --key-dir, default ./public), checks that the content matches the
// filename, and sends keyLocation=https://<host>/<key>.txt. It reads no other env secrets and never
// prints env values. It only prints a masked key prefix.
//
// INPUTS (choose one; they are combined if several are given):
//   --urls a,b,c | positional URLs | --urls-file f (one per line; '-' = stdin)
//   --sitemap-old old.xml --sitemap-new new.xml   (added URLs + URLs whose <lastmod> changed;
//        if most existing URLs changed lastmod at once, that's build-stamping, so only added URLs count)
//   --git-range A..B --map ./seo-url-map.mjs      (git diff --name-only, mapped to URLs by a
//        site-supplied module: export default (file) => string | string[] | null; it may also
//        export `ignore` = RegExp[] for extra site churn)
//
// OTHER FLAGS: --site https://kidsdomath.com (or INDEXNOW_SITE / SITE_URL) · --log path (or
//   INDEXNOW_LOG; default ./index-pushes.jsonl) · --cap 50 · --dedupe-days 14 · --dry-run
//   (prints the plan, writes nothing, sends nothing; works outside production) · --production
//
// Exit codes: 0 = sent / no-op / dry-run · 1 = bad input or config · 2 = IndexNow returned non-2xx.

import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { pathToFileURL } from 'node:url'

export const ENDPOINT = 'https://api.indexnow.org/indexnow'
export const ENGINE = 'indexnow' // api.indexnow.org fans out to every participating engine
export const DEFAULT_CAP = 50
export const DEFAULT_DEDUPE_DAYS = 14
export const SUCCESS = new Set([200, 202])
const DAY_MS = 86_400_000

// ---- churn filter ---------------------------------------------------------------------------
// Applied to repo file paths (git mode) AND to URLs. A match means build churn, not content.
export const CHURN_PATTERNS = [
  /(^|\/)sw\.js$/, /(^|\/)service-worker\.js$/, /(^|\/)workbox-[^/]*\.js$/,
  /(^|\/)version\.json$/, /(^|\/)build-info\.json$/, /(^|\/)manifest\.(json|webmanifest)$/,
  /\.map$/, /(^|\/)_next\/static\//, /(^|\/)\.next\//, /(^|\/)node_modules\//,
  /(^|\/)(package-lock\.json|pnpm-lock\.yaml|yarn\.lock)$/,
  /[.-][0-9a-f]{8,}\.(js|mjs|css|woff2?|png|jpe?g|webp|avif|svg)$/i, // hashed asset
  /(^|\/)[0-9a-f]{32}\.txt$/i, // the IndexNow key file itself
  /(^|\/)(sitemap[^/]*\.xml|robots\.txt|llms(-full)?\.txt)$/, // crawler plumbing, not pages
]
// URLs that are not pages (assets, data) are never pushed.
const NON_PAGE_EXT = /\.(js|mjs|cjs|css|json|map|txt|xml|png|jpe?g|gif|webp|avif|svg|ico|woff2?|ttf|mp3|mp4|wav|ogg|webm|pdf|zip)$/i

export function isChurn (pathOrUrl, extra = []) {
  let p = String(pathOrUrl)
  try { if (/^https?:\/\//.test(p)) p = new URL(p).pathname } catch {}
  return [...CHURN_PATTERNS, ...extra].some((re) => re.test(p))
}

export function normalizeUrl (u) {
  try {
    const x = new URL(String(u).trim())
    x.hash = ''
    return x.toString()
  } catch { return null }
}

// Keep only well-formed, same-host, page-like, non-churn URLs; de-duplicate, keep order.
export function cleanUrls (urls, host, extraIgnore = []) {
  const out = []; const seen = new Set(); const dropped = []
  for (const raw of urls) {
    const u = normalizeUrl(raw)
    if (!u) { dropped.push([raw, 'malformed']); continue }
    const x = new URL(u)
    if (host && x.host !== host) { dropped.push([u, 'off-host']); continue }
    if (NON_PAGE_EXT.test(x.pathname)) { dropped.push([u, 'not-a-page']); continue }
    if (isChurn(u, extraIgnore)) { dropped.push([u, 'churn']); continue }
    if (seen.has(u)) continue
    seen.add(u); out.push(u)
  }
  return { urls: out, dropped }
}

// ---- log + dedupe ---------------------------------------------------------------------------
// Tolerant reader: skips blank/garbage lines and rows without {url, ts} (e.g. KDM's older
// {date, ids} Google-push rows in tools/engagement/index-pushes.jsonl).
export function readLog (logPath) {
  let text = ''
  try { text = fs.readFileSync(logPath, 'utf8') } catch { return [] }
  const rows = []
  for (const line of text.split('\n')) {
    if (!line.trim()) continue
    try { const r = JSON.parse(line); if (r && r.url && r.ts) rows.push(r) } catch {}
  }
  return rows
}

// URLs successfully pushed to `engine` within `days` of `now`.
export function recentlyPushed (rows, { engine = ENGINE, days = DEFAULT_DEDUPE_DAYS, now = Date.now() } = {}) {
  const cutoff = now - days * DAY_MS
  const set = new Set()
  for (const r of rows) {
    if ((r.engine || ENGINE) !== engine) continue
    if (!SUCCESS.has(Number(r.status))) continue
    const t = Date.parse(r.ts)
    if (Number.isFinite(t) && t >= cutoff && t <= now + DAY_MS) set.add(normalizeUrl(r.url))
  }
  return set
}

// Split candidate URLs into what is sent, what dedupe skips, and what the cap holds back.
export function plan (urls, rows, { cap = DEFAULT_CAP, days = DEFAULT_DEDUPE_DAYS, engine = ENGINE, now = Date.now() } = {}) {
  const recent = recentlyPushed(rows, { engine, days, now })
  const fresh = []; const deduped = []
  for (const u of urls) (recent.has(u) ? deduped : fresh).push(u)
  const n = Math.max(0, Math.floor(cap))
  return { send: fresh.slice(0, n), capped: fresh.slice(n), deduped }
}

export function logRows (rows, logPath) {
  if (!rows.length) return
  fs.mkdirSync(path.dirname(path.resolve(logPath)), { recursive: true })
  // one appendFileSync per run (O_APPEND) so concurrent sites sharing the file don't interleave lines
  fs.appendFileSync(logPath, rows.map((r) => JSON.stringify(r)).join('\n') + '\n')
}

// ---- change detection -----------------------------------------------------------------------
export function parseSitemap (xml) {
  const map = new Map()
  for (const m of String(xml).matchAll(/<url>([\s\S]*?)<\/url>/g)) {
    const loc = /<loc>\s*([^<\s]+)\s*<\/loc>/.exec(m[1])?.[1]
    if (!loc) continue
    const lastmod = /<lastmod>\s*([^<\s]+)\s*<\/lastmod>/.exec(m[1])?.[1] || ''
    map.set(normalizeUrl(loc.replace(/&amp;/g, '&')) || loc, lastmod)
  }
  return map
}

export function diffSitemaps (oldXml, newXml, { churnRatio = 0.5 } = {}) {
  const a = parseSitemap(oldXml); const b = parseSitemap(newXml)
  const added = []; const modified = []
  for (const [u, lm] of b) {
    if (!a.has(u)) added.push(u)
    else if (lm && lm !== a.get(u)) modified.push(u)
  }
  const shared = [...b.keys()].filter((u) => a.has(u)).length
  const stamped = shared > 0 && modified.length / shared > churnRatio
  return { urls: stamped ? added : [...added, ...modified], added, modified, stamped, total: b.size }
}

export function gitChangedFiles (range, cwd = process.cwd()) {
  const out = execFileSync('git', ['diff', '--name-only', '--diff-filter=AMR', range], { cwd, encoding: 'utf8' })
  return out.split('\n').map((s) => s.trim()).filter(Boolean)
}

export function filesToUrls (files, mapFn, extraIgnore = []) {
  const urls = []
  for (const f of files) {
    if (isChurn(f, extraIgnore)) continue
    const r = mapFn(f)
    if (!r) continue
    for (const u of [].concat(r)) if (u) urls.push(u)
  }
  return urls
}

// ---- key ------------------------------------------------------------------------------------
export function readKey ({ keyFile, keyDir = 'public' } = {}) {
  let file = keyFile
  if (!file) {
    let names = []
    try { names = fs.readdirSync(keyDir).filter((n) => /^[0-9a-f]{32}\.txt$/i.test(n)) } catch {}
    if (names.length !== 1) throw new Error(names.length ? `several key files in ${keyDir}; pass --key-file` : `no 32-hex IndexNow key file in ${keyDir}`)
    file = path.join(keyDir, names[0])
  }
  const key = path.basename(file, '.txt')
  const content = fs.readFileSync(file, 'utf8').trim()
  if (!/^[A-Za-z0-9-]{8,128}$/.test(key)) throw new Error('key file name is not a valid IndexNow key')
  if (content !== key) throw new Error('key file content does not match its file name (IndexNow requires it to)')
  return key
}

export function isProduction (env = process.env, flags = {}) {
  return env.VERCEL_ENV === 'production' || env.INDEXNOW_DEPLOY_ENV === 'production' || !!flags.production
}

// ---- CLI ------------------------------------------------------------------------------------
function parseArgs (argv) {
  const f = { _: [] }
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (!a.startsWith('--')) { f._.push(a); continue }
    const [k, v] = a.slice(2).split('=', 2)
    if (['dry-run', 'production', 'help'].includes(k)) { f[k] = true; continue }
    f[k] = v ?? argv[++i]
  }
  return f
}

async function main () {
  const f = parseArgs(process.argv.slice(2))
  if (f.help) { console.log(fs.readFileSync(new URL(import.meta.url), 'utf8').split('\nimport ')[0]); return 0 }
  const dry = !!f['dry-run']
  const prod = isProduction(process.env, f)
  if (!prod && !dry) { console.log('indexnow-deploy: not a production deploy, no-op'); return 0 }

  const siteArg = f.site || process.env.INDEXNOW_SITE || process.env.SITE_URL
  if (!siteArg) { console.error('indexnow-deploy: --site (or INDEXNOW_SITE) required'); return 1 }
  const site = new URL(/^https?:\/\//.test(siteArg) ? siteArg : `https://${siteArg}`)
  const host = site.host
  const cap = f.cap != null ? Number(f.cap) : DEFAULT_CAP
  const days = f['dedupe-days'] != null ? Number(f['dedupe-days']) : DEFAULT_DEDUPE_DAYS
  const logPath = f.log || process.env.INDEXNOW_LOG || 'index-pushes.jsonl'

  // gather candidates
  let raw = [...f._]; let extraIgnore = []; let sitemapTotal = 0
  if (f.urls) raw.push(...String(f.urls).split(','))
  if (f['urls-file']) raw.push(...fs.readFileSync(f['urls-file'] === '-' ? 0 : f['urls-file'], 'utf8').split('\n'))
  if (f['sitemap-old'] || f['sitemap-new']) {
    const d = diffSitemaps(fs.readFileSync(f['sitemap-old'], 'utf8'), fs.readFileSync(f['sitemap-new'], 'utf8'))
    sitemapTotal = d.total
    if (d.stamped) console.log(`sitemap: ${d.modified.length} lastmod changes look build-stamped; using ${d.added.length} added URL(s) only`)
    raw.push(...d.urls)
  }
  if (f['git-range']) {
    if (!f.map) { console.error('indexnow-deploy: --git-range needs --map <module>'); return 1 }
    const mod = await import(pathToFileURL(path.resolve(f.map)).href)
    extraIgnore = mod.ignore || []
    raw.push(...filesToUrls(gitChangedFiles(f['git-range']), mod.default, extraIgnore))
  }
  raw = raw.map((s) => String(s).trim()).filter(Boolean)

  const { urls, dropped } = cleanUrls(raw, host, extraIgnore)
  for (const [u, why] of dropped.slice(0, 10)) console.log(`  drop (${why}): ${u}`)
  if (dropped.length > 10) console.log(`  … ${dropped.length - 10} more dropped`)

  const rows = readLog(logPath)
  const p = plan(urls, rows, { cap, days })
  const ts = new Date().toISOString()
  const siteName = host
  const deploy = process.env.VERCEL_DEPLOYMENT_ID || process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 12) || undefined
  const row = (url, status, extra = {}) => ({ ts, site: siteName, url, engine: ENGINE, status, ...(deploy ? { deploy } : {}), ...extra })

  console.log(`indexnow-deploy ${host}: ${urls.length} changed page(s) · ${p.deduped.length} pushed <${days}d ago · ${p.send.length} to send · ${p.capped.length} over cap ${cap}${dry ? ' · DRY RUN' : ''}${prod ? '' : ' · (not production)'}`)
  for (const u of p.send) console.log(`  send: ${u}`)
  for (const u of p.capped) console.log(`  capped: ${u}`)

  // whole-sitemap-dump guard (Bing: "avoid batch mode")
  const bulk = sitemapTotal > 0 && urls.length > cap && urls.length >= 0.8 * sitemapTotal
  if (bulk) {
    console.log(`REFUSED: ${urls.length}/${sitemapTotal} sitemap URLs changed at once; that's a sitemap dump, not a deploy delta. Nothing sent.`)
    if (!dry) logRows(urls.map((u) => row(u, 'refused-bulk')), logPath)
    return 0
  }
  if (dry) return 0
  if (!p.send.length) { logRows(p.capped.map((u) => row(u, 'capped')), logPath); console.log('nothing to send'); return 0 }

  let key
  try { key = readKey({ keyFile: f['key-file'], keyDir: f['key-dir'] || process.env.INDEXNOW_KEY_DIR || 'public' }) } catch (e) {
    console.error('indexnow-deploy: ' + e.message); return 1
  }
  const body = { host, key, keyLocation: `${site.protocol}//${host}/${key}.txt`, urlList: p.send }
  console.log(`POST ${ENDPOINT} key=${key.slice(0, 4)}… urls=${p.send.length}`)
  let status; let note
  try {
    const r = await fetch(ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json; charset=utf-8' }, body: JSON.stringify(body), signal: AbortSignal.timeout(30_000) })
    status = r.status
    note = (await r.text().catch(() => '')).slice(0, 200) || undefined
  } catch (e) { status = 'error'; note = String(e.message || e).slice(0, 200) }
  console.log(`IndexNow response: ${status}${note ? ' ' + note : ''}`)
  logRows([...p.send.map((u) => row(u, status, note ? { note } : {})), ...p.capped.map((u) => row(u, 'capped'))], logPath)
  return SUCCESS.has(status) ? 0 : 2
}

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
  main().then((c) => process.exit(c), (e) => { console.error('indexnow-deploy:', e.message); process.exit(1) })
}
