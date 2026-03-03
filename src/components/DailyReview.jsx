import { useState, useEffect, useCallback, useRef } from 'react';
import { Check, X as XIcon, ArrowLeft, RotateCcw, Trophy } from 'lucide-react';
import { getDistractors } from '../data/words';
import { fisherYatesShuffle } from '../utils/shuffle';
import { getImageUrl } from '../utils/images';
import { updateWordSR } from '../utils/spaced-repetition';
import { playSound, speakWord } from '../utils/sound';
import { haptic } from '../utils/haptic';
import { t } from '../utils/i18n';

const MAX_REVIEW = 10;

export default function DailyReview({ words, stats, lang = 'en', canRead = true, onComplete, onBack }) {
  // Take at most MAX_REVIEW words
  const reviewWords = useRef(words.slice(0, MAX_REVIEW));
  const total = reviewWords.current.length;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [options, setOptions] = useState([]);
  const [results, setResults] = useState([]);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [phase, setPhase] = useState('quiz'); // 'quiz' | 'summary'
  const [wordProgress, setWordProgress] = useState(() => ({ ...stats.wordProgress }));
  const feedbackTimeout = useRef(null);

  const currentWord = reviewWords.current[currentIndex];

  // Generate options for current question
  useEffect(() => {
    if (!currentWord || phase !== 'quiz') return;
    const distractors = getDistractors(currentWord, 3);
    setOptions(fisherYatesShuffle([currentWord, ...distractors]));
    setAnswered(null);
    setSelectedAnswer(null);
    setImgLoaded(false);
  }, [currentIndex, currentWord, phase]);

  // Cleanup on unmount
  useEffect(() => () => clearTimeout(feedbackTimeout.current), []);

  const advance = useCallback((newResults, newScore) => {
    if (currentIndex + 1 >= total) {
      setPhase('summary');
      onComplete({
        score: newScore,
        total,
        answers: newResults,
        wordProgress,
      });
    } else {
      setCurrentIndex(i => i + 1);
    }
  }, [currentIndex, total, onComplete, wordProgress]);

  const handleAnswer = useCallback((option) => {
    if (answered) return;

    const correct = option.id === currentWord.id;
    setSelectedAnswer(option.id);
    setAnswered(correct ? 'correct' : 'wrong');

    const newResults = [...results, { wordId: currentWord.id, correct, selected: option.id }];
    setResults(newResults);
    const newScore = score + (correct ? 1 : 0);

    // Update SRS data immediately
    setWordProgress(prev => updateWordSR(prev, currentWord.id, correct));

    if (correct) {
      setScore(newScore);
      playSound('correct');
      haptic('success');
      speakWord(currentWord.word);
    } else {
      playSound('wrong');
      haptic('error');
      setTimeout(() => speakWord(currentWord.word), 600);
    }

    feedbackTimeout.current = setTimeout(() => {
      advance(newResults, newScore);
    }, 1200);
  }, [answered, currentWord, results, score, advance]);

  const handleSkip = useCallback(() => {
    if (answered) return;

    setAnswered('wrong');
    const newResults = [...results, { wordId: currentWord.id, correct: false, selected: null }];
    setResults(newResults);
    speakWord(currentWord.word);

    // Update SRS data — skipped counts as wrong
    setWordProgress(prev => updateWordSR(prev, currentWord.id, false));

    feedbackTimeout.current = setTimeout(() => {
      advance(newResults, score);
    }, 1200);
  }, [answered, currentWord, results, score, advance]);

  // Summary phase
  if (phase === 'summary') {
    const correctCount = results.filter(r => r.correct).length;
    const percentage = total > 0 ? Math.round((correctCount / total) * 100) : 0;

    return (
      <div className="animate-fade-in space-y-6 text-center">
        <div className="space-y-2">
          <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
            <Trophy className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-black text-slate-800">{t('reviewComplete', lang)}</h2>
        </div>

        <div className="glass rounded-2xl p-6 space-y-4">
          <div className="text-4xl font-black text-blue-600">{correctCount}/{total}</div>
          <p className="text-sm text-slate-500">{t('wordsReviewed', lang)}</p>
          <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full transition-all duration-500"
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>

        {/* Word-by-word results */}
        <div className="glass rounded-2xl p-4 space-y-2">
          {results.map((r, i) => {
            const word = reviewWords.current[i];
            return (
              <div key={r.wordId} className="flex items-center gap-3 py-1.5">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${r.correct ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                  {r.correct ? <Check className="w-3.5 h-3.5" /> : <XIcon className="w-3.5 h-3.5" />}
                </div>
                <span className="text-sm font-medium text-slate-700">{word?.word}</span>
              </div>
            );
          })}
        </div>

        <button
          onClick={onBack}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold hover:shadow-lg active:scale-[0.98] transition-all"
        >
          {t('backToMenuBtn', lang)}
        </button>
      </div>
    );
  }

  // Quiz phase
  if (!currentWord) return null;

  return (
    <div className="animate-fade-in space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="p-2.5 rounded-xl hover:bg-slate-100 transition-colors"
          aria-label={t('backToMenu', lang)}
        >
          <ArrowLeft className="w-5 h-5 text-slate-500" />
        </button>
        <div className="flex items-center gap-2">
          <RotateCcw className="w-4 h-4 text-blue-500" />
          <span className="text-sm font-semibold text-slate-600">{t('dailyReview', lang)}</span>
        </div>
        <span className="text-sm font-semibold text-slate-600">{score}/{total}</span>
      </div>

      {/* Progress bar */}
      <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden" role="progressbar" aria-valuenow={currentIndex} aria-valuemin={0} aria-valuemax={total} aria-label={t('quizProgress', lang)}>
        <div
          className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-300"
          style={{ width: `${(currentIndex / total) * 100}%` }}
        />
      </div>

      <p className="text-center text-sm text-slate-500">
        {t('question', lang)} {currentIndex + 1} {t('of', lang)} {total}
      </p>

      {/* Image */}
      <div className="relative aspect-square max-w-xs mx-auto rounded-2xl overflow-hidden bg-slate-100 landscape:max-w-[200px]">
        {!imgLoaded && (
          <div className="absolute inset-0 skeleton-pulse bg-slate-200 rounded-2xl" />
        )}
        <img
          src={getImageUrl(currentWord)}
          alt={t('mysteryWord', lang)}
          className={`w-full h-full object-cover transition-opacity duration-300 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
          onLoad={() => setImgLoaded(true)}
          width={512}
          height={512}
        />
        {answered === 'correct' && (
          <div className="absolute inset-0 rounded-2xl correct-glow border-4 border-emerald-400" />
        )}
      </div>

      {/* Options */}
      <div className="grid grid-cols-2 gap-3">
        {options.map((option) => {
          const isSelected = selectedAnswer === option.id;
          const isCorrect = option.id === currentWord.id;
          let btnClass = 'glass rounded-xl py-3 px-4 font-semibold text-center transition-all ';

          if (answered) {
            if (isCorrect) {
              btnClass += 'bg-emerald-100 border-emerald-400 text-emerald-700 animate-bounce-in';
            } else if (isSelected && !isCorrect) {
              btnClass += 'bg-rose-100 border-rose-400 text-rose-700 animate-shake';
            } else {
              btnClass += 'opacity-50';
            }
          } else {
            btnClass += 'hover:shadow-md active:scale-95 text-slate-700';
          }

          return (
            <button
              key={option.id}
              onClick={() => handleAnswer(option)}
              disabled={!!answered}
              className={btnClass}
            >
              <span className="inline-flex items-center gap-1.5">
                {answered && isCorrect && <Check className="w-4 h-4" />}
                {answered && isSelected && !isCorrect && <XIcon className="w-4 h-4" />}
                {option.word}
              </span>
            </button>
          );
        })}
      </div>

      {!answered && (
        <button
          onClick={handleSkip}
          className="w-full text-center text-sm text-slate-400 hover:text-slate-600 transition-colors py-1"
        >
          {t('skipThisWord', lang)}
        </button>
      )}
    </div>
  );
}
