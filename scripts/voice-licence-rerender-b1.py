#!/usr/bin/env python3
"""Batch B1: re-render amy word clips (public/audio top level) in a public-domain voice. Same pipeline as
voice-licence-rerender.py (Piper -> 280 ms lead-in + tail -> mono 22.05 kHz mp3 -q:a 7) but the gate is
faster-whisper base.en AND small.en both hearing the word. Chain: kristin 1.1, 1.0, 1.25, 1.4, 0.9, then ljspeech-high
1.15, 1.0, 1.3. Owner overrides (11-22): rain/window go straight to ljspeech-high; the OWNER_EAR words keep kristin 1.1
whatever the machine audit says. Resumable: items already in the report are skipped.
  ~/.venvs/whisper/bin/python scripts/voice-licence-rerender-b1.py <shard.json> <report.json> [<textmap.json> [kristin speeds, e.g. 1.1,1.0,0.95]]
B2 (11-23): textmap.json = {rel: exact sentence} for sentence clips (simon-says, feelings): gate = both whisper models must
hear the sentence word for word. Without textmap the text is derived from the file name (words, cvc, pairs).
shard.json = [[ "public/audio/x.mp3", "old voice", "old sha1" ], ...]
"""
import os, sys, re, json, wave, shutil, subprocess
import numpy as np
from piper import PiperVoice, SynthesisConfig
from faster_whisper import WhisperModel

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
VD = os.path.expanduser('~/.venvs/piper-voices')
KR = [('en_US-kristin-medium', ls) for ls in (1.1, 1.0, 1.25, 1.4, 0.9)]
LJ = [('en_US-ljspeech-high', ls) for ls in (1.15, 1.0, 1.3)]
LJ_DIRECT = {'rain', 'window'}
OWNER_EAR = {'cat', 'happy', 'ship', 'umbrella', 'chimney', 'dog', 'water', 'mother', 'school', 'green', 'sleep', 'yellow', 'father', 'rabbit', 'house'}
HOMOPHONES = {'bored': 'board', 'write': 'right', 'two': 'too', 'knight': 'night', 'sun': 'son', 'flour': 'flower', 'sea': 'see',
              'ate': 'eight', 'pear': 'pair', 'hair': 'hare', 'one': 'won', 'four': 'for', 'wear': 'where', 'meat': 'meet',
              'blue': 'blew', 'road': 'rode', 'nose': 'knows', 'tail': 'tale', 'whale': 'wail', 'medal': 'metal'}
NUMS = {str(i): w for i, w in enumerate('zero one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen'.split())}
NUMS.update({'20': 'twenty', '30': 'thirty', '40': 'forty', '50': 'fifty', '60': 'sixty', '70': 'seventy', '80': 'eighty', '90': 'ninety', '100': 'hundred', '1st': 'first', '2nd': 'second', '3rd': 'third'})
# whisper writes numerals as digits ("5", "14"); map them back to words before comparing (the first pass at 11-22 dropped digits -> '' and
# failed every spelled-out number; those clips were re-gated with this mapping). Extra homophone pairs whisper cannot spell apart.
def norm(s):
    s = ' '.join(NUMS.get(t, t) for t in re.sub(r'[^a-z0-9 ]', ' ', s.lower().replace("'", '')).split())
    return re.sub(r'[^a-z ]', '', s).strip()
HOMOPHONES.update({'buy': 'bye', 'eye': 'i', 'plane': 'plain', 'sell': 'cell', 'their': 'there', 'hear': 'here', 'deer': 'dear'})
TEXT = {'i-m-sorry': "I'm sorry.", 'listen-': 'Listen.'}
models = {n: WhisperModel(n, device='cpu', compute_type='int8', cpu_threads=2) for n in ('base.en', 'small.en')}
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
def hear(path, name, sent=False):
    a = pcm(path); segs, _ = models[name].transcribe(a, vad_filter=False, language='en', beam_size=5, initial_prompt='An English sentence for children:' if sent else 'A single English word:')
    return norm(' '.join(s.text for s in segs))
def ok(expected, heard):
    expected = expected.strip()
    if expected == 'i m sorry': expected = 'im sorry'
    if heard.replace(' ', '') == expected.replace(' ', ''): return True
    return (expected in heard or heard == expected or heard.rstrip('s') == expected.rstrip('s')
            or HOMOPHONES.get(expected) == heard or HOMOPHONES.get(heard) == expected)

if __name__ == '__main__':
    items = json.load(open(sys.argv[1])); rp = sys.argv[2]
    TEXTMAP = json.load(open(sys.argv[3])) if len(sys.argv) > 3 else {}
    if len(sys.argv) > 4: KR = [('en_US-kristin-medium', float(x)) for x in sys.argv[4].split(',')]
    out = json.load(open(rp)) if os.path.exists(rp) else {}
    for rel, old, sha in items:
        if rel in out: continue
        stem = os.path.basename(rel)[:-4]; word = stem.replace('-', ' ').strip(); text = TEXT.get(stem, word.capitalize() + '.')
        path = os.path.join(ROOT, rel); tmp = path + '.try.mp3'
        sent = TEXTMAP.get(rel)
        if sent: text, word = sent, norm(sent)
        chain = LJ if (not sent and stem in LJ_DIRECT) else (KR + LJ)
        best = None; used = None
        for m, ls in chain:
            render(text, tmp, m, ls)
            hb, hs = hear(tmp, 'base.en', bool(sent)), hear(tmp, 'small.en', bool(sent))
            good = (hb == word and hs == word) if sent else (ok(word, hb) and ok(word, hs))
            if best is None: shutil.copy(tmp, path + '.best'); best = (m, ls, hb, hs)
            if good or (not sent and stem in OWNER_EAR and m == 'en_US-kristin-medium'):
                os.replace(tmp, path); used = (m, ls, hb, hs, good); break
        if used is None:
            if os.path.exists(tmp): os.remove(tmp)
            os.replace(path + '.best', path); used = best + (False,)
        elif os.path.exists(path + '.best'): os.remove(path + '.best')
        if os.path.exists(tmp): os.remove(tmp)
        out[rel] = {'old': old, 'old_sha1': sha, 'voice': used[0], 'length_scale': used[1], 'heard_base': used[2], 'heard_small': used[3], 'pass': used[4],
                    'owner': 'ear-kristin' if (not sent) and stem in OWNER_EAR and not used[4] else ''}
        print(('OK ' if used[4] else 'FAIL ') + rel, used[0], used[1], used[2], '|', used[3], flush=True)
        json.dump(out, open(rp, 'w'), indent=1)
