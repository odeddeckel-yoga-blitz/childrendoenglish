import { useMemo } from 'react';
import { ArrowLeft, BookOpen, Trophy, Flame, Target } from 'lucide-react';
import { loadStats } from '../utils/storage';
import { WORDS } from '../data/words';
import { t } from '../utils/i18n';

export default function ParentDashboard({ players = [], lang = 'en', onBack }) {
  const playerStats = useMemo(
    () => players.map(p => ({ ...p, stats: loadStats(p.id) })),
    [players]
  );

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-2.5 rounded-xl hover:bg-slate-100 transition-colors" aria-label={t('backToMenu', lang)}>
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </button>
        <h2 className="text-xl font-bold text-slate-800">{t('parentDashboard', lang)}</h2>
      </div>

      {/* Player summary cards */}
      <div className="space-y-4">
        {playerStats.map(({ stats, ...player }) => {
          const wordsLearned = Object.keys(stats.wordProgress || {}).length;
          const wordsMastered = Object.values(stats.wordProgress || {}).filter(w => w.interval >= 14).length;
          const totalWords = WORDS.length;

          return (
            <div key={player.id} className="glass rounded-2xl p-5 space-y-4">
              {/* Player header */}
              <div className="flex items-center gap-3">
                <span className="text-3xl">{player.avatar}</span>
                <div>
                  <p className="font-bold text-slate-800">{player.name}</p>
                  <p className="text-xs text-slate-500">
                    {t('canReadLabel', lang)}: {player.canRead ? '✓' : '✗'}
                  </p>
                </div>
              </div>

              {/* Stats grid */}
              <div className="grid grid-cols-4 gap-2">
                <div className="text-center space-y-0.5">
                  <BookOpen className="w-4 h-4 text-blue-500 mx-auto" />
                  <p className="text-lg font-black text-blue-600">{wordsLearned}</p>
                  <p className="text-[10px] text-slate-500">{t('learned', lang)}</p>
                </div>
                <div className="text-center space-y-0.5">
                  <Trophy className="w-4 h-4 text-emerald-500 mx-auto" />
                  <p className="text-lg font-black text-emerald-600">{wordsMastered}</p>
                  <p className="text-[10px] text-slate-500">{t('mastered', lang)}</p>
                </div>
                <div className="text-center space-y-0.5">
                  <Target className="w-4 h-4 text-purple-500 mx-auto" />
                  <p className="text-lg font-black text-purple-600">{stats.totalQuizzes}</p>
                  <p className="text-[10px] text-slate-500">{t('quizzes', lang)}</p>
                </div>
                <div className="text-center space-y-0.5">
                  <Flame className="w-4 h-4 text-amber-500 mx-auto" />
                  <p className="text-lg font-black text-amber-600">{stats.currentStreak}</p>
                  <p className="text-[10px] text-slate-500">{t('dayStreakLabel', lang)}</p>
                </div>
              </div>

              {/* Mastery bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">{t('vocabularyMastery', lang)}</span>
                  <span className="text-slate-500">{wordsLearned}/{totalWords}</span>
                </div>
                <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all"
                    style={{ width: `${(wordsLearned / totalWords) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {players.length === 0 && (
        <div className="text-center py-12 text-slate-400">
          <p>{t('noPlayersFound', lang)}</p>
        </div>
      )}
    </div>
  );
}
