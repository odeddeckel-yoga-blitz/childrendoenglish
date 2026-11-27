// /image-credits/ (scripts/build-credits-page.mjs) lists every traced picture and is honest about the rest
// (C2.4, 11-27). rocket was traced to a NASA public-domain Commons file on 11-27 and must be credited; the photos
// still recorded as 'unknown' have no row, so the intro must give their count instead of implying full coverage.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { WORDS } from '../data/words';
import { html, counts } from '../../scripts/build-credits-page.mjs';

const root = resolve(import.meta.dirname, '../..');
const SRC = JSON.parse(readFileSync(resolve(root, 'scripts/IMAGE_SOURCES.json'), 'utf8'));
const ROCKET = 'https://commons.wikimedia.org/wiki/File:Space_Shuttle_Columbia_launching.jpg';

describe('image credits page', () => {
  it('rocket is traced: NASA, public domain, Commons file page', () => {
    expect(SRC.rocket).toMatchObject({ source: 'wikimedia-commons', url: ROCKET, author: 'NASA', licence: 'Public domain' });
  });
  it('the credits page lists rocket with its file page', () => {
    const li = html.split('<li>').find((l) => l.includes('/vocabulary/transport/rocket/'));
    expect(li).toBeDefined();
    expect(li).toContain(ROCKET);
    expect(li).toContain('NASA');
  });
  it('every traced Commons photo has a row', () => {
    const commons = WORDS.filter((w) => SRC[w.id]?.source === 'wikimedia-commons');
    expect(counts.commons).toBe(commons.length);
    for (const w of commons) expect(html).toContain(SRC[w.id].url);
  });
  it('the intro states how many untraced photos are not listed', () => {
    const untraced = WORDS.filter((w) => SRC[w.id]?.source === 'unknown').length;
    expect(counts.untraced).toBe(untraced);
    if (untraced) expect(html).toMatch(new RegExp(`${untraced} older photos? (are|is) not listed on this page`));
    else expect(html).not.toContain('class="untraced"');
  });
});
