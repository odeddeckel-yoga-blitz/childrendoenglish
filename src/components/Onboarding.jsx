import { useState } from 'react';
import { BookOpen, Image, Volume2, ArrowRight, ArrowLeft, X } from 'lucide-react';

const steps = [
  {
    icon: BookOpen,
    title: 'Welcome!',
    description: 'Learn new English words through fun quizzes and flashcards.',
    color: 'blue',
  },
  {
    icon: Image,
    title: 'See & Learn',
    description: 'Match words with pictures, hear how they sound, and track your progress.',
    color: 'emerald',
  },
  {
    icon: Volume2,
    title: 'Listen & Practice',
    description: 'Practice a little every day to remember more words!',
    color: 'amber',
  },
];

export default function Onboarding({ onComplete, onSelectLanguage }) {
  const [step, setStep] = useState(0);

  const handleFinish = (language) => {
    onSelectLanguage?.(language);
    onComplete();
  };

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
        {step < steps.length ? (
          <>
            <div className={`w-20 h-20 mx-auto rounded-2xl flex items-center justify-center
                            bg-${steps[step].color}-100`}>
              {(() => {
                const Icon = steps[step].icon;
                return <Icon className={`w-10 h-10 text-${steps[step].color}-600`} />;
              })()}
            </div>
            <h2 className="text-2xl font-bold text-slate-800">{steps[step].title}</h2>
            <p className="text-slate-500">{steps[step].description}</p>
          </>
        ) : (
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
        )}
      </div>

      {/* Navigation */}
      {step < steps.length && (
        <div className="flex items-center justify-center gap-4">
          {step > 0 && (
            <button
              onClick={() => setStep(s => s - 1)}
              className="p-3 rounded-full bg-slate-100 hover:bg-slate-200 transition-colors"
              aria-label="Previous step"
            >
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </button>
          )}

          {/* Dots */}
          <div className="flex gap-2">
            {steps.map((_, i) => (
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
