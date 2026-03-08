import { useState, useEffect, useRef, useCallback, lazy, Suspense } from 'react';
import ErrorBoundary from './components/ErrorBoundary';
import LoadingScreen from './components/LoadingScreen';
import Menu from './components/Menu';
import LandingPage from './components/LandingPage';
import Confetti from './components/Confetti';
import { loadStats, saveStats, isDarkMode, saveDarkMode, isSoundEnabled, saveSoundEnabled, loadPlayerRegistry, updateStreak, updateDailyGoal } from './utils/storage';
import { initTTS } from './utils/sound';
import { isRTL, t, loadHebrew } from './utils/i18n';
import useQuizFlow from './hooks/useQuizFlow';
import usePlayerManagement from './hooks/usePlayerManagement';
import useInstallPrompt from './hooks/useInstallPrompt';
import CookieConsent from './components/CookieConsent';
import { needsConsentPrompt, setAnalyticsConsent, analytics } from './utils/analytics';
import { checkStreakReminder } from './utils/notifications';
import { getDueWords } from './utils/spaced-repetition';
import { WORDS } from './data/words';


const Onboarding = lazy(() => import('./components/Onboarding'));
const LevelSelect = lazy(() => import('./components/LevelSelect'));
const ModeSelect = lazy(() => import('./components/ModeSelect'));
const ImageQuiz = lazy(() => import('./components/ImageQuiz'));
const WordQuiz = lazy(() => import('./components/WordQuiz'));
const AudioQuiz = lazy(() => import('./components/AudioQuiz'));
const ListenMatchQuiz = lazy(() => import('./components/ListenMatchQuiz'));
const ResultScreen = lazy(() => import('./components/ResultScreen'));
const LearnMode = lazy(() => import('./components/LearnMode'));
const FlashcardMode = lazy(() => import('./components/FlashcardMode'));
const BadgesView = lazy(() => import('./components/BadgesView'));
const ProgressDashboard = lazy(() => import('./components/ProgressDashboard'));
// AssessmentFlow removed — levels unlock via quiz scores
const PersonalWordList = lazy(() => import('./components/PersonalWordList'));
const UpdatePrompt = lazy(() => import('./components/UpdatePrompt'));
const PrivacyPolicy = lazy(() => import('./components/PrivacyPolicy'));
const AdminPanel = lazy(() => import('./components/admin/AdminPanel'));
const PlayerCreate = lazy(() => import('./components/PlayerCreate'));
const PlayerSelect = lazy(() => import('./components/PlayerSelect'));
const PlayerManage = lazy(() => import('./components/PlayerManage'));
const ProfilePicker = lazy(() => import('./components/ProfilePicker'));
const LearningPath = lazy(() => import('./components/LearningPath'));
const ParentDashboard = lazy(() => import('./components/ParentDashboard'));
const DailyReview = lazy(() => import('./components/DailyReview'));

// State-to-path mapping for browser history (top-level screens only)
const STATE_TO_PATH = {
  landing: '/',
  menu: '/app',
  levelSelect: '/play',
  learning: '/learn',
  flashcards: '/flashcards',
  badges: '/badges',
  progress: '/progress',
  learningPath: '/path',
  parentDashboard: '/parent',
  privacy: '/privacy',
  playerSelect: '/players',
  playerManage: '/manage',
  playerCreate: '/new-player',
  personalList: '/my-words',
  dailyReview: '/daily-review',
};

const PATH_TO_STATE = Object.fromEntries(
  Object.entries(STATE_TO_PATH).map(([state, path]) => [path, state])
);

function SuspenseFallback({ lang = 'en' }) {
  const [showRetry, setShowRetry] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setShowRetry(true), 10000);
    return () => clearTimeout(timer);
  }, []);
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      {showRetry && (
        <button
          onClick={() => window.location.reload()}
          className="text-sm text-blue-600 hover:underline"
        >
          {t('loadingRetry', lang)}
        </button>
      )}
    </div>
  );
}

function getInitialState() {
  const registry = loadPlayerRegistry();
  const stats = registry ? loadStats(registry.activePlayerId) : loadStats();
  // Always start on landing page
  return { gameState: 'landing', registry, stats };
}

export default function App() {
  const initial = useRef(getInitialState());

  const [stats, setStats] = useState(() => initial.current.stats || loadStats());
  const [gameState, setGameState] = useState(() => initial.current.gameState);
  const [darkMode, setDarkMode] = useState(() => isDarkMode());
  const [soundEnabled, setSoundEnabled] = useState(() => isSoundEnabled());

  const [showProfilePicker, setShowProfilePicker] = useState(false);
  const [showConsent, setShowConsent] = useState(() => needsConsentPrompt());
  const [learnWords, setLearnWords] = useState(null);
  const [sharedWords, setSharedWords] = useState(null);
  const [focusedWords, setFocusedWords] = useState(null);
  const [isOffline, setIsOffline] = useState(() => typeof navigator !== 'undefined' && !navigator.onLine);
  const [storageFull, setStorageFull] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const mainRef = useRef(null);
  const prevBadgeCount = useRef(stats.badges?.length || 0);

  const navigate = useCallback((newState, direction = 'forward') => {
    setGameState(newState);
    const path = STATE_TO_PATH[newState];
    if (path) {
      if (direction === 'back') {
        history.replaceState({ gameState: newState }, '', path);
      } else {
        history.pushState({ gameState: newState }, '', path);
      }
    }
    analytics.screenView(newState);
    const features = ['landing', 'learning', 'flashcards', 'badges', 'progress', 'personalList', 'learningPath', 'parentDashboard', 'dailyReview'];
    if (features.includes(newState)) analytics.featureUse(newState);
  }, []);

  // Extracted hooks
  const {
    playerRegistry, setPlayerRegistry, activePlayer,
    handleCreatePlayer, handleSelectPlayer, handleUpdatePlayer,
    handleResetPlayer, handleDeletePlayer,
  } = usePlayerManagement({ navigate, setStats });

  const wrappedDeletePlayer = useCallback((id) => {
    setShowProfilePicker(false);
    handleDeletePlayer(id);
  }, [handleDeletePlayer]);

  const { showInstallBanner, handleInstall, dismissInstall, isIOS } = useInstallPrompt({
    gameState,
    totalQuizzes: stats.totalQuizzes,
  });

  // Show confetti when new badges are earned
  useEffect(() => {
    const currentCount = stats.badges?.length || 0;
    if (currentCount > prevBadgeCount.current) {
      setShowConfetti(true);
      const timer = setTimeout(() => setShowConfetti(false), 3500);
      prevBadgeCount.current = currentCount;
      return () => clearTimeout(timer);
    }
    prevBadgeCount.current = currentCount;
  }, [stats.badges]);

  // Move focus to main container on view change for screen readers
  useEffect(() => {
    if (mainRef.current) mainRef.current.focus();
  }, [gameState]);

  // All SPA routes canonicalize to homepage (robots.txt blocks crawling of app screens)
  useEffect(() => {
    const path = STATE_TO_PATH[gameState];
    if (path) {
      const canonical = document.querySelector('link[rel="canonical"]');
      if (canonical) {
        canonical.setAttribute('href', 'https://childrendoenglish.com/');
      }
    }
  }, [gameState]);

  // Dark mode sync
  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  // Language direction sync + meta tags
  const lang = stats.uiLanguage || 'en';
  const [, forceUpdate] = useState(0);
  useEffect(() => {
    if (lang === 'he') loadHebrew().then(() => forceUpdate(n => n + 1));
    document.documentElement.dir = isRTL(lang) ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
    const desc = document.querySelector('meta[name="description"]');
    if (desc) {
      desc.setAttribute('content', lang === 'he'
        ? 'אפליקציה חינמית ללימוד אוצר מילים באנגלית לילדים בגילאי 6-12. למדו כ-300 מילים באנגלית דרך חידוני תמונות, כרטיסיות ואתגרי שמע. ללא פרסומות, ללא צורך בהרשמה.'
        : 'Help your kids grow their English vocabulary through fun image quizzes, flashcards, and audio challenges. Perfect for ages 6-12, with Hebrew support.');
    }
    const kw = document.querySelector('meta[name="keywords"]');
    if (kw) {
      kw.setAttribute('content', lang === 'he'
        ? 'לימוד אנגלית לילדים, משחקי אנגלית, אוצר מילים באנגלית, פלאש קארדס, עברית אנגלית, אפליקציה חינוכית, הגייה אנגלית, משחקים חינוכיים לילדים, אפליקציה אנגלית חינם, דוברי עברית אנגלית'
        : 'english vocabulary, kids learning, vocabulary quiz, english for kids, learn english, flashcards, hebrew english, ESL games for children, english words for kids, learn english vocabulary online free, english learning app for kids, picture vocabulary games, vocabulary builder kids, english practice kids, educational games kids, free english learning games, english pronunciation app for kids, bilingual vocabulary app, hebrew english learning app, spaced repetition vocabulary kids, esl practice app for kids');
    }
  }, [lang]);

  // Read ?lang= URL param on mount (for hreflang SEO)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlLang = params.get('lang');
    if (urlLang === 'he' && lang !== 'he') {
      setStats(prev => ({ ...prev, uiLanguage: 'he' }));
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Init TTS
  useEffect(() => { initTTS(); }, []);

  // Online/offline detection
  useEffect(() => {
    const goOffline = () => setIsOffline(true);
    const goOnline = () => setIsOffline(false);
    window.addEventListener('offline', goOffline);
    window.addEventListener('online', goOnline);
    return () => {
      window.removeEventListener('offline', goOffline);
      window.removeEventListener('online', goOnline);
    };
  }, []);

  // Storage full detection
  useEffect(() => {
    const handleStorageFull = () => setStorageFull(true);
    window.addEventListener('storagefull', handleStorageFull);
    return () => window.removeEventListener('storagefull', handleStorageFull);
  }, []);

  // Check streak reminder on mount
  useEffect(() => { checkStreakReminder(stats, lang); }, [stats, lang]);

  // Persist stats to active player
  useEffect(() => {
    saveStats(stats, playerRegistry?.activePlayerId);
  }, [stats, playerRegistry?.activePlayerId]);

  const quizFlow = useQuizFlow({ stats, setStats, navigate });

  const resetToMenu = useCallback(() => {
    navigate('menu', 'back');
  }, [navigate]);

  const toggleDarkMode = useCallback(() => {
    setDarkMode(d => {
      saveDarkMode(!d);
      return !d;
    });
  }, []);

  const toggleSound = useCallback(() => {
    setSoundEnabled(s => {
      saveSoundEnabled(!s);
      return !s;
    });
  }, []);

  const handleOnboardingComplete = useCallback(() => {
    setStats(prev => {
      const updated = { ...prev, hasSeenOnboarding: true };
      return updated;
    });
    analytics.onboardingComplete();
    navigate('menu');
  }, [navigate]);

  const handleLanguageSelect = useCallback((lang) => {
    setStats(prev => ({ ...prev, uiLanguage: lang }));
  }, []);

  const handleToggleLanguage = useCallback(() => {
    setStats(prev => ({ ...prev, uiLanguage: prev.uiLanguage === 'he' ? 'en' : 'he' }));
  }, []);

  // Detect hash routes: #admin, #quiz/{mode}/{ids}, #words/{ids}
  useEffect(() => {
    const checkHash = async () => {
      const hash = window.location.hash;
      if (hash === '#admin') {
        setGameState('admin');
        return;
      }
      const quizMatch = hash.match(/^#quiz\/(image|word)\/(.+)$/);
      if (quizMatch) {
        const mode = quizMatch[1];
        const ids = quizMatch[2].split(',');
        const { getWordById } = await import('./data/words');
        const words = ids.map(id => getWordById(id)).filter(Boolean);
        window.location.hash = '';
        if (words.length >= 4) {
          setFocusedWords(words);
          quizFlow.startQuiz(null, mode, words);
        }
        return;
      }
      const wordsMatch = hash.match(/^#words\/(.+)$/);
      if (wordsMatch) {
        const ids = wordsMatch[1].split(',');
        const { getWordById } = await import('./data/words');
        const words = ids.map(id => getWordById(id)).filter(Boolean);
        window.location.hash = '';
        if (words.length > 0) {
          setSharedWords(words);
          setFocusedWords(words);
          setGameState('personalList');
        }
      }
    };
    checkHash();
    window.addEventListener('hashchange', checkHash);
    return () => window.removeEventListener('hashchange', checkHash);
  }, [quizFlow]);

  // Browser history: popstate listener + initial state
  useEffect(() => {
    // Set initial URL to match current state
    const initialPath = STATE_TO_PATH[gameState];
    if (initialPath && window.location.pathname !== initialPath) {
      history.replaceState({ gameState }, '', initialPath);
    }

    const handlePopState = (e) => {
      const state = e.state?.gameState;
      if (state) {
        setGameState(state);
        return;
      }
      // Derive from URL path
      const mapped = PATH_TO_STATE[window.location.pathname];
      if (mapped) {
        setGameState(mapped);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Assessment removed — levels unlock via quiz scores (7+/10)

  const renderState = () => {
    switch (gameState) {
      case 'landing':
        return (
          <LandingPage
            lang={lang}
            activePlayer={activePlayer}
            onGetStarted={() => navigate('languageSelect')}
            onContinue={() => {
              if (playerRegistry?.players.length >= 2) {
                navigate('playerSelect');
              } else {
                navigate('menu');
              }
            }}
            onPrivacy={() => navigate('privacy')}
            onToggleLanguage={handleToggleLanguage}
          />
        );

      case 'languageSelect':
        return (
          <div className="animate-fade-in space-y-8 text-center">
            <div className="glass rounded-3xl p-8 max-w-sm mx-auto space-y-6">
              <div className="w-20 h-20 mx-auto rounded-2xl flex items-center justify-center bg-blue-100">
                <span className="text-4xl">🌍</span>
              </div>
              <h2 className="text-2xl font-bold text-slate-800">{t('confirmLanguage', lang)}</h2>
              <div className="space-y-3">
                <button
                  onClick={() => {
                    handleLanguageSelect('en');
                    navigate(playerRegistry?.players?.length ? 'menu' : 'playerCreate');
                  }}
                  className="w-full py-3 px-6 bg-blue-600 text-white rounded-xl font-semibold
                             hover:bg-blue-700 active:scale-95 transition-all text-lg"
                >
                  English
                </button>
                <button
                  onClick={() => {
                    handleLanguageSelect('he');
                    loadHebrew().then(() => {
                      navigate(playerRegistry?.players?.length ? 'menu' : 'playerCreate');
                    });
                  }}
                  className="w-full py-3 px-6 bg-white border-2 border-blue-200 text-blue-700
                             rounded-xl font-semibold hover:bg-blue-50 active:scale-95
                             transition-all text-lg"
                >
                  עברית (Hebrew)
                </button>
              </div>
            </div>
          </div>
        );

      case 'playerCreate':
        return (
          <PlayerCreate
            lang={lang}
            onCreatePlayer={handleCreatePlayer}
            onBack={playerRegistry?.players.length > 0 ? () => navigate('playerSelect', 'back') : () => navigate('landing', 'back')}
          />
        );

      case 'playerSelect':
        return (
          <PlayerSelect
            players={playerRegistry?.players || []}
            activePlayerId={playerRegistry?.activePlayerId}
            lang={lang}
            onSelectPlayer={handleSelectPlayer}
            onManage={() => navigate('playerManage')}
            onAddPlayer={() => navigate('playerCreate')}
          />
        );

      case 'playerManage':
        return (
          <PlayerManage
            players={playerRegistry?.players || []}
            lang={lang}
            onUpdatePlayer={handleUpdatePlayer}
            onResetPlayer={handleResetPlayer}
            onDeletePlayer={wrappedDeletePlayer}
            onAddPlayer={() => navigate('playerCreate')}
            onBack={() => navigate('menu', 'back')}
          />
        );

      case 'onboarding':
        return (
          <Onboarding
            onComplete={handleOnboardingComplete}
            activePlayer={activePlayer}
            lang={lang}
          />
        );

      case 'menu':
        return (
          <Menu
            stats={stats}
            darkMode={darkMode}
            soundEnabled={soundEnabled}
            lang={lang}
            activePlayer={activePlayer}
            playerCount={playerRegistry?.players.length || 0}
            showInstallBanner={showInstallBanner}
            isIOS={isIOS}
            dueCount={getDueWords(WORDS, stats.wordProgress || {}).length}
            onInstall={handleInstall}
            onDismissInstall={dismissInstall}
            onNavigate={navigate}
            onToggleDark={toggleDarkMode}
            onToggleSound={toggleSound}
            onOpenProfilePicker={() => setShowProfilePicker(true)}
            onToggleLanguage={handleToggleLanguage}
          />
        );

      case 'levelSelect':
        return (
          <LevelSelect
            stats={stats}
            lang={lang}
            onSelect={quizFlow.handleLevelSelect}
            onBack={() => navigate('menu', 'back')}
          />
        );

      case 'modeSelect':
        return (
          <ModeSelect
            level={quizFlow.selectedLevel}
            lang={lang}
            canRead={activePlayer?.canRead ?? true}
            onSelect={quizFlow.handleModeSelect}
            onBack={() => navigate('levelSelect', 'back')}
          />
        );

      case 'loading':
        return <LoadingScreen progress={quizFlow.loadingProgress} lang={lang} onCancel={resetToMenu} />;

      case 'imageQuiz':
        return (
          <ImageQuiz
            words={quizFlow.quizWords}
            lang={lang}
            soundEnabled={soundEnabled}
            onToggleSound={toggleSound}
            onComplete={quizFlow.handleQuizComplete}
            onQuit={() => focusedWords ? navigate('personalList', 'back') : navigate('menu', 'back')}
          />
        );

      case 'wordQuiz':
        return (
          <WordQuiz
            words={quizFlow.quizWords}
            lang={lang}
            soundEnabled={soundEnabled}
            onToggleSound={toggleSound}
            onComplete={quizFlow.handleQuizComplete}
            onQuit={() => focusedWords ? navigate('personalList', 'back') : navigate('menu', 'back')}
          />
        );

      case 'audioQuiz':
        return (
          <AudioQuiz
            words={quizFlow.quizWords}
            lang={lang}
            soundEnabled={soundEnabled}
            onToggleSound={toggleSound}
            onComplete={quizFlow.handleQuizComplete}
            onQuit={() => focusedWords ? navigate('personalList', 'back') : navigate('menu', 'back')}
          />
        );

      case 'listenMatchQuiz':
        return (
          <ListenMatchQuiz
            words={quizFlow.quizWords}
            lang={lang}
            soundEnabled={soundEnabled}
            onToggleSound={toggleSound}
            onComplete={quizFlow.handleQuizComplete}
            onQuit={() => focusedWords ? navigate('personalList', 'back') : navigate('menu', 'back')}
          />
        );

      case 'finished':
        return (
          <ResultScreen
            results={quizFlow.quizResults}
            stats={stats}
            lang={lang}
            level={quizFlow.selectedLevel}
            mode={quizFlow.selectedMode}
            onPlayAgain={() => quizFlow.startQuiz(quizFlow.selectedLevel, quizFlow.selectedMode, quizFlow.customWords)}
            onChangeMode={() => navigate('modeSelect', 'back')}
            onMenu={() => focusedWords ? navigate('personalList', 'back') : navigate('menu', 'back')}
          />
        );

      case 'learning':
        return (
          <LearnMode
            stats={stats}
            lang={lang}
            canRead={activePlayer?.canRead ?? true}
            words={learnWords}
            onBack={() => { setLearnWords(null); focusedWords ? navigate('personalList', 'back') : navigate('menu', 'back'); }}
          />
        );

      case 'flashcards':
        return (
          <FlashcardMode
            stats={stats}
            lang={lang}
            canRead={activePlayer?.canRead ?? true}
            words={focusedWords}
            onUpdateStats={setStats}
            onBack={() => focusedWords ? navigate('personalList', 'back') : navigate('menu', 'back')}
          />
        );

      case 'badges':
        return (
          <BadgesView
            stats={stats}
            lang={lang}
            onBack={() => navigate('menu', 'back')}
          />
        );

      case 'progress':
        return (
          <ProgressDashboard
            stats={stats}
            lang={lang}
            onBack={() => navigate('menu', 'back')}
          />
        );

      case 'personalList':
        return (
          <PersonalWordList
            lang={lang}
            onStartQuiz={(words, mode) => { setFocusedWords(words); quizFlow.handleStartPersonalQuiz(words, mode); }}
            onLearn={(words) => { setFocusedWords(words); setLearnWords(words); navigate('learning'); }}
            onFlashcard={(words) => { setFocusedWords(words); navigate('flashcards'); }}
            onBack={() => { setSharedWords(null); setFocusedWords(null); navigate('menu', 'back'); }}
            initialWords={sharedWords || focusedWords}
          />
        );

      case 'learningPath':
        return (
          <LearningPath
            stats={stats}
            lang={lang}
            onBack={() => navigate('menu', 'back')}
            onStartLesson={(words) => quizFlow.handleStartPersonalQuiz(words, 'image')}
            onLearnLesson={(words) => { setLearnWords(words); navigate('learning'); }}
          />
        );

      case 'dailyReview':
        return (
          <DailyReview
            words={getDueWords(WORDS, stats.wordProgress || {})}
            stats={stats}
            lang={lang}
            canRead={activePlayer?.canRead ?? true}
            onComplete={(results) => {
              setStats(prev => {
                let updated = { ...prev, wordProgress: results.wordProgress };
                updated = updateStreak(updated);
                updated = updateDailyGoal(updated, results.answers?.length || results.total);
                return updated;
              });
            }}
            onBack={() => navigate('menu', 'back')}
          />
        );

      case 'parentDashboard':
        return (
          <ParentDashboard
            players={playerRegistry?.players || []}
            lang={lang}
            onBack={() => navigate('menu', 'back')}
          />
        );

      case 'privacy':
        return (
          <PrivacyPolicy lang={lang} onBack={() => navigate('menu', 'back')} />
        );

      case 'admin':
        return (
          <AdminPanel
            onExit={() => {
              window.location.hash = '';
              navigate('menu', 'back');
            }}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="app-bg min-h-screen pb-safe">
      <Confetti active={showConfetti} />
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded-lg focus:text-sm focus:font-semibold">
        Skip to content
      </a>
      {isOffline && (
        <div className="bg-amber-100 text-amber-800 text-center text-sm py-2 px-4 font-medium" role="alert">
          {t('offlineMessage', lang)}
        </div>
      )}
      {storageFull && (
        <div className="bg-rose-100 text-rose-800 text-center text-sm py-2 px-4 font-medium flex items-center justify-center gap-2" role="alert">
          {t('storageFull', lang)}
          <button onClick={() => setStorageFull(false)} className="underline font-semibold">&times;</button>
        </div>
      )}
      <main id="main-content" ref={mainRef} tabIndex={-1} className={`${gameState === 'admin' ? 'max-w-5xl' : 'max-w-lg md:max-w-2xl'} mx-auto px-4 py-6 outline-none`}>
        <Suspense fallback={<SuspenseFallback lang={lang} />}>
          <ErrorBoundary key={gameState} onReset={resetToMenu} lang={lang}>
            {renderState()}
          </ErrorBoundary>
        </Suspense>
      </main>
      <Suspense fallback={null}>
        <UpdatePrompt lang={lang} />
      </Suspense>
      {showConsent && (
        <CookieConsent
          lang={lang}
          onAccept={() => { setAnalyticsConsent(true); setShowConsent(false); }}
          onDecline={() => { setAnalyticsConsent(false); setShowConsent(false); }}
        />
      )}
      <Suspense fallback={null}>
        <ProfilePicker
          open={showProfilePicker}
          onClose={() => setShowProfilePicker(false)}
          players={playerRegistry?.players || []}
          activePlayerId={playerRegistry?.activePlayerId}
          lang={lang}
          onSwitch={(id) => { setShowProfilePicker(false); handleSelectPlayer(id); }}
          onAdd={() => { setShowProfilePicker(false); navigate('playerCreate'); }}
          onDelete={wrappedDeletePlayer}
        />
      </Suspense>
    </div>
  );
}
