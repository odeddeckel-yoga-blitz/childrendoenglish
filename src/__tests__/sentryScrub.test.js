// Crash reports never carry a child's profile name (owner 11-12): src/utils/sentryScrub.js.
import { describe, it, expect } from 'vitest';
import { beforeSend, beforeBreadcrumb, savedNames } from '../utils/sentryScrub';

describe('sentry scrub', () => {
  it('reads saved profile names from the registry', () => {
    const store = { getItem: () => JSON.stringify({ players: [{ name: 'Noa' }, { name: ' Lior ' }, { name: 'X' }] }) };
    expect(savedNames(store)).toEqual(['Noa', 'Lior']);
    expect(savedNames({ getItem: () => '{bad' })).toEqual([]);
  });
  it('drops tap and console breadcrumbs, keeps navigation', () => {
    expect(beforeBreadcrumb({ category: 'ui.click', message: 'button[aria-label="Play as Noa"]' })).toBeNull();
    expect(beforeBreadcrumb({ category: 'console', message: 'Noa' })).toBeNull();
    expect(beforeBreadcrumb({ category: 'navigation', data: { to: '/app' } })).toMatchObject({ category: 'navigation' });
  });
  it('removes the user and replaces every saved name anywhere in the event', () => {
    const ev = {
      user: { id: '1' }, message: 'Hi noa!',
      exception: { values: [{ type: 'TypeError', value: "Cannot read 'x' of Lior's stats" }] },
      breadcrumbs: [{ category: 'navigation', message: 'to /players/Noa' }],
      extra: { state: { player: { name: 'Noa', avatar: 'cat' } } },
    };
    const out = beforeSend(ev, ['Noa', 'Lior']);
    expect(out.user).toBeUndefined();
    expect(JSON.stringify(out)).not.toMatch(/noa|lior/i);
    expect(out.extra.state.player.avatar).toBe('cat');
  });
});
