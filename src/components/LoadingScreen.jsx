import { useState, useEffect } from 'react';
import { t } from '../utils/i18n';

export default function LoadingScreen({ progress = 0, lang = 'en', onRetry, onCancel }) {
  const circumference = 2 * Math.PI * 80;
  const offset = circumference - (circumference * progress) / 100;
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setTimedOut(true), 12000);
    return () => clearTimeout(timer);
  }, []);

  // Reset timeout when progress changes
  useEffect(() => {
    setTimedOut(false);
  }, [progress]);

  return (
    <div className="text-center space-y-6 animate-fade-in">
      <div className="relative w-48 h-48 mx-auto" role="progressbar" aria-valuenow={Math.round(progress)} aria-valuemin={0} aria-valuemax={100} aria-label={t('loadingQuiz', lang)}>
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx="96" cy="96" r="80"
            fill="transparent"
            stroke="currentColor"
            strokeWidth="12"
            className="text-slate-200"
          />
          <circle
            cx="96" cy="96" r="80"
            fill="transparent"
            stroke="currentColor"
            strokeWidth="12"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="text-blue-500 transition-all duration-300"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-black text-blue-600">
            {Math.round(progress)}%
          </span>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            {t('loading', lang)}
          </span>
        </div>
      </div>

      {timedOut && progress < 100 ? (
        <div className="space-y-3">
          <p className="text-slate-500 text-sm">{t('takingLonger', lang)}</p>
          <div className="flex gap-3 justify-center">
            {onRetry && (
              <button
                onClick={onRetry}
                className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 active:scale-95 transition-all"
              >
                {t('retry', lang)}
              </button>
            )}
            {onCancel && (
              <button
                onClick={onCancel}
                className="px-4 py-2 glass rounded-xl text-sm font-semibold text-slate-600 hover:shadow-md active:scale-95 transition-all"
              >
                {t('backToMenuBtn', lang)}
              </button>
            )}
          </div>
        </div>
      ) : (
        <p className="text-slate-500 text-sm">{t('preparingQuiz', lang)}</p>
      )}
    </div>
  );
}
