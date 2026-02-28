import { ArrowLeft, Flame, BookOpen, Trophy, Target, TrendingUp } from 'lucide-react';
import { WORDS } from '../data/words';

export default function ProgressDashboard({ stats, onBack, onAssessment }) {
  const wordsLearned = Object.keys(stats.wordProgress || {}).length;
  const wordsMastered = Object.values(stats.wordProgress || {}).filter(w => w.interval >= 14).length;
  const totalWords = WORDS.length;
  const accuracy = stats.quizHistory?.length > 0
    ? Math.round(stats.quizHistory.reduce((acc, q) => acc + (q.score / q.total), 0) / stats.quizHistory.length * 100)
    : 0;

  // Recent quiz history (last 10)
  const recentHistory = (stats.quizHistory || []).slice(-10).reverse();

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-2.5 rounded-xl hover:bg-slate-100 transition-colors" aria-label="Back to menu">
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </button>
        <h2 className="text-xl font-bold text-slate-800">Progress</h2>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="glass rounded-2xl p-4 text-center space-y-1">
          <Flame className="w-6 h-6 text-amber-500 mx-auto" />
          <p className="text-3xl font-black text-amber-600">{stats.currentStreak}</p>
          <p className="text-xs text-slate-500">Day Streak</p>
          <p className="text-xs text-slate-500">Best: {stats.longestStreak}</p>
        </div>
        <div className="glass rounded-2xl p-4 text-center space-y-1">
          <BookOpen className="w-6 h-6 text-blue-500 mx-auto" />
          <p className="text-3xl font-black text-blue-600">{wordsLearned}</p>
          <p className="text-xs text-slate-500">Words Seen</p>
          <p className="text-xs text-slate-500">of {totalWords}</p>
        </div>
        <div className="glass rounded-2xl p-4 text-center space-y-1">
          <Trophy className="w-6 h-6 text-emerald-500 mx-auto" />
          <p className="text-3xl font-black text-emerald-600">{wordsMastered}</p>
          <p className="text-xs text-slate-500">Mastered</p>
        </div>
        <div className="glass rounded-2xl p-4 text-center space-y-1">
          <Target className="w-6 h-6 text-purple-500 mx-auto" />
          <p className="text-3xl font-black text-purple-600">{accuracy}%</p>
          <p className="text-xs text-slate-500">Accuracy</p>
        </div>
      </div>

      {/* Mastery progress bar */}
      <div className="glass rounded-2xl p-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="font-semibold text-slate-700">Vocabulary Mastery</span>
          <span className="text-slate-500">{wordsLearned}/{totalWords}</span>
        </div>
        <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden" role="progressbar" aria-valuenow={wordsLearned} aria-valuemin={0} aria-valuemax={totalWords} aria-label="Vocabulary mastery">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full transition-all"
            style={{ width: `${(wordsLearned / totalWords) * 100}%` }}
          />
        </div>
      </div>

      {/* Assessment */}
      {stats.assessmentLevel && (
        <div className="glass rounded-2xl p-4">
          <p className="text-sm text-slate-500">
            Assessment level: <span className="font-semibold text-slate-700 capitalize">{stats.assessmentLevel}</span>
          </p>
        </div>
      )}

      <button
        onClick={onAssessment}
        className="w-full py-3 glass rounded-xl font-semibold text-blue-600 text-sm
                   hover:shadow-md active:scale-95 transition-all flex items-center justify-center gap-2"
      >
        <TrendingUp className="w-4 h-4" />
        {stats.assessmentLevel ? 'Retake Assessment' : 'Take Assessment'}
      </button>

      {/* Recent quizzes */}
      {recentHistory.length > 0 && (
        <div className="glass rounded-2xl p-4 space-y-3">
          <h3 className="text-sm font-semibold text-slate-600">Recent Quizzes</h3>
          <div className="space-y-2">
            {recentHistory.map((quiz, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                <div>
                  <span className="text-sm font-semibold text-slate-700 capitalize">{quiz.mode}</span>
                  <span className="text-xs text-slate-500 ml-2 capitalize">{quiz.level}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-bold ${quiz.score >= 7 ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {quiz.score}/{quiz.total}
                  </span>
                  <span className="text-xs text-slate-500">
                    {new Date(quiz.date).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
