import { useState, useEffect, useRef, useCallback, lazy, Suspense } from 'react';
import ErrorBoundary from './components/ErrorBoundary';
import LoadingScreen from './components/LoadingScreen';
import Menu from './components/Menu';
import { loadStats, saveStats, isDarkMode, saveDarkMode, isSoundEnabled, saveSoundEnabled, loadPlayerRegistry, savePlayerRegistry, addPlayer, removePlayer, resetPlayerProgress, updatePlayerProfile } from './utils/storage';
import { initTTS } from './utils/sound';
import { isRTL, t, loadHebrew } from './utils/i18n';
import useQuizFlow from './hooks/useQuizFlow';
import CookieConsent from './components/CookieConsent';
import { needsConsentPrompt, setAnalyticsConsent, analytics } from './utils/analytics';
import { checkStreakReminder } from './utils/notifications';


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
const AssessmentFlow = lazy(() => import('./components/AssessmentFlow'));
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

// State-to-path mapping for browser history (top-level screens only)
const STATE_TO_PATH = {
  menu: '/',
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

  // No registry and no legacy data → first-ever use
  if (!registry) return { gameState: 'playerCreate', registry: null };

  const activePlayer = registry.players.find(p => p.id === registry.activePlayerId);
  const stats = loadStats(registry.activePlayerId);

  // 2+ players → show player select
  if (registry.players.length >= 2) {
    return { gameState: 'playerSelect', registry, stats };
  }

  // 1 player, not onboarded but has stats from data import → skip onboarding
  if (!stats.hasSeenOnboarding && stats.totalQuizzes === 0 && Object.keys(stats.wordProgress || {}).length === 0) {
    return { gameState: 'onboarding', registry, stats };
  }

  // 1 player, onboarded → menu
  return { gameState: 'menu', registry, stats };
}

export default function App() {
  const initial = useRef(getInitialState());

  const [playerRegistry, setPlayerRegistry] = useState(() => initial.current.registry);
  const [stats, setStats] = useState(() => initial.current.stats || loadStats());
  const [gameState, setGameState] = useState(() => initial.current.gameState);
  const [darkMode, setDarkMode] = useState(() => isDarkMode());
  const [soundEnabled, setSoundEnabled] = useState(() => isSoundEnabled());

  const [showProfilePicker, setShowProfilePicker] = useState(false);
  const [showConsent, setShowConsent] = useState(() => needsConsentPrompt());
  const [learnWords, setLearnWords] = useState(null);
  const [isOffline, setIsOffline] = useState(() => typeof navigator !== 'undefined' && !navigator.onLine);
  const [storageFull, setStorageFull] = useState(false);
  const mainRef = useRef(null);

  // Derived: active player from registry
  const activePlayer = playerRegistry?.players.find(p => p.id === playerRegistry.activePlayerId) || null;

  // Move focus to main container on view change for screen readers
  useEffect(() => {
    if (mainRef.current) mainRef.current.focus();
  }, [gameState]);

  // Update canonical URL when route changes
  useEffect(() => {
    const path = STATE_TO_PATH[gameState];
    if (path) {
      const canonical = document.querySelector('link[rel="canonical"]');
      if (canonical) {
        canonical.setAttribute('href', `https://childrendoenglish.com${path}`);
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
    // Update meta description for language
    const desc = document.querySelector('meta[name="description"]');
    if (desc) {
      desc.setAttribute('content', lang === 'he'
        ? 'אפליקציה חינמית ללימוד אוצר מילים באנגלית לילדים בגילאי 6-12. למדו כ-300 מילים באנגלית דרך חידוני תמונות, כרטיסיות ואתגרי שמע. ללא פרסומות, ללא צורך בהרשמה.'
        : 'Help your kids grow their English vocabulary through fun image quizzes, flashcards, and audio challenges. Perfect for ages 6-12, with Hebrew support.');
    }
    // Update meta keywords for language
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
  useEffect(() => { checkStreakReminder(stats, lang); }, []);

  // PWA install prompt
  const deferredPrompt = useRef(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      deferredPrompt.current = e;
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  // Show install banner on menu after first quiz if prompt is available
  useEffect(() => {
    if (gameState === 'menu' && stats.totalQuizzes >= 1 && deferredPrompt.current && !localStorage.getItem('childrendoenglish-install-dismissed')) {
      setShowInstallBanner(true);
    } else {
      setShowInstallBanner(false);
    }
  }, [gameState, stats.totalQuizzes]);

  const handleInstall = async () => {
    if (!deferredPrompt.current) return;
    deferredPrompt.current.prompt();
    const { outcome } = await deferredPrompt.current.userChoice;
    deferredPrompt.current = null;
    setShowInstallBanner(false);
    analytics.pwaInstall(outcome);
    if (outcome === 'dismissed') {
      localStorage.setItem('childrendoenglish-install-dismissed', '1');
    }
  };

  const dismissInstall = () => {
    setShowInstallBanner(false);
    localStorage.setItem('childrendoenglish-install-dismissed', '1');
  };

  // Persist stats to active player
  useEffect(() => {
    saveStats(stats, playerRegistry?.activePlayerId);
  }, [stats, playerRegistry?.activePlayerId]);

  const navigate = useCallback((newState, direction = 'forward') => {
    setGameState(newState);
    // Update browser history for mapped states
    const path = STATE_TO_PATH[newState];
    if (path) {
      if (direction === 'back') {
        history.replaceState({ gameState: newState }, '', path);
      } else {
        history.pushState({ gameState: newState }, '', path);
      }
    }
    // Track feature usage for key screens
    const features = ['learning', 'flashcards', 'badges', 'progress', 'personalList', 'learningPath', 'parentDashboard'];
    if (features.includes(newState)) analytics.featureUse(newState);
  }, []);

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

  // --- Player handlers ---

  const handleCreatePlayer = useCallback((name, avatar, canRead) => {
    const id = addPlayer(name, avatar, canRead);
    const reg = loadPlayerRegistry();
    reg.activePlayerId = id;
    savePlayerRegistry(reg);
    setPlayerRegistry({ ...reg });
    const newStats = loadStats(id);
    setStats(newStats);
    analytics.playerCreate();
    navigate('onboarding');
  }, [navigate]);

  const handleSelectPlayer = useCallback((playerId) => {
    const reg = loadPlayerRegistry();
    if (!reg) return;
    reg.activePlayerId = playerId;
    savePlayerRegistry(reg);
    setPlayerRegistry({ ...reg });
    const playerStats = loadStats(playerId);
    setStats(playerStats);
    // Go to onboarding or menu based on whether they've onboarded
    if (!playerStats.hasSeenOnboarding && playerStats.totalQuizzes === 0) {
      navigate('onboarding');
    } else {
      navigate('menu');
    }
  }, [navigate]);

  const handleUpdatePlayer = useCallback((id, updates) => {
    updatePlayerProfile(id, updates);
    setPlayerRegistry({ ...loadPlayerRegistry() });
  }, []);

  const handleResetPlayer = useCallback((id) => {
    resetPlayerProgress(id);
    // If resetting the active player, reload their stats
    if (playerRegistry?.activePlayerId === id) {
      setStats(loadStats(id));
    }
  }, [playerRegistry?.activePlayerId]);

  const handleDeletePlayer = useCallback((id) => {
    removePlayer(id);
    const reg = loadPlayerRegistry();
    setPlayerRegistry(reg ? { ...reg } : null);
    if (!reg || reg.players.length === 0) {
      // No players left → go to create
      setShowProfilePicker(false);
      navigate('playerCreate');
      return;
    }
    // If deleted was active, load new active player's stats
    if (playerRegistry?.activePlayerId === id && reg?.activePlayerId) {
      setStats(loadStats(reg.activePlayerId));
    }
  }, [playerRegistry?.activePlayerId, navigate]);

  // --- Existing handlers ---

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

  const handleSetCanRead = useCallback((canRead) => {
    if (activePlayer) {
      updatePlayerProfile(activePlayer.id, { canRead });
      setPlayerRegistry({ ...loadPlayerRegistry() });
    }
  }, [activePlayer]);

  // Detect hash routes: #admin, #quiz/{mode}/{ids}
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
          quizFlow.startQuiz(null, mode, words);
        }
      }
    };
    checkHash();
    window.addEventListener('hashchange', checkHash);
    return () => window.removeEventListener('hashchange', checkHash);
  }, [quizFlow.startQuiz]);

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

  const handleAssessmentComplete = useCallback((level) => {
    setStats(prev => {
      const unlockedLevels = ['beginner'];
      if (level === 'intermediate' || level === 'advanced') unlockedLevels.push('intermediate');
      if (level === 'advanced') unlockedLevels.push('advanced');
      return { ...prev, assessmentLevel: level, unlockedLevels };
    });
    analytics.assessmentComplete(level);
    navigate('menu');
  }, [navigate]);

  const renderState = () => {
    switch (gameState) {
      case 'playerCreate':
        return (
          <PlayerCreate
            lang={lang}
            onCreatePlayer={handleCreatePlayer}
            onBack={playerRegistry?.players.length > 0 ? () => navigate('playerSelect', 'back') : null}
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
            onDeletePlayer={handleDeletePlayer}
            onAddPlayer={() => navigate('playerCreate')}
            onBack={() => navigate('menu', 'back')}
          />
        );

      case 'onboarding':
        return (
          <Onboarding
            onComplete={handleOnboardingComplete}
            onSelectLanguage={handleLanguageSelect}
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
            onQuit={() => navigate('menu', 'back')}
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
            onQuit={() => navigate('menu', 'back')}
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
            onQuit={() => navigate('menu', 'back')}
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
            onQuit={() => navigate('menu', 'back')}
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
            onMenu={() => navigate('menu', 'back')}
          />
        );

      case 'learning':
        return (
          <LearnMode
            stats={stats}
            lang={lang}
            canRead={activePlayer?.canRead ?? true}
            words={learnWords}
            onBack={() => { setLearnWords(null); navigate('menu', 'back'); }}
          />
        );

      case 'flashcards':
        return (
          <FlashcardMode
            stats={stats}
            lang={lang}
            canRead={activePlayer?.canRead ?? true}
            onUpdateStats={setStats}
            onBack={() => navigate('menu', 'back')}
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
            onAssessment={() => navigate('assessment')}
          />
        );

      case 'assessment':
        return (
          <AssessmentFlow
            lang={lang}
            onComplete={handleAssessmentComplete}
            onSkip={() => navigate('menu', 'back')}
          />
        );

      case 'personalList':
        return (
          <PersonalWordList
            lang={lang}
            onStartQuiz={quizFlow.handleStartPersonalQuiz}
            onBack={() => navigate('menu', 'back')}
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
          onDelete={handleDeletePlayer}
        />
      </Suspense>
    </div>
  );
}
