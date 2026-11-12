// Game-first card (owner OK 11-12): category pages (/vocabulary/<c>/ + /hebrew/ + /spanish/) and unit pages
// (/units/<book>/unit-<n>/) open with "Play <game> with these words" above the word list. 28-day data: the games hub
// turns 63-72% of views into a play and a game page keeps 42-58% for 15 s, but a category page only 6% and a unit 4%.
// The games are frozen (live until the 11-28 read), so this only LINKS them with the inputs they already take:
//   word-zapper  ?topic=animals|food|transport|things|nature  or  ?words=<CDE word ids>   (>= 4 ids it knows)
//   word-memory  ?topic=animals|food|toys|home|clothing|transport
//   category-conveyor / spelling-forge  ?words=<ids>   (conveyor: the ids must span >= 2 of its bins)
// The ?words= filter is the one the app's mode ladder uses (src/App.jsx). Anything a game can't take gets the best
// general game instead (match: false → the copy says "a free word game", not "these words").
// public/land-beacon.js counts the click as a `cta`: its PLAY regex takes /games/<id>/ (the query is not in the path).
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

export const GAME_NAMES = {
  'word-zapper': 'Word Zapper', 'word-memory': 'Word Memory', 'category-conveyor': 'Category Conveyor',
  'spelling-forge': 'Spelling Forge', feelings: 'Feelings', 'simon-says': 'Simon Says',
};

// category → [game, query] where the game takes this topic itself; others get ?words= (below) or a general game
const CATEGORY_TOPIC = {
  animals: ['word-zapper', 'topic=animals'],
  food: ['word-zapper', 'topic=food'],
  transport: ['word-zapper', 'topic=transport'],
  nature: ['word-zapper', 'topic=nature'],
  everyday: ['word-zapper', 'topic=things'],
  home: ['word-memory', 'topic=home'],
  clothing: ['word-memory', 'topic=clothing'],
  toys: ['word-memory', 'topic=toys'],
  feelings: ['feelings', ''],
};
// categories with no topic game: ?words= into the game that knows enough of their words (colors → Zapper's 8 colours,
// numbers → Forge's 6 number words); school and sports have too few game words, so they get a general game
const CATEGORY_WORDS_GAME = { colors: 'word-zapper', numbers: 'spelling-forge' };
const CATEGORY_GENERAL = { school: 'word-zapper', sports: 'simon-says' };
const MIN_WORDS = 6; // the games accept 4; 6 keeps a run from repeating the same few pictures

// {id → {cat?, topic?}} for a game's word list, read from its (frozen) game.js — never edited here
const _known = {};
export function gameWords(root, id) {
  if (_known[id]) return _known[id];
  const src = readFileSync(join(root, 'public', 'games', id, 'game.js'), 'utf8');
  const out = new Map();
  for (const m of src.matchAll(/\{\s*id:\s*'([a-z0-9_-]+)'([^}]*)\}/g)) {
    const cat = (m[2].match(/\bcat:\s*'([a-z]+)'/) || [])[1];
    out.set(m[1], { cat });
  }
  return (_known[id] = out);
}

// ids the game would accept for ?words= (its own guard: >= 4 known ids; conveyor's bins >= 2), or null
function wordsFor(root, game, ids) {
  const known = gameWords(root, game);
  const hit = [...new Set(ids)].filter((i) => known.has(i));
  if (hit.length < MIN_WORDS) return null;
  if (game === 'category-conveyor' && new Set(hit.map((i) => known.get(i).cat)).size < 2) return null;
  return hit;
}

// → { id, name, query, match }   query is the raw query string without '?' (may be '')
export function gameForCategory(root, slug, words) {
  if (CATEGORY_TOPIC[slug]) { const [id, query] = CATEGORY_TOPIC[slug]; return { id, name: GAME_NAMES[id], query, match: true }; }
  const g = CATEGORY_WORDS_GAME[slug];
  const hit = g && wordsFor(root, g, words.map((w) => w.id));
  if (hit) return { id: g, name: GAME_NAMES[g], query: `words=${hit.join(',')}`, match: true };
  const id = CATEGORY_GENERAL[slug] || 'word-zapper';
  return { id, name: GAME_NAMES[id], query: '', match: false };
}

// unit pages: the ?words= game that knows the most of the unit's CDE words (ties → Zapper, the most played)
export function gameForWordIds(root, ids) {
  let best = null;
  for (const g of ['word-zapper', 'category-conveyor', 'spelling-forge']) {
    const hit = wordsFor(root, g, ids);
    if (hit && (!best || hit.length > best.hit.length)) best = { g, hit };
  }
  if (best) return { id: best.g, name: GAME_NAMES[best.g], query: `words=${best.hit.join(',')}`, match: true };
  return { id: 'word-zapper', name: GAME_NAMES['word-zapper'], query: '', match: false };
}

const SUB = {
  'word-zapper': { en: 'Hear a word, then zap its picture.', he: 'שומעים מילה באנגלית ופוגעים בתמונה שלה.', es: 'Escucha una palabra y atrapa su imagen.' },
  'word-memory': { en: 'Flip the cards and match each picture to its word.', he: 'הופכים קלפים ומתאימים כל תמונה למילה שלה.', es: 'Voltea las cartas y une cada imagen con su palabra.' },
  'category-conveyor': { en: 'Sort each picture into the right group.', he: 'ממיינים כל תמונה לקבוצה הנכונה.', es: 'Pon cada imagen en el grupo correcto.' },
  'spelling-forge': { en: 'See the picture, hear the word, spell it.', he: 'רואים תמונה, שומעים מילה ומאייתים אותה.', es: 'Mira la imagen, escucha la palabra y deletréala.' },
  feelings: { en: 'Match feeling words to faces.', he: 'מתאימים מילים של רגשות לפרצופים.', es: 'Une las palabras de emociones con las caras.' },
  'simon-says': { en: 'Hear an action word and tap its picture.', he: 'שומעים פועל באנגלית ולוחצים על התמונה שלו.', es: 'Escucha una acción y toca su imagen.' },
};
const ic = (n) => `<svg class="ic" aria-hidden="true" focusable="false" style="width:1.15em;height:1.15em;vertical-align:-.2em;flex:none"><use href="/icons.svg#i-${n}"/></svg>`;

// lang: 'en' | 'he' | 'es' (the card's copy and the game's ?lang=); scope: 'category' | 'unit'; content = utm_content
export function gameFirstCard(game, { lang = 'en', scope = 'category', content }) {
  const nameEn = `<bdi lang="en" dir="ltr">${game.name}</bdi>`;
  const head = {
    en: game.match ? `Play ${game.name} with these words` : `Play ${game.name}, a free word game`,
    he: game.match ? `משחקים ב-${nameEn} עם ${scope === 'unit' ? 'מילים מהיחידה' : 'המילים האלה'}` : `משחק מילים באנגלית: ${nameEn}`,
    es: game.match ? `Juega a ${nameEn} con estas palabras` : `Juega a ${nameEn}, un juego de palabras gratis`,
  }[lang];
  const free = { en: 'Free, no sign-up.', he: 'חינם, בלי הרשמה.', es: 'Gratis, sin registro.' }[lang];
  const q = [game.query, lang !== 'en' ? `lang=${lang}` : '', `utm_source=seo&utm_medium=game_first&utm_content=${content}`].filter(Boolean).join('&');
  const href = `/games/${game.id}/?${q}`.replace(/&/g, '&amp;');
  const dir = lang === 'he' ? ' lang="he" dir="rtl"' : lang === 'es' ? ' lang="es"' : '';
  return `<a class="game-first" data-game-first="${game.id}" href="${href}"${dir}>
      <img class="gf-shot" src="/games/${game.id}/shot.webp" alt="" width="128" height="80" />
      <span class="gf-text"><strong class="gf-head">${head}</strong><span class="gf-sub">${SUB[game.id][lang]} ${free}</span></span>
      <span class="gf-go" aria-hidden="true">${ic('play')}</span>
    </a>`;
}

export const GAME_FIRST_CSS = `
    .game-first { display: flex; align-items: center; gap: 0.85rem; background: #fff; border: 3px solid #f59e0b; border-radius: 1rem; padding: 0.75rem; margin: 0 auto 1.25rem; max-width: 640px; text-decoration: none; color: #1e293b; box-shadow: 0 3px 10px rgba(0,0,0,0.12); }
    .game-first:hover, .game-first:focus-visible { border-color: #b45309; }
    .game-first:focus-visible { outline: 3px solid #2563eb; outline-offset: 2px; }
    .gf-shot { width: 128px; height: 80px; flex: none; border-radius: 0.6rem; object-fit: cover; background: #e2e8f0; }
    .gf-text { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 0.15rem; }
    .gf-head { font-size: 1.1rem; font-weight: 800; line-height: 1.3; color: #92400e; }
    .gf-head bdi { white-space: nowrap; }
    .gf-sub { font-size: 0.9rem; color: #475569; line-height: 1.4; }
    .gf-go { flex: none; width: 48px; height: 48px; border-radius: 50%; background: #b45309; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 1.3rem; }
    @media (max-width: 420px) { .gf-shot { width: 88px; height: 55px; } .gf-head { font-size: 1rem; } .gf-go { width: 40px; height: 40px; } }
`;
