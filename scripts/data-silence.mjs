#!/usr/bin/env node
// RECURRING data-silence (daily, scripted — cost plan, owner 11-07): a day with zero loads / game opens / quiz starts, or a
// drop >50% vs the same weekday, over the last 7 days. Burst days (loads or quiz starts > 4× the 21-day median, e.g. the 10-18/10-21 bot bursts) are left
// out of the baselines, so a burst no longer makes the next same-weekday look like a crash. Prints 'ok' or the flags.
//   CDE_DATABASE_URL="$(neonctl connection-string --project-id delicate-hat-45485476)" node scripts/data-silence.mjs
import { neon } from '@neondatabase/serverless';
const q = neon(process.env.CDE_DATABASE_URL);
const r = await q.query(`SELECT to_char(d, 'YYYY-MM-DD Dy') AS day, extract(dow from d)::int AS dow,
  COALESCE((SELECT sum(n) FROM cde_land WHERE day = d::date AND src NOT LIKE '%@%'), 0)::int AS loads,
  COALESCE((SELECT sum(n) FROM cde_learn WHERE day = d::date AND ev = 'g_open'), 0)::int AS gopen,
  COALESCE((SELECT sum(n) FROM cde_learn WHERE day = d::date AND ev = 'quiz_start'), 0)::int AS quiz
  FROM generate_series(CURRENT_DATE - 21, CURRENT_DATE - 1, interval '1 day') d ORDER BY d`, []);
const med = (xs) => { const t = [...xs].sort((a, b) => a - b); return t.length ? t[Math.floor(t.length / 2)] : 0; };
const burst = new Set(r.filter((x) => ['loads', 'quiz'].some((k) => x[k] > 4 * Math.max(1, med(r.map((y) => y[k]))))).map((x) => x.day));
const flags = [];
for (let i = Math.max(0, r.length - 7); i < r.length; i++) {   // flag the last 7 days; older days were read before
  const prev = r.slice(0, i).filter((x) => x.dow === r[i].dow && !burst.has(x.day));
  for (const k of ['loads', 'gopen', 'quiz']) {
    if (r[i][k] === 0) flags.push(`${r[i].day} ${k}=0`);
    const base = prev.length ? prev.reduce((a, x) => a + x[k], 0) / prev.length : null;
    if (base && base >= 10 && r[i][k] < 0.5 * base) flags.push(`${r[i].day} ${k} ${r[i][k]} vs ${base.toFixed(0)} on earlier ${r[i].day.slice(-3)}s (−${Math.round(100 - (100 * r[i][k]) / base)}%)`);
  }
}
const last = r.at(-1);
console.log(`data-silence (21 d to ${last.day}): ` + (flags.length ? `${flags.length} flag(s)` : 'ok — no silent days, no >50% drops vs the same weekday') +
  (burst.size ? ` · burst days left out of baselines: ${[...burst].join(', ')}` : '') + ` · yesterday loads ${last.loads}, game opens ${last.gopen}, quizzes ${last.quiz}`);
for (const f of flags) console.log('  ⚠ ' + f);
process.exit(flags.length ? 1 : 0);   // due.mjs --run-scripts: exit 0 = ok
