// /teachers/ — the teacher door (kit PATTERNS §3f Q10; mockup d, owner OK 11-08). English UI only for now.
// Five sections, every count from the data (P5): textbook units (src/data/units.js, live units only, as plain book
// tiles: no publisher art or styling, plus the "not connected" line), Band I (src/data/band1.js: a mapping of OUR
// words; the table shows a few of our words and links to our Band I pages, never the Ministry list or its order),
// printable flashcards (a sheet preview first), the flashcard maker (a form that opens /tools/flashcard-maker/ with
// those settings; public/teachers.js keeps the preview live) and Class Battle.
// The pure helpers are unit-tested in src/__tests__/teachersPage.test.js.

// Shared form look for the teachers page and the flashcard maker (one design system, Q6): pill radios and the
// primary / secondary / disabled buttons. The disabled button is solid grey-on-grey at 6.2:1 (was opacity .4 = 1.94:1).
export const PILL_CSS = `
  .pills{display:flex;flex-wrap:wrap;gap:8px;margin:0;padding:0;border:0;min-width:0}
  .pills legend,.fld-label{display:block;font-weight:700;font-size:.95rem;margin:0 0 6px;padding:0;color:#1e293b}
  .pill{position:relative;display:inline-flex}
  .pill input{position:absolute;inset:0;width:100%;height:100%;margin:0;opacity:0;cursor:pointer}
  .pill span{display:inline-flex;align-items:center;min-height:44px;padding:0 18px;border:1.5px solid #bfdbfe;border-radius:999px;background:#fff;color:#1d4ed8;font-weight:700;font-size:.95rem}
  .pill input:checked+span{background:#2563eb;border-color:#2563eb;color:#fff}
  .pill input:focus-visible+span{outline:3px solid #93c5fd;outline-offset:2px}
  .pill:hover span{border-color:#2563eb}
  .sel{min-height:44px;width:100%;max-width:420px;padding:0 12px;border:1.5px solid #bfdbfe;border-radius:12px;background:#fff;color:#1e293b;font:600 1rem system-ui,sans-serif}
  .sel:focus-visible,textarea:focus-visible{outline:3px solid #93c5fd;outline-offset:1px}
  .btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:48px;padding:0 22px;border:1.5px solid #2563eb;border-radius:12px;background:#2563eb;color:#fff;font:800 1rem system-ui,sans-serif;text-decoration:none;cursor:pointer}
  .btn:hover{background:#1d4ed8}
  .btn.ghost{background:#fff;color:#1d4ed8}
  .btn.ghost:hover{background:#eff6ff}
  .btn[disabled],.btn[disabled]:hover{background:#e2e8f0;border-color:#cbd5e1;color:#475569;cursor:not-allowed}
`;

const GRADE_LETTERS = 'אבגדהוזחט';
/** 'ג׳' → 3 (units.js stores the Israeli school grade as a Hebrew letter). */
export function gradeNumber(he) {
  const ch = String(he || '').trim().charAt(0);
  const i = ch ? GRADE_LETTERS.indexOf(ch) : -1;
  return i < 0 ? null : i + 1;
}

/** The book tiles: live (non-test) units grouped by book in BOOKS order, units in number order; books without a live
 *  unit are left out. */
export function teacherBooks(BOOKS, UNITS) {
  return Object.keys(BOOKS).map((slug) => {
    const units = UNITS.filter((u) => u.book === slug && !u.test).sort((a, b) => a.unit - b.unit);
    const grades = [...new Set(units.map((u) => gradeNumber(u.grade)).filter(Boolean))];
    return {
      slug, name: BOOKS[slug].name, publisher: BOOKS[slug].publisher, grades,
      units: units.map((u) => ({ unit: u.unit, title: u.title || '', href: `/units/${slug}/unit-${u.unit}/`, words: u.words.length })),
    };
  }).filter((b) => b.units.length);
}

/** Band I counts of OUR words by level (src/data/band1.js BAND1_BY_ID). */
export function band1Counts(BAND1_BY_ID) {
  const c = { pre: 0, c1: 0, c2: 0 };
  for (const lvl of Object.values(BAND1_BY_ID)) if (lvl in c) c[lvl]++;
  return { ...c, total: c.pre + c.c1 + c.c2 };
}

/** A few sample rows for the Band I table: per level, the first n of OUR words in our own word order (topic order
 *  from words.js), never the Ministry's (alphabetical) order. */
export function band1Sample(WORDS, BAND1_BY_ID, n = 2) {
  const out = [];
  for (const lvl of ['pre', 'c1', 'c2']) out.push(...WORDS.filter((w) => BAND1_BY_ID[w.id] === lvl).slice(0, n).map((w) => ({ w, lvl })));
  return out;
}

const LEVEL_NAME = { pre: 'Pre-Band I', c1: 'Core I', c2: 'Core II' };
const ic = (n) => `<svg class="ic" aria-hidden="true" focusable="false"><use href="/icons.svg#i-${n}"/></svg>`;

export function buildTeachersHtml({ SITE, escapeHtml, WORDS, CATEGORIES, CATEGORY_NAMES, CATEGORY_NAMES_ES, ES_GLOSSES, DRAWN, BOOKS, UNITS, BAND1_BY_ID, band1FileText = '', gamesCount, wordsLabel }) {
  const e = escapeHtml;
  const url = `${SITE}/teachers/`;
  const books = teacherBooks(BOOKS, UNITS);
  const unitsN = books.reduce((n, b) => n + b.units.length, 0);
  const publishers = [...new Set(books.map((b) => b.publisher))];
  const band = band1Counts(BAND1_BY_ID);
  // band1.js names the Ministry file's own "updated" date in its header comment.
  const fileDate = (/updated (\d{4}-\d\d-\d\d)/.exec(band1FileText) || [])[1];
  const topics = CATEGORIES.filter((c) => WORDS.some((w) => w.category === c));
  const catName = (c) => CATEGORY_NAMES[c] || c;

  // --- printable preview: the first 6 PHOTO words of Animals (one picture style per sheet) ---
  const prevCat = topics.includes('animals') ? 'animals' : topics[0];
  const prevWords = WORDS.filter((w) => w.category === prevCat && !DRAWN.has(w.id)).slice(0, 6);
  const miniSheet = (back) => `<div class="sheet" aria-hidden="true">${prevWords.map((w) => `<div class="cell"><img src="/images/${w.id}.webp" alt="" width="64" height="64"><b>${e(w.word)}</b>${back === 'he' ? `<span dir="rtl" lang="he">${e(w.hebrewTranslation)}</span>` : back === 'es' ? `<span lang="es">${e(ES_GLOSSES[w.id] || '')}</span>` : '<span>&nbsp;</span>'}</div>`).join('')}</div>`;
  const sheets = [
    { back: 'en', href: `/printable-flashcards/${prevCat}/`, name: catName(prevCat), lang: 'English' },
    { back: 'he', href: `/printable-flashcards/${prevCat}/hebrew/`, name: catName(prevCat), lang: 'English + <span lang="he" dir="rtl">עברית</span>' },
    { back: 'es', href: `/printable-flashcards/${prevCat}/spanish/`, name: `<span lang="es">${e(CATEGORY_NAMES_ES[prevCat] || catName(prevCat))}</span>`, lang: '<span lang="es">inglés + español</span>' },
  ];

  // --- maker preview data (public/teachers.js): per topic, the first 9 photo and 9 drawn words + the counts ---
  const fmData = {};
  for (const c of topics) {
    const ws = WORDS.filter((w) => w.category === c);
    const pack = (w) => [w.id, w.word, w.hebrewTranslation, ES_GLOSSES[w.id] || ''];
    const ph = ws.filter((w) => !DRAWN.has(w.id)), dr = ws.filter((w) => DRAWN.has(w.id));
    fmData[c] = { n: ws.length, np: ph.length, nd: dr.length, p: ph.slice(0, 9).map(pack), d: dr.slice(0, 9).map(pack) };
  }
  const fmPrev = prevWords.map((w) => `<div class="cell"><img src="/images/${w.id}.webp" alt="" width="56" height="56"><b>${e(w.word)}</b><span dir="rtl" lang="he">${e(w.hebrewTranslation)}</span></div>`).join('');

  const pill = (name, value, label, checked, extra = '') => `<label class="pill"><input type="radio" name="${name}" value="${value}"${checked ? ' checked' : ''}><span${extra}>${label}</span></label>`;

  const breadcrumbLd = JSON.stringify({ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE}/` },
    { '@type': 'ListItem', position: 2, name: 'Teachers', item: url },
  ] });
  const title = 'Free English Vocabulary for Your Class: Units, Band I, Printables | Children Do English';
  const description = `For English teachers: word lists for ${unitsN} textbook units, ${band.total} words mapped to Band I, printable flashcards, a free flashcard maker and a live Class Battle. No sign-up, no student accounts.`;

  return `<!DOCTYPE html>
<html lang="en" dir="ltr">
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${e(title)}</title>
<meta name="description" content="${e(description)}">
<link rel="canonical" href="${url}">
<meta property="og:title" content="${e(title)}"><meta property="og:description" content="${e(description)}">
<meta property="og:url" content="${url}"><meta property="og:type" content="website"><meta property="og:locale" content="en_US">
<meta property="og:image" content="${SITE}/og-image.png">
<link rel="icon" href="/favicon.png">
<script type="application/ld+json">${breadcrumbLd}</script>
<style>
  *{box-sizing:border-box} [hidden]{display:none!important}
  body{margin:0;background:#f8fafc;color:#1e293b;font:16px/1.55 system-ui,-apple-system,'Segoe UI',sans-serif}
  a{color:#1d4ed8}
  .ic{width:1.15em;height:1.15em;vertical-align:-.2em;flex:none}
  .t-band{background:#eff6ff;border-bottom:1px solid #bfdbfe;padding:14px 16px 18px}
  .t-in{max-width:1120px;margin:0 auto}
  .breadcrumb{font-size:.85rem;color:#475569;margin:0 0 4px}
  .breadcrumb a{text-decoration:none}
  h1{margin:0 0 6px;font-size:clamp(1.7rem,4.2vw,2.3rem);line-height:1.2;color:#1e3a8a;font-weight:800;letter-spacing:-.01em}
  .lead{margin:0 0 12px;color:#334155;max-width:46rem}
  .jump{display:flex;flex-wrap:wrap;gap:8px;margin:0;padding:0;list-style:none}
  .jump a{display:inline-flex;align-items:center;min-height:44px;padding:0 16px;border:1.5px solid #bfdbfe;border-radius:999px;background:#fff;font-weight:700;font-size:.95rem;text-decoration:none}
  .t-main{max-width:1120px;margin:0 auto;padding:18px 16px 8px;display:grid;gap:18px}
  .card{background:#fff;border:1px solid #e2e8f0;border-radius:16px;padding:18px 18px 20px;min-width:0;scroll-margin-top:12px}
  .card h2{margin:0 0 4px;font-size:1.3rem;color:#1e3a8a}
  .card>p{margin:0 0 12px;color:#475569}
  .note{font-size:.85rem;color:#475569;margin:10px 0 0}
  .row2{display:grid;gap:18px}
  @media (min-width:1000px){.row2{grid-template-columns:1.15fr 1fr}}
  .books{display:grid;gap:10px;grid-template-columns:repeat(auto-fit,minmax(170px,1fr))}
  .book{border:1px solid #e2e8f0;border-radius:14px;overflow:hidden}
  .book h3{margin:0;padding:10px 14px;background:#1e3a8a;color:#fff;font-size:1.1rem}
  .book h3 small{display:block;font-size:.8rem;font-weight:500;color:#dbeafe}
  .book ul{list-style:none;margin:0;padding:4px 14px 8px}
  .book li{border-bottom:1px solid #f1f5f9}
  .book li:last-child{border-bottom:0}
  .book a{display:block;padding:10px 0;text-decoration:none;font-size:.95rem}
  .counts{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:0 0 12px}
  .counts div{border:1px solid #bfdbfe;background:#eff6ff;border-radius:12px;text-align:center;padding:8px 4px}
  .counts b{display:block;font-size:1.5rem;color:#1e3a8a;line-height:1.2}
  .counts span{font-size:.85rem;color:#1e3a8a;font-weight:600}
  table.b1{width:100%;border-collapse:collapse;font-size:.95rem}
  .b1 th{font-size:.75rem;text-transform:uppercase;letter-spacing:.04em;color:#475569;text-align:start;padding:6px 8px;border-bottom:2px solid #e2e8f0}
  .b1 td{padding:8px;border-bottom:1px solid #f1f5f9}
  .b1 [dir="rtl"]{text-align:right}
  .b1-links{display:flex;flex-wrap:wrap;gap:8px;margin:12px 0 0}
  .prints{display:grid;gap:18px;grid-template-columns:repeat(auto-fit,minmax(230px,1fr))}
  .prints figure{margin:0;display:flex;flex-direction:column}
  .prints figure .sheet{width:100%}
  .sheet{display:grid;grid-template-columns:1fr 1fr;background:#fff;border:1px solid #cbd5e1;box-shadow:0 4px 14px rgba(15,23,42,.1);padding:6%;border-radius:4px;max-width:280px;margin:0 auto}
  .cell{border:1px dashed #94a3b8;margin:-.5px;display:flex;flex-direction:column;align-items:center;padding:8px 4px;text-align:center;min-width:0}
  .cell img{width:64px;height:64px;object-fit:cover;border-radius:6px}
  .cell b{font-size:.9rem;margin-top:4px}
  .cell span{font-size:.8rem;color:#475569}
  .prints figcaption{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:10px;width:100%;max-width:280px;margin-inline:auto;font-size:.9rem}
  .fm{display:grid;gap:18px}
  @media (min-width:900px){.fm{grid-template-columns:1fr 280px}}
  .fm form{display:grid;gap:14px;min-width:0}
  .fm .sheet .cell img{width:56px;height:56px}
  .fm .sheet.per9{grid-template-columns:repeat(3,1fr)}
  .fm .sheet.per4 .cell img,.fm .sheet.per6 .cell img{width:56px;height:56px}
  .fm-cap{text-align:center;font-size:.8rem;color:#475569;margin:6px 0 0}
  .hint{font-size:.85rem;color:#475569;margin:6px 0 0}
  .battle{display:grid;gap:18px;align-items:center}
  @media (min-width:900px){.battle{grid-template-columns:1fr 380px}}
  .board{background:#1e3a8a;color:#fff;border-radius:16px;padding:22px;text-align:center}
  .board p{margin:4px 0}
  .board .code{display:inline-block;background:#fff;color:#1e3a8a;border-radius:12px;padding:10px 24px;font:800 1.6rem/1 ui-monospace,monospace;letter-spacing:.35em;margin:8px 0}
  footer.t-foot{max-width:1120px;margin:0 auto;padding:8px 16px 0;color:#475569;font-size:.85rem}
  ${PILL_CSS}
</style>
</head>
<body>
<header class="t-band"><div class="t-in">
  <nav class="breadcrumb" aria-label="breadcrumb"><a href="/">Home</a> › Teachers</nav>
  <h1>Free English vocabulary for your class</h1>
  <p class="lead">${wordsLabel} words with pictures and a computer voice, ${gamesCount} word games, printables. No sign-up, no student accounts.</p>
  <ul class="jump">
    <li><a href="#units">Textbook units</a></li>
    <li><a href="#band1">Band I</a></li>
    <li><a href="#printables">Printables</a></li>
    <li><a href="#maker">Flashcard maker</a></li>
    <li><a href="#battle">Class Battle</a></li>
  </ul>
</div></header>
<div class="t-main">
  <div class="row2">
    <section class="card" id="units" data-units="${unitsN}">
      <h2>Textbook units</h2>
      <p>Word lists for the ${unitsN} units we cover, with pictures and a computer voice.</p>
      <div class="books">${books.map((b) => `
        <div class="book" data-book="${b.slug}" data-units="${b.units.length}"><h3>${e(b.name)}<small>${b.grades.length ? `Grade ${b.grades.join('–')} · ` : ''}${b.units.length} unit${b.units.length === 1 ? '' : 's'}</small></h3>
          <ul>${b.units.map((u) => `<li><a href="${u.href}">Unit ${u.unit}${u.title ? ` · ${e(u.title)}` : ''}</a></li>`).join('')}</ul></div>`).join('')}
      </div>
      <p class="note">Word lists only (facts). Not connected to ${publishers.map(e).join(' or ')}. <a href="/units/">All units</a></p>
    </section>
    <section class="card" id="band1">
      <h2>Band I word lists</h2>
      <p>${band.total} of our words are on the Ministry of Education's Band I list. Practise or print them by topic, or easiest first.</p>
      <div class="counts">
        <div data-level="pre"><b>${band.pre}</b><span>Pre-Band I</span></div>
        <div data-level="c1"><b>${band.c1}</b><span>Core I</span></div>
        <div data-level="c2"><b>${band.c2}</b><span>Core II</span></div>
      </div>
      <table class="b1">
        <caption class="hint" style="caption-side:bottom;text-align:start">A few of our ${band.total} Band I words, in our own topic order.</caption>
        <thead><tr><th scope="col" lang="en" dir="ltr">English</th><th scope="col" lang="he" dir="rtl">עברית</th><th scope="col">Level</th></tr></thead>
        <tbody>${band1Sample(WORDS, BAND1_BY_ID).map(({ w, lvl }) => `
          <tr><td lang="en" dir="ltr">${e(w.word)}</td><td lang="he" dir="rtl">${e(w.hebrewTranslation)}</td><td>${LEVEL_NAME[lvl]}</td></tr>`).join('')}
        </tbody>
      </table>
      <div class="b1-links"><a class="btn" href="/band-1/">Band I by topic</a><a class="btn ghost" href="/band-1/review/">Easiest first, in short sets</a></div>
      <p class="note">We mark our own words against the Ministry list${fileDate ? ` (file updated ${fileDate})` : ''}; the list itself is not copied. The Band I pages are in Hebrew.</p>
    </section>
  </div>

  <section class="card" id="printables" data-topics="${topics.length}">
    <h2>Printable flashcards</h2>
    <p>${topics.length} topics, each in English, English + Hebrew and English + Spanish. This is what prints:</p>
    <div class="prints">${sheets.map((s) => `
      <figure>${miniSheet(s.back)}
        <figcaption><span><b>${s.name}</b> · ${s.lang}</span><a class="btn" href="${s.href}">${ic('printer')} Print</a></figcaption>
      </figure>`).join('')}
    </div>
    <p class="note"><a href="/printable-flashcards/">All ${topics.length} topics</a> · <a href="/printable-flashcards/hebrew/" lang="he" dir="rtl">כרטיסיות עם עברית</a> · <a href="/printable-flashcards/spanish/" lang="es">Tarjetas con español</a></p>
  </section>

  <section class="card" id="maker">
    <h2>Flashcard maker</h2>
    <p>Pick words, pick a back side, print. No watermark, no account.</p>
    <div class="fm">
      <form action="/tools/flashcard-maker/" method="get" id="tFm">
        <div><label class="fld-label" for="tCat">Topic</label>
          <select class="sel" id="tCat" name="cat">${topics.map((c) => `<option value="${c}"${c === prevCat ? ' selected' : ''}>${e(catName(c))} (${fmData[c].n} words)</option>`).join('')}</select></div>
        <fieldset class="pills"><legend>Back of the card</legend>${pill('back', 'en', 'No translation', false)}${pill('back', 'he', 'Hebrew', true)}${pill('back', 'es', 'Spanish', false)}</fieldset>
        <fieldset class="pills"><legend>Cards per page</legend>${pill('per', '4', '4', false)}${pill('per', '6', '6', true)}${pill('per', '9', '9', false)}</fieldset>
        <fieldset class="pills"><legend>Pictures</legend>${pill('pics', 'both', 'Photos and drawings', true)}${pill('pics', 'photo', 'Photos only', false)}${pill('pics', 'drawn', 'Drawings only', false)}
          <p class="hint" style="flex-basis:100%">One picture style per sheet: photos and drawings never share a page.</p></fieldset>
        <div><button class="btn" type="submit">${ic('printer')} Make these cards</button></div>
      </form>
      <figure style="margin:0">
        <div class="sheet per6" id="tFmPrev" data-fm="${e(JSON.stringify(fmData))}">${fmPrev}</div>
        <figcaption class="fm-cap" id="tFmCap">Preview · first page of ${catName(prevCat)}</figcaption>
      </figure>
    </div>
  </section>

  <section class="card" id="battle">
    <div class="battle">
      <div>
        <h2>Class Battle</h2>
        <p>A live game for the whole class. You pick a category, kids join with a 5-letter code on any device, hear the English word (computer voice) and race to tap the right picture.</p>
        <p>No accounts and no real names: kids pick a nickname from a list. The room deletes itself about 30 minutes after it starts.</p>
        <p><a class="btn" href="/battle/">${ic('play')} Start a Class Battle</a></p>
      </div>
      <div class="board" aria-hidden="true"><p>On the board</p><p><b>JOIN CODE</b></p><span class="code">•••••</span><p>Teams join on any device</p></div>
    </div>
  </section>
</div>
<footer class="t-foot"><p>Questions or a unit you'd like covered? <a href="mailto:info@childrendoenglish.com">info@childrendoenglish.com</a></p></footer>
<script defer src="/teachers.js"></script>
</body>
</html>`;
}
