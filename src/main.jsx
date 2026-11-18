import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';
import './index.css';

// Lazy-load Sentry after initial render to reduce main bundle.
// Errors only — no performance tracing — so crash reporting stays anonymous
// and consistent with the "no tracking" positioning.
if (import.meta.env.PROD) {
  const initSentry = () => Promise.all([import('./utils/sentry'), import('./utils/sentryScrub')]).then(([{ init, setTag }, scrub]) => {
    init({
      dsn: import.meta.env.VITE_SENTRY_DSN || '',
      sendDefaultPii: false,
      // no profile names in a crash report: no tap/console breadcrumbs, saved names replaced (utils/sentryScrub.js)
      beforeBreadcrumb: scrub.beforeBreadcrumb,
      beforeSend: (event) => scrub.beforeSend(event),
    });
    setTag('appVersion', '1.0.0');
  });
  (typeof requestIdleCallback === 'function' ? requestIdleCallback : (fn) => setTimeout(fn, 3000))(initSentry);
}

// A root boundary: an error outside App's own per-screen boundary (e.g. a hook on start-up) used to unmount the
// whole root and leave a white screen (audit 11-18). The card's button reloads, since App itself failed.
const rootLang = (() => {
  const q = new URLSearchParams(window.location.search).get('lang') || document.documentElement.lang || '';
  return ['he', 'es'].includes(q.slice(0, 2)) ? q.slice(0, 2) : 'en';
})();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary lang={rootLang} onReset={() => window.location.reload()}>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
