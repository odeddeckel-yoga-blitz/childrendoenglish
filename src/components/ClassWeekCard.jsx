import { useState } from 'react';
import { t } from '../utils/i18n';
import { getClassUnit } from '../utils/classUnit';
import { sendLearn } from '../utils/learnBeacon';

// "This week in class" (RC12): the unit a parent pinned with 📌 on its unit
// page, one tap from home (menu and landing). Nothing pinned → nothing shown.
export default function ClassWeekCard({ lang, className = '' }) {
  const [unit] = useState(getClassUnit);
  if (!unit) return null;
  return (
    <a
      href={unit.path}
      onClick={() => sendLearn('wk', 'open')}
      data-testid="class-week-card"
      className={`w-full glass rounded-2xl p-4 flex items-center gap-4 transition-all text-start
                 hover:shadow-lg active:scale-[0.98] border border-sky-200 bg-sky-50/60 ${className}`}
    >
      <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-linear-to-br from-sky-500 to-blue-600 text-2xl" aria-hidden="true">📌</div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-slate-800 dark:text-slate-100">{t('classWeek', lang)}: <bdi dir="ltr">{unit.name}</bdi></p>
        <p className="text-slate-500 text-sm">{t('classWeekDesc', lang)}</p>
      </div>
    </a>
  );
}
