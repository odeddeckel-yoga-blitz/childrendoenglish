# CDE audit B: SEO, GEO, privacy, copy, trust, i18n (2026-11-18)

Read-only. Sources: GSC Search Analytics (28d/90d to 2026-11-16, own scratchpad script, no tracked-file writes), GSC URL Inspection (10 named URLs), Bing Webmaster (bing_query.py, 89d), Neon `cde_land`/`cde_learn` SELECTs (AI share), live GET of 28 URLs + sitemap/robots/llms*. Live HEAD = 386e4e2 (11-18 06:00Z push).
Raw data: `scratchpad/audit/data/gsc_*.json`, live HTML in `scratchpad/audit/live/`.

## Scores

| # | Dimension | Score | One-line verdict |
|---|---|---|---|
| 6 | SEO | **7/10** | Indexing is healthy and clicks grew 14 → 189 a week. Word pages earn 0.3% CTR, the he head terms sit on page 4, and privacy/terms are SPA duplicates of home. |
| 7 | GEO / AI engines | **6/10** | ChatGPT is still about 20% of arrivals. llms.txt is stale and contradicts the privacy policy. |
| 12 | Privacy & compliance | **7/10** | Data minimisation is excellent and the email capture is gone. There is no crawlable or localized policy page, Sentry may be blocked by the CSP, and the IP toggle is still owed. |
| 14 | Content & copy | **6/10** | en/es copy is solid. The he landing page has a grammar error and out-of-date stats, and the static shell lists words that don't exist. |
| 15 | Trust signals | **6/10** | The maker is named in the first person, but below the fold, with no face, date or localization. llms.txt still says "no data collection". |
| 22 | i18n / l10n | **6/10** | RTL is correct and the key sets match. The he footer is in English, Hebrew-twin pages are `lang=en`, the es section is a single URL, and about/privacy/teachers exist in one language each. |

---

## 6. SEO — 7/10

**Traffic (GSC):** 28d: 528 clicks / 21.5K impressions. 90d: 697 / 28.5K. Weekly clicks: wk42 77, wk44 112, wk45 164, wk46 189, so roughly 13× the September level. Countries (28d): ISR 323 clicks (61%), USA 59, ESP 17, MEX 15. Desktop CTR 3.1% vs mobile 1.7% (mobile position 8.9, desktop 17.6).
Bing 89d: 170 clicks / 13.7K impressions. /es/ is Bing's #2 page (683 impressions, pos 4.9, 2.5% CTR).

**Page classes (28d):**

| class | pages | clicks | imp | CTR | pos |
|---|---|---|---|---|---|
| /he/ (single page) | 1 | 160 | 1381 | 11.6% | 9.9 |
| vocab category + age pages | 9 | 64 | 2164 | 3.0% | 8.5 |
| /printable-flashcards/* | 37 | 63 | 1612 | 3.9% | 10.8 |
| home | 3 | 60 | 172 | 34.9% | 5.0 (brand) |
| /he/grade-* | 6 | 52 | 851 | 6.1% | 15.7 |
| vocab WORD pages | 286 | 7 | 7966 | **0.1%** | 13.9 |
| vocab category /spanish/ twins | 10 | 24 | 3733 | 0.6% | 17.1 |
| vocab category /hebrew/ twins | 10 | 8 | 950 | 0.8% | 10.3 |
| /units/* | 13 | 28 | 393 | 7.1% | 8.5 |
| /he/english-games/* | 14 | 33 | 1043 | 3.2% | 15 |
| /he/english-words/* | 6 | 6 | 1213 | 0.5% | 12–37 |
| /guides/* | 1 | 12 | 348 | 3.4% | 11.0 |
| /band-1/* | 32 | 10 | 248 | 4.0% | 16.1 |
| /games/* | 8 | 1 | 110 | 0.9% | 24.2 |
| /es/ | 1 | 0 | 51 | 0% | 17 |

Pages that earn clicks: /he/, the age pages (ages-6-8 34 clicks, ages-9-10 25), printable flashcards, /he/grade-*, units.
Pages that don't: the 286 word pages (37% of impressions, 1% of clicks), the Spanish category twins, /he/english-words/, /games/ and /es/ on Google.

🔴 Critical
- None blocking.

🟡 Warnings
- **/privacy and /terms are SPA-only routes** (vercel.json:43, :75 rewrite to `/`). They serve home's `<title>`, home's H1 and `canonical=https://childrendoenglish.com/`, so no crawlable privacy policy exists, in any language. robots.txt disallows /terms but not /privacy.
- **Uniform `<lastmod>`.** All 768 sitemap URLs show 2026-11-18 (scripts/generate-sitemap.js:69). LEARN.MD flagged this in July and it is still open, so the freshness signal is meaningless.
- **Zero-impression URLs:** 313 of 768 sitemap URLs had no impressions in 90d. 270 are word pages, plus 11 games, 5 guides, 5 flashcard pages, /teachers/ and /about/.
- **he head terms on page 4.** /he/ ranks 41 for "לימוד אנגלית לילדים במחשב" (147 imp) and 36 for "אנגלית לילדים" (142 imp). This is a ranking problem, not a title problem.
- **/he/grade-N/ title mismatch.** These pages rank 9–10 for "משחקים באנגלית לכיתה ג/ד/ה" (~400 imp in the cluster, 11 clicks), but their titles say "אנגלית לכיתה ד׳ — מילים, תרגול ומשחקים".
- **Spanish category twins have English-first titles** ("Colors in Spanish and English — Vocabulario bilingüe…"). They draw English speakers searching "colors in spanish" (pos 60, wrong audience) and rank only 10–17 for the real query "colores en inglés y español".
- **Home has two `<h1>`s** (static shell plus noscript, index.html:252). Minor.
- **hreflang:** /he/english-games/ sets `en` → `/`, which is not an equivalent page. Hebrew-twin pages are `<html lang="en">` but sit in the `he` hreflang slot (see §22).

🟢 Working
- URL Inspection: 10 of 10 named URLs are "Submitted and indexed". That includes /es/, /he/grade-4/, /he/english-words/numbers-1-100/, /teachers/, /units/jet-2/unit-3/, /printable-flashcards/animals/hebrew/ (never crawled in July), /vocabulary/animals/ (crawled-not-indexed in July), /games/sentence-builder/, /vocabulary/colors/spanish/ and /band-1/.
- JSON-LD: FAQPage, BreadcrumbList, DefinedTerm on word pages, HowTo on printables, WebApplication+Offer+EducationalAudience on home, /he/ and /es/. The home/he/es hreflang triangle is reciprocal.
- The only ghost URLs (apron, crayon) 308 to live pages.
- The /he/ title win holds: 160 clicks / 28d at 11.6% CTR.

💡 Actions
1. Ship static `/privacy/` (plus he/es variants) and `/terms/` pages from generate-seo-pages.js with self canonicals. Keep the SPA routes rendering the same text.
2. Retitle /he/grade-N/ to "משחקים באנגלית לכיתה ד׳ — חינם, בלי הרשמה" and put that grade's games above the fold.
3. Put Spanish first on Spanish twin and Spanish flashcard titles (scripts/generate-seo-pages.js, spanish-twin title builder): "Colores en inglés y español para niños — …".
4. Emit a real per-page `lastmod` (word or data mtime, or git date) in scripts/generate-sitemap.js:69.
5. Accept that word pages are zero-click (see the memory note on pasta and title verdicts). Use them as internal-link donors to the converting hubs (age pages, /he/grade-*), not as a click target.

---

## 7. GEO / AI answer engines — 6/10

**Does ChatGPT ≈ 20% still hold? Yes.** From the Neon `cde_land` beacon, 28d, internal traffic excluded: ai 591 / (direct 1327 + seo 953 + ai 591 + external 22) = **20.4%**.
- Human-confirmed opens since the 11-13 bot filter: hum@ai 90 of 357, or **25%**.
- By engine (aie): chatgpt 465, gemini 6, perplexity 2. ChatGPT is 98% of AI traffic, and 72% of those arrivals stayed 5 s (aiv 336/465).
- AI landings: games en 95, other 83, home en 81, **spanish es 79**, hebrew he 61, flashcards es 58, flashcard-maker tool 58, units 24.
- Trend: weekly AI arrivals were 144 → 216 → 174 → 30 (partial week). SEO arrivals were 200 → 258 → 306 → 96. **Google organic has now overtaken AI.** In July AI was larger.

🔴 Critical
- **llms.txt contradicts the privacy policy and the site** (public/llms.txt):
  - It says "No accounts, no data collection". The policy discloses anonymous totals and Sentry.
  - It says "ages 5-12" and "530+ words". The site says 6-12 and 560+ (llms-full says 563).
  - It credits "an independent developer" while /about/ names Oded Deckelbaum.
  - AI engines quote this file verbatim. This is the "zero data collection" claim the last three audits flagged, now living in the GEO file.

🟡 Warnings
- llms.txt omits the classes that earn clicks: /he/ hub, /he/grade-1..6/, /he/english-words/, /units/, /band-1/, /teachers/, /games/, Class Battle.
- llms-full.txt (352 KB, 563 words) lists Hebrew translations only. Spanish glosses are missing, even though "spanish es" is the #4 AI landing class.
- /teachers/ and /units/ have only BreadcrumbList schema, with no FAQ or answer-first block.

🟢 Working
- llms-full.txt is shipped (an open item from July).
- FAQPage and answer-first sections are on all word, category, age, he and es pages.
- /about/ has a "Facts at a glance" block that AI engines can quote: TTS disclosed, 19 games, 190 Band I words, 11 units.

💡 Actions
1. Regenerate llms.txt at build from the same counts as the pages (WORD_COUNT, game count). Name the creator, replace "no data collection" with the policy's own summary sentence, and add he/units/band-1/teachers/games sections.
2. Add `Spanish translation:` lines to llms-full.txt from word-glosses-es.js.
3. Add a 3–5 question FAQ (answer-first) to /teachers/ and /units/.

---

## 12. Privacy & compliance (COPPA/GDPR) — 7/10

🔴 Critical
- **No crawlable, no-JS or localized privacy policy** (see §6). Without JS, /privacy shows the home page. COPPA expects a clear, prominent link on the home page and every collection point.
- **The /he/ and /es/ static landing pages have no privacy link at all.** Their footer has only "אודות/Acerca de" and "English". The en home and word pages do link to /privacy.

🟡 Warnings
- **Sentry is probably blocked by the CSP.**
  - The DSN host in the live bundle is `o<id>.ingest.de.sentry.io`.
  - The CSP is `connect-src 'self' https://*.ingest.sentry.io` (vercel.json:109).
  - Under CSP3 host matching, `*.ingest.sentry.io` requires the host to end in `.ingest.sentry.io`, and the `.de.` host does not.
  - Crash reports are likely being refused silently. That is privacy-neutral but makes the team blind.
  - Verify with one forced error in DevTools (a CSP violation would show in the console). If confirmed, add `https://*.ingest.de.sentry.io`.
- **Sentry IP storage:** the owner still owes the "Prevent storing IP addresses" toggle (memory 11-17). Client-side scrubbing (src/utils/sentryScrub.js, `sendDefaultPii:false`, user deleted) cannot stop server-side IP inference.
- **The policy has no GDPR basics:** no controller postal address, no lawful basis, no rights list (access, erasure, complaint to a supervisory authority) and no processor locations (Vercel, Sentry DE). The only name is in `privacyContactDesc` (src/utils/i18n.js:286). Spain and Mexico are real audiences.
- **ePrivacy on device storage.** `cde_seen` in localStorage (public/land-beacon.js:232) and `cde_src`/`cde_acts` in sessionStorage are used for analytics counts without consent. EU Art. 5(3) covers any device storage, not only cookies. The risk is low because the data is disclosed, aggregate, and shows only a date bucket. "We set no cookies" is literally true.
- **"We comply with COPPA"** appears on /about/ (generate-seo-pages.js:3724) and in privacyCoppaDesc. It is a legal self-certification. A factual description ("we don't collect personal information from children; here is what is counted") is safer.

🟢 Working
- **Parent email capture REMOVED** (owner, 09-26), which resolves the July "undeliverable promise".
- **GA4 and the consent banner are removed** (10-30/11-01). The CSP blocks `google.com/g/collect`, and the only third-party hosts are Sentry and Vercel Analytics (same-origin `/_vercel`). No `Set-Cookie` was seen on home.
- The first player's name is optional and stays local. Class Battle nicknames come from a fixed list, rooms are deleted after ~30 min, and there are no accounts.
- The beacon reads the UA only for bot classification and never stores it. Per api/land.js it keeps no IP.
- The policy is detailed and honest in en/he/es (updated Nov 4, 2026), and the deletion path is documented.
- Sentry runs errors only, with no tracing or replay, and drops tap/console breadcrumbs and saved names (sentryScrub.js).

💡 Actions
1. Build static `/privacy/`, `/he/privacy/` and `/es/privacy/` from the i18n strings. Link them in every static footer, including the /he/ and /es/ landing pages.
2. Fix the CSP for `*.ingest.de.sentry.io` after verifying, and flip the Sentry IP toggle in the same change.
3. Add a short "Your rights / who we are" section (operator name and contact, processors, and a right to complain). This is owner and counsel copy, so it needs the owner's OK under push-method v3 (privacy copy is excluded from the standing OK).

---

## 14. Content & copy — 6/10

🔴 Critical
- None.

🟡 Warnings
- **The he landing page has a grammar error:** "הילדים אוספים תגים **ומעקבים** אחרי ההתקדמות" should be "ועוקבים" (scripts/generate-seo-pages.js:1822).
- **The he landing page has stale stats.**
  - It shows "4 סוגי חידונים · 3 רמות קושי" and "ארבעה סוגי חידונים" (generate-seo-pages.js:1780, :1802).
  - en home, /es/ and /about/ sell the 11-step ladder ("11 pasos de práctica").
  - It also says "מסלול למידה מותאם — שלוש רמות קושי".
- **The static shell overclaims** (index.html:255, :273).
  - "Available in English and Hebrew" leaves out Spanish.
  - The noscript and shell category lists name words that have no pages: desk, homework, subway, gold, money. Crawlers and AI engines read these.
- **The Hebrew-twin meta has a grammar slip:** "Learn 24 colors words in Hebrew and English" (generate-seo-pages.js:1168). It should read "24 color words".
- **Jargon:** "Progressive Web App" appears in the he and es FAQ. Parents don't know the term. "Works offline after the first visit" says the same thing more plainly.
- **Home H1 is filler.** The UI judge said "Free & Fun" reads as filler, and the "11-Step Ladder" pill isn't explained (ai-feel/judges-2026-11-18.md:13).

🟢 Working
- /es/ copy reads natural and specific: "voz generada por computadora" appears on twins, and the TTS disclosure is honest everywhere. No "native speaker" claims were found in src/scripts.
- Word pages lead with the answer (definition, he+es glosses, a quick check). /teachers/ is clear and carries the "Not connected to Eric Cohen Books" disclaimer.
- /he/ has a dedicated "במחשב, בטאבלט ובטלפון" section that matches a real query.

💡 Actions
1. Fix the he grammar and stats (generate-seo-pages.js:1780–1822) to match the 11-step ladder.
2. Regenerate the index.html shell category examples from real WORDS, and add "and Spanish".
3. Replace "Progressive Web App" with "works offline after the first visit" in he/es.

---

## 15. Trust signals — 6/10

**/about/ re-check.** The ai-feel UI judge scored it 2/5 on 11-18: "no 'who made this' on the first screen".
The maker is named: "built and maintained by me, Oded Deckelbaum — a software engineer and parent…". There is Person JSON-LD, the KidsDoMath cross-link and info@ only. But all of this sits at the bottom, after a template mission/how-it-works block and a 0-image page.

**"Zero data collection" re-check (the July repeat offender):**
- index.html "Zero ads, zero data collection": **FIXED**.
- About and its FAQ: now say "no cookies, and we collect no personal data… anonymous counter… anonymous crash reports" (generate-seo-pages.js:3607, :3724). This is **acceptable and qualified**.
- **public/llms.txt: STILL "No accounts, no data collection"**. Still open, now on the GEO surface.

🔴 Critical
- The llms.txt claim above. AI answers will repeat it to parents.

🟡 Warnings
- The maker isn't visible on the first screen of /about/ or home. There's no photo or illustration, no "since 2026" or update date, and no reason "why me / why free". The about page has 0 images.
- /about/ exists only in English. The /he/ and /es/ footers link to the English page, though 61% of clicks are Israeli.
- The "We comply with COPPA" self-claim (see §12).
- There's no visible "how we choose words / images" note, even though /image-credits/ exists.

🟢 Working
- Contact is info@ only on every page checked. TTS is disclosed ("computer voice", "Piper"). There are no testimonials.
- The ECB non-affiliation line is on /teachers/.
- It's free, with no ads and no sign-up, and the copy says so consistently.

💡 Actions
1. Move a two-line maker card (name, role, parent, why free) to the top of /about/ and into the home/he/es footers. Add a localized /he/about/ and /es/about/.
2. Add "Last updated" and a short "How words, pictures and audio are chosen" section with a link to /image-credits/.

---

## 22. i18n / l10n — 6/10

🔴 Critical
- None.

🟡 Warnings
- **The /he/ footer mega-menu is mostly English.** It shows "Flashcard maker (free tool)", "All flashcards", "Animals…Toys", "All games", "Practice app", "Free practice — no sign-up", "Parent guides", and Spanish labels. This is on `<html lang="he" dir="rtl">`. The /es/ footer leaks two English labels.
- **Hebrew-twin category pages** (/vocabulary/*/hebrew/) have English chrome and `<html lang="en">`, but are the `he` hreflang alternate. They also mix in Hebrew strings ("משחקים ב- Word Zapper עם המילים האלה") without a dir wrapper. Either localize them for Hebrew parents or drop them from the `he` hreflang slot (/he/english-games/<topic>/ is the real Hebrew page).
- **Locale coverage gaps:**

  | page type | en | he | es |
  |---|---|---|---|
  | landing | ✅ | ✅ | ✅ |
  | games hub + age/topic | /games/ | ✅ 17 pages | ❌ |
  | grade pages | — | ✅ 6 | ❌ |
  | topic word lists (days, months, family, numbers, ABC) | ❌ | ✅ 5 | ❌ |
  | units / teachers | /teachers/ en only | /units/ he only | ❌ |
  | about / privacy (static) | about only | ❌ | ❌ |
  | category twins | — | en-chrome | ✅ localized |

  The sitemap has exactly one `/es/` URL. Spanish demand lands on the /vocabulary/*/spanish/ and /printable-flashcards/*/spanish/ twins. (The brief's "/spanish/" section does not exist: /spanish/ is a 404.)
- **Hardcoded English a11y strings:**
  - index.html:220 "Skip to content"
  - Menu.jsx:127 `aria-label="Main menu"`
  - LanguagePicker.jsx:42 "Choose language"
  - LandingPage.jsx:158 "No"
  - ProfilePicker.jsx:56 "Close"
  - This was flagged in July and is still open.
- **ar** is scaffolded (LANGS `ready:false`, i18n-ar.js has 0 keys) and correctly hidden from the picker. GSC shows 214 Arabic impressions (90d) on word pages. That is not actionable until AR is ready.

🟢 Working
- The /he/ pages are `lang="he" dir="rtl"` and the /es/ pages `lang="es"`. Key parity: en 492 / he 485 / es 485. The only difference is 4 meta keys plus the `ar` scaffold, so no UI keys are missing.
- The policy is fully translated, and /es/ and the Spanish twins read natural.

💡 Actions
1. Localize the static footer per page language (one dictionary in generate-seo-pages.js).
2. Localize the five aria-labels and "Skip to content" through `t()` or per-page strings.
3. Decide on the Hebrew twins: either make them Hebrew pages, or set `lang="en"` and point the `he` hreflang to /he/english-games/<topic>/.

---

## Unserved demand (queries CDE already gets impressions for, few or no clicks)

GSC is 90d unless marked Bing (89d). Counts are impressions.

| # | Demand cluster | Evidence | Current page / gap |
|---|---|---|---|
| 1 | **he head terms "אנגלית לילדים"** | "לימוד אנגלית לילדים במחשב" 147 imp pos 41; "אנגלית לילדים" 142 pos 36; "לימוד אנגלית ילדים" 14 pos 10 | /he/ wins the "…חינם" variants (pos 3) but not the bare head term. This is a ranking/depth gap. |
| 2 | **he grade-level games and tests** | "משחקים באנגלית לכיתה ה/ג/ד/ו" 56+55+44+43+18+11+11+8 imp, pos 5–10, ~3 clicks (80 queries, 407 imp, 11 clicks); "מבחן באנגלית לכיתה ג/ד" 7+4+4 pos 32–44; "תרגול אנגלית כיתה ג" 6 pos 24 | The /he/grade-N/ titles say "אנגלית לכיתה". There is no per-grade games list and no per-grade quiz or test page. |
| 3 | **he "games" generic** | "משחקים ללימוד אנגלית לילדים" 41 pos 33; "משחקים באנגלית לילדים" 17 pos 40; "משחקים באנגלית" 15 pos 67 (35 queries, 332 imp) | The /he/english-games/ age pages rank 44–58. The hub ranks for "…חינם" only. |
| 4 | **he topic lists** | "מספרים באנגלית" 47 pos 27; "צבעים באנגלית" 20 pos 24 + "לימוד צבעים באנגלית" 13 pos 19; "אותיות באנגלית" 14 pos 25 | /he/english-words/numbers-1-100/ and /abc/ are page 3. There is no he colors list page (only the games page). |
| 5 | **he single-word lookups** | 426 queries, **2,251 imp, 1 click**, avg pos 13: "שטיח באנגלית" 106, "עגלה" 90, "אוהל" 53, "קורקינט" 50, "כיתה" 44, "משאית" 36, "ריבה" 34… | Served by English-chrome word pages. Mostly zero-click translation intent; a Hebrew-chrome answer ("איך אומרים X באנגלית") is the only lever. |
| 6 | **es "learn English for kids"** | Bing: "aprendiendo ingles para niños" 41 pos 6.7, "ejercicios de vocabulario en inglés" 33 pos 6.2, "inglés para niños gratis" 16, "vocabulario en inglés para niños" 14 (all 0 clicks). GSC "diccionario en ingles para niños" 19 pos 46; all es queries 117 queries / 262 imp / 0 clicks, avg pos 39 | /es/ is the only es URL. There's no es exercises page, no es age/grade pages and no es games hub. |
| 7 | **es printable cards** | "tarjetas en ingles" 16 pos 46; "tarjetas de vocabulario en ingles" 14 pos 46; "tarjetas de deportes para imprimir" 7 pos 6; "emociones en inglés para imprimir" 3; "flashcards de numeros en ingles para imprimir" 3 | The /printable-flashcards/*/spanish/ titles and the hub are English-first. |
| 8 | **en vocabulary by age** | "vocabulary words for 10 year olds" 39 pos 35; "words for 6 year olds" 38 pos 6.6; "vocabulary for kids" 25 pos 39; "vocabulary words for 6 year olds" 20 pos 6; "vocabulary for 8 year olds" 14 pos 7; "…8 year olds with meaning" 13 (34 queries, 219 imp, 4 clicks) | Only the bucketed ages-6-8/9-10/11-12 pages exist. There are no per-year (7/8/10-year-old) lists. |
| 9 | **en activities and guides** | "english activities for kids" 140 pos 12 (3 clicks); "activities for kids in english" 24; "activities for kids to learn english" 22; "english activity for kids" 12 (32 queries, 301 imp, pos 11.7) | The /guides/english-learning-activities-for-kids/ page sits in the page-2 band. Bing: "why should kids use matching words…" 89 imp pos 4–5, 0 clicks. |
| 10 | **"X for kids" definitions (feelings)** | Bing: "define curious/brave/nervous/confused/calm/shy for kids" ~161 imp pos 4.6–6, 0 clicks. GSC "meaning for kids/definition" 220 queries, 804 imp, 2 clicks, pos 22 | Word pages rank, but the snippet doesn't earn the click. A feelings-for-kids list page ("feelings words for kids with meanings") is the aggregator people click. |

Also seen, lower priority or constrained:
- en printable flashcards: "printable flashcards" 16 pos 37, "english flashcards for kids" 10 pos 56.
- "online sentence builder for children" 13 pos 30 (new game, 11-08).
- "band 1 מתורגם" / "band 1 words" 6+5 pos 22–39. Under the owner's rule this can only be our own mapped words, never the list.
- "חוברת אנגלית jet 1" 4 pos 43. ECB content can't be copied, so this is unit word pages only.
- "X in spanish" from English speakers: 169 queries, 709 imp, pos 43. This is an adjacent audience (learning Spanish), not the product, so don't chase it.
- Arabic "X بالانجليزي": 214 imp. AR is not ready.

---

## LEARN.MD (07-17) items: status

| Item | Status 11-18 |
|---|---|
| Sitemap auto-gen | ✅ 768 URLs (was 397) |
| Uniform build-date `<lastmod>` | 🔴 **OPEN**: all 768 = 2026-11-18 (generate-sitemap.js:69) |
| /printable-flashcards/* and hebrew pages never crawled; /vocabulary/animals/ not indexed | ✅ FIXED: all indexed in the 11-18 inspection |
| GSC API access | ✅ FIXED (works; this audit used it) |
| GA4 quit-guard / GA on static pages / missing events | ✅ SUPERSEDED: GA4 removed 10-30. The cookieless beacon covers static pages and the quit path (useQuizFlow.js:127,160) |
| "Zero data collection" trust copy (3× flagged) | 🟡 MOSTLY FIXED: index.html and about are qualified. **llms.txt still says "no data collection"** |
| Sentry not consent-gated | ✅ RESOLVED BY DESIGN: errors only, scrubbed, disclosed, no consent banner needed. New issues: IP toggle owed, CSP probably blocks the `.de.` ingest host |
| Parent email capture undeliverable | ✅ FIXED: removed 09-26 |
| Privacy policy text | ✅ Detailed in en/he/es. 🟡 NEW: SPA-only, not crawlable, no he/es landing link, no GDPR rights section |
| CLS 0.325 | ✅ FIXED → 0.036 (memory 09-26; not re-measured here) |
| analytics.js unguarded localStorage | ✅ FIXED: analytics.js is now no-op stubs |
| llms-full.txt 404 | ✅ FIXED (352 KB, 563 words). 🟡 has no Spanish glosses |
| GEO: ChatGPT ~20% of sessions | ✅ HOLDS: 20.4% of external arrivals (28d), 25% of human-confirmed. Google organic now larger |
| Comparison tables in guides | ✅ shipped 07-17 (memory) |
| a11y: hardcoded "Skip to content" / aria-labels | 🔴 **OPEN** (index.html:220, Menu.jsx:127, LanguagePicker.jsx:42, LandingPage.jsx:158, ProfilePicker.jsx:56) |
| Onboarding dead code, eslint outside src, npm audit, retention/ESP | ⚪ Not re-checked (outside this audit's dimensions) |
