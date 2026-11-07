#!/usr/bin/env node
// RECURRING errors-check as a script (cost plan, owner 11-07): groups Vercel runtime error-level log lines from the last
// 12 h (all the Pro plan keeps) by route + first message line. Prints one line per class, or "0 errors". Read-only.
//   node scripts/errors-check.mjs      (npm run errors)
import { execFileSync } from 'node:child_process';
const TEAM = 'team_cZbruHxXnt65pojCL5oha3Gq', PROJECT = 'prj_bAPAFiJ3pTbmbJkPOYPj6i8xyioc';
let out = '';
try {
  out = execFileSync('vercel', ['logs', '--scope', TEAM, '--project', PROJECT, '--since', '12h', '--query', 'level:error', '--limit', '200'],
    { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 64 * 1024 * 1024 });
} catch (e) { out = e.stdout || ''; }
const groups = new Map();
for (const line of out.split('\n')) {
  let r; try { r = JSON.parse(line); } catch { continue; }
  if (r.type !== 'log' || !r.data) continue;
  const msg = String(r.data.message || '').split('\n')[0].replace(/\(node:\d+\)/, '(node)').slice(0, 140);
  const key = `${r.data.requestPath || r.data.path || '?'} — ${msg}`;
  groups.set(key, (groups.get(key) || 0) + 1);
}
// Known-harmless: Vercel's own Node wrapper warns about url.parse() (not our code; seen on /api/live since 11-04).
const known = [/DEP0169/];
const real = [...groups].filter(([k]) => !known.some((re) => re.test(k)));
const ignored = groups.size - real.length;
console.log(real.length ? `errors (12 h): ${real.length} class(es)` + (ignored ? ` · ${ignored} known-harmless ignored` : '') : `errors (12 h): 0${ignored ? ` (${ignored} known-harmless class ignored)` : ''}`);
for (const [k, n] of real.sort((a, b) => b[1] - a[1]).slice(0, 10)) console.log(`  ${n}× ${k}`);
process.exit(real.length ? 1 : 0);   // due.mjs --run-scripts: exit 0 = ok
