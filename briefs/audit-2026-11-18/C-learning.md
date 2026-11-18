# C — Learning design & product strategy audit: Children Do English (2026-11-18)

Owner question: **"What else can we do to offer more to help advance children's English learning?"**
Read-only audit. I made no repo writes and no paid calls. Sources: the repo (src/data, src/components, src/utils, public/games, scripts/build-*, dist/ build of 11-17), briefs/, plans/, site-factory briefs, CDE memory, src/data/cde-stats.json (the 28-day window to 11-18), the live site via curl, and the official Cambridge and Israeli Ministry of Education PDFs.

---

## 1. Inventory: what exists today

### Words (src/data/words.js): 563 app words
| category | beginner | intermediate | advanced | total |
|---|---|---|---|---|
| everyday | 40 | 36 | 10 | 86 |
| animals | 30 | 30 | 13 | 73 |
| food | 34 | 25 | 11 | 70 |
| home | 27 | 25 | 6 | 58 |
| nature | 19 | 12 | 7 | 38 |
| toys | 12 | 19 | 4 | 35 |
| numbers | 8 | 15 | 9 | 32 |
| clothing | 17 | 9 | 5 | 31 |
| school | 12 | 12 | 7 | 31 |
| sports | 7 | 19 | 5 | 31 |
| transport | 13 | 8 | 8 | 29 |
| feelings | 9 | 10 | 6 | 25 |
| colors | 7 | 9 | 8 | 24 |
| **total** | **235** | **229** | **99** | **563** |

- **Part of speech:** 510 nouns (91%), 47 adjectives (all colours and feelings), **6 verbs** (run, read, write, cook, climb, paint).
- **Per word:** a photo (Commons, Pixabay or Fluent; source recorded), Piper TTS mp3, a definition, an example sentence and IPA.
  - The **Hebrew gloss** and the **Spanish gloss** each cover 563/563 words.
  - 340 words have enrichments (3 more sentences, a fun fact, collocations).
- **Page-only vocabulary (not in the app's picture modes):**
  - 11 textbook units (Jet 1 ×3 for grade 3, Jet 2 ×4 for grade 4, Fantastic Five ×4 for grade 5), with 648 unit-word entries;
  - 5 Hebrew topic lists (days, months, family, numbers 0–100, ABC).
  - Counting app and page words together gives **~1,020 distinct English items**.
- **Audio:** 1,020 word/phrase mp3s and 1,288 sentence clips (`/audio/s/`), with a 0.75× slow option.

### Games: 19 standalone games plus 2 classroom tools plus the in-app modes
Opens are for the 28 days to 11-18, from cde-stats.json. Wave 2 and wave 3 are hub-only until the 11-28 reads, so their opens are near zero by design.

| skill | games (opens/28d) |
|---|---|
| Listening: word → picture | Word Zapper (194), Picture Bingo (25, has a projector class mode), Shopping List (2, sequence memory) |
| Listening: sound discrimination | Sound Pairs (62; p/b, a/u, th/t, ee/i, v/w), Rhyme Time (44) |
| Phonics / decoding | Read It! (118; 10 levels: short vowels → magic e → sh/ch/th/ck), Letter Twins (19; b/d/p/q), Beginning Sounds (1), Missing Letter (122) |
| Spelling (tile-based) | Spelling Forge (147), Letter Drop (3) |
| Word meaning / categories | Category Conveyor (105), Odd One Out (15), Word Memory (74), Opposites (7; 9 pairs), Feelings (11) |
| Sentence reading / grammar-in-context | True or False (4), Sentence Builder (3), Simon Says (4; 16 action verbs as Fluent images, imperatives) |
| Classroom | Class Battle (room code, nicknames), Projector Mode (choral "say the word") |

**In-app modes:**
- LearnMode, Flashcards, ImageQuiz, AudioQuiz, ListenMatch, WordQuiz, SentenceGap and LetterFix (3 levels);
- LightningRound, DailyReview and TodayRun (a 12-word, ~5-minute SRS run, aimed at ~80% success);
- LearningPath, LetterPath, MasteryMap, PersonalWordList and WordCheck.

**Progression:**
- The 11-step learning cycle: flashcards → audio → word quiz → image quiz → conveyor → LetterFix ×3 → forge → sentence → zapper. It runs over ~57 batches of 10 words.
- **SRS:** an interval ladder of 1→3→7→14→30→60 days.
- **Motivation:** 7 badges, streaks, a mastery map, and parent reminders (browser notifications).

**Usage signal (28 days):**
- 14,317 in-app answers at 81.5% correct, and **78% of them are hear→picture** (aud 11,233 · txt 1,025 · img 652). That is overwhelmingly receptive listening.
- 1,491 game opens.

### Reading passages: 8
- The texts: my-dog, breakfast, at-the-beach, a-rainy-day, my-birthday-party, the-new-student, going-to-the-zoo, grandpas-farm.
- Each is 53–65 words, uses Band I words only, has sentence-by-sentence TTS, tap-a-word-for-**Hebrew** (no Spanish), and 3 multiple-choice questions.
- They live under /band-1/reading/.

### Printables
- **Picture flashcards:** 13 categories × en/he/es = 39 sheets (plus 3 index pages). There is also a **flashcard maker** tool.
- **Worksheets with an answer key:** 3 (opposites, feelings, action verbs).
- **Generated class sheets on every word-set page:** a bingo (4×4 cards plus a call list), a word search plus key, and a crossword with picture/meaning clues.
  - These cover the units, Band I topics and review sets, the grade pages, /he/english-words/ and the flashcard pages.
  - They have QR codes back to the site, and TSV copy for teachers.

### Static SEO page families (dist/, 769 pages)
| family | pages |
|---|---|
| /vocabulary/ | 606 (word pages, 13 category pages, 13 /spanish/ category pages, 3 age pages) |
| /printable-flashcards/ | 42 |
| /band-1/ | 36 (11 topics, 14 review sets, 8 readings, hub) |
| /he/ | 30 (english-games hub with 13 topics and 3 ages, grade-1…6, english-words with 5 topics) |
| /games/ | 20 |
| /units/ | 15 |
| /guides/ | 7 |
| /printable-worksheets/ | 4 |
| /teachers/, /projector/, /battle/, /es/, /tools/flashcard-maker, /about/, /image-credits/ | 1 each |

### Per-language coverage
| | en | he | es | ar |
|---|---|---|---|---|
| App UI | ✅ | ✅ (RTL) | ✅ | stub (`ready:false`) |
| Word glosses | n/a | 563/563 | 563/563 | 0 |
| Game chrome (l10n.js) | 19/19 | 19/19 | 19/19 | 10/19 (strings only, hidden) |
| Landing / hub pages | full | /he/ 30 pages | /es/ **1 page** + 13 /spanish/ category pages | – |
| Curriculum pages | – | Band I (36), units (15), grade-1…6 (6) | **none** | – |
| Readings: tap-for-gloss | – | ✅ | **❌** | – |
| Printables | 13 sets | 13 sets plus every unit/Band I page | 13 sets | – |

**Takeaway:** Hebrew is the deep track. Spanish has the same app and glosses, but about 27 surface pages and no curriculum, readings or grade layer.

---

## 2. Curriculum map: CEFR Pre-A1/A1/A2 (Cambridge YLE) and the Israeli Ministry of Education

### Method
- I parsed the official *Pre A1 Starters, A1 Movers and A2 Flyers Wordlists (for exams from 2018)* A–Z lists (cambridgeenglish.org, 149681-yle-flyers-word-list.pdf).
- I matched each word against CDE `word` and `id` values, then again with the unit and topic page words added.
- The parse is automated. Expect about ±3 pp: multi-word items such as "go to bed", and "bike" vs CDE's "bicycle", cause a few false misses.

### YLE coverage
| list | entries | in the app (picture words) | app + unit/topic pages |
|---|---|---|---|
| **Pre A1 Starters** | 469 | **179 (38%)** | 314 (67%) |
| A1 Movers | 372 | 73 (20%) | 197 (53%) |
| A2 Flyers | 480 | 78 (16%) | 183 (38%) |

**Starters by part of speech (app):**
| part of speech | covered |
|---|---|
| nouns | 157/262 (60%) |
| adjectives | 15/45 (33%) |
| **verbs** | **6/68 (9%)** |
| **function words** (prepositions 15, pronouns 16, possessives 7, determiners 12, question words 9, conjunctions 3, adverbs 13, exclamations 9, discourse markers 10) | **1/94 (~1%)** |

- **Missing Starters verbs (sample):** be, have/have got, can, go, come, eat, drink, sit, stand, jump, swim, throw, catch, kick, look, listen, like, love, want, would like, put, give, say, tell, spell, count, draw, colour.
- **Missing Starters adjectives:** big, small, long, short, old, new, young, good, nice, beautiful, ugly, clean, dirty, open, closed, funny, scary, favourite and others.
- **Missing picturable Starters nouns (sample):** birthday, breakfast, lunch, dinner, friend, bike, crayon, cupboard, kitten, lorry, monster, hall, handbag.
  - Some of these sit on the never-re-add list (arm, face, hair, head, leg).
  - Brother/sister and the family words are only on page lists.

### Israeli Ministry of Education, English Curriculum 2020 (Elementary)
Source: meyda curriculum2020Elementary.pdf and LexicalBand1.xlsx.

**Vocabulary bands by grade:**
- Pre Band I = grade 3 and early grade 4 (Pre-A1).
- Band I Core I = grade 4 to mid grade 5.
- Band I Core II = mid grade 5 to the end of grade 6 (A1).
- **Targets by the end of grade 6:** 1,400 receptive and 1,200 productive words (cumulative). Pre-A1 alone is 200.

**CDE's Band I coverage:**
- **190/1,252 Band I word forms are app words (15%)**: pre 26, Core I 107, Core II 57.
- **461 (37%)** are covered once unit and topic page words are added. That is 4–6× short of the grade-6 target in the app itself.

**Grammar the Ministry expects (Table 6):**
- **Grade 4, receptive:** *be* (present), Wh-questions + *be*, *there is/are*, pre-noun adjectives, imperatives, *let's*, present simple, *can* for ability, articles, present progressive, past simple (affirmative).
- **Grade 5, emerging:** possessives, past simple questions, *going to*.
- **Grade 6:** comparatives/superlatives, modals, count/non-count nouns, *will*, adverbs of manner.

**Pre-A1 can-do statements CDE does not serve at all:**
- greet and take leave, "My name's…", ask "What is it?", please/thank you/sorry (**formulaic chunks**);
- **recite a short rhyme or chant**, sing a basic song, **repeat phrases and short sentences**;
- copy and write short words and sentences (**productive writing**);
- understand classroom instructions ("Stop", "Close the door"; Simon Says covers part of this).

**At A1:**
- follow a short familiar story;
- understand times, prices and weather phrases;
- understand simple dialogues.

### Skill-by-skill map
| skill | CDE today | verdict |
|---|---|---|
| **Listening** (word level) | 78% of answers are hear→picture; Sound Pairs, Rhyme Time, Shopping List, Bingo; slow 0.75× audio | 🟢 strong |
| Listening (sentence/discourse) | sentence clips on pages; 8 readings; no dialogues or instructions beyond Simon Says | 🟡 thin |
| **Speaking / pronunciation** | **nothing in the app**; Projector choral mode only. Mic recording is owner NO (R2C11, 10-31); pronunciation grading was rejected 10-24 (privacy, 11–40% error on child voices) | 🔴 gap |
| **Reading: phonics/decoding** | Read It! (10 levels), Letter Twins, Beginning Sounds, Missing Letter. Blend It (per-phoneme audio) was dropped for good 11-14 by owner choice | 🟢/🟡 good for grades 2–4 |
| Reading: sight words / function words | ~1% of Starters function words | 🔴 gap |
| **Reading: short texts** | 8 texts, Hebrew glosses only | 🟡 thin |
| **Writing / spelling** | LetterFix ×3, Spelling Forge, Letter Drop, the Today "spell from tiles" step. All tile-based; no free typing; no sentence writing | 🟡 recognition-level spelling |
| **Vocabulary breadth** | 563 words (60% of Starters nouns) plus ~460 page-only words; 1k plan under way (blocked on photo keys; Pixabay key now in hand) | 🟡 nouns OK, verbs/adjectives/chunks 🔴 |
| **Grammar-in-context** | SentenceGap, Sentence Builder, True or False, Band I "complete/build a sentence" engine; the grammar pilot (prepositions/pronouns/past simple) is planned for after 11-28 | 🟡 implicit only |
| **Spaced review / retention** | solid SRS plus Today run plus Daily Review, **but only inside the app**. The 19 games, unit practice, Band I review and readings write nothing to the child's word memory | 🟡 good engine, narrow reach |
| **Motivation** | 7 badges, streak, mastery map, batch-complete reward, Class Battle | 🟡 no certificate, no collection, no visible "level up" |

### Curriculum-gap summary
1. **Nouns are fine, sentences are not.**
   - Starters coverage is 60% for nouns, 9% for verbs, 33% for adjectives and ~1% for function words.
   - The Ministry's grade-4 grammar (*be*, *there is*, *can*, *-ing*, imperatives) needs exactly the words CDE lacks.
2. Band I is 15% in the app and 37% with pages. The Ministry's grade-6 target is 1,400 receptive words, and CDE has 563 app words.
3. **Speaking is zero.** Chunks such as greetings and "My name is…", chants and repeating are Pre-A1 can-dos.
4. Reading stops at 8 short texts. There is no graded ladder from decodable sentences to A1 stories.
5. Writing is tile recognition only. There is no free recall and no sentence writing, yet the productive target is 1,200 words.
6. Retention works only inside the SPA. Games and pages, which are most of the traffic, don't count.
7. Spanish has no curriculum or reading layer at all.

---

## 3. Competitive benchmark (dimension 19)

| | price / access | strengths vs CDE | Hebrew/Spanish |
|---|---|---|---|
| **Lingokids** | free tier (~3 activities/day per reviews), ~$15/mo or $60–75/yr | thousands of activities, songs, video, a structured path, repeat-after-me speaking; ages 2–8 | Spanish-speaking markets are core; no Hebrew UI found |
| **Duolingo ABC** | free, no ads, offline | 700+ lessons, US phonics, sight words, letter tracing, a habit loop; ages 3–8 | English-only UI; no evidence of an English-from-Hebrew Duolingo course (main Duolingo has English for Spanish speakers, teens/adults) |
| **British Council LearnEnglish Kids** | free web; paid app tier | songs, stories with worksheets, grammar games, videos, huge brand trust | English-only |
| **Starfall** | free subset; $35/yr | 700+ activities, decodable readers, songs, K–3 | English-only |
| **Gus on the Go** | $3.99 one-off; last updated 2018 | offline picture vocabulary | weak; stale |
| **karnafim.co.il** (Hebrew) | free, ads | English **worksheets by grade (ד׳–ח׳)**, reading-comprehension texts, grammar topics (present/past simple, Wh-questions, future, conditionals), mini lessons | Hebrew, grade-shaped |
| **KidsPlus (Niv Revach)** | free worksheets, sells textbooks | thousands of worksheets incl. English; 191 word sets for grades 3–6 | Hebrew |
| **Lomdania** | paid (₪357) | structured English and reading courses | Hebrew |
| **popy.co.il** | free, ads | big kids' portal; English review sheets (e.g. grade 3) | Hebrew |
| **i-fal / english-online.co.il / kanlomdim** | articles, exercises, tutoring funnels | grammar explanations in Hebrew; grade materials (kanlomdim) | Hebrew |
| **Wordwall (teacher-made)** | freemium | the only interactive result on Israeli grammar SERPs; one-off activities | any |

### Where CDE really wins
- **Free, no ads, no sign-up, no student accounts.** No competitor in the Hebrew market has all four.
- **Hebrew and Spanish glosses on every word**, plus Hebrew teacher pages mapped to **Band I and the actual ECB textbook units** (Jet 1/2, Fantastic Five). Nobody else maps the Israeli textbook units with audio, games and printables on one page.
- **Generated printables on every word set** (bingo, word search, crossword with keys, QR back to the game). This beats static worksheet sites for teachers.
- **Classroom tools with zero setup** (Class Battle room codes, Projector Mode, Bingo class mode).
- **Measured learning engine.** It has an SRS ladder and per-asset diagnosis (WordCheck), and the honesty rules (TTS disclosed, credits) build trust.

### Where CDE is behind
- **Content depth and formats:** no songs/chants, no stories beyond 8, no video, no dialogues.
- **No speaking.**
- **No sentence/grammar layer** for grades 4–6; karnafim and the tutoring sites own this in Hebrew.
- **No grade-structured path in the app.** The grade pages are static word lists.
- **No app-store presence** (PWA only). Lingokids, Duolingo ABC and the BC app win on discovery and habit.
- **Retention loop:** returning visitors are 12% (he 34%, en 8%, es 7%), and 1 of 57 learning-cycle starts finishes a batch.

### The most dangerous gap
**CDE has no path past picture nouns.**
- Its core user is a Hebrew-speaking child in grades 3–6. From grade 4 the school asks for *be / there is / can / -ing* sentences, 1,000+ Band I words and short texts.
- CDE offers 6 verbs, ~0 function words, 8 texts and no grammar. A child who succeeds on CDE outgrows it in about a school year, and lands on karnafim worksheets, tutoring-site articles or Wordwall.
- Lingokids and Duolingo ABC are a smaller threat to this audience: they are English-only UI, aimed at ages 2–8, and paid or US-phonics shaped.
- The real danger is **losing the child at the grade-4 transition**, which is exactly where the he return rate (34%) shows CDE's product-market fit.

---

## 4. Scores (1–10)

| # | dimension | score | | why |
|---|---|---|---|---|
| 1 | **UX** | **6** | 🟡 | **Good:** a11y and RTL gates, phone fit and tap-reach probes; first quiz finished by en 63% ≈ he after the 10-22/11-02 fixes. **Bad:** too many overlapping progressions (Continue ladder, Today, Daily Review, Learning Path, Letter Path, Mastery Map, My Word List); the 11-step ladder finishes 1 of 57 batches and drops at LetterFix 1; the static games and the app feel like two products and share no progress. |
| 2 | **Design** | **7** | 🟡 | **Good:** a consistent drawn-icon system, one picture style per round, contrast gates, credited photos, honest copy. **Bad:** a photo/Fluent mix across games; ai-feel judges (11-18) flagged some images (chin, robot, twin, king), 3 layout nits and /about/ at 2/5; the static landing still says "Available in English and Hebrew" (Spanish missing; copy says "timed quizzes"). |
| 3 | **Onboarding & time-to-value** | **7** | 🟡 | **Good:** no sign-up; every game page plays in one tap from search; new players go quiz-first since 11-02; the iPhone Q1-audio fix is confirmed. **Bad:** the SPA asks for a player before value; the en loss is mostly before Q1 (≈39% on 10-25..30); nothing asks a parent "what grade?" or "which textbook?", so the first session isn't tied to school. |
| 17 | **Business-model alignment** (metric = learning engagement and return visits) | **6** | 🟡 | **Good:** outstanding instrumentation (reads ledger, locks, beacons, per-asset diagnosis). **Bad:** the product's pull to *come back* is weak outside the SPA: returning 12% overall (he 34%, en 8%, es 7%); 1,491 game opens/28d build no memory; nothing makes a game visitor's next visit smarter; there is no "due today" pull from the games or pages that most visitors use. |
| 19 | **Competitive** | **5** | 🟡 | **Good:** unique free, no-ads, no-sign-up, Hebrew/Spanish, textbook-unit mapped, generated printables. **Bad:** behind on depth (songs, stories, speaking, grammar) and on grade-structured paths; the grade-4+ gap is the dangerous one (above). |

---

## 5. KEY DELIVERABLE: ranked "offer more" ideas

**Rules respected throughout:**
- passive levers only; TTS only, never "native";
- images from stock, Commons or Fluent with IMAGE_SOURCES entries, never Gemini;
- no Quizlet, Wordwall or Scribd lists;
- nothing touches live games before **11-28**.

Ranking = learning impact for the core he/es kid × fit with existing code × low risk.

### 1. One word memory across the whole site ("everything counts")
- **What:**
  - The 19 games, unit-page practice, Band I review sets and readings write right/wrong per word into the active player's SRS record. All are same-origin, so they can share the `childrendoenglish-player-*` localStorage record through a small shared `public/word-memory.js`.
  - The game end card then says "4 words to review today → Today" and opens TodayRun.
  - Visitors with no player get a guest record that merges into the first player they create.
- **Gap:** spaced review and retention; motivation ("you know 87 words"); return visits.
- **Who:** every kid in en/he/es, especially game-first visitors from search. Parents see true progress in ParentDashboard and MasteryMap.
- **Evidence:**
  - Games write only their best scores today (grep of public/games: no `wordProgress`).
  - Games had 1,491 opens/28d, but the learning cycle finishes 1 of 57 batches.
  - Returning visitors are 12%.
  - The learning-cycle plan (10-05) explicitly parked "game word-list scoping = later".
- **Effort: M.**
  - Reuses `updateWordSR`/`spacedRepetitionSort` (src/utils/spaced-repetition.js), `storage.js` keys and the 2-hour resume window, `public/games/end-card.js`, and the `game-clicks.js` adapter pattern.
  - Needs one per-game hook (`onAnswer(wordId, ok)`).
- **Risks:**
  - Which player is active on a shared tablet (use the existing 2-hour resume window; otherwise guest).
  - It touches frozen games, so it ships after 11-28.
  - It changes what the wave-1/2 reads measure, so give it its own cutover.
  - It is localStorage only: nothing leaves the device, so the privacy text is unchanged.
- **Previously:** parked (10-05), never built or rejected.

### 2. Graded readers ladder ("Little Readers")
- **What:** grow the 8 Band I readings to ~40 short texts in 5 levels:
  - L0 decodable CVC sentences that reuse the Read It words;
  - L1 Pre-Band I;
  - L2 Core I;
  - L3 Core II;
  - L4 Movers-style stories with dialogue.
- **Each text gets:**
  - sentence TTS with karaoke highlight (speech-sync exists), with 🐢 slow;
  - tap-a-word gloss in **Hebrew and Spanish**;
  - 3 questions;
  - a printable with a key;
  - a "words from this story" button into Today (needs #1).
- **Gap:**
  - reading short texts and decoding in context;
  - the A1 can-do "follow a short familiar story";
  - the grade-5 reading screening.
- **Who:** he and es kids in grades 2–6; parents for bedtime reading; teachers for the "unseen" warm-up.
- **Evidence:**
  - Only 8 texts, all Hebrew-gloss only.
  - karnafim and BC LearnEnglish Kids both lead with reading texts and stories.
  - The Ministry Pre-A1 and A1 can-dos.
  - "micro-stories" was step 6 of the 10-24 investment path (not built).
- **Effort: M**, mostly content.
  - Reuses `readings.js`, `public/reading.js`, `readingGlosses.js`, the Band I check script (stores nothing), `scripts/sentence-audio.mjs` (Piper + whisper), `build-reading-pages.mjs` and unit-sheets printing.
  - The es glosses need the i18n consensus gate (~$1–3).
- **Risks:**
  - Copy quality (run the ai-feel copy lint).
  - Band I = map, never reproduce (already handled).
  - Kids' content guardrails.
  - New pages have their own locks.
- **Previously:** RC11 shipped 8 (10-31); the expansion has not been tried.

### 3. Words that build sentences: verbs, adjective pairs and chunks
- **What:** pull the 1k-plan **batches 6–7** forward:
  - ~28 action verbs as Fluent images (Simon Says already has 16);
  - 13 adjective pairs (Opposites already has 9);
  - ~40 Starters function words and chunks (in/on/under, this/that, I/you/he/she, my/your, what/where/who, please/thank you/sorry, "My name is…", "How old are you?").
- **How they're taught:** the chunks live only in sentence mechanics (Sentence Builder, True or False, SentenceGap, the Band I sentence engine), never in picture quizzes. Add a **verb card type** (picture + "-ing" sentence).
- **Gap:** vocabulary breadth where it matters (verbs 9%, adjectives 33%, function words ~1% of Starters) and the precondition for any grammar.
- **Who:** all languages; it's the bridge to the grammar pilot.
- **Evidence:** the YLE parse above; Ministry grade-4 structures; the 1k plan (11-07) already scoped batches 6–7; Simon Says and Opposites show the Fluent route works under the owner's picture rules.
- **Effort: L.**
  - Reuses the 1k batch pipeline (image gate → audio gate → glosses + `collides()` → pages), the Fluent sets, the True/False templates and the sentence-audio renderer.
- **Risks:**
  - Verb pictures with an unclear subject (the owner rejected these 11-07), so use Fluent only and one style per round.
  - Distractor logic for verbs and opposites.
  - Early ladder steps must keep the easiest words.
- **Previously:** planned in the 1k plan (11-07; batch 1 shipped 11-08). This is a **re-prioritisation**, not a new idea.

### 4. Grade paths for Israel (grades 3–6) inside the app
- **What:**
  - A one-tap "Which grade? / Which book?" choice on first run (Hebrew UI), plus deep links from /he/grade-N and /units/….
  - The choice sets the cycle and Today sequence:
    - grade 3 = Pre-Band I + letters/Read It;
    - grade 4 = Core I + Jet 2 units;
    - grade 5 = Core I/II + Fantastic Five;
    - grade 6 = Core II + readings L3–4.
  - The MasteryMap shows "Band I Core I: 64/…".
- **Gap:** curriculum alignment; onboarding time-to-value for he; motivation (a visible school target).
- **Who:** he kids and parents; teachers through unit links.
- **Evidence:**
  - Hebrew searches are grade-shaped (כיתה ד/ה/ו in autocomplete and in ranking titles; grammar brief 11-17).
  - karnafim and KidsPlus organise everything by grade.
  - /he/grade-1…6 exist only as static lists.
  - he has the highest return rate (34%).
- **Effort: M.**
  - Reuses `BAND1_BY_ID`/`BY_TEXT`, `units.js`, `learningCycle.js` batch slicing and `stepsFor()`, SetPicker, the ClassWeekCard pin, and `classUnit.js`.
- **Risks:**
  - The paths are thin until #3 and the 1k batches land, because only 15% of Band I is in the app (show unit/page words in the path as listen-only items).
  - Grade labels must not imply Ministry endorsement.
  - It touches the ladder, a measured surface: wait for the ladder read.
- **Previously:** static grade pages shipped 10-31. "lang-start" (M2: skip the beginner words for en) was dropped 10-31, and this is different. Not rejected.

### 5. "Say it": speaking practice with no microphone
- **What:** a listen → say aloud → hear again → self-check loop.
  - Used on flashcards, in Today (every 3rd word) and in a new "Little Talks" set of 10 two-line dialogues: greetings, name and age, "What's this? It's a…", please/thank you, "Can I have…?".
  - Shadowing uses the 0.75× slow audio and the sentence clips. The child taps "I said it" or "again".
  - No recording, no grading, no mic permission.
  - Projector Mode gets a "class says it" round for the same dialogues.
- **Gap:** speaking/pronunciation, at 0 today. Pre-A1 can-dos: greet, introduce self, repeat phrases.
- **Who:** kids at home (parents can join), and classes.
- **Evidence:**
  - Every competitor has repeat-after-me (Lingokids).
  - Ministry Pre-A1 production and interaction can-dos.
  - CDE's only speaking surface is Projector's choral mode.
- **Effort: S–M.**
  - Reuses FlashcardMode, the slow-audio toggle, `/audio/s/` sentence clips, `sentence-audio.mjs` for the new lines, and Projector.
- **Risks:**
  - Self-report is unmeasurable as learning (measure taps and repeats only).
  - Never imply pronunciation feedback.
  - TTS prosody on dialogues needs a whisper check.
- **Previously:** **mic recording (R2C11) = owner NO 10-31; pronunciation grading rejected 10-24.** This variant avoids both on purpose. Raise it as new and name that difference.

### 6. Printable "week packs" per unit and per grade, plus Spanish *primaria* packs
- **What:** one "Print this week" button per unit, per Band I topic and per grade page. It produces a 4–6 page set:
  - picture flashcards;
  - bingo;
  - word search;
  - crossword;
  - one reading with questions (from #2);
  - answer keys;
  - a QR back to the game.
- Hebrew header "כיתה ד׳ · Jet 2 Unit 3". The es packs are topic-based with a "primaria" label.
- **Gap:** writing/spelling offline; teacher and parent tools; home practice.
- **Who:** teachers (he), parents (he/es).
- **Evidence:**
  - Printables are proven on CDE (memory: Saturday home use, QR beacons).
  - Autocomplete shows "להדפסה" and "pdf".
  - karnafim, KidsPlus and popy compete with worksheets by grade.
  - The grammar brief found es demand for "pdf/ejercicios".
- **Effort: S.** Reuses `public/unit-sheets.js` (bingo/search/cross), `crossword.js`, `build-worksheets.mjs`, `print-btn.js` and the `qr-svg.mjs` QR.
- **Risks:** page locks on unit pages; no reprint of the Band I list or its order (the sheets use only our own words).
- **Previously:** pieces shipped (worksheets 11-11, QR 10-31); the pack is new.

### 7. Grammar pilot wave 2 = the Ministry's grade-4 structures
This builds on the planned pilot; it does not re-propose it.
- **What:** the 11-17 pilot (prepositions, pronouns, past simple) has a wave 2 of irregular verbs and a sorter. Instead, choose wave 2 from **Table 6, grade 4**, using mechanics that already exist:
  - *be* + *there is/are*: True or False scenes ("There are three cats");
  - *can/can't*: Simon Says style;
  - imperatives and *let's*: Simon Says;
  - present progressive: a verb-card "What is she doing?".
  - Each gets a Hebrew/Spanish 3–5 line explanation and a printable, exactly as the pilot specifies.
- **Gap:** grammar-in-context, in the order the school teaches it.
- **Who:** he and es grades 4–6.
- **Evidence:** Ministry Curriculum 2020 Table 6; the pilot's search check (es strongest, he grade-shaped).
- **Effort: M.** Reuses the pilot's kit gaps once built (sentence-token tapper, ambiguity gate, sentence TTS), the True/False and Sentence Builder engines, and Simon Says.
- **Risks:**
  - It depends on #3's verbs.
  - The same kill rules as the pilot.
  - Don't start before the wave-1 read.
- **Previously:** the 20-game en grammar wing was **dropped 11-03/11-12**; the pilot is approved as a plan (11-17). This only changes the wave-2 pick.

### 8. "Type it": free-recall spelling
- **What:** in Today and the ladder's spelling phase, words with 5+ correct retrievals move from "build from tiles" to "type it". This uses an on-screen QWERTY keyboard; Hebrew kids may not have English input set up.
  - A miss shows the differing letters and plays the word.
  - A "Word Race" game mode can come later.
- **Gap:** productive writing (Ministry target 1,200 productive words); tile spelling only tests recognition.
- **Who:** readers aged 8–12 in all languages.
- **Evidence:** all current spelling is tile-based (LetterFix, Forge, Letter Drop, `spellTiles`); "Word Race" was idea 19 in the 11-07 games list (not built).
- **Effort: S.** Reuses `todayRun.js probeFor()` (add a 4th probe), the LetterFix feedback UI and the Forge letter logic.
- **Risks:** frustration (keep it to 8 letters or fewer and only for well-known words); keyboard fit at 320 px (kit tap-reach gate).
- **Previously:** not tried.

### 9. Progress certificate and "word passport"
- **What:** a printable or downloadable certificate (he/es/en) at milestones: a batch level, a unit finished, 50/100/200 words known, a Band I level.
  - The child's name is typed on the device and never sent.
  - A "passport" page stamps each topic or unit mastered.
- **Gap:** motivation, parent visibility, a reason to come back.
- **Who:** kids and parents; teachers can print class ones.
- **Evidence:**
  - There are only 7 badges today.
  - "earned word cards" was in the 10-24 engagement spine.
  - A fridge or classroom certificate with a QR is a passive return and share lever (no outreach).
- **Effort: S.** Reuses `badges.js`, MasteryMap, `print-btn.js` and `qr-svg.mjs`.
- **Risks:**
  - Privacy wording: no name leaves the device (privacy text must say so; this is trust copy, so it needs a per-push OK).
  - Don't imply an official credential.
- **Previously:** not tried.

### 10. Class word-set links and a weekly class challenge
This is already approved and queued.
- **What:** a teacher picks a unit or words, and gets a URL-encoded set to paste in the class WhatsApp. Kids open it: a pinned ClassWeekCard, a Today run on those words, and an optional Class Battle with the same set.
- **Gap:** classroom mode, teacher tools, spaced review on school words.
- **Who:** he teachers, parents.
- **Evidence:** owner ideas round 2 (11-12): "URL-encoded custom word sets shareable to class WhatsApp (later)"; the teacher share loop is gated on the KDM read; the 📌 ClassWeekCard already exists.
- **Effort: S–M.** Reuses `classUnit.js`, ClassWeekCard, the flashcard-maker set encoding and Battle topics.
- **Risks:** abuse of free-text sets (allow only CDE word ids); the KDM gate.
- **Previously:** **approved 11-12, queued**. Listed for its place in the roadmap.

### 11. Offline family pack (PWA)
- **What:** a "Save for offline" button per topic, unit or grade path. It precaches that set's images and audio, plus the 5 most-played games, into the service worker: "for the car or the grandparents' house".
- **Fix on the way:** the image and audio caches are capped at 800 entries, but there are ~1,020 word mp3s and 1,288 sentence clips, so the audio cache thrashes.
- **Gap:** access and retention; families with limited data.
- **Who:** parents (he/es).
- **Evidence:** Duolingo ABC and Gus on the Go sell "works offline"; the CDE SW only runtime-caches files already seen; static games are not precached.
- **Effort: M.** Reuses vite-plugin-pwa/workbox, `sw-routes.js` and `useInstallPrompt`.
- **Risks:**
  - SW changes are risky: the allowlist, and a broken cache means broken pages. Test on a preview.
  - Storage quota on iOS.
- **Previously:** the PWA exists (installable); an offline pack has not been tried on CDE.

### 12. Spanish learner track parity
- **What:**
  - tap-for-Spanish on the readings (#2);
  - an es "Inglés para primaria" topic hub with the 13 categories, readings and packs (#6);
  - es parent copy in ParentDashboard;
  - lead the grammar pilot's es pages as already planned.
- **Gap:** es has no curriculum or reading layer (27 pages vs he's 81+).
- **Who:** es kids and parents.
- **Evidence:**
  - es returning visitors are 7%.
  - The /spanish/ category CTR rose 0.5→0.8% in the title-holdout ship (11-14).
  - The grammar brief: es demand is the strongest of the three languages.
- **Effort: S–M.** Reuses `word-glosses-es.js` (563/563), the Spanish category builder and the i18n consensus gate (~$1–3/run).
- **Risks:** no native check (the consensus gate only); Spain and Latin American variants (the glosses are Latin-American by design).
- **Previously:** the **Spanish–English cognates game was KILLED 11-12**; avoid that. The es category pages shipped 10-24.

### 13. Chant cards: rhythmic read-along with TTS
- **What:** 4–8 line chants (days, months, numbers, alphabet, colours, "Head and shoulders"-style action lines using non-body words).
  - TTS reads each line on a steady beat with a click track and word-by-word highlight; the child claps or taps along; there is a printable lyric card.
  - Never called "songs" or a native performance.
- **Gap:** Pre-A1 "recite a short rhyme or chant"; motivation.
- **Who:** ages 6–8 and pre-readers; classrooms (Projector).
- **Evidence:** the Ministry can-do; BC and Lingokids lead with songs; "chants" was in the 10-24 investment path step 6.
- **Effort: M.** Reuses speech-sync, the sentence-audio renderer, Projector and the Rhyme Time audio.
- **Risks:**
  - TTS prosody may sound robotic, so it needs an owner ear check (the owner skips audio ear-checks, so this may stall).
  - It could fail the ai-feel bar.
  - Rank this low until a 1-chant spike is heard.
- **Previously:** planned in concept (10-24); not built.

### 14. Missing Starters nouns and new topics (1k plan continuation)
- **What:** continue the 1k batches with the ~100 picturable Starters/Movers nouns still missing (birthday, breakfast, lunch, friend, kitten, crayon, cupboard…) and new topics: places, jobs, weather, time.
- **Gap:** vocabulary breadth (Starters 38% → ~60%; Movers 20% → ~35%).
- **Who:** all.
- **Evidence:** the YLE parse; Bing/Copilot cite category pages most.
- **Effort: L** (pipeline exists). Reuses the 1k pipeline and the Pixabay picker (key in hand; Pexels paused).
- **Risks:** the never-re-add list (body parts); the photo "one obvious subject" rule; WORD_COUNT and stat locks.
- **Previously:** **planned 11-07, batch 1 shipped 11-08.** Listed for priority only: do #3 before more nouns.

### 15. Parent "this week at home" card
- **What:** a weekly card in ParentDashboard (he/es/en) with the words due, 1 reading, 1 printable pack, 1 game and 1 "Say it" dialogue. It is generated on the device from the child's record and can be printed or sent as a reminder.
- **Gap:** parent tools; return visits.
- **Who:** parents.
- **Evidence:** "parent quest cards" was P3 of the 10-24 growth proposal (planned); Saturday home use is high.
- **Effort: S.** Reuses ParentDashboard, `todayRun.js`, `notifications.js` and #1/#2/#6.
- **Risks:** low; no data leaves the device.
- **Previously:** planned in concept (10-24), not built.

### How this fits what's already queued
- **Before any of this:** the **ladder cut (11 → ~5 steps)** that the owner asked for on 11-12.
  - Only 1 of 57 batch starts finishes, with the drop at LetterFix 1.
  - Ideas #1, #4 and #8 all assume the short ladder.
- **Suggested order after 11-28:**
  1. #1 (memory) and #8 (type it), both S/M engine work;
  2. #2 (readers) and #6 (packs) in parallel, content only;
  3. #3 (verbs, adjective pairs, chunks), which unlocks #7 and the pilot;
  4. #4 (grade paths), once #3 thickens Band I;
  5. #5 and #9 as quick wins anywhere along the way.
  - #10–#15 follow their own gates.
- **Measurement:** use the existing reads ledger. Primary measures are return visits per player at 7 and 28 days, words reaching interval ≥14 per active player, and Today-run starts per game end card.

---

## Sources
- Cambridge English, *Pre A1 Starters, A1 Movers and A2 Flyers Wordlists, for exams from 2018*: https://www.cambridgeenglish.org/pl/Images/149681-yle-flyers-word-list.pdf
- Israel Ministry of Education, *English Curriculum 2020 for Elementary School* (Tables 4–6, can-do statements): https://meyda.education.gov.il/files/Mazkirut_Pedagogit/English/curriculum2020Elementary.pdf
- Ministry Lexical Band I (mapped in src/data/band1.js): https://meyda.education.gov.il/files/Mazkirut_Pedagogit/English/CurriculumFilesAugust21/LexicalBand1.xlsx
- Lingokids App Store listing: https://apps.apple.com/us/app/lingokids-play-learn-english/id1002043426 ; review: https://learnenglish.life/reviews/lingokids/
- Duolingo ABC App Store listing: https://apps.apple.com/us/app/learn-to-read-duolingo-abc/id1440502568?l=en ; coolmomtech review: https://coolmomtech.com/2020/10/duolingo-abc-app-free/
- British Council LearnEnglish Kids: https://learnenglishkids.britishcouncil.org/getting-started-for-kids ; Playtime app: https://apps.apple.com/us/app/learnenglish-kids-playtime/id933760266
- Starfall pricing: https://www.educatorstechnology.com/?p=209064 ; Common Sense: https://www.commonsensemedia.org/website-reviews/starfall-0
- Gus on the Go: English: https://apps.apple.com/app/id541568936
- Hebrew market (homepages fetched 11-18): https://www.karnafim.co.il/english/ , https://kidsplus.co.il/ , https://www.lomdania.co.il/ , https://www.popy.co.il/ , https://www.english-online.co.il/ , https://www.kanlomdim.co.il/ ; Israeli SERP notes in briefs/grammar-learners-pilot-2026-11-17.md
