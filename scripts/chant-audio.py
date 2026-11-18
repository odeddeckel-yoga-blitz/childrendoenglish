#!/usr/bin/env python3
"""Audio for the chant-card pilot (src/data/chants.js): one clip per chant line, /audio/s/<sha1-10>.mp3 (the
sentence-audio key, so sentenceAudio() finds it). Local and free: Piper en_US-amy-medium at a steadier pace (1.2),
280 ms lead-in + tail, mono 22.05 kHz mp3; a line must be heard back word for word by faster-whisper base.en, else it is
retried at 1.35 and then in Lessac; anything still unheard is printed and NOT written.

  ~/.venvs/whisper/bin/python scripts/chant-audio.py
"""
import os, re, json, wave, hashlib, subprocess
import numpy as np
from piper import PiperVoice, SynthesisConfig
from faster_whisper import WhisperModel

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
AUD = os.path.join(ROOT, 'public', 'audio', 's')
os.makedirs(AUD, exist_ok=True)
chants = json.loads(subprocess.run(['node', '--input-type=module', '-e',
    "const m = await import(process.argv[1]); console.log(JSON.stringify(m.CHANTS))", os.path.join(ROOT, 'src', 'data', 'chants.js')],
    capture_output=True, text=True, check=True).stdout)
skey = lambda s: hashlib.sha1(s.strip().encode()).hexdigest()[:10]       # = sentenceKey in sentence-audio.mjs
NUM = {'1': 'one', '2': 'two', '3': 'three', '4': 'four', '5': 'five', '6': 'six', '7': 'seven', '8': 'eight', '9': 'nine', '10': 'ten'}
def norm(s):
    s = s.lower().replace('’', "'").replace("'", '').replace('-', ' ')
    s = re.sub(r'\d+', lambda m: NUM.get(m.group(0), m.group(0)), s)
    return re.sub(r'[^a-z ]', ' ', s).split()

lines = {}
for c in chants:
    for beats in c['lines']:
        text = ' '.join(beats)
        if not os.path.exists(os.path.join(AUD, skey(text) + '.mp3')): lines[skey(text)] = text
print(f'{len(lines)} chant lines to render', flush=True)

VOICES = [('en_US-amy-medium', 1.2), ('en_US-amy-medium', 1.35), ('en_US-lessac-high', 1.2)]
loaded = {}
model = WhisperModel('base.en', device='cpu', compute_type='int8')
def hear(path):
    pcm = np.frombuffer(subprocess.run(['ffmpeg', '-v', 'error', '-i', path, '-f', 's16le', '-ac', '1', '-ar', '16000', '-'],
                                       capture_output=True, check=True).stdout, np.int16).astype(np.float32) / 32768
    return ' '.join(s.text for s in model.transcribe(pcm, language='en', beam_size=5, initial_prompt='A short chant for children:')[0]).strip()
def render(text, mp3, name, ls):
    if name not in loaded: loaded[name] = PiperVoice.load(os.path.expanduser(f'~/.venvs/piper-voices/{name}.onnx'))
    wav = mp3 + '.wav'
    with wave.open(wav, 'wb') as f: loaded[name].synthesize_wav(text, f, syn_config=SynthesisConfig(length_scale=ls))
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', wav, '-af', 'adelay=280|280,apad=pad_dur=0.28', '-ac', '1',
                    '-ar', '22050', '-q:a', '7', mp3], check=True)
    os.remove(wav)

missed = []
for k, text in lines.items():
    out = os.path.join(AUD, k + '.mp3')
    for name, ls in VOICES:
        render(text, out, name, ls)
        h = hear(out)
        if norm(h) == norm(text): print(f'✓ {text} ({name} {ls})', flush=True); break
    else:
        os.remove(out); missed.append(f'{text!r}: {h!r}'); print(f'✗ {text} heard {h!r}', flush=True)
print(f'done: {len(missed)} not heard (no file written for them)')
for m in missed: print('  ' + m)
