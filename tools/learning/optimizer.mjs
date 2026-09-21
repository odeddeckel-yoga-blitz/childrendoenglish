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
