/** Interval ladder in days: 1 → 3 → 7 → 14 → 30, then doubles up to 60 */
const SR_INTERVALS = [1, 3, 7, 14, 30];
const DAY = 86400000;

/**
 * Sort words by spaced-repetition priority.
 * Priority: overdue (2) > unseen (1) > not-yet-due (0). Ties broken randomly.
 * @param {Array<{id: string}>} words - Word objects to sort
 * @param {Object<string, {lastSeen: number, interval: number}>} wordProgress - Per-word SR state
 * @returns {Array<{id: string}>} Sorted copy (does not mutate input)
 */
export const spacedRepetitionSort = (words, wordProgress) => {
  const now = Date.now();
  return [...words].sort((a, b) => {
    const cardA = wordProgress[a.id];
    const cardB = wordProgress[b.id];
    const scoreA = !cardA ? 1 : ((now - cardA.lastSeen) / DAY >= cardA.interval ? 2 : 0);
    const scoreB = !cardB ? 1 : ((now - cardB.lastSeen) / DAY >= cardB.interval ? 2 : 0);
    if (scoreA !== scoreB) return scoreB - scoreA;
    return Math.random() - 0.5;
  });
};

/**
 * Update a word's SR state after a quiz answer.
 * Correct → advance to next interval on the ladder (max 60 days).
 * Wrong → reset interval to 1 day.
 * @param {Object<string, {lastSeen: number, interval: number, correct: number, wrong: number}>} wordProgress
 * @param {string} wordId
 * @param {boolean} correct - Whether the answer was correct
 * @returns {Object} New wordProgress object (immutable update)
 */
export const updateWordSR = (wordProgress, wordId, correct) => {
  const card = wordProgress[wordId] || { lastSeen: 0, interval: 1, easeFactor: 2.5, correct: 0, wrong: 0 };

  if (correct) {
    const currentIdx = SR_INTERVALS.indexOf(card.interval);
    let nextInterval;
    if (currentIdx >= 0 && currentIdx < SR_INTERVALS.length - 1) {
      nextInterval = SR_INTERVALS[currentIdx + 1];
    } else if (card.interval >= 30) {
      nextInterval = Math.min(card.interval * 2, 60);
    } else {
      nextInterval = SR_INTERVALS[1]; // 3 days
    }

    return {
      ...wordProgress,
      [wordId]: {
        ...card,
        lastSeen: Date.now(),
        interval: nextInterval,
        correct: card.correct + 1,
        wrong: card.wrong,
      },
    };
  }

  // Wrong — reset to 1 day
  return {
    ...wordProgress,
    [wordId]: {
      ...card,
      lastSeen: Date.now(),
      interval: 1,
      wrong: card.wrong + 1,
      correct: card.correct,
    },
  };
};

/**
 * Select a balanced set of quiz words from a pool.
 * Mix: ~60% due for review, ~20% unseen, ~20% reinforcement.
 * Fills remaining slots from any pool if one is too small.
 * @param {Array<{id: string}>} words - Available word pool
 * @param {Object<string, {lastSeen: number, interval: number}>} wordProgress
 * @param {number} [count=10] - Number of words to select
 * @returns {Array<{id: string}>} Shuffled selection (length ≤ count)
 */
export const selectQuizWords = (words, wordProgress, count = 10) => {
  const now = Date.now();
  const due = [];
  const newWords = [];
  const reinforcement = [];

  for (const word of words) {
    const card = wordProgress[word.id];
    if (!card) {
      newWords.push(word);
    } else if ((now - card.lastSeen) / DAY >= card.interval) {
      due.push(word);
    } else {
      reinforcement.push(word);
    }
  }

  // Shuffle each pool
  const shuffle = (arr) => {
    const s = [...arr];
    for (let i = s.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [s[i], s[j]] = [s[j], s[i]];
    }
    return s;
  };

  const dueCount = Math.min(Math.ceil(count * 0.6), due.length);
  const newCount = Math.min(Math.ceil(count * 0.2), newWords.length);
  const reinforceCount = Math.min(count - dueCount - newCount, reinforcement.length);

  let selected = [
    ...shuffle(due).slice(0, dueCount),
    ...shuffle(newWords).slice(0, newCount),
    ...shuffle(reinforcement).slice(0, reinforceCount),
  ];

  // Fill remaining slots from any pool
  if (selected.length < count) {
    const selectedIds = new Set(selected.map(w => w.id));
    const remaining = words.filter(w => !selectedIds.has(w.id));
    selected = [...selected, ...shuffle(remaining).slice(0, count - selected.length)];
  }

  return shuffle(selected).slice(0, count);
};

/**
 * Check if a word is considered "mastered" (review interval ≥ 14 days).
 * @param {Object<string, {interval: number}>} wordProgress
 * @param {string} wordId
 * @returns {boolean}
 */
export const isWordMastered = (wordProgress, wordId) => {
  const card = wordProgress[wordId];
  return card && card.interval >= 14;
};
