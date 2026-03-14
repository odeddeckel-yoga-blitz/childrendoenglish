import { ArrowLeft } from 'lucide-react';
import { t } from '../utils/i18n';

export default function TermsOfService({ lang = 'en', onBack }) {
  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-2.5 rounded-xl hover:bg-slate-100 transition-colors" aria-label={t('backToMenu', lang)}>
          <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-300" />
        </button>
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">{t('termsTitle', lang)}</h2>
      </div>

      <div className="glass rounded-2xl p-5 space-y-4 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
        <p className="text-xs text-slate-400">{t('termsUpdated', lang)}</p>

        <section className="space-y-2">
          <h3 className="font-bold text-slate-800 dark:text-slate-100">{t('termsAcceptTitle', lang)}</h3>
          <p>{t('termsAcceptDesc', lang)}</p>
        </section>

        <section className="space-y-2">
          <h3 className="font-bold text-slate-800 dark:text-slate-100">{t('termsUseTitle', lang)}</h3>
          <p>{t('termsUseDesc', lang)}</p>
        </section>

        <section className="space-y-2">
          <h3 className="font-bold text-slate-800 dark:text-slate-100">{t('termsContentTitle', lang)}</h3>
          <p>{t('termsContentDesc', lang)}</p>
        </section>

        <section className="space-y-2">
          <h3 className="font-bold text-slate-800 dark:text-slate-100">{t('termsDisclaimerTitle', lang)}</h3>
          <p>{t('termsDisclaimerDesc', lang)}</p>
        </section>

        <section className="space-y-2">
          <h3 className="font-bold text-slate-800 dark:text-slate-100">{t('termsChangesTitle', lang)}</h3>
          <p>{t('termsChangesDesc', lang)}</p>
        </section>

        <section className="space-y-2">
          <h3 className="font-bold text-slate-800 dark:text-slate-100">{t('termsContactTitle', lang)}</h3>
          <p>{t('termsContactDesc', lang)} <a href="mailto:info@childrendoenglish.com" className="text-blue-600 underline">info@childrendoenglish.com</a>.</p>
        </section>
      </div>
    </div>
  );
}
