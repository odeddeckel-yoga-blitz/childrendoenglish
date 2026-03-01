import { Plus, Settings } from 'lucide-react';
import { t } from '../utils/i18n';

export default function PlayerSelect({ players, activePlayerId, lang = 'en', onSelectPlayer, onManage, onAddPlayer }) {
  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-black text-slate-800">{t('whoIsPlaying', lang)}</h1>
      </div>

      {/* Player grid */}
      <div className="grid grid-cols-2 gap-3">
        {players.map(player => (
          <button
            key={player.id}
            onClick={() => onSelectPlayer(player.id)}
            className={`glass rounded-2xl p-5 flex flex-col items-center gap-2
                       hover:shadow-lg active:scale-[0.97] transition-all
                       ${player.id === activePlayerId ? 'ring-2 ring-blue-500 bg-blue-50/50' : ''}`}
          >
            <span className="text-4xl">{player.avatar}</span>
            <span className="font-semibold text-slate-800 text-sm truncate max-w-full">{player.name}</span>
          </button>
        ))}

        {/* Add player button */}
        <button
          onClick={onAddPlayer}
          className="glass rounded-2xl p-5 flex flex-col items-center gap-2
                     hover:shadow-lg active:scale-[0.97] transition-all
                     border-2 border-dashed border-slate-300"
        >
          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
            <Plus className="w-5 h-5 text-slate-500" />
          </div>
          <span className="font-semibold text-slate-500 text-sm">{t('addPlayer', lang)}</span>
        </button>
      </div>

      {/* Manage link */}
      <div className="text-center">
        <button
          onClick={onManage}
          className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-600 transition-colors"
        >
          <Settings className="w-4 h-4" />
          {t('managePlayers', lang)}
        </button>
      </div>
    </div>
  );
}
