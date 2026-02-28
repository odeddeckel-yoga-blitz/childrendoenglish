import { useState } from 'react';
import { Volume2 } from 'lucide-react';
import useQuizState from '../hooks/useQuizState';
import QuizHeader from './QuizHeader';
import QuitModal from './QuitModal';
import { getImageUrl } from '../utils/images';
import { speakWord } from '../utils/sound';

export default function WordQuiz({ words, soundEnabled, onToggleSound, onComplete, onQuit }) {
  const [loadedImages, setLoadedImages] = useState(new Set());

  const quiz = useQuizState({ words, mode: 'word', onComplete, speakOnCorrect: true });

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
      />

      {/* Word display */}
      <div className="text-center space-y-2 py-4">
        <h2 className="text-4xl font-black text-slate-800 animate-word-glow">{quiz.currentWord.word}</h2>
        <p className="text-slate-500 text-sm font-mono">{quiz.currentWord.phonetic}</p>
        <button
          onClick={() => speakWord(quiz.currentWord.word)}
          className="mx-auto p-2 rounded-full bg-blue-50 hover:bg-blue-100 transition-colors"
          aria-label="Pronounce word"
        >
          <Volume2 className="w-5 h-5 text-blue-600" />
        </button>
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
          Skip this word
        </button>
      )}

      {quiz.showQuitConfirm && (
        <QuitModal onContinue={quiz.closeQuitConfirm} onQuit={quiz.handleQuit} />
      )}
    </div>
  );
}
