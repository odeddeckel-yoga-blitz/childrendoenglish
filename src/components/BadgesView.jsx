import { ArrowLeft } from 'lucide-react';
import { BADGES } from '../data/badges';

export default function BadgesView({ stats, onBack }) {
  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-2.5 rounded-xl hover:bg-slate-100 transition-colors" aria-label="Back to menu">
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </button>
        <h2 className="text-xl font-bold text-slate-800">Badges</h2>
        <span className="text-sm text-slate-500 ml-auto">
          {stats.badges?.length || 0} / {BADGES.length}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {BADGES.map((badge, i) => {
          const earned = stats.badges?.includes(badge.id);
          return (
            <div
              key={badge.id}
              className={`glass rounded-2xl p-5 text-center space-y-2 transition-all ${
                earned ? 'animate-badge-pop' : 'opacity-40 grayscale'
              }`}
              style={earned ? { animationDelay: `${i * 100}ms` } : {}}
            >
              <div className="text-4xl">{badge.icon}</div>
              <h3 className="font-bold text-slate-800 text-sm">{badge.name}</h3>
              <p className="text-xs text-slate-500">{badge.description}</p>
              {earned && (
                <span className="inline-block px-2 py-0.5 bg-emerald-100 text-emerald-700
                               text-xs font-semibold rounded-full">
                  Earned!
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
