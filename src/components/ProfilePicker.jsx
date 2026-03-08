import { useState, useRef, useCallback } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { t } from '../utils/i18n';
import useFocusTrap from '../hooks/useFocusTrap';

export default function ProfilePicker({ open, onClose, players, activePlayerId, lang, onSwitch, onAdd, onDelete }) {
  const [confirmDelete, setConfirmDelete] = useState(null);
  const canDelete = players.length >= 2;
  const modalRef = useRef(null);
  const deleteModalRef = useRef(null);

  const closeDelete = useCallback(() => setConfirmDelete(null), []);
  useFocusTrap(modalRef, open && !confirmDelete, onClose);
  useFocusTrap(deleteModalRef, !!confirmDelete, closeDelete);

  if (!open) return null;

  const handleSwitch = (id) => {
    if (id !== activePlayerId) {
      onSwitch(id);
    }
    onClose();
  };

  const handleDelete = (e, player) => {
    e.stopPropagation();
    setConfirmDelete(player);
  };

  const confirmDeletePlayer = () => {
    if (confirmDelete) {
      onDelete(confirmDelete.id);
      setConfirmDelete(null);
      // If we deleted the active player, don't close — App will handle redirect
      if (confirmDelete.id === activePlayerId && players.length <= 1) return;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Modal */}
      <div ref={modalRef} role="dialog" aria-modal="true" className="relative bg-white dark:bg-slate-800 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-sm
                      p-5 space-y-4 animate-fade-in shadow-xl max-h-[80vh] overflow-y-auto"
        style={{ overscrollBehavior: 'contain' }}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
            {t('whoIsPlaying', lang)}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Player list */}
        <div className="flex flex-wrap gap-3 justify-center">
          {players.map(player => (
            <div key={player.id} className="relative">
              <button
                onClick={() => handleSwitch(player.id)}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl min-w-[80px]
                            transition-all active:scale-95 ${
                  player.id === activePlayerId
                    ? 'bg-blue-50 ring-2 ring-blue-500 dark:bg-blue-900/30'
                    : 'bg-slate-50 hover:bg-slate-100 dark:bg-slate-700 dark:hover:bg-slate-600'
                }`}
              >
                <span className="text-3xl">{player.avatar}</span>
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 max-w-[72px] truncate">
                  {player.name}
                </span>
              </button>
              {canDelete && (
                <button
                  onClick={(e) => handleDelete(e, player)}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white
                             flex items-center justify-center hover:bg-red-600 transition-colors z-10"
                  aria-label={t('deletePlayer', lang)}
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Add player button */}
        <button
          onClick={() => { onClose(); onAdd(); }}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl
                     border-2 border-dashed border-slate-300 dark:border-slate-600
                     text-sm font-semibold text-slate-500 dark:text-slate-400
                     hover:border-blue-400 hover:text-blue-500 transition-colors"
        >
          <Plus className="w-4 h-4" />
          {t('addPlayer', lang)}
        </button>
      </div>

      {/* Delete confirmation modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setConfirmDelete(null)} />
          <div ref={deleteModalRef} role="dialog" aria-modal="true" className="relative bg-white dark:bg-slate-800 rounded-2xl p-5 mx-4 max-w-xs w-full
                          shadow-xl animate-fade-in space-y-4 text-center">
            <span className="text-4xl">{confirmDelete.avatar}</span>
            <p className="text-slate-700 dark:text-slate-200 font-medium">
              {t('deleteConfirm', lang, { name: confirmDelete.name })}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-700
                           text-slate-600 dark:text-slate-300 font-semibold text-sm
                           hover:bg-slate-200 transition-colors"
              >
                {t('continue', lang)}
              </button>
              <button
                onClick={confirmDeletePlayer}
                className="flex-1 py-2.5 rounded-xl bg-red-500 text-white font-semibold text-sm
                           hover:bg-red-600 active:scale-95 transition-all flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                {t('deletePlayer', lang)}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
