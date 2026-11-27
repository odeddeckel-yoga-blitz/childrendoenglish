// The ladder-next split by device (src/utils/ladderArm.js, kit infra/arm-bit.js, salt 'ladder') in e2e.
// Playwright runs with navigator.webdriver = true, so the kit gives every test page arm null = CONTROL (main's
// behaviour). A spec written for the TREATMENT forces it here; there is no query-string override in the app.

/** Force this device's arm on every page of the test: a kitArm stub defined before the page scripts (the kit file's
 *  own guard, `if (window.kitArm) return`, keeps it). arm 0 | 1 | null. */
export async function forceLadderArm(page, arm) {
  await page.addInitScript((a) => {
    const kit = (salt) => (salt === 'ladder' ? a : null);
    kit.stable = () => true;
    Object.defineProperty(window, 'kitArm', { value: kit, writable: true, configurable: true });
  }, arm);
}

/** The real kit path, as a visitor's browser runs it: navigator.webdriver false, and the stored number in
 *  localStorage `kit_arm_ladder` (< 0.5 → arm 0, ≥ 0.5 → arm 1). Beacons fire then, so the caller routes /api/**. */
export async function realLadderArm(page, u) {
  await page.addInitScript((v) => {
    Object.defineProperty(Navigator.prototype, 'webdriver', { get: () => false, configurable: true });
    try { if (localStorage.getItem('kit_arm_ladder') === null) localStorage.setItem('kit_arm_ladder', String(v)); } catch { /* storage off */ }
  }, u);
}
