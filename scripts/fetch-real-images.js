#!/usr/bin/env node

/**
 * Fetch real images from Wikimedia Commons for placeholder words.
 * No API key needed. Downloads, resizes to 512x512, converts to WebP.
 *
 * Usage: node scripts/fetch-real-images.js
 */

import sharp from 'sharp';
import { existsSync, mkdirSync, statSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const imagesDir = join(__dirname, '..', 'public', 'images');

// Threshold: files under this size are placeholders
const PLACEHOLDER_MAX_SIZE = 5000;

// Custom search terms for words that need better queries
const SEARCH_OVERRIDES = {
  back: 'human back body',
  belt: 'leather belt clothing',
  calm: 'calm lake peaceful',
  bored: 'bored child',
  shy: 'shy child hiding',
  frustrated: 'frustrated person',
  embarrassed: 'embarrassed face',
  grateful: 'grateful happy child',
  jealous: 'jealous child',
  surprised: 'surprised face child',
  son: 'mother and son',
  daughter: 'father and daughter',
  husband: 'husband wife couple',
  wife: 'wife husband couple',
  twin: 'twin children',
  stepmother: 'stepmother family',
  ancestor: 'family tree ancestors',
  running: 'child running',
  dancing: 'child dancing',
  skiing: 'person skiing snow',
  homework: 'child doing homework',
  principal: 'school principal',
  teacher: 'teacher classroom',
  whiteboard: 'classroom whiteboard',
  lunchbox: 'school lunchbox food',
  gymnasium: 'school gymnasium',
  library: 'library books',
  magnifier: 'magnifying glass',
  'scissors-item': 'scissors',
  flashlight: 'flashlight torch',
  battery: 'battery AA',
  wall: 'brick wall',
  roof: 'house roof',
  chimney: 'chimney house',
  bathtub: 'bathtub bathroom',
  pillow: 'pillow bed',
  blanket: 'blanket cozy',
  garden: 'flower garden',
  comb: 'hair comb',
  wallet: 'leather wallet',
  raincoat: 'yellow raincoat',
  hoodie: 'hoodie sweatshirt',
  pajamas: 'children pajamas',
  neck: 'human neck',
  chin: 'human chin face',
  forehead: 'human forehead face',
  thumb: 'thumb up hand',
  cream: 'ice cream dessert',
  cookie: 'chocolate chip cookie',
  pancake: 'pancake stack breakfast',
  pasta: 'pasta spaghetti',
  peach: 'peach fruit',
  grape: 'purple grapes',
  cheese: 'cheese wedge',
  beige: 'beige color swatch',
  maroon: 'maroon color',
  navy: 'navy blue color',
  turquoise: 'turquoise color stone',
  violet: 'violet flower purple',
  gray: 'gray color swatch',
  silver: 'silver metal color',
  zero: 'number zero',
  eleven: 'number eleven',
  twelve: 'number twelve',
  fifteen: 'number fifteen',
  thirty: 'number thirty',
  fifty: 'number fifty',
  million: 'number million',
  thousand: 'number thousand',
  cloudy: 'cloudy sky',
  sunny: 'sunny sky',
  rainy: 'rainy weather',
  windy: 'windy trees',
  breeze: 'gentle breeze trees',
  drizzle: 'light rain drizzle',
  drought: 'dry drought land',
  thermometer: 'thermometer temperature',
  avalanche: 'snow avalanche mountain',
  glacier: 'glacier ice',
  cliff: 'cliff ocean',
  island: 'tropical island',
  river: 'river nature',
  lake: 'lake nature',
  moon: 'moon night sky',
  star: 'stars night sky',
  canoe: 'canoe boat',
  sailboat: 'sailboat ocean',
  ship: 'cargo ship ocean',
  taxi: 'yellow taxi cab',
  truck: 'delivery truck',
  parachute: 'parachute sky',
  skateboard: 'skateboard',
  trampoline: 'trampoline jumping',
  badminton: 'badminton racket',
  hockey: 'ice hockey',
  karate: 'karate martial arts',
};

async function searchWikimedia(query) {
  const url = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=File:${encodeURIComponent(query)}&gsrnamespace=6&gsrlimit=5&prop=imageinfo&iiprop=url|size|mime&iiurlwidth=512&format=json&origin=*`;

  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'ChildrenDoEnglish/1.0 (educational app; odeddeckel@gmail.com)' },
    });
    const data = await res.json();

    if (!data.query?.pages) return null;

    // Find the best image: prefer medium-sized, non-SVG images
    const pages = Object.values(data.query.pages)
      .filter(p => {
        const info = p.imageinfo?.[0];
        if (!info) return false;
        // Skip SVGs, GIFs, and tiny images
        if (info.mime === 'image/svg+xml' || info.mime === 'image/gif') return false;
        if (info.width < 200 || info.height < 200) return false;
        return true;
      })
      .sort((a, b) => {
        // Prefer images closest to 512px
        const aDiff = Math.abs((a.imageinfo[0].width + a.imageinfo[0].height) / 2 - 512);
        const bDiff = Math.abs((b.imageinfo[0].width + b.imageinfo[0].height) / 2 - 512);
        return aDiff - bDiff;
      });

    if (pages.length === 0) return null;

    // Use the thumbnail URL (already resized) or the full URL
    const info = pages[0].imageinfo[0];
    return info.thumburl || info.url;
  } catch (err) {
    console.error(`  Search error for "${query}":`, err.message);
    return null;
  }
}

async function downloadAndConvert(imageUrl, outputPath) {
  const res = await fetch(imageUrl, {
    headers: { 'User-Agent': 'ChildrenDoEnglish/1.0 (educational app; odeddeckel@gmail.com)' },
  });

  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  const buffer = Buffer.from(await res.arrayBuffer());

  await sharp(buffer)
    .resize(512, 512, { fit: 'cover', position: 'centre' })
    .webp({ quality: 80 })
    .toFile(outputPath);
}

function getPlaceholderImages() {
  const placeholders = [];
  const files = require('fs').readdirSync(imagesDir);
  for (const file of files) {
    if (!file.endsWith('.webp')) continue;
    const filepath = join(imagesDir, file);
    const size = statSync(filepath).size;
    if (size < PLACEHOLDER_MAX_SIZE) {
      placeholders.push(file.replace('.webp', ''));
    }
  }
  return placeholders;
}

async function main() {
  const { readdirSync } = await import('fs');
  const files = readdirSync(imagesDir);
  const placeholders = [];
  for (const file of files) {
    if (!file.endsWith('.webp')) continue;
    const filepath = join(imagesDir, file);
    const size = statSync(filepath).size;
    if (size < PLACEHOLDER_MAX_SIZE) {
      placeholders.push(file.replace('.webp', ''));
    }
  }

  console.log(`Found ${placeholders.length} placeholder images to replace.\n`);

  let replaced = 0;
  let failed = 0;

  for (const word of placeholders) {
    const searchTerm = SEARCH_OVERRIDES[word] || word;
    const filepath = join(imagesDir, `${word}.webp`);

    process.stdout.write(`  ${word} (searching "${searchTerm}")... `);

    const imageUrl = await searchWikimedia(searchTerm);
    if (!imageUrl) {
      console.log('no image found');
      failed++;
      // Rate limit
      await new Promise(r => setTimeout(r, 300));
      continue;
    }

    try {
      await downloadAndConvert(imageUrl, filepath);
      const newSize = statSync(filepath).size;
      console.log(`OK (${(newSize / 1024).toFixed(1)}KB)`);
      replaced++;
    } catch (err) {
      console.log(`download failed: ${err.message}`);
      failed++;
    }

    // Rate limit — be respectful to Wikimedia
    await new Promise(r => setTimeout(r, 500));
  }

  console.log(`\nDone! Replaced ${replaced} images, ${failed} failed.`);
  if (failed > 0) {
    console.log('Failed images still have placeholder. Run again or find images manually.');
  }
}

main().catch(console.error);
