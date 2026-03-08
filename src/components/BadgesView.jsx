import { ArrowLeft } from 'lucide-react';
import { BADGES } from '../data/badges';
import { t } from '../utils/i18n';

function getBadgeProgress(badge, stats) {
  const wp = stats.wordProgress || {};
  const wordsLearned = Object.keys(wp).length;
  const wordsMastered = Object.values(wp).filter(w => w.interval >= 14).length;

  switch (badge.id) {
    case 'first_word':
      return { done: Math.min(stats.totalQuizzes, 1), total: 1, key: 'badgeProgressQuizzes' };
    case 'word_explorer':
      return { done: Math.min(wordsLearned, 20), total: 20, key: 'badgeProgressWords' };
    case 'perfect_quiz':
      return { done: 0, total: 1, key: 'badgeProgressPerfect', noBar: true };
    case 'bookworm':
      return { done: Math.min(stats.totalQuizzes, 10), total: 10, key: 'badgeProgressQuizzes' };
    case 'vocab_champion':
      return { done: Math.min(wordsMastered, 50), total: 50, key: 'badgeProgressMastered' };
    case 'week_warrior':
      return { done: Math.min(stats.currentStreak || 0, 7), total: 7, key: 'badgeProgressStreak' };
    case 'polyglot':
      return { done: Math.min(wordsLearned, 100), total: 100, key: 'badgeProgressWords' };
    default:
      return null;
  }
}

export default function BadgesView({ stats, lang = 'en', onBack }) {
  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-2.5 rounded-xl hover:bg-slate-100 transition-colors" aria-label={t('backToMenu', lang)}>
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </button>
        <h2 className="text-xl font-bold text-slate-800">{t('badgesTitle', lang)}</h2>
        <span className="text-sm text-slate-500 ml-auto">
          {stats.badges?.length || 0} / {BADGES.length}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {BADGES.map((badge, i) => {
          const earned = stats.badges?.includes(badge.id);
          const progress = !earned ? getBadgeProgress(badge, stats) : null;
          const pct = progress && !progress.noBar ? Math.round((progress.done / progress.total) * 100) : 0;

          return (
            <div
              key={badge.id}
              className={`glass rounded-2xl p-5 text-center space-y-2 transition-all ${
                earned ? 'animate-badge-pop' : 'opacity-70'
              }`}
              style={earned ? { animationDelay: `${i * 100}ms` } : {}}
            >
              <div className={`text-4xl ${earned ? '' : 'grayscale'}`}>{badge.icon}</div>
              <h3 className="font-bold text-slate-800 text-sm">{t(badge.nameKey, lang)}</h3>
              <p className="text-xs text-slate-500">{t(badge.descKey, lang)}</p>
              {earned ? (
                <span className="inline-block px-2 py-0.5 bg-emerald-100 text-emerald-700
                               text-xs font-semibold rounded-full">
                  {t('earnedBadge', lang)}
                </span>
              ) : progress && (
                <div className="space-y-1">
                  {!progress.noBar && (
                    <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-400 rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  )}
                  <p className="text-[11px] text-slate-500 font-medium">
                    {progress.noBar
                      ? t(progress.key, lang)
                      : t(progress.key, lang, { done: progress.done, total: progress.total })}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
