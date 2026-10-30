import { useState, useCallback, useRef } from 'react';
import { selectQuizWords, updateWordSR } from '../utils/spaced-repetition';
import { preloadImages } from '../utils/images';
import { updateStreak, updateDailyGoal } from '../utils/storage';
import { BADGES } from '../data/badges';
import { playSound } from '../utils/sound';
import { analytics } from '../utils/analytics';
import { sendLearn, sendLearnBatch } from '../utils/learnBeacon';

// A player who has never finished a quiz nor answered a word (a quit keeps its
// word progress, so this stays true only until the first real answer).
const isFreshPlayer = (s) => !s?.totalQuizzes && !Object.keys(s?.wordProgress || {}).length;

// A brand-new player's first quiz is short: only ~1/3 finished the 10-question
// first quiz (onb funnel 10-18→21: 28 started, 9 done, 6 quit, 13 vanished).
// Reaching the result screen fast matters more than covering the whole set —
// the ladder's later steps revisit the same words anyway.
export const FIRST_QUIZ_LEN = 5;
export const QUIZ_LEN = 10;

export default function useQuizFlow({ stats, setStats, navigate, knownLetters = null }) {
  const [selectedLevel, setSelectedLevel] = useState(null);
  const [selectedMode, setSelectedMode] = useState(null);
  const [quizWords, setQuizWords] = useState([]);
  const [quizResults, setQuizResults] = useState(null);
  const [customWords, setCustomWords] = useState(null);
  const [loadingProgress, setLoadingProgress] = useState(0);

  // Where the running quiz was started from (qs learn event): menu | ladder |
  // shared | letter | mywords | learn | again | quick | other. A retry keeps the original.
  const srcRef = useRef('other');

  const startQuiz = useCallback(async (level, mode, words = null, src) => {
    if (src) srcRef.current = src;
    setSelectedLevel(level);
    setSelectedMode(mode);
    if (level) analytics.quizFunnelLevel(level);
    if (mode) analytics.quizFunnelMode(mode);
    navigate('loading');
    setLoadingProgress(0);

    const { getWordsByLevel, getDistractors, WORDS } = await import('../data/words');
    const { filterByKnownLetters } = await import('../utils/letterFilter');
    const { gloss } = await import('../utils/i18n');
    // Distractors must not share a meaning with the target in the learner's language
    const uiLang = stats.uiLanguage || 'en';
    const glossOf = uiLang === 'en' ? null : (x) => gloss(x, uiLang);
    // Custom word lists (personal list) are parent-picked — never filtered.
    const pool = words || filterByKnownLetters(getWordsByLevel(level), knownLetters);
    // Distractor options must be readable too — restrict them to known letters
    // (getDistractors tops up from the full vocabulary only if it runs dry).
    const restrict = knownLetters?.length ? filterByKnownLetters(WORDS, knownLetters) : null;
    let selected = selectQuizWords(pool, stats.wordProgress, isFreshPlayer(stats) ? FIRST_QUIZ_LEN : QUIZ_LEN);
    // A brand-new player's first question is one most kids get right (U2).
    if (isFreshPlayer(stats) && !words) {
      const [{ easyFirst }, { default: cdeStats }] = await Promise.all([
        import('../utils/easyFirst'), import('../data/cde-stats.json'),
      ]);
      selected = easyFirst(selected, pool, cdeStats.words);
    }

    if (selected.length === 0) {
      navigate('menu');
      return;
    }

    // Pre-assign distractors so the same ones are used during preload and display
    const wordDistractions = new Map();
    const allWordsNeeded = new Set();
    selected.forEach(w => {
      const distractors = getDistractors(w, 3, restrict, glossOf);
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
    sendLearn('quiz_start', mode || 'unknown');
    sendLearn('qs', `${isFreshPlayer(stats) ? 'new-' : ''}${srcRef.current}_start`);
    if (isFreshPlayer(stats)) sendLearn('onb', 'q1_start');
    const stateMap = { image: 'imageQuiz', word: 'wordQuiz', audio: 'audioQuiz', listen: 'listenMatchQuiz' };
    navigate(stateMap[mode] || 'imageQuiz');
  }, [navigate, stats, knownLetters]);

  // Where in the first quiz does a brand-new player stop? q1_start/done/quit
  // can't tell (2026-10-25: 16 of 34 first quizzes ended with neither), so
  // each first-quiz answer fires onb q1_a<n>_<ok|no|skip>.
  const handleQuizAnswer = useCallback((index, result) => {
    if (isFreshPlayer(stats)) sendLearn('onb', `q1_a${index + 1}_${result}`);
  }, [stats]);

  const handleQuizComplete = useCallback((results) => {
    const { score, total, answers, mode, quit } = results;

    // Per-word learning tallies → one batched cookieless beacon per quiz
    // (feeds the Word Learning Optimizer's hardest-words ranking).
    if (Array.isArray(answers) && answers.length > 0) {
      sendLearnBatch(answers.map(a => ({ e: a.correct ? 'ans_ok' : 'ans_no', i: String(a.wordId) })));
      // Per-asset split (amber lesson: a hard word under ONE probe = that asset's
      // problem — image / audio / the word itself). Separate batch (30-event cap).
      const probe = { image: 'img', word: 'txt', listen: 'aud', audio: 'aud' }[mode];
      if (probe) sendLearnBatch(answers.map(a => ({ e: a.correct ? 'ansm_ok' : 'ansm_no', i: `${a.wordId}@${probe}` })));
      // What a wrong answer picked instead (target@chosen): a word that's hard
      // under one probe could be a bad asset, or one distractor that reads as a
      // second right answer — only the pick tells them apart (arrow, 10-28).
      const picks = answers.filter(a => !a.correct && a.selected != null);
      if (picks.length > 0) sendLearnBatch(picks.map(a => ({ e: 'ansx', i: `${a.wordId}@${a.selected}` })));
    }
    // Re-asks of first-try misses (utils/reask.js, roadmap RL1): did the word
    // come back right 2–5 questions later? Kept out of ans_* so first-try stats
    // stay comparable with before.
    if (Array.isArray(results.retries) && results.retries.length > 0) {
      sendLearnBatch(results.retries.map(r => ({ e: r.correct ? 'rq_ok' : 'rq_no', i: String(r.wordId) })));
    }

    // Pure completion routine: applied inside the functional setStats updater
    // (safe against concurrent updates, StrictMode-friendly) AND once against
    // the current stats snapshot to derive the new-best flags for
    // the result screen. Nothing mutates stats mid-quiz, so both runs agree.
    const completeQuiz = (prev) => {
      let updated = { ...prev };
      let arcadeNewBest = false;
      let newBadges = [];

      // A quit is not a completed quiz: keep the learning that happened
      // (word progress, daily goal) but don't count the quiz, award
      // streak/badges, or unlock levels.
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
        if (selectedLevel && score >= 7 && total === QUIZ_LEN) {
          const levels = ['beginner', 'intermediate', 'advanced'];
          const idx = levels.indexOf(selectedLevel);
          if (idx < levels.length - 1) {
            const nextLevel = levels[idx + 1];
            if (!updated.unlockedLevels.includes(nextLevel)) {
              updated.unlockedLevels = [...updated.unlockedLevels, nextLevel];
            }
          }
        }

        // Arcade bookkeeping: per-mode best combo score, modes played, categories tried
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

      } else {
        updated = updateDailyGoal(updated, answers?.length || 0);
      }

      return { updated, newBadges, arcadeNewBest };
    };

    // Snapshot run: derive result-screen flags + reward sound
    const { newBadges, arcadeNewBest } = completeQuiz(stats);
    if (newBadges.length > 0) {
      playSound('badge');
    }

    setStats(prev => completeQuiz(prev).updated);
    setQuizResults({ ...results, arcadeNewBest });
    if (isFreshPlayer(stats)) sendLearn('onb', quit ? 'q1_quit' : 'q1_done');
    sendLearn('qs', `${isFreshPlayer(stats) ? 'new-' : ''}${srcRef.current}_${quit ? 'quit' : 'done'}`);
    if (quit) {
      analytics.quizQuit(mode, selectedLevel, answers?.length ?? 0);
      sendLearn('quiz_quit', mode || 'unknown');
    } else {
      analytics.quizComplete(mode, selectedLevel, score, total);
      sendLearn('quiz_done', mode || 'unknown');
    }
    navigate('finished');
  }, [selectedLevel, navigate, setStats, stats, quizWords]);

  const handleStartPersonalQuiz = useCallback((words, mode, src = 'personal') => {
    setCustomWords(words);
    setSelectedMode(mode);
    startQuiz(null, mode, words, src);
  }, [startQuiz]);

  return {
    selectedLevel,
    selectedMode,
    quizWords,
    quizResults,
    customWords,
    loadingProgress,
    startQuiz,
    handleQuizAnswer,
    handleQuizComplete,
    handleStartPersonalQuiz,
  };
}
