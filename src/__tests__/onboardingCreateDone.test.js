// First-visit funnel: creating the FIRST player sends onb@create_done; a second player doesn't.
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import usePlayerManagement from '../hooks/usePlayerManagement';
import { sendLearn } from '../utils/learnBeacon';

vi.mock('../utils/learnBeacon', () => ({ sendLearn: vi.fn() }));
vi.mock('../utils/analytics', () => ({ analytics: { playerCreate: vi.fn() } }));

describe('onb create_done', () => {
  beforeEach(() => { localStorage.clear(); sendLearn.mockClear(); });

  it('fires for the first player only', () => {
    const { result } = renderHook(() => usePlayerManagement({ navigate: vi.fn(), setStats: vi.fn() }));
    act(() => { result.current.handleCreatePlayer('Emma', '🦊', true); });
    expect(sendLearn).toHaveBeenCalledWith('onb', 'create_done');
    sendLearn.mockClear();
    act(() => { result.current.handleCreatePlayer('Noa', '🐱', true); });
    expect(sendLearn).not.toHaveBeenCalled();
  });
});
