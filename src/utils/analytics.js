const GA_ID = import.meta.env.VITE_GA_ID;

let gaLoaded = false;
let gtagScriptLoaded = false;

// localStorage can THROW (Safari private mode, storage-blocked iframes, quota).
// These run at consent-check time on every load — a throw here white-screens
// the app, so every access is guarded (audit #2 finding, fixed Sep 2026).
function readConsent() {
  try { return localStorage.getItem('childrendoenglish-analytics-consent'); } catch { return null; }
}

export function hasAnalyticsConsent() {
  return readConsent() === 'accepted';
}

export function setAnalyticsConsent(accepted) {
  try { localStorage.setItem('childrendoenglish-analytics-consent', accepted ? 'accepted' : 'declined'); } catch { /* unavailable */ }
  if (accepted) loadGA();
}

export function needsConsentPrompt() {
  return !readConsent();
}

// Owner devices (flagged once via ?internal=1, see land-beacon.js) report all
// events as traffic_type=internal so GA4's Internal Traffic filter drops them.
function isInternalDevice() {
  try { return localStorage.getItem('cde_internal') === '1'; } catch { return false; }
}

// Load the gtag.js script dynamically (deferred from <head> to reduce LCP)
function ensureGtagScript() {
  if (gtagScriptLoaded) return;
  gtagScriptLoaded = true;
  window.dataLayer = window.dataLayer || [];
  window.gtag = function() { window.dataLayer.push(arguments); };
  window.gtag('consent', 'default', { analytics_storage: 'denied' });
  window.gtag('js', new Date());
  if (isInternalDevice()) window.gtag('set', { traffic_type: 'internal' });
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

// Initialize: only load gtag script if consent was previously given.
// If no consent yet, do nothing — the script will be loaded when the user accepts.
export function initAnalytics() {
  if (!hasAnalyticsConsent()) return;
  const load = () => loadGA();
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
