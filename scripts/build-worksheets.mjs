// Printable worksheets from the wave-2 games: /printable-worksheets/{opposites,feelings,action-verbs}/ + the index.
// Each sheet is ONE A4 page built from the game's own words and pictures (Microsoft Fluent Emoji 3D, MIT — one picture
// style per sheet), then an answer key on a second printed page. The order on each sheet is a fixed seeded shuffle, so
// the key printed with it always matches.
//
// HELD until the 11-14 SEO read (like PAGES_HOLD): built with noindex (generate-sitemap.js skips noindex pages) and
// linked from nowhere. After the read: set WORKSHEETS_HOLD = false and link /printable-worksheets/ from the
// printable-flashcards index, the game pages and /games/. English only — nothing on /he/ until then.
import { readFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import vm from 'vm';

export const WORKSHEETS_HOLD = true;

// the games' data files are browser scripts (window.X = …): run them in a sandbox to read the same lists the games use
function gameData(publicDir, file, global) {
  const sandbox = { window: {} };
  vm.runInNewContext(readFileSync(join(publicDir, file), 'utf-8'), sandbox);
  return sandbox.window[global];
}
function oppositesPairs(publicDir) {
  const src = readFileSync(join(publicDir, 'games/opposites/game.js'), 'utf-8');
  const m = src.match(/var PAIRS=(\[[\s\S]*?\n\]);/);
  return vm.runInNewContext(m[1].replace(/\/\/[^\n]*/g, ''));
}

// small seeded PRNG: the same sheet every build
function shuffle(list, seed) {
  let s = seed >>> 0;
  const rnd = () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const a = list.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
// a shuffle where no item stays next to its own partner row (a straight line across would give the answer away)
function derange(list, seed) {
  for (let k = 0; k < 200; k++) {
    const a = shuffle(list, seed + k);
    if (a.every((x, i) => x !== list[i])) return a;
  }
  throw new Error('worksheets: no derangement');
}
const LETTERS = 'ABCDEFGHIJKLMNOP';

export function worksheetData(publicDir) {
  const pairs = oppositesPairs(publicDir);
  const feel = gameData(publicDir, 'games/feelings/data.js', 'FEEL_DATA');
  const simon = gameData(publicDir, 'games/simon-says/data.js', 'SIMON_DATA');

  // Opposites: every pair; left = first word in game order, right = its opposite in a fixed shuffle
  const left = pairs.map((p) => p[0]);
  const right = derange(pairs.map((p) => p[1]), 11);
  const opposites = {
    left, right,
    key: left.map((w, i) => ({ n: i + 1, word: w, letter: LETTERS[right.indexOf(pairs[i][1])], match: pairs[i][1] })),
  };

  // Feelings A: a word and three faces; the two other faces are never one of its `also` (a fair second answer)
  const alsoOf = Object.fromEntries(feel.SITUATIONS.map((s) => [s.feel, s.also]));
  const fair = (w, o) => o !== w && !(alsoOf[w] || []).includes(o) && !(alsoOf[o] || []).includes(w);
  const circleWords = ['happy', 'angry', 'scared', 'tired', 'sick'];
  const circle = circleWords.map((w, i) => {
    const others = shuffle(feel.WORDS.filter((o) => fair(w, o)), 101 + i).slice(0, 2);
    const faces = shuffle([w, ...others], 201 + i);
    return { word: w, faces, answer: faces.indexOf(w) };
  });
  // Feelings B: five stories and five faces; no face may also fit another story on the sheet
  const pick = [];
  for (const s of shuffle(feel.SITUATIONS, 7)) {
    if (pick.length === 5) break;
    if (pick.every((p) => fair(p.feel, s.feel))) pick.push(s);
  }
  const storyFaces = derange(pick.map((s) => s.feel), 31);
  const feelings = {
    circle, stories: pick.map((s) => ({ text: s.text, feel: s.feel })), storyFaces,
    key: pick.map((s, i) => ({ n: i + 1, letter: LETTERS[storyFaces.indexOf(s.feel)], feel: s.feel })),
  };

  // Actions: ten actions with no look-alike pair on the sheet (the game never puts SIMILAR ones in one round)
  const similar = (a, b) => simon.SIMILAR.some((p) => p.includes(a) && p.includes(b));
  const actions = [];
  for (const id of Object.keys(simon.ACTIONS)) {
    if (actions.length === 10) break;
    if (actions.every((a) => !similar(a, id))) actions.push(id);
  }
  const phrases = derange(actions, 51);
  const actionSheet = {
    pics: actions, phrases: phrases.map((id) => ({ id, say: simon.ACTIONS[id].say })),
    key: actions.map((id, i) => ({ n: i + 1, letter: LETTERS[phrases.indexOf(id)], say: simon.ACTIONS[id].say })),
  };
  return { opposites, feelings, actions: actionSheet };
}

const CSS = `
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: system-ui, -apple-system, 'Segoe UI', sans-serif; background: #eff6ff; color: #1e293b; line-height: 1.6; }
    .header { background: #2563eb; color: #fff; padding: 2rem 1rem; text-align: center; }
    .header h1 { font-size: 1.6rem; margin-bottom: 0.25rem; line-height: 1.3; }
    .header p { opacity: 0.92; font-size: 0.95rem; }
    .breadcrumb { padding: 0.75rem 1rem; font-size: 0.85rem; color: #4b5a6e; max-width: 860px; margin: 0 auto; }
    .breadcrumb a { color: #2563eb; text-decoration: underline; }
    .container { max-width: 860px; margin: 0 auto; padding: 0 1rem 2rem; }
    .intro { margin-bottom: 1rem; color: #475569; }
    .print-btn { display: inline-block; background: #2563eb; color: #fff; padding: 0.7rem 1.5rem; border-radius: 0.5rem; font-weight: 700; font-size: 1rem; cursor: pointer; border: 0; min-height: 44px; margin: 0 0.5rem 1.25rem 0; }
    .play-online { display: inline-block; margin: 0 0 1.25rem; color: #0f766e; font-weight: 700; text-decoration: underline; }
    .sheet { background: #fff; border-radius: 0.75rem; padding: 1.25rem; box-shadow: 0 1px 3px rgba(0,0,0,0.08); margin-bottom: 1.5rem; }
    .sheet h2 { font-size: 1.3rem; margin-bottom: 0.2rem; }
    .sheet .task { color: #334155; margin-bottom: 0.75rem; }
    .sheet .task-b { margin-top: 0.8rem; }
    .name-line { display: flex; gap: 1.5rem; margin-bottom: 0.9rem; color: #334155; font-size: 0.95rem; flex-wrap: wrap; }
    .name-line span { flex: 1; min-width: 8rem; border-bottom: 1.5px solid #94a3b8; padding-bottom: 0.1rem; }
    .cols { display: flex; justify-content: space-between; gap: 1rem; }
    .col { display: flex; flex-direction: column; gap: 0.45rem; }
    .item { display: flex; align-items: center; gap: 0.5rem; }
    .col.r .item { flex-direction: row-reverse; }
    .item img { width: 64px; height: 64px; object-fit: contain; flex: none; }
    .item .w { font-size: 1.15rem; font-weight: 800; min-width: 4.5rem; }
    .item .n { font-weight: 800; color: #2563eb; min-width: 1.6rem; text-align: center; }
    .dot { width: 12px; height: 12px; border-radius: 50%; background: #1e293b; flex: none; }
    .row3 { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.4rem; flex-wrap: wrap; }
    .row3 .w { font-size: 1.15rem; font-weight: 800; min-width: 5.5rem; }
    .row3 img { width: 60px; height: 60px; object-fit: contain; }
    .story { display: flex; gap: 0.5rem; align-items: baseline; margin-bottom: 0.35rem; }
    .box { display: inline-block; width: 2rem; height: 1.8rem; border: 1.5px solid #64748b; border-radius: 0.3rem; flex: none; }
    .faces { display: flex; gap: 0.9rem; flex-wrap: wrap; margin: 0.6rem 0 0.25rem; }
    .faces figure { text-align: center; font-weight: 800; color: #2563eb; }
    .faces img { width: 60px; height: 60px; object-fit: contain; display: block; }
    .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem 1rem; }
    .pic { display: flex; align-items: center; gap: 0.5rem; }
    .pic img { width: 64px; height: 64px; object-fit: contain; }
    .phrases { display: grid; grid-template-columns: 1fr 1fr; gap: 0.35rem 1rem; margin-top: 0.9rem; font-size: 1.05rem; }
    .phrases b { color: #2563eb; margin-right: 0.35rem; }
    .key h2 { font-size: 1.1rem; }
    .key ol { margin: 0.4rem 0 0 1.5rem; } .key li { margin-bottom: 0.15rem; }
    .credit { font-size: 0.8rem; color: #5b6779; margin-top: 0.75rem; }
    .credit a { color: #5b6779; }
    .cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(230px, 1fr)); gap: 1rem; }
    .card { background: #fff; border-radius: 0.75rem; padding: 1rem; box-shadow: 0 1px 3px rgba(0,0,0,0.08); text-decoration: none; color: inherit; display: block; }
    .card img { width: 72px; height: 72px; object-fit: contain; }
    .card h2 { font-size: 1.15rem; color: #1e40af; text-decoration: underline; }
    footer { text-align: center; font-size: 0.85rem; color: #5b6779; padding: 1.5rem 1rem; }
    footer a { color: #5b6779; }
    @media (max-width: 480px) {
      .item img, .row3 img, .faces img, .pic img { width: 52px; height: 52px; }
      .item img { width: 44px; height: 44px; }
      .item { gap: 0.3rem; } .cols { gap: 0.5rem; } .sheet { padding: 1rem 0.75rem; }
      .item .w { min-width: 0; font-size: 0.95rem; } .item .n { min-width: 1.1rem; }
      .grid2, .phrases { grid-template-columns: 1fr; }
    }
    @page { size: A4 portrait; margin: 12mm; }
    @media print {
      body { background: #fff; }
      .header, .breadcrumb, .intro, .print-btn, .play-online, footer, .crawl-mesh, .no-print { display: none !important; }
      .container { max-width: none; padding: 0; }
      .sheet { box-shadow: none; border-radius: 0; padding: 0; margin: 0; }
      .sheet.key { break-before: page; page-break-before: always; }
      .item img, .row3 img, .faces img, .pic img { width: 64px; height: 64px; }
      .grid2, .phrases { grid-template-columns: 1fr 1fr; }
      img { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
`;

const img = (src, alt) => `<img src="${src}" alt="${alt}" width="64" height="64">`;
const CREDIT = '<p class="credit">Pictures: Microsoft Fluent Emoji 3D (MIT License) · <a href="/image-credits/">Image credits</a></p>';
const NAME_LINE = '<div class="name-line"><span>Name:</span><span>Date:</span></div>';

function page({ SITE, path, title, h1, sub, intro, body, crumb, playHref }) {
  const url = `${SITE}${path}`;
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <meta name="description" content="${sub}">
${WORKSHEETS_HOLD ? '  <meta name="robots" content="noindex">\n' : ''}  <link rel="canonical" href="${url}">
  <style>${CSS}</style>
</head>
<body>
  <div class="header"><h1>${h1}</h1><p>${sub}</p></div>
  <nav class="breadcrumb"><a href="/">Home</a> › ${crumb}</nav>
  <main class="container">
    <p class="intro">${intro}</p>
    <button class="print-btn" type="button" data-print>Print the worksheet</button>${playHref ? `<a class="play-online" href="${playHref}">Play the game online</a>` : ''}
${body}
  </main>
  <footer><a href="/">Children Do English</a> &middot; <a href="/image-credits/">Image credits</a> &middot; <a href="/privacy">Privacy</a></footer>
  <script defer src="/print-btn.js"></script>
</body>
</html>
`;
}

const CRUMB = (name) => `<a href="/printable-worksheets/">Printable worksheets</a> › ${name}`;

function oppositesPage(SITE, d, esc) {
  const L = (w) => `/games/opposites/img/${w}.webp`;
  const leftCol = d.left.map((w, i) => `<div class="item" data-n="${i + 1}" data-word="${w}"><span class="n">${i + 1}</span>${img(L(w), w)}<span class="w">${esc(w)}</span><span class="dot"></span></div>`).join('\n');
  const rightCol = d.right.map((w, i) => `<div class="item" data-letter="${LETTERS[i]}" data-word="${w}"><span class="n">${LETTERS[i]}</span>${img(L(w), w)}<span class="w">${esc(w)}</span><span class="dot"></span></div>`).join('\n');
  const key = d.key.map((k) => `<li data-n="${k.n}" data-letter="${k.letter}">${esc(k.word)} → <b>${k.letter}</b> ${esc(k.match)}</li>`).join('');
  const body = `<section class="sheet" id="sheet">
  <h2>Opposites</h2><p class="task">Draw a line from each word to its opposite.</p>${NAME_LINE}
  <div class="cols"><div class="col l">${leftCol}</div><div class="col r">${rightCol}</div></div>${CREDIT}
</section>
<section class="sheet key" id="key"><h2>Answer key: Opposites</h2><ol>${key}</ol></section>`;
  return page({ SITE, path: '/printable-worksheets/opposites/', title: 'Opposites Worksheet for Kids (Free Printable) | Children Do English',
    h1: 'Opposites worksheet', sub: `Free printable opposites worksheet: match ${d.left.length} pairs like hot and cold, big and small. With pictures and an answer key.`,
    intro: `Children draw a line from each word to its opposite: ${d.left.slice(0, 3).join(', ')} and more. One A4 page with pictures, then an answer key on page 2.`,
    body, crumb: CRUMB('Opposites'), playHref: '/games/opposites/' });
}

function feelingsPage(SITE, d, esc) {
  const F = (w) => `/games/feelings/img/${w}.webp`;
  const rows = d.circle.map((r, i) => `<div class="row3" data-word="${r.word}" data-answer="${r.answer}"><span class="w">${i + 1}. ${esc(r.word)}</span>${r.faces.map((f) => img(F(f), 'a face')).join('')}</div>`).join('\n');
  const stories = d.stories.map((s, i) => `<div class="story" data-n="${i + 1}"><span class="box"></span><span>${i + 1}. ${esc(s.text)}</span></div>`).join('\n');
  const faces = d.storyFaces.map((f, i) => `<figure data-letter="${LETTERS[i]}" data-feel="${f}">${img(F(f), 'a face')}${LETTERS[i]}</figure>`).join('');
  const keyA = d.circle.map((r, i) => `<li data-word="${r.word}">${esc(r.word)}: face ${r.answer + 1} of 3</li>`).join('');
  const keyB = d.key.map((k) => `<li data-n="${k.n}" data-letter="${k.letter}"><b>${k.letter}</b> (${esc(k.feel)})</li>`).join('');
  const body = `<section class="sheet" id="sheet">
  <h2>Feelings</h2>${NAME_LINE}
  <p class="task"><b>A.</b> Read the word. Circle the face that shows it.</p>
  ${rows}
  <p class="task task-b"><b>B.</b> Read each sentence. How does the child feel? Write the letter of the face in the box.</p>
  ${stories}
  <div class="faces">${faces}</div>${CREDIT}
</section>
<section class="sheet key" id="key"><h2>Answer key: Feelings</h2><p><b>A.</b></p><ol>${keyA}</ol><p><b>B.</b></p><ol>${keyB}</ol></section>`;
  return page({ SITE, path: '/printable-worksheets/feelings/', title: 'Feelings Worksheet for Kids: Emotions in English (Free Printable) | Children Do English',
    h1: 'Feelings worksheet', sub: 'Free printable feelings and emotions worksheet: circle the face, then read short sentences and match the feeling. With an answer key.',
    intro: 'Two short tasks on one A4 page: circle the face for happy, angry, scared, tired and sick, then read five short sentences and match each to a face. The answer key prints on page 2.',
    body, crumb: CRUMB('Feelings'), playHref: '/games/feelings/' });
}

function actionsPage(SITE, d, esc) {
  const A = (id) => `/games/simon-says/img/${id}.webp`;
  const pics = d.pics.map((id, i) => `<div class="pic" data-n="${i + 1}" data-id="${id}"><span class="box"></span>${img(A(id), 'an action')}<b>${i + 1}</b></div>`).join('\n');
  const phrases = d.phrases.map((p, i) => `<div data-letter="${LETTERS[i]}" data-id="${p.id}"><b>${LETTERS[i]}</b>${esc(p.say)}</div>`).join('');
  const key = d.key.map((k) => `<li data-n="${k.n}" data-letter="${k.letter}"><b>${k.letter}</b> ${esc(k.say)}</li>`).join('');
  const body = `<section class="sheet" id="sheet">
  <h2>Action verbs</h2><p class="task">Look at each picture. Write the letter of the action in the box.</p>${NAME_LINE}
  <div class="grid2">${pics}</div>
  <div class="phrases">${phrases}</div>${CREDIT}
</section>
<section class="sheet key" id="key"><h2>Answer key: Action verbs</h2><ol>${key}</ol></section>`;
  return page({ SITE, path: '/printable-worksheets/action-verbs/', title: 'Action Verbs Worksheet for Kids (Free Printable) | Children Do English',
    h1: 'Action verbs worksheet', sub: `Free printable action verbs worksheet: match ${d.pics.length} pictures to actions like clap your hands, swim and dance. With an answer key.`,
    intro: `Children match ${d.pics.length} action pictures to the words, from the actions in our Simon Says game. One A4 page, answer key on page 2.`,
    body, crumb: CRUMB('Action verbs'), playHref: '/games/simon-says/' });
}

function indexPage(SITE) {
  const cards = [
    ['opposites', 'Opposites', 'Draw a line from each word to its opposite.', '/games/opposites/img/hot.webp'],
    ['feelings', 'Feelings', 'Circle the face, then match short sentences to feelings.', '/games/feelings/img/happy.webp'],
    ['action-verbs', 'Action verbs', 'Match action pictures to the words.', '/games/simon-says/img/clap.webp'],
  ].map(([id, name, what, pic]) => `<a class="card" href="/printable-worksheets/${id}/">${img(pic, '')}<h2>${name}</h2><p>${what}</p></a>`).join('\n');
  return page({ SITE, path: '/printable-worksheets/', title: 'Free Printable English Worksheets for Kids | Children Do English',
    h1: 'Printable English worksheets', sub: 'Free one-page English worksheets for kids: opposites, feelings and action verbs, with pictures and answer keys.',
    intro: 'Each worksheet is one A4 page with pictures, plus an answer key on page 2. They use the words and pictures from our online games, so children can print the sheet and then play the game.',
    body: `<div class="cards">${cards}</div>`, crumb: 'Printable worksheets' })
    .replace('<button class="print-btn" type="button" data-print>Print the worksheet</button>', '');
}

export function buildWorksheets({ SITE, distDir, publicDir, writePage, escapeHtml }) {
  const d = worksheetData(publicDir);
  const out = [
    ['printable-worksheets', indexPage(SITE)],
    ['printable-worksheets/opposites', oppositesPage(SITE, d.opposites, escapeHtml)],
    ['printable-worksheets/feelings', feelingsPage(SITE, d.feelings, escapeHtml)],
    ['printable-worksheets/action-verbs', actionsPage(SITE, d.actions, escapeHtml)],
  ];
  for (const [dir, html] of out) {
    mkdirSync(join(distDir, dir), { recursive: true });
    writePage(join(distDir, dir, 'index.html'), html);
  }
  return out.length;
}
