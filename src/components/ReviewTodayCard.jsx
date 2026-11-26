import { useEffect } from 'react';
import { Repeat } from 'lucide-react';
import { t } from '../utils/i18n';
import { sendLearn } from '../utils/learnBeacon';

/**
 * End-of-activity card: "Words to review today (N)" → the short review (Daily
 * Review, at most 10 words). N comes from the one word memory (src/utils/wordMemory.js:
 * due words + words missed in the last 3 days), so a game, a unit page or a quiz
 * all feed it. Renders nothing at N = 0. Beacons: rvw view_<surface> / open_<surface>.
 */
export default function ReviewTodayCard({ count = 0, lang = 'en', surface = 'app', onOpen }) {
  useEffect(() => { if (count > 0) sendLearn('rvw', `view_${surface}`); }, [count > 0, surface]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!count || !onOpen) return null;
  // the number in its own LTR island, so a Hebrew line can't reorder it
  const [before, after = ''] = t('reviewTodayCard', lang).split('{{n}}');
  return (
    <button
      type="button"
      data-testid="review-today"
      onClick={() => { sendLearn('rvw', `open_${surface}`); onOpen(); }}
      className="w-full py-3 px-4 rounded-xl font-bold text-violet-700 dark:text-violet-300 bg-violet-50 dark:bg-violet-900/30
                 border border-violet-200 dark:border-violet-700 active:scale-95 transition-all flex items-center justify-center gap-2"
    >
      <Repeat className="w-4 h-4" aria-hidden="true" />
      <span>{before}<bdi dir="ltr">{count}</bdi>{after}</span>
    </button>
  );
}
