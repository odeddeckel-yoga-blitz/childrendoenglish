/**
 * Projector mode (roadmap X1): one big screen for the whole class. The teacher picks
 * what to show (a picture, the English word, or only the sound) and a topic or a textbook
 * unit; each card waits for the class to answer out loud, then "Show answer" reveals the
 * English word, its Hebrew meaning and the audio. Keyboard: Space/→/PageDown next, Enter/↓ answer,
 * S sound, F full screen, Esc back. Words = Class Battle's photo words (battle-core.js).
 * No accounts, nothing stored or sent beyond the page-view tally.
 */
import { BATTLE_CATEGORIES, BATTLE_UNIT_CATEGORIES, wordPool } from '../battle/battle-core.js';

const $ = (id) => document.getElementById(id);
const DECK = 20;
const HEB = (() => {
  try {
    const q = new URLSearchParams(location.search).get('lang');
    if (q === 'he' || q === 'en') return q === 'he';
    return localStorage.getItem('cde_lang') === 'he';
  } catch { return false; }
})();

const TXT = HEB ? {
  tTitle: 'מצב מקרן', tSub: 'לכל הכיתה על מסך אחד גדול: מציגים תמונה, הכיתה אומרת יחד את המילה באנגלית, ואז חושפים אותה עם ההגייה והפירוש בעברית. בלי חשבונות, שום דבר לא נשמר.',
  tShow: 'מה להציג', tTopic: 'מילים', tGo: 'התחלה', tReveal: 'הצגת התשובה', tNext: 'הבא',
  tKeys: 'רווח = הבא · Enter = התשובה · S = שמע · F = מסך מלא · Esc = חזרה',
} : null;
const MODES = [
  { id: 'pic', en: '🖼️ Picture → say the word', he: '🖼️ תמונה ← אומרים את המילה' },
  { id: 'word', en: '🔤 English word → say the meaning', he: '🔤 מילה באנגלית ← אומרים מה היא אומרת' },
  { id: 'ear', en: '👂 Sound only → say the word', he: '👂 רק שמע ← אומרים את המילה' },
];
const CATS_HE = { mix: 'הכול מעורבב', animals: 'חיות', food: 'אוכל', everyday: 'חפצים', colors: 'צבעים', numbers: 'מספרים', home: 'בבית', transport: 'תחבורה', nature: 'טבע', feelings: 'רגשות', clothing: 'בגדים', school: 'בית ספר', sports: 'ספורט', toys: 'צעצועים' };

const S = { mode: 'pic', cat: 'animals', deck: [], i: 0, shown: false };
window.__projectorDbg = S; // harness hook

function applyLang() {
  const t = document.querySelector('.langToggle');
  const u = new URL(location.href);
  u.searchParams.set('lang', HEB ? 'en' : 'he');
  t.href = u.pathname + u.search;
  t.textContent = HEB ? 'English' : 'עברית';
  if (!HEB) return;
  document.documentElement.lang = 'he';
  document.documentElement.dir = 'rtl';
  for (const [id, s] of Object.entries(TXT)) if ($(id)) $(id).textContent = s;
}

function chips(el, items, sel, onPick) {
  el.replaceChildren(...items.map((it) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'chip';
    b.textContent = it.label;
    b.dataset.id = it.id;
    b.setAttribute('aria-pressed', String(it.id === sel()));
    b.addEventListener('click', () => { onPick(it.id); for (const x of el.children) x.setAttribute('aria-pressed', String(x.dataset.id === it.id)); });
    return b;
  }));
}

function shuffle(a) {
  const r = a.slice();
  for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; }
  return r;
}

function say() { const w = S.deck[S.i]; if (w && window.cdeSay) window.cdeSay(w.w); }

function render() {
  const w = S.deck[S.i];
  const stage = $('stage'), ans = $('answer');
  stage.replaceChildren(); ans.replaceChildren();
  if (S.mode === 'pic') {
    const img = document.createElement('img');
    img.src = w.img; img.alt = '';
    stage.append(img);
  } else if (S.mode === 'word') {
    const d = document.createElement('div');
    d.className = 'bigword'; d.lang = 'en'; d.dir = 'ltr'; d.textContent = w.w;
    stage.append(d);
  } else {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'ear'; b.textContent = '👂🔊'; b.setAttribute('aria-label', 'Play the word');
    b.addEventListener('click', say);
    stage.append(b);
    say();
  }
  if (S.shown) {
    if (S.mode !== 'pic') { const img = document.createElement('img'); img.src = w.img; img.alt = ''; stage.replaceChildren(img); }
    const en = document.createElement('div'); en.className = 'en'; en.lang = 'en'; en.dir = 'ltr'; en.textContent = w.w;
    const he = document.createElement('div'); he.className = 'he'; he.lang = 'he'; he.dir = 'rtl'; he.textContent = w.he || '';
    ans.append(en, he);
  }
  $('show').classList.toggle('revealed', S.shown);
  $('count').textContent = `${S.i + 1} / ${S.deck.length}`;
  $('bReveal').disabled = S.shown;
}

function reveal() { if (S.shown) return; S.shown = true; render(); say(); }
function next() {
  if (!S.shown) { reveal(); return; } // Next on a hidden card reveals first, so nothing is skipped by accident
  S.i = (S.i + 1) % S.deck.length;
  if (S.i === 0) S.deck = shuffle(S.deck);
  S.shown = false; render();
}
function start() {
  S.deck = shuffle(wordPool(S.cat)).slice(0, DECK);
  if (!S.deck.length) return;
  S.i = 0; S.shown = false;
  $('setup').hidden = true; $('show').hidden = false;
  render();
}
function back() {
  $('show').hidden = true; $('setup').hidden = false;
  try { if (document.fullscreenElement) document.exitFullscreen(); } catch { /* not supported */ }
}
function full() {
  try { if (document.fullscreenElement) document.exitFullscreen(); else document.documentElement.requestFullscreen(); } catch { /* not supported */ }
}

function boot() {
  applyLang();
  chips($('modeGrid'), MODES.map((m) => ({ id: m.id, label: HEB ? m.he : m.en })), () => S.mode, (id) => { S.mode = id; });
  const unit = new URLSearchParams(location.search).get('unit');
  const cats = [...BATTLE_CATEGORIES, ...BATTLE_UNIT_CATEGORIES];
  if (unit && cats.some((c) => c.id === unit)) S.cat = unit;
  chips($('catGrid'), cats.map((c) => ({ id: c.id, label: `${c.emoji} ${HEB && CATS_HE[c.id] ? CATS_HE[c.id] : `\u2066${c.label}\u2069`}` })), () => S.cat, (id) => { S.cat = id; });
  $('go').addEventListener('click', start);
  $('bNext').addEventListener('click', next);
  $('bReveal').addEventListener('click', reveal);
  $('bSay').addEventListener('click', say);
  $('bBack').addEventListener('click', back);
  $('bFull').addEventListener('click', full);
  document.addEventListener('keydown', (e) => {
    if ($('show').hidden || e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.key === ' ' || e.key === 'ArrowRight' || e.key === 'PageDown') { e.preventDefault(); next(); }
    else if (e.key === 'Enter' || e.key === 'ArrowDown') { e.preventDefault(); reveal(); }
    else if (e.key === 's' || e.key === 'S') say();
    else if (e.key === 'f' || e.key === 'F') full();
    else if (e.key === 'Escape') back();
  });
}

boot();
