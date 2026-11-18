# Grammar pilot for learners: plan (draft 11-17, nothing built)

Owner "Ok" 11-17 covers this plan only. The build waits until after the 11-28 freeze and needs its own owner go. Each push also needs a per-push OK.

## Who and why

The audience is Hebrew- and Spanish-speaking kids, about 8–12, who are learning English. These are CDE's existing he/es users; en pages are a lean extra (owner 11-17, via Factory). The plan is **not** the dropped 11-03 wing (20 games for English-speaking kids).

Demand comes from Factory's free autocomplete check (`site-factory/briefs/grammar-learners-2026-11-17/autocomplete-raw.json`). Each figure is suggestions per seed, out of 10:

| topic | es | he | en "… game for kids" |
|---|---|---|---|
| prepositions | 10 (preposiciones … niños; pdf, juegos) | 10 (מילות יחס; לכיתה ד/ה, wordwall) | 10 |
| pronouns | 10 (pronombres … niños; primaria, pdf) | 10 (כינויי גוף; לכיתה ה, להדפסה) | 10 |
| past simple / tenses | 10 (pasado simple ejercicios; pdf, online) | 10 for זמנים, 2 for זמן עבר | 10 |
| irregular verbs | 10 (juegos, interactivo) | 1 | 8 |
| present perfect, conditionals | 10 / 10 (ejercicios) | 2 / 3 | 3 / 10 |

What the table shows:
- **es is the strongest.** People ask for *ejercicios*, *pdf* and *juegos*.
- **he is school-shaped.** Searches add a grade (כיתה ד/ה/ו) plus "practice" or "to print".
- **en is strong but crowded** (see below).

## Search results check (top 3 topics, 11-17)

The search tool is US-based, so the Hebrew results were English sites. This is **not** a real Israeli Google result. A real check is needed before the build.

- **Prepositions.**
  - es: Lingokids pages and a video, apps, gamestolearnenglish and anglomaniacy (English-only), Scribd PDFs. No free game with a Spanish explanation that a kid can use.
  - en: crowded. Lingokids, games4esl, Classroom Secrets, Workybooks, Teach Starter, several apps, roundup blogs.
- **Pronouns.**
  - es: Lingokids and Studycat for kids. Otherwise adult-level (Berlitz, Cursa, EF) or an encyclopedia (Kiddle).
  - he (English sites): english-grammar.app, learnenglishfeelgood, British Council, lingua.com worksheets. All are adult or ESL level, with no Hebrew.
- **Past simple** (es): adult or teen exercise blogs (Todamateria, Ejercicios Inglés Online, Salón de Idiomas, QuillBot, Scribd PDFs). Nothing at kid level, and no game.

**What this means:** the opening is **a kid-level game plus a printable sheet with the explanation in Spanish or Hebrew**. Lead with es, then he. en gets lean pages only (see "English pages where the results are crowded").

## Decisions relayed by Factory (11-17); to confirm here at the build go

The owner gave these in the Factory session. A peer relay is not an approval in this session, so the owner re-confirms them here when giving the build go.

1. **Languages:** all CDE languages that are live, which today means **en, he and es**. Arabic stays out while it is `ready:false` and joins when its strings land.
2. **Games:** start small with **3 games**: prepositions of place, pronoun swap and past simple. Irregular pairs and the sorter make up wave 2, built only if wave 1 reads well.
3. **URLs:** `/es/gramatica/<tema>/`, `/he/<נושא>/` and the en equivalent `/grammar/<topic>/`. Each game lives at `/games/<slug>/`.
4. **Real Israeli search check:** GO, before the build (free). Status below.

## English pages where the results are crowded

The English search results are crowded, and English-speaking kids are not this pilot's audience. So en gets the games and lean topic pages, with no extra search effort:
- **Games:** indexable at `/games/<slug>/`, with plain "<topic> game for kids" titles. This is the long tail that autocomplete shows (10/10).
- **Topic pages:** `/grammar/<topic>/` is short: the rule in English, the game and the worksheet. No title tests, no Google pings beyond the normal deploy ping, and none of the effort that goes to he/es.
- **Kill rule:** if an en topic page gets under ~20 impressions by week 4, set it to noindex and keep the game.

## Israeli search check (11-17 status)

- **CDE's own Google data** (Search Console, Israel, 08-17 → 11-15): 719 queries and 4,066 impressions. Only **1 grammar query**, "דקדוק באנגלית לכיתה ה", with 1 impression at position 25. Spain and Mexico have 0. So CDE has no grammar footprint yet: the pages would start from zero.
- **The real Israeli Google results** (owner's Chrome, google.co.il, hl=iw, gl=il, non-personalised; 11-17). Each search showed 7 organic results, plus a video block on the first:
  - **מילות יחס באנגלית תרגול:** i-fal (11 exercises + answers), safotsheli, english-online.co.il, **wordwall**, a school Google Site, Berlitz (list of 257), **popy** (grade 3 review sheet).
  - **כינויי גוף באנגלית לכיתה ה:** **karnafim** (grade 5 practice, He/She/It…), sharoni.net, topenglish, speakingenglish, **kanlomdim** (grade 5 materials), english-c, **wordwall**.
  - **זמן עבר באנגלית:** limudnaim, safotsheli, jpostlite, newschool (table of 12 tenses), he.wikibooks, Berlitz, topenglish.
- **What it means for he:**
  - The results are **Hebrew articles from tutoring and language-school sites**, plus grade-level school material (karnafim, kanlomdim, popy).
  - **The only interactive option is wordwall**: one-off teacher-made activities, not a designed kid game.
  - Nobody ranking combines **a kid game, a short Hebrew rule and a printable sheet on one page**. That combination is the opening.
  - Expect a slow climb: the competitors are long-standing Hebrew sites, and CDE has 1 grammar impression so far.
  - The grade framing matters (לכיתה ד/ה/ו in queries and in ranking titles), so the he topic pages should name the grade.
  - Past simple is the most article-heavy of the three. Prepositions and pronouns, which already show school worksheets and wordwall, fit a game best, so lead with those two.

## What to build (after 11-28)

Wave 1 is games 1–3. Games 4–5 are wave 2, built only if wave 1 reads well. All use the existing CDE game shell.
1. **Where is it?** Prepositions of place: in, on, under, behind, next to, between. The kid taps where the object is in a simple scene.
2. **Pronoun swap.** Replace the noun in a sentence with the right pronoun: subject pronouns first, object pronouns at level 2.
3. **Yesterday I…** Past simple: regular -ed and was/were. The kid picks the right form to finish a short sentence.
4. **Went, ate, saw.** Irregular verb pairs (go→went), using the word-memory pairs mechanic.
5. *(optional)* **When did it happen?** Sort sentences into yesterday, now and tomorrow. This is the bridge to tenses.

Each game also gets:
- **A printable worksheet with an answer key**, built through the existing `scripts/build-worksheets.mjs` (currently held: noindex, unlinked). The Hebrew sheets carry a grade label (כיתה ד–ו); the Spanish ones say *primaria*.
- **A short explanation in each language** (3–5 lines, with examples). Hebrew uses the gender-neutral plural, as in the "ברוכים השבים" fix.
- **English sentences read by TTS.** The page never claims a native speaker or a recording.

## Kit gaps (from the 11-03 plan, still open)

- a sentence-token tapper;
- an ambiguity gate, so no item has two right answers (e.g. *on/at the corner*);
- TTS for whole sentences;
- explanation blocks for he/es pages.

## How we'll know (read about 4 weeks after launch)

- **Primary:** Google + Bing impressions on the es/he topic pages, and opens per game.
- **Engagement:** any-action per game open, compared with the vocabulary games.
- **Kill rule:** under ~50 impressions per topic page by week 4 → stop at 4 games and leave them up, with no new topics.
- Add the read to `reads.jsonl` with lane `content`. It locks only its own new pages.

## Translation check cost (consensus run, report-only)

For wave 1, each language has about 3 explanations, 3 worksheet instruction sets and about 40 game strings. That is roughly 2 chunks of 60 keys at the measured ~$0.79 per UI chunk.

| language | what's checked | est. cost |
|---|---|---|
| en | source text, no translation run | $0 |
| he | 3 explanations + worksheets + game UI | ~$1.60 |
| es | the same | ~$1.60 |
| **wave 1 total** | | **~$3.20** |
| ar (later, when ready) | the same | ~$1.60 |

This is far under the $20 batch threshold and the $25 per day cap. I'll still check the model and name the cost before the run. Wave 2 adds about $1.60 per language.

## Owner decisions still open

1. **At the build go:** confirm the 4 relayed decisions above in this session.
