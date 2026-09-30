# Multi-language Learner Support — ES + AR (plan, 2026-09-30)

**STATUS: Phases 1+2 SHIPPED 2026-09-30 (ES in-app + SEO surface + lang-aware measurement). PHASE 3 (ARABIC) ON HOLD — owner decision 2026-10-01. Do not start AR work (strings, glosses, RTL pages) until the owner explicitly un-holds it; the ES measure-gate results (Oct 10 peek / Oct 20 full) inform that decision but do NOT auto-start AR. The ar scaffolding (LANGS entry ready:false + stub files) stays in place — it is inert.**

Owner decision basis: expansion research — AR: "translate this page" tell, no interactive
product in "English words for kids with pictures" space (Pinterest/PDF blogs only).
ES: game head-terms locked (Árbol ABC) but vocabulary-with-pronunciation and
photo-flashcard clusters have no interactive product. ES first (zero-risk LTR test of
the scaffolding), AR immediately after. Audio stays English — native pronunciation IS
the product. Risks noted: YouTube absorbs "gratis/مجاني" intent; Arabic keyword
orthography fragments across spellings.

## 0. Traffic grounding (GSC 90d, 1,594 imp — small but directional)

- Anglophone core: USA 52% + GBR 12% + CAN 4.5%. ISR 8.4% (Hebrew UI already serves it).
- **Arabic-region: ~5% and ranking WELL** — UAE 2.9% @ pos 8.3, Egypt 2.2% @ pos 11.9.
  Good positions with no Arabic surface = the "translate this page" tell in our own data.
- **Spanish beachhead anomaly: Guatemala is the site's best-converting country** —
  29 imp, 20 clicks (69% CTR) at pos 2.4. Step 1 of WS3 investigates WHICH page/query
  ranks there; that page is the seed for the ES surface.
- Later-candidate signal (don't build yet, but WS1 must make language #5 cheap):
  Vietnam 3.0%, Bangladesh 2.2%, Iran 1.3% @ pos 6.9 (Farsi RTL — reuses AR work).

## 1. Architecture decisions (decide once, before any code)

- **Interface languages**: en, he (exist) + es, ar. `isRTL()` gains 'ar'. Hebrew RTL
  work transfers wholesale.
- **Glosses, not translations**: the 480 words each get `es` + `ar` kid-level glosses.
  Storage: lazy per-language modules `src/data/word-glosses-es.js` / `-ar.js`
  (mirrors the `loadHebrew()` lazy pattern — keeps the main bundle flat), NOT new
  fields in words.js. `hebrewTranslation` stays for compat; a `gloss(word, lang)`
  helper unifies access and is the single refactor point for components.
- **i18n strings**: `i18n-es.js` / `i18n-ar.js` (~500 keys, mirror i18n-he.js);
  generalize `loadHebrew()` → `loadLocale(lang)`.
- **Games**: DOM chrome strings only (start/hint/score labels via ?lang= or
  localStorage) — game CONTENT stays English by design, and this deliberately keeps
  **Arabic out of canvas text** (canvas has no Arabic shaping; DOM does).
- **Arabic orthography**: target the 2-3 common spellings in page COPY and meta
  (not the URL), per the research note.

## 2. Workstreams (ES fully shipped before AR starts)

### WS1 — i18n scaffolding + language selection [opus core, ~1 session]
1. [opus] `loadLocale()` generalization; 4-way lang state in App.jsx; per-lang
   `<html lang>`, meta, og:locale; PWA manifest name per lang.
2. [opus] **Home-page language selection, simple**: replace the current 2-button
   (EN/HE) hero grid with a 4-tile grid — flag + native name ("Español", "العربية"),
   one tap starts in that language. Top-bar toggle becomes a small popover listing
   all 4. A one-time non-blocking suggestion banner if `navigator.language`
   starts with es/ar ("¿Prefieres español?") — browser signal only, no geo-IP,
   dismiss = remembered.
3. [sonnet] i18n-es.js full string file. Acceptance: a11y + e2e pass in es.

### WS2 — ES glosses for 480 words [sonnet batches + opus vetting]
1. [sonnet] Draft es gloss per word (kid-level, one word/short phrase).
2. [opus] **Gloss-collision check** (new tool step): no two words in the same
   category may share a gloss (taxi/cab-style dupes in gloss space confuse the
   reveal text). Extend word-gaps.mjs to validate gloss completeness + collisions.
3. [sonnet] Wire gloss display: LearnMode, quiz reveal, flashcards, battle-words
   regeneration (it's a GENERATED file — regenerate, its test will catch misses).

### WS3 — SEO surface per language [opus templates, sonnet content]
1. [opus] FIRST: pull GSC by country×page and identify the Guatemala page/query.
2. [opus] `/es/` landing + per-category `/vocabulary/<cat>/spanish/` bilingual list
   pages (mirror the existing `/vocabulary/<cat>/hebrew/` pattern) + ES guide page
   ("vocabulario en inglés para niños con fotos y pronunciación"). NO per-word ES
   pages yet (480×2 thin-dupe risk) — category lists carry the intent.
3. [opus] hreflang cluster: en/he/es/ar alternates on landing + category pages;
   og:locale per page; sitemap sections per language; llms.txt gains ES/AR lines.
4. [sonnet] **Bilingual real-photo printable PDF packs** (dominant intent match):
   extend existing /printable-flashcards/<cat>/ with `?lang=es|ar` caption variant
   + print CSS; one indexable landing page per language for the packs.
5. AR repeat of 2-4 with RTL layout + orthography-variant copy.

### WS4 — Measurement: language-aware beacons + optimizer [opus, kit-first]
1. [opus] `cde_land` + `cde_learn` gain a `lang` column (Neon migration; beacon
   batch adds `l:`; api/land.js whitelist `en|he|es|ar`). Backfill not needed —
   old rows read as 'en'-era.
2. [opus] **SEO optimizer (kit v1.3): per-language×country flow section** —
   impressions/clicks by country-group (anglo / IL / AR-region / ES-region) vs
   interface-language usage from cde_land, so "AR-region impressions up but ar-UI
   sessions flat" is visible = the localization isn't landing. Rewrite-verdict and
   CTR sections gain a `/es/`+`/ar/` page-prefix split. KIT FIRST, then sync (CI
   drift gate). kidsdomath picks it up on its next kit sync — confirm-first rule.
3. [opus] Learning optimizer: split hardest-words by interface lang — a word hard
   ONLY under one language = gloss problem, not image/audio problem (extends the
   amber lesson: diagnose the right layer before polishing assets).

### WS5 — Word pipeline gates [sonnet]
- build-word-data / word-gaps: FAIL when a word lacks es/ar gloss (generation-time
  gate, same doctrine as the voice audit — reactive optimizers can't see new words).
- Word-add playbook doc: new word = en entry + he/es/ar glosses + image sole-answer
  + audio audit, in one batch.

### WS6 — Games chrome [sonnet, after WS1]
- 3 arcade games read lang, localize DOM chrome strings (~15 strings each);
  playthrough harness + real-input probe re-run per game; g_lvl/g_cmp beacons
  carry `l:` from WS4.

## 3. Additions you might have missed (my suggestions)

1. **Gloss-collision metric per language** (WS2.2) — the sole-answer metric has a
   twin in text space once glosses exist.
2. **Images must stay text-free** — audit the SVG illustrations for baked-in
   English letters (map, calculator-style words) before AR ships; text-free images
   are what make the catalog language-portable.
3. **Guatemala first** (WS3.1) — the data says an ES beachhead already exists;
   find it before writing new pages, and seed ES copy from whatever query it ranks for.
4. **Farsi is nearly free after AR** (RTL + the same scaffolding; Iran already at
   pos 6.9) and Vietnamese after ES — WS1's real deliverable is "language #5 in
   ~2 sessions". Don't build them now; don't preclude them either.
5. **Privacy/terms pages**: keep legal text English with a translated one-line
   summary + link, pending the counsel check already on the owner list — don't
   machine-translate legal wording.
6. **Gloss audio is deliberately OUT of scope** (English audio is the product), but
   note the open question: AR/ES pre-readers can't read the gloss either — the
   image carries meaning, same assumption Hebrew already makes. Revisit only if
   the WS4 language-split funnel shows ar/es listen-mode completion lagging.
7. **SW/PWA**: lazy locale modules + gloss modules need runtime caching entries
   (same pattern as word-audio); bump caches on ship.
8. **In-app search** should match glosses in the active language (search "perro"
   → dog) — one-line addition to the search filter once `gloss()` exists.

## 4. Order & effort

| Phase | Scope | Est. |
|---|---|---|
| 1 | WS1 + WS2 (ES end-to-end in-app) | 2 sessions |
| 2 | WS3 ES surface + WS4 beacons/optimizer | 2 sessions |
| 3 | AR: strings+glosses+RTL pages+orthography copy | 1.5 sessions |
| 4 | WS5 gates + WS6 games chrome | 1 session |

Measure gate between phases 2→3: does `/es/` earn impressions and do es-UI
sessions appear within ~3 weeks? AR proceeds regardless (its signal is already
in the data), but a dead ES surface would change WS3-AR's shape (packs-first
instead of pages-first).

Per standing preference: implement in a FRESH session after owner review of this
plan — do not start in the session that wrote it.
