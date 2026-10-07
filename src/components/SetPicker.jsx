import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { t } from '../utils/i18n';

/**
 * Practice-set source picker: cycle batch (default) / chosen letters /
 * surprise / least-practiced. 'letters' expands an inline A–Z chip row.
 */
const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

export default function SetPicker({ lang = 'en', onPick, onBack }) {
  const [letters, setLetters] = useState([]);
  const [lettersOpen, setLettersOpen] = useState(false);

  const toggle = (L) =>
    setLetters((cur) => (cur.includes(L) ? cur.filter((x) => x !== L) : [...cur, L]));

  const Btn = ({ children, onClick, primary }) => (
    <button onClick={onClick}
      className={`w-full py-3.5 px-4 rounded-xl font-bold transition-all active:scale-[0.98] text-start
        ${primary ? 'bg-blue-600 text-white shadow-md' : 'glass text-slate-700 dark:text-slate-200 hover:shadow-md'}`}>
      {children}
    </button>
  );

  return (
    <div className="animate-fade-in space-y-3 max-w-md mx-auto">
      <div className="flex items-center gap-3 mb-2">
        <button onClick={onBack} className="p-2.5 rounded-xl hover:bg-slate-100 transition-colors" aria-label={t('backToMenu', lang)}>
          <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-300 rtl:rotate-180" />
        </button>
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">{t('ladderPickSet', lang)}</h2>
      </div>

      <Btn primary onClick={() => onPick('batch')}>📚 {t('ladderSetBatch', lang)}</Btn>
      <Btn onClick={() => setLettersOpen((o) => !o)}>🔤 {t('ladderSetLetters', lang)}</Btn>
      {lettersOpen && (
        <div className="glass rounded-xl p-3">
          <div className="flex flex-wrap gap-1.5" dir="ltr">
            {LETTERS.map((L) => (
              <button key={L} onClick={() => toggle(L)}
                aria-pressed={letters.includes(L)}
                className={`w-9 h-9 rounded-lg text-sm font-black transition-colors
                  ${letters.includes(L) ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
                {L}
              </button>
            ))}
          </div>
          {letters.length > 0 && (
            <button onClick={() => onPick('letters', letters)}
              className="mt-3 w-full py-2.5 rounded-lg bg-blue-600 text-white font-bold">
              {t('cycleStart', lang)}
            </button>
          )}
        </div>
      )}
      <Btn onClick={() => onPick('surprise')}>🎲 {t('ladderSetSurprise', lang)}</Btn>
      <Btn onClick={() => onPick('fresh')}>✨ {t('ladderSetFresh', lang)}</Btn>
    </div>
  );
}
