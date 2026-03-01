#!/usr/bin/env node

/**
 * Generate 512x512 color swatch images for all color words.
 * Each image is a solid circle of the color on a subtle checkerboard background,
 * making them visually clear and consistent.
 */

import sharp from 'sharp';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const imagesDir = join(__dirname, '..', 'public', 'images');

const COLORS = {
  red:       '#E53E3E',
  blue:      '#3B82F6',
  green:     '#38A169',
  yellow:    '#ECC94B',
  black:     '#1A1A2E',
  white:     '#FAFAFA',
  orange:    '#ED8936',
  purple:    '#805AD5',
  pink:      '#ED64A6',
  brown:     '#8B6914',
  gray:      '#A0AEC0',
  silver:    '#C0C0C0',
  golden:    '#DAA520',
  beige:     '#D4C5A9',
  turquoise: '#40E0D0',
  maroon:    '#800020',
  cream:     '#FFFDD0',
  navy:      '#001F5B',
  peach:     '#FFCBA4',
  violet:    '#7F00FF',
};

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return { r, g, b };
}

function createColorSvg(hex) {
  const { r, g, b } = hexToRgb(hex);

  // Subtle background that contrasts with both light and dark colors
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  const bgColor = luminance > 0.85 ? '#E2E8F0' : '#F7FAFC';
  const ringColor = luminance > 0.85 ? '#CBD5E0' : 'none';

  return `<svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" fill="${bgColor}" rx="32"/>
  <circle cx="256" cy="256" r="200" fill="${hex}" stroke="${ringColor}" stroke-width="${ringColor !== 'none' ? 4 : 0}"/>
  <circle cx="256" cy="256" r="200" fill="url(#gloss)" opacity="0.15"/>
  <defs>
    <radialGradient id="gloss" cx="40%" cy="35%" r="60%">
      <stop offset="0%" stop-color="white"/>
      <stop offset="100%" stop-color="transparent"/>
    </radialGradient>
  </defs>
</svg>`;
}

async function main() {
  let count = 0;

  for (const [name, hex] of Object.entries(COLORS)) {
    const svg = createColorSvg(hex);
    const outputPath = join(imagesDir, `${name}.webp`);

    await sharp(Buffer.from(svg))
      .resize(512, 512)
      .webp({ quality: 90 })
      .toFile(outputPath);

    const { size } = await sharp(outputPath).metadata().catch(() => ({ size: 0 }));
    console.log(`  ${name} (${hex}) → ${outputPath.split('/').pop()}`);
    count++;
  }

  console.log(`\nGenerated ${count} color images.`);
}

main().catch(console.error);
