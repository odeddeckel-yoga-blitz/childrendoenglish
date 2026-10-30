// The service worker may answer a navigation with the app shell ONLY for the
// app's own routes ("/" + the vercel.json rewrites to "/"). Everything else is
// a static page (games, units, Band I, Spanish, tools…) and must come from the
// network. The old denylist missed every section added after it was written,
// so returning visitors got the app instead of /games/ (2026-10-30).
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

export const APP_ROUTES = JSON.parse(readFileSync(join(dirname(fileURLToPath(import.meta.url)), 'vercel.json'), 'utf-8'))
  .rewrites.filter((r) => r.destination === '/' && /^\/[a-z-]+$/.test(r.source)).map((r) => r.source.slice(1));
export const SW_FALLBACK_ALLOW = new RegExp(`^/(${APP_ROUTES.join('|')})?/?$`);
