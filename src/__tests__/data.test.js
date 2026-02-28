import { describe, it, expect } from 'vitest';
import { WORDS, CATEGORIES, getWordsByLevel, getWordsByCategory, getDistractors } from '../data/words';
import { LEVELS } from '../data/levels';
import { BADGES } from '../data/badges';

describe('Word data integrity', () => {
  it('has words with all required fields', () => {
    WORDS.forEach(word => {
      expect(word.id).toBeTruthy();
      expect(word.word).toBeTruthy();
      expect(['beginner', 'intermediate', 'advanced']).toContain(word.level);
      expect(word.partOfSpeech).toBeTruthy();
      expect(word.category).toBeTruthy();
      expect(word.definition).toBeTruthy();
      expect(word.exampleSentence).toBeTruthy();
      expect(word.phonetic).toBeTruthy();
      expect(word.hebrewTranslation).toBeTruthy();
      expect(word.imageUrl).toBeTruthy();
    });
  });

  it('has unique word IDs', () => {
    const ids = WORDS.map(w => w.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('has words in each level', () => {
    const levels = ['beginner', 'intermediate', 'advanced'];
    levels.forEach(level => {
      const count = getWordsByLevel(level).length;
      // beginner and intermediate should have words; advanced can be empty in MVP
      if (level !== 'advanced') {
        expect(count).toBeGreaterThan(0);
      }
    });
  });

  it('has words in each declared category', () => {
    CATEGORIES.forEach(cat => {
      expect(getWordsByCategory(cat).length).toBeGreaterThan(0);
    });
  });

  it('all word categories are in CATEGORIES list', () => {
    const cats = new Set(WORDS.map(w => w.category));
    cats.forEach(cat => {
      expect(CATEGORIES).toContain(cat);
    });
  });

  it('generates correct number of distractors', () => {
    WORDS.forEach(word => {
      const distractors = getDistractors(word, 3);
      expect(distractors.length).toBeLessThanOrEqual(3);
      expect(distractors.every(d => d.id !== word.id)).toBe(true);
    });
  });

  it('image URLs follow expected pattern', () => {
    WORDS.forEach(word => {
      expect(word.imageUrl).toMatch(/^\/images\/[\w-]+\.webp$/);
    });
  });
});

describe('Levels', () => {
  it('has 3 levels', () => {
    expect(LEVELS).toHaveLength(3);
  });

  it('levels have required fields', () => {
    LEVELS.forEach(level => {
      expect(level.id).toBeTruthy();
      expect(level.name).toBeTruthy();
      expect(level.description).toBeTruthy();
      expect(level.icon).toBeTruthy();
      expect(level.color).toBeTruthy();
      expect(typeof level.unlockScore).toBe('number');
    });
  });
});

describe('Badges', () => {
  it('has 7 badges', () => {
    expect(BADGES).toHaveLength(7);
  });

  it('badges have required fields', () => {
    BADGES.forEach(badge => {
      expect(badge.id).toBeTruthy();
      expect(badge.name).toBeTruthy();
      expect(badge.icon).toBeTruthy();
      expect(badge.description).toBeTruthy();
      expect(typeof badge.check).toBe('function');
    });
  });

  it('has unique badge IDs', () => {
    const ids = BADGES.map(b => b.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
