import { X, Volume2, VolumeX, Flame } from 'lucide-react';

export default function QuizHeader({ score, total, streak, soundEnabled, onToggleSound, onQuit, gradientColor = 'from-blue-500 to-blue-600', currentIndex }) {
  return (
    <>
      <div className="flex items-center justify-between">
        <button
          onClick={onQuit}
          className="p-2.5 rounded-xl hover:bg-slate-100 transition-colors"
          aria-label="Quit quiz"
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
          <button
            onClick={onToggleSound}
            className="p-2.5 rounded-lg hover:bg-slate-100 transition-colors"
            aria-label={soundEnabled ? 'Mute sound' : 'Enable sound'}
          >
            {soundEnabled
              ? <Volume2 className="w-4 h-4 text-slate-500" />
              : <VolumeX className="w-4 h-4 text-slate-400" />
            }
          </button>
        </div>
      </div>

      <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
        <div
          className={`h-full bg-gradient-to-r ${gradientColor} rounded-full transition-all duration-300`}
          style={{ width: `${((currentIndex) / total) * 100}%` }}
        />
      </div>

      <p className="text-center text-sm text-slate-500">
        Question {currentIndex + 1} of {total}
      </p>
    </>
  );
}
