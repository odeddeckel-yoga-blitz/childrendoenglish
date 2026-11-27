#!/usr/bin/env python3
"""Render candidate word clips and machine-check them (cost plan, owner 11-07: this replaced throwaway scratch scripts
that sessions rewrote for every audio fix). Same pipeline as the site's clips: Piper voice → 280 ms lead-in + tail →
mono 22.05 kHz mp3; then faster-whisper base.en AND small.en must both hear the word.

  ~/.venvs/whisper/bin/python scripts/render-word-audio.py <word> [<word> …] [--voices=jenny,jenny-slow,kristin] [--out=DIR]

Voices (Piper, in ~/.venvs/piper-voices; download: python -m piper.download_voices <name>):
  jenny (site voice, en_GB-jenny_dioco-medium 1.1) · jenny-slow (1.0) · jenny-slower (0.95) · jenny-x ("Word!" 1.1)
  · kristin (1.1) · ljspeech (1.15). Only voices with a commercial licence (scripts/site_voice.py); amy, hfc, lessac and
  ryan were removed 11-27 (no commercial licence), asking for one is an error.
Writes DIR/<word>-<voice>.mp3 (default .image-work/audio) and prints, per word, the live clip's and each candidate's
transcripts with ✓/✗. Nothing is copied into public/audio: the owner listens first, then the chosen file is copied.
"""
import os, sys, wave, subprocess
import numpy as np
from piper import PiperVoice, SynthesisConfig
from faster_whisper import WhisperModel
import site_voice  # the site voice + fallback chain (scripts/site_voice.py)

J, K, L = site_voice.SITE_VOICE, site_voice.KRISTIN, site_voice.LJSPEECH
VOICES = {
    'jenny': (J, 1.1, '{W}.'), 'jenny-slow': (J, 1.0, '{W}.'), 'jenny-slower': (J, 0.95, '{W}.'),
    'jenny-x': (J, 1.1, '{W}!'), 'kristin': (K, 1.1, '{W}.'), 'ljspeech': (L, 1.15, '{W}.'),
}
args = [a for a in sys.argv[1:] if not a.startswith('--')]
opt = {a[2:].split('=')[0]: a.split('=', 1)[1] for a in sys.argv[1:] if a.startswith('--') and '=' in a}
if not args: sys.exit(__doc__)
voices = (opt.get('voices') or 'jenny,jenny-slow,kristin').split(',')
bad = [v for v in voices if v not in VOICES]
if bad: sys.exit(f"unknown voice(s) {', '.join(bad)}; use {', '.join(VOICES)} (amy/hfc/lessac/ryan have no commercial licence)")
out = opt.get('out') or '.image-work/audio'
os.makedirs(out, exist_ok=True)
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

models = {n: WhisperModel(n, device='cpu', compute_type='int8') for n in ('base.en', 'small.en')}
def hear(path):
    pcm = np.frombuffer(subprocess.run(['ffmpeg', '-v', 'error', '-i', path, '-f', 's16le', '-ac', '1', '-ar', '16000', '-'],
                                       capture_output=True, check=True).stdout, np.int16).astype(np.float32) / 32768
    return [' '.join(s.text for s in m.transcribe(pcm, language='en', beam_size=5, initial_prompt='A single English word:')[0]).strip()
            for m in models.values()]
def ok(word, heard):
    w = word.lower().replace('-', ' ')
    return all(w in h.lower().replace('-', ' ').replace('.', '').replace('!', '') for h in heard)

loaded = {}
for word in args:
    live = os.path.join(ROOT, 'public', 'audio', f'{word}.mp3')
    line = [f'{word:12} live {hear(live) if os.path.exists(live) else "—"}']
    for v in voices:
        model, ls, text = VOICES[v]
        if model not in loaded: loaded[model] = PiperVoice.load(site_voice.model_path(model))
        wav = os.path.join(out, '_tmp.wav'); mp3 = os.path.join(out, f'{word}-{v}.mp3')
        with wave.open(wav, 'wb') as f:
            loaded[model].synthesize_wav(text.replace('{W}', word.replace('-', ' ').capitalize()), f, syn_config=SynthesisConfig(length_scale=ls))
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', wav, '-af', 'adelay=280|280,apad=pad_dur=0.28', '-ac', '1',
                        '-ar', '22050', '-q:a', '7', mp3], check=True)
        h = hear(mp3)
        line.append(f"{v}{'✓' if ok(word, h) else '✗'} {h}")
    print(' | '.join(line))
