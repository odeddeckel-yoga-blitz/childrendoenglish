import { BookOpen, Layers, Play, Award, BarChart2, Sun, Moon, Volume2, VolumeX, ListChecks, Download, X, Users, Map, ShieldCheck, RotateCcw } from 'lucide-react';
import SpotlightCards from './SpotlightCards';
import { t } from '../utils/i18n';

import LanguagePicker from './LanguagePicker';

export default function Menu({ stats, darkMode, soundEnabled, lang = 'en', activePlayer, playerCount: _playerCount = 0, showInstallBanner, isIOS, dueCount = 0, onInstall, onDismissInstall, onNavigate, onQuickStart: _onQuickStart, onToggleDark, onToggleSound, onOpenProfilePicker, onSelectLanguage, onContinueCycle, cycleInfo, onOpenSpotlightWord }) {

  const wordsLearned = Object.keys(stats.wordProgress || {}).length;
  const isNewUser = stats.totalQuizzes === 0 && wordsLearned === 0;

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-800 dark:text-slate-100">
            {t('appName', lang)}
          </h1>
          <p className="text-slate-500 text-sm">{t('tagline', lang)}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onToggleSound}
            className="p-2.5 rounded-xl bg-white/50 hover:bg-white/80 transition-colors"
            aria-label={soundEnabled ? t('muteSound', lang) : t('enableSound', lang)}
          >
            {soundEnabled
              ? <Volume2 className="w-5 h-5 text-slate-600 dark:text-slate-300" />
              : <VolumeX className="w-5 h-5 text-slate-400" />
            }
          </button>
          <button
            onClick={onToggleDark}
            className="p-2.5 rounded-xl bg-white/50 hover:bg-white/80 transition-colors"
            aria-label={darkMode ? t('lightMode', lang) : t('darkModeLabel', lang)}
          >
            {darkMode
              ? <Sun className="w-5 h-5 text-amber-500" />
              : <Moon className="w-5 h-5 text-slate-600 dark:text-slate-300" />
            }
          </button>
          {onSelectLanguage && (
            <LanguagePicker lang={lang} onSelectLanguage={onSelectLanguage} />
          )}
        </div>
      </div>

      {/* Active player — tap to open profile picker */}
      {activePlayer && (
        <button
          onClick={onOpenProfilePicker}
          className="w-full glass rounded-2xl p-3 flex items-center gap-3
                     hover:shadow-md active:scale-[0.98] transition-all text-start"
        >
          <span className="text-2xl">{activePlayer.avatar}</span>
          <span className="flex-1 text-sm font-semibold text-slate-700 dark:text-slate-200">
            {t('playingAs', lang, { name: activePlayer.name })}
          </span>
          <span className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 text-xs font-semibold
                           flex items-center gap-1">
            <Users className="w-3.5 h-3.5" />
          </span>
        </button>
      )}


      {/* Assessment removed — levels unlock via quiz scores */}

      {/* Learning cycle hero — THE answer to "what do I do?": one continue
          button over the batch ladder (learn 10 → practice through stages →
          advance). Everything below is explore, not the main path. */}
      {onContinueCycle && (
        <button
          onClick={onContinueCycle}
          className="w-full rounded-2xl p-5 text-start text-white shadow-lg
                     bg-linear-to-br from-blue-600 to-indigo-600
                     hover:shadow-xl active:scale-[0.98] transition-all ring-2 ring-emerald-400 ring-offset-2"
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-100">
            {cycleInfo?.isNew ? t('startHere', lang) : t('cycleContinue', lang)}
          </p>
          <p className="text-lg font-black mt-1">
            {t('cycleBatchTitle', lang, { num: (cycleInfo?.batch ?? 0) + 1, label: cycleInfo?.label || 'A' })}
          </p>
          <div className="flex items-center justify-between mt-2 text-sm text-blue-100">
            <span>{t('cycleStageOf', lang, { step: (cycleInfo?.stage ?? 0) + 1, total: cycleInfo?.stages ?? 3 })}</span>
            <span>{t('cycleMastered', lang, { count: cycleInfo?.mastered ?? 0 })}</span>
          </div>
          <div className="mt-2 h-2 rounded-full bg-white/25 overflow-hidden" aria-hidden="true">
            <div className="h-full bg-emerald-300 rounded-full transition-all"
                 style={{ width: `${Math.min(100, Math.round(100 * ((cycleInfo?.batch ?? 0) / (cycleInfo?.totalBatches || 48))))}%` }} />
          </div>
        </button>
      )}

      {/* Today's picks — build-time spotlight of one cold word + one cold game
          (scripts/pick-spotlight.mjs). Sits right under the Continue hero for
          visibility (owner, 2026-10-10); uses the traffic we have, creates none. */}
      <SpotlightCards lang={lang} onOpenWord={onOpenSpotlightWord} />

      {/* Main actions */}
      <nav aria-label="Main menu" className="space-y-3">
        {/* Play Quiz — primary action for new users */}
        <button
          onClick={() => onNavigate('levelSelect')}
          className="w-full glass rounded-2xl p-4 flex items-center gap-4
                     hover:shadow-lg active:scale-[0.98] transition-all text-start"
        >
          <div className="relative shrink-0">
            <div className="w-12 h-12 rounded-xl bg-linear-to-br from-blue-500 to-blue-600
                            flex items-center justify-center">
              <Play className="w-6 h-6 text-white" />
            </div>
          </div>
          <div className="flex-1">
            <p className="font-bold text-slate-800 dark:text-slate-100">{t('playQuiz', lang)}</p>
            <p className="text-slate-500 text-sm">{t('playQuizDesc', lang)}</p>
          </div>
        </button>

        {/* Letter-by-letter path — the natural progression for young learners */}
        <button
          onClick={() => onNavigate('letterPath')}
          className="w-full glass rounded-2xl p-4 flex items-center gap-4
                     hover:shadow-lg active:scale-[0.98] transition-all text-start"
        >
          <div className="shrink-0">
            <div className="w-12 h-12 rounded-xl bg-linear-to-br from-purple-500 to-purple-600
                            flex items-center justify-center font-black text-white text-lg" aria-hidden="true">
              A<span className="text-purple-200">b</span>
            </div>
          </div>
          <div className="flex-1">
            <p className="font-bold text-slate-800 dark:text-slate-100">{t('letterPath', lang)}</p>
            <p className="text-slate-500 text-sm">{t('letterPathDesc', lang)}</p>
          </div>
        </button>

        {/* Learn Words */}
        <button
          onClick={() => onNavigate('learning')}
          className="w-full glass rounded-2xl p-4 flex items-center gap-4
                     hover:shadow-lg active:scale-[0.98] transition-all text-start"
        >
          <div className="relative shrink-0">
            <div className="w-12 h-12 rounded-xl bg-linear-to-br from-emerald-500 to-emerald-600
                            flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
          </div>
          <div className="flex-1">
            <p className="font-bold text-slate-800 dark:text-slate-100">{t('learnWords', lang)}</p>
            <p className="text-slate-500 text-sm">{t('learnWordsDesc', lang)}</p>
          </div>
        </button>

        <button
          onClick={() => onNavigate('flashcards')}
          className="w-full glass rounded-2xl p-4 flex items-center gap-4
                     hover:shadow-lg active:scale-[0.98] transition-all text-start"
        >
          <div className="shrink-0">
            <div className="w-12 h-12 rounded-xl bg-linear-to-br from-amber-500 to-amber-600
                            flex items-center justify-center">
              <Layers className="w-6 h-6 text-white" />
            </div>
          </div>
          <div>
            <p className="font-bold text-slate-800 dark:text-slate-100">{t('flashcards', lang)}</p>
            <p className="text-slate-500 text-sm">{t('flashcardsDesc', lang)}</p>
          </div>
        </button>

        {/* Vocabulary arcade — standalone game pages (full navigation out of the
            SPA; the games' home pill links back). Engagement fix 2026-10-01:
            the games had ZERO in-app doors, so real users never found them. */}
        <a
          href="/games/"
          className="w-full glass rounded-2xl p-4 flex items-center gap-4
                     hover:shadow-lg active:scale-[0.98] transition-all text-start"
        >
          <div className="shrink-0">
            <div className="w-12 h-12 rounded-xl bg-linear-to-br from-emerald-500 to-emerald-600
                            flex items-center justify-center text-2xl" aria-hidden="true">🎮</div>
          </div>
          <div>
            <p className="font-bold text-slate-800 dark:text-slate-100">{t('arcadeGames', lang)}</p>
            <p className="text-slate-500 text-sm">{t('arcadeGamesDesc', lang)}</p>
          </div>
        </a>

        {isNewUser && (
          <p className="text-center text-sm text-slate-400">{t('menuMoreFeatures', lang)}</p>
        )}

        {!isNewUser && (
          <>
            {/* Daily Review — only surfaced when words are actually due */}
            {dueCount > 0 && (
              <button
                onClick={() => onNavigate('dailyReview')}
                className="w-full glass rounded-2xl p-4 flex items-center gap-4 transition-all text-start
                           hover:shadow-lg active:scale-[0.98] border border-orange-200 bg-orange-50/50"
              >
                <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-linear-to-br from-orange-500 to-orange-600">
                  <RotateCcw className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-slate-800 dark:text-slate-100">{t('dailyReview', lang)}</p>
                  <p className="text-slate-500 text-sm">{t('dailyReviewDesc', lang)}</p>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-orange-500 text-white text-xs font-bold shrink-0">
                  {t('wordsDue', lang, { count: dueCount })}
                </span>
              </button>
            )}

            <button
              onClick={() => onNavigate('personalList')}
              className="w-full glass rounded-2xl p-4 flex items-center gap-4
                         hover:shadow-lg active:scale-[0.98] transition-all text-start"
            >
              <div className="w-12 h-12 rounded-xl bg-linear-to-br from-purple-500 to-purple-600
                              flex items-center justify-center shrink-0">
                <ListChecks className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="font-bold text-slate-800 dark:text-slate-100">{t('myWordList', lang)}</p>
                <p className="text-slate-500 text-sm">{t('myWordListDesc', lang)}</p>
              </div>
            </button>

            <button
              onClick={() => onNavigate('learningPath')}
              className="w-full glass rounded-2xl p-4 flex items-center gap-4
                         hover:shadow-lg active:scale-[0.98] transition-all text-start"
            >
              <div className="w-12 h-12 rounded-xl bg-linear-to-br from-indigo-500 to-indigo-600
                              flex items-center justify-center shrink-0">
                <Map className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="font-bold text-slate-800 dark:text-slate-100">{t('learningPath', lang)}</p>
                <p className="text-slate-500 text-sm">{t('learningPathDesc', lang)}</p>
              </div>
            </button>

          </>
        )}
      </nav>

      {/* Bottom row — hidden for new users */}
      {!isNewUser && (
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => onNavigate('progress')}
            className="glass rounded-2xl p-4 flex items-center gap-3
                       hover:shadow-lg active:scale-[0.98] transition-all"
          >
            <BarChart2 className="w-5 h-5 text-blue-600" />
            <div className="text-start">
              <p className="font-semibold text-sm text-slate-800 dark:text-slate-100">{t('progress', lang)}</p>
              <p className="text-xs text-slate-500">{wordsLearned} {t('words', lang)}</p>
            </div>
          </button>

          <button
            onClick={() => onNavigate('badges')}
            className="glass rounded-2xl p-4 flex items-center gap-3
                       hover:shadow-lg active:scale-[0.98] transition-all"
          >
            <Award className="w-5 h-5 text-amber-600" />
            <div className="text-start">
              <p className="font-semibold text-sm text-slate-800 dark:text-slate-100">{t('badges', lang)}</p>
              <p className="text-xs text-slate-500">{stats.badges?.length || 0} {t('earned', lang)}</p>
            </div>
          </button>
        </div>
      )}

      {/* PWA install banner */}
      {showInstallBanner && (
        <div className="glass rounded-2xl p-4 flex items-center gap-3 border border-blue-200 bg-blue-50/50">
          <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
            <Download className="w-5 h-5 text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{t('installApp', lang)}</p>
            <p className="text-xs text-slate-500">{isIOS ? t('installIOS', lang) : t('installDesc', lang)}</p>
          </div>
          {!isIOS && (
            <button onClick={onInstall} className="px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 active:scale-95 transition-all">
              {t('install', lang)}
            </button>
          )}
          <button onClick={onDismissInstall} className="p-1 rounded-lg hover:bg-slate-200 transition-colors" aria-label={t('dismissInstall', lang)}>
            <X className="w-4 h-4 text-slate-400" />
          </button>
        </div>
      )}

      {/* Parent area — one visible, self-describing entry so parents know
          what they can adjust (was a near-invisible footer link) */}
      {!isNewUser && (
        <button
          onClick={() => onNavigate('parentDashboard')}
          className="w-full glass rounded-2xl p-3.5 flex items-center gap-3
                     hover:shadow-md active:scale-[0.98] transition-all text-start"
        >
          <ShieldCheck className="w-5 h-5 text-teal-600 shrink-0" />
          <span className="flex-1">
            <span className="block text-sm font-semibold text-slate-700 dark:text-slate-200">{t('parentDashboard', lang)}</span>
            <span className="block text-xs text-slate-500">{t('parentDashboardHint', lang)}</span>
          </span>
        </button>
      )}

      <div className="text-center space-y-1">
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => onNavigate('privacy')}
            className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
          >
            {t('privacyPolicy', lang)}
          </button>
          <span className="text-slate-300">|</span>
          <button
            onClick={() => onNavigate('terms')}
            className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
          >
            {t('termsOfService', lang)}
          </button>
        </div>
      </div>
    </div>
  );
}
