// The SW runtime caches must hold the whole image and audio sets, or a StaleWhileRevalidate cache
// evicts while a kid plays and offline goes silent (audit 11-18: audio cap 800 vs 3,175 files).
import { describe, it, expect } from 'vitest';
import { swCacheCaps, countPublic, SW_AUDIO_RE, SW_IMAGE_RE } from '../../sw-routes.js';

describe('service-worker cache caps', () => {
  const c = swCacheCaps();

  it('counts the real files', () => {
    expect(c.images).toBeGreaterThan(500);
    expect(c.audio).toBeGreaterThan(2000);
    expect(countPublic(SW_AUDIO_RE)).toBe(c.audio);
  });

  it('every cap leaves at least 25% headroom over the file count', () => {
    expect(c.imageCap).toBeGreaterThanOrEqual(Math.ceil(c.images * 1.25));
    expect(c.audioCap).toBeGreaterThanOrEqual(Math.ceil(c.audio * 1.25));
  });

  it('the patterns match the paths the app requests', () => {
    expect(SW_IMAGE_RE.test('https://childrendoenglish.com/images/dog.webp')).toBe(true);
    expect(SW_AUDIO_RE.test('https://childrendoenglish.com/audio/dog.mp3')).toBe(true);
    expect(SW_AUDIO_RE.test('https://childrendoenglish.com/audio/s/dog-1.mp3')).toBe(true);
    expect(SW_AUDIO_RE.test('https://childrendoenglish.com/games/true-or-false/audio/x.mp3')).toBe(true);
  });
});
