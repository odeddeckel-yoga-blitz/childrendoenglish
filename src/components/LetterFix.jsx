import { useState, useMemo, useEffect, useCallback } from 'react';
import { ArrowLeft, Volume2 } from 'lucide-react';
import { t } from '../utils/i18n';
import { letterFixPlan } from '../utils/learningCycle';
import { getImageUrl } from '../utils/images';
import { speakWord } from '../utils/sound';

/**
 * Letter Fix — the missing-letter spelling scaffold (ladder steps lf1/lf2/lf3).
 * Shows the word's image + audio and the word with blank(s); the child fills
 * each blank from 4 letter cards. mode: easy (one obvious letter) · double
 * (two blanks, filled left-to-right) · hard (silent/tricky letter).
 * Feeds stats.spelling via onResult(wordId, ok) per word; onComplete at the end.
 */
export default function LetterFix({ words = [], mode = 'easy', lang = 'en', onResult, onComplete, onBack }) {
  const [idx, setIdx] = useState(0);
  const [blankPos, setBlankPos] = useState(0); // which blank is being filled (double mode)
  const [fills, setFills] = useState([]);      // chosen letters so far
  const [wrongPick, setWrongPick] = useState(null);
  const [solved, setSolved] = useState(false);
  const [missed, setMissed] = useState(false); // any wrong pick this word

  const word = words[idx];
  const plan = useMemo(() => (word ? letterFixPlan(word, mode) : null), [word, mode]);

  useEffect(() => {
    if (word) { const timer = setTimeout(() => speakWord(word.word), 350); return () => clearTimeout(timer); }
  }, [word]);

  const nextWord = useCallback(() => {
    if (idx + 1 >= words.length) { onComplete?.(); return; }
    setIdx(idx + 1); setBlankPos(0); setFills([]); setWrongPick(null); setSolved(false); setMissed(false);
  }, [idx, words.length, onComplete]);

  if (!word || !plan) return null;

  const text = word.word;
  const blanks = plan.blanks;
  const current = blanks[blankPos];

  const pick = (letter) => {
    if (solved) return;
    if (letter === current.letter) {
      const newFills = [...fills, letter];
      setFills(newFills); setWrongPick(null);
      if (newFills.length === blanks.length) {
        setSolved(true);
        onResult?.(word.id, !missed);
        speakWord(word.word);
        setTimeout(nextWord, 1400);
      } else {
        setBlankPos(blankPos + 1);
      }
    } else {
      setWrongPick(letter); setMissed(true);
      setTimeout(() => setWrongPick(null), 650);
    }
  };

  // Render the word with blanks: filled blanks show their letter (green),
  // the active blank pulses, future blanks show a dash.
  const rendered = [...text].map((ch, i) => {
    const bIdx = blanks.findIndex((b) => b.index === i);
    if (bIdx === -1) return <span key={i}>{ch}</span>;
    if (bIdx < fills.length) return <span key={i} className="text-emerald-500">{fills[bIdx]}</span>;
    const active = bIdx === blankPos && !solved;
    return (
      <span key={i}
        className={`inline-block min-w-[0.7em] border-b-4 mx-0.5 text-transparent select-none
          ${active ? 'border-blue-500 animate-pulse' : 'border-slate-300'}`}>
        _
      </span>
    );
  });

  return (
    <div className="animate-fade-in max-w-md mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="p-2.5 rounded-xl hover:bg-slate-100 transition-colors" aria-label={t('backToMenu', lang)}>
          <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-300 rtl:rotate-180" />
        </button>
        <p className="text-sm font-bold text-slate-400">{idx + 1} / {words.length}</p>
      </div>

      <div className="glass rounded-2xl overflow-hidden">
        <img src={getImageUrl(word)} alt={word.definition} className="w-full aspect-4/3 object-cover cursor-pointer"
             onClick={() => speakWord(word.word)} width={512} height={384} />
        <div className="p-5 text-center space-y-4">
          <div className="flex items-center justify-center gap-3" dir="ltr">
            <p className={`text-4xl font-black tracking-wider lowercase ${solved ? 'text-emerald-600' : 'text-slate-800 dark:text-slate-100'}`}>
              {rendered}
            </p>
            <button onClick={() => speakWord(word.word)} aria-label={t('pronounceWord', lang)}
              className="p-2 rounded-full bg-blue-100 hover:bg-blue-200 dark:bg-blue-800/40 transition-colors">
              <Volume2 className="w-5 h-5 text-blue-600" />
            </button>
          </div>

          <div className="grid grid-cols-4 gap-3 max-w-xs mx-auto" dir="ltr">
            {current.options.map((letter) => (
              <button key={letter} onClick={() => pick(letter)} disabled={solved}
                className={`h-14 rounded-xl text-2xl font-black transition-all active:scale-95
                  ${wrongPick === letter ? 'bg-red-100 text-red-600 animate-shake border-2 border-red-300'
                    : solved && letter === current.letter ? 'bg-emerald-500 text-white'
                    : 'bg-white dark:bg-slate-700 border-2 border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-100 hover:border-blue-400 shadow-sm'}`}>
                {letter}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
