import { X, Volume2, VolumeX, Flame } from 'lucide-react';
import { t } from '../utils/i18n';

export default function QuizHeader({ score, total, streak, arcadeScore, soundEnabled, onToggleSound, onQuit, gradientColor = 'from-blue-500 to-blue-600', currentIndex, lang = 'en' }) {
  return (
    <>
      <div className="flex items-center justify-between">
        <button
          onClick={onQuit}
          className="p-2.5 rounded-xl hover:bg-slate-100 transition-colors"
          aria-label={t('quitQuiz', lang)}
        >
          <X className="w-5 h-5 text-slate-500" />
        </button>
        <div className="flex items-center gap-2.5">
          {streak >= 2 && (
            <span
              dir="ltr"
              className="combo-pill px-2 py-0.5 rounded-full bg-gradient-to-b from-emerald-400 to-emerald-500 text-white font-black text-xs shadow-sm"
              aria-label={t('comboLabel', lang, { count: streak })}
            >
              ×{streak}
            </span>
          )}
          {streak >= 3 && (
            <span className="streak-fire flex items-center gap-1 text-amber-500 font-bold text-sm">
              <Flame className="w-4 h-4" /> {streak}
            </span>
          )}
          {typeof arcadeScore === 'number' && (
            <span
              dir="ltr"
              key={arcadeScore}
              className={`text-sm font-bold text-amber-600 dark:text-amber-400 ${arcadeScore > 0 ? 'animate-score-pop' : ''}`}
              aria-label={t('arcadeScoreLabel', lang, { score: arcadeScore })}
            >
              ⭐ {arcadeScore}
            </span>
          )}
          <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">{score}/{total}</span>
          <button
            onClick={onToggleSound}
            className="p-2.5 rounded-lg hover:bg-slate-100 transition-colors"
            aria-label={soundEnabled ? t('muteSound', lang) : t('enableSound', lang)}
          >
            {soundEnabled
              ? <Volume2 className="w-4 h-4 text-slate-500" />
              : <VolumeX className="w-4 h-4 text-slate-400" />
            }
          </button>
        </div>
      </div>

      <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden" role="progressbar" aria-valuenow={currentIndex} aria-valuemin={0} aria-valuemax={total} aria-label={t('quizProgress', lang)}>
        <div
          className={`h-full bg-gradient-to-r ${gradientColor} rounded-full transition-all duration-300`}
          style={{ width: `${((currentIndex) / total) * 100}%` }}
        />
      </div>

      <p className="text-center text-sm text-slate-500 landscape:hidden">
        {t('question', lang)} {currentIndex + 1} {t('of', lang)} {total}
      </p>
    </>
  );
}
