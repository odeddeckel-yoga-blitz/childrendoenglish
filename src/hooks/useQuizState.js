import { useState, useEffect, useCallback, useRef } from 'react';
import { getDistractors } from '../data/words';
import { fisherYatesShuffle } from '../utils/shuffle';
import { playSound, speakWord } from '../utils/sound';
import { haptic } from '../utils/haptic';

export default function useQuizState({ words, mode, onComplete, speakOnCorrect = true, speakDelay = 0 }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [answered, setAnswered] = useState(null); // null | 'correct' | 'wrong'
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [options, setOptions] = useState([]);
  const [showQuitConfirm, setShowQuitConfirm] = useState(false);
  const feedbackTimeout = useRef(null);

  const currentWord = words[currentIndex];
  const total = words.length;

  // Generate options for current question
  useEffect(() => {
    if (!currentWord) return;
    const distractors = getDistractors(currentWord, 3);
    setOptions(fisherYatesShuffle([currentWord, ...distractors]));
    setAnswered(null);
    setSelectedAnswer(null);
  }, [currentIndex, currentWord]);

  // Cleanup timeout on unmount
  useEffect(() => () => clearTimeout(feedbackTimeout.current), []);

  const handleAnswer = useCallback((option) => {
    if (answered) return;

    const correct = option.id === currentWord.id;
    setSelectedAnswer(option.id);
    setAnswered(correct ? 'correct' : 'wrong');
    setAnswers(prev => [...prev, { wordId: currentWord.id, correct, selected: option.id }]);

    if (correct) {
      setScore(s => s + 1);
      setStreak(s => s + 1);
      playSound('correct');
      haptic('success');
      if (speakOnCorrect) speakWord(currentWord.word);
    } else {
      setStreak(0);
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
        });
      } else {
        setCurrentIndex(i => i + 1);
      }
    }, 1200);
  }, [answered, currentWord, currentIndex, total, score, answers, onComplete, mode, speakOnCorrect, speakDelay]);

  const handleSkip = useCallback(() => {
    if (answered) return;

    setAnswered('wrong');
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
        });
      } else {
        setCurrentIndex(i => i + 1);
      }
    }, 1200);
  }, [answered, currentWord, currentIndex, total, score, answers, onComplete, mode]);

  const handleQuit = useCallback(() => {
    clearTimeout(feedbackTimeout.current);
    onComplete({ score, total: currentIndex, mode, answers });
  }, [score, currentIndex, mode, answers, onComplete]);

  const openQuitConfirm = useCallback(() => setShowQuitConfirm(true), []);
  const closeQuitConfirm = useCallback(() => setShowQuitConfirm(false), []);

  return {
    currentIndex,
    currentWord,
    total,
    score,
    streak,
    answered,
    selectedAnswer,
    options,
    showQuitConfirm,
    handleAnswer,
    handleSkip,
    handleQuit,
    openQuitConfirm,
    closeQuitConfirm,
  };
}
