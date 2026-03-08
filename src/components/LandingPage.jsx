import { useState } from 'react';
import { BookOpen, Layers, Play, BarChart2, ChevronDown, ArrowRight, ArrowLeft, Globe } from 'lucide-react';
import { t, isRTL } from '../utils/i18n';

const FEATURES = [
  { key: 'Learn', icon: BookOpen, color: 'blue' },
  { key: 'Flashcards', icon: Layers, color: 'purple' },
  { key: 'Quiz', icon: Play, color: 'emerald' },
  { key: 'Progress', icon: BarChart2, color: 'amber' },
];

const COLOR_MAP = {
  blue: 'bg-blue-100 text-blue-600',
  purple: 'bg-purple-100 text-purple-600',
  emerald: 'bg-emerald-100 text-emerald-600',
  amber: 'bg-amber-100 text-amber-600',
};

const FAQ_COUNT = 5;

function FAQItem({ index, lang }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-slate-50 transition-colors"
        aria-expanded={open}
      >
        <span className="font-semibold text-slate-700 text-sm">{t(`faq${index + 1}Q`, lang)}</span>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform shrink-0 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="px-4 pb-3 text-sm text-slate-500">
          {t(`faq${index + 1}A`, lang)}
        </div>
      )}
    </div>
  );
}

export default function LandingPage({ lang = 'en', activePlayer, onGetStarted, onContinue, onPrivacy, onToggleLanguage }) {
  const rtl = isRTL(lang);
  const Arrow = rtl ? ArrowLeft : ArrowRight;

  return (
    <div className="animate-fade-in space-y-10 pb-8">
      {/* Language toggle */}
      <div className="flex justify-end">
        <button
          onClick={onToggleLanguage}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/60 hover:bg-white/90
                     border border-slate-200 text-slate-600 text-sm font-medium transition-colors"
          aria-label={t('language', lang)}
        >
          <Globe className="w-4 h-4" />
          {lang === 'en' ? 'עברית' : 'English'}
        </button>
      </div>

      {/* Returning user bar */}
      {activePlayer && (
        <div className="glass rounded-2xl p-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-3xl shrink-0">{activePlayer.avatar}</span>
            <span className="font-bold text-slate-800 truncate">
              {t('welcomeBack', lang, { name: activePlayer.name })}
            </span>
          </div>
          <button
            onClick={onContinue}
            className="shrink-0 px-5 py-2.5 bg-blue-600 text-white rounded-xl font-semibold
                       hover:bg-blue-700 active:scale-95 transition-all text-sm"
          >
            {t('continueBtn', lang)}
          </button>
        </div>
      )}

      {/* Hero */}
      <section className="text-center space-y-5">
        <div className="text-6xl">
          <span role="img" aria-label="books">📚</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-800 leading-tight">
          {t('landingHeroTitle', lang)}
        </h1>
        <p className="text-slate-500 text-lg max-w-md mx-auto">
          {t('landingHeroDesc', lang)}
        </p>
        <button
          onClick={onGetStarted}
          className="inline-flex items-center gap-2 px-8 py-4 bg-blue-600 text-white rounded-2xl
                     font-bold text-lg hover:bg-blue-700 active:scale-95 transition-all shadow-lg shadow-blue-200"
        >
          {t('getStarted', lang)}
          <Arrow className="w-5 h-5" />
        </button>
      </section>

      {/* Features */}
      <section className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          {FEATURES.map(({ key, icon: Icon, color }) => (
            <div key={key} className="glass rounded-2xl p-4 space-y-2">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${COLOR_MAP[color]}`}>
                <Icon className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-800 text-sm">
                {t(`feature${key}Title`, lang)}
              </h3>
              <p className="text-slate-500 text-xs leading-relaxed">
                {t(`feature${key}Desc`, lang)}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-slate-800 text-center">
          {t('howItWorksTitle', lang)}
        </h2>
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="glass rounded-2xl p-4 flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
                {i}
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-sm">
                  {t(`howStep${i}Title`, lang)}
                </h3>
                <p className="text-slate-500 text-xs mt-1">
                  {t(`howStep${i}Desc`, lang)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-slate-800 text-center">
          {t('faqTitle', lang)}
        </h2>
        <div className="space-y-2">
          {Array.from({ length: FAQ_COUNT }, (_, i) => (
            <FAQItem key={i} index={i} lang={lang} />
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-slate-800 text-center">
          {t('testimonialsLabel', lang)}
        </h2>
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="glass rounded-2xl p-4 space-y-2">
              <p className="text-slate-600 text-sm italic">
                &ldquo;{t(`testimonial${i}Quote`, lang)}&rdquo;
              </p>
              <p className="text-slate-400 text-xs font-semibold">
                — {t(`testimonial${i}Author`, lang)}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="text-center">
        <button
          onClick={onGetStarted}
          className="inline-flex items-center gap-2 px-8 py-4 bg-blue-600 text-white rounded-2xl
                     font-bold text-lg hover:bg-blue-700 active:scale-95 transition-all shadow-lg shadow-blue-200"
        >
          {t('getStarted', lang)}
          <Arrow className="w-5 h-5" />
        </button>
      </section>

      {/* Footer */}
      <footer className="text-center space-y-2 pt-4 border-t border-slate-200">
        <button
          onClick={onPrivacy}
          className="text-blue-500 text-xs hover:underline"
        >
          {t('privacyPolicy', lang)}
        </button>
      </footer>
    </div>
  );
}
