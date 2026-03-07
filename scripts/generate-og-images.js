#!/usr/bin/env node

/**
 * Generate category-specific OG images (1200x630 PNG) for vocabulary pages.
 *
 * Each image has:
 *   - Blue gradient background (#2563eb -> #1d4ed8)
 *   - "Children Do English" branding at top
 *   - Category display name large in the center
 *   - Word count below (e.g. "44 words")
 *   - 4 preview word images in a row near the bottom
 *
 * Run after `npm run build`:
 *   node scripts/generate-og-images.js
 *
 * Output: dist/og/<category>.png (1200x630 each)
 */

import sharp from 'sharp';
import { existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const IMAGES_DIR = join(ROOT, 'public', 'images');
const OUT_DIR = join(ROOT, 'dist', 'og');

// --- data import (pure ESM, no JSX) ---
const { CATEGORIES, getWordsByCategory } = await import(
  join(ROOT, 'src', 'data', 'words.js')
);

const CATEGORY_NAMES = {
  animals: 'Animals',
  food: 'Food & Drinks',
  home: 'Home & Furniture',
  transport: 'Transport & Vehicles',
  nature: 'Nature',
  colors: 'Colors',
  numbers: 'Numbers',
  clothing: 'Clothing',
  school: 'School',
  sports: 'Sports & Activities',
  feelings: 'Feelings & Emotions',
  everyday: 'Everyday Objects',
  toys: 'Toys & Games',
};

// OG image dimensions
const WIDTH = 1200;
const HEIGHT = 630;

// Preview thumbnail config
const THUMB_SIZE = 90;
const THUMB_GAP = 24;
const THUMB_RADIUS = 16;
const THUMB_COUNT = 4;

function escapeXml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Build the SVG overlay (text only — images are composited separately).
 */
function buildOverlaySvg(displayName, wordCount) {
  // Vertical layout:
  //   y=110  "Children Do English"  (36px)
  //   y=320  Category name          (72px)
  //   y=400  "XX words"             (32px)
  //   y=520  thumbnails (composited via sharp, not SVG)

  return `<svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#2563eb"/>
      <stop offset="100%" stop-color="#1d4ed8"/>
    </linearGradient>
  </defs>

  <!-- gradient background -->
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#bg)"/>

  <!-- subtle decorative circles -->
  <circle cx="100" cy="530" r="180" fill="white" opacity="0.04"/>
  <circle cx="1100" cy="100" r="200" fill="white" opacity="0.04"/>

  <!-- top branding -->
  <text x="${WIDTH / 2}" y="110"
        text-anchor="middle"
        font-family="Arial, Helvetica, sans-serif"
        font-size="36"
        font-weight="600"
        fill="rgba(255,255,255,0.85)"
        letter-spacing="1">Children Do English</text>

  <!-- thin separator -->
  <line x1="${WIDTH / 2 - 80}" y1="140" x2="${WIDTH / 2 + 80}" y2="140"
        stroke="rgba(255,255,255,0.3)" stroke-width="2"/>

  <!-- category name -->
  <text x="${WIDTH / 2}" y="310"
        text-anchor="middle"
        font-family="Arial, Helvetica, sans-serif"
        font-size="72"
        font-weight="bold"
        fill="white">${escapeXml(displayName)}</text>

  <!-- word count -->
  <text x="${WIDTH / 2}" y="380"
        text-anchor="middle"
        font-family="Arial, Helvetica, sans-serif"
        font-size="32"
        fill="rgba(255,255,255,0.75)">${wordCount} word${wordCount === 1 ? '' : 's'}</text>

  <!-- placeholder row for thumbnails (actual images composited by sharp) -->
  ${buildThumbPlaceholders()}
</svg>`;
}

/**
 * Rounded-rect clip-path placeholders for the 4 thumbnail slots.
 * These white-tinted boxes show even if an image fails to load.
 */
function buildThumbPlaceholders() {
  const totalWidth = THUMB_COUNT * THUMB_SIZE + (THUMB_COUNT - 1) * THUMB_GAP;
  const startX = (WIDTH - totalWidth) / 2;
  const y = 460;

  let rects = '';
  for (let i = 0; i < THUMB_COUNT; i++) {
    const x = startX + i * (THUMB_SIZE + THUMB_GAP);
    rects += `<rect x="${x}" y="${y}" width="${THUMB_SIZE}" height="${THUMB_SIZE}" rx="${THUMB_RADIUS}" ry="${THUMB_RADIUS}" fill="rgba(255,255,255,0.12)"/>`;
  }
  return rects;
}

/**
 * Prepare a single word image as a rounded thumbnail Buffer.
 */
async function makeThumb(wordId) {
  const imagePath = join(IMAGES_DIR, `${wordId}.webp`);
  if (!existsSync(imagePath)) {
    return null;
  }

  // Create a rounded-corner mask
  const mask = Buffer.from(
    `<svg width="${THUMB_SIZE}" height="${THUMB_SIZE}">
      <rect width="${THUMB_SIZE}" height="${THUMB_SIZE}" rx="${THUMB_RADIUS}" ry="${THUMB_RADIUS}" fill="white"/>
    </svg>`
  );

  const resized = await sharp(imagePath)
    .resize(THUMB_SIZE, THUMB_SIZE, { fit: 'cover' })
    .png()
    .toBuffer();

  // Apply rounded mask
  return sharp(resized)
    .composite([{ input: mask, blend: 'dest-in' }])
    .png()
    .toBuffer();
}

/**
 * Generate OG image for a single category.
 */
async function generateCategoryOg(slug) {
  const displayName = CATEGORY_NAMES[slug] || slug;
  const words = getWordsByCategory(slug);
  const wordCount = words.length;

  // Pick 4 evenly-spaced words for preview thumbnails
  const step = Math.max(1, Math.floor(words.length / THUMB_COUNT));
  const previewWords = [];
  for (let i = 0; i < THUMB_COUNT && i * step < words.length; i++) {
    previewWords.push(words[i * step]);
  }

  // Build SVG background + text overlay
  const svgOverlay = Buffer.from(buildOverlaySvg(displayName, wordCount));

  // Prepare thumbnail composites
  const totalThumbWidth = THUMB_COUNT * THUMB_SIZE + (THUMB_COUNT - 1) * THUMB_GAP;
  const startX = Math.round((WIDTH - totalThumbWidth) / 2);
  const thumbY = 460;

  const thumbComposites = [];
  for (let i = 0; i < previewWords.length; i++) {
    const thumbBuf = await makeThumb(previewWords[i].id);
    if (thumbBuf) {
      thumbComposites.push({
        input: thumbBuf,
        left: startX + i * (THUMB_SIZE + THUMB_GAP),
        top: thumbY,
      });
    }
  }

  // Compose final image: SVG base + thumbnail images on top
  const outPath = join(OUT_DIR, `${slug}.png`);
  await sharp(svgOverlay)
    .resize(WIDTH, HEIGHT) // ensure exact dimensions
    .composite(thumbComposites)
    .png({ quality: 90, compressionLevel: 9 })
    .toFile(outPath);

  console.log(`  ✓ ${outPath} (${displayName}, ${wordCount} words, ${thumbComposites.length} previews)`);
}

// --- main ---
async function main() {
  console.log(`\nGenerating OG images for ${CATEGORIES.length} categories...\n`);

  mkdirSync(OUT_DIR, { recursive: true });

  for (const slug of CATEGORIES) {
    await generateCategoryOg(slug);
  }

  console.log(`\nDone — ${CATEGORIES.length} OG images saved to ${OUT_DIR}\n`);
}

main().catch((err) => {
  console.error('Failed to generate OG images:', err);
  process.exit(1);
});
