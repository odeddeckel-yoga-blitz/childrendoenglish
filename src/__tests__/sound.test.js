// speakWord(): the word clip, then the on-device TTS fallback. A clip that never starts (stalled
// network: neither onplaying nor onerror fires) must hand over to TTS after WORD_AUDIO_START_MS,
// and a word that was replaced or stopped must not fall back at all (audit 11-18).
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('../utils/storage', () => ({ isSoundEnabled: () => true }));

// A fake <audio>: play() returns a promise that stays pending (a stalled load) until the test
// fires onplaying/onerror; pause() rejects it like a browser does (AbortError).
class FakeAudio {
  static made = [];
  constructor() { this.paused = true; this.src = ''; this.onplaying = null; this.onerror = null; FakeAudio.made.push(this); }
  play() {
    this.paused = false;
    return new Promise((res, rej) => { this._res = res; this._rej = rej; });
  }
  pause() { this.paused = true; if (this._rej) this._rej(new Error('AbortError')); }
  start() { this._res?.(); this.onplaying?.(); }
}

let sound;
beforeEach(async () => {
  vi.useFakeTimers();
  vi.resetModules();
  FakeAudio.made = [];
  globalThis.Audio = FakeAudio;
  globalThis.speechSynthesis.speak = vi.fn();
  globalThis.speechSynthesis.cancel = vi.fn();
  globalThis.speechSynthesis.getVoices = () => [{ lang: 'en-US', localService: true }];
  sound = await import('../utils/sound');
});
afterEach(() => { vi.useRealTimers(); });

const flush = () => vi.advanceTimersByTimeAsync(0);

describe('speakWord', () => {
  it('resolves true when the clip starts, without TTS', async () => {
    const p = sound.speakWord('dog');
    await flush();
    const a = FakeAudio.made.at(-1);
    expect(a.src).toBe('/audio/dog.mp3');
    a.start();
    await expect(p).resolves.toBe(true);
    expect(speechSynthesis.speak).not.toHaveBeenCalled();
  });

  it('falls back to TTS when the clip errors', async () => {
    const p = sound.speakWord('dog');
    await flush();
    FakeAudio.made.at(-1).onerror();
    await expect(p).resolves.toBe(false);
    expect(speechSynthesis.speak).toHaveBeenCalledTimes(1);
  });

  it('a clip that has not started after WORD_AUDIO_START_MS is stopped and TTS speaks', async () => {
    const p = sound.speakWord('dog');
    await flush();
    const a = FakeAudio.made.at(-1);
    await vi.advanceTimersByTimeAsync(sound.WORD_AUDIO_START_MS - 100);
    expect(speechSynthesis.speak).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(200);
    await expect(p).resolves.toBe(false);
    expect(a.paused).toBe(true); // a late start can't talk over the TTS
    expect(speechSynthesis.speak).toHaveBeenCalledTimes(1);
  });

  it('a slow clip that starts inside the window still wins', async () => {
    const p = sound.speakWord('dog');
    await vi.advanceTimersByTimeAsync(sound.WORD_AUDIO_START_MS - 500);
    FakeAudio.made.at(-1).start();
    await vi.advanceTimersByTimeAsync(1000);
    await expect(p).resolves.toBe(true);
    expect(speechSynthesis.speak).not.toHaveBeenCalled();
  });

  it('stopWordAudio() during the load: no TTS for the word the child moved past', async () => {
    const p = sound.speakWord('dog');
    await flush();
    sound.stopWordAudio();
    await vi.advanceTimersByTimeAsync(sound.WORD_AUDIO_START_MS + 100);
    await expect(p).resolves.toBe(null);
    expect(speechSynthesis.speak).not.toHaveBeenCalled();
  });

  it('a newer word replaces a loading one: only the newer word is spoken', async () => {
    const first = sound.speakWord('dog');
    await flush();
    const second = sound.speakWord('cat');
    await flush();
    await expect(first).resolves.toBe(null);
    FakeAudio.made.at(-1).start();
    await expect(second).resolves.toBe(true);
    expect(speechSynthesis.speak).not.toHaveBeenCalled();
  });
});
