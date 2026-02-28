import { useRegisterSW } from 'virtual:pwa-register/react';
import { RefreshCw, X } from 'lucide-react';

export default function UpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(swUrl, registration) {
      if (registration) {
        setInterval(() => registration.update(), 60 * 60 * 1000);
      }
    },
  });

  if (!needRefresh) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 animate-slide-up">
      <div className="glass rounded-2xl p-4 flex items-center justify-between gap-3
                      border border-blue-200 shadow-lg max-w-md mx-auto">
        <div className="flex items-center gap-3">
          <RefreshCw className="w-5 h-5 text-blue-600 flex-shrink-0" />
          <p className="text-sm font-medium text-slate-700">New update available!</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setNeedRefresh(false)}
            className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4 text-slate-400" />
          </button>
          <button
            onClick={() => updateServiceWorker(true)}
            className="px-3 py-1.5 bg-blue-600 text-white text-sm font-semibold
                       rounded-lg hover:bg-blue-700 transition-colors"
          >
            Update
          </button>
        </div>
      </div>
    </div>
  );
}
