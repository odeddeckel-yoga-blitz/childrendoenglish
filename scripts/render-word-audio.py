#!/usr/bin/env python3
"""Render candidate word clips and machine-check them (cost plan, owner 11-07: this replaced throwaway scratch scripts
that sessions rewrote for every audio fix). Same pipeline as the site's clips: Piper voice → 280 ms lead-in + tail →
mono 22.05 kHz mp3; then faster-whisper base.en AND small.en must both hear the word.

  ~/.venvs/whisper/bin/python scripts/render-word-audio.py <word> [<word> …] [--voices=amy,amy-slow,hfc] [--out=DIR]

Voices (Piper, in ~/.venvs/piper-voices; download: python -m piper.download_voices <name>):
  amy (site voice, en_US-amy-medium 1.15) · amy-slow (1.35) · amy-x ("Word!" 1.2) · kristin · hfc · lessac · jenny (GB)
Writes DIR/<word>-<voice>.mp3 (default .image-work/audio) and prints, per word, the live clip's and each candidate's
transcripts with ✓/✗. Nothing is copied into public/audio: the owner listens first, then the chosen file is copied.
"""
import os, sys, wave, subprocess
import numpy as np
from piper import PiperVoice, SynthesisConfig
from faster_whisper import WhisperModel

VOICE_DIR = os.path.expanduser('~/.venvs/piper-voices')
VOICES = {
    'amy': ('en_US-amy-medium', 1.15, '{W}.'), 'amy-slow': ('en_US-amy-medium', 1.35, '{W}.'),
    'amy-x': ('en_US-amy-medium', 1.2, '{W}!'), 'kristin': ('en_US-kristin-medium', 1.1, '{W}.'),
    'hfc': ('en_US-hfc_female-medium', 1.15, '{W}.'), 'lessac': ('en_US-lessac-high', 1.15, '{W}.'),
    'jenny': ('en_GB-jenny_dioco-medium', 1.15, '{W}.'),
}
args = [a for a in sys.argv[1:] if not a.startswith('--')]
opt = {a[2:].split('=')[0]: a.split('=', 1)[1] for a in sys.argv[1:] if a.startswith('--') and '=' in a}
if not args: sys.exit(__doc__)
voices = (opt.get('voices') or 'amy,amy-slow,amy-x').split(',')
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
        if model not in loaded: loaded[model] = PiperVoice.load(os.path.join(VOICE_DIR, model + '.onnx'))
        wav = os.path.join(out, '_tmp.wav'); mp3 = os.path.join(out, f'{word}-{v}.mp3')
        with wave.open(wav, 'wb') as f:
            loaded[model].synthesize_wav(text.replace('{W}', word.replace('-', ' ').capitalize()), f, syn_config=SynthesisConfig(length_scale=ls))
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', wav, '-af', 'adelay=280|280,apad=pad_dur=0.28', '-ac', '1',
                        '-ar', '22050', '-q:a', '7', mp3], check=True)
        h = hear(mp3)
        line.append(f"{v}{'✓' if ok(word, h) else '✗'} {h}")
    print(' | '.join(line))
