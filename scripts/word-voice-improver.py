#!/usr/bin/env python3
"""Word Voice Improver — the audio twin of scripts/word-image-improver.mjs.

The loop (proven 2026-09-20: 124 flagged -> 103 fixed):
  1. AUDIT: transcribe every public/audio/*.mp3 with faster-whisper (small.en,
     vad_filter=False, initial_prompt='A single English word:'); flag words the
     model mishears. Accept homophones (bored/board, write/right, two/too...).
  2. IMPROVE each flagged word: render candidates in preference order —
       amy@1.15, amy@1.35, lessac@1.2, ryan@1.2, lessac@1.4  (+slower rounds)
     ALWAYS pad 250-300ms silence both ends (Piper clips isolated words —
     the padding alone rescued a third of failures on the app-wide amy voice).
     Install the FIRST candidate whisper hears correctly (preference keeps amy
     for consistency; alternatives only rescue words she can't say).
  3. Words no config passes are usually STT limits on sub-second minimal pairs
     (ant/and, van, vest, teens/decades) — verify by ear before re-rendering.

Setup (self-contained venv):
  python3 -m venv /tmp/voice-venv && /tmp/voice-venv/bin/pip install piper-tts faster-whisper
  /tmp/voice-venv/bin/python -m piper.download_voices en_US-amy-medium en_US-lessac-medium en_US-ryan-high
Then adapt the session scripts (voice-audit.py / voice-improver.py in git history
of this file's commit message) — or ask Claude to re-run the loop; this header
is the spec. After ANY mass audio replacement: bump the SW cacheName
('word-audio-vN' in vite.config.js) or devices serve the old voice for 30 days.
"""
print(__doc__)
