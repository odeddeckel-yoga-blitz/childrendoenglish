import { useState, useRef, useEffect } from 'react';
import { Globe } from 'lucide-react';
import { LANGS } from '../utils/i18n';

/**
 * Compact language picker — a Globe button that opens a small popover listing
 * every ready language in its own name. Used in the landing top bar and the
 * menu header. Selection is delegated up (App owns uiLanguage state).
 */
export default function LanguagePicker({ lang = 'en', onSelectLanguage }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const close = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, [open]);

  const ready = LANGS.filter((l) => l.ready !== false);
  const current = ready.find((l) => l.code === lang) || ready[0];

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Language: ${current.native}`}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl
                   bg-white/60 hover:bg-white/90 dark:bg-slate-800/60 dark:hover:bg-slate-800/90
                   border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300
                   text-sm font-medium transition-colors"
      >
        <Globe className="w-4 h-4" />
        {current.native}
      </button>
      {open && (
        <ul
          role="listbox"
          aria-label="Choose language"
          className="absolute end-0 mt-1 z-30 min-w-36 rounded-xl bg-white dark:bg-slate-800
                     border border-slate-200 dark:border-slate-700 shadow-lg overflow-hidden"
        >
          {ready.map((l) => (
            <li key={l.code}>
              <button
                role="option"
                aria-selected={l.code === lang}
                onClick={() => { setOpen(false); if (l.code !== lang) onSelectLanguage(l.code); }}
                dir={l.rtl ? 'rtl' : 'ltr'}
                className={`w-full text-start px-4 py-2.5 text-sm flex items-center gap-2
                            hover:bg-blue-50 dark:hover:bg-slate-700 transition-colors
                            ${l.code === lang ? 'font-bold text-blue-600 dark:text-blue-300' : 'text-slate-700 dark:text-slate-200'}`}
              >
                <span aria-hidden="true">{l.flag}</span> {l.native}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
