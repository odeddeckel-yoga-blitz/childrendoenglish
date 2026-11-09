#!/usr/bin/env node
// Adds every word page that is live now to scripts/published-word-urls.json (append-only). That file is the memory of
// every /vocabulary/<category>/<word>/ URL the site has ever served; src/__tests__/goneRedirects.test.js fails when one
// of them is neither a live page nor a vercel.json redirect (11-09: Search Console reported 404s for 157 removed or
// moved word pages that had no redirect). Run it after words go live (e.g. when PAGES_HOLD words get their pages).
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { WORDS } from '../src/data/words.js';
import { PAGES_HOLD } from '../src/data/pagesHold.js';

const file = join(dirname(fileURLToPath(import.meta.url)), 'published-word-urls.json');
const known = new Set(JSON.parse(readFileSync(file, 'utf8')));
const before = known.size;
for (const w of WORDS) if (!PAGES_HOLD.has(w.id)) known.add(`/vocabulary/${w.category}/${w.id}/`);
writeFileSync(file, JSON.stringify([...known].sort()).replace(/","/g, '",\n"') + '\n');
console.log(`published-word-urls: ${known.size} (${known.size - before} new)`);
