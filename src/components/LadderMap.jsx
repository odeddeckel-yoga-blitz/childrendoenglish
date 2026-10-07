import { useState } from 'react';
import { ArrowLeft, ChevronDown } from 'lucide-react';
import { t } from '../utils/i18n';
import { PHASES, LADDER, stepsFor } from '../utils/learningCycle';

/**
 * The practice-ladder step map: phase-grouped step chips with free navigation.
 * done ✓ / current (pulse) / upcoming — every available step is tappable (the
 * owner's "skip to any game" requirement). Pre-reader-skipped steps render
 * greyed; writing steps carry the explainer's "skippable" promise.
 */
export default function LadderMap({
  lang = 'en', canRead = true, setWords, setLabel, currentStepKey, doneKeys = [],
  onStartStep, onPickSet, onBack,
}) {
  const [explain, setExplain] = useState(false);
  const available = stepsFor(canRead, setWords);
  const availableKeys = new Set(available.map((s) => s.key));
  const done = new Set(doneKeys);

  return (
    <div className="animate-fade-in space-y-5 max-w-md mx-auto">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-2.5 rounded-xl hover:bg-slate-100 transition-colors" aria-label={t('backToMenu', lang)}>
          <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-300 rtl:rotate-180" />
        </button>
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">{t('ladderTitle', lang)}</h2>
          {setLabel && <p className="text-xs text-slate-400">{setLabel}</p>}
        </div>
      </div>

      {/* Explainer — "11 steps build complete learning; writing is skippable" */}
      <div className="glass rounded-2xl">
        <button onClick={() => setExplain((e) => !e)}
          className="w-full px-4 py-3 flex items-center justify-between text-sm font-bold text-slate-700 dark:text-slate-200"
          aria-expanded={explain}>
          {t('ladderExplainTitle', lang)}
          <ChevronDown className={`w-4 h-4 transition-transform ${explain ? 'rotate-180' : ''}`} />
        </button>
        {explain && (
          <div className="px-4 pb-4 text-sm text-slate-500 space-y-2">
            <p>{t('ladderExplainBody', lang)}</p>
            <p className="font-semibold">{t('ladderExplainSkip', lang)}</p>
          </div>
        )}
      </div>

      {/* Phase-grouped steps */}
      {PHASES.map((phase) => {
        const steps = LADDER.filter((s) => phase.steps.includes(s.key));
        return (
          <div key={phase.labelKey}>
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-2">
              {t(phase.labelKey, lang)}
            </p>
            <div className="space-y-2">
              {steps.map((step) => {
                const unavailable = !availableKeys.has(step.key);
                const isDone = done.has(step.key);
                const isCurrent = step.key === currentStepKey;
                return (
                  <button
                    key={step.key}
                    disabled={unavailable}
                    onClick={() => onStartStep(step.key)}
                    className={`w-full rounded-xl px-4 py-3 flex items-center gap-3 text-start transition-all
                      ${unavailable ? 'opacity-35 cursor-not-allowed bg-slate-100 dark:bg-slate-800'
                        : isCurrent ? 'bg-blue-600 text-white shadow-md ring-2 ring-emerald-400 animate-pulse-slow'
                        : isDone ? 'glass text-slate-500'
                        : 'glass hover:shadow-md active:scale-[0.99]'}`}
                  >
                    <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shrink-0
                      ${isDone ? 'bg-emerald-500 text-white' : isCurrent ? 'bg-white/25 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'}`}
                      aria-hidden="true">
                      {isDone ? '✓' : LADDER.indexOf(step) + 1}
                    </span>
                    <span className={`flex-1 font-bold text-sm ${isCurrent ? '' : 'text-slate-700 dark:text-slate-200'}`}>
                      {t(step.labelKey, lang)}
                    </span>
                    {step.writing && !unavailable && !isDone && (
                      <span className={`text-[10px] font-semibold ${isCurrent ? 'text-blue-100' : 'text-slate-400'}`}>✏️</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}

      <button onClick={onPickSet}
        className="w-full py-3 rounded-xl border border-dashed border-slate-300 dark:border-slate-600
                   text-sm font-bold text-slate-500 hover:border-blue-400 hover:text-blue-600 transition-colors">
        {t('ladderPickSet', lang)}
      </button>
    </div>
  );
}
