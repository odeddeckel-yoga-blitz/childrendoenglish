import { useState, useEffect, useRef, useCallback } from 'react';
import { sendLearn } from '../utils/learnBeacon';
import { Volume2, RefreshCw, Turtle, Pointer } from 'lucide-react';
import useQuizState from '../hooks/useQuizState';
import QuizHeader from './QuizHeader';
import QuitModal from './QuitModal';
import QuizOptionGrid from './QuizOptionGrid';
import { speakWord, isTTSAvailable, isSlowAudio, setSlowAudio } from '../utils/sound';
import { t } from '../utils/i18n';

export default function AudioQuiz({ words, lang = 'en', soundEnabled, onToggleSound, onComplete, onAnswer, onQuit: _onQuit, firstQuiz = false }) {
  // A new player's FIRST question (11-07 read: en 71 first quizzes started → 32 answered Q1; this is the listening quiz,
  // so it needs sound on screen one). onb q1_audio_ok | q1_audio_blocked (autoplay refused) | q1_audio_none (no speech)
  // and q1_hear_tap (tapped the pulsing speaker) split "couldn't hear it" from "left anyway". Once per quiz.
  const q1Sent = useRef({});
  const q1 = useCallback((item) => { if (firstQuiz && !q1Sent.current[item]) { q1Sent.current[item] = true; sendLearn('onb', item); } }, [firstQuiz]);
  // …and how this child's tab arrived (land-beacon.js keeps the coarse class): q1_src_seo | ai | external | direct | internal.
  useEffect(() => {
    let src = '';
    try { src = sessionStorage.getItem('cde_src') || ''; } catch { /* storage blocked */ }
    q1('q1_src_' + (/^(seo|ai|external|direct|internal)$/.test(src) ? src : 'unknown'));
  }, [q1]);
  const [loadedImages, setLoadedImages] = useState(new Set());
  const [ttsUnavailableToast, setTtsUnavailableToast] = useState(false);

  const ttsOk = isTTSAvailable();

  const quiz = useQuizState({
    words,
    mode: 'audio',
    lang,
    onComplete,
    onAnswer,
    speakOnCorrect: false,
    speakDelay: 600,
  });

  // Reset loaded images when question changes
  const [prevIndex, setPrevIndex] = useState(0);
  // The auto-played word was blocked (e.g. iOS outside a tap): pulse the speaker.
  const [needTap, setNeedTap] = useState(false);
  const [slow, setSlow] = useState(isSlowAudio);
  if (quiz.currentIndex !== prevIndex) {
    setPrevIndex(quiz.currentIndex);
    setLoadedImages(new Set());
    setNeedTap(false);
  }

  // Show one-time toast if TTS not available
  useEffect(() => {
    if (ttsOk === false) {
      q1('q1_audio_none'); // this effect runs at mount (question 1) and when TTS availability changes
      setTtsUnavailableToast(true);
      const timer = setTimeout(() => setTtsUnavailableToast(false), 4000);
      return () => clearTimeout(timer);
    }
  }, [ttsOk, q1]);

  // Auto-speak current word
  useEffect(() => {
    if (ttsOk && quiz.currentWord) {
      let live = true;
      const timer = setTimeout(() => {
        Promise.resolve(speakWord(quiz.currentWord.word)).then((played) => {
          if (quiz.currentIndex === 0) q1(played === false ? 'q1_audio_blocked' : 'q1_audio_ok');
          if (live && played === false) setNeedTap(true);
        });
      }, 300);
      return () => { live = false; clearTimeout(timer); };
    }
  }, [quiz.currentIndex, quiz.currentWord, ttsOk, q1]);

  if (!quiz.currentWord) return null;

  return (
    <div className="animate-fade-in space-y-4">
      {/* TTS unavailable toast */}
      {ttsUnavailableToast && (
        <div className="fixed top-4 left-4 right-4 z-50 animate-slide-up">
          <div className="glass rounded-xl p-3 text-center text-sm text-amber-700 border border-amber-200 max-w-md mx-auto">
            {t('audioUnavailable', lang)}
          </div>
        </div>
      )}

      <QuizHeader
        score={quiz.score}
        total={quiz.total}
        scoreTotal={quiz.scoreTotal}
        questionNum={quiz.questionNum}
        isRetry={quiz.isRetry}
        streak={quiz.streak}
        arcadeScore={quiz.arcadeScore}
        soundEnabled={soundEnabled}
        onToggleSound={onToggleSound}
        onQuit={quiz.openQuitConfirm}
        gradientColor="from-amber-500 to-amber-600"
        currentIndex={quiz.currentIndex}
        lang={lang}
      />

      {/* Speaker / fallback word display */}
      <div className="text-center py-6 space-y-3 landscape:py-2">
        {ttsOk ? (
          <>
            <button
              onClick={() => { if (needTap && quiz.currentIndex === 0) q1('q1_hear_tap'); setNeedTap(false); speakWord(quiz.currentWord.word); }}
              data-need-tap={needTap ? '' : undefined}
              className={`mx-auto w-24 h-24 rounded-full bg-linear-to-br from-amber-400 to-amber-600
                         flex items-center justify-center shadow-lg hover:shadow-xl
                         active:scale-95 transition-all ${needTap ? 'animate-pulse ring-4 ring-amber-300' : ''}`}
              aria-label={t('hearAgain', lang)}
            >
              <Volume2 className="w-12 h-12 text-white" />
            </button>
            <p className="text-slate-400 text-sm flex items-center justify-center gap-2">
              {needTap
                ? <span className="font-bold text-amber-700 inline-flex items-center gap-1"><Pointer className="w-4 h-4" aria-hidden="true" /> {t('tapToHearWord', lang)}</span>
                : <><RefreshCw className="w-3 h-3" /> {t('hearAgain', lang)}</>}
            </p>
            {/* R2C9: slow playback toggle (0.75×), remembered on this device */}
            <button
              type="button"
              aria-pressed={slow}
              onClick={() => { setSlowAudio(!slow); setSlow(!slow); speakWord(quiz.currentWord.word); }}
              className={`mx-auto px-4 min-h-11 rounded-full border-2 text-sm font-bold ${slow ? 'bg-amber-100 border-amber-500 text-amber-800' : 'bg-white border-amber-200 text-amber-700'}`}
            >
              <Turtle className="w-4 h-4 inline -mt-0.5" aria-hidden="true" /> {t('slowAudio', lang)}
            </button>
            {quiz.answered && (
              <p className="text-2xl font-bold text-slate-800 dark:text-slate-100 animate-fade-in">{quiz.currentWord.word}</p>
            )}
          </>
        ) : (
          <>
            <h2 className="text-4xl font-black text-slate-800 dark:text-slate-100">{quiz.currentWord.word}</h2>
            <p className="text-slate-500 text-sm font-mono">{quiz.currentWord.phonetic}</p>
          </>
        )}
      </div>

      <QuizOptionGrid
        quiz={quiz}
        loadedImages={loadedImages}
        onImageLoad={(id) => setLoadedImages(prev => new Set(prev).add(id))}
        lang={lang}
      />

      {!quiz.answered && (
        <button
          onClick={quiz.handleSkip}
          className="w-full text-center text-sm text-slate-400 hover:text-slate-600 transition-colors py-1"
        >
          {t('skipThisWord', lang)}
        </button>
      )}

      <div aria-live="polite" className="sr-only">{quiz.feedbackMessage}</div>

      {quiz.showQuitConfirm && (
        <QuitModal onContinue={quiz.closeQuitConfirm} onQuit={quiz.handleQuit} lang={lang} />
      )}
    </div>
  );
}
