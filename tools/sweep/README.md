# Site sweep tools (R2C29, 2026-10-31)

Run against a local build served on :4719 (`(cd dist && python3 -m http.server 4719)`; stop it by PID).

- `node tools/sweep/sweep-all.mjs out.json` — every sitemap URL at 390px: axe (wcag2a/aa + best-practice),
  tap targets <44px, missing alt, RTL / English-on-Hebrew heuristics, broken internal links (vs dist + vercel.json),
  canonical, hreflang. `node tools/sweep/sweep-report.mjs out.json` summarises it.
- `node tools/sweep/focus-check.mjs <paths…>` — tabs through pages; every focused element must show a ring.
- `node tools/sweep/app-he-scan.mjs` — the app in Hebrew (vite preview on :4720): English strings + axe per screen.
- `node tools/sweep/sent-check.mjs <scratch-dir> <paths…>` — plays the sentence modes on word-set pages.

The build itself gates the known RTL glitches (scripts/validate-schema.mjs, postbuild).
