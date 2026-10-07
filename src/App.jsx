import { useState, useEffect, useRef, useCallback, lazy, Suspense, useMemo } from 'react';
import ErrorBoundary from './components/ErrorBoundary';
import LoadingScreen from './components/LoadingScreen';
import Menu from './components/Menu';
import LandingPage from './components/LandingPage';
import Confetti from './components/Confetti';
import { loadStats, saveStats, isDarkMode, saveDarkMode, isSoundEnabled, saveSoundEnabled, loadPlayerRegistry, updateStreak, updateDailyGoal } from './utils/storage';
import { initTTS } from './utils/sound';
import { isRTL, t, loadLocale } from './utils/i18n';
import useQuizFlow from './hooks/useQuizFlow';
import usePlayerManagement from './hooks/usePlayerManagement';
import useInstallPrompt from './hooks/useInstallPrompt';
import CookieConsent from './components/CookieConsent';
import { needsConsentPrompt, setAnalyticsConsent, analytics } from './utils/analytics';
import { checkStreakReminder } from './utils/notifications';
import { getDueWords } from './utils/spaced-repetition';
import { filterByKnownLetters } from './utils/letterFilter';
import { sendLearn } from './utils/learnBeacon';
import { WORDS } from './data/words';
import { cycleState, advanceCycle, batchLabel, batchCount, stepsFor, LADDER, buildSet, repeatSet, masteredCount } from './utils/learningCycle';
import LadderMap from './components/LadderMap';
import SetPicker from './components/SetPicker';
import LetterFix from './components/LetterFix';
import SentenceGap from './components/SentenceGap';
import BatchComplete from './components/BatchComplete';


const Onboarding = lazy(() => import('./components/Onboarding'));
const LevelSelect = lazy(() => import('./components/LevelSelect'));
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
const TermsOfService = lazy(() => import('./components/TermsOfService'));
const AdminPanel = lazy(() => import('./components/admin/AdminPanel'));
const PlayerCreate = lazy(() => import('./components/PlayerCreate'));
const PlayerSelect = lazy(() => import('./components/PlayerSelect'));
const PlayerManage = lazy(() => import('./components/PlayerManage'));
const ProfilePicker = lazy(() => import('./components/ProfilePicker'));
const LearningPath = lazy(() => import('./components/LearningPath'));
const ParentDashboard = lazy(() => import('./components/ParentDashboard'));
const DailyReview = lazy(() => import('./components/DailyReview'));
const LightningRound = lazy(() => import('./components/LightningRound'));
const LetterPath = lazy(() => import('./components/LetterPath'));

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
  letterPath: '/letters',
  terms: '/terms',
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
  // Returning users skip the marketing landing entirely:
  // one player → straight to menu; a family → pick who's playing.
  if (registry?.players?.length >= 2) {
    return { gameState: 'playerSelect', registry, stats };
  }
  if (registry?.players?.length === 1) {
    return { gameState: 'menu', registry, stats };
  }
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
  // Practice ladder: ladderSet is the active word set ({source, words, token,
  // label}); batch sets track position in stats.cycle, ad-hoc sets in adhocPos.
  // cycleRun marks an in-flight quiz as a ladder step; ladderStepKey = which.
  const [cycleRun, setCycleRun] = useState(false);
  const [batchDoneNum, setBatchDoneNum] = useState(null);
  const [ladderSet, setLadderSet] = useState(null);
  const [ladderStepKey, setLadderStepKey] = useState(null);
  const [adhocPos, setAdhocPos] = useState({ done: [] });
  const [extraDone, setExtraDone] = useState([]); // batch steps completed out of order
  const sessionSeed = useMemo(() => Math.floor(Date.now() / 3600000), []);
  const [isOffline, setIsOffline] = useState(() => typeof navigator !== 'undefined' && !navigator.onLine);
  const [storageFull, setStorageFull] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const mainRef = useRef(null);
  const prevBadgeCount = useRef(stats.badges?.length || 0);

  const gameStateRef = useRef(initial.current.gameState);
  const legalReturnRef = useRef('menu'); // where privacy/terms should return to

  const navigate = useCallback((newState, direction = 'forward') => {
    // Remember where legal pages were opened from so Back returns there
    if ((newState === 'privacy' || newState === 'terms')
        && gameStateRef.current !== 'privacy' && gameStateRef.current !== 'terms') {
      legalReturnRef.current = gameStateRef.current;
    }
    gameStateRef.current = newState;
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
    const features = ['landing', 'learning', 'flashcards', 'badges', 'progress', 'personalList', 'learningPath', 'letterPath', 'parentDashboard', 'dailyReview'];
    if (features.includes(newState)) analytics.featureUse(newState);
  }, []);

  // Extracted hooks
  const {
    playerRegistry, activePlayer,
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

  // Keep gameStateRef in sync for state changes that bypass navigate()
  // (hash routes, popstate)
  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

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
    if (lang !== 'en') loadLocale(lang).then(() => forceUpdate(n => n + 1));
    // Beacon-readable language flag (land/learn beacons + games tag events with it)
    try { localStorage.setItem('cde_lang', lang); } catch { /* storage unavailable */ }
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
    const ogLocale = document.querySelector('meta[property="og:locale"]');
    const OG = { he: 'he_IL', es: 'es_ES', ar: 'ar_AR' };
    if (ogLocale) ogLocale.setAttribute('content', OG[lang] || 'en_US');
  }, [lang]);

  // Read ?lang= URL param on mount (for hreflang SEO)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlLang = params.get('lang');
    if (['he', 'es', 'ar'].includes(urlLang) && lang !== urlLang) {
      setStats(prev => ({ ...prev, uiLanguage: urlLang }));
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

  const quizFlow = useQuizFlow({ stats, setStats, navigate, knownLetters: activePlayer?.knownLetters });

  // ⚡ Lightning Round finished: persist per-mode best + rounds count.
  // ---- Practice ladder controller ----------------------------------------
  const canReadNow = activePlayer?.canRead ?? true;
  const klNow = activePlayer?.knownLetters;

  // The active set: explicit ladderSet, else the current cycle batch.
  const activeSet = useMemo(() => {
    if (ladderSet) return ladderSet;
    const { batch } = cycleState(stats);
    const built = buildSet('batch', { stats, knownLetters: klNow });
    // labelParts, not a baked string: lazy-loaded locale strings arrive after
    // this memo, so the render site translates (LadderMap re-renders then).
    return { ...built, source: 'batch', labelParts: { num: batch + 1, label: batchLabel(batch, klNow) } };
  }, [ladderSet, stats, klNow]);

  const ladderSteps = useMemo(() => stepsFor(canReadNow, activeSet.words), [canReadNow, activeSet]);

  // Position: batch sets derive from stats.cycle.stage; ad-hoc sets from adhocPos.
  const ladderPos = useMemo(() => {
    if (activeSet.source === 'batch') {
      const { stage } = cycleState(stats);
      const idx = Math.min(stage, ladderSteps.length - 1);
      return { currentKey: ladderSteps[idx]?.key, doneKeys: [...ladderSteps.slice(0, idx).map((st) => st.key), ...extraDone] };
    }
    const remaining = ladderSteps.find((st) => !adhocPos.done.includes(st.key));
    return { currentKey: remaining?.key, doneKeys: adhocPos.done };
  }, [activeSet, stats, ladderSteps, adhocPos, extraDone]);

  const openLadder = useCallback((source = 'batch', letters = null) => {
    if (source === 'batch') {
      setLadderSet(null);
    } else {
      const built = buildSet(source, { stats, knownLetters: klNow, letters, seed: sessionSeed });
      const labels = { letters: t('ladderSetLetters', lang), surprise: t('ladderSetSurprise', lang), fresh: t('ladderSetFresh', lang) };
      setLadderSet({ ...built, source, label: labels[source] || '' });
      setAdhocPos({ done: [] });
    }
    setExtraDone([]);
    navigate('ladder');
  }, [stats, klNow, sessionSeed, lang, navigate]);

  // Launch a step (any step — free navigation). Fires cyc_start on a set's first step.
  const startLadderStep = useCallback((stepKey, wordsOverride = null) => {
    const step = LADDER.find((st) => st.key === stepKey);
    if (!step) return;
    const words = wordsOverride || activeSet.words;
    if (ladderPos.doneKeys.length === 0 && stepKey === ladderPos.currentKey) {
      sendLearn('cyc_start', activeSet.token);
    }
    setLadderStepKey(stepKey);
    if (step.kind === 'quiz') {
      const mode = canReadNow ? step.mode : (step.preReaderMode || step.mode);
      setCycleRun(true);
      quizFlow.startQuiz(null, mode, words);
      return;
    }
    if (step.kind === 'flashcards') { setCycleRun(true); setFocusedWords(words); navigate('flashcards'); return; }
    if (step.kind === 'letterfix') { navigate('letterFix'); return; }
    if (step.kind === 'sentence') { navigate('sentenceGap'); return; }
    if (step.kind === 'arcade') {
      // Mark-on-launch (cross-page completion isn't trackable in v1; g_lvl/g_cmp
      // beacons measure real play). Then a full navigation out of the SPA.
      completeLadderStep(stepKey);
      const ids = words.map((w) => w.id).join(',');
      window.location.href = `/games/${step.game}/?words=${encodeURIComponent(ids)}&from=ladder`;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSet, ladderPos, canReadNow, quizFlow, navigate]);

  // Record a completed step; advance position; celebrate batch completion.
  const completeLadderStep = useCallback((stepKey) => {
    sendLearn('cyc_stage', `${activeSet.token}_${stepKey}`);
    setCycleRun(false);
    if (activeSet.source === 'batch') {
      const { batch } = cycleState(stats);
      if (stepKey === ladderPos.currentKey) {
        const next = advanceCycle(stats, canReadNow, activeSet.words);
        setStats((prev) => ({ ...prev, cycle: { batch: next.batch, stage: next.stage } }));
        if (next.batchDone) {
          sendLearn('cyc_done', activeSet.token);
          setExtraDone([]);
          setBatchDoneNum(batch + 1);
          navigate('batchComplete');
          return;
        }
      } else if (!ladderPos.doneKeys.includes(stepKey)) {
        setExtraDone((cur) => [...cur, stepKey]);
      }
      navigate('ladder');
      return;
    }
    const done = adhocPos.done.includes(stepKey) ? adhocPos.done : [...adhocPos.done, stepKey];
    setAdhocPos({ done });
    if (done.length >= ladderSteps.length) sendLearn('cyc_done', activeSet.token);
    navigate('ladder');
   
  }, [activeSet, ladderPos, stats, canReadNow, adhocPos, ladderSteps, navigate, setStats]);

  // Per-step repeats: rerun the SAME step with a different or bigger draw.
  const repeatLadderStep = useCallback((kind) => {
    const words = repeatSet(activeSet.words, activeSet.source, {
      kind, stats, knownLetters: klNow, seed: sessionSeed + 7,
    });
    startLadderStep(ladderStepKey, words);
   
  }, [activeSet, ladderStepKey, stats, klNow, sessionSeed, startLadderStep]);

  // Letter Fix / Sentence Gap results → per-word spelling tallies (Know vs Spell map).
  const handleSpellingResult = useCallback((wordId, ok) => {
    setStats((prev) => {
      const cur = prev.spelling?.[wordId] || { ok: 0, no: 0 };
      return { ...prev, spelling: { ...(prev.spelling || {}), [wordId]: { ok: cur.ok + (ok ? 1 : 0), no: cur.no + (ok ? 0 : 1) } } };
    });
  }, [setStats]);

  const handleLightningFinish = useCallback((solves) => {
    const mode = quizFlow.selectedMode;
    setStats(prev => {
      const arcade = { ...(prev.arcade || {}) };
      const lightningBest = { ...(arcade.lightningBest || {}) };
      if (mode) lightningBest[mode] = Math.max(lightningBest[mode] || 0, solves);
      arcade.lightningBest = lightningBest;
      arcade.lightningRounds = (arcade.lightningRounds || 0) + 1;
      return { ...prev, arcade };
    });
    analytics.featureUse('lightning_round');
  }, [quizFlow.selectedMode]);

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
            onLanguageStart={(selectedLang) => {
              handleLanguageSelect(selectedLang);
              const next = playerRegistry?.players?.length ? 'menu' : 'playerCreate';
              if (selectedLang !== 'en') {
                loadLocale(selectedLang).then(() => navigate(next));
              } else {
                navigate(next);
              }
            }}
            onPrivacy={() => navigate('privacy')}
            onTerms={() => navigate('terms')}
            onSelectLanguage={(l) => { handleLanguageSelect(l); if (l !== 'en') loadLocale(l); }}
          />
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
            onQuickStart={() => quizFlow.startQuiz('beginner', 'listen')}
            onContinueCycle={() => openLadder('batch')}
            cycleInfo={(() => {
              const { batch, stage } = cycleState(stats);
              const kl = activePlayer?.knownLetters;
              return {
                batch, stage,
                label: batchLabel(batch, kl),
                stages: ladderSteps.length,
                mastered: masteredCount(stats),
                totalBatches: batchCount(kl),
                isNew: (stats.totalQuizzes || 0) === 0 && batch === 0 && stage === 0,
              };
            })()}
            onToggleDark={toggleDarkMode}
            onToggleSound={toggleSound}
            onOpenProfilePicker={() => setShowProfilePicker(true)}
            onSelectLanguage={(l) => { handleLanguageSelect(l); if (l !== 'en') loadLocale(l); }}
          />
        );

      case 'levelSelect':
        return (
          <LevelSelect
            stats={stats}
            lang={lang}
            canRead={activePlayer?.canRead ?? true}
            knownLetters={activePlayer?.knownLetters}
            onChangeLetters={activePlayer ? (letters) => handleUpdatePlayer(activePlayer.id, { knownLetters: letters }) : undefined}
            onStartQuiz={(level, mode) => {
              quizFlow.startQuiz(level, mode);
            }}
            onBack={() => navigate('menu', 'back')}
          />
        );

      case 'loading':
        return (
          <LoadingScreen
            progress={quizFlow.loadingProgress}
            lang={lang}
            onRetry={() => quizFlow.startQuiz(quizFlow.selectedLevel, quizFlow.selectedMode, quizFlow.customWords)}
            onCancel={resetToMenu}
          />
        );

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
            canRead={activePlayer?.canRead ?? true}
            cycleNext={(() => {
              if (!cycleRun || quizFlow.quizResults?.quit || !ladderStepKey) return null;
              const isCurrent = ladderStepKey === ladderPos.currentKey;
              const nextIdx = ladderSteps.findIndex((st) => st.key === ladderStepKey) + 1;
              const willFinish = isCurrent && nextIdx >= ladderSteps.length && activeSet.source === 'batch';
              const nextStep = ladderSteps[nextIdx];
              const label = willFinish ? t('cycleFinishBatch', lang)
                : nextStep ? t('cycleNextStage', lang, { mode: t(nextStep.labelKey, lang) })
                : t('ladderStepDone', lang) + ' ✓';
              return { label, onClick: () => completeLadderStep(ladderStepKey) };
            })()}
            cycleRepeats={cycleRun && !quizFlow.quizResults?.quit ? [
              { label: t('ladderAgainDifferent', lang), onClick: () => repeatLadderStep('different') },
              { label: t('ladderAgainMore', lang), onClick: () => repeatLadderStep('more') },
            ] : null}
            onPlayAgain={() => quizFlow.startQuiz(quizFlow.selectedLevel, quizFlow.selectedMode, quizFlow.customWords)}
            onMenu={() => { setCycleRun(false); focusedWords ? navigate('personalList', 'back') : navigate('menu', 'back'); }}
            onLightning={quizFlow.quizWords.length > 0 ? () => navigate('lightning') : undefined}
          />
        );

      case 'ladder':
        return (
          <LadderMap
            lang={lang}
            canRead={canReadNow}
            setWords={activeSet.words}
            setLabel={activeSet.labelParts ? t('cycleBatchTitle', lang, activeSet.labelParts) : activeSet.label}
            currentStepKey={ladderPos.currentKey}
            doneKeys={ladderPos.doneKeys}
            onStartStep={startLadderStep}
            onPickSet={() => navigate('setPicker')}
            onBack={() => navigate('menu', 'back')}
          />
        );

      case 'setPicker':
        return (
          <SetPicker
            lang={lang}
            onPick={(source, letters) => openLadder(source, letters)}
            onBack={() => navigate('ladder', 'back')}
          />
        );

      case 'letterFix': {
        const lfStep = LADDER.find((st) => st.key === ladderStepKey);
        return (
          <LetterFix
            words={activeSet.words}
            mode={lfStep?.mode || 'easy'}
            lang={lang}
            onResult={handleSpellingResult}
            onComplete={() => completeLadderStep(ladderStepKey)}
            onBack={() => navigate('ladder', 'back')}
          />
        );
      }

      case 'sentenceGap':
        return (
          <SentenceGap
            words={activeSet.words}
            lang={lang}
            onResult={handleSpellingResult}
            onComplete={() => completeLadderStep(ladderStepKey)}
            onBack={() => navigate('ladder', 'back')}
          />
        );

      case 'batchComplete':
        return (
          <BatchComplete
            stats={stats}
            lang={lang}
            batchJustDone={batchDoneNum || 1}
            onNextBatch={() => openLadder('batch')}
            onBackToMenu={() => navigate('menu', 'back')}
          />
        );

      case 'lightning':
        return (
          <LightningRound
            words={quizFlow.quizWords}
            mode={quizFlow.selectedMode}
            level={quizFlow.selectedLevel}
            knownLetters={activePlayer?.knownLetters}
            lang={lang}
            best={stats.arcade?.lightningBest?.[quizFlow.selectedMode] || 0}
            onFinish={handleLightningFinish}
            onExit={() => navigate('finished', 'back')}
          />
        );

      case 'letterPath':
        return (
          <LetterPath
            stats={stats}
            lang={lang}
            onPracticeLetter={(letter, words) => { sendLearn('letter', letter.toLowerCase()); quizFlow.handleStartPersonalQuiz(words, 'listen'); }}
            onBack={() => navigate('menu', 'back')}
          />
        );

      case 'learning':
        return (
          <LearnMode
            stats={stats}
            lang={lang}
            canRead={activePlayer?.canRead ?? true}
            knownLetters={activePlayer?.knownLetters}
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
            knownLetters={activePlayer?.knownLetters}
            words={focusedWords}
            onUpdateStats={setStats}
            onBack={() => focusedWords ? navigate('personalList', 'back') : navigate('menu', 'back')}
            onComplete={cycleRun && ladderStepKey === 'fc' ? () => completeLadderStep('fc') : undefined}
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
            onStartLesson={(words) => quizFlow.handleStartPersonalQuiz(filterByKnownLetters(words, activePlayer?.knownLetters), 'image')}
            onLearnLesson={(words) => { setLearnWords(filterByKnownLetters(words, activePlayer?.knownLetters)); navigate('learning'); }}
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
            activePlayer={activePlayer}
            onUpdatePlayer={handleUpdatePlayer}
            lang={lang}
            onBack={() => navigate('menu', 'back')}
          />
        );

      case 'privacy':
        return (
          <PrivacyPolicy lang={lang} onBack={() => navigate(legalReturnRef.current, 'back')} />
        );

      case 'terms':
        return (
          <TermsOfService lang={lang} onBack={() => navigate(legalReturnRef.current, 'back')} />
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
      <main id="main-content" ref={mainRef} tabIndex={-1} className={`${gameState === 'admin' ? 'max-w-5xl' : 'max-w-lg md:max-w-2xl'} mx-auto px-4 py-6 outline-hidden`}>
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
