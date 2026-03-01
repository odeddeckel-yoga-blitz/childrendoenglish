import React from 'react';
import ReactDOM from 'react-dom/client';
import * as Sentry from '@sentry/react';
import App from './App';
import './index.css';
import { initAnalytics, trackEvent } from './utils/analytics';

// Initialize Sentry (replace DSN with your project's DSN)
if (import.meta.env.PROD) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN || '',
    integrations: [Sentry.browserTracingIntegration()],
    tracesSampleRate: 0.1,
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0.1,
  });
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
