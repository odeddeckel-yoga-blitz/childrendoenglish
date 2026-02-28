#!/usr/bin/env node

/**
 * Fetch kid-friendly images from Wikimedia Commons (no API key needed)
 * and optimize to 512x512 webp via sharp.
 *
 * Wikimedia requires a User-Agent header and generous rate limiting.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const IMAGES_DIR = path.join(__dirname, '..', 'public', 'images');

const UA = 'ChildrenDoEnglish/1.0 (https://childrendoenglish.com; educational app) node-fetch';

// Search terms — very specific to get clear, single-object, child-friendly images
// Multiple search queries per word — tries each in order until one works
const WORDS = {
  cat: ['tabby cat face portrait close', 'domestic cat sitting portrait', 'kitten face close up'],
  dog: ['beagle dog portrait', 'shiba inu dog', 'Canis lupus familiaris portrait'],
  fish: ['clownfish nemo tropical', 'goldfish single orange', 'betta fish colorful'],
  bird: ['colorful bird branch parrot', 'blue bird perched', 'robin bird'],
  rabbit: ['Oryctolagus cuniculus domestic', 'holland lop rabbit pet', 'angora rabbit white'],
  elephant: ['african elephant portrait', 'elephant walking savanna'],
  dolphin: ['spinner dolphin jumping Hawaii', 'Pacific white sided dolphin', 'Delphinus delphis common dolphin ocean'],
  penguin: ['emperor penguin standing antarctica', 'penguin bird black white'],
  giraffe: ['giraffe portrait head neck', 'giraffe standing savanna'],
  apple: ['red apple single white background', 'apple fruit red shiny single', 'malus domestica red'],
  banana: ['yellow banana single fruit', 'banana ripe yellow', 'cavendish banana'],
  bread: ['Bauernbrot bread loaf', 'pain de campagne bread', 'Weissbrot white bread loaf'],
  milk: ['pouring milk glass white', 'cow milk fresh dairy product', 'milk carton school lunch'],
  pizza: ['pepperoni pizza slice', 'margherita pizza'],
  sandwich: ['Butterbrot sandwich', 'ham cheese sandwich plate', 'submarine sandwich hoagie'],
  watermelon: ['watermelon slice red fruit', 'watermelon cut red'],
  carrot: ['orange carrot single vegetable', 'carrot fresh orange', 'daucus carota'],
  house: ['Einfamilienhaus residential house', 'cottage house garden', 'Victorian house exterior colorful'],
  bed: ['bedroom bed pillows', 'double bed white sheets', 'bed room interior modern'],
  chair: ['Windsor chair antique', 'Stuhl chair single', 'rocking chair wooden'],
  table: ['Esstisch dining table set', 'wooden table top view', 'Küchentisch kitchen table'],
  car: ['red car sedan side view', 'blue car automobile parked', 'toyota sedan car'],
  bus: ['yellow school bus', 'school bus American'],
  bicycle: ['bicycle parked red', 'bicycle road bike single', 'bicycle city commuter'],
  airplane: ['Airbus A320 landing approach', 'Boeing 737 takeoff', 'passenger aircraft airport'],
  sun: ['sun sky photograph real', 'sunshine bright clear sky blue', 'sun rising horizon golden'],
  tree: ['single oak tree green field', 'tree green leaves isolated', 'deciduous tree summer'],
  flower: ['red rose single flower', 'daisy flower close', 'sunflower yellow'],
  rain: ['rain drops window', 'rainy day street umbrella', 'rainfall heavy'],
  rainbow: ['rainbow arc sky colorful', 'double rainbow landscape', 'rainbow after rain sky'],
  mountain: ['mountain snow peak blue sky', 'mountain landscape scenic alps', 'mount fuji'],
  ocean: ['ocean blue waves tropical', 'ocean horizon blue'],
  butterfly: ['monarch butterfly orange wings', 'butterfly colorful wings'],
};

async function searchWikimedia(query) {
  const url = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(query)}&gsrnamespace=6&gsrlimit=10&prop=imageinfo&iiprop=url|mime|size&iiurlwidth=512&format=json&origin=*`;

  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  const data = await res.json();

  if (!data.query?.pages) return null;

  const pages = Object.values(data.query.pages)
    .filter(p => {
      const info = p.imageinfo?.[0];
      if (!info) return false;
      const mime = info.mime || '';
      // Must be a photo/image, at least 300px, and roughly square-ish (aspect ratio < 2:1)
      const isImage = mime.startsWith('image/jpeg') || mime.startsWith('image/png') || mime.startsWith('image/webp');
      const bigEnough = info.width >= 300 && info.height >= 300;
      const aspectRatio = Math.max(info.width, info.height) / Math.min(info.width, info.height);
      return isImage && bigEnough && aspectRatio < 2.5;
    })
    .sort((a, b) => {
      // Prefer images closer to square aspect ratio
      const ratioA = Math.abs(1 - (a.imageinfo[0].width / a.imageinfo[0].height));
      const ratioB = Math.abs(1 - (b.imageinfo[0].width / b.imageinfo[0].height));
      return ratioA - ratioB;
    });

  if (pages.length === 0) return null;

  const info = pages[0].imageinfo[0];
  return info.thumburl || info.url;
}

// Try multiple queries for a word, return first successful result
async function searchWithFallbacks(queries) {
  for (const query of queries) {
    const result = await searchWikimedia(query);
    if (result) return result;
    await new Promise(r => setTimeout(r, 1500));
  }
  return null;
}

async function downloadAndOptimize(url, outputName) {
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  const buffer = Buffer.from(await res.arrayBuffer());
  const outputPath = path.join(IMAGES_DIR, outputName);

  await sharp(buffer)
    .resize(512, 512, { fit: 'cover', position: 'centre' })
    .webp({ quality: 82 })
    .toFile(outputPath);

  const stats = fs.statSync(outputPath);
  return stats.size;
}

// Check which words already have real images (not the tiny placeholder)
function needsImage(word) {
  const filePath = path.join(IMAGES_DIR, `${word}.webp`);
  if (!fs.existsSync(filePath)) return true;
  const stats = fs.statSync(filePath);
  return stats.size < 500; // placeholder is ~50 bytes
}

async function main() {
  fs.mkdirSync(IMAGES_DIR, { recursive: true });

  const words = Object.entries(WORDS).filter(([word]) => needsImage(word));

  if (words.length === 0) {
    console.log('All images already downloaded!');
    return;
  }

  console.log(`Fetching ${words.length} images (skipping ${Object.keys(WORDS).length - words.length} already downloaded)...\n`);

  let success = 0;
  let failed = 0;

  for (const [word, queries] of words) {
    process.stdout.write(`  ${word}... `);

    try {
      const imageUrl = await searchWithFallbacks(queries);
      if (!imageUrl) {
        console.log('NO RESULT (tried all queries)');
        failed++;
        await new Promise(r => setTimeout(r, 1500));
        continue;
      }

      // Wait before downloading the image
      await new Promise(r => setTimeout(r, 2000));

      const size = await downloadAndOptimize(imageUrl, `${word}.webp`);
      console.log(`OK (${(size / 1024).toFixed(1)}KB)`);
      success++;
    } catch (err) {
      console.log(`FAILED: ${err.message}`);
      failed++;
    }

    // Generous rate limiting between words
    await new Promise(r => setTimeout(r, 2000));
  }

  console.log(`\nDone: ${success} downloaded, ${failed} failed out of ${words.length}`);

  if (failed > 0) {
    const failedWords = Object.keys(WORDS).filter(w => needsImage(w));
    console.log(`\nStill need images for: ${failedWords.join(', ')}`);
    console.log('Run the script again to retry failed words.');
  }
}

main().catch(console.error);
