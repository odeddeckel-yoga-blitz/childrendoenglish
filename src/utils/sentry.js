// Re-export only what we use from Sentry to allow tree-shaking of replay/feedback/rrweb
export { init, captureException } from '@sentry/browser';
export { browserTracingIntegration } from '@sentry/browser';
