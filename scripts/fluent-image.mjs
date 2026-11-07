#!/usr/bin/env node
// Word pictures from Microsoft Fluent Emoji, 3D style (MIT) — owner 11-07: people, fantasy, toys and anything without a
// good photo use Fluent 3D; real objects use photos. One Fluent variant for the whole site (3D, default skin tone), on
// one shared background, so every emoji picture looks like the same family.
//
//   node scripts/fluent-image.mjs <word-id> "<Fluent name>"              install public/images/<word>.webp + record source
//   node scripts/fluent-image.mjs <word-id> "<Fluent name>" --out=<f>    preview only (no install, no record)
//
// <Fluent name> is the asset folder in github.com/microsoft/fluentui-emoji/tree/main/assets (e.g. "Robot", "Old woman").
import sharp from 'sharp';
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const BG = '#EEF2FB';       // one background for every Fluent picture (light, slightly cool; not a quiz colour)
const SIZE = 512, EMOJI = 400;
const [word, name] = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const out = (process.argv.find((a) => a.startsWith('--out=')) || '').slice(6);
if (!word || !name) { console.error('usage: fluent-image.mjs <word-id> "<Fluent name>" [--out=preview.webp]'); process.exit(2); }

const base = 'https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/';
const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '_');
const tries = [`${name}/3D/${slug}_3d.png`, `${name}/Default/3D/${slug}_3d_default.png`];
let png = null, used = null;
for (const t of tries) {
  const r = await fetch(base + t.split('/').map(encodeURIComponent).join('/'));
  if (r.ok) { png = Buffer.from(await r.arrayBuffer()); used = t; break; }
}
if (!png) { console.error(`no Fluent 3D asset for "${name}"`); process.exit(1); }

const emoji = await sharp(png).resize(EMOJI, EMOJI, { kernel: 'lanczos3' }).png().toBuffer();
const img = await sharp({ create: { width: SIZE, height: SIZE, channels: 3, background: BG } })
  .composite([{ input: emoji, left: (SIZE - EMOJI) / 2, top: (SIZE - EMOJI) / 2 }]).webp({ quality: 88 }).toBuffer();

if (out) { writeFileSync(out, img); console.log(`preview ${out} ← ${used}`); process.exit(0); }
writeFileSync(join(ROOT, 'public/images', `${word}.webp`), img);
const srcFile = join(ROOT, 'scripts/IMAGE_SOURCES.json');
const all = JSON.parse(readFileSync(srcFile, 'utf8'));
all[word] = { source: 'fluent-emoji', title: `${name} (Fluent Emoji, 3D)`, url: `https://github.com/microsoft/fluentui-emoji/tree/main/assets/${encodeURIComponent(name)}`,
  author: 'Microsoft', licence: 'MIT', licenceUrl: 'https://github.com/microsoft/fluentui-emoji/blob/main/LICENSE' };
writeFileSync(srcFile, JSON.stringify(Object.fromEntries(Object.entries(all).sort()), null, 1) + '\n');
console.log(`installed ${word}.webp ← ${used} (MIT)`);
