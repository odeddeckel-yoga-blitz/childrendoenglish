import { useState } from 'react';
import { ArrowLeft, Lock, Image, Type, Volume2, Headphones } from 'lucide-react';
import { LEVELS } from '../data/levels';
import { getWordsByLevel } from '../data/words';
import { t } from '../utils/i18n';

const levelColorMap = {
  blue: {
    bg: 'bg-blue-50', border: 'border-blue-300', activeBg: 'bg-blue-600',
    text: 'text-blue-700', activeText: 'text-white', ring: 'ring-blue-400',
  },
  amber: {
    bg: 'bg-amber-50', border: 'border-amber-300', activeBg: 'bg-amber-600',
    text: 'text-amber-700', activeText: 'text-white', ring: 'ring-amber-400',
  },
  purple: {
    bg: 'bg-purple-50', border: 'border-purple-300', activeBg: 'bg-purple-600',
    text: 'text-purple-700', activeText: 'text-white', ring: 'ring-purple-400',
  },
};

const levelNameKey = { beginner: 'beginner', intermediate: 'intermediate', advanced: 'advanced' };

const allModes = [
  {
    id: 'listen',
    nameKey: 'listenMatchQuiz',
    descKey: 'listenMatchQuizDesc',
    icon: Headphones,
    iconBg: 'bg-purple-100',
    iconColor: 'text-purple-600',
  },
  {
    id: 'image',
    nameKey: 'imageQuiz',
    descKey: 'imageQuizDesc',
    icon: Image,
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
  },
  {
    id: 'word',
    nameKey: 'wordQuiz',
    descKey: 'wordQuizDesc',
    icon: Type,
    iconBg: 'bg-emerald-100',
    iconColor: 'text-emerald-600',
  },
  {
    id: 'audio',
    nameKey: 'audioQuiz',
    descKey: 'audioQuizDesc',
    icon: Volume2,
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-600',
  },
];

export default function LevelSelect({ stats, lang = 'en', canRead = true, onStartQuiz, onBack }) {
  // Default to first unlocked level
  const [selectedLevel, setSelectedLevel] = useState(() => {
    const unlocked = LEVELS.filter(l => stats.unlockedLevels.includes(l.id));
    return unlocked.length > 0 ? unlocked[unlocked.length - 1].id : 'beginner';
  });

  const modes = canRead
    ? allModes
    : allModes.filter(m => m.id !== 'image');

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="p-2.5 rounded-xl hover:bg-slate-100 transition-colors"
          aria-label={t('backToMenu', lang)}
        >
          <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-300" />
        </button>
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">{t('playQuiz', lang)}</h2>
      </div>

      {/* Level tabs */}
      <div className="flex gap-2">
        {LEVELS.map((level) => {
          const unlocked = stats.unlockedLevels.includes(level.id);
          const active = selectedLevel === level.id;
          const colors = levelColorMap[level.color];
          const localName = t(levelNameKey[level.id], lang);
          const wordCount = getWordsByLevel(level.id).length;

          return (
            <button
              key={level.id}
              onClick={() => unlocked && setSelectedLevel(level.id)}
              disabled={!unlocked}
              aria-current={active ? 'true' : undefined}
              className={`flex-1 rounded-xl py-2.5 px-2 text-center transition-all ${
                active
                  ? `${colors.activeBg} ${colors.activeText} shadow-md`
                  : unlocked
                    ? `${colors.bg} ${colors.text} hover:shadow-sm border ${colors.border}`
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed'
              }`}
            >
              <span className="text-lg block">
                {unlocked ? level.icon : <Lock className="w-4 h-4 mx-auto" />}
              </span>
              <span className="text-xs font-bold block mt-0.5">{localName}</span>
              {unlocked && (
                <span className={`text-[10px] block ${active ? 'text-white/70' : 'opacity-60'}`}>
                  {wordCount} {t('words', lang)}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Best score for selected level */}
      {stats.bestScores[selectedLevel] > 0 && (
        <p className="text-center text-sm text-slate-500">
          {t('bestScore', lang, { score: stats.bestScores[selectedLevel] })}
        </p>
      )}

      {/* Mode cards */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-slate-500">{t('chooseMode', lang)}</h3>
        {modes.map((mode, index) => {
          const Icon = mode.icon;
          return (
            <button
              key={mode.id}
              onClick={() => onStartQuiz(selectedLevel, mode.id)}
              className="w-full glass rounded-2xl p-5 flex items-center gap-4 text-left
                         hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.98] transition-all"
              style={{ animationDelay: `${index * 80}ms` }}
            >
              <div className={`w-14 h-14 rounded-xl ${mode.iconBg} flex items-center justify-center flex-shrink-0`}>
                <Icon className={`w-7 h-7 ${mode.iconColor}`} />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 dark:text-slate-100">{t(mode.nameKey, lang)}</h3>
                <p className="text-slate-500 text-sm">{t(mode.descKey, lang)}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
