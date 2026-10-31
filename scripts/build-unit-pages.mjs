// Textbook-unit pages: /units/ hub → /units/<book>/ → /units/<book>/unit-<n>/.
// Hebrew body, answer-first: the unit's word table (English · Hebrew · audio ·
// photo when CDE has a vetted one), practice that works for any word (hear →
// pick the Hebrew meaning; spell what you hear; dictation), printable
// flashcards + bingo/word-search sheets, share links, FAQPage + breadcrumbs,
// a not-affiliated footer.
// Data: src/data/units.js. Practice runtime: public/unit-practice.js (CSP-safe).
// The page body is wordSetKit().setPage — also used by the Band I pages
// (scripts/build-band1-pages.mjs), so any word set gets the same tools.
//
// A unit marked test: true (or any unit of a test book) is built for checking
// the template but is noindex,nofollow, left out of the sitemap, and a hub or
// book index with no live units is noindex too. Nothing links into /units/
// until the /he/ head-term test ends (~Nov 14) — keep it that way.
import { printQrBlock } from './qr-svg.mjs';
import { existsSync } from 'fs';
import { join } from 'path';
import { mkdirSync } from 'fs';

export const audioKey = (en) => en.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-');
// Deterministic so a rebuild doesn't reshuffle every page's options.
const hashOf = (s) => [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);

// One Hebrew word-set page (table → practice → cards → sheets → share → FAQ).
// words: [{ en, he, wordId?, ex?, chip? }] — chip = { label, cls } shown by the word.
// Sentence modes (Band I sentence engine, roadmap step 4) need our own example
// sentences: at least 4 words whose sentence contains the word itself.
export const SENTENCE_MAX_WORDS = 9;
export function sentenceUsable(it) {
  if (!it.ex) return false;
  const words = it.ex.trim().split(/\s+/);
  const re = new RegExp(`\\b${it.en.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
  return words.length <= SENTENCE_MAX_WORDS && re.test(it.ex);
}
export function sentenceReady(items) { return items.filter(sentenceUsable).length >= 4; }

export function wordSetKit({ SITE, writePage, escapeHtml, WORDS, collides }) {
  const byId = new Map(WORDS.map((w) => [w.id, w]));
  // Set words as word-like objects so collides() (same English, same/prefix
  // Hebrew gloss, CONFUSABLE_PAIRS) guards the options exactly as in the app.
  const asWord = (w) => (w.wordId ? byId.get(w.wordId) : { id: `u-${audioKey(w.en)}`, word: w.en, hebrewTranslation: w.he });

  function hebrewOptions(w, setWords) {
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
    take(setWords.filter((c) => c !== w));
    // Small set: top up from CDE beginner words in the same category as the target
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
  const shell = ({ path, title, description, test, schemas, body, footerNote }) => `<!DOCTYPE html>
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
    <span dir="ltr">&copy; ${new Date().getFullYear()} Children Do English</span> &middot; <a href="/he/">עברית</a> &middot; <a href="/about/">אודות</a> &middot; <a href="/privacy">פרטיות</a>
    ${footerNote ? `<p class="not-affiliated">${escapeHtml(footerNote)}</p>` : ''}
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

  // navHtml/h1Html are trusted builder HTML; everything else is escaped here.
  // battleHref → a one-click Class Battle with these words (units with enough photos).
  // step → a set on the Band I review path: finishing a round ticks it off on this device.
  // pin → "this week in class" (RC12): the unit name; the button saves the page on this
  // device and the app's home then opens with a one-tap card to it.
  function setPage({ dir, path, title, description, test, crumbItems, navHtml, h1Html, answer, listHeading, words, afterTable = '', practiceKey, faqPairs, sheetsName, shareTitle, ctaUtm, footerNote, battleHref = null, step = null, pin = null, afterPractice = '' }) {
    const items = words.map((w) => {
      const base = byId.get(w.wordId);
      return { en: w.en, he: w.he, ex: w.ex || null, chip: w.chip || null, id: w.wordId || null, audio: `/audio/${audioKey(w.en)}.mp3`, img: base?.imageUrl || null, ...hebrewOptions(w, words) };
    });
    const rows = items.map((it) => `
          <tr>
            <td class="col-img">${it.img ? `<img src="${it.img}" alt="${escapeHtml(it.en)}" width="56" height="56" loading="lazy" />` : ''}</td>
            <td class="col-en" lang="en" dir="ltr">${escapeHtml(it.en)}${it.chip ? ` <span class="chip ${it.chip.cls}" lang="he" dir="rtl">${escapeHtml(it.chip.label)}</span>` : ''}${it.ex ? `<span class="ex">${escapeHtml(it.ex)}</span>` : ''}</td>
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
    const shareText = encodeURIComponent(shareTitle);
    const body = `
  <nav class="breadcrumb" aria-label="breadcrumb">${navHtml}</nav>
  <header class="hero">
    <h1>${h1Html}</h1>
    <p class="answer">${escapeHtml(answer)}</p>
    <p class="jump-row"><a class="jump-btn" href="#practice-h">▶ תרגול</a></p>
    ${pin ? `<p class="pin-row"><button type="button" class="pin-btn" data-pin-unit="${path}" data-pin-name="${escapeHtml(pin)}" aria-pressed="false">📌 זו היחידה שלנו השבוע</button></p>
    <p class="pin-hint" hidden>נשמר במכשיר הזה: האפליקציה תיפתח עם כרטיס ליחידה הזו.</p>` : ''}
  </header>
  <main class="container">
    <section class="section" aria-labelledby="words-h">
      <h2 id="words-h" class="section-title">${escapeHtml(listHeading)}</h2>
      <table class="words">
        <thead><tr><th scope="col"><span class="sr">תמונה</span></th><th scope="col">English</th><th scope="col"><span class="sr">השמעה</span></th><th scope="col">עברית</th></tr></thead>
        <tbody>${rows}
        </tbody>
      </table>
      ${afterTable}
    </section>
    <section class="section" aria-labelledby="practice-h">
      <h2 id="practice-h" class="section-title">תרגול</h2>
      <div class="modes" role="group" aria-label="סוג תרגול">
        <button type="button" class="mode on" data-mode="hear" aria-pressed="true">🎧 שומעים ובוחרים</button>
        <button type="button" class="mode" data-mode="spell" aria-pressed="false">✏️ כותבים מה ששומעים</button>
        <button type="button" class="mode" data-mode="dict" aria-pressed="false">📝 הכתבה</button>${sentenceReady(items) ? `
        <button type="button" class="mode" data-mode="gap" aria-pressed="false">🔎 משלימים משפט</button>
        <button type="button" class="mode" data-mode="build" aria-pressed="false">🧩 בונים משפט</button>` : ''}
      </div>
      <div id="practice" class="practice" data-unit="${practiceKey}"${step ? ` data-step="${step}"` : ''}>
        <noscript><p>התרגול צריך JavaScript. אפשר בינתיים ללמוד מהטבלה ומהכרטיסיות.</p></noscript>
      </div>
      <p id="practice-live" class="sr" aria-live="polite"></p>
      <script type="application/json" id="unit-data">${JSON.stringify(items.map(({ en, he, ex, id, audio, opts, ans }) => ({ en, he, ex, id, audio, opts, ans }))).replace(/</g, '\\u003c')}</script>
    </section>
    ${afterPractice}
    <section class="section" aria-labelledby="cards-h">
      <h2 id="cards-h" class="section-title">כרטיסיות להדפסה</h2>
      <p class="center"><button type="button" class="print-btn" data-print>🖨️ הדפסת הכרטיסיות</button></p>
      ${printQrBlock(`${SITE}${path}`, 'סרקו כדי לשמוע את המילים ולתרגל באתר — חינם, בלי הרשמה', 'rtl')}
      <div class="cards">${cards}
      </div>
    </section>
    <section class="section no-print" aria-labelledby="sheets-h">
      <h2 id="sheets-h" class="section-title">דפי פעילות לכיתה</h2>
      <p class="center sheet-row">
        <label for="bingo-n">בינגו:</label>
        <select id="bingo-n">${[10, 20, 30, 40].map((n) => `<option value="${n}"${n === 30 ? ' selected' : ''}>${n} כרטיסים</option>`).join('')}</select>
        <button type="button" class="print-btn" data-sheet="bingo">🎲 הדפסת כרטיסי בינגו</button>
      </p>
      <p class="center sheet-row"><button type="button" class="print-btn" data-sheet="search">🔎 הדפסת תפזורת מילים (עם דף פתרון)</button></p>
      <p class="center sheet-hint">בכל הדפסה נוצרים כרטיסים ותפזורת חדשים מהמילים שבעמוד, כולל רשימת קריאה למורה.</p>
    </section>
    <section class="section share" aria-labelledby="share-h">
      <h2 id="share-h" class="section-title">שיתוף עם הכיתה</h2>
      ${battleHref ? `<p class="center"><a class="cta battle-cta" href="${battleHref}">⚔️ קרב כיתתי עם המילים של היחידה</a></p>
      <p class="center sheet-hint">המורה פותח/ת חדר על המקרן, והילדים מצטרפים מהטלפון או מהטאבלט עם קוד.</p>` : ''}
      <p class="center">
        <a class="share-btn" href="https://wa.me/?text=${shareText}%20${pageUrl}" target="_blank" rel="noopener">שליחה בוואטסאפ</a>
        <a class="share-btn" href="https://classroom.google.com/share?url=${pageUrl}" target="_blank" rel="noopener">שיתוף ב-Google Classroom</a>
        <a class="share-btn" href="https://teams.microsoft.com/share?href=${pageUrl}&amp;msgText=${shareText}" target="_blank" rel="noopener">שיתוף ב-Teams</a>
        <button type="button" class="share-btn" data-copy="${SITE}${path}">העתקת קישור</button>
        <button type="button" class="share-btn" data-copy-list>📋 העתקת הרשימה (אנגלית ⇥ עברית)</button>
      </p>
      <p class="center sheet-hint">"העתקת הרשימה" מעתיקה את המילים בשתי עמודות (אנגלית, עברית) — מדביקים ב-Google Sheets, ב-Excel, או ב-Quizlet ובכלים דומים דרך "ייבוא".</p>
    </section>
    <section class="section" aria-labelledby="faq-h">
      <h2 id="faq-h" class="section-title">שאלות נפוצות</h2>
      <div class="faq">${faqPairs.map(([q, a]) => `
        <div class="faq-item"><h3>${escapeHtml(q)}</h3><p>${escapeHtml(a)}</p></div>`).join('')}
      </div>
    </section>
    <p class="center more"><a class="cta" href="/new-player?lang=he&amp;utm_source=seo&amp;${ctaUtm}">עוד מילים ומשחקים באפליקציה ←</a></p>
  </main>
  <div id="sheets-out" data-name="${escapeHtml(sheetsName)}" aria-hidden="true"></div>
  <script defer src="/unit-practice.js"></script>
  <script defer src="/print-btn.js"></script>
  <script defer src="/unit-sheets.js"></script>`;
    mkdirSync(dir, { recursive: true });
    writePage(join(dir, 'index.html'), shell({ path, title, description, test, footerNote, schemas: [crumbs(crumbItems), faq(faqPairs)], body }));
  }

  return { byId, shell, crumbs, faq, setPage };
}

// chipFor(word) → optional { label, cls } shown by each word (the Band I level).
// battleUnitIds: Set of 'u-<book>-<unit>' ids that Class Battle can run (gen-battle-words.mjs).
export function buildUnitPages({ SITE, distDir, publicDir, writePage, escapeHtml, WORDS, collides, BOOKS, UNITS, chipFor = () => null, battleUnitIds = new Set() }) {
  const kit = wordSetKit({ SITE, writePage, escapeHtml, WORDS, collides });
  const { byId, crumbs } = kit;
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

  const publishers = [...new Set(Object.values(BOOKS).map((b) => b.publisher).filter(Boolean))].join(' / ');
  const footerNote = `האתר אינו קשור להוצאת ${publishers} ואינו מטעמה. רשימות המילים משמשות לתרגול בלבד; תרגילים, קטעי קריאה ומבחנים מהספר אינם מועתקים לכאן.`;
  const shell = (o) => kit.shell({ ...o, footerNote });
  const sitemapUrls = [];

  // --- unit pages ---
  const books = Object.keys(BOOKS);
  const liveUnitsOf = (b) => UNITS.filter((u) => u.book === b && !isTest(u));
  for (const u of UNITS) {
    const book = BOOKS[u.book];
    const test = isTest(u);
    const path = `/units/${u.book}/unit-${u.unit}/`;
    const unitName = `${book.name} Unit ${u.unit}`;
    const fullName = u.title ? `${unitName}: ${u.title}` : unitName;
    const sample = u.words.slice(0, 6).map((w) => w.en).join(', ');
    kit.setPage({
      dir: join(distDir, 'units', u.book, `unit-${u.unit}`), path, test, footerNote,
      title: `${fullName} – מילים באנגלית עם הגייה, תרגום ומשחקים`,
      description: `כל ${u.words.length} המילים של ${unitName}: הגייה באנגלית, תרגום לעברית ומשחקי תרגול — ${sample}… חינם, בלי הרשמה.`,
      crumbItems: [['עברית', '/he/'], ['יחידות לימוד', '/units/'], [book.name, `/units/${u.book}/`], [`Unit ${u.unit}`, path]],
      navHtml: `<a href="/he/">עברית</a> › <a href="/units/">יחידות לימוד</a> › <a href="/units/${u.book}/">${escapeHtml(book.name)}</a> › Unit ${u.unit}`,
      h1Html: `<span lang="en" dir="ltr">${escapeHtml(fullName)}</span> – מילים באנגלית עם הגייה, תרגום ומשחקים`,
      answer: `כל ${u.words.length} המילים של היחידה עם הגייה באנגלית ותרגום לעברית${u.grade ? ` (כיתה ${u.grade})` : ''}. לוחצים 🔊 כדי לשמוע, ואז מתרגלים למטה.`,
      listHeading: 'המילים של היחידה',
      words: u.words.map((w) => ({ ...w, chip: chipFor(w) })),
      afterTable: u.source ? `<p class="aligned">הרשימה תואמת לרשימת המילים של <span lang="en" dir="ltr">${escapeHtml(unitName)}</span>. התרגום לעברית, משפטי הדוגמה, ההשמעות והתמונות הם של <span lang="en" dir="ltr">Children Do English</span>.</p>` : '',
      practiceKey: `${u.book}-${u.unit}`,
      faqPairs: [
        [`אילו מילים יש ב-${unitName}?`, `ב-${unitName} יש ${u.words.length} מילים, למשל: ${u.words.slice(0, 8).map((w) => `${w.en} (${w.he})`).join(', ')}. הרשימה המלאה עם הגייה ותרגום נמצאת בטבלה בעמוד.`],
        ['איך מתרגלים את המילים?', 'לוחצים על 🔊 כדי לשמוע כל מילה, ואז בוחרים תרגול: "שומעים ובוחרים" — שומעים מילה באנגלית ובוחרים את הפירוש בעברית; "כותבים מה ששומעים" — מאייתים את המילה; ו"הכתבה" — 10 מילים בקול, כותבים במחברת ובודקים מול הרשימה. אפשר גם להדפיס כרטיסיות.'],
        ['האם זה בחינם?', 'כן. בלי הרשמה, בלי פרסומות ובלי להוריד אפליקציה — עובד בדפדפן במחשב, בטאבלט ובטלפון.'],
        [`האם האתר קשור להוצאת ${book.publisher}?`, `לא. Children Do English אינו קשור להוצאה. אנחנו מציגים רק את רשימת המילים לתרגול, בלי תרגילים, קטעים או מבחנים מהספר.`],
      ],
      sheetsName: unitName,
      shareTitle: `${unitName} — מילים באנגלית עם הגייה ותרגול`,
      ctaUtm: `utm_medium=unit&amp;utm_content=${u.book}-${u.unit}`,
      pin: unitName,
      battleHref: battleUnitIds.has(`u-${u.book}-${u.unit}`) ? `/battle/?unit=u-${u.book}-${u.unit}` : null,
    });
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
    // The hub lists only books with a live unit (a test book never shows publicly).
    const live = books.filter((b) => liveUnitsOf(b).length);
    const withUnits = live.length ? live : books.filter((b) => UNITS.some((u) => u.book === b));
    const test = !live.length;
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
  <main class="container"><section class="section">
  <p class="center week-unit" id="week-unit" hidden></p>
  <div class="unit-grid">${withUnits.map((b) => `
        <a class="unit-card" href="/units/${b}/"><strong lang="en" dir="ltr">${escapeHtml(BOOKS[b].name)}</strong><span>${(live.length ? liveUnitsOf(b) : UNITS.filter((u) => u.book === b)).length} יחידות</span></a>`).join('')}
  </div>
  <p class="center pin-hint">בעמוד של כל יחידה אפשר ללחוץ 📌 "זו היחידה שלנו השבוע", והאפליקציה תיפתח עם כרטיס אליה.</p></section></main>
  <script defer src="/unit-practice.js"></script>`,
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
    .jump-row { margin-top: 0.9rem; }
    .jump-btn { display: inline-block; background: #fff; color: #1e40af; font-weight: 900; font-size: 1.1rem; padding: 0.6rem 1.6rem; border-radius: 999px; text-decoration: none; box-shadow: 0 2px 8px rgba(0,0,0,.15); }
    .breadcrumb { padding: 0.75rem 1rem; font-size: 0.85rem; color: #4b5a6e; max-width: 960px; margin: 0 auto; }
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
    .chip { display: inline-block; font-size: 0.7rem; font-weight: 700; padding: 0.05rem 0.45rem; border-radius: 1rem; vertical-align: middle; margin: 0 0.3rem; white-space: nowrap; }
    .chip-pre { background: #e0f2fe; color: #075985; } .chip-c1 { background: #dcfce7; color: #166534; } .chip-c2 { background: #fef9c3; color: #854d0e; } .chip-extra { background: #f3e8ff; color: #6b21a8; }
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
    .sent { font-size: 1.25rem; font-weight: 700; line-height: 1.8; margin: 0.4rem 0 0.8rem; direction: ltr; unicode-bidi: isolate; }
    .sent .blank { display: inline-block; min-width: 4.5em; border-bottom: 3px solid #6366f1; color: #6366f1; }
    .sent mark { background: #dcfce7; color: inherit; padding: 0 0.15em; border-radius: 0.25rem; }
    .clue { color: #4b5a6e; margin-bottom: 0.3rem; }
    .built { min-height: 3.2rem; border: 2px dashed #cbd5e1; border-radius: 0.75rem; padding: 0.4rem; direction: ltr; display: flex; flex-wrap: wrap; gap: 0.4rem; justify-content: center; align-items: center; margin-bottom: 0.7rem; }
    .built span { font-weight: 700; font-size: 1.1rem; }
    .tiles { display: flex; flex-wrap: wrap; gap: 0.5rem; justify-content: center; direction: ltr; }
    .tile { min-height: 48px; min-width: 48px; padding: 0 0.9rem; font-size: 1.1rem; font-weight: 700; border-radius: 0.6rem; border: 2px solid #cbd5e1; background: #f8fafc; cursor: pointer; }
    .tile.no { border-color: #dc2626; background: #fee2e2; }
    .tile:focus-visible { outline: 3px solid #f59e0b; outline-offset: 2px; }
    .progress { font-size: 0.85rem; color: #4b5a6e; margin-bottom: 0.5rem; }
    .next { margin-top: 0.75rem; min-height: 44px; padding: 0 1.4rem; border-radius: 0.6rem; border: 2px solid #2563eb; background: #fff; color: #2563eb; font-weight: 700; cursor: pointer; }
    .cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 0.75rem; }
    .fc { background: #fff; border: 2px dashed #cbd5e1; border-radius: 0.75rem; padding: 0.75rem; text-align: center; }
    .fc img { border-radius: 0.5rem; object-fit: cover; }
    .fc-noimg { font-size: 2.5rem; height: 120px; display: flex; align-items: center; justify-content: center; }
    .fc-en { font-weight: 800; font-size: 1.15rem; } .fc-he { color: #475569; }
    .print-btn, .share-btn, .cta { display: inline-block; margin: 0.25rem; padding: 0.6rem 1.2rem; border-radius: 0.6rem; font-weight: 700; text-decoration: none; min-height: 44px; }
    .print-btn { border: 0; background: #0f766e; color: #fff; font-size: 1rem; cursor: pointer; }
    .share-btn { background: #fff; color: #2563eb; box-shadow: 0 1px 3px rgba(0,0,0,0.1); border: 0; font-size: 1rem; cursor: pointer; font-family: inherit; }
    .dict-hint { color: #475569; margin-bottom: 0.5rem; }
    .dict-list { text-align: left; direction: ltr; max-width: 320px; margin: 0.5rem auto; list-style: none; }
    .dict-list li { display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; padding: 0.2rem 0; }
    .dict-list label { display: flex; align-items: center; gap: 0.5rem; font-weight: 700; font-size: 1.1rem; cursor: pointer; }
    .dict-list input { width: 22px; height: 22px; }
    .dict-n { color: #4b5a6e; font-weight: 400; min-width: 1.6rem; }
    .cta { background: #2563eb; color: #fff; }
    .faq { max-width: 700px; margin: 0 auto; }
    .faq-item { background: #fff; border-radius: 0.75rem; padding: 1rem 1.2rem; margin-bottom: 0.6rem; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
    .faq-item h3 { font-size: 1rem; margin-bottom: 0.3rem; } .faq-item p { color: #475569; font-size: 0.92rem; }
    .unit-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 0.75rem; }
    .unit-card { display: block; background: #fff; border-radius: 0.75rem; padding: 1rem 1.2rem; box-shadow: 0 1px 3px rgba(0,0,0,0.08); text-decoration: none; color: inherit; }
    .unit-card strong { display: block; color: #2563eb; font-size: 1.1rem; } .unit-card span { font-size: 0.85rem; color: #475569; }
    .pin-row { margin-top: 0.75rem; } .pin-btn { font: inherit; font-weight: 700; padding: 0.5rem 1rem; min-height: 44px; border-radius: 999px; border: 2px solid #fff; background: transparent; color: #fff; cursor: pointer; } .pin-btn[aria-pressed="true"] { background: #fff; color: #1d4ed8; } .hero .pin-hint { font-size: 0.9rem; margin-top: 0.4rem; }
    .week-unit a { font-weight: 700; }
    .step-card .step-done { display: none; } .step-card.done .step-done { display: inline; font-size: 1.1rem; color: #15803d; } .step-card.done { box-shadow: inset 0 0 0 2px #15803d; }
    .more { padding-bottom: 2rem; }
    .footer { text-align: center; padding: 1.5rem 1rem; color: #4b5a6e; font-size: 0.8rem; background: #f8fafc; }
    .footer a { color: #4b5a6e; } .not-affiliated { max-width: 640px; margin: 0.5rem auto 0; }
    @media (max-width: 420px) { .hero h1 { font-size: 1.35rem; } .opts { grid-template-columns: 1fr; } }
    #sheets-out { display: none; }
    .sheet-row { margin-bottom: 0.4rem; } .sheet-row select { font-size: 1rem; padding: 0.35rem; border-radius: 0.4rem; margin: 0 0.25rem; font-family: inherit; }
    .sheet-hint { font-size: 0.85rem; color: #475569; }
    @media print {
      body.printing-sheets > *:not(#sheets-out) { display: none !important; }
      body.printing-sheets #sheets-out { display: block; direction: ltr; text-align: left; }
      .sheet-page { break-after: page; padding: 0.5cm 0; } .sheet-page:last-child { break-after: auto; }
      .sheet-head { font-size: 16pt; font-weight: 800; text-align: center; margin-bottom: 0.4cm; }
      .sheet-head:empty { display: none; }
      .sheet-note { direction: rtl; text-align: center; font-size: 11pt; margin: 0.3cm 0; }
      .bingo-card { border: 2px solid #000; border-radius: 8px; padding: 0.4cm; margin: 0 auto 0.8cm; width: 15cm; break-inside: avoid; }
      .bingo-title { text-align: center; font-size: 16pt; font-weight: 900; }
      .bingo-name { font-size: 11pt; margin: 0.15cm 0 0.3cm; }
      .bingo-grid { display: grid; grid-template-columns: repeat(4, 1fr); border-top: 1px solid #000; border-left: 1px solid #000; }
      .bingo-cell { border-right: 1px solid #000; border-bottom: 1px solid #000; height: 2.4cm; display: flex; align-items: center; justify-content: center; text-align: center; font-size: 14pt; font-weight: 700; padding: 0.1cm; }
      .call-list, .ws-list { columns: 3; font-size: 11pt; padding-left: 1.2cm; }
      .ws-list { list-style: none; columns: 2; padding-left: 0; margin: 0.3cm auto; width: 14cm; }
      .call-list li, .ws-list li { break-inside: avoid; margin-bottom: 0.1cm; }
      .call-box { margin-right: 0.2cm; } .call-en { font-weight: 700; margin-right: 0.3cm; } .call-he { direction: rtl; unicode-bidi: isolate; color: #333; }
      .ws-grid { display: grid; grid-template-columns: repeat(11, 1.2cm); justify-content: center; margin: 0 auto; }
      .ws-cell { width: 1.2cm; height: 1.2cm; display: flex; align-items: center; justify-content: center; font: 700 16pt ui-monospace, Menlo, monospace; border: 1px solid #bbb; }
      .ws-on { background: #ddd !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      body { background: #fff; }
      .breadcrumb, .hero, .section:not(:has(.cards)), .more, .footer, .crawl-mesh, .print-btn, #cards-h { display: none !important; }
      .cards { grid-template-columns: repeat(3, 1fr); }
      .fc { break-inside: avoid; border: 1px dashed #64748b; }
    }
`;
