// Google Analytics was removed (2026-11): the CSP blocked its collect endpoint,
// so it recorded nothing, while its consent banner covered "Play now" on phones.
// Measurement is the cookieless land beacon + Vercel Web Analytics
// (public/land-beacon.js) and learn events (src/utils/learnBeacon.js).
// These calls stay as no-ops so the call sites need no change.
export function trackEvent() {}

export const analytics = {
  screenView() {},
  quizStart() {},
  quizComplete() {},
  quizQuit() {},
  quizAnswer() {},
  onboardingComplete() {},
  playerCreate() {},
  featureUse() {},
  pwaInstall() {},
  onboardingStep() {},
  quizFunnelLevel() {},
  quizFunnelMode() {},
};
