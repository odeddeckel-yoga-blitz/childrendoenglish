import { Play, ArrowLeft, Check, X as XIcon, Zap, Flame } from 'lucide-react';
import { getWordById } from '../data/words';
import { LIGHTNING_SECS } from '../utils/arcade';
import { t } from '../utils/i18n';

export default function ResultScreen({ results, lang = 'en', level: _level, mode: _mode, canRead = true, onPlayAgain, onMenu, onLightning }) {
  const { score, total, answers = [], arcade, arcadeNewBest, quit } = results;
  const percentage = total > 0 ? Math.round((score / total) * 100) : 0;
  const showLightning = !!onLightning && canRead && !quit && total > 0;

  const headline = percentage >= 90 ? t('amazing', lang)
    : percentage >= 70 ? t('greatJob', lang)
    : percentage >= 50 ? t('goodEffort', lang)
    : t('keepPracticing', lang);

  const headlineColor = percentage >= 90 ? 'text-emerald-600'
    : percentage >= 70 ? 'text-blue-600'
    : percentage >= 50 ? 'text-amber-600'
    : 'text-rose-500';

  return (
    <div className="animate-fade-in space-y-4">
      {/* Score */}
      <div className="glass rounded-3xl p-6 text-center space-y-3">
        <p className={`text-2xl font-black ${headlineColor}`}>{headline}</p>
        <div className="flex items-baseline justify-center gap-1">
          <span className="text-5xl font-black text-blue-600">{score}</span>
          <span className="text-2xl text-slate-400 font-bold">/ {total}</span>
        </div>
        <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden max-w-xs mx-auto">
          <div
            className={`h-full rounded-full transition-all duration-1000 ${
              percentage >= 70 ? 'bg-emerald-500' : percentage >= 50 ? 'bg-amber-500' : 'bg-rose-500'
            }`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      {/* This-run arcade stats (kidsdomath crossover) */}
      {arcade && arcade.score > 0 && (
        <div className="glass rounded-2xl p-4">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="text-lg font-black text-amber-600 dark:text-amber-400" dir="ltr">⭐ {arcade.score}</p>
              <p className="text-[11px] text-slate-500 font-medium">
                {arcadeNewBest ? t('newBest', lang) : t('runScore', lang)}
              </p>
            </div>
            <div>
              <p className="text-lg font-black text-orange-500 flex items-center justify-center gap-1" dir="ltr">
                <Flame className="w-4 h-4" /> {arcade.bestStreak}
              </p>
              <p className="text-[11px] text-slate-500 font-medium">{t('runBestCombo', lang)}</p>
            </div>
            <div>
              <p className="text-lg font-black text-sky-500 flex items-center justify-center gap-1" dir="ltr">
                <Zap className="w-4 h-4" /> {arcade.fastAnswers}
              </p>
              <p className="text-[11px] text-slate-500 font-medium">{t('runFastAnswers', lang)}</p>
            </div>
          </div>
          {arcadeNewBest && (
            <p className="text-center text-sm font-black text-emerald-600 mt-2 animate-badge-pop">
              {t('newBestBanner', lang)}
            </p>
          )}
        </div>
      )}


      {/* Action buttons — Play Again is primary */}
      <div className="space-y-3">
        <button
          onClick={onPlayAgain}
          className="w-full py-3.5 px-4 bg-blue-600 text-white rounded-xl font-semibold
                     hover:bg-blue-700 active:scale-95 transition-all flex items-center justify-center gap-2"
        >
          <Play className="w-4 h-4" /> {t('playAgain', lang)}
        </button>

        {showLightning && (
          <button
            onClick={onLightning}
            className="w-full py-3.5 px-4 rounded-xl font-bold text-amber-700 dark:text-amber-300
                       bg-linear-to-b from-amber-100 to-amber-200 dark:from-amber-900/40 dark:to-amber-800/40
                       border border-amber-300 dark:border-amber-700
                       hover:shadow-md active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <Zap className="w-4 h-4" /> {t('lightningCta', lang, { secs: LIGHTNING_SECS })}
          </button>
        )}

        <button
          onClick={onMenu}
          className="w-full py-2.5 px-3 glass rounded-xl font-semibold text-slate-500 text-sm
                     hover:shadow-md active:scale-95 transition-all flex items-center justify-center gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" /> {t('backToMenuBtn', lang)}
        </button>
      </div>

      {/* Answer review */}
      {answers.length > 0 && (
        <div className="glass rounded-2xl p-4 space-y-3">
          <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-300">{t('review', lang)}</h3>
          <div className="space-y-2 max-h-60 overflow-y-auto" role="list">
            {answers.map((answer, i) => {
              const word = getWordById(answer.wordId);
              if (!word) return null;
              return (
                <div
                  key={i}
                  role="listitem"
                  className={`flex items-center gap-3 p-2 rounded-xl ${
                    answer.correct ? 'bg-emerald-50' : 'bg-rose-50'
                  }`}
                >
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                    answer.correct ? 'bg-emerald-500' : 'bg-rose-500'
                  }`}>
                    {answer.correct
                      ? <Check className="w-3.5 h-3.5 text-white" />
                      : <XIcon className="w-3.5 h-3.5 text-white" />
                    }
                  </div>
                  <span className="font-semibold text-sm text-slate-700 dark:text-slate-200">{word.word}</span>
                  {!answer.correct && answer.selected && (
                    <span className="text-xs text-slate-500 ml-auto">
                      {t('youPicked', lang, { word: getWordById(answer.selected)?.word })}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
