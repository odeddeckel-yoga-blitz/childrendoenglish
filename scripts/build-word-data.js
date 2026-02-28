#!/usr/bin/env node

/**
 * Build word data: fetches images from Pixabay, definitions from Free Dictionary API,
 * and generates the complete words.js file.
 *
 * Usage: PIXABAY_API_KEY=xxx node scripts/build-word-data.js
 *
 * This is a dev-time tool — not run in production.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PIXABAY_KEY = process.env.PIXABAY_API_KEY;
const IMAGES_DIR = path.join(__dirname, '..', 'public', 'images');

if (!PIXABAY_KEY) {
  console.error('Set PIXABAY_API_KEY environment variable');
  process.exit(1);
}

// Word list to expand (add more here)
const WORD_LIST = [
  // This is a placeholder — the full 300-word list will be populated here
  // Format: { word, level, category, hebrewTranslation }
];

async function fetchImage(word) {
  const url = `https://pixabay.com/api/?key=${PIXABAY_KEY}&q=${encodeURIComponent(word)}&image_type=illustration&safesearch=true&per_page=3`;
  const res = await fetch(url);
  const data = await res.json();

  if (data.hits && data.hits.length > 0) {
    return data.hits[0].webformatURL;
  }

  // Fallback to photo
  const photoUrl = `https://pixabay.com/api/?key=${PIXABAY_KEY}&q=${encodeURIComponent(word)}&image_type=photo&safesearch=true&per_page=3`;
  const photoRes = await fetch(photoUrl);
  const photoData = await photoRes.json();

  if (photoData.hits && photoData.hits.length > 0) {
    return photoData.hits[0].webformatURL;
  }

  return null;
}

async function fetchDefinition(word) {
  try {
    const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
    const data = await res.json();
    if (Array.isArray(data) && data.length > 0) {
      const entry = data[0];
      const meaning = entry.meanings?.[0];
      return {
        definition: meaning?.definitions?.[0]?.definition || '',
        partOfSpeech: meaning?.partOfSpeech || 'noun',
        phonetic: entry.phonetic || '',
        example: meaning?.definitions?.[0]?.example || '',
      };
    }
  } catch {}
  return null;
}

async function downloadImage(url, filename) {
  const res = await fetch(url);
  const buffer = await res.arrayBuffer();
  fs.writeFileSync(path.join(IMAGES_DIR, filename), Buffer.from(buffer));
}

async function main() {
  fs.mkdirSync(IMAGES_DIR, { recursive: true });

  console.log(`Processing ${WORD_LIST.length} words...`);

  for (const entry of WORD_LIST) {
    console.log(`  ${entry.word}...`);

    // Fetch image
    const imageUrl = await fetchImage(entry.word);
    if (imageUrl) {
      await downloadImage(imageUrl, `${entry.word}.webp`);
      console.log(`    Image saved`);
    } else {
      console.log(`    No image found`);
    }

    // Fetch definition
    const def = await fetchDefinition(entry.word);
    if (def) {
      console.log(`    Definition: ${def.definition.slice(0, 50)}...`);
    }

    // Rate limit
    await new Promise(r => setTimeout(r, 200));
  }

  console.log('Done! Review images in public/images/ and update src/data/words.js');
}

main().catch(console.error);
