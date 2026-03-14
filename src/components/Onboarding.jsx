import { useState, useEffect } from 'react';
import { BookOpen, Image, ArrowRight, ArrowLeft, X, CheckCircle2 } from 'lucide-react';
import { t } from '../utils/i18n';
import { trackEvent } from '../utils/analytics';
import { getWordByName } from '../data/words';

const getDemoQuestion = (_lang) => ({
  image: getWordByName('cat')?.imageUrl || '/images/cat.webp',
  correctKey: 'demoCat',
  optionKeys: ['demoDog', 'demoCat', 'demoFish', 'demoBird'],
});


export default function Onboarding({ onComplete, activePlayer, lang: initialLang }) {
  const [step, setStep] = useState(0);
  const lang = initialLang || 'en';
  const [demoAnswer, setDemoAnswer] = useState(null); // null | 'correct' | 'wrong'

  const handleFinish = () => {
    onComplete();
  };

  const demoQuestion = getDemoQuestion(lang);
  const demoImage = demoQuestion.image;
  useEffect(() => { const img = new window.Image(); img.src = demoImage; }, [demoImage]);

  const handleDemoAnswer = (optionKey) => {
    setDemoAnswer(optionKey === demoQuestion.correctKey ? 'correct' : 'wrong');
  };

  const renderStep = () => {
    // Step 0: Welcome
    if (step === 0) {
      return (
        <>
          <div className="w-20 h-20 mx-auto rounded-2xl flex items-center justify-center bg-blue-100">
            <BookOpen className="w-10 h-10 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
            {activePlayer
              ? t('welcomeWithName', lang, { name: activePlayer.name })
              : t('welcomeTitle', lang)}
          </h2>
          <p className="text-slate-500">{t('welcomeDesc', lang)}</p>
        </>
      );
    }

    // Step 1: See & Learn
    if (step === 1) {
      return (
        <>
          <div className="w-20 h-20 mx-auto rounded-2xl flex items-center justify-center bg-emerald-100">
            <Image className="w-10 h-10 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{t('seeAndLearn', lang)}</h2>
          <p className="text-slate-500">{t('seeAndLearnDesc', lang)}</p>
        </>
      );
    }

    // Step 2: Demo quiz
    if (step === 2) {
      return (
        <>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">{t('tryItOut', lang)}</h2>
          <p className="text-slate-500 text-sm">{t('whatWordMatches', lang)}</p>
          <img
            src={demoQuestion.image}
            alt={t('mysteryWord', lang)}
            className="w-32 h-32 mx-auto rounded-2xl object-cover shadow-md"
          />
          <div className="grid grid-cols-2 gap-2">
            {demoQuestion.optionKeys.map((optionKey) => {
              const isCorrect = optionKey === demoQuestion.correctKey;
              const answered = demoAnswer !== null;
              let btnClass = 'py-2.5 px-3 rounded-xl font-semibold text-sm transition-all ';
              if (!answered) {
                btnClass += 'bg-white border-2 border-slate-200 text-slate-700 dark:text-slate-200 hover:border-blue-400 active:scale-95';
              } else if (isCorrect) {
                btnClass += 'bg-emerald-100 border-2 border-emerald-500 text-emerald-700';
              } else {
                btnClass += 'bg-slate-50 border-2 border-slate-200 text-slate-400';
              }
              return (
                <button
                  key={optionKey}
                  onClick={() => !answered && handleDemoAnswer(optionKey)}
                  className={btnClass}
                  disabled={answered}
                >
                  {t(optionKey, lang)}
                </button>
              );
            })}
          </div>
          {demoAnswer === 'correct' && (
            <div className="flex items-center justify-center gap-2 text-emerald-600 animate-bounce-in">
              <CheckCircle2 className="w-5 h-5" />
              <span className="font-bold">{t('demoCorrect', lang)}</span>
            </div>
          )}
          {demoAnswer === 'wrong' && (
            <p className="text-amber-600 text-sm font-medium">
              {t('demoWrongPrefix', lang)} <strong>{t(demoQuestion.correctKey, lang)}</strong>{t('demoWrongSuffix', lang)}
            </p>
          )}
        </>
      );
    }

    // After demo, finish onboarding (canRead already set during player creation)
    return null;
  };

  const isSlideStep = step >= 0; // all steps have nav arrows

  return (
    <div className="animate-fade-in space-y-8 text-center">
      {/* Skip button */}
      <div className="flex">
        <button
          onClick={() => {
            onComplete();
          }}
          className="p-2 rounded-full hover:bg-slate-100 transition-colors ml-auto"
          aria-label={t('skipOnboarding', lang)}
        >
          <X className="w-5 h-5 text-slate-400" />
        </button>
      </div>

      {/* Step content */}
      <div className="glass rounded-3xl p-8 max-w-sm mx-auto space-y-6">
        {renderStep()}
      </div>

      {/* Navigation */}
      {isSlideStep && (
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => { if (step > 0) setStep(s => s - 1); setDemoAnswer(null); }}
            className="p-3 rounded-full bg-slate-100 hover:bg-slate-200 transition-colors"
            aria-label={t('previousStep', lang)}
          >
            {lang === 'he'
              ? <ArrowRight className="w-5 h-5 text-slate-600 dark:text-slate-300" />
              : <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-300" />}
          </button>

          {/* Dots */}
          <div className="flex gap-2">
            {Array.from({ length: 3 }, (_, i) => (
              <div
                key={i}
                className={`w-2.5 h-2.5 rounded-full transition-all ${
                  i === step ? 'bg-blue-600 w-6' : 'bg-slate-300'
                }`}
              />
            ))}
          </div>

          <button
            onClick={() => {
              const stepNames = ['welcome', 'see_learn', 'demo'];
              trackEvent('onboarding_step', { step, step_name: stepNames[step] || `step_${step}` });
              if (step === 2) {
                handleFinish();
              } else {
                setStep(s => s + 1);
              }
            }}
            className="p-3 rounded-full bg-blue-600 text-white hover:bg-blue-700 transition-colors"
            aria-label={t('nextStep', lang)}
          >
            {lang === 'he'
              ? <ArrowLeft className="w-5 h-5" />
              : <ArrowRight className="w-5 h-5" />}
          </button>
        </div>
      )}
    </div>
  );
}
