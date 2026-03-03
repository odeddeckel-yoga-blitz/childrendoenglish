import { useState } from 'react';
import { BookOpen, Image, ArrowRight, ArrowLeft, X, CheckCircle2 } from 'lucide-react';
import { t } from '../utils/i18n';
import { trackEvent } from '../utils/analytics';

const TOTAL_STEPS = 4; // language picker + 2 intro slides + 1 demo

const getDemoQuestion = (lang) => ({
  image: '/images/cat.webp',
  correctKey: 'demoCat',
  optionKeys: ['demoDog', 'demoCat', 'demoFish'],
});

const detectLang = () => {
  try { return navigator.language?.startsWith('he') ? 'he' : 'en'; } catch { return 'en'; }
};

export default function Onboarding({ onComplete, onSelectLanguage, activePlayer, lang: initialLang }) {
  const [step, setStep] = useState(0);
  const [lang, setLang] = useState(initialLang || detectLang());
  const [demoAnswer, setDemoAnswer] = useState(null); // null | 'correct' | 'wrong'

  const handleFinish = () => {
    onSelectLanguage?.(lang);
    onComplete();
  };

  const handleLanguagePick = (language) => {
    setLang(language);
    trackEvent('onboarding_step', { step: 0, step_name: 'language', language });
    setStep(1);
  };

  const demoQuestion = getDemoQuestion(lang);

  const handleDemoAnswer = (optionKey) => {
    setDemoAnswer(optionKey === demoQuestion.correctKey ? 'correct' : 'wrong');
  };

  const renderStep = () => {
    // Step 0: Language picker (first)
    if (step === 0) {
      return (
        <>
          <div className="w-20 h-20 mx-auto rounded-2xl flex items-center justify-center bg-blue-100">
            <span className="text-4xl">🌍</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-800">{t('chooseLanguage', lang)}</h2>
          <div className="space-y-3">
            <button
              onClick={() => handleLanguagePick('en')}
              className="w-full py-3 px-6 bg-blue-600 text-white rounded-xl font-semibold
                         hover:bg-blue-700 active:scale-95 transition-all text-lg"
            >
              English
            </button>
            <button
              onClick={() => handleLanguagePick('he')}
              className="w-full py-3 px-6 bg-white border-2 border-blue-200 text-blue-700
                         rounded-xl font-semibold hover:bg-blue-50 active:scale-95
                         transition-all text-lg"
            >
              עברית (Hebrew)
            </button>
          </div>
        </>
      );
    }

    // Step 1: Welcome
    if (step === 1) {
      return (
        <>
          <div className="w-20 h-20 mx-auto rounded-2xl flex items-center justify-center bg-blue-100">
            <BookOpen className="w-10 h-10 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800">
            {activePlayer
              ? t('welcomeWithName', lang, { name: activePlayer.name })
              : t('welcomeTitle', lang)}
          </h2>
          <p className="text-slate-500">{t('welcomeDesc', lang)}</p>
        </>
      );
    }

    // Step 2: See & Learn
    if (step === 2) {
      return (
        <>
          <div className="w-20 h-20 mx-auto rounded-2xl flex items-center justify-center bg-emerald-100">
            <Image className="w-10 h-10 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800">{t('seeAndLearn', lang)}</h2>
          <p className="text-slate-500">{t('seeAndLearnDesc', lang)}</p>
        </>
      );
    }

    // Step 3: Demo quiz
    if (step === 3) {
      return (
        <>
          <h2 className="text-xl font-bold text-slate-800">{t('tryItOut', lang)}</h2>
          <p className="text-slate-500 text-sm">{t('whatWordMatches', lang)}</p>
          <img
            src={demoQuestion.image}
            alt={t('mysteryWord', lang)}
            className="w-32 h-32 mx-auto rounded-2xl object-cover shadow-md"
          />
          <div className="grid grid-cols-3 gap-2">
            {demoQuestion.optionKeys.map((optionKey) => {
              const isCorrect = optionKey === demoQuestion.correctKey;
              const answered = demoAnswer !== null;
              let btnClass = 'py-2.5 px-3 rounded-xl font-semibold text-sm transition-all ';
              if (!answered) {
                btnClass += 'bg-white border-2 border-slate-200 text-slate-700 hover:border-blue-400 active:scale-95';
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

  const isSlideStep = step >= 1 && step <= 3; // steps 1-3 have nav arrows

  return (
    <div className="animate-fade-in space-y-8 text-center">
      {/* Skip button */}
      <div className="flex justify-end">
        <button
          onClick={() => {
            onSelectLanguage?.('en');
            onComplete();
          }}
          className="p-2 rounded-full hover:bg-slate-100 transition-colors"
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
            onClick={() => { setStep(s => s - 1); setDemoAnswer(null); }}
            className="p-3 rounded-full bg-slate-100 hover:bg-slate-200 transition-colors"
            aria-label={t('previousStep', lang)}
          >
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>

          {/* Dots */}
          <div className="flex gap-2">
            {Array.from({ length: 3 }, (_, i) => (
              <div
                key={i}
                className={`w-2.5 h-2.5 rounded-full transition-all ${
                  i === step - 1 ? 'bg-blue-600 w-6' : 'bg-slate-300'
                }`}
              />
            ))}
          </div>

          <button
            onClick={() => {
              const stepNames = ['language', 'welcome', 'see_learn', 'demo'];
              trackEvent('onboarding_step', { step, step_name: stepNames[step] || `step_${step}` });
              if (step === 3) {
                handleFinish();
              } else {
                setStep(s => s + 1);
              }
            }}
            className="p-3 rounded-full bg-blue-600 text-white hover:bg-blue-700 transition-colors"
            aria-label={t('nextStep', lang)}
          >
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
}
