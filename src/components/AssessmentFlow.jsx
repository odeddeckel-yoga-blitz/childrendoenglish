import { useState, useEffect, useCallback, useRef } from 'react';
import { WORDS, getDistractors } from '../data/words';
import { fisherYatesShuffle } from '../utils/shuffle';
import { getImageUrl } from '../utils/images';
import { playSound, speakWord } from '../utils/sound';
import { haptic } from '../utils/haptic';
import { t } from '../utils/i18n';

export default function AssessmentFlow({ lang = 'en', onComplete, onSkip }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentLevel, setCurrentLevel] = useState('intermediate');
  const [questions, setQuestions] = useState([]);
  const [options, setOptions] = useState([]);
  const [answered, setAnswered] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [results, setResults] = useState({ correct: 0, wrong: 0, levelHistory: [] });
  const [imgLoaded, setImgLoaded] = useState(false);
  const feedbackTimeout = useRef(null);

  const totalQuestions = 15;

  // Build question pool
  useEffect(() => {
    const pool = fisherYatesShuffle(WORDS);
    setQuestions(pool);
  }, []);

  // Get current question word from the current level
  const getCurrentWord = useCallback(() => {
    const levelWords = questions.filter(w => w.level === currentLevel);
    if (levelWords.length > 0) return levelWords[currentIndex % levelWords.length];
    // Fallback to any word
    return questions[currentIndex % questions.length];
  }, [questions, currentLevel, currentIndex]);

  const currentWord = getCurrentWord();

  useEffect(() => {
    if (!currentWord) return;
    const distractors = getDistractors(currentWord, 3);
    setOptions(fisherYatesShuffle([currentWord, ...distractors]));
    setAnswered(null);
    setSelectedAnswer(null);
    setImgLoaded(false);
  }, [currentIndex, currentWord]);

  const handleAnswer = useCallback((option) => {
    if (answered || !currentWord) return;

    const correct = option.id === currentWord.id;
    setSelectedAnswer(option.id);
    setAnswered(correct ? 'correct' : 'wrong');

    if (correct) {
      playSound('correct');
      haptic('success');
    } else {
      playSound('wrong');
      haptic('error');
    }

    const newResults = {
      ...results,
      correct: results.correct + (correct ? 1 : 0),
      wrong: results.wrong + (correct ? 0 : 1),
      levelHistory: [...results.levelHistory, { level: currentLevel, correct }],
    };
    setResults(newResults);

    // Adaptive difficulty: check last 5 answers
    const recentHistory = newResults.levelHistory.slice(-5);
    if (recentHistory.length === 5) {
      const recentCorrect = recentHistory.filter(h => h.correct).length;
      if (recentCorrect >= 4 && currentLevel !== 'advanced') {
        setCurrentLevel(currentLevel === 'beginner' ? 'intermediate' : 'advanced');
      } else if (recentCorrect <= 2 && currentLevel !== 'beginner') {
        setCurrentLevel(currentLevel === 'advanced' ? 'intermediate' : 'beginner');
      }
    }

    feedbackTimeout.current = setTimeout(() => {
      if (currentIndex + 1 >= totalQuestions) {
        // Determine recommended level
        const history = newResults.levelHistory;
        const advancedCorrect = history.filter(h => h.level === 'advanced' && h.correct).length;
        const intermediateCorrect = history.filter(h => h.level === 'intermediate' && h.correct).length;

        let recommended = 'beginner';
        if (advancedCorrect >= 3) recommended = 'advanced';
        else if (intermediateCorrect >= 3) recommended = 'intermediate';

        onComplete(recommended);
      } else {
        setCurrentIndex(i => i + 1);
      }
    }, 1000);
  }, [answered, currentWord, currentIndex, results, currentLevel, onComplete]);

  useEffect(() => () => clearTimeout(feedbackTimeout.current), []);

  if (!currentWord || questions.length === 0) return null;

  return (
    <div className="animate-fade-in space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-800">{t('quickAssessment', lang)}</h2>
        <button
          onClick={onSkip}
          className="text-sm text-slate-500 hover:text-slate-700 font-semibold"
        >
          {t('skip', lang)}
        </button>
      </div>

      {/* Progress */}
      <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-300"
          style={{ width: `${((currentIndex) / totalQuestions) * 100}%` }}
        />
      </div>
      <p className="text-center text-sm text-slate-500">
        {t('question', lang)} {currentIndex + 1} {t('of', lang)} {totalQuestions}
      </p>

      {/* Image */}
      <div className="relative aspect-square max-w-xs mx-auto rounded-2xl overflow-hidden bg-slate-100">
        {!imgLoaded && <div className="absolute inset-0 skeleton-pulse bg-slate-200 rounded-2xl" />}
        <img
          src={getImageUrl(currentWord)}
          alt={t('whatIsThis', lang)}
          className={`w-full h-full object-cover transition-opacity ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
          onLoad={() => setImgLoaded(true)}
          width={512}
          height={512}
        />
      </div>

      {/* Options */}
      <div className="grid grid-cols-2 gap-3">
        {options.map((option) => {
          const isSelected = selectedAnswer === option.id;
          const isCorrect = option.id === currentWord.id;
          let btnClass = 'glass rounded-xl py-3 px-4 font-semibold text-center transition-all ';

          if (answered) {
            if (isCorrect) btnClass += 'bg-emerald-100 border-emerald-400 text-emerald-700 animate-bounce-in';
            else if (isSelected) btnClass += 'bg-rose-100 border-rose-400 text-rose-700 animate-shake';
            else btnClass += 'opacity-50';
          } else {
            btnClass += 'hover:shadow-md active:scale-95 text-slate-700';
          }

          return (
            <button key={option.id} onClick={() => handleAnswer(option)} disabled={!!answered} className={btnClass}>
              {option.word}
            </button>
          );
        })}
      </div>
    </div>
  );
}
