// Crash reports must never carry a child's profile name (owner 11-12). Names live only in localStorage, but Sentry's
// default breadcrumbs record what was tapped (a profile button's text/aria-label) and console lines, and an error
// message could interpolate one. So: drop ui and console breadcrumbs, never send a user, and replace every saved
// profile name anywhere in the event with [name].
const PLAYERS_KEY = 'childrendoenglish-players';

export function savedNames(storage = globalThis.localStorage) {
  try {
    const reg = JSON.parse(storage.getItem(PLAYERS_KEY) || 'null');
    return (reg?.players || []).map((p) => String(p?.name || '').trim()).filter((n) => n.length >= 2);
  } catch { return []; }
}

const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export function scrubValue(v, re) {
  if (!re) return v;
  if (typeof v === 'string') return v.replace(re, '[name]');
  if (Array.isArray(v)) return v.map((x) => scrubValue(x, re));
  if (v && typeof v === 'object') {
    const out = {};
    for (const [k, x] of Object.entries(v)) out[k] = scrubValue(x, re);
    return out;
  }
  return v;
}

export function beforeBreadcrumb(crumb) {
  if (!crumb) return null;
  if (crumb.category === 'console' || String(crumb.category || '').startsWith('ui.')) return null;
  return crumb;
}

export function beforeSend(event, names = savedNames()) {
  if (!event) return event;
  delete event.user;
  if (event.request) { delete event.request.cookies; delete event.request.data; }
  const uniq = [...new Set(names)].sort((a, b) => b.length - a.length);
  const re = uniq.length ? new RegExp(uniq.map(esc).join('|'), 'gi') : null;
  return scrubValue(event, re);
}
