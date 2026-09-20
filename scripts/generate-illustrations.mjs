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
  box: `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512">
    ${bgRect('#FEF3C7')}
    <!-- cardboard box with open top flaps -->
    <polygon points="116,200 256,150 396,200 256,250" fill="#E7B26C"/>
    <polygon points="116,200 116,400 256,450 256,250" fill="#C4894F"/>
    <polygon points="396,200 396,400 256,450 256,250" fill="#B07A42"/>
    <polygon points="116,200 60,150 200,104 256,150" fill="#D9A05E"/>
    <polygon points="396,200 452,150 312,104 256,150" fill="#CE9654"/>
    <line x1="256" y1="250" x2="256" y2="450" stroke="#8A5A2B" stroke-width="6"/>
  </svg>`,

  bell: `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512">
    ${bgRect('#EDE9FE')}
    <!-- golden bell with clapper -->
    <rect x="238" y="72" width="36" height="30" rx="12" fill="#B45309"/>
    <path d="M 256 92 C 180 92 156 180 152 280 Q 150 330 110 356 L 402 356 Q 362 330 360 280 C 356 180 332 92 256 92 Z" fill="#F59E0B" stroke="#B45309" stroke-width="10"/>
    <rect x="110" y="348" width="292" height="26" rx="13" fill="#B45309"/>
    <circle cx="256" cy="408" r="26" fill="#92400E"/>
  </svg>`,

  bone: `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512">
    ${bgRect('#DBEAFE')}
    <!-- classic cartoon dog bone -->
    <g fill="#F8FAFC" stroke="#94A3B8" stroke-width="9">
      <rect x="150" y="226" width="212" height="60" rx="30"/>
      <circle cx="140" cy="222" r="46"/><circle cx="140" cy="290" r="46"/>
      <circle cx="372" cy="222" r="46"/><circle cx="372" cy="290" r="46"/>
    </g>
    <rect x="150" y="232" width="212" height="48" rx="24" fill="#F8FAFC"/>
  </svg>`,

  brush: `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512">
    ${bgRect('#FCE7F3')}
    <!-- hairbrush: paddle with bristles + handle, tilted -->
    <g transform="rotate(-30 256 256)">
      <rect x="236" y="290" width="40" height="150" rx="18" fill="#92400E"/>
      <ellipse cx="256" cy="185" rx="92" ry="120" fill="#B45309"/>
      <ellipse cx="256" cy="185" rx="70" ry="98" fill="#1F2937"/>
      <g fill="#F9FAFB">
        <circle cx="256" cy="120" r="7"/><circle cx="222" cy="140" r="7"/><circle cx="290" cy="140" r="7"/>
        <circle cx="204" cy="180" r="7"/><circle cx="256" cy="170" r="7"/><circle cx="308" cy="180" r="7"/>
        <circle cx="222" cy="220" r="7"/><circle cx="290" cy="220" r="7"/><circle cx="256" cy="250" r="7"/>
        <circle cx="204" cy="145" r="7"/><circle cx="308" cy="145" r="7"/><circle cx="238" cy="205" r="7"/>
        <circle cx="274" cy="205" r="7"/>
      </g>
    </g>
  </svg>`,

  boy: `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512">
    ${bgRect('#E0F2FE')}
    <!-- friendly flat boy figure -->
    <circle cx="256" cy="170" r="78" fill="#FCD9B8"/>
    <path d="M 178 160 A 78 78 0 0 1 334 160 L 334 148 Q 300 96 256 96 Q 212 96 178 148 Z" fill="#6B4423"/>
    <circle cx="228" cy="172" r="9" fill="#3E2723"/><circle cx="284" cy="172" r="9" fill="#3E2723"/>
    <path d="M 226 206 Q 256 230 286 206" fill="none" stroke="#B5651D" stroke-width="8" stroke-linecap="round"/>
    <path d="M 202 262 Q 256 244 310 262 L 310 372 L 202 372 Z" fill="#2563EB"/>
    <rect x="168" y="266" width="32" height="96" rx="16" fill="#2563EB"/>
    <rect x="312" y="266" width="32" height="96" rx="16" fill="#2563EB"/>
    <circle cx="184" cy="370" r="14" fill="#FCD9B8"/><circle cx="328" cy="370" r="14" fill="#FCD9B8"/>
    <rect x="212" y="372" width="38" height="84" rx="10" fill="#374151"/>
    <rect x="262" y="372" width="38" height="84" rx="10" fill="#374151"/>
    <rect x="204" y="452" width="54" height="22" rx="11" fill="#DC2626"/>
    <rect x="254" y="452" width="54" height="22" rx="11" fill="#DC2626"/>
  </svg>`,

  can: `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512">
    ${bgRect('#FEE2E2')}
    <!-- soda can: silver top with pull tab, red body with a plain wave band -->
    <rect x="176" y="128" width="160" height="290" rx="14" fill="#EF4444"/>
    <path d="M176 240 Q 226 210 256 240 T 336 240 L 336 300 Q 286 330 256 300 T 176 300 Z" fill="#FECACA"/>
    <ellipse cx="256" cy="418" rx="80" ry="18" fill="#B91C1C"/>
    <ellipse cx="256" cy="128" rx="80" ry="22" fill="#D1D5DB" stroke="#6B7280" stroke-width="5"/>
    <rect x="238" y="106" width="36" height="14" rx="7" fill="#6B7280"/>
    <circle cx="256" cy="122" r="9" fill="#9CA3AF" stroke="#4B5563" stroke-width="4"/>
  </svg>`,

  cap: `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512">
    ${bgRect('#FEF9C3')}
    <!-- baseball cap, side view, brim pointing left -->
    <path d="M 140 300 A 118 118 0 0 1 376 300 Z" fill="#2563EB"/>
    <path d="M 258 182 A 118 118 0 0 0 140 300 L 200 300 Q 210 220 258 182 Z" fill="#1D4ED8"/>
    <rect x="36" y="288" width="190" height="30" rx="15" fill="#1E40AF"/>
    <rect x="140" y="296" width="240" height="20" rx="10" fill="#1D4ED8"/>
    <circle cx="258" cy="180" r="12" fill="#1E3A8A"/>
    <path d="M 258 182 Q 290 230 300 300" fill="none" stroke="#1E40AF" stroke-width="6"/>
  </svg>`,

  cartoon: `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512">
    ${bgRect('#EDE9FE')}
    <!-- retro TV playing a cartoon: smiling character on screen -->
    <line x1="180" y1="140" x2="130" y2="60" stroke="#6D28D9" stroke-width="12" stroke-linecap="round"/>
    <line x1="332" y1="140" x2="382" y2="60" stroke="#6D28D9" stroke-width="12" stroke-linecap="round"/>
    <rect x="96" y="140" width="320" height="250" rx="26" fill="#7C3AED"/>
    <rect x="124" y="168" width="264" height="194" rx="14" fill="#FEF3C7"/>
    <circle cx="256" cy="252" r="58" fill="#F59E0B"/>
    <path d="M 236 226 Q 246 210 252 226" fill="none" stroke="#78350F" stroke-width="7" stroke-linecap="round"/>
    <circle cx="238" cy="244" r="8" fill="#78350F"/><circle cx="276" cy="244" r="8" fill="#78350F"/>
    <path d="M 230 272 Q 256 296 282 272" fill="none" stroke="#78350F" stroke-width="8" stroke-linecap="round"/>
    <path d="M 300 200 l 8 16 17 2 -12 12 3 17 -16 -8 -16 8 3 -17 -12 -12 17 -2 Z" fill="#EF4444"/>
    <rect x="180" y="390" width="30" height="24" rx="6" fill="#5B21B6"/>
    <rect x="302" y="390" width="30" height="24" rx="6" fill="#5B21B6"/>
  </svg>`,

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
