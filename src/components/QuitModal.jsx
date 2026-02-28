import { t } from '../utils/i18n';

export default function QuitModal({ onContinue, onQuit, lang = 'en' }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true" aria-labelledby="quit-title">
      <div className="glass rounded-2xl p-6 max-w-sm w-full space-y-4 text-center animate-scale-in">
        <h3 id="quit-title" className="text-lg font-bold text-slate-800">{t('endQuiz', lang)}</h3>
        <p className="text-slate-500 text-sm">{t('progressSaved', lang)}</p>
        <div className="flex gap-3">
          <button
            onClick={onContinue}
            className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600
                       font-semibold hover:bg-slate-50 transition-colors"
          >
            {t('continue', lang)}
          </button>
          <button
            onClick={onQuit}
            className="flex-1 py-2.5 rounded-xl bg-rose-500 text-white
                       font-semibold hover:bg-rose-600 transition-colors"
          >
            {t('endQuizBtn', lang)}
          </button>
        </div>
      </div>
    </div>
  );
}
