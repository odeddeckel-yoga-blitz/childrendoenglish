/** @module flashcardSheets — pure sheet-building logic for the printable
 * flashcard maker (/tools/flashcard-maker/).
 *
 * THE WEDGE FEATURE: double-sided alignment. Printers flip sheets on the long
 * edge, which mirrors columns left↔right. So every BACK page lays out the same
 * rows as its front page but with each row's columns REVERSED — card fronts and
 * backs then land exactly on top of each other on a duplex print. This is what
 * the free incumbents don't do.
 *
 * IMPORTANT: this file is also injected VERBATIM into the generated tool.js by
 * scripts/generate-seo-pages.js (single source of truth) — keep it dependency-
 * free vanilla JS: no imports, no exports other than the marked block below.
 */

/* flashcard-logic:start */
const FLASHCARD_LAYOUTS = {
  4: { cols: 2, rows: 2 },
  6: { cols: 2, rows: 3 },
  9: { cols: 3, rows: 3 },
};

/** Split words into per-sheet chunks of cols×rows. */
function chunkWords(words, perPage) {
  const out = [];
  for (let i = 0; i < words.length; i += perPage) out.push(words.slice(i, i + perPage));
  return out;
}

/** Mirror one page's cell order for the back side: row-major order with each
 *  row's columns reversed. Pads short pages with nulls FIRST so partially
 *  filled last sheets still align front-to-back. */
function mirrorPage(pageWords, cols, rows) {
  const padded = pageWords.slice();
  while (padded.length < cols * rows) padded.push(null);
  const mirrored = [];
  for (let r = 0; r < rows; r++) {
    const row = padded.slice(r * cols, (r + 1) * cols);
    mirrored.push(...row.reverse());
  }
  return mirrored;
}

/** Build the full print sequence: [frontPage, backPage, frontPage, backPage, …]
 *  Each entry: { side: 'front'|'back', cells: (word|null)[] } with cells in
 *  row-major render order. */
function buildSheets(words, perPage) {
  const layout = FLASHCARD_LAYOUTS[perPage];
  if (!layout) throw new Error('unsupported layout: ' + perPage);
  const pages = chunkWords(words, perPage);
  const out = [];
  for (const page of pages) {
    const padded = page.slice();
    while (padded.length < perPage) padded.push(null);
    out.push({ side: 'front', cells: padded });
    out.push({ side: 'back', cells: mirrorPage(page, layout.cols, layout.rows) });
  }
  return out;
}
/* flashcard-logic:end */

export { FLASHCARD_LAYOUTS, chunkWords, mirrorPage, buildSheets };
