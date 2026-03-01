import { useState } from 'react';
import { BookOpen, Layers, Play, Award, BarChart2, Sun, Moon, Volume2, VolumeX, Sparkles, ListChecks, TrendingUp, Download, X, Users, Map, ShieldCheck, Bell, BellOff, Globe } from 'lucide-react';
import { t } from '../utils/i18n';
import { isNotificationSupported, isNotificationEnabled, requestNotificationPermission, disableNotifications } from '../utils/notifications';

export default function Menu({ stats, darkMode, soundEnabled, lang = 'en', activePlayer, playerCount = 0, showInstallBanner, onInstall, onDismissInstall, onNavigate, onToggleDark, onToggleSound, onOpenProfilePicker, onToggleLanguage }) {
  const [notifEnabled, setNotifEnabled] = useState(isNotificationEnabled);
  const notifSupported = isNotificationSupported();

  const handleToggleNotif = async () => {
    if (notifEnabled) {
      disableNotifications();
      setNotifEnabled(false);
    } else {
      const granted = await requestNotificationPermission();
      setNotifEnabled(granted);
    }
  };

  const dailyProgress = stats.dailyGoal?.date === new Date().toISOString().slice(0, 10)
    ? Math.min(stats.dailyGoal.wordsReviewed / 10, 1) * 100
    : 0;

  const wordsLearned = Object.keys(stats.wordProgress || {}).length;
  const wordsMastered = Object.values(stats.wordProgress || {}).filter(w => w.interval >= 14).length;

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-800">
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
              ? <Volume2 className="w-5 h-5 text-slate-600" />
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
              : <Moon className="w-5 h-5 text-slate-600" />
            }
          </button>
          {notifSupported && (
            <button
              onClick={handleToggleNotif}
              className="p-2.5 rounded-xl bg-white/50 hover:bg-white/80 transition-colors"
              aria-label={notifEnabled ? t('disableReminders', lang) : t('enableReminders', lang)}
            >
              {notifEnabled
                ? <Bell className="w-5 h-5 text-blue-600" />
                : <BellOff className="w-5 h-5 text-slate-400" />
              }
            </button>
          )}
          {onToggleLanguage && (
            <button
              onClick={onToggleLanguage}
              className="px-2.5 py-1.5 rounded-xl bg-white/50 hover:bg-white/80 transition-colors flex items-center gap-1.5"
              aria-label={lang === 'he' ? 'Switch to English' : 'עבור לעברית'}
            >
              <Globe className="w-4 h-4 text-slate-600" />
              <span className="text-xs font-semibold text-slate-600">{lang === 'he' ? 'EN' : 'עב'}</span>
            </button>
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
          <span className="flex-1 text-sm font-semibold text-slate-700">
            {t('playingAs', lang, { name: activePlayer.name })}
          </span>
          <span className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 text-xs font-semibold
                           flex items-center gap-1">
            <Users className="w-3.5 h-3.5" />
          </span>
        </button>
      )}

      {/* Daily goal progress */}
      <div className="glass rounded-2xl p-4 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span className="text-sm font-semibold text-slate-700">{t('dailyGoal', lang)}</span>
          </div>
          <span className="text-xs text-slate-500">
            {stats.dailyGoal?.date === new Date().toISOString().slice(0, 10)
              ? stats.dailyGoal.wordsReviewed
              : 0} / 10 {t('words', lang)}
          </span>
        </div>
        <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden" role="progressbar" aria-valuenow={Math.round(dailyProgress)} aria-valuemin={0} aria-valuemax={100} aria-label={t('dailyGoalProgress', lang)}>
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-500"
            style={{ width: `${dailyProgress}%` }}
          />
        </div>
        {stats.currentStreak > 0 && (
          <p className="text-xs text-amber-600 font-medium">
            🔥 {t('dayStreakMenu', lang, { count: stats.currentStreak })}
          </p>
        )}
      </div>

      {/* Assessment prompt — hidden for pre-readers */}
      {!stats.assessmentLevel && stats.totalQuizzes === 0 && activePlayer?.canRead !== false && (
        <button
          onClick={() => onNavigate('assessment')}
          className="w-full glass rounded-2xl p-4 flex items-center gap-4
                     hover:shadow-lg active:scale-[0.98] transition-all text-start
                     border border-blue-200 bg-blue-50/50"
        >
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600
                          flex items-center justify-center flex-shrink-0">
            <TrendingUp className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800">{t('findYourLevel', lang)}</h3>
            <p className="text-slate-500 text-sm">{t('findYourLevelDesc', lang)}</p>
          </div>
        </button>
      )}

      {/* Main actions */}
      <div className="space-y-3">
        <button
          onClick={() => onNavigate('learning')}
          className="w-full glass rounded-2xl p-4 flex items-center gap-4
                     hover:shadow-lg active:scale-[0.98] transition-all text-start"
        >
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600
                          flex items-center justify-center flex-shrink-0">
            <BookOpen className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800">{t('learnWords', lang)}</h3>
            <p className="text-slate-500 text-sm">{t('learnWordsDesc', lang)}</p>
          </div>
        </button>

        <button
          onClick={() => onNavigate('flashcards')}
          className="w-full glass rounded-2xl p-4 flex items-center gap-4
                     hover:shadow-lg active:scale-[0.98] transition-all text-start"
        >
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600
                          flex items-center justify-center flex-shrink-0">
            <Layers className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800">{t('flashcards', lang)}</h3>
            <p className="text-slate-500 text-sm">{t('flashcardsDesc', lang)}</p>
          </div>
        </button>

        <button
          onClick={() => onNavigate('levelSelect')}
          className="w-full glass rounded-2xl p-4 flex items-center gap-4
                     hover:shadow-lg active:scale-[0.98] transition-all text-start"
        >
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600
                          flex items-center justify-center flex-shrink-0">
            <Play className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800">{t('playQuiz', lang)}</h3>
            <p className="text-slate-500 text-sm">{t('playQuizDesc', lang)}</p>
          </div>
        </button>

        <button
          onClick={() => onNavigate('personalList')}
          className="w-full glass rounded-2xl p-4 flex items-center gap-4
                     hover:shadow-lg active:scale-[0.98] transition-all text-start"
        >
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600
                          flex items-center justify-center flex-shrink-0">
            <ListChecks className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800">{t('myWordList', lang)}</h3>
            <p className="text-slate-500 text-sm">{t('myWordListDesc', lang)}</p>
          </div>
        </button>

        <button
          onClick={() => onNavigate('learningPath')}
          className="w-full glass rounded-2xl p-4 flex items-center gap-4
                     hover:shadow-lg active:scale-[0.98] transition-all text-start"
        >
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600
                          flex items-center justify-center flex-shrink-0">
            <Map className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800">{t('learningPath', lang)}</h3>
            <p className="text-slate-500 text-sm">{t('learningPathDesc', lang)}</p>
          </div>
        </button>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => onNavigate('progress')}
          className="glass rounded-2xl p-4 flex items-center gap-3
                     hover:shadow-lg active:scale-[0.98] transition-all"
        >
          <BarChart2 className="w-5 h-5 text-blue-600" />
          <div className="text-start">
            <p className="font-semibold text-sm text-slate-800">{t('progress', lang)}</p>
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
            <p className="font-semibold text-sm text-slate-800">{t('badges', lang)}</p>
            <p className="text-xs text-slate-500">{stats.badges?.length || 0} {t('earned', lang)}</p>
          </div>
        </button>
      </div>

      {/* Quick stats */}
      <div className="glass rounded-2xl p-4">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-black text-blue-600">{stats.totalQuizzes}</p>
            <p className="text-xs text-slate-500">{t('quizzes', lang)}</p>
          </div>
          <div>
            <p className="text-2xl font-black text-emerald-600">{wordsLearned}</p>
            <p className="text-xs text-slate-500">{t('learned', lang)}</p>
          </div>
          <div>
            <p className="text-2xl font-black text-amber-600">{wordsMastered}</p>
            <p className="text-xs text-slate-500">{t('mastered', lang)}</p>
          </div>
        </div>
      </div>

      {/* PWA install banner */}
      {showInstallBanner && (
        <div className="glass rounded-2xl p-4 flex items-center gap-3 border border-blue-200 bg-blue-50/50">
          <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
            <Download className="w-5 h-5 text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-800">{t('installApp', lang)}</p>
            <p className="text-xs text-slate-500">{t('installDesc', lang)}</p>
          </div>
          <button onClick={onInstall} className="px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 active:scale-95 transition-all">
            {t('install', lang)}
          </button>
          <button onClick={onDismissInstall} className="p-1 rounded-lg hover:bg-slate-200 transition-colors" aria-label={t('dismissInstall', lang)}>
            <X className="w-4 h-4 text-slate-400" />
          </button>
        </div>
      )}

      {/* Trust / methodology */}
      <div className="glass rounded-2xl p-4 text-center space-y-1">
        <p className="text-sm font-semibold text-slate-700">{t('methodologyTitle', lang)}</p>
        <p className="text-xs text-slate-500">{t('methodologyDesc', lang)}</p>
      </div>

      <div className="text-center space-y-1">
        <p className="text-xs text-slate-400">{t('madeBy', lang)}</p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => onNavigate('parentDashboard')}
            className="text-xs text-slate-400 hover:text-slate-600 transition-colors flex items-center gap-1"
          >
            <ShieldCheck className="w-3 h-3" /> {t('parentDashboard', lang)}
          </button>
          <span className="text-slate-300">|</span>
          <button
            onClick={() => onNavigate('privacy')}
            className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
          >
            {t('privacyPolicy', lang)}
          </button>
        </div>
      </div>
    </div>
  );
}
