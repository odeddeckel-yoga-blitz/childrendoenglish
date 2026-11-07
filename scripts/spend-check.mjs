#!/usr/bin/env node
// RECURRING spend-check as a script (cost plan, owner 11-07): prints ~6 lines — Vercel billed cost over 30 days for this
// project and the team, by service, and Neon compute-hours for the month so far. Read-only; uses the logged-in
// `vercel` and `neonctl` CLIs (no keys in this file, nothing printed but numbers).
//   node scripts/spend-check.mjs          (npm run spend)
import { execFileSync } from 'node:child_process';

const TEAM = 'team_cZbruHxXnt65pojCL5oha3Gq', PROJECT = 'childrendoenglish', NEON = 'delicate-hat-45485476';
const BUDGET = 20; // team usage budget, USD/month (owner)
const iso = (d) => d.toISOString().slice(0, 10) + 'T00:00:00.000Z';
const to = new Date(); to.setUTCDate(to.getUTCDate() + 1);
const from = new Date(to); from.setUTCDate(from.getUTCDate() - 30);

let team = 0, mine = 0;
const svc = {};
try {
  const out = execFileSync('vercel', ['api', `/v1/billing/charges?teamId=${TEAM}&from=${iso(from)}&to=${iso(to)}`, '--method', 'GET'],
    { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 256 * 1024 * 1024 });
  for (const line of out.split('\n')) {
    let r; try { r = JSON.parse(line); } catch { continue; }
    const c = r.BilledCost || 0; team += c;
    if ((r.Tags || {}).ProjectName === PROJECT) { mine += c; svc[r.ServiceName] = (svc[r.ServiceName] || 0) + c; }
  }
  const top = Object.entries(svc).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([k, v]) => `${k} $${v.toFixed(2)}`).join(' · ');
  console.log(`Vercel 30 d: ${PROJECT} $${mine.toFixed(2)} (${top || 'no charges'}) · team $${team.toFixed(2)} of ~$${BUDGET}/mo budget${team > BUDGET ? ' ⚠ OVER' : ''}`);
} catch (e) { console.log(`Vercel: could not read billing (${String(e.message).split('\n')[0]}) — run \`vercel login\``); }

try {
  const p = JSON.parse(execFileSync('neonctl', ['projects', 'get', NEON, '--output', 'json'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }));
  const d = p.project || p;
  const start = new Date(d.consumption_period_start), days = Math.max(1, (Date.now() - start) / 864e5);
  const cuh = d.compute_time_seconds / 3600, act = d.active_time_seconds / 3600;
  console.log(`Neon ${d.name}: ${cuh.toFixed(1)} CU-h since ${d.consumption_period_start.slice(0, 10)} (~${Math.round((cuh / days) * 30)} CU-h/month pace) · active ${Math.round((100 * act) / (days * 24))}% of the time`);
} catch (e) { console.log(`Neon: could not read usage (${String(e.message).split('\n')[0]}) — run \`neonctl auth\``); }
