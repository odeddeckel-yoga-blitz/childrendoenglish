import { useState, useEffect, useCallback, useRef } from 'react';
import { X, Volume2, VolumeX, Flame } from 'lucide-react';
import { getDistractors } from '../data/words';
import { fisherYatesShuffle } from '../utils/shuffle';
import { getImageUrl } from '../utils/images';
import { playSound, speakWord } from '../utils/sound';
import { haptic } from '../utils/haptic';

export default function ImageQuiz({ words, soundEnabled, onToggleSound, onComplete, onQuit }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [answered, setAnswered] = useState(null); // null | 'correct' | 'wrong'
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [options, setOptions] = useState([]);
  const [showQuitConfirm, setShowQuitConfirm] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const feedbackTimeout = useRef(null);

  const currentWord = words[currentIndex];
  const total = words.length;

  // Generate options for current question
  useEffect(() => {
    if (!currentWord) return;
    const distractors = getDistractors(currentWord, 3);
    setOptions(fisherYatesShuffle([currentWord, ...distractors]));
    setAnswered(null);
    setSelectedAnswer(null);
    setImgLoaded(false);
  }, [currentIndex, currentWord]);

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
      speakWord(currentWord.word);
    } else {
      setStreak(0);
      playSound('wrong');
      haptic('error');
      // Speak the correct word after a beat
      setTimeout(() => speakWord(currentWord.word), 600);
    }

    // Auto-advance
    feedbackTimeout.current = setTimeout(() => {
      if (currentIndex + 1 >= total) {
        onComplete({
          score: score + (correct ? 1 : 0),
          total,
          mode: 'image',
          answers: [...answers, { wordId: currentWord.id, correct, selected: option.id }],
        });
      } else {
        setCurrentIndex(i => i + 1);
      }
    }, 1200);
  }, [answered, currentWord, currentIndex, total, score, answers, onComplete]);

  // Cleanup timeout on unmount
  useEffect(() => () => clearTimeout(feedbackTimeout.current), []);

  const handleQuit = () => {
    clearTimeout(feedbackTimeout.current);
    onComplete({ score, total: currentIndex, mode: 'image', answers });
  };

  if (!currentWord) return null;

  return (
    <div className="animate-fade-in space-y-4">
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
          <span className="text-sm font-semibold text-slate-600">
            {score}/{total}
          </span>
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
          className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-300"
          style={{ width: `${((currentIndex) / total) * 100}%` }}
        />
      </div>

      {/* Question number */}
      <p className="text-center text-sm text-slate-500">
        Question {currentIndex + 1} of {total}
      </p>

      {/* Image */}
      <div className="relative aspect-square max-w-xs mx-auto rounded-2xl overflow-hidden bg-slate-100">
        {!imgLoaded && (
          <div className="absolute inset-0 skeleton-pulse bg-slate-200 rounded-2xl" />
        )}
        <img
          src={getImageUrl(currentWord)}
          alt="What is this?"
          className={`w-full h-full object-cover transition-opacity duration-300 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
          onLoad={() => setImgLoaded(true)}
          width={512}
          height={512}
        />
        {answered === 'correct' && (
          <div className="absolute inset-0 rounded-2xl correct-glow border-4 border-emerald-400" />
        )}
      </div>

      {/* Options (4 word buttons) */}
      <div className="grid grid-cols-2 gap-3">
        {options.map((option) => {
          const isSelected = selectedAnswer === option.id;
          const isCorrect = option.id === currentWord.id;
          let btnClass = 'glass rounded-xl py-3 px-4 font-semibold text-center transition-all ';

          if (answered) {
            if (isCorrect) {
              btnClass += 'bg-emerald-100 border-emerald-400 text-emerald-700 animate-bounce-in';
            } else if (isSelected && !isCorrect) {
              btnClass += 'bg-rose-100 border-rose-400 text-rose-700 animate-shake';
            } else {
              btnClass += 'opacity-50';
            }
          } else {
            btnClass += 'hover:shadow-md active:scale-95 text-slate-700';
          }

          return (
            <button
              key={option.id}
              onClick={() => handleAnswer(option)}
              disabled={!!answered}
              className={btnClass}
            >
              {option.word}
            </button>
          );
        })}
      </div>

      {/* Quit confirmation modal */}
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
