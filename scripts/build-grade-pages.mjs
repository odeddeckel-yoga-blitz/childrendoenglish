// Grade pages /he/grade-1/ … /he/grade-6/ ("אנגלית לכיתה א׳–ו׳": every grade shows
// autocomplete demand, 10-31). Each maps OUR material to the grade: a practice set
// of our words at the matching Band I level (src/data/band1.js is a mapping of our
// words — the Ministry list is never reproduced), the textbook units tagged with
// that grade, the topic pages and games that fit, and the age page. Same body as
// the unit pages (wordSetKit).
import { wordSetKit } from './build-unit-pages.mjs';
import { join } from 'path';

const GRADES = [
  { n: 1, he: 'א׳', band: 'pre', half: 0, age: 'ages-6-8', note: 'בכיתה א׳ מכירים את האותיות ואת המילים הראשונות באנגלית: שומעים, מצביעים על תמונה ומשחקים. אין צורך לקרוא כדי להתחיל.',
    links: [['/he/english-words/abc/', 'אותיות ה-ABC'], ['/he/english-words/numbers-1-100/', 'מספרים באנגלית'], ['/he/english-games/colors/', 'צבעים'], ['/he/english-games/animals/', 'חיות'], ['/games/sound-pairs/?lang=he', 'משחק: Sound Pairs']] },
  { n: 2, he: 'ב׳', band: 'pre', half: 1, age: 'ages-6-8', note: 'בכיתה ב׳ ממשיכים לבנות אוצר מילים בסיסי ומתחילים לחבר בין אותיות לצלילים — קוראים מילים קצרות כמו cat ו-dog.',
    links: [['/games/read-it/?lang=he', 'משחק: Read It!'], ['/he/english-words/days-of-the-week/', 'ימות השבוע'], ['/he/english-words/family/', 'בני המשפחה'], ['/he/english-games/food/', 'אוכל'], ['/he/english-words/abc/', 'אותיות ה-ABC']] },
  { n: 3, he: 'ג׳', band: 'c1', half: 0, age: 'ages-9-10', note: 'בכיתה ג׳ לומדים אנגלית בבית הספר באופן מסודר: מילים מנושאים קרובים לילד, קריאה ראשונה וכתיבה של מילים.',
    links: [['/he/english-words/months/', 'חודשי השנה'], ['/he/english-games/school/', 'בית הספר'], ['/band-1/', 'רשימת Band I לפי נושאים'], ['/games/spelling-forge/?lang=he', 'משחק: Spelling Forge']] },
  { n: 4, he: 'ד׳', band: 'c1', half: 1, age: 'ages-9-10', note: 'בכיתה ד׳ אוצר המילים גדל, ומתרגלים מילים בתוך משפטים — הבנה, איות ושימוש.',
    links: [['/band-1/reading/', 'קטעי קריאה קצרים'], ['/band-1/', 'רשימת Band I לפי נושאים'], ['/he/english-games/sports/', 'ספורט'], ['/he/english-games/feelings/', 'רגשות'], ['/games/word-zapper/?lang=he', 'משחק: Word Zapper']] },
  { n: 5, he: 'ה׳', band: 'c2', half: 0, age: 'ages-11-12', note: 'בכיתה ה׳ מרחיבים את אוצר המילים לנושאים חדשים ומתרגלים קריאה וכתיבה של משפטים שלמים.',
    links: [['/band-1/reading/', 'קטעי קריאה קצרים'], ['/band-1/review/', 'מסלול חזרה על Band I'], ['/band-1/', 'רשימת Band I לפי נושאים'], ['/he/english-games/nature/', 'טבע'], ['/games/category-conveyor/?lang=he', 'משחק: Category Conveyor']] },
  { n: 6, he: 'ו׳', band: 'c2', half: 1, age: 'ages-11-12', note: 'בכיתה ו׳ סוגרים את אוצר המילים של בית הספר היסודי לקראת חטיבת הביניים — זה הזמן לחזרה מסודרת.',
    links: [['/band-1/reading/', 'קטעי קריאה קצרים'], ['/band-1/review/', 'מסלול חזרה על Band I'], ['/band-1/', 'רשימת Band I לפי נושאים'], ['/he/english-games/everyday/', 'חפצים יומיומיים'], ['/battle/', 'קרב כיתתי']] },
];
const PER_PAGE = 20;

export function buildGradePages({ SITE, distDir, writePage, escapeHtml, WORDS, collides, BAND1_BY_ID, BAND_CHIPS, UNITS, BOOKS }) {
  const kit = wordSetKit({ SITE, writePage, escapeHtml, WORDS, collides });
  const footerNote = 'ההתאמה לכיתות היא שלנו, לפי רמות Band I של המילים שלנו ולפי הכיתה של כל יחידה בספר. רשימת Band I של משרד החינוך אינה מועתקת לכאן.';
  const words = WORDS.filter((w) => BAND1_BY_ID[w.id] && w.exampleSentence);
  const pages = [];
  for (const [i, g] of GRADES.entries()) {
    const path = `/he/grade-${g.n}/`;
    const level = words.filter((w) => BAND1_BY_ID[w.id] === g.band);
    const half = Math.ceil(level.length / 2);
    const set = (g.half ? level.slice(half) : level.slice(0, half)).slice(0, PER_PAGE)
      .map((w) => ({ en: w.word, he: w.hebrewTranslation, wordId: w.id, ex: w.exampleSentence, chip: BAND_CHIPS[g.band] }));
    const units = UNITS.filter((u) => !u.test && u.grade === g.he);
    const unitLinks = units.map((u) => `<a href="/units/${u.book}/unit-${u.unit}/"><bdi lang="en" dir="ltr">${escapeHtml(BOOKS[u.book].name)} Unit ${u.unit}${u.title ? `: ${escapeHtml(u.title)}` : ''}</bdi></a>`);
    const more = g.links.map(([href, label]) => `<a href="${href}">${escapeHtml(label).replace(/[A-Za-z][A-Za-z !]*[A-Za-z!]/g, (m) => `<bdi lang="en" dir="ltr">${m}</bdi>`)}</a>`);
    const nextG = GRADES[i + 1];
    kit.setPage({
      dir: join(distDir, 'he', `grade-${g.n}`), path, test: false, footerNote,
      title: `אנגלית לכיתה ${g.he} — מילים, תרגול ומשחקים בחינם | Children Do English`,
      description: `אנגלית לכיתה ${g.he}: ${set.length} מילים מותאמות לכיתה עם הגייה, תרגום ותרגול${units.length ? ', יחידות מהספר' : ''}, ומשחקים בעברית. חינם, בלי פרסומות ובלי הרשמה.`,
      crumbItems: [['עברית', '/he/'], [`אנגלית לכיתה ${g.he}`, path]],
      navHtml: `<a href="/he/">עברית</a> › אנגלית לכיתה ${g.he}`,
      h1Html: `אנגלית לכיתה ${g.he}`,
      answer: `${g.note} למטה: ${set.length} מילים לכיתה ${g.he} עם הגייה ותרגום, ותרגול.`,
      listHeading: `מילים באנגלית לכיתה ${g.he}`,
      words: set,
      afterTable: `<div class="aligned grade-more">
        ${units.length ? `<p><strong>יחידות מהספר לכיתה ${g.he}:</strong> ${unitLinks.join(' · ')}</p>` : ''}
        <p><strong>עוד לכיתה ${g.he}:</strong> ${more.join(' · ')} · <a href="/he/english-games/${g.age}/">משחקים לפי גיל</a></p>
        <p class="grade-nav">${GRADES.map((x) => x.n === g.n ? `<strong>כיתה ${x.he}</strong>` : `<a href="/he/grade-${x.n}/">כיתה ${x.he}</a>`).join(' · ')}</p>
      </div>`,
      practiceKey: `grade-${g.n}`,
      faqPairs: [
        [`מה לומדים באנגלית בכיתה ${g.he}?`, g.note],
        [`אילו מילים באנגלית מתאימות לכיתה ${g.he}?`, `למשל: ${set.slice(0, 8).map((w) => `${w.en} (${w.he})`).join(', ')}. כל המילים בטבלה בעמוד, עם הגייה ותרגול.`],
        ['האם זה בחינם?', 'כן. בלי הרשמה, בלי פרסומות ובלי להוריד אפליקציה — עובד בדפדפן במחשב, בטאבלט ובטלפון.'],
      ],
      sheetsName: `אנגלית לכיתה ${g.he}`,
      shareTitle: `אנגלית לכיתה ${g.he} — מילים עם הגייה ותרגול`,
      ctaUtm: `utm_medium=grade&amp;utm_content=${g.n}`,
      afterPractice: nextG ? `<p class="center"><a class="cta" href="/he/grade-${nextG.n}/">לכיתה ${nextG.he} ←</a></p>` : `<p class="center"><a class="cta" href="/band-1/review/">מסלול חזרה לפני חטיבת הביניים ←</a></p>`,
    });
    pages.push(path);
  }
  return pages.length;
}
