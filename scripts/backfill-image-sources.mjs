#!/usr/bin/env node
// Image provenance backfill (owner 11-04: the site credited none of its Wikimedia Commons photos). The fetch scripts
// kept only the picture, so this re-runs the Commons searches they used (word, word + category, their per-word
// query overrides), applies the same 512×512 centre crop to every candidate and matches it to our webp by a 32×32
// greyscale fingerprint. A close match recovers title, author, licence and file page; the rest is listed for review.
//   node scripts/backfill-image-sources.mjs [ids…] [--out=<json>]   (default out: .image-work/image-sources-raw.json)
import sharp from 'sharp';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { WORDS } from '../src/data/words.js';

const UA = { 'User-Agent': 'ChildrenDoEnglish/1.0 (image credits backfill; info@childrendoenglish.com)' };
const args = process.argv.slice(2);
const out = (args.find((a) => a.startsWith('--out=')) || '--out=.image-work/image-sources-raw.json').slice(6);
const only = args.filter((a) => !a.startsWith('--'));
const CACHE = '.image-work/commons-cache';
mkdirSync(CACHE, { recursive: true });

// Per-word query overrides the original fetch scripts used ("id: 'query'" lines).
const overrides = {};
for (const f of ['scripts/fetch-real-images.js', 'scripts/fetch-images.js', 'scripts/fix-bad-images.js']) {
  if (!existsSync(f)) continue;
  for (const m of readFileSync(f, 'utf8').matchAll(/^\s*['"]?([a-z0-9-]+)['"]?\s*:\s*(?:\{[^}]*?(?:query|q|search)\s*:\s*)?['"]([^'"\n]{2,60})['"]/gm)) {
    (overrides[m[1]] ||= new Set()).add(m[2]);
  }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function getJSON(url) {
  const key = `${CACHE}/${createHash('sha1').update(url).digest('hex')}.json`;
  if (existsSync(key)) return JSON.parse(readFileSync(key, 'utf8'));
  for (let i = 0; i < 4; i++) {
    let r; try { r = await fetch(url, { headers: UA }); } catch { await sleep(5000 * (i + 1)); continue; }   // DNS / network blip: retry
    if (r.status === 429 || r.status >= 500) { await sleep(2000 * (i + 1)); continue; }
    const j = await r.json(); writeFileSync(key, JSON.stringify(j)); return j;
  }
  return {};
}
async function getBuf(url) {
  const key = `${CACHE}/${createHash('sha1').update(url).digest('hex')}.bin`;
  if (existsSync(key)) return readFileSync(key);
  for (let i = 0; i < 4; i++) {
    let r; try { r = await fetch(url, { headers: UA }); } catch { await sleep(5000 * (i + 1)); continue; }   // DNS / network blip: retry
    if (r.status === 429 || r.status >= 500) { await sleep(2000 * (i + 1)); continue; }
    if (!r.ok) return null;
    const b = Buffer.from(await r.arrayBuffer()); writeFileSync(key, b); return b;
  }
  return null;
}
const fp = async (input) => {
  const raw = await sharp(input).resize(512, 512, { fit: 'cover', position: 'centre' }).resize(32, 32).greyscale().raw().toBuffer();
  const m = raw.reduce((a, v) => a + v, 0) / raw.length;
  const sd = Math.sqrt(raw.reduce((a, v) => a + (v - m) ** 2, 0) / raw.length) || 1;
  return Float32Array.from(raw, (v) => (v - m) / sd);   // contrast-normalised: survives webp/jpeg + brightness
};
const corr = (a, b) => { let s = 0; for (let i = 0; i < a.length; i++) s += a[i] * b[i]; return s / a.length; };   // 1 = identical
const strip = (h) => String(h || '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();

// --deep (pass 2): the admin image tool (api/fetch-image.js) searched WITHOUT the File: prefix and paged up to 50+
// results deep, so pass 2 replays that for words pass 1 didn't match (only those; results merge into the same file).
const DEEP = args.includes('--deep');
async function search(q) {
  const out = [];
  for (const off of DEEP ? [0, 50] : [0]) {
    const url = `https://commons.wikimedia.org/w/api.php?action=query&format=json&generator=search&gsrsearch=${DEEP ? '' : 'File:'}${encodeURIComponent(q)}`
      + `&gsrnamespace=6&gsrlimit=${DEEP ? 50 : 20}${off ? `&gsroffset=${off}` : ''}&prop=imageinfo&iiprop=url|mime|extmetadata&iiurlwidth=${DEEP ? 160 : 240}`;
    const j = await getJSON(url);
    out.push(...Object.values(j.query?.pages || {}).map((p) => ({ title: p.title, i: p.imageinfo?.[0] })).filter((c) => c.i && !/gif/.test(c.i.mime)));
  }
  return out;
}

const results = existsSync(out) ? JSON.parse(readFileSync(out, 'utf8')) : {};
const SKIP = DEEP && existsSync('.image-work/own-art.json') ? new Set(JSON.parse(readFileSync('.image-work/own-art.json', 'utf8'))) : new Set();
const todo = WORDS.filter((w) => (only.length ? only.includes(w.id)
  : DEEP ? !SKIP.has(w.id) && !((results[w.id]?.score ?? 0) >= 0.85) && !results[w.id]?.deep : !results[w.id]));
let n = 0;
for (const w of todo) {
  const file = `public${w.imageUrl}`;
  if (!existsSync(file)) { results[w.id] = { status: 'no-file' }; continue; }
  const prev = results[w.id];
  const mine = await fp(file);
  const qs = [...new Set([...(overrides[w.id] || []), w.word, `${w.word} ${w.category}`, `${w.word} photo`])];
  const seen = new Map();
  for (const q of qs) for (const c of await search(q)) if (!seen.has(c.title)) seen.set(c.title, c);
  let best = null;
  for (const c of seen.values()) {
    const buf = await getBuf(c.i.thumburl || c.i.url); if (!buf) continue;
    let s; try { s = corr(mine, await fp(buf)); } catch { continue; }
    if (!best || s > best.score) best = { score: s, c };
  }
  const m = best?.c?.i?.extmetadata || {};
  results[w.id] = best ? {
    score: +best.score.toFixed(3), title: best.c.title, page: best.c.i.descriptionurl,
    author: strip(m.Artist?.value), licence: strip(m.LicenseShortName?.value), licenceUrl: m.LicenseUrl?.value || '',
    candidates: seen.size, ...(DEEP ? { deep: true } : {}),
  } : { status: 'no-candidates', candidates: seen.size, ...(DEEP ? { deep: true } : {}) };
  // pass 2 never overwrites a better pass-1 score
  if (DEEP && prev && (prev.score ?? -1) > (results[w.id].score ?? -1)) results[w.id] = { ...prev, deep: true };
  if (++n % 10 === 0) { writeFileSync(out, JSON.stringify(results, null, 1)); console.log(`${n}/${todo.length}`); }
}
writeFileSync(out, JSON.stringify(results, null, 1));
for (const id of (only.length ? only : [])) console.log(id, JSON.stringify(results[id]));
console.log(`done: ${Object.keys(results).length} words in ${out}`);
