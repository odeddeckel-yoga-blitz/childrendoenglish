#!/usr/bin/env node
// RECURRING spotlight-review (kit recurring.json, owner GO 11-07 via Factory; KDM's gotd-judged for CDE): did yesterday's
// home "Today's picks" get played and finished, and is either pick weak enough to need a fix? Also checks that the
// deployed card shows the committed pick (11-07: the build had silently swapped the game to Word Zapper).
//   CDE_DATABASE_URL="$(neonctl connection-string --project-id delicate-hat-45485476)" node scripts/spotlight-review.mjs [--no-live]
// Read-only. Exit 1 when a pick is flagged (due.mjs --run-scripts reads exit 0 as ok).
import { execFileSync } from 'node:child_process';
import { neon } from '@neondatabase/serverless';

const url = process.env.CDE_DATABASE_URL;
if (!url) { console.log('spotlight-review: set CDE_DATABASE_URL (see header)'); process.exit(2); }
const q = neon(url);
const spot = JSON.parse(execFileSync('git', ['show', 'origin/main:src/data/spotlight.json'], { encoding: 'utf8' }));
const flags = [];
const days = (iso) => Math.max(0, (Date.now() - Date.parse(iso)) / 864e5);
const pct = (a, b) => (b ? `${Math.round((100 * a) / b)}%` : '—');

const counts = async (evs, items, since) => {
  const rows = await q`SELECT (day = CURRENT_DATE - 1) AS y, ev, item, sum(n)::int AS n FROM cde_learn
    WHERE day >= ${since.slice(0, 10)}::date AND day < CURRENT_DATE AND ev = ANY(${evs}) AND item = ANY(${items}) GROUP BY 1, 2, 3`;
  const get = (ev, item, yOnly) => rows.filter((r) => r.ev === ev && r.item === item && (!yOnly || r.y)).reduce((a, r) => a + r.n, 0);
  return get;
};

const w = spot.word, g = spot.game;
if (w) {
  const c = await counts(['spot', 'ans_ok', 'ans_no', 'ansm_ok', 'ansm_no'], [`w_${w.id}`, w.id, `${w.id}@aud`, `${w.id}@img`, `${w.id}@txt`], w.since);
  const ans = c('ans_ok', w.id) + c('ans_no', w.id), ok = c('ans_ok', w.id);
  const yAns = c('ans_ok', w.id, true) + c('ans_no', w.id, true);
  const probes = ['aud', 'img', 'txt'].map((p) => { const o = c('ansm_ok', `${w.id}@${p}`), n = o + c('ansm_no', `${w.id}@${p}`); return n ? `${p} ${pct(o, n)} of ${n}` : null; }).filter(Boolean);
  const d = days(w.since);
  console.log(`word ${w.id} · ${d.toFixed(1)} d up · yesterday ${c('spot', `w_${w.id}`, true)} card taps, ${yAns} answers · since up: ${c('spot', `w_${w.id}`)} taps, ${ans} answers, ${pct(ok, ans)} right${probes.length ? ` (${probes.join(', ')})` : ''}`);
  if (ans >= 10 && ok / ans < 0.6) flags.push(`word ${w.id}: ${pct(ok, ans)} right over ${ans} — check its image/audio (weakest probe above), then word-image-improver / render-word-audio`);
  if (d >= 3 && ans / d < 2) flags.push(`word ${w.id}: ${(ans / d).toFixed(1)} answers/day after ${d.toFixed(0)} d — the card isn't moving it`);
}
if (g) {
  const c = await counts(['spot', 'g_open', 'g_start', 'g_lvl', 'g_cmp'], [`g_${g.id}`, g.id], g.since);
  const opens = c('g_open', g.id), lvl = c('g_lvl', g.id), cmp = c('g_cmp', g.id);
  const d = days(g.since);
  console.log(`game ${g.id} · ${d.toFixed(1)} d up · yesterday ${c('spot', `g_${g.id}`, true)} card taps, ${c('g_open', g.id, true)} opens, ${c('g_cmp', g.id, true)} finished · since up: ${c('spot', `g_${g.id}`)} taps, ${opens} opens, ${lvl} level-ups (${opens ? (lvl / opens).toFixed(1) : '—'}/open), ${cmp} finished (${pct(cmp, opens)})`);
  if (opens >= 10 && lvl / opens < 1) flags.push(`game ${g.id}: ${(lvl / opens).toFixed(1)} level-ups per open — players stall in level 1 → /review-game`);
  if (opens >= 20 && cmp / opens < 0.05) flags.push(`game ${g.id}: ${pct(cmp, opens)} of opens finish a run → check the run length / end condition`);
}

if (!process.argv.includes('--no-live')) {
  try {
    const { chromium } = await import('playwright');
    const b = await chromium.launch(); const p = await b.newPage();
    await p.addInitScript(() => localStorage.setItem('childrendoenglish-players', JSON.stringify({ activePlayerId: 'p1', players: [{ id: 'p1', name: 'Kid', avatar: '🦊' }] })));
    await p.route('**/api/**', (r) => r.fulfill({ status: 204 }));
    await p.goto('https://childrendoenglish.com/app?internal=1', { waitUntil: 'networkidle' });
    const liveGame = (await p.getAttribute('[data-spot="game"]', 'href').catch(() => '')) || '';
    await b.close();
    if (g && !liveGame.includes(`/games/${g.id}/`)) flags.push(`DRIFT: the live card links ${liveGame || 'nothing'}, the committed pick is ${g.id} (the build re-decided the pick?)`);
    else console.log(`live card matches the committed game pick (${g?.id})`);
  } catch (e) { console.log(`live check skipped (${String(e.message).split('\n')[0]})`); }
}

for (const f of flags) console.log(`⚠ ${f}`);
if (!flags.length) console.log('spotlight-review: both picks OK');
process.exit(flags.length ? 1 : 0);
