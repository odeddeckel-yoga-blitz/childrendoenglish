export const BADGES = [
  {
    id: 'first_word',
    name: 'First Word',
    icon: '🎯',
    description: 'Complete your first quiz',
    check: (stats) => stats.totalQuizzes >= 1,
  },
  {
    id: 'word_explorer',
    name: 'Word Explorer',
    icon: '🔍',
    description: 'Learn 20 different words',
    check: (stats) => Object.keys(stats.wordProgress || {}).length >= 20,
  },
  {
    id: 'perfect_quiz',
    name: 'Perfect Score',
    icon: '💯',
    description: 'Get 10/10 on any quiz',
    check: (stats, game) => game && game.score === game.total && game.total > 0,
  },
  {
    id: 'bookworm',
    name: 'Bookworm',
    icon: '📚',
    description: 'Complete 10 quizzes',
    check: (stats) => stats.totalQuizzes >= 10,
  },
  {
    id: 'vocab_champion',
    name: 'Vocab Champion',
    icon: '🏆',
    description: 'Master 50 words',
    check: (stats) => {
      const mastered = Object.values(stats.wordProgress || {}).filter(
        w => w.interval >= 14
      ).length;
      return mastered >= 50;
    },
  },
  {
    id: 'week_warrior',
    name: 'Week Warrior',
    icon: '🔥',
    description: 'Practice 7 days in a row',
    check: (stats) => stats.currentStreak >= 7,
  },
  {
    id: 'polyglot',
    name: 'Polyglot',
    icon: '🌍',
    description: 'Learn 100 different words',
    check: (stats) => Object.keys(stats.wordProgress || {}).length >= 100,
  },
];
