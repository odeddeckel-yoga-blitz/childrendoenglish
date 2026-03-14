import { useRef } from 'react';
import { t } from '../utils/i18n';
import useFocusTrap from '../hooks/useFocusTrap';

export default function CookieConsent({ lang, onAccept, onDecline }) {
  const containerRef = useRef(null);
  useFocusTrap(containerRef, true, onDecline);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 animate-slide-up pointer-events-none" role="dialog" aria-modal="true" aria-label={t('cookieConsent', lang)}>
      <div ref={containerRef} className="glass rounded-2xl p-4 max-w-lg mx-auto shadow-lg border border-slate-200 space-y-3 pointer-events-auto">
        <p className="text-sm text-slate-600 dark:text-slate-300">{t('cookieConsent', lang)}</p>
        <div className="flex gap-2">
          <button
            onClick={onAccept}
            className="flex-1 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold
                       hover:bg-blue-700 active:scale-95 transition-all"
          >
            {t('accept', lang)}
          </button>
          <button
            onClick={onDecline}
            className="flex-1 py-2 glass rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-300
                       hover:shadow-md active:scale-95 transition-all"
          >
            {t('decline', lang)}
          </button>
        </div>
      </div>
    </div>
  );
}
