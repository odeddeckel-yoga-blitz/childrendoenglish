import { useState } from 'react';
import useQuizState from '../hooks/useQuizState';
import QuizHeader from './QuizHeader';
import QuitModal from './QuitModal';
import { getImageUrl } from '../utils/images';

export default function ImageQuiz({ words, soundEnabled, onToggleSound, onComplete, onQuit }) {
  const [imgLoaded, setImgLoaded] = useState(false);

  const quiz = useQuizState({ words, mode: 'image', onComplete, speakOnCorrect: true, speakDelay: 600 });

  // Reset image loaded state when question changes
  const [prevIndex, setPrevIndex] = useState(0);
  if (quiz.currentIndex !== prevIndex) {
    setPrevIndex(quiz.currentIndex);
    setImgLoaded(false);
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
        currentIndex={quiz.currentIndex}
      />

      {/* Image */}
      <div className="relative aspect-square max-w-xs mx-auto rounded-2xl overflow-hidden bg-slate-100">
        {!imgLoaded && (
          <div className="absolute inset-0 skeleton-pulse bg-slate-200 rounded-2xl" />
        )}
        <img
          src={getImageUrl(quiz.currentWord)}
          alt="What is this?"
          className={`w-full h-full object-cover transition-opacity duration-300 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
          onLoad={() => setImgLoaded(true)}
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
            btnClass += 'hover:shadow-md active:scale-95 text-slate-700';
          }

          return (
            <button
              key={option.id}
              onClick={() => quiz.handleAnswer(option)}
              disabled={!!quiz.answered}
              className={btnClass}
            >
              {option.word}
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
