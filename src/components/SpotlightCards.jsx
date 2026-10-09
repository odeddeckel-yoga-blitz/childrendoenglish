import spotlight from '../data/spotlight.json';
import { getWordById } from '../data/words';
import { t, gloss } from '../utils/i18n';
import { sendLearn } from '../utils/learnBeacon';

// "Today's picks" — one cold vocabulary word + one cold arcade game, chosen at
// build time by scripts/pick-spotlight.mjs (lowest-traffic non-graduated item
// per lane; see src/utils/spotlightPick.js). Routes the arrivals we already
// have to inventory they never reach, and the 'spot' beacon measures whether
// the spotlight actually moves the item. It redistributes traffic — it does
// not create any (game-kit PATTERNS §3c).
export default function SpotlightCards({ lang = 'en' }) {
  const w = spotlight.word ? getWordById(spotlight.word.id) : null;
  const g = spotlight.game || null;
  if (!w && !g) return null;
  const wordGloss = w ? gloss(w, lang) : '';
  const card = 'glass rounded-2xl p-3 flex flex-col gap-1 text-start hover:shadow-lg active:scale-[0.98] transition-all';
  const label = 'text-[11px] font-semibold uppercase tracking-wide text-slate-400';
  return (
    <section aria-label={t('spotlightTitle', lang)} className="space-y-2" data-testid="spotlight">
      <p className="px-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
        <span aria-hidden="true">⭐</span> {t('spotlightTitle', lang)}
      </p>
      <div className="grid grid-cols-2 gap-3">
        {w && (
          <a
            href={`/vocabulary/${w.category}/${w.id}/`}
            onClick={() => sendLearn('spot', 'w_' + w.id)}
            className={card}
            data-spot="word"
          >
            <img src={w.imageUrl} alt="" width="56" height="56" loading="lazy" decoding="async"
                 className="w-14 h-14 rounded-xl object-cover bg-slate-100 dark:bg-slate-700" />
            <p className={label}>{t('spotlightWord', lang)}</p>
            <p className="font-bold text-slate-800 dark:text-slate-100 leading-tight">{w.word}</p>
            {wordGloss && <p className="text-sm text-slate-500 dark:text-slate-300 leading-tight">{wordGloss}</p>}
          </a>
        )}
        {g && (
          <a
            href={`/games/${g.id}/`}
            onClick={() => sendLearn('spot', 'g_' + g.id)}
            className={card}
            data-spot="game"
          >
            <span className="w-14 h-14 rounded-xl bg-linear-to-br from-emerald-500 to-emerald-600
                             flex items-center justify-center text-3xl" aria-hidden="true">{g.emoji}</span>
            <p className={label}>{t('spotlightGame', lang)}</p>
            <p className="font-bold text-slate-800 dark:text-slate-100 leading-tight">{g.name}</p>
            <p className="text-sm text-emerald-600 dark:text-emerald-300 leading-tight">{t('spotlightPlay', lang)} →</p>
          </a>
        )}
      </div>
    </section>
  );
}
