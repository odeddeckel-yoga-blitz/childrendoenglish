import { isSoundEnabled } from './storage';

let audioCtx = null;
let ttsReady = false;
let ttsAvailable = null; // null = unknown, true/false after check

// Initialize TTS
export const initTTS = async () => {
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    ttsAvailable = false;
    return false;
  }

  try {
    // Wait for voices to load
    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      ttsAvailable = true;
      ttsReady = true;
      return true;
    }

    // Some browsers load voices asynchronously
    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        ttsAvailable = window.speechSynthesis.getVoices().length > 0;
        ttsReady = ttsAvailable;
        resolve(ttsAvailable);
      }, 1000);

      window.speechSynthesis.onvoiceschanged = () => {
        clearTimeout(timeout);
        ttsAvailable = window.speechSynthesis.getVoices().length > 0;
        ttsReady = ttsAvailable;
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
export const speakWord = (text) => {
  if (!isSoundEnabled() || !ttsAvailable) return;

  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);

    // Prefer English voice
    const voices = window.speechSynthesis.getVoices();
    const englishVoice = voices.find(v => v.lang.startsWith('en') && v.localService) ||
                         voices.find(v => v.lang.startsWith('en'));
    if (englishVoice) utterance.voice = englishVoice;

    utterance.lang = 'en-US';
    utterance.rate = 0.85; // slightly slower for kids
    utterance.pitch = 1.05;
    window.speechSynthesis.speak(utterance);
  } catch (e) {
    console.warn('TTS failed:', e);
  }
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
  } catch (e) {
    // Silent fallback
  }
};
