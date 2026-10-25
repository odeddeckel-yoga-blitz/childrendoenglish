#!/usr/bin/env node
/**
 * Word Learning Optimizer — CDE's analogue of kidsdomath's engagement optimizer.
 * Ranks the WORDS (not games) that need work, from the cookieless cde_learn
 * beacon, so the image/voice improver loops work real deficits, not intuition.
 *
 * Run (DB = own Neon project 'childrendoenglish', delicate-hat-45485476, since
 * 2026-10-17; the Vercel copy is a SENSITIVE env var, so `vercel env pull` can't
 * read it):
 *   neonctl auth   # once
 *   export CDE_DATABASE_URL=$(neonctl connection-string --project-id delicate-hat-45485476)
 *   npm run engagement                              # = optimizer.mjs 28 --rivals
 *   node tools/learning/optimizer.mjs 28            # rank on a 28-day window
 * No local creds? GitHub → Actions → spotlight-hourly → Run workflow with
 * force_optimizer=true prints this same report in the job log.
 *   node tools/learning/optimizer.mjs 28 --rivals   # + same-category rival check per word
 *   node tools/learning/optimizer.mjs 28 --top=25
 *
 * Signals (all aggregate, no-PII — see api/land.js):
 *   - hardest words: wrong-rate = ans_no ÷ (ans_ok + ans_no); priority =
 *     (wrong_rate − TARGET_WRONG) × attempts, volume-weighted with a floor
 *     (words under FLOOR attempts listed as "insufficient data", never dropped)
 *   - mode funnel: quiz_done ÷ quiz_start per mode (+ quit rate)
 *   - letter practice: taps per letter from the Letter Path
 *
 * Operating loop (every ~3 days once data exists):
 *   1. Run with --rivals. 2. Top words with a RIVAL flag → the image likely
 *   elicits the rival: re-run scripts/word-image-improver.mjs for that word.
 *   3. No rival → check audio (scripts/word-voice-improver.py loop) and the
 *   word's difficulty/level placement. 4. Wait ~2 weeks post-fix before
 *   re-judging a word (data-age guardrail below prints per-word freshness
 *   caveats when the whole window is younger than a week).
 *
 * IMPORTANT — this optimizer is REACTIVE (needs quiz volume before a bad
 * asset surfaces as a wrong-rate). Content-level checks are separate,
 * PROACTIVE gates that must run at generation time, because a word with no
 * traffic yet is invisible here (knight.mp3 shipped broken 2026-09-22; zero
 * quiz data meant nothing flagged it until a parent did):
 *   - audio: scripts/voice-audit.py after EVERY generate-word-audio.sh batch
 *   - images: word-image-improver metrics (esp. sole-answer) at add time
 */
import { neon } from '@neondatabase/serverless';
import { WORDS } from '../../src/data/words.js';

const TARGET_WRONG = 0.25; // above this wrong-rate a word is "hard"
const FLOOR = 10;          // min attempts before we trust a word's rate

const days = Math.min(365, Math.max(1, Number(process.argv[2]) || 28));
const top = Number((process.argv.find(a => a.startsWith('--top=')) || '').split('=')[1]) || 15;
const doRivals = process.argv.includes('--rivals');

const url = process.env.CDE_DATABASE_URL || process.env.DATABASE_URL || process.env.POSTGRES_URL;
if (!url) { console.error('Set CDE_DATABASE_URL (neonctl connection-string — see header).'); process.exit(2); }
const q = neon(url);

const rows = await q`SELECT ev, item, sum(n)::int AS n, min(day) AS first, max(day) AS last
  FROM cde_learn WHERE day >= CURRENT_DATE - ${days}::int GROUP BY ev, item`;
// Per-interface-language split (lang column live 2026-09-30; earlier rows read 'en').
// Diagnostic per the amber lesson: a word hard under ONE language = that language's
// GLOSS problem; hard under every language = image/audio/word-selection problem.
const langRows = await q`SELECT lang, ev, item, sum(n)::int AS n
  FROM cde_learn WHERE day >= CURRENT_DATE - ${days}::int AND ev IN ('ans_ok','ans_no')
  GROUP BY lang, ev, item`;

// --- recording health (2026-10-23) ---
// The beacon fails QUIET by design, so a Neon outage/quota shows up only as a
// hole in the data. KDM silently lost ~2h on 2026-10-22. Each recent full day is
// compared with the median of the 14 days before it: <30% (or zero) = a likely
// recording gap; >4× = a bot/test burst (cde_learn 2026-10-21 = 6,726). Either
// way, investigate before trusting a read that spans that day.
{
  const daily = await q`SELECT to_char(d, 'YYYY-MM-DD') AS day,
      COALESCE((SELECT sum(n) FROM cde_learn WHERE day = d::date), 0)::int AS learn,
      COALESCE((SELECT sum(n) FROM cde_land  WHERE day = d::date), 0)::int AS land
    FROM generate_series(CURRENT_DATE - 21, CURRENT_DATE - 1, interval '1 day') d ORDER BY d`;
  const median = (xs) => { const s = [...xs].sort((a, b) => a - b); return s.length ? (s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2) : 0; };
  const flags = [];
  for (let i = daily.length - 7; i < daily.length; i++) {
    if (i < 7) continue;
    const prior = daily.slice(Math.max(0, i - 14), i);
    for (const t of ['learn', 'land']) {
      const med = median(prior.map((r) => r[t]));
      const v = daily[i][t];
      const day = daily[i].day;
      // Both tables are written by the same endpoint: if the OTHER one is normal
      // that day, the DB was accepting writes — a dip is low activity, not lost data.
      const o = t === 'learn' ? 'land' : 'learn';
      const otherOk = daily[i][o] >= 0.5 * median(prior.map((r) => r[o]));
      if (med >= 20 && v < 0.3 * med) flags.push(otherOk
        ? `  · ${day} cde_${t} ${v} vs median ${med} — low, but cde_${o} was normal (DB accepting writes) → low activity, not a recording gap`
        : `  ⚠ ${day} cde_${t} ${v} vs median ${med} — possible RECORDING GAP (Neon quota/outage? check Vercel logs for "[land] … cause=") — investigate, don't trust`);
      else if (med >= 20 && v > 4 * med) flags.push(`  ⚠ ${day} cde_${t} ${v} vs median ${med} — BURST (bot/test?) — exclude from reads unless explained`);
    }
  }
  console.log('— recording health (last 7 full days vs trailing 14-day median):');
  console.log(flags.length ? flags.join('\n') : '  ok — no gaps or bursts');
  console.log('');
}

if (rows.length === 0) {
  console.log(`No learning events in the last ${days}d — the beacon ships with this commit; give it traffic.`);
  process.exit(0);
}

const spanDays = (() => {
  const ds = rows.flatMap(r => [new Date(r.first), new Date(r.last)]);
  return Math.round((Math.max(...ds) - Math.min(...ds)) / 86400000) + 1;
})();
if (spanDays < 7) console.log(`⚠ data span is only ~${spanDays}d — treat rankings as provisional\n`);

// --- hardest words ---
const byWord = {};
for (const r of rows) {
  if (r.ev !== 'ans_ok' && r.ev !== 'ans_no') continue;
  const w = (byWord[r.item] = byWord[r.item] || { ok: 0, no: 0 });
  w[r.ev === 'ans_ok' ? 'ok' : 'no'] += r.n;
}
const wordById = Object.fromEntries(WORDS.map(w => [w.id, w]));
const scored = Object.entries(byWord).map(([id, { ok, no }]) => {
  const attempts = ok + no;
  const wrong = attempts ? no / attempts : 0;
  return { id, attempts, wrong, priority: (wrong - TARGET_WRONG) * attempts };
});
const ranked = scored.filter(w => w.attempts >= FLOOR && w.priority > 0).sort((a, b) => b.priority - a.priority);
const thin = scored.filter(w => w.attempts < FLOOR && w.wrong > TARGET_WRONG).sort((a, b) => b.wrong - a.wrong);

console.log(`— hardest words (${days}d, floor ${FLOOR} attempts, target wrong-rate ≤${TARGET_WRONG * 100}%):`);
if (ranked.length === 0) console.log('  none above target — vocabulary is teaching well at current volume');
for (const w of ranked.slice(0, top)) {
  const meta = wordById[w.id];
  let rival = '';
  if (doRivals && meta) {
    // Same-category words co-appear as distractors — the visual-confusion suspects.
    const sibs = WORDS.filter(x => x.id !== w.id && x.category === meta.category).map(x => x.word);
    rival = `  [category ${meta.category}: ${sibs.slice(0, 6).join(', ')}${sibs.length > 6 ? '…' : ''}]`;
  }
  console.log(`  ${w.id.padEnd(16)} wrong ${(w.wrong * 100).toFixed(0)}% × ${w.attempts} attempts  → priority ${w.priority.toFixed(1)}${meta ? '' : '  ⚠ not in words.js (removed?)'}${rival}`);
}
if (thin.length > 0) {
  console.log(`\n— insufficient data (<${FLOOR} attempts) but trending hard: ${thin.slice(0, 10).map(w => `${w.id}(${(w.wrong * 100).toFixed(0)}%/${w.attempts})`).join(', ')}`);
}

// --- per-language wrong-rates (only shown once non-en volume exists) ---
const byLangWord = {};
for (const r of langRows) {
  const k = r.lang;
  const w = ((byLangWord[k] = byLangWord[k] || {})[r.item] = byLangWord[k][r.item] || { ok: 0, no: 0 });
  w[r.ev === 'ans_ok' ? 'ok' : 'no'] += r.n;
}
const nonEn = Object.keys(byLangWord).filter((l) => l !== 'en');
if (nonEn.length > 0) {
  console.log('\n— per-language wrong-rates (gloss-vs-asset diagnostic):');
  for (const lg of nonEn) {
    const hard = Object.entries(byLangWord[lg])
      .map(([id, { ok, no }]) => ({ id, a: ok + no, w: no / Math.max(1, ok + no) }))
      .filter((x) => x.a >= 5 && x.w > TARGET_WRONG)
      .sort((a, b) => b.w * b.a - a.w * a.a);
    const enW = (id) => {
      const e = byLangWord.en?.[id];
      return e ? `${Math.round((100 * e.no) / Math.max(1, e.ok + e.no))}%` : '—';
    };
    console.log(`  [${lg}] ${hard.length ? '' : 'no words above target'}`);
    for (const x of hard.slice(0, 8)) {
      console.log(`    ${x.id.padEnd(16)} wrong ${(x.w * 100).toFixed(0)}% × ${x.a}  (en: ${enW(x.id)})  ${enW(x.id) !== '—' && x.w * 100 - parseInt(enW(x.id)) > 15 ? '→ likely ' + lg.toUpperCase() + ' GLOSS issue' : ''}`);
    }
  }
}

// --- mode funnel ---
const modes = {};
for (const r of rows) {
  if (!['quiz_start', 'quiz_done', 'quiz_quit'].includes(r.ev)) continue;
  const m = (modes[r.item] = modes[r.item] || { start: 0, done: 0, quit: 0 });
  m[r.ev.replace('quiz_', '')] += r.n;
}
console.log('\n— mode funnel (done ÷ start):');
for (const [m, v] of Object.entries(modes).sort((a, b) => b[1].start - a[1].start)) {
  const rate = v.start ? Math.round((100 * v.done) / v.start) : 0;
  console.log(`  ${m.padEnd(10)} start ${String(v.start).padStart(4)}  done ${String(v.done).padStart(4)} (${rate}%)  quit ${v.quit}`);
}

// --- letter practice ---
const letters = rows.filter(r => r.ev === 'letter').sort((a, b) => b.n - a.n);
if (letters.length > 0) {
  console.log('\n— letter-path practice taps: ' + letters.map(r => `${r.item.toUpperCase()}:${r.n}`).join(' '));
}

// --- learning-cycle funnel (cyc_start → per-stage → cyc_done per batch) ---
const cyc = rows.filter(r => ['cyc_start', 'cyc_stage', 'cyc_done'].includes(r.ev));
if (cyc.length > 0) {
  const starts = cyc.filter(r => r.ev === 'cyc_start').reduce((a, r) => a + r.n, 0);
  const dones = cyc.filter(r => r.ev === 'cyc_done').reduce((a, r) => a + r.n, 0);
  console.log(`\n— learning cycle: ${starts} batch starts → ${dones} batch completions (${starts ? Math.round(100 * dones / starts) : 0}%)`);
  // Items are <batchToken>_<stepKey> (full-ladder, 2026-10-07; legacy _s<n> kept)
  const STEP_ORDER = ['fc', 'aud', 'wq', 'iq', 'conv', 'lf1', 'lf2', 'lf3', 'forge', 'sent', 'zap', 's0', 's1', 's2'];
  const byStep = {};
  for (const r of cyc.filter(x => x.ev === 'cyc_stage')) {
    const key = r.item.split('_').slice(1).join('_') || r.item;
    byStep[key] = (byStep[key] || 0) + r.n;
  }
  const stepLine = Object.keys(byStep)
    .sort((a, b) => STEP_ORDER.indexOf(a) - STEP_ORDER.indexOf(b))
    .map((k) => `${k}:${byStep[k]}`).join('  ');
  if (stepLine) console.log(`  step completions: ${stepLine}  (a step-down along the ladder = the drop-off step)`);
}

// --- games: play depth per game (KDM parity — levelups ÷ opens) ---
// Opens = g_open learn events the games fire per game id on a real
// (non-webdriver, non-internal) page load; level-ups/completes = g_lvl/g_cmp.
// cde_land only has the catalog-level 'games' page class — kept as a cross-check.
// depth ≈ 0 on ≥10 opens = the game loses kids before level 1 → fix
// first-play UX / rebuild candidate.
// g_open shipped 2026-10-10 (67e869d) — level-ups before that have no opens,
// so all three counts start there or the depth is inflated (word-zapper read 24.5).
const G_OPEN_SINCE = '2026-10-10';
const gameEv = {};
for (const r of await q`SELECT ev, item, sum(n)::int AS n FROM cde_learn
  WHERE day >= GREATEST(CURRENT_DATE - ${days}::int, ${G_OPEN_SINCE}::date)
    AND ev IN ('g_open', 'g_lvl', 'g_cmp') GROUP BY ev, item`) {
  const g = (gameEv[r.item] = gameEv[r.item] || { open: 0, lvl: 0, cmp: 0 });
  g[r.ev === 'g_lvl' ? 'lvl' : r.ev === 'g_cmp' ? 'cmp' : 'open'] += r.n;
}
const landRows = await q`SELECT sum(n)::int AS n FROM cde_land
  WHERE day >= GREATEST(CURRENT_DATE - ${days}::int, ${G_OPEN_SINCE}::date) AND page = 'games'`;
const pageOpens = landRows[0]?.n || 0;
const gameIds = Object.keys(gameEv).sort((a, b) => gameEv[b].open - gameEv[a].open);
if (pageOpens > 0 || gameIds.length > 0) {
  const tot = gameIds.reduce((a, id) => ({ open: a.open + gameEv[id].open, lvl: a.lvl + gameEv[id].lvl, cmp: a.cmp + gameEv[id].cmp }), { open: 0, lvl: 0, cmp: 0 });
  console.log(`\n— games: ${tot.open} game opens · ${tot.lvl} level-ups · ${tot.cmp} completes` +
    `  (games/* page loads ${pageOpens} incl. the hub; counted from ${G_OPEN_SINCE})`);
  for (const id of gameIds) {
    const g = gameEv[id];
    const depth = g.open ? g.lvl / g.open : null;
    const flag = g.open >= 10 && depth < 0.2 ? '  ⚠ opens don’t convert to play — check first-play UX'
      : g.open >= 10 && depth < 0.5 ? '  watch' : g.open < 10 ? '  (insufficient data)' : '';
    console.log(`  ${id.padEnd(20)} opens ${String(g.open).padStart(4)}  levelups ${String(g.lvl).padStart(4)}  completes ${String(g.cmp).padStart(3)}  depth ${depth == null ? '—' : depth.toFixed(2)}${flag}`);
  }
}

// --- return visits (vis buckets, once per browser per local day; ships 2026-10-18) ---
// The engagement number that matters most: do kids come BACK. Sum of vis per
// day ≈ daily unique browsers (cookieless; excludes internal/webdriver).
// rpre = had app state from before 2026-10-18 but no date yet (gap unknown),
// so in the first ~week every pre-existing visitor reads as rpre or new:
// trust the returning share only once rpre has faded (~Oct 25+).
{
  const B = ['new', 'r1', 'r2-7', 'r8-30', 'r31p', 'rpre'];
  const vis = Object.fromEntries(B.map((b) => [b, 0]));
  for (const r of rows) if (r.ev === 'vis' && r.item in vis) vis[r.item] += r.n;
  const total = B.reduce((a, b) => a + vis[b], 0);
  if (total > 0) {
    const ret = total - vis.new;
    const pct = (n) => `${Math.round((100 * n) / total)}%`;
    console.log(`\n— return visits: ${total} browser-days · returning ${ret} (${pct(ret)}) · new ${vis.new} (${pct(vis.new)})`);
    console.log(`  next day ${vis.r1} · 2–7d ${vis['r2-7']} · 8–30d ${vis['r8-30']} · 31d+ ${vis.r31p} · pre-launch state (gap unknown) ${vis.rpre}`);
    const visDays = await q`SELECT min(day) AS first FROM cde_learn WHERE ev = 'vis'`;
    const age = visDays[0]?.first ? Math.round((Date.now() - new Date(visDays[0].first)) / 86400000) : 0;
    if (age < 7) console.log(`  ⚠ signal is ${age}d old — returning share is meaningless until it has ≥7 days (re-read ~Oct 25)`);
    const byLang = {};
    for (const r of await q`SELECT lang, item, sum(n)::int AS n FROM cde_learn
      WHERE ev = 'vis' AND day >= CURRENT_DATE - ${days}::int GROUP BY lang, item`) {
      const x = (byLang[r.lang] = byLang[r.lang] || { t: 0, nw: 0 });
      x.t += r.n; if (r.item === 'new') x.nw += r.n;
    }
    console.log('  by interface language: ' + Object.entries(byLang).sort((a, b) => b[1].t - a[1].t)
      .map(([lg, x]) => `${lg} ${x.t} (${Math.round((100 * (x.t - x.nw)) / x.t)}% returning)`).join(' · '));
  } else {
    console.log('\n— return visits: no vis data yet (return bucket ships 2026-10-18)');
  }
}

// --- first-visit funnel (onb tallies; ships 2026-10-18) ---
// create_view = first-player screen shown → create_done (typed a name) |
// create_noname (play-first, 2026-10-21: skipped it, default name) → q1_start
// → q1_done | q1_quit; name_later = renamed on a result screen afterwards.
// ⚠ create_done never fired before 2026-10-21 (phantom 'Player 1' bug made
// every first player the SECOND) — read view→created only from 10-22 on.
// The first quiz is 5 questions since 2026-10-21 (was 10).
// Since 2026-10-25 each first-quiz answer fires q1_a<n>_<ok|no|skip>, so a quiz
// that ends with neither done nor quit ("vanished") shows how far it got.
// Counted from 2026-10-22 only (first full day of the 5-question first quiz) and
// split by interface language — 10-25 read: he 8/14 finished, en 5/19.
{
  const S = ['create_view', 'create_done', 'create_noname', 'name_later', 'q1_start', 'q1_done', 'q1_quit'];
  const onbRows = await q`SELECT lang, item, sum(n)::int AS n FROM cde_learn
    WHERE ev = 'onb' AND day >= GREATEST(CURRENT_DATE - ${days}::int, DATE '2026-10-22') GROUP BY lang, item`;
  const tally = (rs) => {
    const t = Object.fromEntries(S.map((k) => [k, 0]));
    t.reach = [0, 0, 0, 0, 0, 0]; t.firstWrong = 0;
    for (const r of rs) {
      if (r.item in t) t[r.item] += r.n;
      const m = /^q1_a(\d)_(ok|no|skip)$/.exec(r.item);
      if (m) { t.reach[+m[1]] += r.n; if (m[1] === '1' && m[2] !== 'ok') t.firstWrong += r.n; }
    }
    return t;
  };
  const pct = (a, b) => (b ? `${Math.round((100 * a) / b)}%` : '—');
  const onb = tally(onbRows);
  if (onb.create_view > 0) {
    const created = onb.create_done + onb.create_noname;
    console.log(`\n— first visit (since 2026-10-22): create-player shown ${onb.create_view} → created ${created} (${pct(created, onb.create_view)};` +
      ` ${onb.create_noname} skipped the name, ${onb.name_later} named later)` +
      ` → 1st quiz started ${onb.q1_start} (${pct(onb.q1_start, created)}) → finished ${onb.q1_done} (${pct(onb.q1_done, onb.q1_start)}) / quit ${onb.q1_quit}` +
      ` / vanished ${Math.max(0, onb.q1_start - onb.q1_done - onb.q1_quit)}`);
    for (const lang of [...new Set(onbRows.map((r) => r.lang))].sort()) {
      const t = tally(onbRows.filter((r) => r.lang === lang));
      if (t.q1_start) console.log(`    ${lang}: 1st quiz ${t.q1_done}/${t.q1_start} finished (${pct(t.q1_done, t.q1_start)}), quit ${t.q1_quit}`);
    }
    if (onb.reach[1]) console.log(`  answered Q1..Q5: ${onb.reach.slice(1).join(' → ')} (of ${onb.q1_start} started since the per-answer beacon; Q1 wrong/skipped ${onb.firstWrong})`);
    if (onb.create_view >= 15 && created / onb.create_view < 0.6)
      console.log('  ⚠ the create-player screen still loses ≥40% even with the name optional — consider auto-creating the first player');
    if (onb.q1_start >= 15 && onb.q1_done / onb.q1_start < 0.5)
      console.log('  ⚠ under half finish the (5-question) first quiz — look at the first quiz itself');
  } else {
    console.log('\n— first visit: no onb data in the window');
  }
}

// --- per-asset diagnosis (ansm_* probe split + wfb parent taps; WordCheck + quizzes) ---
// A word hard under ONE probe = that asset's problem: aud→audio, img→image,
// txt→the word/gloss. Explicit taps (img/aud/hard/ok) are the strongest signal.
{
  const modes = {}, fb = {};
  for (const r of rows) {
    if (r.ev === 'ansm_ok' || r.ev === 'ansm_no') { const m = (modes[r.item] = modes[r.item] || [0, 0]); m[0] += r.n; if (r.ev === 'ansm_ok') m[1] += r.n; }
    else if (r.ev === 'wfb') fb[r.item] = (fb[r.item] || 0) + r.n;
  }
  const ids = new Set([...Object.keys(modes), ...Object.keys(fb)].map((k) => k.split('@')[0]));
  if (ids.size) {
    console.log('\n— per-asset diagnosis (owner action: image → re-shoot/sole-answer check · audio → regenerate + ear-check · word → age check / DROP-RULE):');
    const lines = [];
    for (const id of ids) {
      const probe = (p) => { const m = modes[`${id}@${p}`]; return m ? `${p} ${Math.round(100 * m[1] / m[0])}%(${m[0]})` : `${p} —`; };
      const taps = ['img', 'aud', 'hard', 'ok'].map((k) => fb[`${id}@${k}`] ? `${k}×${fb[`${id}@${k}`]}` : null).filter(Boolean).join(' ');
      const worst = ['aud', 'img', 'txt'].map((p) => { const m = modes[`${id}@${p}`]; return m && m[0] >= 5 ? [p, m[1] / m[0]] : null; }).filter(Boolean).sort((x, y) => x[1] - y[1])[0];
      const flagged = (fb[`${id}@img`] || 0) + (fb[`${id}@aud`] || 0) + (fb[`${id}@hard`] || 0) >= 2 || (worst && worst[1] < 0.6);
      if (flagged) lines.push(`  ${id.padEnd(16)} ${probe('aud')}  ${probe('img')}  ${probe('txt')}  taps: ${taps || '—'}`);
    }
    console.log(lines.length ? lines.join('\n') : `  ${ids.size} words have probe/tap data, none flagged (no probe <60% over ≥5 answers, no ≥2 parent taps)`);
  }
}

// --- committed snapshot for the build-time home spotlight (shared with tools/spotlight/hourly.mjs) ---
// scripts/pick-spotlight.mjs (prebuild) derives "Today's picks" from THIS file,
// never from the live DB, so builds are deterministic. generatedAt is the last
// day with data (not wall-clock) so re-running on unchanged data is a no-op.
{
  const { fetchSnapshot } = await import('./snapshot.mjs');
  const { writeFileSync } = await import('node:fs');
  const { fileURLToPath } = await import('node:url');
  const { join, dirname } = await import('node:path');
  const snap = await fetchSnapshot(q, days);
  const out = join(dirname(fileURLToPath(import.meta.url)), '../../src/data/cde-stats.json');
  writeFileSync(out, JSON.stringify(snap) + '\n');
  console.log(`\n— snapshot written: src/data/cde-stats.json (${Object.keys(snap.words).length} words, ${Object.keys(snap.games).length} games; commit it + rebuild to rotate the spotlight)`);
}
