#!/usr/bin/env node

/**
 * Optimize all images in public/images/ to 512x512 webp format.
 * Usage: node scripts/optimize-images.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const IMAGES_DIR = path.join(__dirname, '..', 'public', 'images');

async function main() {
  const files = fs.readdirSync(IMAGES_DIR).filter(f =>
    /\.(jpg|jpeg|png|gif|webp|bmp|tiff)$/i.test(f)
  );

  console.log(`Optimizing ${files.length} images...`);

  for (const file of files) {
    const inputPath = path.join(IMAGES_DIR, file);
    const outputName = path.basename(file, path.extname(file)) + '.webp';
    const outputPath = path.join(IMAGES_DIR, outputName);

    try {
      await sharp(inputPath)
        .resize(512, 512, { fit: 'cover' })
        .webp({ quality: 80 })
        .toFile(outputPath + '.tmp');

      // Replace original if different format
      if (outputPath !== inputPath) {
        fs.unlinkSync(inputPath);
      }
      fs.renameSync(outputPath + '.tmp', outputPath);

      const stats = fs.statSync(outputPath);
      console.log(`  ${outputName}: ${(stats.size / 1024).toFixed(1)}KB`);
    } catch (err) {
      console.error(`  Failed: ${file} - ${err.message}`);
    }
  }

  console.log('Done!');
}

main().catch(console.error);
