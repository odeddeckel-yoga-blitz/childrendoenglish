import { useState, useEffect, useCallback, useRef } from 'react';
import { getDistractors } from '../data/words';
import { fisherYatesShuffle } from '../utils/shuffle';
import { playSound, speakWord } from '../utils/sound';
import { haptic } from '../utils/haptic';
import { t } from '../utils/i18n';
import { analytics } from '../utils/analytics';
import { computeGain, FAST_ANSWER_MS } from '../utils/arcade';
import { initQueue, scheduleReask } from '../utils/reask';

export default function useQuizState({ words, mode, lang = 'en', onComplete, onAnswer, speakOnCorrect = true, speakDelay = 0 }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  // Arcade combo scoring (kidsdomath crossover). Accumulators live in a ref so
  // the completion payload always sees the final values (no stale closures);
  // arcadeScore state mirrors ref.score for display.
  const [arcadeScore, setArcadeScore] = useState(0);
  const arcadeRef = useRef({ score: 0, bestStreak: 0, fastAnswers: 0 });
  const questionShownAt = useRef(Date.now());
  const [answered, setAnswered] = useState(null); // null | 'correct' | 'wrong'
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [options, setOptions] = useState([]);
  const [showQuitConfirm, setShowQuitConfirm] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const feedbackTimeout = useRef(null);

  // The question queue: the quiz words plus re-asks of first-try misses
  // (utils/reask.js). A ref mirrors it so the auto-advance timer sees the
  // length the miss just produced. Score, answers and onAnswer = first tries.
  const [queue, setQueue] = useState(() => initQueue(words));
  const queueRef = useRef(queue);
  const retriesRef = useRef([]);
  const item = queue[currentIndex];
  const currentWord = item?.w;
  const isRetry = !!item?.retry;
  const total = queue.length;
  const scoreTotal = words.length;

  const advance = useCallback((finish) => {
    if (currentIndex + 1 >= queueRef.current.length) finish();
    else setCurrentIndex(i => i + 1);
  }, [currentIndex]);

  // On a first-try miss, queue the re-asks; on a re-ask, just record it.
  const noteResult = useCallback((correct) => {
    if (isRetry) {
      retriesRef.current.push({ wordId: currentWord.id, correct });
    } else if (!correct) {
      const next = scheduleReask(queueRef.current, currentIndex);
      if (next !== queueRef.current) { queueRef.current = next; setQueue(next); }
    }
  }, [isRetry, currentWord, currentIndex]);

  // Generate options for current question
  useEffect(() => {
    if (!currentWord) return;
    // Use pre-assigned distractors if available (from useQuizFlow preloading)
    const distractors = currentWord._distractors || getDistractors(currentWord, 3);
    setOptions(fisherYatesShuffle([currentWord, ...distractors]));
    setAnswered(null);
    setSelectedAnswer(null);
    setFeedbackMessage('');
    questionShownAt.current = Date.now(); // fast-answer clock starts now
  }, [currentIndex, currentWord]);

  // Cleanup timeout on unmount
  useEffect(() => () => clearTimeout(feedbackTimeout.current), []);

  const handleAnswer = useCallback((option) => {
    if (answered) return;

    const correct = option.id === currentWord.id;
    setSelectedAnswer(option.id);
    setAnswered(correct ? 'correct' : 'wrong');
    const entry = { wordId: currentWord.id, correct, selected: option.id };
    if (!isRetry) {
      setAnswers(prev => [...prev, entry]);
      analytics.quizAnswer(currentWord.id, correct, mode);
      onAnswer?.(item.orig, correct ? 'ok' : 'no');
    }
    noteResult(correct);
    const firstTries = isRetry ? answers : [...answers, entry];
    const finalScore = score + (correct && !isRetry ? 1 : 0);

    if (correct) {
      if (!isRetry) setScore(s => s + 1);
      setStreak(s => s + 1);
      // Arcade gain: combo multiplier grows with the streak, ×1.5 fast bonus
      const fast = Date.now() - questionShownAt.current < FAST_ANSWER_MS;
      const newStreak = streak + 1;
      const arc = arcadeRef.current;
      arc.score += computeGain(newStreak, fast);
      if (fast) arc.fastAnswers += 1;
      if (newStreak > arc.bestStreak) arc.bestStreak = newStreak;
      setArcadeScore(arc.score);
      setFeedbackMessage(t('feedbackCorrect', lang, { word: currentWord.word }));
      playSound('correct');
      haptic('success');
      if (speakOnCorrect) speakWord(currentWord.word);
    } else {
      setStreak(0);
      setFeedbackMessage(t('feedbackWrong', lang, { word: currentWord.word }));
      playSound('wrong');
      haptic('error');
      if (speakDelay > 0) {
        setTimeout(() => speakWord(currentWord.word), speakDelay);
      } else if (speakOnCorrect) {
        speakWord(currentWord.word);
      }
    }

    // Auto-advance
    feedbackTimeout.current = setTimeout(() => advance(() => onComplete({
      score: finalScore,
      total: scoreTotal,
      mode,
      answers: firstTries,
      retries: retriesRef.current.slice(),
      arcade: { ...arcadeRef.current },
    })), 1200);
  }, [answered, currentWord, item, isRetry, scoreTotal, score, streak, answers, onComplete, onAnswer, mode, lang, speakOnCorrect, speakDelay, advance, noteResult]);

  const handleSkip = useCallback(() => {
    if (answered) return;

    setAnswered('wrong');
    setFeedbackMessage(t('feedbackSkipped', lang, { word: currentWord.word }));
    const entry = { wordId: currentWord.id, correct: false, selected: null };
    if (!isRetry) {
      setAnswers(prev => [...prev, entry]);
      onAnswer?.(item.orig, 'skip');
    }
    noteResult(false);
    const firstTries = isRetry ? answers : [...answers, entry];
    setStreak(0);
    speakWord(currentWord.word);

    feedbackTimeout.current = setTimeout(() => advance(() => onComplete({
      score,
      total: scoreTotal,
      mode,
      answers: firstTries,
      retries: retriesRef.current.slice(),
      arcade: { ...arcadeRef.current },
    })), 1200);
  }, [answered, currentWord, item, isRetry, scoreTotal, score, answers, onComplete, onAnswer, mode, lang, advance, noteResult]);

  const handleQuit = useCallback(() => {
    clearTimeout(feedbackTimeout.current);
    // quiz_quit is fired by useQuizFlow's handleQuizComplete, which knows the level
    onComplete({ score, total: answers.length, mode, answers, retries: retriesRef.current.slice(), quit: true, arcade: { ...arcadeRef.current } });
  }, [score, mode, answers, onComplete]);

  const openQuitConfirm = useCallback(() => setShowQuitConfirm(true), []);
  const closeQuitConfirm = useCallback(() => setShowQuitConfirm(false), []);

  return {
    currentIndex,
    currentWord,
    total,
    scoreTotal,
    isRetry,
    score,
    streak,
    arcadeScore,
    answered,
    selectedAnswer,
    options,
    showQuitConfirm,
    feedbackMessage,
    handleAnswer,
    handleSkip,
    handleQuit,
    openQuitConfirm,
    closeQuitConfirm,
  };
}
