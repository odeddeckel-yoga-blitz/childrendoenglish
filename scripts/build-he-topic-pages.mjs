// Hebrew topic word pages: /he/english-words/ hub + /he/english-words/<slug>/
// (src/data/heTopics.js). Topics Hebrew searchers type as "<topic> באנגלית"
// that had no CDE page (autocomplete 10-31): days, months, family, numbers to
// 100, ABC. Same page body as the unit and Band I pages (wordSetKit): word table
// with 🔊, practice (hear / spell / dictation / sentence modes), cards, sheets.
import { join } from 'path';
import { mkdirSync } from 'fs';
import { wordSetKit } from './build-unit-pages.mjs';

export function heTopicWords(topic, byId) {
  return topic.words.map((w) => {
    const base = w.wordId ? byId.get(w.wordId) : null;
    if (w.wordId && !base) throw new Error(`heTopics ${topic.slug}: wordId '${w.wordId}' is not in words.js`);
    const en = w.en || base.word;
    const ex = w.ex || base.exampleSentence;
    const word = { en, he: w.he || base.hebrewTranslation, wordId: w.wordId, ex };
    // ABC: lead each sentence with its letter ("A is for apple."), our own line
    if (topic.letters) word.ex = `${en[0].toUpperCase()} is for ${en}.`;
    return word;
  });
}

export function buildHeTopicPages({ SITE, distDir, writePage, escapeHtml, WORDS, collides, HE_TOPICS }) {
  const kit = wordSetKit({ SITE, writePage, escapeHtml, WORDS, collides });
  const { byId } = kit;
  const footerNote = 'רשימות המילים, התרגום והמשפטים הם שלנו. ההשמעה היא קול מוקלט מראש של מחשב (TTS), אחיד לכל המילים.';
  const hubPath = '/he/english-words/';
  for (const [i, t] of HE_TOPICS.entries()) {
    const path = `${hubPath}${t.slug}/`;
    const words = heTopicWords(t, byId);
    const sample = words.slice(0, 6).map((w) => w.en).join(', ');
    const nt = HE_TOPICS[i + 1];
    kit.setPage({
      dir: join(distDir, 'he', 'english-words', t.slug), path, test: false, footerNote,
      title: `${t.query} — ${words.length} מילים עם הגייה, תרגום ותרגול לילדים | Children Do English`,
      description: `${t.query} לילדים: ${words.length} מילים (${sample}…) עם הגייה, תרגום לעברית, משפט לדוגמה ותרגול. חינם, בלי פרסומות ובלי הרשמה.`,
      crumbItems: [['עברית', '/he/'], ['מילים באנגלית לפי נושא', hubPath], [t.name, path]],
      navHtml: `<a href="/he/">עברית</a> › <a href="${hubPath}">מילים באנגלית לפי נושא</a> › ${escapeHtml(t.name)}`,
      h1Html: escapeHtml(t.query),
      answer: `${t.intro} לוחצים 🔊 כדי לשמוע, ומתרגלים למטה.`,
      listHeading: `${t.name} באנגלית: ${words.length} מילים`,
      words,
      practiceKey: `he-${t.slug}`,
      faqPairs: [
        [`איך אומרים ${t.name} באנגלית?`, words.slice(0, 8).map((w) => `${w.he} = ${w.en}`).join(', ') + (words.length > 8 ? '… הרשימה המלאה בטבלה.' : '.')],
        ['איך מתרגלים?', 'לוחצים 🔊 ליד כל מילה כדי לשמוע אותה, ואז בוחרים תרגול: שומעים ובוחרים את הפירוש, כותבים מה ששומעים, הכתבה, משלימים משפט או בונים משפט.'],
        ['האם זה בחינם?', 'כן. בלי הרשמה, בלי פרסומות ובלי להוריד אפליקציה — עובד בדפדפן במחשב, בטאבלט ובטלפון.'],
      ],
      sheetsName: t.name,
      shareTitle: `${t.query} — מילים עם הגייה ותרגול`,
      ctaUtm: `utm_medium=he_topic&amp;utm_content=${t.slug}`,
      afterPractice: nt
        ? `<p class="center"><a class="cta" href="${hubPath}${nt.slug}/">הנושא הבא: ${escapeHtml(nt.name)} ←</a></p>`
        : `<p class="center"><a class="cta" href="/he/english-games/">עוד נושאים ומשחקים ←</a></p>`,
    });
  }
  // hub
  const dir = join(distDir, 'he', 'english-words');
  mkdirSync(dir, { recursive: true });
  const cards = HE_TOPICS.map((t) => `
        <a class="unit-card" href="${hubPath}${t.slug}/"><strong>${escapeHtml(t.query)}</strong><span>${t.words.length} מילים · ${escapeHtml(heTopicWords(t, byId).slice(0, 4).map((w) => w.en).join(', '))}…</span></a>`).join('');
  writePage(join(dir, 'index.html'), kit.shell({
    path: hubPath, test: false, footerNote,
    title: 'מילים באנגלית לפי נושא — ימות השבוע, חודשים, משפחה, מספרים ו-ABC | Children Do English',
    description: 'מילים באנגלית לילדים לפי נושא: ימות השבוע, חודשי השנה, בני המשפחה, מספרים עד 100 ואותיות ה-ABC, עם הגייה, תרגום ותרגול. חינם.',
    schemas: [kit.crumbs([['עברית', '/he/'], ['מילים באנגלית לפי נושא', hubPath]])],
    body: `
  <nav class="breadcrumb" aria-label="breadcrumb"><a href="/he/">עברית</a> › מילים באנגלית לפי נושא</nav>
  <header class="hero"><h1>מילים באנגלית לפי נושא</h1>
    <p class="answer">ימות השבוע, חודשי השנה, בני המשפחה, מספרים עד 100 ואותיות ה-<span lang="en" dir="ltr">ABC</span> — כל מילה עם הגייה, תרגום לעברית ומשפט לדוגמה, ותרגול בסוף כל עמוד.</p></header>
  <main class="container"><section class="section">
  <div class="unit-grid">${cards}
  </div>
  <p class="aligned">עוד נושאים עם תמונות ומשחקים: <a href="/he/english-games/">משחקים ללימוד אנגלית לילדים</a> · <a href="/band-1/">רשימת <bdi>Band I</bdi> לפי נושאים</a> · <a href="/units/">יחידות לימוד</a>.</p>
  </section></main>`,
  }));
  return HE_TOPICS.length + 1;
}
