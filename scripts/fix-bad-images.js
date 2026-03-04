#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const IMAGES_DIR = path.join(__dirname, '..', 'public', 'images');
const UA = 'ChildrenDoEnglish/1.0 (https://childrendoenglish.com; educational app) node-fetch';

const REPLACEMENTS = {
  bracelet:  ['rubber band bracelet loom', 'bracelet wristband', 'jade bracelet green'],
};

async function searchWikimedia(queries) {
  for (const q of queries) {
    const url = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrnamespace=6&gsrsearch=${encodeURIComponent(q)}&gsrlimit=8&prop=imageinfo&iiprop=url|size|mime&iiurlwidth=512&format=json`;
    const res = await fetch(url, { headers: { 'User-Agent': UA } });
    if (!res.ok) continue;
    const data = await res.json();
    const pages = data?.query?.pages;
    if (!pages) continue;

    for (const p of Object.values(pages)) {
      const info = p.imageinfo?.[0];
      if (!info || !info.thumburl) continue;
      if (!info.mime?.startsWith('image/')) continue;
      if (info.width < 300 || info.height < 300) continue;
      return info.thumburl;
    }
  }
  return null;
}

async function downloadAndSave(thumbUrl, wordId) {
  const res = await fetch(thumbUrl, { headers: { 'User-Agent': UA } });
  if (!res.ok) return false;
  const buf = Buffer.from(await res.arrayBuffer());
  const outPath = path.join(IMAGES_DIR, `${wordId}.webp`);
  await sharp(buf)
    .resize(512, 512, { fit: 'cover', position: 'centre' })
    .webp({ quality: 82 })
    .toFile(outPath);
  return true;
}

const entries = Object.entries(REPLACEMENTS);
let fixed = 0;
for (const [word, queries] of entries) {
  const url = await searchWikimedia(queries);
  if (!url) {
    console.log(`  ✗ ${word} — no results`);
    continue;
  }
  const ok = await downloadAndSave(url, word);
  if (ok) {
    console.log(`  ✓ ${word}`);
    fixed++;
  } else {
    console.log(`  ✗ ${word} — download failed`);
  }
  await new Promise(r => setTimeout(r, 500));
}
console.log(`\nReplaced ${fixed}/${entries.length} images`);
