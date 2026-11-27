#!/usr/bin/env node
// Ladder-next split by DEVICE (src/utils/ladderArm.js, kit arm-bit salt 'ladder', 11-27): counts rows for the kit read
// ledger (`reads.mjs cde verdict --counts=<file>`, split visitor-arm → a post-only A/B). Same row shape as counts.mjs:
//   {unit, day, arm, phase, n, k}
//   unit  = the interface language (en | he | es | ar), so the read can pool or split by language
//   arm   = 0 control (main's ladder) | 1 treatment (ladder-next), from the ~0 / ~1 item suffix
//   n     = devices that started their first set that day  (cyd @ start1~a)
//   k     = the metric that day: done1 = devices finishing their first set (cyd @ done1~a, default)
//                                start2 = devices starting a set after finishing one (cyd @ start2~a)
//                                done   = every set finish (cyc_done @ <token>~a), not one per device
//   phase = post (a visitor-arm read is randomised, no pre window)
// A device's finish can fall on a later day than its start, so a day's k may exceed its n: pool the window (reads.mjs
// does) instead of reading single days. Uncounted devices (crawlers, owner, blocked storage) send no suffix: not here.
//   CDE_DATABASE_URL="$(neonctl connection-string --project-id delicate-hat-45485476)" \
//     node tools/reads/ladder-arm-counts.mjs --since=YYYY-MM-DD [--metric=done1|start2|done] [--out=file]
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

export const METRICS = ['done1', 'start2', 'done'];
const ARMED = /^(.*)~([01])$/;

// tallies: [{day, ev, item, lang, n}] → rows (one per day × language × arm)
export function toArmRows(tallies, { metric = 'done1' } = {}) {
  const by = new Map();
  for (const t of tallies) {
    const m = ARMED.exec(t.item || '');
    if (!m) continue;
    const [, base, armS] = m;
    const isN = t.ev === 'cyd' && base === 'start1';
    const isK = metric === 'done' ? t.ev === 'cyc_done' : t.ev === 'cyd' && base === metric;
    if (!isN && !isK) continue;
    const arm = Number(armS);
    const key = `${t.day}|${t.lang}|${arm}`;
    const r = by.get(key) || { unit: t.lang || 'en', day: t.day, arm, phase: 'post', n: 0, k: 0 };
    if (isN) r.n += t.n;
    if (isK) r.k += t.n;
    by.set(key, r);
  }
  return [...by.values()].sort((a, b) => a.day.localeCompare(b.day) || a.unit.localeCompare(b.unit) || a.arm - b.arm);
}

// per-arm totals of every tally the read talks about (stderr summary)
export function armTotals(tallies) {
  const out = { 0: {}, 1: {} };
  for (const t of tallies) {
    const m = ARMED.exec(t.item || '');
    if (!m) continue;
    const name = t.ev === 'cyd' ? m[1] : t.ev;
    out[m[2]][name] = (out[m[2]][name] || 0) + t.n;
  }
  return out;
}

async function main(argv) {
  const arg = (k) => { const a = argv.find((x) => x.startsWith(`--${k}=`)); return a ? a.slice(k.length + 3) : null; };
  const since = arg('since'), metric = arg('metric') || 'done1';
  if (!since || !/^\d{4}-\d{2}-\d{2}$/.test(since)) { console.error('ladder-arm-counts: need --since=YYYY-MM-DD (the ship day)'); return 2; }
  if (!METRICS.includes(metric)) { console.error(`ladder-arm-counts: --metric must be one of ${METRICS.join('|')}`); return 2; }
  const url = process.env.CDE_DATABASE_URL;
  if (!url) { console.error('ladder-arm-counts: set CDE_DATABASE_URL (neonctl connection-string --project-id delicate-hat-45485476)'); return 2; }
  const { neon } = await import('@neondatabase/serverless');
  const q = neon(url);
  const tallies = await q.query(`SELECT to_char(day, 'YYYY-MM-DD') AS day, ev, item, lang, sum(n)::int AS n FROM cde_learn
    WHERE day >= $1::date AND day < CURRENT_DATE AND ev IN ('cyd', 'cyc_start', 'cyc_stage', 'cyc_done') AND item ~ '~[01]$'
    GROUP BY day, ev, item, lang`, [since]);
  const rows = toArmRows(tallies, { metric });
  const out = arg('out');
  if (out) writeFileSync(out, JSON.stringify(rows, null, 1) + '\n'); else console.log(JSON.stringify(rows));
  const tot = armTotals(tallies);
  const line = (a) => ['start1', 'done1', 'start2', 'cyc_start', 'cyc_done'].map((x) => `${x} ${tot[a][x] || 0}`).join(' · ');
  console.error(`ladder-arm-counts (full days ${since}…yesterday, metric ${metric})\n  ctrl  ${line(0)}\n  treat ${line(1)}${out ? `\n  → ${out}` : ''}`);
  return 0;
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) main(process.argv.slice(2)).then((c) => { process.exitCode = c; });
