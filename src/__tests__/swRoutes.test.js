// The service worker's app-shell fallback covers the app's routes only; static
// sections (games, units, Band I, Spanish…) always load their own page.
import { describe, it, expect } from 'vitest';
import { SW_FALLBACK_ALLOW, APP_ROUTES } from '../../sw-routes.js';

describe('service-worker navigation fallback', () => {
  it('app routes get the shell', () => {
    expect(APP_ROUTES).toEqual(expect.arrayContaining(['play', 'today', 'letters']));
    for (const u of ['/', '/play', '/today', '/today/', '/letters']) expect(SW_FALLBACK_ALLOW.test(u)).toBe(true);
  });
  it('static pages never do', () => {
    for (const u of ['/games/', '/games/word-zapper/', '/units/jet-2/unit-3/', '/band-1/', '/spanish/', '/es/', '/tools/', '/free-english-practice/', '/he/', '/vocabulary/animals/', '/playground', '/play/x',
      // static policy pages since 11-18 (scripts/build-trust-pages.mjs); /privacy and /terms 308 to them
      '/privacy', '/privacy/', '/terms', '/terms/', '/he/privacy/', '/es/terms/', '/about/']) {
      expect(SW_FALLBACK_ALLOW.test(u)).toBe(false);
    }
  });
});
