#!/usr/bin/env node
import sharp from 'sharp';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const imagesDir = join(__dirname, '..', 'public', 'images');

// Feeling → Twemoji codepoint(s)
const feelingEmojis = {
  happy:        '1f60a',       // 😊
  sad:          '1f622',       // 😢
  angry:        '1f620',       // 😠
  scared:       '1f628',       // 😨
  tired:        '1f634',       // 😴
  hungry:       '1f924',       // 🤤
  brave:        '1f4aa',       // 💪
  proud:        '1f979',       // 🥹
  excited:      '1f929',       // 🤩
  nervous:      '1f62c',       // 😬
  lonely:       '1f97a',       // 🥺
  confused:     '1f635-200d-1f4ab', // 😵‍💫
  shy:          '1fae3',       // 🫣
  surprised:    '1f632',       // 😲
  calm:         '1f60c',       // 😌
  bored:        '1f611',       // 😑
  jealous:      '1f612',       // 😒
  grateful:     '1f64f',       // 🙏
  embarrassed:  '1f633',       // 😳
  frustrated:   '1f624',       // 😤
  curious:      '1f9d0',       // 🧐
  worried:      '1f61f',       // 😟
  cheerful:     '1f601',       // 😁
  grumpy:       '1f623',       // 😣
};

const TWEMOJI_BASE = 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72';

async function generateEmojiImage(id, codepoint) {
  const filepath = join(imagesDir, `${id}.webp`);

  // Download Twemoji PNG
  const url = `${TWEMOJI_BASE}/${codepoint}.png`;
  const res = await fetch(url);
  if (!res.ok) {
    console.error(`  ✗ ${id} — failed to fetch ${url} (${res.status})`);
    return;
  }
  const emojiBuffer = Buffer.from(await res.arrayBuffer());

  // Resize emoji to 320x320 and composite on 512x512 pastel background
  const resizedEmoji = await sharp(emojiBuffer)
    .resize(320, 320, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  const bg = Buffer.from(`
    <svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
      <rect width="512" height="512" fill="#fff8e1" rx="24"/>
    </svg>`);

  await sharp(bg)
    .composite([{ input: resizedEmoji, top: 96, left: 96 }])
    .webp({ quality: 85 })
    .toFile(filepath);

  console.log(`  ✓ ${id}`);
}

async function main() {
  let count = 0;
  for (const [id, codepoint] of Object.entries(feelingEmojis)) {
    await generateEmojiImage(id, codepoint);
    count++;
  }
  console.log(`\nDone! Generated ${count} emoji feeling images.`);
}

main().catch(console.error);
