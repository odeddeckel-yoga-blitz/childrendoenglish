export const BADGES = [
  {
    id: 'first_word',
    nameKey: 'badge_first_word',
    descKey: 'badge_first_word_desc',
    icon: '🎯',
    check: (stats) => stats.totalQuizzes >= 1,
  },
  {
    id: 'word_explorer',
    nameKey: 'badge_word_explorer',
    descKey: 'badge_word_explorer_desc',
    icon: '🔍',
    check: (stats) => Object.keys(stats.wordProgress || {}).length >= 20,
  },
  {
    id: 'perfect_quiz',
    nameKey: 'badge_perfect_quiz',
    descKey: 'badge_perfect_quiz_desc',
    icon: '💯',
    check: (stats, game) => game && game.score === game.total && game.total > 0,
  },
  {
    id: 'bookworm',
    nameKey: 'badge_bookworm',
    descKey: 'badge_bookworm_desc',
    icon: '📚',
    check: (stats) => stats.totalQuizzes >= 10,
  },
  {
    id: 'vocab_champion',
    nameKey: 'badge_vocab_champion',
    descKey: 'badge_vocab_champion_desc',
    icon: '🏆',
    check: (stats) => {
      const mastered = Object.values(stats.wordProgress || {}).filter(
        w => w.interval >= 14
      ).length;
      return mastered >= 50;
    },
  },
  {
    id: 'week_warrior',
    nameKey: 'badge_week_warrior',
    descKey: 'badge_week_warrior_desc',
    icon: '🔥',
    check: (stats) => stats.currentStreak >= 7,
  },
  {
    id: 'polyglot',
    nameKey: 'badge_polyglot',
    descKey: 'badge_polyglot_desc',
    icon: '🌍',
    check: (stats) => Object.keys(stats.wordProgress || {}).length >= 100,
  },
];
