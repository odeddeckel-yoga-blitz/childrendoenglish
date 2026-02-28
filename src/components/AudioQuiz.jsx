import { useState, useEffect, useCallback, useRef } from 'react';
import { X, Volume2, VolumeX, Flame, RefreshCw } from 'lucide-react';
import { getDistractors } from '../data/words';
import { fisherYatesShuffle } from '../utils/shuffle';
import { getImageUrl } from '../utils/images';
import { playSound, speakWord, isTTSAvailable } from '../utils/sound';
import { haptic } from '../utils/haptic';

export default function AudioQuiz({ words, soundEnabled, onToggleSound, onComplete, onQuit }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [answered, setAnswered] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [options, setOptions] = useState([]);
  const [showQuitConfirm, setShowQuitConfirm] = useState(false);
  const [loadedImages, setLoadedImages] = useState(new Set());
  const [ttsUnavailableToast, setTtsUnavailableToast] = useState(false);
  const feedbackTimeout = useRef(null);

  const currentWord = words[currentIndex];
  const total = words.length;
  const ttsOk = isTTSAvailable();

  // Show one-time toast if TTS not available
  useEffect(() => {
    if (ttsOk === false) {
      setTtsUnavailableToast(true);
      const t = setTimeout(() => setTtsUnavailableToast(false), 4000);
      return () => clearTimeout(t);
    }
  }, [ttsOk]);

  useEffect(() => {
    if (!currentWord) return;
    const distractors = getDistractors(currentWord, 3);
    setOptions(fisherYatesShuffle([currentWord, ...distractors]));
    setAnswered(null);
    setSelectedAnswer(null);
    setLoadedImages(new Set());

    // Auto-speak on mount
    if (ttsOk) {
      setTimeout(() => speakWord(currentWord.word), 300);
    }
  }, [currentIndex, currentWord, ttsOk]);

  const handleAnswer = useCallback((option) => {
    if (answered) return;

    const correct = option.id === currentWord.id;
    setSelectedAnswer(option.id);
    setAnswered(correct ? 'correct' : 'wrong');
    setAnswers(prev => [...prev, { wordId: currentWord.id, correct, selected: option.id }]);

    if (correct) {
      setScore(s => s + 1);
      setStreak(s => s + 1);
      playSound('correct');
      haptic('success');
    } else {
      setStreak(0);
      playSound('wrong');
      haptic('error');
      setTimeout(() => speakWord(currentWord.word), 600);
    }

    feedbackTimeout.current = setTimeout(() => {
      if (currentIndex + 1 >= total) {
        onComplete({
          score: score + (correct ? 1 : 0),
          total,
          mode: 'audio',
          answers: [...answers, { wordId: currentWord.id, correct, selected: option.id }],
        });
      } else {
        setCurrentIndex(i => i + 1);
      }
    }, 1200);
  }, [answered, currentWord, currentIndex, total, score, answers, onComplete]);

  useEffect(() => () => clearTimeout(feedbackTimeout.current), []);

  const handleQuit = () => {
    clearTimeout(feedbackTimeout.current);
    onComplete({ score, total: currentIndex, mode: 'audio', answers });
  };

  if (!currentWord) return null;

  return (
    <div className="animate-fade-in space-y-4">
      {/* TTS unavailable toast */}
      {ttsUnavailableToast && (
        <div className="fixed top-4 left-4 right-4 z-50 animate-slide-up">
          <div className="glass rounded-xl p-3 text-center text-sm text-amber-700 border border-amber-200 max-w-md mx-auto">
            Audio not available on this device. Showing words instead.
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setShowQuitConfirm(true)}
          className="p-2 rounded-xl hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5 text-slate-500" />
        </button>
        <div className="flex items-center gap-3">
          {streak >= 3 && (
            <span className="streak-fire flex items-center gap-1 text-amber-500 font-bold text-sm">
              <Flame className="w-4 h-4" /> {streak}
            </span>
          )}
          <span className="text-sm font-semibold text-slate-600">{score}/{total}</span>
          <button onClick={onToggleSound} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
            {soundEnabled
              ? <Volume2 className="w-4 h-4 text-slate-500" />
              : <VolumeX className="w-4 h-4 text-slate-400" />
            }
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-amber-500 to-amber-600 rounded-full transition-all duration-300"
          style={{ width: `${((currentIndex) / total) * 100}%` }}
        />
      </div>

      <p className="text-center text-sm text-slate-500">Question {currentIndex + 1} of {total}</p>

      {/* Speaker / fallback word display */}
      <div className="text-center py-6 space-y-3">
        {ttsOk ? (
          <>
            <button
              onClick={() => speakWord(currentWord.word)}
              className="mx-auto w-24 h-24 rounded-full bg-gradient-to-br from-amber-400 to-amber-600
                         flex items-center justify-center shadow-lg hover:shadow-xl
                         active:scale-95 transition-all"
            >
              <Volume2 className="w-12 h-12 text-white" />
            </button>
            <p className="text-slate-400 text-sm flex items-center justify-center gap-2">
              <RefreshCw className="w-3 h-3" /> Tap to hear again
            </p>
            {/* Show word after answering */}
            {answered && (
              <p className="text-2xl font-bold text-slate-800 animate-fade-in">{currentWord.word}</p>
            )}
          </>
        ) : (
          // TTS fallback: show word text (degrades to Word Quiz layout)
          <>
            <h2 className="text-4xl font-black text-slate-800">{currentWord.word}</h2>
            <p className="text-slate-400 text-sm font-mono">{currentWord.phonetic}</p>
          </>
        )}
      </div>

      {/* Image options (2x2 grid) */}
      <div className="grid grid-cols-2 gap-3">
        {options.map((option) => {
          const isSelected = selectedAnswer === option.id;
          const isCorrect = option.id === currentWord.id;
          const isLoaded = loadedImages.has(option.id);

          let borderClass = 'border-2 border-transparent ';
          if (answered) {
            if (isCorrect) borderClass = 'border-4 border-emerald-400 ';
            else if (isSelected && !isCorrect) borderClass = 'border-4 border-rose-400 ';
            else borderClass = 'opacity-50 border-2 border-transparent ';
          }

          return (
            <button
              key={option.id}
              onClick={() => handleAnswer(option)}
              disabled={!!answered}
              className={`relative aspect-square rounded-2xl overflow-hidden bg-slate-100
                         transition-all ${borderClass} ${
                           !answered ? 'hover:shadow-lg active:scale-95' : ''
                         } ${answered && isCorrect ? 'animate-bounce-in' : ''}
                         ${answered && isSelected && !isCorrect ? 'animate-shake' : ''}`}
            >
              {!isLoaded && (
                <div className="absolute inset-0 skeleton-pulse bg-slate-200" />
              )}
              <img
                src={getImageUrl(option)}
                alt=""
                className={`w-full h-full object-cover transition-opacity ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
                onLoad={() => setLoadedImages(prev => new Set(prev).add(option.id))}
                width={256}
                height={256}
              />
            </button>
          );
        })}
      </div>

      {/* Quit confirmation */}
      {showQuitConfirm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="glass rounded-2xl p-6 max-w-sm w-full space-y-4 text-center animate-scale-in">
            <h3 className="text-lg font-bold text-slate-800">End quiz?</h3>
            <p className="text-slate-500 text-sm">Your progress will be saved.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowQuitConfirm(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600
                           font-semibold hover:bg-slate-50 transition-colors"
              >
                Continue
              </button>
              <button
                onClick={handleQuit}
                className="flex-1 py-2.5 rounded-xl bg-rose-500 text-white
                           font-semibold hover:bg-rose-600 transition-colors"
              >
                End Quiz
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
