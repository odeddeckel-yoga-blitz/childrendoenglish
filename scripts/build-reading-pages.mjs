// Graded readers ("Little Readers"): RC11 (10-31) + wave 1 (11-18). Original texts (src/data/readings.js) in
// 5 levels, built twice: Hebrew  /band-1/reading/ hub + /band-1/reading/<slug>/  (tap a word → Hebrew)
//                        Spanish /es/lecturas/ hub     + /es/lecturas/<slug>/     (tap a word → Spanish)
// (11-19: one Spanish section, at the printables branch's /es/lecturas/; /es/reading/ was never live)
// The two versions of a page are reciprocal hreflang alternates (he ↔ es), each self-canonical. Each page: the
// text read aloud sentence by sentence (/audio/s/, Piper TTS — a computer voice), any word tappable for its gloss
// (src/data/readingGlosses.js), three questions, and a print-only sheet: the text, the questions with lettered
// options and an answer key on page 2 (print-btn.js). UI copy: src/data/readingUi.js. Runtime: public/reading.js.
import { join } from 'path';
import { mkdirSync } from 'fs';
import { wordSetKit } from './build-unit-pages.mjs';
import { sentenceAudio } from './sentence-audio.mjs';
import { printQrBlock } from './qr-svg.mjs'; // writePage adds PRINT_QR_CSS
import { READING_UI, fillUi } from '../src/data/readingUi.js';

const hashOf = (s) => [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
const LEVEL_HE = { pre: 'Pre-Band I', c1: 'Band I · Core I', c2: 'Band I · Core II' };
const LETTERS = 'abcdef';
export const READING_LANGS = {
  he: { hub: '/band-1/reading/', dir: ['band-1', 'reading'], rtl: true },
  es: { hub: '/es/lecturas/', dir: ['es', 'lecturas'], rtl: false },
};

// The gloss for each token: a two-word phrase containing it wins over the word alone.
export function glossTokens(sentence, { GLOSSES, PHRASES, NAMES }) {
  const parts = sentence.split(/([A-Za-z][A-Za-z']*)/);
  const words = parts.filter((p, i) => i % 2 === 1).map((w) => w.toLowerCase());
  let wi = -1;
  return parts.map((p, i) => {
    if (i % 2 === 0) return { text: p };
    wi++;
    if (NAMES.has(p)) return { text: p, name: true };
    const w = words[wi];
    const pair = [[words[wi - 1], w], [w, words[wi + 1]]].map((x) => x.join(' ')).find((k) => PHRASES[k]);
    return { text: p, gloss: pair ? `${pair}: ${PHRASES[pair]}` : GLOSSES[w] || null };
  });
}

// Options in a fixed order (a rebuild keeps it, so a printed key always matches the page).
export function orderedOptions(r, n) {
  const q = r.questions[n];
  return q.options.map((o, j) => ({ o, ok: j === q.answer })).sort((a, b) => hashOf(r.slug + n + a.o) - hashOf(r.slug + n + b.o));
}
export const wordCount = (r) => r.text.join(' ').split(/\s+/).length;
export function readingOrder(READINGS) {
  return READINGS.map((r, i) => ({ r, i })).sort((a, b) => a.r.stage - b.r.stage || a.i - b.i).map((x) => x.r);
}

export function buildReadingPages({ SITE, distDir, writePage, escapeHtml, WORDS, collides, READINGS, READING_STAGES, READING_NAMES, READING_GLOSSES, READING_PHRASES, READING_GLOSSES_ES, READING_PHRASES_ES }) {
  const kit = wordSetKit({ SITE, writePage, escapeHtml, WORDS, collides });
  const texts = readingOrder(READINGS);
  const icon = (n) => `<svg class="ic" aria-hidden="true" focusable="false" style="width:1.15em;height:1.15em;vertical-align:-.2em;flex:none"><use href="/icons.svg#i-${n}"/></svg>`;
  const alternates = (slug) => Object.entries(READING_LANGS).map(([l, c]) => `  <link rel="alternate" hreflang="${l}" href="${SITE}${c.hub}${slug ? `${slug}/` : ''}" />\n`).join('');
  let written = 0;

  for (const [lang, cfg] of Object.entries(READING_LANGS)) {
    const T = READING_UI[lang];
    const t = (k, vars) => fillUi(T[k], vars);
    const G = lang === 'he'
      ? { GLOSSES: READING_GLOSSES, PHRASES: READING_PHRASES, NAMES: READING_NAMES }
      : { GLOSSES: READING_GLOSSES_ES, PHRASES: READING_PHRASES_ES, NAMES: READING_NAMES };
    // Page-language text → HTML. In Hebrew, every English or number run sits in an LTR isolate.
    const txt = (s) => (cfg.rtl
      ? String(s).split(/([A-Za-z0-9](?:[A-Za-z0-9'’\-–]|[ ,.:·/&+](?=[ ,.:·/&+]*[A-Za-z0-9]))*)/).map((p, i) => (i % 2 ? `<bdi dir="ltr">${escapeHtml(p)}</bdi>` : escapeHtml(p))).join('')
      : escapeHtml(s));
    const en = (s) => (cfg.rtl ? `<bdi lang="en" dir="ltr">${escapeHtml(s)}</bdi>` : `<span lang="en">${escapeHtml(s)}</span>`);
    const tr = (r) => r[lang];
    const hubPath = cfg.hub;
    const crumbBase = lang === 'he' ? [['עברית', '/he/'], ['Band I לפי נושאים', '/band-1/']] : [['Español', '/es/'], ['Inglés para primaria', '/es/primaria/']];
    const crumbHtml = lang === 'he'
      ? '<a href="/he/">עברית</a> › <a href="/band-1/"><span lang="en" dir="ltr">Band I</span> לפי נושאים</a>'
      : '<a href="/es/">Español</a> › <a href="/es/primaria/">Inglés para primaria</a>';
    const arrow = cfg.rtl ? '←' : '→';
    const ui = `data-lang="${lang}" data-t-ok="${escapeHtml(T.right)}" data-t-try="${escapeHtml(T.tryAgain)}" data-t-play="${escapeHtml(T.playAll)}" data-t-stop="${escapeHtml(T.stop)}" data-t-all="${escapeHtml(T.scoreAll)}" data-t-some="${escapeHtml(T.scoreSome)}"`;

    const tokensHtml = (s) => glossTokens(s, G).map((x) => (x.gloss
      ? `<button type="button" class="w" data-g="${escapeHtml(x.gloss)}">${escapeHtml(x.text)}</button>`
      : escapeHtml(x.text))).join('');
    const sayBtn = (s) => {
      const src = sentenceAudio(s);
      return src ? `<button type="button" class="say" data-say="${src}" aria-label="${escapeHtml(T.listenQ)}">${icon('volume-2')}</button>` : '';
    };
    const stageOf = (r) => READING_STAGES.find((s) => s.n === r.stage);

    for (const [i, r] of texts.entries()) {
      const path = `${hubPath}${r.slug}/`;
      const next = texts[i + 1];
      const w = wordCount(r);
      const st = stageOf(r);
      const sentences = r.text.map((s, k) => `<span class="snt" data-k="${k}"${sentenceAudio(s) ? ` data-src="${sentenceAudio(s)}"` : ''}>${tokensHtml(s)}</span>`).join(' ');
      const qs = r.questions.map((q, n) => `<li class="q" data-q="${n}">
          <p class="qt" lang="en" dir="ltr">${tokensHtml(q.q)} ${sayBtn(q.q)}</p>
          <div class="opts" lang="en" dir="ltr">${orderedOptions(r, n).map((x) => `<button type="button" class="opt"${x.ok ? ' data-ok="1"' : ''}>${escapeHtml(x.o)}</button>`).join('')}</div>
          <p class="fb" aria-live="polite"></p>
        </li>`).join('');
      // print-only: the sheet, then the answer key on its own page
      const pq = r.questions.map((q, n) => `<li><p>${escapeHtml(q.q)}</p><p class="popts">${orderedOptions(r, n).map((x, j) => `<span><b>${LETTERS[j]})</b> ${escapeHtml(x.o)}</span>`).join('')}</p></li>`).join('');
      const pkey = r.questions.map((q, n) => { const j = orderedOptions(r, n).findIndex((x) => x.ok); return `<li data-key="${LETTERS[j]}"><b>${LETTERS[j]})</b> ${escapeHtml(q.options[q.answer])}</li>`; }).join('');
      const print = `<div class="print-only">
    <section class="sheet psheet">
      <div class="name-line" dir="${cfg.rtl ? 'rtl' : 'ltr'}"><span>${txt(T.printName)}</span><span>${txt(T.printDate)}</span></div>
      <div lang="en" dir="ltr"><h2>${escapeHtml(r.title)}</h2><p class="ptext">${escapeHtml(r.text.join(' '))}</p></div>
      <p class="task" dir="${cfg.rtl ? 'rtl' : 'ltr'}">${txt(T.printTask)}</p>
      <ol class="pq" lang="en" dir="ltr">${pq}</ol>
      ${printQrBlock(`${SITE}${path}`, txt(T.printQr), cfg.rtl ? 'rtl' : 'ltr')}
    </section>
    <section class="sheet psheet key"><h2 dir="${cfg.rtl ? 'rtl' : 'ltr'}">${txt(T.answerKey)}: ${en(r.title)}</h2><ol lang="en" dir="ltr">${pkey}</ol></section>
  </div>`;
      const band1 = lang === 'he' && r.level ? ` <span class="chip chip-${r.level}" lang="en" dir="ltr">${LEVEL_HE[r.level]}</span>` : '';
      const description = lang === 'he' && r.level
        ? `קטע קריאה קצר באנגלית לילדים, ${w} מילים מרשימת Band I: מקשיבים, לוחצים על מילה כדי לראות אותה בעברית, ועונים על ${r.questions.length} שאלות. חינם, בלי הרשמה.`
        : t('pageDesc', { w, n: r.stage });
      mkdirSync(join(distDir, ...cfg.dir, r.slug), { recursive: true });
      writePage(join(distDir, ...cfg.dir, r.slug, 'index.html'), kit.shell({
        path, test: false, footerNote: T.footerNote, lang, head: alternates(r.slug),
        title: t('pageTitle', { title: r.title, tr: tr(r) }),
        description,
        schemas: [kit.crumbs([...crumbBase, [T.hubName, hubPath], [r.title, path]])],
        css: READING_CSS,
        body: `
  <nav class="breadcrumb" aria-label="breadcrumb">${crumbHtml} › <a href="${hubPath}">${txt(T.hubName)}</a> › ${en(r.title)}</nav>
  <header class="hero"><h1>${en(r.title)} · ${escapeHtml(tr(r))}</h1>
    <p class="answer">${txt(t('answer', { w, n: r.stage, cefr: st.cefr, q: r.questions.length }))}${band1}</p></header>
  <main class="container"><section class="section reading" data-reading="${r.slug}" ${ui}>
    <div class="read-tools"><button type="button" class="play-all" data-play-all>${icon('play')} ${txt(T.playAll)}</button> <button type="button" class="slow-tog" data-slow aria-pressed="false">${icon('turtle')} ${txt(T.slow)}</button></div>
    <article class="rtext" lang="en" dir="ltr">${sentences}</article>
    <p class="gloss" id="gloss" aria-live="polite">${txt(T.glossHint)}</p>
    <h2 class="section-title">${txt(T.questions)}</h2>
    <ol class="qs">${qs}</ol>
    <p class="score center" id="read-score" aria-live="polite" hidden></p>
    <p class="center"><button type="button" class="print-btn" data-print>${icon('printer')} ${txt(T.printBtn)}</button></p>
    <p class="center">${next ? `<a class="cta" href="${hubPath}${next.slug}/">${txt(t('next', { title: '\u0000' })).replace('\u0000', en(next.title))} ${arrow}</a>` : `<a class="cta" href="${hubPath}">${txt(T.allTexts)} ${arrow}</a>`}</p>
  </section></main>
  ${print}
  <script src="/reading.js" defer></script>
  <script src="/print-btn.js" defer></script>`,
      }));
      written++;
    }

    // hub: a level picker, then one section per level
    const levels = READING_STAGES.map((s) => ({ s, items: texts.filter((r) => r.stage === s.n) })).filter((x) => x.items.length);
    const chips = levels.map(({ s }) => `<a class="lvl" href="#level-${s.n}">${txt(t('levelName', { n: s.n }))} <small lang="en" dir="ltr">${s.cefr}</small></a>`).join('');
    const sections = levels.map(({ s, items }) => {
      const ws = items.map(wordCount);
      const cards = items.map((r) => `
        <a class="unit-card" href="${hubPath}${r.slug}/"><strong>${en(r.title)} · ${escapeHtml(tr(r))}</strong><span>${txt(t('wordsN', { n: wordCount(r) }))}${lang === 'he' && r.level ? ` · <span lang="en" dir="ltr">${LEVEL_HE[r.level]}</span>` : ''}</span></a>`).join('');
      return `
  <section class="level" id="level-${s.n}" aria-labelledby="level-${s.n}-h">
    <h2 class="section-title" id="level-${s.n}-h">${txt(t('levelName', { n: s.n }))} <small lang="en" dir="ltr">(${s.cefr})</small></h2>
    <p class="lvl-sub">${txt(T[`level${s.n}`])} · ${txt(t('wordsRange', { a: Math.min(...ws), b: Math.max(...ws) }))}</p>
    <div class="unit-grid">${cards}
    </div>
  </section>`;
    }).join('');
    const more = lang === 'he'
      ? `<p class="aligned">${txt(T.band1Note)}</p>
  <p class="aligned">את המילים עצמן אפשר לתרגל ב<a href="/band-1/">עמודי Band I לפי נושאים</a> וב<a href="/band-1/review/">מסלול החזרה</a>.</p>`
      : `<p class="aligned"><a href="/printable-flashcards/spanish/">${txt(T.morePractice)}</a></p>
  <p class="aligned">Las palabras se practican también en el <a href="/vocabulary/animals/spanish/">vocabulario en inglés y español</a> y en las <a href="/es/fichas/">fichas para imprimir</a>.</p>`;
    mkdirSync(join(distDir, ...cfg.dir), { recursive: true });
    writePage(join(distDir, ...cfg.dir, 'index.html'), kit.shell({
      path: hubPath, test: false, footerNote: T.footerNote, lang, head: alternates(''),
      title: t('hubTitle', { n: texts.length }),
      description: t('hubDesc', { n: texts.length }),
      schemas: [kit.crumbs([...crumbBase, [T.hubName, hubPath]])],
      css: READING_CSS,
      body: `
  <nav class="breadcrumb" aria-label="breadcrumb">${crumbHtml} › ${txt(T.hubName)}</nav>
  <header class="hero"><h1>${txt(T.hubH1)}</h1>
    <p class="answer">${txt(t('hubIntro', { n: texts.length }))}</p></header>
  <main class="container"><section class="section">
  <nav class="levels" aria-label="${escapeHtml(T.pickLevel)}">${chips}</nav>${sections}
  ${more}
  </section></main>`,
    }));
    written++;
  }
  return written;
}

const READING_CSS = `
  .read-tools { display: flex; gap: .5rem; justify-content: center; flex-wrap: wrap; margin-bottom: 1rem; }
  .play-all, .slow-tog { min-height: 44px; padding: .5rem 1.2rem; border-radius: 999px; border: 2px solid #2563eb; background: #fff; color: #1e40af; font-weight: 800; font-size: 1rem; cursor: pointer; }
  .play-all { background: #2563eb; color: #fff; }
  .slow-tog[aria-pressed="true"] { background: #dbeafe; }
  .rtext { background: #fff; border-radius: .9rem; padding: 1.1rem 1.2rem; font-size: 1.3rem; line-height: 2.1; text-align: left; box-shadow: 0 1px 3px rgba(0,0,0,.08); }
  .snt.on { background: #fef9c3; border-radius: .3rem; }
  .w { font: inherit; color: inherit; background: none; border: 0; padding: 0 .05em; cursor: pointer; border-bottom: 1px dotted #93c5fd; }
  .w:hover, .w:focus-visible, .w.sel { background: #dbeafe; border-radius: .25rem; }
  .gloss { position: sticky; bottom: .5rem; margin: .8rem auto; max-width: 560px; background: #1e3a8a; color: #fff; border-radius: .8rem; padding: .6rem 1rem; text-align: center; font-weight: 700; }
  .qs { list-style: none; padding: 0; display: grid; gap: 1rem; }
  .q { background: #fff; border-radius: .9rem; padding: 1rem; box-shadow: 0 1px 3px rgba(0,0,0,.08); }
  .qt { font-size: 1.15rem; font-weight: 700; text-align: left; margin-bottom: .6rem; }
  .opts { display: grid; gap: .5rem; }
  .opt { min-height: 48px; font-size: 1.1rem; text-align: left; padding: .5rem 1rem; border-radius: .7rem; border: 2px solid #cbd5e1; background: #f8fafc; cursor: pointer; }
  .opt.good { border-color: #059669; background: #d1fae5; }
  .opt.bad { border-color: #e11d48; background: #ffe4e6; }
  .say { min-width: 44px; min-height: 44px; border: 0; background: none; font-size: 1.1rem; cursor: pointer; }
  .fb { min-height: 1.4em; margin-top: .4rem; font-weight: 700; }
  .score { font-size: 1.2rem; font-weight: 900; margin: 1rem 0; }
  .levels { display: flex; flex-wrap: wrap; gap: .5rem; justify-content: center; margin-bottom: 1.25rem; }
  .lvl { display: inline-flex; align-items: center; gap: .35rem; min-height: 44px; padding: .4rem 1rem; border-radius: 999px; background: #fff; border: 2px solid #2563eb; color: #1e40af; font-weight: 800; text-decoration: none; }
  .lvl small { font-weight: 600; color: #475569; }
  .level { margin-bottom: 1.5rem; scroll-margin-top: 1rem; }
  .level .section-title { margin-bottom: .25rem; }
  .level .section-title small { font-size: .85rem; color: #475569; font-weight: 600; }
  .lvl-sub { text-align: center; color: #475569; margin-bottom: .8rem; }
  .print-only { display: none; }
  .psheet .ptext { font-size: 1.15rem; line-height: 1.9; margin: .4rem 0 .8rem; }
  .pq { margin: .4rem 1.5rem 0; } .pq li { margin-bottom: .6rem; } .pq li p { margin: 0; }
  .popts { display: flex; gap: 1.5rem; flex-wrap: wrap; }
  .key ol { margin: .4rem 1.5rem 0; }
  .psheet [dir="ltr"] { text-align: left; } .psheet [dir="rtl"] { text-align: right; }
  .psheet h2 { font-size: 1.3rem; margin-bottom: .2rem; }
  .psheet .task { color: #334155; margin: .4rem 0 .6rem; font-weight: 700; }
  .name-line { display: flex; gap: 1.5rem; margin-bottom: .9rem; color: #334155; font-size: .95rem; flex-wrap: wrap; }
  .name-line span { flex: 1; min-width: 8rem; border-bottom: 1.5px solid #94a3b8; padding-bottom: .1rem; }
  @page { size: A4 portrait; margin: 12mm; }
  @media print {
    body { background: #fff; }
    body > :not(.print-only) { display: none !important; }
    .print-only { display: block; }
    .psheet { box-shadow: none; padding: 0; margin: 0; }
    .psheet.key { break-before: page; page-break-before: always; }
  }
`;
