import { isSoundEnabled } from './storage';

let audioCtx = null;
let ttsAvailable = null; // null = unknown, true/false after check

// Initialize TTS
export const initTTS = async () => {
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    ttsAvailable = false;
    return false;
  }

  try {
    // Chrome requires a cancel() call to kick-start the speech engine
    window.speechSynthesis.cancel();

    // Wait for voices to load
    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      ttsAvailable = true;
      return true;
    }

    // Some browsers load voices asynchronously — give them up to 3s
    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        ttsAvailable = window.speechSynthesis.getVoices().length > 0;
        resolve(ttsAvailable);
      }, 3000);

      window.speechSynthesis.onvoiceschanged = () => {
        clearTimeout(timeout);
        ttsAvailable = window.speechSynthesis.getVoices().length > 0;
        resolve(ttsAvailable);
      };
    });
  } catch {
    ttsAvailable = false;
    return false;
  }
};

export const isTTSAvailable = () => ttsAvailable;

// Speak a word using Web Speech API
// Pre-rendered word audio (Piper en_US-amy voice, scripts/generate-word-audio.sh):
// one consistent, friendly voice on every device instead of whatever TTS the
// OS ships. Falls back to on-device TTS for any text without a file.
const wordAudioUrl = (text) =>
  '/audio/' + text.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-') + '.mp3';

let currentWordAudio = null;

// iOS Safari only lets a page start sound inside a tap (carried ~1 s through
// timers). A quiz's first word plays after the async image preload, often past
// that window, so it could stay silent and the child sees four pictures and no
// word. Fix: on the first tap anywhere, play a silent clip on ONE shared <audio>
// element (and an empty utterance), which unlocks that element for later
// programmatic play. Every word then plays through the shared element.
let sharedAudio = null;
let unlocked = false;
const unlockAudio = () => {
  if (unlocked) return;
  unlocked = true;
  try {
    sharedAudio = sharedAudio || new Audio();
    sharedAudio.src = '/audio/_unlock.mp3';
    const p = sharedAudio.play();
    if (p && p.catch) p.catch(() => { unlocked = false; });
  } catch { unlocked = false; }
  try {
    if (window.speechSynthesis) window.speechSynthesis.speak(new SpeechSynthesisUtterance(''));
  } catch { /* no TTS */ }
};
export const installAudioUnlock = () => {
  if (typeof window === 'undefined') return;
  for (const ev of ['touchend', 'pointerup', 'click', 'keydown']) {
    window.addEventListener(ev, unlockAudio, { capture: true, passive: true });
  }
};

const playWordFile = (text) => new Promise((resolve) => {
  try {
    if (currentWordAudio) { currentWordAudio.pause(); currentWordAudio = null; }
    const audio = sharedAudio || new Audio();
    audio.onplaying = null; audio.onerror = null;
    audio.src = wordAudioUrl(text);
    currentWordAudio = audio;
    audio.onplaying = () => resolve(true);
    audio.onerror = () => resolve(false);
    const p = audio.play();
    if (p && p.catch) p.catch(() => resolve(false));
  } catch {
    resolve(false); // jsdom / blocked autoplay → fall back to TTS
  }
});

// Resolves true when the word's audio file started playing (false = blocked or
// missing; the on-device TTS fallback below can't report whether it spoke).
export const speakWord = async (text) => {
  if (!isSoundEnabled()) return true;

  if (await playWordFile(text)) return true;

  // If TTS status unknown, try initializing first
  if (ttsAvailable === null) {
    await initTTS();
  }
  if (!ttsAvailable) return false;

  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);

    // Prefer English voice
    const voices = window.speechSynthesis.getVoices();
    const englishVoice = voices.find(v => v.lang.startsWith('en') && v.localService) ||
                         voices.find(v => v.lang.startsWith('en'));
    if (englishVoice) utterance.voice = englishVoice;

    utterance.lang = 'en-US';
    utterance.rate = 0.7; // slower for kids
    utterance.pitch = 1.05;
    window.speechSynthesis.speak(utterance);
  } catch (e) {
    console.warn('TTS failed:', e);
  }
  return false;
};

// Play synthesized sound effects via Web Audio API
export const playSound = (type) => {
  if (!isSoundEnabled()) return;

  try {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    const now = audioCtx.currentTime;

    if (type === 'correct') {
      // Two-note chime: C6 (1047Hz) -> E6 (1319Hz)
      const notes = [1047, 1319];
      notes.forEach((freq, i) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0, now + i * 0.09);
        gain.gain.linearRampToValueAtTime(0.07, now + i * 0.09 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.09 + 0.25);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now + i * 0.09);
        osc.stop(now + i * 0.09 + 0.3);
      });
    } else if (type === 'wrong') {
      // Muted buzz
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.linearRampToValueAtTime(180, now + 0.15);
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.2);
    } else if (type === 'complete') {
      // Ascending arpeggio
      const notes = [523, 659, 784, 1047];
      notes.forEach((freq, i) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0, now + i * 0.1);
        gain.gain.linearRampToValueAtTime(0.06, now + i * 0.1 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.3);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now + i * 0.1);
        osc.stop(now + i * 0.1 + 0.35);
      });
    } else if (type === 'badge') {
      // Fanfare
      const notes = [523, 659, 784, 1047, 1319];
      notes.forEach((freq, i) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0, now + i * 0.12);
        gain.gain.linearRampToValueAtTime(0.08, now + i * 0.12 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.12 + 0.4);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now + i * 0.12);
        osc.stop(now + i * 0.12 + 0.45);
      });
    }
  } catch {
    // Silent fallback
  }
};
