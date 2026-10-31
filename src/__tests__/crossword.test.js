import { describe, it, expect, beforeAll } from 'vitest';
import { WORDS, collides } from '../data/words';

// public/crossword.js is a browser script that sets globalThis.cdeCrossword
let make;
beforeAll(async () => {
  await import('../../public/crossword.js');
  make = globalThis.cdeCrossword.make;
});

// a seeded random so a failure reproduces
function seeded(seed) {
  let s = seed >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}

// Every maximal run of 2+ letters, across and down, as "r,c,dir,text".
function runs(grid) {
  const out = [];
  const R = grid.length, C = grid[0].length;
  for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) {
    if (!grid[r][c]) continue;
    if (!(c > 0 && grid[r][c - 1])) {
      let t = ''; for (let k = c; k < C && grid[r][k]; k++) t += grid[r][k];
      if (t.length > 1) out.push(`${r},${c},across,${t}`);
    }
    if (!(r > 0 && grid[r - 1][c])) {
      let t = ''; for (let k = r; k < R && grid[k][c]; k++) t += grid[k][c];
      if (t.length > 1) out.push(`${r},${c},down,${t}`);
    }
  }
  return out.sort();
}

function check(res, input) {
  // every offered word is placed, unplaced or skipped, exactly once
  const accounted = [...res.placed.map((p) => p.w), ...res.unplaced, ...res.skipped];
  expect(accounted.length).toBeGreaterThanOrEqual(res.placed.length);
  for (const p of res.placed) expect(input).toContain(p.w);
  // the grid letters agree with every placed word (crossings agree)
  for (const p of res.placed) {
    for (let k = 0; k < p.word.length; k++) {
      const r = p.r + (p.dir === 'down' ? k : 0), c = p.c + (p.dir === 'down' ? 0 : k);
      expect(res.grid[r][c]).toBe(p.word[k]);
    }
  }
  // no adjacency garbage: the grid's runs are exactly the placed answers
  expect(runs(res.grid)).toEqual(res.placed.map((p) => `${p.r},${p.c},${p.dir},${p.word}`).sort());
  // connected: every word but the first crosses another
  if (res.placed.length > 1) {
    for (const p of res.placed) {
      const cells = [...p.word].map((_, k) => [p.r + (p.dir === 'down' ? k : 0), p.c + (p.dir === 'down' ? 0 : k)]);
      const crosses = res.placed.some((q) => q !== p && q.dir !== p.dir && cells.some(([r, c]) =>
        (q.dir === 'down' ? c === q.c && r >= q.r && r < q.r + q.word.length : r === q.r && c >= q.c && c < q.c + q.word.length)));
      expect(crosses).toBe(true);
    }
  }
  // clue numbers: 1..n in reading order, shared by across/down from one cell
  const starts = [...new Set(res.placed.map((p) => `${p.r},${p.c}`))];
  expect(new Set(res.placed.map((p) => p.n)).size).toBe(starts.length);
  expect(Math.max(...res.placed.map((p) => p.n))).toBe(starts.length);
}

describe('crossword generator (E2 printable sheets)', () => {
  const byCat = {};
  for (const w of WORDS) (byCat[w.category] ||= []).push(w);
  // the sheet data the pages ship: x = look-alikes in the same set (scripts/build-unit-pages.mjs sheetData)
  for (const [cat, ws] of Object.entries(byCat)) {
    byCat[cat] = ws.map((w) => ({ en: w.word, he: w.hebrewTranslation, x: ws.filter((o) => o !== w && collides(w, o)).map((o) => o.word) }));
  }

  it('lays out every category with crossings that agree and no stray words', () => {
    for (const [cat, ws] of Object.entries(byCat)) {
      for (let seed = 1; seed <= 5; seed++) {
        const res = make(ws, { rnd: seeded(seed * 97 + cat.length) });
        expect(res, cat).not.toBeNull();
        expect(res.placed.length, `${cat} placed`).toBeGreaterThanOrEqual(8);
        expect(res.rows).toBeLessThanOrEqual(15);
        expect(res.cols).toBeLessThanOrEqual(15);
        check(res, ws);
      }
    }
  });

  it('never puts two look-alike words (crocodile / alligator) in one puzzle', () => {
    for (const [cat, ws] of Object.entries(byCat)) {
      for (let seed = 1; seed <= 8; seed++) {
        const res = make(ws, { rnd: seeded(seed * 31 + cat.length) });
        const ens = new Set(res.placed.map((p) => p.w.en));
        for (const p of res.placed) for (const o of p.w.x) expect(ens.has(o), `${cat}: ${p.w.en} + ${o}`).toBe(false);
      }
    }
    expect(byCat.animals.find((w) => w.en === 'crocodile').x).toContain('alligator');
  });

  it('reports words it cannot use instead of dropping them silently', () => {
    const ws = [{ en: 'cat' }, { en: 'tiger' }, { en: 'ice cream' }, { en: 'x' }, { en: 'zzz' }];
    const res = make(ws, { rnd: seeded(3) });
    expect(res.skipped.map((w) => w.en).sort()).toEqual(['ice cream', 'x']);
    const all = [...res.placed.map((p) => p.w.en), ...res.unplaced.map((w) => w.en)].sort();
    expect(all).toEqual(['cat', 'tiger', 'zzz']);
    expect(res.unplaced.map((w) => w.en)).toContain('zzz'); // shares no letter with the others
    check(res, ws);
  });

  it('a new layout on every print', () => {
    const ws = byCat.animals;
    const a = make(ws, { rnd: seeded(1) }), b = make(ws, { rnd: seeded(2) });
    expect(JSON.stringify(a.grid)).not.toBe(JSON.stringify(b.grid));
  });
});

describe('sheet tools on the printable category pages (E2)', async () => {
  const { sheetsSection, sheetsOut, sheetData } = await import('../../scripts/build-unit-pages.mjs');
  it('Hebrew and English sections carry all three sheets', () => {
    for (const lang of ['he', 'en']) {
      const html = sheetsSection(lang) + sheetsOut('Animals', lang);
      for (const k of ['bingo', 'search', 'cross']) expect(html).toContain(`data-sheet="${k}"`);
      expect(html).toContain(`data-lang="${lang}"`);
      expect(html).toContain('<script defer src="/crossword.js"></script>');
    }
  });
  it('sheet data: photo + Hebrew for every word, the English clue only when asked, look-alikes listed', () => {
    const animals = WORDS.filter((w) => w.category === 'animals');
    const parse = (html) => JSON.parse(html.match(/id="sheet-data">(.*?)<\/script>/s)[1]);
    const he = parse(sheetData(animals)), en = parse(sheetData(animals, { def: true }));
    expect(he).toHaveLength(animals.length);
    expect(he.every((w) => w.img && w.he && !w.def)).toBe(true);
    expect(en.every((w) => w.def)).toBe(true);
    expect(he.find((w) => w.en === 'alligator').x).toContain('crocodile');
  });
});
