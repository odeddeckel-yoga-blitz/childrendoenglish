#!/usr/bin/env node
/**
 * Word Learning Optimizer — CDE's analogue of kidsdomath's engagement optimizer.
 * Ranks the WORDS (not games) that need work, from the cookieless cde_learn
 * beacon, so the image/voice improver loops work real deficits, not intuition.
 *
 * Run:
 *   vercel env pull /tmp/cde.env --environment=production
 *   export DATABASE_URL=$(grep ^DATABASE_URL= /tmp/cde.env | cut -d= -f2- | tr -d '"')
 *   node tools/learning/optimizer.mjs 28            # rank on a 28-day window
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

const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
if (!url) { console.error('Set DATABASE_URL (vercel env pull — see header).'); process.exit(2); }
const q = neon(url);

const rows = await q`SELECT ev, item, sum(n)::int AS n, min(day) AS first, max(day) AS last
  FROM cde_learn WHERE day >= CURRENT_DATE - ${days}::int GROUP BY ev, item`;
// Per-interface-language split (lang column live 2026-09-30; earlier rows read 'en').
// Diagnostic per the amber lesson: a word hard under ONE language = that language's
// GLOSS problem; hard under every language = image/audio/word-selection problem.
const langRows = await q`SELECT lang, ev, item, sum(n)::int AS n
  FROM cde_learn WHERE day >= CURRENT_DATE - ${days}::int AND ev IN ('ans_ok','ans_no')
  GROUP BY lang, ev, item`;

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

// --- games: play depth (KDM parity — levelups ÷ opens per game) ---
// Opens come from cde_land page pings (/games/<id>), level-ups and completed
// runs from the g_lvl/g_cmp learn events the games fire (webdriver-excluded).
// depth ≈ 0 on real opens = the game loses visitors → rebuild/fix candidate.
const gameEv = {};
for (const r of rows) {
  if (r.ev !== 'g_lvl' && r.ev !== 'g_cmp') continue;
  const g = (gameEv[r.item] = gameEv[r.item] || { lvl: 0, cmp: 0 });
  g[r.ev === 'g_lvl' ? 'lvl' : 'cmp'] += r.n;
}
// cde_land stores page CLASSES (the 'games' class covers all /games/* pages),
// never paths — so opens are catalog-level; per-game splits come from the
// g_lvl/g_cmp items. (A per-game LIKE query here silently matched nothing.)
const landRows = await q`SELECT sum(n)::int AS n FROM cde_land
  WHERE day >= CURRENT_DATE - ${days}::int AND page = 'games'`;
const gamesOpens = landRows[0]?.n || 0;
const gameIds = Object.keys(gameEv).sort();
if (gamesOpens > 0 || gameIds.length > 0) {
  const totLvl = gameIds.reduce((a, id) => a + gameEv[id].lvl, 0);
  const depth = gamesOpens ? (totLvl / gamesOpens).toFixed(2) : '—';
  console.log(`\n— games: ${gamesOpens} opens (catalog-level), ${totLvl} level-ups, depth ${depth}` +
    (gamesOpens >= 10 && totLvl / gamesOpens < 0.2 ? '  ⚠ opens don’t convert to play — check first-play UX' : ''));
  for (const id of gameIds) {
    console.log(`  ${id.padEnd(20)} levelups ${String(gameEv[id].lvl).padStart(4)}  completes ${String(gameEv[id].cmp).padStart(3)}`);
  }
  console.log('  (games page-class ships 2026-10-03 — opens before that date landed in \'other\')');
}
