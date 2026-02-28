import { ArrowLeft, Lock, Check } from 'lucide-react';
import { LEVELS } from '../data/levels';
import { getWordsByLevel } from '../data/words';
import { t } from '../utils/i18n';

const colorMap = {
  blue: {
    bg: 'bg-blue-50', border: 'border-blue-200', icon: 'bg-blue-100',
    text: 'text-blue-700', badge: 'bg-blue-600',
  },
  amber: {
    bg: 'bg-amber-50', border: 'border-amber-200', icon: 'bg-amber-100',
    text: 'text-amber-700', badge: 'bg-amber-600',
  },
  purple: {
    bg: 'bg-purple-50', border: 'border-purple-200', icon: 'bg-purple-100',
    text: 'text-purple-700', badge: 'bg-purple-600',
  },
};

const levelNameKey = { beginner: 'beginner', intermediate: 'intermediate', advanced: 'advanced' };

export default function LevelSelect({ stats, lang = 'en', onSelect, onBack }) {
  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="p-2.5 rounded-xl hover:bg-slate-100 transition-colors"
          aria-label={t('backToMenu', lang)}
        >
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </button>
        <h2 className="text-xl font-bold text-slate-800">{t('chooseLevel', lang)}</h2>
      </div>

      <div className="space-y-3">
        {LEVELS.map((level, index) => {
          const unlocked = stats.unlockedLevels.includes(level.id);
          const colors = colorMap[level.color];
          const wordCount = getWordsByLevel(level.id).length;
          const bestScore = stats.bestScores[level.id] || 0;
          const localName = t(levelNameKey[level.id], lang);

          return (
            <button
              key={level.id}
              onClick={() => unlocked && onSelect(level.id)}
              disabled={!unlocked}
              className={`w-full glass rounded-2xl p-5 flex items-center gap-4 text-left
                         transition-all ${
                           unlocked
                             ? 'hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.98]'
                             : 'opacity-50 cursor-not-allowed'
                         }`}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className={`w-14 h-14 rounded-xl ${colors.icon} flex items-center justify-center
                              text-2xl flex-shrink-0`}>
                {unlocked ? level.icon : <Lock className="w-6 h-6 text-slate-400" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className={`font-bold ${colors.text}`}>{localName}</h3>
                  {bestScore > 0 && (
                    <span className={`text-xs px-2 py-0.5 rounded-full text-white ${colors.badge}`}>
                      {t('bestScore', lang, { score: bestScore })}
                    </span>
                  )}
                </div>
                <p className="text-slate-500 text-sm">{level.description}</p>
                <p className="text-xs text-slate-500 mt-1">
                  {t('wordsCount', lang, { count: wordCount })}
                  {!unlocked && index > 0 && (
                    <span className="text-amber-600"> · {t('unlockHint', lang, { level: t(levelNameKey[LEVELS[index - 1].id], lang) })}</span>
                  )}
                </p>
              </div>
              {unlocked && bestScore >= 7 && (
                <Check className="w-5 h-5 text-emerald-500 flex-shrink-0" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
