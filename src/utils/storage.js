const STORAGE_KEY = 'childrendoenglish-stats';
const DARK_KEY = 'childrendoenglish-dark';
const SOUND_KEY = 'childrendoenglish-sound';

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

export const loadStats = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return { ...getDefaultStats(), ...parsed };
    }
  } catch (e) {
    console.warn('Failed to load stats:', e);
  }
  return getDefaultStats();
};

export const saveStats = (stats) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
  } catch (e) {
    console.warn('Failed to save stats:', e);
  }
};

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

// Update streak based on today's date
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

// Update daily goal
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
