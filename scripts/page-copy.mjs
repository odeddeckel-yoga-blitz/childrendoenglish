// Shared copy helpers for the generated static pages (scripts/generate-seo-pages.js, scripts/build-*.mjs).
// Page triage 11-08: 228 word pages said "a adjective / a intermediate", 57 pages claimed "real photos" for drawn or
// emoji pictures, and the games hub said "Five quick games" with 17 on it. Copy that depends on data goes through here.
// Tests: src/__tests__/pageCopy.test.js.

import IMAGE_SOURCES from './IMAGE_SOURCES.json' with { type: 'json' };
import { DRAWN } from '../src/data/imageStyle.js';

// --- a / an -----------------------------------------------------------------
// By sound, not by letter: "a unicorn", "a one-day trip", "an hour".
const A_BEFORE_VOWEL = /^(uni(?!n)|use|usu|ura|uro|ute|ukulele|u-|one\b|once\b|eu|ewe)/i;
const AN_BEFORE_CONSONANT = /^(hour|honest|honou?r|heir)/i;
export function aOrAn(phrase) {
  const w = String(phrase).trim();
  if (AN_BEFORE_CONSONANT.test(w)) return 'an';
  if (A_BEFORE_VOWEL.test(w)) return 'a';
  return /^[aeiou]/i.test(w) ? 'an' : 'a';
}
// "an adjective", "a beginner (ages 6-8)". Pass already-escaped HTML if the phrase is HTML.
export const withArticle = (phrase) => `${aOrAn(phrase)} ${phrase}`;

// --- picture claims -----------------------------------------------------------
// A word's picture is a photo only when IMAGE_SOURCES says Commons or Pixabay AND it is not in imageStyle's DRAWN set
// (some Commons files are drawings). 'own' = our drawing, 'twemoji' / 'fluent-emoji' = emoji, 'unknown' = not known:
// none of those may be called a photo.
export const PHOTO_SOURCES = new Set(['wikimedia-commons', 'pixabay']);
export function makeIsPhoto(imageSources, drawn) {
  return (id) => !drawn.has(id) && PHOTO_SOURCES.has(imageSources[id]?.source);
}
// The site's own pictures: scripts/IMAGE_SOURCES.json + src/data/imageStyle.js.
export const isPhoto = makeIsPhoto(IMAGE_SOURCES, DRAWN);

// The claim for a set of words: "real photos" only when every picture in the set is a photo.
const CLAIMS = {
  en: { photo: { one: 'a real photo', many: 'real photos', adj: 'real-photo' }, picture: { one: 'a picture', many: 'pictures', adj: 'picture' } },
  es: { photo: { one: 'una foto real', many: 'fotos reales', adj: 'con foto' }, picture: { one: 'una imagen', many: 'imágenes', adj: 'con imagen' } },
  he: { photo: { one: 'תמונה אמיתית', many: 'תמונות אמיתיות' }, picture: { one: 'תמונה', many: 'תמונות' } },
};
export function pictureClaim(words, isPhoto, { lang = 'en', form = 'many' } = {}) {
  const allPhotos = words.length > 0 && words.every((w) => isPhoto(typeof w === 'string' ? w : w.id));
  return CLAIMS[lang][allPhotos ? 'photo' : 'picture'][form];
}

// Optimizer-written title/description overrides can carry a "real photo" claim; keep it only when it is true.
export function truthfulPictureText(text, photo) {
  if (photo || !text) return text;
  return text
    .replace(/\ba real[- ]photo\b/gi, (m) => (m[0] === 'A' ? 'A picture' : 'a picture'))
    .replace(/\breal[- ]photos\b/gi, (m) => (m[0] === 'R' ? 'Pictures' : 'pictures'))
    .replace(/\breal[- ]photo\b/gi, (m) => (m[0] === 'R' ? 'Picture' : 'picture'));
}

// --- counts in words ----------------------------------------------------------
const SMALL = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'];
// Style: spell out one to twelve at the start of a sentence, digits above.
export const countWord = (n, { capital = false } = {}) => {
  const s = n <= 12 ? SMALL[n] : String(n);
  return capital ? s.charAt(0).toUpperCase() + s.slice(1) : s;
};
