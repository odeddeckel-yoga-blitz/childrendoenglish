import { useState, useMemo, useEffect, useCallback } from 'react';
import { ArrowLeft, Volume2 } from 'lucide-react';
import { t } from '../utils/i18n';
import { getImageUrl } from '../utils/images';
import { speakWord } from '../utils/sound';
import { WORDS } from '../data/words';

/**
 * Sentence Gap — ladder step 'sent': the word's own exampleSentence with the
 * word blanked out; 4 word options (same-set siblings first, same-category
 * fallback). The only usage-level practice in the app.
 */
function blankSentence(word) {
  // Blank the word (case-insensitive, first occurrence; tolerate plural 's')
  const re = new RegExp(`\\b${word.word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(s)?\\b`, 'i');
  if (!re.test(word.exampleSentence)) return null;
  return word.exampleSentence.replace(re, '_____');
}

export default function SentenceGap({ words = [], lang = 'en', onResult, onComplete, onBack }) {
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState(null);
  const [solved, setSolved] = useState(false);
  const [missed, setMissed] = useState(false);

  // Words whose sentence actually contains the word (defensive)
  const playable = useMemo(() => words.filter((w) => blankSentence(w)), [words]);
  const word = playable[idx];

  const options = useMemo(() => {
    if (!word) return [];
    const sibs = playable.filter((w) => w.id !== word.id);
    const pool = sibs.length >= 3 ? sibs
      : [...sibs, ...WORDS.filter((w) => w.category === word.category && w.id !== word.id && !sibs.some((s) => s.id === w.id))];
    const hash = [...word.id].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
    const picks = [];
    for (let i = 0; picks.length < 3 && i < pool.length; i++) {
      const cand = pool[(hash + i * 13) % pool.length];
      if (!picks.some((p) => p.id === cand.id) && cand.word.toLowerCase() !== word.word.toLowerCase()) picks.push(cand);
    }
    const all = [word, ...picks];
    const rot = hash % all.length;
    return all.slice(rot).concat(all.slice(0, rot));
  }, [word, playable]);

  useEffect(() => { setPicked(null); setSolved(false); setMissed(false); }, [idx]);

  const next = useCallback(() => {
    if (idx + 1 >= playable.length) { onComplete?.(); return; }
    setIdx(idx + 1);
  }, [idx, playable.length, onComplete]);

  if (!word) { onComplete?.(); return null; }
  const sentence = blankSentence(word);

  const pick = (opt) => {
    if (solved) return;
    setPicked(opt.id);
    if (opt.id === word.id) {
      setSolved(true);
      onResult?.(word.id, !missed);
      speakWord(word.word);
      setTimeout(next, 1500);
    } else {
      setMissed(true);
      setTimeout(() => setPicked(null), 650);
    }
  };

  return (
    <div className="animate-fade-in max-w-md mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="p-2.5 rounded-xl hover:bg-slate-100 transition-colors" aria-label={t('backToMenu', lang)}>
          <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-300 rtl:rotate-180" />
        </button>
        <p className="text-sm font-bold text-slate-400">{idx + 1} / {playable.length}</p>
      </div>

      <div className="glass rounded-2xl p-6 space-y-5 text-center">
        <img src={getImageUrl(word)} alt="" className="w-28 h-28 rounded-xl object-cover mx-auto" width={112} height={112} />
        <div className="flex items-start justify-center gap-2" dir="ltr">
          <p className="text-xl font-semibold text-slate-700 dark:text-slate-100 leading-relaxed">
            {solved ? word.exampleSentence : sentence}
          </p>
          <button onClick={() => speakWord(word.word)} aria-label={t('pronounceWord', lang)}
            className="p-2 rounded-full bg-blue-100 hover:bg-blue-200 dark:bg-blue-800/40 transition-colors shrink-0">
            <Volume2 className="w-4 h-4 text-blue-600" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3" dir="ltr">
          {options.map((opt) => (
            <button key={opt.id} onClick={() => pick(opt)} disabled={solved}
              className={`py-3 px-3 rounded-xl font-bold transition-all active:scale-95 text-lg
                ${solved && opt.id === word.id ? 'bg-emerald-500 text-white'
                  : picked === opt.id && opt.id !== word.id ? 'bg-red-100 text-red-600 animate-shake border-2 border-red-300'
                  : 'bg-white dark:bg-slate-700 border-2 border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-100 hover:border-blue-400 shadow-sm'}`}>
              {opt.word}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
