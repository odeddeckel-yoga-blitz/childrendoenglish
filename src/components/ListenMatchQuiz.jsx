import { useState, useEffect } from 'react';
import { Volume2, RefreshCw } from 'lucide-react';
import useQuizState from '../hooks/useQuizState';
import QuizHeader from './QuizHeader';
import QuitModal from './QuitModal';
import { getImageUrl } from '../utils/images';
import { speakWord, isTTSAvailable } from '../utils/sound';
import { t } from '../utils/i18n';

export default function ListenMatchQuiz({ words, lang = 'en', soundEnabled, onToggleSound, onComplete, onQuit }) {
  const [loadedImages, setLoadedImages] = useState(new Set());

  const ttsOk = isTTSAvailable();

  const quiz = useQuizState({
    words,
    mode: 'listen',
    onComplete,
    speakOnCorrect: false,
    speakDelay: 600,
  });

  // Reset loaded images when question changes
  const [prevIndex, setPrevIndex] = useState(0);
  if (quiz.currentIndex !== prevIndex) {
    setPrevIndex(quiz.currentIndex);
    setLoadedImages(new Set());
  }

  // Auto-speak current word on each new question
  useEffect(() => {
    if (ttsOk && quiz.currentWord) {
      const timer = setTimeout(() => speakWord(quiz.currentWord.word), 300);
      return () => clearTimeout(timer);
    }
  }, [quiz.currentIndex, quiz.currentWord, ttsOk]);

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
        gradientColor="from-purple-500 to-purple-600"
        currentIndex={quiz.currentIndex}
        lang={lang}
      />

      {/* Word display + speaker */}
      <div className="text-center py-4 space-y-3">
        <h2 className="text-4xl font-black text-slate-800">{quiz.currentWord.word}</h2>

        {ttsOk && (
          <button
            onClick={() => speakWord(quiz.currentWord.word)}
            className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-purple-400 to-purple-600
                       flex items-center justify-center shadow-lg hover:shadow-xl
                       active:scale-95 transition-all"
            aria-label={t('tapToHear', lang)}
          >
            <Volume2 className="w-8 h-8 text-white" />
          </button>
        )}
        {ttsOk && (
          <p className="text-slate-400 text-sm flex items-center justify-center gap-2">
            <RefreshCw className="w-3 h-3" /> {t('tapToHear', lang)}
          </p>
        )}
      </div>

      {/* Image options (2x2 grid) */}
      <div className="grid grid-cols-2 gap-3">
        {quiz.options.map((option) => {
          const isSelected = quiz.selectedAnswer === option.id;
          const isCorrect = option.id === quiz.currentWord.id;
          const isLoaded = loadedImages.has(option.id);

          let borderClass = 'border-2 border-transparent ';
          if (quiz.answered) {
            if (isCorrect) borderClass = 'border-4 border-emerald-400 ';
            else if (isSelected && !isCorrect) borderClass = 'border-4 border-rose-400 ';
            else borderClass = 'opacity-50 border-2 border-transparent ';
          }

          return (
            <button
              key={option.id}
              onClick={() => quiz.handleAnswer(option)}
              disabled={!!quiz.answered}
              className={`relative aspect-square rounded-2xl overflow-hidden bg-slate-100
                         transition-all ${borderClass} ${
                           !quiz.answered ? 'hover:shadow-lg active:scale-95' : ''
                         } ${quiz.answered && isCorrect ? 'animate-bounce-in' : ''}
                         ${quiz.answered && isSelected && !isCorrect ? 'animate-shake' : ''}`}
            >
              {!isLoaded && (
                <div className="absolute inset-0 skeleton-pulse bg-slate-200" />
              )}
              <img
                src={getImageUrl(option)}
                alt=""
                className={`w-full h-full object-cover transition-opacity ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
                onLoad={() => setLoadedImages(prev => new Set(prev).add(option.id))}
                width={256}
                height={256}
              />
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
