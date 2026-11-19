// Printable "week packs" (audit 11-18 idea 6, owner OK 11-18): one 5-page print set per word set.
//   Hebrew: /he/printables/<book>-unit-<n>/ for every live textbook unit (label "כיתה ד׳ · Jet 2 Unit 3") and
//           /he/printables/grade-<n>/ for grades 3–6 (the grade page's word set), hub /he/printables/.
//   Spanish: /es/fichas/<category>/ for the 13 categories (label "Primaria · Animales"), hub /es/fichas/.
// Pages: 1 cut-out flashcards · 2 matching + fill in the letters · 3 word search · 4 read and draw · 5 answer key.
// Print CSS only (no PDF). Everything is built here, at build time, with the worksheets' seeded shuffle, so the
// answer key printed with a sheet always matches it. Words, glosses and sentences are our own (units.js lists are the
// ECB word lists only; never the books' exercises). Page chrome = wordSetKit().shell (standard footer, breadcrumbs).
import { join } from 'path';
import { mkdirSync } from 'fs';
import { wordSetKit, heBidi, ltrRun } from './build-unit-pages.mjs';
import { shuffle } from './build-worksheets.mjs';
import { printQrBlock } from './qr-svg.mjs';
import { gradeWords, GRADE_LIST, GRADE_FOOTER_NOTE } from './build-grade-pages.mjs';

export const PACK_WORDS = 12;      // flashcards + word search
export const PACK_SIDE = 8;        // matching, fill in the letters
export const PACK_DRAW = 4;        // read and draw sentences
export const PACK_GRADES = [3, 4, 5, 6];
// Grade packs sit next to the /he/grade-N/ pages that the he-headterms read holds (to 12-12); they are new URLs and
// change nothing on the grade pages. Set false to build them noindex instead.
export const HE_GRADE_PACKS_INDEX = true;

const T = {
  he: {
    print: 'הדפסת החבילה (5 עמודים)', practice: 'תרגול המילים באתר',
    toc: ['כרטיסיות לגזירה', 'התאמה ומשלימים אותיות', 'תפזורת', 'קוראים ומציירים', 'דף פתרון'], tocH: 'מה יש בחבילה',
    name: 'שם:', date: 'תאריך:',
    cardsH: 'כרטיסיות', cardsTask: 'גוזרים לאורך הקווים המקווקווים. משחקים בזוגות: מכסים את העברית, אומרים את המילה באנגלית ובודקים.',
    matchH: 'התאמה', matchTask: 'מותחים קו מכל מילה באנגלית אל הפירוש שלה בעברית.',
    lettersH: 'משלימים אותיות', lettersTask: 'מסתכלים על התמונה או על המילה בעברית וכותבים את האותיות החסרות.',
    searchH: 'תפזורת', searchTask: 'מוצאים את המילים ומקיפים אותן. המילים כתובות משמאל לימין או מלמעלה למטה.',
    drawH: 'קוראים ומציירים', drawTask: 'קוראים כל משפט באנגלית ומציירים אותו במסגרת.',
    keyH: 'דף פתרון', keyDraw: 'כל ציור שמראה את המשפט נכון.',
    qr: 'סרקו כדי לשמוע את המילים ולתרגל באתר — חינם, בלי הרשמה',
    credit: 'תמונות: childrendoenglish.com/image-credits',
    pic: 'תמונה',
  },
  es: {
    print: 'Imprimir el paquete (5 páginas)', practice: 'Practicar las palabras en línea',
    toc: ['Tarjetas para recortar', 'Unir y completar letras', 'Sopa de letras', 'Lee y dibuja', 'Hoja de respuestas'], tocH: 'Qué trae el paquete',
    name: 'Nombre:', date: 'Fecha:',
    cardsH: 'Tarjetas', cardsTask: 'Recorta por las líneas punteadas. Juega en parejas: tapa el español, di la palabra en inglés y revisa.',
    matchH: 'Unir', matchTask: 'Une con una línea cada palabra en inglés con su significado en español.',
    lettersH: 'Completa las letras', lettersTask: 'Mira la imagen o la palabra en español y escribe las letras que faltan.',
    searchH: 'Sopa de letras', searchTask: 'Busca las palabras y enciérralas en un círculo. Van de izquierda a derecha o de arriba abajo.',
    drawH: 'Lee y dibuja', drawTask: 'Lee cada oración en inglés y haz un dibujo en el recuadro.',
    keyH: 'Hoja de respuestas', keyDraw: 'Cualquier dibujo que muestre la oración está bien.',
    qr: 'Escanea para escuchar las palabras y practicar en línea — gratis, sin registro',
    credit: 'Imágenes: childrendoenglish.com/image-credits',
    pic: 'imagen',
  },
};
const LETTERS = 'ABCDEFGHIJKLMNOP';
const hashOf = (s) => [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);

// items: [{ en, gloss, img, ex }] in the set's own order → the pack's words: single English words a child can find in
// a grid (3–10 letters, no repeats, no two with the same gloss), the ones with a picture first, the set's order kept.
export function pickPackWords(items, n = PACK_WORDS) {
  const seen = new Set(), glosses = new Set(), ok = [];
  for (const it of items) {
    const k = it.en.toLowerCase();
    if (!/^[a-z]{3,10}$/.test(k) || seen.has(k) || !it.gloss || glosses.has(it.gloss)) continue;
    seen.add(k); glosses.add(it.gloss); ok.push(it);
  }
  const withImg = ok.filter((it) => it.img), noImg = ok.filter((it) => !it.img);
  const keep = new Set([...withImg, ...noImg].slice(0, n));
  return ok.filter((it) => keep.has(it));
}

function rng(seed) {
  let s = seed >>> 0;
  return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

// Word search: left→right and top→down only (ages 8–11), seeded. Returns the grid, the placed words and their cells.
export function wordSearch(words, seed, size = 12) {
  const rnd = rng(seed);
  const grid = Array.from({ length: size }, () => Array(size).fill(''));
  const placed = [];
  for (const w of [...words].sort((a, b) => b.length - a.length || a.localeCompare(b))) {
    const W = w.toUpperCase();
    let done = W.length > size;   // longer than the grid: never listed (no impossible find)
    for (let t = 0; t < 400 && !done; t++) {
      const down = rnd() < 0.5;
      const r = Math.floor(rnd() * (down ? size - W.length + 1 : size)), c = Math.floor(rnd() * (down ? size : size - W.length + 1));
      const cells = [...W].map((_, i) => [down ? r + i : r, down ? c : c + i]);
      if (cells.every(([y, x], i) => grid[y][x] === '' || grid[y][x] === W[i])) {
        cells.forEach(([y, x], i) => { grid[y][x] = W[i]; });
        placed.push({ word: w, cells });
        done = true;
      }
    }
  }
  // (a word that found no place in 400 tries is simply not listed either)
  const AZ = 'ABCDEFGHIJKLMNOPRSTUVWY';   // fillers: no Q/X/Z (they shout "not a word")
  for (const row of grid) for (let x = 0; x < size; x++) if (!row[x]) row[x] = AZ[Math.floor(rnd() * AZ.length)];
  return { grid, placed: words.filter((w) => placed.some((p) => p.word === w)).map((w) => placed.find((p) => p.word === w)) };
}

// Fill in the letters: about 40% blanks, never the first letter, at least one.
export function blanks(word, seed) {
  const idx = shuffle([...Array(word.length).keys()].slice(1), seed);
  const n = Math.max(1, Math.round(word.length * 0.4));
  const hide = new Set(idx.slice(0, n));
  return [...word].map((ch, i) => (hide.has(i) ? null : ch));
}

// A derangement of 0..n-1 (no gloss sits on its own word's row).
function derangeIdx(n, seed) {
  for (let k = 0; k < 200; k++) {
    const a = shuffle([...Array(n).keys()], seed + k);
    if (a.every((x, i) => x !== i)) return a;
  }
  throw new Error('week packs: no derangement');
}

// Everything a pack prints, from its words (deterministic per pack id).
export function packData(id, items) {
  const words = pickPackWords(items);
  if (words.length < PACK_SIDE) throw new Error(`week pack ${id}: only ${words.length} usable words (needs ${PACK_SIDE})`);
  const seed = hashOf(id);
  const match = shuffle(words, seed).slice(0, PACK_SIDE);
  const order = derangeIdx(match.length, seed + 7);
  const right = order.map((i) => match[i]);
  const letters = shuffle(words, seed + 13).slice(0, PACK_SIDE).map((w, i) => ({ ...w, shown: blanks(w.en.toLowerCase(), seed + 31 + i) }));
  const search = wordSearch(words.map((w) => w.en.toLowerCase()), seed + 41);
  const short = (it) => it.ex && it.ex.trim().split(/\s+/).length <= 9 && new RegExp(`\\b${it.en}\\b`, 'i').test(it.ex);
  const pool = [...words, ...items.filter((it) => !words.includes(it))];
  const draw = [...pool.filter((it) => it.img && short(it)), ...pool.filter((it) => !it.img && short(it))]
    .filter((it, i, a) => a.findIndex((o) => o.ex === it.ex) === i).slice(0, PACK_DRAW);
  if (draw.length < 2) throw new Error(`week pack ${id}: needs at least 2 short example sentences`);
  return { words, match, right, letters, search, draw };
}

const PACK_CSS = `
    .pk-tools { display: flex; flex-wrap: wrap; gap: 0.5rem; justify-content: center; margin: 1.25rem 0 0.75rem; }
    .pk-tools .cta { display: inline-flex; align-items: center; }
    .pk-toc { max-width: 560px; margin: 0 auto 1.25rem; background: #fff; border-radius: 0.75rem; padding: 0.9rem 1.2rem; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
    .pk-toc h2 { font-size: 1.05rem; margin-bottom: 0.3rem; } .pk-toc ol { padding-inline-start: 1.4rem; }
    .pk-sheet { background: #fff; border-radius: 0.75rem; padding: 1.25rem; box-shadow: 0 1px 3px rgba(0,0,0,0.08); margin: 0 auto 1.5rem; max-width: 820px; }
    .pk-head { display: flex; justify-content: space-between; gap: 1rem; font-size: 0.85rem; color: #475569; border-bottom: 2px solid #2563eb; padding-bottom: 0.25rem; margin-bottom: 0.6rem; }
    .pk-label { font-weight: 800; color: #1e40af; }
    .pk-sheet h2 { font-size: 1.25rem; margin: 0.3rem 0 0.15rem; }
    .pk-task { color: #334155; margin-bottom: 0.7rem; }
    .pk-name { display: flex; gap: 1.5rem; margin-bottom: 0.8rem; color: #334155; flex-wrap: wrap; }
    .pk-name span { flex: 1; min-width: 8rem; border-bottom: 1.5px solid #94a3b8; }
    .pk-cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0; border-top: 1.5px dashed #64748b; border-inline-start: 1.5px dashed #64748b; }
    .pk-card { border-bottom: 1.5px dashed #64748b; border-inline-end: 1.5px dashed #64748b; padding: 0.5rem; text-align: center; min-height: 9.5rem; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.2rem; break-inside: avoid; }
    .pk-card img { width: 84px; height: 84px; object-fit: cover; border-radius: 0.4rem; }
    .pk-en { font-size: 1.35rem; font-weight: 800; } .pk-gl { color: #475569; }
    .pk-cols { display: flex; justify-content: space-between; gap: 2rem; direction: ltr; }
    .pk-col { display: flex; flex-direction: column; gap: 0.55rem; flex: 1; }
    .pk-col.r { align-items: flex-end; }
    .pk-item { display: flex; align-items: center; gap: 0.45rem; font-size: 1.1rem; }
    .pk-item b { color: #2563eb; min-width: 1.4rem; text-align: center; }
    .pk-dot { width: 11px; height: 11px; border-radius: 50%; background: #1e293b; flex: none; }
    .pk-letters { display: grid; grid-template-columns: 1fr 1fr; gap: 0.6rem 1.5rem; margin-top: 0.4rem; }
    .pk-lrow { display: flex; align-items: center; gap: 0.6rem; }
    .pk-cue { width: 56px; min-height: 56px; display: flex; align-items: center; justify-content: center; text-align: center; font-size: 0.85rem; color: #334155; flex: none; }
    .pk-cue img { width: 56px; height: 56px; object-fit: cover; border-radius: 0.35rem; }
    .pk-word { display: flex; gap: 0.15rem; direction: ltr; }
    .pk-lt { width: 1.55rem; height: 1.9rem; border-bottom: 2px solid #334155; text-align: center; font: 700 1.2rem/1.9rem ui-monospace, Menlo, monospace; }
    .pk-grid { display: grid; grid-template-columns: repeat(12, 2.1rem); justify-content: center; direction: ltr; margin: 0.4rem auto 0.8rem; }
    .pk-c { width: 2.1rem; height: 2.1rem; display: flex; align-items: center; justify-content: center; font: 700 1.15rem ui-monospace, Menlo, monospace; border: 1px solid #cbd5e1; }
    .pk-c.on { background: #fde68a; }
    .pk-find { display: flex; flex-wrap: wrap; gap: 0.35rem 1.1rem; justify-content: center; direction: ltr; font-weight: 700; font-size: 1.05rem; }
    .pk-draw { display: grid; grid-template-columns: 1fr 1fr; gap: 0.9rem; }
    .pk-dbox { border: 1.5px solid #64748b; border-radius: 0.5rem; padding: 0.45rem 0.6rem; min-height: 11.5rem; break-inside: avoid; }
    .pk-dbox p { font-size: 1.1rem; font-weight: 700; } .pk-dbox small { color: #475569; }
    .pk-key ol { padding-inline-start: 1.5rem; margin-bottom: 0.6rem; } .pk-key h3 { font-size: 1rem; margin: 0.6rem 0 0.2rem; }
    .pk-key .pk-grid { grid-template-columns: repeat(12, 1.45rem); } .pk-key .pk-c { width: 1.45rem; height: 1.45rem; font-size: 0.85rem; }
    .pk-credit { font-size: 0.75rem; color: #5b6779; margin-top: 0.6rem; }
    @media (max-width: 560px) {
      .pk-cards { grid-template-columns: repeat(2, 1fr); } .pk-letters, .pk-draw { grid-template-columns: 1fr; }
      .pk-grid { grid-template-columns: repeat(12, 1.6rem); } .pk-c { width: 1.6rem; height: 1.6rem; font-size: 0.9rem; }
      .pk-cols { gap: 0.75rem; } .pk-item { font-size: 0.95rem; }
    }
    @page { size: A4 portrait; margin: 11mm; }
    @media print {
      body { background: #fff; }
      .no-print, .pk-tools, .pk-toc { display: none !important; }
      .container { max-width: none; padding: 0; }
      .pk-sheet { box-shadow: none; border-radius: 0; padding: 0; margin: 0; max-width: none; break-before: page; page-break-before: always; }
      .pk-sheet.first { break-before: auto; page-break-before: auto; }
      .pk-cards { grid-template-columns: repeat(3, 1fr); } .pk-card { min-height: 4.7cm; padding: 0.15cm; }
      .pk-card img { width: 2.5cm; height: 2.5cm; }
      .pk-sheet .print-qr { margin: 2px 0 6px; } .pk-sheet .print-qr svg { width: 64px; height: 64px; }
      .pk-key ol { columns: 2; font-size: 10.5pt; } .pk-key li { break-inside: avoid; } .pk-key h3 { margin-top: 0.3cm; }
      .pk-letters, .pk-draw { grid-template-columns: 1fr 1fr; }
      .pk-grid { grid-template-columns: repeat(12, 1.15cm); } .pk-c { width: 1.15cm; height: 1.15cm; font-size: 15pt; }
      .pk-key .pk-grid { grid-template-columns: repeat(12, 0.62cm); } .pk-key .pk-c { width: 0.62cm; height: 0.62cm; font-size: 9pt; }
      .pk-dbox { min-height: 5.8cm; }
      .pk-c.on, img { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
`;

// One pack page. p = { lang, id, path, label, title, description, h1Html, intro, crumbItems, navHtml, footerNote,
// backHref, items, test }.
function packPage(kit, escapeHtml, SITE, p) {
  const t = T[p.lang], he = p.lang === 'he';
  const d = packData(p.id, p.items);
  const en = (s) => `<bdi lang="en" dir="ltr">${escapeHtml(s)}</bdi>`;
  const label = he ? heBidi(p.label) : escapeHtml(p.label);
  const head = (h, task, first = false) => `<div class="pk-head"><span class="pk-label">${label}</span><span lang="en" dir="ltr">childrendoenglish.com</span></div>
    ${first ? '' : `<div class="pk-name"><span>${t.name}</span><span>${t.date}</span></div>`}
    <h2>${h}</h2><p class="pk-task">${task}</p>`;
  const img = (it, w) => (it.img ? `<img src="${it.img}" alt="${escapeHtml(it.en)}" width="${w}" height="${w}" loading="lazy" />` : '');

  const cards = d.words.map((it) => `<div class="pk-card">${img(it, 84)}<span class="pk-en" lang="en" dir="ltr">${escapeHtml(it.en)}</span><span class="pk-gl">${escapeHtml(it.gloss)}</span></div>`).join('');
  const left = d.match.map((it, i) => `<div class="pk-item" data-n="${i + 1}" data-word="${escapeHtml(it.en)}"><b>${i + 1}</b><span lang="en">${escapeHtml(it.en)}</span><span class="pk-dot"></span></div>`).join('');
  const right = d.right.map((it, i) => `<div class="pk-item" data-letter="${LETTERS[i]}" data-word="${escapeHtml(it.en)}"><span class="pk-dot"></span><span lang="${p.lang}" dir="${he ? 'rtl' : 'ltr'}">${escapeHtml(it.gloss)}</span><b>${LETTERS[i]}</b></div>`).join('');
  const letters = d.letters.map((it, i) => `<div class="pk-lrow" data-word="${escapeHtml(it.en.toLowerCase())}"><b>${i + 1}.</b><span class="pk-cue">${it.img ? img(it, 56) : escapeHtml(it.gloss)}</span><span class="pk-word">${it.shown.map((ch) => `<span class="pk-lt">${ch || ''}</span>`).join('')}</span></div>`).join('');
  const on = new Set(d.search.placed.flatMap((p2) => p2.cells.map(([y, x]) => `${y},${x}`)));
  const gridHtml = (key) => `<div class="pk-grid">${d.search.grid.map((row, y) => row.map((ch, x) => `<span class="pk-c${key && on.has(`${y},${x}`) ? ' on' : ''}">${ch}</span>`).join('')).join('')}</div>`;
  const find = `<div class="pk-find">${d.search.placed.map((p2) => `<span>${p2.word.toUpperCase()}</span>`).join('')}</div>`;
  const draw = d.draw.map((it, i) => `<div class="pk-dbox"><p lang="en" dir="ltr">${i + 1}. ${escapeHtml(it.ex)}</p><small>${en(it.en)} = ${escapeHtml(it.gloss)}</small></div>`).join('');
  const keyMatch = d.match.map((it, i) => `<li data-n="${i + 1}" data-letter="${LETTERS[d.right.indexOf(it)]}">${en(it.en)} → <b>${LETTERS[d.right.indexOf(it)]}</b> ${escapeHtml(it.gloss)}</li>`).join('');
  const keyLetters = d.letters.map((it) => `<li>${en(it.en.toLowerCase())}</li>`).join('');

  const sheets = `
    <section class="pk-sheet first" id="pk-cards">${head(`<bdi dir="ltr">1.</bdi> ${t.cardsH}`, t.cardsTask, true)}
      ${printQrBlock(`${SITE}${p.backHref}`, t.qr, he ? 'rtl' : 'ltr')}
      <div class="pk-cards">${cards}</div>
      <p class="pk-credit">${t.credit}</p>
    </section>
    <section class="pk-sheet" id="pk-match">${head(`<bdi dir="ltr">2.</bdi> ${t.matchH}`, t.matchTask)}
      <div class="pk-cols"><div class="pk-col l">${left}</div><div class="pk-col r">${right}</div></div>
      <h2><bdi dir="ltr">3.</bdi> ${t.lettersH}</h2><p class="pk-task">${t.lettersTask}</p>
      <div class="pk-letters">${letters}</div>
    </section>
    <section class="pk-sheet" id="pk-search">${head(`<bdi dir="ltr">4.</bdi> ${t.searchH}`, t.searchTask)}
      ${gridHtml(false)}${find}
    </section>
    <section class="pk-sheet" id="pk-draw">${head(`<bdi dir="ltr">5.</bdi> ${t.drawH}`, t.drawTask)}
      <div class="pk-draw">${draw}</div>
    </section>
    <section class="pk-sheet pk-key" id="pk-key"><div class="pk-head"><span class="pk-label">${label}</span><span lang="en" dir="ltr">childrendoenglish.com</span></div>
      <h2>${t.keyH}</h2>
      <h3><bdi dir="ltr">2.</bdi> ${t.matchH}</h3><ol>${keyMatch}</ol>
      <h3><bdi dir="ltr">3.</bdi> ${t.lettersH}</h3><ol>${keyLetters}</ol>
      <h3><bdi dir="ltr">4.</bdi> ${t.searchH}</h3>${gridHtml(true)}
      <h3><bdi dir="ltr">5.</bdi> ${t.drawH}</h3><p>${t.keyDraw}</p>
    </section>`;

  const body = `
  <nav class="breadcrumb" aria-label="breadcrumb">${p.navHtml}</nav>
  <header class="hero"><h1>${p.h1Html}</h1>
    <p class="answer">${he ? heBidi(p.intro) : escapeHtml(p.intro)}</p></header>
  <main class="container">
    <div class="pk-tools"><button type="button" class="print-btn" data-print><svg class="ic" aria-hidden="true" focusable="false" style="width:1.15em;height:1.15em;vertical-align:-.2em;flex:none"><use href="/icons.svg#i-printer"/></svg> ${t.print}</button><a class="cta" href="${p.backHref}">${t.practice}</a></div>
    <div class="pk-toc"><h2>${t.tocH}</h2><ol>${t.toc.map((x) => `<li>${x}</li>`).join('')}</ol></div>
${sheets}
  </main>
  <script defer src="/print-btn.js"></script>`;
  const dir = join(p.distDir, ...p.path.split('/').filter(Boolean));
  mkdirSync(dir, { recursive: true });
  kit.writePage(join(dir, 'index.html'), kit.shell({
    path: p.path, title: p.title, description: p.description, test: !!p.test, footerNote: p.footerNote, lang: p.lang,
    schemas: [kit.crumbs(p.crumbItems)], body, css: PACK_CSS,
  }));
  return d;
}

export function buildWeekPacks({ SITE, distDir, writePage, escapeHtml, WORDS, collides, UNITS, BOOKS, BAND1_BY_ID, ES_GLOSSES, CATEGORIES, CATEGORY_NAMES_ES }) {
  const kit = { ...wordSetKit({ SITE, writePage, escapeHtml, WORDS, collides }), writePage };
  const byId = kit.byId;
  const out = { he: [], es: [] };
  const live = UNITS.filter((u) => !u.test && !BOOKS[u.book]?.test);
  const publishers = [...new Set(Object.values(BOOKS).map((b) => b.publisher).filter(Boolean))].join(' / ');
  const unitNote = `האתר אינו קשור להוצאת ${publishers} ואינו מטעמה. רשימות המילים משמשות לתרגול בלבד; תרגילים, קטעי קריאה ומבחנים מהספר אינם מועתקים לכאן. המשפטים, התרגום והתמונות הם של Children Do English.`;
  const hubHe = '/he/printables/', hubHeName = 'דפי עבודה להדפסה';

  // --- Hebrew: units ---
  for (const u of live) {
    const book = BOOKS[u.book];
    const unitName = `${book.name} Unit ${u.unit}`;
    const path = `/he/printables/${u.book}-unit-${u.unit}/`;
    const items = u.words.map((w) => ({ en: w.en, gloss: w.he, img: w.wordId ? byId.get(w.wordId)?.imageUrl || null : null, ex: w.ex || null }));
    const d = packPage(kit, escapeHtml, SITE, {
      lang: 'he', id: `he-${u.book}-${u.unit}`, path, distDir, items, footerNote: unitNote,
      label: `כיתה ${u.grade} · ${unitName}`,
      title: `${unitName} – דפי עבודה באנגלית להדפסה לכיתה ${u.grade} | Children Do English`,
      description: `חבילה לשבוע ל-${unitName}${u.title ? ` (${u.title})` : ''}: כרטיסיות, התאמה, השלמת אותיות, תפזורת וקוראים ומציירים, עם דף פתרון. 5 עמודים, חינם, בלי הרשמה.`,
      h1Html: `${ltrRun(escapeHtml(unitName))} – חבילת דפי עבודה לשבוע`,
      intro: `${PACK_WORDS} מילים מ-${unitName}${u.title ? `: ${u.title}` : ''} (כיתה ${u.grade}) ב-5 עמודים להדפסה: כרטיסיות לגזירה, התאמה, השלמת אותיות, תפזורת, קוראים ומציירים, ודף פתרון למורה או להורה. את כל ${u.words.length} מילות היחידה, עם הגייה ותרגול, יש בעמוד היחידה.`,
      crumbItems: [['עברית', '/he/'], [hubHeName, hubHe], [unitName, path]],
      navHtml: `<a href="/he/">עברית</a> › <a href="${hubHe}">${hubHeName}</a> › ${ltrRun(escapeHtml(unitName))}`,
      backHref: `/units/${u.book}/unit-${u.unit}/`,
    });
    out.he.push({ path, name: unitName, title: u.title, grade: u.grade, n: d.words.length, sample: d.words.slice(0, 4).map((w) => w.en) });
  }
  // --- Hebrew: grades 3–6 (the grade page's word set; the grade page itself is not touched) ---
  for (const n of PACK_GRADES) {
    const g = GRADE_LIST.find((x) => x.n === n);
    const path = `/he/printables/grade-${n}/`;
    const items = gradeWords(n, { WORDS, BAND1_BY_ID }).map((w) => ({ en: w.word, gloss: w.hebrewTranslation, img: w.imageUrl, ex: w.exampleSentence }));
    const d = packPage(kit, escapeHtml, SITE, {
      lang: 'he', id: `he-grade-${n}`, path, distDir, items, footerNote: GRADE_FOOTER_NOTE, test: !HE_GRADE_PACKS_INDEX,
      label: `כיתה ${g.he} · אנגלית`,
      title: `דפי עבודה באנגלית לכיתה ${g.he} להדפסה – חבילה לשבוע | Children Do English`,
      description: `דפי עבודה באנגלית לכיתה ${g.he}: ${PACK_WORDS} מילים בכרטיסיות, התאמה, השלמת אותיות, תפזורת וקוראים ומציירים, עם דף פתרון. 5 עמודים, חינם, בלי הרשמה.`,
      h1Html: `דפי עבודה באנגלית לכיתה ${g.he} – חבילה לשבוע`,
      intro: `${PACK_WORDS} מילים באנגלית שמתאימות לכיתה ${g.he}, ב-5 עמודים להדפסה: כרטיסיות לגזירה, התאמה, השלמת אותיות, תפזורת, קוראים ומציירים, ודף פתרון.`,
      crumbItems: [['עברית', '/he/'], [hubHeName, hubHe], [`כיתה ${g.he}`, path]],
      navHtml: `<a href="/he/">עברית</a> › <a href="${hubHe}">${hubHeName}</a> › כיתה ${g.he}`,
      backHref: `/he/grade-${n}/`,
    });
    out.he.push({ path, name: `כיתה ${g.he}`, grade: g.he, gradePack: true, n: d.words.length, sample: d.words.slice(0, 4).map((w) => w.en) });
  }
  // --- Hebrew hub ---
  {
    const groups = PACK_GRADES.map((n) => GRADE_LIST.find((x) => x.n === n)).map((g) => {
      const packs = out.he.filter((x) => x.grade === g.he);
      return `<h2 class="section-title">כיתה ${g.he}</h2><div class="unit-grid">${packs.map((x) => `
        <a class="unit-card" href="${x.path}"><strong>${x.gradePack ? `חבילה לכיתה ${g.he}` : `${ltrRun(escapeHtml(x.name))}`}</strong><span>${x.title ? `${ltrRun(escapeHtml(x.title))} · ` : ''}${heBidi(`${x.n} מילים: ${x.sample.join(', ')}…`)}</span></a>`).join('')}
      </div>`;
    }).join('\n');
    const dir = join(distDir, 'he', 'printables');
    mkdirSync(dir, { recursive: true });
    writePage(join(dir, 'index.html'), kit.shell({
      path: hubHe, test: false, footerNote: 'החבילות בנויות מהמילים, מהתרגום ומהמשפטים שלנו. רשימות המילים של היחידות משמשות לתרגול בלבד, והאתר אינו קשור להוצאות הספרים.',
      title: 'דפי עבודה באנגלית להדפסה – חבילה לשבוע לכל יחידה ולכל כיתה | Children Do English',
      description: `דפי עבודה באנגלית להדפסה לכיתות ג׳–ו׳: ${out.he.length} חבילות של 5 עמודים, לפי יחידה בספר ולפי כיתה — כרטיסיות, התאמה, תפזורת, קוראים ומציירים ודף פתרון. חינם.`,
      schemas: [kit.crumbs([['עברית', '/he/'], [hubHeName, hubHe]])],
      body: `
  <nav class="breadcrumb" aria-label="breadcrumb"><a href="/he/">עברית</a> › ${hubHeName}</nav>
  <header class="hero"><h1>דפי עבודה באנגלית להדפסה – חבילה לשבוע</h1>
    <p class="answer">${heBidi(`לכל יחידה מהספר ולכל כיתה מ-ג׳ עד ו׳: חבילה של 5 עמודים — כרטיסיות לגזירה, התאמה, השלמת אותיות, תפזורת, קוראים ומציירים, ודף פתרון. מדפיסים מהדפדפן, בלי הרשמה.`)}</p></header>
  <main class="container"><section class="section">
${groups}
  <p class="aligned">עוד להדפסה: <a href="/printable-flashcards/hebrew/">כרטיסיות באנגלית ובעברית</a> · <a href="/units/">יחידות לימוד עם הגייה ותרגול</a></p>
  </section></main>`,
    }));
  }

  // --- Spanish: the 13 categories ---
  const hubEs = '/es/fichas/', hubEsName = 'Fichas para imprimir';
  const LEVEL_RANK = { beginner: 0, intermediate: 1, advanced: 2 };
  for (const cat of CATEGORIES) {
    const name = CATEGORY_NAMES_ES[cat] || cat, lower = name.toLowerCase();
    const path = `/es/fichas/${cat}/`;
    const items = WORDS.filter((w) => w.category === cat && ES_GLOSSES[w.id])
      .map((w, i) => ({ w, i })).sort((a, b) => LEVEL_RANK[a.w.level] - LEVEL_RANK[b.w.level] || a.i - b.i)
      .map(({ w }) => ({ en: w.word, gloss: ES_GLOSSES[w.id], img: w.imageUrl, ex: w.exampleSentence }));
    const d = packPage(kit, escapeHtml, SITE, {
      lang: 'es', id: `es-${cat}`, path, distDir, items,
      footerNote: 'Las palabras, las traducciones, las oraciones y las fichas son de Children Do English.',
      label: `Primaria · ${name}`,
      title: `Ejercicios de vocabulario en inglés: ${lower} — fichas para imprimir | Children Do English`,
      description: `Fichas de inglés para primaria: ${PACK_WORDS} palabras de ${lower} con tarjetas, unir, completar letras, sopa de letras y lee y dibuja, con hoja de respuestas. 5 páginas gratis, sin registro.`,
      h1Html: `Fichas de inglés para imprimir: ${escapeHtml(lower)}`,
      intro: `${PACK_WORDS} palabras de ${lower} en inglés, con su traducción al español, en 5 páginas para imprimir: tarjetas para recortar, unir, completar letras, sopa de letras, lee y dibuja, y una hoja de respuestas para el maestro o la familia. Para niños de primaria.`,
      crumbItems: [['Español', '/es/'], ['Inglés para primaria', '/es/primaria/'], [hubEsName, hubEs], [name, path]],
      navHtml: `<a href="/es/">Español</a> › <a href="/es/primaria/">Inglés para primaria</a> › <a href="${hubEs}">${hubEsName}</a> › ${escapeHtml(name)}`,
      backHref: `/vocabulary/${cat}/spanish/`,
    });
    out.es.push({ path, cat, name, n: d.words.length, sample: d.words.slice(0, 4).map((w) => w.en) });
  }
  // --- Spanish hub ---
  {
    const dir = join(distDir, 'es', 'fichas');
    mkdirSync(dir, { recursive: true });
    writePage(join(dir, 'index.html'), kit.shell({
      path: hubEs, test: false, lang: 'es', footerNote: 'Las fichas usan nuestras propias palabras, traducciones y oraciones.',
      title: 'Fichas de inglés para primaria para imprimir gratis | Children Do English',
      description: `Ejercicios de vocabulario en inglés para imprimir: ${out.es.length} paquetes de 5 páginas por tema, con tarjetas, unir, sopa de letras, lee y dibuja y hoja de respuestas. Gratis, para primaria.`,
      schemas: [kit.crumbs([['Español', '/es/'], ['Inglés para primaria', '/es/primaria/'], [hubEsName, hubEs]])],
      body: `
  <nav class="breadcrumb" aria-label="breadcrumb"><a href="/es/">Español</a> › <a href="/es/primaria/">Inglés para primaria</a> › ${hubEsName}</nav>
  <header class="hero"><h1>Fichas de inglés para primaria</h1>
    <p class="answer">Un paquete de 5 páginas por tema: tarjetas para recortar, unir, completar letras, sopa de letras, lee y dibuja, y la hoja de respuestas. Cada palabra en inglés lleva su traducción al español. Se imprime desde el navegador, sin registro.</p></header>
  <main class="container"><section class="section"><div class="unit-grid">${out.es.map((x) => `
        <a class="unit-card" href="${x.path}"><strong>${escapeHtml(x.name)}</strong><span>${x.n} palabras: <span lang="en">${escapeHtml(x.sample.join(', '))}</span>…</span></a>`).join('')}
  </div>
  <p class="aligned">Más para imprimir: <a href="/printable-flashcards/spanish/">tarjetas de vocabulario en inglés y español</a> · <a href="/es/primaria/">todo el inglés para primaria</a></p>
  </section></main>`,
    }));
  }
  return out;
}
