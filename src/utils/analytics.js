const GA_ID = import.meta.env.VITE_GA_ID || 'G-YF34G1SGNE';

let gaLoaded = false;
let gtagScriptLoaded = false;

export function hasAnalyticsConsent() {
  return localStorage.getItem('childrendoenglish-analytics-consent') === 'accepted';
}

export function setAnalyticsConsent(accepted) {
  localStorage.setItem('childrendoenglish-analytics-consent', accepted ? 'accepted' : 'declined');
  if (accepted) loadGA();
}

export function needsConsentPrompt() {
  return !localStorage.getItem('childrendoenglish-analytics-consent');
}

// Load the gtag.js script dynamically (deferred from <head> to reduce LCP)
function ensureGtagScript() {
  if (gtagScriptLoaded) return;
  gtagScriptLoaded = true;
  window.dataLayer = window.dataLayer || [];
  window.gtag = function() { window.dataLayer.push(arguments); };
  window.gtag('consent', 'default', { analytics_storage: 'denied' });
  window.gtag('js', new Date());
  window.gtag('config', GA_ID);
  const script = document.createElement('script');
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
  script.async = true;
  document.head.appendChild(script);
}

function loadGA() {
  if (gaLoaded) return;
  ensureGtagScript();
  gaLoaded = true;
  window.gtag('consent', 'update', { analytics_storage: 'granted' });
}

// Initialize: defer gtag loading until idle, grant consent if previously accepted
export function initAnalytics() {
  const load = () => {
    ensureGtagScript();
    if (hasAnalyticsConsent()) loadGA();
  };
  if (typeof requestIdleCallback === 'function') {
    requestIdleCallback(load);
  } else {
    setTimeout(load, 2000);
  }
}

// Track custom events
export function trackEvent(eventName, params = {}) {
  if (!gaLoaded || typeof window.gtag !== 'function') return;
  window.gtag('event', eventName, params);
}

// Track screen views (SPA navigation)
export function trackScreenView(screenName) {
  trackEvent('screen_view', { screen_name: screenName });
}

// Pre-defined events
export const analytics = {
  screenView: (screen) => trackScreenView(screen),
  quizStart: (mode, level) => trackEvent('quiz_start', { mode, level }),
  quizComplete: (mode, level, score, total) => trackEvent('quiz_complete', { mode, level, score, total, percentage: Math.round((score / total) * 100) }),
  quizQuit: (mode, level, questionIndex) => trackEvent('quiz_quit', { mode, level, question_index: questionIndex }),
  quizAnswer: (wordId, correct, mode) => trackEvent('quiz_answer', { word_id: wordId, correct, mode }),
  onboardingComplete: () => trackEvent('onboarding_complete'),
  playerCreate: () => trackEvent('player_create'),
  featureUse: (feature) => trackEvent('feature_use', { feature }),
  pwaInstall: (outcome) => trackEvent('pwa_install', { outcome }),
  onboardingStep: (step, stepName) => trackEvent('onboarding_step', { step, step_name: stepName }),
  quizFunnelLevel: (level) => trackEvent('quiz_funnel_level', { level }),
  quizFunnelMode: (mode) => trackEvent('quiz_funnel_mode', { mode }),
};
