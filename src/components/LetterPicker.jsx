import { useMemo } from 'react';
import { WORDS } from '../data/words';
import { filterByKnownLetters, letterCounts } from '../utils/letterFilter';
import { t } from '../utils/i18n';

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

/** A-Z known-letters grid — shared by ParentDashboard and the Play screen.
 *  Letters with no vocabulary words render disabled. */
export default function LetterPicker({ knownLetters, onChange, lang = 'en' }) {
  const counts = useMemo(() => letterCounts(WORDS), []);

  const toggle = (letter) => {
    const current = new Set(knownLetters || []);
    if (current.has(letter)) current.delete(letter); else current.add(letter);
    const next = [...current].sort();
    onChange(next.length ? next : null);
  };

  return (
    <div className="space-y-2">
      <p className="text-[11px] text-slate-500">{t('knownLettersDesc', lang)}</p>
      <div className="grid grid-cols-7 gap-1.5" dir="ltr">
        {ALPHABET.map(letter => {
          const available = counts[letter] > 0;
          const on = knownLetters?.includes(letter);
          return (
            <button
              key={letter}
              disabled={!available}
              onClick={() => toggle(letter)}
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
      {knownLetters?.length > 0 && (
        <div className="flex items-center justify-between text-[11px] text-slate-500">
          <span>{t('knownLettersCount', lang, { count: filterByKnownLetters(WORDS, knownLetters).length })}</span>
          <button onClick={() => onChange(null)} className="text-blue-600 font-semibold">
            {t('knownLettersAll', lang)}
          </button>
        </div>
      )}
    </div>
  );
}
