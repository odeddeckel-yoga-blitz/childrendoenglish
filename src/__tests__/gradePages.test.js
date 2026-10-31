// Grade pages /he/grade-1/ … /he/grade-6/: our words mapped by Band I level,
// units by their grade, and every page reachable from the others.
import { describe, it, expect } from 'vitest';
import { mkdtempSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { WORDS, collides } from '../data/words';
import { BAND1_BY_ID } from '../data/band1';
import { BOOKS, UNITS } from '../data/units';
import { buildGradePages } from '../../scripts/build-grade-pages.mjs';
import { BAND_CHIPS } from '../../scripts/build-band1-pages.mjs';

const escapeHtml = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

describe('grade pages', () => {
  const pages = new Map();
  const dist = mkdtempSync(join(tmpdir(), 'grades-'));
  const n = buildGradePages({ SITE: 'https://childrendoenglish.com', distDir: dist, escapeHtml, WORDS, collides, BAND1_BY_ID, BAND_CHIPS, UNITS, BOOKS,
    writePage: (p, html) => pages.set(p.slice(dist.length).replace(/index\.html$/, ''), html) });
  const html = (g) => pages.get(`/he/grade-${g}/`);
  const data = (g) => JSON.parse(html(g).match(/id="unit-data">(.*?)<\/script>/s)[1]);

  it('six pages, each with its exact "אנגלית לכיתה X" H1 and title, and 10–20 words', () => {
    expect(n).toBe(6);
    ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳'].forEach((he, i) => {
      expect(html(i + 1)).toContain(`<title>אנגלית לכיתה ${he} — `);
      expect(html(i + 1)).toContain(`אנגלית לכיתה ${he}</h1>`);
      expect(data(i + 1).length).toBeGreaterThanOrEqual(10);
      expect(data(i + 1).length).toBeLessThanOrEqual(20);
    });
  });
  it('words go up the Band I levels (pre → Core I → Core II) and never repeat across grades', () => {
    const lvl = (g) => new Set(data(g).map((w) => BAND1_BY_ID[w.id]));
    expect([...lvl(1)]).toEqual(['pre']); expect([...lvl(3)]).toEqual(['c1']); expect([...lvl(6)]).toEqual(['c2']);
    const all = [1, 2, 3, 4, 5, 6].flatMap((g) => data(g).map((w) => w.id));
    expect(new Set(all).size).toBe(all.length);
  });
  it('each grade lists the live units tagged with it', () => {
    for (const u of UNITS.filter((x) => !x.test)) {
      const g = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳'].indexOf(u.grade) + 1;
      expect(html(g)).toContain(`href="/units/${u.book}/unit-${u.unit}/"`);
    }
  });
});
