import { describe, it, expect } from 'vitest';
import { READINGS, READING_NAMES } from '../data/readings';
import { READING_GLOSSES, READING_PHRASES } from '../data/readingGlosses';
import { glossTokens } from '../../scripts/build-reading-pages.mjs';

const G = { GLOSSES: READING_GLOSSES, PHRASES: READING_PHRASES, NAMES: READING_NAMES };

describe('RC11 reading texts', () => {
  it('every word in every text, question and option has Hebrew', () => {
    const missing = [];
    for (const r of READINGS) {
      for (const s of [...r.text, ...r.questions.flatMap((q) => [q.q, ...q.options])]) {
        for (const t of glossTokens(s, G)) if (/[A-Za-z]/.test(t.text) && !t.name && !t.gloss) missing.push(`${r.slug}: ${t.text}`);
      }
    }
    expect(missing).toEqual([]);
  });

  it('short texts with three answerable questions', () => {
    const slugs = new Set();
    for (const r of READINGS) {
      expect(slugs.has(r.slug)).toBe(false);
      slugs.add(r.slug);
      const n = r.text.join(' ').split(/\s+/).length;
      expect(n).toBeGreaterThanOrEqual(40);
      expect(n).toBeLessThanOrEqual(70);
      expect(['pre', 'c1', 'c2']).toContain(r.level);
      expect(r.questions).toHaveLength(3);
      for (const q of r.questions) {
        expect(q.options[q.answer]).toBeTruthy();
        expect(new Set(q.options).size).toBe(q.options.length);
      }
    }
  });

  it('a two-word phrase wins over the single word', () => {
    const toks = glossTokens('He eats ice cream.', G).filter((t) => t.gloss);
    expect(toks.find((t) => t.text === 'ice').gloss).toBe('ice cream: גלידה');
    expect(toks.find((t) => t.text === 'cream').gloss).toBe('ice cream: גלידה');
  });
});
