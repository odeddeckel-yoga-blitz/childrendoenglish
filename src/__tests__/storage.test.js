import { describe, it, expect, beforeEach } from 'vitest';
import {
  loadPlayerRegistry,
  savePlayerRegistry,
  addPlayer,
  removePlayer,
  loadStats,
  saveStats,
  exportAllData,
  importAllData,
  resetPlayerProgress,
} from '../utils/storage';

/** Create a fresh localStorage mock so tests stay isolated. */
const createStorageMock = () => {
  let store = {};
  return {
    getItem: (key) => (key in store ? store[key] : null),
    setItem: (key, value) => { store[key] = String(value); },
    removeItem: (key) => { delete store[key]; },
    clear: () => { store = {}; },
    get length() { return Object.keys(store).length; },
    key: (i) => Object.keys(store)[i] ?? null,
  };
};

beforeEach(() => {
  // Replace the global localStorage with a clean mock before every test.
  // Node 25+ ships a built-in localStorage that shadows jsdom's version and
  // lacks .clear(), so an explicit mock is the most reliable approach.
  const mock = createStorageMock();
  Object.defineProperty(globalThis, 'localStorage', {
    value: mock,
    writable: true,
    configurable: true,
  });
});

describe('loadPlayerRegistry', () => {
  it('returns null when no data exists', () => {
    expect(loadPlayerRegistry()).toBeNull();
  });
});

describe('savePlayerRegistry + loadPlayerRegistry roundtrip', () => {
  it('persists and retrieves a registry', () => {
    const registry = {
      schemaVersion: 2,
      activePlayerId: 'p1',
      players: [
        { id: 'p1', name: 'Alice', avatar: '⭐', canRead: true, createdAt: '2025-01-01T00:00:00.000Z' },
      ],
    };

    savePlayerRegistry(registry);
    const loaded = loadPlayerRegistry();

    expect(loaded).toEqual(registry);
  });
});

describe('addPlayer', () => {
  it('creates a player and returns an id', () => {
    const id = addPlayer('Bob', '🚀', false);

    expect(typeof id).toBe('string');
    expect(id).toMatch(/^player_/);

    const registry = loadPlayerRegistry();
    expect(registry.players).toHaveLength(1);
    expect(registry.players[0]).toMatchObject({
      id,
      name: 'Bob',
      avatar: '🚀',
      canRead: false,
    });
    // First player should become the active player
    expect(registry.activePlayerId).toBe(id);
  });
});

describe('removePlayer', () => {
  it('removes a player from the registry and clears their stats', () => {
    const id1 = addPlayer('Alice', '⭐', true);
    const id2 = addPlayer('Bob', '🚀', false);

    removePlayer(id1);

    const registry = loadPlayerRegistry();
    expect(registry.players).toHaveLength(1);
    expect(registry.players[0].id).toBe(id2);
    // Active player should switch to the remaining player
    expect(registry.activePlayerId).toBe(id2);
    // Removed player's stats key should be gone
    expect(localStorage.getItem('childrendoenglish-player-' + id1)).toBeNull();
  });
});

describe('loadStats', () => {
  it('returns default stats when no data exists', () => {
    const stats = loadStats();

    expect(stats).toEqual({
      totalQuizzes: 0,
      bestScores: { beginner: 0, intermediate: 0, advanced: 0 },
      badges: [],
      unlockedLevels: ['beginner'],
      wordProgress: {},
      dailyGoal: { date: null, wordsReviewed: 0 },
      currentStreak: 0,
      longestStreak: 0,
      lastActiveDate: null,
      hasSeenOnboarding: false,
      uiLanguage: 'en',
      assessmentLevel: null,
      quizHistory: [],
    });
  });
});

describe('saveStats + loadStats roundtrip', () => {
  it('persists and retrieves stats for a player', () => {
    const id = addPlayer('Alice', '⭐', true);

    const stats = {
      totalQuizzes: 5,
      bestScores: { beginner: 10, intermediate: 7, advanced: 0 },
      badges: ['first-quiz'],
      unlockedLevels: ['beginner', 'intermediate'],
      wordProgress: {},
      dailyGoal: { date: '2025-06-01', wordsReviewed: 12 },
      currentStreak: 3,
      longestStreak: 5,
      lastActiveDate: '2025-06-01',
      hasSeenOnboarding: true,
      uiLanguage: 'he',
      assessmentLevel: 'intermediate',
      quizHistory: [{ date: '2025-06-01', mode: 'quiz', level: 'beginner', score: 10, total: 10 }],
    };

    saveStats(stats, id);
    const loaded = loadStats(id);

    expect(loaded).toEqual(stats);
  });
});

describe('exportAllData', () => {
  it('returns a JSON blob containing registry and player stats', () => {
    const id = addPlayer('Alice', '⭐', true);
    saveStats({ totalQuizzes: 3 }, id);

    const exported = exportAllData();

    expect(exported).toHaveProperty('schemaVersion', 2);
    expect(exported).toHaveProperty('registry');
    expect(exported).toHaveProperty('playerStats');
    expect(exported).toHaveProperty('exportedAt');
    expect(exported.registry.players).toHaveLength(1);
    expect(exported.playerStats[id]).toBeDefined();
    expect(exported.playerStats[id].totalQuizzes).toBe(3);
  });
});

describe('importAllData', () => {
  it('validates and imports correctly', () => {
    const data = {
      schemaVersion: 2,
      registry: {
        schemaVersion: 2,
        activePlayerId: 'p_import',
        players: [
          { id: 'p_import', name: 'Imported', avatar: '🌟', canRead: true, createdAt: '2025-01-01T00:00:00.000Z' },
        ],
      },
      playerStats: {
        p_import: { totalQuizzes: 10, bestScores: { beginner: 8, intermediate: 0, advanced: 0 } },
      },
      exportedAt: '2025-06-01T00:00:00.000Z',
    };

    const result = importAllData(data);

    expect(result).toEqual({ success: true });

    const registry = loadPlayerRegistry();
    expect(registry.activePlayerId).toBe('p_import');
    expect(registry.players[0].name).toBe('Imported');

    const stats = loadStats('p_import');
    expect(stats.totalQuizzes).toBe(10);
  });

  it('rejects invalid data', () => {
    expect(importAllData(null)).toEqual({ success: false, error: 'importInvalidFormat' });
    expect(importAllData({})).toEqual({ success: false, error: 'importInvalidFormat' });
    expect(importAllData({ registry: {}, playerStats: {} })).toEqual({
      success: false,
      error: 'importInvalidRegistry',
    });
    expect(importAllData({ registry: { players: 'not-array' }, playerStats: {} })).toEqual({
      success: false,
      error: 'importInvalidRegistry',
    });
  });
});

describe('resetPlayerProgress', () => {
  it('resets stats for a player back to defaults', () => {
    const id = addPlayer('Alice', '⭐', true);
    saveStats({ totalQuizzes: 20, currentStreak: 7 }, id);

    resetPlayerProgress(id);

    const stats = loadStats(id);
    expect(stats.totalQuizzes).toBe(0);
    expect(stats.currentStreak).toBe(0);
    expect(stats.badges).toEqual([]);
    expect(stats.unlockedLevels).toEqual(['beginner']);
  });
});
