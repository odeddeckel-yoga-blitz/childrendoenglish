// Hebrew printable flashcards: /printable-flashcards/<category>/hebrew/ + the
// /printable-flashcards/hebrew/ index. Same photo cards as the English sets, but
// a Hebrew page (RTL, Hebrew title/how-to/FAQ) for Israeli parents and teachers,
// and Hebrew-first cards: photo, English word, Hebrew meaning — no English
// definition (the English sets keep it). Reciprocal hreflang en/es/he.
// Nothing on /he/ links here until the /he/ head-term test ends (~Nov 14).
import { join } from 'path';
import { mkdirSync } from 'fs';

const PRINT_STEPS_HE = (what) => [
  { name: 'פותחים את הסט', text: `פותחים את עמוד הכרטיסיות של ${what} במחשב או בטאבלט שמחובר למדפסת.` },
  { name: 'מדפיסים', text: 'לוחצים על "הדפסת הכרטיסיות" או על ‎Ctrl+P‎ (במחשב מק: ‎Cmd+P‎). הכותרת, הקישורים והכפתורים מוסתרים לבד; מודפסות רק הכרטיסיות, 3 בשורה, עם קו מקווקו לגזירה.' },
  { name: 'בוחרים נייר', text: 'בוחרים A4 לאורך ומסמנים "גרפיקת רקע" כדי שהתמונות יודפסו. בריסטול (160–200 גרם) נותן כרטיסיות חזקות יותר; נייר רגיל מתאים אם מנילנים.' },
  { name: 'גוזרים', text: 'גוזרים לאורך הקווים המקווקווים. לכרטיסיות דו-צדדיות עם התרגום מאחור יש את יוצר הכרטיסיות החינמי, שמסדר את העמודים כך שההדפסה הדו-צדדית מתאימה.' },
];

const CSS = `
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: system-ui, -apple-system, 'Segoe UI', sans-serif; background: #eff6ff; color: #1e293b; line-height: 1.7; direction: rtl; text-align: right; }
    .header { background: #2563eb; color: #fff; padding: 2rem 1rem; text-align: center; }
    .header h1 { font-size: 1.6rem; margin-bottom: 0.25rem; line-height: 1.35; }
    .header p { opacity: 0.92; font-size: 0.95rem; }
    .breadcrumb { padding: 0.75rem 1rem; font-size: 0.85rem; color: #4b5a6e; max-width: 960px; margin: 0 auto; }
    .breadcrumb a { color: #2563eb; text-decoration: underline; }
    .container { max-width: 960px; margin: 0 auto; padding: 0 1rem 2rem; }
    .intro { margin-bottom: 1rem; color: #475569; }
    .print-btn { display: inline-block; background: #2563eb; color: #fff; padding: 0.6rem 1.5rem; border-radius: 0.5rem; font-weight: 700; font-size: 1rem; cursor: pointer; border: none; margin-bottom: 1.25rem; font-family: inherit; }
    .play-online { display: inline-block; margin: 0 0.75rem 1.25rem 0; color: #0f766e; font-weight: 700; text-decoration: none; }
    .howto { background: #fff; border-radius: 0.75rem; padding: 1rem 1.25rem; margin: 0 0 1.25rem; box-shadow: 0 1px 3px rgba(0,0,0,0.08); font-size: 0.93rem; }
    .howto h2 { font-size: 1.05rem; margin: 0 0 0.5rem; }
    .howto ol { margin: 0 1.25rem 0 0; color: #475569; } .howto li { margin-bottom: 0.3rem; }
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 1rem; margin-bottom: 2rem; }
    .flashcard { background: #fff; border-radius: 0.75rem; padding: 1.1rem; box-shadow: 0 1px 3px rgba(0,0,0,0.08); text-align: center; border: 2px dashed #e2e8f0; page-break-inside: avoid; break-inside: avoid; }
    .fc-img { width: 150px; height: 150px; border-radius: 0.75rem; object-fit: cover; margin: 0 auto 0.6rem; display: block; }
    .fc-word { font-size: 1.4rem; font-weight: 800; direction: ltr; }
    .fc-he { color: #334155; font-size: 1.15rem; font-weight: 700; }
    .faq { max-width: 760px; margin: 2rem auto 0; }
    .faq h2 { font-size: 1.2rem; margin-bottom: 0.75rem; text-align: center; }
    .faq-item { background: #fff; border-radius: 0.75rem; padding: 0.9rem 1.1rem; margin-bottom: 0.6rem; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
    .faq-item h3 { font-size: 1rem; margin-bottom: 0.25rem; } .faq-item p { color: #475569; font-size: 0.93rem; }
    .cta { text-align: center; margin: 2rem 0; }
    .cta a { display: inline-block; background: #2563eb; color: #fff; padding: 0.75rem 2rem; border-radius: 0.5rem; text-decoration: none; font-weight: 700; }
    .categories h2 { font-size: 1.1rem; margin: 2rem 0 0.75rem; color: #334155; }
    .cat-links { display: flex; flex-wrap: wrap; gap: 0.5rem; }
    .cat-links a { background: #fff; padding: 0.4rem 0.85rem; border-radius: 2rem; font-size: 0.9rem; color: #2563eb; text-decoration: none; box-shadow: 0 1px 2px rgba(0,0,0,0.06); }
    .cat-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 0.75rem; }
    .cat-card { display: flex; gap: 0.75rem; align-items: center; background: #fff; border-radius: 0.75rem; padding: 0.75rem; box-shadow: 0 1px 3px rgba(0,0,0,0.08); text-decoration: none; color: inherit; }
    .cat-card img { border-radius: 0.5rem; object-fit: cover; }
    .cat-card strong { display: block; color: #2563eb; } .cat-card span { font-size: 0.85rem; color: #475569; }
    .footer { text-align: center; padding: 2rem 1rem; color: #4b5a6e; font-size: 0.8rem; }
    .footer a { color: #4b5a6e; }
    @media print {
      .header, .breadcrumb, .print-btn, .cta, .categories, .footer, .no-print, .faq, .crawl-mesh { display: none !important; }
      body { background: #fff; }
      .grid { grid-template-columns: repeat(3, 1fr); gap: 0.75rem; }
      .flashcard { border: 2px dashed #ccc; box-shadow: none; padding: 0.75rem; }
      .fc-img { width: 100px; height: 100px; }
    }`;

export function buildHebrewFlashcards({ SITE, flashcardsDir, writePage, escapeHtml, CATEGORIES, CATEGORY_NAMES, CATEGORY_NAMES_HE, getWordsByCategory, howToSchemaFor, faqSchemaFor, FC_EAGER }) {
  const year = new Date().getFullYear();
  const alternates = (en, es, he) => `  <link rel="alternate" hreflang="en" href="${en}" />
  <link rel="alternate" hreflang="es" href="${es}" />
  <link rel="alternate" hreflang="he" href="${he}" />
  <link rel="alternate" hreflang="x-default" href="${en}" />`;
  const crumbs = (items) => JSON.stringify({
    '@context': 'https://schema.org', '@type': 'BreadcrumbList',
    itemListElement: items.map(([name, path], i) => ({ '@type': 'ListItem', position: i + 1, name, item: `${SITE}${path}` })),
  });
  const howToHtml = (heading, steps) => `<section class="howto no-print">
      <h2>${escapeHtml(heading)}</h2>
      <ol>${steps.map((st) => `<li><strong>${escapeHtml(st.name)}.</strong> ${escapeHtml(st.text)}</li>`).join('')}</ol>
    </section>`;
  const faqHtml = (pairs) => `<section class="faq no-print" aria-labelledby="faq-h">
      <h2 id="faq-h">שאלות נפוצות</h2>${pairs.map(({ q, a }) => `
      <div class="faq-item"><h3>${escapeHtml(q)}</h3><p>${escapeHtml(a)}</p></div>`).join('')}
    </section>`;
  const page = ({ path, title, description, en, es, schemas, body }) => `<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}" />
  <meta name="robots" content="index, follow" />
  <link rel="canonical" href="${SITE}${path}" />
${alternates(en, es, `${SITE}${path}`)}
  <link rel="icon" type="image/png" href="/favicon.png" />
  <meta property="og:locale" content="he_IL" />
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="Children Do English" />
  <meta property="og:url" content="${SITE}${path}" />
  <meta property="og:title" content="${escapeHtml(title)}" />
  <meta property="og:description" content="${escapeHtml(description)}" />
  <meta property="og:image" content="${SITE}/og-image.png" />
${schemas.map((s) => `  <script type="application/ld+json">${s}</script>`).join('\n')}
  <style>${CSS}</style>
</head>
<body>
${body}
  <div class="footer"><span dir="ltr">&copy; ${year} Children Do English</span> &middot; <a href="/about/">אודות</a> &middot; <a href="/privacy">פרטיות</a></div>
</body>
</html>`;

  const sets = CATEGORIES.map((slug) => ({ slug, he: CATEGORY_NAMES_HE[slug] || slug, en: CATEGORY_NAMES[slug] || slug, words: getWordsByCategory(slug) })).filter((c) => c.words.length);
  const total = sets.reduce((n, c) => n + c.words.length, 0);

  for (const c of sets) {
    const path = `/printable-flashcards/${c.slug}/hebrew/`;
    const n = c.words.length;
    const title = `כרטיסיות באנגלית להדפסה: ${c.he} — ${n} כרטיסיות עם תמונות ותרגום לעברית`;
    const description = `${n} כרטיסיות ${c.he} באנגלית להדפסה, חינם: תמונה אמיתית, המילה באנגלית והתרגום לעברית. מדפיסים, גוזרים ומתרגלים — בלי הרשמה.`;
    const steps = PRINT_STEPS_HE(c.he);
    const faq = [
      { q: `כמה כרטיסיות יש בסט ${c.he}?`, a: `${n} כרטיסיות, למשל: ${c.words.slice(0, 6).map((w) => `${w.word} (${w.hebrewTranslation})`).join(', ')}. כל כרטיסייה עם תמונה אמיתית, המילה באנגלית והתרגום לעברית; 3 כרטיסיות בשורה בהדפסה.` },
      { q: 'האם הכרטיסיות בחינם?', a: 'כן. בלי הרשמה, בלי סימן מים ובלי גרסה בתשלום: פותחים, מדפיסים וגוזרים.' },
      { q: 'איך משחקים עם הכרטיסיות?', a: 'מראים את התמונה והילד אומר את המילה באנגלית; מסתירים את התרגום ומנחשים; או מניחים כמה כרטיסיות על השולחן ומבקשים "תביא לי את ה-…". את ההגייה הנכונה אפשר לשמוע באתר.' },
      { q: 'יש גרסה באנגלית בלבד?', a: `כן: ${SITE}/printable-flashcards/${c.slug}/ — אותן כרטיסיות עם הגייה והגדרה באנגלית.` },
    ];
    const cards = c.words.map((w, i) => `
      <div class="flashcard">
        <img src="/images/${w.id}.webp" alt="${escapeHtml(w.word)}" class="fc-img" width="150" height="150"${i >= FC_EAGER ? ' loading="lazy"' : ''} />
        <div class="fc-word" lang="en">${escapeHtml(w.word)}</div>
        <div class="fc-he">${escapeHtml(w.hebrewTranslation)}</div>
      </div>`).join('');
    const others = sets.filter((o) => o.slug !== c.slug).map((o) => `<a href="/printable-flashcards/${o.slug}/hebrew/">${escapeHtml(o.he)}</a>`).join('\n        ');
    const answer = `כרטיסיות ${c.he} באנגלית להדפסה: ${n} כרטיסיות, בכל אחת תמונה אמיתית, המילה באנגלית והתרגום לעברית. לוחצים "הדפסת הכרטיסיות", בוחרים A4 וגוזרים לאורך הקווים המקווקווים — 3 כרטיסיות בשורה.`;
    const dir = join(flashcardsDir, c.slug, 'hebrew');
    mkdirSync(dir, { recursive: true });
    writePage(join(dir, 'index.html'), page({
      path, title, description,
      en: `${SITE}/printable-flashcards/${c.slug}/`, es: `${SITE}/printable-flashcards/${c.slug}/spanish/`,
      schemas: [
        crumbs([['Children Do English', '/'], ['כרטיסיות להדפסה', '/printable-flashcards/hebrew/'], [c.he, path]]),
        howToSchemaFor({ lang: 'he', name: `איך מדפיסים כרטיסיות ${c.he} באנגלית`, description: answer, steps, supplies: ['נייר או בריסטול A4'], tools: ['מדפסת', 'מספריים'] }),
        faqSchemaFor(faq),
      ],
      body: `  <div class="header">
    <h1>כרטיסיות באנגלית להדפסה: ${escapeHtml(c.he)}</h1>
    <p>${n} כרטיסיות עם תמונה, מילה באנגלית ותרגום לעברית &middot; <span lang="en" dir="ltr">${escapeHtml(c.en)}</span></p>
  </div>
  <div class="breadcrumb"><a href="/printable-flashcards/hebrew/">כרטיסיות להדפסה</a> &rsaquo; ${escapeHtml(c.he)}</div>
  <div class="container">
    <p class="intro answer-first">${escapeHtml(answer)}</p>
    <button type="button" class="print-btn" data-print>🖨️ הדפסת הכרטיסיות</button>
    <a class="play-online no-print" href="/new-player?lang=he&utm_source=seo&utm_medium=cta&utm_content=flashcard_top_he&topic=${c.slug}">🎮 מעדיפים לשחק? תרגול באנגלית בחינם, בעברית ←</a>
    <script defer src="/print-btn.js"></script>
    ${howToHtml(`איך מדפיסים את כרטיסיות ה${c.he}`, steps)}
    <div class="grid">${cards}
    </div>
    ${faqHtml(faq)}
    <div class="cta no-print"><a href="/new-player?lang=he&utm_source=seo&utm_medium=cta&utm_content=flashcard_category_he&topic=${c.slug}">מתרגלים את המילים האלה באפליקציה ←</a>
      <p style="margin-top:0.5rem;font-size:0.8rem;color:#4b5a6e">חינם &middot; בלי פרסומות &middot; בלי הרשמה</p></div>
    <div class="categories">
      <h2>עוד כרטיסיות להדפסה</h2>
      <div class="cat-links">
        ${others}
      </div>
    </div>
  </div>`,
    }));
  }

  // index
  const path = '/printable-flashcards/hebrew/';
  const steps = PRINT_STEPS_HE('הנושא שבחרתם');
  const faq = [
    { q: 'כמה כרטיסיות באנגלית יש להדפסה?', a: `${total} כרטיסיות ב-${sets.length} נושאים, כולן בחינם. בכל כרטיסייה תמונה אמיתית, המילה באנגלית והתרגום לעברית.` },
    { q: 'לאיזה גיל הכרטיסיות מתאימות?', a: 'לילדים בגילאי 6–12 שלומדים אנגלית: לתרגול בבית, בכיתה ובחוג. מתחילים בנושאים מוכרים — חיות, צבעים, אוכל — ומוסיפים בהדרגה.' },
    { q: 'אפשר להדפיס רשימת מילים משלי?', a: 'כן: ביוצר הכרטיסיות החינמי (/tools/flashcard-maker/) בוחרים מילים ומדפיסים כרטיסיות דו-צדדיות.' },
  ];
  const answer = `כרטיסיות באנגלית להדפסה לילדים, בחינם: ${total} כרטיסיות ב-${sets.length} נושאים, בכל אחת תמונה אמיתית, המילה באנגלית והתרגום לעברית. בוחרים נושא, מדפיסים וגוזרים.`;
  const grid = sets.map((c) => `
      <a href="/printable-flashcards/${c.slug}/hebrew/" class="cat-card">
        <img src="/images/${c.words[0].id}.webp" alt="" width="56" height="56" loading="lazy" />
        <div><strong>${escapeHtml(c.he)}</strong><span>${c.words.length} כרטיסיות &middot; <span lang="en" dir="ltr">${escapeHtml(c.en)}</span></span></div>
      </a>`).join('');
  const dir = join(flashcardsDir, 'hebrew');
  mkdirSync(dir, { recursive: true });
  writePage(join(dir, 'index.html'), page({
    path,
    title: `כרטיסיות באנגלית להדפסה לילדים — ${total} כרטיסיות עם תמונות ותרגום לעברית, חינם`,
    description: `כרטיסיות באנגלית להדפסה בחינם: ${total} כרטיסיות ב-${sets.length} נושאים (חיות, צבעים, אוכל ועוד), עם תמונה אמיתית ותרגום לעברית. בלי הרשמה.`,
    en: `${SITE}/printable-flashcards/`, es: `${SITE}/printable-flashcards/spanish/`,
    schemas: [
      crumbs([['Children Do English', '/'], ['כרטיסיות להדפסה', path]]),
      howToSchemaFor({ lang: 'he', name: 'איך מדפיסים כרטיסיות באנגלית לילדים', description: answer, steps: [{ name: 'בוחרים נושא', text: `בוחרים אחד מ-${sets.length} הנושאים למטה.` }, ...steps.slice(1)], supplies: ['נייר או בריסטול A4'], tools: ['מדפסת', 'מספריים'] }),
      faqSchemaFor(faq),
    ],
    body: `  <div class="header">
    <h1>כרטיסיות באנגלית להדפסה לילדים</h1>
    <p>${total} כרטיסיות עם תמונות ותרגום לעברית &middot; ${sets.length} נושאים &middot; חינם</p>
  </div>
  <div class="container" style="padding-top:1.25rem">
    <p class="intro answer-first">${escapeHtml(answer)}</p>
    <div class="cat-grid">${grid}
    </div>
    ${faqHtml(faq)}
    <div class="cta no-print"><a href="/new-player?lang=he&utm_source=seo&utm_medium=cta&utm_content=flashcard_index_he">תרגול באנגלית בחינם, בעברית ←</a></div>
  </div>`,
  }));
  return sets.length + 1;
}
