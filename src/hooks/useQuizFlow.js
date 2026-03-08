import { useState, useCallback } from 'react';
import { selectQuizWords, updateWordSR } from '../utils/spaced-repetition';
import { preloadImages } from '../utils/images';
import { updateStreak, updateDailyGoal } from '../utils/storage';
import { BADGES } from '../data/badges';
import { playSound } from '../utils/sound';
import { analytics } from '../utils/analytics';

export default function useQuizFlow({ stats, setStats, navigate }) {
  const [selectedLevel, setSelectedLevel] = useState(null);
  const [selectedMode, setSelectedMode] = useState(null);
  const [quizWords, setQuizWords] = useState([]);
  const [quizResults, setQuizResults] = useState(null);
  const [customWords, setCustomWords] = useState(null);
  const [loadingProgress, setLoadingProgress] = useState(0);

  const startQuiz = useCallback(async (level, mode, words = null) => {
    setSelectedLevel(level);
    setSelectedMode(mode);
    if (level) analytics.quizFunnelLevel(level);
    if (mode) analytics.quizFunnelMode(mode);
    navigate('loading');
    setLoadingProgress(0);

    const { getWordsByLevel, getDistractors } = await import('../data/words');
    const pool = words || getWordsByLevel(level);
    const selected = selectQuizWords(pool, stats.wordProgress, 10);

    if (selected.length === 0) {
      navigate('menu');
      return;
    }

    // Pre-assign distractors so the same ones are used during preload and display
    const wordDistractions = new Map();
    const allWordsNeeded = new Set();
    selected.forEach(w => {
      const distractors = getDistractors(w, 3);
      wordDistractions.set(w.id, distractors);
      allWordsNeeded.add(w);
      distractors.forEach(d => allWordsNeeded.add(d));
    });

    const { missing } = await preloadImages([...allWordsNeeded], (progress) => {
      setLoadingProgress(progress * 100);
    });

    // Filter out quiz words whose images (or distractors' images) failed to load
    const missingIds = new Set(missing.map(m => m.id));
    const validWords = selected.filter(w => {
      if (missingIds.has(w.id)) return false;
      // Replace any distractors whose images failed
      const distractors = wordDistractions.get(w.id).filter(d => !missingIds.has(d.id));
      if (distractors.length < 3) return false; // not enough valid distractors
      wordDistractions.set(w.id, distractors.slice(0, 3));
      return true;
    });
    if (import.meta.env.DEV && missing.length > 0) {
      console.warn('Skipping words with missing images:', [...missingIds]);
    }

    if (validWords.length === 0) {
      navigate('menu');
      return;
    }

    // Attach pre-assigned distractors to each word
    const wordsWithDistractors = validWords.map(w => ({
      ...w,
      _distractors: wordDistractions.get(w.id),
    }));

    setQuizWords(wordsWithDistractors);
    analytics.quizStart(mode, level);
    const stateMap = { image: 'imageQuiz', word: 'wordQuiz', audio: 'audioQuiz', listen: 'listenMatchQuiz' };
    navigate(stateMap[mode] || 'imageQuiz');
  }, [navigate, stats.wordProgress]);

  const handleQuizComplete = useCallback((results) => {
    const { score, total, answers, mode } = results;

    setStats(prev => {
      let updated = {
        ...prev,
        totalQuizzes: prev.totalQuizzes + 1,
        quizHistory: [
          ...prev.quizHistory,
          { date: new Date().toISOString(), mode, level: selectedLevel, score, total },
        ],
      };

      // Update best score
      if (selectedLevel && score > (updated.bestScores[selectedLevel] || 0)) {
        updated.bestScores = { ...updated.bestScores, [selectedLevel]: score };
      }

      // Unlock next level
      if (selectedLevel && score >= 7 && total === 10) {
        const levels = ['beginner', 'intermediate', 'advanced'];
        const idx = levels.indexOf(selectedLevel);
        if (idx < levels.length - 1) {
          const nextLevel = levels[idx + 1];
          if (!updated.unlockedLevels.includes(nextLevel)) {
            updated.unlockedLevels = [...updated.unlockedLevels, nextLevel];
          }
        }
      }

      // Update word progress from answers
      if (answers) {
        let wp = { ...updated.wordProgress };
        answers.forEach(({ wordId, correct }) => {
          wp = updateWordSR(wp, wordId, correct);
        });
        updated.wordProgress = wp;
      }

      // Update streak and daily goal
      updated = updateStreak(updated);
      updated = updateDailyGoal(updated, answers?.length || total);

      // Check badges
      const game = { score, total, mode, level: selectedLevel };
      const newBadges = [];
      BADGES.forEach(badge => {
        if (!updated.badges.includes(badge.id) && badge.check(updated, game)) {
          newBadges.push(badge.id);
        }
      });
      if (newBadges.length > 0) {
        updated.badges = [...updated.badges, ...newBadges];
        playSound('badge');
      }

      return updated;
    });

    setQuizResults(results);
    analytics.quizComplete(mode, selectedLevel, score, total);
    navigate('finished');
  }, [selectedLevel, navigate, setStats]);

  const handleStartPersonalQuiz = useCallback((words, mode) => {
    setCustomWords(words);
    setSelectedMode(mode);
    startQuiz(null, mode, words);
  }, [startQuiz]);

  return {
    selectedLevel,
    selectedMode,
    quizWords,
    quizResults,
    customWords,
    loadingProgress,
    startQuiz,
    handleQuizComplete,
    handleStartPersonalQuiz,
  };
}
