// public/games/word-audio.js: the device-voice fallback runs only when the clip can't LOAD. A clip cut short by
// the next word (AbortError) or a blocked autoplay (NotAllowedError) must not trigger it: on 11-07 the AbortError
// path made the device voice speak over the next word in every game that changes words quickly.
import { describe, it, expect, vi } from 'vitest';
import fs from 'fs';
import path from 'path';
import vm from 'vm';

const SRC = fs.readFileSync(path.resolve(import.meta.dirname, '../../public/games/word-audio.js'), 'utf8');

function load(rejectWith) {
  class FakeAudio {
    constructor(src) { this.src = src; this.paused = true; }
    addEventListener() {}
    pause() { this.paused = true; }
    play() { return rejectWith ? Promise.reject(Object.assign(new Error(rejectWith), { name: rejectWith })) : Promise.resolve(); }
  }
  const win = { speechSynthesis: { cancel() {}, speaking: false } };
  vm.runInNewContext(SRC, { window: win, Audio: FakeAudio, setTimeout, clearTimeout, setInterval, clearInterval });
  return win;
}

describe('cdeSay fallback', () => {
  it.each(['AbortError', 'NotAllowedError'])('does not fall back to the device voice on %s', async (name) => {
    const w = load(name); const fb = vi.fn();
    w.cdeSay('cat', fb);
    await new Promise((r) => setTimeout(r, 0));
    expect(fb).not.toHaveBeenCalled();
  });
  it('falls back when the clip fails to load', async () => {
    const w = load('NotSupportedError'); const fb = vi.fn();
    w.cdeSay('cat', fb);
    await new Promise((r) => setTimeout(r, 0));
    expect(fb).toHaveBeenCalledTimes(1);
  });
  it('exposes cdeHush to stop the current word', () => {
    const w = load(null);
    w.cdeSay('cat');
    expect(() => w.cdeHush()).not.toThrow();
  });
});
