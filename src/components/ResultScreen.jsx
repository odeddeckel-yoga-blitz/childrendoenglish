import { useState, useEffect } from 'react';
import { sendLearn } from '../utils/learnBeacon';
import { Play, ArrowLeft, Check, X as XIcon, Zap, Flame } from 'lucide-react';
import { getWordById } from '../data/words';
import { LIGHTNING_SECS } from '../utils/arcade';
import { t } from '../utils/i18n';
import { ARCADE } from '../data/arcadeGames';

// PASS_PCT: the ladder's bar to move on (7 of 10), the same bar as level unlocks.
export const PASS_PCT = 70;

// One primary action, picked by the score (persona standard P1): under the bar →
// the same words again; at or over it → the next ladder step (or a new quiz).
// Everything else sits behind one "More choices" disclosure.
export default function ResultScreen({ namePrompt, cycleNext, cycleRepeats, results, lang = 'en', level: _level, mode: _mode, canRead = true, onPlayAgain, onRetrySame, onMenu, onLightning }) {
  const { score, total, answers = [], arcade, arcadeNewBest, quit } = results;
  const percentage = total > 0 ? Math.round((score / total) * 100) : 0;
  const passed = !quit && percentage >= PASS_PCT;
  const praise = percentage >= 50;
  const primaryIsPlayAgain = passed ? !cycleNext : !onRetrySame;
  // rs beacon: what a child does from here, by score band (UX baseline/after-read)
  const band = quit ? 'quit' : passed ? 'hi' : 'lo';
  const track = (action, fn) => (...a) => { sendLearn('rs', `${band}_${action}`); return fn?.(...a); };
  useEffect(() => { sendLearn('rs', `${band}_view`); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const showLightning = !!onLightning && canRead && !quit && total > 0;

  const headline = percentage >= 90 ? t('amazing', lang)
    : percentage >= 70 ? t('greatJob', lang)
    : percentage >= 50 ? t('goodEffort', lang)
    : t('keepPracticing', lang);

  const headlineColor = percentage >= 90 ? 'text-emerald-600'
    : percentage >= 70 ? 'text-blue-600'
    : percentage >= 50 ? 'text-amber-600'
    : 'text-rose-500';

  const [nameDraft, setNameDraft] = useState('');
  const [nameSaved, setNameSaved] = useState(false);
  const saveName = () => {
    if (!nameDraft.trim()) return;
    namePrompt.onSave(nameDraft.trim());
    setNameSaved(true);
  };

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

      {/* Play-first rename: a player who skipped the name gets asked once they've played */}
      {namePrompt && !quit && praise && !nameSaved && (
        <form
          className="glass rounded-2xl p-4 space-y-2"
          onSubmit={(e) => { e.preventDefault(); saveName(); }}
        >
          <label htmlFor="result-name" className="block text-sm font-bold text-slate-700 dark:text-slate-200">
            {t('nameAfterQuiz', lang)}
          </label>
          <div className="flex gap-2">
            <input
              id="result-name"
              type="text"
              value={nameDraft}
              onChange={(e) => setNameDraft(e.target.value)}
              maxLength={20}
              className="flex-1 min-w-0 px-3 py-2 rounded-xl bg-white/70 border border-slate-200 text-slate-700
                         dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-400"
              placeholder={t('playerNamePlaceholder', lang)}
            />
            <button
              type="submit"
              disabled={!nameDraft.trim()}
              className="px-4 py-2 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-40"
            >
              {t('nameAfterQuizSave', lang)}
            </button>
          </div>
        </form>
      )}

      {/* This-run arcade stats (kidsdomath crossover) */}
      {arcade && arcade.score > 0 && (
        <div className="glass rounded-2xl p-4">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="text-lg font-black text-amber-600 dark:text-amber-400" dir="ltr">⭐ {arcade.score}</p>
              <p className="text-[11px] text-slate-500 font-medium">
                {arcadeNewBest && praise ? t('newBest', lang) : t('runScore', lang)}
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
          {arcadeNewBest && praise && (
            <p className="text-center text-sm font-black text-emerald-600 mt-2 animate-badge-pop">
              {t('newBestBanner', lang)}
            </p>
          )}
        </div>
      )}


      {/* The one primary action */}
      {(() => {
        const primary = passed
          ? (cycleNext ? { ...cycleNext, onClick: track('next', cycleNext.onClick) } : { label: t('nextQuiz', lang), onClick: track('nextquiz', onPlayAgain) })
          : onRetrySame ? { label: t('retrySameWords', lang), onClick: track('retry', onRetrySame) }
          : { label: t('playAgain', lang), onClick: track('again', onPlayAgain) };
        return (
          <>
            <button
              data-kdm-primary=""
              onClick={primary.onClick}
              className="w-full py-4 px-4 rounded-xl font-black text-white bg-blue-600 hover:bg-blue-700
                         active:scale-95 transition-all shadow-md text-lg flex items-center justify-center gap-2"
            >
              {!passed && !onRetrySame && <Play className="w-4 h-4" />} {primary.label}
            </button>
            {cycleNext && !passed && !quit && (
              <p className="text-center text-sm font-semibold text-slate-500">
                {t('ladderPassHint', lang, { need: Math.ceil((total * PASS_PCT) / 100), total })}
              </p>
            )}
          </>
        );
      })()}

      <details className="glass rounded-xl group">
        <summary className="cursor-pointer list-none py-2.5 px-3 text-center text-sm font-bold text-slate-600 dark:text-slate-300">
          {t('moreChoices', lang)} <span aria-hidden="true" className="inline-block transition-transform group-open:rotate-180">▾</span>
        </summary>
        <div className="space-y-2 p-3 pt-0">
          {passed && onRetrySame && (
            <button onClick={track('retry', onRetrySame)}
              className="w-full py-2.5 px-3 rounded-xl text-sm font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 active:scale-95 transition-all">
              {t('retrySameWords', lang)}
            </button>
          )}
          {!primaryIsPlayAgain && (
            <button onClick={track('again', onPlayAgain)}
              className="w-full py-2.5 px-3 rounded-xl text-sm font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 active:scale-95 transition-all flex items-center justify-center gap-2">
              <Play className="w-4 h-4" /> {t('playAgain', lang)}
            </button>
          )}
          {cycleRepeats && cycleRepeats.map((r) => (
            <button key={r.label} onClick={track('more', r.onClick)}
              className="w-full py-2.5 px-3 rounded-xl text-sm font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 active:scale-95 transition-all">
              {r.label}
            </button>
          ))}
          {showLightning && (
            <button
              onClick={track('lightning', onLightning)}
              className="w-full py-2.5 px-3 rounded-xl text-sm font-bold text-amber-700 dark:text-amber-300
                         bg-linear-to-b from-amber-100 to-amber-200 dark:from-amber-900/40 dark:to-amber-800/40
                         border border-amber-300 dark:border-amber-700 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <Zap className="w-4 h-4" /> {t('lightningCta', lang, { secs: LIGHTNING_SECS })}
            </button>
          )}
          {/* Rotating arcade suggestion — the standalone games live outside the SPA. */}
          {(() => {
            const g = ARCADE[new Date().getDate() % ARCADE.length];
            return (
              <a
                href={`/games/${g.id}/`}
                onClick={track('game')}
                className="w-full py-2.5 px-3 rounded-xl text-sm font-bold text-emerald-700 dark:text-emerald-300
                           bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-700
                           active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <span aria-hidden="true">{g.emoji}</span> {t('resultTryGame', lang, { name: g.name })}
              </a>
            );
          })()}
        </div>
      </details>

      <button
        onClick={track('menu', onMenu)}
        className="w-full py-2 px-3 rounded-xl font-semibold text-slate-500 text-sm
                   hover:underline flex items-center justify-center gap-1.5"
      >
        <ArrowLeft className="w-4 h-4 rtl:rotate-180" /> {t('backToMenuBtn', lang)}
      </button>

      {/* Answer review */}
      {answers.length > 0 && (
        <div className="glass rounded-2xl p-4 space-y-3">
          <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-300">{t('review', lang)}</h3>
          <div className="space-y-2 max-h-60 overflow-y-auto" role="list" tabIndex={0} aria-label={t('review', lang)}>
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
                    <span className="text-xs text-slate-600 ml-auto">
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
