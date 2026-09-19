import { useMemo, useState } from 'react';
import { ArrowLeft, BookOpen, Trophy, Flame, Target, Bell, BellOff } from 'lucide-react';
import { loadStats } from '../utils/storage';
import { WORDS } from '../data/words';
import { filterByKnownLetters, letterCounts } from '../utils/letterFilter';
import { t } from '../utils/i18n';

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
import { isNotificationSupported, isNotificationEnabled, requestNotificationPermission, disableNotifications } from '../utils/notifications';
import ParentEmailCapture from './ParentEmailCapture';

export default function ParentDashboard({ players = [], lang = 'en', onUpdatePlayer, onBack }) {
  const playerStats = useMemo(
    () => players.map(p => ({ ...p, stats: loadStats(p.id) })),
    [players]
  );
  const [notifEnabled, setNotifEnabled] = useState(isNotificationEnabled);
  const [lettersOpenFor, setLettersOpenFor] = useState(null);
  const counts = useMemo(() => letterCounts(WORDS), []);

  const toggleLetter = (player, letter) => {
    const current = new Set(player.knownLetters || []);
    if (current.has(letter)) current.delete(letter); else current.add(letter);
    const next = [...current].sort();
    onUpdatePlayer?.(player.id, { knownLetters: next.length ? next : null });
  };
  const showEmailCapture = useMemo(() => !localStorage.getItem('childrendoenglish-parent-email-prompted'), []);
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

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-2.5 rounded-xl hover:bg-slate-100 transition-colors" aria-label={t('backToMenu', lang)}>
          <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-300" />
        </button>
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">{t('parentDashboard', lang)}</h2>
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
                  <p className="font-bold text-slate-800 dark:text-slate-100">{player.name}</p>
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

              {/* Known letters — "my child is on letter C at school" */}
              {onUpdatePlayer && (
                <div className="space-y-2">
                  <button
                    onClick={() => setLettersOpenFor(lettersOpenFor === player.id ? null : player.id)}
                    className="w-full flex items-center justify-between text-xs py-1"
                    aria-expanded={lettersOpenFor === player.id}
                  >
                    <span className="font-semibold text-slate-700 dark:text-slate-200">{t('knownLettersTitle', lang)}</span>
                    <span className="text-slate-500" dir="ltr">
                      {player.knownLetters?.length ? player.knownLetters.join(' ') : t('knownLettersAll', lang)}
                    </span>
                  </button>
                  {lettersOpenFor === player.id && (
                    <>
                      <p className="text-[11px] text-slate-500">{t('knownLettersDesc', lang)}</p>
                      <div className="grid grid-cols-7 gap-1.5" dir="ltr">
                        {ALPHABET.map(letter => {
                          const available = counts[letter] > 0;
                          const on = player.knownLetters?.includes(letter);
                          return (
                            <button
                              key={letter}
                              disabled={!available}
                              onClick={() => toggleLetter(player, letter)}
                              aria-pressed={!!on}
                              className={`py-1.5 rounded-lg text-sm font-bold transition-all ${
                                on ? 'bg-blue-600 text-white'
                                  : available ? 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300'
                                    : 'bg-slate-50 text-slate-300 dark:bg-slate-800 cursor-default'}`}
                            >
                              {letter}
                            </button>
                          );
                        })}
                      </div>
                      {player.knownLetters?.length > 0 && (
                        <div className="flex items-center justify-between text-[11px] text-slate-500">
                          <span>{t('knownLettersCount', lang, { count: filterByKnownLetters(WORDS, player.knownLetters).length })}</span>
                          <button onClick={() => onUpdatePlayer(player.id, { knownLetters: null })} className="text-blue-600 font-semibold">
                            {t('knownLettersAll', lang)}
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {players.length === 0 && (
        <div className="text-center py-12 text-slate-400">
          <p>{t('noPlayersFound', lang)}</p>
        </div>
      )}

      {/* Streak reminder notifications — parent-facing setting */}
      {notifSupported && (
        <button
          onClick={handleToggleNotif}
          className="w-full glass rounded-2xl p-4 flex items-center gap-3
                     hover:shadow-md active:scale-[0.98] transition-all text-start"
        >
          {notifEnabled
            ? <Bell className="w-5 h-5 text-blue-600 flex-shrink-0" />
            : <BellOff className="w-5 h-5 text-slate-400 flex-shrink-0" />
          }
          <span className="flex-1 text-sm font-semibold text-slate-700 dark:text-slate-200">
            {notifEnabled ? t('disableReminders', lang) : t('enableReminders', lang)}
          </span>
        </button>
      )}

      {/* Parent email capture — shown once until submitted or skipped */}
      {showEmailCapture && (
        <ParentEmailCapture lang={lang} />
      )}
    </div>
  );
}
