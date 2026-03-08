const translations = {
  he: null, // lazy-loaded
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
    startHere: 'Start here!',
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
    backToList: 'Back to list',

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
    skip: 'Skip',

    // Personal List
    enterWords: 'Enter or paste your word list (one word per line or comma-separated):',
    findWords: 'Find Words',
    foundWords: 'Found {{count}} word',
    foundWordsPlural: 'Found {{count}} words',
    notInWordBank: 'Not in word bank yet',
    needMinWords: 'Need at least 4 matching words to start a quiz.',
    noWordsInBank: 'None of those words are in our word bank. Try words like: cat, dog, apple, house, car.',
    clearAll: 'Clear all',
    imageQuizCount: 'Image Quiz ({{count}} words)',
    linkCopied: 'Link copied',
    shareImageQuiz: 'Share image quiz',
    shareWordQuiz: 'Share word quiz',
    shareWordList: 'Share word list',
    learnTheseWords: 'Learn These Words',
    flashcardTheseWords: 'Flashcard These Words',

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
    parentDashboardDesc: 'View learning reports',

    // Share text
    shareText: 'I scored {{score}}/{{total}} on Children Do English!',
    shareTextPerfect: 'I scored {{score}}/{{total}} on Children Do English! Perfect score!',
    shareQuizTitle: 'English Quiz',

    // Cookie consent
    cookieConsent: 'We use Google Analytics to understand app usage. Analytics load only after your consent.',
    accept: 'Accept',
    decline: 'Decline',

    // Notifications
    enableReminders: 'Enable streak reminders',
    disableReminders: 'Disable streak reminders',

    // Error boundary
    errorTitle: 'Something went wrong',
    errorGeneric: 'An unexpected error occurred',

    // Quiz feedback (useQuizState)
    feedbackCorrect: 'Correct! The answer is {{word}}.',
    feedbackWrong: 'Wrong. The correct answer is {{word}}.',
    feedbackSkipped: 'Skipped. The answer is {{word}}.',

    // Notifications text
    streakReminderTitle: 'Keep your streak going!',
    streakReminderBody: 'You have a {{count}}-day streak. Play today to keep it!',

    // Data import/export messages
    importSuccess: 'Data imported successfully!',
    importInvalidJson: 'Invalid JSON file',
    importInvalidFormat: 'Invalid data format',
    importInvalidRegistry: 'Invalid player registry',

    // Accessibility
    correct: 'Correct',
    wrong: 'Wrong',

    // Delete data
    deleteAllData: 'Delete All Data',
    deleteAllConfirm: 'Delete all players and progress? This cannot be undone.',
    cancel: 'Cancel',

    // Language switcher
    language: 'Language',

    // Trust signals
    methodologyTitle: 'Built for learning',
    methodologyDesc: 'Spaced repetition, image-word matching, and multi-modal practice help kids build lasting vocabulary.',

    // Testimonials
    testimonial1Quote: 'My daughter learned 50 new words in just 2 weeks!',
    testimonial1Author: 'Sarah, parent',
    testimonial2Quote: 'The image quizzes make learning fun. My son asks to play every day.',
    testimonial2Author: 'David, parent',
    testimonial3Quote: 'Finally an app that\'s actually free and has no ads!',
    testimonial3Author: 'Maya, parent',
    testimonialsLabel: 'What parents say',

    // Edit player
    editPlayer: 'Edit player',

    // Privacy policy
    privacyTitle: 'Privacy Policy',
    privacyUpdated: 'Last updated: February 28, 2026',
    privacyDataTitle: 'What data we collect',
    privacyDataDesc: 'Children Do English does not collect any personal information. We do not ask for names, email addresses, or any other identifying details.',
    privacyCookieTitle: 'Cookies & tracking',
    privacyCookieDesc: 'We use Google Analytics to understand how the app is used (page views, feature usage, basic device information). Google Analytics uses cookies and may collect anonymized data. Analytics are only loaded after you give consent via the cookie banner. We do not use any advertising services.',
    privacyStorageTitle: 'What is stored on your device',
    privacyStorageDesc: 'Your learning progress (quiz scores, word progress, streak, badges, and preferences like dark mode and sound) is saved in your browser\'s local storage. This data never leaves your device and is not sent to any server.',
    privacyThirdPartyTitle: 'Third-party services',
    privacyThirdPartyDesc: 'The app uses Google Analytics for usage statistics (loaded only after consent). The browser\'s built-in speech synthesis may connect to your device\'s speech engine for word pronunciation. All word data and images are bundled with the app.',
    privacyChildrenTitle: 'Children\'s privacy',
    privacyChildrenDesc: 'This app is designed for children ages 6-12. Because we do not collect or transmit any personal data, there is no risk of children\'s information being shared or misused.',
    privacyDeleteTitle: 'Deleting your data',
    privacyDeleteDesc: 'You can clear all saved progress by clearing your browser\'s site data for this website, or by using your browser\'s "Clear browsing data" feature.',
    privacyContactTitle: 'Contact',
    privacyContactDesc: 'Children Do English is made by Oded Deckelbaum. If you have questions about this privacy policy or the app, email',

    // Category names
    cat_animals: 'Animals',
    cat_food: 'Food',
    cat_home: 'Home',
    cat_transport: 'Transport',
    cat_nature: 'Nature',
    cat_colors: 'Colors',
    cat_numbers: 'Numbers',
    cat_clothing: 'Clothing',
    cat_school: 'School',
    cat_sports: 'Sports',

    cat_feelings: 'Feelings',
    cat_everyday: 'Everyday',
    cat_toys: 'Toys',

    // Quiz modes
    mode_image: 'Image Quiz',
    mode_word: 'Word Quiz',
    mode_audio: 'Audio Quiz',
    mode_listen: 'Listen & Match',

    // Aria labels
    skipOnboarding: 'Skip onboarding',
    previousStep: 'Previous step',
    nextStep: 'Next step',
    quizProgress: 'Quiz progress',
    selectAvatarLabel: 'Select {{avatar}} avatar',
    noPlayersFound: 'No players found',
    dailyGoalProgress: 'Daily goal progress',

    // Badge names
    badge_first_word: 'First Word',
    badge_first_word_desc: 'Complete your first quiz',
    badge_word_explorer: 'Word Explorer',
    badge_word_explorer_desc: 'Learn 20 different words',
    badge_perfect_quiz: 'Perfect Score',
    badge_perfect_quiz_desc: 'Get 10/10 on any quiz',
    badge_bookworm: 'Bookworm',
    badge_bookworm_desc: 'Complete 10 quizzes',
    badge_vocab_champion: 'Vocab Champion',
    badge_vocab_champion_desc: 'Master 50 words',
    badge_week_warrior: 'Week Warrior',
    badge_week_warrior_desc: 'Practice 7 days in a row',
    badge_polyglot: 'Polyglot',
    badge_polyglot_desc: 'Learn 100 different words',

    // Loading fallback (SuspenseFallback)
    loadingRetry: 'Taking too long? Tap to reload',

    // Update prompt
    updateAvailable: 'New update available!',
    updateBtn: 'Update',

    // Onboarding demo
    mysteryWord: 'Mystery word',
    demoDog: 'Dog',
    demoCat: 'Cat',
    demoFish: 'Fish',

    // Personal word list placeholder
    wordListPlaceholder: 'cat, dog, apple, tree...',

    // Offline indicator
    offlineMessage: 'You are offline. Some features may not work.',

    // Storage full warning
    storageFull: 'Storage is full. Your progress may not be saved. Try clearing old browser data.',

    // COPPA compliance
    privacyCoppaTitle: 'COPPA compliance',
    privacyCoppaDesc: 'Children Do English complies with the Children\'s Online Privacy Protection Act (COPPA). We do not knowingly collect personal information from children under 13. All learning data is stored locally on the device and is never transmitted to our servers.',

    // Daily Review
    dailyReview: 'Daily Review',
    dailyReviewDesc: 'Review words you\'ve learned',
    wordsDue: '{{count}} words due',
    allCaughtUp: 'All caught up!',
    reviewComplete: 'Review Complete!',
    wordsReviewed: 'Words reviewed',
  },
};

// Lazy-load Hebrew translations on first use
let heLoading = null;
export function loadHebrew() {
  if (translations.he) return Promise.resolve();
  if (!heLoading) {
    heLoading = import('./i18n-he.js').then(m => {
      translations.he = m.default;
    });
  }
  return heLoading;
}

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
