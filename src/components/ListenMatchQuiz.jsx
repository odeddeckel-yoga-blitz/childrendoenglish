import { useState, useEffect } from 'react';
import { Volume2, RefreshCw } from 'lucide-react';
import useQuizState from '../hooks/useQuizState';
import QuizHeader from './QuizHeader';
import QuitModal from './QuitModal';
import QuizOptionGrid from './QuizOptionGrid';
import { speakWord, isTTSAvailable } from '../utils/sound';
import { t } from '../utils/i18n';

export default function ListenMatchQuiz({ words, lang = 'en', soundEnabled, onToggleSound, onComplete, onQuit: _onQuit }) {
  const [loadedImages, setLoadedImages] = useState(new Set());

  const ttsOk = isTTSAvailable();

  const quiz = useQuizState({
    words,
    mode: 'listen',
    lang,
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
        <h2 className="text-4xl font-black text-slate-800 dark:text-slate-100">{quiz.currentWord.word}</h2>

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

      <QuizOptionGrid
        quiz={quiz}
        loadedImages={loadedImages}
        onImageLoad={(id) => setLoadedImages(prev => new Set(prev).add(id))}
        lang={lang}
      />

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
