import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { initAnalytics, trackEvent } from './utils/analytics';

// Lazy-load Sentry after initial render to reduce main bundle
if (import.meta.env.PROD) {
  const initSentry = () => import('./utils/sentry').then(({ init, browserTracingIntegration }) => {
    init({
      dsn: import.meta.env.VITE_SENTRY_DSN || '',
      integrations: [browserTracingIntegration()],
      tracesSampleRate: 0.1,
    });
  });
  (typeof requestIdleCallback === 'function' ? requestIdleCallback : (fn) => setTimeout(fn, 3000))(initSentry);
}

// Initialize analytics (loads GA if consent already given)
initAnalytics();

// Report web vitals to GA
if (import.meta.env.PROD) {
  import('web-vitals').then(({ onCLS, onINP, onLCP }) => {
    const sendToGA = ({ name, delta, id }) => {
      trackEvent('web_vitals', {
        event_category: 'Web Vitals',
        event_label: id,
        value: Math.round(name === 'CLS' ? delta * 1000 : delta),
        metric_name: name,
        non_interaction: true,
      });
    };
    onCLS(sendToGA);
    onINP(sendToGA);
    onLCP(sendToGA);
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
