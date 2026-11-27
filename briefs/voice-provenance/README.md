# Voice provenance (per clip)

- `baseline-2026-11-22.csv`: every audio clip as it was on origin/main before the voice-licence redo (file, family,
  voice, sha1 of the file). Voices come from the 2026-11-22 provenance log (generators, git history, acoustic
  classifier); `unknown` = not settled.
- `ship-<k>.csv`: the clips that batch k (branch fix/voice-ship-k) replaced: final voice and speed, licence, gate
  result, `sha1` of the shipped file, `old_voice`/`old_sha1` of the file it replaced, and the render evidence.
- `ship-<k>.md`: the batch log (counts, clips that failed the whisper gate in every voice, kept exceptions).

`node tools/voice-final-check.mjs` lists every clip by voice from these files (matched by sha1 of the bytes on disk) and
fails while a clip is on amy, lessac, hfc_female or ryan. `src/__tests__/voiceShip.test.js` checks every batch present.
`held-by-owner*.txt` (`held-by-owner.txt`, plus one file per batch that holds clips, e.g. `held-by-owner-ship7.txt`, so
batches never edit the same file): clips the owner keeps on their old voice until they have listened (one `<file> | <date> | <why>` per
line). The check lists them as HELD and does not fail on them (also with `--strict`) while their bytes are the baseline
file; remove the line when the owner clears the clip and ship its re-render in a batch.
