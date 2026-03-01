import { useState } from 'react';
import { Volume2 } from 'lucide-react';
import useQuizState from '../hooks/useQuizState';
import QuizHeader from './QuizHeader';
import QuitModal from './QuitModal';
import QuizOptionGrid from './QuizOptionGrid';
import { speakWord } from '../utils/sound';
import { t } from '../utils/i18n';

export default function WordQuiz({ words, lang = 'en', soundEnabled, onToggleSound, onComplete, onQuit }) {
  const [loadedImages, setLoadedImages] = useState(new Set());

  const quiz = useQuizState({ words, mode: 'word', lang, onComplete, speakOnCorrect: true });

  // Reset loaded images when question changes
  const [prevIndex, setPrevIndex] = useState(0);
  if (quiz.currentIndex !== prevIndex) {
    setPrevIndex(quiz.currentIndex);
    setLoadedImages(new Set());
  }

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
        gradientColor="from-emerald-500 to-emerald-600"
        currentIndex={quiz.currentIndex}
        lang={lang}
      />

      {/* Word display */}
      <div className="text-center space-y-2 py-4">
        <h2 className="text-4xl font-black text-slate-800 animate-word-glow">{quiz.currentWord.word}</h2>
        <p className="text-slate-500 text-sm font-mono">{quiz.currentWord.phonetic}</p>
        <button
          onClick={() => speakWord(quiz.currentWord.word)}
          className="mx-auto p-2 rounded-full bg-blue-50 hover:bg-blue-100 transition-colors"
          aria-label={t('pronounceWord', lang)}
        >
          <Volume2 className="w-5 h-5 text-blue-600" />
        </button>
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
