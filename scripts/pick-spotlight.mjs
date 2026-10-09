#!/usr/bin/env node
// Prebuild: derive the home "Today's picks" (one word + one arcade game) from
// the committed stats snapshot. Logic lives in src/utils/spotlightPick.js
// (unit-tested); this wrapper only loads the catalogs and writes
// src/data/spotlight.json, consumed by src/components/SpotlightCards.jsx.
// No wall-clock → re-running produces an identical file unless the pick moved.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const REPO = join(dirname(fileURLToPath(import.meta.url)), '..');
const STATS = join(REPO, 'src/data/cde-stats.json');
const snap = existsSync(STATS) ? JSON.parse(readFileSync(STATS, 'utf8')) : { words: {}, games: {} };

const { WORDS } = await import(pathToFileURL(join(REPO, 'src/data/words.js')).href);
const { ARCADE } = await import(pathToFileURL(join(REPO, 'src/data/arcadeGames.js')).href);
const { pickSpotlight } = await import(pathToFileURL(join(REPO, 'src/utils/spotlightPick.js')).href);

const out = pickSpotlight({ words: WORDS, games: ARCADE, snap });
const OUT = join(REPO, 'src/data/spotlight.json');
const next = JSON.stringify(out, null, 2) + '\n';
const prev = existsSync(OUT) ? readFileSync(OUT, 'utf8') : '';
if (next !== prev) writeFileSync(OUT, next);
console.log(`spotlight: word=${out.word?.id || '—'} (${out.word?.ans ?? 0} answers) · game=${out.game?.id || '—'} (${out.game?.opens ?? 0} opens, ${out.game?.lvl ?? 0} level-ups)${next === prev ? ' · unchanged' : ''}`);
