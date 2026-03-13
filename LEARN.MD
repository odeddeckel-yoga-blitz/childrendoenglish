# LEARN.MD — Audit Knowledge Base

## SEO / Indexing
- **Learning**: Indexing rate is the critical bottleneck. As of Mar 13, 6 pages have impressions out of 397 submitted. 210 pages submitted to Indexing API so far (200 + 11 due to quota). ~131 remaining.
- **Signal**: Check GSC "Pages" report → "Discovered - currently not indexed" and "Crawled - currently not indexed" buckets.
- **Action**: Continue daily Indexing API submissions until all 397 pages are covered. Check indexed count weekly.
- **First seen**: 2026-03-13
- **Confidence**: High

## Observability
- **Learning**: Sentry is LIVE. DSN set on Vercel (`VITE_SENTRY_DSN`), lazy-loaded in production, ErrorBoundary sends exceptions.
- **Signal**: Check Sentry dashboard for error volume. Verify DSN is still in live JS bundle.
- **Status**: RESOLVED (2026-03-13)
- **Confidence**: High

## Performance
- **Learning**: Mobile scores are near-perfect (98-100). Desktop LCP scores 65 due to stricter thresholds. Sentry JS bundle (45KB, 91% unused) is the main desktop performance drag.
- **Signal**: Run PageSpeed Insights for both mobile and desktop. Check for unused JS in desktop report.
- **Action**: Fast-track performance dimension next audit — likely still green. Focus on desktop LCP if it drops below 90.
- **First seen**: 2026-03-13
- **Confidence**: High

## Accessibility
- **Learning**: Near-perfect (100 Lighthouse). Three "accessible name mismatch" buttons were fixed (LandingPage language toggle, Menu language toggle, Menu player switcher). Quiz feedback is visual-only (no aria-live) — minor.
- **Status**: RESOLVED (2026-03-13) — name mismatches fixed
- **Action**: Fast-track this dimension — consistently healthy.
- **First seen**: 2026-03-13
- **Confidence**: High

## Trust Signals
- **Learning**: 3 parent testimonials added to landing page (React) and about page (static HTML). Full Hebrew translations included.
- **Status**: RESOLVED (2026-03-13) — testimonials added
- **Action**: Consider adding more social proof (app store ratings, press mentions, user count) in future audits.
- **First seen**: 2026-03-13
- **Confidence**: High

## Security
- **Learning**: Security headers are excellent (CSP, HSTS preload, DENY frames). CSP hardened with base-uri, object-src, form-action directives (2026-03-13).
- **Status**: RESOLVED (2026-03-13)
- **Action**: Fast-track security — consistently strong.
- **First seen**: 2026-03-13
- **Confidence**: High

## Dependencies
- **Learning**: 0 npm audit vulnerabilities. Safe minor/patch upgrades applied (lucide-react 0.468→0.577, @sentry/browser, autoprefixer, postcss, prettier, eslint-plugin-react, @vitest/coverage-v8). flatted DoS vulnerability fixed via npm audit fix.
- **Signal**: Run `npm audit` and `npx npm-check-updates`.
- **Action**: Major upgrades remaining: React 19, Vite 8, Tailwind 4 — plan when ready.
- **Updated**: 2026-03-13
- **Confidence**: High

## GEO (AI Engine Optimization)
- **Learning**: llms.txt created for AI crawlers. FAQ schema added to about page (5 FAQs), category pages, and guide pages.
- **Status**: IMPLEMENTED (2026-03-13)
- **Action**: Monitor AI engine referrals in analytics. Consider llms-full.txt with complete word database.
- **First seen**: 2026-03-13
- **Confidence**: Medium

## Guide Enhancements
- **Learning**: All 7 guides now have table of contents (anchor links) and hero images (reusing OG category images). Mid-content CTAs injected after 2nd section.
- **Status**: RESOLVED (2026-03-13)
- **Confidence**: High

## Low-Signal Dimensions (fast-track next time)
- **Mobile & Responsive**: 9/10, PWA-first design, unlikely to regress
- **Failure Resilience**: 8/10, comprehensive error handling, unlikely to regress
- **i18n**: 8/10, full Hebrew support, system is stable
- **Privacy**: 8/10, local-only data with consent flow, unlikely to change

## High-Signal Dimensions (extra scrutiny next time)
- **SEO**: The indexing gap is the #1 business problem — monitor weekly
- **Business Model**: No revenue path = sustainability risk
- **GEO**: Monitor AI engine presence, growing importance
