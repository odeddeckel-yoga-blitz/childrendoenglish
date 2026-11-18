// "No data collection" / "zero data" was flagged by three audits (07-17 → 11-18): the site does keep anonymous daily
// totals and sends error reports, and AI engines quote llms.txt verbatim. This fails on that claim anywhere in the
// shipped text (public/, and dist/ when a build exists), and checks the generated llms.txt says what is true.
import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync, existsSync, mkdtempSync } from 'node:fs';
import { join, extname } from 'node:path';
import { tmpdir } from 'node:os';
import { buildLlmsTxt, legalLinks, addLegalRow, rich } from '../../scripts/build-trust-pages.mjs';

const ROOT = join(import.meta.dirname, '..', '..');
const TEXT = new Set(['.html', '.txt', '.js', '.json', '.md', '.xml', '.webmanifest', '.mjs', '.css']);
const BANNED = /no[\s-]+data[\s-]+collection|zero[\s-]+data/i;

function textFiles(dir, out = []) {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    const st = statSync(p);
    if (st.isDirectory()) textFiles(p, out);
    else if (TEXT.has(extname(f)) && st.size < 5_000_000) out.push(p);
  }
  return out;
}

describe('no "no data collection" claim in shipped text', () => {
  for (const dir of ['public', 'dist']) {
    it(`${dir}/`, () => {
      const base = join(ROOT, dir);
      if (!existsSync(base)) return;
      const hits = textFiles(base).filter((p) => BANNED.test(readFileSync(p, 'utf8')));
      expect(hits.map((p) => p.slice(ROOT.length + 1))).toEqual([]);
    });
  }
  it('index.html shell', () => expect(BANNED.test(readFileSync(join(ROOT, 'index.html'), 'utf8'))).toBe(false));
});

describe('llms.txt (built from the data)', () => {
  const distDir = mkdtempSync(join(tmpdir(), 'cde-llms-'));
  const txt = buildLlmsTxt({ SITE: 'https://childrendoenglish.com', distDir, wordsLabel: '560+', cats: 13, games: 19, band1: 190, units: 11, readings: 8, esWords: 563, totalWords: 563 });
  it('states the real data practice and the real facts', () => {
    expect(txt).not.toMatch(BANNED);
    expect(txt).toMatch(/anonymous daily usage totals/);
    expect(txt).toMatch(/error reports/);
    expect(txt).toMatch(/ages 6-12/);
    expect(txt).toMatch(/560\+ words/);
    expect(txt).toMatch(/Oded Deckelbaum/);
    expect(txt).not.toMatch(/native/i);
  });
  it('keeps the canonical-citation guidance and the hubs', () => {
    expect(txt).toMatch(/the canonical page is\s+https:\/\/childrendoenglish\.com\/vocabulary\/<category>\/<word>\//);
    for (const p of ['/he/', '/es/', '/units/', '/band-1/', '/teachers/', '/games/', '/printable-flashcards/', '/band-1/reading/', '/privacy/']) expect(txt).toContain(`https://childrendoenglish.com${p}`);
  });
  it('names Spanish glosses only when every word has one', () => {
    const some = buildLlmsTxt({ SITE: 'https://x', distDir, wordsLabel: '560+', cats: 13, games: 19, band1: 190, units: 11, readings: 8, esWords: 500, totalWords: 563 });
    expect(some).toMatch(/500 also have a Spanish one/);
  });
});

describe('footer legal row', () => {
  it('links the page-language versions', () => {
    expect(legalLinks('he')).toContain('href="/he/privacy/"');
    expect(legalLinks('es')).toContain('href="/es/terms/"');
    expect(legalLinks('en')).toContain('href="/about/"');
  });
  it('goes into the crawl-mesh footer once, not on word pages under the body lock', () => {
    const page = '<body><nav class="crawl-mesh"><details></details></nav></body>';
    expect(addLegalRow(page, 'en', '/d/vocabulary/animals/index.html')).toContain('mesh-legal');
    expect(addLegalRow(page, 'en', '/d/vocabulary/animals/hebrew/index.html')).toContain('mesh-legal');
    expect(addLegalRow(page, 'en', '/d/vocabulary/animals/cat/index.html')).toBe(page);
    const once = addLegalRow(page, 'he', '/d/he/index.html');
    expect(addLegalRow(once, 'he', '/d/he/index.html')).toBe(once);
  });
  it('isolates Latin runs, numbers and the email inside Hebrew', () => {
    const h = rich('בגילאי 6–12 עם Sentry, כתבו ל־info@childrendoenglish.com.', 'he');
    expect(h).toContain('<bdi dir="ltr">6–12</bdi>');
    expect(h).toContain('<bdi dir="ltr">Sentry</bdi>');
    expect(h).toContain('<a href="mailto:info@childrendoenglish.com" dir="ltr">info@childrendoenglish.com</a>');
  });
});
