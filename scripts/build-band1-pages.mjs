// Band I by topic: /band-1/ hub + /band-1/<topic>/ — Hebrew pages built from
// OUR words (photo, audio, Hebrew gloss, example sentence) with a chip for the
// Ministry Band I level each one is on (src/data/band1.js, a mapping — the
// Ministry list itself is never reproduced: owner 2026-10-29 "map it, dont copy
// it, and add 10% extra so it is not identical 1:1"). Each topic also carries
// ~10% same-topic words that are NOT on Band I, chipped "בונוס · מחוץ לרשימה"; the
// coverage numbers count only real Band I words. Order = level, then our own
// word order — never the Ministry's (alphabetical) order.
// Same page body as the unit pages (wordSetKit): practice, dictation, cards,
// bingo / word search, share. Nothing on /he/ links here before Nov 14.
import { join } from 'path';
import { mkdirSync } from 'fs';
import { wordSetKit } from './build-unit-pages.mjs';

export const BAND_CHIPS = {
  pre: { label: 'Pre-Band I', cls: 'chip-pre' },
  c1: { label: 'Band I · Core I', cls: 'chip-c1' },
  c2: { label: 'Band I · Core II', cls: 'chip-c2' },
  extra: { label: 'בונוס · מחוץ לרשימה', cls: 'chip-extra' },
};
const ORDER = { pre: 0, c1: 1, c2: 2, extra: 3 };
const MIN_TOPIC = 8; // smaller topics fold into "more"

export function band1Topics({ WORDS, BAND1_BY_ID, CATEGORY_NAMES_HE }) {
  const byCat = new Map();
  for (const w of WORDS) {
    if (!byCat.has(w.category)) byCat.set(w.category, []);
    byCat.get(w.category).push(w);
  }
  const big = [], small = [];
  for (const [cat, ws] of byCat) (ws.filter((w) => BAND1_BY_ID[w.id]).length >= MIN_TOPIC ? big : small).push(cat);
  const topics = big.map((cat) => ({ slug: cat, he: CATEGORY_NAMES_HE[cat] || cat, cats: [cat] }));
  if (small.length) topics.push({ slug: 'more', he: 'עוד נושאים: ' + small.map((c) => CATEGORY_NAMES_HE[c] || c).join(', '), short: 'עוד נושאים', cats: small });
  for (const t of topics) {
    const pool = t.cats.flatMap((c) => byCat.get(c));
    const band = pool.filter((w) => BAND1_BY_ID[w.id]);
    // ~10% extras: same topic, not on Band I, easiest first (our own order)
    const lvl = { beginner: 0, intermediate: 1, advanced: 2 };
    const extras = pool.filter((w) => !BAND1_BY_ID[w.id]).sort((a, b) => lvl[a.level] - lvl[b.level]).slice(0, Math.max(1, Math.ceil(band.length * 0.1)));
    const tagged = [...band.map((w) => ({ w, tag: BAND1_BY_ID[w.id] })), ...extras.map((w) => ({ w, tag: 'extra' }))]
      .sort((a, b) => ORDER[a.tag] - ORDER[b.tag]);
    t.bandCount = band.length;
    t.words = tagged.map(({ w, tag }) => ({ en: w.word, he: w.hebrewTranslation, wordId: w.id, ex: w.exampleSentence, chip: BAND_CHIPS[tag], tag }));
  }
  return topics;
}

// RC4 review path ("Band I before junior high"): 14 short sets behind one link,
// /band-1/review/. Our Band I words, easiest level first (Pre-Band I → Core I →
// Core II), grouped by topic inside a level so each set feels like one or two
// themes, split into 14 near-equal sets. One bonus non-Band-I word per set
// (chipped, same topic as the set) keeps the ~10% rule from the topic pages.
export const PATH_SETS = 14;
export function band1Path({ WORDS, BAND1_BY_ID, CATEGORY_NAMES_HE }) {
  const catRank = new Map();
  for (const w of WORDS) if (!catRank.has(w.category)) catRank.set(w.category, catRank.size);
  const pos = new Map(WORDS.map((w, i) => [w.id, i]));
  const band = WORDS.filter((w) => BAND1_BY_ID[w.id])
    .sort((a, b) => ORDER[BAND1_BY_ID[a.id]] - ORDER[BAND1_BY_ID[b.id]] || catRank.get(a.category) - catRank.get(b.category) || pos.get(a.id) - pos.get(b.id));
  const sets = [];
  for (let n = 0, at = 0; n < PATH_SETS; n++) {
    const size = Math.floor(band.length / PATH_SETS) + (n < band.length % PATH_SETS ? 1 : 0);
    sets.push(band.slice(at, at + size));
    at += size;
  }
  const lvl = { beginner: 0, intermediate: 1, advanced: 2 };
  const usedExtra = new Set();
  return sets.map((ws, i) => {
    const cats = [...new Set(ws.map((w) => w.category))];
    // the bonus word: the set's biggest topic, easiest non-Band-I word not used by an earlier set
    const main = cats.map((c) => [c, ws.filter((w) => w.category === c).length]).sort((a, b) => b[1] - a[1])[0][0];
    const extra = WORDS.filter((w) => w.category === main && !BAND1_BY_ID[w.id] && !usedExtra.has(w.id))
      .sort((a, b) => lvl[a.level] - lvl[b.level] || pos.get(a.id) - pos.get(b.id))[0];
    if (extra) usedExtra.add(extra.id);
    const tagged = [...ws.map((w) => ({ w, tag: BAND1_BY_ID[w.id] })), ...(extra ? [{ w: extra, tag: 'extra' }] : [])];
    const levels = [...new Set(ws.map((w) => BAND1_BY_ID[w.id]))];
    return {
      n: i + 1,
      he: cats.slice(0, 3).map((c) => CATEGORY_NAMES_HE[c] || c).join(' · ') + (cats.length > 3 ? ' ועוד' : ''),
      levels: levels.map((l) => BAND_CHIPS[l].label),
      bandCount: ws.length,
      words: tagged.map(({ w, tag }) => ({ en: w.word, he: w.hebrewTranslation, wordId: w.id, ex: w.exampleSentence, chip: BAND_CHIPS[tag], tag })),
    };
  });
}

export function buildBand1Pages({ SITE, distDir, writePage, escapeHtml, WORDS, collides, BAND1_BY_ID, BAND1_TOTAL, CATEGORY_NAMES_HE }) {
  const kit = wordSetKit({ SITE, writePage, escapeHtml, WORDS, collides });
  const topics = band1Topics({ WORDS, BAND1_BY_ID, CATEGORY_NAMES_HE });
  const covered = topics.reduce((n, t) => n + t.bandCount, 0);
  const footerNote = 'רשימת Band I היא של משרד החינוך. האתר אינו מטעם משרד החינוך: אנחנו רק מסמנים אילו מהמילים שלנו נמצאות ב-Band I — הרשימה עצמה אינה מועתקת לכאן.';
  const legend = `<p class="aligned">כל מילה מסומנת לפי הרמה שלה ברשימת Band I של משרד החינוך:
        <span class="chip chip-pre">Pre-Band I</span> <span class="chip chip-c1">Band I · Core I</span> <span class="chip chip-c2">Band I · Core II</span>.
        מילים עם <span class="chip chip-extra">בונוס · מחוץ לרשימה</span> הן תוספת שלנו מאותו נושא.</p>`;

  for (const t of topics) {
    const path = `/band-1/${t.slug}/`;
    const name = t.short || t.he;
    const sample = t.words.filter((w) => w.tag !== 'extra').slice(0, 6).map((w) => w.en).join(', ');
    kit.setPage({
      dir: join(distDir, 'band-1', t.slug), path, test: false, footerNote,
      title: `מילים באנגלית Band I: ${name} — עם הגייה, תמונה ותרגום`,
      description: `${t.bandCount} מילים מתוך Band I בנושא ${name}, עם תמונה, הגייה באנגלית, תרגום לעברית ומשפט לדוגמה — ${sample}… ותרגול, הכתבה ודפי פעילות. חינם.`,
      crumbItems: [['עברית', '/he/'], ['Band I לפי נושאים', '/band-1/'], [name, path]],
      navHtml: `<a href="/he/">עברית</a> › <a href="/band-1/"><span lang="en" dir="ltr">Band I</span> לפי נושאים</a> › ${escapeHtml(name)}`,
      h1Html: `מילים באנגלית <span lang="en" dir="ltr">Band I</span>: ${escapeHtml(t.he)}`,
      answer: `${t.bandCount} מילים מרשימת Band I בנושא ${name}, כל אחת עם תמונה, הגייה, תרגום ומשפט לדוגמה, ועוד ${t.words.length - t.bandCount} מילות בונוס מחוץ לרשימה. לוחצים 🔊 כדי לשמוע, ומתרגלים למטה.`,
      listHeading: `המילים בנושא ${name}`,
      words: t.words,
      afterTable: legend,
      practiceKey: `band1-${t.slug}`,
      faqPairs: [
        [`אילו מילים מתוך Band I יש בנושא ${name}?`, `בעמוד ${t.bandCount} מילים מתוך Band I, למשל: ${t.words.filter((w) => w.tag !== 'extra').slice(0, 8).map((w) => `${w.en} (${w.he})`).join(', ')}. ליד כל מילה מסומנת הרמה שלה: Pre-Band I, Core I או Core II.`],
        ['מה זה Band I?', 'Band I היא רשימת אוצר המילים באנגלית של משרד החינוך לבית הספר היסודי. Pre-Band I הן המילים הראשונות, ו-Core I ו-Core II הם שני חלקי Band I.'],
        ['מה הן מילות הבונוס?', 'מילים שימושיות מאותו נושא שאינן ברשימת Band I. הוספנו אותן כדי להרחיב את אוצר המילים, והן מסומנות כדי שתמיד יהיה ברור מה שייך לרשימה.'],
        ['האם זו רשימת Band I המלאה?', `לא. אנחנו מסמנים את המילים מהאתר שלנו שנמצאות ב-Band I (${covered} מתוך כ-${BAND1_TOTAL.toLocaleString('en-US')} פריטים בעמודי הנושאים). את הרשימה הרשמית מפרסם משרד החינוך.`],
      ],
      sheetsName: `Band I · ${t.slug === 'more' ? 'More topics' : t.slug}`,
      shareTitle: `Band I — ${name}: מילים באנגלית עם הגייה ותרגול`,
      ctaUtm: `utm_medium=band1&amp;utm_content=${t.slug}`,
    });
  }

  // --- hub ---
  const path = '/band-1/';
  const dir = join(distDir, 'band-1');
  mkdirSync(dir, { recursive: true });
  const cards = topics.map((t) => `
        <a class="unit-card" href="/band-1/${t.slug}/"><strong>${escapeHtml(t.short || t.he)}</strong><span>${t.bandCount} מילים מתוך <span lang="en" dir="ltr">Band I</span> · <span lang="en" dir="ltr">${escapeHtml(t.words.filter((w) => w.tag !== 'extra').slice(0, 4).map((w) => w.en).join(', '))}</span>…</span></a>`).join('');
  writePage(join(dir, 'index.html'), kit.shell({
    path, test: false, footerNote,
    title: 'Band I באנגלית לפי נושאים — מילים עם הגייה, תמונה ותרגום לעברית',
    description: `${covered} מילים מרשימת Band I של משרד החינוך, לפי נושאים, עם תמונה, הגייה, תרגום ותרגול — ועוד מילות בונוס, מסומנות. חינם, בלי הרשמה.`,
    schemas: [
      kit.crumbs([['עברית', '/he/'], ['Band I לפי נושאים', path]]),
      kit.faq([
        ['מה יש בעמודים?', `${covered} מילים מרשימת Band I, מסודרות לפי ${topics.length} נושאים, כל אחת עם תמונה, הגייה, תרגום לעברית ומשפט לדוגמה, ותרגול, הכתבה וכרטיסיות להדפסה.`],
        ['האם זו הרשימה הרשמית?', 'לא. את רשימת Band I מפרסם משרד החינוך. אנחנו מסמנים אילו מהמילים שלנו שייכות לה ובאיזו רמה.'],
      ]),
    ],
    body: `
  <nav class="breadcrumb" aria-label="breadcrumb"><a href="/he/">עברית</a> › <span lang="en" dir="ltr">Band I</span> לפי נושאים</nav>
  <header class="hero"><h1>מילים באנגלית <span lang="en" dir="ltr">Band I</span> לפי נושאים</h1>
    <p class="answer">${covered} מילים מרשימת <span lang="en" dir="ltr">Band I</span> של משרד החינוך, עם תמונה, הגייה, תרגום ותרגול, מסודרות לפי ${topics.length} נושאים. בכל נושא נוספו גם כמה מילות בונוס מחוץ לרשימה, מסומנות.</p></header>
  <main class="container"><section class="section">
  <p class="center"><a class="cta" href="/band-1/review/">🎒 מסלול חזרה: כל Band I ב-${PATH_SETS} סטים קצרים ←</a></p>
  <div class="unit-grid">${cards}
  </div>
  ${legend}
  <p class="aligned">מילים נוספות מתוך <span lang="en" dir="ltr">Band I</span> מופיעות בעמודי <a href="/units/">יחידות הלימוד</a>, מסומנות באותו אופן.</p>
  </section></main>`,
  }));
  return topics.length + 1 + buildReviewPath({ SITE, distDir, writePage, escapeHtml, kit, footerNote, legend, WORDS, BAND1_BY_ID, CATEGORY_NAMES_HE });
}

function buildReviewPath({ distDir, writePage, escapeHtml, kit, footerNote, legend, WORDS, BAND1_BY_ID, CATEGORY_NAMES_HE }) {
  const sets = band1Path({ WORDS, BAND1_BY_ID, CATEGORY_NAMES_HE });
  const total = sets.reduce((n, s) => n + s.bandCount, 0);
  const hubPath = '/band-1/review/';
  const hubName = 'מסלול חזרה על Band I';
  for (const s of sets) {
    const path = `${hubPath}set-${s.n}/`;
    const nextLink = s.n < sets.length
      ? `<a class="cta" href="${hubPath}set-${s.n + 1}/">לסט ${s.n + 1} ←</a>`
      : `<a class="cta" href="${hubPath}">סיימתם את כל ${sets.length} הסטים! חזרה למסלול ←</a>`;
    kit.setPage({
      dir: join(distDir, 'band-1', 'review', `set-${s.n}`), path, test: false, footerNote, step: s.n,
      title: `חזרה על Band I, סט ${s.n} מתוך ${sets.length}: ${s.he}`,
      description: `סט ${s.n} במסלול החזרה על Band I לפני חטיבת הביניים: ${s.bandCount} מילים (${s.words.filter((w) => w.tag !== 'extra').slice(0, 5).map((w) => w.en).join(', ')}…) עם תמונה, הגייה, תרגום ותרגול. חינם, בלי הרשמה.`,
      crumbItems: [['עברית', '/he/'], ['Band I לפי נושאים', '/band-1/'], [hubName, hubPath], [`סט ${s.n}`, path]],
      navHtml: `<a href="/he/">עברית</a> › <a href="/band-1/"><span lang="en" dir="ltr">Band I</span> לפי נושאים</a> › <a href="${hubPath}">מסלול חזרה</a> › סט ${s.n}`,
      h1Html: `חזרה על <span lang="en" dir="ltr">Band I</span>: סט ${s.n} מתוך ${sets.length}`,
      answer: `${s.bandCount} מילים מתוך Band I (${s.he}) ועוד מילת בונוס אחת. מקשיבים לכל מילה ב-🔊, ואז עושים סבב "שומעים ובוחרים" למטה. סבב שהסתיים מסומן ✓ במסלול.`,
      listHeading: `המילים בסט ${s.n}`,
      words: s.words,
      afterTable: `${legend}
      <p class="center">${nextLink}</p>`,
      practiceKey: `band1-review-${s.n}`,
      faqPairs: [
        [`אילו מילים יש בסט ${s.n}?`, `${s.words.filter((w) => w.tag !== 'extra').map((w) => `${w.en} (${w.he})`).join(', ')}.`],
        ['כמה זמן לוקח סט?', `כ-10 דקות: מקשיבים למילים, עושים סבב תרגול אחד (${s.words.length} שאלות), ואם רוצים גם הכתבה. סט ביום מסיים את המסלול בפחות משלושה שבועות.`],
        ['למי מתאים המסלול?', 'לילדים שמסיימים את בית הספר היסודי ורוצים לחזור על אוצר המילים של Band I לפני חטיבת הביניים, למשל בחופש הגדול, ולכל מי שרוצה לחזור על מילים בסיסיות.'],
      ],
      sheetsName: `Band I review · set ${s.n}`,
      shareTitle: `חזרה על Band I — סט ${s.n}: מילים באנגלית עם הגייה ותרגול`,
      ctaUtm: `utm_medium=band1&amp;utm_content=review-${s.n}`,
    });
  }

  const cards = sets.map((s) => `
        <a class="unit-card step-card" href="${hubPath}set-${s.n}/" data-step-card="${s.n}"><strong>סט ${s.n}<span class="step-done" aria-hidden="true"> ✓</span></strong><span>${escapeHtml(s.he)} · ${s.bandCount} מילים · <span lang="en" dir="ltr">${escapeHtml(s.words.slice(0, 3).map((w) => w.en).join(', '))}</span>…</span></a>`).join('');
  writePage(join(distDir, 'band-1', 'review', 'index.html'), kit.shell({
    path: hubPath, test: false, footerNote,
    title: `חזרה על Band I לפני חטיבת הביניים — ${sets.length} סטים קצרים עם הגייה ותרגול`,
    description: `${total} מילים מרשימת Band I ב-${sets.length} סטים קצרים, מהקל לקשה: תמונה, הגייה, תרגום ותרגול בכל סט. מתאים לחופש הגדול לפני כיתה ז׳. חינם, בלי הרשמה.`,
    schemas: [
      kit.crumbs([['עברית', '/he/'], ['Band I לפי נושאים', '/band-1/'], [hubName, hubPath]]),
      kit.faq([
        ['מה זה מסלול החזרה?', `${sets.length} סטים קצרים של מילים מתוך Band I (${total} מילים), מהרמה הראשונה (Pre-Band I) דרך Core I ועד Core II. כל סט: מקשיבים, מתרגלים, ועוברים לבא.`],
        ['איך יודעים מה כבר עשינו?', 'סט שבו סיימתם סבב תרגול מסומן ✓ בעמוד הזה. הסימון נשמר רק בדפדפן שבו תרגלתם — בלי הרשמה ובלי לשלוח מידע.'],
        ['האם זו רשימת Band I המלאה?', 'לא. אלה המילים מהאתר שלנו שנמצאות ב-Band I, עם מילת בונוס אחת בכל סט. את הרשימה הרשמית מפרסם משרד החינוך.'],
      ]),
    ],
    body: `
  <nav class="breadcrumb" aria-label="breadcrumb"><a href="/he/">עברית</a> › <a href="/band-1/"><span lang="en" dir="ltr">Band I</span> לפי נושאים</a> › מסלול חזרה</nav>
  <header class="hero"><h1>חזרה על <span lang="en" dir="ltr">Band I</span> לפני חטיבת הביניים</h1>
    <p class="answer">${total} מילים מרשימת <span lang="en" dir="ltr">Band I</span> ב-${sets.length} סטים קצרים, מהקל לקשה. בכל סט מקשיבים למילים, מתרגלים, ועוברים לסט הבא. סט ביום, כעשר דקות.</p></header>
  <main class="container"><section class="section">
  <p class="center path-progress" id="path-progress" hidden></p>
  <div class="unit-grid">${cards}
  </div>
  ${legend}
  </section></main>
  <script defer src="/unit-practice.js"></script>`,
  }));
  return sets.length + 1;
}
