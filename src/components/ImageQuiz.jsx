import { useState, useEffect } from 'react';
import { Check, X as XIcon } from 'lucide-react';
import useQuizState from '../hooks/useQuizState';
import QuizHeader from './QuizHeader';
import QuitModal from './QuitModal';
import { getImageUrl } from '../utils/images';
import { t } from '../utils/i18n';

// An image can hang without firing onLoad or onError (flaky network / stale
// service-worker limbo) — previously there was NO error handling here at all,
// leaving an unanswerable blank question. After the stall timeout (or a failed
// retry) we fall back to showing the word's definition, which keeps the round
// playable as a read-the-clue exercise.
const IMAGE_STALL_MS = 7000;

export default function ImageQuiz({ words, lang = 'en', soundEnabled, onToggleSound, onComplete, onQuit: _onQuit }) {
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgFailed, setImgFailed] = useState(false);

  const quiz = useQuizState({ words, mode: 'image', lang, onComplete, speakOnCorrect: true, speakDelay: 600 });

  // Reset image loaded state when question changes
  const [prevIndex, setPrevIndex] = useState(0);
  if (quiz.currentIndex !== prevIndex) {
    setPrevIndex(quiz.currentIndex);
    setImgLoaded(false);
    setImgFailed(false);
  }

  // Stall rescue: if the image neither loaded nor errored in time, fall back.
  useEffect(() => {
    if (imgLoaded || imgFailed) return undefined;
    const timer = setTimeout(() => setImgFailed(true), IMAGE_STALL_MS);
    return () => clearTimeout(timer);
  }, [quiz.currentIndex, imgLoaded, imgFailed]);

  if (!quiz.currentWord) return null;

  return (
    <div className="animate-fade-in space-y-4">
      <QuizHeader
        score={quiz.score}
        total={quiz.total}
        streak={quiz.streak}
        soundEnabled={soundEnabled}
        onToggleSound={onToggleSound}
        onQuit={quiz.openQuitConfirm}
        currentIndex={quiz.currentIndex}
        lang={lang}
      />

      {/* Image */}
      <div className="relative aspect-square max-w-xs mx-auto rounded-2xl overflow-hidden bg-slate-100 landscape:max-w-[200px]">
        {!imgLoaded && !imgFailed && (
          <div className="absolute inset-0 skeleton-pulse bg-slate-200 rounded-2xl" />
        )}
        {imgFailed && !imgLoaded && (
          <div className="absolute inset-0 bg-amber-100 rounded-2xl flex items-center justify-center p-4">
            <span className="text-lg font-semibold text-slate-700 text-center">{quiz.currentWord.definition}</span>
          </div>
        )}
        <img
          src={getImageUrl(quiz.currentWord)}
          alt={t('mysteryWord', lang)}
          className={`w-full h-full object-cover transition-opacity duration-300 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
          onLoad={() => setImgLoaded(true)}
          onError={(e) => {
            if (!e.target.dataset.retried) {
              e.target.dataset.retried = '1';
              e.target.src = getImageUrl(quiz.currentWord) + '?r=' + Date.now();
            } else {
              setImgFailed(true);
            }
          }}
          width={512}
          height={512}
        />
        {quiz.answered === 'correct' && (
          <div className="absolute inset-0 rounded-2xl correct-glow border-4 border-emerald-400" />
        )}
      </div>

      {/* Options (4 word buttons) */}
      <div className="grid grid-cols-2 gap-3">
        {quiz.options.map((option) => {
          const isSelected = quiz.selectedAnswer === option.id;
          const isCorrect = option.id === quiz.currentWord.id;
          let btnClass = 'glass rounded-xl py-3 px-4 font-semibold text-center transition-all ';

          if (quiz.answered) {
            if (isCorrect) {
              btnClass += 'bg-emerald-100 border-emerald-400 text-emerald-700 animate-bounce-in';
            } else if (isSelected && !isCorrect) {
              btnClass += 'bg-rose-100 border-rose-400 text-rose-700 animate-shake';
            } else {
              btnClass += 'opacity-50';
            }
          } else {
            btnClass += 'hover:shadow-md active:scale-95 text-slate-700 dark:text-slate-200';
          }

          return (
            <button
              key={option.id}
              onClick={() => quiz.handleAnswer(option)}
              disabled={!!quiz.answered}
              className={btnClass}
            >
              <span className="inline-flex items-center gap-1.5">
                {quiz.answered && isCorrect && <Check className="w-4 h-4" />}
                {quiz.answered && isSelected && !isCorrect && <XIcon className="w-4 h-4" />}
                {option.word}
              </span>
            </button>
          );
        })}
      </div>

      {!quiz.answered && (
        <button
          onClick={quiz.handleSkip}
          className="w-full text-center text-sm text-slate-400 hover:text-slate-600 transition-colors py-1"
        >
          {t('skipThisWord', lang)}
        </button>
      )}

      <div aria-live="polite" className="sr-only">{quiz.feedbackMessage}</div>

      {quiz.showQuitConfirm && (
        <QuitModal onContinue={quiz.closeQuitConfirm} onQuit={quiz.handleQuit} lang={lang} />
      )}
    </div>
  );
}
