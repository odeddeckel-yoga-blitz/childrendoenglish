#!/usr/bin/env python3
"""Re-render clips that were made with non-commercial voices (lessac / hfc_female / ryan) in a public-domain voice.
Same pipeline as render-word-audio.py (Piper -> 280 ms lead-in + tail -> mono 22.05 kHz mp3, -q:a 7), then the
voice-audit.py check (small.en, initial_prompt, homophones, ffmpeg decode). Order: kristin 1.1, other kristin speeds,
then ljspeech-high. A clip nothing passes keeps its best attempt and is reported.

  ~/.venvs/whisper/bin/python scripts/voice-licence-rerender.py <list.json> <report.json>
list.json = [[ "public/audio/x.mp3", "old voice", "source" ], ...]; sentences (public/audio/s/<hash>.mp3) need their text in
the SENT json given as argv[3] ({hash: text}).
"""
import os, sys, re, json, wave, shutil, subprocess
import numpy as np
from piper import PiperVoice, SynthesisConfig
from faster_whisper import WhisperModel

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
VD = os.path.expanduser('~/.venvs/piper-voices')
CHAIN = [('en_US-kristin-medium', ls) for ls in (1.1, 1.0, 1.25, 1.4, 0.9)] + [('en_US-ljspeech-high', ls) for ls in (1.15, 1.0, 1.3)]
HOMOPHONES = {'bored': 'board', 'write': 'right', 'two': 'too', 'knight': 'night', 'sun': 'son', 'flour': 'flower', 'sea': 'see',
              'ate': 'eight', 'pear': 'pair', 'hair': 'hare', 'one': 'won', 'four': 'for', 'wear': 'where', 'meat': 'meet',
              'blue': 'blew', 'road': 'rode', 'nose': 'knows', 'tail': 'tale', 'whale': 'wail', 'medal': 'metal'}
norm = lambda s: re.sub(r'[^a-z ]', '', s.lower()).strip()
model = WhisperModel('small.en', device='cpu', compute_type='int8')
loaded = {}

def pcm(path):
    return np.frombuffer(subprocess.run(['ffmpeg', '-v', 'quiet', '-i', path, '-f', 'f32le', '-ac', '1', '-ar', '16000', '-'],
                                        capture_output=True, check=True).stdout, dtype=np.float32)
def render(text, mp3, m, ls):
    if m not in loaded: loaded[m] = PiperVoice.load(os.path.join(VD, m + '.onnx'))
    wav = mp3 + '.wav'
    with wave.open(wav, 'wb') as f: loaded[m].synthesize_wav(text, f, syn_config=SynthesisConfig(length_scale=ls))
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', wav, '-af', 'adelay=280|280,apad=pad_dur=0.28', '-ac', '1', '-ar', '22050', '-q:a', '7', mp3], check=True)
    os.remove(wav)
def hear(path, sentence):
    segs, _ = model.transcribe(pcm(path), vad_filter=False, language='en', beam_size=5,
                               initial_prompt='An English sentence for children:' if sentence else 'A single English word:')
    return norm(' '.join(s.text for s in segs))
def ok(expected, heard):
    return (expected in heard or heard == expected or heard.rstrip('s') == expected.rstrip('s')
            or HOMOPHONES.get(expected) == heard or HOMOPHONES.get(heard) == expected)

if __name__ == '__main__':
    items = json.load(open(sys.argv[1])); out = {}
    sent = json.load(open(sys.argv[3])) if len(sys.argv) > 3 else {}
    for rel, old, src in items:
        stem = os.path.basename(rel)[:-4]; is_s = '/s/' in rel
        text = sent[stem] if is_s else stem.replace('-', ' ').capitalize() + '.'
        expected = norm(text) if is_s else stem.replace('-', ' ')
        path = os.path.join(ROOT, rel); best = None; used = None
        for m, ls in CHAIN:
            tmp = path + '.try.mp3'; render(text, tmp, m, ls); h = hear(tmp, is_s)
            good = ok(expected, h) if not is_s else norm(text) == h
            if best is None: best = (tmp, m, ls, h); shutil.copy(tmp, path + '.best')
            if good: os.replace(tmp, path); used = (m, ls, h, True); break
            os.remove(tmp)
        if used is None:
            os.replace(path + '.best', path); m, ls = CHAIN[0]; used = (m, ls, best[3], False)
        elif os.path.exists(path + '.best'): os.remove(path + '.best')
        out[rel] = {'old': old, 'src': src, 'voice': used[0], 'length_scale': used[1], 'heard': used[2], 'pass': used[3]}
        print(('OK ' if used[3] else 'FAIL ') + rel, used[0], used[1], used[2], flush=True)
        json.dump(out, open(sys.argv[2], 'w'), indent=1)
