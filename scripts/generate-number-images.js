#!/usr/bin/env node

/**
 * Generate 512x512 number images for all number words.
 * Each image shows the digit(s) in a bold, kid-friendly style
 * on a colorful rounded-rectangle background.
 */

import sharp from 'sharp';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const imagesDir = join(__dirname, '..', 'public', 'images');

const NUMBERS = {
  zero:     { digit: '0',         bg: '#EDF2F7', fg: '#4A5568' },
  one:      { digit: '1',         bg: '#FED7D7', fg: '#C53030' },
  two:      { digit: '2',         bg: '#FEEBC8', fg: '#C05621' },
  three:    { digit: '3',         bg: '#FEFCBF', fg: '#975A16' },
  four:     { digit: '4',         bg: '#C6F6D5', fg: '#276749' },
  five:     { digit: '5',         bg: '#B2F5EA', fg: '#285E61' },
  six:      { digit: '6',         bg: '#BEE3F8', fg: '#2B6CB0' },
  seven:    { digit: '7',         bg: '#C3DAFE', fg: '#3C366B' },
  eight:    { digit: '8',         bg: '#E9D8FD', fg: '#553C9A' },
  nine:     { digit: '9',         bg: '#FED7E2', fg: '#97266D' },
  ten:      { digit: '10',        bg: '#FED7D7', fg: '#9B2C2C' },
  eleven:   { digit: '11',        bg: '#FEEBC8', fg: '#9C4221' },
  twelve:   { digit: '12',        bg: '#C6F6D5', fg: '#22543D' },
  fifteen:  { digit: '15',        bg: '#BEE3F8', fg: '#2A4365' },
  twenty:   { digit: '20',        bg: '#C3DAFE', fg: '#312E81' },
  thirty:   { digit: '30',        bg: '#E9D8FD', fg: '#44337A' },
  fifty:    { digit: '50',        bg: '#FED7E2', fg: '#702459' },
  hundred:  { digit: '100',       bg: '#FEFCBF', fg: '#744210' },
  thousand: { digit: '1,000',     bg: '#B2F5EA', fg: '#234E52' },
  million:  { digit: '1,000,000', bg: '#FED7D7', fg: '#742A2A' },
};

function createNumberSvg({ digit, bg, fg }) {
  // Scale font size based on digit length
  let fontSize;
  if (digit.length <= 2) fontSize = 220;
  else if (digit.length <= 3) fontSize = 180;
  else if (digit.length <= 5) fontSize = 120;
  else fontSize = 72;

  return `<svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" fill="${bg}" rx="48"/>
  <rect x="32" y="32" width="448" height="448" fill="white" rx="32" opacity="0.5"/>
  <text
    x="256" y="${digit.length > 5 ? 275 : 270}"
    font-family="Arial, Helvetica, sans-serif"
    font-weight="900"
    font-size="${fontSize}"
    fill="${fg}"
    text-anchor="middle"
    dominant-baseline="central"
  >${digit}</text>
</svg>`;
}

async function main() {
  let count = 0;

  for (const [name, config] of Object.entries(NUMBERS)) {
    const svg = createNumberSvg(config);
    const outputPath = join(imagesDir, `${name}.webp`);

    await sharp(Buffer.from(svg))
      .resize(512, 512)
      .webp({ quality: 90 })
      .toFile(outputPath);

    console.log(`  ${name} (${config.digit}) → ${name}.webp`);
    count++;
  }

  console.log(`\nGenerated ${count} number images.`);
}

main().catch(console.error);
