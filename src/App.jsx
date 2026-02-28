import { useState, useEffect, useRef, useCallback, lazy, Suspense } from 'react';
import ErrorBoundary from './components/ErrorBoundary';
import LoadingScreen from './components/LoadingScreen';
import Menu from './components/Menu';
import Onboarding from './components/Onboarding';
import { loadStats, saveStats, isDarkMode, saveDarkMode, isSoundEnabled, saveSoundEnabled, updateStreak, updateDailyGoal } from './utils/storage';
import { WORDS, getWordsByLevel, getDistractors } from './data/words';
import { BADGES } from './data/badges';
import { selectQuizWords } from './utils/spaced-repetition';
import { fisherYatesShuffle } from './utils/shuffle';
import { preloadImages } from './utils/images';
import { initTTS, playSound } from './utils/sound';
import { trackEvent } from './utils/analytics';

const LevelSelect = lazy(() => import('./components/LevelSelect'));
const ModeSelect = lazy(() => import('./components/ModeSelect'));
const ImageQuiz = lazy(() => import('./components/ImageQuiz'));
const WordQuiz = lazy(() => import('./components/WordQuiz'));
const AudioQuiz = lazy(() => import('./components/AudioQuiz'));
const ResultScreen = lazy(() => import('./components/ResultScreen'));
const LearnMode = lazy(() => import('./components/LearnMode'));
const FlashcardMode = lazy(() => import('./components/FlashcardMode'));
const BadgesView = lazy(() => import('./components/BadgesView'));
const ProgressDashboard = lazy(() => import('./components/ProgressDashboard'));
const AssessmentFlow = lazy(() => import('./components/AssessmentFlow'));
const PersonalWordList = lazy(() => import('./components/PersonalWordList'));
const UpdatePrompt = lazy(() => import('./components/UpdatePrompt'));

export default function App() {
  const [stats, setStats] = useState(() => loadStats());
  const [gameState, setGameState] = useState(() => {
    const s = loadStats();
    return (s.hasSeenOnboarding || s.totalQuizzes > 0) ? 'menu' : 'onboarding';
  });
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

  // Dark mode sync
  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  // Init TTS
  useEffect(() => { initTTS(); }, []);

  // Persist stats
  useEffect(() => { saveStats(stats); }, [stats]);

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

  const handleLevelSelect = useCallback((level) => {
    setSelectedLevel(level);
    navigate('modeSelect');
  }, [navigate]);

  const handleModeSelect = useCallback((mode) => {
    setSelectedMode(mode);
    startQuiz(selectedLevel, mode);
  }, [selectedLevel]);

  const startQuiz = useCallback(async (level, mode, words = null) => {
    navigate('loading');
    setLoadingProgress(0);

    const pool = words || getWordsByLevel(level);
    const selected = selectQuizWords(pool, stats.wordProgress, 10);

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
    navigate(mode === 'image' ? 'imageQuiz' : mode === 'word' ? 'wordQuiz' : 'audioQuiz');
    trackEvent('quiz_start', { level, mode, wordCount: selected.length });
  }, [navigate, stats.wordProgress]);

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
          const card = wp[wordId] || { lastSeen: 0, interval: 1, correct: 0, wrong: 0 };
          if (correct) {
            const intervals = [1, 3, 7, 14, 30];
            const idx = intervals.indexOf(card.interval);
            const nextInterval = idx >= 0 && idx < intervals.length - 1
              ? intervals[idx + 1]
              : Math.min((card.interval || 1) * 2, 60);
            wp[wordId] = { ...card, lastSeen: Date.now(), interval: nextInterval, correct: card.correct + 1 };
          } else {
            wp[wordId] = { ...card, lastSeen: Date.now(), interval: 1, wrong: card.wrong + 1 };
          }
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
    trackEvent('quiz_complete', { score, total, mode, level: selectedLevel });
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
      case 'onboarding':
        return (
          <Onboarding
            onComplete={handleOnboardingComplete}
            onSelectLanguage={handleLanguageSelect}
          />
        );

      case 'menu':
        return (
          <Menu
            stats={stats}
            darkMode={darkMode}
            soundEnabled={soundEnabled}
            onNavigate={navigate}
            onToggleDark={toggleDarkMode}
            onToggleSound={toggleSound}
          />
        );

      case 'levelSelect':
        return (
          <LevelSelect
            stats={stats}
            onSelect={handleLevelSelect}
            onBack={() => navigate('menu', 'back')}
          />
        );

      case 'modeSelect':
        return (
          <ModeSelect
            level={selectedLevel}
            onSelect={handleModeSelect}
            onBack={() => navigate('levelSelect', 'back')}
          />
        );

      case 'loading':
        return <LoadingScreen progress={loadingProgress} />;

      case 'imageQuiz':
        return (
          <ImageQuiz
            words={quizWords}
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
            onBack={() => navigate('menu', 'back')}
          />
        );

      case 'flashcards':
        return (
          <FlashcardMode
            stats={stats}
            onUpdateStats={setStats}
            onBack={() => navigate('menu', 'back')}
          />
        );

      case 'badges':
        return (
          <BadgesView
            stats={stats}
            onBack={() => navigate('menu', 'back')}
          />
        );

      case 'progress':
        return (
          <ProgressDashboard
            stats={stats}
            onBack={() => navigate('menu', 'back')}
            onAssessment={() => navigate('assessment')}
          />
        );

      case 'assessment':
        return (
          <AssessmentFlow
            onComplete={handleAssessmentComplete}
            onSkip={() => navigate('menu', 'back')}
          />
        );

      case 'personalList':
        return (
          <PersonalWordList
            onStartQuiz={handleStartPersonalQuiz}
            onBack={() => navigate('menu', 'back')}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="app-bg min-h-screen pb-safe">
      <div className="max-w-lg mx-auto px-4 py-6">
        <Suspense fallback={
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
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
