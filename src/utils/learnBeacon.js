// Cookieless learning-event beacon (Word Learning Optimizer).
// Aggregate tallies only — {event-kind, content-item} — no identifier, no IP,
// no device storage; deliberately consent-independent like the landing beacon
// (it counts what the CONTENT did, not what a user did). Skips automation and
// owner devices, batches per quiz to keep it to one request.
//
// Events: ans_ok/ans_no @ word id · quiz_start/quiz_done/quiz_quit @ mode ·
// letter @ letter (letter-path practice taps). Read by tools/learning/optimizer.mjs.

function isExcluded() {
  try {
    if (typeof navigator !== 'undefined' && navigator.webdriver) return true;
    if (localStorage.getItem('cde_internal') === '1') return true;
  } catch { /* storage unavailable — count as a real visitor */ }
  return false;
}

const ITEM_RE = /^[a-z0-9@_-]{1,40}$/;

export function sendLearnBatch(events) {
  try {
    if (isExcluded() || !navigator.sendBeacon) return;
    const clean = (events || [])
      .filter(x => x && typeof x.e === 'string' && typeof x.i === 'string' && ITEM_RE.test(x.i))
      .slice(0, 30);
    if (clean.length === 0) return;
    navigator.sendBeacon('/api/land', JSON.stringify({ batch: clean }));
  } catch { /* a beacon must never break the app */ }
}

export function sendLearn(e, i) {
  sendLearnBatch([{ e, i }]);
}
