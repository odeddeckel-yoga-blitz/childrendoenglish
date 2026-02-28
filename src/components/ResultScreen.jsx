import { useMemo } from 'react';
import { Play, ArrowLeft, Share2, RotateCcw, Check, X as XIcon } from 'lucide-react';
import { BADGES } from '../data/badges';
import { getWordById } from '../data/words';
import { getImageUrl } from '../utils/images';
import { playSound } from '../utils/sound';

export default function ResultScreen({ results, stats, level, mode, onPlayAgain, onChangeMode, onMenu }) {
  const { score, total, answers = [] } = results;
  const isPerfect = score === total && total > 0;
  const percentage = total > 0 ? Math.round((score / total) * 100) : 0;

  // Find newly earned badges
  const newBadges = useMemo(() => {
    return BADGES.filter(b => stats.badges.includes(b.id)).slice(-3);
  }, [stats.badges]);

  // Confetti for perfect score
  const confettiPieces = useMemo(() => {
    if (!isPerfect) return null;
    const colors = ['#2563eb', '#f59e0b', '#f43f5e', '#8b5cf6', '#10b981'];
    return Array.from({ length: 30 }, (_, i) => ({
      left: `${Math.random() * 100}%`,
      backgroundColor: colors[i % colors.length],
      animationDelay: `${Math.random() * 2}s`,
      animationDuration: `${2 + Math.random() * 3}s`,
      width: `${6 + Math.random() * 6}px`,
      height: `${6 + Math.random() * 6}px`,
    }));
  }, [isPerfect]);

  const handleShare = async () => {
    const text = `I scored ${score}/${total} on Children Do English! ${isPerfect ? '🎉 Perfect score!' : ''}\nhttps://childrendoenglish.com`;
    try {
      if (navigator.share) {
        await navigator.share({ text });
      } else {
        await navigator.clipboard.writeText(text);
      }
    } catch {}
  };

  const emoji = percentage >= 90 ? '🎉' : percentage >= 70 ? '👏' : percentage >= 50 ? '💪' : '📚';
  const message = percentage >= 90 ? 'Amazing!' : percentage >= 70 ? 'Great job!' : percentage >= 50 ? 'Good effort!' : 'Keep practicing!';

  return (
    <div className="animate-fade-in space-y-6">
      {/* Confetti */}
      {confettiPieces && (
        <div className="confetti-container">
          {confettiPieces.map((piece, i) => (
            <div key={i} className="confetti-piece" style={piece} />
          ))}
        </div>
      )}

      {/* Score card */}
      <div className="glass rounded-3xl p-8 text-center space-y-4">
        <div className="text-6xl">{emoji}</div>
        <h2 className="text-2xl font-black text-slate-800">{message}</h2>
        <div className="flex items-baseline justify-center gap-1">
          <span className="text-5xl font-black text-blue-600">{score}</span>
          <span className="text-2xl text-slate-400 font-bold">/ {total}</span>
        </div>
        <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden max-w-xs mx-auto">
          <div
            className={`h-full rounded-full transition-all duration-1000 ${
              percentage >= 70 ? 'bg-emerald-500' : percentage >= 50 ? 'bg-amber-500' : 'bg-rose-500'
            }`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      {/* New badges */}
      {newBadges.length > 0 && (
        <div className="glass rounded-2xl p-4 space-y-3">
          <h3 className="text-sm font-semibold text-slate-600">Badges Earned</h3>
          <div className="flex gap-3 justify-center">
            {newBadges.map((badge, i) => (
              <div
                key={badge.id}
                className="text-center animate-badge-pop"
                style={{ animationDelay: `${i * 200}ms` }}
              >
                <div className="text-3xl">{badge.icon}</div>
                <p className="text-xs font-semibold text-slate-600 mt-1">{badge.name}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Answer review */}
      {answers.length > 0 && (
        <div className="glass rounded-2xl p-4 space-y-3">
          <h3 className="text-sm font-semibold text-slate-600">Review</h3>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {answers.map((answer, i) => {
              const word = getWordById(answer.wordId);
              if (!word) return null;
              return (
                <div
                  key={i}
                  className={`flex items-center gap-3 p-2 rounded-xl ${
                    answer.correct ? 'bg-emerald-50' : 'bg-rose-50'
                  }`}
                >
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                    answer.correct ? 'bg-emerald-500' : 'bg-rose-500'
                  }`}>
                    {answer.correct
                      ? <Check className="w-3.5 h-3.5 text-white" />
                      : <XIcon className="w-3.5 h-3.5 text-white" />
                    }
                  </div>
                  <span className="font-semibold text-sm text-slate-700">{word.word}</span>
                  {!answer.correct && answer.selected && (
                    <span className="text-xs text-slate-400 ml-auto">
                      You picked: {getWordById(answer.selected)?.word}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="space-y-3">
        <button
          onClick={onPlayAgain}
          className="w-full py-3 px-6 bg-blue-600 text-white rounded-xl font-semibold
                     hover:bg-blue-700 active:scale-95 transition-all flex items-center justify-center gap-2"
        >
          <Play className="w-5 h-5" /> Play Again
        </button>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={handleShare}
            className="py-2.5 px-4 glass rounded-xl font-semibold text-slate-600 text-sm
                       hover:shadow-md active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <Share2 className="w-4 h-4" /> Share
          </button>
          <button
            onClick={onChangeMode}
            className="py-2.5 px-4 glass rounded-xl font-semibold text-slate-600 text-sm
                       hover:shadow-md active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-4 h-4" /> Change Mode
          </button>
        </div>

        <button
          onClick={onMenu}
          className="w-full py-2.5 rounded-xl border border-slate-200 text-slate-500 text-sm
                     font-semibold hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Menu
        </button>
      </div>
    </div>
  );
}
