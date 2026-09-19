import { describe, it, expect } from 'vitest';
import { CRITTERS, checkCritters, getCritterById } from '../data/critters';

const baseStats = () => ({
  totalQuizzes: 0,
  longestStreak: 0,
  critters: [],
  arcade: {
    bestByMode: {},
    lightningBest: {},
    lightningRounds: 0,
    categoriesTried: [],
    modesPlayed: [],
  },
});

describe('critters data', () => {
  it('has 12 critters with unique ids and i18n keys', () => {
    expect(CRITTERS).toHaveLength(12);
    const ids = CRITTERS.map(c => c.id);
    expect(new Set(ids).size).toBe(12);
    CRITTERS.forEach(c => {
      expect(c.emoji).toBeTruthy();
      expect(c.nameKey).toMatch(/^critter_/);
      expect(c.hintKey).toMatch(/^critter_/);
      expect(typeof c.check).toBe('function');
    });
  });

  it('getCritterById resolves and misses safely', () => {
    expect(getCritterById('fox').emoji).toBe('🦊');
    expect(getCritterById('nope')).toBeUndefined();
  });
});

describe('critter earn rules', () => {
  it('earns nothing on empty stats', () => {
    expect(checkCritters(baseStats())).toEqual([]);
  });

  it('chick hatches on first quiz, fox at 3, dino at 25', () => {
    expect(checkCritters({ ...baseStats(), totalQuizzes: 1 })).toEqual(['chick']);
    expect(checkCritters({ ...baseStats(), totalQuizzes: 3 })).toEqual(['chick', 'fox']);
    expect(checkCritters({ ...baseStats(), totalQuizzes: 25 })).toContain('dino');
  });

  it('owl needs a perfect game context', () => {
    const stats = baseStats();
    expect(checkCritters(stats, { score: 9, total: 10 })).not.toContain('owl');
    expect(checkCritters(stats, { score: 10, total: 10 })).toContain('owl');
    expect(checkCritters(stats, { score: 0, total: 0 })).not.toContain('owl');
    expect(checkCritters(stats)).not.toContain('owl');
  });

  it('turtle at 5-day streak, panda at 7', () => {
    const s5 = { ...baseStats(), longestStreak: 5 };
    expect(checkCritters(s5)).toEqual(['turtle']);
    const s7 = { ...baseStats(), longestStreak: 7 };
    expect(checkCritters(s7)).toEqual(expect.arrayContaining(['turtle', 'panda']));
  });

  it('frog on first lightning round, unicorn on lightning best >= 10', () => {
    const s = baseStats();
    s.arcade.lightningRounds = 1;
    s.arcade.lightningBest = { image: 4 };
    expect(checkCritters(s)).toEqual(['frog']);
    s.arcade.lightningBest = { image: 4, audio: 10 };
    expect(checkCritters(s)).toEqual(['frog', 'unicorn']);
  });

  it('octopus on 3 categories, whale on 4 modes, eagle on best >= 200', () => {
    const s = baseStats();
    s.arcade.categoriesTried = ['animals', 'food', 'colors'];
    expect(checkCritters(s)).toContain('octopus');
    s.arcade.modesPlayed = ['image', 'word', 'audio', 'listen'];
    expect(checkCritters(s)).toContain('whale');
    s.arcade.bestByMode = { image: 199 };
    expect(checkCritters(s)).not.toContain('eagle');
    s.arcade.bestByMode = { image: 200 };
    expect(checkCritters(s)).toContain('eagle');
  });

  it('is idempotent: already-earned critters are not returned again', () => {
    const s = { ...baseStats(), totalQuizzes: 3, critters: ['chick'] };
    expect(checkCritters(s)).toEqual(['fox']);
  });

  it('does not mutate the passed stats object', () => {
    const s = { ...baseStats(), totalQuizzes: 1 };
    checkCritters(s);
    expect(s.critters).toEqual([]);
  });

  it('star hatches only when all other critters are earned — including same-pass earns', () => {
    const allButStarAndChick = CRITTERS.filter(c => c.id !== 'star' && c.id !== 'chick').map(c => c.id);
    const s = { ...baseStats(), totalQuizzes: 1, critters: allButStarAndChick };
    // chick hatches in this pass, completing the set -> star hatches too
    expect(checkCritters(s)).toEqual(['chick', 'star']);
  });

  it('survives missing arcade sub-object (legacy player stats)', () => {
    const s = { totalQuizzes: 2, critters: [] };
    expect(() => checkCritters(s)).not.toThrow();
    expect(checkCritters(s)).toEqual(['chick']);
  });
});
