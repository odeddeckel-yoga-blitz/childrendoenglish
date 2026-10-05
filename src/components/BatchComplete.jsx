import { t } from '../utils/i18n';
import { batchCount, masteredCount, BATCH_SIZE } from '../utils/learningCycle';

/**
 * Batch-complete interstitial — the reward beat of the learning cycle.
 * Celebrates the finished batch, offers the arcade as the treat (games are the
 * reward between batches, deliberately not the practice), and tees up the next
 * batch. `batchJustDone` is 1-based for kid-facing copy.
 */
const ARCADE = [
  { id: 'word-zapper', name: 'Word Zapper', emoji: '⚡' },
  { id: 'spelling-forge', name: 'Spelling Forge', emoji: '🔨' },
  { id: 'category-conveyor', name: 'Category Conveyor', emoji: '📦' },
];

export default function BatchComplete({ stats, lang = 'en', batchJustDone, onNextBatch, onBackToMenu }) {
  const total = batchCount();
  const allDone = batchJustDone >= total;
  const game = ARCADE[batchJustDone % ARCADE.length];
  const mastered = masteredCount(stats);

  return (
    <div className="animate-fade-in max-w-md mx-auto text-center space-y-6 pt-10">
      <div className="text-7xl" aria-hidden="true">{allDone ? '🏆' : '🎉'}</div>
      <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100">
        {allDone ? t('cycleAllDone', lang) : t('cycleBatchDone', lang, { num: batchJustDone })}
      </h2>
      <p className="text-slate-500">
        {t('cycleBatchDoneDesc', lang, { count: BATCH_SIZE })}
      </p>
      <p className="text-sm font-semibold text-emerald-600">
        {t('cycleMastered', lang, { count: mastered })}
      </p>

      <a
        href={`/games/${game.id}/`}
        className="block w-full py-3.5 px-4 rounded-xl font-bold text-emerald-700 dark:text-emerald-300
                   bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-700
                   hover:shadow-md active:scale-95 transition-all"
      >
        <span aria-hidden="true">{game.emoji}</span> {t('resultTryGame', lang, { name: game.name })}
      </a>

      {!allDone && (
        <button
          onClick={onNextBatch}
          className="w-full py-3.5 px-4 rounded-xl font-bold text-white bg-blue-600
                     hover:bg-blue-700 active:scale-95 transition-all shadow-md"
        >
          {t('cycleNextBatch', lang, { num: batchJustDone + 1 })}
        </button>
      )}

      <button onClick={onBackToMenu} className="w-full py-2 text-sm text-slate-400 hover:text-slate-600">
        {t('backToMenuBtn', lang)}
      </button>
    </div>
  );
}
