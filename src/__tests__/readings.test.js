import { describe, it, expect } from 'vitest';
import { READINGS, READING_NAMES, READING_STAGES } from '../data/readings';
import { READING_GLOSSES, READING_PHRASES, READING_GLOSSES_ES, READING_PHRASES_ES } from '../data/readingGlosses';
import { READING_UI } from '../data/readingUi';
import { glossTokens, orderedOptions, wordCount, readingOrder, READING_LANGS } from '../../scripts/build-reading-pages.mjs';

const G = {
  he: { GLOSSES: READING_GLOSSES, PHRASES: READING_PHRASES, NAMES: READING_NAMES },
  es: { GLOSSES: READING_GLOSSES_ES, PHRASES: READING_PHRASES_ES, NAMES: READING_NAMES },
};
const allSentences = (r) => [...r.text, ...r.questions.flatMap((q) => [q.q, ...q.options])];

describe('graded readers', () => {
  it('every word in every text, question and option has a Hebrew and a Spanish gloss', () => {
    for (const lang of ['he', 'es']) {
      const missing = [];
      for (const r of READINGS) {
        for (const s of allSentences(r)) {
          for (const t of glossTokens(s, G[lang])) if (/[A-Za-z]/.test(t.text) && !t.name && !t.gloss) missing.push(`${r.slug}: ${t.text}`);
        }
      }
      expect(missing, lang).toEqual([]);
    }
    // one Spanish gloss source (11-19 merge: printables' readingGlossesEs.js folded in), and no Hebrew in it
    expect(Object.values({ ...READING_GLOSSES_ES, ...READING_PHRASES_ES }).filter((v) => /[\u0590-\u05FF]/.test(v))).toEqual([]);
  });

  it('one Spanish reading section, at /es/lecturas/ (never /es/reading/)', () => {
    expect(READING_LANGS.es.hub).toBe('/es/lecturas/');
    expect(READING_LANGS.es.dir).toEqual(['es', 'lecturas']);
  });

  it('every reading has exactly 3 questions, each with one unambiguous right answer', () => {
    for (const r of READINGS) {
      expect(r.questions, r.slug).toHaveLength(3);
      for (const [n, q] of r.questions.entries()) {
        expect(Number.isInteger(q.answer), `${r.slug} q${n}`).toBe(true);
        expect(q.options.length).toBeGreaterThanOrEqual(3);
        expect(q.options[q.answer]).toBeTruthy();
        // one right answer: no duplicate options (case-insensitive), and the shuffled page order marks exactly one
        expect(new Set(q.options.map((o) => o.toLowerCase().trim())).size, `${r.slug} q${n}`).toBe(q.options.length);
        const shown = orderedOptions(r, n);
        expect(shown.filter((x) => x.ok)).toHaveLength(1);
        expect(shown.find((x) => x.ok).o).toBe(q.options[q.answer]);
      }
      expect(new Set(r.questions.map((q) => q.q)).size).toBe(3);
    }
  });

  it('5 levels, word counts inside each level, unique slugs and titles in he and es', () => {
    expect(READING_STAGES.map((s) => s.n)).toEqual([1, 2, 3, 4, 5]);
    const slugs = new Set();
    for (const r of READINGS) {
      expect(slugs.has(r.slug)).toBe(false);
      slugs.add(r.slug);
      expect(r.slug).toMatch(/^[a-z0-9-]{1,35}$/); // beacon item read-<slug> stays ≤ 40 chars
      const st = READING_STAGES.find((s) => s.n === r.stage);
      expect(st, r.slug).toBeTruthy();
      const n = wordCount(r);
      expect(n, r.slug).toBeGreaterThanOrEqual(st.words[0]);
      expect(n, r.slug).toBeLessThanOrEqual(st.words[1]);
      expect(r.he && r.es, r.slug).toBeTruthy();
      if (r.level !== undefined) expect(['pre', 'c1', 'c2']).toContain(r.level);
    }
    for (const s of READING_STAGES) expect(READINGS.filter((r) => r.stage === s.n).length, `level ${s.n}`).toBeGreaterThanOrEqual(4);
    expect(READINGS.length).toBeGreaterThanOrEqual(23);
  });

  it('hub order goes from level 1 to level 5', () => {
    const order = readingOrder(READINGS).map((r) => r.stage);
    expect(order).toEqual([...order].sort((a, b) => a - b));
  });

  it('UI copy: he and es have every key the pages use, keep the placeholders, and never claim a native speaker', () => {
    const ph = (s) => (s.match(/\{\w+\}/g) || []).sort().join();
    for (const lang of ['he', 'es']) {
      for (const [k, v] of Object.entries(READING_UI[lang])) {
        expect(READING_UI.en[k], `${lang}.${k}`).toBeTruthy();
        expect(ph(v), `${lang}.${k}`).toBe(ph(READING_UI.en[k]));
        expect(v).not.toMatch(/native|nativo|nativa|שפת אם/i);
      }
      for (const k of Object.keys(READING_UI.en)) if (!['band1Note', 'morePractice', 'landingLink'].includes(k)) expect(READING_UI[lang][k], `${lang}.${k}`).toBeTruthy();
    }
  });

  it('a two-word phrase wins over the single word', () => {
    const toks = glossTokens('He eats ice cream.', G.he).filter((t) => t.gloss);
    expect(toks.find((t) => t.text === 'ice').gloss).toBe('ice cream: גלידה');
    expect(toks.find((t) => t.text === 'cream').gloss).toBe('ice cream: גלידה');
    expect(glossTokens('We turned off the lights.', G.es).find((t) => t.text === 'off').gloss).toBe('turned off: apagamos');
  });
});
