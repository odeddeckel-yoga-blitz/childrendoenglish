#!/usr/bin/env node
// Prebuild: derive/refresh src/data/spotlight.json from the committed stats
// snapshot via the shared keep-or-swap decider (src/utils/spotlightDecide.js).
// No live counts and now = snapshot date, so the same inputs always produce the
// same file; the hourly job (tools/spotlight/hourly.mjs) is what brings live
// traffic into the decision and commits swaps.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const REPO = join(dirname(fileURLToPath(import.meta.url)), '..');
const STATS = join(REPO, 'src/data/cde-stats.json');
const OUT = join(REPO, 'src/data/spotlight.json');
const snap = existsSync(STATS) ? JSON.parse(readFileSync(STATS, 'utf8')) : { words: {}, games: {} };
const prev = existsSync(OUT) ? JSON.parse(readFileSync(OUT, 'utf8')) : null;

const { WORDS } = await import(pathToFileURL(join(REPO, 'src/data/words.js')).href);
const { ARCADE } = await import(pathToFileURL(join(REPO, 'src/data/arcadeGames.js')).href);
const { decideSpotlight } = await import(pathToFileURL(join(REPO, 'src/utils/spotlightDecide.js')).href);

const now = snap.generatedAt || '1970-01-01T00:00:00.000Z';
const { next, changes } = decideSpotlight({ prev, snap, words: WORDS, games: ARCADE, now });
const text = JSON.stringify(next, null, 2) + '\n';
const prevText = prev ? JSON.stringify(prev, null, 2) + '\n' : '';
if (text !== prevText) writeFileSync(OUT, text);
console.log(`spotlight: word=${next.word?.id || '—'} (${next.word?.ans ?? 0} answers) · game=${next.game?.id || '—'} (${next.game?.opens ?? 0} opens, ${next.game?.lvl ?? 0} level-ups)`
  + (changes.length ? ' · ' + changes.map((c) => `${c.lane}: ${c.from || '∅'}→${c.to} (${c.reason})`).join('; ') : text === prevText ? ' · unchanged' : ''));
