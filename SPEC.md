# Children Do English — Product Spec

> Living document. Last updated: 2026-02-28

## Overview

A web-based English vocabulary learning app for kids ages 6-12. Helps English and Hebrew speakers grow their English vocabulary through multi-modal exercises combining images, audio (TTS), and text. Designed for desktop, tablet, and mobile.

**URL**: childrendoenglish.com
**Deploy**: Vercel
**Stack**: React 18 + Vite 6 + Tailwind 3.4 + PWA

---

## Target Users

- Kids ages 6-12
- English speakers expanding vocabulary
- Hebrew speakers learning English words
- Parents and teachers assigning word lists

---

## Core Principles

1. **Multi-modal learning** — every word is taught through image + audio + text (research: 2x retention via dual coding, ~30% boost from multi-modal)
2. **Spaced repetition** — words resurface at increasing intervals based on mastery
3. **Short daily sessions** — optimized for 5-10 min/day (research: beats long irregular sessions)
4. **80% success target** — quiz difficulty adapts to keep the sweet spot
5. **Images over translations** — visual associations are primary; Hebrew translations are secondary
6. **Offline-first** — fully functional without internet after first load
7. **No timer pressure** — quizzes are self-paced (research: time pressure hurts vocabulary retention in children)

---

## Word Database

### Size & Structure
- ~300 words in MVP
- 3 levels: Beginner (~100), Intermediate (~100), Advanced (~100)
- ~15 categories: animals, food, body, clothing, colors, nature, home, school, transport, actions, feelings, weather, family, shapes, everyday objects
- Each category: minimum 4 words per level (for quiz distractor generation)

### Word Entry Schema
```
id              string    unique slug, also image filename
word            string    English word (lowercase)
level           enum      beginner | intermediate | advanced
partOfSpeech    enum      noun | verb | adjective
category        string    semantic category
definition      string    simple kid-friendly definition
exampleSentence string    short sentence using the word
phonetic        string    IPA pronunciation
hebrewTranslation string  Hebrew translation (manually reviewed)
imageUrl        string    path to pre-built webp image
```

### Word Selection Rules
- Only words representable by a clear image
- Concrete nouns preferred, action verbs with clear visuals, visual adjectives
- No abstract words (think, always, because, however)
- For polysemous words: pick the most common child-friendly meaning
- Sources: Dolch sight words, Fry 1000, Flocabulary grade-level lists

### Image Requirements
- 512x512 webp, ~20-40KB each
- Prefer illustrations/clipart over photos (clearer for kids)
- Must be unambiguous (image clearly represents one word)
- Child-appropriate (Pixabay safesearch + manual review)
- All images committed to repo, not fetched at runtime

---

## Screens & Navigation

### State Machine Flow
```
onboarding → menu
menu → levelSelect | assessment | learning | flashcards | personalList | badges | progress
assessment → assessmentResult → menu
levelSelect → modeSelect → loading → playing → finished
finished → menu | playing (retry)
learning → menu
flashcards → flashcardSummary → menu
personalList → modeSelect (filtered)
badges → menu
progress → menu
```

### 1. Onboarding (first launch only)
- Step 1: "Welcome to Children Do English!" with app icon
- Step 2: "What language do you speak?" → English / Hebrew (עברית)
- Step 3: "How it works" — Learn → Practice → Quiz flow explanation
- Step 4: "Ready?" → "Take Assessment" (recommended) or "Skip & Start"
- Skip/dot navigation, can go back

### 2. Menu (home screen)
- App logo/brand
- Daily goal progress bar ("5/10 words today")
- Streak counter with fire icon
- Buttons: Learn Words, Practice (flashcards), Take a Quiz, My Word List, My Progress, Badges
- Sound toggle + Dark mode toggle in header
- Quick stats expandable (total words learned, best scores)

### 3. Assessment Flow (optional)
- 15 adaptive multiple-choice questions (Image Quiz format)
- Starts at intermediate; adjusts up/down based on 5-question batches
- 4/5 correct → harder, 2/5 or less → easier, 3/5 → stay
- Result: estimated level + word count + "We recommend [Level]"
- Can retake from Progress Dashboard

### 4. Level Select
- 3 level cards: Beginner, Intermediate, Advanced
- Each shows: icon, name, word count, best score, lock/unlock status
- Unlock: beginner always open, intermediate after 7+/10 on beginner, advanced after 7+/10 on intermediate
- "Recommended" badge on assessment-suggested level

### 5. Mode Select
- 3 mode cards:
  - **Image Quiz**: "See a picture, find the word" — Image icon
  - **Word Quiz**: "See a word, find the picture" — Text icon
  - **Audio Quiz**: "Hear a word, find the picture" — Speaker icon
- 2-column grid on tablet+, stacked on mobile

### 6. Loading Screen
- Progress bar while preloading quiz images (10 images)
- "Getting your words ready..." message
- Same pattern as yoga-bits loading state

### 7. Quiz Screen (ImageQuiz / WordQuiz / AudioQuiz)
- Header: progress bar (3/10), score, streak fire, sound toggle, quit (X) button
- Body: stimulus (image OR word OR audio speaker) + 4 answer options
- Feedback: correct → green glow + bounce + TTS speaks word; wrong → shake + show correct
- 1.2s delay after feedback before next question
- Quit → confirmation dialog → ResultScreen with partial results

### 8. Result Screen
- Score circle (7/10) with animation
- Confetti on perfect score
- Badge unlock notification (if earned)
- Answer review grid: thumbnail + word + check/X for each question
- Buttons: Play Again, Review Mistakes (flashcards), Back to Menu
- "Words learned today: X/Y" daily progress

### 9. Learn Mode
- Toggle: detail view / grid view
- Detail: large image, word (big font), phonetic, definition, example sentence, Hebrew translation, speaker button (TTS)
- Grid: image thumbnail grid with word label below each
- Swipe or arrow navigation in detail view
- "Practice These" CTA button

### 10. Flashcard Mode
- Swipeable cards (right = know, left = still learning)
- Front: image + category badge + level badge
- Back: word (large), phonetic, definition, Hebrew translation, speaker button
- Sorted by spaced repetition (overdue first, then unseen, then not-yet-due)
- Summary at end: X known, Y still learning

### 11. Personal Word List
- Text area: "Enter your words (one per line)"
- Parse input → match against 300-word database
- Show matched words (green checkmarks) and unmatched words (greyed out, "not in our word bank")
- "Practice X matched words" button → goes to ModeSelect with filtered word set
- Persisted to localStorage so the list survives page refresh

### 12. Progress Dashboard
- Words mastered / learning / not seen (pie or bar chart)
- Level progress bars (beginner: X%, intermediate: Y%, advanced: Z%)
- Streak: current + longest, last 30 days heatmap
- Quiz history sparkline
- "Retake Assessment" button
- "Words due for review" count + "Review Now" CTA

### 13. Badges View
- Grid of all badges (earned = color, unearned = greyed)
- Each badge: icon, name, description, earned date (if earned)

---

## Spaced Repetition System

### Per-Word Tracking
```
wordProgress[wordId] = {
  lastSeen: timestamp,
  interval: number (days),
  correctCount: number,
  incorrectCount: number,
}
```

### Algorithm
- Intervals: [1, 3, 7, 14, 30] days
- Correct answer → advance to next interval
- Wrong answer → reset to interval[0] (1 day)
- Word is "mastered" when interval >= 14 days
- Applies across all game modes (ImageQuiz correct = same as FlashcardMode "know it")

### Quiz Word Selection
- 60% due-for-review (overdue by SR schedule)
- 20% new words (never seen)
- 20% recently mastered (reinforcement)
- If success rate >90%: add harder words; if <70%: add easier/known words

---

## Gamification

| Feature | Details |
|---|---|
| Score | +1 per correct answer in quizzes |
| Streak | Consecutive correct answers within a quiz (fire animation at 3+) |
| Daily streak | Days in a row with activity. Reset after 1 missed day. |
| Daily goal | 10 words reviewed/day. Progress bar on menu. |
| Badges | 7 achievements (see below) |
| Level unlock | Score 7+/10 on a level to unlock the next |
| Confetti | Perfect score (10/10) triggers confetti animation |

### Badges
1. **First Word** — Complete your first quiz
2. **Word Explorer** — Learn 20 words
3. **Perfect Quiz** — Get 10/10 on any quiz
4. **Bookworm** — Complete 10 quizzes
5. **Vocab Champion** — Perfect score on Advanced
6. **Week Warrior** — 7-day streak
7. **Polyglot** — Learn 100 words

---

## Audio / TTS

- **Engine**: Web Speech API via `easy-speech` library
- **Voice**: en-US or en-GB, rate 0.85 (slower for kids)
- **When it speaks**: on correct answer feedback, on speaker button tap, auto-play in Audio Quiz
- **Sound effects**: Web Audio API oscillator (correct = ascending tone, wrong = descending) — same as yoga-bits
- **Sound toggle**: mutes both TTS and sound effects, persisted to localStorage
- **TTS fallback**: if no English voice detected, Audio Quiz degrades to Word Quiz layout (shows text instead of speaker). One-time toast notification.

---

## Responsive Design

- **Mobile-first** (<768px): single column, image on top, options below, full-width cards
- **Tablet** (768-1024px): two-column quiz layout (image left, options right)
- **Desktop** (>1024px): same as tablet with more whitespace, max-w-2xl container
- **Touch**: min-h-[48px] touch targets, overscroll-behavior: none, swipe gestures on flashcards
- **Safe area**: padding for notch devices
- **Reduced motion**: respects prefers-reduced-motion

---

## PWA & Offline

- **Precache**: app shell (JS/CSS/HTML) + beginner-level images (~100 images, ~3MB)
- **Lazy cache**: intermediate/advanced images cached on first access (CacheFirst)
- **NetworkFirst**: navigation requests
- **Offline**: full quiz/flashcard/learn functionality with cached data
- **Update prompt**: checks hourly, shows "Update available" banner
- **Total storage**: ~9MB for full 300-word dataset

---

## Data Persistence (localStorage)

```
Key: "childrendoenglish-stats"
Value: {
  totalQuizzes, bestScores, badges, unlockedLevels,
  wordProgress, quizHistory, currentStreak, longestStreak,
  lastActiveDate, assessmentLevel, hasSeenOnboarding,
  dailyGoal, todayWordsReviewed, todayDate,
  uiLanguage, soundEnabled, personalWordList
}
```

---

## Distractor Generation

For quiz answer options (1 correct + 3 distractors):
1. **Best**: same category + same level (e.g., target "dog" → cat, horse, rabbit)
2. **Fallback 1**: same category + any level
3. **Fallback 2**: same level + any category
4. **Fallback 3**: any word (shuffled)
Never include the target word as a distractor.

---

## Open Questions (to resolve during implementation)

- [ ] Google Analytics ID for childrendoenglish.com
- [ ] Exact Vercel project name and domain configuration
- [ ] Final word list (300 words) — needs manual curation pass
- [ ] Hebrew translations — need native speaker review after machine translation

---

## Phase 2 (Future)

- Hebrew UI toggle (RTL layout, Hebrew button labels/instructions)
- Personal word list: support words not in the database (auto-fetch images)
- Parent dashboard (password-protected, progress reports)
- More modes: spelling (type the word), sentence building, pronunciation recording
- Timed/speed quiz modes
- Multiple user profiles (siblings on shared device)
- Accessibility audit (ARIA, keyboard nav, screen reader, color contrast)
- Social: share scores, class leaderboards
