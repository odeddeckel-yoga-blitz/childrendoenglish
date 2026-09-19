#!/usr/bin/env node
/**
 * Custom flat illustrations for words Wikimedia photos can't serve
 * (abstract concepts, thin-letter words). Same pipeline as the number/color
 * images: inline SVG → sharp → 512x512 webp in public/images/.
 * Style: pastel rounded-square background + bold single-subject flat drawing —
 * must pass the word-image-improver metrics (esp. sole-answer) like any photo.
 *
 * Usage: node scripts/generate-illustrations.mjs [word ...]  (default: all)
 */
import sharp from 'sharp';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const imagesDir = join(__dirname, '..', 'public', 'images');

const bgRect = (color) => `<rect x="8" y="8" width="496" height="496" rx="64" fill="${color}"/>`;

const ILLUSTRATIONS = {
  zigzag: `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512">
    ${bgRect('#FEFCBF')}
    <polyline points="52,330 116,182 180,330 244,182 308,330 372,182 436,330"
      fill="none" stroke="#2B6CB0" stroke-width="30" stroke-linejoin="miter" stroke-linecap="round"/>
  </svg>`,

  unicycle: `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512">
    ${bgRect('#E0F2FE')}
    <!-- seat post + saddle -->
    <rect x="245" y="140" width="22" height="200" rx="8" fill="#DC2626"/>
    <rect x="186" y="108" width="140" height="40" rx="20" fill="#1E293B"/>
    <!-- wheel -->
    <circle cx="256" cy="352" r="118" fill="none" stroke="#1E293B" stroke-width="22"/>
    <circle cx="256" cy="352" r="92" fill="none" stroke="#94A3B8" stroke-width="6"/>
    <g stroke="#64748B" stroke-width="7">
      <line x1="256" y1="352" x2="256" y2="264"/><line x1="256" y1="352" x2="256" y2="440"/>
      <line x1="256" y1="352" x2="168" y2="352"/><line x1="256" y1="352" x2="344" y2="352"/>
      <line x1="256" y1="352" x2="194" y2="290"/><line x1="256" y1="352" x2="318" y2="414"/>
      <line x1="256" y1="352" x2="318" y2="290"/><line x1="256" y1="352" x2="194" y2="414"/>
    </g>
    <!-- cranks + pedals -->
    <line x1="256" y1="352" x2="206" y2="408" stroke="#DC2626" stroke-width="12"/>
    <line x1="256" y1="352" x2="306" y2="296" stroke="#DC2626" stroke-width="12"/>
    <rect x="172" y="400" width="52" height="18" rx="7" fill="#1E293B"/>
    <rect x="288" y="286" width="52" height="18" rx="7" fill="#1E293B"/>
    <circle cx="256" cy="352" r="16" fill="#334155"/>
  </svg>`,


};

const only = process.argv.slice(2);
const targets = only.length ? only : Object.keys(ILLUSTRATIONS);
for (const word of targets) {
  const svg = ILLUSTRATIONS[word];
  if (!svg) { console.error(`no illustration defined for "${word}"`); continue; }
  const out = join(imagesDir, `${word}.webp`);
  await sharp(Buffer.from(svg)).resize(512, 512).webp({ quality: 88 }).toFile(out);
  console.log(`${word}.webp written`);
}
