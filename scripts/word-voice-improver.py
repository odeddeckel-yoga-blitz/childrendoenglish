#!/usr/bin/env python3
"""Word Voice Improver — the audio twin of scripts/word-image-improver.mjs.

The loop (proven 2026-09-20: 124 flagged -> 103 fixed):
  1. AUDIT: transcribe every public/audio/*.mp3 with faster-whisper (small.en,
     vad_filter=False, initial_prompt='A single English word:'); flag words the
     model mishears. Accept homophones (bored/board, write/right, two/too...).
  2. IMPROVE each flagged word: render candidates in preference order —
       site_voice.CHAIN (scripts/site_voice.py): jenny@1.1, 1.0, 0.95, then
       kristin@1.1, 1.0, 0.95, then ljspeech-high@1.15, 1.0, 1.3
     (owner 11-25/11-27: Jenny (Dioco) is the site voice; amy, lessac, hfc_female
     and ryan have no commercial licence and are never used again).
     ALWAYS pad 280 ms silence both ends (site_voice.PAD_FILTER; Piper clips
     isolated words, the padding alone rescued a third of failures in 2026-09).
     Install the FIRST candidate base.en AND small.en both hear correctly
     (preference keeps Jenny for consistency; Kristin / LJ Speech only rescue
     words she can't say).
  3. Words no config passes are usually STT limits on sub-second minimal pairs
     (ant/and, van, vest, teens/decades) — verify by ear before re-rendering.

Setup (self-contained venv):
  python3 -m venv /tmp/voice-venv && /tmp/voice-venv/bin/pip install piper-tts faster-whisper
  /tmp/voice-venv/bin/python -m piper.download_voices en_GB-jenny_dioco-medium en_US-kristin-medium en_US-ljspeech-high
Render + check candidates with scripts/render-word-audio.py (defaults to the site voice);
voice-audit.py / voice-improver.py are the 2026-09 loop, now on site_voice.CHAIN. This header
is the spec. After ANY mass audio replacement: bump the SW audio cache (add one file to
scripts/audio-cache-bumps/, see sw-audio-cache.js) or devices serve the old voice for 30 days.
"""
print(__doc__)
