import { useState, useEffect, useCallback, useRef } from 'react';
import { getDistractors } from '../data/words';
import { fisherYatesShuffle } from '../utils/shuffle';
import { playSound, speakWord } from '../utils/sound';
import { haptic } from '../utils/haptic';
import { t } from '../utils/i18n';
import { analytics } from '../utils/analytics';
import { computeGain, FAST_ANSWER_MS } from '../utils/arcade';

export default function useQuizState({ words, mode, lang = 'en', onComplete, speakOnCorrect = true, speakDelay = 0 }) {
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

  const currentWord = words[currentIndex];
  const total = words.length;

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
    setAnswers(prev => [...prev, { wordId: currentWord.id, correct, selected: option.id }]);
    analytics.quizAnswer(currentWord.id, correct, mode);

    if (correct) {
      setScore(s => s + 1);
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
    feedbackTimeout.current = setTimeout(() => {
      if (currentIndex + 1 >= total) {
        onComplete({
          score: score + (correct ? 1 : 0),
          total,
          mode,
          answers: [...answers, { wordId: currentWord.id, correct, selected: option.id }],
          arcade: { ...arcadeRef.current },
        });
      } else {
        setCurrentIndex(i => i + 1);
      }
    }, 1200);
  }, [answered, currentWord, currentIndex, total, score, streak, answers, onComplete, mode, lang, speakOnCorrect, speakDelay]);

  const handleSkip = useCallback(() => {
    if (answered) return;

    setAnswered('wrong');
    setFeedbackMessage(t('feedbackSkipped', lang, { word: currentWord.word }));
    setAnswers(prev => [...prev, { wordId: currentWord.id, correct: false, selected: null }]);
    setStreak(0);
    speakWord(currentWord.word);

    feedbackTimeout.current = setTimeout(() => {
      if (currentIndex + 1 >= total) {
        onComplete({
          score,
          total,
          mode,
          answers: [...answers, { wordId: currentWord.id, correct: false, selected: null }],
          arcade: { ...arcadeRef.current },
        });
      } else {
        setCurrentIndex(i => i + 1);
      }
    }, 1200);
  }, [answered, currentWord, currentIndex, total, score, answers, onComplete, mode, lang]);

  const handleQuit = useCallback(() => {
    clearTimeout(feedbackTimeout.current);
    // quiz_quit is fired by useQuizFlow's handleQuizComplete, which knows the level
    onComplete({ score, total: currentIndex, mode, answers, quit: true, arcade: { ...arcadeRef.current } });
  }, [score, currentIndex, mode, answers, onComplete]);

  const openQuitConfirm = useCallback(() => setShowQuitConfirm(true), []);
  const closeQuitConfirm = useCallback(() => setShowQuitConfirm(false), []);

  return {
    currentIndex,
    currentWord,
    total,
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
