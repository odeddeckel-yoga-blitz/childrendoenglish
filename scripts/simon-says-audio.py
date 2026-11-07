#!/usr/bin/env python3
"""Instruction clips for Simon Says (/games/simon-says/) from public/games/simon-says/data.js: "Simon says, clap your
hands!" and the trap "Clap your hands!" for every action, plus level 3's fixed pairs ("Simon says, run and wave!" /
"Run and wave!"). Same pipeline as feelings-audio.py: Piper en_US-amy-medium → 280 ms lead-in + tail → mono 22.05 kHz
mp3; the first speed (1.15, 1.3, 1.0) that faster-whisper base.en or small.en hears word for word is kept. Prints any
sentence no speed passed (reword it, never ship it).

  ~/.venvs/whisper/bin/python scripts/simon-says-audio.py
"""
import os, re, json, wave, subprocess
import numpy as np
from piper import PiperVoice, SynthesisConfig
from faster_whisper import WhisperModel

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'public', 'games', 'simon-says', 'audio')
os.makedirs(OUT, exist_ok=True)
D = json.loads(subprocess.run(['node', '-e', "global.window={};require(process.argv[1]);console.log(JSON.stringify(window.SIMON_DATA))",
                              os.path.join(ROOT, 'public', 'games', 'simon-says', 'data.js')], capture_output=True, text=True, check=True).stdout)
A = D['ACTIONS']
cap = lambda s: s[0].upper() + s[1:]
sentences = []
for k in A:
    sentences += [f"Simon says, {A[k]['say']}!", f"{cap(A[k]['say'])}!"]
for a, b in D['SAYS_PAIRS']: sentences.append(f"Simon says, {A[a]['say']} and {A[b]['say']}!")
for a, b in D['TRAP_PAIRS']: sentences.append(f"{cap(A[a]['say'])} and {A[b]['say']}!")

voice = PiperVoice.load(os.path.expanduser('~/.venvs/piper-voices/en_US-amy-medium.onnx'))
models = [WhisperModel(n, device='cpu', compute_type='int8') for n in ('base.en', 'small.en')]
norm = lambda s: re.sub(r'[^a-z ]', '', s.lower().replace('-', ' ')).split()
slug = lambda s: re.sub(r'[^a-z0-9]+', '-', s.lower()).strip('-')
def hear(mp3, m):
    pcm = np.frombuffer(subprocess.run(['ffmpeg', '-v', 'error', '-i', mp3, '-f', 's16le', '-ac', '1', '-ar', '16000', '-'],
                                       capture_output=True, check=True).stdout, np.int16).astype(np.float32) / 32768
    return ' '.join(x.text for x in m.transcribe(pcm, language='en', beam_size=5)[0]).strip()
failed = 0
for s in sentences:
    final = os.path.join(OUT, slug(s) + '.mp3')
    if os.path.exists(final): continue
    ok, heard = None, []
    for ls in (1.15, 1.3, 1.0):
        wav, mp3 = os.path.join(OUT, '_t.wav'), os.path.join(OUT, '_t.mp3')
        with wave.open(wav, 'wb') as f: voice.synthesize_wav(s, f, syn_config=SynthesisConfig(length_scale=ls))
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', wav, '-af', 'adelay=280|280,apad=pad_dur=0.28', '-ac', '1',
                        '-ar', '22050', '-q:a', '7', mp3], check=True)
        os.remove(wav)
        heard = [hear(mp3, m) for m in models]
        if any(norm(h) == norm(s) for h in heard): os.replace(mp3, final); ok = ls; break
    if os.path.exists(os.path.join(OUT, '_t.mp3')): os.remove(os.path.join(OUT, '_t.mp3'))
    if not ok: failed += 1; print(f'FAILED {s!r} heard {heard}')
print(f'{len(sentences)} sentences, {failed} failed')
