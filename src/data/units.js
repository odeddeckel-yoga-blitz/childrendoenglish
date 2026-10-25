// Textbook-unit word lists → /units/<book>/unit-<n>/ (scripts/build-unit-pages.mjs).
//
// Lists come ONLY from the owner (typed from the book they own) — never from
// Quizlet, Wordwall, Scribd or other user-uploaded sets. Words only: no
// passages, exercises or tests copied from the book. Pages carry a "not
// affiliated with <publisher>" line.
//
// Unit shape: { book, unit, grade, words: [{ en, he, wordId? }], test? }
//   wordId → an existing CDE word: its photo is shown and its audio reused.
//   no wordId → a unit-only word: needs public/audio/<slug>.mp3 rendered at add
//     time (Piper, whisper-checked — see scripts/voice-audit.py); never shown as a
//     picture and never enters the app's picture quiz modes.
//   test: true → the page is built for checking the template but stays off
//     production search: noindex, left out of the sitemap, linked from nowhere.

export const BOOKS = {
  'jet-2': { name: 'Jet 2', publisher: 'Eric Cohen Books' },
  'fantastic-five': { name: 'Fantastic Five', publisher: 'Eric Cohen Books' },
  'think-about-it': { name: 'Think About It', publisher: 'Eric Cohen Books' },
  'template-test': { name: 'Template Test', publisher: 'Eric Cohen Books', test: true },
};

export const UNITS = [
  // TEMPLATE TEST — existing CDE words only. 'quiet' deliberately has no wordId
  // so the unit-only path (audio by text key, no photo) is exercised. Never
  // indexed or linked.
  {
    book: 'template-test', unit: 1, grade: 'ד׳', test: true,
    words: [
      { en: 'apple', he: 'תפוח', wordId: 'apple' },
      { en: 'banana', he: 'בננה', wordId: 'banana' },
      { en: 'bread', he: 'לחם', wordId: 'bread' },
      { en: 'milk', he: 'חלב', wordId: 'milk' },
      { en: 'egg', he: 'ביצה', wordId: 'egg' },
      { en: 'water', he: 'מים', wordId: 'water' },
      { en: 'kitchen', he: 'מטבח', wordId: 'kitchen' },
      { en: 'table', he: 'שולחן', wordId: 'table' },
      { en: 'chair', he: 'כיסא', wordId: 'chair' },
      { en: 'family', he: 'משפחה', wordId: 'family' },
      { en: 'happy', he: 'שמח', wordId: 'happy' },
      { en: 'quiet', he: 'שקט' },
    ],
  },
];
