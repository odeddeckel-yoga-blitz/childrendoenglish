// Word page, Option A (step 4, mockup a "cat" / "nervous", owner OK 11-08). Served to half of each category's word
// pages (src/data/wordPageVariant.js); the other half keep today's page. What changes against today's page:
// - the blue banner is cut to breadcrumb + H1 (no Hebrew-first banner for every visitor);
// - one card: picture, IPA · part of speech, ONE "Hear" button labelled "computer voice", the definition;
// - Hebrew and Spanish glosses side by side, labelled by language name;
// - mini-quiz, example sentence and "Practise <Category>" (the category's live word count) above the fold on a
//   phone (360×800) and a Chromebook (1366×768);
// - the picture's credit under it: "Photo: <author>, <licence>" only for a real photo, otherwise "Picture: …" saying
//   what it is (emoji drawing, drawing), so a drawn word never reads as a photo;
// - the quiz keeps one picture style per round and keeps CONFUSABLE_PAIRS (words.js `collides`) apart.
// Head (title, meta, JSON-LD) and the below-the-fold content are the same as today's page, so the A/B reads the layout.
// Tests: src/__tests__/wordPageA.test.js (helpers), e2e/word-page-a.spec.js (built pages).

import IMAGE_SOURCES from './IMAGE_SOURCES.json' with { type: 'json' };
import { pictureStyle } from '../src/data/imageStyle.js';
import { collides } from '../src/data/words.js';
import { isPhoto } from './page-copy.mjs';

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
const hashOf = (id) => [...id].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);

// "70 animal words", "More animal words": the category as a noun modifier.
const CAT_NOUN = { animals: 'animal', colors: 'color', numbers: 'number', toys: 'toy', everyday: 'everyday' };
export const categoryNoun = (slug, displayName) => CAT_NOUN[slug] || displayName.split(' & ')[0].toLowerCase();
// "Practise Animals", "Practise Food", "Practise Everyday Objects".
export const categoryShort = (displayName) => displayName.split(' & ')[0];

/**
 * The quiz round: the word + 2 distractors, all of the word's picture style (photo / drawn), none colliding with the
 * word or with each other (same text, same Hebrew gloss, a CONFUSABLE pair). Same category first; when a category has
 * too few pictures of that style, the rest of the site's words of that style fill in. Deterministic (hash of the id),
 * order rotated so the answer is not always first.
 */
export function pickQuizRound(word, categoryWords, allWords, { styleOf = pictureStyle, collide = collides } = {}) {
  const style = styleOf(word.id);
  const h = hashOf(word.id);
  const picked = [word];
  const fits = (w) => styleOf(w.id) === style && picked.every((p) => !collide(p, w) && !collide(w, p));
  for (const pool of [categoryWords, allWords]) {
    const cands = pool.filter((w) => w.id !== word.id);
    for (let i = 0; i < cands.length && picked.length < 3; i++) {
      const w = cands[(h * 7 + 3 + i * 11) % cands.length];
      if (!picked.includes(w) && fits(w)) picked.push(w);
    }
    for (const w of cands) { if (picked.length >= 3) break; if (!picked.includes(w) && fits(w)) picked.push(w); }
    if (picked.length >= 3) break;
  }
  const rot = h % picked.length;
  return picked.slice(rot).concat(picked.slice(0, rot));
}

/**
 * The credit line under the picture. Only a real photo (page-copy isPhoto) is called "Photo"; emoji and drawings
 * say what they are. Returns { label, text, href } (href = the file page when known).
 */
// Some Commons author fields run to hundreds of characters (a collage lists every file): the caption keeps the first
// ~36 characters + "…"; the linked file page and /image-credits/ carry the full credit.
export const shortAuthor = (a) => {
  const t = String(a || '').replace(/\s+/g, ' ').trim();
  if (t.length <= 40) return t;
  const cut = t.slice(0, 36);
  return `${cut.slice(0, cut.lastIndexOf(' ') > 20 ? cut.lastIndexOf(' ') : 36).replace(/[\s,;:.]+$/, '')}…`;
};
export function pictureCredit(id, sources = IMAGE_SOURCES, photo = isPhoto) {
  const s = { ...(sources[id] || {}) };
  s.author = shortAuthor(s.author);
  const drawn = !photo(id);
  switch (s.source) {
    case 'wikimedia-commons':
      return drawn
        ? { label: 'Picture', text: `drawing by ${s.author || 'unknown author'}, ${s.licence || 'Wikimedia Commons'}`, href: s.url || null }
        : { label: 'Photo', text: `${s.author || 'unknown author'}, ${s.licence}`, href: s.url || null };
    case 'pixabay':
      return drawn
        ? { label: 'Picture', text: `drawing by ${s.author || 'unknown author'} on Pixabay`, href: s.url || null }
        : { label: 'Photo', text: `${s.author || 'unknown author'} on Pixabay`, href: s.url || null };
    case 'twemoji': return { label: 'Picture', text: `Twemoji emoji drawing, ${s.licence || 'CC BY 4.0'}`, href: s.url || null };
    case 'fluent-emoji': return { label: 'Picture', text: `Fluent Emoji drawing by Microsoft, ${s.licence || 'MIT'}`, href: s.url || null };
    case 'own': return { label: 'Picture', text: 'drawing by Children Do English', href: null };
    case 'unknown': return { label: 'Picture', text: 'from Wikimedia Commons (author not recorded)', href: null };
    default: return { label: 'Picture', text: 'see image credits', href: null };
  }
}

// The example sentence with the word in bold (plural / -ed / -ing forms too).
export function boldWord(sentence, word) {
  const re = new RegExp(`\\b(${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?:s|es|ed|d|ing)?)\\b`, 'gi');
  return esc(sentence).replace(re, '<strong>$1</strong>');
}

const ICON = (n) => `<svg class="ic" aria-hidden="true" focusable="false" style="width:1.15em;height:1.15em;vertical-align:-.2em;flex:none"><use href="/icons.svg#i-${n}"/></svg>`;

export const WORD_A_CSS = `
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: system-ui, -apple-system, 'Segoe UI', sans-serif; background: #f8fafc; color: #1e293b; line-height: 1.5; }
    .wa-band { background: #eff6ff; border-bottom: 1px solid #dbeafe; }
    .wa-band-in { max-width: 1120px; margin: 0 auto; padding: 0 1rem .55rem; }
    .wa-band .breadcrumb { font-size: .82rem; color: #4b5a6e; }
    .wa-band .breadcrumb a { color: #1d4ed8; text-decoration: none; }
    @media (max-width: 599px) { .wa-wide { display: none; } }
    .wa-band h1 { font-size: 1.9rem; line-height: 1.15; color: #1e3a8a; font-weight: 800; overflow-wrap: anywhere; }
    .wa-main { max-width: 1120px; margin: 0 auto; padding: .9rem 1rem 1.5rem; }
    .wa-grid { display: grid; grid-template-columns: 124px minmax(0, 1fr); grid-template-areas: "fig say" "gloss gloss" "quiz quiz" "ex ex" "cta cta"; gap: .6rem .75rem; align-items: start; }
    .wa-grid::before { content: ''; grid-row: 1; grid-column: 1 / -1; align-self: stretch; margin: -.55rem; background: #fff; border: 1px solid #e2e8f0; border-radius: 14px; }
    .wa-info, .wa-side { display: contents; }
    .wa-fig { grid-area: fig; position: relative; }
    .wa-fig img { display: block; width: 100%; height: auto; aspect-ratio: 1; object-fit: cover; border-radius: 12px; background: #f1f5f9; }
    .wa-fig figcaption { font-size: .68rem; line-height: 1.3; color: #475569; margin-top: .25rem; overflow-wrap: anywhere; }
    .wa-fig figcaption a { color: #475569; }
    .wa-say { grid-area: say; position: relative; min-width: 0; }
    .wa-ipa { font-size: .9rem; color: #475569; }
    .wa-hear { display: inline-flex; align-items: center; gap: .4rem; min-height: 44px; margin: .3rem 0 0; padding: .45rem 1rem; border: 2px solid #bfdbfe; border-radius: 999px; background: #eff6ff; color: #1d4ed8; font-family: inherit; font-weight: 700; font-size: 1rem; line-height: 1.2; cursor: pointer; }
    .wa-hear.say-active { transform: scale(.97); }
    .wa-voice { display: block; font-size: .72rem; color: #475569; margin: .1rem 0 .3rem; }
    .wa-def { font-size: .98rem; line-height: 1.4; }
    .wa-gloss { grid-area: gloss; display: grid; grid-template-columns: 1fr 1fr; gap: .6rem; }
    .wa-gloss.one { grid-template-columns: 1fr; }
    .wa-gl { background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; padding: .35rem .75rem .45rem; min-width: 0; }
    .wa-gl b { display: block; font-size: .72rem; font-weight: 700; color: #475569; }
    .wa-gl span { display: block; font-size: 1.1rem; font-weight: 700; overflow-wrap: anywhere; }
    .wa-ex { grid-area: ex; background: #fff; border-left: 4px solid #bfdbfe; border-radius: 0 10px 10px 0; padding: .35rem .8rem .45rem; }
    .wa-ex b { display: block; font-size: .72rem; color: #475569; }
    .wa-ex p { font-size: .98rem; }
    .mini-quiz { grid-area: quiz; background: #fff; border: 1px solid #e2e8f0; border-radius: 14px; padding: .6rem .6rem .7rem; text-align: center; }
    .mini-quiz h2 { font-size: .98rem; line-height: 1.3; margin: 0 0 .5rem; color: #1e293b; }
    .mq-options { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: .5rem; }
    .mq-opt { border: 3px solid #e2e8f0; border-radius: 12px; padding: 0; background: #fff; cursor: pointer; overflow: hidden; transition: transform .12s; min-height: 44px; }
    .mq-opt img { display: block; width: 100%; height: auto; aspect-ratio: 1; object-fit: cover; }
    .mq-opt:hover { transform: translateY(-2px); }
    .mq-opt.mq-right { border-color: #10b981; box-shadow: 0 0 0 3px rgba(16,185,129,.3); }
    .mq-opt.mq-wrong { border-color: #ef4444; animation: mqshake .5s; }
    .mq-opt.mq-dim { opacity: .45; }
    @keyframes mqshake { 0%,100% { transform: translateX(0) } 25% { transform: translateX(-6px) } 75% { transform: translateX(6px) } }
    .mq-result { margin-top: .6rem; }
    .mq-yay { font-size: 1.1rem; font-weight: 800; color: #047857; margin: 0 0 .4rem; }
    .mq-cta { display: inline-flex; align-items: center; min-height: 44px; padding: .55rem 1.3rem; background: #1d4ed8; color: #fff; border-radius: 999px; font-weight: 700; text-decoration: none; }
    .wa-cta { grid-area: cta; text-align: center; }
    .wa-cta a { display: flex; align-items: center; justify-content: center; gap: .5rem; min-height: 48px; padding: .6rem 1rem; background: #1d4ed8; color: #fff; border-radius: 12px; font-weight: 800; font-size: 1.05rem; text-decoration: none; box-shadow: 0 2px 8px rgba(29,78,216,.3); }
    .wa-cta a:hover { background: #1e40af; }
    .wa-cta p { font-size: .8rem; color: #475569; margin-top: .3rem; }
    @media (min-width: 900px) {
      .wa-band h1 { font-size: 2.3rem; }
      .wa-main { padding-top: 1.4rem; }
      .wa-grid { grid-template-columns: 300px minmax(0, 1fr) 372px; grid-template-areas: "fig info side"; gap: 2rem; }
      .wa-grid::before { display: none; }
      .wa-info, .wa-side { display: flex; flex-direction: column; gap: .8rem; }
      .wa-info { grid-area: info; } .wa-side { grid-area: side; }
      .wa-fig img { border-radius: 16px; }
      .wa-fig figcaption { font-size: .72rem; }
      .wa-def { font-size: 1.2rem; }
      .mini-quiz { padding: .9rem; }
      .mini-quiz h2 { font-size: 1.02rem; }
    }
    .section-title { font-size: 1.1rem; margin: 1.5rem 0 .75rem; color: #334155; }
    .related-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: .75rem; margin-bottom: 2rem; }
    .related-card { display: block; background: #fff; border: 1px solid #e2e8f0; border-radius: .75rem; padding: .5rem; text-align: center; text-decoration: none; color: inherit; }
    .related-img { width: 100%; height: auto; aspect-ratio: 1; border-radius: .5rem; object-fit: cover; display: block; margin-bottom: .35rem; }
    .related-word { font-size: .95rem; font-weight: 600; color: #1e293b; }
    .wa-more { max-width: 1120px; margin: 0 auto; padding: 0 1rem 2rem; }
    .wa-faq { background: #fff; border: 1px solid #e2e8f0; border-radius: .75rem; padding: 1rem 1.25rem; margin-bottom: 1.25rem; }
    .wa-faq h2 { font-size: 1.1rem; margin-bottom: .5rem; }
    .wa-faq h3 { font-size: .98rem; margin-top: .6rem; }
    .wa-faq p { color: #334155; }
    .back-link { display: inline-block; margin-bottom: 1.5rem; color: #1d4ed8; text-decoration: none; font-size: .9rem; }
    .enrich-section { background: #fff; border-radius: .75rem; padding: 1.25rem 1.5rem; margin-bottom: 1rem; border: 1px solid #e2e8f0; }
    .enrich-section h2 { font-size: 1.1rem; font-weight: 700; color: #1e293b; margin-bottom: .6rem; }
    .enrich-section ul { margin: 0 0 .5rem 1.25rem; color: #475569; }
    .about-word { background: #f0f9ff; border-radius: .75rem; padding: 1.25rem 1.5rem; margin-bottom: 1.5rem; color: #334155; }
    .chips { display: flex; flex-wrap: wrap; gap: .5rem; }
    .chip { background: #eff6ff; color: #1d4ed8; padding: .35rem .85rem; border-radius: 2rem; font-size: .85rem; font-weight: 500; display: inline-block; }
    .fun-fact { background: #fefce8; border-left: 4px solid #eab308; padding: 1rem 1.25rem; border-radius: 0 .5rem .5rem 0; margin-bottom: 1rem; font-size: .95rem; color: #713f12; }
    .word-nav { display: flex; justify-content: space-between; gap: 1rem; margin: 0 0 1.5rem; }
    .word-nav a { display: inline-flex; align-items: center; gap: .4rem; min-height: 44px; padding: .6rem 1.1rem; background: #fff; border-radius: 999px; color: #1d4ed8; font-weight: 700; text-decoration: none; border: 1px solid #e2e8f0; font-size: .95rem; }
    .word-nav .nav-spacer { flex: 1; }
    .categories h2 { font-size: 1.1rem; margin-bottom: .75rem; color: #334155; }
    .cat-links { display: flex; flex-wrap: wrap; gap: .5rem; }
    .cat-links a { background: #fff; padding: .4rem .85rem; border-radius: 2rem; font-size: .85rem; color: #1d4ed8; text-decoration: none; border: 1px solid #e2e8f0; }
    .footer { text-align: center; padding: 2rem 1rem; color: #5b6779; font-size: .8rem; }
`;

/**
 * The <body> of an Option A page. `parts` carries the pieces shared with today's page (built once in
 * generate-seo-pages.js): head-free fragments for below the fold.
 */
export function buildWordPageABody({ word, categorySlug, categoryDisplayName, categoryWords, allWords, esGloss, audioFile, pic, below }) {
  const noun = categoryNoun(categorySlug, categoryDisplayName);
  const short = categoryShort(categoryDisplayName);
  const n = categoryWords.length;
  const cred = pictureCredit(word.id);
  const credit = `${cred.label}: ${cred.href ? `<a href="${esc(cred.href)}" rel="nofollow noopener">${esc(cred.text)}</a>` : esc(cred.text)}`;
  const def = /[.!?]$/.test(word.definition.trim()) ? word.definition.trim() : `${word.definition.trim()}.`;
  const round = pickQuizRound(word, categoryWords, allWords);
  const opts = round.map((w) => `<button class="mq-opt" data-k="${w.id}" aria-label="picture option"><img src="/images/${w.id}.webp" alt="" width="120" height="120" loading="eager" decoding="async" /></button>`).join('\n          ');
  const playHref = `/new-player?topic=${categorySlug}&utm_source=seo`;
  const related = categoryWords.filter((w) => w.id !== word.id).slice(0, 6).map((w) => `
      <a href="/vocabulary/${categorySlug}/${w.id}/" class="related-card"><img src="/images/${w.id}.webp" alt="" class="related-img" loading="lazy" width="120" height="120" /><div class="related-word">${esc(w.word)}</div></a>`).join('');
  const glosses = [`<div class="wa-gl"><b>Hebrew</b><span lang="he" dir="rtl">${esc(word.hebrewTranslation)}</span></div>`]
    .concat(esGloss ? [`<div class="wa-gl"><b>Spanish</b><span lang="es">${esc(esGloss)}</span></div>`] : []);
  return `<body data-wv="a" data-pic="${pic}">
  <div class="wa-band"><div class="wa-band-in">
    <div class="breadcrumb"><a href="/">Home</a> &rsaquo; <span class="wa-wide"><a href="/vocabulary/">Vocabulary</a> &rsaquo; </span><a href="/vocabulary/${categorySlug}/">${esc(categoryDisplayName)}</a><span class="wa-wide"> &rsaquo; ${esc(word.word)}</span></div>
    <h1>${esc(word.word)}</h1>
  </div></div>

  <div class="wa-main">
    <div class="wa-grid">
      <figure class="wa-fig">
        <img src="/images/${word.id}.webp" alt="${esc(word.word)}" width="300" height="300" fetchpriority="high" />
        <figcaption class="wa-credit">${credit}</figcaption>
      </figure>
      <div class="wa-info">
        <div class="wa-say">
          <p class="wa-ipa"><span dir="ltr">${esc(word.phonetic)}</span> &middot; ${esc(word.partOfSpeech)}</p>
          <button class="wa-hear" data-say="/audio/${audioFile}">${ICON('volume-2')} Hear &ldquo;${esc(word.word)}&rdquo;</button>
          <span class="wa-voice">computer voice</span>
          <p class="wa-def answer-first">${esc(def)}</p>
        </div>
        <div class="wa-gloss${glosses.length === 1 ? ' one' : ''}">
          ${glosses.join('\n          ')}
        </div>
        <div class="wa-ex"><b>Example</b><p>${boldWord(word.exampleSentence, word.word)}</p></div>
      </div>
      <div class="wa-side">
        <div class="mini-quiz" data-answer="${word.id}">
          <h2>Quick check: tap the picture of &ldquo;${esc(word.word)}&rdquo;</h2>
          <div class="mq-options">
          ${opts}
          </div>
          <div class="mq-result" hidden>
            <p class="mq-yay">That&rsquo;s right!</p>
            <a class="mq-cta" href="${playHref}&utm_medium=miniquiz&utm_content=vocab_word_a">Play more ${esc(noun)} words &rarr;</a>
          </div>
        </div>
        <div class="wa-cta">
          <a href="${playHref}&utm_medium=cta&utm_content=vocab_word_a">Practise ${esc(short)} ${ICON('arrow-right')}</a>
          <p>${n} ${esc(noun)} words &middot; free &middot; no sign-up</p>
        </div>
      </div>
    </div>
  </div>

  <div class="wa-more">
    <h2 class="section-title">More ${esc(noun)} words</h2>
    <div class="related-grid">${related}
    </div>
${below}
  </div>

  <div class="footer">
    <span dir="ltr">&copy; ${new Date().getFullYear()} Children Do English</span> &middot; <a href="/about/" style="color:#5b6779">About</a> &middot; <a href="/privacy" style="color:#5b6779">Privacy</a> &middot; <a href="/image-credits/" style="color:#5b6779">Image credits</a>
  </div>
  <script defer src="/vocab-quiz.js"></script>
</body>`;
}
