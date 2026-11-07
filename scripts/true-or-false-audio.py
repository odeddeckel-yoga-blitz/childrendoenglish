#!/usr/bin/env python3
"""Sentence clips for True or False (/games/true-or-false/): "This is a cat." for every pool word and
"A cat is an animal." for every level-2 word x every kind. Same pipeline as the word clips (render-word-audio.py):
Piper en_US-amy-medium at 1.15 → 280 ms lead-in + tail → mono 22.05 kHz mp3, then faster-whisper base.en must hear
the sentence (words compared without punctuation). Writes public/games/true-or-false/audio/<slug>.mp3, skipping
clips that already exist; prints every sentence whisper did not hear.

  ~/.venvs/whisper/bin/python scripts/true-or-false-audio.py
"""
import os, re, json, wave, subprocess
import numpy as np
from piper import PiperVoice, SynthesisConfig
from faster_whisper import WhisperModel

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'public', 'games', 'true-or-false', 'audio')
os.makedirs(OUT, exist_ok=True)
W = json.loads(subprocess.run(['node', '-e', "global.window={};require(process.argv[1]);console.log(JSON.stringify(window.TF_WORDS))",
                              os.path.join(ROOT, 'public', 'games', 'true-or-false', 'words.js')], capture_output=True, text=True, check=True).stdout)

def article(w): return 'an' if w[0] in 'aeiou' and not w.startswith('uni') else 'a'
def name(w): return w.replace('-', ' ')
def slug(s): return re.sub(r'[^a-z0-9]+', '-', s.lower()).strip('-')
sentences = []
for g in W['GROUPS'].values():
    for w in g: sentences.append(f'This is {article(w)} {name(w)}.')
for k in W['KINDS']:
    for w in W['GROUPS'][k]:
        for kind in W['KINDS']:
            sentences.append(f'{article(w).capitalize()} {name(w)} is {article(kind)} {kind}.')

voice = PiperVoice.load(os.path.expanduser('~/.venvs/piper-voices/en_US-amy-medium.onnx'))
model = WhisperModel('base.en', device='cpu', compute_type='int8')
norm = lambda s: re.sub(r'[^a-z ]', '', s.lower().replace('-', ' ')).split()
missed, made = [], 0
for s in sentences:
    mp3 = os.path.join(OUT, slug(s) + '.mp3')
    if os.path.exists(mp3): continue
    wav = os.path.join(OUT, '_tmp.wav')
    with wave.open(wav, 'wb') as f:
        voice.synthesize_wav(s, f, syn_config=SynthesisConfig(length_scale=1.15))
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', wav, '-af', 'adelay=280|280,apad=pad_dur=0.28', '-ac', '1',
                    '-ar', '22050', '-q:a', '7', mp3], check=True)
    os.remove(wav)
    pcm = np.frombuffer(subprocess.run(['ffmpeg', '-v', 'error', '-i', mp3, '-f', 's16le', '-ac', '1', '-ar', '16000', '-'],
                                       capture_output=True, check=True).stdout, np.int16).astype(np.float32) / 32768
    heard = ' '.join(x.text for x in model.transcribe(pcm, language='en', beam_size=5)[0]).strip()
    if norm(heard) != norm(s): missed.append((s, heard))
    made += 1
print(f'{len(sentences)} sentences, {made} rendered, {len(missed)} not heard exactly:')
for s, h in missed: print(f'  {s!r} -> {h!r}')
