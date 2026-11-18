// RC11 short reading texts (pre-Unseen): /band-1/reading/ hub + /band-1/reading/<slug>/.
// Original texts (src/data/readings.js), every word on Band I. Each page: the text
// read aloud sentence by sentence (/audio/s/, Piper TTS), any word tappable for its
// Hebrew (src/data/readingGlosses.js), then three questions. Runtime: public/reading.js.
import { join } from 'path';
import { mkdirSync } from 'fs';
import { wordSetKit } from './build-unit-pages.mjs';
import { sentenceAudio } from './sentence-audio.mjs';

const hashOf = (s) => [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
const LEVEL_HE = { pre: 'Pre-Band I', c1: 'Band I · Core I', c2: 'Band I · Core II' };
const LEVEL_ORDER = { pre: 0, c1: 1, c2: 2 };

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

// hreflang between a Hebrew reading page and its Spanish twin (/es/lecturas/…, audit 11-18 idea 12)
const ES_HUB = '/es/lecturas/';
const twinHead = (SITE, hePath, esPath) => `  <link rel="alternate" hreflang="he" href="${SITE}${hePath}" />
  <link rel="alternate" hreflang="es" href="${SITE}${esPath}" />
  <link rel="alternate" hreflang="x-default" href="${SITE}${hePath}" />
`;

export function buildReadingPages({ SITE, distDir, writePage, escapeHtml, WORDS, collides, READINGS, READING_NAMES, READING_GLOSSES, READING_PHRASES, esTwins = false }) {
  const kit = wordSetKit({ SITE, writePage, escapeHtml, WORDS, collides });
  const G = { GLOSSES: READING_GLOSSES, PHRASES: READING_PHRASES, NAMES: READING_NAMES };
  const footerNote = 'הקטעים נכתבו עבור Children Do English, וכל המילים בהם נבדקו מול רשימת Band I של משרד החינוך. הרשימה עצמה אינה מועתקת לכאן. ההקראה היא קול ממוחשב.';
  const hubPath = '/band-1/reading/';
  const hubName = 'קטעי קריאה קצרים';
  const texts = [...READINGS].sort((a, b) => LEVEL_ORDER[a.level] - LEVEL_ORDER[b.level]);
  const words = (r) => r.text.join(' ').split(/\s+/).length;

  const tokensHtml = (s) => glossTokens(s, G).map((t) => (t.gloss
    ? `<button type="button" class="w" data-g="${escapeHtml(t.gloss)}">${escapeHtml(t.text)}</button>`
    : escapeHtml(t.text))).join('');
  const sayBtn = (s, label) => {
    const src = sentenceAudio(s);
    return src ? `<button type="button" class="say" data-say="${src}" aria-label="${label}"><svg class="ic" aria-hidden="true" focusable="false" style="width:1.15em;height:1.15em;vertical-align:-.2em;flex:none"><use href="/icons.svg#i-volume-2"/></svg></button>` : '';
  };

  for (const [i, r] of texts.entries()) {
    const path = `${hubPath}${r.slug}/`;
    const next = texts[i + 1];
    const sentences = r.text.map((s, k) => `<span class="snt" data-k="${k}"${sentenceAudio(s) ? ` data-src="${sentenceAudio(s)}"` : ''}>${tokensHtml(s)}</span>`).join(' ');
    const qs = r.questions.map((q, n) => {
      // deterministic shuffle so a rebuild keeps the order
      const opts = q.options.map((o, j) => ({ o, ok: j === q.answer })).sort((a, b) => hashOf(r.slug + n + a.o) - hashOf(r.slug + n + b.o));
      return `<li class="q" data-q="${n}">
          <p class="qt" lang="en" dir="ltr">${tokensHtml(q.q)} ${sayBtn(q.q, 'להקשיב לשאלה')}</p>
          <div class="opts" lang="en" dir="ltr">${opts.map((x) => `<button type="button" class="opt"${x.ok ? ' data-ok="1"' : ''}>${escapeHtml(x.o)}</button>`).join('')}</div>
          <p class="fb" aria-live="polite"></p>
        </li>`;
    }).join('');
    mkdirSync(join(distDir, 'band-1', 'reading', r.slug), { recursive: true });
    writePage(join(distDir, 'band-1', 'reading', r.slug, 'index.html'), kit.shell({
      path, test: false, footerNote, head: esTwins ? twinHead(SITE, path, `${ES_HUB}${r.slug}/`) : '',
      title: `קטע קריאה באנגלית: ${r.title} (${r.he}) — עם הקראה ותרגום | Children Do English`,
      description: `קטע קריאה קצר באנגלית לילדים, ${words(r)} מילים מרשימת Band I: מקשיבים, לוחצים על מילה כדי לראות אותה בעברית, ועונים על ${r.questions.length} שאלות. חינם, בלי הרשמה.`,
      schemas: [kit.crumbs([['עברית', '/he/'], ['Band I לפי נושאים', '/band-1/'], [hubName, hubPath], [r.title, path]])],
      body: `
  <nav class="breadcrumb" aria-label="breadcrumb"><a href="/he/">עברית</a> › <a href="/band-1/"><span lang="en" dir="ltr">Band I</span> לפי נושאים</a> › <a href="${hubPath}">${hubName}</a> › <bdi lang="en" dir="ltr">${escapeHtml(r.title)}</bdi></nav>
  <header class="hero"><h1><bdi lang="en" dir="ltr">${escapeHtml(r.title)}</bdi> · ${escapeHtml(r.he)}</h1>
    <p class="answer">קטע קצר באנגלית: ${words(r)} מילים, ברמת <bdi lang="en" dir="ltr">${LEVEL_HE[r.level]}</bdi>. לוחצים על כפתור ההשמעה כדי לשמוע, על כל מילה כדי לראות אותה בעברית, ובסוף עונים על ${r.questions.length} שאלות.</p></header>
  <main class="container"><section class="section reading" data-reading="${r.slug}">
    <div class="read-tools"><button type="button" class="play-all" data-play-all><svg class="ic" aria-hidden="true" focusable="false" style="width:1.15em;height:1.15em;vertical-align:-.2em;flex:none"><use href="/icons.svg#i-play"/></svg> הקשיבו לכל הקטע</button> <button type="button" class="slow-tog" data-slow aria-pressed="false"><svg class="ic" aria-hidden="true" focusable="false" style="width:1.15em;height:1.15em;vertical-align:-.2em;flex:none"><use href="/icons.svg#i-turtle"/></svg> לאט</button></div>
    <article class="rtext" lang="en" dir="ltr">${sentences}</article>
    <p class="gloss" id="gloss" aria-live="polite">לחצו על מילה כדי לראות אותה בעברית</p>
    <h2 class="section-title">שאלות</h2>
    <ol class="qs">${qs}</ol>
    <p class="score center" id="read-score" aria-live="polite" hidden></p>
    <p class="center">${next ? `<a class="cta" href="${hubPath}${next.slug}/">לקטע הבא: <bdi lang="en" dir="ltr">${escapeHtml(next.title)}</bdi> ←</a>` : `<a class="cta" href="${hubPath}">כל הקטעים ←</a>`}</p>
  </section></main>
  <style>${READING_CSS}</style>
  <script src="/reading.js" defer></script>`,
    }));
  }

  const cards = texts.map((r) => `
        <a class="unit-card" href="${hubPath}${r.slug}/"><strong><bdi lang="en" dir="ltr">${escapeHtml(r.title)}</bdi> · ${escapeHtml(r.he)}</strong><span>${words(r)} מילים · <span lang="en" dir="ltr">${LEVEL_HE[r.level]}</span></span></a>`).join('');
  writePage(join(distDir, 'band-1', 'reading', 'index.html'), kit.shell({
    path: hubPath, test: false, footerNote, head: esTwins ? twinHead(SITE, hubPath, ES_HUB) : '',
    title: `${texts.length} קטעי קריאה קצרים באנגלית לילדים — מילים מ-Band I, עם הקראה ושאלות`,
    description: `${texts.length} קטעי קריאה קצרים באנגלית (50–65 מילים), כל המילים מרשימת Band I: הקראה, תרגום של כל מילה בלחיצה ושאלות הבנה. הכנה לקטעי Unseen. חינם, בלי הרשמה.`,
    schemas: [kit.crumbs([['עברית', '/he/'], ['Band I לפי נושאים', '/band-1/'], [hubName, hubPath]])],
    body: `
  <nav class="breadcrumb" aria-label="breadcrumb"><a href="/he/">עברית</a> › <a href="/band-1/"><span lang="en" dir="ltr">Band I</span> לפי נושאים</a> › ${hubName}</nav>
  <header class="hero"><h1>קטעי קריאה קצרים באנגלית</h1>
    <p class="answer">${texts.length} קטעים קצרים שכתבנו, וכל המילים בהם מרשימת <span lang="en" dir="ltr">Band I</span>. בכל קטע: הקראה, תרגום של כל מילה בלחיצה ו-3 שאלות הבנה — צעד ראשון לפני קטעי <span lang="en" dir="ltr">Unseen</span>. מסודרים מהקל לקשה.</p></header>
  <main class="container"><section class="section">
  <div class="unit-grid">${cards}
  </div>
  <p class="aligned">את המילים עצמן אפשר לתרגל ב<a href="/band-1/">עמודי Band I לפי נושאים</a> וב<a href="/band-1/review/">מסלול החזרה</a>.</p>
  </section></main>`,
  }));
  return texts.length + 1;
}

// Spanish twins (audit 11-18 idea 12, Spanish parity): /es/lecturas/ + /es/lecturas/<slug>/ — the same texts, audio and
// questions, Spanish chrome, tap any word for its Spanish (src/data/readingGlossesEs.js). No Band I wording here: that
// list is Israeli; for Spanish readers the levels are just "nivel 1–3". public/reading.js reads its strings from data-t-*.
const LEVEL_ES = { pre: 'Nivel 1', c1: 'Nivel 2', c2: 'Nivel 3' };
const READING_T_ES = {
  'data-t-play': 'Escuchar todo el texto', 'data-t-stop': 'Detener', 'data-t-ok': '¡Correcto!',
  'data-t-retry': 'Casi: busca la respuesta en el texto y vuelve a intentarlo.',
  'data-t-all': 'a la primera. ¡Excelente!', 'data-t-some': 'a la primera. ¡Ya resolviste todas las preguntas!',
};
export function buildReadingPagesEs({ SITE, distDir, writePage, escapeHtml, WORDS, collides, READINGS, READING_NAMES, READING_GLOSSES_ES, READING_PHRASES_ES, READING_TITLES_ES }) {
  const kit = wordSetKit({ SITE, writePage, escapeHtml, WORDS, collides });
  const G = { GLOSSES: READING_GLOSSES_ES, PHRASES: READING_PHRASES_ES, NAMES: READING_NAMES };
  const footerNote = 'Los textos fueron escritos para Children Do English. La lectura en voz alta es una voz generada por computadora.';
  const hubName = 'Lecturas cortas en inglés';
  const texts = [...READINGS].sort((a, b) => LEVEL_ORDER[a.level] - LEVEL_ORDER[b.level]);
  const nWords = (r) => r.text.join(' ').split(/\s+/).length;
  const esTitle = (r) => READING_TITLES_ES[r.slug] || r.title;
  const tAttrs = Object.entries(READING_T_ES).map(([k, v]) => `${k}="${escapeHtml(v)}"`).join(' ');
  const tokensHtml = (s) => glossTokens(s, G).map((t) => (t.gloss
    ? `<button type="button" class="w" data-g="${escapeHtml(t.gloss)}">${escapeHtml(t.text)}</button>`
    : escapeHtml(t.text))).join('');
  const sayBtn = (s) => {
    const src = sentenceAudio(s);
    return src ? `<button type="button" class="say" data-say="${src}" aria-label="Escuchar la pregunta" lang="es"><svg class="ic" aria-hidden="true" focusable="false" style="width:1.15em;height:1.15em;vertical-align:-.2em;flex:none"><use href="/icons.svg#i-volume-2"/></svg></button>` : '';
  };
  const crumbsBase = [['Español', '/es/'], ['Inglés para primaria', '/es/primaria/'], [hubName, ES_HUB]];
  const navBase = `<a href="/es/">Español</a> › <a href="/es/primaria/">Inglés para primaria</a> › `;
  for (const [i, r] of texts.entries()) {
    const path = `${ES_HUB}${r.slug}/`, hePath = `/band-1/reading/${r.slug}/`;
    const next = texts[i + 1];
    const sentences = r.text.map((s, k) => `<span class="snt" data-k="${k}"${sentenceAudio(s) ? ` data-src="${sentenceAudio(s)}"` : ''}>${tokensHtml(s)}</span>`).join(' ');
    const qs = r.questions.map((q, n) => {
      const opts = q.options.map((o, j) => ({ o, ok: j === q.answer })).sort((a, b) => hashOf(r.slug + n + a.o) - hashOf(r.slug + n + b.o));
      return `<li class="q" data-q="${n}">
          <p class="qt" lang="en" dir="ltr">${tokensHtml(q.q)} ${sayBtn(q.q)}</p>
          <div class="opts" lang="en" dir="ltr">${opts.map((x) => `<button type="button" class="opt"${x.ok ? ' data-ok="1"' : ''}>${escapeHtml(x.o)}</button>`).join('')}</div>
          <p class="fb" aria-live="polite"></p>
        </li>`;
    }).join('');
    mkdirSync(join(distDir, 'es', 'lecturas', r.slug), { recursive: true });
    writePage(join(distDir, 'es', 'lecturas', r.slug, 'index.html'), kit.shell({
      path, test: false, footerNote, lang: 'es', head: twinHead(SITE, hePath, path),
      title: `Lectura corta en inglés para niños: ${r.title} (${esTitle(r)}) | Children Do English`,
      description: `Lectura corta en inglés para niños de primaria, ${nWords(r)} palabras: escucha el texto, toca cualquier palabra para verla en español y responde ${r.questions.length} preguntas. Gratis, sin registro.`,
      schemas: [kit.crumbs([...crumbsBase, [r.title, path]])],
      body: `
  <nav class="breadcrumb" aria-label="breadcrumb">${navBase}<a href="${ES_HUB}">${hubName}</a> › <span lang="en">${escapeHtml(r.title)}</span></nav>
  <header class="hero"><h1><span lang="en">${escapeHtml(r.title)}</span> · ${escapeHtml(esTitle(r))}</h1>
    <p class="answer">Un texto corto en inglés: ${nWords(r)} palabras, ${LEVEL_ES[r.level].toLowerCase()}. Toca el botón para escuchar, toca cualquier palabra para verla en español y al final responde ${r.questions.length} preguntas.</p></header>
  <main class="container"><section class="section reading" data-reading="${r.slug}" ${tAttrs}>
    <div class="read-tools"><button type="button" class="play-all" data-play-all><svg class="ic" aria-hidden="true" focusable="false" style="width:1.15em;height:1.15em;vertical-align:-.2em;flex:none"><use href="/icons.svg#i-play"/></svg> ${READING_T_ES['data-t-play']}</button> <button type="button" class="slow-tog" data-slow aria-pressed="false"><svg class="ic" aria-hidden="true" focusable="false" style="width:1.15em;height:1.15em;vertical-align:-.2em;flex:none"><use href="/icons.svg#i-turtle"/></svg> Más lento</button></div>
    <article class="rtext" lang="en" dir="ltr">${sentences}</article>
    <p class="gloss" id="gloss" aria-live="polite">Toca una palabra para verla en español</p>
    <h2 class="section-title">Preguntas</h2>
    <ol class="qs">${qs}</ol>
    <p class="score center" id="read-score" aria-live="polite" hidden></p>
    <p class="center">${next ? `<a class="cta" href="${ES_HUB}${next.slug}/">Siguiente lectura: <span lang="en">${escapeHtml(next.title)}</span> →</a>` : `<a class="cta" href="${ES_HUB}">Todas las lecturas →</a>`}</p>
  </section></main>
  <style>${READING_CSS}</style>
  <script src="/reading.js" defer></script>`,
    }));
  }
  const cards = texts.map((r) => `
        <a class="unit-card" href="${ES_HUB}${r.slug}/"><strong><span lang="en">${escapeHtml(r.title)}</span> · ${escapeHtml(esTitle(r))}</strong><span>${nWords(r)} palabras · ${LEVEL_ES[r.level]}</span></a>`).join('');
  mkdirSync(join(distDir, 'es', 'lecturas'), { recursive: true });
  writePage(join(distDir, 'es', 'lecturas', 'index.html'), kit.shell({
    path: ES_HUB, test: false, footerNote, lang: 'es', head: twinHead(SITE, '/band-1/reading/', ES_HUB),
    title: `${texts.length} lecturas cortas en inglés para niños de primaria, con audio | Children Do English`,
    description: `${texts.length} lecturas cortas en inglés (50–65 palabras) para niños de primaria: audio frase por frase, toca una palabra para verla en español y responde preguntas de comprensión. Gratis.`,
    schemas: [kit.crumbs(crumbsBase)],
    body: `
  <nav class="breadcrumb" aria-label="breadcrumb">${navBase}${hubName}</nav>
  <header class="hero"><h1>Lecturas cortas en inglés para niños</h1>
    <p class="answer">${texts.length} textos cortos que escribimos con palabras sencillas. En cada uno: audio frase por frase, la traducción al español de cualquier palabra con un toque, y 3 preguntas de comprensión. Van de la más fácil a la más larga.</p></header>
  <main class="container"><section class="section">
  <div class="unit-grid">${cards}
  </div>
  <p class="aligned">Las palabras se practican también en el <a href="/vocabulary/animals/spanish/">vocabulario en inglés y español</a> y en las <a href="/es/fichas/">fichas para imprimir</a>.</p>
  </section></main>`,
  }));
  return texts.length + 1;
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
`;
