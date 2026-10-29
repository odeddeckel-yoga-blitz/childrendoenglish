// Textbook-unit pages: /units/ hub → /units/<book>/ → /units/<book>/unit-<n>/.
// Hebrew body, answer-first: the unit's word table (English · Hebrew · audio ·
// photo when CDE has a vetted one), practice that works for any word (hear →
// pick the Hebrew meaning; spell what you hear), printable flashcards, plain
// Classroom/Teams share links, FAQPage + breadcrumbs, a not-affiliated footer.
// Data: src/data/units.js. Practice runtime: public/unit-practice.js (CSP-safe).
//
// A unit marked test: true (or any unit of a test book) is built for checking
// the template but is noindex,nofollow, left out of the sitemap, and a hub or
// book index with no live units is noindex too. Nothing links into /units/
// until the /he/ head-term test ends (~Nov 14) — keep it that way.
import { existsSync } from 'fs';
import { join } from 'path';
import { mkdirSync } from 'fs';

const audioKey = (en) => en.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-');
// Deterministic so a rebuild doesn't reshuffle every page's options.
const hashOf = (s) => [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);

export function buildUnitPages({ SITE, distDir, publicDir, writePage, escapeHtml, WORDS, collides, BOOKS, UNITS }) {
  const byId = new Map(WORDS.map((w) => [w.id, w]));
  const isTest = (u) => !!(u.test || BOOKS[u.book]?.test);

  // --- validate the data before writing anything ---
  for (const u of UNITS) {
    const where = `units.js ${u.book} unit ${u.unit}`;
    if (!BOOKS[u.book]) throw new Error(`${where}: unknown book '${u.book}'`);
    if (!Number.isInteger(u.unit) || u.unit < 1) throw new Error(`${where}: unit must be a positive integer`);
    if (!Array.isArray(u.words) || u.words.length < 4) throw new Error(`${where}: needs at least 4 words`);
    // Every live list must be re-checkable against the public source it came from.
    if (!isTest(u) && !/^https:\/\/\S+$/.test(u.source || '')) throw new Error(`${where}: needs source (the public word-list URL)`);
    const seen = new Set();
    for (const w of u.words) {
      if (!w.en?.trim() || !w.he?.trim()) throw new Error(`${where}: every word needs en + he (${JSON.stringify(w)})`);
      if (seen.has(w.en.toLowerCase())) throw new Error(`${where}: duplicate word '${w.en}'`);
      seen.add(w.en.toLowerCase());
      if (w.ex !== undefined && !(typeof w.ex === 'string' && w.ex.trim())) throw new Error(`${where}: ex must be a non-empty sentence (${w.en})`);
      if (w.wordId && !byId.has(w.wordId)) throw new Error(`${where}: wordId '${w.wordId}' is not in words.js`);
      if (!existsSync(join(publicDir, 'audio', `${audioKey(w.en)}.mp3`))) {
        throw new Error(`${where}: no audio for '${w.en}' — render public/audio/${audioKey(w.en)}.mp3 (Piper + whisper check) first`);
      }
    }
  }

  // Unit words as word-like objects so collides() (same English, same/prefix
  // Hebrew gloss, CONFUSABLE_PAIRS) guards the options exactly as in the app.
  const asWord = (w) => (w.wordId ? byId.get(w.wordId) : { id: `u-${audioKey(w.en)}`, word: w.en, hebrewTranslation: w.he });

  function hebrewOptions(w, unitWords) {
    const target = asWord(w);
    const picked = [];
    const take = (pool) => {
      const sorted = [...pool].sort((a, b) => hashOf(w.en + a.he) - hashOf(w.en + b.he));
      for (const c of sorted) {
        if (picked.length >= 3) return;
        if (c.he === w.he || picked.some((p) => p.he === c.he)) continue;
        if (collides(target, asWord(c))) continue;
        picked.push(c);
      }
    };
    take(unitWords.filter((c) => c !== w));
    // Small unit: top up from CDE beginner words in the same category as the target
    if (picked.length < 3) {
      const cat = target.category;
      take(WORDS.filter((x) => x.level === 'beginner' && (!cat || x.category === cat)).map((x) => ({ en: x.word, he: x.hebrewTranslation, wordId: x.id })));
    }
    if (picked.length < 3) take(WORDS.map((x) => ({ en: x.word, he: x.hebrewTranslation, wordId: x.id })));
    const opts = [w.he, ...picked.map((p) => p.he)];
    const rot = hashOf(w.en) % opts.length;
    return { opts: opts.slice(rot).concat(opts.slice(0, rot)), ans: (opts.length - rot) % opts.length };
  }

  const robots = (test) => (test ? 'noindex, nofollow' : 'index, follow');
  const publishers = [...new Set(Object.values(BOOKS).map((b) => b.publisher).filter(Boolean))].join(' / ');
  const sitemapUrls = [];

  const shell = ({ path, title, description, test, schemas, body }) => `<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}" />
  <meta name="robots" content="${robots(test)}" />
  <link rel="canonical" href="${SITE}${path}" />
  <link rel="icon" type="image/png" href="/favicon.png" />
  <meta property="og:locale" content="he_IL" />
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="Children Do English" />
  <meta property="og:url" content="${SITE}${path}" />
  <meta property="og:title" content="${escapeHtml(title)}" />
  <meta property="og:description" content="${escapeHtml(description)}" />
  <meta property="og:image" content="${SITE}/og-image.png" />
${schemas.map((s) => `  <script type="application/ld+json">${s}</script>`).join('\n')}
  <style>${UNIT_CSS}</style>
</head>
<body>
${body}
  <footer class="footer">
    &copy; ${new Date().getFullYear()} Children Do English &middot; <a href="/he/">עברית</a> &middot; <a href="/about/">אודות</a> &middot; <a href="/privacy">פרטיות</a>
    <p class="not-affiliated">האתר אינו קשור להוצאת ${escapeHtml(publishers)} ואינו מטעמה. רשימות המילים משמשות לתרגול בלבד; תרגילים, קטעי קריאה ומבחנים מהספר אינם מועתקים לכאן.</p>
  </footer>
</body>
</html>`;

  const crumbs = (items) => JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map(([name, path], i) => ({ '@type': 'ListItem', position: i + 1, name, item: `${SITE}${path}` })),
  });
  const faq = (pairs) => JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: pairs.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })),
  });

  // --- unit pages ---
  const books = Object.keys(BOOKS);
  const liveUnitsOf = (b) => UNITS.filter((u) => u.book === b && !isTest(u));
  for (const u of UNITS) {
    const book = BOOKS[u.book];
    const test = isTest(u);
    const path = `/units/${u.book}/unit-${u.unit}/`;
    const unitName = `${book.name} Unit ${u.unit}`;
    const fullName = u.title ? `${unitName}: ${u.title}` : unitName;
    const title = `${fullName} – מילים באנגלית עם הגייה, תרגום ומשחקים`;
    const sample = u.words.slice(0, 6).map((w) => w.en).join(', ');
    const description = `כל ${u.words.length} המילים של ${unitName}: הגייה באנגלית, תרגום לעברית ומשחקי תרגול — ${sample}… חינם, בלי הרשמה.`;
    const items = u.words.map((w) => {
      const base = byId.get(w.wordId);
      return { en: w.en, he: w.he, ex: w.ex || null, id: w.wordId || null, audio: `/audio/${audioKey(w.en)}.mp3`, img: base?.imageUrl || null, ...hebrewOptions(w, u.words) };
    });
    const rows = items.map((it) => `
          <tr>
            <td class="col-img">${it.img ? `<img src="${it.img}" alt="${escapeHtml(it.en)}" width="56" height="56" loading="lazy" />` : ''}</td>
            <td class="col-en" lang="en" dir="ltr">${escapeHtml(it.en)}${it.ex ? `<span class="ex">${escapeHtml(it.ex)}</span>` : ''}</td>
            <td class="col-say"><button type="button" class="say" data-say="${it.audio}" aria-label="השמעה: ${escapeHtml(it.en)}">🔊</button></td>
            <td class="col-he">${escapeHtml(it.he)}</td>
          </tr>`).join('');
    const cards = items.map((it) => `
        <div class="fc">
          ${it.img ? `<img src="${it.img}" alt="" width="120" height="120" loading="lazy" />` : '<div class="fc-noimg" aria-hidden="true">🔤</div>'}
          <div class="fc-en" lang="en" dir="ltr">${escapeHtml(it.en)}</div>
          <div class="fc-he">${escapeHtml(it.he)}</div>
        </div>`).join('');
    const pageUrl = encodeURIComponent(`${SITE}${path}`);
    const shareText = encodeURIComponent(`${unitName} — מילים באנגלית עם הגייה ותרגול`);
    const faqPairs = [
      [`אילו מילים יש ב-${unitName}?`, `ב-${unitName} יש ${u.words.length} מילים, למשל: ${u.words.slice(0, 8).map((w) => `${w.en} (${w.he})`).join(', ')}. הרשימה המלאה עם הגייה ותרגום נמצאת בטבלה בעמוד.`],
      ['איך מתרגלים את המילים?', 'לוחצים על 🔊 כדי לשמוע כל מילה, ואז משחקים בשני תרגולים: "שומעים ובוחרים" — שומעים מילה באנגלית ובוחרים את הפירוש בעברית, ו"כותבים מה ששומעים" — מאייתים את המילה. אפשר גם להדפיס כרטיסיות.'],
      ['האם זה בחינם?', 'כן. בלי הרשמה, בלי פרסומות ובלי להוריד אפליקציה — עובד בדפדפן במחשב, בטאבלט ובטלפון.'],
      [`האם האתר קשור להוצאת ${book.publisher}?`, `לא. Children Do English אינו קשור להוצאה. אנחנו מציגים רק את רשימת המילים לתרגול, בלי תרגילים, קטעים או מבחנים מהספר.`],
    ];
    const body = `
  <nav class="breadcrumb" aria-label="breadcrumb"><a href="/he/">עברית</a> › <a href="/units/">יחידות לימוד</a> › <a href="/units/${u.book}/">${escapeHtml(book.name)}</a> › Unit ${u.unit}</nav>
  <header class="hero">
    <h1><span lang="en" dir="ltr">${escapeHtml(fullName)}</span> – מילים באנגלית עם הגייה, תרגום ומשחקים</h1>
    <p class="answer">כל ${u.words.length} המילים של היחידה עם הגייה באנגלית ותרגום לעברית${u.grade ? ` (כיתה ${escapeHtml(u.grade)})` : ''}. לוחצים 🔊 כדי לשמוע, ואז מתרגלים למטה.</p>
  </header>
  <main class="container">
    <section class="section" aria-labelledby="words-h">
      <h2 id="words-h" class="section-title">המילים של היחידה</h2>
      <table class="words">
        <thead><tr><th scope="col"><span class="sr">תמונה</span></th><th scope="col">English</th><th scope="col"><span class="sr">השמעה</span></th><th scope="col">עברית</th></tr></thead>
        <tbody>${rows}
        </tbody>
      </table>
      ${u.source ? `<p class="aligned">הרשימה תואמת לרשימת המילים של <span lang="en" dir="ltr">${escapeHtml(unitName)}</span>. התרגום לעברית, משפטי הדוגמה, ההקלטות והתמונות הם של Children Do English.</p>` : ''}
    </section>
    <section class="section" aria-labelledby="practice-h">
      <h2 id="practice-h" class="section-title">תרגול</h2>
      <div class="modes" role="group" aria-label="סוג תרגול">
        <button type="button" class="mode on" data-mode="hear" aria-pressed="true">🎧 שומעים ובוחרים</button>
        <button type="button" class="mode" data-mode="spell" aria-pressed="false">✏️ כותבים מה ששומעים</button>
      </div>
      <div id="practice" class="practice" data-unit="${u.book}-${u.unit}">
        <noscript><p>התרגול צריך JavaScript. אפשר בינתיים ללמוד מהטבלה ומהכרטיסיות.</p></noscript>
      </div>
      <p id="practice-live" class="sr" aria-live="polite"></p>
      <script type="application/json" id="unit-data">${JSON.stringify(items.map(({ en, id, audio, opts, ans }) => ({ en, id, audio, opts, ans }))).replace(/</g, '\\u003c')}</script>
    </section>
    <section class="section" aria-labelledby="cards-h">
      <h2 id="cards-h" class="section-title">כרטיסיות להדפסה</h2>
      <p class="center"><button type="button" class="print-btn" data-print>🖨️ הדפסת הכרטיסיות</button></p>
      <div class="cards">${cards}
      </div>
    </section>
    <section class="section share" aria-labelledby="share-h">
      <h2 id="share-h" class="section-title">שיתוף עם הכיתה</h2>
      <p class="center">
        <a class="share-btn" href="https://classroom.google.com/share?url=${pageUrl}" target="_blank" rel="noopener">שיתוף ב-Google Classroom</a>
        <a class="share-btn" href="https://teams.microsoft.com/share?href=${pageUrl}&amp;msgText=${shareText}" target="_blank" rel="noopener">שיתוף ב-Teams</a>
      </p>
    </section>
    <section class="section" aria-labelledby="faq-h">
      <h2 id="faq-h" class="section-title">שאלות נפוצות</h2>
      <div class="faq">${faqPairs.map(([q, a]) => `
        <div class="faq-item"><h3>${escapeHtml(q)}</h3><p>${escapeHtml(a)}</p></div>`).join('')}
      </div>
    </section>
    <p class="center more"><a class="cta" href="/?lang=he&amp;utm_source=seo&amp;utm_medium=unit&amp;utm_content=${u.book}-${u.unit}">עוד מילים ומשחקים באפליקציה ←</a></p>
  </main>
  <script defer src="/unit-practice.js"></script>
  <script defer src="/print-btn.js"></script>`;
    const dir = join(distDir, 'units', u.book, `unit-${u.unit}`);
    mkdirSync(dir, { recursive: true });
    writePage(join(dir, 'index.html'), shell({
      path, title, description, test,
      schemas: [crumbs([['עברית', '/he/'], ['יחידות לימוד', '/units/'], [book.name, `/units/${u.book}/`], [`Unit ${u.unit}`, path]]), faq(faqPairs)],
      body,
    }));
    if (!test) sitemapUrls.push(path);
  }

  // --- book indexes ---
  for (const b of books) {
    const units = UNITS.filter((u) => u.book === b).sort((a, c) => a.unit - c.unit);
    if (!units.length) continue;
    const book = BOOKS[b];
    const test = liveUnitsOf(b).length === 0;
    const path = `/units/${b}/`;
    const title = `${book.name} – מילים באנגלית לכל יחידה, עם הגייה ותרגום`;
    const description = `רשימות המילים של ${book.name} לפי יחידות, עם הגייה באנגלית, תרגום לעברית ומשחקי תרגול. חינם, בלי הרשמה.`;
    const list = units.map((u) => `
        <a class="unit-card" href="/units/${b}/unit-${u.unit}/"><strong lang="en" dir="ltr">Unit ${u.unit}${u.title ? `: ${escapeHtml(u.title)}` : ''}</strong><span>${u.words.length} מילים · ${escapeHtml(u.words.slice(0, 4).map((w) => w.en).join(', '))}…</span></a>`).join('');
    const dir = join(distDir, 'units', b);
    mkdirSync(dir, { recursive: true });
    writePage(join(dir, 'index.html'), shell({
      path, title, description, test,
      schemas: [crumbs([['עברית', '/he/'], ['יחידות לימוד', '/units/'], [book.name, path]])],
      body: `
  <nav class="breadcrumb" aria-label="breadcrumb"><a href="/he/">עברית</a> › <a href="/units/">יחידות לימוד</a> › ${escapeHtml(book.name)}</nav>
  <header class="hero"><h1><span lang="en" dir="ltr">${escapeHtml(book.name)}</span> – מילים באנגלית לכל יחידה</h1>
    <p class="answer">בחרו יחידה כדי לשמוע את המילים, לראות את התרגום ולתרגל.</p></header>
  <main class="container"><section class="section"><div class="unit-grid">${list}
  </div></section></main>`,
    }));
    if (!test) sitemapUrls.push(path);
  }

  // --- hub ---
  {
    const withUnits = books.filter((b) => UNITS.some((u) => u.book === b));
    const test = !withUnits.some((b) => liveUnitsOf(b).length);
    const path = '/units/';
    const dir = join(distDir, 'units');
    mkdirSync(dir, { recursive: true });
    writePage(join(dir, 'index.html'), shell({
      path, test,
      title: 'יחידות לימוד באנגלית – מילים עם הגייה, תרגום ומשחקים',
      description: 'רשימות מילים באנגלית לפי ספר ויחידה, עם הגייה, תרגום לעברית, משחקי תרגול וכרטיסיות להדפסה. חינם, בלי הרשמה.',
      schemas: [crumbs([['עברית', '/he/'], ['יחידות לימוד', path]])],
      body: `
  <nav class="breadcrumb" aria-label="breadcrumb"><a href="/he/">עברית</a> › יחידות לימוד</nav>
  <header class="hero"><h1>יחידות לימוד באנגלית</h1><p class="answer">בחרו ספר ויחידה: כל המילים עם הגייה, תרגום לעברית ותרגול.</p></header>
  <main class="container"><section class="section"><div class="unit-grid">${withUnits.map((b) => `
        <a class="unit-card" href="/units/${b}/"><strong lang="en" dir="ltr">${escapeHtml(BOOKS[b].name)}</strong><span>${UNITS.filter((u) => u.book === b).length} יחידות</span></a>`).join('')}
  </div></section></main>`,
    }));
    if (!test) sitemapUrls.push(path);
  }

  return sitemapUrls;
}

const UNIT_CSS = `
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: system-ui, -apple-system, 'Segoe UI', sans-serif; background: #eff6ff; color: #1e293b; line-height: 1.7; direction: rtl; text-align: right; }
    a { color: #2563eb; }
    .sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
    .breadcrumb { padding: 0.75rem 1rem; font-size: 0.85rem; color: #64748b; max-width: 960px; margin: 0 auto; }
    .hero { background: linear-gradient(135deg, #1e40af 0%, #2563eb 50%, #3b82f6 100%); color: #fff; padding: 2rem 1rem 1.75rem; text-align: center; }
    .hero h1 { font-size: 1.6rem; font-weight: 900; line-height: 1.35; margin-bottom: 0.5rem; }
    .hero .answer { max-width: 600px; margin: 0 auto; opacity: 0.95; }
    .container { max-width: 960px; margin: 0 auto; padding: 0 1rem; }
    .section { padding: 1.75rem 0; }
    .section-title { font-size: 1.3rem; font-weight: 800; text-align: center; margin-bottom: 1rem; }
    .center { text-align: center; }
    table.words { width: 100%; border-collapse: collapse; background: #fff; border-radius: 0.75rem; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
    .words th, .words td { padding: 0.5rem 0.6rem; border-bottom: 1px solid #e2e8f0; vertical-align: middle; }
    .words th { background: #f8fafc; font-size: 0.85rem; color: #475569; }
    .col-img { width: 64px; } .col-img img { border-radius: 0.5rem; object-fit: cover; display: block; }
    .col-en { font-weight: 800; font-size: 1.1rem; text-align: left; }
    .col-en .ex { display: block; font-weight: 400; font-size: 0.85rem; color: #475569; }
    .aligned { font-size: 0.85rem; color: #475569; margin-top: 0.6rem; text-align: center; }
    .col-say { width: 52px; text-align: center; }
    .say { font-size: 1.3rem; background: #eef2ff; border: 0; border-radius: 50%; width: 44px; height: 44px; cursor: pointer; }
    .say:focus-visible, .mode:focus-visible, .opt:focus-visible, .print-btn:focus-visible { outline: 3px solid #f59e0b; outline-offset: 2px; }
    .modes { display: flex; gap: 0.5rem; justify-content: center; flex-wrap: wrap; margin-bottom: 1rem; }
    .mode { padding: 0.6rem 1rem; border-radius: 2rem; border: 2px solid #2563eb; background: #fff; color: #2563eb; font-weight: 700; font-size: 1rem; cursor: pointer; min-height: 44px; }
    .mode.on { background: #2563eb; color: #fff; }
    .practice { background: #fff; border-radius: 0.9rem; padding: 1.25rem; box-shadow: 0 1px 3px rgba(0,0,0,0.08); max-width: 560px; margin: 0 auto; text-align: center; }
    .practice .big-say { font-size: 2rem; width: 72px; height: 72px; border-radius: 50%; border: 0; background: linear-gradient(135deg, #8b5cf6, #6366f1); color: #fff; cursor: pointer; margin-bottom: 0.75rem; }
    .opts { display: grid; grid-template-columns: 1fr 1fr; gap: 0.6rem; }
    .opt { min-height: 56px; font-size: 1.1rem; font-weight: 700; border-radius: 0.75rem; border: 2px solid #cbd5e1; background: #f8fafc; cursor: pointer; }
    .opt.ok { border-color: #16a34a; background: #dcfce7; } .opt.no { border-color: #dc2626; background: #fee2e2; }
    .spell input { font-size: 1.3rem; padding: 0.55rem 0.75rem; border: 2px solid #cbd5e1; border-radius: 0.6rem; width: 100%; max-width: 280px; text-align: center; direction: ltr; }
    .spell button[type=submit] { margin-top: 0.6rem; min-height: 44px; padding: 0 1.4rem; border: 0; border-radius: 0.6rem; background: #2563eb; color: #fff; font-weight: 700; font-size: 1rem; cursor: pointer; }
    .feedback { min-height: 1.6rem; margin-top: 0.7rem; font-weight: 700; }
    .progress { font-size: 0.85rem; color: #64748b; margin-bottom: 0.5rem; }
    .next { margin-top: 0.75rem; min-height: 44px; padding: 0 1.4rem; border-radius: 0.6rem; border: 2px solid #2563eb; background: #fff; color: #2563eb; font-weight: 700; cursor: pointer; }
    .cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 0.75rem; }
    .fc { background: #fff; border: 2px dashed #cbd5e1; border-radius: 0.75rem; padding: 0.75rem; text-align: center; }
    .fc img { border-radius: 0.5rem; object-fit: cover; }
    .fc-noimg { font-size: 2.5rem; height: 120px; display: flex; align-items: center; justify-content: center; }
    .fc-en { font-weight: 800; font-size: 1.15rem; } .fc-he { color: #475569; }
    .print-btn, .share-btn, .cta { display: inline-block; margin: 0.25rem; padding: 0.6rem 1.2rem; border-radius: 0.6rem; font-weight: 700; text-decoration: none; min-height: 44px; }
    .print-btn { border: 0; background: #0d9488; color: #fff; font-size: 1rem; cursor: pointer; }
    .share-btn { background: #fff; color: #2563eb; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .cta { background: #2563eb; color: #fff; }
    .faq { max-width: 700px; margin: 0 auto; }
    .faq-item { background: #fff; border-radius: 0.75rem; padding: 1rem 1.2rem; margin-bottom: 0.6rem; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
    .faq-item h3 { font-size: 1rem; margin-bottom: 0.3rem; } .faq-item p { color: #475569; font-size: 0.92rem; }
    .unit-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 0.75rem; }
    .unit-card { display: block; background: #fff; border-radius: 0.75rem; padding: 1rem 1.2rem; box-shadow: 0 1px 3px rgba(0,0,0,0.08); text-decoration: none; color: inherit; }
    .unit-card strong { display: block; color: #2563eb; font-size: 1.1rem; } .unit-card span { font-size: 0.85rem; color: #475569; }
    .more { padding-bottom: 2rem; }
    .footer { text-align: center; padding: 1.5rem 1rem; color: #64748b; font-size: 0.8rem; background: #f8fafc; }
    .footer a { color: #64748b; } .not-affiliated { max-width: 640px; margin: 0.5rem auto 0; }
    @media (max-width: 420px) { .hero h1 { font-size: 1.35rem; } .opts { grid-template-columns: 1fr; } }
    @media print {
      body { background: #fff; }
      .breadcrumb, .hero, .section:not(:has(.cards)), .more, .footer, .crawl-mesh, .print-btn, #cards-h { display: none !important; }
      .cards { grid-template-columns: repeat(3, 1fr); }
      .fc { break-inside: avoid; border: 1px dashed #64748b; }
    }
`;
