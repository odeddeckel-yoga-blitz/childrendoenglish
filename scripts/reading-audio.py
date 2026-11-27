#!/usr/bin/env python3
"""Read-along audio for the graded readers (src/data/readings.js): every text sentence and every question without
public/audio/s/<sha1-10>.mp3. Same pipeline as unit-audio.py / render-word-audio.py: Piper (local, free; a computer
voice, never a native speaker) site voice (scripts/site_voice.py: Jenny (Dioco)) → 280 ms lead-in + tail → mono 22.05 kHz mp3, then faster-whisper
base.en must hear the sentence word for word. A clip that fails Jenny at 1.1 is retried at 1.0 / 0.95, then in Kristin, then LJ Speech;
anything still unheard is printed and NOT written (the page shows no 🔊 for it and play-all skips it).

  ~/.venvs/whisper/bin/python scripts/reading-audio.py [--only=<slug>]
"""
import os, re, sys, json, wave, hashlib, subprocess
import numpy as np
from piper import PiperVoice, SynthesisConfig
from faster_whisper import WhisperModel
import site_voice  # the site voice + fallback chain (scripts/site_voice.py)

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
AUD = os.path.join(ROOT, 'public', 'audio', 's')
os.makedirs(AUD, exist_ok=True)
opt = {a[2:].split('=')[0]: a.split('=', 1)[1] for a in sys.argv[1:] if a.startswith('--') and '=' in a}
readings = json.loads(subprocess.run(['node', '--input-type=module', '-e',
    "const m = await import(process.argv[1]); console.log(JSON.stringify(m.READINGS))", os.path.join(ROOT, 'src', 'data', 'readings.js')],
    capture_output=True, text=True, check=True).stdout)
if opt.get('only'): readings = [r for r in readings if r['slug'] == opt['only']]

skey = lambda s: hashlib.sha1(s.strip().encode()).hexdigest()[:10]       # = sentenceKey in sentence-audio.mjs
ONES = 'zero one two three four five six seven eight nine ten eleven twelve'.split()
def norm(s):
    s = s.lower().replace('-', ' ').replace('’', "'").replace("o'clock", 'oclock').replace("'", '')
    s = re.sub(r'\b(\d{1,2}):00\b', lambda m: ONES[int(m.group(1))] + ' oclock' if int(m.group(1)) < 13 else m.group(0), s)
    s = re.sub(r'\b\d{1,2}\b', lambda m: ONES[int(m.group(0))] if int(m.group(0)) < 13 else m.group(0), s)
    s = re.sub(r'[^a-z ]', '', s).replace('okay', 'ok').replace('cannot', 'can not')
    return ['gray' if w == 'grey' else w for w in s.split()]

sents = {}
for r in readings:
    for s in r['text'] + [q['q'] for q in r['questions']]:
        if not os.path.exists(os.path.join(AUD, skey(s) + '.mp3')): sents[skey(s)] = s
print(f'{len(sents)} sentences to render', flush=True)

VOICES = site_voice.CHAIN
loaded = {}
model = WhisperModel('base.en', device='cpu', compute_type='int8')
def hear(path):
    pcm = np.frombuffer(subprocess.run(['ffmpeg', '-v', 'error', '-i', path, '-f', 's16le', '-ac', '1', '-ar', '16000', '-'],
                                       capture_output=True, check=True).stdout, np.int16).astype(np.float32) / 32768
    return ' '.join(s.text for s in model.transcribe(pcm, language='en', beam_size=5, initial_prompt='An English sentence for children:')[0]).strip()
def render(text, mp3, voice, ls):
    if voice not in loaded: loaded[voice] = PiperVoice.load(site_voice.model_path(voice))
    wav = mp3 + '.wav'
    with wave.open(wav, 'wb') as f: loaded[voice].synthesize_wav(text, f, syn_config=SynthesisConfig(length_scale=ls))
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', wav, '-af', 'adelay=280|280,apad=pad_dur=0.28', '-ac', '1',
                    '-ar', '22050', '-q:a', '7', mp3], check=True)
    os.remove(wav)

missed = []
for k, s in sents.items():
    out = os.path.join(AUD, k + '.mp3'); text = s.replace('’', "'")
    for voice, ls in VOICES:
        render(text, out, voice, ls)
        h = hear(out)
        if norm(h) == norm(text): print(f'✓ {s} ({voice} {ls})', flush=True); break
    else:
        os.remove(out); missed.append(f'{s!r}: {h!r}'); print(f'✗ {s} → {h}', flush=True)
print(f'done: {len(sents) - len(missed)} written, {len(missed)} not heard (no file written for them)')
for m in missed: print('  ' + m)
