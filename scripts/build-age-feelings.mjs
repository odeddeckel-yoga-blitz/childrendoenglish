// English list pages for two unserved demand clusters (audit 11-18 B-seo-trust "Unserved demand" #8 and #10, owner OK):
//   /vocabulary/words-for-<n>-year-olds/  n = 6…10 ("vocabulary words for 10 year olds", "words for 6 year olds" … 219 imp)
//   /vocabulary/feelings-words-for-kids/  ("define curious for kids", "<feeling> meaning for kids" … 804 imp)
// The bracket pages /vocabulary/ages-6-8/ etc. earn clicks, so they keep their titles; the per-year pages are new and
// link up to them (and the bracket pages link down). Two-segment URLs on purpose: a /vocabulary/<a>/<b>/ path would
// count as a word page (tools/reads/locks.mjs pageKey) and the word pages are under the step4-prepost read.
// Per-year split, stated on each page: our level for the age (beginner = 6–8, intermediate = 9–10), then each level's
// words ordered from short and simple to longer (letters + syllables) and cut into years.
import { join } from 'path';
import { mkdirSync, existsSync } from 'fs';

export const YEAR_PAGES = [
  { n: 6, level: 'beginner', part: [0, 3], bracket: 'ages-6-8' },
  { n: 7, level: 'beginner', part: [1, 3], bracket: 'ages-6-8' },
  { n: 8, level: 'beginner', part: [2, 3], bracket: 'ages-6-8' },
  { n: 9, level: 'intermediate', part: [0, 2], bracket: 'ages-9-10' },
  { n: 10, level: 'intermediate', part: [1, 2], bracket: 'ages-9-10' },
];
export const yearPath = (n) => `/vocabulary/words-for-${n}-year-olds/`;
export const FEELINGS_PATH = '/vocabulary/feelings-words-for-kids/';

const syllables = (w) => Math.max(1, (w.toLowerCase().replace(/e\b/g, '').match(/[aeiouy]+/g) || []).length);
export const simplicity = (w) => w.word.replace(/[^a-z]/gi, '').length + 1.5 * syllables(w.word) + (w.word.includes(' ') ? 3 : 0);

export function yearWords(page, WORDS) {
  const level = WORDS.filter((w) => w.level === page.level).map((w, i) => ({ w, i }))
    .sort((a, b) => simplicity(a.w) - simplicity(b.w) || a.i - b.i).map(({ w }) => w);
  const [k, parts] = page.part;
  const size = Math.ceil(level.length / parts);
  return level.slice(k * size, (k + 1) * size);
}

// Our own kid-level meanings: what it feels like, when you might feel it, a word that goes with it.
const FEELINGS = [
  ['happy', 'Happy means you feel good inside and want to smile.', 'when you play with your best friend', 'sad'],
  ['sad', 'Sad means you feel down, and you might want to cry.', 'when a friend moves away', 'happy'],
  ['angry', 'Angry means you feel mad and hot inside, and you might want to shout.', 'when someone breaks your toy on purpose', 'calm'],
  ['scared', 'Scared means you feel afraid that something bad will happen.', 'when you hear a loud noise in the dark', 'brave'],
  ['calm', 'Calm means you feel quiet and peaceful inside, not upset.', 'when you read a book in a cozy corner', 'angry'],
  ['tired', 'Tired means your body needs rest or sleep.', 'after a long day at the park', null],
  ['hungry', 'Hungry means your tummy tells you it needs food.', 'when it is almost lunchtime', null],
  ['shy', 'Shy means you feel a little nervous to talk or play with people you do not know well.', 'on your first day in a new class', null],
  ['surprised', 'Surprised means you feel “Oh!” because something happened that you did not expect.', 'when your friends shout “Happy birthday!”', null],
  ['brave', 'Brave means you do something even though it feels scary.', 'when you jump into the pool for the first time', 'scared'],
  ['proud', 'Proud means you feel good about something you worked hard to do.', 'when you finish a big puzzle by yourself', null],
  ['bored', 'Bored means nothing feels fun or interesting right now.', 'when you wait a long time with nothing to do', 'curious'],
  ['curious', 'Curious means you want to know more and ask questions.', 'when you find a strange shell on the beach', 'bored'],
  ['confused', 'Confused means you do not understand what is happening or what to do.', 'when the rules of a new game are hard to follow', null],
  ['grateful', 'Grateful means you feel thankful because someone did something nice for you.', 'when a friend shares a snack with you', null],
  ['jealous', 'Jealous means you want something that someone else has.', 'when a friend gets a new bike and you do not', null],
  ['excited', 'Excited means you feel very happy about something that will happen soon.', 'the night before a school trip', 'bored'],
  ['nervous', 'Nervous means you feel worried, maybe with “butterflies” in your tummy.', 'before you speak in front of the class', 'calm'],
  ['worried', 'Worried means you keep thinking about something bad that might happen.', 'when your pet is sick', 'calm'],
  ['lonely', 'Lonely means you feel sad because you are alone or have no one to play with.', 'when everyone is busy and you have no one to talk to', null],
  ['embarrassed', 'Embarrassed means your face feels hot because others saw you make a mistake.', 'when you trip in front of the class', 'proud'],
  ['frustrated', 'Frustrated means you feel upset because you keep trying and it still does not work.', 'when your block tower keeps falling down', null],
];

const CSS = `
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: system-ui, -apple-system, sans-serif; background: #eff6ff; color: #1e293b; line-height: 1.6; }
    .header { background: #2563eb; color: #fff; padding: 2rem 1rem; text-align: center; }
    .header h1 { font-size: 1.7rem; margin-bottom: 0.25rem; line-height: 1.3; }
    .header p { font-size: 0.95rem; }
    .breadcrumb { padding: 0.75rem 1rem; font-size: 0.85rem; color: #4b5a6e; max-width: 960px; margin: 0 auto; }
    .breadcrumb a { color: #2563eb; text-decoration: underline; }
    .container { max-width: 960px; margin: 0 auto; padding: 0 1rem 2rem; }
    .intro { margin-bottom: 1.25rem; color: #475569; }
    .top-cta { display: block; text-align: center; background: #b45309; color: #fff; font-weight: 800; font-size: 1.1rem; padding: 0.85rem 1rem; border-radius: 999px; text-decoration: none; margin: 0 auto 1rem; max-width: 420px; }
    .wl { width: 100%; border-collapse: collapse; background: #fff; border-radius: 0.75rem; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.08); margin-bottom: 1.5rem; }
    .wl th, .wl td { padding: 0.5rem 0.6rem; border-bottom: 1px solid #e2e8f0; text-align: left; vertical-align: middle; }
    .wl th { background: #f8fafc; font-size: 0.85rem; color: #475569; }
    .wl img { width: 56px; height: 56px; border-radius: 0.5rem; object-fit: cover; display: block; }
    .wl .w a { font-weight: 800; font-size: 1.1rem; color: #1e40af; }
    .wl .ex { color: #475569; font-size: 0.9rem; }
    .say { width: 44px; height: 44px; border: 0; border-radius: 50%; background: #eef2ff; cursor: pointer; font-size: 1.1rem; }
    .feel { background: #fff; border-radius: 0.75rem; padding: 1rem 1.1rem; box-shadow: 0 1px 3px rgba(0,0,0,0.08); margin-bottom: 0.75rem; display: flex; gap: 0.9rem; align-items: flex-start; }
    .feel img { width: 72px; height: 72px; border-radius: 0.6rem; object-fit: cover; flex: none; }
    .feel h2 { font-size: 1.2rem; display: flex; align-items: center; gap: 0.4rem; } .feel h2 a { color: #1e40af; }
    .feel p { margin-top: 0.15rem; } .feel .when { color: #475569; } .feel .pair { font-size: 0.85rem; color: #4b5a6e; }
    .faq-item { background: #fff; border-radius: 0.75rem; padding: 1rem 1.2rem; margin-bottom: 0.6rem; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
    .faq-item h3 { font-size: 1rem; margin-bottom: 0.3rem; } .faq-item p { color: #475569; font-size: 0.92rem; }
    h2.sec { font-size: 1.2rem; margin: 1.5rem 0 0.75rem; }
    .links-row { display: flex; flex-wrap: wrap; gap: 0.5rem; }
    .links-row a { background: #fff; padding: 0.4rem 0.85rem; border-radius: 2rem; font-size: 0.9rem; color: #2563eb; text-decoration: none; box-shadow: 0 1px 2px rgba(0,0,0,0.06); min-height: 44px; display: inline-flex; align-items: center; }
    .links-row a[aria-current] { background: #2563eb; color: #fff; }
    .footer { text-align: center; padding: 2rem 1rem; color: #5b6779; font-size: 0.8rem; }
    .wl td { overflow-wrap: anywhere; }
    @media (max-width: 560px) {
      .wl .ex, .wl th.exh { display: none; } .feel { flex-direction: column; }
      .wl th, .wl td { padding: 0.4rem 0.3rem; } .wl img { width: 44px; height: 44px; } .wl .w a { font-size: 1rem; }
    }
`;

function shell({ SITE, path, title, description, schemas, body }) {
  const url = `${SITE}${path}`;
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <meta name="description" content="${description}" />
  <meta name="robots" content="index, follow" />
  <link rel="canonical" href="${url}" />
  <link rel="icon" type="image/png" href="/favicon.png" />
  <meta property="og:locale" content="en_US" />
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="Children Do English" />
  <meta property="og:url" content="${url}" />
  <meta property="og:title" content="${title}" />
  <meta property="og:description" content="${description}" />
  <meta property="og:image" content="${SITE}/og-image.png" />
${schemas.map((s) => `  <script type="application/ld+json">${s}</script>`).join('\n')}
  <style>${CSS}</style>
</head>
<body>
${body}
  <div class="footer">
    <span dir="ltr">&copy; ${new Date().getFullYear()} Children Do English</span> &middot; <a href="/about/" style="color:#5b6779">About</a> &middot; <a href="/privacy" style="color:#5b6779">Privacy</a> &middot; <a href="/image-credits/" style="color:#5b6779">Image credits</a>
  </div>
  <script defer src="/vocab-quiz.js"></script>
</body>
</html>`;
}

export function buildAgeFeelingsPages({ SITE, ROOT, distDir, writePage, escapeHtml, WORDS, faqSchemaFor, CATEGORY_NAMES }) {
  const crumbs = (items) => JSON.stringify({ '@context': 'https://schema.org', '@type': 'BreadcrumbList',
    itemListElement: items.map(([name, p], i) => ({ '@type': 'ListItem', position: i + 1, name, item: `${SITE}${p}` })) });
  const audio = (w) => `/audio/${w.word.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-')}.mp3`;
  const sayBtn = (w) => (existsSync(join(ROOT, 'public', audio(w))) ? `<button type="button" class="say" data-say="${audio(w)}" aria-label="Hear ${escapeHtml(w.word)}"><svg class="ic" aria-hidden="true" focusable="false" style="width:1.15em;height:1.15em;vertical-align:-.2em;flex:none"><use href="/icons.svg#i-volume-2"/></svg></button>` : '');
  const write = (path, html) => {
    const dir = join(distDir, ...path.split('/').filter(Boolean));
    mkdirSync(dir, { recursive: true });
    writePage(join(dir, 'index.html'), html);
  };
  const yearRow = (cur) => `<div class="links-row">${YEAR_PAGES.map((y) => `<a href="${yearPath(y.n)}"${y.n === cur ? ' aria-current="page"' : ''}>${y.n} year olds</a>`).join('')}<a href="/vocabulary/ages-11-12/">11 &amp; 12 year olds</a></div>`;
  const pages = [];

  for (const y of YEAR_PAGES) {
    const words = yearWords(y, WORDS);
    const path = yearPath(y.n);
    const levelName = y.level === 'beginner' ? 'beginner' : 'intermediate';
    const bracketLabel = y.bracket === 'ages-6-8' ? 'ages 6–8' : 'ages 9–10';
    const which = y.part[1] === 3 ? ['first', 'middle', 'last'][y.part[0]] + ' third' : ['first', 'second'][y.part[0]] + ' half';
    const cats = {};
    for (const w of words) cats[w.category] = (cats[w.category] || 0) + 1;
    const top = Object.entries(cats).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([c, n]) => `${(CATEGORY_NAMES[c] || c).toLowerCase()} (${n})`);
    const sample = words.slice(0, 8).map((w) => w.word);
    const title = `Vocabulary Words for ${y.n} Year Olds: ${words.length} Words With Meanings | Children Do English`;
    const description = `${words.length} English vocabulary words for ${y.n} year olds, each with a picture, a simple meaning, an example sentence and audio: ${sample.slice(0, 5).join(', ')} and more. Free, no sign-up.`;
    const answer = `Good vocabulary words for a ${y.n} year old: ${sample.join(', ')} and ${words.length - sample.length} more on this page. They are the ${which} of our ${levelName} list (for ${bracketLabel}), sorted from short, simple words to longer ones, and the biggest groups are ${top.join(', ')}.`;
    const faq = [
      { q: `How many new words should a ${y.n} year old learn?`, a: `About 3 to 5 new words a day is plenty for a ${y.n} year old: hear each word, see its picture, say it, and review it the next day. This list has ${words.length} words, so a few minutes a day covers it in about a month.` },
      { q: `What are some vocabulary words for ${y.n} year olds?`, a: `For example: ${words.slice(0, 15).map((w) => w.word).join(', ')}. Every word on this page has a picture, a short meaning and an example sentence.` },
      { q: 'How did you choose the words for each age?', a: `Every word on Children Do English has a level: beginner for ages 6–8 and intermediate for ages 9–10. Inside a level we sort the words from short and simple to longer ones and split them by year, so the ${y.n}-year-old page is the ${which} of the ${levelName} list.` },
    ];
    const rows = words.map((w) => `
        <tr><td><img src="${w.imageUrl}" alt="${escapeHtml(w.word)}" width="56" height="56" loading="lazy" /></td><td class="w"><a href="/vocabulary/${w.category}/${w.id}/">${escapeHtml(w.word)}</a></td><td>${sayBtn(w)}</td><td>${escapeHtml(w.definition)}</td><td class="ex">${escapeHtml(w.exampleSentence || '')}</td></tr>`).join('');
    write(path, shell({
      SITE, path, title: escapeHtml(title), description: escapeHtml(description),
      schemas: [crumbs([['Home', '/'], ['Vocabulary', '/vocabulary/'], [`Words for ${y.n} year olds`, path]]), faqSchemaFor(faq),
        JSON.stringify({ '@context': 'https://schema.org', '@type': 'DefinedTermSet', name: `Vocabulary words for ${y.n} year olds`, url: `${SITE}${path}`,
          hasDefinedTerm: words.map((w) => ({ '@type': 'DefinedTerm', name: w.word, description: w.definition, inDefinedTermSet: `${SITE}${path}` })) })],
      body: `  <div class="header"><h1>Vocabulary Words for ${y.n} Year Olds</h1><p>${words.length} words with pictures, meanings and audio</p></div>
  <div class="breadcrumb"><a href="/">Home</a> &rsaquo; <a href="/vocabulary/">Vocabulary</a> &rsaquo; Words for ${y.n} year olds</div>
  <div class="container">
    <a class="top-cta" href="/?utm_source=seo&amp;utm_medium=cta&amp;utm_content=year_${y.n}_top">Play these words free &mdash; no sign-up</a>
    <p class="intro answer-first">${escapeHtml(answer)}</p>
    ${yearRow(y.n)}
    <h2 class="sec">${words.length} words for ${y.n} year olds, with meanings</h2>
    <table class="wl"><thead><tr><th scope="col"><span style="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)">Picture</span></th><th scope="col">Word</th><th scope="col"><span style="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)">Audio</span></th><th scope="col">Meaning</th><th scope="col" class="exh">Example</th></tr></thead><tbody>${rows}
    </tbody></table>
    <p class="intro">All ${bracketLabel} words in one list, grouped by topic: <a href="/vocabulary/${y.bracket}/">vocabulary for ${bracketLabel}</a>. Printable: <a href="/printable-flashcards/">picture flashcards</a> and <a href="/printable-worksheets/">worksheets</a>.</p>
    <h2 class="sec">Questions parents ask</h2>
    ${faq.map((f) => `<div class="faq-item"><h3>${escapeHtml(f.q)}</h3><p>${escapeHtml(f.a)}</p></div>`).join('\n    ')}
  </div>`,
    }));
    pages.push(path);
  }

  // feelings list
  {
    const byId = new Map(WORDS.map((w) => [w.id, w]));
    const list = FEELINGS.filter(([id]) => byId.has(id)).map(([id, meaning, when, pair]) => ({ w: byId.get(id), meaning, when, pair: pair && byId.has(pair) ? byId.get(pair) : null }));
    const path = FEELINGS_PATH;
    const title = `Feelings Words for Kids: ${list.length} Emotions With Meanings | Children Do English`;
    const description = `${list.length} feelings words for kids with simple meanings: happy, sad, curious, brave, nervous, calm and more. What each one means, when you might feel it, a picture and audio. Free.`;
    const answer = `Feelings words for kids, with a meaning a child can understand: ${list.slice(0, 6).map((x) => x.w.word).join(', ')} and ${list.length - 6} more. For each word: what it means, when you might feel it, a picture and the word spoken aloud. Tap a word for its own page with a mini quiz.`;
    const faq = [
      { q: 'What are feelings words for kids?', a: `Feelings words (emotion words) name how we feel inside. The first ones children learn are happy, sad, angry and scared; then come words like ${list.slice(9, 15).map((x) => x.w.word).join(', ')}. This page has ${list.length} of them, each with a simple meaning.` },
      ...['curious', 'brave', 'nervous'].map((id) => list.find((x) => x.w.id === id)).filter(Boolean).map((x) => ({ q: `What does “${x.w.word}” mean for kids?`, a: `${x.meaning} You might feel ${x.w.word} ${x.when}.` })),
      { q: 'How can I help my child learn feelings words?', a: 'Name feelings as they happen (“You look proud of that drawing!”), ask “How do you feel?” with two choices, and read the faces in picture books together. A few words a week is enough.' },
    ];
    const cards = list.map(({ w, meaning, when, pair }) => `
    <div class="feel" id="${w.id}"><img src="${w.imageUrl}" alt="${escapeHtml(w.word)}" width="72" height="72" loading="lazy" />
      <div><h2><a href="/vocabulary/${w.category}/${w.id}/">${escapeHtml(w.word)}</a> ${sayBtn(w)}</h2>
      <p>${escapeHtml(meaning)}</p><p class="when">You might feel ${escapeHtml(w.word)} ${escapeHtml(when)}.</p>${pair ? `<p class="pair">The opposite feeling: <a href="#${pair.id}">${escapeHtml(pair.word)}</a></p>` : ''}</div></div>`).join('');
    write(path, shell({
      SITE, path, title: escapeHtml(title), description: escapeHtml(description),
      schemas: [crumbs([['Home', '/'], ['Vocabulary', '/vocabulary/'], ['Feelings words for kids', path]]), faqSchemaFor(faq),
        JSON.stringify({ '@context': 'https://schema.org', '@type': 'DefinedTermSet', name: 'Feelings words for kids', url: `${SITE}${path}`,
          hasDefinedTerm: list.map(({ w, meaning }) => ({ '@type': 'DefinedTerm', name: w.word, description: meaning, inDefinedTermSet: `${SITE}${path}` })) })],
      body: `  <div class="header"><h1>Feelings Words for Kids</h1><p>${list.length} emotions with simple meanings</p></div>
  <div class="breadcrumb"><a href="/">Home</a> &rsaquo; <a href="/vocabulary/">Vocabulary</a> &rsaquo; Feelings words for kids</div>
  <div class="container">
    <a class="top-cta" href="/games/feelings/?utm_source=seo&amp;utm_medium=cta&amp;utm_content=feelings_list_top">Play the feelings game free</a>
    <p class="intro answer-first">${escapeHtml(answer)}</p>
    ${cards}
    <p class="intro" style="margin-top:1rem">More: <a href="/vocabulary/feelings/">all feelings vocabulary</a> &middot; <a href="/printable-worksheets/feelings/">printable feelings worksheet</a> &middot; <a href="/printable-flashcards/feelings/">feelings flashcards</a></p>
    <h2 class="sec">Questions parents ask</h2>
    ${faq.map((f) => `<div class="faq-item"><h3>${escapeHtml(f.q)}</h3><p>${escapeHtml(f.a)}</p></div>`).join('\n    ')}
  </div>`,
    }));
    pages.push(path);
  }
  return pages;
}
