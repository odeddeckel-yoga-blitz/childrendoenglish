// /image-credits/ (scripts/build-credits-page.mjs) lists every traced picture and is honest about the rest
// (C2.4, 11-27). rocket was traced to a NASA public-domain Commons file on 11-27 and must be credited; the photos
// still recorded as 'unknown' have no row, so the intro must give their count instead of implying full coverage.
// Owner 11-27, STRICT credits: a re-matched photo is credited only when its licence was read live AND the match is
// near-exact (fingerprint >= 0.99, confirmed by eye). Below the bar it stays 'unknown' and is replaced; a branded
// product photo (toothbrush) is replaced and never credited.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { WORDS } from '../data/words';
import { html, counts } from '../../scripts/build-credits-page.mjs';

const root = resolve(import.meta.dirname, '../..');
const SRC = JSON.parse(readFileSync(resolve(root, 'scripts/IMAGE_SOURCES.json'), 'utf8'));
const ROCKET = 'https://commons.wikimedia.org/wiki/File:Space_Shuttle_Columbia_launching.jpg';
const CREDITED_1127 = ['surfing', 'panda', 'read_verb', 'clock', 'magnet'];
const NOT_CREDITED_1127 = ['jacket', 'turtle', 'cucumber', 'toothbrush', 'window', 'write', 'tiger'];

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
  it('11-27 re-matches: only near-exact (>= 0.99) matches are credited', () => {
    for (const id of CREDITED_1127) {
      expect(SRC[id], id).toMatchObject({ source: 'wikimedia-commons' });
      expect(SRC[id].match, id).toBeGreaterThanOrEqual(0.99);
      expect(html, id).toContain(SRC[id].url);
    }
    for (const id of NOT_CREDITED_1127) expect(SRC[id]?.source, id).toBe('unknown');
  });
  it('the branded toothbrush photo is not credited anywhere on the page', () => {
    expect(SRC.toothbrush.source).toBe('unknown');
    expect(html).not.toMatch(/Oral-B/i);
  });
});
