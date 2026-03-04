import { useState } from 'react';
import { Check, X as XIcon } from 'lucide-react';
import { getImageUrl } from '../utils/images';
import { t } from '../utils/i18n';

const PLACEHOLDER_COLORS = ['bg-blue-200', 'bg-emerald-200', 'bg-amber-200', 'bg-purple-200'];

export default function QuizOptionGrid({ quiz, loadedImages, onImageLoad, lang }) {
  const [failedImages, setFailedImages] = useState(new Set());

  return (
    <div className="grid grid-cols-2 gap-3 landscape:gap-2 landscape:max-w-sm landscape:mx-auto">
      {quiz.options.map((option, idx) => {
        const isSelected = quiz.selectedAnswer === option.id;
        const isCorrect = option.id === quiz.currentWord.id;
        const isLoaded = loadedImages.has(option.id);
        const isFailed = failedImages.has(option.id);

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
            {!isLoaded && !isFailed && (
              <div className="absolute inset-0 skeleton-pulse bg-slate-200" />
            )}
            {isFailed ? (
              <div className={`absolute inset-0 ${PLACEHOLDER_COLORS[idx % 4]} flex items-center justify-center`}>
                <span className="text-2xl font-bold text-slate-700 text-center px-2">{option.word}</span>
              </div>
            ) : (
              <img
                src={getImageUrl(option)}
                alt={option.word}
                className={`w-full h-full object-cover transition-opacity ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
                onLoad={() => onImageLoad(option.id)}
                onError={(e) => {
                  // Retry once with cache-bust before falling back
                  if (!e.target.dataset.retried) {
                    e.target.dataset.retried = '1';
                    e.target.src = getImageUrl(option) + '?r=' + Date.now();
                  } else {
                    setFailedImages(prev => new Set(prev).add(option.id));
                  }
                }}
                width={256}
                height={256}
              />
            )}
            {quiz.answered && isCorrect && (
              <span className="absolute inset-0 flex items-center justify-center" aria-label={t('correct', lang)}>
                <span className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg">
                  <Check className="w-6 h-6 text-white" />
                </span>
              </span>
            )}
            {quiz.answered && isSelected && !isCorrect && (
              <span className="absolute inset-0 flex items-center justify-center" aria-label={t('wrong', lang)}>
                <span className="w-10 h-10 rounded-full bg-rose-500 flex items-center justify-center shadow-lg">
                  <XIcon className="w-6 h-6 text-white" />
                </span>
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
