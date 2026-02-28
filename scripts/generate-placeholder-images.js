#!/usr/bin/env node
import sharp from 'sharp';
import { existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const imagesDir = join(__dirname, '..', 'public', 'images');

// Category → pastel background color
const categoryColors = {
  animals: '#fce4ec',
  food: '#fff3e0',
  home: '#e8eaf6',
  transport: '#e0f2f1',
  nature: '#e8f5e9',
  colors: '#f3e5f5',
  numbers: '#e1f5fe',
  body: '#fbe9e7',
  clothing: '#f1f8e9',
  school: '#fff9c4',
  sports: '#e0f7fa',
  weather: '#ede7f6',
  family: '#fce4ec',
  feelings: '#fff8e1',
  everyday: '#eceff1',
};

async function generatePlaceholder(word, imageUrl, category) {
  const filename = imageUrl.replace('/images/', '');
  const filepath = join(imagesDir, filename);

  if (existsSync(filepath)) {
    return false; // already exists
  }

  const bgColor = categoryColors[category] || '#f5f5f5';
  const displayWord = word.length > 12 ? word.slice(0, 12) + '…' : word;
  const fontSize = word.length > 8 ? 36 : 48;

  const svg = `
    <svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
      <rect width="512" height="512" fill="${bgColor}" rx="24"/>
      <text x="256" y="240" text-anchor="middle" font-family="Arial, Helvetica, sans-serif"
            font-size="${fontSize}" font-weight="bold" fill="#37474f">${displayWord}</text>
      <text x="256" y="290" text-anchor="middle" font-family="Arial, Helvetica, sans-serif"
            font-size="20" fill="#78909c">${category}</text>
    </svg>`;

  await sharp(Buffer.from(svg))
    .webp({ quality: 80 })
    .toFile(filepath);

  return true;
}

async function main() {
  // Dynamic import of words data
  const { WORDS } = await import('../src/data/words.js');

  if (!existsSync(imagesDir)) {
    mkdirSync(imagesDir, { recursive: true });
  }

  let created = 0;
  let skipped = 0;

  for (const word of WORDS) {
    const generated = await generatePlaceholder(word.word, word.imageUrl, word.category);
    if (generated) {
      created++;
      console.log(`  ✓ ${word.imageUrl}`);
    } else {
      skipped++;
    }
  }

  console.log(`\nDone! Created ${created} new images, skipped ${skipped} existing.`);
}

main().catch(console.error);
