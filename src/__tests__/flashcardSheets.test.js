import { describe, it, expect } from 'vitest';
import { buildSheets, mirrorPage, FLASHCARD_LAYOUTS } from '../utils/flashcardSheets';

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
