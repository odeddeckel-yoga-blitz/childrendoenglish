import { describe, it, expect } from 'vitest';
import { buildSheets, mirrorPage, FLASHCARD_LAYOUTS, parsePasteList, PASTE_MAX_ITEMS, PASTE_MAX_LEN, cardStyle, styleGroups, buildStyledSheets } from '../utils/flashcardSheets';

const W = (n) => Array.from({ length: n }, (_, i) => ({ id: 'w' + i }));

describe('flashcardSheets', () => {
  it('renders N cards for a sample list across front pages', () => {
    const sheets = buildSheets(W(13), 6);
    const fronts = sheets.filter(s => s.side === 'front');
    expect(fronts.length).toBe(3); // 6+6+1
    const rendered = fronts.flatMap(s => s.cells).filter(Boolean);
    expect(rendered.length).toBe(13);
  });

  it('alternates front/back pages for duplex printing', () => {
    const sheets = buildSheets(W(10), 4);
    expect(sheets.map(s => s.side)).toEqual(['front', 'back', 'front', 'back', 'front', 'back']);
  });

  it('THE WEDGE: back pages mirror each row\'s columns so duplex aligns', () => {
    // 2x2: front [A B / C D] → back must be [B A / D C]
    const [front, back] = buildSheets(W(4), 4);
    const ids = (cells) => cells.map(c => c?.id);
    expect(ids(front.cells)).toEqual(['w0', 'w1', 'w2', 'w3']);
    expect(ids(back.cells)).toEqual(['w1', 'w0', 'w3', 'w2']);
  });

  it('3x3 mirroring reverses each row independently', () => {
    const [, back] = buildSheets(W(9), 9);
    expect(back.cells.map(c => c.id)).toEqual(['w2', 'w1', 'w0', 'w5', 'w4', 'w3', 'w8', 'w7', 'w6']);
  });

  it('partial last sheet still aligns: padding happens before mirroring', () => {
    // 5 words on a 2x3 sheet: front [A B / C D / E -] → back [B A / D C / - E]
    const sheets = buildSheets(W(5), 6);
    const back = sheets[1];
    expect(back.cells.map(c => c?.id ?? null)).toEqual(['w1', 'w0', 'w3', 'w2', null, 'w4']);
  });

  it('every layout cell count matches its grid', () => {
    for (const [per, { cols, rows }] of Object.entries(FLASHCARD_LAYOUTS)) {
      expect(cols * rows).toBe(Number(per));
      const [front, back] = buildSheets(W(Number(per)), Number(per));
      expect(front.cells.length).toBe(Number(per));
      expect(back.cells.length).toBe(Number(per));
    }
  });

  it('mirrorPage is an involution on full pages (mirror twice = identity)', () => {
    const page = W(9);
    const twice = mirrorPage(mirrorPage(page, 3, 3), 3, 3);
    expect(twice.map(c => c.id)).toEqual(page.map(c => c.id));
  });
});

describe('parsePasteList (Paste a list guards)', () => {
  const byWord = Object.assign(Object.create(null), { dog: { id: 'dog', w: 'dog', img: '/images/dog.webp' } });

  it('gives known words our photo and unknown words a text card', () => {
    const out = parsePasteList('Dog\nrocket ship', byWord);
    expect(out[0].img).toBe('/images/dog.webp');
    expect(out[1]).toEqual({ id: null, w: 'rocket ship', he: '', es: '', img: null });
  });

  it('treats prototype names as plain text, never as objects', () => {
    const out = parsePasteList('constructor\n__proto__\ntoString\nhasOwnProperty', {});
    expect(out.map((w) => w.w)).toEqual(['constructor', '__proto__', 'toString', 'hasOwnProperty']);
    out.forEach((w) => { expect(w.img).toBeNull(); expect(typeof w.w).toBe('string'); });
  });

  it('keeps markup as inert text and never lets text pick an image', () => {
    const out = parsePasteList('<img src=x onerror=alert(1)>\njavascript:alert(1)', byWord);
    expect(out[0].w).toBe('<img src=x onerror=alert(1)>');
    out.forEach((w) => expect(w.img).toBeNull());
  });

  it('strips control, zero-width and bidi-override characters', () => {
    const out = parsePasteList('ca‮t​\u0007\nd﻿og', byWord);
    expect(out[0].w).toBe('cat');
    expect(out[1].id).toBe('dog');
  });

  it('caps item length, item count, and drops blanks and duplicates', () => {
    expect(parsePasteList('x'.repeat(5000), {})[0].w).toHaveLength(PASTE_MAX_LEN);
    const many = Array.from({ length: 1000 }, (_, i) => `w${i}`).join('\n');
    expect(parsePasteList(many, {})).toHaveLength(PASTE_MAX_ITEMS);
    expect(parsePasteList(' , ;\n\n dog, DOG ,dog', byWord)).toHaveLength(1);
    expect(parsePasteList(null, byWord)).toEqual([]);
  });
});

describe('one picture style per sheet (step 4, 11-08)', () => {
  const P = (n) => Array.from({ length: n }, (_, i) => ({ id: 'p' + i, img: '/images/p' + i + '.webp' }));
  const D = (n) => Array.from({ length: n }, (_, i) => ({ id: 'd' + i, img: '/images/d' + i + '.webp', d: 1 }));
  const T = (n) => Array.from({ length: n }, (_, i) => ({ id: null, w: 't' + i, img: null }));
  // photos and drawings interleaved, plus two pasted text words
  const mixed = [...P(5), ...D(3)].sort((a, b) => a.id.slice(1) - b.id.slice(1)).concat(T(2));

  it('classes a card as photo, drawn or text', () => {
    expect(cardStyle(P(1)[0])).toBe('photo');
    expect(cardStyle(D(1)[0])).toBe('drawn');
    expect(cardStyle(T(1)[0])).toBe('text');
  });

  it('"both" keeps every card and never mixes styles on one sheet', () => {
    const sheets = buildStyledSheets(mixed, 4, 'both');
    const fronts = sheets.filter((s) => s.side === 'front');
    expect(fronts.flatMap((s) => s.cells).filter(Boolean)).toHaveLength(10);
    for (const s of sheets) expect(new Set(s.cells.filter(Boolean).map(cardStyle)).size).toBeLessThanOrEqual(1);
    // the old buildSheets put a drawing on the first photo sheet
    expect(new Set(buildSheets(mixed, 4)[0].cells.map(cardStyle)).size).toBeGreaterThan(1);
  });

  it('"photo" / "drawn" keep that style (and text cards) only', () => {
    expect(styleGroups(mixed, 'photo').flat().map(cardStyle).filter((s) => s === 'drawn')).toEqual([]);
    expect(styleGroups(mixed, 'drawn').flat().map(cardStyle).filter((s) => s === 'photo')).toEqual([]);
    expect(styleGroups(mixed, 'drawn').flat()).toHaveLength(5);
  });
});
