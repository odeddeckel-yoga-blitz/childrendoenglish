import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
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

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
