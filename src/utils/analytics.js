const GA_ID = import.meta.env.VITE_GA_ID || 'G-YF34G1SGNE';

let gaLoaded = false;

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

function loadGA() {
  if (gaLoaded || typeof window.gtag !== 'function') return;
  gaLoaded = true;
  // gtag.js is already loaded in index.html <head> with consent denied by default.
  // Grant analytics consent so GA starts collecting data.
  window.gtag('consent', 'update', { analytics_storage: 'granted' });
}

// Initialize: load GA if consent was previously given
export function initAnalytics() {
  if (hasAnalyticsConsent()) loadGA();
}

// Track custom events
export function trackEvent(eventName, params = {}) {
  if (!hasAnalyticsConsent() || typeof window.gtag !== 'function') return;
  window.gtag('event', eventName, params);
}

// Pre-defined events
export const analytics = {
  quizStart: (mode, level) => trackEvent('quiz_start', { mode, level }),
  quizComplete: (mode, level, score, total) => trackEvent('quiz_complete', { mode, level, score, total, percentage: Math.round((score / total) * 100) }),
  quizQuit: (mode, level, questionIndex) => trackEvent('quiz_quit', { mode, level, question_index: questionIndex }),
  onboardingComplete: () => trackEvent('onboarding_complete'),
  playerCreate: () => trackEvent('player_create'),
  featureUse: (feature) => trackEvent('feature_use', { feature }),
  pwaInstall: (outcome) => trackEvent('pwa_install', { outcome }),
  onboardingStep: (step, stepName) => trackEvent('onboarding_step', { step, step_name: stepName }),
  quizFunnelLevel: (level) => trackEvent('quiz_funnel_level', { level }),
  quizFunnelMode: (mode) => trackEvent('quiz_funnel_mode', { mode }),
  assessmentComplete: (level) => trackEvent('assessment_complete', { level }),
};
