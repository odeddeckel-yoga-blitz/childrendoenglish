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

export function buildReadingPages({ SITE, distDir, writePage, escapeHtml, WORDS, collides, READINGS, READING_NAMES, READING_GLOSSES, READING_PHRASES }) {
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
    return src ? `<button type="button" class="say" data-say="${src}" aria-label="${label}">🔊</button>` : '';
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
      path, test: false, footerNote,
      title: `קטע קריאה באנגלית: ${r.title} (${r.he}) — עם הקראה ותרגום | Children Do English`,
      description: `קטע קריאה קצר באנגלית לילדים, ${words(r)} מילים מרשימת Band I: מקשיבים, לוחצים על מילה כדי לראות אותה בעברית, ועונים על ${r.questions.length} שאלות. חינם, בלי הרשמה.`,
      schemas: [kit.crumbs([['עברית', '/he/'], ['Band I לפי נושאים', '/band-1/'], [hubName, hubPath], [r.title, path]])],
      body: `
  <nav class="breadcrumb" aria-label="breadcrumb"><a href="/he/">עברית</a> › <a href="/band-1/"><span lang="en" dir="ltr">Band I</span> לפי נושאים</a> › <a href="${hubPath}">${hubName}</a> › <bdi lang="en" dir="ltr">${escapeHtml(r.title)}</bdi></nav>
  <header class="hero"><h1><bdi lang="en" dir="ltr">${escapeHtml(r.title)}</bdi> · ${escapeHtml(r.he)}</h1>
    <p class="answer">קטע קצר באנגלית: ${words(r)} מילים, ברמת <bdi lang="en" dir="ltr">${LEVEL_HE[r.level]}</bdi>. לוחצים על ▶ כדי לשמוע, על כל מילה כדי לראות אותה בעברית, ובסוף עונים על ${r.questions.length} שאלות.</p></header>
  <main class="container"><section class="section reading" data-reading="${r.slug}">
    <div class="read-tools"><button type="button" class="play-all" data-play-all>▶ הקשיבו לכל הקטע</button> <button type="button" class="slow-tog" data-slow aria-pressed="false">🐢 לאט</button></div>
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
    path: hubPath, test: false, footerNote,
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
