#!/usr/bin/env python3
"""Owner decision 11-25: every clip of the 11-22 voice-licence redo is re-rendered in en_GB-jenny_dioco-medium
(commercial use OK with credit "Jenny (Dioco)"). Same pipeline and gate as voice-licence-rerender-b1.py (Piper -> 280 ms
lead-in + tail -> mono 22.05 kHz mp3 -q:a 7; faster-whisper base.en AND small.en must both hear the text; words: homophones
and digit->word map; sentences: word for word). Chain: jenny 1.1, 1.0, 0.95, then kristin 1.1/1.0/0.95, then ljspeech-high
1.15/1.0/1.3. Nothing passes -> keep jenny 1.1 (best attempt) and report it. Exceptions (owner vote): the sentence with sha
df015020e6 ("Her name is Lia.") stays kristin; a sentence naming Lia or Mia stays as it is (kristin) if jenny fails the gate.

  ~/.venvs/whisper/bin/python scripts/voice-jenny-rerender.py <shard.json> <report.json> <textmap.json>
shard.json = [[rel, original old voice, original old sha1, current voice], ...]
"""
import os, sys, re, json, shutil, importlib.util
spec = importlib.util.spec_from_file_location('b1', os.path.join(os.path.dirname(os.path.abspath(__file__)), 'voice-licence-rerender-b1.py'))
b1 = importlib.util.module_from_spec(spec); spec.loader.exec_module(b1)

JEN = [('en_GB-jenny_dioco-medium', ls) for ls in (1.1, 1.0, 0.95)]
KR = [('en_US-kristin-medium', ls) for ls in (1.1, 1.0, 0.95)]
STAY = {'df015020e6'}
NAMES = re.compile(r'\b(Lia|Mia)\b')

if __name__ == '__main__':
    items = json.load(open(sys.argv[1])); rp = sys.argv[2]; TEXTMAP = json.load(open(sys.argv[3]))
    out = json.load(open(rp)) if os.path.exists(rp) else {}
    for rel, old, sha, cur in items:
        if rel in out: continue
        stem = os.path.basename(rel)[:-4]; path = os.path.join(b1.ROOT, rel); tmp = path + '.try.mp3'
        sent = TEXTMAP.get(rel)
        if stem in STAY and sent:
            out[rel] = {'old': old, 'old_sha1': sha, 'cur': cur, 'voice': 'kept', 'length_scale': 0, 'heard_base': '', 'heard_small': '', 'pass': True, 'note': 'owner vote: stays kristin'}
            print('KEEP', rel, flush=True); json.dump(out, open(rp, 'w'), indent=1); continue
        if sent: text, word = sent, b1.norm(sent)
        else:
            word = stem.replace('-', ' ').strip(); text = b1.TEXT.get(stem, word.capitalize() + '.')
        chain = JEN + KR + b1.LJ
        best = None; used = None
        for m, ls in chain:
            b1.render(text, tmp, m, ls)
            hb, hs = b1.hear(tmp, 'base.en', bool(sent)), b1.hear(tmp, 'small.en', bool(sent))
            good = (hb == word and hs == word) if sent else (b1.ok(word, hb) and b1.ok(word, hs))
            if best is None: shutil.copy(tmp, path + '.best'); best = (m, ls, hb, hs)
            if good: os.replace(tmp, path); used = (m, ls, hb, hs, True); break
            if sent and NAMES.search(sent) and (m, ls) == JEN[-1]:
                used = ('kept', 0, best[2], best[3], False); break   # name sentence, jenny failed: file stays as it is
        if os.path.exists(tmp): os.remove(tmp)
        if used is None:
            os.replace(path + '.best', path); used = best + (False,)
        elif os.path.exists(path + '.best'): os.remove(path + '.best')
        out[rel] = {'old': old, 'old_sha1': sha, 'cur': cur, 'voice': used[0], 'length_scale': used[1], 'heard_base': used[2], 'heard_small': used[3], 'pass': used[4],
                    'note': 'name sentence, jenny failed the gate: stays as it was' if used[0] == 'kept' else ''}
        print(('OK ' if used[4] else 'FAIL ') + rel, used[0], used[1], used[2], '|', used[3], flush=True)
        json.dump(out, open(rp, 'w'), indent=1)
