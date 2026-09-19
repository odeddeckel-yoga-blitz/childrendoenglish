import { useState, useCallback } from 'react';
import { selectQuizWords, updateWordSR } from '../utils/spaced-repetition';
import { preloadImages } from '../utils/images';
import { updateStreak, updateDailyGoal } from '../utils/storage';
import { BADGES } from '../data/badges';
import { checkCritters } from '../data/critters';
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
    const { score, total, answers, mode, quit } = results;

    // Pure completion routine: applied inside the functional setStats updater
    // (safe against concurrent updates, StrictMode-friendly) AND once against
    // the current stats snapshot to derive the new-best/new-critter flags for
    // the result screen. Nothing mutates stats mid-quiz, so both runs agree.
    const completeQuiz = (prev) => {
      let updated = { ...prev };
      let arcadeNewBest = false;
      let newBadges = [];
      let newCritters = [];

      // A quit is not a completed quiz: keep the learning that happened
      // (word progress, daily goal) but don't count the quiz, award
      // streak/badges/critters, or unlock levels.
      if (!quit) {
        updated = {
          ...updated,
          totalQuizzes: updated.totalQuizzes + 1,
          quizHistory: [
            ...updated.quizHistory,
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

        // Arcade bookkeeping: per-mode best combo score, modes played,
        // categories tried (feeds the critter earn rules)
        const arcade = { ...(updated.arcade || {}) };
        const bestByMode = { ...(arcade.bestByMode || {}) };
        const runScore = results.arcade?.score || 0;
        if (mode && runScore > (bestByMode[mode] || 0)) {
          bestByMode[mode] = runScore;
          arcadeNewBest = true;
        }
        arcade.bestByMode = bestByMode;
        const modesPlayed = new Set(arcade.modesPlayed || []);
        if (mode) modesPlayed.add(mode);
        arcade.modesPlayed = [...modesPlayed];
        const cats = new Set(arcade.categoriesTried || []);
        quizWords.forEach(w => { if (w.category) cats.add(w.category); });
        arcade.categoriesTried = [...cats];
        updated.arcade = arcade;
      }

      // Update word progress from answers
      if (answers) {
        let wp = { ...updated.wordProgress };
        answers.forEach(({ wordId, correct }) => {
          wp = updateWordSR(wp, wordId, correct);
        });
        updated.wordProgress = wp;
      }

      if (!quit) {
        // Update streak and daily goal
        updated = updateStreak(updated);
        updated = updateDailyGoal(updated, answers?.length || total);

        // Check badges
        const game = { score, total, mode, level: selectedLevel };
        BADGES.forEach(badge => {
          if (!updated.badges.includes(badge.id) && badge.check(updated, game)) {
            newBadges.push(badge.id);
          }
        });
        if (newBadges.length > 0) {
          updated.badges = [...updated.badges, ...newBadges];
        }

        // Check collectible critters (hatchery)
        newCritters = checkCritters(updated, game);
        if (newCritters.length > 0) {
          updated.critters = [...(updated.critters || []), ...newCritters];
        }
      } else {
        updated = updateDailyGoal(updated, answers?.length || 0);
      }

      return { updated, newBadges, newCritters, arcadeNewBest };
    };

    // Snapshot run: derive result-screen flags + reward sound
    const { newBadges, newCritters, arcadeNewBest } = completeQuiz(stats);
    if (newBadges.length > 0 || newCritters.length > 0) {
      playSound('badge');
    }

    setStats(prev => completeQuiz(prev).updated);
    setQuizResults({ ...results, arcadeNewBest, newCritters });
    if (quit) {
      analytics.quizQuit(mode, selectedLevel, answers?.length ?? 0);
    } else {
      analytics.quizComplete(mode, selectedLevel, score, total);
    }
    navigate('finished');
  }, [selectedLevel, navigate, setStats, stats, quizWords]);

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
