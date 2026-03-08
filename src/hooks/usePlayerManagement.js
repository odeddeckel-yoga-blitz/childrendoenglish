import { useState, useCallback } from 'react';
import { loadStats, loadPlayerRegistry, savePlayerRegistry, addPlayer, removePlayer, resetPlayerProgress, updatePlayerProfile } from '../utils/storage';
import { analytics } from '../utils/analytics';

export default function usePlayerManagement({ navigate, setStats }) {
  const [playerRegistry, setPlayerRegistry] = useState(() => {
    const reg = loadPlayerRegistry();
    return reg;
  });

  const activePlayer = playerRegistry?.players.find(p => p.id === playerRegistry.activePlayerId) || null;

  const handleCreatePlayer = useCallback((name, avatar, canRead) => {
    const id = addPlayer(name, avatar, canRead);
    const reg = loadPlayerRegistry();
    reg.activePlayerId = id;
    savePlayerRegistry(reg);
    setPlayerRegistry({ ...reg });
    const newStats = loadStats(id);
    // Preserve language preference selected before player creation
    setStats(prev => ({ ...newStats, uiLanguage: prev.uiLanguage || newStats.uiLanguage, hasSeenOnboarding: true }));
    analytics.playerCreate();
    navigate('menu');
  }, [navigate, setStats]);

  const handleSelectPlayer = useCallback((playerId) => {
    const reg = loadPlayerRegistry();
    if (!reg) return;
    reg.activePlayerId = playerId;
    savePlayerRegistry(reg);
    setPlayerRegistry({ ...reg });
    const playerStats = loadStats(playerId);
    setStats(playerStats);
    if (!playerStats.hasSeenOnboarding && playerStats.totalQuizzes === 0) {
      navigate('onboarding');
    } else {
      navigate('menu');
    }
  }, [navigate, setStats]);

  const handleUpdatePlayer = useCallback((id, updates) => {
    updatePlayerProfile(id, updates);
    setPlayerRegistry({ ...loadPlayerRegistry() });
  }, []);

  const handleResetPlayer = useCallback((id) => {
    resetPlayerProgress(id);
    if (playerRegistry?.activePlayerId === id) {
      setStats(loadStats(id));
    }
  }, [playerRegistry?.activePlayerId, setStats]);

  const handleDeletePlayer = useCallback((id) => {
    removePlayer(id);
    const reg = loadPlayerRegistry();
    setPlayerRegistry(reg ? { ...reg } : null);
    if (!reg || reg.players.length === 0) {
      navigate('playerCreate');
      return;
    }
    if (playerRegistry?.activePlayerId === id && reg?.activePlayerId) {
      setStats(loadStats(reg.activePlayerId));
    }
  }, [playerRegistry?.activePlayerId, navigate, setStats]);

  return {
    playerRegistry,
    setPlayerRegistry,
    activePlayer,
    handleCreatePlayer,
    handleSelectPlayer,
    handleUpdatePlayer,
    handleResetPlayer,
    handleDeletePlayer,
  };
}
