import { t } from '../utils/i18n';

export default function CookieConsent({ lang, onAccept, onDecline }) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 animate-slide-up">
      <div className="glass rounded-2xl p-4 max-w-lg mx-auto shadow-lg border border-slate-200 space-y-3">
        <p className="text-sm text-slate-600">{t('cookieConsent', lang)}</p>
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
            className="flex-1 py-2 glass rounded-xl text-sm font-semibold text-slate-600
                       hover:shadow-md active:scale-95 transition-all"
          >
            {t('decline', lang)}
          </button>
        </div>
      </div>
    </div>
  );
}
