// Push method v2 read tooling (kit PATTERNS §3g, owner OK 11-11): the counts exporter's rows and the pre-push
// unit-lock fingerprints. The lock check must catch a title/meta change on a held SEO page, ignore what changes
// every build (copyright year, the daily game), and use the same page keys as the beacon.
import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { toRows } from '../../tools/reads/counts.mjs';
import { pageKey, fingerprint, changedUnits } from '../../tools/reads/locks.mjs';

const read = { id: 'step4-prepost', units: ['vocabulary_word'], start: '2026-11-16' };

describe('counts exporter rows', () => {
  it('n = views, k = the metric; treat = the read units, ctrl = the rest; pre/post split at the start day', () => {
    const rows = toRows([
      { day: '2026-11-15', ev: 'pg', item: 'vocabulary_word', n: 50 }, { day: '2026-11-15', ev: 'act', item: 'vocabulary_word', n: 12 },
      { day: '2026-11-16', ev: 'pg', item: 'vocabulary_word', n: 40 }, { day: '2026-11-16', ev: 'act', item: 'vocabulary_word', n: 14 },
      { day: '2026-11-16', ev: 'pg', item: 'vocabulary_animals', n: 9 }, { day: '2026-11-16', ev: 's15', item: 'vocabulary_animals', n: 3 },
    ], read);
    expect(rows).toEqual([
      { unit: 'vocabulary_word', day: '2026-11-15', group: 'treat', phase: 'pre', n: 50, k: 12 },
      { unit: 'vocabulary_animals', day: '2026-11-16', group: 'ctrl', phase: 'post', n: 9, k: 0 },
      { unit: 'vocabulary_word', day: '2026-11-16', group: 'treat', phase: 'post', n: 40, k: 14 },
    ]);
  });
  it('prefix units, a ctrl filter, and k never above n', () => {
    const rows = toRows([
      { day: '2026-11-16', ev: 'pg', item: 'printable-flashcards_food', n: 2 }, { day: '2026-11-16', ev: 'act', item: 'printable-flashcards_food', n: 3 },
      { day: '2026-11-16', ev: 'pg', item: 'units_jet-1', n: 5 }, { day: '2026-11-16', ev: 'pg', item: 'games', n: 7 },
    ], { units: ['printable-flashcards*'], start: '2026-11-11' }, { ctrl: ['units*'] });
    expect(rows.map((r) => `${r.unit}:${r.group}:${r.n}:${r.k}`)).toEqual(['printable-flashcards_food:treat:2:2', 'units_jet-1:ctrl:5:0']);
  });
});

describe('unit-lock fingerprints', () => {
  const page = (title, desc, body, year = 2026) => `<html><head><title>${title}</title><meta name="description" content="${desc}">` +
    `<link rel="canonical" href="https://childrendoenglish.com/vocabulary/food/spanish/"></head><body><h1>Comida</h1><p>${body}</p>` +
    `<script>x()</script><footer>&copy; ${year} Children Do English</footer></body></html>`;
  it('seo lane: a title or description change is caught, a body change is not', () => {
    const a = fingerprint(page('70 palabras', 'd', 'b'), 'seo');
    expect(fingerprint(page('71 palabras', 'd', 'b'), 'seo')).not.toBe(a);
    expect(fingerprint(page('70 palabras', 'd2', 'b'), 'seo')).not.toBe(a);
    expect(fingerprint(page('70 palabras', 'd', 'other body'), 'seo')).toBe(a);
  });
  it('pages lane: body text counts; the copyright year and scripts do not', () => {
    const a = fingerprint(page('t', 'd', 'b'), 'pages');
    expect(fingerprint(page('t', 'd', 'b', 2027), 'pages')).toBe(a);
    expect(fingerprint(page('t', 'd', 'b2'), 'pages')).not.toBe(a);
  });
  it('changedUnits: a changed, added or removed page marks its unit', () => {
    const snap = { vocabulary_food_spanish: { '/vocabulary/food/spanish/': 'a' }, he: { '/he/': 'b' } };
    expect(changedUnits(snap, { vocabulary_food_spanish: { '/vocabulary/food/spanish/': 'a' }, he: { '/he/': 'b' } })).toEqual([]);
    expect(changedUnits(snap, { vocabulary_food_spanish: { '/vocabulary/food/spanish/': 'x' }, he: { '/he/': 'b' } })).toEqual(['vocabulary_food_spanish']);
    expect(changedUnits(snap, { vocabulary_food_spanish: { '/vocabulary/food/spanish/': 'a' } })).toEqual(['he']);
  });
  it('page keys match the beacon (public/land-beacon.js)', () => {
    const src = fs.readFileSync(path.resolve(import.meta.dirname, '../../public/land-beacon.js'), 'utf8');
    expect(src).toContain("key = (seg.join('_') || 'root').toLowerCase().replace(/[^a-z0-9_-]/g, '-').slice(0, 40);");
    expect(pageKey('/vocabulary/animals/cat/')).toBe('vocabulary_word');
    expect(pageKey('/vocabulary/animals/spanish/')).toBe('vocabulary_animals_spanish');
    expect(pageKey('/he/')).toBe('he');
    expect(pageKey('/')).toBe('root');
  });
});
