// Shared checks for the wave-3 game specs (letter-drop, shopping-list, blend-it, 11-12): the same phone-fit, language,
// contrast and end-card rules the wave-1/2 specs spell out inline, in one place.
import fs from 'fs';
import path from 'path';
import { WORDS } from '../../src/data/words.js';

// "Removed Words (NEVER re-add)" — same list as e2e/missing-letter.spec.js
export const REMOVED = ('soap roof blanket grape crayon baby drizzle rainy windy cloudy sunny karate gymnasium lunchbox homework skirt ' +
  'pajamas forehead chin neck cloud snow ice storm fog hail hurricane tornado frost avalanche dancing wrestling treasure head ' +
  'nose mouth arm shoulder knee elbow ankle wrist chest hip cheek belly desk chalk marker overalls apron ferry pair ivory coral ' +
  'teal pebble attic basket sticker ribbon whisper rug back teeth lips tummy leg face palm toe tongue hair bandana slippers ' +
  'bowtie textbook glue hiking jumping fencing blocks swing pinwheel sled marble puppet yoga bracelet beret poncho poster ' +
  'grumpy cheerful diving pond garage raft').split(' ');
export const BODY = 'hand foot ear eye nose finger thumb tooth toe knee arm leg head hair face mouth lips teeth heart'.split(' ');
const PUB = path.resolve('public');
const DRAWN = JSON.parse(fs.readFileSync(path.join(PUB, 'games', 'image-style.js'), 'utf8').match(/\[.*\]/)[0]);

// Every word: a CDE word with its own photo (not a drawing: one style per round) and audio, never removed, never a body part.
export function badWords(ids) {
  const byId = Object.fromEntries(WORDS.map((w) => [w.id, w]));
  const bad = [];
  for (const id of new Set(ids)) {
    const w = byId[id];
    if (!w) { bad.push(`${id}: not in WORDS`); continue; }
    if (w.imageUrl !== `/images/${id}.webp`) bad.push(`${id}: imageUrl ${w.imageUrl}`);
    if (!fs.existsSync(path.join(PUB, 'images', id + '.webp'))) bad.push(`${id}: no image file`);
    if (!fs.existsSync(path.join(PUB, 'audio', id + '.mp3'))) bad.push(`${id}: no audio file`);
    if (REMOVED.includes(id)) bad.push(`${id}: removed word`);
    if (BODY.includes(id)) bad.push(`${id}: body part`);
    if (DRAWN.includes(id)) bad.push(`${id}: drawn picture (photos only)`);
  }
  return bad;
}

// Chi-square on answer positions (p = 0.001 critical values for 2..9 slots).
export function chiOk(positions, n) {
  const counts = Array(n).fill(0); positions.forEach((p) => counts[p]++);
  const exp = positions.length / n, chi = counts.reduce((a, c) => a + (c - exp) ** 2 / exp, 0);
  return { ok: chi < [0, 0, 10.83, 13.82, 16.27, 18.47, 20.52, 22.46, 24.32, 26.12][n], chi, counts };
}

// Controls off screen, under 44 px, or a sideways scroll. sels = CSS selectors of what must be on screen;
// tap = the subset that are tap targets.
export async function fitProblems(page, sels, tap = sels) {
  return page.evaluate(({ sels, tap }) => {
    const bad = [], W = innerWidth, H = innerHeight;
    if (document.documentElement.scrollWidth > W) bad.push('sideways scroll ' + document.documentElement.scrollWidth);
    for (const s of sels) {
      const els = [...document.querySelectorAll(s)].filter((e) => e.getClientRects().length && getComputedStyle(e).visibility !== 'hidden');
      if (!els.length) bad.push(`${s}: not shown`);
      for (const e of els) {
        const r = e.getBoundingClientRect();
        if (r.top < -0.5 || r.left < -0.5 || r.bottom > H + 0.5 || r.right > W + 0.5) bad.push(`${s} off screen ${Math.round(r.left)},${Math.round(r.top)} ${Math.round(r.width)}x${Math.round(r.height)} in ${W}x${H}`);
        if (tap.includes(s) && (r.width < 44 || r.height < 44)) bad.push(`${s} ${Math.round(r.width)}x${Math.round(r.height)} < 44`);
      }
    }
    return bad;
  }, { sels, tap });
}

// Wrong-language interface text on screen: Hebrew outside [lang=he] in en/es, and this game's own English strings
// (CDE_STRINGS.en) still showing in he/es. Game content (English words) is English by design.
export async function leak(page) {
  return page.evaluate(() => {
    const out = [], re = /[֐-׿]/, lang = window.CDE_LANG;
    if (lang !== 'he') {
      const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      for (let n = w.nextNode(); n; n = w.nextNode()) {
        const t = n.nodeValue.trim(), el = n.parentElement;
        if (!t || !re.test(t) || !el || el.closest('[lang="he"], script, style, [hidden], [aria-hidden="true"]') || !el.getClientRects().length) continue;
        out.push('Hebrew: ' + t.slice(0, 40));
      }
    }
    if (lang !== 'en') {
      const D = window.CDE_STRINGS, en = D.en, cur = D[lang] || {}, txt = document.body.innerText;
      const plain = (v) => String(v ?? '').replace(/<[^>]+>/g, '').split('{')[0].trim();
      for (const [k, v] of Object.entries(en)) if (plain(v).length >= 6 && plain(cur[k]) !== plain(v) && txt.includes(plain(v))) out.push('English: ' + plain(v));
    }
    return out;
  });
}

// Text under WCAG AA (4.5:1, large text 3:1) on its real (composited) background, dark theme.
export async function contrastProblems(page, selector) {
  return page.evaluate((sel) => {
    const px = (c) => { const x = document.createElement('canvas').getContext('2d'); x.fillStyle = '#000'; x.fillStyle = c; x.fillRect(0, 0, 1, 1); return [...x.getImageData(0, 0, 1, 1).data]; };
    const parse = (c) => { const m = c.match(/rgba?\(([^)]+)\)/); if (!m) return px(c); const p = m[1].split(/[ ,/]+/).filter(Boolean).map(Number); return [p[0], p[1], p[2], p[3] == null ? 1 : p[3]]; };
    const lum = ([r, g, b]) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
    const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
    const stopsOf = (img) => (img.match(/rgba?\([^)]+\)|#[0-9a-f]{3,8}/gi) || []).map(parse);
    const bgs = (el) => {
      let layers = [[[30, 27, 75]]];
      const chain = []; for (let e = el; e; e = e.parentElement) chain.unshift(e);
      for (const e of chain) {
        const cs = getComputedStyle(e), out = [];
        const own = cs.backgroundImage !== 'none' && e !== document.body ? stopsOf(cs.backgroundImage) : [];
        const bc = parse(cs.backgroundColor);
        const cands = own.length ? own : (bc[3] > 0 ? [bc] : null);
        if (!cands) continue;
        for (const base of layers.flat()) for (const c of cands) { const a = c[3] == null ? 1 : (c[3] > 1 ? c[3] / 255 : c[3]); out.push([0, 1, 2].map((k) => c[k] * a + base[k] * (1 - a))); }
        layers = [out];
      }
      return layers.flat();
    };
    const bad = [];
    for (const el of document.querySelectorAll(sel)) {
      if (!el.getClientRects().length || !el.textContent.trim() || el.closest('[hidden]')) continue;
      const cs = getComputedStyle(el); const fg = parse(cs.color);
      if (fg[3] === 0) continue;   // gradient-clipped heading text
      const big = parseFloat(cs.fontSize) >= 24 || (parseFloat(cs.fontSize) >= 18.66 && +cs.fontWeight >= 700);
      const worst = Math.min(...bgs(el).map((b) => ratio(fg, b)));
      if (worst < (big ? 3 : 4.5)) bad.push(`${el.className || el.id || el.tagName}: ${worst.toFixed(2)}`);
    }
    return bad;
  }, selector);
}

// The end card shows exactly ONE visible primary action (kit persona standard P1).
export async function visiblePrimaries(page) {
  return page.evaluate(() => [...document.querySelectorAll('[data-kdm-primary], .primary')]
    .filter((e) => e.getClientRects().length && getComputedStyle(e).visibility !== 'hidden').length);
}
