import sharp from 'sharp';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, '..', 'public');

// Blue gradient matching app theme (#2563eb)
function createGradientSVG(width, height) {
  return `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#3b82f6"/>
        <stop offset="100%" style="stop-color:#1d4ed8"/>
      </linearGradient>
    </defs>
    <rect width="${width}" height="${height}" fill="url(#bg)" rx="${Math.round(width * 0.15)}"/>
  </svg>`;
}

// Favicon: 512x512 blue gradient with white "ABC" text
async function generateFavicon() {
  const size = 512;
  const bg = Buffer.from(createGradientSVG(size, size));
  const textOverlay = Buffer.from(`<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
    <text x="50%" y="42%" text-anchor="middle" dominant-baseline="central"
      font-family="Arial, Helvetica, sans-serif" font-size="160" font-weight="bold"
      fill="white" letter-spacing="8">ABC</text>
    <text x="50%" y="72%" text-anchor="middle" dominant-baseline="central"
      font-family="Arial, Helvetica, sans-serif" font-size="52" font-weight="600"
      fill="rgba(255,255,255,0.9)">abc</text>
  </svg>`);

  await sharp(bg)
    .composite([{ input: textOverlay, blend: 'over' }])
    .png()
    .toFile(join(publicDir, 'favicon.png'));

  console.log('Generated favicon.png (512x512)');
}

// PWA icon: 192x192
async function generatePWAIcon() {
  const size = 192;
  const bg = Buffer.from(createGradientSVG(size, size));
  const textOverlay = Buffer.from(`<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
    <text x="50%" y="42%" text-anchor="middle" dominant-baseline="central"
      font-family="Arial, Helvetica, sans-serif" font-size="60" font-weight="bold"
      fill="white" letter-spacing="3">ABC</text>
    <text x="50%" y="72%" text-anchor="middle" dominant-baseline="central"
      font-family="Arial, Helvetica, sans-serif" font-size="20" font-weight="600"
      fill="rgba(255,255,255,0.9)">abc</text>
  </svg>`);

  await sharp(bg)
    .composite([{ input: textOverlay, blend: 'over' }])
    .png()
    .toFile(join(publicDir, 'icon-192.png'));

  console.log('Generated icon-192.png (192x192)');
}

// OG Image: 1200x630 blue gradient with title
async function generateOGImage() {
  const width = 1200;
  const height = 630;
  const bg = Buffer.from(`<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#3b82f6"/>
        <stop offset="100%" style="stop-color:#1d4ed8"/>
      </linearGradient>
    </defs>
    <rect width="${width}" height="${height}" fill="url(#bg)"/>
  </svg>`);

  const textOverlay = Buffer.from(`<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <!-- Decorative circles -->
    <circle cx="100" cy="100" r="60" fill="rgba(255,255,255,0.08)"/>
    <circle cx="1100" cy="530" r="80" fill="rgba(255,255,255,0.08)"/>
    <circle cx="1050" cy="100" r="40" fill="rgba(255,255,255,0.06)"/>
    <circle cx="150" cy="500" r="50" fill="rgba(255,255,255,0.06)"/>

    <!-- ABC badge -->
    <rect x="490" y="60" width="220" height="70" rx="35" fill="rgba(255,255,255,0.15)"/>
    <text x="600" y="105" text-anchor="middle" dominant-baseline="central"
      font-family="Arial, Helvetica, sans-serif" font-size="36" font-weight="bold"
      fill="white" letter-spacing="6">ABC</text>

    <!-- Main title -->
    <text x="600" y="250" text-anchor="middle" dominant-baseline="central"
      font-family="Arial, Helvetica, sans-serif" font-size="72" font-weight="bold"
      fill="white">Children Do English</text>

    <!-- Subtitle -->
    <text x="600" y="340" text-anchor="middle" dominant-baseline="central"
      font-family="Arial, Helvetica, sans-serif" font-size="32"
      fill="rgba(255,255,255,0.85)">Fun Vocabulary Learning for Kids</text>

    <!-- Feature pills -->
    <rect x="200" y="430" width="180" height="44" rx="22" fill="rgba(255,255,255,0.15)"/>
    <text x="290" y="457" text-anchor="middle" dominant-baseline="central"
      font-family="Arial, Helvetica, sans-serif" font-size="18" fill="white">Image Quizzes</text>

    <rect x="420" y="430" width="160" height="44" rx="22" fill="rgba(255,255,255,0.15)"/>
    <text x="500" y="457" text-anchor="middle" dominant-baseline="central"
      font-family="Arial, Helvetica, sans-serif" font-size="18" fill="white">Flashcards</text>

    <rect x="620" y="430" width="180" height="44" rx="22" fill="rgba(255,255,255,0.15)"/>
    <text x="710" y="457" text-anchor="middle" dominant-baseline="central"
      font-family="Arial, Helvetica, sans-serif" font-size="18" fill="white">Audio Challenges</text>

    <rect x="840" y="430" width="160" height="44" rx="22" fill="rgba(255,255,255,0.15)"/>
    <text x="920" y="457" text-anchor="middle" dominant-baseline="central"
      font-family="Arial, Helvetica, sans-serif" font-size="18" fill="white">Ages 6-12</text>

    <!-- Domain -->
    <text x="600" y="560" text-anchor="middle" dominant-baseline="central"
      font-family="Arial, Helvetica, sans-serif" font-size="24"
      fill="rgba(255,255,255,0.6)">childrendoenglish.com</text>
  </svg>`);

  await sharp(bg)
    .composite([{ input: textOverlay, blend: 'over' }])
    .png()
    .toFile(join(publicDir, 'og-image.png'));

  console.log('Generated og-image.png (1200x630)');
}

async function main() {
  console.log('Generating icons...\n');
  await generateFavicon();
  await generatePWAIcon();
  await generateOGImage();
  console.log('\nDone!');
}

main().catch(console.error);
