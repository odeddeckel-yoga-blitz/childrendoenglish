import { describe, it, expect, vi, beforeEach } from 'vitest';

// iOS only lets a page start sound inside a tap. The first tap anywhere unlocks
// ONE shared <audio> element; every word then plays through it, so a word that
// plays after an async preload (quiz Q1) isn't blocked.
describe('audio unlock', () => {
  beforeEach(() => { vi.resetModules(); localStorage.clear(); });

  it('the first tap plays the silent clip on a shared element that later words reuse', async () => {
    const made = [];
    globalThis.Audio = vi.fn(function () {
      const el = { src: '', play: vi.fn(() => { if (el.onplaying) setTimeout(() => el.onplaying(), 0); return Promise.resolve(); }), pause: vi.fn() };
      made.push(el); return el;
    });
    const { installAudioUnlock, speakWord } = await import('../utils/sound');
    installAudioUnlock();
    window.dispatchEvent(new Event('click'));
    expect(made).toHaveLength(1);
    expect(made[0].src).toBe('/audio/_unlock.mp3');
    expect(await speakWord('cat')).toBe(true);
    expect(await speakWord('dog')).toBe(true);
    expect(made).toHaveLength(1); // no new element per word
    expect(made[0].src).toBe('/audio/dog.mp3');
  });
});
