// Analytics loader for the static SEO pages (vocabulary, guides, flashcards, about).
// External file because the CSP blocks inline scripts (script-src 'self').
//
// Consent model (shares the app's localStorage key):
//   - declined  -> no analytics at all
//   - accepted  -> normal GA (analytics_storage granted)
//   - no choice -> cookieless pings only (Consent Mode default denied)
(function () {
  var GA_ID = 'G-YF34G1SGNE';
  var consent = 'denied';
  try {
    var choice = localStorage.getItem('childrendoenglish-analytics-consent');
    if (choice === 'declined') return;
    if (choice === 'accepted') consent = 'granted';
  } catch (e) {
    // storage blocked — stay in cookieless mode
  }
  window.dataLayer = window.dataLayer || [];
  window.gtag = function () { window.dataLayer.push(arguments); };
  window.gtag('consent', 'default', {
    analytics_storage: consent,
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
  });
  window.gtag('js', new Date());
  window.gtag('config', GA_ID);
  var s = document.createElement('script');
  s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
  s.async = true;
  document.head.appendChild(s);
})();
