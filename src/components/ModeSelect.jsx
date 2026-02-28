import { ArrowLeft, Image, Type, Volume2 } from 'lucide-react';
import { t } from '../utils/i18n';

const modes = [
  {
    id: 'image',
    nameKey: 'imageQuiz',
    descKey: 'imageQuizDesc',
    icon: Image,
    color: 'from-blue-500 to-blue-600',
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
  },
  {
    id: 'word',
    nameKey: 'wordQuiz',
    descKey: 'wordQuizDesc',
    icon: Type,
    color: 'from-emerald-500 to-emerald-600',
    iconBg: 'bg-emerald-100',
    iconColor: 'text-emerald-600',
  },
  {
    id: 'audio',
    nameKey: 'audioQuiz',
    descKey: 'audioQuizDesc',
    icon: Volume2,
    color: 'from-amber-500 to-amber-600',
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-600',
  },
];

const levelNameKey = { beginner: 'beginner', intermediate: 'intermediate', advanced: 'advanced' };

export default function ModeSelect({ level, lang = 'en', onSelect, onBack }) {
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
        <div>
          <h2 className="text-xl font-bold text-slate-800">{t('chooseMode', lang)}</h2>
          <p className="text-sm text-slate-500">{t('levelLabel', lang, { level: t(levelNameKey[level] || level, lang) })}</p>
        </div>
      </div>

      <div className="space-y-3">
        {modes.map((mode, index) => {
          const Icon = mode.icon;
          return (
            <button
              key={mode.id}
              onClick={() => onSelect(mode.id)}
              className="w-full glass rounded-2xl p-5 flex items-center gap-4 text-left
                         hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.98] transition-all"
              style={{ animationDelay: `${index * 80}ms` }}
            >
              <div className={`w-14 h-14 rounded-xl ${mode.iconBg} flex items-center justify-center flex-shrink-0`}>
                <Icon className={`w-7 h-7 ${mode.iconColor}`} />
              </div>
              <div>
                <h3 className="font-bold text-slate-800">{t(mode.nameKey, lang)}</h3>
                <p className="text-slate-500 text-sm">{t(mode.descKey, lang)}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
