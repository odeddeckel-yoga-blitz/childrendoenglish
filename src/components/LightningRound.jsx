import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Zap, ArrowLeft, Volume2 } from 'lucide-react';
import QuizOptionGrid from './QuizOptionGrid';
import { getImageUrl, preloadImages } from '../utils/images';
import { getDistractors } from '../data/words';
import { fisherYatesShuffle } from '../utils/shuffle';
import { playSound, speakWord, isTTSAvailable } from '../utils/sound';
import { haptic } from '../utils/haptic';
import { t } from '../utils/i18n';
import { getLightningSecs } from '../utils/arcade';

/**
 * ⚡ Lightning Round — 60s "how many can you solve" rush (kidsdomath crossover).
 * Opt-in from the result screen after a completed quiz; reuses the SAME word
 * pool + mode the quiz just used (images already preloaded), cycling questions
 * endlessly until the timer runs out. Age-gated upstream (hidden for
 * pre-readers). Test hook: ?lightningSecs=N or the `secs` prop.
 */
const EXTRA_POOL = 20; // same-level words added once their images preload

export default function LightningRound({ words, mode, level, lang = 'en', best = 0, secs, onFinish, onExit }) {
  const duration = secs || getLightningSecs();
  const [phase, setPhase] = useState('play'); // 'play' | 'done'
  const [timeLeft, setTimeLeft] = useState(duration);
  const [solves, setSolves] = useState(0);
  const [qIndex, setQIndex] = useState(0);
  const [options, setOptions] = useState([]);
  const [answered, setAnswered] = useState(null); // null | 'correct' | 'wrong'
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [loadedImages, setLoadedImages] = useState(new Set());
  const [extraWords, setExtraWords] = useState([]);
  const orderRef = useRef([]);
  const cycleStartRef = useRef(0);
  const finishedRef = useRef(false);
  const advanceTimer = useRef(null);

  const ttsOk = isTTSAvailable();
  // The round starts instantly on the quiz's preloaded words, then grows with
  // same-level extras — 60s laps a 10-word pool 2-3×, which reads as "the same
  // images in a loop". Extras only ever APPEND, so shuffled indices stay valid.
  const pool = useMemo(() => (words || []).concat(extraWords), [words, extraWords]);
  const currentWord = pool.length > 0
    ? pool[orderRef.current[qIndex - cycleStartRef.current] ?? 0]
    : null;

  // Background pool expansion (skipped when no level, e.g. personal-list rounds)
  useEffect(() => {
    if (!level) return undefined;
    let alive = true;
    (async () => {
      try {
        const { getWordsByLevel, getDistractors: pick } = await import('../data/words');
        const have = new Set((words || []).map(w => w.id));
        const candidates = fisherYatesShuffle(
          getWordsByLevel(level).filter(w => !have.has(w.id))
        ).slice(0, EXTRA_POOL);
        if (candidates.length === 0) return;
        const withDistractors = candidates.map(w => ({ ...w, _distractors: pick(w, 3) }));
        const needed = new Set();
        withDistractors.forEach(w => { needed.add(w); w._distractors.forEach(d => needed.add(d)); });
        const { missing } = await preloadImages([...needed]);
        const bad = new Set(missing.map(m => m.id));
        const ready = withDistractors.filter(
          w => !bad.has(w.id) && w._distractors.every(d => !bad.has(d.id))
        );
        if (alive && ready.length > 0) setExtraWords(ready);
      } catch { /* best-effort: the quiz pool alone still plays */ }
    })();
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Build / rebuild the shuffled question order. Reshuffles each full cycle,
  // avoiding an immediate back-to-back repeat of the same word (qkey idea).
  useEffect(() => {
    if (pool.length === 0) return;
    if (qIndex - cycleStartRef.current >= orderRef.current.length) {
      const last = orderRef.current.length > 0 ? orderRef.current[orderRef.current.length - 1] : -1;
      let order = fisherYatesShuffle(pool.map((_, i) => i));
      if (pool.length > 1 && order[0] === last) {
        order = [...order.slice(1), order[0]];
      }
      orderRef.current = order;
      cycleStartRef.current = qIndex;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qIndex, pool.length]);

  // New question: shuffle options, reset feedback, auto-speak in listen modes
  useEffect(() => {
    if (!currentWord || phase !== 'play') return undefined;
    const distractors = currentWord._distractors || getDistractors(currentWord, 3);
    setOptions(fisherYatesShuffle([currentWord, ...distractors]));
    setAnswered(null);
    setSelectedAnswer(null);
    setLoadedImages(new Set());
    if ((mode === 'audio' || mode === 'listen') && ttsOk) {
      const timer = setTimeout(() => speakWord(currentWord.word), 250);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [qIndex, currentWord, phase, mode, ttsOk]);

  // Countdown
  useEffect(() => {
    if (phase !== 'play') return undefined;
    const timer = setInterval(() => {
      setTimeLeft(prev => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [phase]);

  // Time's up → results card, report once
  useEffect(() => {
    if (timeLeft === 0 && phase === 'play') {
      setPhase('done');
      clearTimeout(advanceTimer.current);
      if (!finishedRef.current) {
        finishedRef.current = true;
        try { onFinish?.(solves); } catch { /* stats persistence must never break the card */ }
      }
    }
  }, [timeLeft, phase, solves, onFinish]);

  useEffect(() => () => clearTimeout(advanceTimer.current), []);

  const handleAnswer = useCallback((option) => {
    if (answered || phase !== 'play' || !currentWord) return;
    const correct = option.id === currentWord.id;
    setSelectedAnswer(option.id);
    setAnswered(correct ? 'correct' : 'wrong');
    if (correct) {
      setSolves(s => s + 1);
      playSound('correct');
      haptic('success');
    } else {
      playSound('wrong');
      haptic('error');
    }
    // Rush pacing: brief flash, then next question
    advanceTimer.current = setTimeout(() => setQIndex(i => i + 1), correct ? 350 : 700);
  }, [answered, phase, currentWord]);

  const restart = useCallback(() => {
    finishedRef.current = false;
    setSolves(0);
    setTimeLeft(duration);
    setQIndex(i => i + 1); // fresh question, order keeps cycling
    setAnswered(null);
    setSelectedAnswer(null);
    setPhase('play');
  }, [duration]);

  if (!currentWord) return null;

  // --- results card ---
  if (phase === 'done') {
    const isNew = solves > best;
    return (
      <div className="animate-fade-in space-y-4 text-center" data-testid="lightning-results">
        <div className="glass rounded-3xl p-8 space-y-3">
          <p className="text-2xl font-black text-amber-500 flex items-center justify-center gap-2">
            <Zap className="w-6 h-6" /> {t('lightningTimeUp', lang)}
          </p>
          <p className="text-6xl font-black text-slate-800 dark:text-slate-100" dir="ltr">{solves}</p>
          <p className="text-sm font-semibold text-slate-500">{t('lightningSolvedIn', lang, { secs: duration })}</p>
          <p className={`text-sm font-bold ${isNew ? 'text-emerald-600' : 'text-slate-500'}`}>
            {isNew
              ? t('lightningNewBest', lang)
              : t('lightningBestLabel', lang, { count: Math.max(best, solves) })}
          </p>
        </div>
        <div className="space-y-3">
          <button
            onClick={restart}
            className="w-full py-3.5 px-4 bg-amber-500 text-white rounded-xl font-bold
                       hover:bg-amber-600 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <Zap className="w-4 h-4" /> {t('lightningAgain', lang)}
          </button>
          <button
            onClick={onExit}
            className="w-full py-2.5 px-3 glass rounded-xl font-semibold text-slate-500 text-sm
                       hover:shadow-md active:scale-95 transition-all flex items-center justify-center gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" /> {t('backToResults', lang)}
          </button>
        </div>
      </div>
    );
  }

  // --- play screen ---
  const hot = timeLeft <= 10;
  const quizAdapter = { options, selectedAnswer, answered, currentWord, handleAnswer };

  return (
    <div className="animate-fade-in space-y-4">
      {/* Countdown + solves */}
      <div className="flex items-center justify-between">
        <span
          dir="ltr"
          role="timer"
          aria-label={t('lightningTimerLabel', lang, { secs: timeLeft })}
          className={`text-4xl font-black tabular-nums ${hot ? 'text-rose-500 lightning-hot' : 'text-amber-500'}`}
          data-testid="lightning-timer"
        >
          ⚡{timeLeft}
        </span>
        <span dir="ltr" className="text-lg font-bold text-slate-600 dark:text-slate-300" data-testid="lightning-solves">
          ✓ {solves}
        </span>
      </div>

      {/* Prompt */}
      {mode === 'image' ? (
        <div className="relative aspect-square max-w-[220px] mx-auto rounded-2xl overflow-hidden bg-slate-100">
          <img
            src={getImageUrl(currentWord)}
            alt={t('mysteryWord', lang)}
            className="w-full h-full object-cover"
            width={512}
            height={512}
          />
        </div>
      ) : mode === 'word' ? (
        <div className="text-center py-3">
          <h2 className="text-4xl font-black text-slate-800 dark:text-slate-100">{currentWord.word}</h2>
        </div>
      ) : (
        <div className="text-center py-3">
          {ttsOk ? (
            <button
              onClick={() => speakWord(currentWord.word)}
              className="mx-auto w-20 h-20 rounded-full bg-gradient-to-br from-amber-400 to-amber-600
                         flex items-center justify-center shadow-lg active:scale-95 transition-transform"
              aria-label={t('hearAgain', lang)}
            >
              <Volume2 className="w-9 h-9 text-white" />
            </button>
          ) : (
            <h2 className="text-4xl font-black text-slate-800 dark:text-slate-100">{currentWord.word}</h2>
          )}
        </div>
      )}

      {/* Options */}
      {mode === 'image' ? (
        <div className="grid grid-cols-2 gap-3">
          {options.map((option) => {
            const isSelected = selectedAnswer === option.id;
            const isCorrect = option.id === currentWord.id;
            let btnClass = 'glass rounded-xl py-3 px-4 font-semibold text-center transition-all ';
            if (answered) {
              if (isCorrect) btnClass += 'bg-emerald-100 border-emerald-400 text-emerald-700';
              else if (isSelected) btnClass += 'bg-rose-100 border-rose-400 text-rose-700';
              else btnClass += 'opacity-50';
            } else {
              btnClass += 'hover:shadow-md active:scale-95 text-slate-700 dark:text-slate-200';
            }
            return (
              <button key={option.id} onClick={() => handleAnswer(option)} disabled={!!answered} className={btnClass}>
                {option.word}
              </button>
            );
          })}
        </div>
      ) : (
        <QuizOptionGrid
          quiz={quizAdapter}
          loadedImages={loadedImages}
          onImageLoad={(id) => setLoadedImages(prev => new Set(prev).add(id))}
          lang={lang}
        />
      )}

      <button
        onClick={onExit}
        className="w-full text-center text-sm text-slate-400 hover:text-slate-600 transition-colors py-1"
      >
        {t('backToResults', lang)}
      </button>
    </div>
  );
}
