import { useState, useCallback } from 'react';
import { getWordsByLevel, getDistractors } from '../data/words';
import { selectQuizWords, updateWordSR } from '../utils/spaced-repetition';
import { preloadImages } from '../utils/images';
import { updateStreak, updateDailyGoal } from '../utils/storage';
import { BADGES } from '../data/badges';
import { playSound } from '../utils/sound';

export default function useQuizFlow({ stats, setStats, navigate }) {
  const [selectedLevel, setSelectedLevel] = useState(null);
  const [selectedMode, setSelectedMode] = useState(null);
  const [quizWords, setQuizWords] = useState([]);
  const [quizResults, setQuizResults] = useState(null);
  const [customWords, setCustomWords] = useState(null);
  const [loadingProgress, setLoadingProgress] = useState(0);

  const handleLevelSelect = useCallback((level) => {
    setSelectedLevel(level);
    navigate('modeSelect');
  }, [navigate]);

  const startQuiz = useCallback(async (level, mode, words = null) => {
    navigate('loading');
    setLoadingProgress(0);

    const pool = words || getWordsByLevel(level);
    const selected = selectQuizWords(pool, stats.wordProgress, 10);

    if (selected.length === 0) {
      navigate('menu');
      return;
    }

    // Collect all images needed (quiz words + their distractors)
    const allWordsNeeded = new Set();
    selected.forEach(w => {
      allWordsNeeded.add(w);
      getDistractors(w, 3).forEach(d => allWordsNeeded.add(d));
    });

    const { missing } = await preloadImages([...allWordsNeeded], (progress) => {
      setLoadingProgress(progress * 100);
    });

    if (missing.length > 0) {
      console.warn('Missing images:', missing.map(m => m.id));
    }

    setQuizWords(selected);
    const stateMap = { image: 'imageQuiz', word: 'wordQuiz', audio: 'audioQuiz', listen: 'listenMatchQuiz' };
    navigate(stateMap[mode] || 'imageQuiz');
  }, [navigate, stats.wordProgress]);

  const handleModeSelect = useCallback((mode) => {
    setSelectedMode(mode);
    startQuiz(selectedLevel, mode);
  }, [selectedLevel, startQuiz]);

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
    handleLevelSelect,
    handleModeSelect,
    startQuiz,
    handleQuizComplete,
    handleStartPersonalQuiz,
  };
}
