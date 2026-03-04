import { ArrowLeft } from 'lucide-react';
import { t } from '../utils/i18n';

export default function PrivacyPolicy({ lang = 'en', onBack }) {
  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-2.5 rounded-xl hover:bg-slate-100 transition-colors" aria-label={t('backToMenu', lang)}>
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </button>
        <h2 className="text-xl font-bold text-slate-800">{t('privacyTitle', lang)}</h2>
      </div>

      <div className="glass rounded-2xl p-5 space-y-4 text-sm text-slate-600 leading-relaxed">
        <p className="text-xs text-slate-400">{t('privacyUpdated', lang)}</p>

        <section className="space-y-2">
          <h3 className="font-bold text-slate-800">{t('privacyDataTitle', lang)}</h3>
          <p>{t('privacyDataDesc', lang)}</p>
        </section>

        <section className="space-y-2">
          <h3 className="font-bold text-slate-800">{t('privacyStorageTitle', lang)}</h3>
          <p>{t('privacyStorageDesc', lang)}</p>
        </section>

        <section className="space-y-2">
          <h3 className="font-bold text-slate-800">{t('privacyCookieTitle', lang)}</h3>
          <p>{t('privacyCookieDesc', lang)}</p>
        </section>

        <section className="space-y-2">
          <h3 className="font-bold text-slate-800">{t('privacyThirdPartyTitle', lang)}</h3>
          <p>{t('privacyThirdPartyDesc', lang)}</p>
        </section>

        <section className="space-y-2">
          <h3 className="font-bold text-slate-800">{t('privacyChildrenTitle', lang)}</h3>
          <p>{t('privacyChildrenDesc', lang)}</p>
        </section>

        <section className="space-y-2">
          <h3 className="font-bold text-slate-800">{t('privacyCoppaTitle', lang)}</h3>
          <p>{t('privacyCoppaDesc', lang)}</p>
        </section>

        <section className="space-y-2">
          <h3 className="font-bold text-slate-800">{t('privacyDeleteTitle', lang)}</h3>
          <p>{t('privacyDeleteDesc', lang)}</p>
        </section>

        <section className="space-y-2">
          <h3 className="font-bold text-slate-800">{t('privacyContactTitle', lang)}</h3>
          <p>{t('privacyContactDesc', lang)} <a href="mailto:info@childrendoenglish.com" className="text-blue-600 underline">info@childrendoenglish.com</a>.</p>
        </section>
      </div>
    </div>
  );
}
