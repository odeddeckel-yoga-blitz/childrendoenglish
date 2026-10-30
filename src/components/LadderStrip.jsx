import { t } from '../utils/i18n';

/**
 * The practice ladder as a thin progress strip above a running step: one dot per
 * step (done / now / to come) and "Step 3 of 11". Tapping it opens the full step
 * map. Start and Continue launch steps directly, so this is the only map door
 * while a step runs.
 */
export default function LadderStrip({ lang = 'en', steps, currentKey, doneKeys = [], onOpen }) {
  const idx = Math.max(0, steps.findIndex((s) => s.key === currentKey));
  const done = new Set(doneKeys);
  return (
    <button
      type="button"
      onClick={onOpen}
      data-testid="ladder-strip"
      className="w-full mb-3 flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400"
    >
      <span className="flex flex-1 gap-1" aria-hidden="true">
        {steps.map((s) => (
          <span
            key={s.key}
            className={`h-1.5 flex-1 rounded-full ${
              s.key === currentKey ? 'bg-blue-500' : done.has(s.key) ? 'bg-emerald-400' : 'bg-slate-200 dark:bg-slate-700'
            }`}
          />
        ))}
      </span>
      <span className="shrink-0">{t('ladderStripLabel', lang, { n: idx + 1, total: steps.length })} ▾</span>
    </button>
  );
}
