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
  oven: `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512">
    ${bgRect('#F1F5F9')}
    <rect x="106" y="96" width="300" height="330" rx="18" fill="#64748B"/>
    <rect x="126" y="116" width="260" height="52" rx="10" fill="#475569"/>
    <circle cx="156" cy="142" r="13" fill="#CBD5E1"/><circle cx="196" cy="142" r="13" fill="#CBD5E1"/>
    <circle cx="316" cy="142" r="13" fill="#CBD5E1"/><circle cx="356" cy="142" r="13" fill="#CBD5E1"/>
    <rect x="126" y="188" width="260" height="210" rx="12" fill="#334155"/>
    <rect x="146" y="208" width="220" height="150" rx="8" fill="#FDE68A"/>
    <rect x="156" y="288" width="200" height="10" fill="#78350F"/>
    <ellipse cx="256" cy="272" rx="64" ry="24" fill="#D97706"/>
    <rect x="196" y="374" width="120" height="12" rx="6" fill="#94A3B8"/>
  </svg>`,

  olive: `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512">
    ${bgRect('#F7FEE7')}
    <path d="M 256 96 Q 330 120 368 190" fill="none" stroke="#65A30D" stroke-width="10" stroke-linecap="round"/>
    <path d="M 300 108 Q 330 84 366 96 Q 356 130 318 132 Q 302 124 300 108 Z" fill="#84CC16"/>
    <path d="M 336 148 Q 372 132 402 152 Q 386 184 350 178 Q 338 164 336 148 Z" fill="#84CC16"/>
    <ellipse cx="200" cy="270" rx="62" ry="78" fill="#65A30D"/>
    <ellipse cx="182" cy="244" rx="16" ry="24" fill="#A3E635" fill-opacity="0.6"/>
    <ellipse cx="316" cy="300" rx="58" ry="74" fill="#3F6212"/>
    <ellipse cx="300" cy="276" rx="14" ry="22" fill="#84CC16" fill-opacity="0.5"/>
    <ellipse cx="252" cy="392" rx="54" ry="66" fill="#1C1917"/>
    <ellipse cx="238" cy="370" rx="12" ry="18" fill="#57534E" fill-opacity="0.7"/>
  </svg>`,

  pirate: `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512">
    ${bgRect('#FEF3C7')}
    <path d="M 176 128 Q 180 70 256 70 Q 332 70 336 128 L 348 132 Q 352 146 336 146 L 176 146 Q 160 146 164 132 Z" fill="#1E293B"/>
    <path d="M 214 96 m -6 0 a 6 6 0 1 0 12 0 a 6 6 0 1 0 -12 0 M 238 88 l 12 12 M 250 88 l -12 12" stroke="#F8FAFC" stroke-width="4" fill="#F8FAFC"/>
    <circle cx="256" cy="188" r="54" fill="#FCD9B8"/>
    <ellipse cx="234" cy="182" rx="14" ry="16" fill="#1E293B"/>
    <path d="M 220 150 L 250 168" stroke="#1E293B" stroke-width="8"/>
    <circle cx="278" cy="184" r="7" fill="#3E2723"/>
    <path d="M 240 216 Q 258 230 276 214" fill="none" stroke="#B5651D" stroke-width="6" stroke-linecap="round"/>
    <circle cx="310" cy="206" r="8" fill="#FBBF24"/>
    <path d="M 204 258 Q 256 240 308 258 L 308 380 L 204 380 Z" fill="#DC2626"/>
    <path d="M 204 300 L 308 300 L 308 320 L 204 320 Z" fill="#F8FAFC"/>
    <rect x="178" y="262" width="28" height="104" rx="14" fill="#DC2626"/>
    <rect x="306" y="262" width="28" height="104" rx="14" fill="#DC2626"/>
    <rect x="216" y="380" width="30" height="76" rx="10" fill="#78350F"/>
    <rect x="266" y="380" width="30" height="76" rx="10" fill="#78350F"/>
    <line x1="348" y1="300" x2="404" y2="230" stroke="#64748B" stroke-width="10" stroke-linecap="round"/>
    <path d="M 340 308 Q 356 322 372 306 L 360 290 Z" fill="#B45309"/>
  </svg>`,

  vet: `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512">
    ${bgRect('#F0FDF4')}
    <circle cx="230" cy="130" r="52" fill="#FCD9B8"/>
    <path d="M 178 122 A 52 52 0 0 1 282 122 L 282 110 Q 256 78 230 78 Q 204 78 178 110 Z" fill="#92400E"/>
    <circle cx="212" cy="132" r="7" fill="#3E2723"/><circle cx="248" cy="132" r="7" fill="#3E2723"/>
    <path d="M 210 156 Q 230 172 250 156" fill="none" stroke="#B5651D" stroke-width="6" stroke-linecap="round"/>
    <path d="M 176 202 Q 230 184 284 202 L 298 420 L 162 420 Z" fill="#34D399"/>
    <rect x="144" y="206" width="28" height="118" rx="14" fill="#34D399"/>
    <rect x="286" y="206" width="28" height="118" rx="14" fill="#34D399"/>
    <path d="M 208 204 Q 202 262 224 280" fill="none" stroke="#065F46" stroke-width="7" stroke-linecap="round"/>
    <circle cx="230" cy="290" r="15" fill="#065F46"/>
    <!-- dog patient -->
    <ellipse cx="366" cy="380" rx="76" ry="52" fill="#D97706"/>
    <circle cx="404" cy="330" r="38" fill="#D97706"/>
    <path d="M 380 302 Q 372 274 392 276 Q 400 292 396 306 Z" fill="#92400E"/>
    <path d="M 428 302 Q 436 274 416 276 Q 408 292 412 306 Z" fill="#92400E"/>
    <circle cx="394" cy="326" r="6" fill="#3E2723"/><circle cx="416" cy="326" r="6" fill="#3E2723"/>
    <ellipse cx="406" cy="344" rx="9" ry="7" fill="#3E2723"/>
    <path d="M 296 372 Q 316 356 336 372" fill="none" stroke="#92400E" stroke-width="10" stroke-linecap="round"/>
  </svg>`,

  wizard: `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512">
    ${bgRect('#EDE9FE')}
    <path d="M 256 40 L 330 168 L 182 168 Z" fill="#7C3AED"/>
    <path d="M 268 92 l 5 11 12 2 -9 8 2 12 -10 -6 -10 6 2 -12 -9 -8 12 -2 Z" fill="#FDE047"/>
    <ellipse cx="256" cy="170" rx="94" ry="16" fill="#6D28D9"/>
    <circle cx="256" cy="212" r="46" fill="#FCD9B8"/>
    <circle cx="240" cy="208" r="6" fill="#3E2723"/><circle cx="272" cy="208" r="6" fill="#3E2723"/>
    <path d="M 216 238 Q 230 226 256 232 Q 282 226 296 238 Q 292 292 256 296 Q 220 292 216 238 Z" fill="#E5E7EB"/>
    <path d="M 208 268 Q 256 250 304 268 L 322 440 L 190 440 Z" fill="#7C3AED"/>
    <path d="M 236 300 l 4 9 10 1 -7 7 2 10 -9 -5 -9 5 2 -10 -7 -7 10 -1 Z" fill="#FDE047"/>
    <path d="M 282 350 l 4 9 10 1 -7 7 2 10 -9 -5 -9 5 2 -10 -7 -7 10 -1 Z" fill="#FDE047"/>
    <rect x="168" y="272" width="26" height="100" rx="13" fill="#7C3AED"/>
    <rect x="318" y="272" width="26" height="100" rx="13" fill="#7C3AED"/>
    <line x1="348" y1="240" x2="348" y2="430" stroke="#92400E" stroke-width="12" stroke-linecap="round"/>
    <path d="M 348 240 l 7 15 17 2 -12 12 3 17 -15 -8 -15 8 3 -17 -12 -12 17 -2 Z" fill="#FDE047"/>
  </svg>`,

  mom: `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512">
    ${bgRect('#FCE7F3')}
    <path d="M 152 128 Q 152 66 200 66 Q 248 66 248 128 L 248 236 Q 234 248 220 236 L 220 150 L 180 150 L 180 236 Q 166 248 152 236 Z" fill="#6B4423"/>
    <circle cx="200" cy="122" r="52" fill="#FCD9B8"/>
    <path d="M 148 112 A 52 52 0 0 1 252 112 L 252 102 Q 226 70 200 70 Q 174 70 148 102 Z" fill="#6B4423"/>
    <circle cx="184" cy="124" r="7" fill="#3E2723"/><circle cx="216" cy="124" r="7" fill="#3E2723"/>
    <path d="M 182 148 Q 200 164 218 148" fill="none" stroke="#B5651D" stroke-width="6" stroke-linecap="round"/>
    <path d="M 162 192 Q 200 176 238 192 L 262 340 L 138 340 Z" fill="#0D9488"/>
    <rect x="130" y="196" width="26" height="112" rx="13" fill="#FCD9B8"/>
    <rect x="244" y="196" width="26" height="112" rx="13" fill="#FCD9B8"/>
    <rect x="166" y="340" width="26" height="98" rx="10" fill="#FCD9B8"/>
    <rect x="208" y="340" width="26" height="98" rx="10" fill="#FCD9B8"/>
    <circle cx="342" cy="252" r="36" fill="#FCD9B8"/>
    <path d="M 306 246 A 36 36 0 0 1 378 246 L 378 240 Q 360 218 342 218 Q 324 218 306 240 Z" fill="#3E2723"/>
    <circle cx="330" cy="252" r="5" fill="#3E2723"/><circle cx="354" cy="252" r="5" fill="#3E2723"/>
    <path d="M 330 268 Q 342 278 354 268" fill="none" stroke="#B5651D" stroke-width="5" stroke-linecap="round"/>
    <path d="M 316 296 Q 342 284 368 296 L 368 380 L 316 380 Z" fill="#2563EB"/>
    <rect x="298" y="298" width="18" height="66" rx="9" fill="#2563EB"/>
    <rect x="368" y="298" width="18" height="66" rx="9" fill="#2563EB"/>
    <rect x="322" y="380" width="20" height="58" rx="8" fill="#374151"/>
    <rect x="350" y="380" width="20" height="58" rx="8" fill="#374151"/>
    <line x1="268" y1="318" x2="302" y2="340" stroke="#FCD9B8" stroke-width="14" stroke-linecap="round"/>
  </svg>`,

  mermaid: `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512">
    ${bgRect('#E0F2FE')}
    <path d="M 190 110 Q 190 52 256 52 Q 322 52 322 110 L 322 240 Q 306 254 292 240 L 292 130 L 220 130 L 220 240 Q 206 254 190 240 Z" fill="#B91C1C"/>
    <circle cx="256" cy="118" r="48" fill="#FCD9B8"/>
    <path d="M 208 108 A 48 48 0 0 1 304 108 L 304 98 Q 280 66 256 66 Q 232 66 208 98 Z" fill="#B91C1C"/>
    <circle cx="240" cy="120" r="6" fill="#3E2723"/><circle cx="272" cy="120" r="6" fill="#3E2723"/>
    <path d="M 240 142 Q 256 156 272 142" fill="none" stroke="#B5651D" stroke-width="5" stroke-linecap="round"/>
    <path d="M 222 178 Q 256 166 290 178 L 296 260 L 216 260 Z" fill="#A855F7"/>
    <rect x="196" y="182" width="24" height="88" rx="12" fill="#FCD9B8"/>
    <rect x="292" y="182" width="24" height="88" rx="12" fill="#FCD9B8"/>
    <path d="M 216 260 Q 256 250 296 260 Q 310 330 280 380 Q 262 404 250 418 Q 232 398 224 370 Q 204 316 216 260 Z" fill="#10B981"/>
    <path d="M 250 418 Q 216 428 196 462 Q 232 456 250 444 Q 268 456 304 462 Q 284 428 250 418 Z" fill="#059669"/>
    <path d="M 226 300 Q 256 312 286 300 M 222 336 Q 256 350 290 336" fill="none" stroke="#047857" stroke-width="5"/>
  </svg>`,

  nurse: `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512">
    ${bgRect('#EFF6FF')}
    <rect x="216" y="52" width="80" height="34" rx="8" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="5"/>
    <path d="M 248 60 L 264 60 M 256 52 L 256 78" stroke="#EF4444" stroke-width="7"/>
    <circle cx="256" cy="140" r="54" fill="#FCD9B8"/>
    <path d="M 202 132 A 54 54 0 0 1 310 132 L 310 120 Q 284 86 256 86 Q 228 86 202 120 Z" fill="#7C2D12"/>
    <circle cx="238" cy="142" r="7" fill="#3E2723"/><circle cx="274" cy="142" r="7" fill="#3E2723"/>
    <path d="M 236 166 Q 256 182 276 166" fill="none" stroke="#B5651D" stroke-width="6" stroke-linecap="round"/>
    <path d="M 200 214 Q 256 194 312 214 L 328 440 L 184 440 Z" fill="#60A5FA"/>
    <rect x="166" y="218" width="30" height="126" rx="15" fill="#60A5FA"/>
    <rect x="316" y="218" width="30" height="126" rx="15" fill="#60A5FA"/>
    <circle cx="181" cy="356" r="15" fill="#FCD9B8"/><circle cx="331" cy="356" r="15" fill="#FCD9B8"/>
    <path d="M 232 216 Q 226 282 250 302" fill="none" stroke="#1E3A8A" stroke-width="8" stroke-linecap="round"/>
    <circle cx="256" cy="312" r="18" fill="#1E3A8A"/>
    <circle cx="256" cy="312" r="9" fill="#93C5FD"/>
  </svg>`,

  ninja: `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512">
    ${bgRect('#F1F5F9')}
    <circle cx="256" cy="150" r="62" fill="#1E293B"/>
    <path d="M 198 138 Q 256 118 314 138 L 314 166 Q 256 184 198 166 Z" fill="#FCD9B8"/>
    <circle cx="234" cy="152" r="8" fill="#0F172A"/><circle cx="278" cy="152" r="8" fill="#0F172A"/>
    <rect x="188" y="108" width="136" height="18" rx="9" fill="#DC2626"/>
    <line x1="320" y1="117" x2="368" y2="96" stroke="#DC2626" stroke-width="10" stroke-linecap="round"/>
    <line x1="320" y1="117" x2="364" y2="132" stroke="#DC2626" stroke-width="10" stroke-linecap="round"/>
    <path d="M 202 224 Q 256 204 310 224 L 310 360 L 202 360 Z" fill="#1E293B"/>
    <rect x="176" y="228" width="28" height="110" rx="14" fill="#1E293B"/>
    <rect x="308" y="228" width="28" height="110" rx="14" fill="#1E293B"/>
    <rect x="214" y="360" width="32" height="92" rx="10" fill="#0F172A"/>
    <rect x="266" y="360" width="32" height="92" rx="10" fill="#0F172A"/>
    <rect x="202" y="252" width="108" height="16" fill="#DC2626"/>
    <path d="M 380 250 l 10 22 22 10 -22 10 -10 22 -10 -22 -22 -10 22 -10 Z" fill="#475569"/>
  </svg>`,

  map: `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512">
    ${bgRect('#FEF9C3')}
    <path d="M 96 100 Q 88 92 100 86 L 412 86 Q 424 92 416 100 L 416 412 Q 424 420 412 426 L 100 426 Q 88 420 96 412 Z" fill="#FDE68A" stroke="#B45309" stroke-width="8"/>
    <path d="M 140 160 Q 200 200 180 260 Q 160 320 240 330 Q 320 340 330 290" fill="none" stroke="#B45309" stroke-width="7" stroke-dasharray="2 18" stroke-linecap="round"/>
    <path d="M 348 270 L 380 302 M 380 270 L 348 302" stroke="#DC2626" stroke-width="12" stroke-linecap="round"/>
    <path d="M 150 340 L 170 310 L 190 340 Z M 180 348 L 200 318 L 220 348 Z" fill="#92400E"/>
    <circle cx="330" cy="150" r="26" fill="none" stroke="#1D4ED8" stroke-width="6"/>
    <path d="M 330 116 L 330 184 M 296 150 L 364 150" stroke="#1D4ED8" stroke-width="5"/>
    <circle cx="150" cy="130" r="10" fill="#16A34A"/><circle cx="130" cy="146" r="8" fill="#16A34A"/>
  </svg>`,

  marble: `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512">
    ${bgRect('#F0FDF4')}
    <circle cx="196" cy="230" r="86" fill="#DBEAFE" stroke="#93C5FD" stroke-width="6"/>
    <path d="M 150 200 Q 196 160 242 210 Q 196 260 158 258 Q 138 230 150 200 Z" fill="#3B82F6" fill-opacity="0.7"/>
    <circle cx="170" cy="196" r="16" fill="#FFFFFF" fill-opacity="0.8"/>
    <circle cx="340" cy="210 " r="64" fill="#FEE2E2" stroke="#FCA5A5" stroke-width="6"/>
    <path d="M 306 190 Q 340 160 376 196 Q 344 232 312 226 Z" fill="#EF4444" fill-opacity="0.7"/>
    <circle cx="320" cy="186" r="12" fill="#FFFFFF" fill-opacity="0.8"/>
    <circle cx="282" cy="342" r="56" fill="#FEF3C7" stroke="#FCD34D" stroke-width="6"/>
    <path d="M 252 326 Q 282 300 314 330 Q 288 362 258 356 Z" fill="#F59E0B" fill-opacity="0.7"/>
    <circle cx="264" cy="322" r="10" fill="#FFFFFF" fill-opacity="0.8"/>
  </svg>`,

  microphone: `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512">
    ${bgRect('#F5F3FF')}
    <g transform="rotate(24 256 256)">
      <circle cx="256" cy="150" r="80" fill="#94A3B8"/>
      <g stroke="#475569" stroke-width="4">
        <line x1="190" y1="120" x2="322" y2="120"/><line x1="180" y1="150" x2="332" y2="150"/>
        <line x1="190" y1="180" x2="322" y2="180"/><line x1="216" y1="94" x2="296" y2="94"/>
        <line x1="216" y1="206" x2="296" y2="206"/>
        <line x1="226" y1="80" x2="226" y2="220"/><line x1="256" y1="72" x2="256" y2="228"/><line x1="286" y1="80" x2="286" y2="220"/>
      </g>
      <rect x="236" y="222" width="40" height="34" fill="#334155"/>
      <path d="M 238 256 L 274 256 L 266 430 Q 256 442 246 430 Z" fill="#1E293B"/>
      <rect x="240" y="300" width="30" height="12" fill="#DC2626"/>
    </g>
  </svg>`,

  nail: `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512">
    ${bgRect('#FAFAF9')}
    <g transform="rotate(35 256 256)">
      <rect x="150" y="120" width="212" height="26" rx="10" fill="#64748B"/>
      <rect x="234" y="146" width="44" height="240" fill="#94A3B8"/>
      <path d="M 234 386 L 278 386 L 256 452 Z" fill="#94A3B8"/>
      <rect x="234" y="146" width="14" height="240" fill="#CBD5E1"/>
    </g>
  </svg>`,

  nose: `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512">
    ${bgRect('#FFF7ED')}
    <path d="M 236 96 Q 226 200 196 284 Q 176 330 200 352 Q 232 380 276 366 Q 316 352 306 316 Q 300 296 276 292 Q 262 290 258 276 Q 266 180 262 96 Z"
      fill="#FCD9B8" stroke="#E8B48E" stroke-width="8"/>
    <ellipse cx="226" cy="330" rx="16" ry="11" fill="#B5651D" transform="rotate(-20 226 330)"/>
  </svg>`,

  jar: `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512">
    ${bgRect('#FEF9C3')}
    <rect x="176" y="96" width="160" height="44" rx="14" fill="#B45309"/>
    <path d="M 186 140 L 326 140 L 344 200 L 344 400 Q 344 440 304 440 L 208 440 Q 168 440 168 400 L 168 200 Z"
      fill="#DBEAFE" fill-opacity="0.55" stroke="#93C5FD" stroke-width="9"/>
    <line x1="196" y1="220" x2="196" y2="400" stroke="#EFF6FF" stroke-width="10" stroke-linecap="round"/>
  </svg>`,

  jeans: `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512">
    ${bgRect('#F1F5F9')}
    <path d="M 166 80 L 346 80 L 366 440 L 286 440 L 262 220 L 250 220 L 226 440 L 146 440 Z" fill="#2563EB"/>
    <rect x="166" y="80" width="180" height="34" fill="#1D4ED8"/>
    <circle cx="256" cy="97" r="9" fill="#FBBF24"/>
    <path d="M 166 128 Q 196 152 212 128" fill="none" stroke="#93C5FD" stroke-width="5"/>
    <path d="M 346 128 Q 316 152 300 128" fill="none" stroke="#93C5FD" stroke-width="5"/>
    <line x1="150" y1="432" x2="224" y2="432" stroke="#93C5FD" stroke-width="6"/>
    <line x1="288" y1="432" x2="362" y2="432" stroke="#93C5FD" stroke-width="6"/>
  </svg>`,

  jelly: `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512">
    ${bgRect('#FFF1F2')}
    <ellipse cx="256" cy="404" rx="190" ry="30" fill="#E2E8F0"/>
    <path d="M 130 396 Q 120 300 150 240 Q 176 190 256 190 Q 336 190 362 240 Q 392 300 382 396 Q 350 380 320 396 Q 288 380 256 396 Q 224 380 192 396 Q 162 380 130 396 Z"
      fill="#F43F5E" fill-opacity="0.85" stroke="#BE123C" stroke-width="8"/>
    <ellipse cx="216" cy="250" rx="34" ry="18" fill="#FDA4AF" fill-opacity="0.8"/>
  </svg>`,

  'jump-rope': `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512">
    ${bgRect('#ECFEFF')}
    <path d="M 120 330 Q 110 140 256 140 Q 402 140 392 330" fill="none" stroke="#F43F5E" stroke-width="16" stroke-linecap="round"/>
    <rect x="94" y="322" width="52" height="120" rx="24" fill="#0E7490"/>
    <rect x="366" y="322" width="52" height="120" rx="24" fill="#0E7490"/>
    <rect x="104" y="322" width="32" height="26" rx="10" fill="#155E75"/>
    <rect x="376" y="322" width="32" height="26" rx="10" fill="#155E75"/>
  </svg>`,

  gift: `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512">
    ${bgRect('#FEF2F2')}
    <rect x="116" y="210" width="280" height="230" rx="14" fill="#EF4444"/>
    <rect x="96" y="160" width="320" height="66" rx="12" fill="#DC2626"/>
    <rect x="236" y="160" width="40" height="280" fill="#FDE047"/>
    <path d="M 256 158 C 200 158 176 120 200 96 C 224 76 252 108 256 150 C 260 108 288 76 312 96 C 336 120 312 158 256 158 Z" fill="#FDE047" stroke="#EAB308" stroke-width="8"/>
  </svg>`,

  glue: `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512">
    ${bgRect('#FFF7ED')}
    <rect x="236" y="52" width="40" height="34" rx="6" fill="#F97316"/>
    <path d="M 236 86 L 276 86 L 296 130 L 216 130 Z" fill="#FB923C"/>
    <rect x="176" y="130" width="160" height="270" rx="26" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="8"/>
    <rect x="196" y="190" width="120" height="140" rx="14" fill="#FDBA74"/>
    <text x="256" y="272" font-size="44" font-family="sans-serif" font-weight="bold" fill="#7C2D12" text-anchor="middle">GLUE</text>
    <path d="M 256 430 C 246 452 236 458 236 470 A 20 20 0 0 0 276 470 C 276 458 266 452 256 430 Z" fill="#E2E8F0" stroke="#CBD5E1" stroke-width="5"/>
  </svg>`,

  glasses: `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512">
    ${bgRect('#F0F9FF')}
    <circle cx="166" cy="266" r="84" fill="#DBEAFE" fill-opacity="0.5" stroke="#1E3A8A" stroke-width="14"/>
    <circle cx="346" cy="266" r="84" fill="#DBEAFE" fill-opacity="0.5" stroke="#1E3A8A" stroke-width="14"/>
    <path d="M 250 258 Q 256 240 262 258" fill="none" stroke="#1E3A8A" stroke-width="12"/>
    <line x1="82" y1="256" x2="40" y2="222" stroke="#1E3A8A" stroke-width="12" stroke-linecap="round"/>
    <line x1="430" y1="256" x2="472" y2="222" stroke="#1E3A8A" stroke-width="12" stroke-linecap="round"/>
  </svg>`,

  hammock: `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512">
    ${bgRect('#ECFDF5')}
    <rect x="56" y="120" width="26" height="320" rx="12" fill="#92400E"/>
    <circle cx="69" cy="104" r="46" fill="#22C55E"/>
    <circle cx="40" cy="132" r="34" fill="#4ADE80"/>
    <rect x="430" y="120" width="26" height="320" rx="12" fill="#92400E"/>
    <circle cx="443" cy="104" r="46" fill="#22C55E"/>
    <circle cx="472" cy="132" r="34" fill="#4ADE80"/>
    <path d="M 82 250 Q 256 380 430 250" fill="none" stroke="#F59E0B" stroke-width="10"/>
    <path d="M 120 268 Q 256 372 392 268 L 380 300 Q 256 396 132 300 Z" fill="#FBBF24"/>
    <g stroke="#D97706" stroke-width="5">
      <path d="M 150 282 Q 256 370 362 282" fill="none"/>
      <path d="M 136 292 Q 256 384 376 292" fill="none"/>
    </g>
  </svg>`,

  girl: `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512">
    ${bgRect('#FCE7F3')}
    <path d="M 178 150 Q 178 84 256 84 Q 334 84 334 150 L 334 250 Q 320 262 306 250 L 306 160 L 206 160 L 206 250 Q 192 262 178 250 Z" fill="#6B4423"/>
    <circle cx="256" cy="166" r="72" fill="#FCD9B8"/>
    <path d="M 184 150 A 72 72 0 0 1 328 150 L 328 140 Q 296 96 256 96 Q 216 96 184 140 Z" fill="#6B4423"/>
    <circle cx="230" cy="168" r="8" fill="#3E2723"/><circle cx="282" cy="168" r="8" fill="#3E2723"/>
    <path d="M 228 200 Q 256 222 284 200" fill="none" stroke="#B5651D" stroke-width="7" stroke-linecap="round"/>
    <path d="M 210 256 Q 256 240 302 256 L 340 400 L 172 400 Z" fill="#DB2777"/>
    <rect x="162" y="260" width="30" height="92" rx="15" fill="#FCD9B8"/>
    <rect x="320" y="260" width="30" height="92" rx="15" fill="#FCD9B8"/>
    <rect x="216" y="400" width="26" height="56" rx="10" fill="#FCD9B8"/>
    <rect x="270" y="400" width="26" height="56" rx="10" fill="#FCD9B8"/>
    <rect x="208" y="452" width="42" height="20" rx="10" fill="#9D174D"/>
    <rect x="262" y="452" width="42" height="20" rx="10" fill="#9D174D"/>
  </svg>`,

  ghost: `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512">
    ${bgRect('#EDE9FE')}
    <path d="M 256 70 C 160 70 130 160 130 250 L 130 400 Q 152 378 173 400 Q 194 422 215 400 Q 236 378 256 400 Q 277 422 298 400 Q 319 378 340 400 Q 361 422 382 400 L 382 250 C 382 160 352 70 256 70 Z"
      fill="#F8FAFC" stroke="#CBD5E1" stroke-width="8"/>
    <circle cx="222" cy="210" r="14" fill="#1E293B"/>
    <circle cx="290" cy="210" r="14" fill="#1E293B"/>
    <ellipse cx="256" cy="262" rx="16" ry="22" fill="#1E293B"/>
  </svg>`,

  grandma: `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512">
    ${bgRect('#F3E8FF')}
    <circle cx="256" cy="86" r="30" fill="#E5E7EB"/>
    <circle cx="256" cy="160" r="64" fill="#FCD9B8"/>
    <path d="M 192 150 A 64 64 0 0 1 320 150 L 320 136 Q 290 100 256 100 Q 222 100 192 136 Z" fill="#E5E7EB"/>
    <circle cx="232" cy="162" r="16" fill="none" stroke="#7C3AED" stroke-width="6"/>
    <circle cx="280" cy="162" r="16" fill="none" stroke="#7C3AED" stroke-width="6"/>
    <line x1="248" y1="162" x2="264" y2="162" stroke="#7C3AED" stroke-width="6"/>
    <circle cx="232" cy="164" r="6" fill="#3E2723"/><circle cx="280" cy="164" r="6" fill="#3E2723"/>
    <path d="M 232 196 Q 256 214 280 196" fill="none" stroke="#B5651D" stroke-width="6" stroke-linecap="round"/>
    <path d="M 206 238 Q 256 222 306 238 L 336 440 L 176 440 Z" fill="#7C3AED"/>
    <rect x="166" y="244" width="28" height="96" rx="14" fill="#FCD9B8"/>
    <rect x="318" y="244" width="28" height="96" rx="14" fill="#FCD9B8"/>
  </svg>`,

  grandpa: `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512">
    ${bgRect('#ECFDF5')}
    <circle cx="256" cy="160" r="64" fill="#FCD9B8"/>
    <path d="M 196 138 Q 206 112 232 106 L 232 122 Q 214 126 208 144 Z" fill="#E5E7EB"/>
    <path d="M 316 138 Q 306 112 280 106 L 280 122 Q 298 126 304 144 Z" fill="#E5E7EB"/>
    <circle cx="232" cy="158" r="16" fill="none" stroke="#334155" stroke-width="6"/>
    <circle cx="280" cy="158" r="16" fill="none" stroke="#334155" stroke-width="6"/>
    <line x1="248" y1="158" x2="264" y2="158" stroke="#334155" stroke-width="6"/>
    <circle cx="232" cy="160" r="6" fill="#3E2723"/><circle cx="280" cy="160" r="6" fill="#3E2723"/>
    <path d="M 226 196 Q 256 214 286 196 Q 276 210 256 210 Q 236 210 226 196 Z" fill="#E5E7EB"/>
    <path d="M 208 238 Q 256 222 304 238 L 304 380 L 208 380 Z" fill="#78716C"/>
    <path d="M 236 238 L 256 268 L 276 238 L 276 380 L 236 380 Z" fill="#F5F5F4"/>
    <rect x="178" y="242" width="28" height="104" rx="14" fill="#78716C"/>
    <rect x="306" y="242" width="28" height="104" rx="14" fill="#78716C"/>
    <rect x="218" y="380" width="32" height="84" rx="10" fill="#44403C"/>
    <rect x="262" y="380" width="32" height="84" rx="10" fill="#44403C"/>
    <line x1="352" y1="300" x2="352" y2="452" stroke="#92400E" stroke-width="12" stroke-linecap="round"/>
    <path d="M 352 300 Q 352 280 372 282" fill="none" stroke="#92400E" stroke-width="12" stroke-linecap="round"/>
  </svg>`,

  elevator: `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512">
    ${bgRect('#E2E8F0')}
    <rect x="120" y="90" width="272" height="360" rx="14" fill="#64748B"/>
    <rect x="196" y="60" width="120" height="34" rx="8" fill="#0F172A"/>
    <text x="256" y="86" font-size="26" font-family="sans-serif" font-weight="bold" fill="#4ADE80" text-anchor="middle">3</text>
    <rect x="138" y="110" width="112" height="320" fill="#CBD5E1" stroke="#475569" stroke-width="5"/>
    <rect x="262" y="110" width="112" height="320" fill="#CBD5E1" stroke="#475569" stroke-width="5"/>
    <rect x="404" y="220" width="44" height="100" rx="12" fill="#94A3B8"/>
    <path d="M 426 240 L 438 262 L 414 262 Z" fill="#F8FAFC"/>
    <path d="M 426 300 L 438 278 L 414 278 Z" fill="#0F172A"/>
  </svg>`,

  flag: `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512">
    ${bgRect('#F1F5F9')}
    <rect x="130" y="60" width="14" height="400" rx="7" fill="#78716C"/>
    <circle cx="137" cy="56" r="12" fill="#57534E"/>
    <path d="M 144 78 L 420 78 L 380 150 L 420 222 L 144 222 Z" fill="#DC2626"/>
    <path d="M 144 78 L 420 78 L 380 150 L 144 150 Z" fill="#EF4444"/>
  </svg>`,

  farmer: `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512">
    ${bgRect('#FEF9C3')}
    <ellipse cx="256" cy="94" rx="96" ry="20" fill="#D97706"/>
    <path d="M 200 92 Q 200 40 256 40 Q 312 40 312 92 Z" fill="#F59E0B"/>
    <circle cx="256" cy="148" r="52" fill="#FCD9B8"/>
    <circle cx="238" cy="146" r="7" fill="#3E2723"/><circle cx="274" cy="146" r="7" fill="#3E2723"/>
    <path d="M 236 172 Q 256 188 276 172" fill="none" stroke="#B5651D" stroke-width="6" stroke-linecap="round"/>
    <path d="M 202 216 Q 256 198 310 216 L 310 340 L 202 340 Z" fill="#1D4ED8"/>
    <rect x="222" y="216" width="20" height="124" fill="#3B82F6"/>
    <rect x="270" y="216" width="20" height="124" fill="#3B82F6"/>
    <rect x="176" y="218" width="28" height="104" rx="14" fill="#FCD9B8"/>
    <rect x="308" y="218" width="28" height="104" rx="14" fill="#FCD9B8"/>
    <rect x="214" y="340" width="34" height="100" rx="10" fill="#1E3A8A"/>
    <rect x="264" y="340" width="34" height="100" rx="10" fill="#1E3A8A"/>
    <line x1="330" y1="200" x2="330" y2="420" stroke="#92400E" stroke-width="12" stroke-linecap="round"/>
    <path d="M 310 200 L 350 200 M 316 200 L 316 172 M 330 200 L 330 172 M 344 200 L 344 172" stroke="#6B7280" stroke-width="8" stroke-linecap="round"/>
  </svg>`,

  fairy: `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512">
    ${bgRect('#FDF4FF')}
    <ellipse cx="176" cy="200" rx="66" ry="96" fill="#F0ABFC" opacity="0.7" transform="rotate(-20 176 200)"/>
    <ellipse cx="336" cy="200" rx="66" ry="96" fill="#F0ABFC" opacity="0.7" transform="rotate(20 336 200)"/>
    <circle cx="256" cy="150" r="44" fill="#FCD9B8"/>
    <path d="M 212 142 A 44 44 0 0 1 300 142 L 300 132 Q 278 106 256 106 Q 234 106 212 132 Z" fill="#FBBF24"/>
    <circle cx="240" cy="148" r="6" fill="#3E2723"/><circle cx="272" cy="148" r="6" fill="#3E2723"/>
    <path d="M 238 168 Q 256 182 274 168" fill="none" stroke="#B5651D" stroke-width="5" stroke-linecap="round"/>
    <path d="M 212 210 Q 256 192 300 210 L 330 400 L 182 400 Z" fill="#D946EF"/>
    <line x1="318" y1="212" x2="386" y2="140" stroke="#A21CAF" stroke-width="9" stroke-linecap="round"/>
    <path d="M 386 118 l 7 15 17 2 -12 12 3 17 -15 -8 -15 8 3 -17 -12 -12 17 -2 Z" fill="#FDE047"/>
  </svg>`,

  family: `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512">
    ${bgRect('#FEF3C7')}
    <!-- parent 1 -->
    <circle cx="140" cy="150" r="44" fill="#FCD9B8"/>
    <path d="M 96 144 A 44 44 0 0 1 184 144 L 184 132 Q 162 106 140 106 Q 118 106 96 132 Z" fill="#3E2723"/>
    <path d="M 104 196 Q 140 182 176 196 L 176 330 L 104 330 Z" fill="#0F766E"/>
    <rect x="112" y="330" width="24" height="90" rx="9" fill="#374151"/>
    <rect x="146" y="330" width="24" height="90" rx="9" fill="#374151"/>
    <!-- parent 2 -->
    <circle cx="372" cy="150" r="44" fill="#FCD9B8"/>
    <path d="M 328 148 A 44 44 0 0 1 416 148 L 416 128 Q 394 102 372 102 Q 350 102 328 128 L 328 190 Q 322 160 328 148 Z" fill="#6B4423"/>
    <path d="M 336 196 Q 372 182 408 196 L 428 340 L 316 340 Z" fill="#BE185D"/>
    <rect x="344" y="340" width="22" height="80" rx="9" fill="#FCD9B8"/>
    <rect x="378" y="340" width="22" height="80" rx="9" fill="#FCD9B8"/>
    <!-- two kids between -->
    <circle cx="222" cy="268" r="30" fill="#FCD9B8"/>
    <path d="M 192 264 A 30 30 0 0 1 252 264 L 252 258 Q 237 240 222 240 Q 207 240 192 258 Z" fill="#6B4423"/>
    <path d="M 200 302 Q 222 292 244 302 L 244 372 L 200 372 Z" fill="#2563EB"/>
    <rect x="206" y="372" width="16" height="52" rx="7" fill="#374151"/>
    <rect x="228" y="372" width="16" height="52" rx="7" fill="#374151"/>
    <circle cx="296" cy="278" r="26" fill="#FCD9B8"/>
    <path d="M 270 274 A 26 26 0 0 1 322 274 L 322 288 Q 316 252 296 252 Q 276 252 270 288 Z" fill="#3E2723"/>
    <path d="M 278 308 Q 296 300 314 308 L 314 368 L 278 368 Z" fill="#DC2626"/>
    <rect x="283" y="368" width="14" height="48" rx="6" fill="#FCD9B8"/>
    <rect x="303" y="368" width="14" height="48" rx="6" fill="#FCD9B8"/>
  </svg>`,

  apron: `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512">
    ${bgRect('#FCE7F3')}
    <path d="M 216 60 A 44 52 0 0 1 296 60" fill="none" stroke="#9D174D" stroke-width="8"/>
    <rect x="216" y="108" width="80" height="84" rx="8" fill="#DB2777"/>
    <path d="M 216 192 L 148 232 L 148 428 L 364 428 L 364 232 L 296 192 Z" fill="#EC4899"/>
    <path d="M 148 244 Q 96 258 84 232 Q 108 222 148 228 Z" fill="#9D174D"/>
    <path d="M 364 244 Q 416 258 428 232 Q 404 222 364 228 Z" fill="#9D174D"/>
    <rect x="206" y="290" width="100" height="70" rx="12" fill="#F9A8D4"/>
    <path d="M 216 192 L 296 192" stroke="#9D174D" stroke-width="8"/>
  </svg>`,

  angel: `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512">
    ${bgRect('#E0F2FE')}
    <ellipse cx="256" cy="96" rx="52" ry="14" fill="none" stroke="#FBBF24" stroke-width="10"/>
    <path d="M 176 220 Q 60 180 44 260 Q 110 300 186 280 Z" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="6"/>
    <path d="M 336 220 Q 452 180 468 260 Q 402 300 326 280 Z" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="6"/>
    <circle cx="256" cy="164" r="46" fill="#FCD9B8"/>
    <circle cx="238" cy="160" r="7" fill="#3E2723"/><circle cx="274" cy="160" r="7" fill="#3E2723"/>
    <path d="M 236 184 Q 256 200 276 184" fill="none" stroke="#B5651D" stroke-width="6" stroke-linecap="round"/>
    <path d="M 200 240 Q 256 214 312 240 L 344 440 L 168 440 Z" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="8"/>
  </svg>`,

  dad: `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512">
    ${bgRect('#FEF3C7')}
    <!-- dad -->
    <circle cx="200" cy="120" r="54" fill="#FCD9B8"/>
    <path d="M 146 112 A 54 54 0 0 1 254 112 L 254 100 Q 226 66 200 66 Q 174 66 146 100 Z" fill="#3E2723"/>
    <circle cx="182" cy="122" r="7" fill="#3E2723"/><circle cx="218" cy="122" r="7" fill="#3E2723"/>
    <path d="M 180 146 Q 200 162 220 146" fill="none" stroke="#B5651D" stroke-width="6" stroke-linecap="round"/>
    <path d="M 158 190 Q 200 172 242 190 L 242 330 L 158 330 Z" fill="#0F766E"/>
    <rect x="132" y="192" width="26" height="120" rx="13" fill="#0F766E"/>
    <rect x="242" y="192" width="26" height="130" rx="13" fill="#0F766E"/>
    <rect x="166" y="330" width="30" height="106" rx="10" fill="#374151"/>
    <rect x="206" y="330" width="30" height="106" rx="10" fill="#374151"/>
    <!-- child holding dad's hand -->
    <circle cx="342" cy="252" r="36" fill="#FCD9B8"/>
    <path d="M 306 246 A 36 36 0 0 1 378 246 L 378 240 Q 360 218 342 218 Q 324 218 306 240 Z" fill="#6B4423"/>
    <circle cx="330" cy="252" r="5" fill="#3E2723"/><circle cx="354" cy="252" r="5" fill="#3E2723"/>
    <path d="M 330 268 Q 342 278 354 268" fill="none" stroke="#B5651D" stroke-width="5" stroke-linecap="round"/>
    <path d="M 316 296 Q 342 284 368 296 L 368 380 L 316 380 Z" fill="#DC2626"/>
    <rect x="298" y="298" width="18" height="66" rx="9" fill="#DC2626"/>
    <rect x="368" y="298" width="18" height="66" rx="9" fill="#DC2626"/>
    <rect x="322" y="380" width="20" height="58" rx="8" fill="#1E3A8A"/>
    <rect x="350" y="380" width="20" height="58" rx="8" fill="#1E3A8A"/>
    <line x1="268" y1="318" x2="302" y2="340" stroke="#FCD9B8" stroke-width="14" stroke-linecap="round"/>
  </svg>`,

  doctor: `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512">
    ${bgRect('#ECFDF5')}
    <circle cx="256" cy="132" r="56" fill="#FCD9B8"/>
    <path d="M 200 124 A 56 56 0 0 1 312 124 L 312 112 Q 284 76 256 76 Q 228 76 200 112 Z" fill="#4B5563"/>
    <circle cx="236" cy="134" r="7" fill="#3E2723"/><circle cx="276" cy="134" r="7" fill="#3E2723"/>
    <path d="M 234 158 Q 256 174 278 158" fill="none" stroke="#B5651D" stroke-width="6" stroke-linecap="round"/>
    <path d="M 196 208 Q 256 186 316 208 L 332 440 L 180 440 Z" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="8"/>
    <path d="M 236 208 L 256 260 L 276 208 Z" fill="#38BDF8"/>
    <rect x="160" y="212" width="30" height="130" rx="15" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="6"/>
    <rect x="322" y="212" width="30" height="130" rx="15" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="6"/>
    <path d="M 232 214 Q 226 280 250 300" fill="none" stroke="#334155" stroke-width="8" stroke-linecap="round"/>
    <circle cx="256" cy="310" r="18" fill="#334155"/>
    <circle cx="256" cy="310" r="9" fill="#94A3B8"/>
  </svg>`,

  diamond: `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512">
    ${bgRect('#EFF6FF')}
    <polygon points="156,170 356,170 416,240 256,430 96,240" fill="#60A5FA" stroke="#1D4ED8" stroke-width="10" stroke-linejoin="round"/>
    <polygon points="156,170 216,240 256,170" fill="#93C5FD"/>
    <polygon points="256,170 296,240 356,170" fill="#BFDBFE"/>
    <polygon points="216,240 256,430 296,240" fill="#3B82F6"/>
    <line x1="96" y1="240" x2="416" y2="240" stroke="#1D4ED8" stroke-width="8"/>
    <path d="M 396 120 l 6 14 15 2 -11 10 3 15 -13 -7 -13 7 3 -15 -11 -10 15 -2 Z" fill="#FDE047"/>
    <path d="M 106 128 l 5 11 12 2 -9 8 2 12 -10 -6 -10 6 2 -12 -9 -8 12 -2 Z" fill="#FDE047"/>
  </svg>`,

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
