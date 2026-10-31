// Hebrew topic word pages (/he/english-words/<slug>/): topics Hebrew searchers type
// as "<topic> באנגלית" with no CDE page yet (autocomplete 10-31). Our OWN lists,
// glosses and example sentences (not copied from any curriculum list).
//   wordId → a CDE app word (photo + its own example sentence)
//   no wordId → a page-only word: audio rendered with Piper and whisper-checked
// Body parts are not here: most of those words are on the never-re-add list.
export const HE_TOPICS = [
  {
    slug: 'days-of-the-week', name: 'ימות השבוע', query: 'ימות השבוע באנגלית',
    intro: 'שבעת ימי השבוע באנגלית, לפי הסדר של השבוע בישראל: מיום ראשון עד שבת. באנגלית כותבים את שמות הימים תמיד באות גדולה.',
    words: [
      { en: 'Sunday', he: 'יום ראשון', ex: 'On Sunday we go back to school.' },
      { en: 'Monday', he: 'יום שני', ex: 'I have art class on Monday.' },
      { en: 'Tuesday', he: 'יום שלישי', ex: 'We play soccer on Tuesday.' },
      { en: 'Wednesday', he: 'יום רביעי', ex: 'Wednesday is in the middle of the week.' },
      { en: 'Thursday', he: 'יום חמישי', ex: 'On Thursday I visit my grandma.' },
      { en: 'Friday', he: 'יום שישי', ex: 'On Friday we eat dinner together.' },
      { en: 'Saturday', he: 'שבת', ex: 'On Saturday we go to the park.' },
    ],
  },
  {
    slug: 'months', name: 'חודשי השנה', query: 'חודשי השנה באנגלית',
    intro: 'שנים עשר חודשי השנה באנגלית, מינואר ועד דצמבר. גם שמות החודשים נכתבים באנגלית באות גדולה.',
    words: [
      { en: 'January', he: 'ינואר', ex: 'January is the first month of the year.' },
      { en: 'February', he: 'פברואר', ex: 'February is a short month.' },
      { en: 'March', he: 'מרץ', ex: 'In March the flowers start to grow.' },
      { en: 'April', he: 'אפריל', ex: 'It rains a little in April.' },
      { en: 'May', he: 'מאי', ex: 'My birthday is in May.' },
      { en: 'June', he: 'יוני', ex: 'School ends in June.' },
      { en: 'July', he: 'יולי', ex: 'In July it is very hot.' },
      { en: 'August', he: 'אוגוסט', ex: 'We go to the beach in August.' },
      { en: 'September', he: 'ספטמבר', ex: 'School starts in September.' },
      { en: 'October', he: 'אוקטובר', ex: 'In October the leaves fall.' },
      { en: 'November', he: 'נובמבר', ex: 'November is a cool month.' },
      { en: 'December', he: 'דצמבר', ex: 'December is the last month of the year.' },
    ],
  },
  {
    slug: 'family', name: 'בני המשפחה', query: 'בני משפחה באנגלית',
    intro: 'איך אומרים אמא, אבא, אח, אחות, סבא וסבתא באנגלית — כל בני המשפחה, עם משפט לדוגמה לכל מילה.',
    words: [
      { en: 'mother', he: 'אמא', ex: 'My mother reads me a story.' },
      { en: 'father', he: 'אבא', ex: 'My father makes pancakes.' },
      { en: 'sister', he: 'אחות', ex: 'My sister is seven years old.' },
      { en: 'brother', he: 'אח', ex: 'My brother likes to play football.' },
      { en: 'grandmother', he: 'סבתא', ex: 'My grandmother bakes cookies.' },
      { en: 'grandfather', he: 'סבא', ex: 'My grandfather tells funny jokes.' },
      { en: 'aunt', he: 'דודה', ex: 'My aunt lives near the sea.' },
      { en: 'uncle', he: 'דוד', ex: 'My uncle has a big dog.' },
      { en: 'cousin', he: 'בן דוד / בת דודה', ex: 'My cousin comes to play today.' },
      { en: 'son', he: 'בן', ex: 'Their son is in first grade.' },
      { en: 'daughter', he: 'בת', ex: 'Their daughter loves to draw.' },
      { en: 'parents', he: 'הורים', ex: 'My parents are at work.' },
      { en: 'family', he: 'משפחה', wordId: 'family' },
    ],
  },
  {
    slug: 'numbers-1-100', name: 'מספרים מ-1 עד 100', query: 'מספרים באנגלית',
    intro: 'המספרים באנגלית מאפס ועד עשרים, ואחר כך העשרות עד מאה. מ-13 עד 19 כולם נגמרים בסיומת \u200eteen\u200e, והעשרות — עשרים, שלושים, ארבעים ועד תשעים — נגמרות בסיומת \u200ety\u200e.',
    words: [
      ...['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'].map((w) => ({ wordId: w })),
      { en: 'thirteen', he: 'שלוש עשרה', ex: 'My sister is thirteen years old.' },
      { en: 'fourteen', he: 'ארבע עשרה', ex: 'There are fourteen kids in the pool.' },
      { wordId: 'fifteen' },
      { en: 'sixteen', he: 'שש עשרה', ex: 'The bus has sixteen seats.' },
      { en: 'seventeen', he: 'שבע עשרה', ex: 'I read seventeen pages today.' },
      { en: 'eighteen', he: 'שמונה עשרה', ex: 'We need eighteen cups for the party.' },
      { en: 'nineteen', he: 'תשע עשרה', ex: 'Nineteen birds sit on the wire.' },
      ...['twenty', 'thirty', 'forty', 'fifty', 'sixty'].map((w) => ({ wordId: w })),
      { en: 'seventy', he: 'שבעים', ex: 'My grandpa is seventy years old.' },
      { en: 'eighty', he: 'שמונים', ex: 'The book has eighty pages.' },
      ...['ninety', 'hundred'].map((w) => ({ wordId: w })),
    ],
  },
  {
    slug: 'abc', name: 'אותיות האלף-בית', query: 'אותיות באנגלית',
    intro: '26 האותיות של האלף-בית האנגלי, ולכל אות מילה עם תמונה שמתחילה בה — למשל \u200eA\u200e כמו \u200eapple\u200e ו-\u200eB\u200e כמו \u200eball\u200e.',
    letters: true,
    words: ['apple', 'ball', 'cat', 'dog', 'egg', 'fish', 'grapes', 'horse', 'icecream', 'juice', 'kite', 'lion', 'monkey',
      'nest', 'orange', 'pizza', 'queen', 'rabbit', 'sun', 'tree', 'umbrella', 'van', 'watch', 'xylophone', 'yellow', 'zebra']
      .map((w) => ({ wordId: w })),
  },
];
