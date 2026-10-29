// Hebrew printable flashcards (scripts/build-he-flashcards.mjs): a Hebrew RTL
// page per category + an index, Hebrew-first cards, reciprocal hreflang, lazy
// images with print-btn.js, and no link back into /he/ (that waits for Nov 14).
import { describe, it, expect } from 'vitest';
import { mkdtempSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { tmpdir } from 'os';
import { join, dirname } from 'path';
import { buildHebrewFlashcards } from '../../scripts/build-he-flashcards.mjs';

const escapeHtml = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const W = (id, word, he) => ({ id, word, hebrewTranslation: he });
const words = { animals: [W('cat', 'cat', 'חתול'), W('dog', 'dog', 'כלב'), W('fish', 'fish', 'דג'), W('bird', 'bird', 'ציפור'), W('cow', 'cow', 'פרה'), W('duck', 'duck', 'ברווז'), W('pig', 'pig', 'חזיר'), W('frog', 'frog', 'צפרדע')], food: [W('apple', 'apple', 'תפוח'), W('bread', 'bread', 'לחם')] };

function build() {
  const dir = mkdtempSync(join(tmpdir(), 'hefc-'));
  const n = buildHebrewFlashcards({
    SITE: 'https://childrendoenglish.com', flashcardsDir: dir, escapeHtml, FC_EAGER: 6,
    writePage: (p, html) => { mkdirSync(dirname(p), { recursive: true }); writeFileSync(p, html); },
    CATEGORIES: ['animals', 'food'], CATEGORY_NAMES: { animals: 'Animals', food: 'Food & Drinks' }, CATEGORY_NAMES_HE: { animals: 'חיות', food: 'אוכל ושתייה' },
    getWordsByCategory: (c) => words[c] || [],
    howToSchemaFor: ({ name }) => JSON.stringify({ '@type': 'HowTo', name }),
    faqSchemaFor: (pairs) => JSON.stringify({ '@type': 'FAQPage', n: pairs.length }),
  });
  return { n, read: (rel) => readFileSync(join(dir, rel, 'index.html'), 'utf-8') };
}

describe('Hebrew printable flashcards', () => {
  it('one page per category plus the index', () => {
    expect(build().n).toBe(3);
  });

  it('a category page: Hebrew RTL, Hebrew-first cards, hreflang en/es/he, lazy images + print helper', () => {
    const html = build().read('animals/hebrew');
    expect(html).toContain('<html lang="he" dir="rtl">');
    expect(html).toContain('<title>כרטיסיות באנגלית להדפסה: חיות — 8 כרטיסיות עם תמונות ותרגום לעברית</title>');
    expect(html).toContain('<div class="fc-he">ציפור</div>');
    expect(html).not.toContain('fc-def');
    for (const [l, href] of [['en', '/printable-flashcards/animals/'], ['es', '/printable-flashcards/animals/spanish/'], ['he', '/printable-flashcards/animals/hebrew/']]) {
      expect(html).toContain(`hreflang="${l}" href="https://childrendoenglish.com${href}"`);
    }
    expect(html.match(/loading="lazy"/g)).toHaveLength(2); // 8 cards, first 6 eager
    expect(html).toContain('<script defer src="/print-btn.js"></script>');
    expect(html).toContain('"@type":"FAQPage"');
    expect(html).not.toMatch(/href="\/he\//);
  });

  it('the index lists every set with its count', () => {
    const html = build().read('hebrew');
    expect(html).toContain('href="/printable-flashcards/animals/hebrew/"');
    expect(html).toContain('href="/printable-flashcards/food/hebrew/"');
    expect(html).toContain('10 כרטיסיות');
  });
});
