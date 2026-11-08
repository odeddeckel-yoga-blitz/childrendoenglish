// Copy on the generated static pages (page triage 11-08, scripts/page-copy.mjs). Builds every page with the real
// generator into a temp dir (CDE_SEO_DIST) and reads the output, so a template that bypasses the helpers fails here:
//  1. a / an: no "is a adjective / a intermediate / a advanced" (228 word pages had it).
//  2. "real photo" only where every picture is a photo (57 pages claimed it for drawn / emoji pictures);
//     never a native-speaker or recorded-voice claim (audio is Piper TTS).
//  3. /games/ says how many games it lists, from src/data/arcadeGames.js (it said "Five" with 17).
//  4. /about: no "no tracking" (cookieless Vercel WA + an anonymous counter run), no "proven learning techniques".
//  5. dist/404.html: site header, links home / games / words, a Hebrew and a Spanish block.
import { describe, it, expect, beforeAll } from 'vitest';
import { execFileSync } from 'child_process';
import process from 'process';
import { mkdtempSync, readFileSync, readdirSync, existsSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join, relative } from 'path';
import { aOrAn, withArticle, isPhoto, pictureClaim, truthfulPictureText } from '../../scripts/page-copy.mjs';
import { SPOTLIGHT_GAMES, HUB_ONLY_GAMES } from '../data/arcadeGames';
import { WORDS } from '../data/words';
import { t } from '../utils/i18n';
import ES from '../utils/i18n-es';
import HE from '../utils/i18n-he';

const ROOT = join(import.meta.dirname, '..', '..');
let dist;
const pages = new Map(); // '/vocabulary/feelings/' -> html
const page = (p) => pages.get(p);
const walk = (dir) => readdirSync(dir, { withFileTypes: true }).flatMap((d) =>
  d.isDirectory() ? walk(join(dir, d.name)) : d.name.endsWith('.html') ? [join(dir, d.name)] : []);
// Visible text + JSON-LD (FAQ answers are read by search engines too); no CSS, no page JS.
const text = (html) => html
  .replace(/<script(?![^>]*ld\+json)[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, ' ')
  .replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/\s+/g, ' ');
const meta = (html) => (html.match(/<meta name="description" content="([^"]*)"/) || [])[1] || '';

beforeAll(() => {
  dist = mkdtempSync(join(tmpdir(), 'cde-seo-'));
  execFileSync('node', [join(ROOT, 'scripts', 'generate-seo-pages.js')], { cwd: ROOT, env: { ...process.env, CDE_SEO_DIST: dist }, stdio: 'pipe' });
  for (const f of walk(dist)) pages.set('/' + relative(dist, f).replace(/index\.html$/, ''), readFileSync(f, 'utf8'));
  return () => rmSync(dist, { recursive: true, force: true });
}, 180_000);

describe('a / an helper', () => {
  it('goes by sound', () => {
    expect(withArticle('adjective')).toBe('an adjective');
    expect(withArticle('intermediate (ages 9-10)')).toBe('an intermediate (ages 9-10)');
    expect(withArticle('advanced (ages 11-12)')).toBe('an advanced (ages 11-12)');
    expect(withArticle('noun')).toBe('a noun');
    expect(withArticle('beginner (ages 6-8)')).toBe('a beginner (ages 6-8)');
    for (const w of ['unicorn', 'unicycle', 'uniform', 'useful', 'U-shape', 'one-day']) expect(aOrAn(w)).toBe('a');
    for (const w of ['hour', 'honest', 'umbrella', 'egg', 'uninvited']) expect(aOrAn(w)).toBe('an');
  });
});

describe('generated pages: a / an', () => {
  // "a" before a vowel letter is right only where the vowel sounds like a consonant ("a unicycle").
  const OK = /^(uni(?!n)|use|usu|u-|one\b|once\b|eu)/i;
  const isWordCatAge = (p) => /^\/vocabulary\/[^/]+\/([^/]+\/)?$/.test(p) && !/\/(hebrew|spanish)\/$/.test(p);
  it('word, category and age pages never say "a" before a vowel sound', () => {
    const bad = [];
    for (const [p, html] of pages) {
      if (!isWordCatAge(p)) continue;
      for (const m of text(html).matchAll(/\ba ([aeiou][\w-]*)/gi)) if (!OK.test(m[1])) bad.push(`${p}: a ${m[1]}`);
    }
    expect(pages.size).toBeGreaterThan(500);
    expect(bad.slice(0, 10)).toEqual([]);
  });
  it('the about-the-word paragraph uses "an" for adjectives and intermediate / advanced words', () => {
    const lamp = text(page('/vocabulary/home/lamp/'));
    expect(lamp).not.toMatch(/It is a (intermediate|advanced)/);
    expect(text(page('/vocabulary/colors/brown/'))).toMatch(/It is an adjective/);
  });
});

describe('generated pages: picture claims', () => {
  const PHOTO_CLAIM = /real[- ]photo|foto real|fotos reales|תמונה אמיתית|תמונות אמיתיות|לא איור/i;
  it('the photo test follows IMAGE_SOURCES + DRAWN', () => {
    expect(isPhoto('worried')).toBe(false); // Fluent emoji
    expect(isPhoto('red')).toBe(false); // our own drawing
    expect(isPhoto('candle')).toBe(true); // Commons photo
    expect(pictureClaim(['candle', 'worried'], isPhoto)).toBe('pictures');
    expect(pictureClaim(['candle'], isPhoto, { form: 'one' })).toBe('a real photo');
    expect(truthfulPictureText('A real photo, audio and a quiz', false)).toBe('A picture, audio and a quiz');
  });
  it('a word page claims a real photo only when its picture is one', () => {
    const bad = [];
    for (const w of WORDS) {
      const html = page(`/vocabulary/${w.category}/${w.id}/`);
      if (html && !isPhoto(w.id) && PHOTO_CLAIM.test(text(html))) bad.push(w.id);
    }
    expect(bad).toEqual([]);
    expect(meta(page('/vocabulary/feelings/worried/'))).not.toMatch(/real photo/i);
  });
  it('a page about many words claims real photos only if every one of its pictures is a photo', () => {
    const wordPage = /^\/vocabulary\/[^/]+\/[^/]+\/$/;
    const bad = [...pages].filter(([p, html]) => !(wordPage.test(p) && !/\/(hebrew|spanish)\/$/.test(p)) && PHOTO_CLAIM.test(text(html))).map(([p]) => p);
    // Every category has at least one drawn / emoji / unknown-source picture today, so no set page may claim photos.
    expect(bad).toEqual([]);
    expect(meta(page('/vocabulary/feelings/'))).toMatch(/with pictures/);
    expect(meta(page('/vocabulary/colors/'))).not.toMatch(/photo/i);
  });
  it('no page claims a native speaker or a recorded voice (audio is Piper TTS)', () => {
    const CLAIM = /native[- ]speaker|native (audio|voice|pronunciation)|recorded (by|voice|audio)|human voice|real voice|דובר(י)? שפת אם|hablante nativo|voz (humana|grabada)/i;
    const bad = [...pages].filter(([, html]) => CLAIM.test(text(html))).map(([p]) => p);
    expect(bad).toEqual([]);
  });
});

describe('/games/ hub', () => {
  const registry = [...SPOTLIGHT_GAMES, ...HUB_ONLY_GAMES].map((g) => g.id);
  it('lists exactly the registry games and says how many', () => {
    const html = page('/games/');
    const cards = [...html.matchAll(/<a class="card" href="\/games\/([^/]+)\/">/g)].map((m) => m[1]);
    expect([...cards].sort()).toEqual([...registry].sort());
    const sub = text((html.match(/<p class="sub">[\s\S]*?<\/p>/) || [''])[0]);
    expect(sub).toMatch(new RegExp(`^ ?${registry.length} quick games`));
    expect(text(html)).not.toMatch(/\b(Three|Four|Five|Six) (quick )?games\b/);
  });
});

describe('/about', () => {
  it('states the real analytics and drops "no tracking" / "proven learning techniques"', () => {
    const about = text(page('/about/'));
    expect(about).not.toMatch(/no tracking/i);
    expect(about).not.toMatch(/proven/i);
    expect(about).not.toMatch(/unless you opt in/i);
    expect(about).toMatch(/cookieless Vercel Web Analytics/);
    expect(about).toMatch(/no cookies/);
    expect(about).toMatch(/no personal data/);
    expect(about).toMatch(/no ads/i);
  });
  it('the app trust line does not say "no tracking" in any language', () => {
    for (const k of ['trustNoAds', 'trustNoAdsDesc']) {
      expect(t(k, 'en')).not.toMatch(/tracking/i);
      expect(ES[k]).not.toMatch(/rastreo/i);
      expect(HE[k]).not.toMatch(/מעקב/);
    }
  });
});

describe('404 page', () => {
  it('is written by the generator with the site header and links home, to games and to words', () => {
    const p = join(dist, '404.html');
    expect(existsSync(p)).toBe(true);
    const html = readFileSync(p, 'utf8');
    expect(html).toContain('name="robots" content="noindex"');
    const block = (lang) => (html.match(new RegExp(`<div class="nf-lang" data-lang="${lang}"[\\s\\S]*?</main></div>`)) || [''])[0];
    const hrefs = (b) => [...b.matchAll(/<main[\s\S]*/g)].flatMap((m) => [...m[0].matchAll(/href="([^"]+)"/g)].map((x) => x[1]));
    expect(block('en')).toContain('class="site-head"');
    expect(hrefs(block('en'))).toEqual(['/', '/games/', '/vocabulary/']);
    expect(block('he')).toMatch(/dir="rtl"/);
    expect(block('he')).toContain('הדף לא נמצא');
    expect(hrefs(block('he'))).toEqual(['/he/', '/he/english-games/', '/he/english-words/']);
    expect(block('es')).toContain('Página no encontrada');
    expect(hrefs(block('es'))[0]).toBe('/es/');
    // CSP: no inline script; the language switch is public/not-found.js
    expect([...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>/g)]).toEqual([]);
    expect(html).toContain('<script src="/not-found.js"></script>');
  });
  it('not-found.js picks the language from the path prefix', () => {
    const src = readFileSync(join(ROOT, 'public', 'not-found.js'), 'utf8');
    const run = (pathname) => {
      const attrs = {};
      const documentElement = { setAttribute: (k, v) => { attrs[k] = v; }, lang: 'en', dir: 'ltr' };
      const doc = { documentElement, title: 'Page not found | Children Do English' };
      new Function('location', 'document', src)({ pathname }, doc);
      return { nf: attrs['data-nf'], lang: documentElement.lang, dir: documentElement.dir, title: doc.title };
    };
    expect(run('/he/no-such-page/')).toMatchObject({ nf: 'he', lang: 'he', dir: 'rtl' });
    expect(run('/es/nada')).toMatchObject({ nf: 'es', lang: 'es', dir: 'ltr', title: 'Página no encontrada | Children Do English' });
    expect(run('/hello/')).toMatchObject({ nf: undefined, lang: 'en' });
    expect(run('/hebrew/')).toMatchObject({ nf: undefined });
  });
});
