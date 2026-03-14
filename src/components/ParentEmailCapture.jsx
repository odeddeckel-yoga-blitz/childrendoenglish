import { useState } from 'react';
import { Mail, X } from 'lucide-react';
import { t } from '../utils/i18n';

const LS_EMAIL_KEY = 'childrendoenglish-parent-email';
const LS_PROMPTED_KEY = 'childrendoenglish-parent-email-prompted';

export default function ParentEmailCapture({ lang = 'en' }) {
  const [email, setEmail] = useState('');
  const [dismissed, setDismissed] = useState(false);

  const markPrompted = () => {
    localStorage.setItem(LS_PROMPTED_KEY, '1');
    setDismissed(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email) return;
    localStorage.setItem(LS_EMAIL_KEY, email);
    markPrompted();
  };

  const handleSkip = () => {
    markPrompted();
  };

  if (dismissed) return null;

  return (
    <div className="glass rounded-2xl p-4 border border-blue-100 bg-blue-50/30 space-y-3">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
          <Mail className="w-4 h-4 text-blue-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{t('parentEmailTitle', lang)}</p>
          <p className="text-xs text-slate-500 mt-0.5">{t('parentEmailDesc', lang)}</p>
        </div>
        <button
          onClick={handleSkip}
          className="p-1 rounded-lg hover:bg-slate-200 transition-colors flex-shrink-0"
          aria-label={t('skipStep', lang)}
        >
          <X className="w-4 h-4 text-slate-400" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <label className="sr-only" htmlFor="parent-email">{t('parentEmailPlaceholder', lang)}</label>
        <input
          id="parent-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t('parentEmailPlaceholder', lang)}
          className="flex-1 min-w-0 px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white
                     focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent
                     placeholder:text-slate-400 text-slate-800 dark:text-slate-100"
          autoComplete="email"
        />
        <button
          type="submit"
          disabled={!email}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl
                     hover:bg-blue-700 active:scale-95 transition-all
                     disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100"
        >
          OK
        </button>
      </form>

      <button
        onClick={handleSkip}
        className="w-full text-xs text-slate-400 hover:text-slate-600 transition-colors text-center"
      >
        {t('skipStep', lang)}
      </button>
    </div>
  );
}
