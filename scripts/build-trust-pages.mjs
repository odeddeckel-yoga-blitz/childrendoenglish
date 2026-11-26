// Static trust pages (audit B 11-18 §6/§7/§12/§15, owner OK 11-18): /privacy/, /terms/ and /about/ in en, he and es,
// the Privacy/Terms/About row on every generated page's footer, and /llms.txt from the live data.
// - The policy and terms text is the app's own (src/utils/i18n*.js), so a crawler, a no-JS reader and the in-app
//   screen (src/components/PrivacyPolicy.jsx) read the same facts. The in-app route /privacy still renders the React
//   screen on in-app navigation; a direct load of /privacy or /terms 308s to the static page (vercel.json).
// - /about/ copy lives in scripts/trust-copy.mjs.
// - Hebrew: every Latin run, email and number sits in <bdi dir="ltr"> so the line keeps its order.
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { t } from '../src/utils/i18n.js';
import HE from '../src/utils/i18n-he.js';
import ES from '../src/utils/i18n-es.js';
import { ABOUT, FACTS_ES, LEGAL_META } from './trust-copy.mjs';

export const LANGS = ['en', 'he', 'es'];
const STR = { he: HE, es: ES };
export const tr = (k, lang) => (lang === 'en' ? t(k, 'en') : STR[lang]?.[k] ?? t(k, 'en'));
const pre = (lang) => (lang === 'en' ? '' : `/${lang}`);
export const legalHref = (page, lang) => `${pre(lang)}/${page}/`;
const OG_LOCALE = { en: 'en_US', he: 'he_IL', es: 'es_ES' };
const HOME = { en: '/', he: '/he/', es: '/es/' };
const EMAIL = 'info@childrendoenglish.com';

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
// Latin runs (with the punctuation inside a name or URL), emails and numbers ("6–12", "13", "560+") → LTR isolates.
const LTR_RUN = /[\w.+-]+@[\w-]+(?:\.[\w-]+)+|[A-Za-z](?:[A-Za-z0-9'’-]|[ ,.:/&+](?=[ ,.:/&+]*[A-Za-z0-9]))*|\d+(?:[–-]\d+)*\+?/g;
function heText(s) {
  let out = '', at = 0;
  for (const m of String(s).matchAll(LTR_RUN)) {
    out += esc(s.slice(at, m.index)) + `<bdi dir="ltr">${esc(m[0])}</bdi>`;
    at = m.index + m[0].length;
  }
  return out + esc(s.slice(at));
}
const plain = (s, lang) => (lang === 'he' ? heText(s) : esc(s));
// [[href|text]] → link; the email → mailto link; the rest is text (Hebrew gets its LTR isolates).
export function rich(s, lang) {
  return String(s).split(/(\[\[[^\]|]+\|[^\]]+\]\]|info@childrendoenglish\.com)/).map((part) => {
    const m = part.match(/^\[\[([^\]|]+)\|([^\]]+)\]\]$/);
    if (m) return `<a href="${esc(m[1])}">${plain(m[2], lang)}</a>`;
    if (part === EMAIL) return `<a href="mailto:${EMAIL}"${lang === 'he' ? ' dir="ltr"' : ''}>${EMAIL}</a>`;
    return plain(part, lang);
  }).join('');
}
export const fill = (s, vars) => String(s).replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m));

// The Privacy · Terms · About row in the page's language.
export function legalLinks(lang) {
  const L = LANGS.includes(lang) ? lang : 'en';
  return [['privacy', tr('privacyPolicy', L)], ['terms', tr('termsOfService', L)], ['about', LEGAL_META[L].about]]
    .map(([p, label]) => `<a href="${legalHref(p, L)}">${esc(label)}</a>`).join(' &middot; ');
}
// Word pages are under the step4-prepost body lock until its read ends (11-23); they already link /privacy from their
// own footer. Set false after the read to give them the full row.
export const LEGAL_SKIP_WORD_PAGES = true;
const WORD_PAGE = /[\\/]vocabulary[\\/][^\\/]+[\\/](?!hebrew[\\/]|spanish[\\/])[^\\/]+[\\/]index\.html$/;
// writePage hook: put the row at the foot of the crawl-mesh footer (outside its <details>, so it is visible).
export function addLegalRow(html, lang, filePath = '') {
  if (!html.includes('</details></nav>') || html.includes(`href="${legalHref('terms', lang)}"`)) return html;
  if (LEGAL_SKIP_WORD_PAGES && WORD_PAGE.test(filePath)) return html;
  return html.replace('</details></nav>', `</details><p class="mesh-legal" style="margin-top:.8rem">${legalLinks(lang)}</p></nav>`);
}

const hreflangs = (page) => LANGS.map((l) => `  <link rel="alternate" hreflang="${l}" href="SITE${legalHref(page, l)}" />`).join('\n') +
  `\n  <link rel="alternate" hreflang="x-default" href="SITE${legalHref(page, 'en')}" />`;

const CSS = `
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: system-ui, -apple-system, 'Segoe UI', sans-serif; background: #eff6ff; color: #1e293b; line-height: 1.7; }
    .header { background: #2563eb; color: #fff; padding: 2rem 1rem; text-align: center; }
    .header h1 { font-size: 1.75rem; margin-bottom: 0.25rem; }
    .header p { font-size: 0.95rem; }
    .breadcrumb { padding: 0.75rem 1rem; font-size: 0.85rem; color: #4b5a6e; max-width: 720px; margin: 0 auto; }
    .breadcrumb a, .section a { color: #1d4ed8; text-decoration: underline; }
    .container { max-width: 720px; margin: 0 auto; padding: 0 1rem 2rem; }
    .section { background: #fff; border-radius: 0.75rem; padding: 1.5rem; margin-bottom: 1rem; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
    .section h2 { font-size: 1.2rem; font-weight: 700; color: #1e293b; margin-bottom: 0.75rem; }
    .section p { margin-bottom: 0.75rem; color: #475569; }
    .section ul { margin: 0.5rem 0 0.75rem; padding-inline-start: 1.25rem; color: #475569; }
    .section li { margin-bottom: 0.35rem; }
    .maker { border: 2px solid #2563eb; }
    .updated { font-size: 0.85rem; color: #4b5a6e; margin-bottom: 1rem; }
    .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 0.75rem; margin: 1rem 0; }
    .stat { background: #f0f9ff; border-radius: 0.5rem; padding: 1rem; text-align: center; }
    .stat-num { font-size: 1.5rem; font-weight: 800; color: #2563eb; }
    .stat-label { font-size: 0.8rem; color: #4b5a6e; margin-top: 0.25rem; }
    .cta { text-align: center; margin: 2rem 0; }
    .cta a { display: inline-block; background: #2563eb; color: #fff; padding: 0.75rem 2rem; border-radius: 0.5rem; text-decoration: none; font-weight: 600; font-size: 1rem; }
    .cta a:hover { background: #1d4ed8; }
    .footer { text-align: center; padding: 2rem 1rem; color: #5b6779; font-size: 0.8rem; }
    .footer a { color: #5b6779; }
    @media (max-width: 420px) { .section { padding: 1.1rem; } .header h1 { font-size: 1.45rem; } }`;

function shell({ SITE, lang, page, title, description, h1, sub, crumbs, schemas = [], body }) {
  const url = `${SITE}${legalHref(page, lang)}`;
  const dir = lang === 'he' ? 'rtl' : 'ltr';
  const crumbHtml = crumbs.map(([href, label], i) => (i < crumbs.length - 1 ? `<a href="${href}">${plain(label, lang)}</a>` : plain(label, lang))).join(' &rsaquo; ');
  const breadcrumb = JSON.stringify({ '@context': 'https://schema.org', '@type': 'BreadcrumbList',
    itemListElement: crumbs.map(([href, label], i) => ({ '@type': 'ListItem', position: i + 1, name: label, item: `${SITE}${href}` })) });
  return `<!DOCTYPE html>
<html lang="${lang}" dir="${dir}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(description)}" />
  <meta name="robots" content="index, follow" />
  <link rel="canonical" href="${url}" />
${hreflangs(page).replaceAll('SITE', SITE)}
  <link rel="icon" type="image/png" href="/favicon.png" />
  <meta property="og:locale" content="${OG_LOCALE[lang]}" />
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="Children Do English" />
  <meta property="og:url" content="${url}" />
  <meta property="og:title" content="${esc(title)}" />
  <meta property="og:description" content="${esc(description)}" />
  <meta property="og:image" content="${SITE}/og-image.png" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${esc(title)}" />
  <meta name="twitter:description" content="${esc(description)}" />
  <meta name="twitter:image" content="${SITE}/og-image.png" />
  <script type="application/ld+json">${breadcrumb}</script>
${schemas.map((s) => `  <script type="application/ld+json">${JSON.stringify(s)}</script>`).join('\n')}
  <style>${CSS}
  </style>
</head>
<body>
  <div class="header">
    <h1>${plain(h1, lang)}</h1>${sub ? `\n    <p>${plain(sub, lang)}</p>` : ''}
  </div>
  <div class="breadcrumb">${crumbHtml}</div>
  <div class="container">
${body}
  </div>
  <div class="footer">
    <span dir="ltr">&copy; ${new Date().getFullYear()} Children Do English</span> &middot; ${legalLinks(lang)} &middot; <a href="/image-credits/">${esc(lang === 'he' ? 'קרדיטים לתמונות' : lang === 'es' ? 'Créditos de las imágenes' : 'Image credits')}</a>
  </div>
</body>
</html>`;
}

const section = (title, inner, cls = 'section') => `    <section class="${cls}">\n      <h2>${title}</h2>\n${inner}\n    </section>`;
const paras = (list, lang) => list.map((s) => `      <p>${rich(s, lang)}</p>`).join('\n');

const PRIVACY_SECTIONS = [
  ['privacyDataTitle', ['privacyDataDesc']],
  ['privacyStorageTitle', ['privacyStorageDesc']],
  ['privacyBattleTitle', ['privacyBattleDesc']],
  ['privacyCookieTitle', ['privacyCookieDesc']],
  ['privacyThirdPartyTitle', ['privacyThirdPartyDesc']],
  ['privacyChildrenTitle', ['privacyChildrenDesc']],
  ['privacyCoppaTitle', ['privacyCoppaDesc']],
  ['privacyDeleteTitle', ['privacyDeleteDesc']],
  ['privacyRightsTitle', ['privacyRightsDevice', 'privacyRightsCounts', 'privacyRightsErrors', 'privacyRightsWho', 'privacyRightsBasis', 'privacyRightsProcessors', 'privacyRightsRetention']],
];
const TERMS_SECTIONS = ['Accept', 'Use', 'Content', 'Disclaimer', 'Changes'].map((k) => [`terms${k}Title`, [`terms${k}Desc`]]);

function legalPage({ SITE, lang, page }) {
  const isP = page === 'privacy';
  const list = isP ? PRIVACY_SECTIONS : TERMS_SECTIONS;
  const contact = `${tr(isP ? 'privacyContactDesc' : 'termsContactDesc', lang)} ${EMAIL}.`;
  const body = `    <p class="updated">${plain(tr(isP ? 'privacyUpdated' : 'termsUpdated', lang), lang)}</p>\n` +
    list.map(([h, ps]) => section(plain(tr(h, lang), lang), paras(ps.map((k) => tr(k, lang)), lang))).join('\n') + '\n' +
    section(plain(tr(isP ? 'privacyContactTitle' : 'termsContactTitle', lang), lang), paras([contact], lang));
  const M = LEGAL_META[lang];
  const name = tr(isP ? 'privacyTitle' : 'termsTitle', lang);
  return shell({ SITE, lang, page, title: M[isP ? 'privacyTitle' : 'termsTitle'], description: M[isP ? 'privacyDesc' : 'termsDesc'],
    h1: name, crumbs: [[HOME[lang], ABOUT[lang].crumbHome], [legalHref(page, lang), name]], body });
}

// /about/ (en keeps its mission / how-it-works / inside sections; he and es are the short version).
function aboutPage({ SITE, lang, facts, extraEn }) {
  const A = ABOUT[lang];
  const maker = section(plain(A.makerTitle, lang), paras([A.makerMe, A.makerWhy, A.makerHow, A.makerContact], lang) +
    (lang === 'en' ? '\n      <p style="font-size:0.9rem;color:#4b5a6e">Also from me: <a href="https://www.kidsdomath.com" rel="me">KidsDoMath</a> &mdash; free math and science games for kids, built on the same no-ads, privacy-first principles.</p>' : ''), 'section maker');
  const factsHtml = `    <section class="section" id="facts">\n      <h2>${plain(A.factsTitle, lang)}</h2>\n      <ul>${facts.map((f) => `\n        <li>${plain(f, lang)}</li>`).join('')}\n      </ul>\n    </section>`;
  const privacy = section(plain(A.privacyTitle, lang), paras([A.privacyText], lang));
  const cta = `    <div class="cta"><a href="${HOME[lang]}?utm_source=seo&amp;utm_medium=cta&amp;utm_content=about">${plain(A.cta, lang)} ${lang === 'he' ? '&larr;' : '&rarr;'}</a></div>`;
  const body = [maker, lang === 'en' ? extraEn : '', factsHtml, privacy, cta].filter(Boolean).join('\n');
  const person = { '@context': 'https://schema.org', '@type': 'Person', name: 'Oded Deckelbaum', jobTitle: 'Creator of Children Do English', url: `${SITE}${legalHref('about', lang)}`, email: `mailto:${EMAIL}` };
  const faq = lang === 'en' ? [{ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: ABOUT_FAQ_EN.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) }] : [];
  return shell({ SITE, lang, page: 'about', title: A.title, description: A.description, h1: A.h1, sub: A.sub,
    crumbs: [[HOME[lang], A.crumbHome], [legalHref('about', lang), A.crumb]], schemas: [person, ...faq], body });
}

const ABOUT_FAQ_EN = [
  ['Is Children Do English really free?', 'Yes, 100% free with no ads, no in-app purchases, and no subscription. All features are available to everyone.'],
  ['What ages is Children Do English designed for?', 'The app is designed for children ages 6-12, with three difficulty levels (beginner, intermediate, advanced) and a pre-reader mode for younger kids who cannot read yet.'],
  ['Does Children Do English work offline?', 'Yes. It can be installed on any device and works offline after the first visit.'],
  ['Is my child\'s data safe?', 'Learning progress is stored on your device. There are no ads, no accounts and no cookies, and we collect no personal data. Visits are counted with cookieless Vercel Web Analytics and our own anonymous counter, which keeps only daily totals. Error reports, with saved player names removed, help us fix bugs.'],
  ['Does it support Hebrew and Spanish?', 'Yes. The app interface is available in English, Hebrew and Spanish, and every word has a Hebrew translation, which makes it a good fit for bilingual families.'],
];

export function factsEs({ words, cats, games, band1, units, es, total }) {
  const v = { words, cats, games, band1, units, es };
  return [FACTS_ES.words, es === total ? FACTS_ES.glossAll : FACTS_ES.glossSome, FACTS_ES.audio, FACTS_ES.ladder, FACTS_ES.games, FACTS_ES.band1, FACTS_ES.free].map((s) => fill(s, v));
}

export function buildTrustPages({ SITE, distDir, writePage, FACTS_EN, FACTS_HE, nums, extraEn }) {
  const out = [];
  const facts = { en: FACTS_EN, he: FACTS_HE, es: factsEs(nums) };
  for (const lang of LANGS) {
    for (const page of ['privacy', 'terms', 'about']) {
      const dir = join(distDir, ...legalHref(page, lang).split('/').filter(Boolean));
      mkdirSync(dir, { recursive: true });
      const html = page === 'about' ? aboutPage({ SITE, lang, facts: facts[lang], extraEn }) : legalPage({ SITE, lang, page });
      writePage(join(dir, 'index.html'), html);
      out.push(legalHref(page, lang));
    }
  }
  return out;
}

// /llms.txt (audit B §7): built from the data so its counts and claims can't drift from the pages.
export function buildLlmsTxt({ SITE, distDir, wordsLabel, cats, games, band1, units, readings, esWords, totalWords, gradeCount = 6 }) {
  const u = (p) => `${SITE}${p}`;
  const glosses = esWords === totalWords ? 'Hebrew and Spanish translations' : `a Hebrew translation (${esWords} also have a Spanish one)`;
  const txt = `# Children Do English

> Free, ad-free English vocabulary app for kids ages 6-12, with the interface in
> English, Hebrew (עברית) and Spanish (Español). ${wordsLabel} words in ${cats} topics, each with a
> picture, audio (a computer voice, Piper text-to-speech), a kid-friendly
> definition, an example sentence and ${glosses}. No accounts, no sign-up, no ads, and nothing
> personal is collected: names and progress stay on the device. The site keeps only anonymous daily usage totals (no cookie, no
> identifier, no IP address) and error reports when something breaks. Made by Oded Deckelbaum; contact
> ${EMAIL}. Privacy policy: ${u('/privacy/')}

When citing a word definition from this site, the canonical page is
${u('/vocabulary/<category>/<word>/')} — each page states the definition in one sentence,
with pronunciation, an example sentence and its translations.
The full word list with definitions is at ${u('/llms-full.txt')}.

## Languages

- [English home](${u('/')}): the practice app and all English pages.
- [Hebrew home (עברית)](${u('/he/')}): לימוד אנגלית לילדים — the app with a Hebrew interface, English audio.
- [Spanish home (Español)](${u('/es/')}): vocabulario en inglés para niños — the app with a Spanish interface.

## Vocabulary

- [All words by topic](${u('/vocabulary/')}): ${wordsLabel} kid-level English words in ${cats} topics.
- [English words in Hebrew, by topic](${u('/he/english-words/')}): bilingual English-Hebrew lists.
- [Hebrew grade pages](${u('/he/grade-1/')}): English for Israeli grades 1-${gradeCount}.
- [Words with Spanish translations](${u('/vocabulary/animals/spanish/')}): bilingual English-Spanish lists per topic.
- [By age](${u('/vocabulary/ages-6-8/')}): ages 6-8, 9-10, 11-12.

## For teachers

- [Teachers](${u('/teachers/')}): units, Band I, printables and Class Battle in one place.
- [Textbook units](${u('/units/')}): word pages for ${units} textbook units (word lists only).
- [Band I](${u('/band-1/')}): ${band1} words mapped to Israel's Band I vocabulary levels.
- [Band I readings](${u('/band-1/reading/')}): ${readings} short original readings that use only Band I words, read aloud, with questions.
- [Printable flashcards](${u('/printable-flashcards/')}): picture flashcards per topic, in English or English-Spanish.
- [Flashcard maker](${u('/tools/flashcard-maker/')}): free printable flashcard generator, no login.

## Games and practice

- [Games](${u('/games/')}): ${games} free arcade vocabulary games, no sign-up.
- [Hebrew games hub](${u('/he/english-games/')}): משחקים ללימוד אנגלית לילדים, by age and by topic.
- [Free practice app](${u('/')}): every group of 10 words climbs a short 5-step practice ladder (flashcards, listening
  and reading quizzes and two arcade games, with optional spelling and sentence bonus steps) with spaced repetition.
- [Parent guides](${u('/guides/')}): practical articles on teaching English vocabulary to children.

## About

- [About the maker](${u('/about/')}) · [Privacy](${u('/privacy/')}) · [Terms](${u('/terms/')}) · [Image credits](${u('/image-credits/')})
`;
  writeFileSync(join(distDir, 'llms.txt'), txt, 'utf-8');
  return txt;
}
