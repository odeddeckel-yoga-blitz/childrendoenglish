// The manifest's maskable icons and the apple-touch-icon must be opaque and full-bleed with the
// lettering inside the safe zone (audit 11-18 M1: the `any` icons' transparent corners showed through
// the launcher mask). Regenerate with `node scripts/generate-icons.js maskable`.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import sharp from 'sharp';

const root = resolve(import.meta.dirname, '../..');
const pub = (f) => resolve(root, 'public', f);

describe('full-bleed icons', () => {
  for (const [file, size, safe] of [['icon-maskable-192.png', 192, 0.4], ['icon-maskable-512.png', 512, 0.4], ['apple-touch-icon.png', 180, 0.45]]) {
    it(`${file}: ${size}px, no alpha, blue to the corners, white only inside ${safe * 100}% of the centre`, async () => {
      const { data, info } = await sharp(pub(file)).raw().toBuffer({ resolveWithObject: true });
      expect([info.width, info.height, info.channels]).toEqual([size, size, 3]);
      const px = (x, y) => { const i = (y * size + x) * 3; return [data[i], data[i + 1], data[i + 2]]; };
      for (const [x, y] of [[0, 0], [size - 1, 0], [0, size - 1], [size - 1, size - 1]]) {
        const [r, g, b] = px(x, y);
        expect(b).toBeGreaterThan(180); // the gradient, not a transparent/black corner
        expect(r).toBeLessThan(100);
        expect(g).toBeLessThan(160);
      }
      let outside = 0;
      for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
        const [r, g, b] = px(x, y);
        if (r > 180 && g > 180 && b > 200 && Math.hypot(x + 0.5 - size / 2, y + 0.5 - size / 2) > safe * size) outside++;
      }
      expect(outside).toBe(0);
    });
  }

  it('the manifest uses them as maskable and index.html as the apple-touch-icon', () => {
    const cfg = readFileSync(resolve(root, 'vite.config.js'), 'utf8');
    expect(cfg).toMatch(/src: 'icon-maskable-192\.png',[\s\S]{0,80}purpose: 'maskable'/);
    expect(cfg).toMatch(/src: 'icon-maskable-512\.png',[\s\S]{0,80}purpose: 'maskable'/);
    expect(cfg).not.toMatch(/src: 'icon-(192|512)\.png',[\s\S]{0,80}purpose: 'maskable'/);
    expect(readFileSync(resolve(root, 'index.html'), 'utf8')).toContain('<link rel="apple-touch-icon" href="/apple-touch-icon.png" />');
  });
});
