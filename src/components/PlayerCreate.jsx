import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { t } from '../utils/i18n';

const AVATARS = ['🦊', '🐱', '🦁', '🐶', '🦄', '🐼', '🐸', '🦋', '🌟', '🚀', '🎨', '🎵'];

export default function PlayerCreate({ lang = 'en', onCreatePlayer, onBack }) {
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState('🦊');
  const [canRead, setCanRead] = useState(null); // null = not chosen yet

  const handleCreate = () => {
    if (!name.trim() || canRead === null) return;
    onCreatePlayer(name.trim(), avatar, canRead);
  };

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        {onBack && (
          <button
            onClick={onBack}
            className="p-2.5 rounded-xl hover:bg-slate-100 transition-colors"
            aria-label={t('backToMenu', lang)}
          >
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
        )}
        <h2 className="text-xl font-bold text-slate-800">{t('createPlayer', lang)}</h2>
      </div>

      {/* Name input */}
      <div className="glass rounded-2xl p-5 space-y-3">
        <label htmlFor="player-name" className="text-sm font-semibold text-slate-700">
          {t('playerName', lang)}
        </label>
        <input
          id="player-name"
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          maxLength={20}
          autoFocus
          className="w-full px-4 py-3 rounded-xl bg-white/70 border border-slate-200
                     text-lg text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2
                     focus:ring-blue-400 transition-all"
          placeholder={t('playerNamePlaceholder', lang)}
        />
      </div>

      {/* Avatar picker */}
      <div className="glass rounded-2xl p-5 space-y-3">
        <p className="text-sm font-semibold text-slate-700">{t('chooseAvatar', lang)}</p>
        <div className="grid grid-cols-6 gap-2">
          {AVATARS.map(emoji => (
            <button
              key={emoji}
              onClick={() => setAvatar(emoji)}
              aria-label={t('selectAvatarLabel', lang, { avatar: emoji })}
              className={`w-12 h-12 rounded-xl text-2xl flex items-center justify-center transition-all
                         ${avatar === emoji
                           ? 'bg-blue-100 ring-2 ring-blue-500 scale-110'
                           : 'bg-white/60 hover:bg-white/80 active:scale-95'}`}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>

      {/* Can read? */}
      <div className="glass rounded-2xl p-5 space-y-3">
        <p className="text-sm font-semibold text-slate-700">{t('canYouRead', lang)}</p>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setCanRead(true)}
            className={`py-3 px-4 rounded-xl font-semibold text-sm transition-all
                       ${canRead === true
                         ? 'bg-emerald-100 border-2 border-emerald-500 text-emerald-700'
                         : 'bg-white border-2 border-slate-200 text-slate-700 hover:border-emerald-400'}`}
          >
            {t('iCanRead', lang)}
          </button>
          <button
            onClick={() => setCanRead(false)}
            className={`py-3 px-4 rounded-xl font-semibold text-sm transition-all
                       ${canRead === false
                         ? 'bg-blue-100 border-2 border-blue-500 text-blue-700'
                         : 'bg-white border-2 border-slate-200 text-slate-700 hover:border-blue-400'}`}
          >
            {t('notYet', lang)}
          </button>
        </div>
        <p className="text-xs text-slate-400 text-center">{t('parentCanChange', lang)}</p>
      </div>

      {/* Create button */}
      <button
        onClick={handleCreate}
        disabled={!name.trim() || canRead === null}
        className="w-full py-3.5 px-6 bg-blue-600 text-white rounded-xl font-semibold text-lg
                   hover:bg-blue-700 active:scale-95 transition-all
                   disabled:opacity-40 disabled:active:scale-100"
      >
        {t('createPlayer', lang)}
      </button>
      {(!name.trim() || canRead === null) && (
        <p className="text-center text-sm text-slate-400">
          {!name.trim() ? t('playerNameHint', lang) : ''}
        </p>
      )}
    </div>
  );
}
