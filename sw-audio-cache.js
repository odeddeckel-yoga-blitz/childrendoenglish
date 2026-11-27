// SW audio cache name (vite.config.js). Audio changes must bump it, or devices keep serving the old clips for up to
// 30 days (StaleWhileRevalidate). The rule used to be "edit 'word-audio-vN' by hand"; two audio batches built side by
// side then both edit that one line and conflict. Now each audio batch adds ONE file to scripts/audio-cache-bumps/
// (name it after the batch, e.g. voice-ship-3.txt; one line saying what changed). The name below changes whenever the
// set of files changes, so batches ship in any order and each one still busts the cache.
import { readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

export const AUDIO_BUMPS_DIR = join(dirname(fileURLToPath(import.meta.url)), 'scripts', 'audio-cache-bumps');
const BASE = 5; // the last hand-edited version (word-audio-v5)

export function audioCacheName(dir = AUDIO_BUMPS_DIR) {
  const bumps = existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith('.txt')).sort() : [];
  if (!bumps.length) return `word-audio-v${BASE}`;
  const h = createHash('sha1').update(bumps.join('\n')).digest('hex').slice(0, 8);
  return `word-audio-v${BASE + bumps.length}-${h}`;
}
