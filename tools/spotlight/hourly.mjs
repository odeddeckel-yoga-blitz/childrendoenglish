#!/usr/bin/env node
// Hourly spotlight loop (owner spec 2026-10-10). Run by
// .github/workflows/spotlight-hourly.yml (needs DATABASE_URL) or locally:
//   DATABASE_URL=... node tools/spotlight/hourly.mjs [--dry-run]
// 1. live counts for the current word/game since they went up → sufficient?
// 2. if sufficient: refresh src/data/cde-stats.json (the engagement optimizer's
//    data step) and print the optimizer report; flag items for the word/game
//    improver when exposure is high but engagement low (tools/spotlight/flags.json).
// 3. keep or swap each lane (src/utils/spotlightDecide.js) → src/data/spotlight.json.
// Exit 0 always; the workflow commits only if files changed. Every decision is
// appended to tools/spotlight/log.jsonl for the record.
import { readFileSync, writeFileSync, existsSync, appendFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';
import { neon } from '@neondatabase/serverless';
import { fetchSnapshot, fetchLiveExposure } from '../learning/snapshot.mjs';

const REPO = join(dirname(fileURLToPath(import.meta.url)), '../..');
const SPOT = join(REPO, 'src/data/spotlight.json');
const STATS = join(REPO, 'src/data/cde-stats.json');
const FLAGS = join(REPO, 'tools/spotlight/flags.json');
const LOG = join(REPO, 'tools/spotlight/log.jsonl');
const dry = process.argv.includes('--dry-run');

const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
if (!url) { console.log('spotlight-hourly: DATABASE_URL not set — nothing to do (add the repo secret to enable).'); process.exit(0); }
const q = neon(url);

const { WORDS } = await import(pathToFileURL(join(REPO, 'src/data/words.js')).href);
const { ARCADE } = await import(pathToFileURL(join(REPO, 'src/data/arcadeGames.js')).href);
const { decideSpotlight, RULES } = await import(pathToFileURL(join(REPO, 'src/utils/spotlightDecide.js')).href);

const prev = existsSync(SPOT) ? JSON.parse(readFileSync(SPOT, 'utf8')) : null;
const oldSnap = existsSync(STATS) ? JSON.parse(readFileSync(STATS, 'utf8')) : { words: {}, games: {} };
const now = Date.now();

// 1. live traffic for the current picks
const live = await fetchLiveExposure(q, prev);
const suff = (l) => l && (l.spot >= RULES.sufficientSpot || l.exposure >= RULES.sufficientExposure);
const sufficient = { word: !!suff(live.word), game: !!suff(live.game) };
for (const lane of ['word', 'game']) {
  const l = live[lane];
  console.log(`${lane.padEnd(5)} ${String(prev?.[lane]?.id || '—').padEnd(20)} since ${(prev?.[lane]?.since || '?').slice(0, 10)}  spot ${l?.spot ?? 0}  exposure ${l?.exposure ?? 0}  good ${l?.good ?? 0}  → ${sufficient[lane] ? 'SUFFICIENT' : 'waiting'}`);
}

// 2. engagement optimizer (snapshot refresh + report) only when traffic justifies it
let snap = oldSnap;
if (sufficient.word || sufficient.game) {
  snap = await fetchSnapshot(q, 28);
  if (!dry) writeFileSync(STATS, JSON.stringify(snap) + '\n');
  console.log(`snapshot refreshed (${Object.keys(snap.words).length} words, ${Object.keys(snap.games).length} games, generatedAt ${snap.generatedAt})`);
  const rep = spawnSync(process.execPath, [join(REPO, 'tools/learning/optimizer.mjs'), '28'], { env: process.env, encoding: 'utf8' });
  console.log('— engagement optimizer report —\n' + (rep.stdout || '').trim().split('\n').slice(0, 60).join('\n'));
} else {
  console.log('traffic below the bar on both lanes — optimizer not run this hour');
}

// 3. keep or swap
const { next, changes, flags, verdicts } = decideSpotlight({ prev, snap, words: WORDS, games: ARCADE, now, live });
for (const lane of ['word', 'game']) console.log(`${lane}: ${verdicts[lane].action.toUpperCase()} — ${verdicts[lane].reason}`);
if (flags.length) {
  console.log('improver flags: ' + flags.map((f) => `${f.lane}/${f.id} ${f.severity} (rate ${f.rate} over ${f.exposure})`).join('; '));
  if (!dry) {
    const old = existsSync(FLAGS) ? JSON.parse(readFileSync(FLAGS, 'utf8')) : [];
    const merged = [...old.filter((o) => !flags.some((f) => f.lane === o.lane && f.id === o.id)), ...flags.map((f) => ({ ...f, at: new Date(now).toISOString() }))];
    writeFileSync(FLAGS, JSON.stringify(merged, null, 2) + '\n');
  }
}
const text = JSON.stringify(next, null, 2) + '\n';
if (!dry && text !== (prev ? JSON.stringify(prev, null, 2) + '\n' : '')) writeFileSync(SPOT, text);
if (!dry) appendFileSync(LOG, JSON.stringify({ at: new Date(now).toISOString(), live, sufficient, verdicts: Object.fromEntries(Object.entries(verdicts).map(([k, v]) => [k, { action: v.action, reason: v.reason }])), changes }) + '\n');
console.log(changes.length ? 'SWAPPED: ' + changes.map((c) => `${c.lane} ${c.from || '∅'}→${c.to} (${c.reason})`).join('; ') : 'no swap');
