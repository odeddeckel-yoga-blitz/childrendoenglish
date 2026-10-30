// "This week in class" (RC12): a unit page's 📌 button (public/unit-practice.js)
// saves { p: path, n: name } on this device; the home menu turns it into a
// one-tap card. Only a well-formed /units/… path is trusted.
const KEY = 'cde_class_unit';
const PATH = /^\/units\/[a-z0-9-]+\/unit-\d+\/$/;

export function getClassUnit() {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (!v || typeof v.p !== 'string' || !PATH.test(v.p)) return null;
    return { path: v.p, name: typeof v.n === 'string' && v.n.trim() ? v.n.trim().slice(0, 60) : v.p };
  } catch {
    return null;
  }
}
