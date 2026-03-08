import { Play, ArrowLeft, Share2, RotateCcw, Check, X as XIcon } from 'lucide-react';
import { getWordById } from '../data/words';
import { t } from '../utils/i18n';

export default function ResultScreen({ results, lang = 'en', level: _level, mode: _mode, onPlayAgain, onChangeMode, onMenu }) {
  const { score, total, answers = [] } = results;
  const percentage = total > 0 ? Math.round((score / total) * 100) : 0;

  const handleShare = async () => {
    const isPerfect = score === total && total > 0;
    const shareKey = isPerfect ? 'shareTextPerfect' : 'shareText';
    const text = `${t(shareKey, lang, { score, total })}\nhttps://childrendoenglish.com`;
    try {
      if (navigator.share) {
        await navigator.share({ text });
      } else {
        await navigator.clipboard.writeText(text);
      }
    } catch { /* user cancelled share */ }
  };

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

      {/* Action buttons — Play Again is primary */}
      <div className="space-y-3">
        <button
          onClick={onPlayAgain}
          className="w-full py-3.5 px-4 bg-blue-600 text-white rounded-xl font-semibold
                     hover:bg-blue-700 active:scale-95 transition-all flex items-center justify-center gap-2"
        >
          <Play className="w-4 h-4" /> {t('playAgain', lang)}
        </button>

        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={onMenu}
            className="py-2.5 px-3 glass rounded-xl font-semibold text-slate-500 text-sm
                       hover:shadow-md active:scale-95 transition-all flex items-center justify-center gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" /> {t('backToMenuBtn', lang)}
          </button>
          <button
            onClick={handleShare}
            className="py-2.5 px-3 glass rounded-xl font-semibold text-slate-500 text-sm
                       hover:shadow-md active:scale-95 transition-all flex items-center justify-center gap-1.5"
          >
            <Share2 className="w-4 h-4" /> {t('share', lang)}
          </button>
          <button
            onClick={onChangeMode}
            className="py-2.5 px-3 glass rounded-xl font-semibold text-slate-500 text-sm
                       hover:shadow-md active:scale-95 transition-all flex items-center justify-center gap-1.5"
          >
            <RotateCcw className="w-4 h-4" /> {t('changeMode', lang)}
          </button>
        </div>
      </div>

      {/* Answer review */}
      {answers.length > 0 && (
        <div className="glass rounded-2xl p-4 space-y-3">
          <h3 className="text-sm font-semibold text-slate-600">{t('review', lang)}</h3>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {answers.map((answer, i) => {
              const word = getWordById(answer.wordId);
              if (!word) return null;
              return (
                <div
                  key={i}
                  className={`flex items-center gap-3 p-2 rounded-xl ${
                    answer.correct ? 'bg-emerald-50' : 'bg-rose-50'
                  }`}
                >
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                    answer.correct ? 'bg-emerald-500' : 'bg-rose-500'
                  }`}>
                    {answer.correct
                      ? <Check className="w-3.5 h-3.5 text-white" />
                      : <XIcon className="w-3.5 h-3.5 text-white" />
                    }
                  </div>
                  <span className="font-semibold text-sm text-slate-700">{word.word}</span>
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
