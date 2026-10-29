import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Check, X as XIcon, ArrowLeft, Sun, Trophy, Volume2, Delete } from 'lucide-react';
import { getDistractors } from '../data/words';
import { fisherYatesShuffle } from '../utils/shuffle';
import { getImageUrl } from '../utils/images';
import { updateWordSR } from '../utils/spaced-repetition';
import { playSound, speakWord } from '../utils/sound';
import { haptic } from '../utils/haptic';
import { t, gloss } from '../utils/i18n';
import { sendLearn } from '../utils/learnBeacon';
import { probeFor, spellTiles } from '../utils/todayRun';

/**
 * "Today" run (roadmap M1): the day's ~12 words from pickTodayWords(), each
 * asked in the form its history calls for (utils/todayRun.js probeFor):
 * picture → word, hear → picture, or spell from tiles. Same SR update and
 * completion contract as DailyReview (onComplete({ score, total, answers,
 * wordProgress })). Beacons: quiz_start/quiz_done @ today, ans_ok/ans_no @ word,
 * and qs @ today_<start|done|quit> for the quiz-source funnel.
 */
export default function TodayRun({ words, stats, lang = 'en', canRead = true, onComplete, onBack }) {
  const run = useRef(words);
  const total = run.current.length;
  const [i, setI] = useState(0);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState(null); // null | 'correct' | 'wrong'
  const [picked, setPicked] = useState(null);
  const [results, setResults] = useState([]);
  const [phase, setPhase] = useState('quiz');
  const [wordProgress, setWordProgress] = useState(() => ({ ...stats.wordProgress }));
  const [typed, setTyped] = useState([]); // spell: tile ids in order
  const [tries, setTries] = useState(0);
  const begun = useRef(false);
  const timer = useRef(null);

  const word = run.current[i];
  // The probe is fixed per word from the history at the START of the run.
  const probes = useMemo(() => run.current.map((w) => probeFor(w, stats.wordProgress || {}, canRead)), [stats.wordProgress, canRead]);
  const probe = probes[i];
  const glossOf = useMemo(() => (lang === 'en' ? null : (x) => gloss(x, lang)), [lang]);
  const options = useMemo(() => (word && probe !== 'spell' ? fisherYatesShuffle([word, ...getDistractors(word, 3, null, glossOf)]) : []), [word, probe, glossOf]);
  const tiles = useMemo(() => (word && probe === 'spell' ? spellTiles(word.word) : []), [word, probe]);

  useEffect(() => {
    setAnswered(null); setPicked(null); setTyped([]); setTries(0);
    if (word && probe !== 'picture') speakWord(word.word);
  }, [i]); // eslint-disable-line react-hooks/exhaustive-deps -- once per question

  useEffect(() => () => clearTimeout(timer.current), []);

  const finish = useCallback((newResults, newScore, wp) => {
    setPhase('summary');
    sendLearn('quiz_done', 'today');
    sendLearn('qs', 'today_done');
    onComplete({ score: newScore, total, answers: newResults, wordProgress: wp });
  }, [onComplete, total]);

  const record = useCallback((correct, selected) => {
    if (!begun.current) { begun.current = true; sendLearn('quiz_start', 'today'); sendLearn('qs', 'today_start'); }
    sendLearn(correct ? 'ans_ok' : 'ans_no', word.id);
    const newResults = [...results, { wordId: word.id, correct, selected, probe }];
    const newScore = score + (correct ? 1 : 0);
    const wp = updateWordSR(wordProgress, word.id, correct);
    setResults(newResults); setScore(newScore); setWordProgress(wp);
    setAnswered(correct ? 'correct' : 'wrong');
    if (correct) { playSound('correct'); haptic('success'); speakWord(word.word); }
    else { playSound('wrong'); haptic('error'); setTimeout(() => speakWord(word.word), 600); }
    timer.current = setTimeout(() => {
      if (i + 1 >= total) finish(newResults, newScore, wp);
      else setI(i + 1);
    }, correct ? 1200 : 2200);
  }, [word, results, score, wordProgress, probe, i, total, finish]);

  const choose = (opt) => { if (answered) return; setPicked(opt.id); record(opt.id === word.id, opt.id); };

  const tapTile = (tile) => {
    if (answered || typed.includes(tile.id)) return;
    const next = [...typed, tile.id];
    setTyped(next);
    if (next.length !== word.word.length) return;
    const spelled = next.map((id) => tiles.find((x) => x.id === id).ch).join('');
    if (spelled === word.word.toLowerCase()) record(true, spelled);
    else if (tries === 0) { setTries(1); playSound('wrong'); setTimeout(() => setTyped([]), 500); }
    else record(false, spelled);
  };

  const quit = () => { if (begun.current && phase === 'quiz') sendLearn('qs', 'today_quit'); onBack(); };

  if (phase === 'summary') {
    const pct = total ? Math.round((score / total) * 100) : 0;
    return (
      <div className="animate-fade-in space-y-6 text-center">
        <div className="space-y-2">
          <div className="w-16 h-16 mx-auto rounded-full bg-linear-to-br from-amber-400 to-orange-500 flex items-center justify-center">
            <Trophy className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100">{t('todayDone', lang)}</h2>
          <p className="text-slate-500">{t('todayComeBack', lang)}</p>
        </div>
        <div className="glass rounded-2xl p-6 space-y-4">
          <div className="text-4xl font-black text-blue-600">{score}/{total}</div>
          <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
            <div className="h-full bg-linear-to-r from-emerald-400 to-emerald-600 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
          </div>
        </div>
        <div className="glass rounded-2xl p-4 space-y-2">
          {results.map((r, k) => (
            <div key={r.wordId} className="flex items-center gap-3 py-1.5">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${r.correct ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                {r.correct ? <Check className="w-3.5 h-3.5" /> : <XIcon className="w-3.5 h-3.5" />}
              </div>
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200" dir="ltr">{run.current[k]?.word}</span>
            </div>
          ))}
        </div>
        <button onClick={onBack} className="w-full py-3 rounded-xl bg-linear-to-r from-blue-500 to-blue-600 text-white font-semibold hover:shadow-lg active:scale-[0.98] transition-all">
          {t('backToMenuBtn', lang)}
        </button>
      </div>
    );
  }
  if (!word) return null;

  const prompt = { picture: t('todayPicture', lang), hear: t('todayHear', lang), spell: t('todaySpell', lang) }[probe];
  const sayBtn = (
    <button onClick={() => speakWord(word.word)} aria-label={t('hearAgain', lang)} data-testid="today-say"
      className="mx-auto flex items-center justify-center w-16 h-16 rounded-full bg-linear-to-br from-violet-500 to-indigo-500 text-white shadow-lg active:scale-95">
      <Volume2 className="w-8 h-8" />
    </button>
  );

  return (
    <div className="animate-fade-in space-y-4" data-testid="today-run" data-probe={probe}>
      <div className="flex items-center justify-between">
        <button onClick={quit} className="p-2.5 rounded-xl hover:bg-slate-100 transition-colors" aria-label={t('backToMenu', lang)}>
          <ArrowLeft className="w-5 h-5 text-slate-500" />
        </button>
        <div className="flex items-center gap-2">
          <Sun className="w-4 h-4 text-amber-500" />
          <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">{t('today', lang)}</span>
        </div>
        <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">{i + 1}/{total}</span>
      </div>
      <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden" role="progressbar" aria-valuenow={i} aria-valuemin={0} aria-valuemax={total} aria-label={t('quizProgress', lang)}>
        <div className="h-full bg-linear-to-r from-amber-400 to-orange-500 rounded-full transition-all duration-300" style={{ width: `${(i / total) * 100}%` }} />
      </div>
      <p className="text-center font-semibold text-slate-600 dark:text-slate-300">{prompt}</p>

      {probe === 'picture' && (
        <>
          <div className="relative aspect-square max-w-[240px] mx-auto rounded-2xl overflow-hidden bg-slate-100">
            <img src={getImageUrl(word)} alt={t('mysteryWord', lang)} className="w-full h-full object-cover" width={512} height={512} />
            {answered === 'correct' && <div className="absolute inset-0 rounded-2xl correct-glow border-4 border-emerald-400" />}
          </div>
          <div className="grid grid-cols-2 gap-3">
            {options.map((o) => (
              <button key={o.id} data-word={o.id} onClick={() => choose(o)} disabled={!!answered} dir="ltr"
                className={`glass rounded-xl py-3 px-4 font-semibold text-center transition-all ${answered ? (o.id === word.id ? 'bg-emerald-100 border-emerald-400 text-emerald-700' : picked === o.id ? 'bg-rose-100 border-rose-400 text-rose-700 animate-shake' : 'opacity-50') : 'hover:shadow-md active:scale-95 text-slate-700 dark:text-slate-200'}`}>
                {o.word}
              </button>
            ))}
          </div>
        </>
      )}

      {probe === 'hear' && (
        <>
          {sayBtn}
          <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto">
            {options.map((o) => (
              <button key={o.id} data-word={o.id} onClick={() => choose(o)} disabled={!!answered} aria-label={answered ? o.word : t('pickPicture', lang)}
                className={`relative aspect-square rounded-2xl overflow-hidden border-4 transition-all ${answered ? (o.id === word.id ? 'border-emerald-400' : picked === o.id ? 'border-rose-400 animate-shake' : 'border-transparent opacity-50') : 'border-transparent active:scale-95'}`}>
                <img src={getImageUrl(o)} alt="" className="w-full h-full object-cover" width={256} height={256} />
              </button>
            ))}
          </div>
          {answered && <p className="text-center text-xl font-black" dir="ltr">{word.word}</p>}
        </>
      )}

      {probe === 'spell' && (
        <>
          <div className="flex items-center justify-center gap-4">
            <img src={getImageUrl(word)} alt="" className="w-24 h-24 rounded-2xl object-cover" width={256} height={256} />
            {sayBtn}
          </div>
          <div className="flex justify-center gap-1.5" dir="ltr" data-testid="today-slots">
            {word.word.split('').map((ch, k) => {
              const tile = typed[k] != null ? tiles.find((x) => x.id === typed[k]) : null;
              return (
                <div key={k} className={`w-10 h-12 rounded-lg border-2 flex items-center justify-center text-2xl font-black ${answered === 'correct' ? 'border-emerald-400 bg-emerald-50' : answered === 'wrong' ? 'border-rose-300 bg-rose-50' : 'border-slate-300 bg-white dark:bg-slate-800'}`}>
                  {answered === 'wrong' ? ch.toLowerCase() : tile?.ch || ''}
                </div>
              );
            })}
          </div>
          {tries === 1 && !answered && <p className="text-center text-sm text-amber-600">{t('todayTryAgain', lang)}</p>}
          <div className="flex flex-wrap justify-center gap-2 max-w-xs mx-auto" dir="ltr">
            {tiles.map((tile) => (
              <button key={tile.id} data-tile={tile.ch} onClick={() => tapTile(tile)} disabled={!!answered || typed.includes(tile.id)}
                className={`w-11 h-11 rounded-xl text-xl font-black shadow transition-all ${typed.includes(tile.id) ? 'opacity-20' : 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 active:scale-90'}`}>
                {tile.ch}
              </button>
            ))}
          </div>
          {!answered && typed.length > 0 && (
            <button onClick={() => setTyped(typed.slice(0, -1))} className="mx-auto flex items-center gap-1 text-sm text-slate-500" aria-label={t('todayUndo', lang)}>
              <Delete className="w-4 h-4" /> {t('todayUndo', lang)}
            </button>
          )}
        </>
      )}
    </div>
  );
}
