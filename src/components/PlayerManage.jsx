import { useState } from 'react';
import { ArrowLeft, Trash2, RotateCcw, Plus, Pencil, Check, X } from 'lucide-react';
import { t } from '../utils/i18n';

const AVATARS = ['🦊', '🐱', '🦁', '🐶', '🦄', '🐼', '🐸', '🦋', '🌟', '🚀', '🎨', '🎵'];

export default function PlayerManage({ players, lang = 'en', onUpdatePlayer, onResetPlayer, onDeletePlayer, onAddPlayer, onBack }) {
  const [confirmAction, setConfirmAction] = useState(null); // { type: 'delete'|'reset', playerId }
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editAvatar, setEditAvatar] = useState('');

  const startEdit = (player) => {
    setEditingId(player.id);
    setEditName(player.name);
    setEditAvatar(player.avatar);
  };

  const saveEdit = (player) => {
    onUpdatePlayer(player.id, { name: editName.trim() || player.name, avatar: editAvatar });
    setEditingId(null);
  };

  const handleConfirm = () => {
    if (!confirmAction) return;
    if (confirmAction.type === 'delete') {
      onDeletePlayer(confirmAction.playerId);
    } else {
      onResetPlayer(confirmAction.playerId);
    }
    setConfirmAction(null);
  };

  const confirmPlayer = confirmAction && players.find(p => p.id === confirmAction.playerId);

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-2.5 rounded-xl hover:bg-slate-100 transition-colors" aria-label={t('backToMenu', lang)}>
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </button>
        <h2 className="text-xl font-bold text-slate-800">{t('managePlayers', lang)}</h2>
      </div>

      {/* Player list */}
      <div className="space-y-3">
        {players.map(player => (
          <div key={player.id} className="glass rounded-2xl p-4 space-y-3">
            {editingId === player.id ? (
              /* Edit mode */
              <>
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    maxLength={20}
                    className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-sm
                               focus:outline-none focus:ring-2 focus:ring-blue-400"
                    autoFocus
                  />
                  <button onClick={() => saveEdit(player)} className="p-2 rounded-lg bg-emerald-100 text-emerald-600 hover:bg-emerald-200 transition-colors">
                    <Check className="w-4 h-4" />
                  </button>
                  <button onClick={() => setEditingId(null)} className="p-2 rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex gap-1.5 flex-wrap">
                  {AVATARS.map(emoji => (
                    <button
                      key={emoji}
                      onClick={() => setEditAvatar(emoji)}
                      className={`w-9 h-9 rounded-lg text-lg flex items-center justify-center transition-all
                                 ${editAvatar === emoji ? 'bg-blue-100 ring-2 ring-blue-500' : 'bg-white/60 hover:bg-white/80'}`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
                {/* canRead toggle */}
                <button
                  onClick={() => onUpdatePlayer(player.id, { canRead: !player.canRead })}
                  className={`w-full py-2 px-3 rounded-lg text-sm font-medium transition-all
                             ${player.canRead
                               ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                               : 'bg-slate-50 text-slate-600 border border-slate-200'}`}
                >
                  {t('canReadLabel', lang)}: {player.canRead ? '✓' : '✗'}
                </button>
              </>
            ) : (
              /* View mode */
              <>
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{player.avatar}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-800 truncate">{player.name}</p>
                    <p className="text-xs text-slate-400">
                      {t('canReadLabel', lang)}: {player.canRead ? '✓' : '✗'}
                    </p>
                  </div>
                  <button
                    onClick={() => startEdit(player)}
                    className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
                    aria-label="Edit"
                  >
                    <Pencil className="w-4 h-4 text-slate-500" />
                  </button>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setConfirmAction({ type: 'reset', playerId: player.id })}
                    className="flex-1 py-2 rounded-lg border border-amber-300 text-amber-600 text-sm font-medium
                               hover:bg-amber-50 active:scale-95 transition-all flex items-center justify-center gap-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> {t('resetProgress', lang)}
                  </button>
                  <button
                    onClick={() => setConfirmAction({ type: 'delete', playerId: player.id })}
                    disabled={players.length <= 1}
                    className="flex-1 py-2 rounded-lg border border-rose-300 text-rose-600 text-sm font-medium
                               hover:bg-rose-50 active:scale-95 transition-all flex items-center justify-center gap-1.5
                               disabled:opacity-30 disabled:active:scale-100"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> {t('deletePlayer', lang)}
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      {/* Add player */}
      <button
        onClick={onAddPlayer}
        className="w-full py-3 px-6 rounded-xl border-2 border-dashed border-slate-300
                   text-slate-500 font-semibold hover:bg-slate-50 active:scale-95 transition-all
                   flex items-center justify-center gap-2"
      >
        <Plus className="w-5 h-5" /> {t('addPlayer', lang)}
      </button>

      {/* Confirmation modal */}
      {confirmAction && confirmPlayer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={() => setConfirmAction(null)}>
          <div className="glass rounded-2xl p-6 max-w-sm w-full space-y-4 text-center" onClick={e => e.stopPropagation()}>
            <p className="text-3xl">{confirmPlayer.avatar}</p>
            <p className="text-slate-700 font-medium">
              {confirmAction.type === 'delete'
                ? t('deleteConfirm', lang, { name: confirmPlayer.name })
                : t('resetConfirm', lang, { name: confirmPlayer.name })}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmAction(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold
                           hover:bg-slate-50 active:scale-95 transition-all"
              >
                {t('continue', lang)}
              </button>
              <button
                onClick={handleConfirm}
                className={`flex-1 py-2.5 rounded-xl text-white font-semibold active:scale-95 transition-all
                           ${confirmAction.type === 'delete' ? 'bg-rose-500 hover:bg-rose-600' : 'bg-amber-500 hover:bg-amber-600'}`}
              >
                {confirmAction.type === 'delete' ? t('deletePlayer', lang) : t('resetProgress', lang)}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
