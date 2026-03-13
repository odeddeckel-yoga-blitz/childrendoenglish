import { useState, useEffect, useRef, useCallback } from 'react';
import { BookOpen, Layers, Play, BarChart2, ChevronDown, ArrowRight, ArrowLeft, Globe, Brain } from 'lucide-react';
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

// --- Hooks ---

function useScrollReveal() {
  const elements = useRef(new Set());

  const observe = useCallback((el) => {
    if (el) elements.current.add(el);
  }, []);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      elements.current.forEach((el) => {
        el.classList.add('opacity-100', 'translate-y-0');
        el.classList.remove('opacity-0', 'translate-y-4');
      });
      return;
    }
    if (typeof IntersectionObserver === 'undefined') {
      elements.current.forEach((el) => {
        el.classList.add('opacity-100', 'translate-y-0');
        el.classList.remove('opacity-0', 'translate-y-4');
      });
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('opacity-100', 'translate-y-0');
            entry.target.classList.remove('opacity-0', 'translate-y-4');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
    );

    elements.current.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return observe;
}

// --- Sub-components ---

function FAQItem({ index, lang }) {
  const [open, setOpen] = useState(false);
  const contentRef = useRef(null);

  return (
    <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3 text-left
                   hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
        aria-expanded={open}
        id={`faq-btn-${index}`}
        aria-controls={`faq-content-${index}`}
      >
        <span className="font-semibold text-slate-700 dark:text-slate-200 text-sm">
          {t(`faq${index + 1}Q`, lang)}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-slate-400 transition-transform duration-300 shrink-0
                      ${open ? 'rotate-180' : ''}`}
        />
      </button>
      <div
        ref={contentRef}
        className="transition-[max-height] duration-300 ease-in-out overflow-hidden"
        aria-hidden={!open}
        id={`faq-content-${index}`}
        role="region"
        aria-labelledby={`faq-btn-${index}`}
        style={{ maxHeight: open ? `${contentRef.current?.scrollHeight ?? 200}px` : '0px' }}
      >
        <div className="px-4 pb-3 text-sm text-slate-500 dark:text-slate-300">
          {t(`faq${index + 1}A`, lang)}
        </div>
      </div>
    </div>
  );
}

// --- Main Component ---

export default function LandingPage({ lang = 'en', activePlayer, onLanguageStart, onContinue, onPrivacy, onToggleLanguage }) {
  const rtl = isRTL(lang);
  const Arrow = rtl ? ArrowLeft : ArrowRight;
  const reveal = useScrollReveal();

  const scrollToLanguage = () => {
    document.getElementById('language-select')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="space-y-16 pb-8">
      {/* Top bar */}
      <div className="flex items-center justify-end">
        <button
          onClick={onToggleLanguage}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl
                     bg-white/60 hover:bg-white/90 dark:bg-slate-800/60 dark:hover:bg-slate-800/90
                     border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300
                     text-sm font-medium transition-colors"
          aria-label={lang === 'en' ? 'עברית' : 'English'}
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
            <span className="font-bold text-slate-800 dark:text-slate-100 truncate">
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
      <section className="animate-fade-in text-center space-y-6">
        <div className="text-7xl">
          <span role="img" aria-label="books">📚</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-800 dark:text-white leading-tight">
          {t('landingHeroTitle', lang)}
        </h1>
        <p className="text-slate-500 dark:text-slate-300 text-lg max-w-md mx-auto">
          {t('landingHeroDesc', lang)}
        </p>

        {/* Stat pills */}
        <div className="flex flex-wrap justify-center gap-3">
          {[
            { key: 'landingStatsWords', emoji: '📖' },
            { key: 'landingStatsCategories', emoji: '🏷️' },
            { key: 'landingStatsModes', emoji: '🎮' },
          ].map(({ key, emoji }) => (
            <span
              key={key}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full
                         bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300
                         text-sm font-medium"
            >
              {emoji} {t(key, lang)}
            </span>
          ))}
        </div>

        <button
          onClick={scrollToLanguage}
          className="inline-flex items-center gap-2 px-8 py-4 bg-blue-600 text-white rounded-2xl
                     font-bold text-lg hover:bg-blue-700 active:scale-95 transition-all
                     shadow-lg shadow-blue-200 dark:shadow-blue-900/30"
        >
          {t('getStarted', lang)}
          <Arrow className="w-5 h-5" />
        </button>
      </section>

      {/* Features */}
      <section
        ref={reveal}
        className="opacity-0 translate-y-4 transition-all duration-700 space-y-4"
      >
        <h2 className="text-xl font-bold text-slate-800 dark:text-white text-center">
          {t('landingFeaturesHeading', lang)}
        </h2>
        <div className="glass rounded-2xl p-5 divide-y divide-slate-100 dark:divide-slate-700/50">
          {FEATURES.map(({ key, icon: Icon, color }) => (
            <div key={key} className="flex items-start gap-4 py-4 first:pt-0 last:pb-0">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${COLOR_MAP[color]}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                  {t(`feature${key}Title`, lang)}
                </h3>
                <p className="text-slate-500 dark:text-slate-300 text-xs leading-relaxed mt-0.5">
                  {t(`feature${key}Desc`, lang)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section
        ref={reveal}
        className="opacity-0 translate-y-4 transition-all duration-700 space-y-4"
      >
        <h2 className="text-xl font-bold text-slate-800 dark:text-white text-center">
          {t('howItWorksTitle', lang)}
        </h2>
        <div className="relative">
          {/* Vertical connector line */}
          <div
            className="absolute top-4 bottom-4 w-0.5 bg-blue-200 dark:bg-blue-800"
            style={{ insetInlineStart: '1.25rem' }}
          />
          <div className="space-y-4 relative">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm shrink-0 relative z-10">
                  {i}
                </div>
                <div className="pt-1.5">
                  <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                    {t(`howStep${i}Title`, lang)}
                  </h3>
                  <p className="text-slate-500 dark:text-slate-300 text-xs mt-1">
                    {t(`howStep${i}Desc`, lang)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* App Preview */}
      <section
        ref={reveal}
        className="opacity-0 translate-y-4 transition-all duration-700 space-y-4"
      >
        <h2 className="text-xl font-bold text-slate-800 dark:text-white text-center">
          {t('appPreviewTitle', lang)}
        </h2>
        <div className="mx-auto w-60">
          <div className="rounded-[2rem] border-[3px] border-slate-800 dark:border-slate-600 overflow-hidden shadow-2xl">
            <div className="bg-blue-600 px-4 py-2 flex items-center justify-between">
              <span className="text-white text-xs font-bold">Question 3 of 10</span>
              <span className="text-white/70 text-xs">✓ 2/2</span>
            </div>
            <div className="p-4 space-y-3 bg-gradient-to-b from-blue-50 to-white dark:from-slate-800 dark:to-slate-900">
              <p className="text-center text-sm font-bold text-slate-700 dark:text-slate-200">What is this?</p>
              <img src="/images/cat.webp" alt="" className="w-24 h-24 mx-auto rounded-2xl object-cover shadow-md" loading="lazy" />
              <div className="grid grid-cols-2 gap-2">
                <div className="py-2 rounded-xl bg-white dark:bg-slate-700 border-2 border-slate-200 dark:border-slate-600 text-xs text-center text-slate-600 dark:text-slate-300 font-medium">Dog</div>
                <div className="py-2 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 border-2 border-emerald-500 text-xs text-center text-emerald-700 dark:text-emerald-300 font-bold">Cat ✓</div>
                <div className="py-2 rounded-xl bg-white dark:bg-slate-700 border-2 border-slate-200 dark:border-slate-600 text-xs text-center text-slate-600 dark:text-slate-300 font-medium">Fish</div>
                <div className="py-2 rounded-xl bg-white dark:bg-slate-700 border-2 border-slate-200 dark:border-slate-600 text-xs text-center text-slate-600 dark:text-slate-300 font-medium">Bird</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Signals */}
      <section
        ref={reveal}
        className="opacity-0 translate-y-4 transition-all duration-700 space-y-4"
      >
        <h2 className="text-xl font-bold text-slate-800 dark:text-white text-center">
          {t('trustTitle', lang)}
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {[
            { key: 'trustNoAds', emoji: '🔒' },
            { key: 'trustOffline', emoji: '📱' },
            { key: 'trustProfiles', emoji: '👨‍👩‍👧‍👦' },
            { key: 'trustHebrew', emoji: '🇮🇱' },
          ].map(({ key, emoji }) => (
            <div key={key} className="glass rounded-2xl p-4 text-center space-y-1">
              <span className="text-2xl block">{emoji}</span>
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                {t(key, lang)}
              </h3>
              <p className="text-slate-500 dark:text-slate-300 text-xs">
                {t(`${key}Desc`, lang)}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section
        ref={reveal}
        className="opacity-0 translate-y-4 transition-all duration-700 space-y-4"
      >
        <h2 className="text-xl font-bold text-slate-800 dark:text-white text-center">
          {t('testimonialsTitle', lang)}
        </h2>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="glass rounded-2xl p-4 border-l-[3px] border-blue-500 space-y-2">
              <p className="text-slate-600 dark:text-slate-300 text-sm italic leading-relaxed">
                &ldquo;{t(`testimonial${i}Quote`, lang)}&rdquo;
              </p>
              <p className="text-slate-800 dark:text-slate-100 text-xs font-semibold">
                {t(`testimonial${i}Author`, lang)}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Methodology */}
      <section
        ref={reveal}
        className="opacity-0 translate-y-4 transition-all duration-700 space-y-4"
      >
        <div className="glass rounded-2xl p-6 flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
            <Brain className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-slate-800 dark:text-slate-100 text-sm">
              {t('methodologyTitle', lang)}
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed mt-1">
              {t('methodologyDesc', lang)}
            </p>
          </div>
        </div>
      </section>

      {/* Choose Language + Get Started */}
      <section
        id="language-select"
        ref={reveal}
        className="opacity-0 translate-y-4 transition-all duration-700 space-y-4 text-center"
      >
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">
          {t('landingReadyTitle', lang)}
        </h2>
        <p className="text-slate-500 dark:text-slate-300">
          {t('landingReadyDesc', lang)}
        </p>
        <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto">
          <button
            onClick={() => onLanguageStart('en')}
            className="glass rounded-2xl p-6 space-y-3 text-center
                       hover:scale-[1.03] active:scale-95 transition-transform cursor-pointer
                       border-2 border-transparent hover:border-blue-300 dark:hover:border-blue-600"
          >
            <span className="text-4xl block">🇬🇧</span>
            <span className="font-bold text-slate-800 dark:text-slate-100 block">
              {t('landingLangEnglish', lang)}
            </span>
            <span className="text-slate-500 dark:text-slate-300 text-xs block">
              {t('landingLangEnDesc', lang)}
            </span>
          </button>
          <button
            onClick={() => onLanguageStart('he')}
            className="glass rounded-2xl p-6 space-y-3 text-center
                       hover:scale-[1.03] active:scale-95 transition-transform cursor-pointer
                       border-2 border-transparent hover:border-blue-300 dark:hover:border-blue-600"
          >
            <span className="text-4xl block">🇮🇱</span>
            <span className="font-bold text-slate-800 dark:text-slate-100 block">
              {t('landingLangHebrew', lang)}
            </span>
            <span className="text-slate-500 dark:text-slate-300 text-xs block">
              {t('landingLangHeDesc', lang)}
            </span>
          </button>
        </div>
      </section>

      {/* FAQ */}
      <section
        ref={reveal}
        className="opacity-0 translate-y-4 transition-all duration-700 space-y-4"
      >
        <h2 className="text-xl font-bold text-slate-800 dark:text-white text-center">
          {t('faqTitle', lang)}
        </h2>
        <div className="space-y-2">
          {Array.from({ length: 7 }, (_, i) => (
            <FAQItem key={i} index={i} lang={lang} />
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="text-center space-y-3 pt-4 border-t border-slate-200 dark:border-slate-700">
        <nav className="flex flex-wrap justify-center gap-x-4 gap-y-1">
          <a href="/vocabulary/" className="text-blue-500 text-xs hover:underline">Vocabulary</a>
          <a href="/guides/" className="text-blue-500 text-xs hover:underline">Guides</a>
          <a href="/printable-flashcards/" className="text-blue-500 text-xs hover:underline">Printable Flashcards</a>
          <a href="/about/" className="text-blue-500 text-xs hover:underline">About</a>
        </nav>
        <div className="flex justify-center gap-3">
          <button
            onClick={onPrivacy}
            className="text-slate-400 text-xs hover:text-slate-600 transition-colors"
          >
            {t('privacyPolicy', lang)}
          </button>
          <span className="text-slate-300">|</span>
          <a href="/terms" className="text-slate-400 text-xs hover:text-slate-600 transition-colors">
            {t('termsOfService', lang)}
          </a>
        </div>

      </footer>
    </div>
  );
}
