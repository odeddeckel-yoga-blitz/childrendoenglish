#!/usr/bin/env node
// CDE pre-push unit-lock check (kit PATTERNS §3g "lock units, not sites"; owner OK 11-11).
// A change may not touch a unit that an open read holds. CDE's pages are generated, so "touched" is judged on the
// BUILT pages: each open read keeps a snapshot of its units' fingerprints (taken when it opens) and the check
// rebuilds the fingerprints from dist/ and compares.
//   seo lane   → what a search result shows: <title>, meta description, canonical, h1, robots
//   pages lane → the page body as text (the copyright year and the daily spotlight id normalised away)
//   games lane → the game page's own files (public/games/<id>/) by content hash
// A unit is a land-beacon page key (vocabulary_word = every word page; he = /he/; games_<id> = a game page).
//   node tools/reads/locks.mjs snapshot --id=<read id>       # writes tools/reads/snap/<id>.json from dist/
//   node tools/reads/locks.mjs check [--as=<read id>]         # exit 1 when a locked unit changed (pre-push)
import { readFileSync, writeFileSync, existsSync, readdirSync, statSync, mkdirSync } from 'node:fs';
import { join, resolve, relative } from 'node:path';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { loadRead } from './counts.mjs';

const ROOT = resolve(import.meta.dirname, '../..');
const DIST = join(ROOT, 'dist'), SNAP = join(ROOT, 'tools', 'reads', 'snap');
const KIT_READS = join(process.env.HOME || '', 'projects', 'shared', 'game-kit', 'tools', 'reads.mjs');

// the page key land-beacon.js sends for a path (keep in step with public/land-beacon.js)
export function pageKey(path) {
  const seg = path.split('/').filter(Boolean);
  if (seg[0] === 'vocabulary' && seg.length === 3 && seg[2] !== 'hebrew' && seg[2] !== 'spanish') return 'vocabulary_word';
  return (seg.join('_') || 'root').toLowerCase().replace(/[^a-z0-9_-]/g, '-').slice(0, 40);
}
const matches = (units, key) => units.some((u) => (u.endsWith('*') ? key.startsWith(u.slice(0, -1)) : key === u));
const sha = (s) => createHash('sha256').update(s).digest('hex').slice(0, 16);
const pick = (html, re) => (html.match(re) || [])[1] || '';

export function fingerprint(html, lane) {
  if (lane === 'seo') return sha([/<title>([\s\S]*?)<\/title>/, /<meta name="description" content="([^"]*)"/, /<link rel="canonical" href="([^"]*)"/,
    /<h1[^>]*>([\s\S]*?)<\/h1>/, /<meta name="robots" content="([^"]*)"/].map((re) => pick(html, re).trim()).join('\u0000'));
  const body = html.replace(/^[\s\S]*?<body[^>]*>/, '').replace(/<script[\s\S]*?<\/script>/g, '').replace(/<[^>]+>/g, ' ')
    .replace(/©\s*\d{4}|&copy;\s*\d{4}/g, '©').replace(/Today’s game|Play today’s game: [^<\n]*/g, '').replace(/\s+/g, ' ').trim();
  return sha(body);
}

function htmlPages(dir, out = []) {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) htmlPages(p, out); else if (f === 'index.html') out.push(p);
  }
  return out;
}
// {unit: {path: fingerprint}} for the read's units, from dist/ (and public/games/ for the games lane)
export function unitPrints(read, dist = DIST) {
  const out = {};
  if (read.lane === 'games') {
    const gdir = join(ROOT, 'public', 'games');
    for (const id of readdirSync(gdir)) {
      const unit = `games_${id}`, d = join(gdir, id);
      if (!statSync(d).isDirectory() || !matches(read.units, unit)) continue;
      const files = readdirSync(d).filter((f) => statSync(join(d, f)).isFile()).sort();
      (out[unit] ||= {})[`/games/${id}/`] = sha(files.map((f) => f + sha(readFileSync(join(d, f)))).join('|'));
    }
    return out;
  }
  for (const file of htmlPages(dist)) {
    const path = '/' + relative(dist, file).replace(/index\.html$/, '');
    const unit = pageKey(path);
    if (!matches(read.units, unit)) continue;
    (out[unit] ||= {})[path] = fingerprint(readFileSync(file, 'utf8'), read.lane);
  }
  return out;
}
// units whose pages differ from the snapshot (a page added or gone counts as a change)
export function changedUnits(snap, now) {
  return [...new Set([...Object.keys(snap), ...Object.keys(now)])].filter((u) => {
    const a = snap[u] || {}, b = now[u] || {};
    return Object.keys({ ...a, ...b }).some((p) => a[p] !== b[p]);
  }).sort();
}

function openReads(file) {
  const ids = new Set();
  if (existsSync(file)) for (const l of readFileSync(file, 'utf8').split('\n')) { try { const r = JSON.parse(l); if (r.id) ids.add(r.id); } catch { /* skip */ } }
  // a read whose start is still ahead (scheduled, its change not shipped) holds nothing yet
  const today = new Date().toISOString().slice(0, 10);
  return [...ids].map((id) => loadRead(file, id))
    .filter((r) => r.status === 'open' && r.site === 'cde' && r.lane !== 'fix' && r.split !== 'visitor-arm' && r.start <= today);
}

function main(argv) {
  const arg = (k) => { const a = argv.find((x) => x.startsWith(`--${k}=`)); return a ? a.slice(k.length + 3) : null; };
  const cmd = argv.find((a) => !a.startsWith('--')), LEDGER = join(ROOT, 'reads.jsonl');
  if (cmd === 'snapshot') {
    const read = loadRead(LEDGER, arg('id'));
    if (!read) { console.error(`locks: no read ${arg('id')} in reads.jsonl`); return 2; }
    if (read.lane !== 'games' && !existsSync(DIST)) { console.error('locks: npm run build first (the snapshot is taken from dist/)'); return 2; }
    const prints = unitPrints(read);
    if (!Object.keys(prints).length) { console.error(`locks: none of ${read.units.join(',')} is a built page`); return 1; }
    mkdirSync(SNAP, { recursive: true });
    writeFileSync(join(SNAP, `${read.id}.json`), JSON.stringify({ id: read.id, lane: read.lane, at: new Date().toISOString(), units: prints }, null, 1) + '\n');
    console.log(`locks: ${read.id} snapshot of ${Object.keys(prints).length} unit(s), ${Object.values(prints).reduce((a, p) => a + Object.keys(p).length, 0)} page(s)`);
    return 0;
  }
  if (cmd === 'check') {
    const reads = openReads(LEDGER);
    if (!reads.length) return 0;
    if (!existsSync(DIST)) { console.error('locks: no dist/ — run the gate (npm run build) before pushing; unit locks NOT checked'); return 1; }
    const touched = [], missing = [];
    for (const r of reads) {
      const f = join(SNAP, `${r.id}.json`);
      if (!existsSync(f)) { missing.push(r.id); continue; }
      for (const u of changedUnits(JSON.parse(readFileSync(f, 'utf8')).units, unitPrints(r))) touched.push(u);
    }
    if (missing.length) console.error(`locks: open read(s) without a snapshot: ${missing.join(', ')} (node tools/reads/locks.mjs snapshot --id=…)`);
    if (!touched.length) { console.log(`locks: ${reads.length} open read(s), no locked unit changed`); return missing.length ? 1 : 0; }
    if (!existsSync(KIT_READS)) { console.error(`locks: changed locked unit(s) ${touched.join(', ')} and no kit reads.mjs at ${KIT_READS}`); return 1; }
    const as = arg('as') || process.env.CDE_READ_AS;
    const r = spawnSync(process.execPath, [KIT_READS, 'cde', 'locks', `--repo=${ROOT}`, `--check-units=${[...new Set(touched)].join(',')}`, ...(as ? [`--as=${as}`] : [])], { stdio: 'inherit' });
    return r.status ?? 1;
  }
  console.error('usage: locks.mjs snapshot --id=<read id> | check [--as=<read id>]');
  return 2;
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) process.exitCode = main(process.argv.slice(2));
