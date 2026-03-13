# LEARN.MD — Audit Knowledge Base

## SEO / Indexing
- **Learning**: Indexing rate is the critical bottleneck (7/1109 = 0.6% in March 2026). Word pages were thin (~519 words) and have been enriched to 800+, but re-indexing hasn't been requested yet.
- **Signal**: Check GSC "Pages" report → "Discovered - currently not indexed" and "Crawled - currently not indexed" buckets.
- **Action**: First thing in next audit — check indexed page count in GSC. If still <50, the problem is deeper than content quality (could be crawl budget, domain authority, or quality signals).
- **First seen**: 2026-03-13
- **Confidence**: High

## Observability
- **Learning**: Sentry is wired up in code (lazy-loaded, ErrorBoundary sends exceptions) but VITE_SENTRY_DSN is not set on Vercel. Production error monitoring is completely offline.
- **Signal**: Check `VITE_SENTRY_DSN` env var in Vercel project settings.
- **Action**: Verify this is fixed in next audit. If still missing, flag as critical.
- **First seen**: 2026-03-13
- **Confidence**: High

## Performance
- **Learning**: Mobile scores are near-perfect (98-100). Desktop LCP scores 65 due to stricter thresholds. Sentry JS bundle (45KB, 91% unused) is the main desktop performance drag.
- **Signal**: Run PageSpeed Insights for both mobile and desktop. Check for unused JS in desktop report.
- **Action**: Fast-track performance dimension next audit — likely still green. Focus on desktop LCP if it drops below 90.
- **First seen**: 2026-03-13
- **Confidence**: High

## Accessibility
- **Learning**: Near-perfect (100 Lighthouse). One "accessible name mismatch" on a button. Quiz feedback is visual-only (no aria-live). These are minor.
- **Signal**: Run Lighthouse a11y check; look for the button name mismatch specifically.
- **Action**: Fast-track this dimension — consistently healthy.
- **First seen**: 2026-03-13
- **Confidence**: High

## Trust Signals
- **Learning**: This is the weakest non-technical dimension. Zero testimonials, no social proof, no press mentions, minimal creator bio. For a children's app, parent trust is the #1 conversion factor.
- **Signal**: Check about page, landing page for any social proof elements.
- **Action**: Prioritize this in every audit — it's the biggest non-technical blocker.
- **First seen**: 2026-03-13
- **Confidence**: High

## Security
- **Learning**: Security headers are excellent (CSP, HSTS preload, DENY frames). Minor gaps: missing base-uri, object-src, form-action in CSP. Access-Control-Allow-Origin: * is unnecessary.
- **Signal**: Fetch any page and check response headers.
- **Action**: Fast-track security — consistently strong. Only check if CSP gaps are fixed.
- **First seen**: 2026-03-13
- **Confidence**: High

## Dependencies
- **Learning**: 0 npm audit vulnerabilities, minimal production deps. React 18, Vite 6, Tailwind 3 are all one major version behind but stable. lucide-react is significantly outdated (0.468 vs 0.577).
- **Signal**: Run `npm audit` and `npx npm-check-updates`.
- **Action**: Check if major upgrades have been done. Not urgent but plan for React 19 migration.
- **First seen**: 2026-03-13
- **Confidence**: Medium

## Low-Signal Dimensions (fast-track next time)
- **Mobile & Responsive**: 9/10, PWA-first design, unlikely to regress
- **Failure Resilience**: 8/10, comprehensive error handling, unlikely to regress
- **i18n**: 8/10, full Hebrew support, system is stable
- **Privacy**: 8/10, local-only data with consent flow, unlikely to change

## High-Signal Dimensions (extra scrutiny next time)
- **SEO**: The indexing gap is the #1 business problem
- **Trust Signals**: #1 conversion barrier
- **Observability**: #1 ops risk (blind to production errors)
- **Business Model**: No revenue path = sustainability risk
- **GEO**: Zero AI engine presence, growing importance
