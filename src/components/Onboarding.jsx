import { useState } from 'react';
import { BookOpen, Image, ArrowRight, ArrowLeft, X, CheckCircle2 } from 'lucide-react';

const TOTAL_STEPS = 4; // 2 intro slides + 1 demo + 1 language picker

const DEMO_QUESTION = {
  image: '/images/cat.webp',
  correct: 'Cat',
  options: ['Dog', 'Cat', 'Fish'],
};

export default function Onboarding({ onComplete, onSelectLanguage }) {
  const [step, setStep] = useState(0);
  const [demoAnswer, setDemoAnswer] = useState(null); // null | 'correct' | 'wrong'

  const handleFinish = (language) => {
    onSelectLanguage?.(language);
    onComplete();
  };

  const handleDemoAnswer = (option) => {
    setDemoAnswer(option === DEMO_QUESTION.correct ? 'correct' : 'wrong');
  };

  const renderStep = () => {
    if (step === 0) {
      return (
        <>
          <div className="w-20 h-20 mx-auto rounded-2xl flex items-center justify-center bg-blue-100">
            <BookOpen className="w-10 h-10 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800">Welcome!</h2>
          <p className="text-slate-500">Learn new English words through fun quizzes and flashcards.</p>
        </>
      );
    }

    if (step === 1) {
      return (
        <>
          <div className="w-20 h-20 mx-auto rounded-2xl flex items-center justify-center bg-emerald-100">
            <Image className="w-10 h-10 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800">See & Learn</h2>
          <p className="text-slate-500">Match words with pictures, hear how they sound, and track your progress.</p>
        </>
      );
    }

    if (step === 2) {
      return (
        <>
          <h2 className="text-xl font-bold text-slate-800">Try it out!</h2>
          <p className="text-slate-500 text-sm">What word matches this picture?</p>
          <img
            src={DEMO_QUESTION.image}
            alt="Mystery word"
            className="w-32 h-32 mx-auto rounded-2xl object-cover shadow-md"
          />
          <div className="grid grid-cols-3 gap-2">
            {DEMO_QUESTION.options.map((option) => {
              const isCorrect = option === DEMO_QUESTION.correct;
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
                  key={option}
                  onClick={() => !answered && handleDemoAnswer(option)}
                  className={btnClass}
                  disabled={answered}
                >
                  {option}
                </button>
              );
            })}
          </div>
          {demoAnswer === 'correct' && (
            <div className="flex items-center justify-center gap-2 text-emerald-600 animate-bounce-in">
              <CheckCircle2 className="w-5 h-5" />
              <span className="font-bold">Great job!</span>
            </div>
          )}
          {demoAnswer === 'wrong' && (
            <p className="text-amber-600 text-sm font-medium">
              Not quite — it's <strong>{DEMO_QUESTION.correct}</strong>! You'll get the hang of it.
            </p>
          )}
        </>
      );
    }

    // step === 3: language picker
    return (
      <>
        <div className="w-20 h-20 mx-auto rounded-2xl flex items-center justify-center bg-blue-100">
          <span className="text-4xl">🌍</span>
        </div>
        <h2 className="text-2xl font-bold text-slate-800">What language do you speak?</h2>
        <div className="space-y-3">
          <button
            onClick={() => handleFinish('en')}
            className="w-full py-3 px-6 bg-blue-600 text-white rounded-xl font-semibold
                       hover:bg-blue-700 active:scale-95 transition-all text-lg"
          >
            English
          </button>
          <button
            onClick={() => handleFinish('he')}
            className="w-full py-3 px-6 bg-white border-2 border-blue-200 text-blue-700
                       rounded-xl font-semibold hover:bg-blue-50 active:scale-95
                       transition-all text-lg"
          >
            עברית (Hebrew)
          </button>
          <p className="text-xs text-slate-400">Hebrew translations are shown in flashcards and word details.</p>
        </div>
      </>
    );
  };

  const isSlideStep = step < TOTAL_STEPS - 1; // steps 0-2 have nav arrows

  return (
    <div className="animate-fade-in space-y-8 text-center">
      {/* Skip button */}
      <div className="flex justify-end">
        <button
          onClick={() => handleFinish('en')}
          className="p-2 rounded-full hover:bg-slate-100 transition-colors"
          aria-label="Skip onboarding"
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
          {step > 0 && (
            <button
              onClick={() => { setStep(s => s - 1); setDemoAnswer(null); }}
              className="p-3 rounded-full bg-slate-100 hover:bg-slate-200 transition-colors"
              aria-label="Previous step"
            >
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </button>
          )}

          {/* Dots */}
          <div className="flex gap-2">
            {Array.from({ length: TOTAL_STEPS - 1 }, (_, i) => (
              <div
                key={i}
                className={`w-2.5 h-2.5 rounded-full transition-all ${
                  i === step ? 'bg-blue-600 w-6' : 'bg-slate-300'
                }`}
              />
            ))}
          </div>

          <button
            onClick={() => setStep(s => s + 1)}
            className="p-3 rounded-full bg-blue-600 text-white hover:bg-blue-700 transition-colors"
            aria-label="Next step"
          >
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
}
