// arm-bit.js (kit, push method v2, 11-10): a stable A/B arm per device per test, with no identifier leaving the device.
//   const arm = window.kitArm('entryb')        // 0 | 1 (or 0..arms-1), or null = don't test this device
//   window.kitArm.stable('entryb')             // false when storage failed and the arm is per page load only
// How it works: the first call for a salt stores one random number in localStorage `kit_arm_<salt>`; the arm is
// floor(u × arms). Each salt has its OWN random number, so two tests running on the same units are orthogonal.
// null for navigator.webdriver (crawlers, our harness) and the owner's ?internal=1 device flag (the site's beacon
// persists it as kdm_dev / cde_internal / yoga-bits-internal; set window.KIT_INTERNAL_KEY for another site).
// Storage blocked (private mode, quota): falls back to one random value per page load, marked unstable. That arm is
// still valid for events inside the same page load; skip unstable devices for metrics that span pages.
// What is sent (beacon contract, infra/land-beacon.md): NOTHING new. The page appends the arm to the tally names it
// already sends for that test's metric, e.g. `tap1@seo` → `tap1@seo~1`; the server accepts the `~<digit>` suffix only
// on the srcs the test needs. No random value, salt-stored number or device id is ever sent. The site's counts exporter
// maps ~0 → ctrl, ~1 → treat for tools/reads.mjs (split visitor-arm).
;(() => {
  if (window.kitArm) return
  const KEYS = ['kdm_dev', 'cde_internal', 'yoga-bits-internal'], loadVals = {}, unstable = {}
  const internal = () => {
    if (/[?&]internal=1(&|$)/.test(location.search)) return true
    try { return KEYS.concat(window.KIT_INTERNAL_KEY || []).some((k) => localStorage.getItem(k) === '1') } catch { return false }
  }
  const clean = (s) => String(s).toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 40) || 'x'
  const unit = (salt) => {
    if (salt in loadVals) return loadVals[salt]
    let u
    try {
      const k = 'kit_arm_' + salt, v = localStorage.getItem(k)
      u = v === null ? NaN : Number(v)
      if (!(u >= 0 && u < 1)) { u = Math.random(); localStorage.setItem(k, String(u)); if (localStorage.getItem(k) !== String(u)) throw 0 }
    } catch { u = Math.random(); unstable[salt] = true }
    return (loadVals[salt] = u)
  }
  const kitArm = (salt, arms = 2) => {
    try {
      if (navigator.webdriver || internal()) return null
      const n = Math.max(2, Math.floor(arms) || 2)
      return Math.min(n - 1, Math.floor(unit(clean(salt)) * n))
    } catch { return null }
  }
  kitArm.stable = (salt) => !unstable[clean(salt)]
  window.kitArm = kitArm
})();
