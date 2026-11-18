// Browser page translation (Chrome/Edge "Translate this page", Google Translate extension) swaps React's text nodes for
// <font> wrappers. React still holds the old nodes, so its next insertBefore/removeChild names a node that is no
// longer a child and throws NotFoundError: the screen falls to the error card (Sentry a6a5c491, /flashcards, 11-18).
// A child translating the UI must not crash the app, so a mismatched call becomes a safe no-op instead of a throw
// (the standard workaround for facebook/react#11538). Correct calls are untouched.
export function installDomTranslateGuard(proto = typeof Node === 'function' ? Node.prototype : null) {
  if (!proto || proto.__cdeTranslateGuard) return false;
  const removeChild = proto.removeChild;
  const insertBefore = proto.insertBefore;
  proto.removeChild = function guardedRemoveChild(child) {
    if (child && child.parentNode !== this) return child;
    return removeChild.call(this, child);
  };
  proto.insertBefore = function guardedInsertBefore(node, ref) {
    if (ref && ref.parentNode !== this) return node;
    return insertBefore.call(this, node, ref);
  };
  proto.__cdeTranslateGuard = true;
  return true;
}

// Chrome/Edge translation marks <html> with translated-ltr / translated-rtl; tagging crash reports with it tells a
// translation crash apart from a real one.
export function pageTranslated(doc = typeof document !== 'undefined' ? document : null) {
  const cls = doc?.documentElement?.className || '';
  return /\btranslated-(ltr|rtl)\b/.test(cls) ? 'yes' : 'no';
}
