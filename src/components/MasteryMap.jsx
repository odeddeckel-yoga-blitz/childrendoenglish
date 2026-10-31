import { useEffect } from 'react';
import { t } from '../utils/i18n';
import { sendLearn } from '../utils/learnBeacon';
import { topicCounts, hasEarlierProgress, todayKey } from '../utils/mastery';

// Mastery map on the menu (kit RL16 rules, src/utils/mastery.js): one button per word category with
// ● mastered / ◐ learning / ○ not yet; a tap starts a quiz on that category (RL14 topic pick).
// No points, streaks or timers; nothing decays. Shown once the child has answered a word.
export default function MasteryMap({ wordMap, words, lang, onPickTopic }) {
  const has = wordMap && Object.keys(wordMap).length > 0;
  useEffect(() => {
    if (!has) return;
    sendLearn('mm_menu', 'menu');
    if (hasEarlierProgress(wordMap, todayKey())) sendLearn('mm_ret', 'menu');
  }, [has]); // eslint-disable-line react-hooks/exhaustive-deps -- once per menu visit
  if (!has) return null;
  const cats = [...new Set(words.map((w) => w.category))];
  const rows = cats.map((c) => ({ c, n: topicCounts(wordMap, words, c) }))
    // topics the child has started first, then the rest in our own order
    .sort((a, b) => (b.n.mastered + b.n.learning > 0) - (a.n.mastered + a.n.learning > 0));
  return (
    <section role="group" aria-labelledby="cdeMmTitle" data-m1="map" data-testid="mastery-map" className="glass rounded-2xl p-4">
      <h2 id="cdeMmTitle" className="font-bold text-slate-800 dark:text-slate-100 mb-3">🗺️ {t('masteryTitle', lang)}</h2>
      <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))' }}>
        {rows.map(({ c, n }) => {
          const done = n.mastered === n.total;
          const label = t(`cat_${c}`, lang);
          return (
            <button
              key={c}
              type="button"
              data-topic={c}
              onClick={() => { sendLearn('mm_pick', c); onPickTopic(c); }}
              aria-label={`${label}: ${n.mastered} ${t('masteryMastered', lang)}, ${n.learning} ${t('masteryLearning', lang)}, ${n.unseen} ${t('masteryNew', lang)}`}
              className={`min-h-[48px] text-start rounded-xl border-2 px-3 py-2 transition-colors focus-visible:ring-2 focus-visible:ring-amber-400 ${done ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' : 'border-slate-200 dark:border-slate-600 hover:border-blue-400'}`}
            >
              <span className="block font-bold text-sm text-slate-800 dark:text-slate-100">{label}{done && ' ✓'}</span>
              <span className="block text-xs text-slate-500 dark:text-slate-300" aria-hidden="true"><bdi dir="ltr">● {n.mastered} · ◐ {n.learning} · ○ {n.unseen}</bdi></span>
            </button>
          );
        })}
      </div>
      <p className="mt-2 text-xs text-slate-500 dark:text-slate-300" aria-hidden="true">● {t('masteryMastered', lang)} · ◐ {t('masteryLearning', lang)} · ○ {t('masteryNew', lang)}</p>
    </section>
  );
}
