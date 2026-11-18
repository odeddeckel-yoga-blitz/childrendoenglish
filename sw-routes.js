// The service worker may answer a navigation with the app shell ONLY for the
// app's own routes ("/" + the vercel.json rewrites to "/"). Everything else is
// a static page (games, units, Band I, Spanish, tools…) and must come from the
// network. The old denylist missed every section added after it was written,
// so returning visitors got the app instead of /games/ (2026-10-30).
import { readFileSync, readdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

export const APP_ROUTES = JSON.parse(readFileSync(join(dirname(fileURLToPath(import.meta.url)), 'vercel.json'), 'utf-8'))
  .rewrites.filter((r) => r.destination === '/' && /^\/[a-z-]+$/.test(r.source)).map((r) => r.source.slice(1));
export const SW_FALLBACK_ALLOW = new RegExp(`^/(${APP_ROUTES.join('|')})?/?$`);

// Runtime-cache caps, derived from what public/ actually holds. A StaleWhileRevalidate cache whose
// maxEntries is below the file set evicts its oldest entries while a kid plays, so quizzes and games
// re-fetch (and go silent offline). The hard-coded 800 had fallen to a quarter of the audio set
// (3,175 mp3s matched /audio/ on 11-18). Cap = 1.5x today's count, rounded up to 100, never below the floor.
const PUBLIC_DIR = join(dirname(fileURLToPath(import.meta.url)), 'public');
export const SW_IMAGE_RE = /\/images\/.*\.webp$/;
export const SW_AUDIO_RE = /\/audio\/.*\.mp3$/;
export function countPublic(re, dir = PUBLIC_DIR, base = '') {
  let n = 0;
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const rel = `${base}/${e.name}`;
    if (e.isDirectory()) n += countPublic(re, join(dir, e.name), rel);
    else if (re.test(rel)) n++;
  }
  return n;
}
const cap = (count, floor) => Math.max(floor, Math.ceil((count * 1.5) / 100) * 100);
export function swCacheCaps(dir = PUBLIC_DIR) {
  const images = countPublic(SW_IMAGE_RE, dir), audio = countPublic(SW_AUDIO_RE, dir);
  return { images, audio, imageCap: cap(images, 1000), audioCap: cap(audio, 2000) };
}
