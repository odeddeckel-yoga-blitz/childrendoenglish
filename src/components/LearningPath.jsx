import { ArrowLeft, Check, BookOpen, Play, Lock } from 'lucide-react';
import { LESSONS, getLessonStatus } from '../data/lessons';
import { getWordById } from '../data/words';
import { t } from '../utils/i18n';

export default function LearningPath({ stats, lang = 'en', onBack, onStartLesson, onLearnLesson }) {
  const wp = stats.wordProgress || {};

  return (
    <div className="animate-fade-in space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-2.5 rounded-xl hover:bg-slate-100 transition-colors" aria-label={t('backToMenu', lang)}>
          <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-300" />
        </button>
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">{t('learningPath', lang)}</h2>
          <p className="text-sm text-slate-500">{t('learningPathDesc', lang)}</p>
        </div>
      </div>

      {/* Lesson cards */}
      <div className="space-y-3">
        {LESSONS.map((lesson, i) => {
          const status = getLessonStatus(lesson, wp, i, LESSONS);
          const isLocked = status === 'locked';
          const mastered = lesson.wordIds.filter(id => wp[id]?.interval >= 14).length;
          const total = lesson.wordIds.length;
          const pct = total > 0 ? (mastered / total) * 100 : 0;
          const title = lang === 'he' ? lesson.titleHe : lesson.title;

          return (
            <div
              key={lesson.id}
              className={`glass rounded-2xl p-4 space-y-3 ${isLocked ? 'opacity-50' : ''}`}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{lesson.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-slate-800 dark:text-slate-100 truncate">{title}</p>
                    {status === 'completed' && (
                      <span className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
                        <Check className="w-3 h-3 text-white" />
                      </span>
                    )}
                    {isLocked && (
                      <Lock className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-slate-500">{t(lesson.level, lang)}</p>
                </div>
                <span className="text-xs text-slate-500">
                  {t('lessonProgress', lang, { done: mastered, total })}
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    status === 'completed' ? 'bg-emerald-500' : 'bg-blue-500'
                  }`}
                  style={{ width: `${pct}%` }}
                />
              </div>

              {/* Action buttons */}
              {!isLocked && (
                <div className="flex gap-2">
                  <button
                    onClick={() => onLearnLesson(lesson.wordIds.map(id => getWordById(id)).filter(Boolean))}
                    className="flex-1 py-2 rounded-xl border border-slate-200 text-slate-600 dark:text-slate-300 text-sm font-medium
                               hover:bg-slate-50 active:scale-95 transition-all flex items-center justify-center gap-1.5"
                  >
                    <BookOpen className="w-4 h-4" /> {t('learnWords', lang)}
                  </button>
                  <button
                    onClick={() => onStartLesson(lesson.wordIds.map(id => getWordById(id)).filter(Boolean))}
                    className="flex-1 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold
                               hover:bg-blue-700 active:scale-95 transition-all flex items-center justify-center gap-1.5"
                  >
                    <Play className="w-4 h-4" /> {t('playQuiz', lang)}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
