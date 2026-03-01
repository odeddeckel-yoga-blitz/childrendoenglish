/** @module storage — localStorage persistence for user stats, player profiles, and preferences */

const LEGACY_STATS_KEY = 'childrendoenglish-stats';
const PLAYERS_KEY = 'childrendoenglish-players';
const PLAYER_PREFIX = 'childrendoenglish-player-';
const DARK_KEY = 'childrendoenglish-dark';
const SOUND_KEY = 'childrendoenglish-sound';

/** @returns {Stats} Default stats object with all fields initialized */
const getDefaultStats = () => ({
  totalQuizzes: 0,
  bestScores: { beginner: 0, intermediate: 0, advanced: 0 },
  badges: [],
  unlockedLevels: ['beginner'],
  wordProgress: {},        // { [wordId]: { lastSeen, interval, easeFactor, correct, wrong } }
  dailyGoal: { date: null, wordsReviewed: 0 },
  currentStreak: 0,
  longestStreak: 0,
  lastActiveDate: null,
  hasSeenOnboarding: false,
  uiLanguage: 'en',        // 'en' | 'he'
  assessmentLevel: null,    // result from placement quiz
  quizHistory: [],          // [{ date, mode, level, score, total }]
});

const generateId = () => 'player_' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

// --- Player Registry ---

/** Load the player registry, auto-migrating from legacy single-player format if needed. */
export const loadPlayerRegistry = () => {
  try {
    const saved = localStorage.getItem(PLAYERS_KEY);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.warn('Failed to load player registry:', e);
  }

  // Check for legacy stats that need migration
  try {
    const legacy = localStorage.getItem(LEGACY_STATS_KEY);
    if (legacy) {
      const parsed = JSON.parse(legacy);
      const id = generateId();
      const registry = {
        schemaVersion: 2,
        activePlayerId: id,
        players: [
          { id, name: 'Player 1', avatar: '⭐', canRead: true, createdAt: new Date().toISOString() },
        ],
      };
      // Copy old stats to new per-player key
      localStorage.setItem(PLAYER_PREFIX + id, legacy);
      savePlayerRegistry(registry);
      // Keep old key as backup (don't delete)
      return registry;
    }
  } catch (e) {
    console.warn('Failed to migrate legacy stats:', e);
  }

  return null; // No registry and no legacy data — first-ever use
};

export const savePlayerRegistry = (registry) => {
  try {
    localStorage.setItem(PLAYERS_KEY, JSON.stringify(registry));
  } catch (e) {
    console.warn('Failed to save player registry:', e);
  }
};

export const addPlayer = (name, avatar, canRead) => {
  const registry = loadPlayerRegistry() || {
    schemaVersion: 2,
    activePlayerId: null,
    players: [],
  };
  const id = generateId();
  const player = { id, name, avatar, canRead, createdAt: new Date().toISOString() };
  registry.players.push(player);
  if (!registry.activePlayerId) registry.activePlayerId = id;
  // Initialize empty stats for new player
  try {
    localStorage.setItem(PLAYER_PREFIX + id, JSON.stringify(getDefaultStats()));
  } catch (e) {
    console.warn('Failed to init player stats:', e);
  }
  savePlayerRegistry(registry);
  return id;
};

export const removePlayer = (id) => {
  const registry = loadPlayerRegistry();
  if (!registry) return;
  registry.players = registry.players.filter(p => p.id !== id);
  try { localStorage.removeItem(PLAYER_PREFIX + id); } catch {}
  if (registry.activePlayerId === id) {
    registry.activePlayerId = registry.players[0]?.id || null;
  }
  savePlayerRegistry(registry);
};

export const resetPlayerProgress = (id) => {
  try {
    localStorage.setItem(PLAYER_PREFIX + id, JSON.stringify(getDefaultStats()));
  } catch (e) {
    console.warn('Failed to reset player progress:', e);
  }
};

export const updatePlayerProfile = (id, updates) => {
  const registry = loadPlayerRegistry();
  if (!registry) return;
  const player = registry.players.find(p => p.id === id);
  if (!player) return;
  if (updates.name !== undefined) player.name = updates.name;
  if (updates.avatar !== undefined) player.avatar = updates.avatar;
  if (updates.canRead !== undefined) player.canRead = updates.canRead;
  savePlayerRegistry(registry);
};

// --- Stats (now per-player) ---

/** Load stats for a player. Defaults to active player if no id given. */
export const loadStats = (playerId) => {
  const id = playerId || loadPlayerRegistry()?.activePlayerId;
  if (id) {
    try {
      const saved = localStorage.getItem(PLAYER_PREFIX + id);
      if (saved) return { ...getDefaultStats(), ...JSON.parse(saved) };
    } catch (e) {
      console.warn('Failed to load player stats:', e);
    }
  }
  // Fallback: try legacy key (pre-migration or no registry)
  try {
    const saved = localStorage.getItem(LEGACY_STATS_KEY);
    if (saved) return { ...getDefaultStats(), ...JSON.parse(saved) };
  } catch (e) {
    console.warn('Failed to load stats:', e);
  }
  return getDefaultStats();
};

/** Persist stats. Defaults to active player if no id given. */
export const saveStats = (stats, playerId) => {
  const id = playerId || loadPlayerRegistry()?.activePlayerId;
  if (id) {
    try {
      localStorage.setItem(PLAYER_PREFIX + id, JSON.stringify(stats));
    } catch (e) {
      console.warn('Failed to save player stats:', e);
    }
  } else {
    // No registry yet — save to legacy key
    try {
      localStorage.setItem(LEGACY_STATS_KEY, JSON.stringify(stats));
    } catch (e) {
      console.warn('Failed to save stats:', e);
    }
  }
};

// --- Global preferences (unchanged) ---

export const isDarkMode = () => {
  try {
    const saved = localStorage.getItem(DARK_KEY);
    if (saved !== null) return saved === 'true';
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches || false;
  } catch {
    return false;
  }
};

export const saveDarkMode = (dark) => {
  try {
    localStorage.setItem(DARK_KEY, String(dark));
  } catch {}
};

export const isSoundEnabled = () => {
  try {
    const saved = localStorage.getItem(SOUND_KEY);
    return saved !== 'false'; // default enabled
  } catch {
    return true;
  }
};

export const saveSoundEnabled = (enabled) => {
  try {
    localStorage.setItem(SOUND_KEY, String(enabled));
  } catch {}
};

/**
 * Update the user's daily streak. Increments if last active was yesterday,
 * resets to 1 if a day was missed, no-op if already active today.
 * @param {Stats} stats
 * @returns {Stats} Updated stats with currentStreak, longestStreak, lastActiveDate
 */
export const updateStreak = (stats) => {
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

  if (stats.lastActiveDate === today) return stats;

  const newStreak = stats.lastActiveDate === yesterday
    ? stats.currentStreak + 1
    : 1;

  return {
    ...stats,
    currentStreak: newStreak,
    longestStreak: Math.max(newStreak, stats.longestStreak),
    lastActiveDate: today,
  };
};

/**
 * Add reviewed words to today's daily goal counter. Resets if the date changed.
 * @param {Stats} stats
 * @param {number} wordsCount - Number of words reviewed in this session
 * @returns {Stats} Updated stats with dailyGoal.wordsReviewed incremented
 */
export const updateDailyGoal = (stats, wordsCount) => {
  const today = new Date().toISOString().slice(0, 10);
  const daily = stats.dailyGoal;

  if (daily.date === today) {
    return {
      ...stats,
      dailyGoal: { date: today, wordsReviewed: daily.wordsReviewed + wordsCount },
    };
  }

  return {
    ...stats,
    dailyGoal: { date: today, wordsReviewed: wordsCount },
  };
};
