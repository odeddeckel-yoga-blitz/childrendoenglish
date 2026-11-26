// A088 (audit 11-22): on a browser with blocked storage, creating a player threw
// "Cannot read properties of null (reading 'players')". The visit now keeps an in-memory copy.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('blocked browser storage', () => {
  beforeEach(() => {
    vi.resetModules();
    const boom = () => { throw new DOMException('blocked', 'SecurityError'); };
    vi.stubGlobal('localStorage', { getItem: boom, setItem: boom, removeItem: boom, clear: boom, length: 0 });
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });
  afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

  it('create player: registry and stats stay readable for the visit', async () => {
    const s = await import('../utils/storage');
    const id = s.addPlayer('Dana', '🐱', true);
    const reg = s.loadPlayerRegistry();
    expect(reg).not.toBeNull();
    expect(reg.players).toHaveLength(1);
    expect(reg.activePlayerId).toBe(id);
    reg.activePlayerId = id;
    s.savePlayerRegistry(reg);
    const stats = s.loadStats(id);
    expect(stats.totalQuizzes).toBe(0);
    s.saveStats({ ...stats, totalQuizzes: 3 }, id);
    expect(s.loadStats(id).totalQuizzes).toBe(3);
  });

  it('usePlayerManagement.handleCreatePlayer does not throw', async () => {
    const { renderHook, act } = await import('@testing-library/react');
    const { default: usePlayerManagement } = await import('../hooks/usePlayerManagement');
    const navigate = vi.fn();
    const { result } = renderHook(() => usePlayerManagement({ navigate, setStats: vi.fn() }));
    act(() => { result.current.handleCreatePlayer('Dana', '🐱', true); });
    expect(navigate).toHaveBeenCalledWith('menu');
    expect(result.current.playerRegistry.players).toHaveLength(1);
  });

  it('working storage still returns null on first-ever use', async () => {
    vi.unstubAllGlobals();
    const store = {};
    vi.stubGlobal('localStorage', { getItem: (k) => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); }, removeItem: (k) => { delete store[k]; } });
    const s = await import('../utils/storage');
    expect(s.loadPlayerRegistry()).toBeNull();
  });
});
