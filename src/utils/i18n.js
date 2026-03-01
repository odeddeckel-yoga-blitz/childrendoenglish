const translations = {
  en: {
    // Menu (existing)
    appName: 'Children Do English',
    tagline: 'Build your vocabulary!',
    dailyGoal: 'Daily Goal',
    words: 'words',
    dayStreak: 'day streak!',
    learnWords: 'Learn Words',
    learnWordsDesc: 'Browse and study vocabulary',
    flashcards: 'Flashcards',
    flashcardsDesc: 'Swipe to review words',
    playQuiz: 'Play Quiz',
    playQuizDesc: 'Test your vocabulary',
    myWordList: 'My Word List',
    myWordListDesc: 'Practice custom words',
    progress: 'Progress',
    badges: 'Badges',
    earned: 'earned',
    quizzes: 'Quizzes',
    learned: 'Learned',
    mastered: 'Mastered',
    privacyPolicy: 'Privacy Policy',
    madeBy: 'Made by Oded Deckelbaum',
    findYourLevel: 'Find Your Level',
    findYourLevelDesc: 'Quick assessment to match your skill',
    chooseLevel: 'Choose Level',
    chooseMode: 'Choose Mode',
    backToMenu: 'Back to menu',
    skipThisWord: 'Skip this word',
    playAgain: 'Play Again',
    backToMenuBtn: 'Back to Menu',
    question: 'Question',
    of: 'of',

    // Menu extras (install banner, dark mode, streak)
    installApp: 'Install App',
    installDesc: 'Add to your home screen for quick access',
    install: 'Install',
    lightMode: 'Light mode',
    darkModeLabel: 'Dark mode',
    dismissInstall: 'Dismiss install prompt',
    dayStreakMenu: '{{count}} day streak!',

    // Level/Mode
    beginner: 'Beginner',
    intermediate: 'Intermediate',
    advanced: 'Advanced',
    imageQuiz: 'Image Quiz',
    imageQuizDesc: 'See an image, pick the right word',
    wordQuiz: 'Word Quiz',
    wordQuizDesc: 'See a word, pick the right image',
    audioQuiz: 'Audio Quiz',
    audioQuizDesc: 'Hear a word, pick the right image',
    unlockHint: 'Score 7/10 on {{level}} to unlock',
    wordsCount: '{{count}} words',
    bestScore: 'Best: {{score}}/10',
    levelLabel: '{{level}} level',

    // Quiz UI
    endQuiz: 'End quiz?',
    progressSaved: 'Your progress will be saved.',
    continue: 'Continue',
    endQuizBtn: 'End Quiz',
    whatIsThis: 'What is this?',
    hearAgain: 'Tap to hear again',
    audioUnavailable: 'Audio not available on this device. Showing words instead.',
    quitQuiz: 'Quit quiz',
    muteSound: 'Mute sound',
    enableSound: 'Enable sound',
    pronounceWord: 'Pronounce word',

    // Results
    amazing: 'Amazing!',
    greatJob: 'Great job!',
    goodEffort: 'Good effort!',
    keepPracticing: 'Keep practicing!',
    badgesEarned: 'Badges Earned',
    review: 'Review',
    share: 'Share',
    changeMode: 'Change Mode',
    youPicked: 'You picked: {{word}}',

    // Learn Mode
    gridView: 'Grid view',
    detailView: 'Detail view',
    searchPlaceholder: 'Search words...',
    searchLabel: 'Search words',
    all: 'All',
    noWordsFound: 'No words found',
    previousWord: 'Previous word',
    nextWord: 'Next word',

    // Flashcards
    tapToFlip: 'Tap to flip',
    stillLearning: 'Still Learning',
    knowIt: 'Know It',
    swipeHint: 'Swipe right = Know it, Swipe left = Still learning',
    sessionComplete: 'Session Complete!',
    noCardsToReview: 'No cards to review!',
    flipToFront: 'Flip card to front',
    flipToBack: 'Flip card to see answer',
    flashcardProgress: 'Flashcard progress',

    // Badges
    badgesTitle: 'Badges',
    earnedBadge: 'Earned!',

    // Progress
    dayStreakLabel: 'Day Streak',
    bestStreak: 'Best: {{count}}',
    wordsSeen: 'Words Seen',
    ofTotal: 'of {{count}}',
    accuracy: 'Accuracy',
    vocabularyMastery: 'Vocabulary Mastery',
    recentQuizzes: 'Recent Quizzes',
    retakeAssessment: 'Retake Assessment',
    takeAssessment: 'Take Assessment',
    assessmentLevelLabel: 'Assessment level:',

    // Assessment
    quickAssessment: 'Quick Assessment',
    skip: 'Skip',

    // Personal List
    enterWords: 'Enter or paste your word list (one word per line or comma-separated):',
    findWords: 'Find Words',
    foundWords: 'Found {{count}} word',
    foundWordsPlural: 'Found {{count}} words',
    notInWordBank: 'Not in word bank yet',
    needMinWords: 'Need at least 4 matching words to start a quiz.',
    noWordsInBank: 'None of those words are in our word bank. Try words like: cat, dog, apple, house, car.',
    imageQuizCount: 'Image Quiz ({{count}} words)',
    linkCopied: 'Link copied',
    shareImageQuiz: 'Share image quiz',
    shareWordQuiz: 'Share word quiz',

    // Loading
    loading: 'Loading',
    preparingQuiz: 'Preparing your quiz...',
    takingLonger: 'Taking longer than expected. Check your connection.',
    retry: 'Retry',
    loadingQuiz: 'Loading quiz',

    // Multi-player
    whoIsPlaying: "Who's playing?",
    switchPlayer: 'Switch Player',
    managePlayers: 'Manage Players',
    addPlayer: 'Add Player',
    createPlayer: 'Create Player',
    playerName: 'Player Name',
    chooseAvatar: 'Choose Avatar',
    deletePlayer: 'Delete Player',
    deleteConfirm: 'Delete {{name}}? All progress will be lost.',
    resetProgress: 'Reset Progress',
    resetConfirm: 'Reset all progress for {{name}}?',
    playingAs: 'Playing as {{name}}',
    canYouRead: 'Can you read English words?',
    iCanRead: 'I can read!',
    notYet: 'Not yet',
    parentCanChange: 'A parent can change this later',
    canReadLabel: 'Can read English',
    listenMatchQuiz: 'Listen & Match',
    listenMatchQuizDesc: 'Hear & see a word, pick the right image',
    tapToHear: 'Tap to hear again',

    // Learn Mode empty state
    tryDifferentSearch: 'Try a different search or category',

    // Onboarding i18n
    chooseLanguage: 'What language do you speak?',
    welcomeTitle: 'Welcome!',
    welcomeWithName: 'Welcome, {{name}}!',
    welcomeDesc: 'Learn new English words through fun quizzes and flashcards.',
    seeAndLearn: 'See & Learn',
    seeAndLearnDesc: 'Match words with pictures, hear how they sound, and track your progress.',
    tryItOut: 'Try it out!',
    whatWordMatches: 'What word matches this picture?',
    demoCorrect: 'Great job!',
    demoWrong: "Not quite — it's <strong>{{word}}</strong>! You'll get the hang of it.",
    demoWrongPrefix: "Not quite — it's",
    demoWrongSuffix: "! You'll get the hang of it.",

    // Parent email
    parentEmailTitle: 'Parent Email (Optional)',
    parentEmailDesc: 'Get progress reports and learning tips. We never share your email.',
    parentEmailPlaceholder: 'parent@email.com',
    skipStep: 'Skip this step',

    // Data export/import
    exportData: 'Export Data',
    importData: 'Import Data',

    // Learning path
    learningPath: 'Learning Path',
    learningPathDesc: 'Follow themed lessons step by step',
    lessonProgress: '{{done}} / {{total}} mastered',

    // Parent dashboard
    parentDashboard: 'Parent Dashboard',

    // Share text
    shareText: 'I scored {{score}}/{{total}} on Children Do English!',
    shareTextPerfect: 'I scored {{score}}/{{total}} on Children Do English! Perfect score!',
    shareQuizTitle: 'English Quiz',

    // Cookie consent
    cookieConsent: 'We use analytics to improve the app. No personal data is collected.',
    accept: 'Accept',
    decline: 'Decline',

    // Notifications
    enableReminders: 'Enable streak reminders',
    disableReminders: 'Disable streak reminders',
  },
  he: {
    // Menu (existing)
    appName: 'ילדים עושים אנגלית',
    tagline: '!בנו את אוצר המילים שלכם',
    dailyGoal: 'יעד יומי',
    words: 'מילים',
    dayStreak: '!ימים ברצף',
    learnWords: 'למד מילים',
    learnWordsDesc: 'גלו ולמדו מילים חדשות',
    flashcards: 'כרטיסיות',
    flashcardsDesc: 'החליקו כדי לסקור מילים',
    playQuiz: 'שחק חידון',
    playQuizDesc: 'בדקו את אוצר המילים שלכם',
    myWordList: 'רשימת המילים שלי',
    myWordListDesc: 'תרגלו מילים מותאמות אישית',
    progress: 'התקדמות',
    badges: 'תגים',
    earned: 'הושגו',
    quizzes: 'חידונים',
    learned: 'נלמדו',
    mastered: 'שולטים',
    privacyPolicy: 'מדיניות פרטיות',
    madeBy: 'נוצר על ידי עודד דקלבאום',
    findYourLevel: 'מצאו את הרמה שלכם',
    findYourLevelDesc: 'מבחן מהיר להתאמת הרמה',
    chooseLevel: 'בחרו רמה',
    chooseMode: 'בחרו מצב',
    backToMenu: 'חזרה לתפריט',
    skipThisWord: 'דלגו על מילה זו',
    playAgain: 'שחק שוב',
    backToMenuBtn: 'חזרה לתפריט',
    question: 'שאלה',
    of: 'מתוך',

    // Menu extras
    installApp: 'התקינו את האפליקציה',
    installDesc: 'הוסיפו למסך הבית לגישה מהירה',
    install: 'התקנה',
    lightMode: 'מצב בהיר',
    darkModeLabel: 'מצב כהה',
    dismissInstall: 'סגירת הודעת התקנה',
    dayStreakMenu: '!{{count}} ימים ברצף',

    // Level/Mode
    beginner: 'מתחילים',
    intermediate: 'בינוני',
    advanced: 'מתקדם',
    imageQuiz: 'חידון תמונות',
    imageQuizDesc: 'ראו תמונה, בחרו את המילה הנכונה',
    wordQuiz: 'חידון מילים',
    wordQuizDesc: 'ראו מילה, בחרו את התמונה הנכונה',
    audioQuiz: 'חידון שמיעה',
    audioQuizDesc: 'שמעו מילה, בחרו את התמונה הנכונה',
    unlockHint: 'השיגו 7/10 ב{{level}} כדי לפתוח',
    wordsCount: '{{count}} מילים',
    bestScore: 'הכי טוב: {{score}}/10',
    levelLabel: 'רמת {{level}}',

    // Quiz UI
    endQuiz: 'לסיים את החידון?',
    progressSaved: 'ההתקדמות שלכם תישמר.',
    continue: 'המשך',
    endQuizBtn: 'סיים חידון',
    whatIsThis: '?מה זה',
    hearAgain: 'הקישו כדי לשמוע שוב',
    audioUnavailable: 'שמע לא זמין במכשיר זה. מציגים מילים במקום.',
    quitQuiz: 'צאו מהחידון',
    muteSound: 'השתקת צליל',
    enableSound: 'הפעלת צליל',
    pronounceWord: 'הגייה',

    // Results
    amazing: '!מדהים',
    greatJob: '!עבודה מצוינת',
    goodEffort: '!מאמץ טוב',
    keepPracticing: '!המשיכו לתרגל',
    badgesEarned: 'תגים שהושגו',
    review: 'סקירה',
    share: 'שיתוף',
    changeMode: 'שינוי מצב',
    youPicked: 'בחרתם: {{word}}',

    // Learn Mode
    gridView: 'תצוגת רשת',
    detailView: 'תצוגה מפורטת',
    searchPlaceholder: '...חיפוש מילים',
    searchLabel: 'חיפוש מילים',
    all: 'הכל',
    noWordsFound: 'לא נמצאו מילים',
    previousWord: 'מילה קודמת',
    nextWord: 'מילה הבאה',

    // Flashcards
    tapToFlip: 'הקישו כדי להפוך',
    stillLearning: 'עדיין לומד',
    knowIt: 'יודע',
    swipeHint: 'החליקו ימינה = יודע, החליקו שמאלה = עדיין לומד',
    sessionComplete: '!הסבב הושלם',
    noCardsToReview: '!אין כרטיסים לסקירה',
    flipToFront: 'הפוך כרטיס לצד הקדמי',
    flipToBack: 'הפוך כרטיס כדי לראות תשובה',
    flashcardProgress: 'התקדמות כרטיסיות',

    // Badges
    badgesTitle: 'תגים',
    earnedBadge: '!הושג',

    // Progress
    dayStreakLabel: 'ימים ברצף',
    bestStreak: 'הכי טוב: {{count}}',
    wordsSeen: 'מילים שנצפו',
    ofTotal: 'מתוך {{count}}',
    accuracy: 'דיוק',
    vocabularyMastery: 'שליטה באוצר מילים',
    recentQuizzes: 'חידונים אחרונים',
    retakeAssessment: 'בצעו מבחן מחדש',
    takeAssessment: 'בצעו מבחן רמה',
    assessmentLevelLabel: 'רמת מבחן:',

    // Assessment
    quickAssessment: 'מבחן מהיר',
    skip: 'דלגו',

    // Personal List
    enterWords: ':הכניסו או הדביקו רשימת מילים (מילה בכל שורה או מופרדות בפסיקים)',
    findWords: 'מצאו מילים',
    foundWords: 'נמצאה {{count}} מילה',
    foundWordsPlural: 'נמצאו {{count}} מילים',
    notInWordBank: 'עדיין לא בבנק המילים',
    needMinWords: 'נדרשות לפחות 4 מילים תואמות כדי להתחיל חידון.',
    noWordsInBank: 'אף מילה לא נמצאה בבנק המילים. נסו מילים כמו: cat, dog, apple, house, car.',
    imageQuizCount: 'חידון תמונות ({{count}} מילים)',
    linkCopied: 'הקישור הועתק',
    shareImageQuiz: 'שתפו חידון תמונות',
    shareWordQuiz: 'שתפו חידון מילים',

    // Loading
    loading: 'טוען',
    preparingQuiz: '...מכינים את החידון',
    takingLonger: '.לוקח יותר מהצפוי. בדקו את החיבור שלכם',
    retry: 'נסו שוב',
    loadingQuiz: 'טוען חידון',

    // Multi-player
    whoIsPlaying: 'מי משחק?',
    switchPlayer: 'החלפת שחקן',
    managePlayers: 'ניהול שחקנים',
    addPlayer: 'הוסף שחקן',
    createPlayer: 'צור שחקן',
    playerName: 'שם השחקן',
    chooseAvatar: 'בחר סמל',
    deletePlayer: 'מחק שחקן',
    deleteConfirm: 'למחוק את {{name}}? כל ההתקדמות תאבד.',
    resetProgress: 'אפס התקדמות',
    resetConfirm: 'לאפס את כל ההתקדמות של {{name}}?',
    playingAs: 'משחק בתור {{name}}',
    canYouRead: 'אתם יכולים לקרוא מילים באנגלית?',
    iCanRead: 'אני יכול לקרוא!',
    notYet: 'עוד לא',
    parentCanChange: 'הורה יכול לשנות את זה אחר כך',
    canReadLabel: 'יכול לקרוא אנגלית',
    listenMatchQuiz: 'האזן והתאם',
    listenMatchQuizDesc: 'שמעו וראו מילה, בחרו את התמונה הנכונה',
    tapToHear: 'לחץ לשמוע שוב',

    // Learn Mode empty state
    tryDifferentSearch: 'נסו חיפוש או קטגוריה אחרת',

    // Onboarding i18n
    chooseLanguage: 'באיזו שפה אתם מדברים?',
    welcomeTitle: '!ברוכים הבאים',
    welcomeWithName: '!{{name}} ,ברוכים הבאים',
    welcomeDesc: 'למדו מילים חדשות באנגלית דרך חידונים וכרטיסיות.',
    seeAndLearn: 'ראו ולמדו',
    seeAndLearnDesc: 'התאימו מילים לתמונות, שמעו איך הן נשמעות ועקבו אחרי ההתקדמות.',
    tryItOut: '!נסו את זה',
    whatWordMatches: 'איזו מילה מתאימה לתמונה?',
    demoCorrect: '!כל הכבוד',
    demoWrong: 'לא בדיוק — זה <strong>{{word}}</strong>! תתרגלו בקרוב.',
    demoWrongPrefix: 'לא בדיוק — זה',
    demoWrongSuffix: '! תתרגלו בקרוב.',

    // Parent email
    parentEmailTitle: '(אימייל הורה (אופציונלי',
    parentEmailDesc: 'קבלו דוחות התקדמות וטיפים ללמידה. לעולם לא נשתף את האימייל שלכם.',
    parentEmailPlaceholder: 'parent@email.com',
    skipStep: 'דלגו על שלב זה',

    // Data export/import
    exportData: 'ייצוא נתונים',
    importData: 'ייבוא נתונים',

    // Learning path
    learningPath: 'מסלול למידה',
    learningPathDesc: 'עקבו אחרי שיעורים נושאיים צעד אחר צעד',
    lessonProgress: '{{done}} / {{total}} שולטים',

    // Parent dashboard
    parentDashboard: 'לוח הורים',

    // Share text
    shareText: '!Children Do English-ב {{total}}/{{score}} השגתי',
    shareTextPerfect: '!ניקוד מושלם !Children Do English-ב {{total}}/{{score}} השגתי',
    shareQuizTitle: 'חידון אנגלית',

    // Cookie consent
    cookieConsent: 'אנחנו משתמשים בנתונים סטטיסטיים כדי לשפר את האפליקציה. לא נאסף מידע אישי.',
    accept: 'אישור',
    decline: 'דחייה',

    // Notifications
    enableReminders: 'הפעלת תזכורות רצף',
    disableReminders: 'ביטול תזכורות רצף',
  },
};

export function t(key, lang = 'en', params) {
  let str = translations[lang]?.[key] || translations.en[key] || key;
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      str = str.replace(new RegExp(`\\{\\{${k}\\}\\}`, 'g'), v);
    });
  }
  return str;
}

export function isRTL(lang) {
  return lang === 'he';
}
