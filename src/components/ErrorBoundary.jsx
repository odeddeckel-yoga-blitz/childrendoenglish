import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { t } from '../utils/i18n';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  // A deploy invalidates the hashed lazy-chunk filenames; a tab still holding
  // the previous shell (PWA registerType:'prompt' keeps them alive for a long
  // time) then fails its next dynamic import and lands here. A single reload
  // fetches the fresh shell + matching chunks, so recover automatically
  // instead of showing the error card (user-reported crash, Sep 2026).
  static isStaleChunkError(error) {
    return /Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module|ChunkLoadError/i
      .test(String(error?.message || error));
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
    if (ErrorBoundary.isStaleChunkError(error)) {
      let reloaded = false;
      try {
        reloaded = sessionStorage.getItem('cde-chunk-reload') === '1';
        if (!reloaded) sessionStorage.setItem('cde-chunk-reload', '1');
      } catch { /* storage unavailable — fall through to the error card */ }
      if (!reloaded) {
        window.location.reload();
        return; // don't report the transient stale-chunk case to Sentry
      }
    }
    import('../utils/sentry').then(({ captureException }) => {
      captureException(error, { extra: errorInfo });
    }).catch(() => {});
  }

  render() {
    if (this.state.hasError) {
      const lang = this.props.lang || 'en';
      return (
        <div className="flex items-center justify-center min-h-[50vh] p-6">
          <div className="glass rounded-2xl p-8 max-w-md text-center space-y-4 border border-rose-200">
            <div className="w-16 h-16 mx-auto bg-rose-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-rose-500" />
            </div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">{t('errorTitle', lang)}</h2>
            <p className="text-slate-500 text-sm">
              {t('errorGeneric', lang)}
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                this.props.onReset?.();
              }}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-semibold
                         hover:bg-blue-700 active:scale-95 transition-all"
            >
              {t('backToMenuBtn', lang)}
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
