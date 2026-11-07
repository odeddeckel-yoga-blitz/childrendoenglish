#!/usr/bin/env node
/**
 * Word Image Improver — candidate-fanout loop for finding the best image for a
 * vocabulary word. Wikimedia's FIRST search hit is frequently a book cover or
 * archival scan; this tool fetches MANY candidates so a vision review can pick.
 *
 * The loop (run by Claude or a human):
 *   1. `node scripts/word-image-improver.mjs candidates <word> [--terms "t1,t2"]`
 *      Fetches up to 9 filtered candidates into .image-work/<word>/cN.webp and
 *      builds a labeled contact sheet .image-work/<word>-sheet.png.
 *   2. Review the sheet against the METRICS below; pick the best index.
 *   3. `node scripts/word-image-improver.mjs pick <word> <idx>`
 *      Installs the winner as public/images/<word>.webp (512x512 webp).
 *   4. No candidate passes → rerun step 1 with different --terms, or drop the word.
 *
 * METRICS (all must pass; judged visually):
 *   - Recognizability: a 5-8 year old could name the WORD from the image alone.
 *   - SOLE-ANSWER SCORE (0-2) — the decisive metric: ask "what single word would
 *     a child say for this image?" and check it against the vocabulary
 *     (`rivals <word>` prints the confusable set — same-category words appear
 *     as quiz distractors, so collisions there are fatal).
 *       2 = target is the only natural answer            → PASS
 *       1 = target primary, but a rival word plausible   → prefer a better candidate
 *       0 = a rival vocab word is as/more plausible      → candidate FAILS
 *     Examples that scored 0: jungle photo dominated by a house ("house"),
 *     heart-shaped balloon ("balloon"), classroom of desks ("classroom").
 *   - Kid-suitability: bright, clear photo or friendly illustration; nothing
 *     scary, dark, adult, branded, or text-heavy; no archival b&w.
 *     Check the pick at FULL size before `pick` and again on the before/after sheet: on 11-05 a 112px
 *     thumbnail of a 'teacher' illustration hid a teacher pointing a pistol at the class.
 *   - Technical: sharp, >=300px source, sensible crop at square aspect.
 *
 * DROP RULE: if after ~3 candidate rounds (different terms each round) no
 *   candidate reaches sole-answer 2 (or a strong 1 with no same-category rival),
 *   REMOVE the word from src/data/words.js rather than ship a weak image.
 *   Words dropped this way so far: desk, nurse (unsuitable), glove (dup).
 *
 * Auto-filters before human review: svg/gif/tiff/pdf, <300px, filenames that
 * look like covers/catalogs/posters/scans, duplicate URLs.
 */
import sharp from 'sharp';
import { mkdirSync, writeFileSync, copyFileSync, existsSync, readdirSync, readFileSync, unlinkSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const imagesDir = join(__dirname, '..', 'public', 'images');
const workDir = join(__dirname, '..', '.image-work');
const UA = { 'User-Agent': 'ChildrenDoEnglish/1.0 (educational app; info@childrendoenglish.com)' };
const BAD_NAME = /\b(cover|title|page|catalog|advert|poster|book|manuscript|folio|stamp|coin|map|document|newspaper_|magazine)\b/i;

async function searchCandidates(term, limit = 6) {
  const url = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=File:${encodeURIComponent(term)}&gsrnamespace=6&gsrlimit=${limit * 2}&prop=imageinfo&iiprop=url|size|mime|extmetadata&iiurlwidth=512&format=json&origin=*`;
  const res = await fetch(url, { headers: UA });
  const data = await res.json();
  if (!data.query?.pages) return [];
  return Object.values(data.query.pages)
    .filter(p => {
      const i = p.imageinfo?.[0];
      if (!i) return false;
      if (!/image\/(jpeg|png|webp)/.test(i.mime)) return false;
      if (i.width < 300 || i.height < 300) return false;
      if (BAD_NAME.test(p.title || '')) return false;
      return true;
    })
    .slice(0, limit)
    .map(p => {
      // Provenance for /image-credits/ (owner 11-04): CC BY / BY-SA need the author, the licence and a link.
      const i = p.imageinfo[0], m = i.extmetadata || {}, strip = (h) => String(h || '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
      return { url: i.thumburl || i.url, title: p.title, page: i.descriptionurl, author: strip(m.Artist?.value) || 'see file page',
        licence: strip(m.LicenseShortName?.value), licenceUrl: m.LicenseUrl?.value || '' };
    });
}

async function download(url, filepath) {
  const res = await fetch(url, { headers: UA });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await sharp(buf).resize(512, 512, { fit: 'cover' }).webp({ quality: 82 }).toFile(filepath);
}

async function buildSheet(word, files) {
  const CELL = 190, COLS = 3;
  const rows = Math.ceil(files.length / COLS);
  const composites = [];
  for (let i = 0; i < files.length; i++) {
    const img = await sharp(files[i]).resize(CELL, CELL - 26, { fit: 'cover' }).toBuffer().catch(() => null);
    const label = Buffer.from(`<svg width="${CELL}" height="26"><rect width="${CELL}" height="26" fill="white"/><text x="6" y="19" font-size="15" font-family="sans-serif" fill="black">c${i}</text></svg>`);
    const x = (i % COLS) * CELL, y = Math.floor(i / COLS) * CELL;
    if (img) composites.push({ input: img, left: x, top: y + 26 });
    composites.push({ input: label, left: x, top: y });
  }
  const out = join(workDir, `${word}-sheet.png`);
  await sharp({ create: { width: COLS * CELL, height: rows * CELL, channels: 3, background: { r: 225, g: 225, b: 225 } } })
    .composite(composites).png().toFile(out);
  return out;
}

const [cmd, word, third] = process.argv.slice(2);
const termsArg = process.argv.find(a => a.startsWith('--terms='));

if (cmd === 'candidates' && word) {
  const terms = termsArg ? termsArg.slice(8).split(',') : [word];
  const dir = join(workDir, word);
  mkdirSync(dir, { recursive: true });
  // Clear an older run's candidates: a stale cN without its .json source record was once picked as if it were new.
  for (const f of readdirSync(dir)) if (/^c\d+\.(webp|json)$/.test(f)) unlinkSync(join(dir, f));
  const seen = new Set();
  const files = [];
  for (const term of terms) {
    const cands = await searchCandidates(term.trim(), 5);
    for (const c of cands) {
      if (seen.has(c.url) || files.length >= 9) continue;
      seen.add(c.url);
      const fp = join(dir, `c${files.length}.webp`);
      try {
        await download(c.url, fp);
        files.push(fp);
        writeFileSync(fp.replace(/\.webp$/, '.json'), JSON.stringify(c));   // source record, read by `pick`
        console.log(`c${files.length - 1}: ${c.title} [${term.trim()}]`);
      } catch (e) { console.log(`skip ${c.title}: ${e.message}`); }
      await new Promise(r => setTimeout(r, 350));
    }
  }
  if (files.length === 0) { console.log('NO CANDIDATES — try other terms'); process.exit(1); }
  console.log('sheet:', await buildSheet(word, files));
} else if (cmd === 'pick' && word && third !== undefined) {
  const src = join(workDir, word, `c${third}.webp`);
  if (!existsSync(src)) { console.error('no such candidate'); process.exit(1); }
  copyFileSync(src, join(imagesDir, `${word}.webp`));
  // Record where it came from (scripts/IMAGE_SOURCES.json → /image-credits/). No record = the credits gate fails.
  const meta = src.replace(/\.webp$/, '.json');
  const srcFile = join(__dirname, 'IMAGE_SOURCES.json');
  const all = existsSync(srcFile) ? JSON.parse(readFileSync(srcFile, 'utf8')) : {};
  if (existsSync(meta)) {
    const c = JSON.parse(readFileSync(meta, 'utf8'));
    all[word] = { source: 'wikimedia-commons', title: c.title, url: c.page, author: c.author, licence: c.licence, licenceUrl: c.licenceUrl };
    if (!c.licence) console.warn(`⚠ ${word}: Commons gave no licence name — check ${c.page} before shipping`);
  } else {
    all[word] = { source: 'unknown', note: 'picked from a candidate with no source record — fix before shipping' };
    console.warn(`⚠ ${word}: no source record for c${third} — re-run \`candidates\` so it is recorded`);
  }
  writeFileSync(srcFile, JSON.stringify(Object.fromEntries(Object.entries(all).sort()), null, 1) + '\n');
  console.log(`installed ${word}.webp from candidate c${third} · source recorded (${all[word].licence || all[word].source})`);
} else if (cmd === 'title' && word && third) {
  // Owner picked a specific Commons file on a review page (11-07): fetch it by its File: title with the same metadata
  // as a search hit, as candidate c9 (search rounds use c0–c8), then `pick <word> 9` installs it with its credit.
  const t = third.startsWith('File:') ? third : `File:${third}`;
  const url = `https://commons.wikimedia.org/w/api.php?action=query&titles=${encodeURIComponent(t)}&prop=imageinfo&iiprop=url|size|mime|extmetadata&iiurlwidth=1024&format=json&origin=*`;
  const p = Object.values((await (await fetch(url, { headers: UA })).json()).query?.pages || {})[0];
  const i = p?.imageinfo?.[0];
  if (!i) { console.error(`no such Commons file: ${t}`); process.exit(1); }
  const m = i.extmetadata || {}, strip = (h) => String(h || '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
  const c = { url: i.thumburl || i.url, title: p.title, page: i.descriptionurl, author: strip(m.Artist?.value) || 'see file page',
    licence: strip(m.LicenseShortName?.value), licenceUrl: m.LicenseUrl?.value || '' };
  const dir = join(workDir, word); mkdirSync(dir, { recursive: true });
  await download(c.url, join(dir, 'c9.webp'));
  writeFileSync(join(dir, 'c9.json'), JSON.stringify(c));
  console.log(`c9: ${c.title} (${c.licence || 'no licence name'}) → pick ${word} 9`);
} else if (cmd === 'rivals' && word) {
  // The confusable set for the sole-answer metric: same-category words are the
  // ones that can appear beside this word as quiz distractors.
  const { WORDS } = await import('../src/data/words.js');
  const target = WORDS.find(w => w.id === word || w.word === word);
  if (!target) { console.error('unknown word'); process.exit(1); }
  const sameCat = WORDS.filter(w => w.id !== target.id && w.category === target.category).map(w => w.word);
  console.log(`category ${target.category}: ${sameCat.join(', ')}`);
} else {
  console.log('usage: word-image-improver.mjs candidates <word> [--terms="t1,t2"] | pick <word> <idx> | rivals <word>');
}
