import { useState, useMemo, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { getDistractors } from '../data/words';
import { t, gloss, isRTL } from '../utils/i18n';
import { speakWord, playSound } from '../utils/sound';
import { sendLearn, sendLearnBatch } from '../utils/learnBeacon';

// Word-of-the-day CHECK (owner, 2026-10-10): a passive word card tells us
// nothing about the word. Three 1-question probes, one per asset, so the
// answer data says WHICH part is off:
//   aud  hear it → tap the picture      (audio + image)
//   img  see the picture → tap the word (image + spelling)   [readers only]
//   txt  see/hear the word → tap the meaning (the word itself / gloss)
// Each answer fires ans_ok/no @word (existing stats) AND ansm_ok/no @word@step
// (per-asset split). Then one explicit feedback tap (wfb @word@img|aud|hard|ok)
// — a parent saying "the picture is unclear" beats inferring it.
const STEPS_READER = ['aud', 'img', 'txt'];
const STEPS_PREREADER = ['aud'];

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

export default function WordCheck({ word, lang = 'en', canRead = true, onDone }) {
  const steps = canRead ? STEPS_READER : STEPS_PREREADER;
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState(null);
  const [results, setResults] = useState([]);
  const [fb, setFb] = useState(null);
  const rtl = isRTL(lang);
  const options = useMemo(() => steps.map(() => shuffle([word, ...getDistractors(word, 3)])), [word, steps]);
  const done = i >= steps.length;
  const step = steps[i];

  useEffect(() => {
    if (done || step === 'img') return undefined;
    const tm = setTimeout(() => speakWord(word.word), 350);
    return () => clearTimeout(tm);
  }, [i, done, step, word.word]);

  const meaning = (w) => gloss(w, lang === 'en' ? 'he' : lang) || w.definition;
  const answer = (opt) => {
    if (picked || done) return;
    const ok = opt.id === word.id;
    setPicked(opt.id);
    playSound(ok ? 'correct' : 'wrong');
    setResults((r) => [...r, { step, ok }]);
    sendLearnBatch([
      { e: ok ? 'ans_ok' : 'ans_no', i: String(word.id) },
      { e: ok ? 'ansm_ok' : 'ansm_no', i: `${word.id}@${step}` },
    ]);
    setTimeout(() => { setPicked(null); setI((n) => n + 1); }, ok ? 700 : 1300);
  };
  const feedback = (kind) => { if (fb) return; setFb(kind); sendLearn('wfb', `${word.id}@${kind}`); };

  const score = results.filter((r) => r.ok).length;
  const optClass = (opt) => {
    const base = 'glass rounded-2xl p-3 text-start transition-all active:scale-[0.97] border-2 ';
    if (!picked) return base + 'border-transparent hover:border-blue-300';
    if (opt.id === word.id) return base + 'border-emerald-500 ring-2 ring-emerald-300';
    if (opt.id === picked) return base + 'border-red-400 opacity-70';
    return base + 'border-transparent opacity-50';
  };

  return (
    <div className="space-y-5" dir={rtl ? 'rtl' : 'ltr'} data-testid="word-check">
      <div className="flex items-center gap-3">
        <button onClick={onDone} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700" aria-label={t('wcBack', lang)}>
          <ArrowLeft className={`w-5 h-5 ${rtl ? 'rotate-180' : ''}`} />
        </button>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">⭐ {t('spotlightWord', lang)}</p>
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">{t('wcTitle', lang)}</h2>
        </div>
        {!done && <span className="ms-auto text-sm text-slate-400">{i + 1}/{steps.length}</span>}
      </div>

      {!done && (
        <section className="space-y-4">
          {step === 'aud' && (
            <button onClick={() => speakWord(word.word)} className="mx-auto flex items-center gap-2 px-5 py-3 rounded-full bg-violet-600 text-white font-bold shadow">
              <span aria-hidden="true">🔊</span> <span>{t('wcStepAud', lang)}</span>
            </button>
          )}
          {step === 'img' && (
            <div className="text-center space-y-2">
              <img src={word.imageUrl} alt="" width="160" height="160" className="w-40 h-40 mx-auto rounded-2xl object-cover bg-slate-100" />
              <p className="font-semibold text-slate-700 dark:text-slate-200">{t('wcStepImg', lang)}</p>
            </div>
          )}
          {step === 'txt' && (
            <div className="text-center space-y-2">
              <button onClick={() => speakWord(word.word)} className="text-3xl font-black text-slate-800 dark:text-slate-100">{word.word} 🔊</button>
              <p className="font-semibold text-slate-700 dark:text-slate-200">{t('wcStepTxt', lang)}</p>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            {options[i].map((opt) => (
              <button key={opt.id} onClick={() => answer(opt)} className={optClass(opt)} data-opt={opt.id} disabled={!!picked}>
                {step === 'aud'
                  ? <img src={opt.imageUrl} alt="" width="120" height="120" loading="lazy" className="w-full aspect-square rounded-xl object-cover bg-slate-100" />
                  : <span className={`block font-bold text-slate-800 dark:text-slate-100 ${step === 'img' ? 'text-xl text-center' : 'text-base'}`}>{step === 'img' ? opt.word : meaning(opt)}</span>}
              </button>
            ))}
          </div>
        </section>
      )}

      {done && (
        <section className="space-y-4 text-center">
          <div className="glass rounded-2xl p-5 space-y-2">
            <img src={word.imageUrl} alt="" width="96" height="96" className="w-24 h-24 mx-auto rounded-2xl object-cover" />
            <p className="text-2xl font-black text-slate-800 dark:text-slate-100">{word.word}</p>
            <p className="text-slate-500 dark:text-slate-300">{meaning(word)}</p>
            <p className="font-semibold text-emerald-600">{t('wcScore', lang, { score, total: steps.length })}</p>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">{fb ? t('wcThanks', lang) : t('wcAsk', lang)}</p>
            {!fb && (
              <div className="grid grid-cols-2 gap-2">
                {[['img', 'wcFbImg', '🖼️'], ['aud', 'wcFbAud', '🔊'], ['hard', 'wcFbHard', '😕'], ['ok', 'wcFbOk', '👍']].map(([k, key, emoji]) => (
                  <button key={k} onClick={() => feedback(k)} data-fb={k}
                          className="glass rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:shadow active:scale-[0.97]">
                    <span aria-hidden="true">{emoji}</span> {t(key, lang)}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button onClick={onDone} className="w-full py-3 rounded-xl bg-blue-600 text-white font-semibold">{t('wcBack', lang)}</button>
        </section>
      )}
    </div>
  );
}
