import { useState, useEffect, useRef, useCallback, lazy, Suspense } from 'react';
import ErrorBoundary from './components/ErrorBoundary';
import LoadingScreen from './components/LoadingScreen';
import Menu from './components/Menu';
import Onboarding from './components/Onboarding';
import { loadStats, saveStats, isDarkMode, saveDarkMode, isSoundEnabled, saveSoundEnabled, updateStreak, updateDailyGoal, loadPlayerRegistry, savePlayerRegistry, addPlayer, removePlayer, resetPlayerProgress, updatePlayerProfile } from './utils/storage';
import { WORDS, getWordsByLevel, getDistractors, getWordById } from './data/words';
import { BADGES } from './data/badges';
import { selectQuizWords, updateWordSR } from './utils/spaced-repetition';
import { fisherYatesShuffle } from './utils/shuffle';
import { preloadImages } from './utils/images';
import { initTTS, playSound } from './utils/sound';
import { isRTL } from './utils/i18n';


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

  // 1 player, not onboarded → onboarding
  if (!stats.hasSeenOnboarding && stats.totalQuizzes === 0) {
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
  const [loadingProgress, setLoadingProgress] = useState(0);

  // Quiz state
  const [selectedLevel, setSelectedLevel] = useState(null);
  const [selectedMode, setSelectedMode] = useState(null);
  const [quizWords, setQuizWords] = useState([]);
  const [quizResults, setQuizResults] = useState(null);
  const [customWords, setCustomWords] = useState(null); // for PersonalWordList quiz

  const transitionDir = useRef('forward');
  const mainRef = useRef(null);

  // Derived: active player from registry
  const activePlayer = playerRegistry?.players.find(p => p.id === playerRegistry.activePlayerId) || null;

  // Move focus to main container on view change for screen readers
  useEffect(() => {
    if (mainRef.current) mainRef.current.focus();
  }, [gameState]);

  // Dark mode sync
  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  // Language direction sync
  const lang = stats.uiLanguage || 'en';
  useEffect(() => {
    document.documentElement.dir = isRTL(lang) ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  }, [lang]);

  // Init TTS
  useEffect(() => { initTTS(); }, []);

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
    transitionDir.current = direction;
    setGameState(newState);
  }, []);

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
    // New player goes to onboarding
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
    // If deleted was active, load new active player's stats
    if (playerRegistry?.activePlayerId === id && reg?.activePlayerId) {
      setStats(loadStats(reg.activePlayerId));
    }
  }, [playerRegistry?.activePlayerId]);

  // --- Existing handlers ---

  const handleOnboardingComplete = useCallback(() => {
    setStats(prev => {
      const updated = { ...prev, hasSeenOnboarding: true };
      return updated;
    });
    navigate('menu');
  }, [navigate]);

  const handleLanguageSelect = useCallback((lang) => {
    setStats(prev => ({ ...prev, uiLanguage: lang }));
  }, []);

  const handleSetCanRead = useCallback((canRead) => {
    if (activePlayer) {
      updatePlayerProfile(activePlayer.id, { canRead });
      setPlayerRegistry({ ...loadPlayerRegistry() });
    }
  }, [activePlayer]);

  const handleLevelSelect = useCallback((level) => {
    setSelectedLevel(level);
    navigate('modeSelect');
  }, [navigate]);

  const startQuiz = useCallback(async (level, mode, words = null) => {
    navigate('loading');
    setLoadingProgress(0);

    const pool = words || getWordsByLevel(level);
    const selected = selectQuizWords(pool, stats.wordProgress, 10);

    if (selected.length === 0) {
      navigate('menu');
      return;
    }

    // Collect all images needed (quiz words + their distractors)
    const allWordsNeeded = new Set();
    selected.forEach(w => {
      allWordsNeeded.add(w);
      getDistractors(w, 3).forEach(d => allWordsNeeded.add(d));
    });

    const { loaded, missing } = await preloadImages([...allWordsNeeded], (progress) => {
      setLoadingProgress(progress * 100);
    });

    if (missing.length > 0) {
      console.warn('Missing images:', missing.map(m => m.id));
    }

    setQuizWords(selected);
    const stateMap = { image: 'imageQuiz', word: 'wordQuiz', audio: 'audioQuiz', listen: 'listenMatchQuiz' };
    navigate(stateMap[mode] || 'imageQuiz');

  }, [navigate, stats.wordProgress]);

  // Detect hash routes: #admin, #quiz/{mode}/{ids}
  useEffect(() => {
    const checkHash = () => {
      const hash = window.location.hash;
      if (hash === '#admin') {
        setGameState('admin');
        return;
      }
      const quizMatch = hash.match(/^#quiz\/(image|word)\/(.+)$/);
      if (quizMatch) {
        const mode = quizMatch[1];
        const ids = quizMatch[2].split(',');
        const words = ids.map(id => getWordById(id)).filter(Boolean);
        window.location.hash = '';
        if (words.length >= 4) {
          startQuiz(null, mode, words);
        }
      }
    };
    checkHash();
    window.addEventListener('hashchange', checkHash);
    return () => window.removeEventListener('hashchange', checkHash);
  }, [startQuiz]);

  const handleModeSelect = useCallback((mode) => {
    setSelectedMode(mode);
    startQuiz(selectedLevel, mode);
  }, [selectedLevel, startQuiz]);

  const handleQuizComplete = useCallback((results) => {
    const { score, total, answers, mode } = results;

    // Update stats
    setStats(prev => {
      let updated = {
        ...prev,
        totalQuizzes: prev.totalQuizzes + 1,
        quizHistory: [
          ...prev.quizHistory,
          { date: new Date().toISOString(), mode, level: selectedLevel, score, total },
        ],
      };

      // Update best score
      if (selectedLevel && score > (updated.bestScores[selectedLevel] || 0)) {
        updated.bestScores = { ...updated.bestScores, [selectedLevel]: score };
      }

      // Unlock next level
      if (selectedLevel && score >= 7 && total === 10) {
        const levels = ['beginner', 'intermediate', 'advanced'];
        const idx = levels.indexOf(selectedLevel);
        if (idx < levels.length - 1) {
          const nextLevel = levels[idx + 1];
          if (!updated.unlockedLevels.includes(nextLevel)) {
            updated.unlockedLevels = [...updated.unlockedLevels, nextLevel];
          }
        }
      }

      // Update word progress from answers
      if (answers) {
        let wp = { ...updated.wordProgress };
        answers.forEach(({ wordId, correct }) => {
          wp = updateWordSR(wp, wordId, correct);
        });
        updated.wordProgress = wp;
      }

      // Update streak and daily goal
      updated = updateStreak(updated);
      updated = updateDailyGoal(updated, answers?.length || total);

      // Check badges
      const game = { score, total, mode, level: selectedLevel };
      const newBadges = [];
      BADGES.forEach(badge => {
        if (!updated.badges.includes(badge.id) && badge.check(updated, game)) {
          newBadges.push(badge.id);
        }
      });
      if (newBadges.length > 0) {
        updated.badges = [...updated.badges, ...newBadges];
        playSound('badge');
      }

      return updated;
    });

    setQuizResults(results);
    navigate('finished');

  }, [selectedLevel, navigate]);

  const handleAssessmentComplete = useCallback((level) => {
    setStats(prev => {
      const unlockedLevels = ['beginner'];
      if (level === 'intermediate' || level === 'advanced') unlockedLevels.push('intermediate');
      if (level === 'advanced') unlockedLevels.push('advanced');
      return { ...prev, assessmentLevel: level, unlockedLevels };
    });
    navigate('menu');
  }, [navigate]);

  const handleStartPersonalQuiz = useCallback((words, mode) => {
    setCustomWords(words);
    setSelectedMode(mode);
    startQuiz(null, mode, words);
  }, [startQuiz]);

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
            onSetCanRead={handleSetCanRead}
            activePlayer={activePlayer}
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
          />
        );

      case 'levelSelect':
        return (
          <LevelSelect
            stats={stats}
            lang={lang}
            onSelect={handleLevelSelect}
            onBack={() => navigate('menu', 'back')}
          />
        );

      case 'modeSelect':
        return (
          <ModeSelect
            level={selectedLevel}
            lang={lang}
            canRead={activePlayer?.canRead ?? true}
            onSelect={handleModeSelect}
            onBack={() => navigate('levelSelect', 'back')}
          />
        );

      case 'loading':
        return <LoadingScreen progress={loadingProgress} lang={lang} onCancel={resetToMenu} />;

      case 'imageQuiz':
        return (
          <ImageQuiz
            words={quizWords}
            lang={lang}
            soundEnabled={soundEnabled}
            onToggleSound={toggleSound}
            onComplete={handleQuizComplete}
            onQuit={() => navigate('menu', 'back')}
          />
        );

      case 'wordQuiz':
        return (
          <WordQuiz
            words={quizWords}
            lang={lang}
            soundEnabled={soundEnabled}
            onToggleSound={toggleSound}
            onComplete={handleQuizComplete}
            onQuit={() => navigate('menu', 'back')}
          />
        );

      case 'audioQuiz':
        return (
          <AudioQuiz
            words={quizWords}
            lang={lang}
            soundEnabled={soundEnabled}
            onToggleSound={toggleSound}
            onComplete={handleQuizComplete}
            onQuit={() => navigate('menu', 'back')}
          />
        );

      case 'listenMatchQuiz':
        return (
          <ListenMatchQuiz
            words={quizWords}
            lang={lang}
            soundEnabled={soundEnabled}
            onToggleSound={toggleSound}
            onComplete={handleQuizComplete}
            onQuit={() => navigate('menu', 'back')}
          />
        );

      case 'finished':
        return (
          <ResultScreen
            results={quizResults}
            stats={stats}
            lang={lang}
            level={selectedLevel}
            mode={selectedMode}
            onPlayAgain={() => startQuiz(selectedLevel, selectedMode, customWords)}
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
            onBack={() => navigate('menu', 'back')}
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
            onStartQuiz={handleStartPersonalQuiz}
            onBack={() => navigate('menu', 'back')}
          />
        );

      case 'privacy':
        return (
          <PrivacyPolicy onBack={() => navigate('menu', 'back')} />
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
      <div ref={mainRef} tabIndex={-1} className={`${gameState === 'admin' ? 'max-w-5xl' : 'max-w-lg'} mx-auto px-4 py-6 outline-none`}>
        <Suspense fallback={
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        }>
          <ErrorBoundary key={gameState} onReset={resetToMenu}>
            {renderState()}
          </ErrorBoundary>
        </Suspense>
      </div>
      <Suspense fallback={null}>
        <UpdatePrompt />
      </Suspense>
    </div>
  );
}
