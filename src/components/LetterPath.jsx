import { useMemo } from 'react';
import { ArrowLeft } from 'lucide-react';
import { WORDS } from '../data/words';
import { t } from '../utils/i18n';

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

/** Letter-by-letter practice path — the natural progression for young ELLs
 *  who meet the alphabet one letter at a time at school. Each tile shows the
 *  child's progress on that letter's words; tapping starts a quiz drawn ONLY
 *  from that letter (listen-first, so pre-readers can play it too). */
export default function LetterPath({ stats, lang = 'en', onPracticeLetter, onBack }) {
  const byLetter = useMemo(() => {
    const map = {};
    WORDS.forEach(w => {
      const L = w.word[0].toUpperCase();
      (map[L] = map[L] || []).push(w);
    });
    return map;
  }, []);
  const wp = stats.wordProgress || {};

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-2.5 rounded-xl hover:bg-slate-100 transition-colors" aria-label={t('backToMenu', lang)}>
          <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-300" />
        </button>
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">{t('letterPath', lang)}</h2>
          <p className="text-sm text-slate-500">{t('letterPathHint', lang)}</p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2.5" dir="ltr">
        {ALPHABET.map(letter => {
          const words = byLetter[letter] || [];
          if (words.length === 0) {
            return (
              <div key={letter} className="rounded-2xl p-3 text-center bg-slate-50 dark:bg-slate-800 opacity-40">
                <span className="text-2xl font-black text-slate-300">{letter}</span>
              </div>
            );
          }
          const learned = words.filter(w => wp[w.id]).length;
          const pct = Math.round((learned / words.length) * 100);
          const done = learned === words.length;
          return (
            <button
              key={letter}
              onClick={() => onPracticeLetter(letter, words)}
              className={`glass rounded-2xl p-3 text-center space-y-1.5 transition-all
                          hover:shadow-lg hover:-translate-y-0.5 active:scale-95 ${done ? 'ring-2 ring-emerald-400' : ''}`}
            >
              <span className={`text-2xl font-black block ${done ? 'text-emerald-600' : 'text-slate-800 dark:text-slate-100'}`}>
                {letter}
              </span>
              <span className="text-[10px] text-slate-500 block" dir="ltr">{learned}/{words.length}</span>
              <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${done ? 'bg-emerald-500' : 'bg-blue-500'}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
