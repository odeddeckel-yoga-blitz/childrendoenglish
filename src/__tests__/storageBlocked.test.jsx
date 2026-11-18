// Blocked storage (Safari private mode, cookies off, some school-managed browsers) throws on every access.
// Audit 11-18: an unguarded read in useInstallPrompt white-screened the whole app on / and /?lang=he.
import { renderHook, act } from '@testing-library/react';
import useInstallPrompt from '../hooks/useInstallPrompt';
import { flowEvents } from '../utils/activityFlow';
import { savedNames } from '../utils/sentryScrub';
import { disableNotifications, checkStreakReminder } from '../utils/notifications';

const deny = () => { throw new DOMException('The operation is insecure.', 'SecurityError'); };
const throwingStore = { getItem: deny, setItem: deny, removeItem: deny, clear: deny, key: deny, get length() { return deny(); } };

describe('blocked storage', () => {
  let saved;
  beforeEach(() => {
    saved = globalThis.localStorage;
    globalThis.localStorage = throwingStore;
    // the property getter itself throws in a real blocked browser
    Object.defineProperty(window, 'sessionStorage', { configurable: true, get: deny });
  });
  afterEach(() => {
    globalThis.localStorage = saved;
    delete window.sessionStorage;
  });

  it('useInstallPrompt does not throw on start, install or dismiss', () => {
    const { result, rerender } = renderHook((p) => useInstallPrompt(p), { initialProps: { gameState: 'landing', totalQuizzes: 0 } });
    rerender({ gameState: 'menu', totalQuizzes: 3 });
    expect(() => act(() => result.current.dismissInstall())).not.toThrow();
    expect(result.current.showInstallBanner).toBe(false);
  });

  it('flowEvents and savedNames fall back quietly', () => {
    expect(flowEvents('learn', 'menu')).toEqual([]);
    expect(savedNames()).toEqual([]);
  });

  it('notifications helpers do not throw', () => {
    expect(() => disableNotifications()).not.toThrow();
    expect(() => checkStreakReminder({ currentStreak: 3, dailyGoal: { date: '2000-01-01' } })).not.toThrow();
  });
});
