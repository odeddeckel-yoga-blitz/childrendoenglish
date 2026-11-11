#!/usr/bin/env node
// CDE counts exporter for the kit read ledger (kit PATTERNS §3g, tools/reads.mjs; owner OK 11-11).
// Writes the rows `reads.mjs cde verdict --counts=<file>` reads: {unit, day, group, phase, n, k}.
//   unit  = a static page key (land-beacon.js: the path joined by "_", every word page = vocabulary_word)
//   n     = page views (pg) · k = the metric's tally on those views (default act = any action, once per view)
//   group = treat when the unit matches the read's units (a trailing * is a prefix), else ctrl
//   phase = pre before the read's start day, post from it
// Reads cde_learn only (aggregate tallies: no visitor, no path beyond the page key).
//   CDE_DATABASE_URL="$(neonctl connection-string --project-id delicate-hat-45485476)" \
//     node tools/reads/counts.mjs --id=<read id> [--metric=act|s15|cta|mq] [--pre-days=14] [--ctrl=vocabulary*] [--out=file]
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

// act shipped 11-11; a pre window must not reach back before its metric existed
export const METRIC_SINCE = { act: '2026-11-11', s15: '2026-11-08', cta: '2026-10-20', mq: '2026-10-20' };

export function loadRead(file, id) {
  let row = null;
  if (existsSync(file)) for (const l of readFileSync(file, 'utf8').split('\n')) {
    if (!l.trim()) continue;
    let r; try { r = JSON.parse(l); } catch { continue; }
    if (r && r.id === id) row = { ...(row || {}), ...r };
  }
  return row;
}

const matches = (units, key) => units.some((u) => (u.endsWith('*') ? key.startsWith(u.slice(0, -1)) : key === u));

// tallies: [{day: 'YYYY-MM-DD', ev, item, n}] → counts rows; ctrl = units matching `ctrl` (default every other page key)
export function toRows(tallies, read, { metric = 'act', ctrl = null } = {}) {
  const by = new Map();
  for (const t of tallies) {
    if (t.ev !== 'pg' && t.ev !== metric) continue;
    const treat = matches(read.units, t.item);
    if (!treat && ctrl && !matches(ctrl, t.item)) continue;
    const k = `${t.item}|${t.day}`;
    const r = by.get(k) || { unit: t.item, day: t.day, group: treat ? 'treat' : 'ctrl', phase: t.day < read.start ? 'pre' : 'post', n: 0, k: 0 };
    if (t.ev === 'pg') r.n += t.n; else r.k += t.n;
    by.set(k, r);
  }
  // a metric tally without a view that day (a view the day before, acted after midnight) can't be a rate: cap k at n
  return [...by.values()].filter((r) => r.n > 0).map((r) => ({ ...r, k: Math.min(r.k, r.n) }))
    .sort((a, b) => a.day.localeCompare(b.day) || a.unit.localeCompare(b.unit));
}

async function main(argv) {
  const arg = (k) => { const a = argv.find((x) => x.startsWith(`--${k}=`)); return a ? a.slice(k.length + 3) : null; };
  const id = arg('id'), metric = arg('metric') || 'act', preDays = +(arg('pre-days') || 14);
  const read = id && loadRead(join(resolve(arg('repo') || process.cwd()), 'reads.jsonl'), id);
  if (!read || !read.units) { console.error(`counts: no read ${id} in reads.jsonl`); return 2; }
  if (!METRIC_SINCE[metric]) { console.error(`counts: metric must be one of ${Object.keys(METRIC_SINCE).join('|')}`); return 2; }
  const url = process.env.CDE_DATABASE_URL;
  if (!url) { console.error('counts: set CDE_DATABASE_URL (neonctl connection-string --project-id delicate-hat-45485476)'); return 2; }
  const from = new Date(Date.parse(read.start + 'T12:00:00Z') - preDays * 864e5).toISOString().slice(0, 10);
  const since = from > METRIC_SINCE[metric] ? from : METRIC_SINCE[metric];
  const { neon } = await import('@neondatabase/serverless');
  const q = neon(url);
  const tallies = await q.query(`SELECT to_char(day, 'YYYY-MM-DD') AS day, ev, item, sum(n)::int AS n FROM cde_learn
    WHERE day >= $1::date AND day < CURRENT_DATE AND ev IN ('pg', $2) GROUP BY day, ev, item`, [since, metric]);
  const rows = toRows(tallies, read, { metric, ctrl: arg('ctrl') ? arg('ctrl').split(',') : null });
  const out = arg('out');
  if (out) writeFileSync(out, JSON.stringify(rows, null, 1) + '\n'); else console.log(JSON.stringify(rows));
  const t = (g, p) => rows.filter((r) => r.group === g && r.phase === p).reduce((a, r) => [a[0] + r.n, a[1] + r.k], [0, 0]);
  console.error(`counts ${id} (${metric}, full days ${since}…yesterday): treat pre ${t('treat', 'pre')} post ${t('treat', 'post')} · ctrl pre ${t('ctrl', 'pre')} post ${t('ctrl', 'post')} [n, k]${out ? ` → ${out}` : ''}`);
  return 0;
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) main(process.argv.slice(2)).then((c) => { process.exitCode = c; });
